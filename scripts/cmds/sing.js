const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');
const moment = require('moment-timezone');

const nix = {
  name: "sing",
  version: "2.0.0",
  aliases: ["music", "song", "mp3", "audio"],
  description: "Rechercher et télécharger des chansons depuis YouTube (MP3)",
  author: "Christus",
  prefix: true,
  category: "media",
  role: 0,
  cooldown: 5,
  guide: "{p}sing <nom de la chanson>"
};

const CACHE_DIR = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSongList(query, videos, userName) {
  const time = moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm");

  const list = videos
    .map((v, i) => {
      const duration = formatDuration(v.seconds);
      return `📍 ${i + 1}. ${v.title}\n   ⏱️ ${duration} | 👤 ${v.author.name}`;
    })
    .join("\n\n");

  return `🎵 𝗥𝗲𝗰𝗵𝗲𝗿𝗰𝗵𝗲 𝗠𝘂𝘀𝗶𝗰𝗮𝗹𝗲\n━━━━━━━━━━━━━━\n\n` +
    `👤 ${userName}\n` +
    `📅 ${time}\n` +
    `🔍 𝗥𝗲𝗰𝗵𝗲𝗿𝗰𝗵𝗲: "${query}"\n\n` +
    `📋 𝗥é𝘀𝘂𝗹𝘁𝗮𝘁𝘀\n\n${list}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `✍️ Répondez avec un nombre (1-6) pour télécharger\n` +
    `⏰ 30 secondes pour répondre`;
}

function formatSongInfo(data, video, userName) {
  const fileSize = data.fileSize || formatBytes(data.size) || "Inconnu";
  const quality = data.quality || "128kbps";
  
  return `✅ 𝗧é𝗹é𝗰𝗵𝗮𝗿𝗴𝗲𝗺𝗲𝗻𝘁 𝗿é𝘂𝘀𝘀𝗶 !\n━━━━━━━━━━━━━━\n\n` +
    `🎶 𝗧𝗶𝘁𝗿𝗲: ${data.title || video.title}\n` +
    `👤 𝗔𝗿𝘁𝗶𝘀𝘁𝗲: ${video.author.name}\n` +
    `⏱️ 𝗗𝘂𝗿é𝗲: ${formatDuration(video.seconds)}\n` +
    `📦 𝗧𝗮𝗶𝗹𝗹𝗲: ${fileSize}\n` +
    `🎧 𝗤𝘂𝗮𝗹𝗶𝘁é: ${quality}\n\n` +
    `👤 Téléchargé par: ${userName}`;
}

function formatBytes(bytes) {
  if (!bytes) return null;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

async function downloadThumbnail(url, index) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const filePath = path.join(CACHE_DIR, `thumb_${index}_${Date.now()}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(res.data));
    return filePath;
  } catch (error) {
    console.error("Erreur téléchargement miniature:", error);
    return null;
  }
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const userId = msg.from.id;
  const userName = msg.from.first_name || msg.from.username || "Utilisateur";
  
  const query = args.join(" ").trim();

  if (!query) {
    return usages();
  }

  const searchMsg = await bot.sendMessage(chatId, 
    "🔍 Recherche de musique en cours...",
    { reply_to_message_id: msg.message_id }
  );

  try {
    const search = await ytSearch(query);
    const videos = search.videos.slice(0, 6);

    if (videos.length === 0) {
      await bot.deleteMessage(chatId, searchMsg.message_id);
      return bot.sendMessage(chatId, 
        "❌ Aucun résultat trouvé sur YouTube.",
        { reply_to_message_id: msg.message_id }
      );
    }

    const thumbPaths = [];
    for (let i = 0; i < videos.length; i++) {
      try {
        const thumbPath = await downloadThumbnail(videos[i].thumbnail, i);
        if (thumbPath) thumbPaths.push(thumbPath);
      } catch (e) {
        console.error(`Erreur miniature ${i}:`, e);
      }
    }

    await bot.deleteMessage(chatId, searchMsg.message_id);

    let lastMsgId;
    if (thumbPaths.length > 0) {
      const mediaGroup = thumbPaths.map(thumb => ({
        type: 'photo',
        media: thumb
      }));

      const sentMsg = await bot.sendMediaGroup(chatId, mediaGroup, {
        reply_to_message_id: msg.message_id
      });
      lastMsgId = Array.isArray(sentMsg) ? sentMsg[sentMsg.length - 1].message_id : sentMsg.message_id;
    }

    const listMsg = await bot.sendMessage(chatId, 
      formatSongList(query, videos, userName),
      { reply_to_message_id: msg.message_id }
    );

    thumbPaths.forEach(thumb => {
      try { fs.unlinkSync(thumb); } catch (e) {}
    });

    global.teamnix.replies.set(listMsg.message_id, {
      nix,
      type: "sing_reply",
      authorId: userId,
      videos: videos,
      query: query
    });

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
    console.error("Erreur recherche musique:", error);
    return bot.sendMessage(chatId, 
      "❌ Erreur lors de la recherche. Veuillez réessayer.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "sing_reply" || userId !== data.authorId) return;

  const choice = parseInt(msg.text);
  if (isNaN(choice) || choice < 1 || choice > data.videos.length) {
    return bot.sendMessage(chatId, 
      "❌ Sélection invalide. Choisissez un nombre entre 1 et 6.",
      { reply_to_message_id: msg.message_id }
    );
  }

  const video = data.videos[choice - 1];
  
  global.teamnix.replies.delete(replyMsg.message_id);

  const loadingMsg = await bot.sendMessage(chatId, 
    `⏳ Téléchargement de "${video.title}"...\n⏱️ Durée: ${formatDuration(video.seconds)}`,
    { reply_to_message_id: msg.message_id }
  );

  try {
    const apiConfig = await axios.get(
      "https://raw.githubusercontent.com/arychauhann/APIs/refs/heads/main/api.json"
    );

    const baseApi = apiConfig.data?.ary;
    if (!baseApi) throw new Error("API non trouvée");

    const apiUrl = `${baseApi}/api/ytmp3?url=${encodeURIComponent(video.url)}&format=mp3`;
    const res = await axios.get(apiUrl, { timeout: 20000 });
    const data = res.data;

    if (!data?.success || !data?.directLink) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      return bot.sendMessage(chatId, 
        "❌ Échec de récupération du lien de téléchargement.",
        { reply_to_message_id: msg.message_id }
      );
    }

    const filename = `${data.videoId || Date.now()}.mp3`;
    const filepath = path.join(CACHE_DIR, filename);

    const dl = await axios.get(data.directLink, {
      responseType: "stream",
      timeout: 0,
    });

    const writer = fs.createWriteStream(filepath);
    dl.data.pipe(writer);

    writer.on("finish", async () => {
      await bot.deleteMessage(chatId, loadingMsg.message_id);

      const userName = msg.from.first_name || msg.from.username || "Utilisateur";
      
      await bot.sendAudio(chatId, filepath, {
        caption: formatSongInfo(data, video, userName),
        title: video.title,
        performer: video.author.name,
        duration: video.seconds,
        reply_to_message_id: msg.message_id
      });

      try {
        fs.unlinkSync(filepath);
      } catch (e) {}
    });

    writer.on("error", async () => {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      bot.sendMessage(chatId, 
        "❌ Erreur lors du téléchargement de l'audio.",
        { reply_to_message_id: msg.message_id }
      );
    });

  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    console.error("Erreur téléchargement:", error);
    return bot.sendMessage(chatId, 
      "❌ Erreur lors du téléchargement. Veuillez réessayer.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

module.exports = { onStart, onReply, nix };
