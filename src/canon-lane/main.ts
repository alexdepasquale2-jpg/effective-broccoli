import { AUTO, Game, Scale } from 'phaser';
import { HEIGHT, WIDTH } from './sim/constants.ts';
import { Title } from './scenes/Title.ts';
import { Arena } from './scenes/Arena.ts';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0c0a14',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    input: {
        activePointers: 3,
    },
    scene: [Title, Arena],
};

const StartCanon = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartCanon;
