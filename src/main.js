import "./style.css";
import { Game } from "./game/game.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  hud: document.querySelector("#hud"),
  score: document.querySelector("#score"),
  best: document.querySelector("#best"),
  combo: document.querySelector("#combo"),
  title: document.querySelector("#title"),
  subtitle: document.querySelector("#subtitle"),
  result: document.querySelector("#result"),
  play: document.querySelector("#play"),
  fold: document.querySelector("#fold"),
  foldLabel: document.querySelector("#fold-label"),
  draft: document.querySelector("#draft"),
  boonRow: document.querySelector("#boon-row"),
  relics: document.querySelector("#relics"),
  sliceChip: document.querySelector("#slice-chip"),
  hunger: document.querySelector("#hunger"),
  rank: document.querySelector("#rank"),
  xpBar: document.querySelector("#xp-bar"),
  nextUnlock: document.querySelector("#next-unlock"),
  draftTitle: document.querySelector("#draft-title"),
  townHud: document.querySelector("#town-hud"),
  townCash: document.querySelector("#town-cash"),
  townClock: document.querySelector("#town-clock"),
  townHp: document.querySelector("#town-hp"),
  townStats: document.querySelector("#town-stats"),
  room: document.querySelector("#room"),
  roomTitle: document.querySelector("#room-title"),
  roomFlavor: document.querySelector("#room-flavor"),
  roomStats: document.querySelector("#room-stats"),
  roomActions: document.querySelector("#room-actions"),
  roomLog: document.querySelector("#room-log"),
  roomLeave: document.querySelector("#room-leave"),
};

const game = new Game(canvas, ui);
game.startLoop();

ui.play.addEventListener("click", () => {
  game.play();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (game.scene === "well" && game.state === "playing") {
      game.tryFold();
      return;
    }
  }
  if (event.code === "Space" || event.code === "Enter") {
    if (!game.ui.overlay.hidden) {
      event.preventDefault();
      game.play();
    }
  }
  if (event.code === "Escape") {
    game.closeRoom();
  }
});
