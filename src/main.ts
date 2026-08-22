import StartCanon from './canon-lane/main';
import StartWar from './game/main';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('game') === 'war') {
        document.title = 'Warm War 2026';
        document.body.classList.add('landscape-game');
        StartWar('game-container');
        return;
    }
    document.title = 'Canon Lane';
    StartCanon('game-container');
});
