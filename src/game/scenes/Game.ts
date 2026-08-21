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
    opponent,
    seasonName,
} from '../sim/engine';
import { REGIONS, centroid, regionAt } from '../sim/map';
import type { ActionType, Faction, GameState } from '../sim/types';
import { addButton, addLabel, addPanel, controlColor, leanTint } from '../view/ui';

const ACTIONS: { type: ActionType; fill: number }[] = [
    { type: 'shape', fill: 0x3a4f2a },
    { type: 'grid', fill: 0x2a4a58 },
    { type: 'net', fill: 0x1f4d4a },
    { type: 'hold', fill: 0x3d3a28 },
    { type: 'posture', fill: 0x5a2428 },
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
    private hudEnergy!: GameObjects.Text;
    private hudHeat!: GameObjects.Text;
    private hudScore!: GameObjects.Text;
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
        this.add.rectangle(0, 0, 1024, 56, 0x10182a).setOrigin(0, 0);
        addLabel(this, 16, 16, 'WARM WAR 2026', 18, '#f3efe4');
        this.hudSeason = addLabel(this, 250, 18, '', 14, '#d4a017');
        this.hudAp = addLabel(this, 430, 18, '', 14, '#e8eef7');
        this.hudEnergy = addLabel(this, 530, 18, '', 14, '#7ec8d4');
        this.hudHeat = addLabel(this, 680, 18, '', 14, '#e07070');
        this.hudScore = addLabel(this, 820, 18, '', 14, '#e2c36b');

        this.add.rectangle(16, 736, 680, 14, 0x1b2436).setOrigin(0, 0);
        this.heatFill = this.add.rectangle(16, 736, 8, 14, 0xe85d04).setOrigin(0, 0);
        addLabel(this, 16, 718, 'HEAT', 11, '#8b9bb4');

        this.add.rectangle(16, 64, 680, 648, 0x071018, 1).setOrigin(0, 0).setStrokeStyle(1, 0x1e3a5f);
        addLabel(this, 28, 72, 'THEATER  ·  EUROPE', 12, '#6f829c');
    }

    private buildLabels() {
        for (const region of REGIONS) {
            const c = centroid(region.points);
            const text = this.add
                .text(c.x, c.y, region.short, {
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: '11px',
                    color: '#f4f7fb',
                    fontStyle: 'bold',
                    align: 'center',
                })
                .setOrigin(0.5);
            this.labels.push(text);
        }
    }

    private buildPanel() {
        addPanel(this, 708, 64, 300, 648);
        this.regionTitle = addLabel(this, 858, 80, 'NO THEATER', 16, '#f4f7fb', 0.5, 0);
        this.regionMeta = addLabel(this, 724, 108, 'Tap a region on the map.', 13, '#9aa8bd');
        this.regionMeta.setWordWrapWidth(268);

        this.add.rectangle(724, 168, 268, 10, 0x1b2436).setOrigin(0, 0);
        this.leanFill = this.add.rectangle(858, 168, 4, 10, 0xe2c36b).setOrigin(0.5, 0);

        ACTIONS.forEach((action, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = 784 + col * 148;
            const y = 214 + row * 58;
            addButton(this, x, y, 136, 46, actionLabel(action.type), action.fill, () => this.onAction(action.type));
        });

        addButton(this, 858, 400, 268, 46, 'END SEASON', 0x243044, () => this.onEndTurn());

        addLabel(this, 724, 430, 'SITREP LOG', 12, '#6f829c');
        this.logText = addLabel(this, 724, 450, '', 12, '#c5d0e0');
        this.logText.setWordWrapWidth(268);
        this.logText.setLineSpacing(4);

        this.banner = addLabel(this, 858, 668, '', 13, '#d4a017', 0.5, 0.5);
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
        this.state = applyOrder(this.state, { type, regionId: this.selected });
        this.renderAll();
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
        this.state = applyOrder(this.state, order);
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
        const you = factionName(this.state.player);
        const foe = factionName(opponent(this.state.player));
        this.hudSeason.setText(seasonName(this.state.turn).toUpperCase());
        this.hudAp.setText(`AP ${this.state.ap}/${this.state.maxAp}`);
        this.hudEnergy.setText(`NRG EU ${Math.round(this.state.energyEu)}  RU ${Math.round(this.state.energyRu)}`);
        this.hudHeat.setText(`HEAT ${Math.round(this.state.heat)}`);
        this.hudScore.setText(`EU ${countControlled(this.state, 'eu')}  RU ${countControlled(this.state, 'ru')}  ${you} vs ${foe}`);
        this.heatFill.width = Math.max(8, (680 * this.state.heat) / 100);
        this.heatFill.setFillStyle(this.state.heat > 72 ? 0xe85d04 : 0xd4a017);

        const selected = this.selected ? this.state.regions[this.selected] : undefined;
        const def = REGIONS.find((region) => region.id === this.selected);
        if (selected && def) {
            const control = controlOf(selected.lean);
            this.regionTitle.setText(def.name.toUpperCase());
            this.regionMeta.setText(
                `${controlLabel(control)}   lean ${fmt(selected.lean)}\nShield ${selected.shield} · value ${def.value}`,
            );
            this.regionMeta.setColor(controlColor(control));
            const width = Math.max(6, (Math.abs(selected.lean) / 100) * 268);
            this.leanFill.width = width;
            this.leanFill.setFillStyle(leanTint(selected.lean));
        } else {
            this.regionTitle.setText('NO THEATER');
            this.regionMeta.setText('Tap a region on the map.');
            this.regionMeta.setColor('#9aa8bd');
            this.leanFill.width = 4;
        }

        this.logText.setText(this.state.log.slice(-8).join('\n'));
        this.labels.forEach((label, index) => {
            const region = REGIONS[index];
            const lean = this.state.regions[region.id].lean;
            const control = controlOf(lean);
            label.setText(`${region.short}\n${fmt(lean)}`);
            label.setColor(control === 'contested' ? '#f4f7fb' : '#0b1220');
        });
    }

    private drawMap() {
        const g = this.mapGfx;
        g.clear();
        for (const region of REGIONS) {
            const lean = this.state.regions[region.id].lean;
            const selected = region.id === this.selected;
            g.fillStyle(leanTint(lean), selected ? 0.98 : 0.88);
            g.lineStyle(selected ? 3 : 1, selected ? 0xf4f7fb : 0x0b1220, 1);
            path(g, region.points);
            g.fillPath();
            path(g, region.points);
            g.strokePath();
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
