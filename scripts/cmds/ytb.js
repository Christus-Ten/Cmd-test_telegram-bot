const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');

const nix = {
  name: "ytb",
  version: "1.1.1",
  aliases: ["youtube", "yt"],
  description: "Rechercher et télécharger des vidéos/audio YouTube",
  author: "Christus",
  prefix: true,
  category: "media",
  role: 0,
  cooldown: 5,
  guide: "{p}ytb -v <recherche|url>\n{p}ytb -a <recherche|url>\n{p}ytb -u <url> -v|-a"
};

const CACHE = path.join(__dirname, "cache");
if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);

async function streamFromURL(url) {
  const res = await axios({ url, responseType: "stream" });
  return res.data;
}

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({ url, responseType: "stream" });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function downloadMedia(videoUrl, format, message, bot, chatId, replyToMsg) {
  const apiUrl = `https://downvid.onrender.com/api/v1/download?url=${encodeURIComponent(videoUrl)}&format=${format}`;
  const { data } = await axios.get(apiUrl);
  if (data.status !== "success" || !data.downloadUrl) {
    throw new Error("Échec de l'API de téléchargement");
  }

  const ext = format === "mp4" ? "mp4" : "mp3";
  const fileName = `yt_${Date.now()}.${ext}`;
  const filePath = path.join(CACHE, fileName);

  await downloadFile(data.downloadUrl, filePath);

  if (format === "mp4") {
    await bot.sendVideo(chatId, filePath, {
      caption: "🎥 Voici votre vidéo",
      reply_to_message_id: replyToMsg.message_id
    });
  } else {
    await bot.sendAudio(chatId, filePath, {
      caption: "🎧 Voici votre audio",
      reply_to_message_id: replyToMsg.message_id
    });
  }

  fs.unlinkSync(filePath);
}

function buildList(videos, mode) {
  const list = videos.map((v, i) => {
    return `📍 ${i + 1}. ${v.title}\n   ⏱️ ${v.timestamp}`;
  }).join("\n\n");

  return `📺 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿\n━━━━━━━━━━━━━━\n\n` +
    `🎯 𝗦é𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝘇 𝘂𝗻 𝗺é𝗱𝗶𝗮\n\n${list}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `✍️ Répondez avec un nombre (1-5)\n` +
    `⏰ 30 secondes pour répondre`;
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const userId = msg.from.id;
  const mode = args[0]?.toLowerCase();

  if (!mode) return usages();

  if (mode === "-u") {
    const url = args[1];
    const formatFlag = args[2] || "-v";
    if (!url) return usages();

    const format = formatFlag === "-a" ? "mp3" : "mp4";

    const loadingMsg = await bot.sendMessage(chatId,
      "⏳ Téléchargement en cours...",
      { reply_to_message_id: msg.message_id }
    );

    try {
      await downloadMedia(url, format, message, bot, chatId, msg);
      await bot.deleteMessage(chatId, loadingMsg.message_id);
    } catch (error) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      console.error("Erreur téléchargement URL:", error);
      return bot.sendMessage(chatId,
        "❌ Échec du téléchargement. Vérifiez l'URL ou réessayez plus tard.",
        { reply_to_message_id: msg.message_id }
      );
    }
    return;
  }

  if (!["-v", "-a"].includes(mode)) {
    return usages();
  }

  const query = args.slice(1).join(" ");
  if (!query) return usages();

  const searchMsg = await bot.sendMessage(chatId,
    "🔍 Recherche en cours...",
    { reply_to_message_id: msg.message_id }
  );

  try {
    const res = await yts(query);
    const videos = res.videos.slice(0, 5);

    if (videos.length === 0) {
      await bot.deleteMessage(chatId, searchMsg.message_id);
      return bot.sendMessage(chatId,
        "❌ Aucun résultat trouvé.",
        { reply_to_message_id: msg.message_id }
      );
    }

    const thumbs = [];
    for (const video of videos) {
      try {
        const thumbStream = await streamFromURL(video.thumbnail);
        const thumbPath = path.join(CACHE, `thumb_${Date.now()}_${thumbs.length}.jpg`);
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

    const mediaGroup = thumbs.map(thumb => ({
      type: 'photo',
      media: thumb
    }));

    const sentMedia = await bot.sendMediaGroup(chatId, mediaGroup, {
      reply_to_message_id: msg.message_id
    });
    const lastMsgId = Array.isArray(sentMedia) ? sentMedia[sentMedia.length - 1].message_id : sentMedia.message_id;

    const listMsg = await bot.sendMessage(chatId,
      buildList(videos, mode),
      { reply_to_message_id: msg.message_id }
    );

    thumbs.forEach(thumb => {
      try { fs.unlinkSync(thumb); } catch (e) {}
    });

    global.teamnix.replies.set(listMsg.message_id, {
      nix,
      type: "ytb_reply",
      authorId: userId,
      results: videos,
      mode: mode,
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
    console.error("Erreur recherche YouTube:", error);
    return bot.sendMessage(chatId,
      "❌ Erreur lors de la recherche.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "ytb_reply" || userId !== data.authorId) return;

  const choice = parseInt(msg.text);
  if (isNaN(choice) || choice < 1 || choice > data.results.length) {
    return bot.sendMessage(chatId,
      "❌ Sélection invalide. Choisissez un nombre entre 1 et 5.",
      { reply_to_message_id: msg.message_id }
    );
  }

  const selected = data.results[choice - 1];
  const format = data.mode === "-a" ? "mp3" : "mp4";

  global.teamnix.replies.delete(replyMsg.message_id);

  const loadingMsg = await bot.sendMessage(chatId,
    `⏳ Téléchargement de "${selected.title}"...\n⏱️ Durée: ${selected.timestamp}`,
    { reply_to_message_id: msg.message_id }
  );

  try {
    await downloadMedia(selected.url, format, message, bot, chatId, msg);
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
