const axios = require('axios');
const defaultEmojiTranslate = "🌐";

const nix = {
  name: "translate",
  aliases: ["trans", "dich", "traduire"],
  version: "1.5",
  author: "NTKhang | Adapté pour Nix",
  description: "Traduire du texte vers la langue souhaitée",
  prefix: true,
  category: "utility",
  role: 0,
  cooldown: 5,
  guide: "{p}translate <texte>: Traduit le texte vers la langue du groupe ou du bot\n" +
         "{p}translate <texte> -> <code>: Traduit vers une langue spécifique\n" +
         "{p}translate -r [on|off]: Active/désactive la trad par réaction\n" +
         "{p}translate -r set: Définit l'emoji de traduction"
};

async function translate(text, langCode) {
  const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);
  return {
    text: res.data[0].map(item => item[0]).join(''),
    lang: res.data[2]
  };
}

async function translateAndSendMessage(chatId, content, langCodeTrans, bot, msg, getLang) {
  const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
  return bot.sendMessage(chatId, 
    `${text}\n\n🌐 Traduit de ${lang} vers ${langCodeTrans}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const userId = msg.from.id.toString();
  const threadId = chatId.toString();

  if (["-r", "-react", "-reaction"].includes(args[0])) {
    if (args[1] === "set") {
      const sentMsg = await bot.sendMessage(chatId, 
        "🌀 Veuillez réagir à ce message avec l'emoji que vous voulez utiliser pour la traduction",
        { reply_to_message_id: msg.message_id }
      );

      global.teamnix.replies.set(sentMsg.message_id, {
        nix,
        type: "translate_set_emoji",
        authorId: userId,
        threadId: threadId,
        messageId: sentMsg.message_id
      });
      return;
    }

    const isEnable = args[1] === "on" ? true : args[1] === "off" ? false : null;
    if (isEnable === null) {
      return bot.sendMessage(chatId, "❌ Argument invalide, choisissez on ou off",
        { reply_to_message_id: msg.message_id });
    }

    const threadData = getDatabase('translate_settings');
    if (!threadData[threadId]) threadData[threadId] = {};
    threadData[threadId].autoTranslateWhenReaction = isEnable;
    saveDatabase('translate_settings', threadData);

    return bot.sendMessage(chatId,
      isEnable 
        ? `✅ Traduction par réaction activée ! Réagissez avec "${defaultEmojiTranslate}" à un message pour le traduire`
        : "✅ Traduction par réaction désactivée",
      { reply_to_message_id: msg.message_id }
    );
  }

  const threadData = getDatabase('translate_settings');
  const langOfThread = threadData[threadId]?.lang || 'fr';
  const messageText = msg.text || "";
  let content;
  let langCodeTrans;

  if (msg.reply_to_message) {
    content = msg.reply_to_message.text || msg.reply_to_message.caption || "";
    const lastIndexSeparator = messageText.lastIndexOf("->") !== -1 
      ? messageText.lastIndexOf("->") 
      : messageText.lastIndexOf("=>");

    if (lastIndexSeparator !== -1 && (messageText.length - lastIndexSeparator <= 5)) {
      langCodeTrans = messageText.slice(lastIndexSeparator + 2).trim();
    } else if (args[0] && args[0].match(/^\w{2,3}$/)) {
      langCodeTrans = args[0];
    } else {
      langCodeTrans = langOfThread;
    }
  } else {
    content = messageText;
    const lastIndexSeparator = content.lastIndexOf("->") !== -1 
      ? content.lastIndexOf("->") 
      : content.lastIndexOf("=>");

    if (lastIndexSeparator !== -1 && (content.length - lastIndexSeparator <= 5)) {
      langCodeTrans = content.slice(lastIndexSeparator + 2).trim();
      content = content.slice(0, lastIndexSeparator).trim();
    } else {
      langCodeTrans = langOfThread;
    }
  }

  if (!content || content === "") {
    return bot.sendMessage(chatId, 
      "❌ Veuillez fournir du texte à traduire ou répondre à un message",
      { reply_to_message_id: msg.message_id }
    );
  }

  await translateAndSendMessage(chatId, content, langCodeTrans, bot, msg);
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "translate_set_emoji" || userId !== data.authorId) return;

  const reaction = msg.text || "";
  if (!reaction || reaction.length > 2) {
    return bot.sendMessage(chatId, 
      "❌ Veuillez envoyer un seul emoji valide",
      { reply_to_message_id: msg.message_id }
    );
  }

  const threadData = getDatabase('translate_settings');
  if (!threadData[data.threadId]) threadData[data.threadId] = {};
  threadData[data.threadId].emojiTranslate = reaction;
  saveDatabase('translate_settings', threadData);

  await bot.sendMessage(chatId,
    `✅ L'emoji de traduction est maintenant : ${reaction}`,
    { reply_to_message_id: msg.message_id }
  );

  global.teamnix.replies.delete(replyMsg.message_id);
}

async function onReaction({ bot, message, msg, chatId, userId, reaction, data }) {
  if (data.type !== "translate_message") return;

  const threadData = getDatabase('translate_settings');
  const emojiTrans = threadData[chatId]?.emojiTranslate || "🌐";
  
  if (reaction !== emojiTrans) return;

  const content = data.messageText;
  if (!content) return;

  const langCodeTrans = threadData[chatId]?.lang || 'fr';
  
  await translateAndSendMessage(chatId, content, langCodeTrans, bot, msg);
}

function getDatabase(dbName) {
  const dbPath = path.join(process.cwd(), 'database', `${dbName}.json`);
  const dbDir = path.join(process.cwd(), 'database');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}));
  }
  
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDatabase(dbName, data) {
  const dbPath = path.join(process.cwd(), 'database', `${dbName}.json`);
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Hook pour intercepter les réactions aux messages
// À appeler dans le handler principal des réactions
async function handleReaction({ bot, message, msg, chatId, userId, reaction, messageId }) {
  const replyData = global.teamnix.replies.get(messageId);
  if (replyData && replyData.nix.name === "translate") {
    await onReaction({ bot, message, msg, chatId, userId, reaction, data: replyData });
  }
}

module.exports = { onStart, onReply, nix, handleReaction };
