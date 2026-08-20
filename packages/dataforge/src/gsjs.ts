import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'acorn';
import type { ItemDef, SkillDef } from '@glimmer/shared';
import { asNumber, asString, asStringArray, literalValue } from './literal.ts';

/**
 * Importers for Tiny Speck's CC0 `glitch-GameServerJS` release.
 *
 * These read the *shipped* game: 1288 item definitions and the complete skill
 * tree, including its prerequisite graph. We take the data and reimplement the
 * behaviour, rather than trying to run decade-old Rhino JavaScript.
 */

/** Acorn settings that accept 2012-era JavaScript. */
const PARSE_OPTIONS = { ecmaVersion: 5, sourceType: 'script' } as const;

function parseLoose(source: string, label: string): ReturnType<typeof parse> | null {
  try {
    return parse(source, PARSE_OPTIONS);
  } catch {
    try {
      // A few files use later syntax; retry permissively before giving up.
      return parse(source, { ecmaVersion: 2020, sourceType: 'script' });
    } catch (err) {
      process.emitWarning(`dataforge: could not parse ${label}: ${(err as Error).message}`);
      return null;
    }
  }
}

/** Collects the literal-valued top-level `var` declarations of a GSJS file. */
function topLevelVars(source: string, label: string): Record<string, unknown> {
  const ast = parseLoose(source, label);
  if (!ast) return {};

  const vars: Record<string, unknown> = {};
  for (const stmt of ast.body) {
    if (stmt.type !== 'VariableDeclaration') continue;
    for (const decl of stmt.declarations) {
      if (decl.id.type !== 'Identifier') continue;
      const value = literalValue(decl.init);
      if (value !== undefined) vars[decl.id.name] = value;
    }
  }
  return vars;
}

/**
 * Verb names an item exposes, read from `verbs.<name> = {...}` assignments.
 * The handlers themselves are functions we deliberately do not evaluate, but
 * the *set* of verbs is useful data on its own.
 */
function verbNames(source: string, label: string): string[] {
  const ast = parseLoose(source, label);
  if (!ast) return [];

  const names = new Set<string>();
  for (const stmt of ast.body) {
    if (stmt.type !== 'ExpressionStatement') continue;
    const expr = stmt.expression;
    if (expr.type !== 'AssignmentExpression') continue;
    const target = expr.left;
    if (
      target.type === 'MemberExpression' &&
      !target.computed &&
      target.object.type === 'Identifier' &&
      target.object.name === 'verbs' &&
      target.property.type === 'Identifier'
    ) {
      names.add(target.property.name);
    }
  }
  return [...names].sort();
}

export interface ImportedItem extends ItemDef {
  description: string;
  baseCost: number;
  parentClasses: string[];
  verbs: string[];
  hidden: boolean;
}

export async function importItems(gsjsRoot: string): Promise<ImportedItem[]> {
  const dir = path.join(gsjsRoot, 'items');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.js'));

  const items: ImportedItem[] = [];
  for (const file of files) {
    const id = file.replace(/\.js$/, '');
    const source = await readFile(path.join(dir, file), 'utf8');
    const vars = topLevelVars(source, `items/${file}`);

    const name = asString(vars.name_single) ?? asString(vars.label);
    // Without a display name there is nothing worth importing.
    if (!name) continue;

    items.push({
      id,
      name,
      namePlural: asString(vars.name_plural) ?? `${name}s`,
      stackMax: asNumber(vars.stackmax) ?? 1,
      description: asString(vars.description) ?? '',
      baseCost: asNumber(vars.base_cost) ?? 0,
      parentClasses: asStringArray(vars.parent_classes) ?? [],
      verbs: verbNames(source, `items/${file}`),
      hidden: vars.is_hidden === true,
      source: 'gsjs',
    });
  }

  items.sort((a, b) => a.id.localeCompare(b.id));
  return items;
}

/**
 * Skills live in one file as `function skills_get_<id>() { return {...}; }`,
 * each returning a pure object literal. The returned objects carry the real
 * tech tree: `req_skills` and `post_skills` across ~180 tiered skills.
 */
export async function importSkills(gsjsRoot: string): Promise<SkillDef[]> {
  const file = path.join(gsjsRoot, 'inc_data_skills.js');
  const source = await readFile(file, 'utf8');
  const ast = parseLoose(source, 'inc_data_skills.js');
  if (!ast) return [];

  const skills: SkillDef[] = [];
  for (const stmt of ast.body) {
    if (stmt.type !== 'FunctionDeclaration') continue;
    const fnName = stmt.id?.name ?? '';
    if (!fnName.startsWith('skills_get_')) continue;

    const ret = stmt.body.body.find((s) => s.type === 'ReturnStatement');
    if (!ret || ret.type !== 'ReturnStatement') continue;

    const value = literalValue(ret.argument) as Record<string, unknown> | undefined;
    if (!value) continue;

    const name = asString(value.name);
    if (!name) continue;

    skills.push({
      id: fnName.slice('skills_get_'.length),
      name,
      level: asNumber(value.level) ?? 1,
      description: asString(value.description) ?? '',
      pointCost: Math.max(0, Math.round(asNumber(value.point_cost) ?? 0)),
      requires: asStringArray(value.req_skills) ?? [],
      source: 'gsjs',
    });
  }

  skills.sort((a, b) => a.id.localeCompare(b.id));
  return skills;
}
