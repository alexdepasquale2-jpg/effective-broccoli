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
        // Smooth texture filtering, but no MSAA on the canvas: at 2× the edges are already smooth and MSAA multiplies fill cost.
        render: { antialias: true, antialiasGL: false, powerPreference: 'high-performance' },
        scene: [Board],
    });

export default StartMergeborn;
