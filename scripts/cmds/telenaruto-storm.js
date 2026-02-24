const axios = require('axios');

const characters = [
  { name: "Naruto Uzumaki", power: 50, basic: "Rasengan 🌀", ultimate: "Multi-Clones + Rasengan Géant 🌪️" },
  { name: "Naruto (Mode Ermite)", power: 60, basic: "Rasengan Géant 🌪️", ultimate: "Futon Rasenshuriken 🌪️💨" },
  { name: "Naruto (Rikudo)", power: 70, basic: "Orbe Truth Seeker ⚫", ultimate: "Bijuu Mode Rasenshuriken 🦊🌪️" },
  { name: "Naruto (Baryon Mode)", power: 85, basic: "Punch Ultra Rapide ⚡", ultimate: "Explosion Chakra Nucléaire ☢️" },
  { name: "Sasuke Uchiha", power: 60, basic: "Chidori ⚡", ultimate: "Kirin ⚡🌩️" },
  { name: "Sasuke (Taka)", power: 65, basic: "Chidori Nagashi ⚡💧", ultimate: "Susano'o 💀" },
  { name: "Sasuke (Rinnegan)", power: 70, basic: "Amaterasu 🔥", ultimate: "Indra's Arrow ⚡🏹" },
  { name: "Kakashi Hatake", power: 60, basic: "Raikiri ⚡", ultimate: "Kamui 🌀" },
  { name: "Kakashi (DMS)", power: 75, basic: "Kamui Raikiri ⚡🌀", ultimate: "Susano'o Parfait 💠" },
  { name: "Minato Namikaze", power: 80, basic: "Hiraishin Rasengan ⚡🌀", ultimate: "Mode Kyuubi 🦊" },
  { name: "Hashirama Senju", power: 70, basic: "Foret Naissante 🌳", ultimate: "Art Senin 🌿" },
  { name: "Tobirama Senju", power: 60, basic: "Suiton: Dragon 🌊", ultimate: "Edo Tensei ⚰️" },
  { name: "Tsunade", power: 60, basic: "Coup Surprenant 💥", ultimate: "Sceau Byakugō 💎" },
  { name: "Hiruzen Sarutobi", power: 65, basic: "5 Éléments 🌍🔥💧🌪️⚡", ultimate: "Shinigami Seal ☠️" },
  { name: "Pain (Tendo)", power: 68, basic: "Shinra Tensei ⬇️", ultimate: "Chibaku Tensei ⬆️" },
  { name: "Konan", power: 55, basic: "Danse de Papier 📄", ultimate: "Mer de Papiers Explosifs 💥📄" },
  { name: "Nagato", power: 68, basic: "Absorption Chakra 🌀", ultimate: "Réanimation Universelle ⚰️" },
  { name: "Deidara", power: 60, basic: "Argile Explosive C2 💣", ultimate: "Auto-Destruction C0 💥" },
  { name: "Kakuzu", power: 60, basic: "Futon - Zankokuhaha 💨", ultimate: "Cœurs Enchaînés 💔" },
  { name: "Hidan", power: 50, basic: "Attaque Rituelle ⛧", ultimate: "Rituel Jashin ⛧" },
  { name: "Sasori", power: 58, basic: "Marionnettes 🎭", ultimate: "Armée des 100 🎭" },
  { name: "Itachi Uchiha", power: 70, basic: "Tsukuyomi 🌙", ultimate: "Amaterasu + Susano'o 🔥💀" },
  { name: "Kisame Hoshigaki", power: 62, basic: "Requin Géant 🦈", ultimate: "Fusion avec Samehada 🦈" },
  { name: "Orochimaru", power: 65, basic: "Poignée du Serpent Spectral 🐍", ultimate: "Mode Sage Blanc 🐍" },
  { name: "Asuma Sarutobi", power: 55, basic: "Lames de Chakra 🔪", ultimate: "Furie Mode 💨" },
  { name: "Maito Gai", power: 70, basic: "Feu de la Jeunesse 🔥", ultimate: "8ème Porte - Nuit de la Mort 💀" },
  { name: "Kurenai Yuhi", power: 45, basic: "Genjutsu 🌸", ultimate: "Piège Floral 🌸" },
  { name: "Gaara", power: 68, basic: "Sable Mouvant 🏜️", ultimate: "Armure + Sable Funéraire ⚔️🏜️" },
  { name: "Temari", power: 58, basic: "Vent Tranchant 🌪️", ultimate: "Danse de la Faucheuse 🌪️" },
  { name: "Kankuro", power: 56, basic: "Poupée Karasu 🎭", ultimate: "Piège des 3 Marionnettes 🎭" },
  { name: "Hinata Hyuga", power: 52, basic: "Paume du Hakkē ✋", ultimate: "Protection des 64 Coups ✋✋" },
  { name: "Neji Hyuga", power: 60, basic: "Tourbillon Divin 🌪️", ultimate: "64 Points du Hakkē ✋" },
  { name: "Rock Lee", power: 65, basic: "Lotus Recto 🌸", ultimate: "6ème Porte - Paon du Midi 🦚" },
  { name: "Shikamaru Nara", power: 60, basic: "Ombre Manipulatrice 🕳️", ultimate: "Piège Stratégique Total 🕳️" },
  { name: "Sakura Haruno", power: 60, basic: "Coup Supersonique 💥", ultimate: "Sceau Byakugō Déchaîné 💎" },
  { name: "Madara Uchiha", power: 75, basic: "Susano'o 💀", ultimate: "Limbo + Météores ☄️" },
  { name: "Madara (Rikudo)", power: 85, basic: "Truth Seeker Orbs ⚫", ultimate: "Infinite Tsukuyomi 🌙" },
  { name: "Obito Uchiha", power: 70, basic: "Kamui 🌀", ultimate: "Jūbi Mode 🔥" },
  { name: "Obito (Rikudo)", power: 80, basic: "Gunbai Uchiwa 🌀", ultimate: "Shinra Tensei ⬇️" },
  { name: "Zetsu", power: 40, basic: "Attaque Furtive 🥷", ultimate: "Infection de Corps 🦠" },
  { name: "Kaguya Otsutsuki", power: 78, basic: "Portail Dimensionnel 🌀", ultimate: "Os Cendré + Expansion Divine ☄️" },
  { name: "Ay (Raikage)", power: 66, basic: "Coup Raikage ⚡", ultimate: "Mode Foudre ⚡" },
  { name: "Mei Terumi", power: 60, basic: "Acide Bouillant 🧪", ultimate: "Vapeur Destructrice 💨" },
  { name: "Onoki", power: 65, basic: "Technique de Légèreté 🪶", ultimate: "Jinton: Dématérialisation 💎" },
  { name: "Killer Bee", power: 68, basic: "Lames à 8 Sabres ⚔️", ultimate: "Mode Hachibi 🐙" },
  { name: "Boruto Uzumaki", power: 60, basic: "Rasengan Invisible 👻🌀", ultimate: "Karma Activé + Jōgan 👁️" },
  { name: "Boruto (Karma)", power: 75, basic: "Rasengan Spatial 🌌", ultimate: "Pouvoir Otsutsuki 🌙" },
  { name: "Kawaki", power: 70, basic: "Transformation Morpho ⚔️", ultimate: "Karma Full Power 💀" },
  { name: "Sarada Uchiha", power: 58, basic: "Chidori ⚡", ultimate: "Sharingan 3 Tomoe 🔴" },
  { name: "Mitsuki", power: 60, basic: "Serpent Blanc 🐍", ultimate: "Mode Sage 🐍" },
  { name: "Jigen", power: 82, basic: "Rods Dimensionnels ⚡", ultimate: "Transformation Karma 🔥" },
  { name: "Isshiki Otsutsuki", power: 90, basic: "Sukunahikona 🔍", ultimate: "Daikokuten ⏳" },
  { name: "Momoshiki Otsutsuki", power: 84, basic: "Rasengan Géant 🌪️", ultimate: "Absorption Chakra 🌀" },
  { name: "Indra Otsutsuki", power: 78, basic: "Chidori Ultime ⚡", ultimate: "Susano'o Parfait 💠" },
  { name: "Asura Otsutsuki", power: 76, basic: "Rasengan Originel 🌀", ultimate: "Mode Sage des Six Chemins ☯️" },
  { name: "Hagoromo Otsutsuki", power: 88, basic: "Creation of All Things 🌍", ultimate: "Six Paths Senjutsu ☯️" },
  { name: "Hamura Otsutsuki", power: 80, basic: "Tenseigan Activation ✨", ultimate: "Moon Sword Slash 🌙" }
];

const damageSystem = {
  basic: { min: 8, max: 15, chakraCost: 0 },
  special: { min: 15, max: 25, chakraCost: 20 },
  ultimate: { min: 30, max: 45, chakraCost: 75, failChance: 0.3 },
  charge: { chakraGain: 25 }
};

function getHealthColor(hp) {
  if (hp === 100) return "💚";
  if (hp >= 85) return "💚";
  if (hp >= 55) return "💛";
  if (hp >= 25) return "🧡";
  if (hp > 0) return "❤️";
  return "💔";
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const gameState = {};

const nix = {
  name: "naruto-storm",
  version: "4.2",
  aliases: ["naruto", "storm", "ns"],
  description: "Jeu de combat Naruto avec système de chakra avancé",
  author: "Christus",
  prefix: true,
  category: "game",
  role: 0,
  cooldown: 5,
  guide: "{p}naruto-storm - Lancer une partie"
};

async function onStart({ bot, message, msg, chatId, args, usages }) {
  gameState[chatId] = {
    step: "waiting_start",
    players: { p1: null, p2: null },
    turn: null,
    p1Character: null,
    p2Character: null,
    p1HP: 100,
    p2HP: 100,
    p1Chakra: 100,
    p2Chakra: 100,
    p1Name: null,
    p2Name: null,
    chakraRegen: 5,
    defending: false,
    lastAction: null,
    lastPlayer: null
  };

  const imageUrl = "https://i.ibb.co/1Gdycvds/image.jpg";
  await bot.sendPhoto(chatId, imageUrl, {
    caption: `🎮 𝗡𝗔𝗥𝗨𝗧𝗢-𝗦𝗧𝗢𝗥𝗠 𝗩𝟰.𝟮\n━━━━━━━━━━━━━━\n𝗘𝗻𝘃𝗼𝘆𝗲𝘇 "start" 𝗽𝗼𝘂𝗿 𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿`,
    reply_to_message_id: msg.message_id
  });
}

async function onMessage({ bot, message, msg }) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || msg.from.username || "Joueur";
  const body = msg.text?.toLowerCase().trim();

  if (!body) return;
  if (!gameState[chatId]) return;

  const state = gameState[chatId];

  if (state.step !== "waiting_start" && state.step !== "choose_p1" && state.step !== "choose_p2" && 
      userId !== state.players.p1 && userId !== state.players.p2) {
    return;
  }

  if (body === 'fin') {
    delete gameState[chatId];
    return bot.sendMessage(chatId, "🔄 Partie terminée. Envoyez 'start' pour recommencer.", { reply_to_message_id: msg.message_id });
  }

  if (state.step === "waiting_start" && body === "start") {
    state.step = "choose_p1";
    state.players.p1 = userId;
    state.p1Name = userName;
    return bot.sendMessage(chatId, "🧙 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭\n𝗧𝗮𝗽𝗲𝘇 'p1' 𝗽𝗼𝘂𝗿 𝘀𝗲́𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝗿 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲", { reply_to_message_id: msg.message_id });
  }

  if (state.step === "choose_p1" && body === 'p1') {
    if (userId !== state.players.p1) return;
    state.step = "choose_p2";
    return bot.sendMessage(chatId, "🧝 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮\n𝗧𝗮𝗽𝗲𝘇 'p2' 𝗽𝗼𝘂𝗿 𝘃𝗼𝘂𝘀 𝗶𝗻𝘀𝗰𝗿𝗶𝗿𝗲", { reply_to_message_id: msg.message_id });
  }

  if (state.step === "choose_p2" && body === 'p2') {
    if (userId === state.players.p1) {
      return bot.sendMessage(chatId, "❌ Vous ne pouvez pas être les deux joueurs !", { reply_to_message_id: msg.message_id });
    }
    state.players.p2 = userId;
    state.p2Name = userName;
    state.step = "choose_characters_p1";
    
    let characterList = "🎭 𝗖𝗛𝗢𝗜𝗦𝗜𝗦𝗦𝗘𝗭 𝗩𝗢𝗧𝗥𝗘 𝗣𝗘𝗥𝗦𝗢𝗡𝗡𝗔𝗚𝗘\n━━━━━━━━━━━━━━\n";
    characterList += characters.map((char, i) => 
      `${i + 1}. ${char.name} (${char.power}★)`
    ).join("\n");
    
    return bot.sendMessage(chatId, {
      text: characterList + `\n\n@${state.p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗿𝗲́𝗽𝗼𝗻𝗱𝗲𝘇 𝗮𝘃𝗲𝗰 𝗹𝗲 𝗻𝘂𝗺𝗲́𝗿𝗼 𝗱𝘂 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
      reply_to_message_id: msg.message_id,
      parse_mode: 'Markdown',
      entities: [{
        type: 'mention',
        offset: characterList.length + 1,
        length: state.p1Name.length + 1
      }]
    });
  }

  if (state.step.startsWith("choose_characters")) {
    const index = parseInt(body) - 1;
    
    if (isNaN(index) || index < 0 || index >= characters.length) {
      return bot.sendMessage(chatId, "❌ 𝗡𝘂𝗺𝗲́𝗿𝗼 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲. 𝗥𝗲́𝗲𝘀𝘀𝗮𝘆𝗲𝘇", { reply_to_message_id: msg.message_id });
    }

    if (state.step === "choose_characters_p1" && userId === state.players.p1) {
      state.p1Character = characters[index];
      state.step = "choose_characters_p2";
      return bot.sendMessage(chatId, {
        text: `✅ 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭: ${state.p1Character.name}\n\n@${state.p2Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮, 𝗰𝗵𝗼𝗶𝘀𝗶𝘀𝘀𝗲𝘇 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
        reply_to_message_id: msg.message_id,
        entities: [{
          type: 'mention',
          offset: `✅ 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭: ${state.p1Character.name}\n\n`.length,
          length: state.p2Name.length + 1
        }]
      });
    }

    if (state.step === "choose_characters_p2" && userId === state.players.p2) {
      state.p2Character = characters[index];
      state.turn = "p1";
      state.step = "battle";
      
      const battleStartMsg = `⚔️ 𝗖𝗢𝗠𝗕𝗔𝗧 𝗗𝗘𝗕𝗨𝗧\n━━━━━━━━━━━━━━\n` +
        `✦ ${state.p1Character.name} (${state.p1Name}) 𝗩𝗦 ${state.p2Character.name} (${state.p2Name})\n\n` +
        `𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀:\n` +
        `» 𝗮 - 𝗔𝘁𝘁𝗮𝗾𝘂𝗲 𝗯𝗮𝘀𝗶𝗾𝘂𝗲 (${damageSystem.basic.min}-${damageSystem.basic.max}%)\n` +
        `» 𝗯 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘀𝗽𝗲́𝗰𝗶𝗮𝗹𝗲 (-${damageSystem.special.chakraCost} chakra)\n` +
        `» 𝘅 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘂𝗹𝘁𝗶𝗺𝗲 (-${damageSystem.ultimate.chakraCost} chakra)\n` +
        `» 𝗰 - 𝗖𝗵𝗮𝗿𝗴𝗲𝗿 𝗰𝗵𝗮𝗸𝗿𝗮 (+${damageSystem.charge.chakraGain}%)\n` +
        `» 𝗱 - 𝗗𝗲́𝗳𝗲𝗻𝘀𝗲 (𝗿𝗲́𝗱𝘂𝗶𝘁 𝗹𝗲𝘀 𝗱𝗲́𝗴𝗮̂𝘁𝘀)\n\n` +
        `@${state.p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗰'𝗲𝘀𝘁 𝗮̀ 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;
      
      return bot.sendMessage(chatId, {
        text: battleStartMsg,
        reply_to_message_id: msg.message_id,
        entities: [{
          type: 'mention',
          offset: battleStartMsg.indexOf(`@${state.p1Name}`),
          length: state.p1Name.length + 1
        }]
      });
    }
    return;
  }

  if (state.step === "battle") {
    const currentPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
    if (userId !== currentPlayer) return;

    if (body === 'c' && state.lastAction === 'c' && state.lastPlayer === userId) {
      return bot.sendMessage(chatId, "❌ Vous ne pouvez pas charger votre chakra deux fois de suite !", { reply_to_message_id: msg.message_id });
    }

    const attacker = state.turn === "p1" ? state.p1Character : state.p2Character;
    const defender = state.turn === "p1" ? state.p2Character : state.p1Character;
    const hpKey = state.turn === "p1" ? "p2HP" : "p1HP";
    const chakraKey = state.turn === "p1" ? "p1Chakra" : "p2Chakra";

    let damage = 0;
    let tech = "Attaque basique";
    let effect = "👊";
    let chakraUsed = 0;
    let missed = false;
    let chargeMessage = "";

    switch (body) {
      case 'a':
        damage = randomBetween(damageSystem.basic.min, damageSystem.basic.max);
        tech = "Attaque basique";
        effect = "👊";
        break;

      case 'b':
        if (state[chakraKey] < damageSystem.special.chakraCost) {
          missed = true;
        } else {
          damage = randomBetween(damageSystem.special.min, damageSystem.special.max);
          chakraUsed = damageSystem.special.chakraCost;
          tech = attacker.basic;
          effect = attacker.basic.split(' ').pop();
        }
        break;

      case 'x':
        if (state[chakraKey] < damageSystem.ultimate.chakraCost) {
          missed = true;
        } else {
          chakraUsed = damageSystem.ultimate.chakraCost;
          if (Math.random() < damageSystem.ultimate.failChance) {
            missed = true;
            tech = attacker.ultimate + " (échoué)";
            effect = "❌";
          } else {
            damage = randomBetween(damageSystem.ultimate.min, damageSystem.ultimate.max);
            tech = attacker.ultimate;
            effect = attacker.ultimate.split(' ').pop();
          }
        }
        break;

      case 'c':
        state[chakraKey] = Math.min(100, state[chakraKey] + damageSystem.charge.chakraGain);
        chargeMessage = `🔋 ${attacker.name} accumule +${damageSystem.charge.chakraGain}% de chakra !`;
        state.lastAction = 'c';
        state.lastPlayer = userId;
        state.turn = state.turn === "p1" ? "p2" : "p1";
        return await sendBattleMessage();
        
      case 'd':
        state.defending = state.turn;
        state.lastAction = 'd';
        state.lastPlayer = userId;
        state.turn = state.turn === "p1" ? "p2" : "p1";
        return bot.sendMessage(chatId, `🛡️ ${attacker.name} se met en position défensive !`, { reply_to_message_id: msg.message_id });

      default:
        return bot.sendMessage(chatId, "❌ Commande invalide\n» a - Attaque\n» b - Technique\n» x - Ultime\n» c - Charger\n» d - Défense", { reply_to_message_id: msg.message_id });
    }

    if (!missed) {
      if (state.defending && state.defending !== state.turn) {
        damage = Math.floor(damage * 0.6);
        tech += " (défendu)";
      }

      state[chakraKey] -= chakraUsed;
      state[chakraKey] = Math.max(0, state[chakraKey]);
      state[hpKey] -= damage;
      state[hpKey] = Math.max(0, state[hpKey]);
    }

    state.lastAction = body;
    state.lastPlayer = userId;

    if (state.turn === "p1") {
      state.p1Chakra = Math.min(100, state.p1Chakra + state.chakraRegen);
    } else {
      state.p2Chakra = Math.min(100, state.p2Chakra + state.chakraRegen);
    }

    async function sendBattleMessage() {
      let msg = "";

      if (body !== 'c' && !missed) {
        msg += `⚡ ${attacker.name} utilise ${tech} ${effect}\n`;
        msg += `💥 Inflige ${damage}% de dégâts à ${defender.name} !\n\n`;
      } else if (missed) {
        msg += `⚡ ${attacker.name} tente ${tech}...\n`;
        msg += `❌ Échoue ! (${state[chakraKey] < damageSystem.ultimate.chakraCost ? "Chakra insuffisant" : "Technique ratée"})\n\n`;
      }

      msg += `━━━━━━━━━━━━━━\n`;
      msg += `${getHealthColor(state.p1HP)}|${state.p1Character.name}: HP ${state.p1HP}%\n`;
      msg += `💙| Chakra ${state.p1Chakra}%\n`;
      msg += `━━━━━━━━━━━━━━\n`;
      msg += `${getHealthColor(state.p2HP)}|${state.p2Character.name}: HP ${state.p2HP}%\n`;
      msg += `💙| Chakra ${state.p2Chakra}%\n`;
      msg += `━━━━━━━━━━━━━━\n`;

      if (chargeMessage) msg += `${chargeMessage}\n`;

      if (state.p1HP <= 0 || state.p2HP <= 0) {
        const winner = state.p1HP <= 0 ? state.p2Character.name : state.p1Character.name;
        msg += `🏆 𝗩𝗜𝗖𝗧𝗢𝗜𝗥𝗘 𝗗𝗘 ${winner} !\n`;
        msg += `𝗙𝗶𝗻 𝗱𝘂 𝗰𝗼𝗺𝗯𝗮𝘁. 𝗧𝗮𝗽𝗲𝘇 'fin' 𝗽𝗼𝘂𝗿 𝗿𝗲𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿.`;
        delete gameState[chatId];
      } else {
        state.turn = state.turn === "p1" ? "p2" : "p1";
        state.defending = false;
        const nextPlayer = state.turn === "p1" ? state.players.p1 : state.players.p2;
        const nextName = state.turn === "p1" ? state.p1Name : state.p2Name;
        msg += `@${nextName} 𝗝𝗼𝘂𝗲𝘂𝗿 ${state.turn === "p1" ? "1" : "2"}, 𝗰'𝗲𝘀𝘁 𝗮̀ 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;
      }

      return bot.sendMessage(chatId, {
        text: msg,
        reply_to_message_id: msg.message_id,
        entities: [{
          type: 'mention',
          offset: msg.lastIndexOf('@'),
          length: (state.turn === "p1" ? state.p1Name : state.p2Name).length + 1
        }]
      });
    }

    return await sendBattleMessage();
  }
}

module.exports = { onStart, onMessage, nix };