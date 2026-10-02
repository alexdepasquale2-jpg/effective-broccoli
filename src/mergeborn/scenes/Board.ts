import { GameObjects, Scene } from 'phaser';
import { BOARD_COLS, BOARD_SIZE, KILLS_PER_STAGE, WIDTH } from '../sim/constants.ts';
import { loadGame, persistGame } from '../sim/save.ts';
import {
    boardDps,
    enemyMaxHp,
    isBoss,
    moveCard,
    summon,
    summonCost,
    tap,
    tapDamage,
    tick,
} from '../sim/state.ts';
import type { GameState, Kill } from '../sim/state.ts';

/** Rarity ladder, same as the visual plan. Tiers past 6 cycle. */
const TIER_COLORS = [0xa7adbf, 0x4fd18b, 0x4fa3ff, 0xb07cff, 0xffc24a, 0xff5a8a];
const tierColor = (tier: number) => TIER_COLORS[(tier - 1) % TIER_COLORS.length];
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

const BG = 0x11131a;
const CARD = 0x1f2330;
const LINE = 0x2e3344;
const FG = '#e9e7f2';
const MUTED = '#9a9cb3';
const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';
const DISPLAY = '"Arial Black", system-ui, sans-serif';

const CELL = 130;
const GAP = 12;
const GRID_X = (WIDTH - (BOARD_COLS * CELL + (BOARD_COLS - 1) * GAP)) / 2;
const GRID_Y = 570;
const ENEMY_X = WIDTH / 2;
const ENEMY_Y = 330;

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
export function formatNum(n: number): string {
    if (n < 1000) {
        return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
    }
    const exp = Math.floor(Math.log10(n) / 3);
    if (exp >= SUFFIXES.length) {
        return n.toExponential(2).replace('+', '');
    }
    return (n / 1000 ** exp).toFixed(2).replace(/\.?0+$/, '') + SUFFIXES[exp];
}

const slotCenter = (i: number) => ({
    x: GRID_X + (i % BOARD_COLS) * (CELL + GAP) + CELL / 2,
    y: GRID_Y + Math.floor(i / BOARD_COLS) * (CELL + GAP) + CELL / 2,
});

export class Board extends Scene {
    private state: GameState;
    private cards: GameObjects.Container[] = [];
    private goldText: GameObjects.Text;
    private stageText: GameObjects.Text;
    private pips: GameObjects.Rectangle[] = [];
    private enemy: GameObjects.Container;
    private enemyFrame: GameObjects.Rectangle;
    private enemyLabel: GameObjects.Text;
    private hpBar: GameObjects.Rectangle;
    private hpText: GameObjects.Text;
    private timerText: GameObjects.Text;
    private dpsText: GameObjects.Text;
    private summonBtn: GameObjects.Rectangle;
    private summonText: GameObjects.Text;
    private saveClock = 0;

    constructor() {
        super('Board');
    }

    create() {
        const { state, offline } = loadGame();
        this.state = state;
        this.cameras.main.setBackgroundColor(BG);

        this.drawHud();
        this.drawEnemy();
        this.drawBoard();
        this.drawSummon();

        if (offline.gold > 0) {
            this.toast(`While you were away: +${formatNum(offline.gold)} gold`);
        }
        const save = () => persistGame(this.state);
        document.addEventListener('visibilitychange', () => document.hidden && save());
        window.addEventListener('pagehide', save);
        this.refresh();
    }

    update(_time: number, delta: number) {
        const dt = Math.min(delta / 1000, 1);
        for (const kill of tick(this.state, dt)) {
            this.onKill(kill);
        }
        this.saveClock += dt;
        if (this.saveClock > 5) {
            this.saveClock = 0;
            persistGame(this.state);
        }
        this.refresh();
    }

    private drawHud() {
        this.goldText = this.add.text(WIDTH / 2, 56, '', { fontFamily: DISPLAY, fontSize: '44px', color: '#ffc24a' }).setOrigin(0.5);
        this.stageText = this.add.text(WIDTH / 2, 108, '', { fontFamily: FONT, fontSize: '20px', color: MUTED }).setOrigin(0.5);
        const pipW = 40;
        const x0 = WIDTH / 2 - (KILLS_PER_STAGE * (pipW + 6) - 6) / 2 + pipW / 2;
        for (let i = 0; i < KILLS_PER_STAGE; i++) {
            this.pips.push(this.add.rectangle(x0 + i * (pipW + 6), 140, pipW, 8, LINE).setOrigin(0.5));
        }
    }

    private drawEnemy() {
        this.enemyFrame = this.add.rectangle(0, 0, 240, 300, CARD).setStrokeStyle(4, 0xff5a8a);
        this.enemyLabel = this.add.text(0, -20, '', { fontFamily: DISPLAY, fontSize: '30px', color: FG, align: 'center' }).setOrigin(0.5);
        const hint = this.add.text(0, 110, 'TAP', { fontFamily: FONT, fontSize: '16px', color: MUTED }).setOrigin(0.5);
        this.enemy = this.add.container(ENEMY_X, ENEMY_Y, [this.enemyFrame, this.enemyLabel, hint]);
        this.enemy.setSize(240, 300).setInteractive({ useHandCursor: true });
        this.enemy.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p));

        this.add.rectangle(ENEMY_X, 494, 400, 18, LINE);
        this.hpBar = this.add.rectangle(ENEMY_X - 200, 494, 400, 18, 0xff5a8a).setOrigin(0, 0.5);
        this.hpText = this.add.text(ENEMY_X, 518, '', { fontFamily: FONT, fontSize: '16px', color: MUTED }).setOrigin(0.5);
        this.timerText = this.add.text(ENEMY_X + 150, ENEMY_Y - 130, '', { fontFamily: DISPLAY, fontSize: '26px', color: '#ffc24a' }).setOrigin(0.5);
    }

    private drawBoard() {
        this.dpsText = this.add.text(GRID_X, GRID_Y - 22, '', { fontFamily: FONT, fontSize: '18px', color: MUTED }).setOrigin(0, 0.5);
        this.add.text(WIDTH - GRID_X, GRID_Y - 22, 'drag two equal cards to merge', { fontFamily: FONT, fontSize: '14px', color: MUTED }).setOrigin(1, 0.5);
        for (let i = 0; i < BOARD_SIZE; i++) {
            const { x, y } = slotCenter(i);
            this.add.rectangle(x, y, CELL, CELL, BG).setStrokeStyle(2, LINE);
            const face = this.add.rectangle(0, 0, CELL - 10, CELL - 10, CARD).setStrokeStyle(4, 0xffffff);
            const label = this.add.text(0, 0, '', { fontFamily: DISPLAY, fontSize: '34px', color: FG }).setOrigin(0.5);
            const card = this.add.container(x, y, [face, label]).setSize(CELL - 10, CELL - 10);
            card.setInteractive({ draggable: true, useHandCursor: true });
            card.setData('slot', i);
            this.cards.push(card);
        }
        this.input.on('dragstart', (_p: Phaser.Input.Pointer, card: GameObjects.Container) => {
            card.setDepth(10).setScale(1.08);
        });
        this.input.on('drag', (_p: Phaser.Input.Pointer, card: GameObjects.Container, x: number, y: number) => {
            card.setPosition(x, y);
        });
        this.input.on('dragend', (p: Phaser.Input.Pointer, card: GameObjects.Container) => {
            const from = card.getData('slot') as number;
            const home = slotCenter(from);
            card.setDepth(0).setScale(1).setPosition(home.x, home.y);
            const to = this.slotAt(p.x, p.y);
            if (to >= 0 && moveCard(this.state, from, to) === 'merge') {
                this.onMerge(to);
            }
            this.renderCards();
        });
        this.renderCards();
    }

    private drawSummon() {
        this.summonBtn = this.add.rectangle(WIDTH / 2, 1210, 420, 90, 0x4fd18b).setInteractive({ useHandCursor: true });
        this.summonText = this.add.text(WIDTH / 2, 1210, '', { fontFamily: DISPLAY, fontSize: '28px', color: '#11131a', align: 'center' }).setOrigin(0.5);
        this.summonBtn.on('pointerdown', () => {
            const slot = summon(this.state);
            if (slot < 0) {
                this.tweens.add({ targets: this.summonBtn, x: WIDTH / 2 + 8, duration: 40, yoyo: true, repeat: 2 });
                return;
            }
            this.renderCards();
            const card = this.cards[slot];
            card.setScale(0.2);
            this.tweens.add({ targets: card, scale: 1, duration: 220, ease: 'Back.Out' });
        });
    }

    private slotAt(x: number, y: number): number {
        const col = Math.floor((x - GRID_X) / (CELL + GAP));
        const row = Math.floor((y - GRID_Y) / (CELL + GAP));
        if (col < 0 || col >= BOARD_COLS || row < 0 || row * BOARD_COLS + col >= BOARD_SIZE) {
            return -1;
        }
        return row * BOARD_COLS + col;
    }

    private renderCards() {
        this.state.board.forEach((tier, i) => {
            const card = this.cards[i];
            card.setVisible(tier > 0);
            if (tier > 0) {
                const [face, label] = card.list as [GameObjects.Rectangle, GameObjects.Text];
                face.setStrokeStyle(4, tierColor(tier));
                label.setText(`T${tier}`).setColor(hex(tierColor(tier)));
            }
        });
    }

    private refresh() {
        const s = this.state;
        this.goldText.setText(`${formatNum(s.gold)} gold`);
        this.stageText.setText(`Stage ${s.stage}`);
        this.pips.forEach((pip, i) => pip.setFillStyle(i < s.kills ? 0x4fd18b : i === KILLS_PER_STAGE - 1 ? 0x5a3044 : LINE));

        const boss = isBoss(s);
        const max = enemyMaxHp(s);
        this.enemyLabel.setText(boss ? `BOSS\nStage ${s.stage}` : `Foe ${s.kills + 1}`);
        this.enemyFrame.setStrokeStyle(boss ? 8 : 4, boss ? 0xffc24a : 0xff5a8a);
        this.hpBar.width = 400 * Math.max(0, s.enemyHp / max);
        this.hpText.setText(`${formatNum(Math.max(0, s.enemyHp))} / ${formatNum(max)} HP`);
        this.timerText.setText(boss ? `${Math.ceil(s.bossTimer)}s` : '');

        this.dpsText.setText(`Board ${formatNum(boardDps(s))} dps · tap ${formatNum(tapDamage(s))}`);
        const cost = summonCost(s);
        const full = !s.board.includes(0);
        this.summonText.setText(full ? 'Board full: merge!' : `Summon · ${formatNum(cost)}`);
        this.summonBtn.setAlpha(!full && s.gold >= cost ? 1 : 0.4);
    }

    private onTap(p: Phaser.Input.Pointer) {
        const dmg = tapDamage(this.state);
        const kill = tap(this.state);
        this.float(p.x, p.y - 20, `-${formatNum(dmg)}`, FG);
        this.tweens.add({ targets: this.enemy, scale: 0.95, duration: 50, yoyo: true });
        if (kill) {
            this.onKill(kill);
        }
    }

    private onKill(kill: Kill) {
        this.float(ENEMY_X, ENEMY_Y - 60, `+${formatNum(kill.gold)}`, '#ffc24a');
        if (kill.boss) {
            this.cameras.main.shake(200, 0.01);
            this.toast(`Boss down! Stage ${this.state.stage}`);
        }
    }

    private onMerge(slot: number) {
        const card = this.cards[slot];
        const tier = this.state.board[slot];
        this.tweens.add({ targets: card, scale: 1.25, duration: 90, yoyo: true, ease: 'Quad.Out' });
        this.cameras.main.shake(60 + tier * 15, 0.002 + tier * 0.0008);
        const { x, y } = slotCenter(slot);
        const ring = this.add.circle(x, y, 20).setStrokeStyle(6, tierColor(tier));
        this.tweens.add({ targets: ring, radius: 90, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
    }

    private float(x: number, y: number, text: string, color: string) {
        const t = this.add.text(x, y, text, { fontFamily: DISPLAY, fontSize: '28px', color }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }

    private toast(text: string) {
        const t = this.add.text(WIDTH / 2, 200, text, {
            fontFamily: FONT, fontSize: '22px', color: FG, backgroundColor: '#2e3344', padding: { x: 16, y: 10 },
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => t.destroy() });
    }
}
