const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const tmpDir = path.join(os.tmpdir(), 'telegram_stickers');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// Gestion des packs de stickers
const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const packsFile = path.join(dbDir, 'sticker_packs.json');

function loadPacks() {
  if (!fs.existsSync(packsFile)) {
    const defaultData = { currentPack: 1, count: 0, packs: [] };
    fs.writeFileSync(packsFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(packsFile, 'utf8'));
}

function savePacks(data) {
  fs.writeFileSync(packsFile, JSON.stringify(data, null, 2));
}

const nix = {
  name: 'sticker',
  version: '1.1.0',
  aliases: ['s', 'stk', 'autocollant'],
  description: 'Transforme une photo ou une vidéo en sticker et l’ajoute automatiquement à un pack (30 par pack)',
  author: 'Christus',
  prefix: true,
  category: 'media',
  role: 0,
  cooldown: 5,
  guide: '{p}sticker – en réponse à une image ou vidéo\n{p}s – alias\nExemple : /sticker (en reply d\'une photo)'
};

function cleanup(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.error('Erreur nettoyage fichier:', err);
  });
}

async function downloadTelegramFile(bot, fileId) {
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  const response = await axios({ url: fileUrl, method: 'GET', responseType: 'stream' });
  return response.data;
}

function getVideoDuration(inputPath) {
  return new Promise((resolve, reject) => {
    exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`, (error, stdout, stderr) => {
      if (error) return reject(error);
      const duration = parseFloat(stdout);
      if (isNaN(duration)) return reject(new Error('Impossible de lire la durée de la vidéo'));
      resolve(duration);
    });
  });
}

function convertImageToSticker(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -vcodec libwebp -lossless 1 -q:v 80 -preset default -loop 0 -an -vsync 0 "${outputPath}" -y`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur conversion image:', stderr);
        reject(error);
      } else resolve();
    });
  });
}

function convertVideoToSticker(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15" -vcodec libvpx-vp9 -crf 32 -b:v 0 -an -t 30 "${outputPath}" -y`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur conversion vidéo:', stderr);
        reject(error);
      } else resolve();
    });
  });
}

// Fonction pour ajouter le sticker à un pack Telegram
async function addToStickerPack(bot, filePath, isVideo, userId, userName) {
  try {
    // Récupérer le username du bot (nécessaire pour le nom du pack)
    const botInfo = await bot.getMe();
    const botUsername = botInfo.username; // ex: "Christus225_bot"
    if (!botUsername) throw new Error('Le bot n\'a pas de username');

    // Déterminer le type de sticker
    const isAnimated = isVideo; // vidéo => sticker animé
    const stickerType = isAnimated ? 'webm_sticker' : 'png_sticker';

    // Uploader le fichier pour obtenir un file_id
    const uploadResult = await bot.uploadStickerFile(userId, filePath, {
      png_sticker: !isAnimated,
      webm_sticker: isAnimated
    });
    const fileId = uploadResult.file_id;

    // Charger l'état des packs
    const packs = loadPacks();
    const currentPackIndex = packs.currentPack;
    const packName = `creator_${currentPackIndex}_by_${botUsername}`.toLowerCase(); // nom technique
    const packTitle = `Creator (@Christus225) ${currentPackIndex}`;

    // Fonction pour ajouter le sticker au pack
    async function addStickerToExistingPack() {
      await bot.addStickerToSet(userId, packName, fileId, {
        [stickerType]: fileId,
        emojis: '🤖' // emoji par défaut, on peut le rendre configurable plus tard
      });
    }

    // Vérifier si le pack existe déjà
    let packExists = false;
    try {
      // On tente de récupérer le pack (pas de méthode directe, on peut essayer d'ajouter et capturer l'erreur)
      // Une meilleure approche : on garde une liste des packs créés dans notre fichier
      packExists = packs.packs.includes(packName);
    } catch (e) {
      packExists = false;
    }

    if (packExists) {
      // Ajouter au pack existant
      await addStickerToExistingPack();
    } else {
      // Créer un nouveau pack avec ce premier sticker
      await bot.createNewStickerSet(userId, packName, packTitle, fileId, {
        [stickerType]: fileId,
        emojis: '🤖',
        contains_masks: false
      });
      // Enregistrer le pack dans notre liste
      packs.packs.push(packName);
    }

    // Mettre à jour le compteur
    packs.count = (packs.count || 0) + 1;
    if (packs.count >= 30) {
      // Passer au pack suivant
      packs.currentPack++;
      packs.count = 0;
    }
    savePacks(packs);

    return { packIndex: currentPackIndex, packTitle, stickerNumber: packs.count || 30 };
  } catch (error) {
    console.error('Erreur lors de l\'ajout au pack:', error);
    throw error;
  }
}

async function onStart({ bot, msg, chatId, args, usages }) {
  const targetMsg = msg.reply_to_message || msg;
  const fileId = targetMsg.photo
    ? targetMsg.photo[targetMsg.photo.length - 1].file_id
    : targetMsg.video
    ? targetMsg.video.file_id
    : targetMsg.document?.mime_type?.startsWith('image/')
    ? targetMsg.document.file_id
    : null;

  if (!fileId) {
    return bot.sendMessage(
      chatId,
      `🎨 Commande Sticker\n━━━━━━━━━━━━━━\n\n` +
      `❌ Aucune image ou vidéo trouvée.\n\n` +
      `📌 Comment utiliser :\n` +
      `• Répondez à une photo ou vidéo avec /sticker\n` +
      `• Ou envoyez directement /sticker avec un média\n\n` +
      `✨ Formats supportés : JPG, PNG, MP4, WEBM\n` +
      `⏱️ Vidéo max : 30 secondes`,
      { reply_to_message_id: msg.message_id }
    );
  }

  const timestamp = Date.now();
  const ext = targetMsg.video ? 'mp4' : (targetMsg.photo ? 'jpg' : 'bin');
  const inputPath = path.join(tmpDir, `input_${timestamp}.${ext}`);
  const outputPath = path.join(tmpDir, `sticker_${timestamp}.${targetMsg.video ? 'webm' : 'webp'}`);

  try {
    const stream = await downloadTelegramFile(bot, fileId);
    const writer = fs.createWriteStream(inputPath);
    stream.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Conversion
    if (targetMsg.video) {
      const duration = await getVideoDuration(inputPath);
      if (duration > 30) {
        cleanup(inputPath);
        return bot.sendMessage(chatId, '⏱️ La vidéo ne doit pas dépasser 30 secondes.', { reply_to_message_id: msg.message_id });
      }
      await convertVideoToSticker(inputPath, outputPath);
    } else {
      await convertImageToSticker(inputPath, outputPath);
    }

    // Envoyer le sticker à l'utilisateur (comme avant)
    await bot.sendSticker(chatId, outputPath, {
      reply_to_message_id: msg.message_id
    });

    // Ajouter au pack (en arrière-plan, on attend pas pour ne pas ralentir)
    // Mais on veut informer l'utilisateur, donc on le fait de manière asynchrone avec await
    try {
      const { packIndex, packTitle, stickerNumber } = await addToStickerPack(
        bot,
        outputPath,
        !!targetMsg.video,
        msg.from.id,
        msg.from.first_name || 'Utilisateur'
      );
      // Envoyer un message de confirmation
      await bot.sendMessage(
        chatId,
        `📦 Sticker ajouté au pack *${packTitle}* (${stickerNumber}/30)`,
        { parse_mode: 'Markdown', reply_to_message_id: msg.message_id }
      );
    } catch (packError) {
      console.error('Erreur pack:', packError);
      // On ne bloque pas l'utilisateur, on signale juste
      await bot.sendMessage(
        chatId,
        `⚠️ Le sticker a été créé mais n'a pas pu être ajouté au pack.`,
        { reply_to_message_id: msg.message_id }
      );
    }

    // Nettoyage
    cleanup(inputPath);
    cleanup(outputPath);

  } catch (error) {
    console.error('Erreur sticker:', error);
    if (fs.existsSync(inputPath)) cleanup(inputPath);
    if (fs.existsSync(outputPath)) cleanup(outputPath);

    let errorMsg = '❌ Erreur lors de la création du sticker.';
    if (error.message.includes('ffmpeg') || error.message.includes('ffprobe')) {
      errorMsg = '🎥 FFmpeg est requis pour cette commande. Assurez-vous qu\'il est installé.';
    }

    await bot.sendMessage(chatId, errorMsg, { reply_to_message_id: msg.message_id });
  }
}

module.exports = { onStart, nix };
