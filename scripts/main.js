import { INSTINCTS, TRAITS, NAMES } from "./data.js";

const MODULE_ID = "dw-instant-npc";
const TAB_KEY = "dwin-random";

// Foundry's core Tabs controller loses track of a dynamically-injected tab
// across re-renders (it toggles "active" on whatever elements exist at bind
// time, before this module's hook has re-added the tab). Track per-actor
// whether the random-gen tab was the one showing, and re-force it after
// every render so a reroll (which updates the actor and re-renders the
// sheet) doesn't bounce the GM back to the default tab.
const dwinActiveTab = new Map();

async function rollNpc(actor) {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const instinctIdx = Math.floor(Math.random() * INSTINCTS.length);
  const traitIdx = Math.floor(Math.random() * TRAITS.length);

  await actor.update({
    name,
    [`flags.${MODULE_ID}.instinct`]: INSTINCTS[instinctIdx],
    [`flags.${MODULE_ID}.instinctNum`]: instinctIdx + 1,
    [`flags.${MODULE_ID}.trait`]: TRAITS[traitIdx],
    [`flags.${MODULE_ID}.traitNum`]: traitIdx + 1
  });

  ui.notifications.info(game.i18n.format("DWIN.Generated", { name }));
}

function injectTab(app, html) {
  if (game.system.id !== "dungeonworld") return;
  if (app.actor?.type !== "npc") return;
  if (!game.user.isGM) return;

  const actor = app.actor;
  const instinct = actor.getFlag(MODULE_ID, "instinct");
  const instinctNum = actor.getFlag(MODULE_ID, "instinctNum");
  const trait = actor.getFlag(MODULE_ID, "trait");
  const traitNum = actor.getFlag(MODULE_ID, "traitNum");

  const $nav = html.find('.sheet-tabs[data-group="primary"]');
  const $navLink = $(`<a class="item" data-tab="${TAB_KEY}">${game.i18n.localize("DWIN.TabLabel")}</a>`);
  $nav.append($navLink);

  const $tabBody = $(`
    <div class="tab ${TAB_KEY}" data-group="primary" data-tab="${TAB_KEY}">
      <section class="sheet-tab dwin-tab">
        <div class="dwin-panel">
          <button type="button" class="dwin-roll-btn" title="${game.i18n.localize("DWIN.RollButtonTitle")}">
            <i class="fas fa-dice-d20"></i> ${game.i18n.localize("DWIN.RollButton")}
          </button>
          <div class="dwin-result">
            <div class="dwin-result-row">
              <span class="dwin-label">${game.i18n.localize("DWIN.Instinct")}</span>
              <span class="dwin-value">${instinct ? `#${instinctNum} ${instinct}` : "—"}</span>
            </div>
            <div class="dwin-result-row">
              <span class="dwin-label">${game.i18n.localize("DWIN.Trait")}</span>
              <span class="dwin-value">${trait ? `#${traitNum} ${trait}` : "—"}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  `);
  html.find(".sheet-body").append($tabBody);

  if (dwinActiveTab.get(actor.id) === TAB_KEY) {
    $nav.find(".item").removeClass("active");
    html.find(".sheet-body > .tab").removeClass("active");
    $navLink.addClass("active");
    $tabBody.addClass("active");
  }

  $nav.find(".item").on("click", (event) => {
    dwinActiveTab.set(actor.id, event.currentTarget.dataset.tab);
  });

  $tabBody.find(".dwin-roll-btn").on("click", async (event) => {
    event.preventDefault();
    dwinActiveTab.set(actor.id, TAB_KEY);
    await rollNpc(actor);
  });
}

Hooks.on("renderActorSheet", injectTab);
