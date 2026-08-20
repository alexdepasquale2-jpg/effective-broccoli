import "./style.css";
import { Game } from "./game/game.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  play: document.querySelector("#play"),

  hud: document.querySelector("#hud"),
  stillness: document.querySelector("#stillness"),
  multiplier: document.querySelector("#multiplier"),
  depthName: document.querySelector("#depth-name"),
  depthTrack: document.querySelector("#depth-track"),
  dayLabel: document.querySelector("#day-label"),
  seasonLabel: document.querySelector("#season-label"),
  tally: document.querySelector("#tally"),
  actionBtn: document.querySelector("#action-btn"),

  endSheet: document.querySelector("#end-sheet"),
  endTitle: document.querySelector("#end-title"),
  endStats: document.querySelector("#end-stats"),
  endLines: document.querySelector("#end-lines"),
  endVerdict: document.querySelector("#end-verdict"),
  againBtn: document.querySelector("#again-btn"),
};

const game = new Game(canvas, ui);
game.startLoop();

ui.play.addEventListener("click", () => game.start());
ui.againBtn.addEventListener("click", () => {
  ui.endSheet.hidden = true;
  game.start();
});

ui.actionBtn?.addEventListener("click", () => {
  game.playerAct();
});

document.addEventListener("keydown", (event) => {
  if ((event.code === "Enter" || event.code === "Space") && !ui.overlay.hidden) {
    event.preventDefault();
    game.start();
  }
});
