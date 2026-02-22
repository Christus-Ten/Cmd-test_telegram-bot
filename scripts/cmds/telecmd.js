const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

const nix = {
  name: "cmd",
  version: "1.18",
  author: "Christus",
  description: "Gestionnaire de commandes - load, unload, install, loadAll",
  aliases: ["cm", "command", "cmdmanager"],
  prefix: false,
  category: "admin",
  role: 1,
  cooldown: 5,
  guide: "{p}cmd <load|loadAll|unload|install> [args]\n" +
         "• {p}cmd load <nom> - Charger une commande\n" +
         "• {p}cmd loadAll - Charger toutes les commandes\n" +
         "• {p}cmd unload <nom> - Décharger une commande\n" +
         "• {p}cmd install <url> <fichier.js> - Installer depuis URL\n" +
         "• {p}cmd install <fichier.js> <code> - Installer depuis code"
};

function getDomain(url) {
  const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

function removeHomeDir(str) {
  if (!str) return str;
  const homeDir = process.cwd();
  return str.replace(new RegExp(homeDir, 'g'), '');
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const userId = msg.from.id.toString();
  
  if (!args[0] || args[0].toLowerCase() === "help") {
    return bot.sendMessage(chatId,
      "┌─❖\n" +
      "│ 🚀 𝗡𝗜𝗫 𝗕𝗢𝗧 - 𝗖𝗠𝗗 𝗠𝗔𝗡𝗔𝗚𝗘𝗥\n" +
      "├─•\n" +
      "│ 📋 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗦 𝗗𝗜𝗦𝗣𝗢𝗡𝗜𝗕𝗟𝗘𝗦:\n" +
      "│\n" +
      "│ • load <commande>\n" +
      "│   ↳ Charger une commande\n" +
      "│\n" +
      "│ • loadAll\n" +
      "│   ↳ Charger toutes les commandes\n" +
      "│\n" +
      "│ • unload <commande>\n" +
      "│   ↳ Décharger une commande\n" +
      "│\n" +
      "│ • install <url> <fichier.js>\n" +
      "│   ↳ Installer depuis URL\n" +
      "│\n" +
      "│ • install <fichier.js> <code>\n" +
      "│   ↳ Installer depuis code\n" +
      "├─•\n" +
      "│ 💡 𝗘𝗫𝗘𝗠𝗣𝗟𝗘𝗦:\n" +
      "│ • /cmd load admin\n" +
      "│ • /cmd install admin.js code\n" +
      "│ • /cmd unload admin\n" +
      "└─❖",
      { reply_to_message_id: msg.message_id }
    );
  }

  const subcmd = args[0].toLowerCase();
  const cmdFolder = path.join(__dirname, './');

  if (!global.teamnix || !global.teamnix.cmds) {
    global.teamnix = { cmds: new Map() };
  }
  const commands = global.teamnix.cmds;

  if (subcmd === "load" && args.length === 2) {
    if (!args[1]) {
      return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗡𝗼𝗺 𝗱𝗲 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗲 𝗺𝗮𝗻𝗾𝘂𝗮𝗻𝘁 !\n│ 📝 𝗩𝗲𝘂𝗶𝗹𝗹𝗲𝘇 𝗲𝗻𝘁𝗿𝗲𝗿 𝗹𝗲 𝗻𝗼𝗺 𝗱𝗲 𝗹𝗮 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗲\n└─❖",
        { reply_to_message_id: msg.message_id });
    }

    const fileName = args[1];
    const filePath = path.join(cmdFolder, `${fileName}.js`);

    if (!fs.existsSync(filePath)) {
      return bot.sendMessage(chatId, `┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗙𝗶𝗰𝗵𝗶𝗲𝗿 𝗶𝗻𝘁𝗿𝗼𝘂𝘃𝗮𝗯𝗹𝗲 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${fileName}.js\n└─❖`,
        { reply_to_message_id: msg.message_id });
    }

    try {
      delete require.cache[require.resolve(filePath)];
      const cmd = require(filePath);
      
      if (!cmd || !cmd.nix || !cmd.onStart) {
        throw new Error("Format de commande invalide");
      }

      const nameLower = cmd.nix.name.toLowerCase();
      commands.set(nameLower, cmd);
      
      if (cmd.nix.aliases && Array.isArray(cmd.nix.aliases)) {
        for (const alias of cmd.nix.aliases) {
          commands.set(alias.toLowerCase(), cmd);
        }
      }

      return bot.sendMessage(chatId,
        `┌─❖\n│ 🚀 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ✅ 𝗖𝗛𝗔𝗥𝗚𝗘𝗘 𝗔𝗩𝗘𝗖 𝗦𝗨𝗖𝗖𝗘𝗦 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${cmd.nix.name}\n│ 🎯 𝗦𝘁𝗮𝘁𝘂𝘁: 𝗔𝗰𝘁𝗶𝗳\n└─❖`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      return bot.sendMessage(chatId,
        `┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗘𝗥𝗥𝗘𝗨𝗥 𝗗𝗘 𝗖𝗛𝗔𝗥𝗚𝗘𝗠𝗘𝗡𝗧 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${fileName}\n│ ⚠️ 𝗘𝗿𝗿𝗲𝘂𝗿: ${err.message}\n└─❖`,
        { reply_to_message_id: msg.message_id }
      );
    }
  }

  else if (subcmd === "loadall") {
    const jsFiles = fs.readdirSync(cmdFolder)
      .filter(file => file.endsWith(".js") && file !== "cmd.js");

    let loaded = 0;
    let failed = 0;
    const errors = [];

    for (const file of jsFiles) {
      try {
        const filePath = path.join(cmdFolder, file);
        delete require.cache[require.resolve(filePath)];
        const cmd = require(filePath);

        if (cmd && cmd.nix && cmd.onStart) {
          const nameLower = cmd.nix.name.toLowerCase();
          commands.set(nameLower, cmd);
          
          if (cmd.nix.aliases && Array.isArray(cmd.nix.aliases)) {
            for (const alias of cmd.nix.aliases) {
              commands.set(alias.toLowerCase(), cmd);
            }
          }
          loaded++;
        } else {
          failed++;
          errors.push(`❌ ${file} → Format invalide`);
        }
      } catch (err) {
        failed++;
        errors.push(`❌ ${file} → ${err.message}`);
      }
    }

    let msgText = `┌─❖\n│ 🚀 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ✅ 𝗖𝗛𝗔𝗥𝗚𝗘𝗘𝗦: ${loaded} 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗲(s)\n`;
    if (failed > 0) {
      msgText += `│ ❌ 𝗘𝗖𝗛𝗘𝗖: ${failed} 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗲(s)\n│ 📝 𝗘𝗿𝗿𝗲𝘂𝗿𝘀:\n${errors.slice(0, 5).join('\n')}\n`;
    }
    msgText += "└─❖";

    return bot.sendMessage(chatId, msgText, { reply_to_message_id: msg.message_id });
  }

  else if (subcmd === "unload") {
    if (!args[1]) {
      return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗡𝗼𝗺 𝗱𝗲 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗲 𝗺𝗮𝗻𝗾𝘂𝗮𝗻𝘁 !\n│ 📝 𝗩𝗲𝘂𝗶𝗹𝗹𝗲𝘇 𝗲𝗻𝘁𝗿𝗲𝗿 𝗹𝗲 𝗻𝗼𝗺\n└─❖",
        { reply_to_message_id: msg.message_id });
    }

    const cmdName = args[1].toLowerCase();
    const cmd = commands.get(cmdName);

    if (!cmd) {
      return bot.sendMessage(chatId, `┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲 '${cmdName}' 𝗶𝗻𝘁𝗿𝗼𝘂𝘃𝗮𝗯𝗹𝗲 !\n└─❖`,
        { reply_to_message_id: msg.message_id });
    }

    try {
      const nameLower = cmd.nix.name.toLowerCase();
      commands.delete(nameLower);
      
      if (cmd.nix.aliases && Array.isArray(cmd.nix.aliases)) {
        for (const alias of cmd.nix.aliases) {
          commands.delete(alias.toLowerCase());
        }
      }

      return bot.sendMessage(chatId,
        `┌─❖\n│ 🚀 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ✅ 𝗗𝗘𝗖𝗛𝗔𝗥𝗚𝗘𝗘 𝗔𝗩𝗘𝗖 𝗦𝗨𝗖𝗖𝗘𝗦 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${cmd.nix.name}\n│ 🎯 𝗦𝘁𝗮𝘁𝘂𝘁: 𝗜𝗻𝗮𝗰𝘁𝗶𝗳\n└─❖`,
        { reply_to_message_id: msg.message_id }
      );
    } catch (err) {
      return bot.sendMessage(chatId,
        `┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗘𝗥𝗥𝗘𝗨𝗥 𝗗𝗘 𝗗𝗘𝗖𝗛𝗔𝗥𝗚𝗘𝗠𝗘𝗡𝗧 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${cmdName}\n│ ⚠️ 𝗘𝗿𝗿𝗲𝘂𝗿: ${err.message}\n└─❖`,
        { reply_to_message_id: msg.message_id }
      );
    }
  }

  else if (subcmd === "install") {
    let url = args[1];
    let fileName = args[2];
    let rawCode;

    if (!url || !fileName) {
      return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻𝘀 𝗺𝗮𝗻𝗾𝘂𝗮𝗻𝘁𝗲𝘀 !\n│ 📝 𝗨𝗿𝗹/𝗰𝗼𝗱𝗲 𝗲𝘁 𝗻𝗼𝗺 𝗱𝗲 𝗳𝗶𝗰𝗵𝗶𝗲𝗿 𝗿𝗲𝗾𝘂𝗶𝘀\n└─❖",
        { reply_to_message_id: msg.message_id });
    }

    if (url.endsWith(".js") && !isURL(url)) {
      const tmp = fileName;
      fileName = url;
      url = tmp;
    }

    try {
      if (url.match(/(https?:\/\/(?:www\.|(?!www)))/)) {
        if (!fileName || !fileName.endsWith(".js")) {
          return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗡𝗼𝗺 𝗱𝗲 𝗳𝗶𝗰𝗵𝗶𝗲𝗿 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲 !\n│ 📝 𝗟𝗲 𝗳𝗶𝗰𝗵𝗶𝗲𝗿 𝗱𝗼𝗶𝘁 𝗳𝗶𝗻𝗶𝗿 𝗽𝗮𝗿 .𝗷𝘀\n└─❖",
            { reply_to_message_id: msg.message_id });
        }

        const domain = getDomain(url);
        if (!domain) {
          return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗨𝗥𝗟 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲 !\n└─❖",
            { reply_to_message_id: msg.message_id });
        }

        if (domain === "pastebin.com") {
          const regex = /https:\/\/pastebin\.com\/(?!raw\/)(.*)/;
          if (url.match(regex)) {
            url = url.replace(regex, "https://pastebin.com/raw/$1");
          }
          if (url.endsWith("/")) {
            url = url.slice(0, -1);
          }
        } else if (domain === "github.com") {
          const regex = /https:\/\/github\.com\/(.*)\/blob\/(.*)/;
          if (url.match(regex)) {
            url = url.replace(regex, "https://raw.githubusercontent.com/$1/$2");
          }
        }

        const response = await axios.get(url);
        rawCode = response.data;

        if (domain === "savetext.net") {
          const $ = cheerio.load(rawCode);
          rawCode = $("#content").text();
        }
      } else {
        if (args[args.length - 1].endsWith(".js")) {
          fileName = args[args.length - 1];
          rawCode = msg.text.slice(msg.text.indexOf('install') + 7, msg.text.indexOf(fileName) - 1);
        } else if (args[1].endsWith(".js")) {
          fileName = args[1];
          rawCode = msg.text.slice(msg.text.indexOf(fileName) + fileName.length + 1);
        } else {
          return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗡𝗼𝗺 𝗱𝗲 𝗳𝗶𝗰𝗵𝗶𝗲𝗿 𝗺𝗮𝗻𝗾𝘂𝗮𝗻𝘁 !\n└─❖",
            { reply_to_message_id: msg.message_id });
        }
      }

      if (!rawCode) {
        return bot.sendMessage(chatId, "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗖𝗼𝗱𝗲 𝗶𝗻𝘁𝗿𝗼𝘂𝘃𝗮𝗯𝗹𝗲 !\n└─❖",
          { reply_to_message_id: msg.message_id });
      }

      const filePath = path.join(cmdFolder, fileName);

      if (fs.existsSync(filePath)) {
        const sentMsg = await bot.sendMessage(chatId,
          `┌─❖\n│ ⚠️ 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ 📁 𝗙𝗶𝗰𝗵𝗶𝗲𝗿 𝗱𝗲́𝗷𝗮̀ 𝗲𝘅𝗶𝘀𝘁𝗮𝗻𝘁 !\n│ 🎯 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${fileName}\n│ 📝 𝗥𝗲́𝗮𝗴𝗶𝘀𝘀𝗲𝘇 𝗽𝗼𝘂𝗿 𝗲𝗰𝗿𝗮𝘀𝗲𝗿\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );

        global.teamnix.replies.set(sentMsg.message_id, {
          nix,
          type: "cmd_install",
          authorId: userId,
          data: { fileName, rawCode }
        });
        return;
      }

      await installCommand(fileName, rawCode, cmdFolder, commands);
      return bot.sendMessage(chatId,
        `┌─❖\n│ 🚀 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ✅ 𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗧𝗜𝗢𝗡 𝗥𝗘𝗨𝗦𝗦𝗜𝗘 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${fileName}\n│ 📍 𝗣𝗮𝘁𝗵: ${removeHomeDir(filePath)}\n└─❖`,
        { reply_to_message_id: msg.message_id }
      );

    } catch (err) {
      return bot.sendMessage(chatId,
        `┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗘𝗥𝗥𝗘𝗨𝗥 𝗗'𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗧𝗜𝗢𝗡 !\n│ 📁 𝗙𝗶𝗰𝗵𝗶𝗲𝗿: ${fileName}\n│ ⚠️ 𝗘𝗿𝗿𝗲𝘂𝗿: ${err.message}\n└─❖`,
        { reply_to_message_id: msg.message_id }
      );
    }
  }

  else {
    return bot.sendMessage(chatId,
      "┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 𝗜𝗡𝗩𝗔𝗟𝗜𝗗𝗘 !\n│ 📝 𝗨𝘁𝗶𝗹𝗶𝘀𝗲𝘇: 𝗰𝗺𝗱 𝗹𝗼𝗮𝗱/𝗹𝗼𝗮𝗱𝗔𝗹𝗹/𝗶𝗻𝘀𝘁𝗮𝗹𝗹/𝘂𝗻𝗹𝗼𝗮𝗱\n│ 💡 𝗧𝗮𝗽𝗲𝘇: 𝗰𝗺𝗱 𝗵𝗲𝗹𝗽 𝗽𝗼𝘂𝗿 𝗹'𝗮𝗶𝗱𝗲\n└─❖",
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "cmd_install" || userId !== data.authorId) return;

  try {
    const { fileName, rawCode } = data.data;
    const cmdFolder = path.join(__dirname, './');

    await installCommand(fileName, rawCode, cmdFolder, global.teamnix.cmds);
    
    await bot.sendMessage(chatId,
      `┌─❖\n│ 🚀 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ✅ 𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗧𝗜𝗢𝗡 𝗥𝗘𝗨𝗦𝗦𝗜𝗘 !\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲: ${fileName}\n│ 📍 𝗣𝗮𝘁𝗵: ${removeHomeDir(path.join(cmdFolder, fileName))}\n└─❖`,
      { reply_to_message_id: msg.message_id }
    );

    global.teamnix.replies.delete(replyMsg.message_id);

  } catch (err) {
    await bot.sendMessage(chatId,
      `┌─❖\n│ 🚨 𝗡𝗜𝗫 𝗕𝗢𝗧\n├─•\n│ ❌ 𝗘𝗥𝗥𝗘𝗨𝗥 𝗗'𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗔𝗧𝗜𝗢𝗡 !\n│ 📁 𝗙𝗶𝗰𝗵𝗶𝗲𝗿: ${fileName}\n│ ⚠️ 𝗘𝗿𝗿𝗲𝘂𝗿: ${err.message}\n└─❖`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function installCommand(fileName, rawCode, cmdFolder, commands) {
  const filePath = path.join(cmdFolder, fileName);
  
  fs.writeFileSync(filePath, rawCode, 'utf-8');
  
  delete require.cache[require.resolve(filePath)];
  const cmd = require(filePath);

  if (!cmd || !cmd.nix || !cmd.onStart) {
    fs.unlinkSync(filePath);
    throw new Error("Format de commande invalide");
  }

  const nameLower = cmd.nix.name.toLowerCase();
  commands.set(nameLower, cmd);

  if (cmd.nix.aliases && Array.isArray(cmd.nix.aliases)) {
    for (const alias of cmd.nix.aliases) {
      commands.set(alias.toLowerCase(), cmd);
    }
  }

  return cmd;
}

module.exports = { onStart, onReply, nix };
