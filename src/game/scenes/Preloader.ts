import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x0b1220);
        const title = this.add
            .text(512, 340, 'ESTABLISHING LINK', {
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '18px',
                color: '#9bb0cc',
            })
            .setOrigin(0.5);
        title.setAlpha(0.85);

        this.add.rectangle(512, 392, 468, 10, 0x1b2a40).setOrigin(0.5);
        const bar = this.add.rectangle(278, 392, 4, 10, 0xd4a017).setOrigin(0, 0.5);

        this.tweens.add({
            targets: bar,
            width: 468,
            duration: 520,
            ease: 'Quad.easeInOut',
            onComplete: () => this.scene.start('MainMenu'),
        });
    }
}
