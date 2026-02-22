const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

if (!global.teamnix) global.teamnix = {};
if (!global.teamnix.replies) global.teamnix.replies = new Map();

const nix = {
  name: "xvideos",
  aliases: ["xv"],
  version: "2.0",
  author: "Christus",
  cooldown: 5,
  role: 0,
  category: "media",
  guide: "{p}xvideos <recherche>"
};

function buildList(videos, userName) {
  const time = moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm");

  const list = videos
    .map((v, i) => `📍 ${i + 1}. ${v.title || "Sans titre"}\n⏱️ ${v.duration || "?"}`)
    .join("\n\n");

  return `🔞 XVideos Search
━━━━━━━━━━━━━━

👤 ${userName}
📅 ${time}

${list}

━━━━━━━━━━━━━━
✍️ Répondez avec un nombre (1-6)`;
}

async function onStart({ bot, msg, chatId, args, usages }) {
  const query = args.join(" ");
  const userId = msg.from.id;
  const userName = msg.from.first_name || "Utilisateur";

  if (!query) return usages();

  const loading = await bot.sendMessage(chatId, "🔍 Recherche...", {
    reply_to_message_id: msg.message_id
  });

  try {
    const res = await axios.get(
      `https://azadx69x-all-apis-top.vercel.app/api/xvideossearch?query=${encodeURIComponent(query)}`
    );

    const results = res.data?.data?.results?.slice(0, 6) || [];

    await bot.deleteMessage(chatId, loading.message_id);

    if (!results.length) {
      return bot.sendMessage(chatId, "❌ Aucun résultat.", {
        reply_to_message_id: msg.message_id
      });
    }

    const listMsg = await bot.sendMessage(
      chatId,
      buildList(results, userName),
      { reply_to_message_id: msg.message_id }
    );

    global.teamnix.replies.set(listMsg.message_id, {
      nix,
      type: "xvideos_reply",
      authorId: userId,
      results
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(listMsg.message_id)) {
        global.teamnix.replies.delete(listMsg.message_id);
      }
    }, 30000);

  } catch (e) {
    await bot.deleteMessage(chatId, loading.message_id);
    bot.sendMessage(chatId, "❌ Erreur API.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "xvideos_reply") return;
  if (userId !== data.authorId) return;

  const choice = parseInt(msg.text);
  if (isNaN(choice) || choice < 1 || choice > data.results.length) {
    return bot.sendMessage(chatId, "❌ Choix invalide.", {
      reply_to_message_id: msg.message_id
    });
  }

  const selected = data.results[choice - 1];
  global.teamnix.replies.delete(replyMsg.message_id);

  let processingId;
  let filePath;

  try {
    const loading = await bot.sendMessage(
      chatId,
      "📥 Téléchargement vidéo...",
      { reply_to_message_id: msg.message_id }
    );
    processingId = loading.message_id;

    // Ici on suppose que le lien est direct vidéo ou que Telegram peut le lire
    const videoUrl =
      selected.video ||
      selected.download ||
      selected.link;

    const response = await axios.get(videoUrl, {
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(response.data, "binary");

    filePath = path.join(__dirname, `xv_${Date.now()}.mp4`);
    fs.writeFileSync(filePath, buffer);

    await bot.sendVideo(chatId, filePath, {
      caption: `🎬 ${selected.title}\n⏱️ ${selected.duration}`,
      reply_to_message_id: msg.message_id,
      fileName: "xvideo.mp4"
    });

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Impossible d'envoyer la vidéo.", {
      reply_to_message_id: msg.message_id
    });
  } finally {
    if (processingId) bot.deleteMessage(chatId, processingId);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = { onStart, onReply, nix };
