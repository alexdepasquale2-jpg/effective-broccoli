import "./style.css";
import { Game } from "./game/game.js";
import { loadMeta, buyMetaUpgrade } from "./game/metaStorage.js";
import { META_UPGRADES } from "./game/farmingData.js";

const canvas = document.querySelector("#game");
const ui = {
  overlay: document.querySelector("#overlay"),
  play: document.querySelector("#play"),
  hud: document.querySelector("#hud"),
  hpBar: document.querySelector("#hp-bar"),
  hpText: document.querySelector("#hp-text"),
  xpBar: document.querySelector("#xp-bar"),
  levelText: document.querySelector("#level-text"),
  goldText: document.querySelector("#gold-text"),
  timeBanner: document.querySelector("#time-banner"),
  timeTimer: document.querySelector("#time-timer"),
  seedSelector: document.querySelector("#seed-selector"),
  shopBtn: document.querySelector("#shop-btn"),
  shopModal: document.querySelector("#shop-modal"),
  shopGold: document.querySelector("#shop-gold"),
  seedStoreList: document.querySelector("#seed-store-list"),
  shopClose: document.querySelector("#shop-close"),
  metaBtn: document.querySelector("#meta-btn"),
  metaModal: document.querySelector("#meta-modal"),
  metaGold: document.querySelector("#meta-gold"),
  metaUpgradeList: document.querySelector("#meta-upgrade-list"),
  metaClose: document.querySelector("#meta-close"),
  levelupModal: document.querySelector("#levelup-modal"),
  levelupOptions: document.querySelector("#levelup-options"),
  gameoverModal: document.querySelector("#gameover-modal"),
  gameoverStats: document.querySelector("#gameover-stats"),
  restartBtn: document.querySelector("#restart-btn"),
};

const game = new Game(canvas, ui);
game.startLoop();

// Button Event Listeners
ui.play?.addEventListener("click", () => {
  game.play();
});

ui.restartBtn?.addEventListener("click", () => {
  ui.gameoverModal.hidden = true;
  game.play();
});

ui.shopBtn?.addEventListener("click", () => {
  game.openShop();
});

ui.shopClose?.addEventListener("click", () => {
  game.closeShop();
});

// Meta Upgrades Modal
function renderMetaModal() {
  const meta = loadMeta();
  ui.metaGold.textContent = `${meta.totalGold} Gold`;
  ui.metaUpgradeList.innerHTML = "";

  for (const up of META_UPGRADES) {
    const curLevel = meta.upgrades[up.id] || 0;
    const isMax = curLevel >= up.max;
    const cost = up.cost(curLevel);

    const card = document.createElement("div");
    card.className = "meta-card";
    card.innerHTML = `
      <span class="meta-icon">${up.icon}</span>
      <div class="meta-info">
        <strong>${up.name} (Lv ${curLevel}/${up.max})</strong>
        <p>${up.desc}</p>
      </div>
      <button type="button" class="buy-meta-btn" ${isMax || meta.totalGold < cost ? "disabled" : ""}>
        ${isMax ? "MAX" : `Upgrade ${cost}g`}
      </button>
    `;

    const btn = card.querySelector(".buy-meta-btn");
    btn.addEventListener("click", () => {
      const res = buyMetaUpgrade(meta, up.id);
      if (res.ok) {
        renderMetaModal();
        game.meta = meta;
      }
    });

    ui.metaUpgradeList.appendChild(card);
  }
}

ui.metaBtn?.addEventListener("click", () => {
  ui.metaModal.hidden = false;
  renderMetaModal();
});

ui.metaClose?.addEventListener("click", () => {
  ui.metaModal.hidden = true;
});
