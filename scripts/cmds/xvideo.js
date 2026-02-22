const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

if (!global.teamnix) global.teamnix = {};
if (!global.teamnix.replies) global.teamnix.replies = new Map();

const nix = {
  name: "xvideos",
  aliases: ["xv", "xvid"],
  version: "1.0.0",
  author: "Christus",
  description: "Recherche vidéos via API XVideos",
  prefix: true,
  category: "media",
  role: 0,
  cooldown: 5,
  guide: "{p}xvideos <recherche>"
};

function buildList(videos, userName) {
  const time = moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm");

  const list = videos
    .map((v, i) => {
      return `📍 ${i + 1}. ${v.title || "Sans titre"}\n⏱️ ${v.duration || "?"}`;
    })
    .join("\n\n");

  return (
    `🔞 𝗫𝗩𝗶𝗱𝗲𝗼𝘀 𝗦𝗲𝗮𝗿𝗰𝗵\n━━━━━━━━━━━━━━\n\n` +
    `👤 ${userName}\n` +
    `📅 ${time}\n\n` +
    `🎯 𝗦é𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲𝘇 𝘂𝗻𝗲 𝘃𝗶𝗱é𝗼\n\n${list}\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `✍️ Répondez avec un nombre (1-6)\n` +
    `⏰ 30 secondes`
  );
}

async function downloadThumb(url, index) {
  try {
    const res = await axios({ url, responseType: "stream" });
    const filePath = path.join(__dirname, `thumb_${Date.now()}_${index}.jpg`);
    const writer = fs.createWriteStream(filePath);

    res.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return filePath;
  } catch {
    return null;
  }
}

async function onStart({ bot, msg, chatId, args, usages }) {
  const query = args.join(" ");
  const userId = msg.from.id;
  const userName = msg.from.first_name || "Utilisateur";

  if (!query) return usages();

  const searchMsg = await bot.sendMessage(
    chatId,
    "🔍 Recherche en cours...",
    { reply_to_message_id: msg.message_id }
  );

  try {
    const { data } = await axios.get(
      `https://azadx69x-all-apis-top.vercel.app/api/xvideossearch?query=${encodeURIComponent(query)}`
    );

    const results = data?.data?.results?.slice(0, 6) || [];

    if (!results.length) {
      await bot.deleteMessage(chatId, searchMsg.message_id);
      return bot.sendMessage(chatId, "❌ Aucun résultat.", {
        reply_to_message_id: msg.message_id
      });
    }

    const thumbs = [];

    for (let i = 0; i < results.length; i++) {
      if (!results[i].thumbnail) continue;
      const file = await downloadThumb(results[i].thumbnail, i);
      if (file) thumbs.push(file);
    }

    await bot.deleteMessage(chatId, searchMsg.message_id);

    if (thumbs.length) {
      const mediaGroup = thumbs.map(file => ({
        type: "photo",
        media: file
      }));

      await bot.sendMediaGroup(chatId, mediaGroup);
    }

    const listMsg = await bot.sendMessage(
      chatId,
      buildList(results, userName),
      { reply_to_message_id: msg.message_id }
    );

    thumbs.forEach(f => {
      try { fs.unlinkSync(f); } catch {}
    });

    global.teamnix.replies.set(listMsg.message_id, {
      nix,
      type: "xvideos_reply",
      authorId: userId,
      results
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(listMsg.message_id)) {
        global.teamnix.replies.delete(listMsg.message_id);
        bot.sendMessage(chatId, "⏰ Temps écoulé.", {
          reply_to_message_id: listMsg.message_id
        });
      }
    }, 30000);

  } catch (err) {
    await bot.deleteMessage(chatId, searchMsg.message_id);
    console.error(err);
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

  bot.sendMessage(
    chatId,
    `✅ 𝗩𝗶𝗱é𝗼 𝘀é𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻é𝗲\n\n🎬 ${selected.title}\n⏱️ ${selected.duration}\n🔗 ${selected.link}`,
    { reply_to_message_id: msg.message_id }
  );
}

module.exports = { onStart, onReply, nix };
