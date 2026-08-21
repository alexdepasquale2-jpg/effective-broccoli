import { Scene } from 'phaser';
import type { Faction } from '../sim/types';
import { addButton, addLabel } from '../view/ui';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x0b1220);
        this.drawGrid();

        addLabel(this, 512, 46, 'CLASSIFIED  //  SITREP  //  FICTIONAL THEATER', 13, '#6f829c', 0.5, 0.5);
        addLabel(this, 512, 92, 'WARM WAR 2026', 46, '#f3efe4', 0.5, 0.5).setStroke('#0b1220', 8);
        addLabel(this, 512, 138, 'RUSSIA  ·  EUROPE  ·  HYBRID THEATER', 16, '#d4a017', 0.5, 0.5);

        const briefing =
            'Winter 2026. No one has declared the wider war. The fight is for grids, narratives,\n' +
            'pipelines, and the nerve of governments. Take a side. Win the continent without\n' +
            'lighting the match — if Heat hits 100, the warm war goes hot and nobody wins.';
        addLabel(this, 512, 198, briefing, 15, '#c5d0e0', 0.5, 0.5).setAlign('center');

        this.factionCard(150, 268, 'eu', 'EUROPEAN COALITION', 0x2a3a22, 0xd4a017, [
            'Hold eight theaters and the pipes.',
            'Feed the line: supplies, LNG, depots.',
            'Troops and drones in Ukraine/Baltics.',
            'STRIKE only if Heat can take it.',
        ]);
        this.factionCard(538, 268, 'ru', 'RUSSIAN FEDERATION', 0x3a1c22, 0xe07070, [
            'Split the map without a hot war.',
            'Squeeze pipelines. Cut supply lines.',
            'Missiles and troops on the seam.',
            'Force a bargain before the clock.',
        ]);

        addLabel(
            this,
            512,
            628,
            'Each season: 3 ops. SHAPE · GRID (pipes) · NET (cut lines) · HOLD · TROOPS · DRONE · STRIKE · TALK',
            13,
            '#8b9bb4',
            0.5,
            0.5,
        );
        addLabel(this, 512, 658, 'Tap a command. 8 seasons. Control 8 theaters. Do not trip Hot War.', 14, '#e8eef7', 0.5, 0.5);
        addLabel(this, 512, 730, 'A strategy game. Not a forecast.', 12, '#5e6e84', 0.5, 0.5);
    }

    private factionCard(
        x: number,
        y: number,
        faction: Faction,
        title: string,
        fill: number,
        accent: number,
        lines: string[],
    ) {
        const card = this.add.rectangle(x, y, 336, 300, fill, 0.96).setOrigin(0, 0).setStrokeStyle(2, accent);
        addLabel(this, x + 168, y + 28, title, 16, '#f4f7fb', 0.5, 0.5);
        lines.forEach((line, index) => {
            addLabel(this, x + 24, y + 64 + index * 28, `▸  ${line}`, 14, '#d5deea');
        });
        addButton(this, x + 168, y + 248, 220, 48, 'TAKE COMMAND', accent, () => this.startGame(faction));
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => this.startGame(faction));
    }

    private startGame(faction: Faction) {
        this.registry.set('player', faction);
        this.scene.start('Game');
    }

    private drawGrid() {
        const g = this.add.graphics();
        g.lineStyle(1, 0x1a2a40, 0.7);
        for (let x = 0; x <= 1024; x += 32) {
            g.lineBetween(x, 0, x, 768);
        }
        for (let y = 0; y <= 768; y += 32) {
            g.lineBetween(0, y, 1024, y);
        }
        const scan = this.add.rectangle(512, -20, 1024, 28, 0x2ec4b6, 0.07);
        this.tweens.add({
            targets: scan,
            y: 800,
            duration: 4200,
            repeat: -1,
        });
    }
}
