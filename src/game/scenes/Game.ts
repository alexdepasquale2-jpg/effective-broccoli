import { GameObjects, Scene } from 'phaser';
import { chooseAiOrder } from '../sim/ai';
import {
    actionLabel,
    applyOrder,
    controlOf,
    countControlled,
    createGame,
    endTurn,
    factionName,
    seasonName,
    stocksLine,
} from '../sim/engine';
import { EDGES, edgeColor, edgePoints, isSupplied, pipelineFlow } from '../sim/logistics';
import { REGIONS, centroid, regionAt } from '../sim/map';
import type { ActionType, Faction, GameState } from '../sim/types';
import { addButton, addLabel, addPanel, controlColor, leanTint } from '../view/ui';

const ACTIONS: { type: ActionType; fill: number }[] = [
    { type: 'shape', fill: 0x3a4f2a },
    { type: 'grid', fill: 0x2a4a58 },
    { type: 'net', fill: 0x1f4d4a },
    { type: 'hold', fill: 0x3d3a28 },
    { type: 'troops', fill: 0x4a3420 },
    { type: 'drone', fill: 0x1f4a3a },
    { type: 'missile', fill: 0x5a2428 },
    { type: 'talk', fill: 0x2a3350 },
];

export class Game extends Scene {
    private state!: GameState;
    private selected?: string;
    private locked = false;
    private mapGfx!: GameObjects.Graphics;
    private labels: GameObjects.Text[] = [];
    private hudSeason!: GameObjects.Text;
    private hudAp!: GameObjects.Text;
    private hudHeat!: GameObjects.Text;
    private hudScore!: GameObjects.Text;
    private hudStocks!: GameObjects.Text;
    private heatFill!: GameObjects.Rectangle;
    private regionTitle!: GameObjects.Text;
    private regionMeta!: GameObjects.Text;
    private logText!: GameObjects.Text;
    private banner!: GameObjects.Text;
    private leanFill!: GameObjects.Rectangle;

    constructor() {
        super('Game');
    }

    create() {
        const player = (this.registry.get('player') as Faction) || 'eu';
        this.state = createGame(player);
        this.cameras.main.setBackgroundColor(0x0b1220);
        this.drawChrome();
        this.mapGfx = this.add.graphics();
        this.buildLabels();
        this.buildPanel();
        this.input.on('pointerdown', (pointer: { worldX: number; worldY: number }) => this.onMapTap(pointer));
        this.renderAll();
        this.banner.setText('Select a theater, then an operation.');
    }

    private drawChrome() {
        this.add.rectangle(0, 0, 1024, 70, 0x10182a).setOrigin(0, 0);
        addLabel(this, 14, 8, 'WARM WAR 2026', 16, '#f3efe4');
        this.hudSeason = addLabel(this, 210, 12, '', 13, '#d4a017');
        this.hudAp = addLabel(this, 390, 12, '', 13, '#e8eef7');
        this.hudHeat = addLabel(this, 500, 12, '', 13, '#e07070');
        this.hudScore = addLabel(this, 640, 12, '', 13, '#e2c36b');
        this.hudStocks = addLabel(this, 14, 40, '', 13, '#7ec8d4');

        this.add.rectangle(16, 736, 680, 14, 0x1b2436).setOrigin(0, 0);
        this.heatFill = this.add.rectangle(16, 736, 8, 14, 0xe85d04).setOrigin(0, 0);
        addLabel(this, 16, 718, 'HEAT', 11, '#8b9bb4');

        this.add.rectangle(16, 76, 680, 636, 0x071018, 1).setOrigin(0, 0).setStrokeStyle(1, 0x1e3a5f);
        addLabel(this, 28, 82, 'THEATER  ·  EUROPE   gold supply   cyan pipeline   red cut', 11, '#6f829c');
    }

    private buildLabels() {
        for (const region of REGIONS) {
            const c = centroid(region.points);
            const text = this.add
                .text(c.x, c.y, region.short, {
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: '10px',
                    color: '#f4f7fb',
                    fontStyle: 'bold',
                    align: 'center',
                })
                .setOrigin(0.5);
            this.labels.push(text);
        }
    }

    private buildPanel() {
        addPanel(this, 708, 76, 300, 636);
        this.regionTitle = addLabel(this, 858, 88, 'NO THEATER', 15, '#f4f7fb', 0.5, 0);
        this.regionMeta = addLabel(this, 724, 112, 'Tap a region on the map.', 12, '#9aa8bd');
        this.regionMeta.setWordWrapWidth(268);
        this.regionMeta.setLineSpacing(2);

        this.add.rectangle(724, 186, 268, 8, 0x1b2436).setOrigin(0, 0);
        this.leanFill = this.add.rectangle(858, 186, 4, 8, 0xe2c36b).setOrigin(0.5, 0);

        ACTIONS.forEach((action, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = 784 + col * 148;
            const y = 220 + row * 48;
            addButton(this, x, y, 136, 40, actionLabel(action.type), action.fill, () => this.onAction(action.type));
        });

        addButton(this, 858, 418, 268, 40, 'END SEASON', 0x243044, () => this.onEndTurn());

        addLabel(this, 724, 444, 'SITREP LOG', 11, '#6f829c');
        this.logText = addLabel(this, 724, 460, '', 11, '#c5d0e0');
        this.logText.setWordWrapWidth(268);
        this.logText.setLineSpacing(3);

        this.banner = addLabel(this, 858, 678, '', 12, '#d4a017', 0.5, 0.5);
        this.banner.setWordWrapWidth(280);
        this.banner.setAlign('center');
    }

    private onMapTap(pointer: { worldX: number; worldY: number }) {
        if (this.locked || this.state.over) {
            return;
        }
        if (pointer.worldX >= 700) {
            return;
        }
        const region = regionAt(pointer.worldX, pointer.worldY);
        if (!region) {
            return;
        }
        this.selected = region.id;
        this.renderAll();
    }

    private onAction(type: ActionType) {
        if (this.locked || this.state.over || this.state.current !== this.state.player) {
            return;
        }
        if (!this.selected) {
            this.banner.setText('Select a theater first.');
            return;
        }
        if (this.state.ap <= 0) {
            this.banner.setText('No operations left. End the season.');
            return;
        }
        const ap = this.state.ap;
        this.state = applyOrder(this.state, { type, regionId: this.selected });
        this.renderAll();
        if (this.state.ap === ap) {
            this.banner.setText(this.state.log[this.state.log.length - 1] || 'Refused.');
            return;
        }
        this.afterAction();
    }

    private onEndTurn() {
        if (this.locked || this.state.over || this.state.current !== this.state.player) {
            return;
        }
        this.state = endTurn(this.state);
        this.renderAll();
        if (this.state.over) {
            this.finish();
            return;
        }
        this.runAi();
    }

    private afterAction() {
        if (this.state.over) {
            this.finish();
            return;
        }
        if (this.state.ap <= 0) {
            this.banner.setText('Operations spent. End the season.');
        }
    }

    private runAi() {
        this.locked = true;
        const who = factionName(this.state.current).toUpperCase();
        this.banner.setText(`${who} is moving...`);
        this.time.delayedCall(380, () => this.playAiStep());
    }

    private playAiStep() {
        if (this.state.over) {
            this.finish();
            return;
        }
        if (this.state.current === this.state.player) {
            this.locked = false;
            this.banner.setText(`${seasonName(this.state.turn)} — your watch.`);
            this.renderAll();
            return;
        }
        const order = chooseAiOrder(this.state);
        if (order === 'end' || this.state.ap <= 0) {
            this.state = endTurn(this.state);
            this.renderAll();
            if (this.state.over) {
                this.finish();
                return;
            }
            this.locked = false;
            this.banner.setText(`${seasonName(this.state.turn)} — your watch.`);
            return;
        }
        this.selected = order.regionId;
        const ap = this.state.ap;
        this.state = applyOrder(this.state, order);
        if (this.state.ap === ap) {
            this.state = endTurn(this.state);
            this.renderAll();
            this.locked = false;
            if (this.state.over) {
                this.finish();
                return;
            }
            this.banner.setText(`${seasonName(this.state.turn)} — your watch.`);
            return;
        }
        this.renderAll();
        if (this.state.over) {
            this.finish();
            return;
        }
        this.time.delayedCall(420, () => this.playAiStep());
    }

    private finish() {
        this.locked = true;
        const outcome = this.state.over;
        if (!outcome) {
            return;
        }
        this.registry.set('outcome', outcome);
        this.registry.set('player', this.state.player);
        this.registry.set('euCount', countControlled(this.state, 'eu'));
        this.registry.set('ruCount', countControlled(this.state, 'ru'));
        this.registry.set('heat', Math.round(this.state.heat));
        this.time.delayedCall(700, () => this.scene.start('GameOver'));
    }

    private renderAll() {
        this.drawMap();
        const you = this.state.player;
        const bag = this.state.stocks[you];
        this.hudSeason.setText(seasonName(this.state.turn).toUpperCase());
        this.hudAp.setText(`AP ${this.state.ap}/${this.state.maxAp}`);
        this.hudHeat.setText(`HEAT ${Math.round(this.state.heat)}`);
        this.hudScore.setText(`EU ${countControlled(this.state, 'eu')}–${countControlled(this.state, 'ru')} RU`);
        this.hudStocks.setText(
            `${factionName(you).toUpperCase()}  ${stocksLine(bag)}   NRG ${Math.round(this.state.energyEu)}/${Math.round(this.state.energyRu)}   PIPE ${Math.round(pipelineFlow(this.state, you))}`,
        );
        this.heatFill.width = Math.max(8, (680 * this.state.heat) / 100);
        this.heatFill.setFillStyle(this.state.heat > 72 ? 0xe85d04 : 0xd4a017);

        const selected = this.selected ? this.state.regions[this.selected] : undefined;
        const def = REGIONS.find((region) => region.id === this.selected);
        if (selected && def) {
            const control = controlOf(selected.lean);
            const euLine = isSupplied(this.state, def.id, 'eu');
            const ruLine = isSupplied(this.state, def.id, 'ru');
            this.regionTitle.setText(def.name.toUpperCase());
            this.regionMeta.setText(
                `${controlLabel(control)}  lean ${fmt(selected.lean)}\n` +
                    `T EU${selected.troopsEu} RU${selected.troopsRu}   D EU${selected.dronesEu} RU${selected.dronesRu}   M ${selected.batteries}\n` +
                    `Depot ${Math.round(selected.depot)}  Pipe ${Math.round(selected.pipeline)}  Shield ${selected.shield}\n` +
                    `Line EU ${euLine ? 'LIVE' : 'CUT'}  RU ${ruLine ? 'LIVE' : 'CUT'}`,
            );
            this.regionMeta.setColor(controlColor(control));
            this.leanFill.width = Math.max(6, (Math.abs(selected.lean) / 100) * 268);
            this.leanFill.setFillStyle(leanTint(selected.lean));
        } else {
            this.regionTitle.setText('NO THEATER');
            this.regionMeta.setText('Tap a region. TROOPS deploy. DRONE interdicts. STRIKE spends a missile. GRID is pipelines.');
            this.regionMeta.setColor('#9aa8bd');
            this.leanFill.width = 4;
        }

        this.logText.setText(this.state.log.slice(-7).join('\n'));
        this.labels.forEach((label, index) => {
            const region = REGIONS[index];
            const local = this.state.regions[region.id];
            const control = controlOf(local.lean);
            label.setText(`${region.short}\n${fmt(local.lean)}\nT${local.troopsEu}/${local.troopsRu} D${local.dronesEu}/${local.dronesRu}`);
            label.setColor(control === 'contested' ? '#f4f7fb' : '#0b1220');
        });
    }

    private drawMap() {
        const g = this.mapGfx;
        g.clear();
        for (const region of REGIONS) {
            const lean = this.state.regions[region.id].lean;
            const selected = region.id === this.selected;
            g.fillStyle(leanTint(lean), selected ? 0.96 : 0.86);
            g.lineStyle(selected ? 3 : 1, selected ? 0xf4f7fb : 0x0b1220, 1);
            path(g, region.points);
            g.fillPath();
            path(g, region.points);
            g.strokePath();
        }
        for (const edge of EDGES) {
            const [a, b] = edgePoints(edge);
            const cut = (this.state.cuts[`${edge.a}|${edge.b}`] || this.state.cuts[`${edge.b}|${edge.a}`] || 0) > 0;
            g.lineStyle(4, 0x071018, 0.85);
            g.lineBetween(a.x, a.y, b.x, b.y);
            g.lineStyle(cut ? 3 : edge.pipe ? 3.2 : 2.2, edgeColor(this.state, edge), cut ? 1 : 0.92);
            g.lineBetween(a.x, a.y, b.x, b.y);
        }
        for (const region of REGIONS) {
            if (!region.pipeHub) {
                continue;
            }
            const c = centroid(region.points);
            g.fillStyle(0x2ec4b6, 1);
            g.fillTriangle(c.x, c.y - 18, c.x - 8, c.y - 7, c.x + 8, c.y - 7);
        }
    }
}

function path(g: GameObjects.Graphics, points: { x: number; y: number }[]) {
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        g.lineTo(points[i].x, points[i].y);
    }
    g.closePath();
}

function controlLabel(control: 'eu' | 'ru' | 'contested'): string {
    if (control === 'eu') {
        return 'EUROPE CONTROL';
    }
    if (control === 'ru') {
        return 'RUSSIA CONTROL';
    }
    return 'CONTESTED';
}

function fmt(lean: number): string {
    const n = Math.round(lean);
    return n > 0 ? `+${n}` : `${n}`;
}
