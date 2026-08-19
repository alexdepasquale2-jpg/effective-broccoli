import "./style.css";
import { Game } from "./game/game.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  play: document.querySelector("#play"),
  recordLine: document.querySelector("#record-line"),

  hud: document.querySelector("#hud"),
  stillness: document.querySelector("#stillness"),
  multiplier: document.querySelector("#multiplier"),
  depthName: document.querySelector("#depth-name"),
  progress: document.querySelector("#progress"),
  untouched: document.querySelector("#untouched"),

  dock: document.querySelector("#dock"),
  nothingBtn: document.querySelector("#nothing-btn"),
  ledgerBtn: document.querySelector("#ledger-btn"),
  stopBtn: document.querySelector("#stop-btn"),

  ledgerSheet: document.querySelector("#ledger-sheet"),
  ledgerLines: document.querySelector("#ledger-lines"),
  ledgerVerdict: document.querySelector("#ledger-verdict"),
  ledgerClose: document.querySelector("#ledger-close"),

  endSheet: document.querySelector("#end-sheet"),
  endTitle: document.querySelector("#end-title"),
  endLead: document.querySelector("#end-lead"),
  endStats: document.querySelector("#end-stats"),
  endLines: document.querySelector("#end-lines"),
  endVerdict: document.querySelector("#end-verdict"),
  againBtn: document.querySelector("#again-btn"),
};

const game = new Game(canvas, ui);
game.startLoop();

function showRecord() {
  const r = game.record;
  if (!r.sessions) {
    ui.recordLine.textContent = "";
    return;
  }
  const changed = r.lifetimeActed
    ? `${r.lifetimeChanged} of your ${r.lifetimeActed} lifetime interventions changed anything.`
    : "You have never once intervened.";
  ui.recordLine.textContent = `Deepest stillness ${r.bestStillness}. ${changed}`;
}
showRecord();

ui.play.addEventListener("click", () => game.play());

ui.againBtn.addEventListener("click", () => {
  ui.endSheet.hidden = true;
  showRecord();
  game.play();
});

ui.nothingBtn.addEventListener("click", () => game.pressNothing());
ui.ledgerBtn.addEventListener("click", () => game.openLedger());
ui.ledgerClose.addEventListener("click", () => game.closeLedger());
ui.stopBtn.addEventListener("click", () => {
  game.endSession(false);
  showRecord();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Escape") game.closeLedger();
  if ((event.code === "Enter" || event.code === "Space") && !ui.overlay.hidden) {
    event.preventDefault();
    game.play();
  }
});
