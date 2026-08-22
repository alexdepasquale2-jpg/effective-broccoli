import { Scene } from 'phaser';
import { HEIGHT, WIDTH } from '../sim/constants.ts';
import { peekGame } from '../sim/save.ts';
import { chip } from '../view/chrome';
import { resolveEra } from '../view/era.ts';
import { blit, paletteFor, scanlines } from '../view/paint.ts';
import { ALL_CHAMP_IDS, champSheet, shiftSheet } from '../view/sprites.ts';
import { CHAMPIONS } from '../sim/champions.ts';
import { rumble, PATTERNS } from '../haptics';
import { Sfx } from '../audio';

export class Title extends Scene {
    private sfx = new Sfx();
    private gfx!: Phaser.GameObjects.Graphics;
    private pulse = 0;
    private era = resolveEra(undefined);

    constructor() {
        super('Title');
    }

    create() {
        const peek = peekGame();
        this.era = resolveEra(peek.trees.gui);
        this.sfx.richness = this.era.perfect ? 1 : this.era.sleek ? 0.7 : 0.25;
        this.cameras.main.setBackgroundColor(this.era.bg);
        this.gfx = this.add.graphics();
        const era = this.era;
        this.add
            .text(WIDTH / 2, 150, 'CANON LANE', {
                fontFamily: era.display,
                fontSize: era.sleek ? '62px' : '48px',
                color: era.ivory,
            })
            .setOrigin(0.5)
            .setStroke(era.goldHex, era.sleek ? 5 : 2);
        this.add
            .text(WIDTH / 2, 214, era.perfect ? 'THE PERFECT GAME' : 'BIBLICAL NAMES   ·   GREEK DOMAINS', {
                fontFamily: era.font,
                fontSize: '15px',
                color: era.goldHex,
            })
            .setOrigin(0.5);
        this.add
            .text(
                WIDTH / 2,
                300,
                era.portraits
                    ? 'An idle MOBA. Upgrade the screen itself.\nAtari cathode to the Perfect Game.\nSixteen champions. Nine thousand blessings.\nEverything can be upgraded — even the glass.'
                    : 'IDLE MOBA\nUPGRADE THE GUI\n9000 BLESSINGS PER TIER',
                {
                    fontFamily: era.display,
                    fontSize: era.sleek ? '20px' : '16px',
                    color: era.mute,
                    align: 'center',
                    lineSpacing: 8,
                },
            )
            .setOrigin(0.5);

        chip(this, 80, 720, 560, 72, era.wine, era.sleek ? 'ENTER THE LANE' : 'INSERT COIN', () => this.enter(), era);
        chip(this, 80, 812, 560, 52, era.sea, 'WARM WAR 2026', () => {
            rumble(PATTERNS.tap, 1);
            window.location.href = './?game=war';
        }, era);

        this.add
            .text(WIDTH / 2, 1184, era.perfect ? 'Nothing left to sand.' : 'Tap. Last-hit. Upgrade the screen.\nThe match keeps fighting after you pocket the phone.', {
                fontFamily: era.font,
                fontSize: '13px',
                color: era.mute,
                align: 'center',
            })
            .setOrigin(0.5);
        this.input.once('pointerdown', () => this.sfx.unlock());
    }

    update(_time: number, delta: number) {
        this.pulse += delta / 1000;
        const g = this.gfx;
        const era = this.era;
        g.clear();
        g.fillStyle(era.bg, 1);
        g.fillRect(0, 400, WIDTH, 280);
        const ids = ALL_CHAMP_IDS;
        for (let i = 0; i < ids.length; i += 1) {
            const x = ((this.pulse * 40 + i * 46) % (WIDTH + 80)) - 40;
            const y = 470 + Math.sin(this.pulse * 3 + i) * (era.bob + 6);
            const id = ids[i];
            const champ = CHAMPIONS.find((entry) => entry.id === id);
            let sheet = champSheet(id);
            if (era.frames >= 2 && Math.floor(this.pulse * 8 + i) % 2) {
                sheet = shiftSheet(sheet, 1);
            }
            if (!era.portraits) {
                g.fillStyle(champ?.color ?? era.gold, 1);
                g.fillRect(x - 8, y - 8, 16, 16);
            } else {
                blit(g, sheet, x, y, { ...era, pixel: 5 }, paletteFor(era, champ?.color ?? era.ally, era.gold), 1, 0);
            }
        }
        scanlines(g, 0, 0, WIDTH, HEIGHT, era.scanlines);
    }

    private enter() {
        this.sfx.unlock();
        this.sfx.upgrade();
        rumble(PATTERNS.tier, 2);
        this.scene.start('Arena');
    }
}
