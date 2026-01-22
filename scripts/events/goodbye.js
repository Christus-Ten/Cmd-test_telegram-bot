const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Chemins des polices (adapte les selon ton dossier assets si tu en utilises)
const fontDir = path.join(process.cwd(), "assets", "fonts");
// Exemple : if (fs.existsSync(path.join(fontDir, "Roboto-Bold.ttf"))) { registerFont(path.join(fontDir, "Roboto-Bold.ttf"), { family: 'Roboto', weight: 'bold' }); }

module.exports = {
  nix: {
    name: "goodbye",
    description: "Gère les départs de membres avec une image personnalisée et un message.",
    type: "leave",
    author: "Christus"
  },

  async onStart({ bot, msg }) {
    const chatId = msg.chat.id;
    const leftMember = msg.left_chat_member;

    if (!leftMember) return;

    try {
        const { first_name, last_name, id: userId } = leftMember;
        const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`;

        const botInfo = await bot.getMe();
        const chatInfo = await bot.getChat(chatId);
        const title = chatInfo.title || 'le groupe';

        // Si le bot lui-même est retiré
        if (userId === botInfo.id) {
            const actionBy = `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`;
            console.log(`Le bot a été retiré de ${title} par ${actionBy}.`);
            // Pas de message d'envoi si le bot est parti
            return;
        }

        // Récupération de l'avatar du membre qui part
        let avatarUrl = "https://i.imgur.com/uR1d52L.png"; // Avatar par défaut pour le départ (silhouette)
        try {
            const photos = await bot.getUserProfilePhotos(userId);
            if (photos.total_count > 0) {
                const fileId = photos.photos[0][0].file_id;
                avatarUrl = await bot.getFileLink(fileId);
            }
        } catch (e) { console.log("Pas de photo de profil pour le membre sortant."); }

        // Déterminer le message et le statut de départ
        const goodbyeText = msg.from.id === userId
            ? `${fullName} nous a quittés.`
            : `${fullName} a été retiré(e).`;
        const goodbyeReason = msg.from.id === userId ? "Départ volontaire" : "Expulsion";
        
        // Génération de l'image Canvas
        const imagePath = await createGoodbyeImage(fullName, title, goodbyeReason, avatarUrl);

        // Envoi de l'image
        await bot.sendPhoto(chatId, imagePath, {
            caption: `👋 ${goodbyeText}\nNous espérons te revoir bientôt !`
        });

        // Nettoyage
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    } catch (error) {
        console.error('Erreur Goodbye Nix:', error);
    }
  }
};

async function createGoodbyeImage(userName, groupName, reason, avatarUrl) {
    const width = 1000;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fond sombre avec un effet de "glitch"
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);

    // Dégradé bleu/violet pour un effet de "fin"
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(25, 25, 112, 0.6)'); // Bleu nuit
    gradient.addColorStop(1, 'rgba(75, 0, 130, 0.4)'); // Violet foncé
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Effet de "lignes de bruit" - simulation de glitch
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const length = Math.random() * 50;
        const angle = Math.random() * Math.PI * 2;
        ctx.strokeStyle = `rgba(0, 191, 255, ${Math.random() * 0.3})`; // Bleu clair
        ctx.lineWidth = Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
        ctx.stroke();
    }


    // Dessin de l'avatar circulaire avec un cadre "cassé"
    try {
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, 180, 100, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, width / 2 - 100, 80, 200, 200);
        ctx.restore();
        
        // Cadre "cassé" autour de l'avatar
        ctx.strokeStyle = '#00bfff'; // Bleu lumineux
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(width / 2, 180, 100, 0, Math.PI * 2);
        ctx.stroke();

        // Ajout de petits segments pour l'effet "cassé"
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x1 = width / 2 + 100 * Math.cos(angle);
            const y1 = 180 + 100 * Math.sin(angle);
            const x2 = width / 2 + (100 + 10) * Math.cos(angle);
            const y2 = 180 + (100 + 10) * Math.sin(angle);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }


    } catch (e) { console.log("Erreur chargement avatar canvas goodbye"); }

    // Textes
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // Goodbye
    ctx.font = 'bold 70px sans-serif';
    ctx.fillText('GOODBYE', width / 2, 350);

    // Nom de l'utilisateur
    ctx.font = '45px sans-serif';
    ctx.fillStyle = '#00bfff'; // Bleu vif
    ctx.fillText(userName, width / 2, 410);

    // Infos groupe et raison
    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`De ${groupName}`, width / 2, 450);
    ctx.fillText(`(${reason})`, width / 2, 480);

    // Sauvegarde temporaire
    const filePath = path.join(__dirname, `goodbye_${Date.now()}.png`);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
    return filePath;
                }
