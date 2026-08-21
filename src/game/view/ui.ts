import { GameObjects, Scene } from 'phaser';

export function addPanel(
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    fill = 0x121a2b,
): GameObjects.Rectangle {
    return scene.add
        .rectangle(x, y, w, h, fill, 0.94)
        .setOrigin(0, 0)
        .setStrokeStyle(1, 0x2a3d5c);
}

export function addLabel(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    size = 14,
    color = '#e8eef7',
    originX = 0,
    originY = 0,
): GameObjects.Text {
    return scene.add
        .text(x, y, text, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: `${size}px`,
            color,
        })
        .setOrigin(originX, originY);
}

export function addButton(
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fill: number,
    onClick: () => void,
): { root: GameObjects.Container; bg: GameObjects.Rectangle; label: GameObjects.Text } {
    const bg = scene.add.rectangle(0, 0, w, h, fill, 1).setStrokeStyle(1, 0x93a4bf);
    const text = scene.add
        .text(0, 0, label, {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: h >= 44 ? '15px' : '13px',
            color: '#f4f7fb',
            fontStyle: 'bold',
        })
        .setOrigin(0.5);
    const root = scene.add.container(x, y, [bg, text]);
    root.setSize(w, h);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(lighten(fill), 1));
    bg.on('pointerout', () => bg.setFillStyle(fill, 1));
    bg.on('pointerdown', () => onClick());
    return { root, bg, label: text };
}

export function leanTint(lean: number): number {
    const t = (clamp(lean, -100, 100) + 100) / 200;
    const ru = { r: 122, g: 28, b: 42 };
    const mid = { r: 72, g: 84, b: 98 };
    const eu = { r: 196, g: 150, b: 42 };
    const from = t < 0.5 ? ru : mid;
    const to = t < 0.5 ? mid : eu;
    const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const r = Math.round(from.r + (to.r - from.r) * u);
    const g = Math.round(from.g + (to.g - from.g) * u);
    const b = Math.round(from.b + (to.b - from.b) * u);
    return (r << 16) | (g << 8) | b;
}

export function controlColor(control: 'eu' | 'ru' | 'contested'): string {
    if (control === 'eu') {
        return '#e2c36b';
    }
    if (control === 'ru') {
        return '#e07070';
    }
    return '#9aa8bd';
}

function lighten(color: number): number {
    const r = Math.min(255, ((color >> 16) & 255) + 22);
    const g = Math.min(255, ((color >> 8) & 255) + 22);
    const b = Math.min(255, (color & 255) + 22);
    return (r << 16) | (g << 8) | b;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
