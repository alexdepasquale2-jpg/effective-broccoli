import "./style.css";
import { App } from "./ui/app";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root");
}

new App(root).start();
