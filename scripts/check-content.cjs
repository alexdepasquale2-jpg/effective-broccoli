const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function grab(src, re) {
  return [...src.matchAll(re)].map((m) => m[1]);
}

const root = path.join(__dirname, '..', 'content');
const encyclopedia = fs.readFileSync(path.join(root, 'encyclopedia.ts'), 'utf8');
const survival = fs.readFileSync(path.join(root, 'survival.ts'), 'utf8');
const drills = fs.readFileSync(path.join(root, 'drills.ts'), 'utf8');

const entryIds = new Set(grab(encyclopedia, /\n\s+id: '([a-z0-9-]+)',\n\s+volume:/g));
const drillIds = new Set(grab(drills, /\n\s+id: '([a-z0-9-]+)',\n\s+title:/g));
const sceneIds = new Set(grab(survival, /\n\s+id: '([a-z0-9-]+)',\n\s+title:/g));

if (!entryIds.size) fail('no encyclopedia ids');
if (!drillIds.size) fail('no drill ids');
if (!sceneIds.size) fail('no survival ids');

for (const id of grab(encyclopedia, /drillId: '([a-z0-9-]+)'/g)) {
  if (!drillIds.has(id)) fail(`encyclopedia drill missing: ${id}`);
}
for (const id of grab(encyclopedia, /survivalId: '([a-z0-9-]+)'/g)) {
  if (!sceneIds.has(id)) fail(`encyclopedia survival missing: ${id}`);
}
for (const id of grab(encyclopedia, /related: \[([^\]]+)\]/g).flatMap((block) =>
  grab(block, /'([a-z0-9-]+)'/g),
)) {
  if (!entryIds.has(id)) fail(`encyclopedia related missing: ${id}`);
}
for (const id of grab(survival, /drillId: '([a-z0-9-]+)'/g)) {
  if (!drillIds.has(id)) fail(`survival drill missing: ${id}`);
}
for (const id of grab(survival, /relatedEntries: \[([^\]]+)\]/g).flatMap((block) =>
  grab(block, /'([a-z0-9-]+)'/g),
)) {
  if (!entryIds.has(id)) fail(`survival related missing: ${id}`);
}

const scenes = survival.split(/\n  \{\n    id: '/).slice(1);
for (const chunk of scenes) {
  const id = chunk.split("'")[0];
  const nexts = grab(chunk, /next: '([a-z0-9-]+)'/g);
  const nodes = new Set(grab(chunk, /id: '([a-z0-9-]+)'/g));
  nodes.add(id);
  if (![...nodes].includes('start') || ![...nodes].includes('win')) fail(`${id} missing start/win`);
  for (const n of nexts) {
    if (!nodes.has(n)) fail(`${id} path jumps to missing node ${n}`);
  }
}

console.log(`ok  ${entryIds.size} entries  ${sceneIds.size} protocols  ${drillIds.size} drills`);
