const axios = require("axios");
const fonts = require("./func/fonts.js");

const nix = {
  name: "copilot",
  aliases: ["cp", "cop"],
  version: "1.0.0",
  author: "Christus (Nix Port)",
  role: 0,
  category: "AI",
  description: "Discute avec l'intelligence artificielle Copilot.",
  cooldown: 5,
  guide: "{p}copilot [votre message] ou répondez à un message avec {p}copilot"
};

async function onStart({ bot, msg, chatId, args }) {
  let message = args.join(" ");
  const userId = msg.from.id;

  if (!message && msg.reply_to_message) {
    message = msg.reply_to_message.text || "";
  }

  if (!message) {
    return bot.sendMessage(chatId, "❓ Veuillez fournir un message.\n\nExemple : /copilot Bonjour, comment vas-tu ?");
  }

  bot.sendChatAction(chatId, "typing");

  try {
    if (!global.teamnix.copilotHistory) global.teamnix.copilotHistory = {};
    if (!global.teamnix.copilotHistory[userId]) global.teamnix.copilotHistory[userId] = [];

    global.teamnix.copilotHistory[userId].push({ role: "user", content: message });

    const response = await axios.get("https://christus-api.vercel.app/ai/copilot", {
      params: { message, model: "default" },
      headers: { Accept: "application/json", "User-Agent": "Copilot-AI-Client/1.0" }
    });

    if (!response.data || !response.data.answer) {
      return bot.sendMessage(chatId, "❌ Réponse invalide reçue de Copilot AI.");
    }

    const answer = response.data.answer;
    global.teamnix.copilotHistory[userId].push({ role: "assistant", content: answer });

    const styledAnswer = fonts.sansSerif(answer);
    const formattedAnswer = `🤖 𝗖𝗼𝗽𝗶𝗹𝗼𝘁 𝗔𝗜\n\n${styledAnswer}\n\n_Répondez à ce message pour continuer la conversation._`;
    const sentMsg = await bot.sendMessage(chatId, formattedAnswer, { reply_to_message_id: msg.message_id });

    if (!global.teamnix.replies) global.teamnix.replies = new Map();
    global.teamnix.replies.set(sentMsg.message_id, {
      nix,
      type: "copilot",
      userId,
      threadId: chatId
    });

  } catch (err) {
    console.error("Erreur Copilot AI :", err.message);
    bot.sendMessage(chatId, "⚠️ Le service Copilot AI est actuellement indisponible.");
  }
}

async function onReply({ bot, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "copilot") return;

  const userMessage = msg.text?.trim();
  if (!userMessage) return;

  bot.sendChatAction(chatId, "typing");

  try {
    if (!global.teamnix.copilotHistory) global.teamnix.copilotHistory = {};
    if (!global.teamnix.copilotHistory[userId]) global.teamnix.copilotHistory[userId] = [];

    global.teamnix.copilotHistory[userId].push({ role: "user", content: userMessage });

    const response = await axios.get("https://christus-api.vercel.app/ai/copilot", {
      params: { message: userMessage, model: "default" },
      headers: { Accept: "application/json", "User-Agent": "Copilot-AI-Client/1.0" }
    });

    if (!response.data || !response.data.answer) {
      return bot.sendMessage(chatId, "❌ Réponse invalide reçue de Copilot AI.");
    }

    const answer = response.data.answer;
    global.teamnix.copilotHistory[userId].push({ role: "assistant", content: answer });

    const styledAnswer = fonts.sansSerif(answer);
    const formattedAnswer = `🤖 𝗖𝗼𝗽𝗶𝗹𝗼𝘁 𝗔𝗜\n\n${styledAnswer}\n\n_Répondez à ce message pour continuer la conversation._`;
    const sentMsg = await bot.sendMessage(chatId, formattedAnswer, { reply_to_message_id: msg.message_id });

    global.teamnix.replies.set(sentMsg.message_id, {
      nix,
      type: "copilot",
      userId,
      threadId: chatId
    });

  } catch (err) {
    console.error("Erreur Copilot AI :", err.message);
    bot.sendMessage(chatId, "⚠️ Le service Copilot AI est actuellement indisponible.");
  }
}

module.exports = { onStart, onReply, nix };
