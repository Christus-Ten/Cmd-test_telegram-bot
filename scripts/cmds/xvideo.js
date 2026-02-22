const axios = require("axios");
const fs = require("fs");
const path = require("path");

if (!global.teamnix) global.teamnix = {};
if (!global.teamnix.replies) global.teamnix.replies = new Map();

const nix = {
  name: "xv",
  aliases: ["xvideos"],
  version: "3.0",
  author: "Christus",
  cooldown: 5,
  role: 0,
  category: "media",
  guide: "{p}xv <recherche>"
};

async function searchVideos(query) {
  const res = await axios.get(
    `https://azadx69x-all-apis-top.vercel.app/api/xvideossearch?query=${encodeURIComponent(query)}`
  );
  return res.data?.data?.results?.slice(0, 6) || [];
}

async function downloadVideo(pageUrl) {
  const res = await axios.get(
    `https://azadx69x-all-apis-top.vercel.app/api/xvideosdl?url=${encodeURIComponent(pageUrl)}`
  );

  return (
    res.data?.data?.download ||
    res.data?.data?.url ||
    res.data?.url
  );
}

async function onStart({ bot, msg, chatId, args, usages }) {
  const query = args.join(" ");
  if (!query) return usages();

  const userId = msg.from.id;

  const loading = await bot.sendMessage(chatId, "🔍 Recherche...");

  try {
    const results = await searchVideos(query);

    await bot.deleteMessage(chatId, loading.message_id);

    if (!results.length) {
      return bot.sendMessage(chatId, "❌ Aucun résultat.");
    }

    const list = results
      .map((v, i) => `${i + 1}. ${v.title}`)
      .join("\n");

    const listMsg = await bot.sendMessage(
      chatId,
      `🔞 XVideos\n\n${list}\n\nRépond avec un numéro`
    );

    global.teamnix.replies.set(listMsg.message_id, {
      type: "xv_reply",
      authorId: userId,
      results
    });

  } catch (e) {
    bot.sendMessage(chatId, "❌ Erreur API.");
  }
}

async function onReply({ bot, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "xv_reply") return;
  if (userId !== data.authorId) return;

  const index = parseInt(msg.text) - 1;
  if (index < 0 || index >= data.results.length) return;

  const video = data.results[index];
  global.teamnix.replies.delete(replyMsg.message_id);

  let filePath;

  try {
    const loading = await bot.sendMessage(chatId, "📥 Téléchargement...");

    const videoUrl = await downloadVideo(video.link);
    if (!videoUrl) throw new Error("No video");

    const res = await axios.get(videoUrl, {
      responseType: "arraybuffer"
    });

    filePath = path.join(__dirname, `xv_${Date.now()}.mp4`);
    fs.writeFileSync(filePath, Buffer.from(res.data));

    await bot.sendVideo(chatId, filePath, {
      caption: video.title,
      reply_to_message_id: msg.message_id
    });

    await bot.deleteMessage(chatId, loading.message_id);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Impossible d'envoyer la vidéo.");
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = { onStart, onReply, nix };
