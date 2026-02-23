const axios = require('axios');

// Fonctions de police (gardées identiques)
function toCmdFont(text = "") {
  const map = {
    A:"𝖠",B:"𝖡",C:"𝖢",D:"𝖣",E:"𝖤",F:"𝖥",G:"𝖦",H:"𝖧",I:"𝖨",J:"𝖩",
    K:"𝖪",L:"𝖫",M:"𝖬",N:"𝖭",O:"𝖮",P:"𝖯",Q:"𝖰",R:"𝖱",S:"𝖲",T:"𝖳",
    U:"𝖴",V:"𝖵",W:"𝖶",X:"𝖷",Y:"𝖸",Z:"𝖹",
    a:"𝖺",b:"𝖻",c:"𝖼",d:"𝖽",e:"𝖾",f:"𝖿",g:"𝗀",h:"𝗁",i:"𝗂",j:"𝗃",
    k:"𝗄",l:"𝗅",m:"𝗆",n:"𝗇",o:"𝗈",p:"𝗉",q:"𝗊",r:"𝗋",s:"𝗌",t:"𝗍",
    u:"𝗎",v:"𝗏",w:"𝗐",x:"𝗑",y:"𝗒",z:"𝗓",
    " ":" "
  };
  return text.split("").map(c => map[c] || c).join("");
}

function toQuestionFont(text = "") {
  const map = {
    A:"𝐴",B:"𝐵",C:"𝐶",D:"𝐷",E:"𝐸",F:"𝐹",G:"𝐺",H:"𝐻",I:"𝐼",J:"𝐽",
    K:"𝐾",L:"𝐿",M:"𝑀",N:"𝑁",O:"𝑂",P:"𝑃",Q:"𝑄",R:"𝑅",S:"𝑆",T:"𝑇",
    U:"𝑈",V:"𝑉",W:"𝑊",X:"𝑋",Y:"𝑌",Z:"𝑍",
    a:"𝑎",b:"𝑏",c:"𝑐",d:"𝑑",e:"𝑒",f:"𝑓",g:"𝑔",h:"ℎ",i:"𝑖",j:"𝑗",
    k:"𝑘",l:"𝑙",m:"𝑚",n:"𝑛",o:"𝑜",p:"𝑝",q:"𝑞",r:"𝑟",s:"𝑠",t:"𝑡",
    u:"𝑢",v:"𝑣",w:"𝑤",x:"𝑥",y:"𝑦",z:"𝑧",
    " ":" "
  };
  return text.split("").map(c => map[c] || c).join("");
}

const nix = {
  name: "help",
  version: "6.3",
  aliases: ["aide", "menu"],
  description: "Affiche la liste des commandes ou les détails d'une commande spécifique",
  author: "Christus",
  prefix: false,
  category: "info",
  role: 0,
  cooldown: 2,
  guide: "{p}help [commande] | {p}help -ai <commande> <question>"
};

async function onStart({ bot, msg, chatId, args }) {
  const userId = msg.from.id;
  const userName = msg.from.first_name || "Utilisateur";

  // Récupération de l'avatar de l'utilisateur (optionnel)
  let avatarFileId = null;
  try {
    const photos = await bot.getUserProfilePhotos(userId, 0, 1);
    if (photos.total_count > 0) {
      avatarFileId = photos.photos[0][0].file_id;
    }
  } catch (err) {
    console.error("Erreur récupération avatar:", err);
  }

  // Vérifier que les commandes sont disponibles
  if (!global.teamnix || !global.teamnix.cmds) {
    return bot.sendMessage(chatId, "❌ Erreur : système de commandes non initialisé.", {
      reply_to_message_id: msg.message_id
    });
  }

  const commands = global.teamnix.cmds; // Map
  const prefix = global.teamnix?.config?.prefix || "/";

  // --- Fonction utilitaire pour trouver une commande par nom ou alias ---
  const findCommand = (query) => {
    query = query.toLowerCase();
    for (const cmd of commands.values()) {
      if (cmd.nix.name === query) return cmd;
      if (cmd.nix.aliases && cmd.nix.aliases.includes(query)) return cmd;
    }
    return null;
  };

  // --- 1. Mode -AI ---
  if (args[0] && args[0].toLowerCase() === "-ai") {
    const cmdName = args[1] ? args[1].toLowerCase() : null;
    const questionRaw = args.slice(2).join(" ");

    if (!cmdName) {
      const text = "❌ Usage : .help -ai <commande> <question>";
      return avatarFileId
        ? bot.sendPhoto(chatId, avatarFileId, { caption: text, reply_to_message_id: msg.message_id })
        : bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
    }

    const command = findCommand(cmdName);
    if (!command) {
      const text = `❌ Commande "${cmdName}" introuvable.`;
      return avatarFileId
        ? bot.sendPhoto(chatId, avatarFileId, { caption: text, reply_to_message_id: msg.message_id })
        : bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
    }

    const cmdNix = command.nix;
    const roleMap = { 0: "Tous", 1: "Admins de groupe", 2: "Propriétaires" };

    const info = `
Nom: ${cmdNix.name}
Description: ${cmdNix.description || "Aucune description"}
Catégorie: ${cmdNix.category || "Autres"}
Alias: ${cmdNix.aliases ? cmdNix.aliases.join(", ") : "Aucun"}
Rôle: ${roleMap[cmdNix.role] || "Inconnu"}
Cooldown: ${cmdNix.cooldown || 1}s
Version: ${cmdNix.version || "1.0"}
Auteur: ${cmdNix.author || "Inconnu"}
Guide: ${cmdNix.guide || "Aucun guide"}
    `;

    const prompt = `
Tu es un assistant GoatBot qui aide les utilisateurs à comprendre les commandes.

Voici les informations de la commande :
${info}

Question de l'utilisateur :
${questionRaw || "Explique comment utiliser cette commande."}

Réponds clairement dans la langue de l'utilisateur sans utiliser de caractères *.
    `;

    try {
      const apiUrl = `https://christus-api.vercel.app/ai/gemini-proxy2?prompt=${encodeURIComponent(prompt)}`;
      const { data } = await axios.get(apiUrl);
      let aiReply = data?.result || "Pas de réponse de l'IA.";
      aiReply = aiReply.replace(/\*/g, "");

      const styledQuestion = toQuestionFont(questionRaw || "Explique comment utiliser cette commande.");

      const body = `🤖 Assistant IA — ${cmdNix.name}\n\n❓ ${styledQuestion}\n\n${aiReply}`;

      if (avatarFileId) {
        await bot.sendPhoto(chatId, avatarFileId, { caption: body, reply_to_message_id: msg.message_id });
      } else {
        await bot.sendMessage(chatId, body, { reply_to_message_id: msg.message_id });
      }
    } catch (err) {
      console.error("Erreur IA:", err);
      const text = "❌ Échec de la requête IA.";
      return avatarFileId
        ? bot.sendPhoto(chatId, avatarFileId, { caption: text, reply_to_message_id: msg.message_id })
        : bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
    }

    return;
  }

  // --- 2. Détail d'une commande spécifique ---
  if (args[0]) {
    const query = args[0].toLowerCase();
    const command = findCommand(query);

    if (!command) {
      const text = `❌ Commande "${query}" introuvable.`;
      return avatarFileId
        ? bot.sendPhoto(chatId, avatarFileId, { caption: text, reply_to_message_id: msg.message_id })
        : bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
    }

    const cmdNix = command.nix;
    const roleMap = { 0: "👥 Tous", 1: "🔰 Admins", 2: "👑 Propriétaires" };
    const aliasesList = cmdNix.aliases && cmdNix.aliases.length
      ? cmdNix.aliases.map(a => toCmdFont(a)).join(", ")
      : "Aucun";

    const desc = cmdNix.description || "Aucune description.";
    const usage = cmdNix.guide || cmdNix.name;

    const card = [
      `✨ ${toCmdFont(cmdNix.name)} ✨`,
      `📝 Description : ${desc}`,
      `📂 Catégorie : ${cmdNix.category || "Autres"}`,
      `🔤 Alias : ${aliasesList}`,
      `🛡️ Rôle : ${roleMap[cmdNix.role] || "Inconnu"} | ⏱️ Cooldown : ${cmdNix.cooldown || 1}s`,
      `🚀 Version : ${cmdNix.version || "1.0"} | 👨‍💻 Auteur : ${cmdNix.author || "Inconnu"}`,
      `💡 Utilisation : ${prefix}${toCmdFont(usage)}`
    ].join("\n");

    return avatarFileId
      ? bot.sendPhoto(chatId, avatarFileId, { caption: card, reply_to_message_id: msg.message_id })
      : bot.sendMessage(chatId, card, { reply_to_message_id: msg.message_id });
  }

  // --- 3. Menu général (aucun argument) ---
  const categorized = {};

  for (const cmd of commands.values()) {
    const category = cmd.nix.category || "Autres";
    if (!categorized[category]) categorized[category] = [];
    if (!categorized[category].includes(cmd.nix.name)) {
      categorized[category].push(cmd.nix.name);
    }
  }

  const sortedCategories = Object.keys(categorized).sort();
  let body = "📚 MENU DES COMMANDES\n\n";

  for (const cat of sortedCategories) {
    const cmdList = categorized[cat]
      .sort()
      .map(name => `✿ ${toCmdFont(name)}`)
      .join("  ");
    body += `🍓 ${cat.toUpperCase()}\n${cmdList}\n\n`;
  }

  const total = [...new Set([...commands.values()].map(c => c.nix.name))].length;
  body += `📊 Total commandes : ${total}\n`;
  body += `🔧 Détail : ${prefix}help <commande>\n`;
  body += `🤖 Aide IA : ${prefix}help -ai <commande> <question>`;

  if (avatarFileId) {
    await bot.sendPhoto(chatId, avatarFileId, { caption: body, reply_to_message_id: msg.message_id });
  } else {
    await bot.sendMessage(chatId, body, { reply_to_message_id: msg.message_id });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Non utilisé
}

module.exports = { onStart, onReply, nix };
