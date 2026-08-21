import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // All art is drawn in-engine so the theater loads with no extra files.
    }

    create() {
        this.scene.start('Preloader');
    }
}
