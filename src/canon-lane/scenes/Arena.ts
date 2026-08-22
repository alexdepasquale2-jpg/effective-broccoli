import { GameObjects, Scene } from 'phaser';
import { PATTERNS, rumble } from '../haptics';
import { Sfx } from '../audio';
import { LEVELS_PER_TIER, WIDTH } from '../sim/constants.ts';
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
import { chip, label, restyleChip } from '../view/chrome';
import {
    COCKPIT,
    attachCockpitText,
    createCockpit,
    createRoster,
    refreshCockpit,
    setCockpitVisible,
    slotBlurb,
    type Cockpit,
    type DeckSlot,
} from '../view/cockpit.ts';
import { eraProgress, nextEra, resolveEra, type Era } from '../view/era.ts';
import { blit, paletteFor, roundRect, scanlines, spawnBurst, stepSparks, strokeRect, type Spark } from '../view/paint.ts';
import { CAMP, FOE, MINION, NEXUS, TOWER, attackSheet, champSheet, shiftSheet } from '../view/sprites.ts';

const CLASSIC_TOP = 86;
const CLASSIC_BOTTOM = 688;
const LANE_X = [128, 360, 592];

interface Floater {
    text: GameObjects.Text;
    life: number;
}

export class Arena extends Scene {
    private state!: GameState;
    private sfx = new Sfx();
    private gfx!: GameObjects.Graphics;
    private shopArt!: GameObjects.Graphics;
    private hudGold!: GameObjects.Text;
    private hudGlory!: GameObjects.Text;
    private hudPower!: GameObjects.Text;
    private hudMatch!: GameObjects.Text;
    private hudEra!: GameObjects.Text;
    private toast!: GameObjects.Text;
    private shopTitle!: GameObjects.Text;
    private shopBody!: GameObjects.Text;
    private shopHint!: GameObjects.Text;
    private brand!: GameObjects.Text;
    private hudBar!: GameObjects.Rectangle;
    private shopPanel!: GameObjects.Rectangle;
    private buyChip!: { bg: GameObjects.Rectangle; text: GameObjects.Text };
    private autoChip!: { bg: GameObjects.Rectangle; text: GameObjects.Text };
    private resetChip!: { bg: GameObjects.Rectangle; text: GameObjects.Text };
    private floaters: Floater[] = [];
    private sparks: Spark[] = [];
    private saveAcc = 0;
    private shopDirty = 0;
    private shopIndex = 0;
    private tabChips: { bg: GameObjects.Rectangle; text: GameObjects.Text; id: ShopTab }[] = [];
    private bulkChips: { bg: GameObjects.Rectangle; text: GameObjects.Text; id: BulkMode }[] = [];
    private laneChips: { bg: GameObjects.Rectangle; text: GameObjects.Text; lane: LaneId }[] = [];
    private pulse = 0;
    private eraId = '';
    private cockpit!: Cockpit;
    private picked: DeckSlot | null = null;
    private arrowLeft!: { bg: GameObjects.Rectangle; text: GameObjects.Text };
    private arrowRight!: { bg: GameObjects.Rectangle; text: GameObjects.Text };

    constructor() {
        super('Arena');
    }

    create() {
        const loaded = loadGame();
        this.state = loaded.state;
        const era = this.era();
        this.cameras.main.setBackgroundColor(era.bg);
        this.hudBar = this.add.rectangle(0, 0, WIDTH, 80, era.panel).setOrigin(0, 0);
        this.brand = label(this, 18, 8, 'CANON LANE', 16, era.goldHex, era.display);
        this.hudGold = label(this, 18, 32, '', 20, era.ivory, era.display);
        this.hudGlory = label(this, 250, 34, '', 16, era.goldHex, era.font);
        this.hudPower = label(this, 18, 58, '', 12, era.mute, era.font);
        this.hudMatch = label(this, 430, 10, '', 13, era.mute, era.font);
        this.hudEra = label(this, 430, 36, '', 15, era.goldHex, era.display);
        this.resetChip = chip(this, 604, 8, 98, 34, era.wine, 'RESET', () => {
            this.state = resetGame();
            rumble(PATTERNS.defeat, 1);
            this.flash('The ledger is wiped.');
            this.applySkin(true);
        }, era);

        this.laneChips = ([0, 1, 2] as LaneId[]).map((lane, i) => {
            const chipUi = chip(this, 16 + i * 232, 696, 220, 42, era.ink, LANE_NAMES[lane].toUpperCase(), () => {
                setLane(this.state, lane);
                rumble(PATTERNS.tap, this.state.meta.haptic);
                this.sfx.tap();
            }, era);
            return { ...chipUi, lane };
        });

        const tabs: { id: ShopTab; title: string }[] = [
            { id: 'screen', title: 'SCREEN' },
            { id: 'trees', title: 'TREES' },
            { id: 'tiers', title: 'TIERS' },
            { id: 'roster', title: 'ROSTER' },
            { id: 'lanes', title: 'LANES' },
            { id: 'meta', title: 'META' },
        ];
        this.tabChips = tabs.map((tab, i) => {
            const chipUi = chip(this, 10 + i * 118, 746, 112, 38, era.panelAlt, tab.title, () => {
                this.state.tab = tab.id;
                this.shopIndex = 0;
                rumble(PATTERNS.tap, this.state.meta.haptic);
            }, era);
            return { ...chipUi, id: tab.id };
        });

        this.shopPanel = this.add.rectangle(12, 792, 696, 328, era.panel, 0.97).setOrigin(0, 0);
        this.arrowLeft = chip(this, 22, 804, 60, 42, era.ink, '◀', () => {
            this.shopIndex = Math.max(0, this.shopIndex - 1);
            rumble(PATTERNS.tap, this.state.meta.haptic);
        }, era);
        this.arrowRight = chip(this, 638, 804, 60, 42, era.ink, '▶', () => {
            this.shopIndex += 1;
            rumble(PATTERNS.tap, this.state.meta.haptic);
        }, era);
        this.shopTitle = this.add.text(360, 824, '', { fontFamily: era.display, fontSize: '22px', color: era.ivory }).setOrigin(0.5);
        this.shopBody = this.add
            .text(120, 858, '', {
                fontFamily: era.font,
                fontSize: '15px',
                color: era.mute,
                wordWrap: { width: 560 },
                lineSpacing: 4,
            })
            .setOrigin(0, 0);
        this.buyChip = chip(this, 180, 1036, 360, 54, era.wine, 'UPGRADE', () => this.buyCurrent(), era);
        this.shopHint = this.add.text(360, 1102, '', { fontFamily: era.font, fontSize: '13px', color: era.mute, align: 'center' }).setOrigin(0.5);

        const bulks: BulkMode[] = [1, 10, 100, 1000, 'max'];
        this.bulkChips = bulks.map((bulk, i) => {
            const chipUi = chip(this, 16 + i * 104, 1204, 96, 40, era.ink, bulk === 'max' ? 'MAX' : `x${bulk}`, () => {
                setBulk(this.state, bulk);
                rumble(PATTERNS.tap, this.state.meta.haptic);
            }, era);
            return { ...chipUi, id: bulk };
        });
        this.autoChip = chip(this, 536, 1204, 168, 40, era.sea, 'AUTO', () => {
            toggleAutoBuy(this.state);
            rumble(PATTERNS.upgrade, this.state.meta.haptic);
        }, era);

        this.toast = this.add
            .text(WIDTH / 2, 390, '', {
                fontFamily: era.display,
                fontSize: '18px',
                color: era.goldHex,
                align: 'center',
                wordWrap: { width: 640 },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(22);

        this.cockpit = createCockpit(this, era, (slot) => this.pickDeck(slot));
        this.cockpit.roster = createRoster(this, era, CHAMPIONS.map((champion) => champion.id), (id) => this.pickRoster(id));
        for (const chip of this.cockpit.roster) {
            this.cockpit.roots.push(chip.bg, chip.mark);
        }
        attachCockpitText(this, era, this.cockpit);
        this.gfx = this.add.graphics();
        this.shopArt = this.add.graphics();
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer));
        this.input.once('pointerdown', () => this.sfx.unlock());
        if (loaded.offline.seconds >= 8) {
            this.flash(`Away ${formatTime(loaded.offline.seconds)} · +${formatNum(loaded.offline.gold)}g  +${formatNum(loaded.offline.glory)} glory`);
        }
        this.applySkin(true);
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
        const before = this.era().id;
        const result = tickGame(this.state, dt);
        for (const event of result.events) {
            this.feel(event);
        }
        if (result.matchEnded === 'victory') {
            this.sfx.victory();
            rumble(PATTERNS.victory, this.state.meta.haptic);
            this.flash(`Nexus down. Match ${this.state.match.index} · +${formatNum(result.goldGained)}g`);
            if (this.era().particles) {
                spawnBurst(this.sparks, WIDTH / 2, this.worldY(8), this.era().gold, 16, 90);
            }
        } else if (result.matchEnded === 'defeat') {
            this.sfx.defeat();
            rumble(PATTERNS.defeat, this.state.meta.haptic);
            this.flash('The house fell. The lane resets.');
        }
        if (this.era().id !== before) {
            this.onEraUp();
        }
        this.saveAcc += dt;
        if (this.saveAcc > 2) {
            this.saveAcc = 0;
            persistGame(this.state);
        }
        this.shopDirty += dt;
        if (this.shopDirty > 0.18) {
            this.shopDirty = 0;
        this.refreshShop();
        this.refreshChips();
        this.applySkin(false);
        if (this.era().sleek) {
            refreshCockpit(this.cockpit, this.state, this.era(), this.picked);
            this.cockpit.intel.setText(this.laneIntel());
        }
        }
        this.drawArena();
        this.drawHud();
        this.stepFloaters(dt);
    }

    private era(): Era {
        return resolveEra(this.state.trees.gui);
    }

    private arenaTop(): number {
        return this.era().sleek ? COCKPIT.arenaTop : CLASSIC_TOP;
    }

    private arenaBottom(): number {
        return this.era().sleek ? COCKPIT.arenaBottom : CLASSIC_BOTTOM;
    }

    private applySkin(force: boolean) {
        const era = this.era();
        if (!force && era.id === this.eraId) {
            return;
        }
        this.eraId = era.id;
        this.cameras.main.setBackgroundColor(era.bg);
        this.hudBar.setFillStyle(era.panel, 1);
        this.hudBar.setStrokeStyle(era.sleek ? 2 : 1, era.gold, era.perfect ? 0.55 : 0.28);
        this.shopPanel.setFillStyle(era.panel, 0.97);
        this.shopPanel.setStrokeStyle(era.sleek ? 2 : 1, era.gold, 0.35);
        this.brand.setStyle({ fontFamily: era.display, color: era.goldHex });
        this.hudGold.setStyle({ fontFamily: era.display, color: era.ivory });
        this.hudGlory.setStyle({ fontFamily: era.font, color: era.goldHex });
        this.hudPower.setStyle({ fontFamily: era.font, color: era.mute });
        this.hudMatch.setStyle({ fontFamily: era.font, color: era.mute });
        this.hudEra.setStyle({ fontFamily: era.display, color: era.goldHex });
        this.shopTitle.setStyle({ fontFamily: era.display, color: era.ivory });
        this.shopBody.setStyle({ fontFamily: era.font, color: era.mute });
        this.shopHint.setStyle({ fontFamily: era.font, color: era.mute });
        this.toast.setStyle({ fontFamily: era.display, color: era.goldHex });
        restyleChip(this.resetChip, era, era.wine);
        restyleChip(this.buyChip, era, era.wine);
        restyleChip(this.autoChip, era, era.sea);
        this.sfx.richness = era.perfect ? 1 : era.sleek ? 0.7 : era.frames > 1 ? 0.4 : 0.15;
        const classic = !era.sleek;
        this.shopPanel.setVisible(classic);
        this.shopTitle.setVisible(classic);
        this.shopBody.setVisible(classic);
        this.shopHint.setVisible(classic);
        this.shopArt.setVisible(classic);
        this.buyChip.bg.setVisible(classic);
        this.buyChip.text.setVisible(classic);
        this.arrowLeft.bg.setVisible(classic);
        this.arrowLeft.text.setVisible(classic);
        this.arrowRight.bg.setVisible(classic);
        this.arrowRight.text.setVisible(classic);
        for (const tab of this.tabChips) {
            tab.bg.setVisible(classic);
            tab.text.setVisible(classic);
        }
        for (const lane of this.laneChips) {
            lane.bg.setVisible(classic);
            lane.text.setVisible(classic);
        }
        const dock = era.sleek ? 1024 : 1204;
        this.bulkChips.forEach((entry, i) => {
            entry.bg.setPosition(16 + i * 104, dock);
            entry.text.setPosition(16 + i * 104 + 48, dock + 20);
        });
        this.autoChip.bg.setPosition(536, dock);
        this.autoChip.text.setPosition(620, dock + 20);
        setCockpitVisible(this.cockpit, era.sleek);
        if (era.sleek) {
            refreshCockpit(this.cockpit, this.state, era, this.picked);
            this.cockpit.context.setText(this.picked ? slotBlurb(this.picked, this.state) : 'Tap a cell to buy it. Every column is on this glass.');
            this.cockpit.intel.setText(this.laneIntel());
        }
    }

    private laneIntel(): string {
        const units = this.state.match.units.filter((unit) => unit.hp > 0);
        const pct = (kind: 'tower' | 'nexus', team: 0 | 1, lane?: LaneId) => {
            const unit = units.find((entry) => entry.kind === kind && entry.team === team && (lane === undefined || entry.lane === lane));
            return unit ? `${Math.round((unit.hp / unit.maxHp) * 100)}%` : '--';
        };
        return `TOP ${pct('tower', 0, 0)}/${pct('tower', 1, 0)}   MID ${pct('tower', 0, 1)}/${pct('tower', 1, 1)}   BOT ${pct('tower', 0, 2)}/${pct('tower', 1, 2)}   NX ${pct('nexus', 0)}/${pct('nexus', 1)}`;
    }

    private pickDeck(slot: DeckSlot) {
        this.picked = slot;
        if (slot.kind === 'tree' && slot.tree) {
            this.state.tab = slot.tree === 'gui' ? 'screen' : 'trees';
            this.shopIndex = TREE_IDS.indexOf(slot.tree);
            buyTreeLevels(this.state, slot.tree);
        } else if (slot.kind === 'lane' && slot.lane !== undefined) {
            setLane(this.state, slot.lane);
            buyLaneLevels(this.state, slot.lane);
        } else if (slot.meta === 'efficiency') {
            buyEfficiency(this.state);
        } else if (slot.meta === 'haptic') {
            buyHaptic(this.state);
        } else if (slot.meta === 'insight') {
            buyInsight(this.state);
        }
        this.sfx.upgrade();
        rumble(PATTERNS.upgrade, this.state.meta.haptic);
        refreshCockpit(this.cockpit, this.state, this.era(), this.picked);
        this.cockpit.context.setText(slotBlurb(slot, this.state));
        if (this.era().id !== this.eraId) {
            this.onEraUp();
        }
    }

    private pickRoster(id: string) {
        const progress = this.state.champions[id];
        if (!progress?.unlocked) {
            unlockChampion(this.state, id);
        } else if (this.state.selectedChampion !== id) {
            selectChampion(this.state, id);
            this.flash(`${championById(id).name} as ${championById(id).greek}`);
        } else {
            buyChampionLevels(this.state, id);
        }
        this.sfx.tap();
        rumble(PATTERNS.tap, this.state.meta.haptic);
        refreshCockpit(this.cockpit, this.state, this.era(), this.picked);
    }

    private onEraUp() {
        const era = this.era();
        this.applySkin(true);
        this.sfx.tier();
        rumble(PATTERNS.tier, this.state.meta.haptic + 2);
        this.flash(era.perfect ? 'THE PERFECT GAME' : `ERA  ${era.title}`);
        this.cameras.main.flash(120, 226, 195, 107, false);
        spawnBurst(this.sparks, WIDTH / 2, 360, era.gold, 22, 110);
    }

    private shopCount(): number {
        if (this.state.tab === 'screen') {
            return 1;
        }
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
        const era = this.era();
        this.shopArt.clear();
        if (this.state.tab === 'screen') {
            const col = this.state.trees.gui;
            const upcoming = nextEra(col);
            const cost = treeNextCost(this.state, 'gui');
            this.shopTitle.setText(`${era.title}`);
            this.shopBody.setText(
                `${era.blurb}\n\nScreen ${col.level} / ${LEVELS_PER_TIER}   Tier ${col.tier}\n${upcoming ? `Next era ${upcoming.title} at ${upcoming.minLevel}` : 'Nothing left to sand.'}\nCost ${formatNum(cost)}g   ·   ${blessingName(col.level)}\nThe GUI is a column. It upgrades like everything else.`,
            );
            this.shopHint.setText(era.perfect ? 'You are playing the Perfect Game.' : 'UPGRADE the screen. The game changes around your hand.');
            this.drawPortrait(champSheet(this.state.selectedChampion), championById(this.state.selectedChampion).color);
            this.drawMeter(eraProgress(col));
            return;
        }
        const power = derivePower(this.state);
        if (this.state.tab === 'trees') {
            const id = TREE_IDS[this.shopIndex];
            const def = TREE_DEFS[id];
            const col = this.state.trees[id];
            this.shopTitle.setText(`${def.title}  ·  ${def.greek}`);
            this.shopBody.setText(
                `${def.blurb}\n\nTier ${col.tier}   ${col.level} / ${LEVELS_PER_TIER}\nNext ${blessingName(col.level)}\n${formatNum(treeNextCost(this.state, id))}g   ·   Power ${formatNum(power.clickDamage + power.dps)}\n${this.insightLine(col.level)}`,
            );
            this.shopHint.setText('Gold buys the next named blessing in this tier.');
            this.drawPortrait(id === 'gui' ? champSheet(this.state.selectedChampion) : MINION, def.color);
            this.drawMeter(col.level / LEVELS_PER_TIER);
            return;
        }
        if (this.state.tab === 'tiers') {
            const id = TREE_IDS[this.shopIndex];
            const def = TREE_DEFS[id];
            const col = this.state.trees[id];
            this.shopTitle.setText(`ASCEND ${def.title.toUpperCase()}`);
            this.shopBody.setText(
                `${def.greek}, Tier ${col.tier}.\nGlory ${formatNum(tierCost(col.tier))}  ·  you have ${formatNum(this.state.glory)}\nLevels stay. The multiplier grows.`,
            );
            this.shopHint.setText('Win matches for Glory, then lift the tier.');
            this.drawPortrait(TOWER, def.color);
            return;
        }
        if (this.state.tab === 'roster') {
            const champ = CHAMPIONS[this.shopIndex];
            const progress = this.state.champions[champ.id];
            const selected = this.state.selectedChampion === champ.id ? '  ·  FIELDING' : '';
            this.shopTitle.setText(`${champ.name}  as  ${champ.greek}${selected}`);
            this.drawPortrait(champSheet(champ.id), champ.color);
            if (!progress.unlocked) {
                this.shopBody.setText(`${champ.domain}\n${champ.role.toUpperCase()}  ·  ${champ.blurb}\n\nUnlock ${champ.unlockGlory} Glory.`);
                this.shopHint.setText('UPGRADE unlocks, then fields, then levels.');
                return;
            }
            this.shopBody.setText(
                `${champ.domain}\n${champ.blurb}\n\n${progress.level} / ${LEVELS_PER_TIER}   Tier ${progress.tier}\n${formatNum(championNextCost(this.state, champ.id))}g   ·   Tier ${formatNum(championTierCost(progress.tier))} Glory\nClick ×${champ.click}  Idle ×${champ.idle}  Gold ×${champ.gold}`,
            );
            this.shopHint.setText('UPGRADE fields them, then buys levels. MAX spends Glory on their tier.');
            this.drawMeter(progress.level / LEVELS_PER_TIER);
            return;
        }
        if (this.state.tab === 'lanes') {
            const lane = this.shopIndex as LaneId;
            const col = this.state.lanes[lane];
            this.shopTitle.setText(`${LANE_NAMES[lane].toUpperCase()}  ·  ${LANE_GREEK[lane]}`);
            this.shopBody.setText(
                `Corridor blessing.\n${col.level} / ${LEVELS_PER_TIER}   Tier ${col.tier}\n${formatNum(laneNextCost(this.state, lane))}g   ·   ${formatNum(tierCost(col.tier))} Glory`,
            );
            this.shopHint.setText('UPGRADE buys lane levels. MAX spends Glory on the lane tier.');
            this.drawPortrait(CAMP, era.ok);
            return;
        }
        const rows = [
            { title: 'Shop efficiency', body: `${this.state.meta.efficiency} / 40\n1.5% off every gold price.\nNext ${formatNum(efficiencyCost(this.state.meta.efficiency))}g` },
            { title: 'Tactile rite', body: `Haptic ${this.state.meta.haptic} / 8\nRicher vibration, a sliver more crit.\nNext ${formatNum(hapticCost(this.state.meta.haptic))}g` },
            { title: 'Blessing insight', body: `${this.state.meta.insight} / 5\nSee further names in the 9000-catalog.\nNext ${formatNum(insightCost(this.state.meta.insight))} Glory` },
            { title: 'Auto-buy', body: this.state.meta.autoBuy ? 'The shop spends idle gold on the cheapest tree.' : 'Enable with AUTO. The lane buys while you rest.' },
        ];
        const row = rows[this.shopIndex] ?? rows[0];
        this.shopTitle.setText(row.title);
        this.shopBody.setText(row.body);
        this.shopHint.setText('Everything upgrades — including the glass you are looking through.');
        this.drawPortrait(NEXUS, era.gold);
    }

    private drawPortrait(sheet: string[], body: number) {
        const era = this.era();
        if (!era.portraits) {
            return;
        }
        blit(this.shopArt, sheet, 64, 930, { ...era, pixel: Math.max(5, era.pixel) }, paletteFor(era, body, era.gold), 1, Math.sin(this.pulse * 6) * 2);
    }

    private drawMeter(ratio: number) {
        const era = this.era();
        if (!era.sleek) {
            return;
        }
        this.shopArt.fillStyle(era.ink, 1);
        this.shopArt.fillRect(120, 1014, 560, 8);
        this.shopArt.fillStyle(era.gold, 1);
        this.shopArt.fillRect(120, 1014, 560 * Math.max(0.02, Math.min(1, ratio)), 8);
    }

    private insightLine(level: number): string {
        const depth = 1 + this.state.meta.insight;
        const names = [];
        for (let i = 0; i < depth && level + i < LEVELS_PER_TIER; i += 1) {
            names.push(blessingName(level + i));
        }
        return names.length ? names.join('  ·  ') : 'Tier complete.';
    }

    private buyCurrent() {
        const intensity = this.state.meta.haptic;
        const before = this.era().id;
        let bought = false;
        if (this.state.tab === 'screen') {
            if (this.state.bulk === 'max' && this.state.glory >= tierCost(this.state.trees.gui.tier)) {
                bought = buyTreeTier(this.state, 'gui');
            } else {
                const result = buyTreeLevels(this.state, 'gui');
                bought = result.bought > 0;
            }
        } else if (this.state.tab === 'trees') {
            const id = TREE_IDS[this.shopIndex] as TreeId;
            const result = buyTreeLevels(this.state, id);
            bought = result.bought > 0;
            if (bought) {
                this.flash(`${result.bought} · ${TREE_DEFS[id].title}`);
            }
        } else if (this.state.tab === 'tiers') {
            bought = buyTreeTier(this.state, TREE_IDS[this.shopIndex]);
            if (bought) {
                this.sfx.tier();
                rumble(PATTERNS.tier, intensity);
                this.flash(`${TREE_DEFS[TREE_IDS[this.shopIndex]].title} rises a tier.`);
            }
        } else if (this.state.tab === 'roster') {
            const champ = CHAMPIONS[this.shopIndex];
            const progress = this.state.champions[champ.id];
            if (!progress.unlocked) {
                bought = unlockChampion(this.state, champ.id);
            } else if (this.state.selectedChampion !== champ.id) {
                bought = selectChampion(this.state, champ.id);
                if (bought) {
                    this.flash(`${champ.name} as ${champ.greek}`);
                }
            } else if (this.state.bulk === 'max' && this.state.glory >= championTierCost(progress.tier)) {
                bought = buyChampionTier(this.state, champ.id);
            } else {
                bought = buyChampionLevels(this.state, champ.id).bought > 0;
            }
        } else if (this.state.tab === 'lanes') {
            const lane = this.shopIndex as LaneId;
            if (this.state.bulk === 'max' && this.state.glory >= tierCost(this.state.lanes[lane].tier)) {
                bought = buyLaneTier(this.state, lane);
            } else {
                bought = buyLaneLevels(this.state, lane).bought > 0;
            }
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
            if (this.era().particles) {
                spawnBurst(this.sparks, 360, 1060, this.era().gold, 8, 50);
            }
        } else {
            rumble(PATTERNS.defeat, Math.max(1, intensity - 2));
        }
        if (this.era().id !== before) {
            this.onEraUp();
        }
        this.refreshShop();
    }

    private refreshChips() {
        const era = this.era();
        for (const lane of this.laneChips) {
            restyleChip(lane, era, this.state.selectedLane === lane.lane ? era.sea : era.ink);
        }
        for (const tab of this.tabChips) {
            restyleChip(tab, era, this.state.tab === tab.id ? era.wine : era.panelAlt);
        }
        for (const bulk of this.bulkChips) {
            restyleChip(bulk, era, this.state.bulk === bulk.id ? era.ok : era.ink);
        }
        restyleChip(this.autoChip, era, this.state.meta.autoBuy ? era.ok : era.sea);
    }

    private drawHud() {
        const era = this.era();
        const power = derivePower(this.state);
        this.hudGold.setText(era.sleek ? `${formatNum(this.state.gold)} gold` : `${formatNum(this.state.gold)} GOLD`);
        this.hudGlory.setText(this.cathodeLike ? `${formatNum(this.state.glory)} SCR` : `${formatNum(this.state.glory)} glory`);
        this.hudPower.setText(
            era.portraits
                ? `TAP ${formatNum(power.clickDamage)}   IDLE ${formatNum(power.dps)}/s   CRIT ${Math.round(power.critChance * 100)}%   GPS ${formatNum(power.goldPerSecond)}`
                : '',
        );
        const champ = championById(this.state.selectedChampion);
        this.hudMatch.setText(`M${this.state.match.index + 1}  ${champ.name}/${champ.greek}${this.state.meta.autoBuy ? '  AUTO' : ''}`);
        this.hudEra.setText(era.perfect ? 'PERFECT GAME' : `ERA  ${era.title}`);
    }

    private get cathodeLike(): boolean {
        return !this.era().portraits;
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
        if (pointer.y < this.arenaTop() || pointer.y > this.arenaBottom()) {
            return;
        }
        const era = this.era();
        const lane = this.laneFromX(pointer.x);
        setLane(this.state, lane);
        const camp = Math.abs(pointer.x - LANE_X[lane]) > 70 && (lane === 0 || lane === 2);
        const events = performClick(this.state, camp);
        this.sfx.tap();
        rumble(PATTERNS.tap, this.state.meta.haptic);
        this.cameras.main.shake(era.sleek ? 36 : 55, era.perfect ? 0.0016 : 0.003);
        for (const event of events) {
            this.feel(event);
        }
        const power = derivePower(this.state);
        this.floatAt(pointer.x, pointer.y - 16, `+${formatNum(power.goldPerClick)}`, era.goldHex);
        if (era.particles) {
            spawnBurst(this.sparks, pointer.x, pointer.y, era.gold, 6, 40);
        }
    }

    private feel(event: MatchEvent) {
        const era = this.era();
        const x = LANE_X[event.lane];
        const y = this.worldY(event.x ?? 50);
        if (event.kind === 'crit') {
            this.sfx.crit();
            rumble(PATTERNS.crit, this.state.meta.haptic);
            this.floatAt(x, y, `CRIT ${formatNum(event.amount)}`, era.ivory);
            this.cameras.main.flash(40, 226, 195, 107, false);
            if (era.particles) {
                spawnBurst(this.sparks, x, y, era.gold, 12, 70);
            }
        } else if (event.kind === 'lastHit') {
            this.sfx.lastHit();
            rumble(PATTERNS.lastHit, this.state.meta.haptic);
            this.floatAt(x, y, `GLEAM +${formatNum(event.amount)}`, '#7a9e4a');
            if (era.particles) {
                spawnBurst(this.sparks, x, y, era.ok, 8, 50);
            }
        } else if (event.kind === 'tower') {
            rumble(PATTERNS.tower, this.state.meta.haptic);
            this.floatAt(x, y, 'TOWER', '#e07040');
        } else if (event.kind === 'omen') {
            this.sfx.omen();
            rumble(PATTERNS.omen, this.state.meta.haptic);
        } else if (event.kind === 'gold' && event.amount > 2) {
            this.floatAt(x, y, `+${formatNum(event.amount)}`, era.goldHex);
        }
    }

    private worldY(pos: number): number {
        const top = this.arenaTop();
        const bottom = this.arenaBottom();
        return top + 16 + (pos / 100) * (bottom - top - 32);
    }

    private drawArena() {
        const era = this.era();
        const g = this.gfx;
        g.clear();
        const top = this.arenaTop();
        const bottom = this.arenaBottom();
        g.fillStyle(era.bg, 1);
        g.fillRect(0, top, WIDTH, bottom - top);
        for (let i = 0; i < 3; i += 1) {
            const hot = this.state.selectedLane === i;
            roundRect(g, LANE_X[i] - 48, top + 8, 96, bottom - top - 16, era.rounded, hot ? era.laneHot : era.lane);
            strokeRect(g, LANE_X[i] - 48, top + 8, 96, bottom - top - 16, era.rounded, hot ? era.gold : era.ink, hot ? 0.9 : 0.4);
            if (era.trails && hot) {
                g.fillStyle(era.gold, 0.05 + Math.sin(this.pulse * 5) * 0.03);
                g.fillRect(LANE_X[i] - 6, top + 16, 12, bottom - top - 32);
            }
        }
        if (era.perfect) {
            g.lineStyle(2, era.gold, 0.25 + Math.sin(this.pulse * 2) * 0.08);
            g.strokeRect(8, top + 4, WIDTH - 16, bottom - top - 8);
        }
        for (const unit of this.state.match.units) {
            if (unit.hp > 0) {
                this.drawUnit(g, unit, era);
            }
        }
        stepSparks(g, this.sparks, 1 / 30);
        scanlines(g, 0, top, WIDTH, bottom - top, era.scanlines);
        if (era.perfect) {
            g.fillStyle(era.gold, 0.035);
            for (let i = 0; i < 6; i += 1) {
                const y = top + ((this.pulse * 40 + i * 90) % (bottom - top));
                g.fillRect(20 + i * 120, y, 2, 8);
            }
        }
    }

    private drawUnit(g: GameObjects.Graphics, unit: CombatUnit, era: Era) {
        const x = unit.kind === 'camp' ? LANE_X[unit.lane] + (unit.lane === 0 ? -88 : 88) : unit.kind === 'nexus' ? WIDTH / 2 : LANE_X[unit.lane];
        const y = this.worldY(unit.pos);
        const ally = unit.team === 0;
        const body = unit.kind === 'camp' ? era.ok : ally ? era.ally : era.enemy;
        const accent = unit.kind === 'champ' && ally ? championById(this.state.selectedChampion).color : era.gold;
        const bob = era.bob ? Math.sin(this.pulse * 7 + unit.id) * era.bob : 0;
        let sheet = MINION;
        if (unit.kind === 'tower') {
            sheet = TOWER;
        } else if (unit.kind === 'nexus') {
            sheet = NEXUS;
        } else if (unit.kind === 'camp') {
            sheet = CAMP;
        } else if (unit.kind === 'champ') {
            sheet = ally ? champSheet(this.state.selectedChampion) : FOE;
            if (era.frames >= 3 && unit.attackCd > 0.35) {
                sheet = attackSheet(sheet);
            } else if (era.frames >= 2 && Math.floor(unit.pos + this.pulse * 9) % 2 === 1) {
                sheet = shiftSheet(sheet, 1);
            }
        } else if (era.frames >= 2 && Math.floor(this.pulse * 8 + unit.id) % 2 === 1) {
            sheet = shiftSheet(MINION, 1);
        }
        if (!era.portraits && (unit.kind === 'minion' || unit.kind === 'champ')) {
            g.fillStyle(body, 1);
            const r = unit.kind === 'champ' ? 12 : 6;
            g.fillRect(x - r, y - r + bob, r * 2, r * 2);
        } else {
            blit(g, sheet, x, y, era, paletteFor(era, body, accent), ally ? 1 : -1, bob);
        }
        const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
        const bw = unit.kind === 'nexus' ? 36 : 22;
        g.fillStyle(0x100810, 1);
        g.fillRect(x - bw / 2, y + 18, bw, era.sleek ? 4 : 3);
        g.fillStyle(ratio > 0.35 ? era.ok : era.enemy, 1);
        g.fillRect(x - bw / 2, y + 18, bw * ratio, era.sleek ? 4 : 3);
    }

    private floatAt(x: number, y: number, text: string, color: string) {
        const era = this.era();
        const node = this.add
            .text(x, y, text, {
                fontFamily: era.font,
                fontSize: era.sleek ? '20px' : '16px',
                color,
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: era.sleek ? 4 : 2,
            })
            .setOrigin(0.5)
            .setDepth(15);
        this.floaters.push({ text: node, life: era.sleek ? 1.05 : 0.7 });
    }

    private stepFloaters(dt: number) {
        const keep: Floater[] = [];
        for (const floater of this.floaters) {
            floater.life -= dt;
            floater.text.y -= 30 * dt;
            floater.text.setAlpha(Math.max(0, floater.life));
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
        this.tweens.add({ targets: this.toast, alpha: 0, delay: 1500, duration: 380 });
    }
}
