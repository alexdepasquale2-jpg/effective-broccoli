import { AUTO, Game, Scale } from 'phaser';
import { HEIGHT, RENDER_SCALE, WIDTH } from './sim/constants.ts';
import { Board } from './scenes/Board.ts';

const StartMergeborn = (parent: string) =>
    new Game({
        type: AUTO,
        width: WIDTH * RENDER_SCALE,
        height: HEIGHT * RENDER_SCALE,
        parent,
        backgroundColor: '#11131a',
        scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
        render: { antialias: true },
        scene: [Board],
    });

export default StartMergeborn;
