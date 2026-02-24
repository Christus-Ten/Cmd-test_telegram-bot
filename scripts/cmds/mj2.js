const axios = require("axios");
const fs = require("fs");
const path = require("path");

const nix = {
  name: "midjourney2",
  version: "0.0.9",
  aliases: ["mj2"],
  description: "Génère une image via Midjourney (API externe)",
  author: "Christus",
  prefix: true,
  category: "ai",
  role: 0,
  cooldown: 5,
  guide: "{p}midjourney <prompt>"
};

async function onStart({ bot, message, msg, chatId, args }) {
  const prompt = args.join(" ");
  if (!prompt) {
    return bot.sendMessage(chatId, "⚠️ Veuillez fournir un prompt.", { reply_to_message_id: msg.message_id });
  }

  const cacheDir = path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  try {
    // Appel API
    const apiUrl = `https://azadx69x-all-apis-top.vercel.app/api/mj?prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(apiUrl);
    const result = response.data;

    if (!result.success || !result.data?.images?.length) {
      throw new Error("L'API n'a retourné aucune image.");
    }

    // Télécharger les images
    const imagePaths = [];
    for (let i = 0; i < result.data.images.length; i++) {
      const imageUrl = result.data.images[i];
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imgPath = path.join(cacheDir, `mj_${Date.now()}_${i}.png`);
      fs.writeFileSync(imgPath, imageResponse.data);
      imagePaths.push(imgPath);
    }

    // Préparer les médias pour l'envoi
    const mediaArray = imagePaths.map((filePath, index) => ({
      type: "photo",
      media: fs.createReadStream(filePath),
      caption: index === 0 ? `🎨 𝗠𝗶𝗱𝗷𝗼𝘂𝗿𝗻𝗲𝘆\n━━━━━━━━━━━━\n📝 𝗣𝗿𝗼𝗺𝗽𝘁 :\n${prompt}` : undefined
    }));

    // Envoyer le groupe de photos
    await bot.sendMediaGroup(chatId, mediaArray, { reply_to_message_id: msg.message_id });

    // Nettoyer les fichiers temporaires
    imagePaths.forEach(p => fs.unlinkSync(p));

  } catch (err) {
    console.error("Midjourney error:", err);
    const errorMsg = err.response?.data?.error || err.message || "⚠️ Erreur lors de la génération de l'image.";
    bot.sendMessage(chatId, errorMsg, { reply_to_message_id: msg.message_id });
  }
}

// onReply n'est pas utilisé mais doit être présent pour respecter la structure Nix
async function onReply() {}

module.exports = { onStart, onReply, nix };
