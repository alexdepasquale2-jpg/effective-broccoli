import type { Node } from 'acorn';

/**
 * Evaluates the *literal* subset of a JavaScript AST.
 *
 * GSJS files mix declarative data with imperative behaviour: an item declares
 * `var stackmax = 100` next to `verbs.pickup = { handler: function(){...} }`.
 * We want the first and must not run the second -- these files were written for
 * Rhino in 2012 and executing them is neither safe nor possible here.
 *
 * So this walks the AST and returns a value only when the node is provably a
 * literal (or an array/object built entirely from literals). Anything else --
 * a function, a call, an identifier reference -- yields `undefined`, and the
 * caller skips that field. That is what makes the importer total: it never
 * throws on a file it does not fully understand, it just extracts less from it.
 */

const UNSUPPORTED = Symbol('unsupported');

type Literal = string | number | boolean | null | Literal[] | { [k: string]: Literal };

function evaluate(node: Node | null | undefined): Literal | typeof UNSUPPORTED {
  if (!node) return UNSUPPORTED;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n = node as any;

  switch (n.type) {
    case 'Literal':
      // Regexes parse as literals but carry no plain value.
      if (n.regex) return UNSUPPORTED;
      return n.value as Literal;

    case 'TemplateLiteral':
      if (n.expressions.length > 0) return UNSUPPORTED;
      return n.quasis.map((q: { value: { cooked: string } }) => q.value.cooked).join('');

    case 'UnaryExpression': {
      const arg = evaluate(n.argument);
      if (arg === UNSUPPORTED) return UNSUPPORTED;
      if (n.operator === '-' && typeof arg === 'number') return -arg;
      if (n.operator === '+' && typeof arg === 'number') return arg;
      if (n.operator === '!') return !arg;
      return UNSUPPORTED;
    }

    case 'ArrayExpression': {
      const out: Literal[] = [];
      for (const el of n.elements) {
        // A hole (`[1,,2]`) or a spread makes the array unreliable.
        if (!el) return UNSUPPORTED;
        const v = evaluate(el);
        if (v === UNSUPPORTED) return UNSUPPORTED;
        out.push(v);
      }
      return out;
    }

    case 'ObjectExpression': {
      const out: Record<string, Literal> = {};
      for (const prop of n.properties) {
        if (prop.type !== 'Property' || prop.computed) return UNSUPPORTED;
        const key =
          prop.key.type === 'Identifier'
            ? prop.key.name
            : prop.key.type === 'Literal'
              ? String(prop.key.value)
              : null;
        if (key === null) return UNSUPPORTED;
        const v = evaluate(prop.value);
        // Skip non-literal members (handlers, conditions) rather than
        // discarding the whole object -- the surrounding data is still good.
        if (v === UNSUPPORTED) continue;
        out[key] = v;
      }
      return out;
    }

    default:
      return UNSUPPORTED;
  }
}

/** Returns the literal value of a node, or undefined if it is not literal data. */
export function literalValue(node: Node | null | undefined): unknown {
  const v = evaluate(node);
  return v === UNSUPPORTED ? undefined : v;
}

export function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  // GSJS is inconsistent: some numeric fields are quoted ("energy_factor": "1").
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === 'string');
  return out.length === v.length ? out : undefined;
}
