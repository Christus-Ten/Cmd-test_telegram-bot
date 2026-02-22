const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const tmpDir = path.join(os.tmpdir(), 'telegram_stickers');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

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

async function addToStickerPack(bot, filePath, isVideo, userId, userName) {
  try {
    const botInfo = await bot.getMe();
    const botUsername = botInfo.username;
    if (!botUsername) throw new Error('Le bot n\'a pas de username');

    const isAnimated = isVideo;
    const stickerType = isAnimated ? 'webm_sticker' : 'png_sticker';

    const uploadResult = await bot.uploadStickerFile(userId, filePath);
    const fileId = uploadResult.file_id;

    const packs = loadPacks();
    let currentPackIndex = packs.currentPack;
    let packName = `creator_${currentPackIndex}_by_${botUsername}`.toLowerCase();
    let packTitle = `Creator (@Christus225) ${currentPackIndex}`;

    let packExists = false;
    try {
      await bot.getStickerSet(packName);
      packExists = true;
    } catch (e) {
      if (e.response && e.response.statusCode === 404) {
        packExists = false;
      } else {
        throw e;
      }
    }

    if (packExists) {
      await bot.addStickerToSet(userId, packName, fileId, {
        [stickerType]: fileId,
        emojis: '🤖'
      });
      packs.count = (packs.count || 0) + 1;
      const stickerNumber = packs.count;
      if (packs.count >= 30) {
        packs.currentPack++;
        packs.count = 0;
      }
      savePacks(packs);
      return { packIndex: currentPackIndex, packTitle, stickerNumber };
    } else {
      await bot.createNewStickerSet(userId, packName, packTitle, fileId, {
        [stickerType]: fileId,
        emojis: '🤖',
        contains_masks: false
      });
      packs.packs.push(packName);
      packs.count = 1;
      savePacks(packs);
      return { packIndex: currentPackIndex, packTitle, stickerNumber: 1 };
    }
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

    await bot.sendSticker(chatId, outputPath, {
      reply_to_message_id: msg.message_id
    });

    try {
      const { packIndex, packTitle, stickerNumber } = await addToStickerPack(
        bot,
        outputPath,
        !!targetMsg.video,
        msg.from.id,
        msg.from.first_name || 'Utilisateur'
      );
      await bot.sendMessage(
        chatId,
        `📦 Sticker ajouté au pack *${packTitle}* (${stickerNumber}/30)`,
        { parse_mode: 'Markdown', reply_to_message_id: msg.message_id }
      );
    } catch (packError) {
      console.error('Erreur pack:', packError);
      let packErrorMsg = '⚠️ Le sticker a été créé mais n\'a pas pu être ajouté au pack.';
      if (packError.response && packError.response.body && packError.response.body.description) {
        packErrorMsg += ` (${packError.response.body.description})`;
      }
      await bot.sendMessage(
        chatId,
        packErrorMsg,
        { reply_to_message_id: msg.message_id }
      );
    }

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
