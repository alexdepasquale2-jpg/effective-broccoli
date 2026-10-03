import { Chess, type Color, type Move, type PieceSymbol, type Square } from '../engine/chess.ts';

// Vectors are [file, rank] from the owner's side: +rank is forward.
type Vec = [number, number];
type Perk = { piece: PieceSymbol; kind: 'leaps' | 'slides'; vecs: Vec[] };
export type Tech = { id: string; name: string; cost: number; text: string; perks: Perk[] };
export type Species = { id: string; name: string; emoji: string; blurb: string; base: Tech; techs: Tech[] };

const WAZIR: Vec[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FERZ: Vec[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALFIL: Vec[] = FERZ.map(([f, r]) => [f * 2, r * 2]);
const KNIGHT: Vec[] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const SIDE: Vec[] = [[1, 0], [-1, 0]];

const tech = (id: string, name: string, cost: number, text: string, ...perks: Perk[]): Tech =>
    ({ id, name, cost, text, perks });

export const SPECIES: Species[] = [
    {
        id: 'riders', name: 'Steppe Riders', emoji: '🐎', blurb: 'Cavalry tribe. Knights rule the plains.',
        base: tech('saddles', 'Saddles', 0, 'Knights also step 1 square orthogonally.', { piece: 'n', kind: 'leaps', vecs: WAZIR }),
        techs: [
            tech('outriders', 'Outriders', 3, 'Pawns may leap like a knight, forward only.', { piece: 'p', kind: 'leaps', vecs: [[1, 2], [-1, 2]] }),
            tech('lancers', 'Lancers', 5, 'Bishops gain knight leaps.', { piece: 'b', kind: 'leaps', vecs: KNIGHT }),
            tech('khan', 'Great Khan', 7, 'King gains knight leaps.', { piece: 'k', kind: 'leaps', vecs: KNIGHT }),
        ],
    },
    {
        id: 'stone', name: 'Stonefolk', emoji: '⛰️', blurb: 'Mountain builders. Rooks are fortresses.',
        base: tech('bastions', 'Bastions', 0, 'Rooks also step 1 square diagonally.', { piece: 'r', kind: 'leaps', vecs: FERZ }),
        techs: [
            tech('masonry', 'Masonry', 3, 'Pawns may step (or capture) 1 square sideways.', { piece: 'p', kind: 'leaps', vecs: SIDE }),
            tech('catapults', 'Catapults', 5, 'Rooks may jump exactly 2 squares diagonally.', { piece: 'r', kind: 'leaps', vecs: ALFIL }),
            tech('citadel', 'Citadel', 7, 'King may jump 2 squares diagonally.', { piece: 'k', kind: 'leaps', vecs: ALFIL }),
        ],
    },
    {
        id: 'mystics', name: 'Grove Mystics', emoji: '🌿', blurb: 'Forest seers. Bishops bend the rules.',
        base: tech('wisdom', 'Wisdom', 0, 'Bishops also step 1 square orthogonally.', { piece: 'b', kind: 'leaps', vecs: WAZIR }),
        techs: [
            tech('roots', 'Roots', 3, 'Pawns may step back diagonally.', { piece: 'p', kind: 'leaps', vecs: [[1, -1], [-1, -1]] }),
            tech('blink', 'Blink', 5, 'Knights may jump 2 squares diagonally.', { piece: 'n', kind: 'leaps', vecs: ALFIL }),
            tech('archmage', 'Archmage', 7, 'Queen gains knight leaps.', { piece: 'q', kind: 'leaps', vecs: KNIGHT }),
        ],
    },
    {
        id: 'tide', name: 'Tidecallers', emoji: '🌊', blurb: 'Ocean raiders. Everything flows.',
        base: tech('ebb', 'Ebb', 0, 'Pawns may step 1 square backward.', { piece: 'p', kind: 'leaps', vecs: [[0, -1]] }),
        techs: [
            tech('currents', 'Currents', 3, 'Pawns may step (or capture) 1 square sideways.', { piece: 'p', kind: 'leaps', vecs: SIDE }),
            tech('riptide', 'Riptide', 5, 'Knights keep leaping in a line (nightrider).', { piece: 'n', kind: 'slides', vecs: KNIGHT }),
            tech('kraken', 'Kraken', 7, 'Rooks gain knight leaps.', { piece: 'r', kind: 'leaps', vecs: KNIGHT }),
        ],
    },
];

export const STARS_PER_TURN = 1;
export const STARS_PER_CAPTURE = 2;

const offset = (color: Color, [f, r]: Vec) => f + (color === 'w' ? -16 : 16) * r;

export class Match {
    chess = new Chess();
    species: Record<Color, Species>;
    stars: Record<Color, number> = { w: 0, b: 0 };
    owned: Record<Color, string[]> = { w: [], b: [] };

    constructor(white: Species, black: Species) {
        this.species = { w: white, b: black };
        this.stars.w = STARS_PER_TURN;
        this.applyPerks();
    }

    techs(color: Color): Tech[] {
        const s = this.species[color];
        return [s.base, ...s.techs.filter(t => this.owned[color].includes(t.id))];
    }

    applyPerks() {
        for (const color of ['w', 'b'] as Color[]) {
            const perks = this.chess.perks[color] = { leaps: {}, slides: {} } as typeof this.chess.perks.w;
            for (const t of this.techs(color)) {
                for (const p of t.perks) {
                    (perks[p.kind][p.piece] ??= []).push(...p.vecs.map(v => offset(color, v)));
                }
            }
        }
    }

    // Why a tech can't be bought right now, or null if it can.
    blocker(color: Color, id: string): string | null {
        const t = this.species[color].techs.find(x => x.id === id);
        if (!t) return 'Unknown tech';
        if (this.owned[color].includes(id)) return 'Owned';
        if (this.chess.isGameOver()) return 'Game over';
        if (this.chess.turn() !== color) return 'Not your turn';
        if (this.stars[color] < t.cost) return `Needs ${t.cost}★`;
        this.owned[color].push(id);
        this.applyPerks();
        const givesCheck = this.chess.isAttacked(this.chess.findPiece({ type: 'k', color: color === 'w' ? 'b' : 'w' })[0], color);
        this.owned[color].pop();
        this.applyPerks();
        return givesCheck ? 'Would give check — move first' : null;
    }

    buy(color: Color, id: string): boolean {
        if (this.blocker(color, id)) return false;
        const t = this.species[color].techs.find(x => x.id === id)!;
        this.stars[color] -= t.cost;
        this.owned[color].push(id);
        this.applyPerks();
        return true;
    }

    targets(square: Square): Move[] {
        return this.chess.moves({ square, verbose: true });
    }

    move(from: Square, to: Square): Move | null {
        const m = this.targets(from).find(x => x.to === to && (!x.promotion || x.promotion === 'q'));
        if (!m) return null;
        this.chess.move({ from, to, promotion: m.promotion });
        if (m.captured) this.stars[m.color] += STARS_PER_CAPTURE;
        this.stars[this.chess.turn()] += STARS_PER_TURN;
        return m;
    }
}
