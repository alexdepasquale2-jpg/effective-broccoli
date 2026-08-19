import "./style.css";
import { Game } from "./game/game.js";
import { recordLine } from "./game/storage.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  play: document.querySelector("#play"),
  recordLine: document.querySelector("#record-line"),

  hud: document.querySelector("#hud"),
  stillness: document.querySelector("#stillness"),
  multiplier: document.querySelector("#multiplier"),
  depthName: document.querySelector("#depth-name"),
  depthTrack: document.querySelector("#depth-track"),
  dayLabel: document.querySelector("#day-label"),
  seasonLabel: document.querySelector("#season-label"),
  vitality: document.querySelector("#vitality"),
  vitalityText: document.querySelector("#vitality-text"),
  tally: document.querySelector("#tally"),
  attuneLabel: document.querySelector("#attune-label"),
  chronicleBtn: document.querySelector("#chronicle-btn"),

  nightSheet: document.querySelector("#night-sheet"),
  nightTitle: document.querySelector("#night-title"),
  nightSub: document.querySelector("#night-sub"),
  nightBody: document.querySelector("#night-body"),
  nightWorld: document.querySelector("#night-world"),
  sleepBtn: document.querySelector("#sleep-btn"),

  chronicleSheet: document.querySelector("#chronicle-sheet"),
  chronicleLines: document.querySelector("#chronicle-lines"),
  chronicleLog: document.querySelector("#chronicle-log"),
  chronicleClose: document.querySelector("#chronicle-close"),

  endSheet: document.querySelector("#end-sheet"),
  endTitle: document.querySelector("#end-title"),
  endWorld: document.querySelector("#end-world"),
  endWorldVerdict: document.querySelector("#end-world-verdict"),
  endStats: document.querySelector("#end-stats"),
  endLines: document.querySelector("#end-lines"),
  endVerdict: document.querySelector("#end-verdict"),
  againBtn: document.querySelector("#again-btn"),
};

const game = new Game(canvas, ui);
game.startLoop();

function showRecord() {
  ui.recordLine.textContent = recordLine(game.record);
}
showRecord();

ui.play.addEventListener("click", () => game.start());
ui.sleepBtn.addEventListener("click", () => game.sleep());
ui.chronicleBtn.addEventListener("click", () => game.openChronicle());
ui.chronicleClose.addEventListener("click", () => game.closeChronicle());
ui.againBtn.addEventListener("click", () => {
  ui.endSheet.hidden = true;
  showRecord();
  game.start();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Escape") game.closeChronicle();
  if ((event.code === "Enter" || event.code === "Space") && !ui.overlay.hidden) {
    event.preventDefault();
    game.start();
  }
  if ((event.code === "Enter" || event.code === "Space") && !ui.nightSheet.hidden) {
    event.preventDefault();
    game.sleep();
  }
});
