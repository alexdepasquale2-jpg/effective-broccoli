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
};

const game = new Game(canvas, ui);
game.startLoop();

ui.play.addEventListener("click", () => {
  game.play();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (game.state === "playing") {
      game.tryFold();
      return;
    }
  }
  if (event.code === "Space" || event.code === "Enter") {
    if (game.state !== "playing" && game.state !== "dying" && game.state !== "draft") {
      event.preventDefault();
      game.play();
    }
  }
});
