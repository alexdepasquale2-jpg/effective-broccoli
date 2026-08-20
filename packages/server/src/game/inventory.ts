import { INVENTORY_SLOTS, type InventorySlot, type ItemDef } from '@glimmer/shared';

/**
 * Slot-based inventory with stacking, matching how Glitch packs behaved:
 * a stack fills to the item's stackMax before a new slot is used.
 *
 * Returns how many of `count` actually fit, so callers can tell the player
 * their pack is full rather than silently destroying the surplus.
 */
export function addItem(
  slots: InventorySlot[],
  item: ItemDef,
  count: number,
): { slots: InventorySlot[]; added: number } {
  if (count <= 0) return { slots, added: 0 };

  const next = slots.map((s) => ({ ...s }));
  const stackMax = Math.max(1, item.stackMax);
  let remaining = count;

  // Top up existing stacks first.
  for (const slot of next) {
    if (remaining === 0) break;
    if (slot.item !== item.id || slot.count >= stackMax) continue;
    const room = stackMax - slot.count;
    const take = Math.min(room, remaining);
    slot.count += take;
    remaining -= take;
  }

  // Then open new slots.
  const used = new Set(next.map((s) => s.slot));
  for (let i = 0; i < INVENTORY_SLOTS && remaining > 0; i++) {
    if (used.has(i)) continue;
    const take = Math.min(stackMax, remaining);
    next.push({ slot: i, item: item.id, count: take });
    remaining -= take;
    used.add(i);
  }

  next.sort((a, b) => a.slot - b.slot);
  return { slots: next, added: count - remaining };
}

export function isFull(slots: InventorySlot[], item: ItemDef): boolean {
  if (slots.length < INVENTORY_SLOTS) return false;
  const stackMax = Math.max(1, item.stackMax);
  return !slots.some((s) => s.item === item.id && s.count < stackMax);
}

export function countOf(slots: InventorySlot[], itemId: string): number {
  return slots.reduce((sum, s) => (s.item === itemId ? sum + s.count : sum), 0);
}
