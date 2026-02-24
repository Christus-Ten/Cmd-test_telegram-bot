const axios = require('axios');
const fs = require('fs');
const path = require('path');

const nix = {
  name: "naruto-storm",
  version: "4.2",
  aliases: ["nstorm", "naruto"],
  description: "Jeu de combat Naruto avec système de chakra avancé",
  author: "Delfa •|• ꗇ︱Blẳȼk 义 (adapté Nix)",
  prefix: true,
  category: "game",
  role: 0,
  cooldown: 5,
  guide: "{p}naruto-storm - Commencer une partie"
};

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

if (!global.teamnix) global.teamnix = {};
if (!global.teamnix.narutoGames) global.teamnix.narutoGames = {};

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const threadId = chatId;

  global.teamnix.narutoGames[threadId] = {
    step: "waiting_start",
    players: {},
    turn: null,
    p1Character: null,
    p2Character: null,
    p1HP: 100,
    p2HP: 100,
    p1Chakra: 100,
    p2Chakra: 100,
    chakraRegen: 5,
    defending: false,
    lastAction: null,
    lastPlayer: null
  };

  const sentMsg = await bot.sendMessage(threadId, {
    text: `🎮 𝗡𝗔𝗥𝗨𝗧𝗢-𝗦𝗧𝗢𝗥𝗠 𝗩𝟰.𝟮\n━━━━━━━━━━━━━━\n𝗘𝗻𝘃𝗼𝘆𝗲𝘇 "start" 𝗽𝗼𝘂𝗿 𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿`
  }, { reply_to_message_id: msg.message_id });

  global.teamnix.replies.set(sentMsg.message_id, {
    type: "naruto_storm",
    threadId: threadId,
    step: "waiting_start"
  });
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "naruto_storm") return;

  const threadId = data.threadId;
  const game = global.teamnix.narutoGames[threadId];
  if (!game) {
    return bot.sendMessage(chatId, "❌ Aucune partie en cours. Lancez /naruto-storm pour commencer.", 
      { reply_to_message_id: msg.message_id });
  }

  if (game.step !== data.step) {
    return bot.sendMessage(chatId, "⏳ Cette action n'est plus valide. Veuillez suivre le déroulement du jeu.", 
      { reply_to_message_id: msg.message_id });
  }

  const userInput = msg.text?.trim().toLowerCase();
  if (!userInput) return;

  if (userInput === 'fin') {
    delete global.teamnix.narutoGames[threadId];
    global.teamnix.replies.delete(replyMsg.message_id);
    return bot.sendMessage(chatId, "🔄 Partie terminée. Envoyez /naruto-storm pour recommencer.",
      { reply_to_message_id: msg.message_id });
  }

  switch (game.step) {
    case "waiting_start":
      if (userInput === "start") {
        game.step = "choose_p1";
        game.players.p1 = userId;
        const sent = await bot.sendMessage(chatId, 
          "🧙 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭\n𝗧𝗮𝗽𝗲𝘇 'p1' 𝗽𝗼𝘂𝗿 𝘀𝗲́𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝗿 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲",
          { reply_to_message_id: msg.message_id });
        global.teamnix.replies.set(sent.message_id, {
          type: "naruto_storm",
          threadId,
          step: "choose_p1",
          allowedUserId: game.players.p1
        });
        global.teamnix.replies.delete(replyMsg.message_id);
      }
      break;

    case "choose_p1":
      if (userId !== game.players.p1) {
        return bot.sendMessage(chatId, "❌ Seul le Joueur 1 peut faire cette action.",
          { reply_to_message_id: msg.message_id });
      }
      if (userInput === 'p1') {
        game.step = "choose_p2";
        const sent = await bot.sendMessage(chatId,
          "🧝 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮\n𝗧𝗮𝗽𝗲𝘇 'p2' 𝗽𝗼𝘂𝗿 𝘃𝗼𝘂𝘀 𝗶𝗻𝘀𝗰𝗿𝗶𝗿𝗲",
          { reply_to_message_id: msg.message_id });
        global.teamnix.replies.set(sent.message_id, {
          type: "naruto_storm",
          threadId,
          step: "choose_p2"
        });
        global.teamnix.replies.delete(replyMsg.message_id);
      }
      break;

    case "choose_p2":
      if (userId === game.players.p1) {
        return bot.sendMessage(chatId, "❌ Vous ne pouvez pas être les deux joueurs !",
          { reply_to_message_id: msg.message_id });
      }
      if (userInput === 'p2') {
        game.players.p2 = userId;
        game.step = "choose_characters_p1";

        let characterList = "🎭 𝗖𝗛𝗢𝗜𝗦𝗜𝗦𝗦𝗘𝗭 𝗩𝗢𝗧𝗥𝗘 𝗣𝗘𝗥𝗦𝗢𝗡𝗡𝗔𝗚𝗘\n━━━━━━━━━━━━━━\n";
        characterList += characters.map((char, i) => 
          `${i + 1}. ${char.name} (${char.power}★)`
        ).join("\n");

        const p1Name = msg.from.first_name || msg.from.username || "Joueur 1";
        const sent = await bot.sendMessage(chatId, {
          text: characterList + `\n\n@${p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗿𝗲́𝗽𝗼𝗻𝗱𝗲𝘇 𝗮𝘃𝗲𝗰 𝗹𝗲 𝗻𝘂𝗺𝗲́𝗿𝗼 𝗱𝘂 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
          mentions: [{
            tag: `@${p1Name}`,
            id: game.players.p1
          }]
        }, { reply_to_message_id: msg.message_id });

        global.teamnix.replies.set(sent.message_id, {
          type: "naruto_storm",
          threadId,
          step: "choose_characters_p1",
          allowedUserId: game.players.p1
        });
        global.teamnix.replies.delete(replyMsg.message_id);
      }
      break;

    case "choose_characters_p1":
      if (userId !== game.players.p1) {
        return bot.sendMessage(chatId, "❌ Seul le Joueur 1 peut choisir un personnage.",
          { reply_to_message_id: msg.message_id });
      }
      const index1 = parseInt(userInput) - 1;
      if (isNaN(index1) || index1 < 0 || index1 >= characters.length) {
        return bot.sendMessage(chatId, "❌ 𝗡𝘂𝗺𝗲́𝗿𝗼 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲. 𝗥𝗲́𝗲𝘀𝘀𝗮𝘆𝗲𝘇",
          { reply_to_message_id: msg.message_id });
      }
      game.p1Character = characters[index1];
      game.step = "choose_characters_p2";

      const p2Name = (await bot.getChatMember(threadId, game.players.p2)).user.first_name || "Joueur 2";
      const sent = await bot.sendMessage(chatId, {
        text: `✅ 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭: ${game.p1Character.name}\n\n@${p2Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮, 𝗰𝗵𝗼𝗶𝘀𝗶𝘀𝘀𝗲𝘇 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
        mentions: [{
          tag: `@${p2Name}`,
          id: game.players.p2
        }]
      }, { reply_to_message_id: msg.message_id });

      global.teamnix.replies.set(sent.message_id, {
        type: "naruto_storm",
        threadId,
        step: "choose_characters_p2",
        allowedUserId: game.players.p2
      });
      global.teamnix.replies.delete(replyMsg.message_id);
      break;

    case "choose_characters_p2":
      if (userId !== game.players.p2) {
        return bot.sendMessage(chatId, "❌ Seul le Joueur 2 peut choisir un personnage.",
          { reply_to_message_id: msg.message_id });
      }
      const index2 = parseInt(userInput) - 1;
      if (isNaN(index2) || index2 < 0 || index2 >= characters.length) {
        return bot.sendMessage(chatId, "❌ 𝗡𝘂𝗺𝗲́𝗿𝗼 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲. 𝗥𝗲́𝗲𝘀𝘀𝗮𝘆𝗲𝘇",
          { reply_to_message_id: msg.message_id });
      }
      game.p2Character = characters[index2];
      game.turn = "p1";
      game.step = "battle";

      const p1Name = (await bot.getChatMember(threadId, game.players.p1)).user.first_name || "Joueur 1";
      const p2Name = (await bot.getChatMember(threadId, game.players.p2)).user.first_name || "Joueur 2";

      const battleStartMsg = `⚔️ 𝗖𝗢𝗠𝗕𝗔𝗧 𝗗𝗘𝗕𝗨𝗧\n━━━━━━━━━━━━━━\n` +
        `✦ ${game.p1Character.name} (${p1Name}) 𝗩𝗦 ${game.p2Character.name} (${p2Name})\n\n` +
        `𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀:\n` +
        `» 𝗮 - 𝗔𝘁𝘁𝗮𝗾𝘂𝗲 𝗯𝗮𝘀𝗶𝗾𝘂𝗲 (${damageSystem.basic.min}-${damageSystem.basic.max}%)\n` +
        `» 𝗯 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘀𝗽é𝗰𝗶𝗮𝗹𝗲 (-${damageSystem.special.chakraCost} chakra)\n` +
        `» 𝘅 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘂𝗹𝘁𝗶𝗺𝗲 (-${damageSystem.ultimate.chakraCost} chakra)\n` +
        `» 𝗰 - 𝗖𝗵𝗮𝗿𝗴𝗲𝗿 𝗰𝗵𝗮𝗸𝗿𝗮 (+${damageSystem.charge.chakraGain}%)\n` +
        `» 𝗱 - 𝗗é𝗳𝗲𝗻𝘀𝗲 (𝗿é𝗱𝘂𝗶𝘁 𝗹𝗲𝘀 𝗱é𝗴â𝘁𝘀)\n\n` +
        `@${p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗰'𝗲𝘀𝘁 à 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;

      const sent = await bot.sendMessage(chatId, {
        text: battleStartMsg,
        mentions: [{
          tag: `@${p1Name}`,
          id: game.players.p1
        }]
      }, { reply_to_message_id: msg.message_id });

      global.teamnix.replies.set(sent.message_id, {
        type: "naruto_storm",
        threadId,
        step: "battle",
        allowedUserId: game.players.p1
      });
      global.teamnix.replies.delete(replyMsg.message_id);
      break;

    case "battle":
      const currentPlayer = game.turn === "p1" ? game.players.p1 : game.players.p2;
      if (userId !== currentPlayer) {
        return bot.sendMessage(chatId, "❌ Ce n'est pas ton tour !",
          { reply_to_message_id: msg.message_id });
      }

      if (userInput === 'c' && game.lastAction === 'c' && game.lastPlayer === userId) {
        return bot.sendMessage(chatId, "❌ Vous ne pouvez pas charger votre chakra deux fois de suite !",
          { reply_to_message_id: msg.message_id });
      }

      const attacker = game.turn === "p1" ? game.p1Character : game.p2Character;
      const defender = game.turn === "p1" ? game.p2Character : game.p1Character;
      const hpKey = game.turn === "p1" ? "p2HP" : "p1HP";
      const chakraKey = game.turn === "p1" ? "p1Chakra" : "p2Chakra";

      let damage = 0;
      let tech = "Attaque basique";
      let effect = "👊";
      let chakraUsed = 0;
      let missed = false;
      let chargeMessage = "";

      switch (userInput) {
        case 'a':
          damage = randomBetween(damageSystem.basic.min, damageSystem.basic.max);
          tech = "Attaque basique";
          effect = "👊";
          break;

        case 'b':
          if (game[chakraKey] < damageSystem.special.chakraCost) {
            missed = true;
          } else {
            damage = randomBetween(damageSystem.special.min, damageSystem.special.max);
            chakraUsed = damageSystem.special.chakraCost;
            tech = attacker.basic;
            effect = attacker.basic.split(' ').pop();
          }
          break;

        case 'x':
          if (game[chakraKey] < damageSystem.ultimate.chakraCost) {
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
          game[chakraKey] = Math.min(100, game[chakraKey] + damageSystem.charge.chakraGain);
          chargeMessage = `🔋 ${attacker.name} accumule +${damageSystem.charge.chakraGain}% de chakra !`;
          game.lastAction = 'c';
          game.lastPlayer = userId;
          game.turn = game.turn === "p1" ? "p2" : "p1";
          return await sendBattleMessage();
          
        case 'd':
          game.defending = game.turn;
          game.lastAction = 'd';
          game.lastPlayer = userId;
          game.turn = game.turn === "p1" ? "p2" : "p1";
          return bot.sendMessage(chatId, `🛡️ ${attacker.name} se met en position défensive !`,
            { reply_to_message_id: msg.message_id });

        default:
          return bot.sendMessage(chatId, "❌ Commande invalide\n» a - Attaque\n» b - Technique\n» x - Ultime\n» c - Charger\n» d - Défense",
            { reply_to_message_id: msg.message_id });
      }

      if (!missed) {
        if (game.defending && game.defending !== game.turn) {
          damage = Math.floor(damage * 0.6);
          tech += " (défendu)";
        }

        game[chakraKey] -= chakraUsed;
        game[chakraKey] = Math.max(0, game[chakraKey]);
        game[hpKey] -= damage;
        game[hpKey] = Math.max(0, game[hpKey]);
      }

      game.lastAction = userInput;
      game.lastPlayer = userId;

      if (game.turn === "p1") {
        game.p1Chakra = Math.min(100, game.p1Chakra + game.chakraRegen);
      } else {
        game.p2Chakra = Math.min(100, game.p2Chakra + game.chakraRegen);
      }

      async function sendBattleMessage() {
        let msg = "";

        if (userInput !== 'c' && !missed) {
          msg += `⚡ ${attacker.name} utilise ${tech} ${effect}\n`;
          msg += `💥 Inflige ${damage}% de dégâts à ${defender.name} !\n\n`;
        } else if (missed) {
          msg += `⚡ ${attacker.name} tente ${tech}...\n`;
          msg += `❌ Échoue ! (${game[chakraKey] < damageSystem.ultimate.chakraCost ? "Chakra insuffisant" : "Technique ratée"})\n\n`;
        }

        msg += `━━━━━━━━━━━━━━\n`;
        msg += `${getHealthColor(game.p1HP)}|${game.p1Character.name}: HP ${game.p1HP}%\n`;
        msg += `💙| Chakra ${game.p1Chakra}%\n`;
        msg += `━━━━━━━━━━━━━━\n`;
        msg += `${getHealthColor(game.p2HP)}|${game.p2Character.name}: HP ${game.p2HP}%\n`;
        msg += `💙| Chakra ${game.p2Chakra}%\n`;
        msg += `━━━━━━━━━━━━━━\n`;

        if (chargeMessage) msg += `${chargeMessage}\n`;

        if (game.p1HP <= 0 || game.p2HP <= 0) {
          const winner = game.p1HP <= 0 ? game.p2Character.name : game.p1Character.name;
          msg += `🏆 𝗩𝗜𝗖𝗧𝗢𝗜𝗥𝗘 𝗗𝗘 ${winner} !\n`;
          msg += `𝗙𝗶𝗻 𝗱𝘂 𝗰𝗼𝗺𝗯𝗮𝘁. 𝗧𝗮𝗽𝗲𝘇 'fin' 𝗽𝗼𝘂𝗿 𝗿𝗲𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿.`;
          delete global.teamnix.narutoGames[threadId];
        } else {
          game.turn = game.turn === "p1" ? "p2" : "p1";
          game.defending = false;
          const nextPlayer = game.turn === "p1" ? game.players.p1 : game.players.p2;
          const userInfo = await bot.getChatMember(threadId, nextPlayer);
          const nextName = userInfo.user.first_name || "Joueur";
          msg += `@${nextName} 𝗝𝗼𝘂𝗲𝘂𝗿 ${game.turn === "p1" ? "1" : "2"}, 𝗰'𝗲𝘀𝘁 à 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;
        }

        const nextPlayer = game.turn === "p1" ? game.players.p1 : game.players.p2;
        const userInfo = await bot.getChatMember(threadId, nextPlayer);
        
        return bot.sendMessage(chatId, {
          text: msg,
          mentions: [{
            tag: `@${userInfo.user.first_name}`,
            id: nextPlayer
          }]
        }, { reply_to_message_id: msg.message_id });
      }

      return await sendBattleMessage();
  }
}

module.exports = { onStart, onReply, nix };