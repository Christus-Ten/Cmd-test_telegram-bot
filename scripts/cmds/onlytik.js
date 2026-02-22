const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  nix: {
    name: "onlytik",
    aliases: ["tiktok18", "ttnsfw"],
    version: "1.1.0",
    author: "Christus",
    cooldown: 5,
    role: 0,
    category: "nsfw",
    guide: "tt18"
  },

  onStart: async function ({ bot, msg, chatId }) {
    let processingMessageId;
    let filePath;

    try {
      const loading = await bot.sendMessage(
        chatId,
        "📥 Fetching video...",
        { reply_to_message_id: msg.message_id }
      );
      processingMessageId = loading.message_id;

      const res = await axios.get(
        "https://api.delirius.store/nsfw/tiktok",
        { timeout: 20000 }
      );

      // 🔥 récupération intelligente du lien vidéo
      const videoUrl =
        res.data?.data?.url ||
        res.data?.data ||
        res.data?.url ||
        res.data?.video ||
        res.data?.result?.url ||
        res.data?.result;

      if (!videoUrl) throw new Error("No video URL");

      // télécharger vidéo
      const response = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 30000
      });

      const buffer = Buffer.from(response.data, "binary");

      filePath = path.join(__dirname, `tt18_${Date.now()}.mp4`);
      fs.writeFileSync(filePath, buffer);

      await bot.sendVideo(chatId, filePath, {
        caption: "🔥 TikTok 18+",
        reply_to_message_id: msg.message_id,
        fileName: "tiktok18.mp4"
      });

    } catch (err) {
      console.error("TT18 ERROR:", err.message);

      bot.sendMessage(
        chatId,
        "❌ Impossible de récupérer la vidéo.",
        { reply_to_message_id: msg.message_id }
      );

    } finally {
      if (processingMessageId) {
        bot.deleteMessage(chatId, processingMessageId);
      }

      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};
