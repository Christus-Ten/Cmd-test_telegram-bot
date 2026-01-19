const axios = require("axios");
const moment = require("moment-timezone");

/* ================= CONFIG ================= */

const API_ENDPOINT = "https://monster-api-18ic.onrender.com/dark";

/* ================= NIX META ================= */

const nix = {
  name: "darkgpt",
  version: "1.0.0",
  aliases: ["dark"],
  description: "Chat with Dark AI (unfiltered responses)",
  author: "Christus",
  prefix: false,
  category: "ai",
  type: "anyone",
  cooldown: 5,
  guide: "{p}dark <your message>",
};

/* ================= COMMAND ================= */

async function onStart({ bot, message, chatId, args, event }) {
  const input = args.join(" ").trim();
  const userId = event?.senderID || chatId;

  if (!input) {
    return message.reply("🌑 Ask Dark a question...");
  }

  const timestamp = moment()
    .tz("Asia/Manila")
    .format("MMMM D, YYYY h:mm A");

  const waitMsg = await message.reply(
    `🌑 Dark is thinking...\n━━━━━━━━━━━━━━━\n📅 ${timestamp}`
  );

  try {
    // API expects uid, prompt, history
    const res = await axios.post(API_ENDPOINT, {
      uid: userId,
      prompt: input,
      history: [],
    });

    const reply = res.data?.reply || "✅ Dark has responded.";

    await bot.deleteMessage(chatId, waitMsg.message_id);

    await message.reply(`🌑 *Dark AI*\n━━━━━━━━━━━━━━━\n${reply}`, {
      parse_mode: "Markdown",
    });

  } catch (err) {
    console.error("Dark AI Error:", err);

    await bot.editMessageText(
      "❌ Dark is temporarily unavailable.",
      {
        chat_id: chatId,
        message_id: waitMsg.message_id,
      }
    );
  }
}

module.exports = { nix, onStart };
