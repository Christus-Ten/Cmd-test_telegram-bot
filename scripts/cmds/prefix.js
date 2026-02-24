const fs = require("fs-extra");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, '../../config.json');
const THREADS_PATH = path.join(__dirname, '../../database/threads.json');

const nix = {
    name: "prefix",
    version: "1.5.0",
    aliases: ["pre", "setprefix"],
    description: "Gérer le préfixe de commande du bot",
    author: "Christus",
    prefix: true,
    category: "group",
    role: 0,
    cooldown: 5,
    guide: "{p}prefix - Voir votre préfixe actuel\n" +
           "{p}prefix <nouveau> - Changer le préfixe du groupe\n" +
           "{p}prefix <nouveau> -g - Changer le préfixe global (admin)\n" +
           "{p}prefix reset - Réinitialiser au préfixe par défaut"
};

const getThreadData = () => {
    if (!fs.existsSync(THREADS_PATH)) {
        fs.writeFileSync(THREADS_PATH, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(THREADS_PATH, 'utf8'));
};

const saveThreadData = (data) => {
    fs.writeFileSync(THREADS_PATH, JSON.stringify(data, null, 2));
};

const getConfig = () => {
    if (!fs.existsSync(CONFIG_PATH)) {
        const defaultConfig = { prefix: "!" };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
};

const saveConfig = (config) => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

const getLang = (key, ...args) => {
    const lang = {
        reset: "✅ Préfixe réinitialisé au défaut : %1",
        onlyAdmin: "❌ Seul un admin bot peut changer le préfixe global",
        confirmGlobal: "🔄 Confirmez le changement de préfixe global en : %1",
        confirmThisThread: "🔄 Confirmez le changement de préfixe du groupe en : %1",
        successGlobal: "✅ Préfixe global changé en : %1",
        successThisThread: "✅ Préfixe du groupe changé en : %1",
        currentPrefix: "👋 %1\n\n🔧 **Gestion du Préfixe**\n\n🌐 Global : `%2`\n💬 Ce groupe : `%3`\n\nPour changer :\n`%4prefix <nouveau>`\n`%4prefix reset`",
        mentionResponse: "👋 %1, voici mon préfixe pour ce groupe : `%2`\n\nUtilise `/prefix` pour plus d'options !"
    };
    let text = lang[key] || key;
    args.forEach((arg, i) => {
        text = text.replace(new RegExp(`%${i+1}`, 'g'), arg);
    });
    return text;
};

async function onStart({ bot, msg, chatId, args, role }) {
    const config = getConfig();
    const threadData = getThreadData();
    
    const globalPrefix = config.prefix || "!";
    const threadPrefix = threadData[chatId]?.prefix || globalPrefix;
    
    const mention = `[${msg.from.first_name}](tg://user?id=${msg.from.id})`;
    
    if (args.length === 0) {
        const response = getLang("currentPrefix", mention, globalPrefix, threadPrefix, globalPrefix);
        return bot.sendMessage(chatId, response, { 
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id 
        });
    }
    
    if (args[0].toLowerCase() === 'reset') {
        if (!threadData[chatId]) threadData[chatId] = {};
        delete threadData[chatId].prefix;
        saveThreadData(threadData);
        
        return bot.sendMessage(chatId, getLang("reset", globalPrefix), {
            reply_to_message_id: msg.message_id
        });
    }
    
    const newPrefix = args[0];
    const isGlobal = args[1] === '-g';
    
    if (newPrefix.length > 3) {
        return bot.sendMessage(chatId, "❌ Le préfixe ne peut pas dépasser 3 caractères.", {
            reply_to_message_id: msg.message_id
        });
    }
    
    if (newPrefix.match(/[^\w!@#$%^&*]/)) {
        return bot.sendMessage(chatId, "❌ Caractères non autorisés dans le préfixe. Utilisez !@#$%^&* ou des lettres.", {
            reply_to_message_id: msg.message_id
        });
    }
    
    if (isGlobal) {
        if (role < 2) {
            return bot.sendMessage(chatId, getLang("onlyAdmin"), {
                reply_to_message_id: msg.message_id
            });
        }
        
        const confirmMsg = await bot.sendMessage(chatId, getLang("confirmGlobal", newPrefix), {
            reply_markup: {
                inline_keyboard: [[
                    { text: "✅ Confirmer", callback_data: `prefix_global_${newPrefix}` },
                    { text: "❌ Annuler", callback_data: "prefix_cancel" }
                ]]
            },
            reply_to_message_id: msg.message_id
        });
        
        global.teamnix.replies.set(confirmMsg.message_id, {
            nix,
            type: "prefix_global",
            authorId: msg.from.id,
            newPrefix: newPrefix,
            messageId: confirmMsg.message_id
        });
        
    } else {
        const confirmMsg = await bot.sendMessage(chatId, getLang("confirmThisThread", newPrefix), {
            reply_markup: {
                inline_keyboard: [[
                    { text: "✅ Confirmer", callback_data: `prefix_thread_${newPrefix}` },
                    { text: "❌ Annuler", callback_data: "prefix_cancel" }
                ]]
            },
            reply_to_message_id: msg.message_id
        });
        
        global.teamnix.replies.set(confirmMsg.message_id, {
            nix,
            type: "prefix_thread",
            authorId: msg.from.id,
            newPrefix: newPrefix,
            messageId: confirmMsg.message_id
        });
    }
}

async function onCallback({ bot, msg, chatId, data }) {
    const callbackData = msg.data;
    const messageId = msg.message.message_id;
    
    if (!callbackData.startsWith('prefix_')) return;
    
    const replyData = global.teamnix.replies.get(messageId);
    if (!replyData || replyData.authorId !== msg.from.id) {
        return bot.answerCallbackQuery(msg.id, {
            text: "⛔ Vous n'êtes pas autorisé à effectuer cette action.",
            show_alert: true
        });
    }
    
    if (callbackData === 'prefix_cancel') {
        global.teamnix.replies.delete(messageId);
        await bot.deleteMessage(chatId, messageId);
        return bot.answerCallbackQuery(msg.id, {
            text: "✅ Opération annulée.",
            show_alert: false
        });
    }
    
    if (callbackData.startsWith('prefix_global_')) {
        const newPrefix = callbackData.replace('prefix_global_', '');
        const config = getConfig();
        config.prefix = newPrefix;
        saveConfig(config);
        
        global.teamnix.replies.delete(messageId);
        await bot.deleteMessage(chatId, messageId);
        await bot.sendMessage(chatId, getLang("successGlobal", newPrefix), {
            reply_to_message_id: msg.message.message_id
        });
        
        return bot.answerCallbackQuery(msg.id, {
            text: `✅ Préfixe global changé en ${newPrefix}`,
            show_alert: false
        });
    }
    
    if (callbackData.startsWith('prefix_thread_')) {
        const newPrefix = callbackData.replace('prefix_thread_', '');
        const threadData = getThreadData();
        if (!threadData[chatId]) threadData[chatId] = {};
        threadData[chatId].prefix = newPrefix;
        saveThreadData(threadData);
        
        global.teamnix.replies.delete(messageId);
        await bot.deleteMessage(chatId, messageId);
        await bot.sendMessage(chatId, getLang("successThisThread", newPrefix), {
            reply_to_message_id: msg.message.message_id
        });
        
        return bot.answerCallbackQuery(msg.id, {
            text: `✅ Préfixe du groupe changé en ${newPrefix}`,
            show_alert: false
        });
    }
    
    return bot.answerCallbackQuery(msg.id, {
        text: "❌ Action inconnue.",
        show_alert: false
    });
}

async function onChat({ bot, msg, chatId, message }) {
    if (message.text && message.text.toLowerCase() === "prefix") {
        const config = getConfig();
        const threadData = getThreadData();
        
        const globalPrefix = config.prefix || "!";
        const threadPrefix = threadData[chatId]?.prefix || globalPrefix;
        
        const mention = `[${message.from.first_name}](tg://user?id=${message.from.id})`;
        const response = getLang("mentionResponse", mention, threadPrefix);
        
        return bot.sendMessage(chatId, response, {
            parse_mode: 'Markdown',
            reply_to_message_id: message.message_id
        });
    }
}

module.exports = { nix, onStart, onCallback, onChat };
