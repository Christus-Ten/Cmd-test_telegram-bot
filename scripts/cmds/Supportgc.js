const fs = require('fs');
const path = require('path');

const nix = {
  name: "supportgc",
  version: "1.1",
  aliases: ["supportgroup"],
  description: "Get the link to the official support group",
  author: "Christus",
  prefix: true,
  category: "Utility",
  role: 0,
  cooldown: 5,
  guide: "{p}supportgc"
};

const configPath = path.join(__dirname, '..', '..', 'config.json');

function loadConfig() {
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.error("Error loading config.json:", error);
    return {};
  }
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const config = loadConfig();
  const supportLink = config.supportGroupLink || "https://t.me/amispurgeur"; // fallback

  if (!supportLink) {
    return bot.sendMessage(chatId, 
      "❌ Support group link not configured. Please contact the bot administrator.",
      { reply_to_message_id: msg.message_id }
    );
  }

  try {
    await bot.sendMessage(chatId,
      "✅ Access Granted!\n\n" +
      "Click the link below to join our official Support Group:\n" +
      supportLink,
      { 
        reply_to_message_id: msg.message_id,
        parse_mode: 'Markdown' 
      }
    );
  } catch (error) {
    console.error("SupportGC error:", error);
    bot.sendMessage(chatId,
      "❌ Unable to provide the support group link at this moment.\nPlease try again later.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

module.exports = { onStart, nix };
