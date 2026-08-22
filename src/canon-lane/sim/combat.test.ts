import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clickTarget, createMatch, tickMatch } from './combat.ts';
import { derivePower } from './economy.ts';
import { createGame, performClick, tickGame } from './state.ts';

describe('idle moba combat', () => {
    it('spawns a three-lane match with towers, nexuses, and a champion', () => {
        const state = createGame();
        const power = derivePower(state);
        const match = createMatch(0, power);
        const kinds = new Set(match.units.map((unit) => unit.kind));
        assert.ok(kinds.has('tower'));
        assert.ok(kinds.has('nexus'));
        assert.ok(kinds.has('champ'));
        assert.ok(match.units.some((unit) => unit.lane === 0));
        assert.ok(match.units.some((unit) => unit.lane === 2));
    });

    it('idles toward a result without clicks', () => {
        const state = createGame();
        state.trees.fury.level = 80;
        state.trees.strike.level = 40;
        state.trees.wave.level = 40;
        state.trees.siege.level = 40;
        const power = derivePower(state);
        const match = createMatch(0, power);
        let ticks = 0;
        while (!match.over && ticks < 8000) {
            tickMatch(match, 0.1, power, 1);
            ticks += 1;
        }
        assert.equal(match.over, 'victory');
    });

    it('clicks deal damage and can last-hit for gold', () => {
        const state = createGame();
        const before = state.gold;
        for (let i = 0; i < 40; i += 1) {
            performClick(state, false);
            tickGame(state, 0.05);
        }
        assert.ok(state.gold > before);
        assert.ok(state.clicks === 40);
        const power = derivePower(state);
        const match = createMatch(0, power);
        tickMatch(match, 8, power, 1);
        const minion = match.units.find((unit) => unit.kind === 'minion' && unit.team === 1);
        assert.ok(minion, 'expected an enemy minion after a wave');
        if (!minion) {
            return;
        }
        minion.hp = Math.max(0.2, power.clickDamage * 0.4);
        const events = clickTarget(match, minion.lane, power, false);
        assert.ok(events.some((event) => event.kind === 'lastHit' || event.kind === 'damage' || event.kind === 'gold'));
    });
});
