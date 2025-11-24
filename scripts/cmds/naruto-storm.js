// 🚀 Version Telegram du jeu NARUTO-STORM // Entièrement compatible avec ta structure (onStart, onReply, global.teamnix.replies, etc.) // Tu peux coller ce fichier directement dans ton dossier cmds.

const axios = require("axios");

// ========================= BASE DE DONNÉES PERSONNAGES ========================= const characters = [ { name: "merdi", power: 90, basic: "pouvoir de pidydy", ultimate: "Multi-Brayan +coup Géant 🌪️" }, { name: "Naruto (Mode Ermite)", power: 60, basic: "Rasengan Géant 🌪️", ultimate: "Futon Rasenshuriken 🌪️💨" }, { name: "Naruto (Rikudo)", power: 70, basic: "Orbe Truth Seeker ⚫", ultimate: "Bijuu Mode Rasenshuriken 🦊🌪️" }, { name: "Naruto (Baryon Mode)", power: 85, basic: "Punch Ultra Rapide ⚡", ultimate: "Explosion Chakra Nucléaire ☢️" }, { name: "Sasuke Uchiha", power: 60, basic: "Chidori ⚡", ultimate: "Kirin ⚡🌩️" }, { name: "Sasuke (Taka)", power: 65, basic: "Chidori Nagashi ⚡💧", ultimate: "Susano'o 💀" }, { name: "Sasuke (Rinnegan)", power: 70, basic: "Amaterasu 🔥", ultimate: "Indra's Arrow ⚡🏹" }, { name: "Kakashi Hatake", power: 60, basic: "Raikiri ⚡", ultimate: "Kamui 🌀" }, { name: "Kakashi (DMS)", power: 75, basic: "Kamui Raikiri ⚡🌀", ultimate: "Susano'o Parfait 💠" }, { name: "Minato Namikaze", power: 80, basic: "Hiraishin Rasengan ⚡🌀", ultimate: "Mode Kyuubi 🦊" }, { name: "Hashirama Senju", power: 70, basic: "Foret Naissante 🌳", ultimate: "Art Senin 🌿" }, { name: "Tobirama Senju", power: 60, basic: "Suiton: Dragon 🌊", ultimate: "Edo Tensei ⚰️" }, { name: "Tsunade", power: 60, basic: "Coup Surprenant 💥", ultimate: "Sceau Byakugō 💎" }, { name: "Hiruzen Sarutobi", power: 65, basic: "5 Éléments 🌍🔥💧🌪️⚡", ultimate: "Shinigami Seal ☠️" }, { name: "Pain (Tendo)", power: 68, basic: "Shinra Tensei ⬇️", ultimate: "Chibaku Tensei ⬆️" }, { name: "Konan", power: 55, basic: "Danse de Papier 📄", ultimate: "Mer de Papiers Explosifs 💥📄" }, { name: "Nagato", power: 68, basic: "Absorption Chakra 🌀", ultimate: "Réanimation Universelle ⚰️" }, { name: "Deidara", power: 60, basic: "Argile Explosive C2 💣", ultimate: "Auto-Destruction C0 💥" }, { name: "Kakuzu", power: 60, basic: "Futon - Zankokuhaha 💨", ultimate: "Cœurs Enchaînés 💔" }, { name: "Hidan", power: 50, basic: "Attaque Rituelle ⛧", ultimate: "Rituel Jashin ⛧" } ];

const damageSystem = { basic: { min: 8, max: 15, chakraCost: 0 }, special: { min: 15, max: 25, chakraCost: 20 }, ultimate: { min: 30, max: 45, chakraCost: 75, failChance: 0.3 }, charge: { chakraGain: 25 } };

function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ========================= SYSTÈME GLOBAL (TEAMNIX) ========================= const nix = { name: "naruto-storm", version: "1.0", aliases: ["ns", "storm"], prefix: false, category: "game", role: 0, cooldown: 3, description: "Combat complet Naruto-Storm", guide: "{p}naruto-storm" };

// Système replies TeamNix // gameState[chatId] = {...} const gameState = {};

// ========================= COMMANDE START ========================= async function onStart({ bot, msg, chatId }) { gameState[chatId] = { step: "waiting_start", players: {}, turn: null, p1Character: null, p2Character: null, p1HP: 100, p2HP: 100, p1Chakra: 100, p2Chakra: 100, defending: false };

const sent = await bot.sendMessage(chatId, 🎮 *NARUTO-STORM*\nEnvoyez *start* pour lancer une partie !, { parse_mode: "Markdown" } );

global.teamnix.replies.set(sent.message_id, { nix, type: "naruto_reply", chatId, step: "waiting_start", messageId: sent.message_id }); }

// ========================= COMMANDE REPLY (LE CŒUR DU JEU) ========================= async function onReply({ bot, msg, chatId, userId, data }) { if (data.type !== "naruto_reply") return; const body = (msg.text || "").toLowerCase();

if (!gameState[chatId]) return; const state = gameState[chatId];

// Quitter la partie if (body === "fin") { delete gameState[chatId]; return bot.sendMessage(chatId, "🔚 Partie terminée."); }

// ====== ÉTAPE 1 : LANCER ====== if (state.step === "waiting_start" && body === "start") { state.step = "choose_p1"; return bot.sendMessage(chatId, "🧑 Joueur 1 → tapez p1", { parse_mode: "Markdown" }); }

// ====== ÉTAPE 2 : Choix joueur 1 ====== if (state.step === "choose_p1" && body === "p1") { state.players.p1 = userId; state.step = "choose_p2"; return bot.sendMessage(chatId, "🧑‍🦱 Joueur 2 → tapez p2", { parse_mode: "Markdown" }); }

// ====== ÉTAPE 3 : Choix joueur 2 ====== if (state.step === "choose_p2" && body === "p2") { if (userId === state.players.p1) return bot.sendMessage(chatId, "❌ Vous êtes déjà joueur 1 !");

state.players.p2 = userId;
state.step = "choose_characters_p1";

let list = characters.map((c, i) => `${i + 1}. ${c.name}`).join("\n");

return bot.sendMessage(chatId,
  `🎭 *Choisissez un personnage*\n${list}\n\nJoueur 1 → choix du perso`,
  { parse_mode: "Markdown" }
);

}

// ====== ÉTAPE 4 : Choix perso joueur 1 ====== if (state.step === "choose_characters_p1" && userId === state.players.p1) { const index = parseInt(body) - 1; if (isNaN(index) || !characters[index]) return bot.sendMessage(chatId, "❌ Numéro invalide");

state.p1Character = characters[index];
state.step = "choose_characters_p2";

return bot.sendMessage(chatId, `✔️ Joueur 1 a choisi ${state.p1Character.name}\nJoueur 2 → choisissez un perso`);

}

// ====== ÉTAPE 5 : Choix perso joueur 2 ====== if (state.step === "choose_characters_p2" && userId === state.players.p2) { const index = parseInt(body) - 1; if (isNaN(index) || !characters[index]) return bot.sendMessage(chatId, "❌ Numéro invalide");

state.p2Character = characters[index];
state.step = "battle";
state.turn = "p1";

return bot.sendMessage(chatId,
  `⚔️ *COMBAT COMMENCE !*\n${state.p1Character.name} VS ${state.p2Character.name}\n\n` +
  `Commandes :\n` +
  `a → Attaque basique\n` +
  `b → Technique spéciale\n` +
  `x → Ultime\n` +
  `c → Charger chakra\n` +
  `d → Défense\n\n` +
  `Joueur 1 commence !`,
  { parse_mode: "Markdown" }
);

}

// ====== ÉTAPE 6 : COMBAT ====== if (state.step === "battle") { const attackerId = state.turn === "p1" ? state.players.p1 : state.players.p2; if (userId !== attackerId) return;

const attacker = state.turn === "p1" ? state.p1Character : state.p2Character;
const defender = state.turn === "p1" ? state.p2Character : state.p1Character;
const hpKey = state.turn === "p1" ? "p2HP" : "p1HP";
const chakraKey = state.turn === "p1" ? "p1Chakra" : "p2Chakra";

let damage = 0;
let tech = "";
let missed = false;

// ==== ACTIONS ====
if (body === "a") {
  tech = attacker.basic;
  damage = randomBetween(damageSystem.basic.min, damageSystem.basic.max);
}
else if (body === "b") {
  if (state[chakraKey] < damageSystem.special.chakraCost) missed = true;
  else {
    state[chakraKey] -= damageSystem.special.chakraCost;
    tech = attacker.basic;
    damage = randomBetween(damageSystem.special.min, damageSystem.special.max);
  }
}
else if (body === "x") {
  if (state[chakraKey] < damageSystem.ultimate.chakraCost) missed = true;
  else {
    state[chakraKey] -= damageSystem.ultimate.chakraCost;
    tech = attacker.ultimate;
    if (Math.random() < damageSystem.ultimate.failChance) missed = true;
    else damage = randomBetween(damageSystem.ultimate.min, damageSystem.ultimate.max);
  }
}
else if (body === "c") {
  state[chakraKey] += 25;
  if (state[chakraKey] > 100) state[chakraKey] = 100;
  swapTurn(state);
  return bot.sendMessage(chatId, `🔋 ${attacker.name} recharge du chakra !`);
}
else if (body === "d") {
  state.defending = state.turn;
  swapTurn(state);
  return bot.sendMessage(chatId, `🛡️ ${attacker.name} se protège !`);
}
else return bot.sendMessage(chatId, "❌ Commande inconnue");

// === DÉGÂTS ===
if (!missed) {
  if (state.defending && state.defending !== state.turn) damage = Math.floor(damage * 0.6);
  state[hpKey] -= damage;
  if (state[hpKey] < 0) state[hpKey] = 0;
}

// === MESSAGE ===
let txt = "";
if (missed) txt += `❌ *${tech} raté !*\n`;
else txt += `⚡ *${attacker.name} utilise ${tech}* → -${damage}%\n`;

txt += `\n❤️ ${state.p1Character.name}: ${state.p1HP}% | 🔋 Chakra ${state.p1Chakra}%\n`;
txt += `💙 ${state.p2Character.name}: ${state.p2HP}% | 🔋 Chakra ${state.p2Chakra}%\n\n`;

// === VICTOIRE ===
if (state.p1HP <= 0 || state.p2HP <= 0) {
  txt += `🏆 *Victoire de* ${state.p1HP <= 0 ? state.p2Character.name : state.p1Character.name}`;
  delete gameState[chatId];
  return bot.sendMessage(chatId, txt, { parse_mode: "Markdown" });
}

swapTurn(state);

txt += `Au joueur *${state.turn === "p1" ? "1" : "2"}* de jouer !`;
return bot.sendMessage(chatId, txt, { parse_mode: "Markdown" });

} }

function swapTurn(state) { state.turn = state.turn === "p1" ? "p2" : "p1"; }

module.exports = { onStart, onReply, nix };
