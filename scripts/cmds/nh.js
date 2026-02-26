const axios = require('axios');

const nix = {
  name: "nhentai",
  version: "1.0.0",
  aliases: ["nh", "n-hentai"],
  description: "Search nhentai doujins",
  author: "Christus",
  prefix: true,
  category: "Media",
  role: 2,
  cooldown: 5,
  guide: "{p}nhentai <search term>"
};

async function fetchNhentai(query) {
  const url = `https://arychauhann.onrender.com/api/nhentai?query=${encodeURIComponent(query)}`;
  const res = await axios.get(url);
  return res.data;
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const query = args.join(" ").trim();
  if (!query) {
    return bot.sendMessage(chatId, "Please provide a search query!\nExample: /nhentai 1", 
      { reply_to_message_id: msg.message_id });
  }

  try {
    const data = await fetchNhentai(query);
    if (!data || Object.keys(data).length === 0) {
      return bot.sendMessage(chatId, "No nhentai results found for this query!",
        { reply_to_message_id: msg.message_id });
    }

    const results = Object.values(data).filter(v => v.title).slice(0, 5);
    if (!results.length) {
      return bot.sendMessage(chatId, "No nhentai results found for this query!",
        { reply_to_message_id: msg.message_id });
    }

    let messageText = `Christus • NHentai Results 🌌\n`;
    results.forEach((item, i) => {
      messageText += `\n${i + 1}. ${item.title}`;
    });

    const sentMsg = await bot.sendMessage(chatId, messageText,
      { reply_to_message_id: msg.message_id });

    // Store results for reply
    if (!global.teamnix) global.teamnix = {};
    if (!global.teamnix.replies) global.teamnix.replies = new Map();
    global.teamnix.replies.set(sentMsg.message_id, {
      type: "nhentai",
      authorId: msg.from.id,
      results: results
    });

    // Auto-clean after 60 seconds
    setTimeout(() => {
      if (global.teamnix.replies.has(sentMsg.message_id)) {
        global.teamnix.replies.delete(sentMsg.message_id);
      }
    }, 60000);

  } catch (err) {
    bot.sendMessage(chatId, `Error fetching nhentai data: ${err.message}`,
      { reply_to_message_id: msg.message_id });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "nhentai" || userId !== data.authorId) return;

  const selection = parseInt(msg.text.trim());
  if (isNaN(selection) || selection < 1 || selection > data.results.length) {
    return bot.sendMessage(chatId, "Please select a valid number!",
      { reply_to_message_id: msg.message_id });
  }

  const item = data.results[selection - 1];
  const imageUrl = item.imgSrc.startsWith("//") ? `https:${item.imgSrc}` : item.imgSrc;

  await bot.sendPhoto(chatId, imageUrl, {
    caption: `📚 ${item.title}\n🔗 Link: ${item.link}`,
    reply_to_message_id: msg.message_id
  });

  // Clean up stored data
  global.teamnix.replies.delete(replyMsg.message_id);
}

module.exports = { onStart, onReply, nix };
