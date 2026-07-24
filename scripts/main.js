import { INSTINCTS, TRAITS, NAMES } from "./data.js";

const MODULE_ID = "dw-instant-npc";

function isVanilla(actor) {
  const instinctNum = actor.getFlag(MODULE_ID, "instinctNum");
  const traitNum = actor.getFlag(MODULE_ID, "traitNum");
  return !instinctNum && !traitNum;
}

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

function injectPanel(app, html) {
  if (game.system.id !== "dungeonworld") return;
  if (app.actor?.type !== "npc") return;
  if (!game.user.isGM) return;

  const actor = app.actor;
  const vanilla = isVanilla(actor);
  const instinct = actor.getFlag(MODULE_ID, "instinct");
  const instinctNum = actor.getFlag(MODULE_ID, "instinctNum");
  const trait = actor.getFlag(MODULE_ID, "trait");
  const traitNum = actor.getFlag(MODULE_ID, "traitNum");

  const title = game.i18n.localize(vanilla ? "DWIN.RollButtonTitleVanilla" : "DWIN.RollButtonTitleUsed");

  const $panel = $(`
    <section class="dwin-panel">
      <button type="button" class="dwin-roll-btn" title="${title}" ${vanilla ? "" : "disabled"}>
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
    </section>
  `);

  html.find(".sheet-header").after($panel);

  $panel.find(".dwin-roll-btn").on("click", async (event) => {
    event.preventDefault();
    if (!isVanilla(actor)) return;
    await rollNpc(actor);
  });
}

Hooks.on("renderActorSheet", injectPanel);
