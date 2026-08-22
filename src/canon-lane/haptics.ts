export const PATTERNS = {
    tap: 9,
    crit: [8, 18, 10, 18, 16],
    lastHit: [12, 22, 18],
    gold: 7,
    upgrade: [10, 16, 12],
    bulk: [8, 12, 8, 12, 14],
    tier: [18, 28, 18, 28, 36],
    tower: [16, 22, 28],
    omen: [10, 14, 10, 14, 22],
    victory: [14, 30, 14, 30, 14, 30, 50],
    defeat: [28, 40, 36],
    camp: [10, 16, 10],
} as const;

function scalePattern(pattern: number | readonly number[], intensity: number): number | number[] {
    const gain = 0.55 + intensity * 0.18;
    if (typeof pattern === 'number') {
        return Math.max(4, Math.round(pattern * gain));
    }
    return pattern.map((ms) => Math.max(4, Math.round(ms * gain)));
}

export function rumble(pattern: number | readonly number[], intensity = 1) {
    if (intensity <= 0 || typeof navigator === 'undefined' || !navigator.vibrate) {
        return;
    }
    try {
        navigator.vibrate(scalePattern(pattern, intensity));
    } catch {
        /* desktop or denied */
    }
}
