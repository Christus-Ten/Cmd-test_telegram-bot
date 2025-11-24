const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  nix: {
    name: "hotgirl",
    prefix: false,
    role: 0,
    category: "🔞 NSFW",
    aliases: [],
    author: "Christus",
    version: "1.0",
    shortDescription: {
      fr: "🔞 Image sexy directe",
    },
    longDescription: {
      fr: "Télécharge une image NSFW directement depuis l’API Delirius",
    },
  },

  async onStart({ bot, message, args }) {
    const chatId = message.chat.id;
    const url = "https://delirius-apiofc.vercel.app/nsfw/girls";
    const cacheDir = path.join(__dirname, "cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    const fileName = `hotgirl_${Date.now()}.jpg`;
    const filePath = path.join(cacheDir, fileName);

    try {
      const waitMsg = await bot.sendMessage(chatId, "🔞 Chargement de l'image NSFW...");

      const response = await axios.get(url, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        try {
          await bot.sendPhoto(chatId, filePath, { caption: "🔥 | Voici ta dose NSFW du jour !" });
          await bot.deleteMessage(chatId, waitMsg.message_id);
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Erreur en envoyant la photo :", err);
          await bot.editMessageText("❌ Une erreur est survenue lors de l'envoi de l’image.", {
            chat_id: chatId,
            message_id: waitMsg.message_id,
          });
        }
      });

      writer.on("error", async (err) => {
        console.error("Erreur lors du téléchargement :", err);
        await bot.editMessageText("❌ Une erreur est survenue lors du téléchargement.", {
          chat_id: chatId,
          message_id: waitMsg.message_id,
        });
      });
    } catch (err) {
      console.error("Erreur requête API :", err);
      await bot.sendMessage(chatId, "⚠️ Impossible de récupérer l’image.");
    }
  },
};
