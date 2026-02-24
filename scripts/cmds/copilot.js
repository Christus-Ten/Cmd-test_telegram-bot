const axios = require("axios");

function toMathSans(text) {
  const map = {
    'a': '\u1D5BA', 'b': '\u1D5BB', 'c': '\u1D5BC', 'd': '\u1D5BD', 'e': '\u1D5BE',
    'f': '\u1D5BF', 'g': '\u1D5C0', 'h': '\u1D5C1', 'i': '\u1D5C2', 'j': '\u1D5C3',
    'k': '\u1D5C4', 'l': '\u1D5C5', 'm': '\u1D5C6', 'n': '\u1D5C7', 'o': '\u1D5C8',
    'p': '\u1D5C9', 'q': '\u1D5CA', 'r': '\u1D5CB', 's': '\u1D5CC', 't': '\u1D5CD',
    'u': '\u1D5CE', 'v': '\u1D5CF', 'w': '\u1D5D0', 'x': '\u1D5D1', 'y': '\u1D5D2', 'z': '\u1D5D3',
    'A': '\u1D5A0', 'B': '\u1D5A1', 'C': '\u1D5A2', 'D': '\u1D5A3', 'E': '\u1D5A4',
    'F': '\u1D5A5', 'G': '\u1D5A6', 'H': '\u1D5A7', 'I': '\u1D5A8', 'J': '\u1D5A9',
    'K': '\u1D5AA', 'L': '\u1D5AB', 'M': '\u1D5AC', 'N': '\u1D5AD', 'O': '\u1D5AE',
    'P': '\u1D5AF', 'Q': '\u1D5B0', 'R': '\u1D5B1', 'S': '\u1D5B2', 'T': '\u1D5B3',
    'U': '\u1D5B4', 'V': '\u1D5B5', 'W': '\u1D5B6', 'X': '\u1D5B7', 'Y': '\u1D5B8', 'Z': '\u1D5B9',
    '0': '\u1D7E0', '1': '\u1D7E1', '2': '\u1D7E2', '3': '\u1D7E3', '4': '\u1D7E4',
    '5': '\u1D7E5', '6': '\u1D7E6', '7': '\u1D7E7', '8': '\u1D7E8', '9': '\u1D7E9'
  };
  return text.split('').map(char => map[char] || char).join('');
}

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

    const styledAnswer = toMathSans(answer);
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

    const styledAnswer = toMathSans(answer);
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
