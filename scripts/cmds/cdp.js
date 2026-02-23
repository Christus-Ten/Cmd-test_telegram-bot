const axios = require('axios');

const nix = {
  name: "coupledp",
  version: "3.3",
  aliases: ["cdp"],
  description: "Obtenir une image de couple aléatoire (garçon & fille)",
  author: "Christus (converted)",
  prefix: true,
  category: "love",
  role: 0,
  cooldown: 5,
  guide: "{p}cdp\n{p}cdp list"
};

async function onStart({ bot, msg, chatId, args }) {
  try {
    const processingMsg = await bot.sendMessage(chatId, "⏳ Recherche d'une image de couple...", {
      reply_to_message_id: msg.message_id
    });

    const baseRes = await axios.get(
      "https://raw.githubusercontent.com/goatbotnx/Sexy-nx2.0Updated/refs/heads/main/nx-apis.json"
    );
    const cdpBase = baseRes.data.cdp;
    if (!cdpBase) {
      throw new Error("Base d'API introuvable");
    }

    if (args[0] && args[0].toLowerCase() === "list") {
      const res = await axios.get(`${cdpBase}/cdp/list`);
      const { total_cdp } = res.data;

      await bot.deleteMessage(chatId, processingMsg.message_id);
      return bot.sendMessage(
        chatId,
        `📂 𝐁𝐢𝐛𝐥𝐢𝐨𝐭𝐡𝐞̀𝐪𝐮𝐞 𝐂𝐨𝐮𝐩𝐥𝐞 𝐃𝐏\n💑 𝐓𝐨𝐭𝐚𝐥 𝐝𝐞 𝐩𝐚𝐢𝐫𝐞𝐬 : ${total_cdp}\n🌬️ 𝐏𝐫𝐞̂𝐭 𝐚̀ 𝐥'𝐞𝐦𝐩𝐥𝐨𝐢\n\n✨ 𝐔𝐭𝐢𝐥𝐢𝐬𝐞𝐳 : /cdp`,
        { reply_to_message_id: msg.message_id }
      );
    }

    const res = await axios.get(`${cdpBase}/cdp`);
    const pair = res.data.pair;

    if (!pair || !pair.boy || !pair.girl) {
      throw new Error("Paire d'images invalide");
    }

    await bot.deleteMessage(chatId, processingMsg.message_id);

    const boyStream = await axios.get(pair.boy, { responseType: "stream" }).then(r => r.data);
    const girlStream = await axios.get(pair.girl, { responseType: "stream" }).then(r => r.data);

    await bot.sendMediaGroup(chatId, [
      { type: 'photo', media: boyStream },
      { type: 'photo', media: girlStream }
    ], {
      reply_to_message_id: msg.message_id
    });

  } catch (error) {
    console.error("CDP Error:", error);
    bot.sendMessage(chatId, "❌ Erreur lors de la récupération des images.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
}

module.exports = { onStart, onReply, nix };
