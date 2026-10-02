import { AUTO, Game, Scale } from 'phaser';
import { HEIGHT, WIDTH } from './sim/constants.ts';
import { Board } from './scenes/Board.ts';

const StartMergeborn = (parent: string) =>
    new Game({
        type: AUTO,
        width: WIDTH,
        height: HEIGHT,
        parent,
        backgroundColor: '#11131a',
        scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
        scene: [Board],
    });

export default StartMergeborn;
