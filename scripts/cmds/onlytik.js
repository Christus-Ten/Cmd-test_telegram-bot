const axios = require("axios");
const fs = require("fs");
const path = require("path");

const nix = {
  name: "onlytik",
  aliases: ["ttnsfw", "nsfwtiktok", "tiktok18"],
  author: "Christus",
  version: "1.0.0",
  role: 0,
  category: "nsfw",
  description: "Récupère des vidéos TikTok NSFW aléatoires",
  cooldown: 10,
  guide: "{p}tiktoknsfw - Vidéo aléatoire\n{p}tiktoknsfw [nombre] - Nombre de vidéos (max 5)"
};

async function onStart({ bot, msg, chatId, args }) {
  let processingMessageId;
  let downloadPaths = [];

  try {
    const count = args[0] ? Math.min(parseInt(args[0]) || 1, 5) : 1;
    
    const processingMsg = await bot.sendMessage(chatId, "🔞 Récupération des vidéos TikTok NSFW...", { reply_to_message_id: msg.message_id });
    processingMessageId = processingMsg.message_id;

    for (let i = 0; i < count; i++) {
      try {
        const apiUrl = "https://api.delirius.store/nsfw/tiktok";
        
        const response = await axios.get(apiUrl, { 
          timeout: 15000,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.data || !response.data.data || !response.data.data.play) {
          throw new Error("Format de réponse invalide");
        }

        const videoData = response.data.data;
        const videoUrl = videoData.play;
        const videoBuffer = await axios.get(videoUrl, { 
          responseType: 'arraybuffer',
          timeout: 20000 
        });

        const buffer = Buffer.from(videoBuffer.data, 'binary');
        
        const filename = `tiktok_nsfw_${Date.now()}_${i}.mp4`;
        const filePath = path.join(__dirname, filename);
        
        fs.writeFileSync(filePath, buffer);
        downloadPaths.push(filePath);

        const caption = 
          `🔞 TikTok NSFW #${i + 1}\n` +
          `━━━━━━━━━━━━━━━\n` +
          `👤 Auteur: ${videoData.author?.nickname || "Inconnu"}\n` +
          `🆔 @${videoData.author?.unique_id || "inconnu"}\n` +
          `❤️ Likes: ${videoData.digg_count?.toLocaleString() || "N/A"}\n` +
          `💬 Commentaires: ${videoData.comment_count?.toLocaleString() || "N/A"}\n` +
          `🔁 Partages: ${videoData.share_count?.toLocaleString() || "N/A"}\n` +
          `🎵 Son: ${videoData.music_info?.title || "Inconnu"}`;

        const options = {
          reply_to_message_id: msg.message_id,
          caption: i === count - 1 ? caption : undefined,
          duration: videoData.duration || 60,
          fileName: filename,
          width: videoData.width || 720,
          height: videoData.height || 1280
        };

        if (count === 1) {
          await bot.sendVideo(chatId, filePath, options);
        } else {
          if (i === 0) {
            await bot.sendVideo(chatId, filePath, { reply_to_message_id: msg.message_id });
          } else {
            await bot.sendVideo(chatId, filePath);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (videoError) {
        console.error(`Erreur vidéo ${i}:`, videoError.message);
        if (count === 1) {
          throw videoError;
        }
      }
    }

    if (count > 1) {
      await bot.sendMessage(chatId, 
        `✅ ${count} vidéos TikTok NSFW envoyées avec succès !`, 
        { reply_to_message_id: msg.message_id }
      );
    }

  } catch (err) {
    console.error("Erreur TikTok NSFW:", err.message);
    
    let errorMessage = "❌ Erreur lors de la récupération des vidéos.\n";
    
    if (err.message.includes("timeout")) {
      errorMessage = "❌ Délai d'attente dépassé. Veuillez réessayer.";
    } else if (err.message.includes("invalide")) {
      errorMessage = "❌ Format de réponse API invalide.";
    } else if (err.message.includes("404")) {
      errorMessage = "❌ API non trouvée. Vérifiez l'URL.";
    } else {
      errorMessage += `Détails: ${err.message}`;
    }
    
    await bot.sendMessage(chatId, errorMessage, { reply_to_message_id: msg.message_id });
    
  } finally {
    if (processingMessageId) {
      try {
        await bot.deleteMessage(chatId, processingMessageId);
      } catch (e) {}
    }

    for (const filePath of downloadPaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error("Erreur nettoyage fichier:", e.message);
      }
    }
  }
}

module.exports = { nix, onStart };
