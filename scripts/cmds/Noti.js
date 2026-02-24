const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== BASE DE DONNÉES DES GROUPES ====================
const getGroupsDatabase = () => {
  const dbPath = path.join(process.cwd(), 'database', 'groups.json');
  const dbDir = path.join(process.cwd(), 'database');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const saveGroupsDatabase = (groups) => {
  const dbPath = path.join(process.cwd(), 'database', 'groups.json');
  fs.writeFileSync(dbPath, JSON.stringify(groups, null, 2));
};

// ==================== FONCTION POUR TEXTE EN GRAS SANS-SERIF ====================
function toBoldSans(str) {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bold =   "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵";
  return str.split('').map(c => {
    const index = normal.indexOf(c);
    return index !== -1 ? bold[index] : c;
  }).join('');
}

// ==================== MÉTADONNÉES DE LA COMMANDE ====================
const nix = {
  name: "notification",
  version: "3.0.0",
  aliases: ["notify", "noti"],
  description: "Diffusion ultime : Nom du groupe dynamique, Tag Admin, Heure CI.",
  author: "Christus",
  prefix: true,
  category: "owner",
  role: 2, // réservé aux propriétaires
  cooldown: 10,
  guide: "{p}notification <message> - Diffuse un message à tous les groupes"
};

// ==================== FONCTION PRINCIPALE ====================
async function onStart({ bot, message, msg, chatId, args, usages }) {
  const messageContent = args.join(" ");
  const senderId = msg.from.id;
  const senderName = msg.from.first_name || msg.from.username || "Admin";

  // Vérifier si le message est vide (pas de texte ni de pièce jointe)
  if (!messageContent && (!msg.photo && !msg.document && !msg.video && !msg.audio)) {
    return bot.sendMessage(chatId, "❌ **Erreur** : Le message est vide.", { reply_to_message_id: msg.message_id });
  }

  try {
    // 1. Récupération des infos de l'admin (pour le tag)
    // On peut simplement utiliser senderName, mais pour un vrai tag on utilise l'ID
    const adminTag = `[${senderName}](tg://user?id=${senderId})`;

    // 2. Configuration Date & Heure (fuseau Abidjan)
    const dateOptions = { timeZone: "Africa/Abidjan", day: "2-digit", month: "2-digit", year: "numeric" };
    const timeOptions = { timeZone: "Africa/Abidjan", hour: "2-digit", minute: "2-digit", hour12: false };
    const currentDate = new Intl.DateTimeFormat("fr-FR", dateOptions).format(new Date());
    const currentTime = new Intl.DateTimeFormat("fr-FR", timeOptions).format(new Date());

    // 3. Récupération de la liste des groupes
    // Méthode 1 : utiliser une base de données locale (groups.json) que l'on maintient via onChat
    // Pour simplifier, on va utiliser les groupes stockés dans la base
    let groups = getGroupsDatabase();
    if (groups.length === 0) {
      return bot.sendMessage(chatId, "🏜️ Aucun groupe trouvé dans la base de données.\nAssurez-vous que le bot a reçu des messages dans des groupes.", { reply_to_message_id: msg.message_id });
    }

    // 4. Préparation des pièces jointes
    let attachment = null;
    if (msg.photo) {
      // Récupérer le fichier photo (le plus grand)
      const photo = msg.photo[msg.photo.length - 1];
      attachment = await bot.getFile(photo.file_id);
    } else if (msg.document) {
      attachment = await bot.getFile(msg.document.file_id);
    } else if (msg.video) {
      attachment = await bot.getFile(msg.video.file_id);
    } else if (msg.audio) {
      attachment = await bot.getFile(msg.audio.file_id);
    }

    // 5. Interface de lancement
    await bot.sendMessage(chatId,
      `📡 **INITIALISATION DU SYSTÈME**\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 Admin : ${senderName}\n` +
      `🎯 Cibles : ${groups.length} groupes\n` +
      `🌍 Zone : Abidjan (${currentTime})\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚀 Envoi en cours...`,
      { reply_to_message_id: msg.message_id }
    );

    let success = 0;
    let failed = 0;

    // 6. BOUCLE D'ENVOI
    for (const groupId of groups) {
      try {
        // Récupérer le nom du groupe
        const chat = await bot.getChat(groupId);
        const groupName = chat.title || "Groupe Inconnu";

        // Construction du message personnalisé
        const broadcastBody = 
          `╔════════════════╗\n` +
          `   📢 ${toBoldSans("𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡")}\n` +
          `╚════════════════╝\n\n` +
          `${messageContent}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `🔰 ${toBoldSans("Groupe")} : ${groupName}\n` +
          `👤 ${toBoldSans("Admin")} : ${adminTag}\n` +
          `📅 ${toBoldSans("Date")} : ${currentDate}\n` +
          `🕒 ${toBoldSans("Heure")} : ${currentTime} (CI)\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ ${toBoldSans("écrit #supportgc pour rejoindre le groupe du bot.")}`;

        const msgObject = {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true }
        };

        if (attachment) {
          // Envoyer avec la pièce jointe
          if (msg.photo) {
            await bot.sendPhoto(groupId, attachment.file_path || photo.file_id, {
              caption: broadcastBody,
              parse_mode: 'Markdown'
            });
          } else if (msg.document) {
            await bot.sendDocument(groupId, attachment.file_path || msg.document.file_id, {
              caption: broadcastBody,
              parse_mode: 'Markdown'
            });
          } else if (msg.video) {
            await bot.sendVideo(groupId, attachment.file_path || msg.video.file_id, {
              caption: broadcastBody,
              parse_mode: 'Markdown'
            });
          } else if (msg.audio) {
            await bot.sendAudio(groupId, attachment.file_path || msg.audio.file_id, {
              caption: broadcastBody,
              parse_mode: 'Markdown'
            });
          } else {
            await bot.sendMessage(groupId, broadcastBody, msgObject);
          }
        } else {
          await bot.sendMessage(groupId, broadcastBody, msgObject);
        }

        success++;
        await new Promise(res => setTimeout(res, 800)); // délai anti-spam

      } catch (e) {
        console.error(`Échec pour le groupe ${groupId}:`, e.message);
        failed++;
      }
    }

    // 7. Rapport final
    const finalReport = 
      `🏁 ${toBoldSans("𝗥𝗔𝗣𝗣𝗢𝗥𝗧 𝗙𝗜𝗡𝗔𝗟")}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✅ Reçus : ${success}\n` +
      `❌ Échecs : ${failed}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✨ Opération terminée avec succès.`;

    await bot.sendMessage(chatId, finalReport, { reply_to_message_id: msg.message_id });

  } catch (err) {
    console.error("Erreur critique dans notification:", err);
    return bot.sendMessage(chatId, "❌ Erreur critique du système de diffusion.", { reply_to_message_id: msg.message_id });
  }
}

// ==================== GESTIONNAIRE DE CHAT POUR ENREGISTRER LES GROUPES ====================
async function onChat({ bot, msg, chatId, message }) {
  // Seulement pour les groupes/supergroupes
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    const groups = getGroupsDatabase();
    if (!groups.includes(chatId)) {
      groups.push(chatId);
      saveGroupsDatabase(groups);
    }
  }
}

// ==================== EXPORTS ====================
module.exports = { nix, onStart, onChat };
