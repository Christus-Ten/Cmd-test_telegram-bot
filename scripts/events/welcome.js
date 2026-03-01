const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Tableau d'arrière-plans (inchangé)
const backgroundImages = [
  "https://i.imgur.com/XVRFwns.jpeg",
  "https://i.imgur.com/DXXvgjb.png",
  "https://i.imgur.com/LwoDuzZ.jpeg",
  "https://i.imgur.com/mtSrSYh.jpeg",
  "https://i.imgur.com/IVvEBc4.jpeg",
  "https://i.imgur.com/uJcd1bf.jpeg"
];

// Cache simple pour les images d'arrière-plan déjà chargées
const backgroundCache = new Map();

/**
 * Charge une image d'arrière-plan depuis une URL (avec cache)
 */
async function loadBackgroundImage(url) {
  if (backgroundCache.has(url)) return backgroundCache.get(url);
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const img = await loadImage(Buffer.from(response.data));
    backgroundCache.set(url, img);
    return img;
  } catch (error) {
    console.error('[WELCOME] Erreur chargement fond :', url, error.message);
    return null;
  }
}

/**
 * Dessine une image de profil circulaire avec ombre portée
 */
async function drawProfileImage(ctx, imageUrl, x, y, size, borderColor) {
  const radius = size / 2;
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const img = await loadImage(Buffer.from(response.data));

    // Ombre portée
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bordure pleine
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();

    // Image circulaire
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - radius, y - radius, size, size);
    ctx.restore();

    return true;
  } catch (error) {
    // Fallback : lettre "U" si l'image ne se charge pas
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#374151';
    ctx.fill();

    ctx.fillStyle = borderColor;
    ctx.font = `bold ${radius * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('U', x, y);
    return false;
  }
}

/**
 * Crée la carte de bienvenue (adaptée de l'original)
 */
async function createWelcomeCard(gcImg, userImg, adderImg, userName, userNumber, threadName, adderName) {
  const width = 1200;
  const height = 700;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Sélection aléatoire d'un fond
  const selectedBackground = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
  const background = await loadBackgroundImage(selectedBackground);
  if (background) {
    ctx.drawImage(background, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }

  // Léger voile noir pour lisibilité
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, width, height);

  // Dessin des trois avatars
  await Promise.all([
    drawProfileImage(ctx, gcImg, width / 2, 200, 200, '#ffffff'),
    drawProfileImage(ctx, userImg, 120, height - 100, 150, '#10b981'),
    drawProfileImage(ctx, adderImg, width - 120, 100, 150, '#3b82f6')
  ]);

  // Nom du groupe
  ctx.font = 'bold 36px "Segoe UI", Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(threadName, width / 2, 350);

  // Texte WELCOME avec dégradé
  const welcomeGradient = ctx.createLinearGradient(width/2 - 180, 360, width/2 + 180, 360);
  welcomeGradient.addColorStop(0, '#3b82f6');
  welcomeGradient.addColorStop(0.5, '#10b981');
  welcomeGradient.addColorStop(1, '#ec4899');
  ctx.font = 'bold 72px "Segoe UI", Arial';
  ctx.fillStyle = welcomeGradient;
  ctx.fillText('WELCOME', width / 2, 450);

  // Ligne décorative
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 150, 420);
  ctx.lineTo(width / 2 + 150, 420);
  ctx.stroke();

  // Nom de l'utilisateur
  ctx.font = 'bold 48px "Segoe UI", Arial';
  ctx.fillStyle = '#10b981';
  ctx.fillText(userName, width / 2, 500);

  // Numéro de membre
  ctx.font = 'bold 28px "Segoe UI", Arial';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`Member #${userNumber}`, width / 2, 585);

  // Légendes sous les avatars
  ctx.textAlign = 'left';
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 26px "Segoe UI", Arial';
  ctx.fillText(userName, 220, height - 95);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 22px "Segoe UI", Arial';
  ctx.fillText(`Added by: ${adderName}`, width - 220, 105);

  // Signature
  ctx.font = '18px "Segoe UI"';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('© made by azadx69x', width - 10, height - 10);

  return canvas.toBuffer('image/png');
}

// Métadonnées Nix
const nix = {
  name: 'welcome',
  description: 'Accueille les nouveaux membres avec une image personnalisée.',
  type: 'welcome',
  author: 'Christus (adapté de azadx69x)'
};

/**
 * Fonction principale appelée automatiquement lors d'un message de service
 */
async function onStart({ bot, msg }) {
  const chatId = msg.chat.id;
  const newMembers = msg.new_chat_members;

  // Si pas de nouveaux membres, on ignore
  if (!newMembers) return;

  try {
    const botInfo = await bot.getMe();
    const chatInfo = await bot.getChat(chatId);
    const threadName = chatInfo.title || 'le groupe';

    for (const member of newMembers) {
      // 1. Si le bot a été ajouté
      if (member.id === botInfo.id) {
        return bot.sendMessage(
          chatId,
          `🎉 ${botInfo.first_name} est connecté !\nMerci de m'avoir ajouté à ${threadName}.`
        );
      }

      // 2. Récupération des données nécessaires
      const userName = member.first_name || 'Membre';
      const adder = msg.from; // Utilisateur qui a ajouté (ou le membre lui-même s'il a rejoint via lien)
      const adderName = adder.first_name || 'Quelqu\'un';

      // Nombre de membres actuel
      const memberCount = await bot.getChatMemberCount(chatId);

      // Avatar du groupe (photo du chat)
      let groupAvatarUrl = 'https://i.imgur.com/7Qk8k6c.png'; // défaut
      if (chatInfo.photo) {
        try {
          const fileLink = await bot.getFileLink(chatInfo.photo.big_file_id);
          groupAvatarUrl = fileLink;
        } catch (e) {
          console.log('[WELCOME] Pas de photo de groupe');
        }
      }

      // Avatar du nouveau membre
      let userAvatarUrl = 'https://i.imgur.com/6V9i39X.png'; // défaut
      try {
        const photos = await bot.getUserProfilePhotos(member.id);
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          userAvatarUrl = await bot.getFileLink(fileId);
        }
      } catch (e) {
        console.log('[WELCOME] Pas de photo de profil pour le membre');
      }

      // Avatar de l'ajouteur
      let adderAvatarUrl = 'https://i.imgur.com/6V9i39X.png'; // défaut
      try {
        const photos = await bot.getUserProfilePhotos(adder.id);
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          adderAvatarUrl = await bot.getFileLink(fileId);
        }
      } catch (e) {
        console.log('[WELCOME] Pas de photo de profil pour l\'ajouteur');
      }

      // 3. Génération de l'image
      const imageBuffer = await createWelcomeCard(
        groupAvatarUrl,
        userAvatarUrl,
        adderAvatarUrl,
        userName,
        memberCount,
        threadName,
        adderName
      );

      // Sauvegarde temporaire
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, `welcome_${Date.now()}.png`);
      fs.writeFileSync(tempPath, imageBuffer);

      // 4. Envoi
      await bot.sendPhoto(chatId, tempPath, {
        caption: `🌸 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 🌸\n━━━━━━━━━━━━━━━━━━━━━━\n🌷 𝐍𝐚𝐦𝐞: ${userName}\n🏷️ 𝐆𝐫𝐨𝐮𝐩: ${threadName}\n🔢 𝐌𝐞𝐦𝐛𝐞𝐫 #${memberCount}\n👤 𝐀𝐝𝐝𝐞𝐝 𝐛𝐲: ${adderName}\n━━━━━━━━━━━━━━━━━━━━━━\n𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐬𝐭𝐚𝐲! 😊`,
        reply_to_message_id: msg.message_id
      });

      // Nettoyage
      setTimeout(() => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }, 10000);
    }
  } catch (error) {
    console.error('[WELCOME] Erreur globale :', error);
    // Envoi d'un message texte de secours
    const newMembers = msg.new_chat_members;
    if (newMembers && newMembers[0]) {
      const userName = newMembers[0].first_name || 'Membre';
      await bot.sendMessage(
        chatId,
        `🌸 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ${userName}! 🌸\n━━━━━━━━━━━━━━━━━━\n🌷 𝐓𝐨 𝐨𝐮𝐫 𝐠𝐫𝐨𝐮𝐩 𝐟𝐚𝐦𝐢𝐥𝐲!\n🌟 𝐖𝐞'𝐫𝐞 𝐞𝐱𝐜𝐢𝐭𝐞𝐝 𝐭𝐨 𝐡𝐚𝐯𝐞 𝐲𝐨𝐮!\n🎊 𝐏𝐥𝐞𝐚𝐬𝐞 𝐢𝐧𝐭𝐫𝐨𝐝𝐮𝐜𝐞 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟!\n━━━━━━━━━━━━━━━━━━\n𝐇𝐚𝐯𝐞 𝐟𝐮𝐧! 😊`,
        { reply_to_message_id: msg.message_id }
      );
    }
  }
}

module.exports = { nix, onStart };
