/** Elements arrive one per Ascend, in this order. Index + 1 is the element id; 0 = neutral. */
export const ELEMENTS = ['fire', 'water', 'earth', 'air', 'light', 'void'] as const;
export type Element = (typeof ELEMENTS)[number];

/** Counter wheel: Fire > Earth > Air > Water > Fire; Light and Void counter each other. */
const BEATS: Record<Element, Element> = {
    fire: 'earth',
    earth: 'air',
    air: 'water',
    water: 'fire',
    light: 'void',
    void: 'light',
};
export const COUNTER_MULT = 2;
export const COUNTERED_MULT = 0.5;

/** Damage multiplier for a card of element `a` (id) hitting an enemy of element `b` (id). */
export function counterMult(a: number, b: number): number {
    if (!a || !b) {
        return 1;
    }
    const ea = ELEMENTS[a - 1];
    const eb = ELEMENTS[b - 1];
    if (BEATS[ea] === eb) {
        return COUNTER_MULT;
    }
    return BEATS[eb] === ea ? COUNTERED_MULT : 1;
}

export interface Hero {
    id: string;
    name: string;
    element: Element;
    skill: string;
}

const h = (id: string, name: string, element: Element, skill: string): Hero => ({ id, name, element, skill });

export const HEROES: Hero[] = [
    h('fire-bellows', 'Fire Bellows', 'fire', 'Cards next to it +25% power'),
    h('magma-turtle', 'Magma Turtle', 'fire', 'Bosses take 5 s longer to escape'),
    h('flare-sprite', 'Flare Sprite', 'fire', 'Summons: 25% free card +1 tier, 10% burn'),
    h('ifrit-duelist', 'Ifrit Duelist', 'fire', 'Every 10th tap deals ×10'),
    h('smelter', 'Smelter', 'fire', 'Merging two Smelters pays 3× merge gold'),
    h('wildfire-hound', 'Wildfire Hound', 'fire', 'Board ×1.5 vs Earth enemies'),
    h('drowned-bellringer', 'Drowned Bellringer', 'water', 'After a boss kill, next 3 foes -30% HP'),
    h('tide-clerk', 'Tide Clerk', 'water', 'Offline gold +50%'),
    h('mirror-eel', 'Mirror Eel', 'water', 'Merges next to it: 10% leave a T1 copy'),
    h('rain-smuggler', 'Rain Smuggler', 'water', 'Summon cost -15%'),
    h('undertow-siren', 'Undertow Siren', 'water', 'Shields no longer reduce board damage'),
    h('abyss-diver', 'Abyss Diver', 'water', 'Board ×1.5 vs Fire enemies'),
    h('quarry-golem', 'Quarry Golem', 'earth', 'Board +10% per Earth card'),
    h('root-weaver', 'Root Weaver', 'earth', 'Neighbours +1 tier every 5 min'),
    h('moss-hermit', 'Moss Hermit', 'earth', 'No taps for 10 s: board ×2'),
    h('gem-miner', 'Gem Miner', 'earth', 'Kills: 5% chance of 10× gold'),
    h('tremor-ram', 'Tremor Ram', 'earth', 'Boss HP -20%'),
    h('stone-warden', 'Stone Warden', 'earth', 'Board ×1.5 vs Air enemies'),
    h('gale-courier', 'Gale Courier', 'air', 'Auto-taps twice per second'),
    h('kite-thief', 'Kite Thief', 'air', 'Taps earn 2% of damage as gold'),
    h('storm-bard', 'Storm Bard', 'air', 'Tap combo cap +5'),
    h('feather-monk', 'Feather Monk', 'air', 'Merges +3% chance of +2 tiers'),
    h('thunder-hawk', 'Thunder Hawk', 'air', 'Every 5 s: 5 s of board damage at once'),
    h('cyclone-dervish', 'Cyclone Dervish', 'air', 'Board ×1.5 vs Water enemies'),
    h('lantern-saint', 'Lantern Saint', 'light', 'All cards +10% power'),
    h('prism-knight', 'Prism Knight', 'light', 'Neighbours gain 30% of its power'),
    h('dawn-herald', 'Dawn Herald', 'light', 'First foe of each stage starts at 1 HP'),
    h('mirror-oracle', 'Mirror Oracle', 'light', 'Pity every 7th summon'),
    h('sun-forger', 'Sun Forger', 'light', 'Essence from Shuffle +20%'),
    h('radiant-judge', 'Radiant Judge', 'light', 'Board ×2 vs Void enemies'),
    h('hollow-king', 'Hollow King', 'void', 'Merges into it: 15% chance +2 tiers'),
    h('null-jester', 'Null Jester', 'void', 'Kill gold ×3 or ×0, coin flip'),
    h('rift-walker', 'Rift Walker', 'void', 'Merges with any element'),
    h('ink-wraith', 'Ink Wraith', 'void', 'Enemies lose 1% max HP per second'),
    h('eclipse-widow', 'Eclipse Widow', 'void', "Bosses can't regen or split"),
    h('abyssal-seer', 'Abyssal Seer', 'void', 'Board ×2 vs Light enemies'),
];

export const heroById = (id: string) => HEROES.find((x) => x.id === id);
export const elementId = (e: Element) => ELEMENTS.indexOf(e) + 1;
