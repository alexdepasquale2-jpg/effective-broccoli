export type VolumeId =
  | 'primer'
  | 'doctrine'
  | 'enemy'
  | 'protocol'
  | 'field'
  | 'failure';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'callout'; kind: 'act' | 'warn' | 'note'; title: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: { n: string; title: string; text: string }[] }
  | { type: 'quote'; text: string; attr?: string };

export type Volume = {
  id: VolumeId;
  fm: string;
  title: string;
  subtitle: string;
  blurb: string;
};

export type Entry = {
  id: string;
  volume: VolumeId;
  fm: string;
  title: string;
  dek: string;
  minutes: number;
  tags: string[];
  action: { title: string; seconds: number; body: string };
  related: string[];
  drillId?: string;
  survivalId?: string;
  body: Block[];
};

export type PathChoice = {
  label: string;
  next: string;
  kind: 'loop' | 'advance' | 'win' | 'fail';
};

export type PathNode = {
  id: string;
  prompt: string;
  body: string;
  choices: PathChoice[];
};

export type Scenario = {
  id: string;
  title: string;
  freeze: string;
  signal: string;
  diagnosis: string;
  loop: string;
  immediate: { seconds: number; title: string; body: string };
  protocol24: string[];
  protocol7: string[];
  relatedEntries: string[];
  drillId: string;
  path: PathNode[];
};

export type DrillBeat = { at: number; text: string };

export type Drill = {
  id: string;
  title: string;
  durationSec: number;
  intensity: 'LOW' | 'MED' | 'HIGH';
  setup: string;
  why: string;
  beats: DrillBeat[];
  completePrompt: string;
};

export type Rank = {
  id: string;
  title: string;
  minXp: number;
  line: string;
};

export type FreezeOption = {
  id: string;
  label: string;
  survivalId: string;
};
