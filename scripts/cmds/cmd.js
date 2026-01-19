const fs = require('fs');
const path = require('path');
const axios = require('axios');

const configPath = path.join(__dirname, '..', '..', 'config.json');

function loadConfig() {
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    if (!config.admin) config.admin = [];
    return config;
  } catch (error) {
    return { admin: [] };
  }
}

module.exports = {
  nix: {
    name: 'cmd',
    author: 'ArYAN / Christus',
    version: '1.18',
    description: 'Manage commands (Load, LoadAll, Unload, Install via URL or Code)',
    usage: 'cmd <load|loadall|install|unload> [args]',
    admin: true,
    vip: true,
    category: 'Admin',
    prefix: false,
    aliases: ['cm']
  },

  async onStart({ message, args, userId, event }) {
    const config = loadConfig();
    if (!config.admin.includes(String(userId))) {
      return message.reply("❌ | Seuls les administrateurs peuvent utiliser cette commande.");
    }

    const subcmd = args[0]?.toLowerCase();
    const cmdFolder = path.join(__dirname, './');
    if (!global.teamnix) global.teamnix = { cmds: new Map() };
    const commands = global.teamnix.cmds;

    // --- Helpers ---
    const clearCache = (p) => { try { delete require.cache[require.resolve(p)]; } catch(e){} };
    const register = (cmd, col) => {
      if (!cmd?.nix || typeof cmd.onStart !== 'function') return false;
      col.set(cmd.nix.name.toLowerCase(), cmd);
      if (cmd.nix.aliases) cmd.nix.aliases.forEach(a => col.set(a.toLowerCase(), cmd));
      return true;
    };

    // --- Subcommands ---
    if (subcmd === 'install') {
      // Syntaxe 1: cmd install <filename.js> <code>
      // Syntaxe 2: cmd install <URL> <filename.js>
      let fileName, code;

      if (args[1]?.startsWith('http')) {
        // Installation via URL
        const url = args[1];
        fileName = args[2];
        if (!fileName) return message.reply("⚠️ | Utilisation : `cmd install <URL> <nom_du_fichier.js>`");
        try {
          const res = await axios.get(url);
          code = typeof res.data === 'object' ? JSON.stringify(res.data) : res.data;
        } catch (e) { return message.reply("❌ | Impossible de récupérer le code depuis l'URL."); }
      } else {
        // Installation via Code Direct
        fileName = args[1];
        if (!fileName || !fileName.endsWith('.js')) return message.reply("⚠️ | Utilisation : `cmd install <nom_du_fichier.js> <code>` (Le code doit suivre le nom du fichier)");
        
        // On récupère tout le texte après le nom du fichier
        const rawBody = event.body; // Récupère le message complet
        code = rawBody.slice(rawBody.indexOf(fileName) + fileName.length).trim();
        
        if (!code) return message.reply("❌ | Aucun code détecté après le nom du fichier.");
      }

      const filePath = path.join(cmdFolder, fileName);
      try {
        fs.writeFileSync(filePath, code, 'utf-8');
        clearCache(filePath);
        const newCmd = require(filePath);
        if (register(newCmd, commands)) {
          return message.reply(`✅ | Commande "${newCmd.nix.name}" installée et chargée avec succès !`);
        } else {
          fs.unlinkSync(filePath);
          return message.reply("❌ | Format Nix invalide. Fichier supprimé.");
        }
      } catch (err) {
        return message.reply(`❌ | Erreur : ${err.message}`);
      }
    }

    else if (subcmd === 'loadall') {
      const files = fs.readdirSync(cmdFolder).filter(f => f.endsWith('.js'));
      commands.clear();
      let ok = 0;
      files.forEach(f => {
        try {
          const p = path.join(cmdFolder, f);
          clearCache(p);
          if (register(require(p), commands)) ok++;
        } catch(e){}
      });
      return message.reply(`✅ | ${ok} commandes chargées.`);
    }

    else if (subcmd === 'unload') {
      const name = args[1]?.toLowerCase();
      if (!commands.has(name)) return message.reply("❌ | Commande introuvable.");
      const cmd = commands.get(name);
      commands.delete(cmd.nix.name.toLowerCase());
      if (cmd.nix.aliases) cmd.nix.aliases.forEach(a => commands.delete(a.toLowerCase()));
      return message.reply(`✅ | Commande "${name}" déchargée.`);
    }

    else {
      return message.reply("● Usage : `cmd <install|loadall|unload> [args]`");
    }
  }
};
