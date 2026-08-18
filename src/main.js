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
};

const game = new Game(canvas, ui);
game.startLoop();

ui.play.addEventListener("click", () => {
  game.play();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "Enter") {
    if (game.state !== "playing" && game.state !== "dying") {
      event.preventDefault();
      game.play();
    }
  }
});
