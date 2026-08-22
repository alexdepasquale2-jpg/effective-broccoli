const SUFFIXES: string[] = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNum(n: number): string {
    if (!Number.isFinite(n)) {
        return '∞';
    }
    const sign = n < 0 ? '-' : '';
    let value = Math.abs(n);
    if (value < 10) {
        const rounded = Math.round(value * 10) / 10;
        return sign + (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
    }
    if (value < 1000) {
        return sign + String(Math.floor(value));
    }
    let index = 0;
    while (value >= 1000 && index < SUFFIXES.length - 1) {
        value /= 1000;
        index += 1;
    }
    if (index === SUFFIXES.length - 1 && value >= 1000) {
        return sign + Math.abs(n).toExponential(2).replace('+', '');
    }
    const digits = value < 10 ? 2 : value < 100 ? 1 : 0;
    const text = value.toFixed(digits).replace(/\.0+$/, '');
    return sign + text + SUFFIXES[index];
}

export function formatInt(n: number): string {
    return formatNum(Math.floor(n));
}

export function formatTime(seconds: number): string {
    if (seconds < 60) {
        return `${Math.max(0, Math.floor(seconds))}s`;
    }
    if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}m ${s}s`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}
