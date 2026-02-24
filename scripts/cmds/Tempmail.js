const axios = require('axios');

const nix = {
  name: "tempmail",
  version: "1.0.0",
  aliases: ["tmpmail", "generatemail", "mail"],
  description: "Génère une adresse email temporaire avec mot de passe",
  author: "Christus",
  prefix: false,
  category: "utilities",
  role: 0,
  cooldown: 5,
  guide: "{p}tempmail"
};

const API_KEY = "zk-27e8f22c6bfe9261d982d6825604378bd1a74cc8ea500ac18a327e9caa99c7cf";
const BASE_URL = "https://rapido.initd.asia/api/tempmail";

async function onStart({ bot, msg, chatId, args }) {
  try {
    const waitMsg = await bot.sendMessage(
      chatId,
      "⏳ Génération d'une adresse email temporaire...",
      { reply_to_message_id: msg.message_id }
    );

    const res = await axios.get(`${BASE_URL}/genv2`, {
      params: { apikey: API_KEY }
    });

    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});

    const data = res.data;

    if (data.email && data.password) {
      const replyMsg = 
        `📧 Email temporaire généré\n\n` +
        `Email : \`${data.email}\`\n` +
        `Mot de passe : \`${data.password}\`\n\n` +
        `Utilisez ces identifiants pour recevoir des emails sur cette adresse.`;

      await bot.sendMessage(chatId, replyMsg, { reply_to_message_id: msg.message_id });
    } else {
      await bot.sendMessage(
        chatId,
        "❌ L'API n'a pas retourné d'email valide. Réessayez plus tard.",
        { reply_to_message_id: msg.message_id }
      );
    }
  } catch (error) {
    console.error("Erreur API tempmail:", error);
    let errorMsg = "❌ Une erreur est survenue lors de la génération.";
    if (error.response) {
      errorMsg += `\nCode : ${error.response.status}`;
    }
    await bot.sendMessage(chatId, errorMsg, { reply_to_message_id: msg.message_id });
  }
}

module.exports = { onStart, nix };
