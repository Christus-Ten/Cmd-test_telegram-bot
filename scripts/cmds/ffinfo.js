const axios = require('axios');
const fs = require('fs');
const path = require('path');

const nix = {
  name: "ffinfo",
  version: "1.1.0",
  aliases: ["freefire", "ff", "fire"],
  description: "Obtenir des informations détaillées sur un joueur Free Fire par UID et serveur",
  author: "Aryan Chauhan • Converti par Christus",
  prefix: true,
  category: "info",
  role: 0,
  cooldown: 5,
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

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const input = args.join(" ");
  const [uidRaw, serverRaw] = input.split("|").map(t => t?.trim());
  const uid = uidRaw;
  const serverKey = serverRaw?.toUpperCase();

  if (!uid || !serverKey) {
    return bot.sendMessage(chatId,
      `❌ 𝗨𝘁𝗶𝗹𝗶𝘀𝗮𝘁𝗶𝗼𝗻\n━━━━━━━━━\n\n` +
      `🎮 /ffinfo <uid> | <serveur>\n\n` +
      `🌍 𝗦𝗲𝗿𝘃𝗲𝘂𝗿𝘀 𝗱𝗶𝘀𝗽𝗼𝗻𝗶𝗯𝗹𝗲𝘀:\n` +
      `SG, BD, RU, ID, TW, US, VN, TH, ME, PK, CIS, BR, IND`,
      { reply_to_message_id: msg.message_id }
    );
  }

  if (!SERVERS[serverKey]) {
    return bot.sendMessage(chatId,
      `❌ 𝗦𝗲𝗿𝘃𝗲𝘂𝗿 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━\n\n` +
      `🌍 Serveurs disponibles: SG, BD, RU, ID, TW, US, VN, TH, ME, PK, CIS, BR, IND`,
      { reply_to_message_id: msg.message_id }
    );
  }

  try {
    const infoUrl = `https://ffapii.vercel.app/get_player_personal_show?server=${SERVERS[serverKey]}&uid=${uid}`;
    const { data } = await axios.get(infoUrl, { timeout: 15000 });

    if (!data?.basicinfo) {
      return bot.sendMessage(chatId,
        `❌ 𝗝𝗼𝘂𝗲𝘂𝗿 𝗶𝗻𝘁𝗿𝗼𝘂𝘃𝗮𝗯𝗹𝗲\n━━━━━━━━━━━━━━\n\n` +
        `🎮 UID: ${uid}\n🌍 Serveur: ${serverKey}\n\n` +
        `⚠️ Vérifiez l'UID et le serveur et réessayez.`,
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

    const msgFormatted =
      `🎮 𝗙𝗿𝗲𝗲 𝗙𝗶𝗿𝗲 𝗜𝗻𝗳𝗼\n━━━━━━━━━━━━\n\n` +
      `🌍 𝗦𝗲𝗿𝘃𝗲𝘂𝗿: ${serverKey}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `👤 𝗖𝗢𝗠𝗣𝗧𝗘\n` +
      `• 𝗣𝘀𝗲𝘂𝗱𝗼: ${b.nickname}\n` +
      `• 𝗨𝗜𝗗: ${b.accountid}\n` +
      `• 𝗥𝗲́𝗴𝗶𝗼𝗻: ${b.region}\n` +
      `• 𝗧𝘆𝗽𝗲 𝗱𝗲 𝗰𝗼𝗺𝗽𝘁𝗲: ${b.accounttype}\n` +
      `• 𝗡𝗶𝘃𝗲𝗮𝘂: ${b.level}\n` +
      `• 𝗘𝗫𝗣: ${b.exp}\n` +
      `• 𝗟𝗶𝗸𝗲𝘀: ❤️ ${b.liked}\n` +
      `• 𝗜𝗗 𝗱𝘂 𝘁𝗶𝘁𝗿𝗲: ${b.title}\n` +
      `• 𝗜𝗗 𝗱𝗲 𝗹𝗮 𝗯𝗮𝗻𝗻𝗶𝗲̀𝗿𝗲: ${b.bannerid}\n` +
      `• 𝗖𝗮𝗱𝗿𝗲 𝗱'𝗮𝘃𝗮𝘁𝗮𝗿: ${b.avatarframe}\n` +
      `• 𝗖𝗿𝗲́𝗲 𝗹𝗲: ${unix(b.createat)}\n` +
      `• 𝗗𝗲𝗿𝗻𝗶𝗲̀𝗿𝗲 𝗰𝗼𝗻𝗻𝗲𝘅𝗶𝗼𝗻: ${unix(b.lastloginat)}\n` +
      `• 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 𝗱𝘂 𝗷𝗲𝘂: ${b.releaseversion}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `🎖 𝗕𝗔𝗗𝗚𝗘𝗦\n` +
      `• 𝗧𝗼𝘁𝗮𝗹 𝗯𝗮𝗱𝗴𝗲𝘀: ${b.badgecnt}\n` +
      `• 𝗜𝗗 𝗱𝘂 𝗯𝗮𝗱𝗴𝗲: ${b.badgeid}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `🏆 𝗥𝗔𝗡𝗚𝗦\n` +
      `• 𝗥𝗮𝗻𝗴 𝗕𝗥: ${b.rank}\n` +
      `• 𝗣𝗼𝗶𝗻𝘁𝘀 𝗕𝗥: ${b.rankingpoints}\n` +
      `• 𝗥𝗮𝗻𝗴 𝗕𝗥 𝗺𝗮𝘅: ${b.maxrank}\n` +
      `• 𝗥𝗮𝗻𝗴 𝗖𝗦: ${b.csrank}\n` +
      `• 𝗣𝗼𝗶𝗻𝘁𝘀 𝗖𝗦: ${b.csrankingpoints}\n` +
      `• 𝗥𝗮𝗻𝗴 𝗖𝗦 𝗺𝗮𝘅: ${b.csmaxrank}\n` +
      `• 𝗜𝗗 𝗱𝗲 𝗹𝗮 𝘀𝗮𝗶𝘀𝗼𝗻: ${b.seasonid}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `🐾 𝗔𝗡𝗜𝗠𝗔𝗟 𝗗𝗘 𝗖𝗢𝗠𝗣𝗔𝗚𝗡𝗜𝗘\n` +
      `• 𝗡𝗼𝗺: ${petName}\n` +
      `• 𝗜𝗗: ${p.id || "N/A"}\n` +
      `• 𝗡𝗶𝘃𝗲𝗮𝘂: ${p.level || "N/A"}\n` +
      `• 𝗘𝗫𝗣: ${p.exp || "N/A"}\n` +
      `• 𝗜𝗗 𝗱𝘂 𝘀𝗸𝗶𝗻: ${p.skinid || "N/A"}\n` +
      `• 𝗜𝗗 𝗱𝗲 𝗹𝗮 𝗰𝗼𝗺𝗽𝗲́𝘁𝗲𝗻𝗰𝗲: ${p.selectedskillid || "N/A"}\n` +
      `• 𝗦𝗲́𝗹𝗲𝗰𝘁𝗶𝗼𝗻𝗻𝗲́: ${p.isselected ? "Oui" : "Non"}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `🏰 𝗖𝗟𝗔𝗡\n` +
      `• 𝗡𝗼𝗺 𝗱𝘂 𝗰𝗹𝗮𝗻: ${clan.clanname || "Pas de clan"}\n` +
      `• 𝗜𝗗 𝗱𝘂 𝗰𝗹𝗮𝗻: ${clan.clanid || "N/A"}\n` +
      `• 𝗡𝗶𝘃𝗲𝗮𝘂 𝗱𝘂 𝗰𝗹𝗮𝗻: ${clan.clanlevel || "N/A"}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `🌐 𝗦𝗢𝗖𝗜𝗔𝗟\n` +
      `• 𝗚𝗲𝗻𝗿𝗲: ${cleanEnum(s.gender)}\n` +
      `• 𝗟𝗮𝗻𝗴𝘂𝗲: ${cleanEnum(s.language)}\n` +
      `• 𝗧𝗲𝗺𝗽𝘀 𝗱𝗲 𝗷𝗲𝘂: ${cleanEnum(s.timeactive)}\n` +
      `• 𝗠𝗼𝗱𝗲 𝗽𝗿𝗲́𝗳𝗲́𝗿𝗲́: ${cleanEnum(s.modeprefer)}\n` +
      `• 𝗔𝗳𝗳𝗶𝗰𝗵𝗮𝗴𝗲 𝗱𝘂 𝗿𝗮𝗻𝗴: ${cleanEnum(s.rankshow)}\n\n` +
      
      `📝 𝗦𝗜𝗚𝗡𝗔𝗧𝗨𝗥𝗘\n${s.signature || "Aucune"}\n\n` +
      
      `━━━━━━━━━━━━\n` +
      `🛡 𝗖𝗢𝗡𝗙𝗜𝗔𝗡𝗖𝗘\n` +
      `• 𝗦𝗰𝗼𝗿𝗲 𝗱𝗲 𝗰𝗿𝗲́𝗱𝗶𝘁: ${c.creditscore || "N/A"}\n` +
      `• 𝗦𝘁𝗮𝘁𝘂𝘁: ${creditStatus(c.creditscore)}\n` +
      `• 𝗘́𝘁𝗮𝘁 𝗱𝗲 𝗹𝗮 𝗿𝗲́𝗰𝗼𝗺𝗽𝗲𝗻𝘀𝗲: ${cleanEnum(c.rewardstate)}\n` +
      `• 𝗙𝗶𝗻 𝗱𝗲 𝗽𝗲́𝗿𝗶𝗼𝗱𝗲: ${unix(c.periodicsummaryendtime)}\n` +
      `• 𝗖𝗼𝗺𝗽𝘁𝗲 𝘀𝗲́𝗰𝘂𝗿𝗶𝘀𝗲́: ${typeof c.creditscore === "number" ? (c.creditscore >= 90 ? "Oui ✅" : "Non ⚠️") : "Inconnu"}`;

    let attachment = null;
    let imgPath = null;

    try {
      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      imgPath = path.join(cacheDir, `ff_${uid}.jpg`);
      const img = await axios.get(`https://profile.thug4ff.com/api/profile?uid=${uid}`, {
        responseType: "arraybuffer",
        timeout: 8000
      });
      fs.writeFileSync(imgPath, img.data);
      
      await bot.sendPhoto(chatId, imgPath, {
        caption: msgFormatted,
        reply_to_message_id: msg.message_id
      });

      fs.unlinkSync(imgPath);
    } catch (imgErr) {
      await bot.sendMessage(chatId, msgFormatted, {
        reply_to_message_id: msg.message_id
      });
    }

  } catch (error) {
    console.error("FF Info error:", error);
    return bot.sendMessage(chatId,
      `⚠️ 𝗘𝗿𝗿𝗲𝘂𝗿\n━━━━━━━━\n\n` +
      `Impossible de récupérer les données Free Fire. Veuillez réessayer plus tard.`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

module.exports = { onStart, nix };
