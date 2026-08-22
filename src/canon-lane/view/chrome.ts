import { GameObjects, Scene } from 'phaser';
import type { Era } from './era.ts';

export function label(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    size = 14,
    color = '#f3efe4',
    font = 'Georgia, "Times New Roman", serif',
): GameObjects.Text {
    return scene.add
        .text(x, y, text, {
            fontFamily: font,
            fontSize: `${size}px`,
            color,
        })
        .setOrigin(0, 0);
}

export function press(scene: Scene, target: GameObjects.GameObject, onClick: () => void) {
    const go = target as GameObjects.Rectangle;
    go.on('pointerdown', () => {
        scene.tweens.add({ targets: go, scaleX: 0.96, scaleY: 0.94, duration: 55, yoyo: true });
        onClick();
    });
}

export function chip(
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: number,
    title: string,
    onClick: () => void,
    era?: Era,
): { bg: GameObjects.Rectangle; text: GameObjects.Text } {
    const rounded = era?.rounded ?? 0;
    const bg = scene.add.rectangle(x, y, w, h, fill, 1).setOrigin(0, 0).setStrokeStyle(1, era?.gold ?? 0xc9a227, 0.55);
    if (rounded > 0) {
        bg.setStrokeStyle(1, era?.gold ?? 0xc9a227, 0.7);
    }
    const text = scene.add
        .text(x + w / 2, y + h / 2, title, {
            fontFamily: era?.font ?? 'Arial, Helvetica, sans-serif',
            fontSize: h >= 48 ? '16px' : h >= 44 ? '14px' : '12px',
            color: era?.ivory ?? '#f3efe4',
            fontStyle: 'bold',
        })
        .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    press(scene, bg, onClick);
    return { bg, text };
}

export function restyleChip(entry: { bg: GameObjects.Rectangle; text: GameObjects.Text }, era: Era, fill: number) {
    entry.bg.setFillStyle(fill, 1);
    entry.bg.setStrokeStyle(era.sleek ? 2 : 1, era.gold, era.perfect ? 0.9 : 0.5);
    entry.text.setStyle({ fontFamily: era.font, color: era.ivory });
}
