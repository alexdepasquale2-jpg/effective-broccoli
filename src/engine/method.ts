export const METHOD_SECTIONS = [
  {
    id: "thesis",
    title: "The thesis",
    body: `Writer's block in games is rarely a lack of ideas. It is usually an unbounded possibility space, or a story that has not yet been forced to survive contact with a verb.

A novel can wait for a beautiful sentence. A game cannot. If the player cannot *do* something under pressure, you do not yet have a scene. You have a synopsis.

Next Beat is a desk, not a muse. It diagnoses the stall, locks one constraint, and walks you to one playable beat — thirty seconds to five minutes of play — in about twelve minutes of writing.`,
  },
  {
    id: "principles",
    title: "Four principles",
    body: `**1. Play before plot.** A beat is “what the player does under pressure,” not “what happens.” If you cannot name a verb, stop plotting.

**2. Constraint is fuel.** Infinite option space is the block. Lock a room, a debt, a liar, a timer, a forbidden verb. Then write badly.

**3. Ugly, then extract.** Produce eight bad lines. Extract one system, one choice, one exit problem. Do not polish in the same sitting.

**4. One beat is a complete session.** You do not owe the campaign, the lore bible, or the ending. You owe the next playable unit.`,
  },
  {
    id: "anti",
    title: "Anti-moves (do these later, not now)",
    body: `When blocked, do not add a continent, rename the protagonist, open a new engine, wait for the ending, write a glossary, design a skill tree to avoid the scene, invent a magic system, start with the creation myth, polish the first sentence, or ask the internet if the idea is original.

Those are real jobs. They are also the most popular disguises of fear.`,
  },
  {
    id: "diagnose",
    title: "Diagnose before you prompt",
    body: `Different stalls need different desks.

- **Blank table** — no pressure and verb in the same room → First Pressure
- **Lore fog** — bible ate the scene → Iceberg Cut
- **Story and play don't touch** → Verb Tax
- **Dead mouths** — exposition with quotation marks → Mouth with an Obstacle
- **Sagging middle** — opening and a maybe-ending → Reversal Beat
- **Quest mill** — fetch lists → Three-Beat Spine
- **NPC as vending machine** → Want / Need / Ask
- **Ending hostage** — cannot start without the finale → Write Backward One Door
- **Tutorial wall** → First Verb is the Story
- **Too many cool ideas** → Kill the Menu

If you have four minutes, skip diagnosis and deal a Forced Hand.`,
  },
  {
    id: "hand",
    title: "The Forced Hand",
    body: `A Forced Hand is a dealt scene: location, pressure, verb, complication, NPC, sensory fact. You may reroll once. You may rename nouns. You may not add a second location.

It is an Oulipo / Oblique Strategies move aimed at game production: the hand is not the story. It is the smallest room in which a story is forced to occur.`,
  },
  {
    id: "card",
    title: "The beat card",
    body: `When you finish a protocol, you should be able to paste a markdown card into a GDD, a Notion page, or a comment on a greybox.

A useful card contains: the block you had, the protocol you ran, the Forced Hand, your ugly draft, one system to make the beat true on replay, and the problem the player now owns.

If the card cannot be prototyped this week, it is still lore. Cut again.`,
  },
  {
    id: "lineage",
    title: "Lineage (steal from the dead, not from a chatbot)",
    body: `This desk is a mash of practices that already work in rooms where games get made:

- **MDA** (Hunicke, LeBlanc, Zubek) — aesthetics are what play feels like; start there, not from plot synopsis.
- **Schell's lenses** — especially the lens of the toy, the lens of problem-solving, and the lens of the storyteller.
- **BioWare / Obsidian scene craft** — want, tactic, obstacle, interruption, consequence flag.
- **Emily Short** on implication, agency, and not explaining the world at the player.
- **Oulipo and Oblique Strategies** — constraint as a production tool.
- **Peter Elbow's ugly draft** — timed freewriting without a quality gate.
- **Iceberg** (Hemingway, abused by every lore doc) — player-facing shard, private truth, cost of knowing.

Next Beat does not generate your game. It refuses to let you leave without a scene.`,
  },
] as const;
