const axios = require("axios");
const path = require("path");
const fs = require("fs");

const nix = {
  name: "pinterest",
  version: "0.0.1",
  aliases: ["pin"],
  description: "Search Pinterest for images and return specified number of results.",
  author: "ArYAN",
  cooldown: 20,
  role: 0,
  prefix: true,
  category: "media",
  guide: "Use: {pn} <search query> - <number of images>\nExample: {pn} cat - 10",
};

async function onStart({ bot, message, msg, chatId, args }) {
  try {
    const input = args.join(" ");
    
    if (!input.includes("-")) {
      return message.reply(`❌ Please use the correct format:\n\n${nix.guide.replace("{pn}", nix.name)}`);
    }

    const parts = input.split("-");
    const query = parts[0].trim();
    let count = parseInt(parts[1]?.trim()) || 6;
    
    if (count > 20) count = 20;

    const apiUrl = `http://65.109.80.126:20409/aryan/pinterest?search=${encodeURIComponent(query)}&count=${count}`;
    const res = await axios.get(apiUrl);
    const data = res.data?.data || [];

    if (data.length === 0) {
      return message.reply(`❌ No images found for "${query}". Try a different search.`);
    }

    const tempDir = path.join(__dirname, "cache", "pinterest_downloads");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const imgPaths = [];
    
    for (let i = 0; i < Math.min(count, data.length); i++) {
      try {
        const imgPath = path.join(tempDir, `${chatId}_${i + 1}.jpg`);
        const imgResponse = await axios.get(data[i], {
          responseType: "stream",
        });
        
        const writer = fs.createWriteStream(imgPath);
        imgResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        imgPaths.push(imgPath);
      } catch (err) {}
    }

    if (imgPaths.length === 0) {
      return message.reply("❌ Failed to download any images. Try again later.");
    }
    
    const bodyMessage =
      `✅ Here are ${imgPaths.length} images from Pinterest\n` +
      `🔍 Query: ${query}\n` +
      `🦈 Total Images Count: ${imgPaths.length}`;

    const media = imgPaths.map(p => ({
        type: 'photo',
        media: fs.createReadStream(p)
    }));
    
    await bot.sendMediaGroup(chatId, media, {
        reply_to_message_id: msg.message_id
    });

    await bot.sendMessage(chatId, bodyMessage, {
        reply_to_message_id: msg.message_id
    });
    
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error("Pinterest command error:", error.message);
    return message.reply(`⚠️ An error occurred: ${error.message}`);
  }
}

module.exports = {
  nix,
  onStart,
};
