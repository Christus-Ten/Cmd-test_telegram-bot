const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const nix = {
  name: "pair",
  aliases: ["love", "match", "couple", "romance"],
  author: "Christus",
  version: "2.0.0",
  role: 0,
  category: "fun",
  description: "Crée une image romantique avec deux personnes du groupe",
  cooldown: 20,
  guide: "{p}pair - Match aléatoire\n{p}pair [répondre à un message] - Match avec la personne mentionnée\n{p}pair [theme] - Utilise un thème spécifique\nThèmes: paradise, cosmic, enchanted, royal, sunset, ocean"
};

const romanticThemes = {
  paradise: {
    name: "Paradise Love",
    background: (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
      gradient.addColorStop(0, "#ffb3d9");
      gradient.addColorStop(0.3, "#ff6bb3");
      gradient.addColorStop(0.6, "#e056fd");
      gradient.addColorStop(1, "#7c3aed");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    heartColor: "#ff1744",
    textColor: "#ffffff",
    shadowColor: "rgba(255, 23, 68, 0.9)",
    accentColor: "#ff69b4",
    secondary: "#ffc0cb"
  },
  cosmic: {
    name: "Cosmic Romance",
    background: (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(0.2, "#764ba2");
      gradient.addColorStop(0.5, "#f093fb");
      gradient.addColorStop(0.8, "#f5576c");
      gradient.addColorStop(1, "#4facfe");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    heartColor: "#ff6b9d",
    textColor: "#ffffff",
    shadowColor: "rgba(255, 107, 157, 0.9)",
    accentColor: "#c471ed",
    secondary: "#a8edea"
  },
  enchanted: {
    name: "Enchanted Garden",
    background: (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#ffecd2");
      gradient.addColorStop(0.3, "#fcb69f");
      gradient.addColorStop(0.6, "#ff9a9e");
      gradient.addColorStop(1, "#fecfef");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    heartColor: "#e91e63",
    textColor: "#ffffff",
    shadowColor: "rgba(233, 30, 99, 0.9)",
    accentColor: "#f8bbd9",
    secondary: "#ffd1dc"
  },
  royal: {
    name: "Royal Love",
    background: (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(0.3, "#764ba2");
      gradient.addColorStop(0.7, "#9932cc");
      gradient.addColorStop(1, "#4b0082");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    heartColor: "#ffd700",
    textColor: "#ffffff",
    shadowColor: "rgba(255, 215, 0, 0.9)",
    accentColor: "#dda0dd",
    secondary: "#e6e6fa"
  },
  sunset: {
    name: "Dreamy Sunset",
    background: (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#ff9a9e");
      gradient.addColorStop(0.3, "#fecfef");
      gradient.addColorStop(0.7, "#fecfef");
      gradient.addColorStop(1, "#ff6b6b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    heartColor: "#ff1744",
    textColor: "#ffffff",
    shadowColor: "rgba(255, 23, 68, 0.9)",
    accentColor: "#ff4081",
    secondary: "#ffb6c1"
  },
  ocean: {
    name: "Ocean Dreams",
    background: (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(0.5, "#764ba2");
      gradient.addColorStop(1, "#a8edea");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    heartColor: "#ff6b9d",
    textColor: "#ffffff",
    shadowColor: "rgba(255, 107, 157, 0.9)",
    accentColor: "#4facfe",
    secondary: "#87ceeb"
  }
};

const romanticMessages = [
  "Love is in the air",
  "Perfect match made in heaven",
  "Two hearts beating as one",
  "Love conquers all",
  "Soulmates found",
  "Forever and always",
  "Love blooms eternal",
  "Hearts intertwined",
  "Love takes flight",
  "Cupid's perfect shot",
  "Destined to be together",
  "Written in the stars",
  "Magical love story",
  "Sweet romance",
  "Moonlight serenade"
];

const decorativeSymbols = ["♥", "♡", "♦", "♧", "♠", "♣", "♢", "◊", "◈", "✦", "✧", "✩", "✪", "✫", "✬", "✭", "✮", "✯", "✰", "✱", "✲", "✳", "✴", "✵", "✶", "✷", "✸", "✹", "✺", "✻", "✼", "✽", "✾", "✿", "❀", "❁", "❂", "❃", "❅", "❆", "❇"];

function drawEnhancedHeart(ctx, x, y, size, color, glowIntensity = 20) {
  ctx.shadowColor = color;
  ctx.shadowBlur = glowIntensity * 2;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3;

  for (let i = 0; i < 3; i++) {
    const glowSize = size + (i * 5);
    ctx.beginPath();
    ctx.moveTo(x, y + glowSize / 4);
    ctx.bezierCurveTo(x, y, x - glowSize / 2, y, x - glowSize / 2, y + glowSize / 4);
    ctx.bezierCurveTo(x - glowSize / 2, y + glowSize / 2, x, y + glowSize, x, y + glowSize);
    ctx.bezierCurveTo(x, y + glowSize, x + glowSize / 2, y + glowSize / 2, x + glowSize / 2, y + glowSize / 4);
    ctx.bezierCurveTo(x + glowSize / 2, y, x, y, x, y + glowSize / 4);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = glowIntensity;
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
  ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size, x, y + size);
  ctx.bezierCurveTo(x, y + size, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x - size/4, y, x + size/4, y + size);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");
  ctx.fillStyle = gradient;
  ctx.shadowBlur = 0;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function drawFloatingElements(ctx, width, height, theme) {
  const elements = 80;
  for (let i = 0; i < elements; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 4 + Math.random() * 20;
    const alpha = 0.2 + Math.random() * 0.6;

    ctx.globalAlpha = alpha;

    if (i % 4 === 0) {
      const symbol = decorativeSymbols[Math.floor(Math.random() * decorativeSymbols.length)];
      ctx.font = `${size}px Arial`;
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(symbol, x, y);
    } else if (i % 3 === 0) {
      const heartColor = i % 2 === 0 ? theme.heartColor : theme.accentColor;
      drawEnhancedHeart(ctx, x, y, size, heartColor, 10);
    } else {
      drawAdvancedSparkle(ctx, x, y, size, theme);
    }
  }
  ctx.globalAlpha = 1;
}

function drawAdvancedSparkle(ctx, x, y, size, theme) {
  const shapes = ["star", "diamond", "circle", "cross", "triangle"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
  ctx.shadowBlur = size;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + Math.random() * 0.3})`;

  switch (shape) {
    case "star":
      drawStar(ctx, x, y, size);
      break;
    case "diamond":
      drawDiamond(ctx, x, y, size);
      break;
    case "circle":
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "cross":
      drawCross(ctx, x, y, size);
      break;
    case "triangle":
      drawTriangle(ctx, x, y, size);
      break;
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

function drawTriangle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
}

function drawCross(ctx, x, y, size) {
  const lineWidth = size / 3;
  ctx.fillRect(x - size, y - lineWidth/2, size * 2, lineWidth);
  ctx.fillRect(x - lineWidth/2, y - size, lineWidth, size * 2);
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
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function drawMagicalBorder(ctx, width, height, theme) {
  const borderWidth = 30;

  ctx.strokeStyle = theme.secondary;
  ctx.lineWidth = 12;
  ctx.shadowColor = theme.accentColor;
  ctx.shadowBlur = 20;
  ctx.setLineDash([20, 15]);
  ctx.strokeRect(borderWidth/4, borderWidth/4, width - (borderWidth/2), height - (borderWidth/2));
  ctx.setLineDash([]);

  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 8;
  ctx.shadowBlur = 15;
  ctx.strokeRect(borderWidth/2, borderWidth/2, width - borderWidth, height - borderWidth);

  ctx.strokeStyle = theme.heartColor;
  ctx.lineWidth = 6;
  ctx.shadowBlur = 10;
  ctx.strokeRect(borderWidth * 2/3, borderWidth * 2/3, width - (borderWidth * 4/3), height - (borderWidth * 4/3));

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  const cornerSize = 35;
  drawEnhancedHeart(ctx, borderWidth, borderWidth, cornerSize, theme.heartColor, 25);
  drawEnhancedHeart(ctx, width - borderWidth - cornerSize, borderWidth, cornerSize, theme.heartColor, 25);
  drawEnhancedHeart(ctx, borderWidth, height - borderWidth - cornerSize, cornerSize, theme.heartColor, 25);
  drawEnhancedHeart(ctx, width - borderWidth - cornerSize, height - borderWidth - cornerSize, cornerSize, theme.heartColor, 25);

  const spacing = 100;
  const sideSymbols = ["♥", "♡", "♦", "◊"];

  for (let x = borderWidth + spacing; x < width - borderWidth - spacing; x += spacing) {
    const symbol = sideSymbols[Math.floor(Math.random() * sideSymbols.length)];
    ctx.font = "25px Arial";
    ctx.fillStyle = theme.heartColor;
    ctx.fillText(symbol, x, borderWidth/2 + 10);
    ctx.fillText(symbol, x, height - borderWidth/2 + 10);
  }

  for (let y = borderWidth + spacing; y < height - borderWidth - spacing; y += spacing) {
    const symbol = sideSymbols[Math.floor(Math.random() * sideSymbols.length)];
    ctx.font = "25px Arial";
    ctx.fillStyle = theme.heartColor;
    ctx.fillText(symbol, borderWidth/2, y);
    ctx.fillText(symbol, width - borderWidth/2, y);
  }
}

function drawEnhancedText(ctx, text, x, y, fontSize, theme, style = 'bold') {
  try {
    ctx.font = `${style} ${fontSize}px Arial, sans-serif`;
  } catch {
    ctx.font = `${style} ${fontSize}px Arial`;
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const shadowLayers = [
    { blur: 30, offsetX: 8, offsetY: 8, color: "rgba(0, 0, 0, 0.5)" },
    { blur: 20, offsetX: 6, offsetY: 6, color: theme.shadowColor },
    { blur: 15, offsetX: 4, offsetY: 4, color: theme.accentColor },
    { blur: 10, offsetX: 2, offsetY: 2, color: theme.heartColor }
  ];

  shadowLayers.forEach(shadow => {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.fillStyle = theme.textColor;
    ctx.fillText(text, x, y);
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const gradient = ctx.createLinearGradient(x - 100, y - fontSize/2, x + 100, y + fontSize/2);
  gradient.addColorStop(0, theme.textColor);
  gradient.addColorStop(0.5, "#ffffff");
  gradient.addColorStop(1, theme.textColor);
  ctx.fillStyle = gradient;
  ctx.fillText(text, x, y);

  ctx.strokeStyle = theme.heartColor;
  ctx.lineWidth = 2;
  ctx.strokeText(text, x, y);
}

function drawEnhancedLoveBar(ctx, percentage, x, y, width, height, theme) {
  ctx.shadowColor = theme.accentColor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.roundRect(x - 5, y - 5, width + 10, height + 10, 20);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.roundRect(x, y, width, height, 15);
  ctx.fill();

  const barWidth = (width * percentage) / 100;

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, theme.heartColor);
  gradient.addColorStop(0.3, theme.accentColor);
  gradient.addColorStop(0.7, theme.secondary);
  gradient.addColorStop(1, theme.heartColor);

  ctx.fillStyle = gradient;
  ctx.shadowColor = theme.heartColor;
  ctx.shadowBlur = 25;

  ctx.roundRect(x, y, barWidth, height, 15);
  ctx.fill();

  const shineGradient = ctx.createLinearGradient(x, y, x, y + height);
  shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  shineGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
  shineGradient.addColorStop(1, "rgba(255, 255, 255, 0.1)");

  ctx.fillStyle = shineGradient;
  ctx.shadowBlur = 0;
  ctx.roundRect(x, y, barWidth, height/3, 15);
  ctx.fill();

  ctx.strokeStyle = theme.heartColor;
  ctx.lineWidth = 4;
  ctx.shadowColor = theme.heartColor;
  ctx.shadowBlur = 15;
  ctx.roundRect(x, y, width, height, 15);
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  drawEnhancedText(ctx, `${percentage}%`, x + width/2, y + height/2, 24, theme);

  for (let i = 0; i < 8; i++) {
    const heartX = x + (i * width/7) + Math.random() * 20;
    const heartY = y - 15 - Math.random() * 10;
    drawEnhancedHeart(ctx, heartX, heartY, 8, theme.accentColor, 8);
  }
}

function drawMagicalAvatarFrame(ctx, x, y, size, theme) {
  const centerX = x + size/2;
  const centerY = y + size/2;
  const radius = size/2;

  const rings = [
    { radius: radius + 25, width: 10, color: theme.secondary, blur: 25 },
    { radius: radius + 18, width: 8, color: theme.accentColor, blur: 20 },
    { radius: radius + 12, width: 6, color: theme.heartColor, blur: 15 },
    { radius: radius + 6, width: 4, color: "#ffffff", blur: 10 }
  ];

  rings.forEach(ring => {
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = ring.blur;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  const decorations = 12;
  for (let i = 0; i < decorations; i++) {
    const angle = (i * Math.PI * 2) / decorations;
    const decorX = centerX + Math.cos(angle) * (radius + 35);
    const decorY = centerY + Math.sin(angle) * (radius + 35);

    if (i % 3 === 0) {
      drawEnhancedHeart(ctx, decorX - 8, decorY - 8, 16, theme.heartColor, 15);
    } else if (i % 3 === 1) {
      ctx.font = "20px Arial";
      ctx.fillStyle = theme.accentColor;
      const symbol = decorativeSymbols[Math.floor(Math.random() * decorativeSymbols.length)];
      ctx.fillText(symbol, decorX, decorY);
    } else {
      drawAdvancedSparkle(ctx, decorX, decorY, 6, theme);
    }
  }

  ctx.strokeStyle = theme.heartColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  ctx.shadowColor = theme.heartColor;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawRomanticPattern(ctx, width, height, theme) {
  const patterns = ["♥", "♡", "♦", "♧", "✦", "✧"];
  
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 12 + Math.random() * 18;
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    ctx.font = `${size}px Arial`;
    ctx.fillStyle = theme.secondary;
    ctx.globalAlpha = 0.3 + Math.random() * 0.4;
    ctx.fillText(pattern, x, y);
  }
  ctx.globalAlpha = 1;
}

async function getTargetUser(chatId, bot, msg, args) {
  let targetID = null;
  
  if (msg.reply_to_message) {
    targetID = msg.reply_to_message.from.id;
  }
  else if (msg.entities && msg.entities.length > 0) {
    const mention = msg.entities.find(e => e.type === 'mention' || e.type === 'text_mention');
    if (mention) {
      if (mention.type === 'text_mention') {
        targetID = mention.user.id;
      } else if (mention.type === 'mention') {
        const username = msg.text.substring(mention.offset, mention.offset + mention.length).replace('@', '');
        try {
          const chat = await bot.getChat(chatId);
          if (chat.type === 'private') {
          } else {
            const admins = await bot.getChatAdministrators(chatId);
            const admin = admins.find(a => a.user.username === username);
            if (admin) targetID = admin.user.id;
          }
        } catch (e) {}
      }
    }
  }
  else if (args[1] && /^\d+$/.test(args[1])) {
    targetID = args[1];
  }
  else {
    try {
      const admins = await bot.getChatAdministrators(chatId);
      const botInfo = await bot.getMe();
      const botID = botInfo.id;
      const senderID = msg.from.id;
      
      let candidates = admins
        .filter(admin => admin.user.id !== senderID && admin.user.id !== botID && !admin.user.is_bot)
        .map(admin => admin.user);

      if (candidates.length === 0) {
        const chat = await bot.getChat(chatId);
        if (chat.type === 'private') {
        } else {
          return null;
        }
      }

      if (candidates.length > 0) {
        targetID = candidates[Math.floor(Math.random() * candidates.length)].id;
      } else {
        return null;
      }
    } catch (error) {
      console.log("Error getting target user:", error.message);
      return null;
    }
  }
  
  return targetID;
}

async function onStart({ bot, msg, chatId, args }) {
  try {
    const processingMsg = await bot.sendMessage(chatId, "💫 Création de votre couple romantique...", { reply_to_message_id: msg.message_id });

    const themeNames = Object.keys(romanticThemes);
    let selectedTheme = "paradise";

    const themeArg = args[0] ? args[0].toLowerCase() : null;
    if (themeArg && themeNames.includes(themeArg)) {
      selectedTheme = themeArg;
    } else {
      selectedTheme = themeNames[Math.floor(Math.random() * themeNames.length)];
    }

    const theme = romanticThemes[selectedTheme];

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.ensureDirSync(cacheDir);
    }

    let pathImg = path.join(cacheDir, `romance_${Date.now()}.png`);
    let pathAvt1 = path.join(cacheDir, `avt1_${Date.now()}.png`);
    let pathAvt2 = path.join(cacheDir, `avt2_${Date.now()}.png`);

    const id1 = msg.from.id;

    const id2 = await getTargetUser(chatId, bot, msg, args);
    if (!id2) {
      await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
      return bot.sendMessage(chatId, "❌ Aucun utilisateur approprié trouvé pour le pairing. Essayez de mentionner quelqu'un ou assurez-vous qu'il y a d'autres utilisateurs dans le groupe !", { reply_to_message_id: msg.message_id });
    }

    let name1, name2;
    try {
      if (id1.toString() === id2.toString()) {
        await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
        return bot.sendMessage(chatId, "❌ Vous ne pouvez pas vous pairer avec vous-même !", { reply_to_message_id: msg.message_id });
      }

      const user1 = await bot.getChatMember(chatId, id1);
      const user2 = await bot.getChatMember(chatId, id2);
      
      name1 = user1.user.first_name || "Utilisateur 1";
      name2 = user2.user.first_name || "Utilisateur 2";
      
      if (user1.user.last_name) name1 += " " + user1.user.last_name;
      if (user2.user.last_name) name2 += " " + user2.user.last_name;
    } catch (error) {
      console.log("Error getting user names:", error);
      name1 = "Utilisateur 1";
      name2 = "Utilisateur 2";
    }

    const specialPercentages = [88, 92, 95, 97, 89, 93, 96, 98, 99, 91, 94, 87, 90, 100];
    const lovePercentage = specialPercentages[Math.floor(Math.random() * specialPercentages.length)];

    const fetchAvatar = async (userId) => {
      try {
        const photos = await bot.getUserProfilePhotos(userId, 0, 1);
        if (photos.total_count > 0) {
          const fileId = photos.photos[0][0].file_id;
          const fileLink = await bot.getFileLink(fileId);
          const res = await axios.get(fileLink, { responseType: "arraybuffer" });
          return await loadImage(Buffer.from(res.data));
        }
        throw new Error("No profile photo");
      } catch (e) {
        const fallbackCanvas = createCanvas(500, 500);
        const fctx = fallbackCanvas.getContext("2d");
        
        const gradient = fctx.createLinearGradient(0, 0, 500, 500);
        gradient.addColorStop(0, "#ff6b9d");
        gradient.addColorStop(1, "#c471ed");
        fctx.fillStyle = gradient;
        fctx.fillRect(0, 0, 500, 500);
        
        fctx.fillStyle = "#ffffff";
        fctx.font = "bold 200px Arial";
        fctx.textAlign = "center";
        fctx.textBaseline = "middle";
        fctx.fillText("❤️", 250, 250);
        
        return fallbackCanvas;
      }
    };

    const [avatar1, avatar2] = await Promise.all([
      fetchAvatar(id1),
      fetchAvatar(id2)
    ]);

    const width = 1400;
    const height = 800;
    let canvas = createCanvas(width, height);
    let ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    theme.background(ctx, width, height);

    drawRomanticPattern(ctx, width, height, theme);
    drawFloatingElements(ctx, width, height, theme);
    drawMagicalBorder(ctx, width, height, theme);

    const avatarSize = 220;
    const avatar1X = 180;
    const avatar2X = width - 180 - avatarSize;
    const avatarY = 220;

    drawMagicalAvatarFrame(ctx, avatar1X, avatarY, avatarSize, theme);
    drawMagicalAvatarFrame(ctx, avatar2X, avatarY, avatarSize, theme);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatar1X + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar1, avatar1X, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatar2X + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar2, avatar2X, avatarY, avatarSize, avatarSize);
    ctx.restore();

    const heartX = width / 2;
    const heartY = avatarY + avatarSize/2;
    drawEnhancedHeart(ctx, heartX - 30, heartY - 30, 60, theme.heartColor, 30);

    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = theme.accentColor;
    ctx.shadowBlur = 15;
    ctx.setLineDash([15, 10]);

    ctx.beginPath();
    ctx.moveTo(avatar1X + avatarSize, avatarY + avatarSize/2);
    ctx.lineTo(heartX - 30, heartY);
    ctx.moveTo(heartX + 30, heartY);
    ctx.lineTo(avatar2X, avatarY + avatarSize/2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const x1 = avatar1X + avatarSize + t * (heartX - 30 - (avatar1X + avatarSize));
      const y1 = avatarY + avatarSize/2;
      const x2 = heartX + 30 + t * (avatar2X - (heartX + 30));
      const y2 = avatarY + avatarSize/2;

      drawEnhancedHeart(ctx, x1 - 6, y1 - 6, 12, theme.secondary, 8);
      drawEnhancedHeart(ctx, x2 - 6, y2 - 6, 12, theme.secondary, 8);
    }

    drawEnhancedText(ctx, theme.name, width/2, 120, 48, theme);
    drawEnhancedText(ctx, "♥ Love Connection ♥", width/2, 180, 38, theme);
    drawEnhancedText(ctx, `${name1}`, avatar1X + avatarSize/2, avatarY + avatarSize + 80, 32, theme);
    drawEnhancedText(ctx, `${name2}`, avatar2X + avatarSize/2, avatarY + avatarSize + 80, 32, theme);

    const randomMessage = romanticMessages[Math.floor(Math.random() * romanticMessages.length)];
    drawEnhancedText(ctx, randomMessage, width/2, 580, 36, theme);

    drawEnhancedLoveBar(ctx, lovePercentage, width/2 - 250, 620, 500, 50, theme);

    drawEnhancedText(ctx, "♦ Eternal Love ♦", width/2, 700, 30, theme);

    const finalSymbols = ["♥", "♡", "♦", "♧", "✦", "✧"];
    for (let i = 0; i < 25; i++) {
      const x = 50 + Math.random() * (width - 100);
      const y = 50 + Math.random() * (height - 100);
      const symbol = finalSymbols[Math.floor(Math.random() * finalSymbols.length)];
      ctx.font = `${15 + Math.random() * 10}px Arial`;
      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(symbol, x, y);
    }
    ctx.globalAlpha = 1;

    const imageBuffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pathImg, imageBuffer);

    if (fs.existsSync(pathAvt1)) fs.removeSync(pathAvt1);
    if (fs.existsSync(pathAvt2)) fs.removeSync(pathAvt2);

    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});

    const caption = 
      `💕 ${randomMessage} 💕\n\n` +
      `♥ ${name1} ♡ ${name2} ♥\n` +
      `💖 Compatibilité: ${lovePercentage}%\n` +
      `🎨 Thème: ${theme.name}`;

    await bot.sendPhoto(chatId, fs.createReadStream(pathImg), {
      caption: caption,
      reply_to_message_id: msg.message_id
    });

    if (fs.existsSync(pathImg)) fs.removeSync(pathImg);

  } catch (err) {
    console.error("Enhanced Pair command error:", err);
    return bot.sendMessage(chatId, `❌ Une erreur est survenue lors de la création de votre couple romantique: ${err.message}`, { reply_to_message_id: msg.message_id });
  }
}

module.exports = { nix, onStart };