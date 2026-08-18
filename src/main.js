import "./style.css";
import { Game } from "./game/game.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  play: document.querySelector("#play"),
  title: document.querySelector("#title"),
  subtitle: document.querySelector("#subtitle"),
  result: document.querySelector("#result"),
  rank: document.querySelector("#rank"),
  xpBar: document.querySelector("#xp-bar"),
  nextUnlock: document.querySelector("#next-unlock"),
  clanHud: document.querySelector("#clan-hud"),
  species: document.querySelector("#species"),
  clanLine: document.querySelector("#clan-line"),
  energy: document.querySelector("#energy"),
  thirst: document.querySelector("#thirst"),
  fear: document.querySelector("#fear"),
  bond: document.querySelector("#bond"),
  ne: document.querySelector("#ne"),
  hudLine: document.querySelector("#hud-line"),
  discovered: document.querySelector("#discovered"),
  actionBar: document.querySelector("#action-bar"),
  senseBtn: document.querySelector("#sense-btn"),
  restBtn: document.querySelector("#rest-btn"),
  neuronBtn: document.querySelector("#neuron-btn"),
  leapBtn: document.querySelector("#leap-btn"),
  neurons: document.querySelector("#neurons"),
  neuronRow: document.querySelector("#neuron-row"),
  neuronClose: document.querySelector("#neuron-close"),
  interact: document.querySelector("#interact"),
  interactTitle: document.querySelector("#interact-title"),
  interactFlavor: document.querySelector("#interact-flavor"),
  interactInvestigate: document.querySelector("#interact-investigate"),
  interactUse: document.querySelector("#interact-use"),
  interactClose: document.querySelector("#interact-close"),
};

const game = new Game(canvas, ui);
game.startLoop();

ui.play.addEventListener("click", () => game.play());

document.addEventListener("keydown", (event) => {
  if ((event.code === "Space" || event.code === "Enter") && !game.ui.overlay.hidden) {
    event.preventDefault();
    game.play();
  }
  if (event.code === "Escape") {
    game.closeNeurons();
    game.closeInteract();
  }
});
