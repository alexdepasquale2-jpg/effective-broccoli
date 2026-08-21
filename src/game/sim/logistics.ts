import { REGIONS, REGION_BY_ID, centroid } from './map';
import type { Edge, Faction, GameState } from './types';
import { controlOf } from './control';

const PIPE_LINKS = new Set([
    'baltics|russia',
    'blacksea|russia',
    'blacksea|ukraine',
    'central|germany',
    'germany|west',
    'italy|west',
    'ukraine|central',
    'baltics|germany',
    'ukraine|russia',
]);

export const EDGES: Edge[] = uniqueEdges();

export function edgeKey(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function isCut(state: GameState, a: string, b: string): boolean {
    return (state.cuts[edgeKey(a, b)] || 0) > 0;
}

export function cutRegion(state: GameState, regionId: string, seasons: number): void {
    const def = REGION_BY_ID[regionId];
    if (!def) {
        return;
    }
    for (const neighbor of def.neighbors) {
        const key = edgeKey(regionId, neighbor);
        state.cuts[key] = Math.max(state.cuts[key] || 0, seasons);
    }
}

export function clearCuts(state: GameState, regionId: string): void {
    const def = REGION_BY_ID[regionId];
    if (!def) {
        return;
    }
    for (const neighbor of def.neighbors) {
        delete state.cuts[edgeKey(regionId, neighbor)];
    }
}

export function isSupplied(state: GameState, regionId: string, faction: Faction): boolean {
    const hubs = faction === 'eu' ? ['west', 'britain', 'germany'] : ['russia', 'belarus', 'blacksea'];
    const live = hubs.filter((id) => controlOf(state.regions[id].lean) !== (faction === 'eu' ? 'ru' : 'eu'));
    if (live.includes(regionId)) {
        return true;
    }
    const seen = new Set<string>(live);
    const queue = [...live];
    while (queue.length > 0) {
        const cur = queue.shift() as string;
        for (const next of REGION_BY_ID[cur].neighbors) {
            if (seen.has(next) || isCut(state, cur, next)) {
                continue;
            }
            if (controlOf(state.regions[next].lean) === (faction === 'eu' ? 'ru' : 'eu')) {
                continue;
            }
            if (next === regionId) {
                return true;
            }
            seen.add(next);
            queue.push(next);
        }
    }
    return false;
}

export function pipelineFlow(state: GameState, faction: Faction): number {
    let flow = 0;
    for (const region of REGIONS) {
        if (!region.pipeHub) {
            continue;
        }
        const local = state.regions[region.id];
        if (controlOf(local.lean) !== faction) {
            continue;
        }
        flow += local.pipeline * 0.2;
    }
    return clamp(flow, 0, 100);
}

export function edgeColor(state: GameState, edge: Edge): number {
    if (isCut(state, edge.a, edge.b)) {
        return 0x6a2430;
    }
    if (edge.pipe) {
        return 0x2ec4b6;
    }
    const eu = isSupplied(state, edge.a, 'eu') || isSupplied(state, edge.b, 'eu');
    const ru = isSupplied(state, edge.a, 'ru') || isSupplied(state, edge.b, 'ru');
    if (eu && !ru) {
        return 0xd4a017;
    }
    if (ru && !eu) {
        return 0xc45c5c;
    }
    return 0x4a5d78;
}

export function edgePoints(edge: Edge): { x: number; y: number }[] {
    const a = centroid(REGION_BY_ID[edge.a].points);
    const b = centroid(REGION_BY_ID[edge.b].points);
    return [a, b];
}

function uniqueEdges(): Edge[] {
    const seen = new Set<string>();
    const edges: Edge[] = [];
    for (const region of REGIONS) {
        for (const neighbor of region.neighbors) {
            const key = edgeKey(region.id, neighbor);
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            edges.push({ a: region.id, b: neighbor, pipe: PIPE_LINKS.has(key) });
        }
    }
    return edges;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
