import type { Color, Square } from './engine/chess.ts';
import { Match, SPECIES, STARS_PER_CAPTURE, STARS_PER_TURN, type Species } from './sim/species.ts';

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const FILES = 'abcdefgh';
const NAME: Record<Color, string> = { w: 'White', b: 'Black' };

const CSS = `
#sc { font-family: system-ui, sans-serif; color: #eee; background: #14161d; min-height: 100vh; padding: 16px; box-sizing: border-box; }
#sc h1 { margin: 0 0 12px; font-size: 22px; }
#sc button { font: inherit; color: inherit; background: #262a36; border: 1px solid #3a4050; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
#sc button:disabled { opacity: .45; cursor: default; }
#sc .pick { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
#sc .sp { display: block; width: 100%; text-align: left; margin: 6px 0; }
#sc .sp.on { border-color: #f5c84c; background: #3a3420; }
#sc .muted { color: #9aa3b5; font-size: 13px; }
#sc .wrap { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
#sc .board { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); width: min(92vw, 520px); aspect-ratio: 1; border: 2px solid #3a4050; }
#sc .sq { position: relative; display: flex; align-items: center; justify-content: center; font-size: min(8.5vw, 50px); cursor: pointer; user-select: none; }
#sc .l { background: #e9d8b4; } #sc .d { background: #b2875c; }
#sc .sel { outline: 3px solid #f5c84c; outline-offset: -3px; }
#sc .last { box-shadow: inset 0 0 0 100px rgba(245,200,76,.28); }
#sc .chk { box-shadow: inset 0 0 0 100px rgba(230,60,60,.55); }
#sc .dot::after { content: ''; position: absolute; width: 28%; height: 28%; border-radius: 50%; background: rgba(20,20,20,.35); }
#sc .cap::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; border: 4px solid rgba(20,20,20,.35); }
#sc .pw { color: #fff; text-shadow: 0 0 2px #000, 0 0 2px #000; } #sc .pb { color: #111; text-shadow: 0 0 1px #fff; }
#sc .side { flex: 1; min-width: 260px; max-width: 420px; }
#sc .panel { background: #1d2029; border: 1px solid #2d3240; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
#sc .panel.turn { border-color: #f5c84c; }
#sc .tech { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin: 6px 0; }
#sc .owned { color: #8fd18f; }
#sc .status { font-size: 18px; margin: 0 0 10px; }
`;

export default function StartSpeciesChess(parent: string) {
    const root = document.getElementById(parent)!;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    const el = document.createElement('div');
    el.id = 'sc';
    root.replaceChildren(el);

    const choice: Record<Color, Species> = { w: SPECIES[0], b: SPECIES[1] };
    let match: Match | null = null;
    let selected: Square | null = null;

    const setup = () => {
        const col = (c: Color) => `<div><h3>${NAME[c]}</h3>${SPECIES.map(s => `
            <button class="sp ${choice[c] === s ? 'on' : ''}" data-c="${c}" data-s="${s.id}">
              <b>${s.emoji} ${s.name}</b><br><span class="muted">${s.blurb}<br>Start: ${s.base.text}</span>
            </button>`).join('')}</div>`;
        el.innerHTML = `<h1>Species Chess</h1>
            <p class="muted">Pick a species per side. Earn ${STARS_PER_TURN}★ per turn and ${STARS_PER_CAPTURE}★ per capture; spend stars on your tech tree to give pieces new moves. Buying is free — you still move.</p>
            <div class="pick">${col('w')}${col('b')}</div><p><button id="go">Start game</button></p>`;
        el.querySelectorAll<HTMLButtonElement>('.sp').forEach(b => b.onclick = () => {
            choice[b.dataset.c as Color] = SPECIES.find(s => s.id === b.dataset.s)!;
            setup();
        });
        el.querySelector<HTMLButtonElement>('#go')!.onclick = () => {
            match = new Match(choice.w, choice.b);
            selected = null;
            render();
        };
    };

    const status = (m: Match) => {
        const c = m.chess, t = NAME[c.turn()];
        if (c.isCheckmate()) return `Checkmate — ${NAME[c.turn() === 'w' ? 'b' : 'w']} wins!`;
        if (c.isDraw()) return 'Draw.';
        return `${t} to move${c.isCheck() ? ' — check!' : ''}`;
    };

    const panel = (m: Match, c: Color) => {
        const s = m.species[c];
        const techs = s.techs.map(t => {
            const owned = m.owned[c].includes(t.id);
            const why = owned ? null : m.blocker(c, t.id);
            return `<div class="tech"><span><b>${t.name}</b> <span class="muted">${t.cost}★</span><br><span class="muted">${t.text}</span></span>
                ${owned ? '<span class="owned">✓</span>' : `<button data-buy="${t.id}" data-c="${c}" ${why ? `disabled title="${why}"` : ''}>${why ?? 'Buy'}</button>`}</div>`;
        }).join('');
        return `<div class="panel ${m.chess.turn() === c ? 'turn' : ''}">
            <b>${NAME[c]}: ${s.emoji} ${s.name}</b> — <b>${m.stars[c]}★</b>
            <div class="muted">✓ ${s.base.name}: ${s.base.text}</div>${techs}</div>`;
    };

    const render = () => {
        const m = match!;
        const targets = selected ? m.targets(selected) : [];
        const hist = m.chess.history({ verbose: true });
        const last = hist[hist.length - 1];
        let cells = '';
        for (let r = 8; r >= 1; r--) {
            for (let f = 0; f < 8; f++) {
                const sq = `${FILES[f]}${r}` as Square;
                const p = m.chess.get(sq);
                const t = targets.find(x => x.to === sq);
                const cls = [(f + r) % 2 ? 'l' : 'd',
                    sq === selected && 'sel',
                    last && (sq === last.from || sq === last.to) && 'last',
                    p?.type === 'k' && p.color === m.chess.turn() && m.chess.isCheck() && 'chk',
                    t && (p ? 'cap' : 'dot')].filter(Boolean).join(' ');
                cells += `<div class="sq ${cls}" data-sq="${sq}">${p ? `<span class="p${p.color}">${GLYPH[p.type]}</span>` : ''}</div>`;
            }
        }
        el.innerHTML = `<h1>Species Chess</h1><div class="wrap">
            <div><p class="status">${status(m)}</p><div class="board">${cells}</div></div>
            <div class="side">${panel(m, 'b')}${panel(m, 'w')}<button id="new">New game</button></div></div>`;
        el.querySelectorAll<HTMLElement>('.sq').forEach(d => d.onclick = () => click(d.dataset.sq as Square));
        el.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(b => b.onclick = () => {
            m.buy(b.dataset.c as Color, b.dataset.buy!);
            selected = null;
            render();
        });
        el.querySelector<HTMLButtonElement>('#new')!.onclick = setup;
    };

    const click = (sq: Square) => {
        const m = match!;
        if (m.chess.isGameOver()) return;
        if (selected && m.move(selected, sq)) selected = null;
        else selected = m.chess.get(sq)?.color === m.chess.turn() && sq !== selected ? sq : null;
        render();
    };

    setup();
}
