const axios = require('axios');
const fs = require('fs');
const path = require('path');

const nix = {
  name: "sing",
  version: "1.0.0",
  aliases: ["song", "music", "mp3"],
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

async function streamFromURL(url) {
  const res = await axios({ url, responseType: "stream", timeout: 10000 });
  return res.data;
}

function formatSongList(query, videos) {
  const list = videos
    .map((v, i) => {
      return `${i + 1}. ${v.title}\n   👤 ${v.channel} | ⏱ ${v.duration}`;
    })
    .join("\n\n");

  return `🎵 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗠𝘂𝘀𝗶𝗰\n━━━━━━━━━━━━━━\n\n` +
    `🔍 𝗥𝗲𝗰𝗵𝗲𝗿𝗰𝗵𝗲: "${query}"\n\n` +
    `📋 𝗥é𝘀𝘂𝗹𝘁𝗮𝘁𝘀\n\n${list}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `✍️ Répondez avec un nombre (1-6) pour télécharger\n` +
    `⏰ 30 secondes pour répondre`;
}

async function onStart({ bot, msg, chatId, args }) {
  const query = args.join(" ").trim();

  if (!query) {
    return bot.sendMessage(chatId, 
      "❌ Veuillez fournir le nom d'une chanson !\nExemple: /sing shape of you",
      { reply_to_message_id: msg.message_id }
    );
  }

  const searchMsg = await bot.sendMessage(chatId, 
    "🔍 Recherche de musique en cours...",
    { reply_to_message_id: msg.message_id }
  );

  try {
    const apiURL = `https://xsaim8x-xxx-api.onrender.com/api/youtube?query=${encodeURIComponent(query)}`;
    const res = await axios.get(apiURL, { timeout: 15000 });

    if (!res.data || !res.data.data || res.data.data.length === 0) {
      await bot.deleteMessage(chatId, searchMsg.message_id);
      return bot.sendMessage(chatId, 
        "❌ Aucune chanson trouvée !",
        { reply_to_message_id: msg.message_id }
      );
    }

    const videos = res.data.data.slice(0, 6);

    const attachments = [];
    for (const video of videos) {
      try {
        if (video.thumbnail) {
          const thumbStream = await streamFromURL(video.thumbnail);
          const thumbPath = path.join(CACHE_DIR, `thumb_${Date.now()}_${attachments.length}.jpg`);
          const writer = fs.createWriteStream(thumbPath);
          thumbStream.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });
          
          attachments.push(thumbPath);
        }
      } catch (e) {
        console.error("Erreur miniature:", e);
      }
    }

    await bot.deleteMessage(chatId, searchMsg.message_id);

    if (attachments.length > 0) {
      const mediaGroup = attachments.map(thumb => ({
        type: 'photo',
        media: thumb
      }));

      await bot.sendMediaGroup(chatId, mediaGroup, {
        reply_to_message_id: msg.message_id
      });
    }

    const listMsg = await bot.sendMessage(chatId, 
      formatSongList(query, videos),
      { reply_to_message_id: msg.message_id }
    );

    attachments.forEach(thumb => {
      try { fs.unlinkSync(thumb); } catch (e) {}
    });

    global.teamnix.replies.set(listMsg.message_id, {
      nix,
      type: "sing_reply",
      authorId: msg.from.id,
      videos: videos
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
    console.error("Erreur recherche:", error);
    return bot.sendMessage(chatId, 
      `❌ Échec de la recherche: ${error.message}`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function onReply({ bot, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "sing_reply" || userId !== data.authorId) return;

  const choice = parseInt(msg.text);
  if (isNaN(choice) || choice < 1 || choice > data.videos.length) {
    return bot.sendMessage(chatId, 
      `❌ Choix invalide ! Tapez 1-${data.videos.length}`,
      { reply_to_message_id: msg.message_id }
    );
  }

  await bot.deleteMessage(chatId, replyMsg.message_id).catch(() => {});

  const selected = data.videos[choice - 1];

  const loadingMsg = await bot.sendMessage(chatId, 
    `⏳ Téléchargement de "${selected.title}"...\n⏱️ Durée: ${selected.duration}`,
    { reply_to_message_id: msg.message_id }
  );

  try {
    const downloadApi = `https://azadx69x-ytb-api.vercel.app/download?url=${encodeURIComponent(selected.url)}&type=mp3`;
    
    console.log("Téléchargement depuis:", downloadApi);

    const mp3Res = await axios({
      url: downloadApi,
      responseType: "stream",
      timeout: 120000
    });

    const fileName = `song_${Date.now()}.mp3`;
    const filePath = path.join(CACHE_DIR, fileName);
    
    const writer = fs.createWriteStream(filePath);
    mp3Res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const stats = fs.statSync(filePath);
    if (stats.size < 1000) {
      throw new Error("Fichier téléchargé trop petit");
    }

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    await bot.sendAudio(chatId, filePath, {
      caption: `✅ 𝗧é𝗹é𝗰𝗵𝗮𝗿𝗴𝗲𝗺𝗲𝗻𝘁 𝗿é𝘂𝘀𝘀𝗶 !\n🎵 ${selected.title}\n👤 ${selected.channel}`,
      title: selected.title,
      performer: selected.channel,
      duration: selected.duration.includes(':') ? 
        selected.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 
        parseInt(selected.duration),
      reply_to_message_id: msg.message_id
    });

    try { fs.unlinkSync(filePath); } catch (e) {}

  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    console.error("Erreur téléchargement:", error);
    return bot.sendMessage(chatId, 
      `❌ Échec du téléchargement !\n📝 ${error.message}\n💡 Essayez une autre chanson`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

module.exports = { nix, onStart, onReply };
