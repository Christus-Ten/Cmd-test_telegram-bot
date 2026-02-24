const axios = require('axios');

const christus = {
  name: "imagine",
  version: "1.0.0",
  aliases: ["gen", "dalle", "image"],
  description: "Génère une image avec DALL‑E 3 via une API rapide",
  author: "Christus",
  prefix: false,
  category: "tools",
  role: 0,
  cooldown: 10,
  guide: "{p}imagine <prompt> — Exemple : {p}imagine un chat violet"
};

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const prompt = args.join(" ");
  if (!prompt) {
    return usages();
  }

  const userId = msg.from.id;
  const apiKey = "zk-27e8f22c6bfe9261d982d6825604378bd1a74cc8ea500ac18a327e9caa99c7cf";
  const apiUrl = "https://rapido.initd.asia/api/openai";

  try {
    const waitMsg = await bot.sendMessage(
      chatId,
      "🎨 Génération de l’image en cours…\nCela peut prendre quelques secondes.",
      { reply_to_message_id: msg.message_id }
    );

    const params = {
      query: prompt,
      uid: userId,
      img_url: "",
      model: "dall-e-3",
      roleplay: "",
      apikey: apiKey
    };

    const res = await axios.get(apiUrl, { params });
    const data = res.data;

    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});

    if (data.status && data.model_type === "image") {
      const imageUrl = data.response;
      await bot.sendPhoto(chatId, imageUrl, {
        caption: `🖼️ ${prompt}\n\nGénéré par DALL‑E 3`,
        reply_to_message_id: msg.message_id
      });
    } else {
      await bot.sendMessage(
        chatId,
        "❌ L’API a renvoyé une réponse invalide. Réessaie plus tard.",
        { reply_to_message_id: msg.message_id }
      );
    }
  } catch (error) {
    console.error("Erreur API image:", error);
    let errorMsg = "❌ Une erreur est survenue lors de la génération.";
    if (error.response) {
      errorMsg += `\nCode : ${error.response.status}`;
    }
    await bot.sendMessage(chatId, errorMsg, { reply_to_message_id: msg.message_id });
  }
}

module.exports = { onStart, nix };
