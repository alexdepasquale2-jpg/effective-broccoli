import { GameObjects, Scene } from 'phaser';
import { FONT, SANS } from './theme';

export function label(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    size = 14,
    color = '#f3efe4',
    font = FONT,
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
        scene.tweens.add({ targets: go, scaleX: 0.97, scaleY: 0.95, duration: 50, yoyo: true });
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
): { bg: GameObjects.Rectangle; text: GameObjects.Text } {
    const bg = scene.add.rectangle(x, y, w, h, fill, 1).setOrigin(0, 0).setStrokeStyle(1, 0xc9a227, 0.55);
    const text = scene.add
        .text(x + w / 2, y + h / 2, title, {
            fontFamily: SANS,
            fontSize: h >= 44 ? '15px' : '13px',
            color: '#f3efe4',
            fontStyle: 'bold',
        })
        .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    press(scene, bg, onClick);
    return { bg, text };
}
