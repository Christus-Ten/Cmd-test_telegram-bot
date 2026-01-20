const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const stream = require("stream");
const { promisify } = require("util");

const pipeline = promisify(stream.pipeline);

const nix = {
  name: "nijiv5",
  aliases: ["niji"],
  version: "2.1.0",
  author: "Christus",
  cooldown: 20,
  role: 2,
  prefix: true,
  category: "AI",
  description: "Generate Niji v5 anime-style images",
  guide: "{p}nijiv5 <prompt> [--ar <ratio>] [--1]",
};

async function onStart({ bot, message, msg, chatId, args }) {
  if (!args.length) return message.reply("❌ Please provide a prompt.");

  const prompt = args.join(" ").trim();
  const processingMsg = await bot.sendMessage(chatId, "🎨 Generating image...", { reply_to_message_id: msg.message_id });

  const session_hash = Math.random().toString(36).substring(2, 13);
  const payload = { data: [prompt, "", Math.floor(Math.random() * 1e9)], fn_index: 5, session_hash };

  try {
    await axios.post("https://asahina2k-animagine-xl-3-1.hf.space/queue/join", payload, {
      headers: { "User-Agent": "Mozilla/5.0", "Content-Type": "application/json" },
    });

    let imageURL = null;
    const maxAttempts = 15;

    // Poll HF Space until the image is ready
    for (let i = 0; i < maxAttempts; i++) {
      const res = await axios.get("https://asahina2k-animagine-xl-3-1.hf.space/queue/data", {
        headers: { "User-Agent": "Mozilla/5.0" },
        params: { session_hash },
        timeout: 30000,
      });

      const lines = res.data.split("\n\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (json.msg === "process_completed" && json.success) {
            imageURL = json.output?.data?.[0]?.[0]?.image?.url || null;
            break;
          }
        } catch {}
      }

      if (imageURL) break;
      await new Promise(r => setTimeout(r, 2000)); // wait 2s before next poll
    }

    if (!imageURL) {
      await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
      return message.reply("❌ Failed to generate image. HF API did not return a valid image.", { reply_to_message_id: msg.message_id });
    }

    const imgRes = await axios.get(imageURL, { responseType: "stream" });
    const cacheDir = path.join(__dirname, "tmp");
    await fs.ensureDir(cacheDir);
    const imgPath = path.join(cacheDir, `${session_hash}.png`);
    await pipeline(imgRes.data, fs.createWriteStream(imgPath));

    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
    await bot.sendPhoto(chatId, fs.createReadStream(imgPath), {
      caption: `✅ Image generated!`,
      reply_to_message_id: msg.message_id,
    });

    await fs.remove(imgPath);
  } catch (err) {
    console.error("NIJIV5 ERROR:", err);
    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
    message.reply("❌ Failed to generate image. Try again later.", { reply_to_message_id: msg.message_id });
  }
}

module.exports = { nix, onStart };
