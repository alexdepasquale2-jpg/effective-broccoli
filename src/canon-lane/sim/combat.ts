import { WAVE_PERIOD } from './constants.ts';
import type { CombatUnit, LaneId, MatchEvent, MatchState, PlayerPower } from './types.ts';

const ALLY = 0 as const;
const ENEMY = 1 as const;

function spawn(match: MatchState, unit: Omit<CombatUnit, 'id'>): CombatUnit {
    const created: CombatUnit = { ...unit, id: match.nextId };
    match.nextId += 1;
    match.units.push(created);
    return created;
}

function enemyScale(index: number, power: PlayerPower): number {
    const curve = Math.pow(1.16, index);
    const chase = 1 + Math.log10(1 + power.dps + power.clickDamage) * 0.55;
    return curve * chase;
}

export function createMatch(index: number, power: PlayerPower): MatchState {
    const match: MatchState = {
        index,
        elapsed: 0,
        waveTimer: 0.4,
        omenTimer: 11,
        campTimer: 9,
        units: [],
        nextId: 1,
        over: null,
        goldBanked: 0,
    };
    const scale = enemyScale(index, power);
    for (const lane of [0, 1, 2] as LaneId[]) {
        spawn(match, {
            team: ALLY,
            kind: 'tower',
            lane,
            pos: 72,
            hp: power.towerHp,
            maxHp: power.towerHp,
            dmg: power.towerDamage,
            range: 10,
            speed: 0,
            gold: 0,
            attackCd: 0,
        });
        spawn(match, {
            team: ENEMY,
            kind: 'tower',
            lane,
            pos: 28,
            hp: 70 * scale,
            maxHp: 70 * scale,
            dmg: 2.1 * scale,
            range: 10,
            speed: 0,
            gold: 8 * (1 + index * 0.15),
            attackCd: 0.3,
        });
    }
    spawn(match, {
        team: ALLY,
        kind: 'nexus',
        lane: 1,
        pos: 96,
        hp: power.champHp * 6,
        maxHp: power.champHp * 6,
        dmg: power.towerDamage * 0.8,
        range: 8,
        speed: 0,
        gold: 0,
        attackCd: 0,
    });
    spawn(match, {
        team: ENEMY,
        kind: 'nexus',
        lane: 1,
        pos: 4,
        hp: 220 * scale,
        maxHp: 220 * scale,
        dmg: 3.2 * scale,
        range: 8,
        speed: 0,
        gold: 0,
        attackCd: 0.2,
    });
    spawn(match, {
        team: ALLY,
        kind: 'champ',
        lane: 1,
        pos: 64,
        hp: power.champHp,
        maxHp: power.champHp,
        dmg: Math.max(1.2, power.dps * 0.55),
        range: 9,
        speed: 7.5,
        gold: 0,
        attackCd: 0,
    });
    spawn(match, {
        team: ENEMY,
        kind: 'champ',
        lane: 1,
        pos: 36,
        hp: 36 * scale,
        maxHp: 36 * scale,
        dmg: 1.6 * scale,
        range: 8,
        speed: 6.2,
        gold: 14 * (1 + index * 0.12),
        attackCd: 0.4,
    });
    for (const lane of [0, 2] as LaneId[]) {
        spawn(match, {
            team: ENEMY,
            kind: 'camp',
            lane,
            pos: lane === 0 ? 50 : 50,
            hp: 18 * scale,
            maxHp: 18 * scale,
            dmg: 0,
            range: 0,
            speed: 0,
            gold: 6 * (1 + index * 0.1),
            attackCd: 0,
        });
    }
    return match;
}

function living(match: MatchState): CombatUnit[] {
    return match.units.filter((unit) => unit.hp > 0);
}

function inLane(unit: CombatUnit, lane: LaneId): boolean {
    if (unit.kind === 'nexus') {
        return true;
    }
    return unit.lane === lane;
}

function towerStanding(match: MatchState, team: 0 | 1, lane: LaneId): boolean {
    return living(match).some((unit) => unit.kind === 'tower' && unit.team === team && unit.lane === lane && unit.hp > 0);
}

function canTargetStructure(match: MatchState, attacker: CombatUnit, target: CombatUnit): boolean {
    if (target.kind === 'nexus') {
        return !towerStanding(match, target.team, attacker.lane);
    }
    return true;
}

function nearestFoe(match: MatchState, unit: CombatUnit): CombatUnit | null {
    let best: CombatUnit | null = null;
    let bestDist = Infinity;
    for (const other of living(match)) {
        if (other.team === unit.team || !inLane(other, unit.lane)) {
            continue;
        }
        if ((other.kind === 'tower' || other.kind === 'nexus') && !canTargetStructure(match, unit, other)) {
            continue;
        }
        if (other.kind === 'camp' && unit.team === ENEMY) {
            continue;
        }
        const dist = Math.abs(other.pos - unit.pos);
        if (dist < bestDist) {
            best = other;
            bestDist = dist;
        }
    }
    return best;
}

function spawnWave(match: MatchState, power: PlayerPower) {
    const scale = enemyScale(match.index, power);
    const perLane = living(match).filter((unit) => unit.kind === 'minion').length > 36 ? 2 : 3;
    for (const lane of [0, 1, 2] as LaneId[]) {
        for (let i = 0; i < perLane; i += 1) {
            spawn(match, {
                team: ALLY,
                kind: 'minion',
                lane,
                pos: 88 - i * 2.2,
                hp: power.minionHp,
                maxHp: power.minionHp,
                dmg: power.minionDamage,
                range: 5,
                speed: 6.4,
                gold: 0,
                attackCd: i * 0.15,
            });
            spawn(match, {
                team: ENEMY,
                kind: 'minion',
                lane,
                pos: 12 + i * 2.2,
                hp: 7.5 * scale,
                maxHp: 7.5 * scale,
                dmg: 0.9 * scale,
                range: 5,
                speed: 6.1,
                gold: 1.6 * (1 + match.index * 0.08),
                attackCd: i * 0.15,
            });
        }
    }
}

function strike(match: MatchState, target: CombatUnit, amount: number, events: MatchEvent[], kind: MatchEvent['kind']) {
    target.hp -= amount;
    events.push({ kind, lane: target.lane, amount, x: target.pos });
    if (target.hp <= 0) {
        target.hp = 0;
        if (target.gold > 0 && target.team === ENEMY) {
            match.goldBanked += target.gold;
            events.push({ kind: target.kind === 'tower' ? 'tower' : 'gold', lane: target.lane, amount: target.gold, x: target.pos });
        }
        if (target.kind === 'nexus') {
            match.over = target.team === ENEMY ? 'victory' : 'defeat';
            events.push({ kind: match.over, lane: 1, amount: 0 });
        }
    }
}

export function setChampionLane(match: MatchState, lane: LaneId) {
    const champ = match.units.find((unit) => unit.kind === 'champ' && unit.team === ALLY);
    if (champ) {
        champ.lane = lane;
    }
}

export function retuneChampion(match: MatchState, power: PlayerPower) {
    const champ = match.units.find((unit) => unit.kind === 'champ' && unit.team === ALLY);
    if (!champ) {
        return;
    }
    const ratio = champ.maxHp > 0 ? champ.hp / champ.maxHp : 1;
    champ.maxHp = power.champHp;
    champ.hp = Math.max(1, champ.maxHp * ratio);
    champ.dmg = Math.max(1.2, power.dps * 0.55);
}

export function clickTarget(match: MatchState, lane: LaneId, power: PlayerPower, crit: boolean): MatchEvent[] {
    const events: MatchEvent[] = [];
    const foes = living(match)
        .filter((unit) => unit.team === ENEMY && inLane(unit, lane) && unit.kind !== 'camp')
        .sort((a, b) => {
            const lastHitA = a.kind === 'minion' && a.hp <= power.clickDamage * 1.35 ? 0 : 1;
            const lastHitB = b.kind === 'minion' && b.hp <= power.clickDamage * 1.35 ? 0 : 1;
            if (lastHitA !== lastHitB) {
                return lastHitA - lastHitB;
            }
            return b.pos - a.pos;
        });
    const target = foes[0];
    if (!target) {
        return events;
    }
    if ((target.kind === 'tower' || target.kind === 'nexus') && !canTargetStructure(match, { ...target, team: ALLY, lane } as CombatUnit, target)) {
        const fallback = foes.find((unit) => unit.kind === 'minion' || unit.kind === 'champ');
        if (!fallback) {
            return events;
        }
        return clickTargetOn(match, fallback, power, crit);
    }
    return clickTargetOn(match, target, power, crit);
}

function clickTargetOn(match: MatchState, target: CombatUnit, power: PlayerPower, crit: boolean): MatchEvent[] {
    const events: MatchEvent[] = [];
    const raw = power.clickDamage * (crit ? power.critDamage : 1);
    const wasLastHit = target.kind === 'minion' && target.hp <= raw * 1.2;
    strike(match, target, raw, events, crit ? 'crit' : 'damage');
    if (target.hp <= 0 && wasLastHit) {
        match.goldBanked += power.lastHitBonus;
        events.push({ kind: 'lastHit', lane: target.lane, amount: power.lastHitBonus, x: target.pos });
    }
    return events;
}

export function clickCamp(match: MatchState, lane: LaneId, power: PlayerPower): MatchEvent[] {
    const events: MatchEvent[] = [];
    const camp = living(match).find((unit) => unit.kind === 'camp' && unit.lane === lane);
    if (!camp) {
        return events;
    }
    strike(match, camp, power.clickDamage * 1.6, events, 'camp');
    if (camp.hp <= 0) {
        match.goldBanked += power.jungleGold;
        events.push({ kind: 'gold', lane, amount: power.jungleGold, x: camp.pos });
    }
    return events;
}

export function tickMatch(match: MatchState, dt: number, power: PlayerPower, focus: LaneId): MatchEvent[] {
    const events: MatchEvent[] = [];
    if (match.over) {
        return events;
    }
    match.elapsed += dt;
    match.waveTimer -= dt;
    match.omenTimer -= dt;
    match.campTimer -= dt;
    setChampionLane(match, focus);
    retuneChampion(match, power);

    if (match.waveTimer <= 0) {
        spawnWave(match, power);
        match.waveTimer = WAVE_PERIOD;
    }
    if (match.omenTimer <= 0 && power.omenBurst > 0) {
        const foes = living(match).filter((unit) => unit.team === ENEMY && inLane(unit, focus) && unit.kind !== 'camp');
        for (const foe of foes) {
            strike(match, foe, power.omenBurst, events, 'omen');
        }
        match.omenTimer = 12;
    }
    if (match.campTimer <= 0) {
        const scale = enemyScale(match.index, power);
        for (const lane of [0, 2] as LaneId[]) {
            const existing = match.units.find((unit) => unit.kind === 'camp' && unit.lane === lane && unit.hp > 0);
            if (!existing) {
                spawn(match, {
                    team: ENEMY,
                    kind: 'camp',
                    lane,
                    pos: 50,
                    hp: 18 * scale,
                    maxHp: 18 * scale,
                    dmg: 0,
                    range: 0,
                    speed: 0,
                    gold: 6 * (1 + match.index * 0.1),
                    attackCd: 0,
                });
            }
        }
        match.campTimer = 22;
    }

    const units = living(match);
    for (const unit of units) {
        if (unit.speed <= 0 || unit.kind === 'camp') {
            continue;
        }
        const foe = nearestFoe(match, unit);
        const dir = unit.team === ALLY ? -1 : 1;
        if (!foe || Math.abs(foe.pos - unit.pos) > unit.range) {
            const next = unit.pos + dir * unit.speed * dt;
            unit.pos = Math.max(2, Math.min(98, next));
        }
    }

    for (const unit of living(match)) {
        if (unit.kind === 'camp') {
            continue;
        }
        unit.attackCd -= dt;
        if (unit.attackCd > 0) {
            continue;
        }
        const foe = nearestFoe(match, unit);
        if (!foe || Math.abs(foe.pos - unit.pos) > unit.range) {
            continue;
        }
        const dmg = unit.kind === 'champ' && unit.team === ALLY ? Math.max(unit.dmg, power.dps * dt * 8) : unit.dmg;
        strike(match, foe, dmg, events, 'damage');
        unit.attackCd = unit.kind === 'champ' ? 0.55 : unit.kind === 'tower' ? 0.85 : 0.7;
    }

    const allyNexus = match.units.find((unit) => unit.kind === 'nexus' && unit.team === ALLY);
    const enemyNexus = match.units.find((unit) => unit.kind === 'nexus' && unit.team === ENEMY);
    if (allyNexus && allyNexus.hp <= 0) {
        match.over = 'defeat';
    }
    if (enemyNexus && enemyNexus.hp <= 0) {
        match.over = 'victory';
    }
    return events;
}

export function estimatedMatchSeconds(power: PlayerPower, index: number): number {
    const scale = enemyScale(index, power);
    const pressure = power.dps + power.clickDamage * 0.35 + power.minionDamage * 3 + power.towerDamage;
    const hp = 220 * scale + 70 * scale * 3;
    return Math.max(18, Math.min(140, hp / Math.max(2, pressure) + 16));
}
