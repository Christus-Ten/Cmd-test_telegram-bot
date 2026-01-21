const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  nix: {
    name: "gif",
    aliases: ["tenor", "animation"],
    version: "1.0.0",
    author: "Christus",
    role: 0,
    category: "média",
    description: "Recherche et envoie des GIFs depuis Tenor.",
    cooldown: 5,
    guide: "{p}gif [recherche] - [nombre]\nExemple: {p}gif Naruto - 3"
  },

  async onStart({ bot, msg, chatId, args }) {
    if (!args.length) {
      return bot.sendMessage(chatId, "⚠️ Veuillez fournir une recherche.\nExemple: /gif Naruto - 5");
    }

    let input = args.join(" ").trim();
    let query = input;
    let count = 5;

    // Gestion du séparateur "-" pour le nombre de GIFs
    if (input.includes("-")) {
      const parts = input.split("-");
      query = parts[0].trim();
      count = parseInt(parts[1].trim()) || 5;
    }

    // Limite pour éviter le spam ou les erreurs de chargement
    if (count > 10) count = 10;

    try {
      const waitMsg = await bot.sendMessage(chatId, "🎬 Récupération des GIFs en cours... ⏳");

      // 1. Récupération de l'URL de l'API depuis GitHub (comme dans ton code original)
      const githubRes = await axios.get("https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json");
      const apiBase = githubRes.data.apiv1;

      // 2. Recherche des GIFs
      const res = await axios.get(`${apiBase}/api/gif?query=${encodeURIComponent(query)}`);
      const gifs = res.data?.gifs || [];

      if (!gifs.length) {
        return bot.editMessageText(`❌ Aucun GIF trouvé pour "${query}".`, {
          chat_id: chatId,
          message_id: waitMsg.message_id
        });
      }

      // 3. Préparation des fichiers
      const mediaGroup = [];
      const tempFiles = [];
      const cacheDir = path.join(__dirname, "cache_gif");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const selectedGifs = gifs.slice(0, count);

      for (let i = 0; i < selectedGifs.length; i++) {
        const gifUrl = selectedGifs[i];
        const filePath = path.join(cacheDir, `gif_${Date.now()}_${i}.gif`);

        try {
          const gifData = await axios.get(gifUrl, { responseType: "arraybuffer" });
          fs.writeFileSync(filePath, Buffer.from(gifData.data));

          mediaGroup.push({
            type: 'video', // Les GIFs sur Telegram sont souvent traités comme des vidéos sans son
            media: fs.createReadStream(filePath),
            caption: i === 0 ? `🎬 GIFs pour : ${query}` : ""
          });

          tempFiles.push(filePath);
        } catch (e) {
          console.error("Erreur téléchargement GIF:", e.message);
        }
      }

      // 4. Envoi
      if (mediaGroup.length > 0) {
        await bot.sendMediaGroup(chatId, mediaGroup);
        bot.deleteMessage(chatId, waitMsg.message_id);
      } else {
        bot.editMessageText("❌ Impossible de charger les GIFs.", {
          chat_id: chatId,
          message_id: waitMsg.message_id
        });
      }

      // Nettoyage des fichiers temporaires
      setTimeout(() => {
        tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
      }, 15000);

    } catch (error) {
      console.error("Erreur commande GIF:", error);
      bot.sendMessage(chatId, "❌ Une erreur est survenue lors de la recherche de GIFs.");
    }
  }
};
