import { Scene } from 'phaser';
import { HEIGHT, WIDTH } from '../sim/constants.ts';
import { C, FONT, SANS } from '../view/theme';
import { chip } from '../view/chrome';
import { rumble, PATTERNS } from '../haptics';
import { Sfx } from '../audio';

export class Title extends Scene {
    private sfx = new Sfx();

    constructor() {
        super('Title');
    }

    create() {
        this.cameras.main.setBackgroundColor(C.bg);
        this.drawTemple();
        this.add
            .text(WIDTH / 2, 168, 'CANON LANE', {
                fontFamily: FONT,
                fontSize: '64px',
                color: C.ivory,
            })
            .setOrigin(0.5)
            .setStroke('#c9a227', 4);
        this.add
            .text(WIDTH / 2, 236, 'BIBLICAL NAMES   ·   GREEK DOMAINS', {
                fontFamily: SANS,
                fontSize: '16px',
                color: '#e2c36b',
            })
            .setOrigin(0.5);
        this.add
            .text(
                WIDTH / 2,
                320,
                'An idle MOBA. Three lanes. Sixteen champions.\nNine thousand named blessings in every tier.\nTiers ascend. Everything upgrades.\nThe grind is meant to feel like a hand on a bowstring.',
                {
                    fontFamily: FONT,
                    fontSize: '20px',
                    color: '#c8bfd4',
                    align: 'center',
                    lineSpacing: 8,
                },
            )
            .setOrigin(0.5);

        chip(this, 80, 560, 560, 72, 0x6b2d3c, 'ENTER THE LANE', () => this.enter());
        chip(this, 80, 656, 560, 56, 0x1a5276, 'WARM WAR 2026', () => {
            rumble(PATTERNS.tap, 1);
            window.location.href = './?game=war';
        });

        this.add
            .text(WIDTH / 2, 1188, 'Tap a lane. Last-hit the wave. Buy the next blessing.\nThe match keeps fighting after you pocket the phone.', {
                fontFamily: SANS,
                fontSize: '14px',
                color: '#8b80a0',
                align: 'center',
            })
            .setOrigin(0.5);
        this.input.once('pointerdown', () => this.sfx.unlock());
    }

    private enter() {
        this.sfx.unlock();
        this.sfx.upgrade();
        rumble(PATTERNS.tier, 2);
        this.scene.start('Arena');
    }

    private drawTemple() {
        const g = this.add.graphics();
        g.fillStyle(0x120e1a, 1);
        g.fillRect(0, 0, WIDTH, HEIGHT);
        g.lineStyle(1, 0x2a2038, 0.8);
        for (let x = 0; x <= WIDTH; x += 40) {
            g.lineBetween(x, 0, x, HEIGHT);
        }
        for (let y = 0; y <= HEIGHT; y += 40) {
            g.lineBetween(0, y, WIDTH, y);
        }
        g.fillStyle(0x1c1528, 1);
        g.fillRect(36, 84, 648, 1040);
        g.lineStyle(2, 0xc9a227, 0.45);
        g.strokeRect(36, 84, 648, 1040);
        for (const x of [70, 170, 550, 650]) {
            g.fillStyle(0x2a2038, 1);
            g.fillRect(x - 14, 100, 28, 1000);
            g.fillStyle(0xe2c36b, 0.35);
            g.fillRect(x - 16, 92, 32, 18);
            g.fillRect(x - 16, 1090, 32, 18);
        }
        const scan = this.add.rectangle(WIDTH / 2, 0, WIDTH, 18, 0xe2c36b, 0.06);
        this.tweens.add({ targets: scan, y: HEIGHT, duration: 5200, repeat: -1 });
    }
}
