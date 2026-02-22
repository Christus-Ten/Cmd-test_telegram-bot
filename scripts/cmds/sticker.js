const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');

// Dossier temporaire unique pour ce module
const tmpDir = path.join(os.tmpdir(), 'telegram_stickers');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const nix = {
  name: 'sticker',
  version: '1.0.0',
  aliases: ['s', 'stk', 'autocollant'],
  description: 'Transforme une photo ou une vidéo en sticker Telegram',
  author: 'Christus',
  prefix: true,
  category: 'media',
  role: 0,
  cooldown: 5,
  guide: '{p}sticker – en réponse à une image ou vidéo\n{p}s – alias\nExemple : /sticker (en reply d\'une photo)'
};

/**
 * Nettoie un fichier après envoi
 */
function cleanup(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.error('Erreur nettoyage fichier:', err);
  });
}

/**
 * Télécharge un fichier depuis Telegram
 */
async function downloadTelegramFile(bot, fileId) {
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
  const response = await axios({ url: fileUrl, method: 'GET', responseType: 'stream' });
  return response.data;
}

/**
 * Convertit une image en sticker WEBP (512x512)
 */
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

/**
 * Convertit une vidéo en sticker animé WEBM (≤3s, 512x512)
 */
function convertVideoToSticker(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Vérifier d'abord la durée
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      if (duration > 3) {
        return reject(new Error('La vidéo doit durer 3 secondes maximum.'));
      }

      const command = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15" -vcodec libvpx-vp9 -crf 32 -b:v 0 -an -t 3 "${outputPath}" -y`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Erreur conversion vidéo:', stderr);
          reject(error);
        } else resolve();
      });
    });
  });
}

async function onStart({ bot, msg, chatId, args, usages }) {
  // Détermine si on utilise le message cité ou le message courant
  const targetMsg = msg.reply_to_message || msg;
  const fileId = targetMsg.photo
    ? targetMsg.photo[targetMsg.photo.length - 1].file_id  // plus grande résolution
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
      `⏱️ Vidéo max : 3 secondes`,
      { reply_to_message_id: msg.message_id }
    );
  }

  // Préparation des fichiers temporaires
  const timestamp = Date.now();
  const ext = targetMsg.video ? 'mp4' : (targetMsg.photo ? 'jpg' : 'bin');
  const inputPath = path.join(tmpDir, `input_${timestamp}.${ext}`);
  const outputPath = path.join(tmpDir, `sticker_${timestamp}.${targetMsg.video ? 'webm' : 'webp'}`);

  try {
    // Téléchargement du média
    const stream = await downloadTelegramFile(bot, fileId);
    const writer = fs.createWriteStream(inputPath);
    stream.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Conversion selon le type
    if (targetMsg.video) {
      await convertVideoToSticker(inputPath, outputPath);
    } else {
      await convertImageToSticker(inputPath, outputPath);
    }

    // Envoi du sticker
    await bot.sendSticker(chatId, outputPath, {
      reply_to_message_id: msg.message_id
    });

    // Nettoyage
    cleanup(inputPath);
    cleanup(outputPath);

  } catch (error) {
    console.error('Erreur sticker:', error);
    // Nettoyage en cas d'erreur
    if (fs.existsSync(inputPath)) cleanup(inputPath);
    if (fs.existsSync(outputPath)) cleanup(outputPath);

    let errorMsg = '❌ Erreur lors de la création du sticker.';
    if (error.message.includes('3 secondes')) {
      errorMsg = '⏱️ La vidéo ne doit pas dépasser 3 secondes.';
    } else if (error.message.includes('ffmpeg')) {
      errorMsg = '🎥 Le format vidéo n’est pas supporté ou ffmpeg est manquant.';
    }

    await bot.sendMessage(chatId, errorMsg, { reply_to_message_id: msg.message_id });
  }
}

module.exports = { onStart, nix };
