const { createCanvas, loadImage } = require('canvas');
const os = require('os');
const process = require('process');
const fs = require('fs');
const path = require('path');

module.exports = {
    nix: {
        name: "uptime",
        aliases: ["upt", "up", "sys"],
        author: "Christus",
        description: "Affiche les stats système avec un tableau de bord visuel.",
        category: "utility",
        cooldown: 5
    },

    async onStart({ bot, msg, chatId }) {
        function formatTime(seconds) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return `${h}h ${m}m ${s}s`;
        }

        const stats = {
            sys: formatTime(os.uptime()),
            bot: formatTime(process.uptime()),
            totalMem: (os.totalmem() / (1024 ** 3)).toFixed(2),
            freeMem: (os.freemem() / (1024 ** 3)).toFixed(2),
            usedMem: ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2),
            cpuCores: os.cpus().length,
            load: (os.loadavg()[0]).toFixed(2)
        };

        try {
            const imgPath = await createUptimeCanvas(stats);
            await bot.sendPhoto(chatId, imgPath, {
                caption: `📊 Système : ${os.type()}\n🤖 Bot en ligne depuis : ${stats.bot}`
            });
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        } catch (err) {
            bot.sendMessage(chatId, "❌ Erreur lors du rendu du tableau de bord.");
        }
    }
};

async function createUptimeCanvas(s) {
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fond avec un dégradé radial (Effet profondeur)
    const bg = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, 500);
    bg.addColorStop(0, '#1c1c28');
    bg.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Dessin d'un HUD futuriste (Cadre)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // --- TITRE ---
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText('NIX SYSTEM MONITOR', 60, 80);

    // --- SECTION UPTIME (Gauche) ---
    drawStatBox(ctx, 60, 130, '🤖 BOT UPTIME', s.bot, '#ffffff');
    drawStatBox(ctx, 60, 230, '🖥️ SYSTEM UPTIME', s.sys, '#aaaaaa');

    // --- SECTION RAM (Droite) ---
    const ramPercent = (s.usedMem / s.totalMem);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`RAM USAGE: ${s.usedMem}GB / ${s.totalMem}GB`, 500, 155);
    
    // Barre de RAM
    ctx.fillStyle = '#333333';
    ctx.fillRect(500, 170, 340, 30);
    ctx.fillStyle = ramPercent > 0.8 ? '#ef4444' : '#22c55e';
    ctx.fillRect(500, 170, 340 * ramPercent, 30);

    // --- INFOS CPU ---
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`CPU CORES: ${s.cpuCores}`, 500, 260);
    ctx.fillText(`LOAD AVG: ${s.load}`, 500, 300);
    ctx.fillText(`ARCH: ${os.arch()}`, 500, 340);

    // Petit graphique décoratif en bas
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(34, 200, 94, 0.3)';
    for(let i = 0; i < 20; i++) {
        ctx.lineTo(60 + (i * 40), 450 - (Math.random() * 50));
    }
    ctx.stroke();

    const filePath = path.join(__dirname, `uptime_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer());
    return filePath;
}

function drawStatBox(ctx, x, y, title, value, color) {
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(title, x, y);
    ctx.fillStyle = color;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(value, x, y + 40);
}
