const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  nix: {
    name: "onlytik",
    aliases: ["tt18", "ttnsfw"],
    version: "1.0.0",
    author: "Christus",
    cooldown: 5,
    role: 0,
    category: "nsfw",
    shortDescription: "TikTok NSFW video",
    longDescription: "Send random TikTok NSFW video",
    guide: "tiktok18"
  },

  onStart: async function ({ bot, msg, chatId }) {
    let processingMessageId;
    let downloadPath;

    try {
      const processingMsg = await bot.sendMessage(
        chatId,
        "📥 Fetching video...",
        { reply_to_message_id: msg.message_id }
      );
      processingMessageId = processingMsg.message_id;

      const res = await axios.get("https://api.delirius.store/nsfw/tiktok");

      // Support plusieurs formats possibles
      const videoUrl =
        res.data?.data ||
        res.data?.url ||
        res.data?.video ||
        res.data?.result;

      if (!videoUrl) throw new Error("❌ Failed to get video.");

      const response = await axios.get(videoUrl, {
        responseType: "arraybuffer"
      });

      const buffer = Buffer.from(response.data, "binary");

      const filename = `tiktok_${Date.now()}.mp4`;
      downloadPath = path.join(__dirname, filename);

      fs.writeFileSync(downloadPath, buffer);

      await bot.sendVideo(chatId, downloadPath, {
        caption: "🔥 TikTok Video",
        reply_to_message_id: msg.message_id,
        fileName: filename
      });

    } catch (err) {
      console.error(err);
      bot.sendMessage(
        chatId,
        "❌ Error while fetching video.",
        { reply_to_message_id: msg.message_id }
      );
    } finally {
      if (processingMessageId) {
        bot.deleteMessage(chatId, processingMessageId);
      }
      if (downloadPath && fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }
    }
  }
};
