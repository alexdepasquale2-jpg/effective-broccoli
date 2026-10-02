import { Display, GameObjects, Scene } from 'phaser';
import { ERA_STAGE, BOARD_SIZE, BOARD_STRIDE, KILLS_PER_STAGE, POWER_TILE, WIDTH } from '../sim/constants.ts';
import { loadGame, persistGame } from '../sim/save.ts';
import { sfx, unlockAudio } from '../audio.ts';
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
    SHOP,
    buyShop,
    canShuffle,
    essenceGain,
    goals,
    ascend,
    canAscend,
    enemyElement,
    heroOnBoard,
    ERAS,
    canEra,
    isHex,
    nextEra,
    shopCost,
    shuffle,
    summon,
    summonCost,
    tap,
    tapDamage,
    tick,
    upgradeCost,
} from '../sim/state.ts';
import { ELEMENTS, HEROES, heroById } from '../sim/heroes.ts';
import type { GameState, Kill, ShopKey, Trait, UpgradeKey } from '../sim/state.ts';

/** Rarity ladder, same as the visual plan. Tiers past 6 cycle. */
const TIER_COLORS = [0xa7adbf, 0x4fd18b, 0x4fa3ff, 0xb07cff, 0xffc24a, 0xff5a8a];
/** Element colours by id (0 = neutral), matching the hero card frames. */
const ELEM_COLORS = [0x2e3344, 0xff7a2a, 0x4fa3ff, 0x9ccc65, 0xb8e6ff, 0xffe08a, 0xb07cff];
const ELEM_GLYPH = ['', '🔥', '💧', '🪨', '🌪', '☀', '◐'];
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

/** The pieces of one board card, back to front. */
interface CardParts {
    glow: GameObjects.Image;
    face: GameObjects.Rectangle;
    wash: GameObjects.Rectangle;
    art: GameObjects.Image;
    shade: GameObjects.Rectangle;
    label: GameObjects.Text;
    name: GameObjects.Text;
    badge: GameObjects.Text;
    shine: GameObjects.Rectangle;
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
    private parts: CardParts[] = [];
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
    private ladder: { text: GameObjects.Text; track: GameObjects.Rectangle; bar: GameObjects.Rectangle }[] = [];
    private shopPanel: GameObjects.Container;
    private shopTitle: GameObjects.Text;
    private shopBtns = new Map<ShopKey, Button>();
    private shuffleBtn: Button;
    private shuffleArmed = 0;
    private ascendBtn: Button;
    private ascendArmed = 0;
    private hex = false;
    private boardSig = '';
    private wasBoss = false;
    private atmoEra = 0;
    private backdrop: GameObjects.Image;
    private fog: GameObjects.Image[] = [];
    private embers: GameObjects.Particles.ParticleEmitter;
    private enemyAura: GameObjects.Image;
    private comboFire: GameObjects.Particles.ParticleEmitter;
    private hitFlash: GameObjects.Rectangle;
    private eraBtn: Button;
    private eraArmed = 0;
    private heroPanel: GameObjects.Container;
    private heroTiles: { img: GameObjects.Image; lock: GameObjects.Text }[] = [];
    private heroTitle: GameObjects.Text;
    private heroZoom: GameObjects.Container;
    private heroZoomImg: GameObjects.Image;
    private heroZoomText: GameObjects.Text;

    constructor() {
        super('Board');
    }

    preload() {
        for (const h of HEROES) {
            this.load.image(`hero-${h.id}`, `assets/mergeborn/heroes/${h.id}.jpg`);
        }
    }

    create() {
        const { state, offline } = loadGame();
        this.state = state;
        this.cameras.main.setBackgroundColor(BG);
        this.makeFxTextures();
        this.drawAtmosphere();
        // Crop each hero card to its art window (the painted scene) for use on board tiles.
        for (const h of HEROES) {
            const tex = this.textures.get(`hero-${h.id}`);
            if (!tex.has('art')) {
                tex.add('art', 0, 15, 45, 270, 246);
            }
        }

        this.drawHud();
        this.drawEnemy();
        this.drawBoard();
        this.drawUpgrades();
        this.drawSummon();
        this.drawLadder();
        this.drawShop();
        this.drawHeroes();
        this.time.addEvent({ delay: 1400, loop: true, callback: () => this.shimmer() });
        this.input.once('pointerdown', unlockAudio);

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
        this.pulseCards();
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
        this.hitFlash = this.add.rectangle(0, 0, 200, 250, 0xffffff, 0);
        this.enemy = this.add.container(ENEMY_X, ENEMY_Y, [this.enemyFrame, this.hitFlash, this.enemyLabel, this.traitText, hint]);
        this.enemy.setSize(200, 250).setInteractive({ useHandCursor: true });
        this.enemy.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p));

        this.comboText = this.add.text(ENEMY_X + 190, ENEMY_Y + 50, '', { fontFamily: DISPLAY, fontSize: '32px', color: hex(GREEN) }).setOrigin(0.5);
        this.comboFire = this.add.particles(ENEMY_X + 190, ENEMY_Y + 70, 'glow', {
            speedY: { min: -160, max: -60 }, speedX: { min: -30, max: 30 }, scale: { start: 0.9, end: 0 },
            alpha: { start: 0.9, end: 0 }, lifespan: 600, blendMode: 'ADD', tint: [0xffe08a, 0xff7a2a, 0xff3a1a], frequency: 60,
            emitting: false,
        });
        this.timerText = this.add.text(ENEMY_X + 190, ENEMY_Y - 40, '', { fontFamily: DISPLAY, fontSize: '32px', color: hex(GOLD) }).setOrigin(0.5);
        this.add.rectangle(ENEMY_X, 440, 400, 18, LINE);
        this.hpBar = this.add.rectangle(ENEMY_X - 200, 440, 400, 18, PINK).setOrigin(0, 0.5);
        this.hpText = this.add.text(ENEMY_X, 464, '', { fontFamily: FONT, fontSize: '15px', color: MUTED }).setOrigin(0.5);
    }

    private drawBoard() {
        this.dpsText = this.add.text(GRID_X, GRID_Y - 18, '', { fontFamily: FONT, fontSize: '17px', color: MUTED }).setOrigin(0, 0.5);
        this.add.text(WIDTH - GRID_X, GRID_Y - 18, 'drag equal cards to merge', { fontFamily: FONT, fontSize: '14px', color: MUTED }).setOrigin(1, 0.5);
        for (let i = 0; i < BOARD_SIZE; i++) {
            this.slots.push(this.add.rectangle(0, 0, 10, 10, BG));
            const parts: CardParts = {
                glow: this.add.image(0, 0, 'glow').setBlendMode('ADD'),
                face: this.add.rectangle(0, 0, 10, 10, CARD),
                wash: this.add.rectangle(0, 0, 10, 10, CARD, 0),
                art: this.add.image(0, 0, 'glow'),
                shade: this.add.rectangle(0, 0, 10, 10, 0x000000, 0.6),
                label: this.add.text(0, 0, '', { fontFamily: DISPLAY, fontSize: '32px', color: FG, stroke: '#000', strokeThickness: 5 }).setOrigin(0.5),
                name: this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '13px', color: FG, fontStyle: 'bold' }).setOrigin(0.5),
                badge: this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '16px', color: FG }).setOrigin(0, 0),
                shine: this.add.rectangle(0, 0, 10, 10, 0xffffff, 0).setBlendMode('ADD'),
            };
            this.parts.push(parts);
            const card = this.add.container(0, 0, Object.values(parts));
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
            const result = to >= 0 ? moveCard(this.state, from, to) : 'none';
            if (result === 'merge') {
                this.onMerge(to, this.state.gold - gold);
            } else if (result === 'none' && to >= 0) {
                sfx.deny();
            }
            this.renderCards();
        });
        this.layoutBoard();
    }

    /** Sizes and places slots for the current board width (4×4, later 5×5). */
    private layoutBoard() {
        this.cols = boardCols(this.state);
        this.hex = isHex(this.state);
        // Hex rows shift half a cell, so cells shrink to keep the board width.
        this.cell = (GRID_W - GAP * (this.cols - 1)) / (this.cols + (this.hex ? 0.5 : 0));
        const power = has(this.state, 'board5');
        for (let i = 0; i < BOARD_SIZE; i++) {
            const open = isOpen(this.state, i);
            const { x, y } = this.slotCenter(i);
            const tile = power && i === POWER_TILE;
            this.slots[i].setVisible(open).setPosition(x, y).setSize(this.cell, this.cell);
            this.slots[i].setStrokeStyle(tile ? 4 : 2, tile ? GOLD : LINE);
            const card = this.cards[i];
            const p = this.parts[i];
            const w = this.cell - 10;
            p.glow.setDisplaySize(this.cell * 1.7, this.cell * 1.7);
            p.face.setSize(w, w);
            p.wash.setSize(w - 12, w - 12);
            p.art.setPosition(0, 0);
            p.shade.setSize(w - 8, w * 0.26).setPosition(0, w / 2 - w * 0.13 - 4);
            p.name.setPosition(0, w / 2 - w * 0.13 - 4).setFontSize(Math.max(11, Math.round(this.cell * 0.12)));
            p.badge.setPosition(-w / 2 + 6, -w / 2 + 4).setFontSize(Math.round(this.cell * 0.15));
            p.shine.setSize(w * 0.16, w - 4);
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
            x: GRID_X + col * (this.cell + GAP) + this.cell / 2 + (this.hex && row % 2 ? (this.cell + GAP) / 2 : 0),
            y: GRID_Y + row * (this.cell + GAP) + this.cell / 2,
        };
    }

    private slotAt(x: number, y: number): number {
        const row = Math.floor((y - GRID_Y) / (this.cell + GAP));
        const shift = this.hex && row % 2 ? (this.cell + GAP) / 2 : 0;
        const col = Math.floor((x - GRID_X - shift) / (this.cell + GAP));
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
                sfx.deny();
                return;
            }
            sfx.summon();
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
            const chi = this.state.chi[i];
            this.slots[i].setFillStyle(chi ? ELEM_COLORS[chi] : BG, chi ? 0.14 : 1);
            if (tier > 0) {
                const p = this.parts[i];
                const el = this.state.elem[i];
                const hero = heroById(this.state.hero[i]);
                const w = this.cell - 10;
                const tc = tierColor(tier);
                p.glow.setTint(hero ? GOLD : tc).setVisible(tier >= 3 || !!hero);
                p.face.setFillStyle(CARD).setStrokeStyle(hero ? 6 : 3 + Math.min(tier, 6) * 0.5, hero ? GOLD : tc);
                // Element wash: a coloured inner panel with a thin element-coloured frame.
                p.wash.setFillStyle(el ? ELEM_COLORS[el] : tc, el ? 0.28 : 0.08).setStrokeStyle(2, el ? ELEM_COLORS[el] : tc, el ? 0.8 : 0.25);
                p.art.setVisible(!!hero);
                p.shade.setVisible(!!hero);
                p.name.setVisible(!!hero).setText(hero ? hero.name.toUpperCase() : '').setScale(1);
                if (p.name.width > w - 12) {
                    p.name.setScale((w - 12) / p.name.width);
                }
                if (hero) {
                    p.art.setTexture(`hero-${hero.id}`, 'art').setDisplaySize(w - 8, w - 8);
                    p.label.setText(`T${tier}`).setFontSize(Math.round(this.cell * 0.17)).setPosition(w / 2 - this.cell * 0.17, -w / 2 + this.cell * 0.13);
                } else {
                    p.label.setText(`T${tier}`).setFontSize(Math.round(this.cell * (0.22 + Math.min(tier, 8) * 0.012))).setPosition(0, 0);
                }
                p.label.setColor(hex(tc));
                p.badge.setText(ELEM_GLYPH[el] + (hero ? '★' : ''));
            }
        });
    }

    private refresh() {
        const s = this.state;
        const sig = s.board.join() + s.elem.join() + s.hero.join();
        if (sig !== this.boardSig) {
            this.boardSig = sig;
            this.renderCards();
        }
        if (boardCols(s) !== this.cols || isHex(s) !== this.hex) {
            this.layoutBoard();
        }
        this.goldText.setText(`${formatNum(s.gold)} gold`);
        this.stageText.setText(`Era ${s.era} ${ERAS[s.era - 1].name}  ·  Stage ${s.stage}  ·  best ${s.bestStage}  ·  ${formatNum(s.essence)} Essence`);
        goals(s).forEach((g, i) => {
            this.ladder[i].text.setText(g.label).setVisible(true);
            this.ladder[i].track.setVisible(true);
            this.ladder[i].bar.setVisible(true).width = 220 * Math.min(1, g.progress);
            this.ladder[i].bar.setFillStyle(g.progress >= 1 ? GOLD : GREEN);
        });
        for (let i = goals(s).length; i < this.ladder.length; i++) {
            this.ladder[i].text.setVisible(false);
            this.ladder[i].track.setVisible(false);
            this.ladder[i].bar.setVisible(false);
        }
        if (this.shopPanel.visible) {
            this.refreshShop();
        }
        this.pips.forEach((pip, i) => pip.setFillStyle(i < s.kills ? GREEN : i === KILLS_PER_STAGE - 1 ? 0x5a3044 : LINE));

        const boss = isBoss(s);
        const max = enemyMaxHp(s);
        const trait = enemyTrait(s);
        const ee = enemyElement(s);
        const eName = ee ? `\n${ELEM_GLYPH[ee]} ${ELEMENTS[ee - 1].toUpperCase()}` : '';
        this.enemyLabel.setText((boss ? `BOSS\nStage ${s.stage}` : `Foe ${s.kills + 1}`) + eName);
        this.traitText.setText(TRAIT_TEXT[trait] + (trait === 'split' && s.split ? ' (split!)' : ''));
        this.enemyFrame.setStrokeStyle(boss ? 8 : 4, boss ? GOLD : ee ? ELEM_COLORS[ee] : PINK);
        this.hpBar.width = 400 * Math.max(0, s.enemyHp / max);
        this.hpText.setText(`${formatNum(Math.max(0, s.enemyHp))} / ${formatNum(max)} HP`);
        this.timerText.setText(boss ? `${Math.ceil(s.bossTimer)}s` : '');
        const combo = comboMult(s);
        this.comboText.setText(combo > 1 ? `×${combo.toFixed(1)}` : '');
        // Combo fire: hotter and faster as the chain grows.
        this.comboFire.emitting = combo > 1;
        this.comboFire.frequency = Math.max(12, 80 - s.combo * 6);
        this.comboText.setScale(1 + Math.max(0, combo - 1) * 0.6 + (combo > 1 ? Math.sin(this.time.now / 60) * 0.04 : 0));
        this.updateAtmosphere(boss, ee);
        if (boss && !this.wasBoss) {
            this.bossEntrance();
        }
        this.wasBoss = boss;

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
        const dmg = tapDamage(this.state);
        const kill = tap(this.state);
        sfx.tap();
        // Ifrit Duelist's 10th tap is a real ×10 crit; show it like one.
        const crit = heroOnBoard(this.state, 'ifrit-duelist') && this.state.taps % 10 === 0;
        this.damageNumber(p.x, p.y - 20, dmg * (crit ? 10 : 1), crit);
        this.hitFlash.setAlpha(crit ? 0.8 : 0.35);
        this.tweens.add({ targets: this.hitFlash, alpha: 0, duration: crit ? 220 : 90 });
        this.tweens.add({ targets: this.enemy, scale: crit ? 0.85 : 0.95, angle: (Math.random() - 0.5) * (crit ? 8 : 3), duration: 50, yoyo: true });
        this.burstFx(p.x, p.y, crit ? GOLD : 0xffffff, crit ? 30 : 5, crit ? 420 : 180, 380);
        if (crit) {
            this.cameras.main.shake(120, 0.008);
            sfx.merge(8);
        }
        if (kill) {
            this.onKill(kill);
        }
    }

    private onKill(kill: Kill) {
        this.float(ENEMY_X, ENEMY_Y - 60, `+${formatNum(kill.gold)}`, hex(GOLD));
        if (kill.turncoat !== undefined) {
            this.renderCards();
            this.burst(kill.turncoat, PINK);
        }
        this.shatter(kill.boss ? GOLD : PINK, kill.boss ? 18 : 9);
        this.burstFx(ENEMY_X, ENEMY_Y, kill.boss ? GOLD : PINK, kill.boss ? 70 : 22, kill.boss ? 520 : 320, kill.boss ? 1000 : 600);
        this.enemy.setScale(0.5).setAlpha(0);
        this.tweens.add({ targets: this.enemy, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out', delay: 80 });
        if (kill.boss) {
            sfx.fanfare();
        } else {
            sfx.kill();
        }
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
        this.time.delayedCall(90, () => this.burst(slot, 0xffffff));
        const c = this.slotCenter(slot);
        this.burstFx(c.x, c.y, tierColor(tier), 14 + tier * 6, 200 + tier * 40, 500 + tier * 40);
        const pop = this.add.text(c.x, c.y, `T${tier}!`, { fontFamily: DISPLAY, fontSize: `${30 + tier * 4}px`, color: hex(tierColor(tier)), stroke: '#000', strokeThickness: 6 })
            .setOrigin(0.5).setDepth(56).setScale(0.3);
        this.tweens.add({ targets: pop, scale: 1.2, duration: 160, ease: 'Back.Out', yoyo: true, hold: 200, onComplete: () => pop.destroy() });
        if (tier >= 5) {
            const col = Display.Color.IntegerToColor(tierColor(tier));
            this.cameras.main.flash(180 + tier * 20, col.red, col.green, col.blue);
        }
        sfx.merge(tier);
        if (gold > 0) {
            const { x, y } = this.slotCenter(slot);
            this.float(x, y - 30, `+${formatNum(gold)}`, hex(GOLD));
        }
    }

    /** High-tier and hero cards breathe a soft glow in their tier colour. */
    private pulseCards() {
        const t = this.time.now / 320;
        this.state.board.forEach((tier, i) => {
            const glow = this.parts[i].glow;
            if (glow.visible) {
                glow.setAlpha((0.12 + Math.min(tier, 10) * 0.035) * (0.75 + 0.25 * Math.sin(t + i)));
            }
        });
    }

    /** A light sweep runs across one random tier 4+ or hero card. */
    private shimmer() {
        const pick = this.state.board
            .map((tier, i) => ({ tier, i }))
            .filter(({ tier, i }) => (tier >= 4 || this.state.hero[i]) && isOpen(this.state, i));
        if (!pick.length) {
            return;
        }
        const { i } = pick[Math.floor(Math.random() * pick.length)];
        const shine = this.parts[i].shine;
        const w = this.cell - 10;
        shine.setPosition(-w / 2 + w * 0.08, 0).setAlpha(0);
        this.tweens.add({ targets: shine, x: w / 2 - w * 0.08, duration: 520, ease: 'Sine.InOut' });
        this.tweens.add({ targets: shine, alpha: 0.35, duration: 260, yoyo: true });
    }

    private sparks(x: number, y: number, color: number, count: number) {
        this.burstFx(x, y, color, count * 2, 420, 900);
    }

    /**
     * Atmosphere, behind everything: a dark painted backdrop, slow fog banks and rising embers
     * tinted by the current Era, a pulsing aura behind the enemy, and a vignette over the play area.
     */
    private drawAtmosphere() {
        if (!this.textures.exists('backdrop')) {
            const bd = this.textures.createCanvas('backdrop', WIDTH, 1280)!;
            const c = bd.getContext();
            const sky = c.createLinearGradient(0, 0, 0, 1280);
            sky.addColorStop(0, '#1a1c28');
            sky.addColorStop(0.45, '#101219');
            sky.addColorStop(1, '#07080c');
            c.fillStyle = sky;
            c.fillRect(0, 0, WIDTH, 1280);
            // Faint brickwork, brighter near the enemy, like a lit wall in a dark hall.
            for (let y = 0; y < 1280; y += 36) {
                for (let x = (y / 36) % 2 ? -45 : 0; x < WIDTH; x += 90) {
                    const d = Math.hypot(x + 45 - WIDTH / 2, y - 300);
                    c.strokeStyle = `rgba(255,255,255,${Math.max(0.012, 0.07 - d / 9000)})`;
                    c.strokeRect(x + 1, y + 1, 88, 34);
                }
            }
            const img = c.getImageData(0, 0, WIDTH, 1280);
            for (let i = 0; i < img.data.length; i += 4) {
                const n = (Math.random() - 0.5) * 10;
                img.data[i] += n;
                img.data[i + 1] += n;
                img.data[i + 2] += n;
            }
            c.putImageData(img, 0, 0);
            bd.refresh();

            const vg = this.textures.createCanvas('vignette', WIDTH, 1280)!;
            const v = vg.getContext();
            const r = v.createRadialGradient(WIDTH / 2, 600, 260, WIDTH / 2, 600, 900);
            r.addColorStop(0, 'rgba(0,0,0,0)');
            r.addColorStop(1, 'rgba(0,0,0,0.75)');
            v.fillStyle = r;
            v.fillRect(0, 0, WIDTH, 1280);
            vg.refresh();
        }
        this.backdrop = this.add.image(WIDTH / 2, 640, 'backdrop').setDepth(-10);
        for (let i = 0; i < 6; i++) {
            const f = this.add.image(Math.random() * WIDTH, 200 + Math.random() * 900, 'glow')
                .setDisplaySize(500 + Math.random() * 400, 160 + Math.random() * 120).setAlpha(0.07).setBlendMode('ADD').setDepth(-9);
            this.tweens.add({
                targets: f, x: f.x + (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 200), y: f.y + (Math.random() - 0.5) * 80,
                alpha: 0.03 + Math.random() * 0.06, duration: 9000 + Math.random() * 9000, yoyo: true, repeat: -1, ease: 'Sine.InOut',
            });
            this.fog.push(f);
        }
        this.embers = this.add.particles(0, 1300, 'glow', {
            x: { min: 0, max: WIDTH }, speedY: { min: -70, max: -25 }, speedX: { min: -12, max: 12 },
            scale: { min: 0.08, max: 0.3 }, alpha: { start: 0.7, end: 0 }, lifespan: { min: 9000, max: 16000 },
            frequency: 260, blendMode: 'ADD',
        }).setDepth(-8);
        this.embers.fastForward(14000); // start with embers already in the air
        this.enemyAura = this.add.image(ENEMY_X, ENEMY_Y, 'glow').setDisplaySize(520, 620).setBlendMode('ADD').setDepth(-7);
        this.add.image(WIDTH / 2, 640, 'vignette').setDepth(45);
    }

    /** Re-tints the atmosphere for the current Era, and the enemy aura for its element or boss state. */
    private updateAtmosphere(boss: boolean, enemyEl: number) {
        const s = this.state;
        if (s.era !== this.atmoEra) {
            this.atmoEra = s.era;
            const accent = [0xff7a2a, 0x9ccc65, 0xb07cff, 0xff5a8a, 0xffe08a][s.era - 1] ?? 0xff7a2a;
            this.backdrop.setTint(Display.Color.ValueToColor(accent).lighten(70).color);
            this.fog.forEach((f) => f.setTint(accent));
            this.embers.setParticleTint(accent);
        }
        const auraColor = boss ? 0xff3a5a : enemyEl ? ELEM_COLORS[enemyEl] : PINK;
        this.enemyAura.setTint(auraColor).setAlpha((boss ? 0.32 : 0.16) * (0.8 + 0.2 * Math.sin(this.time.now / (boss ? 140 : 420))));
    }

    /** Soft glow dot and shard textures, drawn once. */
    private makeFxTextures() {
        if (this.textures.exists('glow')) {
            return;
        }
        const g = this.add.graphics();
        for (let r = 16; r > 0; r -= 2) {
            g.fillStyle(0xffffff, 0.12 + (1 - r / 16) * 0.5).fillCircle(16, 16, r);
        }
        g.generateTexture('glow', 32, 32).clear();
        g.fillStyle(0xffffff, 1).fillTriangle(0, 0, 22, 6, 6, 26);
        g.generateTexture('shard', 22, 26).destroy();
    }

    /** Additive glowing particle burst. */
    private burstFx(x: number, y: number, color: number, count: number, speed = 300, life = 600) {
        const e = this.add.particles(0, 0, 'glow', {
            speed: { min: speed * 0.25, max: speed }, angle: { min: 0, max: 360 }, scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 }, lifespan: { min: life * 0.5, max: life }, blendMode: 'ADD', tint: [color, 0xffffff],
            gravityY: 220, emitting: false,
        }).setDepth(55);
        e.explode(count, x, y);
        this.time.delayedCall(life + 100, () => e.destroy());
    }

    /** The enemy card breaks into spinning shards. */
    private shatter(color: number, count: number) {
        for (let i = 0; i < count; i++) {
            const sh = this.add.image(ENEMY_X + (Math.random() - 0.5) * 160, ENEMY_Y + (Math.random() - 0.5) * 200, 'shard')
                .setTint(i % 3 ? 0x1f2330 : color).setDepth(54).setScale(1 + Math.random() * 1.5);
            const a = Math.atan2(sh.y - ENEMY_Y, sh.x - ENEMY_X);
            this.tweens.add({
                targets: sh, x: sh.x + Math.cos(a) * (120 + Math.random() * 160), y: sh.y + Math.sin(a) * 120 + 180,
                angle: (Math.random() - 0.5) * 720, alpha: 0, duration: 650 + Math.random() * 300, ease: 'Quad.In',
                onComplete: () => sh.destroy(),
            });
        }
    }

    /** Boss arrives: card slams down, red flash, warning banner sweeps across. */
    private bossEntrance() {
        this.enemy.setY(ENEMY_Y - 320).setScale(1.3);
        this.tweens.add({ targets: this.enemy, y: ENEMY_Y, scale: 1, duration: 420, ease: 'Bounce.Out' });
        this.time.delayedCall(260, () => {
            this.cameras.main.shake(260, 0.014);
            this.burstFx(ENEMY_X, ENEMY_Y + 120, GOLD, 40, 380, 700);
        });
        this.cameras.main.flash(300, 160, 20, 40);
        const banner = this.add.text(-300, ENEMY_Y - 150, '⚠  BOSS  ⚠', {
            fontFamily: DISPLAY, fontSize: '54px', color: '#ff5a8a', stroke: '#000', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(58);
        this.tweens.chain({
            targets: banner,
            tweens: [
                { x: WIDTH / 2, duration: 280, ease: 'Cubic.Out' },
                { scale: 1.12, duration: 120, yoyo: true, repeat: 2 },
                { x: WIDTH + 300, duration: 260, ease: 'Cubic.In' },
            ],
            onComplete: () => banner.destroy(),
        });
        sfx.fanfare();
    }

    /** Damage number: arcs up and away; crits are big, gold and punchy. */
    private damageNumber(x: number, y: number, amount: number, crit: boolean) {
        const combo = this.state.combo;
        const size = crit ? 54 : 24 + Math.min(combo, 15) * 1.5;
        const t = this.add.text(x, y, (crit ? 'CRIT ' : '') + formatNum(amount), {
            fontFamily: DISPLAY, fontSize: `${size}px`, color: crit ? hex(GOLD) : combo > 5 ? '#ffb347' : FG,
            stroke: '#000', strokeThickness: crit ? 8 : 5,
        }).setOrigin(0.5).setDepth(57).setScale(crit ? 0.4 : 1.4);
        const dx = (Math.random() - 0.5) * 120;
        this.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.Out' });
        this.tweens.add({ targets: t, x: x + dx, duration: 750, ease: 'Sine.Out' });
        this.tweens.add({ targets: t, y: y - (crit ? 130 : 90), duration: 750, ease: 'Quad.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 450, duration: 300, onComplete: () => t.destroy() });
    }

    /** Goal ladder: the next three goals with progress bars, left of the enemy. */
    private drawLadder() {
        this.add.text(18, 170, 'NEXT GOALS', { fontFamily: FONT, fontSize: '13px', color: MUTED });
        for (let i = 0; i < 3; i++) {
            const y = 200 + i * 66;
            const text = this.add.text(18, y, '', { fontFamily: FONT, fontSize: '14px', color: FG, wordWrap: { width: 230 } });
            const track = this.add.rectangle(18, y + 44, 220, 6, LINE).setOrigin(0, 0.5);
            const bar = this.add.rectangle(18, y + 44, 220, 6, GREEN).setOrigin(0, 0.5);
            this.ladder.push({ text, track, bar });
        }
    }

    /** Hero collection: 6×6 grid of card art; locked heroes are dark silhouettes. Tap to zoom. */
    private drawHeroes() {
        const open = this.button(70, 48, 120, 56, CARD, '15px', () => {
            this.refreshHeroes();
            this.heroPanel.setVisible(true);
        });
        open.box.setStrokeStyle(2, 0xb07cff);
        open.text.setText('Heroes').setColor('#b07cff').setFontFamily(FONT);

        const shade = this.add.rectangle(WIDTH / 2, 640, WIDTH, 1280, 0x05060a, 0.96).setInteractive();
        this.heroTitle = this.add.text(WIDTH / 2, 70, '', { fontFamily: DISPLAY, fontSize: '28px', color: '#b07cff', align: 'center' }).setOrigin(0.5);
        const items: GameObjects.GameObject[] = [shade, this.heroTitle];
        const w = 108;
        const hgt = 151;
        const x0 = (WIDTH - 6 * w - 5 * 6) / 2 + w / 2;
        HEROES.forEach((hero, i) => {
            const x = x0 + (i % 6) * (w + 6);
            const y = 135 + hgt / 2 + Math.floor(i / 6) * (hgt + 8);
            const img = this.add.image(x, y, `hero-${hero.id}`).setDisplaySize(w, hgt).setInteractive({ useHandCursor: true });
            const lock = this.add.text(x, y, '?', { fontFamily: DISPLAY, fontSize: '40px', color: MUTED }).setOrigin(0.5);
            img.on('pointerdown', () => this.zoomHero(i));
            this.heroTiles.push({ img, lock });
            items.push(img, lock);
        });
        const close = this.button(WIDTH / 2, 1210, 240, 64, LINE, '20px', () => this.heroPanel.setVisible(false));
        close.text.setText('Close').setColor(FG);
        items.push(close.box, close.text);
        this.heroPanel = this.add.container(0, 0, items).setDepth(52).setVisible(false);

        const zshade = this.add.rectangle(WIDTH / 2, 640, WIDTH, 1280, 0x000000, 0.85).setInteractive();
        zshade.on('pointerdown', () => this.heroZoom.setVisible(false));
        this.heroZoomImg = this.add.image(WIDTH / 2, 560, 'hero-fire-bellows').setDisplaySize(560, 784);
        this.heroZoomText = this.add.text(WIDTH / 2, 1010, '', { fontFamily: FONT, fontSize: '22px', color: FG, align: 'center', wordWrap: { width: 600 } }).setOrigin(0.5, 0);
        this.heroZoom = this.add.container(0, 0, [zshade, this.heroZoomImg, this.heroZoomText]).setDepth(54).setVisible(false);
    }

    private refreshHeroes() {
        const s = this.state;
        this.heroTitle.setText(`Heroes ${s.heroes.length}/${HEROES.length}\nUnlock one per Ascend`);
        HEROES.forEach((hero, i) => {
            const owned = s.heroes.includes(hero.id);
            const { img, lock } = this.heroTiles[i];
            if (owned) {
                img.clearTint().setAlpha(1);
            } else {
                img.setTint(0x1a1a24).setAlpha(0.9);
            }
            lock.setVisible(!owned);
        });
    }

    private zoomHero(i: number) {
        const hero = HEROES[i];
        const owned = this.state.heroes.includes(hero.id);
        const elementOpen = ELEMENTS.indexOf(hero.element) < Math.min(this.state.ascends, ELEMENTS.length);
        this.heroZoomImg.setTexture(`hero-${hero.id}`).setDisplaySize(560, 784);
        if (owned) {
            this.heroZoomImg.clearTint();
        } else {
            this.heroZoomImg.setTint(0x1a1a24);
        }
        const onBoard = this.state.hero.some((h, slot) => h === hero.id && this.state.board[slot] > 0);
        this.heroZoomText.setText(
            owned ? `${hero.name}: ${hero.skill}\n${onBoard ? 'On your board now' : 'Rolls on summons from ' + hero.element + ' chi tiles'}`
                : elementOpen ? `Locked. A future Ascend can unlock it.`
                : `Locked. Needs the ${hero.element} element (Ascend ${ELEMENTS.indexOf(hero.element) + 1}).`,
        );
        this.heroZoom.setVisible(true);
    }

    private drawShop() {
        const open = this.button(WIDTH - 70, 48, 120, 56, CARD, '15px', () => {
            this.shopPanel.setVisible(true);
            this.refreshShop();
        });
        open.box.setStrokeStyle(2, GOLD);
        open.text.setText('Essence\nshop').setColor(hex(GOLD)).setFontFamily(FONT);

        const shade = this.add.rectangle(WIDTH / 2, 640, WIDTH, 1280, 0x000000, 0.7).setInteractive();
        const panel = this.add.rectangle(WIDTH / 2, 640, 640, 980, CARD).setStrokeStyle(3, GOLD);
        this.shopTitle = this.add.text(WIDTH / 2, 215, '', { fontFamily: DISPLAY, fontSize: '28px', color: hex(GOLD), align: 'center' }).setOrigin(0.5);
        const items: GameObjects.GameObject[] = [shade, panel, this.shopTitle];
        (Object.keys(SHOP) as ShopKey[]).forEach((key, i) => {
            const btn = this.button(WIDTH / 2, 330 + i * 110, 560, 96, BG, '19px', () => {
                if (buyShop(this.state, key)) {
                    sfx.summon();
                    persistGame(this.state);
                    this.refreshShop();
                } else {
                    sfx.deny();
                }
            });
            btn.box.setStrokeStyle(2, LINE);
            btn.text.setColor(FG).setFontFamily(FONT);
            this.shopBtns.set(key, btn);
            items.push(btn.box, btn.text);
        });
        this.shuffleBtn = this.button(WIDTH / 2, 665, 560, 86, GOLD, '22px', () => this.onShuffle());
        this.ascendBtn = this.button(WIDTH / 2, 765, 560, 86, 0xb07cff, '20px', () => this.onAscend());
        this.eraBtn = this.button(WIDTH / 2, 885, 560, 110, 0xff5a8a, '18px', () => this.onEra());
        const close = this.button(WIDTH / 2, 1060, 240, 56, LINE, '20px', () => this.shopPanel.setVisible(false));
        close.text.setText('Close').setColor(FG);
        items.push(this.shuffleBtn.box, this.shuffleBtn.text, this.ascendBtn.box, this.ascendBtn.text, this.eraBtn.box, this.eraBtn.text, close.box, close.text);
        this.shopPanel = this.add.container(0, 0, items).setDepth(50).setVisible(false);
    }

    private refreshShop() {
        const s = this.state;
        this.shopTitle.setText(
            `Essence shop\n${formatNum(s.essence)} Essence · ${s.shuffles} shuffles · heroes ${s.heroes.length}/${HEROES.length}`,
        );
        const nextEl = ELEMENTS[s.ascends];
        const aArmed = this.time.now < this.ascendArmed;
        this.ascendBtn.text.setText(
            !canAscend(s) ? 'Ascend unlocks after your first Shuffle'
                : aArmed ? 'Tap again: wipes Essence + shop'
                : `Ascend ${s.ascends + 1}: ${nextEl ? `+${nextEl} element, ` : ''}+1 hero`,
        );
        this.ascendBtn.box.setAlpha(canAscend(s) ? 1 : 0.4);
        const next = ERAS[s.era];
        const eArmed = this.time.now < this.eraArmed;
        this.eraBtn.text.setText(
            !next ? 'Final Era reached'
                : !canEra(s) ? `Era ${s.era + 1} ${next.name} opens at stage ${ERA_STAGE}\n${next.rule}`
                : eArmed ? 'Tap again: resets Shuffles, Ascends, Essence\n(heroes stay collected)'
                : `Begin Era ${s.era + 1}: ${next.name} (×3 dmg, ×2 gold)\n${next.rule}`,
        );
        this.eraBtn.box.setAlpha(canEra(s) ? 1 : 0.4);
        for (const [key, btn] of this.shopBtns) {
            const cost = shopCost(s, key);
            btn.text.setText(`${SHOP[key].label} ${s.shop[key]}  ·  ${SHOP[key].effect}\n${formatNum(cost)} Essence`);
            btn.box.setAlpha(s.essence >= cost ? 1 : 0.5);
        }
        const armed = this.time.now < this.shuffleArmed;
        this.shuffleBtn.text.setText(
            !canShuffle(s) ? 'Shuffle unlocks at stage 25'
                : armed ? 'Tap again to Shuffle (resets this run)'
                : `Shuffle: +${essenceGain(s)} Essence`,
        );
        this.shuffleBtn.box.setAlpha(canShuffle(s) ? 1 : 0.4);
    }

    private onEra() {
        if (!canEra(this.state)) {
            sfx.deny();
            return;
        }
        if (this.time.now >= this.eraArmed) {
            this.eraArmed = this.time.now + 3000;
            this.refreshShop();
            return;
        }
        this.eraArmed = 0;
        nextEra(this.state);
        persistGame(this.state);
        this.layoutBoard();
        this.refreshShop();
        sfx.fanfare();
        this.cameras.main.flash(800, 255, 90, 138);
        this.cameras.main.shake(400, 0.012);
        this.sparks(WIDTH / 2, 640, PINK, 80);
        const era = ERAS[this.state.era - 1];
        this.toast(`Era ${this.state.era}: ${era.name}. ${era.rule}`, 5000);
    }

    private onAscend() {
        if (!canAscend(this.state)) {
            sfx.deny();
            return;
        }
        if (this.time.now >= this.ascendArmed) {
            this.ascendArmed = this.time.now + 3000;
            this.refreshShop();
            return;
        }
        this.ascendArmed = 0;
        const hero = heroById(ascend(this.state) ?? '');
        persistGame(this.state);
        this.layoutBoard();
        this.refreshShop();
        sfx.fanfare();
        this.cameras.main.flash(600, 176, 124, 255);
        this.sparks(WIDTH / 2, 640, 0xb07cff, 60);
        const el = ELEMENTS[this.state.ascends - 1];
        this.toast(`Ascended!${el && this.state.ascends <= ELEMENTS.length ? ` ${el.toUpperCase()} chi flows.` : ''}` + (hero ? ` New hero: ${hero.name}. ${hero.skill}` : ''), 5000);
    }

    private onShuffle() {
        if (!canShuffle(this.state)) {
            sfx.deny();
            return;
        }
        if (this.time.now >= this.shuffleArmed) {
            this.shuffleArmed = this.time.now + 3000;
            this.refreshShop();
            return;
        }
        this.shuffleArmed = 0;
        const gain = shuffle(this.state);
        persistGame(this.state);
        this.layoutBoard();
        this.refreshShop();
        sfx.fanfare();
        this.cameras.main.flash(400, 255, 194, 74);
        this.sparks(WIDTH / 2, 640, GOLD, 40);
        this.toast(`Shuffled! +${gain} Essence. Spend it in the shop.`, 3500);
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
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({ targets: t, alpha: 0, delay: ms, duration: 400, onComplete: () => t.destroy() });
    }
}
