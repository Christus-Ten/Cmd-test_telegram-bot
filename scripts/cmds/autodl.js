const axios = require('axios');
const fs = require('fs');
const path = require('path');

const nix = {
  name: "autodl",
  version: "3.4.0",
  aliases: ["dl", "download", "telecharger"],
  description: "Téléchargement automatique de YouTube, Spotify, Imgur, Pinterest, etc.",
  author: "ArYAN",
  prefix: true,
  category: "media",
  type: "anyone",
  cooldown: 10,
  guide: "{p}autodl <url>\nEnvoie automatiquement un lien pour le télécharger"
};

const CACHE_DIR = path.join(__dirname, "cache");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getMediaType(url) {
  return {
    isYT: /(youtube\.com|youtu\.be)/i.test(url),
    isSpotify: /(spotify\.com|spotify\.link)/i.test(url),
    isImg: /(imgur\.com|i\.imgur\.com|pinterest\.com|pin\.it|imgbb\.com|ibb\.co)/i.test(url)
  };
}

async function downloadFile(url, filePath) {
  const response = await axios.get(url, { 
    responseType: "arraybuffer", 
    timeout: 120000 
  });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
}

function cleanupFiles(files) {
  for (const file of files) {
    try { 
      if (fs.existsSync(file)) fs.unlinkSync(file); 
    } catch (e) {}
  }
}

async function onStart({ bot, args, message, msg, usages }) {
  const input = args.join(" ");
  const urlMatch = input.match(/https?:\/\/\S+/i);
  
  if (!urlMatch) {
    return usages();
  }

  const url = urlMatch[0];
  const type = getMediaType(url);
  
  await message.react("⏳");

  try {
    const apiUrl = `https://downvid.onrender.com/api/download?url=${encodeURIComponent(url)}`;
    const { data: res } = await axios.get(apiUrl, { timeout: 60000 });

    if (!res || res.status !== "success") {
      await message.react("❌");
      return message.reply("❌ Échec du téléchargement. L'API n'a pas pu traiter ce lien.");
    }

    const mediaInfo = res?.data?.data || {};
    const videoUrl = res.video || mediaInfo.nowm || null;
    const audioUrl = res.audio || null;
    const imageUrl = res.image || mediaInfo.image || null;

    let downloads = [];
    let header = "✅ Téléchargé\n\n";

    if (type.isSpotify) {
      if (!audioUrl) throw new Error("Aucun audio trouvé");
      downloads.push({ url: audioUrl, ext: "mp3" });
      header = "✅ Spotify Audio 🎧\n\n";
    } 
    else if (type.isYT) {
      if (!videoUrl) throw new Error("Aucune vidéo trouvée");
      downloads.push({ url: videoUrl, ext: "mp4" });
      header = "✅ YouTube Vidéo 🎬\n\n";
    } 
    else if (type.isImg) {
      const target = imageUrl || videoUrl;
      if (!target) throw new Error("Aucune image trouvée");
      const ext = target.includes(".mp4") || target.includes(".gif") ? 
                  (target.includes(".mp4") ? "mp4" : "gif") : "jpg";
      downloads.push({ url: target, ext: ext });
      header = "✅ Image/Média 🖼️\n\n";
    } 
    else {
      if (videoUrl) downloads.push({ url: videoUrl, ext: "mp4" });
      else if (audioUrl) downloads.push({ url: audioUrl, ext: "mp3" });
      else if (imageUrl) downloads.push({ url: imageUrl, ext: "jpg" });
      else throw new Error("Aucun média trouvé pour ce lien");
    }

    const streams = [];
    const tempFiles = [];

    for (const item of downloads) {
      const filePath = path.join(CACHE_DIR, `autodl_${Date.now()}_${Math.random().toString(36).slice(2)}.${item.ext}`);
      await downloadFile(item.url, filePath);
      streams.push(filePath);
      tempFiles.push(filePath);
    }

    const title = mediaInfo.title || "Média téléchargé";
    const caption = `${header}📌 Titre: ${title}`;

    for (const filePath of streams) {
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.mp4' || ext === '.mov' || ext === '.avi') {
        await bot.sendVideo(msg.chat.id, filePath, {
          caption: caption,
          reply_to_message_id: msg.message_id
        });
      }
      else if (ext === '.mp3' || ext === '.m4a' || ext === '.wav') {
        await bot.sendAudio(msg.chat.id, filePath, {
          caption: caption,
          title: title,
          reply_to_message_id: msg.message_id
        });
      }
      else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
        await bot.sendPhoto(msg.chat.id, filePath, {
          caption: caption,
          reply_to_message_id: msg.message_id
        });
      }
      else {
        await bot.sendDocument(msg.chat.id, filePath, {
          caption: caption,
          reply_to_message_id: msg.message_id
        });
      }
    }

    cleanupFiles(tempFiles);
    await message.react("✅");

  } catch (error) {
    console.error("AutoDL Error:", error);
    await message.react("❌");
    message.reply(`❌ Erreur: ${error.message || "Impossible de télécharger ce lien"}`);
  }
}

// Gestion automatique des liens dans tous les messages (noPrefix)
async function onEvent({ bot, event, message, msg }) {
  if (!msg.text && !msg.caption) return;
  
  const text = msg.text || msg.caption;
  const urlMatch = text.match(/https?:\/\/\S+/i);
  
  if (urlMatch) {
    const url = urlMatch[0];
    const type = getMediaType(url);
    
    if (type.isYT || type.isSpotify || type.isImg) {
      await message.react("⏳");

      try {
        const apiUrl = `https://downvid.onrender.com/api/download?url=${encodeURIComponent(url)}`;
        const { data: res } = await axios.get(apiUrl, { timeout: 60000 });

        if (!res || res.status !== "success") {
          return;
        }

        const mediaInfo = res?.data?.data || {};
        const videoUrl = res.video || mediaInfo.nowm || null;
        const audioUrl = res.audio || null;
        const imageUrl = res.image || mediaInfo.image || null;

        let downloads = [];
        let header = "✅ Téléchargé automatiquement\n\n";

        if (type.isSpotify && audioUrl) {
          downloads.push({ url: audioUrl, ext: "mp3" });
          header = "✅ Spotify Audio 🎧\n\n";
        } 
        else if (type.isYT && videoUrl) {
          downloads.push({ url: videoUrl, ext: "mp4" });
          header = "✅ YouTube Vidéo 🎬\n\n";
        } 
        else if (type.isImg) {
          const target = imageUrl || videoUrl;
          if (target) {
            const ext = target.includes(".mp4") || target.includes(".gif") ? 
                        (target.includes(".mp4") ? "mp4" : "gif") : "jpg";
            downloads.push({ url: target, ext: ext });
            header = "✅ Image/Média 🖼️\n\n";
          }
        } 
        else {
          if (videoUrl) downloads.push({ url: videoUrl, ext: "mp4" });
          else if (audioUrl) downloads.push({ url: audioUrl, ext: "mp3" });
          else if (imageUrl) downloads.push({ url: imageUrl, ext: "jpg" });
        }

        if (downloads.length === 0) return;

        const tempFiles = [];

        for (const item of downloads) {
          const filePath = path.join(CACHE_DIR, `autodl_${Date.now()}_${Math.random().toString(36).slice(2)}.${item.ext}`);
          await downloadFile(item.url, filePath);
          tempFiles.push(filePath);
        }

        const title = mediaInfo.title || "Média téléchargé";
        const caption = `${header}📌 Titre: ${title}`;

        for (const filePath of tempFiles) {
          const ext = path.extname(filePath).toLowerCase();
          
          if (ext === '.mp4' || ext === '.mov' || ext === '.avi') {
            await bot.sendVideo(msg.chat.id, filePath, {
              caption: caption,
              reply_to_message_id: msg.message_id
            });
          }
          else if (ext === '.mp3' || ext === '.m4a' || ext === '.wav') {
            await bot.sendAudio(msg.chat.id, filePath, {
              caption: caption,
              title: title,
              reply_to_message_id: msg.message_id
            });
          }
          else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
            await bot.sendPhoto(msg.chat.id, filePath, {
              caption: caption,
              reply_to_message_id: msg.message_id
            });
          }
          else {
            await bot.sendDocument(msg.chat.id, filePath, {
              caption: caption,
              reply_to_message_id: msg.message_id
            });
          }
        }

        cleanupFiles(tempFiles);
        await message.react("✅");

      } catch (error) {
        console.error("AutoDL Event Error:", error);
      }
    }
  }
}

module.exports = { nix, onStart, onEvent };
