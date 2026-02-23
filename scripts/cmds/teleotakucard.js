const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const fsPromises = fs.promises;
const axios = require('axios');
const path = require('path');

const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const nix = {
  name: "otakucard",
  version: "2.1",
  aliases: ["animeid", "otaku"],
  description: "Génère ta carte d'identité Otaku avec photo et infos personnalisées (version brillante)",
  author: "Christus",
  prefix: true,
  category: "anime",
  role: 0,
  cooldown: 10,
  guide: "{p}otakucard <Nom> | <Pseudo> | <Protagoniste> | <Anime> | <Type> | <Rang> | <Qualité> | <Faiblesse> | <Phrase>"
};

// Fonctions de dessin inspirées de la commande pair
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size / 4);
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, size / 4);
  ctx.bezierCurveTo(-size / 2, size / 2, 0, size, 0, size);
  ctx.bezierCurveTo(0, size, size / 2, size / 2, size / 2, size / 4);
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * size,
               Math.sin((18 + i * 72) / 180 * Math.PI) * size);
    ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * size / 2,
               Math.sin((54 + i * 72) / 180 * Math.PI) * size / 2);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

function drawFloatingElements(ctx, width, height, themeColor) {
  const elements = 50;
  for (let i = 0; i < elements; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 4 + Math.random() * 12;
    const alpha = 0.2 + Math.random() * 0.3;

    ctx.globalAlpha = alpha;
    if (i % 3 === 0) {
      drawHeart(ctx, x, y, size, themeColor);
    } else if (i % 3 === 1) {
      drawStar(ctx, x, y, size / 2);
    } else {
      ctx.fillStyle = "#ffaa00";
      ctx.shadowColor = "#ffaa00";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawEnhancedText(ctx, text, x, y, fontSize, color, align = 'center', style = 'bold') {
  ctx.font = `${style} ${fontSize}px "Arial", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillText(text, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

async function createOtakuCard({ name, pseudo, protagoniste, animePref, typeAnime, rang, qualite, faiblesse, phrase, avatarPath }) {
  const width = 900;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dégradé de fond plus dynamique (inspiré des thèmes pair)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a0b2e'); // violet foncé
  gradient.addColorStop(0.3, '#2d1b3a');
  gradient.addColorStop(0.6, '#4a2b5c');
  gradient.addColorStop(1, '#6b3f7a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Éléments flottants (étincelles, cœurs)
  drawFloatingElements(ctx, width, height, '#ffaa00');

  // Bordure décorative lumineuse
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 20;
  drawRoundedRect(ctx, 15, 15, width - 30, height - 30, 30);
  ctx.stroke();

  // Deuxième bordure intérieure
  ctx.strokeStyle = '#ffdd44';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  drawRoundedRect(ctx, 25, 25, width - 50, height - 50, 25);
  ctx.stroke();

  // Titre avec effet brillant
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CARTE D\'IDENTITE OTAKU', width / 2, 70);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Petit cœur décoratif sous le titre
  drawHeart(ctx, width / 2 - 60, 110, 25, '#ffaa00');
  drawHeart(ctx, width / 2 + 60, 110, 25, '#ffaa00');

  // Avatar avec cadre lumineux
  const avatar = await loadImage(avatarPath);
  const avatarX = 120;
  const avatarY = 150;
  const avatarSize = 150;

  // Cercles concentriques autour de l'avatar
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 25;
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#ffdd44';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // Ligne décorative verticale avec motifs
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ffaa00';
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.setLineDash([10, 10]);
  ctx.moveTo(280, 140);
  ctx.lineTo(280, height - 100);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ajouter des petits cœurs le long de la ligne
  for (let y = 160; y < height - 120; y += 50) {
    drawHeart(ctx, 280, y, 10, '#ffaa00');
  }

  // Informations à droite
  const startX = 320;
  let yPos = 170;
  const lineHeight = 32;
  const labelColor = '#ffdd44';
  const valueColor = '#ffffff';

  const fields = [
    { label: 'Nom:', value: name },
    { label: 'Pseudo Anime:', value: pseudo },
    { label: 'Protagoniste:', value: protagoniste },
    { label: 'Anime Préféré:', value: animePref },
    { label: 'Type:', value: typeAnime },
    { label: 'Rang:', value: rang },
    { label: 'Qualité:', value: qualite },
    { label: 'Faiblesse:', value: faiblesse },
    { label: 'Phrase:', value: phrase }
  ];

  fields.forEach(field => {
    // Label avec ombre
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(field.label, startX, yPos);

    // Valeur
    ctx.fillStyle = valueColor;
    ctx.font = '18px Arial';
    ctx.fillText(field.value, startX + 130, yPos);
    yPos += lineHeight;
  });

  // Réinitialiser les ombres
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Signature en bas à droite avec effet
  ctx.font = 'italic 24px "Arial", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffdd44';
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 15;
  ctx.fillText(name, width - 50, height - 50);

  // Petit cœur final
  drawHeart(ctx, width - 80, height - 80, 20, '#ffaa00');

  // Sauvegarde
  const file = path.join(CACHE_DIR, `otaku_${Date.now()}.png`);
  const buffer = canvas.toBuffer();
  await fsPromises.writeFile(file, buffer);
  return file;
}

async function onStart({ bot, msg, chatId, args }) {
  const input = args.join(" ").split("|").map(s => s.trim());
  if (input.length < 9) {
    return bot.sendMessage(chatId, "📝 Format : Nom | Pseudo | Protagoniste | Anime | Type | Rang | Qualité | Faiblesse | Phrase\nExemple: MBOUAKDIEUDONNE | Santoro Gojo | Satoru Gojo | Jujutsu Kaisen | Jujutsu Kaisen | Maître Incontestable | Sixième Sens | Le Manque de Sommeil | L'impossible devient possible", {
      reply_to_message_id: msg.message_id
    });
  }

  const [name, pseudo, protagoniste, animePref, typeAnime, rang, qualite, faiblesse, phrase] = input;
  const userId = msg.from.id;
  const userName = msg.from.first_name || "Utilisateur";

  try {
    const processingMsg = await bot.sendMessage(chatId, "⏳ Génération de ta carte Otaku (version brillante)...", {
      reply_to_message_id: msg.message_id
    });

    let avatarPath = null;
    try {
      const photos = await bot.getUserProfilePhotos(userId, 0, 1);
      if (photos.total_count > 0) {
        const fileId = photos.photos[0][0].file_id;
        avatarPath = await bot.downloadFile(fileId, CACHE_DIR);
      } else {
        // Avatar par défaut avec initiales
        const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=512&background=ffaa00&color=fff`;
        const response = await axios.get(defaultAvatarUrl, { responseType: 'arraybuffer' });
        avatarPath = path.join(CACHE_DIR, `avatar_${userId}_${Date.now()}.png`);
        await fsPromises.writeFile(avatarPath, response.data);
      }
    } catch (err) {
      console.error("Avatar error:", err);
      avatarPath = path.join(CACHE_DIR, `avatar_${userId}_${Date.now()}.png`);
      const fallback = await axios.get('https://i.imgur.com/X2q6jYl.png', { responseType: 'arraybuffer' });
      await fsPromises.writeFile(avatarPath, fallback.data);
    }

    const cardPath = await createOtakuCard({
      name,
      pseudo,
      protagoniste,
      animePref,
      typeAnime,
      rang,
      qualite,
      faiblesse,
      phrase,
      avatarPath
    });

    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});

    await bot.sendPhoto(chatId, cardPath, {
      caption: `✨ Ta carte Otaku brillante est prête, ${userName} ! ✨`,
      reply_to_message_id: msg.message_id
    });

    await fsPromises.unlink(avatarPath).catch(() => {});
    await fsPromises.unlink(cardPath).catch(() => {});

  } catch (error) {
    console.error("OtakuCard error:", error);
    bot.sendMessage(chatId, "❌ Une erreur est survenue lors de la génération de ta carte.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Not used
}

module.exports = { onStart, onReply, nix };