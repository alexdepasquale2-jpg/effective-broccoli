import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Match, SPECIES } from './species.ts';

const sp = (id: string) => SPECIES.find(s => s.id === id)!;
const tos = (m: Match, sq: string) => m.targets(sq as never).map(x => x.to).sort();

describe('species chess', () => {
    it('keeps standard perft for a plain board', () => {
        const m = new Match(sp('riders'), sp('stone'));
        m.chess.perks = { w: { leaps: {}, slides: {} }, b: { leaps: {}, slides: {} } };
        assert.equal(m.chess.perft(3), 8902);
    });

    it('base perk adds moves (Riders knight steps orthogonally)', () => {
        const m = new Match(sp('riders'), sp('stone'));
        m.chess.load('4k3/8/8/8/3N4/8/8/4K3 w - - 0 1');
        assert.equal(tos(m, 'd4').length, 12);
    });

    it('perks are mirrored for black (Tide pawns step backward)', () => {
        const m = new Match(sp('riders'), sp('tide'));
        m.chess.load('4k3/8/3p4/8/8/8/8/4K3 b - - 0 1');
        assert.deepEqual(tos(m, 'd6'), ['d5', 'd7']);
    });

    it('perk attacks count for check and mate', () => {
        const m = new Match(sp('mystics'), sp('stone'));
        // white bishop on e7 attacks e8 via orthogonal step
        m.chess.load('4k3/4B3/8/8/8/8/8/4K3 b - - 0 1');
        assert.ok(m.chess.isCheck());
    });

    it('buying techs costs stars and unlocks moves', () => {
        const m = new Match(sp('riders'), sp('stone'));
        assert.equal(m.blocker('w', 'outriders'), 'Needs 3★');
        m.stars.w = 3;
        assert.ok(m.buy('w', 'outriders'));
        assert.equal(m.stars.w, 0);
        assert.ok(tos(m, 'e2').includes('d4'));
    });

    it('cannot buy a tech that would give check', () => {
        const m = new Match(sp('mystics'), sp('stone'));
        // queen e6 would knight-leap to the king on f8
        m.chess.load('5k2/8/4Q3/8/8/8/8/4K3 w - - 0 1');
        m.stars.w = 7;
        assert.match(m.blocker('w', 'archmage') ?? '', /check/);
    });

    it('earns stars per turn and per capture', () => {
        const m = new Match(sp('riders'), sp('stone'));
        m.move('e2', 'e4'); m.move('d7', 'd5');
        assert.ok(m.move('e4', 'd5')?.captured);
        assert.equal(m.stars.w, 1 + 1 + 2);
        assert.equal(m.stars.b, 2);
    });
});
