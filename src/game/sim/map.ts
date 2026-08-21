import type { Point, RegionDef } from './types';

export const REGIONS: RegionDef[] = [
    {
        id: 'nordics', name: 'Nordics', short: 'NORDICS', energyDemand: 0.45, value: 5,
        pipeHub: false, supplyHub: false,
        neighbors: ['britain', 'baltics', 'germany'],
        points: [
            { x: 206, y: 74 }, { x: 398, y: 70 }, { x: 424, y: 132 },
            { x: 372, y: 176 }, { x: 252, y: 186 }, { x: 194, y: 146 },
        ],
    },
    {
        id: 'britain', name: 'United Kingdom', short: 'UK', energyDemand: 0.55, value: 5,
        pipeHub: false, supplyHub: true,
        neighbors: ['nordics', 'west'],
        points: [
            { x: 46, y: 146 }, { x: 142, y: 136 }, { x: 152, y: 248 },
            { x: 126, y: 272 }, { x: 56, y: 280 }, { x: 38, y: 198 },
        ],
    },
    {
        id: 'baltics', name: 'Baltics', short: 'BALTICS', energyDemand: 0.5, value: 9,
        pipeHub: true, supplyHub: false,
        neighbors: ['nordics', 'germany', 'central', 'belarus', 'russia'],
        points: [
            { x: 352, y: 176 }, { x: 448, y: 164 }, { x: 462, y: 246 },
            { x: 368, y: 258 },
        ],
    },
    {
        id: 'west', name: 'Western Europe', short: 'WEST EU', energyDemand: 0.9, value: 7,
        pipeHub: true, supplyHub: true,
        neighbors: ['britain', 'germany', 'iberia', 'italy'],
        points: [
            { x: 58, y: 286 }, { x: 196, y: 250 }, { x: 216, y: 396 },
            { x: 102, y: 452 }, { x: 46, y: 360 },
        ],
    },
    {
        id: 'germany', name: 'Germany', short: 'GERMANY', energyDemand: 0.95, value: 8,
        pipeHub: true, supplyHub: true,
        neighbors: ['nordics', 'west', 'central', 'italy', 'baltics'],
        points: [
            { x: 196, y: 198 }, { x: 346, y: 186 }, { x: 356, y: 316 },
            { x: 210, y: 338 }, { x: 186, y: 254 },
        ],
    },
    {
        id: 'central', name: 'Central Europe', short: 'CENTRAL', energyDemand: 0.7, value: 8,
        pipeHub: false, supplyHub: false,
        neighbors: ['germany', 'baltics', 'balkans', 'ukraine', 'belarus'],
        points: [
            { x: 354, y: 248 }, { x: 466, y: 236 }, { x: 476, y: 356 },
            { x: 346, y: 368 },
        ],
    },
    {
        id: 'belarus', name: 'Belarus', short: 'BELARUS', energyDemand: 0.35, value: 6,
        pipeHub: false, supplyHub: true,
        neighbors: ['baltics', 'central', 'ukraine', 'russia'],
        points: [
            { x: 450, y: 164 }, { x: 558, y: 154 }, { x: 570, y: 262 },
            { x: 462, y: 268 },
        ],
    },
    {
        id: 'russia', name: 'Western Russia', short: 'W. RUSSIA', energyDemand: 0.2, value: 7,
        pipeHub: true, supplyHub: true,
        neighbors: ['baltics', 'belarus', 'ukraine', 'blacksea'],
        points: [
            { x: 558, y: 76 }, { x: 686, y: 70 }, { x: 692, y: 316 },
            { x: 572, y: 326 }, { x: 558, y: 154 },
        ],
    },
    {
        id: 'iberia', name: 'Iberia', short: 'IBERIA', energyDemand: 0.6, value: 4,
        pipeHub: false, supplyHub: false,
        neighbors: ['west', 'italy'],
        points: [
            { x: 36, y: 460 }, { x: 150, y: 448 }, { x: 160, y: 590 },
            { x: 40, y: 580 },
        ],
    },
    {
        id: 'italy', name: 'Italy', short: 'ITALY', energyDemand: 0.75, value: 5,
        pipeHub: true, supplyHub: false,
        neighbors: ['west', 'germany', 'balkans', 'iberia'],
        points: [
            { x: 208, y: 350 }, { x: 304, y: 338 }, { x: 296, y: 512 },
            { x: 216, y: 530 }, { x: 186, y: 438 },
        ],
    },
    {
        id: 'balkans', name: 'Balkans', short: 'BALKANS', energyDemand: 0.55, value: 6,
        pipeHub: false, supplyHub: false,
        neighbors: ['italy', 'central', 'ukraine', 'blacksea'],
        points: [
            { x: 326, y: 378 }, { x: 468, y: 366 }, { x: 458, y: 522 },
            { x: 318, y: 532 },
        ],
    },
    {
        id: 'ukraine', name: 'Ukraine', short: 'UKRAINE', energyDemand: 0.5, value: 10,
        pipeHub: true, supplyHub: false,
        neighbors: ['central', 'balkans', 'belarus', 'russia', 'blacksea'],
        points: [
            { x: 476, y: 268 }, { x: 598, y: 256 }, { x: 610, y: 418 },
            { x: 468, y: 428 },
        ],
    },
    {
        id: 'blacksea', name: 'Black Sea', short: 'BLACK SEA', energyDemand: 0.4, value: 7,
        pipeHub: true, supplyHub: true,
        neighbors: ['russia', 'ukraine', 'balkans'],
        points: [
            { x: 508, y: 430 }, { x: 640, y: 418 }, { x: 650, y: 552 },
            { x: 498, y: 552 },
        ],
    },
];

export const REGION_BY_ID: Record<string, RegionDef> = Object.fromEntries(
    REGIONS.map((region) => [region.id, region]),
);

export function centroid(points: Point[]): Point {
    let x = 0;
    let y = 0;
    for (const point of points) {
        x += point.x;
        y += point.y;
    }
    return { x: x / points.length, y: y / points.length };
}

export function pointInPolygon(x: number, y: number, points: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

export function regionAt(x: number, y: number): RegionDef | undefined {
    const hits = REGIONS.filter((region) => pointInPolygon(x, y, region.points));
    if (hits.length === 0) {
        return undefined;
    }
    hits.sort((a, b) => polygonArea(a.points) - polygonArea(b.points));
    return hits[0];
}

function polygonArea(points: Point[]): number {
    let area = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        area += points[j].x * points[i].y - points[i].x * points[j].y;
    }
    return Math.abs(area / 2);
}
