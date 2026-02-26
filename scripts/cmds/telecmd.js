const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const cheerio = require('cheerio');

const nix = {
  name: "cmd",
  version: "1.17",
  aliases: ["cm"],
  description: "Manage commands: install, load, loadall, unload, reload",
  author: "Christus",
  prefix: true,
  category: "Admin",
  role: 1,
  cooldown: 5,
  guide: "{p}cmd <install|load|loadall|unload|reload> [args]"
};

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function getDomain(url) {
  const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function clearRequireCache(filePath) {
  try {
    const resolved = require.resolve(filePath);
    if (require.cache[resolved]) delete require.cache[resolved];
  } catch (err) {}
}

function isValidCommand(module) {
  return module && module.nix && typeof module.nix.name === 'string' && typeof module.onStart === 'function';
}

function registerCommand(cmd, commandsMap) {
  if (!isValidCommand(cmd)) return false;
  const name = cmd.nix.name.toLowerCase();
  commandsMap.set(name, cmd);
  if (Array.isArray(cmd.nix.aliases)) {
    for (const alias of cmd.nix.aliases) {
      const aliasLower = alias.toLowerCase();
      if (!commandsMap.has(aliasLower)) commandsMap.set(aliasLower, cmd);
    }
  }
  return true;
}

function loadScripts(fileName, rawCode = null) {
  const commandsDir = path.join(__dirname);
  const filePath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : fileName + '.js');
  const commandName = fileName.replace(/\.js$/, '');

  try {
    if (rawCode) {
      fs.writeFileSync(filePath, rawCode, 'utf8');
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let match;
    const packages = new Set();
    while ((match = requireRegex.exec(content)) !== null) {
      const pkg = match[1];
      if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
        const pkgName = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
        packages.add(pkgName);
      }
    }

    for (const pkg of packages) {
      try {
        require.resolve(pkg);
      } catch {
        execSync(`npm install ${pkg} --save`, { stdio: 'pipe' });
      }
    }

    clearRequireCache(filePath);
    const cmdModule = require(filePath);

    if (!isValidCommand(cmdModule)) {
      throw new Error('Invalid command format (missing nix or onStart)');
    }

    const commands = global.teamnix.cmds || new Map();
    const existingCmd = commands.get(cmdModule.nix.name.toLowerCase());
    if (existingCmd && existingCmd.location !== filePath) {
      throw new Error(`Command name "${cmdModule.nix.name}" already exists in another file`);
    }

    if (existingCmd && existingCmd.nix.aliases) {
      for (const alias of existingCmd.nix.aliases) {
        commands.delete(alias.toLowerCase());
      }
    }

    cmdModule.location = filePath;

    if (!registerCommand(cmdModule, commands)) {
      throw new Error('Failed to register command');
    }

    if (typeof cmdModule.onLoad === 'function') {
      cmdModule.onLoad({});
    }

    return { status: 'success', name: commandName, command: cmdModule };
  } catch (err) {
    return {
      status: 'failed',
      name: commandName,
      error: { name: err.name, message: err.message, stack: err.stack }
    };
  }
}

function unloadScripts(fileName) {
  const commandsDir = path.join(__dirname);
  const filePath = path.join(commandsDir, fileName.endsWith('.js') ? fileName : fileName + '.js');
  const commandName = fileName.replace(/\.js$/, '').toLowerCase();

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName}.js`);
    }

    const commands = global.teamnix.cmds || new Map();
    let targetCmd = commands.get(commandName);
    if (!targetCmd) {
      for (const [name, cmd] of commands.entries()) {
        if (cmd.location === filePath) {
          targetCmd = cmd;
          break;
        }
      }
    }
    if (!targetCmd) {
      throw new Error(`Command not loaded: ${commandName}`);
    }

    const actualName = targetCmd.nix.name.toLowerCase();
    commands.delete(actualName);
    if (Array.isArray(targetCmd.nix.aliases)) {
      for (const alias of targetCmd.nix.aliases) {
        commands.delete(alias.toLowerCase());
      }
    }

    clearRequireCache(filePath);

    const txtPath = filePath.replace(/\.js$/, '.txt');
    fs.renameSync(filePath, txtPath);

    return { status: 'success', name: fileName };
  } catch (err) {
    return {
      status: 'failed',
      name: fileName,
      error: { name: err.name, message: err.message }
    };
  }
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const userId = msg.from.id.toString();
  const subcmd = args[0]?.toLowerCase();

  if (!global.teamnix) global.teamnix = {};
  if (!global.teamnix.cmds) global.teamnix.cmds = new Map();
  const commands = global.teamnix.cmds;

  if (!subcmd || subcmd === 'help') {
    return bot.sendMessage(chatId,
      "┌─❖\n" +
      "│ 🚀 𝗡𝗶𝘅 𝗖𝗠𝗗 𝗠𝗮𝗻𝗮𝗴𝗲𝗿\n" +
      "├─•\n" +
      "│ 📋 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀:\n" +
      "│\n" +
      "│ • load <command>\n" +
      "│   ↳ Load a single command\n" +
      "│\n" +
      "│ • loadall\n" +
      "│   ↳ Load all commands\n" +
      "│\n" +
      "│ • unload <command>\n" +
      "│   ↳ Unload a command\n" +
      "│\n" +
      "│ • reload <command>\n" +
      "│   ↳ Reload a command\n" +
      "│\n" +
      "│ • install <url> <filename.js>\n" +
      "│   ↳ Install from URL\n" +
      "│\n" +
      "│ • install <filename.js> <code>\n" +
      "│   ↳ Install from code block\n" +
      "├─•\n" +
      "│ 💡 𝗘𝘅𝗮𝗺𝗽𝗹𝗲𝘀:\n" +
      "│ • /cmd load ping\n" +
      "│ • /cmd install https://raw.../ping.js ping.js\n" +
      "│ • /cmd unload ping\n" +
      "└─❖",
      { reply_to_message_id: msg.message_id }
    );
  }

  try {
    if (subcmd === 'load') {
      if (args.length < 2) {
        return bot.sendMessage(chatId, "❌ Missing command name.", { reply_to_message_id: msg.message_id });
      }
      const cmdName = args[1];
      const result = loadScripts(cmdName);
      if (result.status === 'success') {
        bot.sendMessage(chatId,
          `┌─❖\n│ 🚀 𝗟𝗼𝗮𝗱𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀!\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱: ${result.name}\n│ 🎯 𝗦𝘁𝗮𝘁𝘂𝘀: 𝗔𝗰𝘁𝗶𝘃𝗲\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );
      } else {
        bot.sendMessage(chatId,
          `┌─❖\n│ ❌ 𝗟𝗼𝗮𝗱 𝗙𝗮𝗶𝗹𝗲𝗱!\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱: ${result.name}\n│ ⚠️ 𝗘𝗿𝗿𝗼𝗿: ${result.error.name}\n│ 📝 ${result.error.message}\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );
      }
      return;
    }

    if (subcmd === 'loadall') {
      const files = fs.readdirSync(__dirname)
        .filter(f => f.endsWith('.js') && f !== 'cmd.js' && !f.includes('example') && !fs.existsSync(path.join(__dirname, f.replace(/\.js$/, '.txt'))));
      const successes = [];
      const failures = [];

      for (const file of files) {
        const result = loadScripts(file);
        if (result.status === 'success') {
          successes.push(file);
        } else {
          failures.push(` ❌ ${file} → ${result.error.name}: ${result.error.message}`);
        }
      }

      let reply = '';
      if (successes.length) reply += `✅ Loaded ${successes.length} commands.\n`;
      if (failures.length) reply += `❌ Failed ${failures.length}:\n${failures.join('\n')}`;
      bot.sendMessage(chatId, reply || 'No commands loaded.', { reply_to_message_id: msg.message_id });
      return;
    }

    if (subcmd === 'unload') {
      if (args.length < 2) {
        return bot.sendMessage(chatId, "❌ Missing command name.", { reply_to_message_id: msg.message_id });
      }
      const cmdName = args[1];
      const result = unloadScripts(cmdName);
      if (result.status === 'success') {
        bot.sendMessage(chatId,
          `┌─❖\n│ ✅ 𝗨𝗻𝗹𝗼𝗮𝗱𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀!\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱: ${result.name}\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );
      } else {
        bot.sendMessage(chatId,
          `┌─❖\n│ ❌ 𝗨𝗻𝗹𝗼𝗮𝗱 𝗙𝗮𝗶𝗹𝗲𝗱!\n│ 📁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱: ${result.name}\n│ ⚠️ ${result.error.message}\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );
      }
      return;
    }

    if (subcmd === 'reload') {
      if (args.length < 2) {
        return bot.sendMessage(chatId, "❌ Missing command name.", { reply_to_message_id: msg.message_id });
      }
      const cmdName = args[1];
      const unloadResult = unloadScripts(cmdName);
      if (unloadResult.status === 'failed') {
        return bot.sendMessage(chatId, `❌ Reload failed: ${unloadResult.error.message}`, { reply_to_message_id: msg.message_id });
      }
      const loadResult = loadScripts(cmdName);
      if (loadResult.status === 'success') {
        bot.sendMessage(chatId, `🔄 Reloaded "${loadResult.name}" successfully.`, { reply_to_message_id: msg.message_id });
      } else {
        bot.sendMessage(chatId, `❌ Reload failed after unload: ${loadResult.error.message}`, { reply_to_message_id: msg.message_id });
      }
      return;
    }

    if (subcmd === 'install') {
      let url = args[1];
      let fileName = args[2];
      let rawCode;

      if (!url || !fileName) {
        return bot.sendMessage(chatId, "❌ Missing URL/code or filename.", { reply_to_message_id: msg.message_id });
      }

      if (url.endsWith('.js') && !isURL(url)) {
        const tmp = fileName;
        fileName = url;
        url = tmp;
      }

      if (isURL(url)) {
        const domain = getDomain(url);
        if (!domain) return bot.sendMessage(chatId, "❌ Invalid URL.", { reply_to_message_id: msg.message_id });

        if (domain === 'pastebin.com') {
          url = url.replace(/https:\/\/pastebin\.com\/(?!raw\/)(.*)/, 'https://pastebin.com/raw/$1');
        } else if (domain === 'github.com') {
          url = url.replace(/https:\/\/github\.com\/(.*)\/blob\/(.*)/, 'https://raw.githubusercontent.com/$1/$2');
        }

        try {
          const response = await axios.get(url);
          rawCode = response.data;
          if (domain === 'savetext.net') {
            const $ = cheerio.load(rawCode);
            rawCode = $('#content').text();
          }
        } catch (err) {
          return bot.sendMessage(chatId, `❌ Failed to fetch URL: ${err.message}`, { reply_to_message_id: msg.message_id });
        }
      } else {
        if (args[args.length - 1].endsWith('.js')) {
          fileName = args[args.length - 1];
          rawCode = args.slice(1, -1).join(' ');
        } else {
          return bot.sendMessage(chatId, "❌ Please provide a valid filename ending with .js", { reply_to_message_id: msg.message_id });
        }
      }

      if (!rawCode) {
        return bot.sendMessage(chatId, "❌ Could not retrieve code.", { reply_to_message_id: msg.message_id });
      }

      const filePath = path.join(__dirname, fileName);
      if (fs.existsSync(filePath)) {
        const confirmMsg = await bot.sendMessage(chatId,
          `⚠️ File "${fileName}" already exists. React to this message within 30 seconds to overwrite.`,
          { reply_to_message_id: msg.message_id }
        );
        global.teamnix.replies.set(confirmMsg.message_id, {
          type: 'cmd_install_overwrite',
          authorId: userId,
          fileName,
          rawCode
        });
        setTimeout(() => {
          if (global.teamnix.replies.has(confirmMsg.message_id)) {
            global.teamnix.replies.delete(confirmMsg.message_id);
          }
        }, 30000);
        return;
      }

      const result = loadScripts(fileName, rawCode);
      if (result.status === 'success') {
        bot.sendMessage(chatId,
          `┌─❖\n│ ✅ 𝗜𝗻𝘀𝘁𝗮𝗹𝗹𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀!\n│ 📁 ${result.name}\n│ 📍 ${filePath.replace(process.cwd(), '')}\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );
      } else {
        bot.sendMessage(chatId,
          `┌─❖\n│ ❌ 𝗜𝗻𝘀𝘁𝗮𝗹𝗹 𝗙𝗮𝗶𝗹𝗲𝗱!\n│ 📁 ${result.name}\n│ ⚠️ ${result.error.message}\n└─❖`,
          { reply_to_message_id: msg.message_id }
        );
      }
      return;
    }

    bot.sendMessage(chatId, "❌ Unknown subcommand. Use 'cmd help'.", { reply_to_message_id: msg.message_id });
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error: ${err.message}`, { reply_to_message_id: msg.message_id });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== 'cmd_install_overwrite' || userId !== data.authorId) return;

  const reaction = msg.text?.trim().toLowerCase();
  if (reaction !== '✅' && reaction !== '👍' && reaction !== 'yes' && reaction !== 'oui' && reaction !== 'y') {
    return bot.sendMessage(chatId, "❌ Overwrite cancelled.", { reply_to_message_id: msg.message_id });
  }

  const result = loadScripts(data.fileName, data.rawCode);
  if (result.status === 'success') {
    bot.sendMessage(chatId,
      `┌─❖\n│ ✅ 𝗢𝘃𝗲𝗿𝘄𝗿𝗶𝘁𝘁𝗲𝗻 & 𝗜𝗻𝘀𝘁𝗮𝗹𝗹𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀!\n│ 📁 ${result.name}\n│ 📍 ${path.join(__dirname, data.fileName).replace(process.cwd(), '')}\n└─❖`,
      { reply_to_message_id: msg.message_id }
    );
  } else {
    bot.sendMessage(chatId,
      `┌─❖\n│ ❌ 𝗜𝗻𝘀𝘁𝗮𝗹𝗹 𝗙𝗮𝗶𝗹𝗲𝗱!\n│ 📁 ${result.name}\n│ ⚠️ ${result.error.message}\n└─❖`,
      { reply_to_message_id: msg.message_id }
    );
  }

  global.teamnix.replies.delete(replyMsg.message_id);
}

module.exports = { onStart, onReply, nix };