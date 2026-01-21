const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  nix: {
    name: "booru",
    aliases: ["rb", "realbooru"],
    version: "1.2.0",
    author: "Christus (Nix Port)",
    role: 0,
    category: "image",
    description: "Récupère des images variées depuis RealBooru.",
    cooldown: 5,
    guide: "{p}booru [mot-clé]"
  },

  async onStart({ bot, msg, chatId, args }) {
    const query = args.join(" ") || "1girl";
    
    // Génération d'un numéro de page aléatoire pour varier les résultats
    // On prend une page entre 0 et 50 pour avoir de la diversité
    const randomPage = Math.floor(Math.random() * 50);
    
    // Ajout de &pid (page ID) pour éviter de toujours recevoir les 5 premières images
    const apiUrl = `https://christus-api.vercel.app/nsfw/RealBooru?query=${encodeURIComponent(query)}&limit=5&pid=${randomPage}`;

    try {
      const waitMsg = await bot.sendMessage(chatId, "🔍 Recherche de nouvelles images...");

      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status || !data.results || data.results.length === 0) {
        return bot.editMessageText("❌ Aucune nouvelle image trouvée. Essayez un autre mot-clé.", {
          chat_id: chatId,
          message_id: waitMsg.message_id
        });
      }

      const mediaGroup = [];
      const tempFiles = [];
      const cacheDir = path.join(__dirname, "cache_booru");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      // Mélanger aussi les résultats reçus pour plus de fun
      const shuffledResults = data.results.sort(() => 0.5 - Math.random());

      for (let i = 0; i < shuffledResults.length; i++) {
        const item = shuffledResults[i];
        const imageUrl = item.imageUrl;
        const filePath = path.join(cacheDir, `booru_${Date.now()}_${i}.jpg`);
        
        try {
          const res = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          fs.writeFileSync(filePath, Buffer.from(res.data));
          
          mediaGroup.push({
            type: 'photo',
            media: fs.createReadStream(filePath),
            caption: i === 0 ? `🖼️ Résultats aléatoires pour : ${query}\n📄 Page : ${randomPage}` : ""
          });
          
          tempFiles.push(filePath);
        } catch (e) {
          console.error(`Erreur image ${i}:`, e.message);
        }
      }

      if (mediaGroup.length > 0) {
        await bot.sendMediaGroup(chatId, mediaGroup);
        bot.deleteMessage(chatId, waitMsg.message_id);
      } else {
        bot.editMessageText("❌ Erreur lors du chargement des visuels.", {
          chat_id: chatId,
          message_id: waitMsg.message_id
        });
      }

      // Nettoyage automatique
      setTimeout(() => {
        tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
      }, 10000);

    } catch (error) {
      console.error("Erreur API Booru:", error);
      bot.sendMessage(chatId, "❌ Le service de recherche est temporairement indisponible.");
    }
  }
};
