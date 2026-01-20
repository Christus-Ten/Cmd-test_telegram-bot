const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const nix = {
  name: "pair",
  aliases: ["love", "match"],
  author: "Christus",
  version: "1.2",
  role: 0,
  category: "amour",
  description: "Trouve un partenaire au hasard parmi les membres du groupe.",
  cooldown: 15,
  guide: "{p}pair"
};

async function onStart({ bot, msg, chatId }) {
  try {
    const senderID = msg.from.id;
    const senderName = msg.from.first_name;

    // 1. Récupération d'un membre au hasard
    // Note: Sur Telegram, on ne peut pas lister tous les membres d'un coup.
    // Mais on peut utiliser les membres qui ont déjà interagi avec le bot ou 
    // les administrateurs du groupe pour garantir un match.
    
    const chatAdmins = await bot.getChatAdministrators(chatId);
    // On filtre pour ne pas se choisir soi-même
    const candidates = chatAdmins.filter(admin => admin.user.id !== senderID && !admin.user.is_bot);
    
    let target;
    if (candidates.length > 0) {
      // On prend un admin au hasard
      const randomAdmin = candidates[Math.floor(Math.random() * candidates.length)];
      target = {
        id: randomAdmin.user.id,
        name: randomAdmin.user.first_name
      };
    } else {
      // Si seul l'utilisateur est admin, on ne peut pas faire de match "admin"
      return bot.sendMessage(chatId, "❌ Pas assez de membres actifs trouvés pour créer un couple.");
    }

    // 2. Préparation du Canvas (800x400)
    const width = 800, height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond romantique
    const background = await loadImage("https://files.catbox.moe/29jl5s.jpg");
    ctx.drawImage(background, 0, 0, width, height);

    // 3. Récupération des deux photos de profil
    const fetchAvatar = async (userId) => {
      try {
        const photos = await bot.getUserProfilePhotos(userId);
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          const fileLink = await bot.getFileLink(fileId);
          const res = await axios.get(fileLink, { responseType: "arraybuffer" });
          return await loadImage(Buffer.from(res.data));
        }
        throw new Error();
      } catch (e) {
        // Fallback si pas de photo
        const fallback = createCanvas(200, 200);
        const fctx = fallback.getContext("2d");
        fctx.fillStyle = "#ff4d4d";
        fctx.fillRect(0, 0, 200, 200);
        return fallback;
      }
    };

    const imgSender = await fetchAvatar(senderID);
    const imgTarget = await fetchAvatar(target.id);

    // Fonction cercle
    function drawCircle(ctx, img, x, y, size) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    }

    // Positionnement des avatars (selon ton template original)
    drawCircle(ctx, imgSender, 385, 40, 170);
    drawCircle(ctx, imgTarget, width - 213, 190, 170);

    const filePath = path.join(__dirname, `pair_${senderID}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

    // 4. Message final
    const lovePercent = Math.floor(Math.random() * 31) + 70; // Entre 70 et 100%
    const response = 
      `💞 MATCH AMOUREUX COMPLÉTÉ 💞\n\n` +
      `🎀 ${senderName} ✨️\n` +
      `🎀 ${target.name} ✨️\n\n` +
      `Le destin a écrit vos noms ensemble 🌹 Que votre lien dure pour toujours ✨️\n\n` +
      `💘 Compatibilité : ${lovePercent}% 💘`;

    await bot.sendPhoto(chatId, filePath, { caption: response });

    // Suppression du fichier temporaire
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Une erreur est survenue lors du matchmaking.");
  }
}

module.exports = { nix, onStart };
