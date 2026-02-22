const axios = require('axios');
const fs = require('fs');
const path = require('path');

const nix = {
  name: "ffinfo",
  version: "1.1.0",
  aliases: ["freefire", "ff", "garena"],
  description: "Obtenir des informations détaillées sur un joueur Free Fire par UID et serveur",
  author: "Christus",
  prefix: true,
  category: "info",
  role: 0,
  cooldown: 10,
  guide: "{p}ffinfo <uid> | <serveur>\nServeurs disponibles: SG, BD, RU, ID, TW, US, VN, TH, ME, PK, CIS, BR, IND"
};

const SERVERS = {
  SG: "sg", BD: "bd", RU: "ru", ID: "id", TW: "tw",
  US: "us", VN: "vn", TH: "th", ME: "me", PK: "pk",
  CIS: "cis", BR: "br", IND: "ind"
};

const PET_NAMES = {
  1300000041: "Falco",
  1300000042: "Ottero",
  1300000043: "Mr. Waggor",
  1300000044: "Poring",
  1300000045: "Detective Panda",
  1300000046: "Night Panther",
  1300000047: "Beaston",
  1300000048: "Rockie",
  1300000049: "Moony",
  1300000050: "Dreki",
  1300000051: "Arvon"
};

function unix(ts) {
  if (!ts) return "N/A";
  return new Date(Number(ts) * 1000).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris"
  });
}

function cleanEnum(v) {
  if (!v) return "N/A";
  return v
    .replace(/(GENDER|LANGUAGE|TIMEACTIVE|MODEPREFER|RANKSHOW|REWARDSTATE|EXTERNALICONSTATUS|EXTERNALICONSHOWTYPE)/g, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function creditStatus(score) {
  if (typeof score !== "number") return "Inconnu";
  if (score >= 90) return "Excellent 🟢";
  if (score >= 70) return "Bon 🟡";
  if (score >= 50) return "Moyen 🟠";
  return "Faible 🔴";
}

async function onStart({ bot, msg, chatId, args }) {
  const input = args.join(" ");
  const parts = input.split("|").map(p => p?.trim());
  
  const uid = parts[0];
  const serverKey = parts[1]?.toUpperCase();

  if (!uid || !serverKey) {
    return bot.sendMessage(chatId, 
      "❌ UID et serveur requis. Exemple: /ffinfo 1234567890 | IND",
      { reply_to_message_id: msg.message_id }
    );
  }

  if (!SERVERS[serverKey]) {
    return bot.sendMessage(chatId, 
      "❌ Serveur invalide. Disponibles: SG, BD, RU, ID, TW, US, VN, TH, ME, PK, CIS, BR, IND",
      { reply_to_message_id: msg.message_id }
    );
  }

  const loadingMsg = await bot.sendMessage(chatId, 
    "🔍 Recherche des informations du joueur...",
    { reply_to_message_id: msg.message_id }
  );

  try {
    const infoUrl = `https://ffapii.vercel.app/get_player_personal_show?server=${SERVERS[serverKey]}&uid=${uid}`;
    const { data } = await axios.get(infoUrl, { timeout: 15000 });

    if (!data?.basicinfo) {
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      return bot.sendMessage(chatId, 
        "❌ Joueur introuvable ! Vérifiez l'UID et le serveur.",
        { reply_to_message_id: msg.message_id }
      );
    }

    const b = data.basicinfo;
    const pr = data.profileinfo || {};
    const p = data.petinfo || {};
    const s = data.socialinfo || {};
    const c = data.creditscoreinfo || {};
    const clan = data.clanbasicinfo || {};

    const petName = PET_NAMES[p.id] || "Inconnu";

    const msgText =
`🎮 𝗙𝗿𝗲𝗲 𝗙𝗶𝗿𝗲 - 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻𝘀 𝗝𝗼𝘂𝗲𝘂𝗿
━━━━━━━━━━━━━━━━━━━━━

🌍 𝗦𝗲𝗿𝘃𝗲𝘂𝗿: ${serverKey}

👤 𝗖𝗢𝗠𝗣𝗧𝗘
• 𝗣𝘀𝗲𝘂𝗱𝗼: ${b.nickname}
• 𝗨𝗜𝗗: ${b.accountid}
• 𝗥𝗲́𝗴𝗶𝗼𝗻: ${b.region}
• 𝗧𝘆𝗽𝗲: ${b.accounttype}
• 𝗡𝗶𝘃𝗲𝗮𝘂: ${b.level}
• 𝗘𝗫𝗣: ${b.exp}
• 𝗟𝗶𝗸𝗲𝘀: ❤️ ${b.liked}
• 𝗧𝗶𝘁𝗿𝗲 𝗜𝗗: ${b.title}
• 𝗖𝗿𝗲́𝗲́ 𝗹𝗲: ${unix(b.createat)}
• 𝗗𝗲𝗿𝗻𝗶𝗲̀𝗿𝗲 𝗰𝗼𝗻𝗻𝗲𝘅𝗶𝗼𝗻: ${unix(b.lastloginat)}

━━━━━━━━━━━━━━━━━━━━━
🏆 𝗥𝗔𝗡𝗚𝗦
• 𝗕𝗥: ${b.rank} (${b.rankingpoints} pts)
• 𝗠𝗮𝘅 𝗕𝗥: ${b.maxrank}
• 𝗖𝗦: ${b.csrank} (${b.csrankingpoints} pts)
• 𝗠𝗮𝘅 𝗖𝗦: ${b.csmaxrank}

━━━━━━━━━━━━━━━━━━━━━
🐾 𝗣𝗘𝗧
• 𝗡𝗼𝗺: ${petName}
• 𝗡𝗶𝘃𝗲𝗮𝘂: ${p.level || "N/A"}
• 𝗘𝗫𝗣: ${p.exp || "N/A"}

━━━━━━━━━━━━━━━━━━━━━
🏰 𝗖𝗟𝗔𝗡
• 𝗡𝗼𝗺: ${clan.clanname || "Pas de clan"}
• 𝗜𝗗: ${clan.clanid || "N/A"}
• 𝗡𝗶𝘃𝗲𝗮𝘂: ${clan.clanlevel || "N/A"}

━━━━━━━━━━━━━━━━━━━━━
🌐 𝗦𝗢𝗖𝗜𝗔𝗟
• 𝗚𝗲𝗻𝗿𝗲: ${cleanEnum(s.gender)}
• 𝗟𝗮𝗻𝗴𝘂𝗲: ${cleanEnum(s.language)}
• 𝗠𝗼𝗱𝗲 𝗽𝗿𝗲́𝗳𝗲́𝗿𝗲́: ${cleanEnum(s.modeprefer)}
• 𝗦𝗶𝗴𝗻𝗮𝘁𝘂𝗿𝗲: ${s.signature || "Aucune"}

━━━━━━━━━━━━━━━━━━━━━
🛡 𝗖𝗢𝗡𝗙𝗜𝗔𝗡𝗖𝗘
• 𝗦𝗰𝗼𝗿𝗲 𝗱𝗲 𝗰𝗿𝗲́𝗱𝗶𝘁: ${c.creditscore || "N/A"}
• 𝗦𝘁𝗮𝘁𝘂𝘁: ${creditStatus(c.creditscore)}`;

    await bot.deleteMessage(chatId, loadingMsg.message_id);

    // Téléchargement et envoi de l'avatar
    try {
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imgPath = path.join(cacheDir, `ff_${uid}_${Date.now()}.jpg`);
      
      // Utilisation de l'API correcte pour l'avatar
      const img = await axios.get(`https://ffapii.vercel.app/api/profile?uid=${uid}`, {
        responseType: "arraybuffer",
        timeout: 8000
      });
      
      fs.writeFileSync(imgPath, img.data);
      
      // Envoi de la photo avec la légende
      await bot.sendPhoto(chatId, imgPath, {
        caption: msgText,
        reply_to_message_id: msg.message_id
      });
      
      // Nettoyage
      fs.unlinkSync(imgPath);
      
    } catch (imgErr) {
      console.error("Erreur téléchargement avatar:", imgErr);
      // Fallback: envoi du message sans photo
      await bot.sendMessage(chatId, msgText, {
        reply_to_message_id: msg.message_id
      });
    }

  } catch (error) {
    await bot.deleteMessage(chatId, loadingMsg.message_id);
    console.error("Erreur FF Info:", error);
    return bot.sendMessage(chatId, 
      "❌ Échec de récupération des données Free Fire. Réessayez plus tard.",
      { reply_to_message_id: msg.message_id }
    );
  }
}

module.exports = { nix, onStart };
