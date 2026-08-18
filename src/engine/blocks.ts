import type { BlockType } from "../types";

export const BLOCKS: BlockType[] = [
  {
    id: "blank",
    title: "The blank table",
    soundsLike: "I'll start when I know what the game is.",
    body: "You do not have a world problem. You have no pressure and no verb in the same room. We will lock a player fantasy, tax one action, and write eight ugly lines.",
    protocolId: "first-pressure",
  },
  {
    id: "lore",
    title: "Lore fog",
    soundsLike: "If I finish the history, the story will appear.",
    body: "Worldbuilding is not a scene. We will keep one fact the player can bump into, bury the rest under the iceberg, and make knowing the truth expensive.",
    protocolId: "iceberg-cut",
  },
  {
    id: "ludo",
    title: "Story and play don't touch",
    soundsLike: "The plot is good. The build is a different game.",
    body: "A cutscene cannot save a verb the fiction ignores. We will tax an action you already have and make a person collect that tax.",
    protocolId: "verb-tax",
  },
  {
    id: "dialogue",
    title: "Dead mouths",
    soundsLike: "Everyone explains the quest, then waits.",
    body: "Speech is a tactic under an obstacle. We will give the speaker a want they cannot say plainly, then interrupt them.",
    protocolId: "mouth-obstacle",
  },
  {
    id: "middle",
    title: "The sagging middle",
    soundsLike: "I have an opening and a maybe-ending.",
    body: "Middles die when the trained tactic still works. We will write the beat where success makes a worse problem.",
    protocolId: "reversal-beat",
  },
  {
    id: "quest",
    title: "Quest mill",
    soundsLike: "Go here, fetch that, return, plus 40 gold.",
    body: "A mission is a spine of three playable beats, not a shopping list. Objective, why now, twist, reward that is also a problem.",
    protocolId: "three-beat-spine",
  },
  {
    id: "npc",
    title: "Character as vending machine",
    soundsLike: "They have a job. They do not have a week.",
    body: "NPCs stall when they exist to dispense content. Want, lie, Ask, and a verb that cracks them — not a monologue.",
    protocolId: "want-need-ask",
  },
  {
    id: "ending",
    title: "Ending hostage",
    soundsLike: "I cannot write scene one until I know the finale.",
    body: "You do not need the ending. You need the last door that still allows more than one. We write backward one door, then put the finales in a drawer.",
    protocolId: "backward-door",
  },
  {
    id: "onboard",
    title: "Tutorial wall",
    soundsLike: "The first ten minutes are a manual.",
    body: "The first verb is already a story beat if failure is diegetic and success costs something. We will teach by pressure, not by tooltip.",
    protocolId: "first-verb-story",
  },
  {
    id: "ideas",
    title: "Too many cool ideas",
    soundsLike: "I keep starting a better version instead.",
    body: "Block disguised as abundance. Score what is playable with verbs you already have, steal from the funeral pile, and commit to one fantasy sentence.",
    protocolId: "kill-the-menu",
  },
];

export function getBlock(id: string): BlockType | undefined {
  return BLOCKS.find((block) => block.id === id);
}
