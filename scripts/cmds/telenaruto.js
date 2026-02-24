const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== DONNÉES DU JEU ====================
const characters = [
  {
    name: "Naruto Uzumaki",
    power: 50,
    basic: "Rasengan 🌀",
    ultimate: "Multi-Clones + Rasengan Géant 🌪️"
  },
  {
    name: "Naruto (Mode Ermite)",
    power: 60,
    basic: "Rasengan Géant 🌪️",
    ultimate: "Futon Rasenshuriken 🌪️💨"
  },
  {
    name: "Naruto (Rikudo)",
    power: 70,
    basic: "Orbe Truth Seeker ⚫",
    ultimate: "Bijuu Mode Rasenshuriken 🦊🌪️"
  },
  {
    name: "Naruto (Baryon Mode)",
    power: 85,
    basic: "Punch Ultra Rapide ⚡",
    ultimate: "Explosion Chakra Nucléaire ☢️"
  },
  {
    name: "Sasuke Uchiha",
    power: 60,
    basic: "Chidori ⚡",
    ultimate: "Kirin ⚡🌩️"
  },
  {
    name: "Sasuke (Taka)",
    power: 65,
    basic: "Chidori Nagashi ⚡💧",
    ultimate: "Susano'o 💀"
  },
  {
    name: "Sasuke (Rinnegan)",
    power: 70,
    basic: "Amaterasu 🔥",
    ultimate: "Indra's Arrow ⚡🏹"
  },
  {
    name: "Kakashi Hatake",
    power: 60,
    basic: "Raikiri ⚡",
    ultimate: "Kamui 🌀"
  },
  {
    name: "Kakashi (DMS)",
    power: 75,
    basic: "Kamui Raikiri ⚡🌀",
    ultimate: "Susano'o Parfait 💠"
  },
  {
    name: "Minato Namikaze",
    power: 80,
    basic: "Hiraishin Rasengan ⚡🌀",
    ultimate: "Mode Kyuubi 🦊"
  },
  {
    name: "Hashirama Senju",
    power: 70,
    basic: "Foret Naissante 🌳",
    ultimate: "Art Senin 🌿"
  },
  {
    name: "Tobirama Senju",
    power: 60,
    basic: "Suiton: Dragon 🌊",
    ultimate: "Edo Tensei ⚰️"
  },
  {
    name: "Tsunade",
    power: 60,
    basic: "Coup Surprenant 💥",
    ultimate: "Sceau Byakugō 💎"
  },
  {
    name: "Hiruzen Sarutobi",
    power: 65,
    basic: "5 Éléments 🌍🔥💧🌪️⚡",
    ultimate: "Shinigami Seal ☠️"
  },
  {
    name: "Pain (Tendo)",
    power: 68,
    basic: "Shinra Tensei ⬇️",
    ultimate: "Chibaku Tensei ⬆️"
  },
  {
    name: "Konan",
    power: 55,
    basic: "Danse de Papier 📄",
    ultimate: "Mer de Papiers Explosifs 💥📄"
  },
  {
    name: "Nagato",
    power: 68,
    basic: "Absorption Chakra 🌀",
    ultimate: "Réanimation Universelle ⚰️"
  },
  {
    name: "Deidara",
    power: 60,
    basic: "Argile Explosive C2 💣",
    ultimate: "Auto-Destruction C0 💥"
  },
  {
    name: "Kakuzu",
    power: 60,
    basic: "Futon - Zankokuhaha 💨",
    ultimate: "Cœurs Enchaînés 💔"
  },
  {
    name: "Hidan",
    power: 50,
    basic: "Attaque Rituelle ⛧",
    ultimate: "Rituel Jashin ⛧"
  },
  {
    name: "Sasori",
    power: 58,
    basic: "Marionnettes 🎭",
    ultimate: "Armée des 100 🎭"
  },
  {
    name: "Itachi Uchiha",
    power: 70,
    basic: "Tsukuyomi 🌙",
    ultimate: "Amaterasu + Susano'o 🔥💀"
  },
  {
    name: "Kisame Hoshigaki",
    power: 62,
    basic: "Requin Géant 🦈",
    ultimate: "Fusion avec Samehada 🦈"
  },
  {
    name: "Orochimaru",
    power: 65,
    basic: "Poignée du Serpent Spectral 🐍",
    ultimate: "Mode Sage Blanc 🐍"
  },
  {
    name: "Asuma Sarutobi",
    power: 55,
    basic: "Lames de Chakra 🔪",
    ultimate: "Furie Mode 💨"
  },
  {
    name: "Maito Gai",
    power: 70,
    basic: "Feu de la Jeunesse 🔥",
    ultimate: "8ème Porte - Nuit de la Mort 💀"
  },
  {
    name: "Kurenai Yuhi",
    power: 45,
    basic: "Genjutsu 🌸",
    ultimate: "Piège Floral 🌸"
  },
  {
    name: "Gaara",
    power: 68,
    basic: "Sable Mouvant 🏜️",
    ultimate: "Armure + Sable Funéraire ⚔️🏜️"
  },
  {
    name: "Temari",
    power: 58,
    basic: "Vent Tranchant 🌪️",
    ultimate: "Danse de la Faucheuse 🌪️"
  },
  {
    name: "Kankuro",
    power: 56,
    basic: "Poupée Karasu 🎭",
    ultimate: "Piège des 3 Marionnettes 🎭"
  },
  {
    name: "Hinata Hyuga",
    power: 52,
    basic: "Paume du Hakkē ✋",
    ultimate: "Protection des 64 Coups ✋✋"
  },
  {
    name: "Neji Hyuga",
    power: 60,
    basic: "Tourbillon Divin 🌪️",
    ultimate: "64 Points du Hakkē ✋"
  },
  {
    name: "Rock Lee",
    power: 65,
    basic: "Lotus Recto 🌸",
    ultimate: "6ème Porte - Paon du Midi 🦚"
  },
  {
    name: "Shikamaru Nara",
    power: 60,
    basic: "Ombre Manipulatrice 🕳️",
    ultimate: "Piège Stratégique Total 🕳️"
  },
  {
    name: "Sakura Haruno",
    power: 60,
    basic: "Coup Supersonique 💥",
    ultimate: "Sceau Byakugō Déchaîné 💎"
  },
  {
    name: "Madara Uchiha",
    power: 75,
    basic: "Susano'o 💀",
    ultimate: "Limbo + Météores ☄️"
  },
  {
    name: "Madara (Rikudo)",
    power: 85,
    basic: "Truth Seeker Orbs ⚫",
    ultimate: "Infinite Tsukuyomi 🌙"
  },
  {
    name: "Obito Uchiha",
    power: 70,
    basic: "Kamui 🌀",
    ultimate: "Jūbi Mode 🔥"
  },
  {
    name: "Obito (Rikudo)",
    power: 80,
    basic: "Gunbai Uchiwa 🌀",
    ultimate: "Shinra Tensei ⬇️"
  },
  {
    name: "Zetsu",
    power: 40,
    basic: "Attaque Furtive 🥷",
    ultimate: "Infection de Corps 🦠"
  },
  {
    name: "Kaguya Otsutsuki",
    power: 78,
    basic: "Portail Dimensionnel 🌀",
    ultimate: "Os Cendré + Expansion Divine ☄️"
  },
  {
    name: "Ay (Raikage)",
    power: 66,
    basic: "Coup Raikage ⚡",
    ultimate: "Mode Foudre ⚡"
  },
  {
    name: "Mei Terumi",
    power: 60,
    basic: "Acide Bouillant 🧪",
    ultimate: "Vapeur Destructrice 💨"
  },
  {
    name: "Onoki",
    power: 65,
    basic: "Technique de Légèreté 🪶",
    ultimate: "Jinton: Dématérialisation 💎"
  },
  {
    name: "Killer Bee",
    power: 68,
    basic: "Lames à 8 Sabres ⚔️",
    ultimate: "Mode Hachibi 🐙"
  },
  {
    name: "Boruto Uzumaki",
    power: 60,
    basic: "Rasengan Invisible 👻🌀",
    ultimate: "Karma Activé + Jōgan 👁️"
  },
  {
    name: "Boruto (Karma)",
    power: 75,
    basic: "Rasengan Spatial 🌌",
    ultimate: "Pouvoir Otsutsuki 🌙"
  },
  {
    name: "Kawaki",
    power: 70,
    basic: "Transformation Morpho ⚔️",
    ultimate: "Karma Full Power 💀"
  },
  {
    name: "Sarada Uchiha",
    power: 58,
    basic: "Chidori ⚡",
    ultimate: "Sharingan 3 Tomoe 🔴"
  },
  {
    name: "Mitsuki",
    power: 60,
    basic: "Serpent Blanc 🐍",
    ultimate: "Mode Sage 🐍"
  },
  {
    name: "Jigen",
    power: 82,
    basic: "Rods Dimensionnels ⚡",
    ultimate: "Transformation Karma 🔥"
  },
  {
    name: "Isshiki Otsutsuki",
    power: 90,
    basic: "Sukunahikona 🔍",
    ultimate: "Daikokuten ⏳"
  },
  {
    name: "Momoshiki Otsutsuki",
    power: 84,
    basic: "Rasengan Géant 🌪️",
    ultimate: "Absorption Chakra 🌀"
  },
  {
    name: "Indra Otsutsuki",
    power: 78,
    basic: "Chidori Ultime ⚡",
    ultimate: "Susano'o Parfait 💠"
  },
  {
    name: "Asura Otsutsuki",
    power: 76,
    basic: "Rasengan Originel 🌀",
    ultimate: "Mode Sage des Six Chemins ☯️"
  },
  {
    name: "Hagoromo Otsutsuki",
    power: 88,
    basic: "Creation of All Things 🌍",
    ultimate: "Six Paths Senjutsu ☯️"
  },
  {
    name: "Hamura Otsutsuki",
    power: 80,
    basic: "Tenseigan Activation ✨",
    ultimate: "Moon Sword Slash 🌙"
  }
];

const damageSystem = {
  basic: { min: 8, max: 15, chakraCost: 0 },
  special: { min: 15, max: 25, chakraCost: 20 },
  ultimate: { min: 30, max: 45, chakraCost: 75, failChance: 0.3 },
  charge: { chakraGain: 25 }
};

// ==================== FONCTIONS UTILITAIRES ====================
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

// ==================== MÉTADONNÉES DE LA COMMANDE ====================
const nix = {
  name: "naruto-storm",
  version: "4.2",
  aliases: ["naruto", "ns", "storm"],
  description: "Combat Naruto avec système de chakra avancé",
  author: "Delfa •|• ꗇ︱Blẳȼk 义",
  prefix: true,
  category: "game",
  role: 0,
  cooldown: 5,
  guide: "{p}naruto-storm - Lancer une partie"
};

// ==================== GESTIONNAIRE PRINCIPAL ====================
async function onStart({ bot, message, msg, chatId, args, usages }) {
  const threadId = chatId; // ou msg.chat.id
  const userId = msg.from.id;

  // Initialiser la session de jeu pour ce thread
  if (!global.teamnix.narutoSessions) global.teamnix.narutoSessions = {};
  global.teamnix.narutoSessions[threadId] = {
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

  // Envoyer le message d'accueil avec image
  const imageUrl = "https://i.ibb.co/1Gdycvds/image.jpg"; // à vérifier
  const sentMsg = await bot.sendPhoto(chatId, imageUrl, {
    caption: `🎮 𝗡𝗔𝗥𝗨𝗧𝗢-𝗦𝗧𝗢𝗥𝗠 𝗩𝟰.𝟮\n━━━━━━━━━━━━━━\n𝗘𝗻𝘃𝗼𝘆𝗲𝘇 "start" 𝗽𝗼𝘂𝗿 𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿`,
    reply_to_message_id: msg.message_id
  });

  // Enregistrer l'attente de la réponse "start"
  global.teamnix.replies.set(sentMsg.message_id, {
    nix,
    type: "naruto_start",
    threadId,
    authorId: userId, // mais n'importe qui peut répondre "start"
    step: "waiting_start"
  });

  // Timeout optionnel (comme dans telequiz)
  setTimeout(() => {
    if (global.teamnix.replies.has(sentMsg.message_id)) {
      global.teamnix.replies.delete(sentMsg.message_id);
      // Optionnel : supprimer la session si personne ne répond
      delete global.teamnix.narutoSessions[threadId];
      bot.sendMessage(chatId, "⏰ Temps écoulé. La partie a été annulée.", { reply_to_message_id: sentMsg.message_id });
    }
  }, 60000); // 1 minute
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // data contient les infos stockées dans global.teamnix.replies pour ce message
  if (!data || !data.type || !data.type.startsWith("naruto_")) return;

  const threadId = data.threadId || chatId;
  const session = global.teamnix.narutoSessions?.[threadId];
  if (!session) {
    return bot.sendMessage(chatId, "❌ Aucune partie en cours dans ce salon. Lancez /naruto-storm pour commencer.", { reply_to_message_id: msg.message_id });
  }

  const body = msg.text?.trim().toLowerCase();
  if (!body) return;

  // Commande "fin" pour terminer la partie (peut être utilisé à tout moment)
  if (body === "fin") {
    delete global.teamnix.narutoSessions[threadId];
    // Supprimer toutes les entrées replies liées à ce thread ? (optionnel)
    for (let [key, val] of global.teamnix.replies) {
      if (val.threadId === threadId) global.teamnix.replies.delete(key);
    }
    return bot.sendMessage(chatId, "🔄 Partie terminée. Envoyez /naruto-storm pour recommencer.", { reply_to_message_id: msg.message_id });
  }

  // Gestion des différentes étapes
  switch (data.type) {
    case "naruto_start": {
      if (body === "start") {
        // Passer à l'étape choix du joueur 1
        session.step = "choose_p1";
        session.players.p1 = userId;

        const sentMsg = await bot.sendMessage(chatId,
          "🧙 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭\n𝗧𝗮𝗽𝗲𝘇 'p1' 𝗽𝗼𝘂𝗿 𝘀𝗲́𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝗿 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲",
          { reply_to_message_id: msg.message_id }
        );

        // Enregistrer la prochaine attente
        global.teamnix.replies.set(sentMsg.message_id, {
          nix,
          type: "naruto_choose_p1",
          threadId,
          authorId: userId // seul le joueur 1 peut répondre
        });
        // Supprimer l'ancienne entrée
        global.teamnix.replies.delete(replyMsg.message_id);
      } else {
        bot.sendMessage(chatId, "❌ Veuillez répondre avec 'start' pour commencer.", { reply_to_message_id: msg.message_id });
      }
      break;
    }

    case "naruto_choose_p1": {
      if (userId !== data.authorId) return; // seul le joueur 1 peut répondre
      if (body === "p1") {
        session.step = "choose_p2";
        const sentMsg = await bot.sendMessage(chatId,
          "🧝 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮\n𝗧𝗮𝗽𝗲𝘇 'p2' 𝗽𝗼𝘂𝗿 𝘃𝗼𝘂𝘀 𝗶𝗻𝘀𝗰𝗿𝗶𝗿𝗲",
          { reply_to_message_id: msg.message_id }
        );
        global.teamnix.replies.set(sentMsg.message_id, {
          nix,
          type: "naruto_choose_p2",
          threadId,
          authorId: null // n'importe qui sauf le joueur 1
        });
        global.teamnix.replies.delete(replyMsg.message_id);
      } else {
        bot.sendMessage(chatId, "❌ Veuillez répondre avec 'p1'.", { reply_to_message_id: msg.message_id });
      }
      break;
    }

    case "naruto_choose_p2": {
      if (userId === session.players.p1) {
        return bot.sendMessage(chatId, "❌ Vous ne pouvez pas être les deux joueurs !", { reply_to_message_id: msg.message_id });
      }
      if (body === "p2") {
        session.players.p2 = userId;
        session.step = "choose_characters_p1";

        // Construire la liste des personnages
        let characterList = "🎭 𝗖𝗛𝗢𝗜𝗦𝗜𝗦𝗦𝗘𝗭 𝗩𝗢𝗧𝗥𝗘 𝗣𝗘𝗥𝗦𝗢𝗡𝗡𝗔𝗚𝗘\n━━━━━━━━━━━━━━\n";
        characters.forEach((char, i) => {
          characterList += `${i + 1}. ${char.name} (${char.power}★)\n`;
        });

        const p1Name = msg.from.first_name || msg.from.username || "Joueur 1";
        const sentMsg = await bot.sendMessage(chatId,
          characterList + `\n\n@${p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗿𝗲́𝗽𝗼𝗻𝗱𝗲𝘇 𝗮𝘃𝗲𝗰 𝗹𝗲 𝗻𝘂𝗺𝗲́𝗿𝗼 𝗱𝘂 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
          {
            reply_to_message_id: msg.message_id,
            mentions: [{ tag: `@${p1Name}`, id: session.players.p1 }]
          }
        );

        global.teamnix.replies.set(sentMsg.message_id, {
          nix,
          type: "naruto_choose_characters_p1",
          threadId,
          authorId: session.players.p1
        });
        global.teamnix.replies.delete(replyMsg.message_id);
      } else {
        bot.sendMessage(chatId, "❌ Veuillez répondre avec 'p2'.", { reply_to_message_id: msg.message_id });
      }
      break;
    }

    case "naruto_choose_characters_p1": {
      if (userId !== data.authorId) return;
      const indexP1 = parseInt(body) - 1;
      if (isNaN(indexP1) || indexP1 < 0 || indexP1 >= characters.length) {
        return bot.sendMessage(chatId, "❌ Numéro invalide. Répondez avec un nombre entre 1 et " + characters.length, { reply_to_message_id: msg.message_id });
      }
      session.p1Character = characters[indexP1];
      session.step = "choose_characters_p2";

      const p2Name = (await bot.getChatMember(chatId, session.players.p2)).user.first_name || "Joueur 2";
      const sentMsgP2 = await bot.sendMessage(chatId,
        `✅ 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭: ${session.p1Character.name}\n\n@${p2Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟮, 𝗰𝗵𝗼𝗶𝘀𝗶𝘀𝘀𝗲𝘇 𝘃𝗼𝘁𝗿𝗲 𝗽𝗲𝗿𝘀𝗼𝗻𝗻𝗮𝗴𝗲`,
        {
          reply_to_message_id: msg.message_id,
          mentions: [{ tag: `@${p2Name}`, id: session.players.p2 }]
        }
      );

      global.teamnix.replies.set(sentMsgP2.message_id, {
        nix,
        type: "naruto_choose_characters_p2",
        threadId,
        authorId: session.players.p2
      });
      global.teamnix.replies.delete(replyMsg.message_id);
      break;
    }

    case "naruto_choose_characters_p2": {
      if (userId !== data.authorId) return;
      const indexP2 = parseInt(body) - 1;
      if (isNaN(indexP2) || indexP2 < 0 || indexP2 >= characters.length) {
        return bot.sendMessage(chatId, "❌ Numéro invalide. Répondez avec un nombre entre 1 et " + characters.length, { reply_to_message_id: msg.message_id });
      }
      session.p2Character = characters[indexP2];
      session.turn = "p1";
      session.step = "battle";

      const p1Info = await bot.getChatMember(chatId, session.players.p1);
      const p2Info = await bot.getChatMember(chatId, session.players.p2);
      const p1Name = p1Info.user.first_name || "Joueur 1";
      const p2Name = p2Info.user.first_name || "Joueur 2";

      const battleStartMsg = `⚔️ 𝗖𝗢𝗠𝗕𝗔𝗧 𝗗𝗘𝗕𝗨𝗧\n━━━━━━━━━━━━━━\n` +
        `✦ ${session.p1Character.name} (${p1Name}) 𝗩𝗦 ${session.p2Character.name} (${p2Name})\n\n` +
        `𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀:\n` +
        `» 𝗮 - 𝗔𝘁𝘁𝗮𝗾𝘂𝗲 𝗯𝗮𝘀𝗶𝗾𝘂𝗲 (${damageSystem.basic.min}-${damageSystem.basic.max}%)\n` +
        `» 𝗯 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘀𝗽é𝗰𝗶𝗮𝗹𝗲 (-${damageSystem.special.chakraCost} chakra)\n` +
        `» 𝘅 - 𝗧𝗲𝗰𝗵𝗻𝗶𝗾𝘂𝗲 𝘂𝗹𝘁𝗶𝗺𝗲 (-${damageSystem.ultimate.chakraCost} chakra)\n` +
        `» 𝗰 - 𝗖𝗵𝗮𝗿𝗴𝗲𝗿 𝗰𝗵𝗮𝗸𝗿𝗮 (+${damageSystem.charge.chakraGain}%)\n` +
        `» 𝗱 - 𝗗é𝗳𝗲𝗻𝘀𝗲 (𝗿é𝗱𝘂𝗶𝘁 𝗹𝗲𝘀 𝗱é𝗴â𝘁𝘀)\n\n` +
        `@${p1Name} 𝗝𝗼𝘂𝗲𝘂𝗿 𝟭, 𝗰'𝗲𝘀𝘁 à 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;

      const sentMsgBattle = await bot.sendMessage(chatId, battleStartMsg, {
        reply_to_message_id: msg.message_id,
        mentions: [{ tag: `@${p1Name}`, id: session.players.p1 }]
      });

      global.teamnix.replies.set(sentMsgBattle.message_id, {
        nix,
        type: "naruto_battle",
        threadId,
        authorId: session.players.p1 // le joueur dont c'est le tour
      });
      global.teamnix.replies.delete(replyMsg.message_id);
      break;
    }

    case "naruto_battle": {
      // Vérifier que c'est bien le joueur dont c'est le tour
      const currentPlayer = session.turn === "p1" ? session.players.p1 : session.players.p2;
      if (userId !== currentPlayer) return;

      // Empêcher le spam de 'c' (deux fois de suite)
      if (body === 'c' && session.lastAction === 'c' && session.lastPlayer === userId) {
        return bot.sendMessage(chatId, "❌ Vous ne pouvez pas charger votre chakra deux fois de suite !", { reply_to_message_id: msg.message_id });
      }

      const attacker = session.turn === "p1" ? session.p1Character : session.p2Character;
      const defender = session.turn === "p1" ? session.p2Character : session.p1Character;
      const hpKey = session.turn === "p1" ? "p2HP" : "p1HP";
      const chakraKey = session.turn === "p1" ? "p1Chakra" : "p2Chakra";

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
          if (session[chakraKey] < damageSystem.special.chakraCost) {
            missed = true;
          } else {
            damage = randomBetween(damageSystem.special.min, damageSystem.special.max);
            chakraUsed = damageSystem.special.chakraCost;
            tech = attacker.basic;
            effect = attacker.basic.split(' ').pop();
          }
          break;

        case 'x':
          if (session[chakraKey] < damageSystem.ultimate.chakraCost) {
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
          session[chakraKey] = Math.min(100, session[chakraKey] + damageSystem.charge.chakraGain);
          chargeMessage = `🔋 ${attacker.name} accumule +${damageSystem.charge.chakraGain}% de chakra !`;
          session.lastAction = 'c';
          session.lastPlayer = userId;
          // Passer au joueur suivant
          session.turn = session.turn === "p1" ? "p2" : "p1";
          session.defending = false;
          // Envoyer le message de mise à jour
          await sendBattleUpdate();
          global.teamnix.replies.delete(replyMsg.message_id);
          return;

        case 'd':
          session.defending = session.turn;
          session.lastAction = 'd';
          session.lastPlayer = userId;
          session.turn = session.turn === "p1" ? "p2" : "p1";
          const defMsg = `🛡️ ${attacker.name} se met en position défensive !`;
          const sentDef = await bot.sendMessage(chatId, defMsg, { reply_to_message_id: msg.message_id });
          // Après défense, on attend le prochain joueur
          await sendBattleUpdate(sentDef);
          global.teamnix.replies.delete(replyMsg.message_id);
          return;

        default:
          return bot.sendMessage(chatId, "❌ Commande invalide\n» a - Attaque\n» b - Technique\n» x - Ultime\n» c - Charger\n» d - Défense", { reply_to_message_id: msg.message_id });
      }

      // Traitement de l'attaque (si pas 'c' ou 'd')
      if (!missed) {
        if (session.defending && session.defending !== session.turn) {
          damage = Math.floor(damage * 0.6);
          tech += " (défendu)";
        }

        session[chakraKey] -= chakraUsed;
        session[chakraKey] = Math.max(0, session[chakraKey]);
        session[hpKey] -= damage;
        session[hpKey] = Math.max(0, session[hpKey]);
      }

      session.lastAction = body;
      session.lastPlayer = userId;

      // Recharge de chakra passif (après chaque action)
      if (session.turn === "p1") {
        session.p1Chakra = Math.min(100, session.p1Chakra + session.chakraRegen);
      } else {
        session.p2Chakra = Math.min(100, session.p2Chakra + session.chakraRegen);
      }

      // Fonction interne pour envoyer le message de mise à jour du combat
      async function sendBattleUpdate(previousMsg = null) {
        let msgContent = "";

        if (body !== 'c' && !missed) {
          msgContent += `⚡ ${attacker.name} utilise ${tech} ${effect}\n`;
          msgContent += `💥 Inflige ${damage}% de dégâts à ${defender.name} !\n\n`;
        } else if (missed) {
          msgContent += `⚡ ${attacker.name} tente ${tech}...\n`;
          msgContent += `❌ Échoue ! (${session[chakraKey] < damageSystem.ultimate.chakraCost ? "Chakra insuffisant" : "Technique ratée"})\n\n`;
        }

        msgContent += `━━━━━━━━━━━━━━\n`;
        msgContent += `${getHealthColor(session.p1HP)}|${session.p1Character.name}: HP ${session.p1HP}%\n`;
        msgContent += `💙| Chakra ${session.p1Chakra}%\n`;
        msgContent += `━━━━━━━━━━━━━━\n`;
        msgContent += `${getHealthColor(session.p2HP)}|${session.p2Character.name}: HP ${session.p2HP}%\n`;
        msgContent += `💙| Chakra ${session.p2Chakra}%\n`;
        msgContent += `━━━━━━━━━━━━━━\n`;

        if (chargeMessage) msgContent += `${chargeMessage}\n`;

        // Vérifier si la partie est finie
        if (session.p1HP <= 0 || session.p2HP <= 0) {
          const winner = session.p1HP <= 0 ? session.p2Character.name : session.p1Character.name;
          msgContent += `🏆 𝗩𝗜𝗖𝗧𝗢𝗜𝗥𝗘 𝗗𝗘 ${winner} !\n`;
          msgContent += `𝗙𝗶𝗻 𝗱𝘂 𝗰𝗼𝗺𝗯𝗮𝘁. 𝗧𝗮𝗽𝗲𝘇 'fin' 𝗽𝗼𝘂𝗿 𝗿𝗲𝗰𝗼𝗺𝗺𝗲𝗻𝗰𝗲𝗿.`;
          // Supprimer la session
          delete global.teamnix.narutoSessions[threadId];
          // Envoyer le message final
          const finalMsg = await bot.sendMessage(chatId, msgContent, { reply_to_message_id: previousMsg?.message_id || msg.message_id });
          // On ne met pas de nouvelle attente
          return;
        } else {
          // Passer au joueur suivant
          session.turn = session.turn === "p1" ? "p2" : "p1";
          session.defending = false;
          const nextPlayer = session.turn === "p1" ? session.players.p1 : session.players.p2;
          const nextName = (await bot.getChatMember(chatId, nextPlayer)).user.first_name || "Joueur";
          msgContent += `@${nextName} 𝗝𝗼𝘂𝗲𝘂𝗿 ${session.turn === "p1" ? "1" : "2"}, 𝗰'𝗲𝘀𝘁 à 𝘁𝗼𝗶 𝗱𝗲 𝗷𝗼𝘂𝗲𝗿 !`;

          const sentMsg = await bot.sendMessage(chatId, msgContent, {
            reply_to_message_id: previousMsg?.message_id || msg.message_id,
            mentions: [{ tag: `@${nextName}`, id: nextPlayer }]
          });

          // Enregistrer la prochaine attente
          global.teamnix.replies.set(sentMsg.message_id, {
            nix,
            type: "naruto_battle",
            threadId,
            authorId: nextPlayer
          });
        }
      }

      await sendBattleUpdate();
      global.teamnix.replies.delete(replyMsg.message_id);
      break;
    }

    default:
      break;
  }
}

module.exports = { onStart, onReply, nix };