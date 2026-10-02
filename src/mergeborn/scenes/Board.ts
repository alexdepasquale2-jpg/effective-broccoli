import { GameObjects, Scene } from 'phaser';
import { BOARD_SIZE, BOARD_STRIDE, KILLS_PER_STAGE, POWER_TILE, WIDTH } from '../sim/constants.ts';
import { loadGame, persistGame } from '../sim/save.ts';
import {
    UPGRADES,
    boardCols,
    boardDps,
    buyUpgrade,
    canUpgrade,
    comboMult,
    enemyMaxHp,
    enemyTrait,
    has,
    isBoss,
    isOpen,
    moveCard,
    multiSummonCount,
    nextUnlock,
    summon,
    summonCost,
    tap,
    tapDamage,
    tick,
    upgradeCost,
} from '../sim/state.ts';
import type { GameState, Kill, Trait, UpgradeKey } from '../sim/state.ts';

/** Rarity ladder, same as the visual plan. Tiers past 6 cycle. */
const TIER_COLORS = [0xa7adbf, 0x4fd18b, 0x4fa3ff, 0xb07cff, 0xffc24a, 0xff5a8a];
const tierColor = (tier: number) => TIER_COLORS[(tier - 1) % TIER_COLORS.length];
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

const BG = 0x11131a;
const CARD = 0x1f2330;
const LINE = 0x2e3344;
const GOLD = 0xffc24a;
const GREEN = 0x4fd18b;
const PINK = 0xff5a8a;
const FG = '#e9e7f2';
const MUTED = '#9a9cb3';
const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';
const DISPLAY = '"Arial Black", system-ui, sans-serif';

const GRID_W = 556;
const GAP = 12;
const GRID_X = (WIDTH - GRID_W) / 2;
const GRID_Y = 510;
const ENEMY_X = WIDTH / 2;
const ENEMY_Y = 290;
const UPGRADE_ORDER: UpgradeKey[] = ['tap', 'summon', 'battle', 'merge'];
const TRAIT_TEXT: Record<Trait, string> = {
    none: '',
    shield: 'SHIELD · board dmg ×0.5',
    regen: 'REGEN · heals 3%/s',
    split: 'SPLIT · returns once',
};

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

interface Button {
    box: GameObjects.Rectangle;
    text: GameObjects.Text;
}

export class Board extends Scene {
    private state: GameState;
    private cols = 0;
    private cell = 0;
    private slots: GameObjects.Rectangle[] = [];
    private cards: GameObjects.Container[] = [];
    private goldText: GameObjects.Text;
    private stageText: GameObjects.Text;
    private pips: GameObjects.Rectangle[] = [];
    private enemy: GameObjects.Container;
    private enemyFrame: GameObjects.Rectangle;
    private enemyLabel: GameObjects.Text;
    private traitText: GameObjects.Text;
    private comboText: GameObjects.Text;
    private hpBar: GameObjects.Rectangle;
    private hpText: GameObjects.Text;
    private timerText: GameObjects.Text;
    private dpsText: GameObjects.Text;
    private upgradeBtns = new Map<UpgradeKey, Button>();
    private summonOne: Button;
    private summonMany: Button;
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
        this.drawUpgrades();
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

    private button(x: number, y: number, w: number, h: number, color: number, size: string, onDown: () => void): Button {
        const box = this.add.rectangle(x, y, w, h, color).setInteractive({ useHandCursor: true });
        const text = this.add.text(x, y, '', { fontFamily: DISPLAY, fontSize: size, color: '#11131a', align: 'center' }).setOrigin(0.5);
        box.on('pointerdown', onDown);
        return { box, text };
    }

    private drawHud() {
        this.goldText = this.add.text(WIDTH / 2, 48, '', { fontFamily: DISPLAY, fontSize: '42px', color: hex(GOLD) }).setOrigin(0.5);
        this.stageText = this.add.text(WIDTH / 2, 94, '', { fontFamily: FONT, fontSize: '18px', color: MUTED, align: 'center' }).setOrigin(0.5);
        const pipW = 40;
        const x0 = WIDTH / 2 - (KILLS_PER_STAGE * (pipW + 6) - 6) / 2 + pipW / 2;
        for (let i = 0; i < KILLS_PER_STAGE; i++) {
            this.pips.push(this.add.rectangle(x0 + i * (pipW + 6), 126, pipW, 8, LINE));
        }
    }

    private drawEnemy() {
        this.enemyFrame = this.add.rectangle(0, 0, 200, 250, CARD).setStrokeStyle(4, PINK);
        this.enemyLabel = this.add.text(0, -20, '', { fontFamily: DISPLAY, fontSize: '28px', color: FG, align: 'center' }).setOrigin(0.5);
        this.traitText = this.add.text(0, 50, '', { fontFamily: FONT, fontSize: '14px', color: hex(GOLD), align: 'center', wordWrap: { width: 180 } }).setOrigin(0.5);
        const hint = this.add.text(0, 100, 'TAP', { fontFamily: FONT, fontSize: '15px', color: MUTED }).setOrigin(0.5);
        this.enemy = this.add.container(ENEMY_X, ENEMY_Y, [this.enemyFrame, this.enemyLabel, this.traitText, hint]);
        this.enemy.setSize(200, 250).setInteractive({ useHandCursor: true });
        this.enemy.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p));

        this.comboText = this.add.text(ENEMY_X - 190, ENEMY_Y, '', { fontFamily: DISPLAY, fontSize: '32px', color: hex(GREEN) }).setOrigin(0.5);
        this.timerText = this.add.text(ENEMY_X + 190, ENEMY_Y, '', { fontFamily: DISPLAY, fontSize: '32px', color: hex(GOLD) }).setOrigin(0.5);
        this.add.rectangle(ENEMY_X, 440, 400, 18, LINE);
        this.hpBar = this.add.rectangle(ENEMY_X - 200, 440, 400, 18, PINK).setOrigin(0, 0.5);
        this.hpText = this.add.text(ENEMY_X, 464, '', { fontFamily: FONT, fontSize: '15px', color: MUTED }).setOrigin(0.5);
    }

    private drawBoard() {
        this.dpsText = this.add.text(GRID_X, GRID_Y - 18, '', { fontFamily: FONT, fontSize: '17px', color: MUTED }).setOrigin(0, 0.5);
        this.add.text(WIDTH - GRID_X, GRID_Y - 18, 'drag equal cards to merge', { fontFamily: FONT, fontSize: '14px', color: MUTED }).setOrigin(1, 0.5);
        for (let i = 0; i < BOARD_SIZE; i++) {
            this.slots.push(this.add.rectangle(0, 0, 10, 10, BG));
            const face = this.add.rectangle(0, 0, 10, 10, CARD);
            const label = this.add.text(0, 0, '', { fontFamily: DISPLAY, fontSize: '32px', color: FG }).setOrigin(0.5);
            const card = this.add.container(0, 0, [face, label]);
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
            const home = this.slotCenter(from);
            card.setDepth(0).setScale(1).setPosition(home.x, home.y);
            const to = this.slotAt(p.x, p.y);
            const gold = this.state.gold;
            if (to >= 0 && moveCard(this.state, from, to) === 'merge') {
                this.onMerge(to, this.state.gold - gold);
            }
            this.renderCards();
        });
        this.layoutBoard();
    }

    /** Sizes and places slots for the current board width (4×4, later 5×5). */
    private layoutBoard() {
        this.cols = boardCols(this.state);
        this.cell = (GRID_W - GAP * (this.cols - 1)) / this.cols;
        const power = has(this.state, 'board5');
        for (let i = 0; i < BOARD_SIZE; i++) {
            const open = isOpen(this.state, i);
            const { x, y } = this.slotCenter(i);
            const tile = power && i === POWER_TILE;
            this.slots[i].setVisible(open).setPosition(x, y).setSize(this.cell, this.cell);
            this.slots[i].setStrokeStyle(tile ? 4 : 2, tile ? GOLD : LINE);
            const card = this.cards[i];
            const [face, label] = card.list as [GameObjects.Rectangle, GameObjects.Text];
            face.setSize(this.cell - 10, this.cell - 10);
            label.setFontSize(Math.round(this.cell * 0.26));
            card.setPosition(x, y).setSize(this.cell - 10, this.cell - 10);
            card.removeInteractive();
            if (open) {
                card.setInteractive({ draggable: true, useHandCursor: true });
            }
        }
        this.renderCards();
    }

    private slotCenter(i: number) {
        const col = i % BOARD_STRIDE;
        const row = Math.floor(i / BOARD_STRIDE);
        return {
            x: GRID_X + col * (this.cell + GAP) + this.cell / 2,
            y: GRID_Y + row * (this.cell + GAP) + this.cell / 2,
        };
    }

    private slotAt(x: number, y: number): number {
        const col = Math.floor((x - GRID_X) / (this.cell + GAP));
        const row = Math.floor((y - GRID_Y) / (this.cell + GAP));
        if (col < 0 || col >= this.cols || row < 0 || row >= this.cols) {
            return -1;
        }
        return row * BOARD_STRIDE + col;
    }

    private drawUpgrades() {
        const w = 165;
        const gap = 8;
        const x0 = WIDTH / 2 - (UPGRADE_ORDER.length * (w + gap) - gap) / 2 + w / 2;
        UPGRADE_ORDER.forEach((key, i) => {
            const btn = this.button(x0 + i * (w + gap), 1110, w, 76, CARD, '15px', () => buyUpgrade(this.state, key));
            btn.box.setStrokeStyle(2, LINE);
            btn.text.setFontFamily(FONT).setColor(FG);
            this.upgradeBtns.set(key, btn);
        });
    }

    private drawSummon() {
        const doSummon = (count: number, btn: Button) => {
            const slots = summon(this.state, count);
            if (!slots.length) {
                this.tweens.add({ targets: btn.box, x: btn.box.x + 8, duration: 40, yoyo: true, repeat: 2 });
                return;
            }
            this.renderCards();
            for (const slot of slots) {
                const card = this.cards[slot];
                card.setScale(0.2);
                this.tweens.add({ targets: card, scale: 1, duration: 220, ease: 'Back.Out' });
                if (this.state.board[slot] > 1) {
                    this.burst(slot, tierColor(this.state.board[slot]));
                }
            }
        };
        // Single summon on the left; ×5 appears on the right once multi-summon unlocks.
        this.summonOne = this.button(WIDTH / 2 - 90, 1210, 500, 90, GREEN, '26px', () => doSummon(1, this.summonOne));
        this.summonMany = this.button(WIDTH / 2 + 260, 1210, 160, 90, GREEN, '20px', () =>
            doSummon(multiSummonCount(this.state), this.summonMany),
        );
    }

    private renderCards() {
        this.state.board.forEach((tier, i) => {
            const card = this.cards[i];
            card.setVisible(tier > 0 && isOpen(this.state, i));
            if (tier > 0) {
                const [face, label] = card.list as [GameObjects.Rectangle, GameObjects.Text];
                face.setStrokeStyle(4, tierColor(tier));
                label.setText(`T${tier}`).setColor(hex(tierColor(tier)));
            }
        });
    }

    private refresh() {
        const s = this.state;
        if (boardCols(s) !== this.cols) {
            this.layoutBoard();
        }
        this.goldText.setText(`${formatNum(s.gold)} gold`);
        const next = nextUnlock(s);
        this.stageText.setText(`Stage ${s.stage}` + (next ? `  ·  next unlock at stage ${next.stage}` : ''));
        this.pips.forEach((pip, i) => pip.setFillStyle(i < s.kills ? GREEN : i === KILLS_PER_STAGE - 1 ? 0x5a3044 : LINE));

        const boss = isBoss(s);
        const max = enemyMaxHp(s);
        const trait = enemyTrait(s);
        this.enemyLabel.setText(boss ? `BOSS\nStage ${s.stage}` : `Foe ${s.kills + 1}`);
        this.traitText.setText(TRAIT_TEXT[trait] + (trait === 'split' && s.split ? ' (split!)' : ''));
        this.enemyFrame.setStrokeStyle(boss ? 8 : 4, boss ? GOLD : PINK);
        this.hpBar.width = 400 * Math.max(0, s.enemyHp / max);
        this.hpText.setText(`${formatNum(Math.max(0, s.enemyHp))} / ${formatNum(max)} HP`);
        this.timerText.setText(boss ? `${Math.ceil(s.bossTimer)}s` : '');
        const combo = comboMult(s);
        this.comboText.setText(combo > 1 ? `×${combo.toFixed(1)}` : '');

        this.dpsText.setText(`Board ${formatNum(boardDps(s))} dps · tap ${formatNum(tapDamage(s))}`);

        for (const [key, btn] of this.upgradeBtns) {
            const open = canUpgrade(s, key);
            const cost = upgradeCost(s, key);
            btn.text.setText(open ? `${UPGRADES[key].label} ${s.upgrades[key]}\n${formatNum(cost)} gold` : `${UPGRADES[key].label}\nlocked`);
            btn.box.setAlpha(open && s.gold >= cost ? 1 : 0.45);
        }

        const full = !s.board.some((t, i) => t === 0 && isOpen(s, i));
        const multi = multiSummonCount(s);
        const affordable = !full && s.gold >= summonCost(s);
        this.summonMany.box.setVisible(multi > 1).setAlpha(affordable ? 1 : 0.4);
        this.summonMany.text.setVisible(multi > 1).setText(`×${multi}\n${formatNum(summonCost(s, multi))}`);
        this.summonOne.text.setText(full ? 'Board full: merge!' : `Summon · ${formatNum(summonCost(s))}`);
        this.summonOne.box.setAlpha(affordable ? 1 : 0.4).setX(multi > 1 ? WIDTH / 2 - 90 : WIDTH / 2);
        this.summonOne.text.setX(this.summonOne.box.x);
    }

    private onTap(p: Phaser.Input.Pointer) {
        const kill = tap(this.state);
        this.float(p.x, p.y - 20, `-${formatNum(tapDamage(this.state))}`, FG);
        this.tweens.add({ targets: this.enemy, scale: 0.95, duration: 50, yoyo: true });
        if (kill) {
            this.onKill(kill);
        }
    }

    private onKill(kill: Kill) {
        this.float(ENEMY_X, ENEMY_Y - 60, `+${formatNum(kill.gold)}`, hex(GOLD));
        if (kill.unlock) {
            this.cameras.main.flash(250, 255, 194, 74);
            this.toast(`Unlocked! ${kill.unlock.label}`, 4000);
        } else if (kill.boss) {
            this.cameras.main.shake(200, 0.01);
            this.toast(`Boss down! Stage ${this.state.stage}`);
        }
    }

    private onMerge(slot: number, gold: number) {
        const card = this.cards[slot];
        const tier = this.state.board[slot];
        this.tweens.add({ targets: card, scale: 1.25, duration: 90, yoyo: true, ease: 'Quad.Out' });
        this.cameras.main.shake(60 + tier * 15, 0.002 + tier * 0.0008);
        this.burst(slot, tierColor(tier));
        if (gold > 0) {
            const { x, y } = this.slotCenter(slot);
            this.float(x, y - 30, `+${formatNum(gold)}`, hex(GOLD));
        }
    }

    private burst(slot: number, color: number) {
        const { x, y } = this.slotCenter(slot);
        const ring = this.add.circle(x, y, 20).setStrokeStyle(6, color).setDepth(5);
        this.tweens.add({ targets: ring, radius: 90, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
    }

    private float(x: number, y: number, text: string, color: string) {
        const t = this.add.text(x, y, text, { fontFamily: DISPLAY, fontSize: '28px', color }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }

    private toast(text: string, ms = 2200) {
        const t = this.add.text(WIDTH / 2, 180, text, {
            fontFamily: FONT, fontSize: '22px', color: FG, backgroundColor: '#2e3344', padding: { x: 16, y: 10 },
            align: 'center', wordWrap: { width: 620 },
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 400, onComplete: () => t.destroy() });
    }
}
