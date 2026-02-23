const axios = require('axios');
const fs = require('fs');
const path = require('path');

const getDatabasePath = (dbName) => {
  const dbPath = path.join(process.cwd(), 'database', `${dbName}.json`);
  const dbDir = path.join(process.cwd(), 'database');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
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

const OWNER_IDS = [123456789];

const nix = {
  name: "join",
  version: "3.1",
  aliases: ["rejoindre"],
  description: "Rejoindre un groupe où le bot est présent (propriétaires uniquement)",
  author: "Christus",
  prefix: false,
  category: "owner",
  role: 2,
  cooldown: 5,
  guide: "{p}join [page|next|prev]"
};

async function onStart({ bot, message, msg, chatId, args, usages }) {
  if (!OWNER_IDS.includes(msg.from.id)) {
    return bot.sendMessage(chatId, "⛔ Cette commande est réservée aux propriétaires du bot.", {
      reply_to_message_id: msg.message_id
    });
  }

  try {
    const groups = getDatabase('groups');
    if (!groups || groups.length === 0) {
      return bot.sendMessage(chatId, "❌ Aucun groupe enregistré. Le bot n'a encore reçu aucun message dans un groupe.", {
        reply_to_message_id: msg.message_id
      });
    }

    const groupList = groups.filter(g => g.type === 'group' || g.type === 'supergroup');
    if (groupList.length === 0) {
      return bot.sendMessage(chatId, "❌ Aucun groupe valide trouvé.", {
        reply_to_message_id: msg.message_id
      });
    }

    const pageSize = 10;
    const totalPages = Math.ceil(groupList.length / pageSize);
    
    if (!global.joinPage) global.joinPage = {};
    let page = 1;
    if (args[0]) {
      const input = args[0].toLowerCase();
      if (input === 'next') page = (global.joinPage[chatId] || 1) + 1;
      else if (input === 'prev') page = (global.joinPage[chatId] || 1) - 1;
      else if (input.includes('/')) page = parseInt(input.split('/')[0]) || 1;
      else page = parseInt(input) || 1;
    }
    page = Math.max(1, Math.min(page, totalPages));
    global.joinPage[chatId] = page;

    const startIndex = (page - 1) * pageSize;
    const currentGroups = groupList.slice(startIndex, startIndex + pageSize);

    let listText = '';
    currentGroups.forEach((g, idx) => {
      const globalIdx = startIndex + idx + 1;
      listText += `${globalIdx}. ${g.title || 'Sans nom'}\n`;
      listText += `   👥 ${g.memberCount || '?'} membres\n`;
      listText += `   🆔 ${g.id}\n\n`;
    });

    const messageText = 
      `╭─────────────❃\n` +
      `│ 🤝 REJOINDRE UN GROUPE\n` +
      `│──────────────────\n` +
      `${listText}` +
      `│──────────────────\n` +
      `│ 📄 Page ${page}/${totalPages} | Total: ${groupList.length} groupes\n` +
      `╰───────────────✦\n\n` +
      `👉 Répondez avec le numéro du groupe que vous voulez rejoindre.`;

    const sent = await bot.sendMessage(chatId, messageText, {
      reply_to_message_id: msg.message_id
    });

    global.teamnix.replies.set(sent.message_id, {
      nix,
      type: "join_reply",
      authorId: msg.from.id,
      groupList,
      page,
      pageSize
    });

  } catch (err) {
    console.error("Join error:", err);
    bot.sendMessage(chatId, "⚠️ Erreur lors de la récupération des groupes.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "join_reply" || userId !== data.authorId) return;

  const input = msg.text?.trim();
  const groupIndex = parseInt(input, 10);
  if (isNaN(groupIndex) || groupIndex <= 0) {
    return bot.sendMessage(chatId, "⚠️ Numéro invalide. Répondez avec un numéro de groupe valide.", {
      reply_to_message_id: msg.message_id
    });
  }

  const { groupList, page, pageSize } = data;
  const startIndex = (page - 1) * pageSize;
  const currentGroups = groupList.slice(startIndex, startIndex + pageSize);

  if (groupIndex > startIndex + currentGroups.length) {
    return bot.sendMessage(chatId, "⚠️ Numéro hors de portée pour cette page.", {
      reply_to_message_id: msg.message_id
    });
  }

  const selected = currentGroups.find((g, idx) => (startIndex + idx + 1) === groupIndex);
  if (!selected) {
    return bot.sendMessage(chatId, "⚠️ Groupe introuvable.", {
      reply_to_message_id: msg.message_id
    });
  }

  try {
    const chat = await bot.getChat(selected.id);
    if (chat.type === 'private') {
      return bot.sendMessage(chatId, "❌ Ceci n'est pas un groupe.", {
        reply_to_message_id: msg.message_id
      });
    }

    const member = await chat.getMember(userId).catch(() => null);
    if (member) {
      return bot.sendMessage(chatId, `⚠️ Vous êtes déjà dans "${chat.title}".`, {
        reply_to_message_id: msg.message_id
      });
    }

    const inviteLink = await bot.exportChatInviteLink(selected.id).catch(() => null);
    if (!inviteLink) {
      return bot.sendMessage(chatId, "❌ Impossible de créer un lien d'invitation. Le bot doit être administrateur.", {
        reply_to_message_id: msg.message_id
      });
    }

    await bot.sendMessage(chatId, `✅ Vous pouvez rejoindre "${chat.title}" en utilisant ce lien :\n${inviteLink}`, {
      reply_to_message_id: msg.message_id,
      disable_web_page_preview: true
    });

  } catch (err) {
    console.error("Join reply error:", err);
    bot.sendMessage(chatId, "⚠️ Échec de l'ajout au groupe. Vérifiez que le bot est administrateur et a les droits nécessaires.", {
      reply_to_message_id: msg.message_id
    });
  } finally {
    global.teamnix.replies.delete(replyMsg.message_id);
  }
}

module.exports = { onStart, onReply, nix };
