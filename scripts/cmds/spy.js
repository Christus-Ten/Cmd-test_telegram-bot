const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== GESTION DE LA BASE DE DONNÉES ====================
const getDatabasePath = (dbName) => {
  const dbPath = path.join(process.cwd(), 'database', `${dbName}.json`);
  const dbDir = path.join(process.cwd(), 'database');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}));
  }
  
  return dbPath;
};

const getDatabase = (dbName) => {
  const dbPath = getDatabasePath(dbName);
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const saveDatabase = (dbName, data) => {
  const dbPath = getDatabasePath(dbName);
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// ==================== MÉTADONNÉES DE LA COMMANDE ====================
const nix = {
  name: "spy",
  version: "2.0",
  aliases: ["userinfo", "profileinfo", "ui", "infospy"],
  description: "Affiche des informations détaillées sur un utilisateur (mention, réponse, UID)",
  author: "Christus",
  prefix: true,
  category: "information",
  role: 0,
  cooldown: 5,
  guide: "{p}spy - Vos infos\n{p}spy @mention - Infos de l'utilisateur mentionné\n{p}spy <uid> - Infos par ID\nRépondre à un message avec {p}spy"
};

// ==================== FONCTIONS UTILITAIRES ====================
function getUserRank(exp) {
  if (exp < 1000) return "🥉 Newbie";
  if (exp < 5000) return "🥈 Beginner";
  if (exp < 10000) return "🥇 Intermediate";
  if (exp < 25000) return "🏆 Advanced";
  if (exp < 50000) return "💎 Expert";
  if (exp < 100000) return "👑 Master";
  return "🌟 Legend";
}

function calculateLevel(exp) {
  return Math.floor(exp / 1000) + 1;
}

function nextLevelExp(exp) {
  const level = calculateLevel(exp);
  return level * 1000 - exp;
}

function formatNumber(num) {
  return num.toLocaleString();
}

// ==================== FONCTION PRINCIPALE ====================
async function onStart({ bot, message, msg, chatId, args, usages }) {
  try {
    // Déterminer l'utilisateur cible
    let targetUserId = null;
    let targetUser = null;

    // 1. Réponse à un message
    if (msg.reply_to_message && msg.reply_to_message.from) {
      targetUserId = msg.reply_to_message.from.id;
      targetUser = msg.reply_to_message.from;
    }
    // 2. Mention explicite (entité text_mention ou mention)
    else if (msg.entities && msg.entities.length > 0) {
      const mentionEntity = msg.entities.find(e => e.type === 'text_mention' || e.type === 'mention');
      if (mentionEntity) {
        if (mentionEntity.type === 'text_mention' && mentionEntity.user) {
          targetUserId = mentionEntity.user.id;
          targetUser = mentionEntity.user;
        } else if (mentionEntity.type === 'mention') {
          // On ne peut pas résoudre directement, on demande de répondre ou d'utiliser l'UID
          return bot.sendMessage(chatId,
            "❌ Pour utiliser un @username, veuillez répondre au message de la personne ou utiliser son ID numérique.",
            { reply_to_message_id: msg.message_id }
          );
        }
      }
    }
    // 3. Argument numérique (UID)
    else if (args.length > 0 && !isNaN(args[0])) {
      targetUserId = parseInt(args[0]);
      // On n'a pas l'objet user, on le récupérera plus tard
    }
    // 4. Par défaut : l'expéditeur
    else {
      targetUserId = msg.from.id;
      targetUser = msg.from;
    }

    // Si on n'a pas encore l'objet user (cas UID), on le récupère via getChat
    if (!targetUser && targetUserId) {
      try {
        const chat = await bot.getChat(targetUserId);
        targetUser = chat;
      } catch (e) {
        // Utiliser un objet minimal
        targetUser = { id: targetUserId, first_name: "Inconnu", username: null };
      }
    }

    if (!targetUserId) {
      return bot.sendMessage(chatId, "❌ Impossible de déterminer l'utilisateur cible.", { reply_to_message_id: msg.message_id });
    }

    // ===== RÉCUPÉRATION DES DONNÉES DE LA BASE LOCALE =====
    const usersDb = getDatabase('users');
    if (!usersDb[targetUserId]) {
      // Nouvel utilisateur : on crée une entrée par défaut
      usersDb[targetUserId] = {
        name: targetUser.first_name + (targetUser.last_name ? ' ' + targetUser.last_name : ''),
        money: 0,
        exp: 0,
        totalMessages: 0,
        joinedDate: Date.now(),
        lastSeen: Date.now()
      };
      saveDatabase('users', usersDb);
    }
    const userData = usersDb[targetUserId];

    // ===== RÉCUPÉRATION DES INFOS TELEGRAM =====
    // Informations de base
    const fullName = [targetUser.first_name, targetUser.last_name].filter(Boolean).join(' ') || "N/A";
    const username = targetUser.username ? `@${targetUser.username}` : "N/A";
    const userId = targetUser.id;
    const languageCode = targetUser.language_code || "N/A";
    const isBot = targetUser.is_bot ? "Oui" : "Non";

    // Bio (si disponible)
    let bio = "Non disponible";
    try {
      const chatFull = await bot.getChat(userId);
      if (chatFull.bio) bio = chatFull.bio;
    } catch (e) {}

    // Statut admin dans le groupe (seulement si en groupe)
    let adminStatus = "Non applicable";
    let groupNickname = null;
    let joinedGroupDate = null;
    if (chatId < 0) { // chatId négatif = groupe/supergroupe
      try {
        const chatMember = await bot.getChatMember(chatId, userId);
        const status = chatMember.status;
        if (status === 'creator' || status === 'administrator') {
          adminStatus = "✅ Admin";
        } else {
          adminStatus = "❌ Membre";
        }
        if (chatMember.custom_title) {
          groupNickname = chatMember.custom_title;
        }
        // On peut aussi récupérer la date d'arrivée si on la stocke, mais pas directement dispo
      } catch (e) {
        adminStatus = "Inconnu";
      }
    }

    // Photo de profil
    let photos;
    try {
      photos = await bot.getUserProfilePhotos(userId, 0, 1);
    } catch (e) {
      photos = { total_count: 0 };
    }

    // ===== STATISTIQUES GLOBALES =====
    const allUsers = Object.values(usersDb);
    const sortedByExp = [...allUsers].sort((a, b) => (b.exp || 0) - (a.exp || 0));
    const sortedByMoney = [...allUsers].sort((a, b) => (b.money || 0) - (a.money || 0));
    const expRank = sortedByExp.findIndex(u => u.name === userData.name && u.joinedDate === userData.joinedDate) + 1; // approximation
    const moneyRank = sortedByMoney.findIndex(u => u.name === userData.name && u.joinedDate === userData.joinedDate) + 1;
    const totalUsers = allUsers.length;

    // ===== CONSTRUCTION DU MESSAGE =====
    const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

    let infoMessage = 
      `╭────❒ 🕵️ 𝗦𝗣𝗬 𝗩𝟮.𝟬 ❒────\n` +
      `├ 👤 𝗡𝗼𝗺 : ${fullName}\n` +
      `├ 🆔 𝗜𝗗 : ${userId}\n` +
      `├ 📛 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${username}\n` +
      `├ 🤖 𝗕𝗼𝘁 : ${isBot}\n` +
      `├ 🌐 𝗟𝗮𝗻𝗴𝘂𝗲 : ${languageCode}\n` +
      `├ 📝 𝗕𝗶𝗼 : ${bio}\n` +
      `├ 👑 𝗦𝘁𝗮𝘁𝘂𝘁 𝗴𝗿𝗼𝘂𝗽𝗲 : ${adminStatus}\n`;

    if (groupNickname) {
      infoMessage += `├ 🏷️ 𝗦𝘂𝗿𝗻𝗼𝗺 𝗴𝗿𝗼𝘂𝗽𝗲 : ${groupNickname}\n`;
    }

    infoMessage += 
      `├───────────────────\n` +
      `├ 💰 𝗔𝗿𝗴𝗲𝗻𝘁 : ${formatNumber(userData.money || 0)} 💵\n` +
      `├ ✨ 𝗘𝘅𝗽 : ${formatNumber(userData.exp || 0)} XP\n` +
      `├ 📊 𝗡𝗶𝘃𝗲𝗮𝘂 : ${calculateLevel(userData.exp || 0)} (prochain: ${nextLevelExp(userData.exp || 0)} XP)\n` +
      `├ 🏅 𝗥𝗮𝗻𝗴 : ${getUserRank(userData.exp || 0)}\n` +
      `├ 💬 𝗠𝗲𝘀𝘀𝗮𝗴𝗲𝘀 𝘁𝗼𝘁𝗮𝘂𝘅 : ${formatNumber(userData.totalMessages || 0)}\n` +
      `├ 📅 𝗣𝗿𝗲𝗺𝗶𝗲𝗿𝗲 𝗮𝗽𝗽𝗮𝗿𝗶𝘁𝗶𝗼𝗻 : ${new Date(userData.joinedDate || Date.now()).toLocaleDateString('fr-FR')}\n` +
      `├ 🕐 𝗗𝗲𝗿𝗻𝗶𝗲̀𝗿𝗲 𝗮𝗰𝘁𝗶𝘃𝗶𝘁𝗲́ : ${new Date(userData.lastSeen || Date.now()).toLocaleDateString('fr-FR')}\n` +
      `├───────────────────\n` +
      `├ 📈 𝗖𝗹𝗮𝘀𝘀𝗲𝗺𝗲𝗻𝘁 𝗘𝗫𝗣 : #${expRank}/${totalUsers}\n` +
      `├ 💵 𝗖𝗹𝗮𝘀𝘀𝗲𝗺𝗲𝗻𝘁 𝗮𝗿𝗴𝗲𝗻𝘁 : #${moneyRank}/${totalUsers}\n` +
      `╰────❒ 🕐 𝗥𝗮𝗽𝗽𝗼𝗿𝘁 𝗱𝘂 ${timestamp} ❒`;

    // ===== ENVOI =====
    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      await bot.sendPhoto(chatId, fileId, {
        caption: infoMessage,
        reply_to_message_id: msg.message_id
      });
    } else {
      await bot.sendMessage(chatId, infoMessage, {
        reply_to_message_id: msg.message_id
      });
    }

  } catch (err) {
    console.error("Spy error:", err);
    bot.sendMessage(chatId,
      "╭────❒ ❌ 𝗘𝗿𝗿𝗲𝘂𝗿 ❒\n├⬡ Impossible de récupérer les informations.\n╰────────────❒",
      { reply_to_message_id: msg.message_id }
    );
  }
}

// Pas de onReply nécessaire
async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {}

module.exports = { onStart, onReply, nix };
