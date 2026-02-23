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
  version: "2.0",
  aliases: ["animeid", "otaku"],
  description: "Génère ta carte d'identité Otaku avec photo et infos personnalisées",
  author: "Christus",
  prefix: true,
  category: "anime",
  role: 0,
  cooldown: 10,
  guide: "{p}otakucard <Nom> | <Pseudo> | <Protagoniste> | <Anime> | <Type> | <Rang> | <Qualité> | <Faiblesse> | <Phrase>"
};

async function createOtakuCard({ name, pseudo, protagoniste, animePref, typeAnime, rang, qualite, faiblesse, phrase, avatarPath }) {
  const width = 800, height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fond dégradé
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0a0f1e');
  gradient.addColorStop(0.5, '#1a1f2e');
  gradient.addColorStop(1, '#2a2f3e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Bordures décoratives
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Titre
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 32px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CARTE D\'IDENTITE OTAKU', width / 2, 60);

  // Avatar (cercle)
  const avatar = await loadImage(avatarPath);
  ctx.save();
  ctx.beginPath();
  ctx.arc(120, 160, 70, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 90, 140, 140);
  ctx.restore();

  // Ligne de séparation verticale
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(220, 100);
  ctx.lineTo(220, height - 100);
  ctx.stroke();

  // Informations à droite
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  let y = 120;
  const lineHeight = 25;
  const x = 240;

  const fields = [
    { label: 'Nom:', value: name },
    { label: 'Pseudo Anime:', value: pseudo },
    { label: 'Protagoniste Préféré:', value: protagoniste },
    { label: 'Anime Préféré:', value: animePref },
    { label: 'Type d\'Anime:', value: typeAnime },
    { label: 'Rang:', value: rang },
    { label: 'Qualité phare:', value: qualite },
    { label: 'Faiblesse:', value: faiblesse },
    { label: 'Phrase:', value: phrase }
  ];

  fields.forEach(field => {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(field.label, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(field.value, x + 150, y);
    y += lineHeight;
  });

  // Signature
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'italic 18px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(name, width - 50, height - 50);

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
    const processingMsg = await bot.sendMessage(chatId, "⏳ Génération de ta carte Otaku...", {
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
      caption: `📛 Ta carte Otaku est prête, ${userName} !`,
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
