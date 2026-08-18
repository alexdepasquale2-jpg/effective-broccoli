export type BlockId =
  | "blank"
  | "lore"
  | "ludo"
  | "dialogue"
  | "middle"
  | "quest"
  | "npc"
  | "ending"
  | "onboard"
  | "ideas";

export type ProtocolId =
  | "first-pressure"
  | "iceberg-cut"
  | "verb-tax"
  | "mouth-obstacle"
  | "reversal-beat"
  | "three-beat-spine"
  | "want-need-ask"
  | "backward-door"
  | "first-verb-story"
  | "kill-the-menu"
  | "emergency";

export interface BlockType {
  id: BlockId;
  title: string;
  soundsLike: string;
  body: string;
  protocolId: ProtocolId;
}

export interface ProtocolStep {
  id: string;
  title: string;
  seconds: number;
  prompt: string;
  why: string;
  placeholder: string;
  stuckHint: string;
}

export interface Protocol {
  id: ProtocolId;
  name: string;
  forBlock: BlockId | "any";
  durationMin: number;
  promise: string;
  steps: ProtocolStep[];
}

export interface GameContext {
  title: string;
  fantasy: string;
  verbs: string[];
  alreadyTrue: string;
  stuckSentence: string;
}

export interface ForcedHand {
  location: string;
  pressure: string;
  verb: string;
  complication: string;
  npc: string;
  sensory: string;
}

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  context: GameContext;
  blockId: BlockId | null;
  protocolId: ProtocolId | null;
  answers: Record<string, string>;
  constraints: string[];
  forcedHand: ForcedHand | null;
  stepIndex: number;
}

export interface AppStore {
  sessions: Session[];
  activeId: string | null;
}
