import { GameObjects, Scene } from 'phaser';
import { PATTERNS, rumble } from '../haptics';
import { Sfx } from '../audio';
import { HEIGHT, LEVELS_PER_TIER, WIDTH } from '../sim/constants.ts';
import { blessingName } from '../sim/blessings.ts';
import { CHAMPIONS, championById } from '../sim/champions.ts';
import { derivePower } from '../sim/economy.ts';
import { formatNum, formatTime } from '../sim/format.ts';
import { loadGame, persistGame, resetGame } from '../sim/save.ts';
import {
    buyChampionLevels,
    buyChampionTier,
    buyEfficiency,
    buyHaptic,
    buyInsight,
    buyLaneLevels,
    buyLaneTier,
    buyTreeLevels,
    buyTreeTier,
    championNextCost,
    championTierCost,
    efficiencyCost,
    hapticCost,
    insightCost,
    laneNextCost,
    performClick,
    selectChampion,
    setBulk,
    setLane,
    tickGame,
    toggleAutoBuy,
    treeNextCost,
    unlockChampion,
    tierCost,
} from '../sim/state.ts';
import type { BulkMode, CombatUnit, GameState, LaneId, MatchEvent, ShopTab, TreeId } from '../sim/types.ts';
import { LANE_GREEK, LANE_NAMES, TREE_DEFS, TREE_IDS } from '../sim/types.ts';
import { chip, label } from '../view/chrome';
import { C, FONT, SANS } from '../view/theme';

const ARENA_TOP = 92;
const ARENA_BOTTOM = 700;
const LANE_X = [128, 360, 592];

interface Floater {
    text: GameObjects.Text;
    life: number;
}

export class Arena extends Scene {
    private state!: GameState;
    private sfx = new Sfx();
    private gfx!: GameObjects.Graphics;
    private hudGold!: GameObjects.Text;
    private hudGlory!: GameObjects.Text;
    private hudPower!: GameObjects.Text;
    private hudMatch!: GameObjects.Text;
    private toast!: GameObjects.Text;
    private shopTitle!: GameObjects.Text;
    private shopBody!: GameObjects.Text;
    private shopHint!: GameObjects.Text;
    private floaters: Floater[] = [];
    private saveAcc = 0;
    private shopDirty = 0;
    private shopIndex = 0;
    private tabChips: { bg: GameObjects.Rectangle; text: GameObjects.Text; id: ShopTab }[] = [];
    private bulkChips: { bg: GameObjects.Rectangle; text: GameObjects.Text; id: BulkMode }[] = [];
    private laneChips: { bg: GameObjects.Rectangle; text: GameObjects.Text; lane: LaneId }[] = [];
    private pulse = 0;
    private champGlyph?: GameObjects.Text;

    constructor() {
        super('Arena');
    }

    create() {
        const loaded = loadGame();
        this.state = loaded.state;
        this.cameras.main.setBackgroundColor(C.bg);
        this.add.rectangle(0, 0, WIDTH, HEIGHT, C.bg).setOrigin(0, 0);
        this.drawChrome();
        this.gfx = this.add.graphics();
        for (let i = 0; i < 3; i += 1) {
            this.add
                .text(LANE_X[i], ARENA_TOP + 18, ['TOP', 'MID', 'BOT'][i], {
                    fontFamily: SANS,
                    fontSize: '12px',
                    color: '#e2c36b',
                })
                .setOrigin(0.5)
                .setAlpha(0.7);
        }
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer));
        this.input.once('pointerdown', () => this.sfx.unlock());
        if (loaded.offline.seconds >= 8) {
            this.flash(
                `While you were away (${formatTime(loaded.offline.seconds)}): +${formatNum(loaded.offline.gold)} gold, +${formatNum(loaded.offline.glory)} glory`,
            );
        }
        this.refreshShop();
        this.refreshChips();
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                persistGame(this.state);
            }
        });
    }

    update(_time: number, delta: number) {
        const dt = Math.min(0.05, delta / 1000);
        this.pulse += dt;
        const result = tickGame(this.state, dt);
        for (const event of result.events) {
            this.feel(event);
        }
        if (result.matchEnded === 'victory') {
            this.sfx.victory();
            rumble(PATTERNS.victory, this.state.meta.haptic);
            this.flash(`Nexus down. Match ${this.state.match.index} · +${formatNum(result.goldGained)}g  +${result.gloryGained} glory`);
        } else if (result.matchEnded === 'defeat') {
            this.sfx.defeat();
            rumble(PATTERNS.defeat, this.state.meta.haptic);
            this.flash('The house fell. The lane resets.');
        }
        this.saveAcc += dt;
        if (this.saveAcc > 2) {
            this.saveAcc = 0;
            persistGame(this.state);
        }
        this.shopDirty += dt;
        if (this.shopDirty > 0.2) {
            this.shopDirty = 0;
            this.refreshShop();
            this.refreshChips();
        }
        this.drawArena();
        this.drawHud();
        this.stepFloaters(dt);
    }

    private drawChrome() {
        this.add.rectangle(0, 0, WIDTH, 88, C.panel).setOrigin(0, 0).setStrokeStyle(1, 0xc9a227, 0.35);
        label(this, 20, 10, 'CANON LANE', 18, '#e2c36b');
        this.hudGold = label(this, 20, 38, '', 20, C.ivory);
        this.hudGlory = label(this, 250, 38, '', 18, '#e2c36b');
        this.hudPower = label(this, 20, 64, '', 13, C.mute, SANS);
        this.hudMatch = label(this, 430, 14, '', 14, '#c8bfd4', SANS);

        chip(this, 600, 10, 100, 36, C.wine, 'RESET', () => {
            this.state = resetGame();
            rumble(PATTERNS.defeat, 1);
            this.flash('The ledger is wiped.');
        });

        this.laneChips = ([0, 1, 2] as LaneId[]).map((lane, i) => {
            const chipUi = chip(this, 16 + i * 232, 708, 220, 44, C.ink, LANE_NAMES[lane].toUpperCase(), () => {
                setLane(this.state, lane);
                rumble(PATTERNS.tap, this.state.meta.haptic);
                this.sfx.tap();
            });
            return { ...chipUi, lane };
        });

        const tabs: { id: ShopTab; title: string }[] = [
            { id: 'trees', title: 'TREES' },
            { id: 'tiers', title: 'TIERS' },
            { id: 'roster', title: 'ROSTER' },
            { id: 'lanes', title: 'LANES' },
            { id: 'meta', title: 'META' },
        ];
        this.tabChips = tabs.map((tab, i) => {
            const chipUi = chip(this, 12 + i * 140, 760, 132, 40, C.panelAlt, tab.title, () => {
                this.state.tab = tab.id;
                this.shopIndex = 0;
                rumble(PATTERNS.tap, this.state.meta.haptic);
            });
            return { ...chipUi, id: tab.id };
        });

        this.add.rectangle(12, 808, 696, 318, C.panel, 0.96).setOrigin(0, 0).setStrokeStyle(1, 0xc9a227, 0.28);
        chip(this, 24, 820, 64, 44, C.ink, '◀', () => {
            this.shopIndex = Math.max(0, this.shopIndex - 1);
            rumble(PATTERNS.tap, this.state.meta.haptic);
        });
        chip(this, 632, 820, 64, 44, C.ink, '▶', () => {
            this.shopIndex += 1;
            rumble(PATTERNS.tap, this.state.meta.haptic);
        });
        this.shopTitle = this.add
            .text(360, 842, '', { fontFamily: FONT, fontSize: '22px', color: C.ivory })
            .setOrigin(0.5);
        this.shopBody = this.add
            .text(36, 878, '', {
                fontFamily: SANS,
                fontSize: '16px',
                color: '#c8bfd4',
                wordWrap: { width: 648 },
                lineSpacing: 5,
            })
            .setOrigin(0, 0);
        chip(this, 180, 1048, 360, 56, C.wine, 'UPGRADE', () => this.buyCurrent());
        this.shopHint = this.add
            .text(360, 1118, '', { fontFamily: SANS, fontSize: '13px', color: C.mute, align: 'center' })
            .setOrigin(0.5);

        const bulks: BulkMode[] = [1, 10, 100, 1000, 'max'];
        this.bulkChips = bulks.map((bulk, i) => {
            const chipUi = chip(this, 16 + i * 104, 1208, 96, 40, C.ink, bulk === 'max' ? 'MAX' : `x${bulk}`, () => {
                setBulk(this.state, bulk);
                rumble(PATTERNS.tap, this.state.meta.haptic);
            });
            return { ...chipUi, id: bulk };
        });
        chip(this, 536, 1208, 168, 40, C.sea, 'AUTO', () => {
            toggleAutoBuy(this.state);
            rumble(PATTERNS.upgrade, this.state.meta.haptic);
        });

        this.toast = this.add
            .text(WIDTH / 2, 400, '', {
                fontFamily: FONT,
                fontSize: '18px',
                color: '#e2c36b',
                align: 'center',
                wordWrap: { width: 640 },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(20);
    }

    private shopCount(): number {
        if (this.state.tab === 'trees' || this.state.tab === 'tiers') {
            return TREE_IDS.length;
        }
        if (this.state.tab === 'roster') {
            return CHAMPIONS.length;
        }
        if (this.state.tab === 'lanes') {
            return 3;
        }
        return 4;
    }

    private refreshShop() {
        const count = this.shopCount();
        this.shopIndex = ((this.shopIndex % count) + count) % count;
        const power = derivePower(this.state);
        if (this.state.tab === 'trees') {
            const id = TREE_IDS[this.shopIndex];
            const def = TREE_DEFS[id];
            const col = this.state.trees[id];
            const cost = treeNextCost(this.state, id);
            const next = blessingName(col.level);
            this.shopTitle.setText(`${def.title}  ·  ${def.greek}`);
            this.shopBody.setText(
                `${def.blurb}\n\nTier ${col.tier}   Level ${col.level} / ${LEVELS_PER_TIER}\nNext blessing: ${next}\nCost ${formatNum(cost)}g   ·   Power ${formatNum(power.clickDamage + power.dps)}\n${this.insightLine(col.level)}`,
            );
            this.shopHint.setText('Gold buys the next named blessing in this tier.');
            return;
        }
        if (this.state.tab === 'tiers') {
            const id = TREE_IDS[this.shopIndex];
            const def = TREE_DEFS[id];
            const col = this.state.trees[id];
            const cost = tierCost(col.tier);
            this.shopTitle.setText(`ASCEND ${def.title.toUpperCase()}`);
            this.shopBody.setText(
                `${def.greek} column, currently Tier ${col.tier}.\nGlory cost ${formatNum(cost)}  ·  you have ${formatNum(this.state.glory)}\nEach tier multiplies the whole 9000-level tree.\nLevels stay. The grind gets teeth, not a reset.`,
            );
            this.shopHint.setText('Win matches for Glory, then lift the tier.');
            return;
        }
        if (this.state.tab === 'roster') {
            const champ = CHAMPIONS[this.shopIndex];
            const progress = this.state.champions[champ.id];
            const selected = this.state.selectedChampion === champ.id ? '  ·  FIELDING' : '';
            this.shopTitle.setText(`${champ.name}  as  ${champ.greek}${selected}`);
            if (!progress.unlocked) {
                this.shopBody.setText(
                    `${champ.domain}\n${champ.role.toUpperCase()}  ·  ${champ.blurb}\n\nUnlock for ${champ.unlockGlory} Glory.`,
                );
                this.shopHint.setText('UPGRADE unlocks, then levels, this champion.');
                return;
            }
            this.shopBody.setText(
                `${champ.domain}\n${champ.blurb}\n\nLevel ${progress.level} / ${LEVELS_PER_TIER}   Tier ${progress.tier}\nLevel cost ${formatNum(championNextCost(this.state, champ.id))}g\nTier cost ${formatNum(championTierCost(progress.tier))} Glory\nClick ×${champ.click}  Idle ×${champ.idle}  Gold ×${champ.gold}  Crit ×${champ.crit}`,
            );
            this.shopHint.setText('UPGRADE fields them, then buys levels. Bulk MAX spends Glory on their tier.');
            return;
        }
        if (this.state.tab === 'lanes') {
            const lane = this.shopIndex as LaneId;
            const col = this.state.lanes[lane];
            this.shopTitle.setText(`${LANE_NAMES[lane].toUpperCase()}  ·  ${LANE_GREEK[lane]}`);
            this.shopBody.setText(
                `Focus blessing for this corridor.\nLevel ${col.level} / ${LEVELS_PER_TIER}   Tier ${col.tier}\nNext ${formatNum(laneNextCost(this.state, lane))}g   ·   Tier ${formatNum(tierCost(col.tier))} Glory\nA leveled lane multiplies the champion standing in it.`,
            );
            this.shopHint.setText('UPGRADE buys lane levels. Bulk MAX spends Glory to raise the lane tier.');
            return;
        }
        const rows = [
            {
                title: 'Shop efficiency',
                body: `Level ${this.state.meta.efficiency} / 40\nEach rank trims every gold price by 1.5%.\nNext ${formatNum(efficiencyCost(this.state.meta.efficiency))}g`,
            },
            {
                title: 'Tactile rite',
                body: `Haptic rank ${this.state.meta.haptic} / 8\nRicher vibration, a sliver more crit.\nNext ${formatNum(hapticCost(this.state.meta.haptic))}g`,
            },
            {
                title: 'Blessing insight',
                body: `Rank ${this.state.meta.insight} / 5\nSee further names in the 9000-catalog.\nNext ${formatNum(insightCost(this.state.meta.insight))} Glory`,
            },
            {
                title: 'Auto-buy',
                body: this.state.meta.autoBuy
                    ? 'The shop spends idle gold on the cheapest tree.'
                    : 'Enable with the AUTO chip. The lane buys while you rest.',
            },
        ];
        const row = rows[this.shopIndex] ?? rows[0];
        this.shopTitle.setText(row.title);
        this.shopBody.setText(row.body);
        this.shopHint.setText('Everything upgrades — trees, tiers, champions, lanes, the shop itself.');
    }

    private insightLine(level: number): string {
        const depth = 1 + this.state.meta.insight;
        const names = [];
        for (let i = 0; i < depth && level + i < LEVELS_PER_TIER; i += 1) {
            names.push(blessingName(level + i));
        }
        return names.length ? `Catalog: ${names.join('  ·  ')}` : 'Tier complete.';
    }

    private buyCurrent() {
        const intensity = this.state.meta.haptic;
        let bought = false;
        if (this.state.tab === 'trees') {
            const id = TREE_IDS[this.shopIndex] as TreeId;
            const result = buyTreeLevels(this.state, id);
            bought = result.bought > 0;
            if (bought) {
                this.flash(`${result.bought} blessing${result.bought === 1 ? '' : 's'} · ${TREE_DEFS[id].title}`);
            }
        } else if (this.state.tab === 'tiers') {
            bought = buyTreeTier(this.state, TREE_IDS[this.shopIndex]);
            if (bought) {
                this.sfx.tier();
                rumble(PATTERNS.tier, intensity);
                this.flash(`${TREE_DEFS[TREE_IDS[this.shopIndex]].title} rises a tier.`);
                this.refreshShop();
                return;
            }
        } else if (this.state.tab === 'roster') {
            const champ = CHAMPIONS[this.shopIndex];
            const progress = this.state.champions[champ.id];
            if (!progress.unlocked) {
                bought = unlockChampion(this.state, champ.id);
            } else if (this.state.selectedChampion !== champ.id) {
                bought = selectChampion(this.state, champ.id);
                if (bought) {
                    this.flash(`${champ.name} takes the lane as ${champ.greek}.`);
                }
            } else if (this.state.bulk === 'max' && this.state.glory >= championTierCost(progress.tier)) {
                bought = buyChampionTier(this.state, champ.id);
                if (bought) {
                    this.sfx.tier();
                    rumble(PATTERNS.tier, intensity);
                    this.flash(`${champ.name}'s domain deepens.`);
                    this.refreshShop();
                    return;
                }
            } else {
                const result = buyChampionLevels(this.state, champ.id);
                bought = result.bought > 0;
            }
        } else if (this.state.tab === 'lanes') {
            const lane = this.shopIndex as LaneId;
            if (this.state.bulk === 'max' && this.state.glory >= tierCost(this.state.lanes[lane].tier)) {
                bought = buyLaneTier(this.state, lane);
                if (bought) {
                    this.sfx.tier();
                    rumble(PATTERNS.tier, intensity);
                    this.refreshShop();
                    return;
                }
            }
            const result = buyLaneLevels(this.state, lane);
            bought = result.bought > 0;
        } else if (this.shopIndex === 0) {
            bought = buyEfficiency(this.state);
        } else if (this.shopIndex === 1) {
            bought = buyHaptic(this.state);
        } else if (this.shopIndex === 2) {
            bought = buyInsight(this.state);
        } else {
            toggleAutoBuy(this.state);
            bought = true;
        }
        if (bought) {
            this.sfx.upgrade();
            rumble(this.state.bulk === 1 ? PATTERNS.upgrade : PATTERNS.bulk, intensity);
        } else {
            rumble(PATTERNS.defeat, Math.max(1, intensity - 2));
        }
        this.refreshShop();
    }

    private refreshChips() {
        for (const lane of this.laneChips) {
            lane.bg.setFillStyle(this.state.selectedLane === lane.lane ? 0x3d5a80 : C.ink);
        }
        for (const tab of this.tabChips) {
            tab.bg.setFillStyle(this.state.tab === tab.id ? 0x6b2d3c : C.panelAlt);
        }
        for (const bulk of this.bulkChips) {
            bulk.bg.setFillStyle(this.state.bulk === bulk.id ? 0x3d7a4a : C.ink);
        }
    }

    private drawHud() {
        const power = derivePower(this.state);
        this.hudGold.setText(`${formatNum(this.state.gold)} gold`);
        this.hudGlory.setText(`${formatNum(this.state.glory)} glory`);
        this.hudPower.setText(
            `TAP ${formatNum(power.clickDamage)}   IDLE ${formatNum(power.dps)}/s   CRIT ${Math.round(power.critChance * 100)}%   GPS ${formatNum(power.goldPerSecond)}`,
        );
        const champ = championById(this.state.selectedChampion);
        this.hudMatch.setText(`M${this.state.match.index + 1}  ${champ.name}/${champ.greek}${this.state.meta.autoBuy ? '  AUTO' : ''}`);
    }

    private laneFromX(x: number): LaneId {
        let best: LaneId = 1;
        let dist = Infinity;
        for (let i = 0; i < 3; i += 1) {
            const d = Math.abs(x - LANE_X[i]);
            if (d < dist) {
                dist = d;
                best = i as LaneId;
            }
        }
        return best;
    }

    private onTap(pointer: Phaser.Input.Pointer) {
        this.sfx.unlock();
        if (pointer.y < ARENA_TOP || pointer.y > ARENA_BOTTOM) {
            return;
        }
        const lane = this.laneFromX(pointer.x);
        setLane(this.state, lane);
        const camp = Math.abs(pointer.x - LANE_X[lane]) > 70 && (lane === 0 || lane === 2);
        const events = performClick(this.state, camp);
        this.sfx.tap();
        rumble(PATTERNS.tap, this.state.meta.haptic);
        this.cameras.main.shake(40, 0.0024);
        for (const event of events) {
            this.feel(event);
        }
        const power = derivePower(this.state);
        this.floatAt(pointer.x, pointer.y - 16, `+${formatNum(power.goldPerClick)}`, '#e2c36b');
    }

    private feel(event: MatchEvent) {
        const x = LANE_X[event.lane];
        const y = this.worldY(event.x ?? 50);
        if (event.kind === 'crit') {
            this.sfx.crit();
            rumble(PATTERNS.crit, this.state.meta.haptic);
            this.floatAt(x, y, `CRIT ${formatNum(event.amount)}`, '#efe6d4');
            this.cameras.main.flash(40, 226, 195, 107, false);
        } else if (event.kind === 'lastHit') {
            this.sfx.lastHit();
            rumble(PATTERNS.lastHit, this.state.meta.haptic);
            this.floatAt(x, y, `GLEAM +${formatNum(event.amount)}`, '#7a9e4a');
        } else if (event.kind === 'tower') {
            rumble(PATTERNS.tower, this.state.meta.haptic);
            this.floatAt(x, y, 'TOWER', '#e07040');
        } else if (event.kind === 'omen') {
            this.sfx.omen();
            rumble(PATTERNS.omen, this.state.meta.haptic);
        } else if (event.kind === 'gold' && event.amount > 2) {
            this.floatAt(x, y, `+${formatNum(event.amount)}`, '#e2c36b');
        }
    }

    private worldY(pos: number): number {
        return ARENA_TOP + 16 + (pos / 100) * (ARENA_BOTTOM - ARENA_TOP - 32);
    }

    private drawArena() {
        const g = this.gfx;
        g.clear();
        g.fillStyle(0x120e1a, 1);
        g.fillRect(0, ARENA_TOP, WIDTH, ARENA_BOTTOM - ARENA_TOP);
        for (let i = 0; i < 3; i += 1) {
            const hot = this.state.selectedLane === i;
            g.fillStyle(hot ? C.laneHot : C.lane, 1);
            g.fillRoundedRect(LANE_X[i] - 46, ARENA_TOP + 8, 92, ARENA_BOTTOM - ARENA_TOP - 16, 16);
            g.lineStyle(2, hot ? 0xe2c36b : 0x3a2c4e, hot ? 0.85 : 0.45);
            g.strokeRoundedRect(LANE_X[i] - 46, ARENA_TOP + 8, 92, ARENA_BOTTOM - ARENA_TOP - 16, 16);
        }
        g.lineStyle(1, 0xc9a227, 0.2);
        g.lineBetween(40, this.worldY(4), 680, this.worldY(4));
        g.lineBetween(40, this.worldY(96), 680, this.worldY(96));

        for (const unit of this.state.match.units) {
            if (unit.hp <= 0) {
                continue;
            }
            this.drawUnit(g, unit);
        }
        g.fillStyle(0xe2c36b, 0.08 + Math.sin(this.pulse * 6) * 0.03);
        g.fillCircle(LANE_X[this.state.selectedLane], this.worldY(64), 28);
    }

    private drawUnit(g: GameObjects.Graphics, unit: CombatUnit) {
        const x = unit.kind === 'camp' ? LANE_X[unit.lane] + (unit.lane === 0 ? -88 : 88) : unit.kind === 'nexus' ? WIDTH / 2 : LANE_X[unit.lane];
        const y = this.worldY(unit.pos);
        const ally = unit.team === 0;
        const color = unit.kind === 'camp' ? 0x3d7a4a : ally ? C.ally : C.enemy;
        const r = unit.kind === 'nexus' ? 22 : unit.kind === 'tower' ? 16 : unit.kind === 'champ' ? 15 : unit.kind === 'camp' ? 13 : 7;
        g.fillStyle(color, 1);
        if (unit.kind === 'tower' || unit.kind === 'nexus') {
            g.fillRect(x - r, y - r, r * 2, r * 2);
            g.lineStyle(2, 0xe2c36b, 0.7);
            g.strokeRect(x - r, y - r, r * 2, r * 2);
        } else {
            g.fillCircle(x, y, r);
        }
        const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
        g.fillStyle(0x1a1020, 1);
        g.fillRect(x - r, y + r + 3, r * 2, 4);
        g.fillStyle(ratio > 0.35 ? 0x7a9e4a : 0xa33b3b, 1);
        g.fillRect(x - r, y + r + 3, r * 2 * ratio, 4);
        if (unit.kind === 'champ' && ally) {
            g.lineStyle(2, 0xe2c36b, 1);
            g.strokeCircle(x, y, r + 3);
            const champ = championById(this.state.selectedChampion);
            if (!this.champGlyph) {
                this.champGlyph = this.add
                    .text(x, y, champ.glyph, { fontFamily: FONT, fontSize: '16px', color: '#0c0a14', fontStyle: 'bold' })
                    .setOrigin(0.5)
                    .setDepth(6);
            }
            this.champGlyph.setText(champ.glyph).setPosition(x, y);
        }
    }

    private floatAt(x: number, y: number, text: string, color: string) {
        const node = this.add
            .text(x, y, text, { fontFamily: SANS, fontSize: '20px', color, fontStyle: 'bold', stroke: '#0c0a14', strokeThickness: 4 })
            .setOrigin(0.5)
            .setDepth(15);
        this.floaters.push({ text: node, life: 1.05 });
    }

    private stepFloaters(dt: number) {
        for (const floater of this.floaters) {
            floater.life -= dt;
            floater.text.y -= 28 * dt;
            floater.text.setAlpha(Math.max(0, floater.life / 1.05));
        }
        const keep: Floater[] = [];
        for (const floater of this.floaters) {
            if (floater.life > 0) {
                keep.push(floater);
            } else {
                floater.text.destroy();
            }
        }
        this.floaters = keep;
    }

    private flash(text: string) {
        this.toast.setText(text);
        this.toast.setAlpha(1);
        this.tweens.add({ targets: this.toast, alpha: 0, delay: 1600, duration: 400 });
    }
}
