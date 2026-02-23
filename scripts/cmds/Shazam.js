const acrcloud = require('acrcloud');
const fs = require('fs').promises;
const path = require('path');

const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: '6ab51323d0971429efbc32743c3b6e01',
    access_secret: 'iFbOFUI9rVrQPf7WN5BzcpPnQoCTPJ3JdMkAgrU8',
});

const cacheFolder = path.join(__dirname, 'cache');

// Créer le dossier cache s'il n'existe pas
(async () => {
    try {
        await fs.mkdir(cacheFolder, { recursive: true });
    } catch (err) {
        console.error('Error creating cache folder:', err);
    }
})();

const nix = {
    name: "shazam",
    version: "1.0.0",
    aliases: ["identify", "whatsong", "reconnaitre"],
    description: "Identifie une musique à partir d'un fichier audio ou vidéo (répondre au message)",
    author: "Christus (converted)",
    prefix: true,
    category: "media",
    role: 0,
    cooldown: 15,
    guide: "{p}shazam (en répondant à un message audio ou vidéo)"
};

async function onStart({ bot, message, msg, chatId, args, usages }) {
    // Vérifier qu'on répond à un message
    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, 
            "╭────❒ 🎧 Usage 🎧 ❒────\n" +
            "├⬡ Répondez à un message audio ou vidéo pour identifier le morceau.\n" +
            "╰───────────────────", 
            { reply_to_message_id: msg.message_id }
        );
    }

    const replied = msg.reply_to_message;
    // Vérifier le type de média
    let fileId = null;
    let mediaType = null;
    if (replied.audio) {
        fileId = replied.audio.file_id;
        mediaType = 'audio';
    } else if (replied.voice) {
        fileId = replied.voice.file_id;
        mediaType = 'voice';
    } else if (replied.video) {
        fileId = replied.video.file_id;
        mediaType = 'video';
    } else {
        return bot.sendMessage(chatId,
            "❌ Veuillez répondre à un message audio (musique), vocal ou vidéo.",
            { reply_to_message_id: msg.message_id }
        );
    }

    // Envoyer un message de traitement
    const processingMsg = await bot.sendMessage(chatId,
        "╭────❒ 🎶 Identification en cours... 🎶 ❒────\n" +
        "├⬡ Analyse du fichier...\n" +
        "├⬡ Veuillez patienter...\n" +
        "╰───────────────────",
        { reply_to_message_id: msg.message_id }
    );

    try {
        // Télécharger le fichier dans le dossier cache
        const filePath = await bot.downloadFile(fileId, cacheFolder);
        
        // Lire le fichier
        const fileBuffer = await fs.readFile(filePath);

        // Identification avec ACRCloud
        const results = await acr.identify(fileBuffer);

        // Supprimer le fichier temporaire
        await fs.unlink(filePath).catch(() => {});

        // Supprimer le message de traitement
        await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});

        if (results && results.status && results.status.code === 0 && 
            results.metadata && results.metadata.music && results.metadata.music.length > 0) {
            
            const track = results.metadata.music[0];
            const artists = track.artists ? track.artists.map(a => a.name).join(', ') : 'Inconnu';
            const album = track.album ? track.album.name : null;
            const genres = track.genres ? track.genres.map(g => g.name).join(', ') : null;
            const confidence = results.status.msg === 'Success' ? 'Élevée' : 'Faible';

            let message = 
                `╭────❒ 🎵 Morceau identifié ! 🎵 ❒────\n` +
                `├ 🎵 Titre : ${track.title || 'Inconnu'}\n` +
                `├ 🎤 Artiste(s) : ${artists}\n`;
            if (album) message += `├ 💿 Album : ${album}\n`;
            if (genres) message += `├ 🎶 Genre : ${genres}\n`;
            message += `├ 📊 Confiance : ${confidence}\n`;
            message += `╰───────────────────────────`;

            await bot.sendMessage(chatId, message, { reply_to_message_id: msg.message_id });
        } else {
            await bot.sendMessage(chatId,
                "🎧 Impossible d'identifier le morceau. Essayez avec un extrait plus clair.",
                { reply_to_message_id: msg.message_id }
            );
        }
    } catch (error) {
        console.error('Shazam error:', error);
        // Supprimer le message de traitement si possible
        await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
        await bot.sendMessage(chatId,
            "❌ Erreur lors de l'identification. Veuillez réessayer plus tard.",
            { reply_to_message_id: msg.message_id }
        );
    }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
    // Non utilisé
}

module.exports = { onStart, onReply, nix };
