const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const moment = require('moment-timezone');

const nix = {
  name: "youtube",
  version: "1.0.0",
  aliases: ["ytb", "yt", "video"],
  description: "Rechercher et télécharger des vidéos/audio YouTube",
  author: "Christus",
  prefix: true,
  category: "media",
  role: 0,
  cooldown: 5,
  guide: "{p}youtube -v <recherche|url>\n{p}youtube -a <recherche|url>"
};

// API fixe (provenant de la commande goatbot)
const API_BASE = "https://downvid.onrender.com/api/v1/download";

async function streamFromURL(url) {
  const res = await axios({ url, responseType: "stream" });
  return res.data;
}

function buildList(videos, type, userName) {
  const time = moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm");

  const list = videos
    .map((v, i) => {
      const duration = formatDuration(v.seconds);
      const quality = type === "-v" ? "360p" : "128kbps";
      return `📍 ${i + 1}. ${v.title}\n   ⏱️ ${duration} | 🎚️ ${quality}`;
    })
    .join("\n\n");

  return `📺 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿\n━━━━━━━━━━━━━━\n\n` +
    `👤 ${userName}\n` +
    `📅 ${time}\n\n` +
    `🎯 𝗦é𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝘇 𝘂𝗻 𝗺é𝗱𝗶𝗮\n\n${list}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `✍️ Répondez avec un nombre (1-6)\n` +
    `⏰ 30 secondes pour répondre`;
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function downloadMedia(videoUrl, type, chatId, bot, msg, fileName) {
  try {
    // Construction de l'URL avec les paramètres (format = mp4 ou mp3)
    const apiUrl = `${API_BASE}?url=${encodeURIComponent(videoUrl)}&format=${type}`;
    const { data } = await axios.get(apiUrl);

    // Vérification de la réponse (format de l'API goatbot)
    if (data.status !== "success" || !data.downloadUrl) {
      throw new Error("Erreur API");
    }

    const fileExt = type === "mp4" ? "mp4" : "mp3";
    const filePath = path.join(__dirname, `yt_${Date.now()}.${fileExt}`);
    
    const writer = fs.createWriteStream(filePath);
    const res = await axios({ url: data.downloadUrl, responseType: "stream" });
    res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (type === "mp4") {
      await bot.sendVideo(chatId, filePath, {
        caption: `✅ 𝗧é𝗹é𝗰𝗵𝗮𝗿𝗴𝗲𝗺𝗲𝗻𝘁 𝗿é𝘂𝘀𝘀𝗶 !\n📹 ${fileName || "Vidéo YouTube"}`,
        reply_to_message_id: msg.message_id
      });
    } else {
      await bot.sendAudio(chatId, filePath, {
        caption: `✅ 𝗧é𝗹é𝗰𝗵𝗮𝗿𝗴𝗲𝗺𝗲𝗻𝘁 𝗿é𝘂𝘀𝘀𝗶 !\n🎵 ${fileName || "Audio YouTube"}`,
        reply_to_message_id: msg.message_id
      });
    }

    fs.unlinkSync(filePath);
    return true;

  } catch (error) {
    console.error("Erreur téléchargement:", error);
    throw error;
  }
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const userId = msg.from.id;
  const userName = msg.from.first_name || msg.from.username || "Utilisateur";
  
  const mode = args[0]?.toLowerCase();
  const query = args.slice(1).join(" ");

  if (!mode || !["-v", "-a"].includes(mode) || !query) {
    return usages();
  }

  try {
    // URL directe
    if (query.startsWith("http")) {
      const loadingMsg = await bot.sendMessage(chatId, 
        "⏳ Téléchargement en cours... Veuillez patienter...",
        { reply_to_message_id: msg.message_id }
      );

      try {
        const fileName = query.split('v=')[1] || "YouTube";
        await downloadMedia(
          query,
          mode === "-v" ? "mp4" : "mp3",
          chatId,
          bot,
          msg,
          fileName
        );
        
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        
      } catch (error) {
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        return bot.sendMessage(chatId, 
          "❌ Échec du téléchargement. Vérifiez l'URL ou réessayez plus tard.",
          { reply_to_message_id: msg.message_id }
        );
      }
      return;
    }

    // Recherche
    const searchMsg = await bot.sendMessage(chatId, 
      "🔍 Recherche en cours...",
      { reply_to_message_id: msg.message_id }
    );

    try {
      const res = await yts(query);
      const videos = res.videos.slice(0, 6);

      if (videos.length === 0) {
        await bot.deleteMessage(chatId, searchMsg.message_id);
        return bot.sendMessage(chatId, 
          "❌ Aucun résultat trouvé.",
          { reply_to_message_id: msg.message_id }
        );
      }

      // Télécharger les miniatures
      const thumbs = [];
      for (const video of videos) {
        try {
          const thumbStream = await streamFromURL(video.thumbnail);
          const thumbPath = path.join(__dirname, `thumb_${Date.now()}_${thumbs.length}.jpg`);
          const writer = fs.createWriteStream(thumbPath);
          thumbStream.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });
          
          thumbs.push(thumbPath);
        } catch (e) {
          console.error("Erreur miniature:", e);
        }
      }

      await bot.deleteMessage(chatId, searchMsg.message_id);

      // Envoyer le message avec les miniatures
      const mediaGroup = thumbs.map(thumb => ({
        type: 'photo',
        media: thumb
      }));

      const sentMsg = await bot.sendMediaGroup(chatId, mediaGroup, {
        reply_to_message_id: msg.message_id
      });

      const lastMsgId = Array.isArray(sentMsg) ? sentMsg[sentMsg.length - 1].message_id : sentMsg.message_id;

      const listMsg = await bot.sendMessage(chatId, 
        buildList(videos, mode, userName),
        { reply_to_message_id: msg.message_id }
      );

      // Nettoyer les miniatures
      thumbs.forEach(thumb => {
        try { fs.unlinkSync(thumb); } catch (e) {}
      });

      // Stocker les données pour la réponse
      global.teamnix.replies.set(listMsg.message_id, {
        nix,
        type: "youtube_reply",
        authorId: userId,
        results: videos,
        mode: mode,
        searchQuery: query
      });

      // Timeout de 30 secondes
      setTimeout(() => {
        if (global.teamnix.replies.has(listMsg.message_id)) {
          global.teamnix.replies.delete(listMsg.message_id);
          bot.sendMessage(chatId, 
            "⏰ Temps écoulé ! Veuillez relancer la commande.",
            { reply_to_message_id: listMsg.message_id }
          );
        }
      }, 30000);

    } catch (error) {
      await bot.deleteMessage(chatId, searchMsg.message_id);
      console.error("Erreur recherche:", error);
      return bot.sendMessage(chatId, 
        "❌ Aucun résultat trouvé.",
        { reply_to_message_id: msg.message_id }
      );
    }

  } catch (error) {
    console.error("Erreur YouTube:", error);
    return bot.sendMessage(chatId, 
      "❌ Erreur de configuration API.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "youtube_reply" || userId !== data.authorId) return;

  const choice = parseInt(msg.text);
  if (isNaN(choice) || choice < 1 || choice > data.results.length) {
    return bot.sendMessage(chatId, 
      "❌ Sélection invalide. Choisissez un nombre entre 1 et 6.",
      { reply_to_message_id: msg.message_id }
    );
  }

  const selected = data.results[choice - 1];
  
  // Supprimer la référence de réponse
  global.teamnix.replies.delete(replyMsg.message_id);

  // Message de chargement
  const loadingMsg = await bot.sendMessage(chatId, 
    `⏳ Téléchargement de "${selected.title}"...\n⏱️ Durée: ${formatDuration(selected.seconds)}\n🎚️ Qualité: ${data.mode === "-v" ? "360p" : "128kbps"}`,
    { reply_to_message_id: msg.message_id }
  );

  try {
    await downloadMedia(
      selected.url,
      data.mode === "-v" ? "mp4" : "mp3",
      chatId,
      bot,
      msg,
      selected.title
    );

    await bot.deleteMessage(chatId, loadingMsg.message_id);

  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    console.error("Erreur téléchargement:", error);
    return bot.sendMessage(chatId, 
      "❌ Échec du téléchargement. Réessayez plus tard.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

module.exports = { onStart, onReply, nix };
