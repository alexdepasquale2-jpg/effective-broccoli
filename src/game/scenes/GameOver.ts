import { Scene } from 'phaser';
import type { Faction, Outcome } from '../sim/types';
import { addButton, addLabel } from '../view/ui';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x0b1220);
        const outcome = (this.registry.get('outcome') as Outcome) || {
            kind: 'timed',
            winner: 'none',
            title: 'CLOCK OUT',
            blurb: 'The season window closed.',
        };
        const player = (this.registry.get('player') as Faction) || 'eu';
        const eu = Number(this.registry.get('euCount') || 0);
        const ru = Number(this.registry.get('ruCount') || 0);
        const heat = Number(this.registry.get('heat') || 0);

        const youWon = outcome.winner === player;
        const accent = outcome.kind === 'hot' ? '#e07070' : youWon ? '#e2c36b' : '#9aa8bd';

        addLabel(this, 512, 150, 'WARM WAR 2026', 16, '#6f829c', 0.5, 0.5);
        addLabel(this, 512, 210, outcome.title, 42, accent, 0.5, 0.5);
        addLabel(this, 512, 280, outcome.blurb, 16, '#c5d0e0', 0.5, 0.5).setAlign('center').setWordWrapWidth(720);
        addLabel(
            this,
            512,
            380,
            `Theaters  Europe ${eu}  ·  Russia ${ru}     Heat ${heat}\nYou commanded ${player === 'eu' ? 'the European Coalition' : 'the Russian Federation'}.`,
            15,
            '#9aa8bd',
            0.5,
            0.5,
        ).setAlign('center');

        addButton(this, 370, 520, 220, 52, 'REMATCH', 0x3a4f2a, () => this.scene.start('Game'));
        addButton(this, 654, 520, 220, 52, 'CHANGE SIDE', 0x5a2428, () => this.scene.start('MainMenu'));
        addLabel(this, 512, 700, 'A strategy game. Not a forecast.', 12, '#5e6e84', 0.5, 0.5);
    }
}
