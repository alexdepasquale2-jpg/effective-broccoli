export type Faction = 'eu' | 'ru';

export type ActionType = 'shape' | 'grid' | 'net' | 'hold' | 'troops' | 'drone' | 'missile' | 'talk';

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
    neighbors: string[];
    energyDemand: number;
    value: number;
    pipeHub: boolean;
    supplyHub: boolean;
}

export interface RegionState {
    id: string;
    lean: number;
    shield: number;
    troopsEu: number;
    troopsRu: number;
    dronesEu: number;
    dronesRu: number;
    batteries: number;
    depot: number;
    pipeline: number;
}

export interface Stocks {
    troops: number;
    drones: number;
    missiles: number;
    supplies: number;
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
    stocks: Record<Faction, Stocks>;
    cuts: Record<string, number>;
    log: string[];
    lastKinetic: Faction | null;
    apPenalty: Record<Faction, number>;
    over?: Outcome;
}

export interface Order {
    type: ActionType;
    regionId: string;
}

export interface Edge {
    a: string;
    b: string;
    pipe: boolean;
}
