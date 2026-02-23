const axios = require('axios');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const nix = {
  name: "autodl",
  version: "3.4.0",
  aliases: ["download", "dl"],
  description: "Télécharge des médias depuis YouTube, Spotify, Imgur, Pinterest, etc.",
  author: "Christus",
  prefix: true,
  category: "downloader",
  role: 0,
  cooldown: 10,
  guide: "{p}autodl <URL>"
};

const patterns = {
  youtube: /(youtube\.com|youtu\.be)/i,
  spotify: /(spotify\.com|spotify\.link)/i,
  images: /(imgur\.com|i\.imgur\.com|pinterest\.com|pin\.it|imgbb\.com|ibb\.co)/i,
};

function getMediaType(url) {
  return {
    isYT: patterns.youtube.test(url),
    isSpotify: patterns.spotify.test(url),
    isImg: patterns.images.test(url),
  };
}

async function onStart({ bot, msg, chatId, args }) {
  const input = args.join(" ");
  const match = input.match(/https?:\/\/\S+/i);

  if (!match) {
    return bot.sendMessage(chatId, "❌ Veuillez fournir un lien valide.\nUsage: /autodl <URL>", {
      reply_to_message_id: msg.message_id
    });
  }

  const url = match[0];
  const type = getMediaType(url);

  const processingMsg = await bot.sendMessage(chatId, "⏳ Téléchargement en cours...", {
    reply_to_message_id: msg.message_id
  });

  try {
    const apiUrl = `https://downvid.onrender.com/api/download?url=${encodeURIComponent(url)}`;
    const { data: res } = await axios.get(apiUrl, { timeout: 60000 });

    if (!res || res.status !== "success") {
      throw new Error("Échec de l'API");
    }

    const mediaInfo = res?.data?.data || {};
    const videoUrl = res.video || mediaInfo.nowm || null;
    const audioUrl = res.audio || null;
    const imageUrl = res.image || mediaInfo.image || null;

    let downloads = [];
    let header = "";

    if (type.isSpotify) {
      if (!audioUrl) throw new Error("Aucun audio trouvé");
      downloads.push({ url: audioUrl, ext: "mp3" });
      header = "✅ Spotify Audio 🎧\n\n";
    } else if (type.isYT) {
      if (!videoUrl) throw new Error("Aucune vidéo trouvée");
      downloads.push({ url: videoUrl, ext: "mp4" });
      header = "✅ YouTube Video 🎬\n\n";
    } else if (type.isImg) {
      const target = imageUrl || videoUrl;
      if (!target) throw new Error("Aucune image trouvée");
      downloads.push({ url: target, ext: target.includes(".mp4") ? "mp4" : "jpg" });
      header = "✅ Image/Media 🖼️\n\n";
    } else {
      if (videoUrl) downloads.push({ url: videoUrl, ext: "mp4" });
      else if (audioUrl) downloads.push({ url: audioUrl, ext: "mp3" });
      else if (imageUrl) downloads.push({ url: imageUrl, ext: "jpg" });
      else throw new Error("Aucun média téléchargeable trouvé");
    }

    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});

    for (const item of downloads) {
      const filePath = path.join(CACHE_DIR, `autodl_${Date.now()}_${Math.random().toString(36).slice(2)}.${item.ext}`);
      try {
        const response = await axios.get(item.url, { responseType: "arraybuffer", timeout: 120000 });
        await fsPromises.writeFile(filePath, response.data);

        const caption = `${header}📌 Titre : ${mediaInfo.title || "Média"}`;

        if (item.ext === "mp4") {
          await bot.sendVideo(chatId, filePath, {
            caption: caption,
            reply_to_message_id: msg.message_id
          });
        } else if (item.ext === "mp3") {
          await bot.sendAudio(chatId, filePath, {
            caption: caption,
            reply_to_message_id: msg.message_id
          });
        } else if (item.ext === "jpg" || item.ext === "jpeg" || item.ext === "png") {
          await bot.sendPhoto(chatId, filePath, {
            caption: caption,
            reply_to_message_id: msg.message_id
          });
        }
      } finally {
        await fsPromises.unlink(filePath).catch(() => {});
      }
    }
  } catch (error) {
    console.error("AutoDL Error:", error);
    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
    bot.sendMessage(chatId, `❌ Erreur : ${error.message || "Impossible de télécharger le média"}`, {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
}

module.exports = { onStart, onReply, nix };
