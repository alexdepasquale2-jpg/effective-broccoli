export type Faction = 'eu' | 'ru';

export type ActionType = 'shape' | 'grid' | 'net' | 'hold' | 'posture' | 'talk';

export type Control = 'eu' | 'ru' | 'contested';

export interface Point {
    x: number;
    y: number;
}

export interface RegionDef {
    id: string;
    name: string;
    short: string;
    points: Point[];
    energyDemand: number;
    value: number;
}

export interface RegionState {
    id: string;
    lean: number;
    shield: number;
}

export interface Outcome {
    kind: 'political' | 'hot' | 'timed';
    winner: Faction | 'none';
    title: string;
    blurb: string;
}

export interface GameState {
    turn: number;
    maxTurns: number;
    player: Faction;
    current: Faction;
    ap: number;
    maxAp: number;
    energyEu: number;
    energyRu: number;
    heat: number;
    regions: Record<string, RegionState>;
    log: string[];
    lastKinetic: Faction | null;
    apPenalty: Record<Faction, number>;
    over?: Outcome;
}

export interface Order {
    type: ActionType;
    regionId: string;
}
