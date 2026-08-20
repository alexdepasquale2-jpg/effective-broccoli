import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parse } from 'acorn';
import { describe, expect, it } from 'vitest';
import { importItems, importSkills } from './gsjs.ts';
import { literalValue } from './literal.ts';

/** Evaluates the initialiser of `var x = <expr>` for terse literal tests. */
function evalVar(src: string): unknown {
  const ast = parse(`var x = ${src};`, { ecmaVersion: 2020, sourceType: 'script' });
  const decl = ast.body[0];
  if (decl?.type !== 'VariableDeclaration') throw new Error('bad fixture');
  return literalValue(decl.declarations[0]?.init);
}

describe('literalValue', () => {
  it('reads primitives', () => {
    expect(evalVar('"Apple"')).toBe('Apple');
    expect(evalVar('100')).toBe(100);
    expect(evalVar('true')).toBe(true);
    expect(evalVar('null')).toBe(null);
    expect(evalVar('-5')).toBe(-5);
  });

  it('reads arrays and nested objects', () => {
    expect(evalVar('[13, 74, 90]')).toEqual([13, 74, 90]);
    expect(evalVar('["apple", "food"]')).toEqual(['apple', 'food']);
    expect(evalVar('{ a: 1, b: { c: "two" } }')).toEqual({ a: 1, b: { c: 'two' } });
  });

  it('refuses anything that would need executing', () => {
    expect(evalVar('function(){ return 1; }')).toBeUndefined();
    expect(evalVar('someIdentifier')).toBeUndefined();
    expect(evalVar('doSomething()')).toBeUndefined();
    expect(evalVar('1 + 2')).toBeUndefined();
  });

  it('keeps the literal members of an object that also holds handlers', () => {
    // This is the shape every GSJS verb has: data next to behaviour.
    const v = evalVar(`{
      "name": "pick up",
      "sort_on": 50,
      "conditions": function(pc){ return this.ok(pc); },
      "handler": function(pc, msg){ return this.take(pc, msg); }
    }`);
    expect(v).toEqual({ name: 'pick up', sort_on: 50 });
  });

  it('rejects arrays with holes rather than inventing values', () => {
    expect(evalVar('[1, , 2]')).toBeUndefined();
  });
});

/** A fixture in the exact shape of a real GSJS item file. */
const APPLE_JS = `//#include include/food.js, include/takeable.js

var label = "Apple";
var name_single = "Apple";
var name_plural = "Apples";
var description = "A boldly red and brazenly juicy apple.";
var is_hidden = false;
var stackmax = 100;
var base_cost = 5;
var input_for = [13,74,90,100];
var parent_classes = ["apple", "food", "takeable"];

var verbs = {};

verbs.pickup = {
	"name" : "pick up",
	"conditions" : function(pc, drop_stack){ return this.takeable_pickup_conditions(pc, drop_stack); },
	"handler" : function(pc, msg){ return this.takeable_pickup(pc, msg); }
};

verbs.give = {
	"name" : "give",
	"handler" : function(pc, msg){ return this.give(pc, msg); }
};
`;

/** Genuinely malformed: assigns to the result of a call. Ships broken upstream. */
const BROKEN_JS = `var label = "Broken";
function addPaper(){
	this.getInstanceProp('paper_count') = 3;
}
`;

async function fixtureRoot(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'glimmer-gsjs-'));
  await mkdir(path.join(root, 'items'), { recursive: true });
  for (const [rel, contents] of Object.entries(files)) {
    await writeFile(path.join(root, rel), contents);
  }
  return root;
}

describe('importItems', () => {
  it('extracts the declarative fields of a real item', async () => {
    const root = await fixtureRoot({ 'items/apple.js': APPLE_JS });
    const [apple] = await importItems(root);

    expect(apple).toMatchObject({
      id: 'apple',
      name: 'Apple',
      namePlural: 'Apples',
      stackMax: 100,
      baseCost: 5,
      parentClasses: ['apple', 'food', 'takeable'],
      hidden: false,
      source: 'gsjs',
    });
  });

  it('records verb names without evaluating their handlers', async () => {
    const root = await fixtureRoot({ 'items/apple.js': APPLE_JS });
    const [apple] = await importItems(root);
    expect(apple?.verbs).toEqual(['give', 'pickup']);
  });

  it('skips a file that upstream ships with a syntax error, and keeps going', async () => {
    const root = await fixtureRoot({ 'items/apple.js': APPLE_JS, 'items/broken.js': BROKEN_JS });
    const items = await importItems(root);
    // The good item still imports; the broken one is dropped, not fatal.
    expect(items.map((i) => i.id)).toEqual(['apple']);
  });

  it('drops an item with no display name', async () => {
    const root = await fixtureRoot({ 'items/nameless.js': 'var stackmax = 5;' });
    expect(await importItems(root)).toEqual([]);
  });
});

const SKILLS_JS = `var data_skills = {};

function skills_get_alchemy_1(){
	return {
		id: 51,
		name: "Alchemy",
		level: 1,
		description: "Transformational power.",
		point_cost: 5400,
		req_skills: ["elementhandling_1"],
		post_skills: ["alchemy_2"]
	};
};
data_skills.alchemy_1 = this.skills_get_alchemy_1();

function skills_get_animalhusbandry_1(){
	return {
		id: 99,
		name: "Animal Husbandry",
		level: 0,
		point_cost: 100,
		req_skills: []
	};
};

function skills_get_quest_map(){
	return {
		"light_green_thumb_1" : "lightgreenthumb_water_trees",
		"gardening_1" : "gardening_harvest_trees"
	};
};
`;

describe('importSkills', () => {
  it('imports the tech tree including prerequisites', async () => {
    const root = await fixtureRoot({ 'inc_data_skills.js': SKILLS_JS });
    const skills = await importSkills(root);
    const alchemy = skills.find((s) => s.id === 'alchemy_1');

    expect(alchemy).toMatchObject({
      id: 'alchemy_1',
      name: 'Alchemy',
      level: 1,
      pointCost: 5400,
      requires: ['elementhandling_1'],
      source: 'gsjs',
    });
  });

  it('keeps untiered skills, which ship with level 0', async () => {
    const root = await fixtureRoot({ 'inc_data_skills.js': SKILLS_JS });
    const skills = await importSkills(root);
    expect(skills.find((s) => s.id === 'animalhusbandry_1')?.level).toBe(0);
  });

  it('rejects quest_map, which shares the naming convention but is a lookup table', async () => {
    const root = await fixtureRoot({ 'inc_data_skills.js': SKILLS_JS });
    const skills = await importSkills(root);
    expect(skills.map((s) => s.id)).not.toContain('quest_map');
    expect(skills).toHaveLength(2);
  });
});
