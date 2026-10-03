import type { Color, PieceSymbol, RawMove, Square } from '../engine/chess.ts';
import type { Match } from './species.ts';

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PERK_BONUS = 0.1; // per extra move direction a piece type gains
const MATE = 1000;
const Q_DEPTH = 4;

export type Bot = { depth: number; rng: () => number };

// Deterministic PRNG so balance runs are repeatable.
export const mulberry32 = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const square = (n: number) => ('abcdefgh'[n & 15] + (8 - (n >> 4))) as Square;

// Piece values per color, raised by owned perks so the bot values upgraded pieces.
const values = (m: Match): Record<Color, Record<PieceSymbol, number>> => {
    const out = { w: { ...VALUE }, b: { ...VALUE } };
    for (const c of ['w', 'b'] as Color[]) {
        for (const kind of ['leaps', 'slides'] as const) {
            for (const [type, vecs] of Object.entries(m.chess.perks[c][kind])) {
                out[c][type as PieceSymbol] += PERK_BONUS * vecs!.length * (kind === 'slides' ? 2 : 1);
            }
        }
    }
    return out;
};

// Buy every affordable tech in tree order (cheapest first).
export function buyTechs(m: Match, color: Color) {
    for (const t of m.species[color].techs) m.buy(color, t.id);
}

// Picks a move for the side to move with alpha-beta + capture quiescence.
export function chooseMove(m: Match, bot: Bot): { from: Square; to: Square } | null {
    const c = m.chess;
    const val = values(m);
    const evaluate = () => {
        let score = 0;
        for (const row of c.board()) for (const p of row) if (p) score += (p.color === 'w' ? 1 : -1) * val[p.color][p.type];
        return c.turn() === 'w' ? score : -score;
    };
    const order = (moves: RawMove[]) => moves
        .filter(x => !x.promotion || x.promotion === 'q')
        .sort((a, b) => (b.captured ? VALUE[b.captured] * 10 - VALUE[b.piece] : -1) - (a.captured ? VALUE[a.captured] * 10 - VALUE[a.piece] : -1));

    const quiesce = (alpha: number, beta: number, qd: number): number => {
        const stand = evaluate();
        if (stand >= beta || qd === 0) return stand;
        if (stand > alpha) alpha = stand;
        for (const mv of order(c.pseudoRaw().filter(x => x.captured))) {
            c.makeRaw(mv);
            if (c.illegalRaw(mv)) { c.undoRaw(); continue; }
            const s = -quiesce(-beta, -alpha, qd - 1);
            c.undoRaw();
            if (s >= beta) return s;
            if (s > alpha) alpha = s;
        }
        return alpha;
    };

    const search = (depth: number, alpha: number, beta: number, ply: number): number => {
        if (depth === 0) return quiesce(alpha, beta, Q_DEPTH);
        let legal = 0;
        for (const mv of order(c.pseudoRaw())) {
            c.makeRaw(mv);
            if (c.illegalRaw(mv)) { c.undoRaw(); continue; }
            legal++;
            const s = -search(depth - 1, -beta, -alpha, ply + 1);
            c.undoRaw();
            if (s >= beta) return s;
            if (s > alpha) alpha = s;
        }
        return legal ? alpha : c.isCheck() ? -MATE + ply : 0;
    };

    let best: RawMove | null = null;
    let bestScore = -Infinity;
    for (const mv of order(c.legalRaw())) {
        c.makeRaw(mv);
        // small noise breaks ties so games vary
        const s = -search(bot.depth - 1, -Infinity, Infinity, 1) + bot.rng() * 0.05;
        c.undoRaw();
        if (s > bestScore) [best, bestScore] = [mv, s];
    }
    return best && { from: square(best.from), to: square(best.to) };
}

// One full bot turn: buy techs, then move. Returns false if no move was made.
export function botTurn(m: Match, bot: Bot): boolean {
    const color = m.chess.turn();
    buyTechs(m, color);
    const mv = chooseMove(m, bot);
    return !!mv && !!m.move(mv.from, mv.to);
}
