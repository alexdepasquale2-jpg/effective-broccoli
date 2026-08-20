# The data pipeline

`packages/dataforge` turns public-domain sources into validated game content. It is a build step, not
a one-off migration: nothing is hand-copied, and the output is regenerated rather than edited.

```bash
./scripts/fetch-cc0-sources.sh   # optional: clone the CC0 GSJS repo into vendor/
npm run dataforge                # -> packages/content/generated/
```

## It works without the sources

If `vendor/glitch-gsjs` is absent, dataforge emits just the authored bootstrap content and says so.
The game still runs. This is deliberate: a fresh clone is playable after `npm install` with no
downloads, and the importer is an upgrade rather than a prerequisite.

| Input               | Output                                  |
| ------------------- | --------------------------------------- |
| authored only       | 3 items, 2 skills, 1 location           |
| authored + CC0 GSJS | **1,270 items, 105 skills**, 1 location |

## Reading GSJS without running it

A Glitch item file mixes declarative data with imperative behaviour:

```js
var name_single = 'Apple';
var stackmax = 100;
var parent_classes = ['apple', 'food', 'takeable'];

verbs.pickup = {
  name: 'pick up',
  handler: function (pc, msg) {
    return this.takeable_pickup(pc, msg);
  },
};
```

We want the first part and must not execute the second — this is 2012 code written for Rhino, and
running it is neither safe nor possible here.

So dataforge parses with **acorn** and walks the AST, extracting a value only when the node is
provably literal. A function, a call, an identifier reference — anything that would need evaluating
yields nothing and the field is skipped. Within an object it skips only the offending members, so
`verbs.pickup` still contributes `name` and `sort_on` while its handlers are ignored.

That is what makes the importer **total**: it never throws on a file it does not fully understand, it
simply extracts less from it.

## What the numbers mean

Of 1,288 item files, 1,270 import and **two fail to parse**. Both are genuinely malformed in Tiny
Speck's shipped source, not parser bugs:

- `items/paper_tree.js:431` assigns to the result of a call
  (`this.getInstanceProp('paper_count') = ...`), which is not valid JavaScript.
- `items/test_chassis.js:23` has an anonymous `function (){` in statement position.

The remainder are dropped for having no display name. Failures warn and continue.

Of 106 `skills_get_*` functions, **105 are skills**. The odd one out is `quest_map`, which shares the
naming convention but returns a skill-id → quest-id lookup table rather than a skill. It is correctly
rejected for having no `name`. All three of these cases are pinned by tests in `gsjs.test.ts`, so a
future parser change cannot silently start accepting or dropping them.

## Authored content is a fallback, not a fork

`packages/content/authored/` is keyed by **real Glitch identifiers** — `apple`, `plank`,
`light_green_thumb_1`, `woodworking_1`. When the import runs, those definitions land on the same ids
and upgrade the authored stubs in place.

The alternative — inventing our own ids — would have created a parallel catalogue needing
reconciliation forever. This way the bootstrap set is simply the low-detail version of the real one.

## Build-time validation

The build fails, rather than shipping broken content, when:

- an entity yields an item or trains a skill that does not exist
- a yield's `min` exceeds its `max`
- **a location contains geometry no player can reach**

That last check earned its place. The first draft of the bootstrap street had ledges 140px and 200px
above the ground — and a standing jump clears **112.5px**. Two of four platforms, and the trants on
them, were unreachable. In a location file that is invisible: `"y": 560` reads exactly like
`"y": 610`.

`reachability.ts` flood-fills from the spawn platform, stepping between platforms whose x-ranges
overlap and whose rise is within one jump, and reports any usable entity left outside the reachable
set. The jump height is _measured by simulating the real `stepBody`_, not derived from `v²/2g` —
the analytic answer is ~131px, but fixed-timestep integration only ever clears 112.5px, and the
gap between those two numbers is exactly wide enough to hide the bug.

## Not yet imported

Quests (448), achievements (665), locations (49), and the ~10,000 CC0 art assets. Each is a
milestone of its own; see [`20-roadmap.md`](20-roadmap.md).
