import { GameObjects, Scene } from 'phaser';
import { LEVELS_PER_TIER } from '../sim/constants.ts';
import { formatNum } from '../sim/format.ts';
import { treeNextCost, laneNextCost, efficiencyCost, hapticCost, insightCost } from '../sim/state.ts';
import type { GameState, LaneId, TreeId } from '../sim/types.ts';
import { LANE_NAMES, TREE_DEFS, TREE_IDS } from '../sim/types.ts';
import type { Era } from './era.ts';

export const COCKPIT = {
    arenaTop: 54,
    arenaBottom: 448,
    gridX: 8,
    gridY: 492,
    cols: 4,
    rows: 5,
    cellW: 176,
    cellH: 72,
    rosterY: 858,
    metaY: 918,
    contextY: 968,
};

export type DeckKind = 'tree' | 'lane' | 'meta';

export interface DeckSlot {
    kind: DeckKind;
    tree?: TreeId;
    lane?: LaneId;
    meta?: 'efficiency' | 'haptic' | 'insight';
    bg: GameObjects.Rectangle;
    name: GameObjects.Text;
    job: GameObjects.Text;
    stat: GameObjects.Text;
    cost: GameObjects.Text;
}

export interface Cockpit {
    slots: DeckSlot[];
    roster: { id: string; bg: GameObjects.Rectangle; mark: GameObjects.Text }[];
    context: GameObjects.Text;
    intel: GameObjects.Text;
    roots: GameObjects.GameObject[];
}

const METAS: Cockpit['slots'][number]['meta'][] = ['efficiency', 'haptic', 'insight'];

export function createCockpit(scene: Scene, era: Era, onPick: (slot: DeckSlot) => void): Cockpit {
    const slots: DeckSlot[] = [];
    const roots: GameObjects.GameObject[] = [];
    const items: { kind: DeckKind; tree?: TreeId; lane?: LaneId }[] = [
        ...TREE_IDS.map((tree) => ({ kind: 'tree' as const, tree })),
        { kind: 'lane', lane: 0 as LaneId },
        { kind: 'lane', lane: 1 as LaneId },
        { kind: 'lane', lane: 2 as LaneId },
    ];
    items.forEach((item, index) => {
        const col = index % COCKPIT.cols;
        const row = Math.floor(index / COCKPIT.cols);
        const x = COCKPIT.gridX + col * COCKPIT.cellW;
        const y = COCKPIT.gridY + row * COCKPIT.cellH;
        const bg = scene.add.rectangle(x, y, COCKPIT.cellW - 4, COCKPIT.cellH - 4, era.ink, 1).setOrigin(0, 0);
        bg.setStrokeStyle(1, era.gold, 0.35);
        bg.setInteractive({ useHandCursor: true });
        const name = scene.add.text(x + 8, y + 5, '', { fontFamily: era.font, fontSize: '13px', color: era.ivory, fontStyle: 'bold' });
        const job = scene.add.text(x + 8, y + 22, '', { fontFamily: era.font, fontSize: '11px', color: era.mute });
        const stat = scene.add.text(x + 8, y + 38, '', { fontFamily: era.font, fontSize: '11px', color: era.goldHex });
        const cost = scene.add.text(x + 8, y + 52, '', { fontFamily: era.font, fontSize: '12px', color: era.ivory });
        const slot: DeckSlot = { ...item, bg, name, job, stat, cost };
        bg.on('pointerdown', () => onPick(slot));
        slots.push(slot);
        roots.push(bg, name, job, stat, cost);
    });

    METAS.forEach((meta, i) => {
        const x = 8 + i * 176;
        const y = COCKPIT.metaY;
        const bg = scene.add.rectangle(x, y, 172, 42, era.panelAlt, 1).setOrigin(0, 0);
        bg.setInteractive({ useHandCursor: true });
        const name = scene.add.text(x + 8, y + 4, '', { fontFamily: era.font, fontSize: '12px', color: era.ivory, fontStyle: 'bold' });
        const job = scene.add.text(x + 8, y + 20, '', { fontFamily: era.font, fontSize: '11px', color: era.mute });
        const stat = scene.add.text(x + 90, y + 4, '', { fontFamily: era.font, fontSize: '11px', color: era.goldHex });
        const cost = scene.add.text(x + 90, y + 20, '', { fontFamily: era.font, fontSize: '11px', color: era.ivory });
        const slot: DeckSlot = { kind: 'meta', meta, bg, name, job, stat, cost };
        bg.on('pointerdown', () => onPick(slot));
        slots.push(slot);
        roots.push(bg, name, job, stat, cost);
    });

    const roster: Cockpit['roster'] = [];
    return { slots, roster, context: dummyText(scene), intel: dummyText(scene), roots };
}

function dummyText(scene: Scene): GameObjects.Text {
    return scene.add.text(0, 0, '', { fontSize: '1px' }).setAlpha(0);
}

export function createRoster(
    scene: Scene,
    era: Era,
    ids: string[],
    onPick: (id: string) => void,
): Cockpit['roster'] {
    return ids.map((id, i) => {
        const x = 8 + (i % 16) * 44.5;
        const y = COCKPIT.rosterY;
        const bg = scene.add.rectangle(x, y, 42, 42, era.ink, 1).setOrigin(0, 0);
        bg.setInteractive({ useHandCursor: true });
        const mark = scene.add.text(x + 21, y + 21, id.slice(0, 1).toUpperCase(), {
            fontFamily: era.font,
            fontSize: '14px',
            color: era.ivory,
            fontStyle: 'bold',
        }).setOrigin(0.5);
        bg.on('pointerdown', () => onPick(id));
        return { id, bg, mark };
    });
}

export function attachCockpitText(scene: Scene, era: Era, cockpit: Cockpit) {
    cockpit.context = scene.add.text(12, COCKPIT.contextY, '', {
        fontFamily: era.font,
        fontSize: '13px',
        color: era.ivory,
        wordWrap: { width: 700 },
    });
    cockpit.intel = scene.add.text(12, 456, '', { fontFamily: era.font, fontSize: '11px', color: era.mute });
    cockpit.roots.push(cockpit.context, cockpit.intel);
}

export function setCockpitVisible(cockpit: Cockpit, visible: boolean) {
    for (const node of cockpit.roots) {
        (node as unknown as { setVisible: (value: boolean) => void }).setVisible(visible);
    }
    for (const slot of cockpit.slots) {
        slot.bg.setVisible(visible);
        slot.name.setVisible(visible);
        slot.job.setVisible(visible);
        slot.stat.setVisible(visible);
        slot.cost.setVisible(visible);
    }
    for (const chip of cockpit.roster) {
        chip.bg.setVisible(visible);
        chip.mark.setVisible(visible);
    }
}

export function refreshCockpit(cockpit: Cockpit, state: GameState, era: Era, selected: DeckSlot | null) {
    for (const slot of cockpit.slots) {
        restyleSlot(slot, state, era, selected);
    }
    for (const chip of cockpit.roster) {
        const progress = state.champions[chip.id];
        const live = state.selectedChampion === chip.id;
        chip.bg.setFillStyle(live ? era.gold : progress?.unlocked ? era.panelAlt : era.ink);
        chip.bg.setStrokeStyle(1, era.gold, live ? 0.9 : 0.25);
        chip.mark.setColor(live ? '#1a1020' : era.ivory);
        chip.mark.setAlpha(progress?.unlocked ? 1 : 0.35);
    }
}

function restyleSlot(slot: DeckSlot, state: GameState, era: Era, selected: DeckSlot | null) {
    const active = selected && sameSlot(slot, selected);
    slot.bg.setFillStyle(active ? era.laneHot : era.ink);
    slot.bg.setStrokeStyle(active ? 2 : 1, era.gold, active ? 0.85 : 0.28);
    slot.name.setStyle({ fontFamily: era.font, color: era.ivory });
    slot.job.setStyle({ fontFamily: era.font, color: era.mute });
    slot.stat.setStyle({ fontFamily: era.font, color: era.goldHex });
    slot.cost.setStyle({ fontFamily: era.font, color: era.ivory });
    if (slot.kind === 'tree' && slot.tree) {
        const def = TREE_DEFS[slot.tree];
        const col = state.trees[slot.tree] ?? { level: 0, tier: 1 };
        const cost = treeNextCost(state, slot.tree);
        slot.name.setText(def.title.toUpperCase());
        slot.job.setText(def.job);
        slot.stat.setText(`L${col.level}  T${col.tier}`);
        slot.cost.setText(state.gold >= cost ? `${formatNum(cost)}g` : `${formatNum(cost)}g`);
        slot.cost.setColor(state.gold >= cost ? era.goldHex : era.mute);
        slot.bg.setStrokeStyle(active ? 2 : 1, def.color, active ? 1 : 0.4);
        return;
    }
    if (slot.kind === 'lane' && slot.lane !== undefined) {
        const col = state.lanes[slot.lane];
        const cost = laneNextCost(state, slot.lane);
        slot.name.setText(LANE_NAMES[slot.lane].toUpperCase());
        slot.job.setText('lane focus');
        slot.stat.setText(`L${col.level}  T${col.tier}`);
        slot.cost.setText(`${formatNum(cost)}g`);
        slot.cost.setColor(state.gold >= cost ? era.goldHex : era.mute);
        return;
    }
    if (slot.meta === 'efficiency') {
        slot.name.setText('LENS');
        slot.job.setText('shop discount');
        slot.stat.setText(`${state.meta.efficiency}/40`);
        slot.cost.setText(`${formatNum(efficiencyCost(state.meta.efficiency))}g`);
    } else if (slot.meta === 'haptic') {
        slot.name.setText('RITE');
        slot.job.setText('haptics + crit');
        slot.stat.setText(`${state.meta.haptic}/8`);
        slot.cost.setText(`${formatNum(hapticCost(state.meta.haptic))}g`);
    } else if (slot.meta === 'insight') {
        slot.name.setText('SIGHT');
        slot.job.setText('catalog depth');
        slot.stat.setText(`${state.meta.insight}/5`);
        slot.cost.setText(`${formatNum(insightCost(state.meta.insight))} gl`);
    }
}

export function sameSlot(a: DeckSlot, b: DeckSlot): boolean {
    return a.kind === b.kind && a.tree === b.tree && a.lane === b.lane && a.meta === b.meta;
}

export function slotBlurb(slot: DeckSlot, state: GameState): string {
    if (slot.kind === 'tree' && slot.tree) {
        const def = TREE_DEFS[slot.tree];
        const col = state.trees[slot.tree];
        return `${def.title} · ${def.job} · ${def.blurb}  L${col.level}/${LEVELS_PER_TIER}`;
    }
    if (slot.kind === 'lane' && slot.lane !== undefined) {
        return `${LANE_NAMES[slot.lane]} multiplies the champion standing in that corridor.`;
    }
    if (slot.meta === 'efficiency') {
        return 'Lens trims every gold price. Buy this when other costs feel sticky.';
    }
    if (slot.meta === 'haptic') {
        return 'Rite deepens vibration and adds a sliver of crit.';
    }
    return 'Sight shows more upcoming blessing names.';
}
