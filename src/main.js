import "./style.css";
import { Game } from "./game/game.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  play: document.querySelector("#play"),
  title: document.querySelector("#title"),
  subtitle: document.querySelector("#subtitle"),
  hud: document.querySelector("#hud"),
  coins: document.querySelector("#coins"),
  pearls: document.querySelector("#pearls"),
  cargo: document.querySelector("#cargo"),
  rank: document.querySelector("#rank"),
  rankTitle: document.querySelector("#rank-title"),
  dex: document.querySelector("#dex"),
  combo: document.querySelector("#combo"),
  dock: document.querySelector("#dock"),
  marketBtn: document.querySelector("#market-btn"),
  upgradeBtn: document.querySelector("#upgrade-btn"),
  tradeBtn: document.querySelector("#trade-btn"),
  market: document.querySelector("#market"),
  marketClose: document.querySelector("#market-close"),
  cargoList: document.querySelector("#cargo-list"),
  sellAll: document.querySelector("#sell-all"),
  upgrades: document.querySelector("#upgrades"),
  upgradeClose: document.querySelector("#upgrade-close"),
  upgradeRow: document.querySelector("#upgrade-row"),
  trade: document.querySelector("#trade"),
  tradeClose: document.querySelector("#trade-close"),
  tradeRow: document.querySelector("#trade-row"),
};

const game = new Game(canvas, ui);
game.startLoop();

ui.play.addEventListener("click", () => game.play());

document.addEventListener("keydown", (event) => {
  if ((event.code === "Space" || event.code === "Enter") && !game.ui.overlay.hidden) {
    event.preventDefault();
    game.play();
  }
  if (event.code === "Escape") game.closePanels();
});
