const axios = require('axios');
const fs = require('fs');
const path = require('path');

// (No database helpers needed for this command)

const nix = {
  name: "spy",
  version: "1.0.0",
  aliases: ["userinfo", "profileinfo", "ui"],
  description: "Affiche des informations publiques sur un utilisateur (mention ou réponse)",
  author: "Christus (converted)",
  prefix: true,
  category: "information",
  role: 0,
  cooldown: 5,
  guide: "{p}spy [répondre à un message] ou {p}spy @mention"
};

async function onStart({ bot, message, msg, chatId, args, usages }) {
  try {
    // Déterminer l'utilisateur cible
    let targetUserId = null;
    let targetUser = null;

    // Vérifier si le message est une réponse à un autre message
    if (msg.reply_to_message && msg.reply_to_message.from) {
      targetUserId = msg.reply_to_message.from.id;
      targetUser = msg.reply_to_message.from;
    }
    // Vérifier s'il y a une mention dans le texte
    else if (msg.entities && msg.entities.length > 0) {
      const mentionEntity = msg.entities.find(e => e.type === 'mention' || e.type === 'text_mention');
      if (mentionEntity) {
        if (mentionEntity.type === 'text_mention' && mentionEntity.user) {
          // Mention avec utilisateur complet (quand on tape @nom et que Telegram le reconnaît)
          targetUserId = mentionEntity.user.id;
          targetUser = mentionEntity.user;
        } else if (mentionEntity.type === 'mention') {
          // Mention simple avec @username, on doit le résoudre
          const username = msg.text.substring(mentionEntity.offset, mentionEntity.offset + mentionEntity.length).replace('@', '');
          // On ne peut pas résoudre directement un username sans faire une requête,
          // donc on va utiliser getChatMember pour chercher dans le groupe ?
          // Mais si c'est en privé, pas de groupe. Solution : on demande à l'utilisateur de répondre au message.
          return bot.sendMessage(chatId, 
            "❌ Pour utiliser un @username, veuillez répondre directement au message de la personne ou utiliser la mention en répondant.",
            { reply_to_message_id: msg.message_id }
          );
        }
      }
    }

    // Si aucune cible trouvée, utiliser l'expéditeur du message
    if (!targetUserId) {
      targetUserId = msg.from.id;
      targetUser = msg.from;
    }

    // Récupérer les informations complètes de l'utilisateur
    let userFull;
    try {
      userFull = await bot.getChatMember(chatId, targetUserId);
    } catch (e) {
      // Si l'utilisateur n'est pas dans ce chat (par exemple en privé), on utilise getChat
      if (chatId === targetUserId) {
        // C'est une conversation privée avec soi-même ou avec le bot ?
        userFull = await bot.getChat(targetUserId);
      } else {
        userFull = { user: targetUser }; // fallback
      }
    }

    const user = userFull.user || targetUser;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || "N/A";
    const username = user.username ? `@${user.username}` : "N/A";
    const userId = user.id;
    const languageCode = user.language_code || "N/A";
    const isBot = user.is_bot ? "Oui" : "Non";

    // Vérifier si l'utilisateur est admin dans le groupe (seulement si c'est un groupe)
    let adminStatus = "Non applicable";
    if (chatId > 0) {
      // chatId positif = conversation privée, pas de notion d'admin
      adminStatus = "Conversation privée";
    } else {
      // Groupe ou supergroupe
      try {
        const chatMember = await bot.getChatMember(chatId, targetUserId);
        const status = chatMember.status;
        if (status === 'creator' || status === 'administrator') {
          adminStatus = "Oui (Admin)";
        } else {
          adminStatus = "Non (Membre)";
        }
      } catch (e) {
        adminStatus = "Inconnu";
      }
    }

    // Récupérer la photo de profil
    let photos;
    try {
      photos = await bot.getUserProfilePhotos(targetUserId, 0, 1);
    } catch (e) {
      photos = { total_count: 0 };
    }

    // Construire le message
    let infoMessage = 
      `╭────❒ 👤 Informations publiques ❒────\n` +
      `├ 👤 Nom : ${fullName}\n` +
      `├ 🆔 ID : ${userId}\n` +
      `├ 📛 Username : ${username}\n` +
      `├ 🤖 Bot : ${isBot}\n` +
      `├ 🌐 Langue : ${languageCode}\n` +
      `├ 👑 Admin dans ce groupe : ${adminStatus}\n`;

    if (photos.total_count > 0) {
      const fileId = photos.photos[0][0].file_id;
      // Envoyer la photo avec la légende
      await bot.sendPhoto(chatId, fileId, {
        caption: infoMessage,
        reply_to_message_id: msg.message_id
      });
    } else {
      infoMessage += `╰────────────❒`;
      await bot.sendMessage(chatId, infoMessage, {
        reply_to_message_id: msg.message_id
      });
    }

  } catch (err) {
    console.error("Spy error:", err);
    bot.sendMessage(chatId, 
      "╭────❒ ❌ Erreur ❒\n├⬡ Impossible de récupérer les informations.\n╰────────────❒",
      { reply_to_message_id: msg.message_id }
    );
  }
}

// Pas de onReply nécessaire pour cette commande
async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Not used
}

module.exports = { onStart, onReply, nix };
