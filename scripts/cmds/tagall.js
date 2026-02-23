const fs = require('fs');
const path = require('path');

const dbDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const membersFile = path.join(dbDir, 'tagall_members.json');

function loadMembers() {
  if (!fs.existsSync(membersFile)) {
    fs.writeFileSync(membersFile, JSON.stringify({}));
    return {};
  }
  return JSON.parse(fs.readFileSync(membersFile, 'utf8'));
}

function saveMembers(data) {
  fs.writeFileSync(membersFile, JSON.stringify(data, null, 2));
}

// Nettoie les membres inactifs (plus de 30 jours)
function cleanOldMembers(members, days = 30) {
  const now = Date.now();
  const limit = days * 24 * 60 * 60 * 1000;
  const cleaned = {};
  for (const [chatId, users] of Object.entries(members)) {
    cleaned[chatId] = users.filter(u => now - u.lastSeen < limit);
  }
  return cleaned;
}

// Met à jour la base avec un utilisateur qui vient de parler
function updateMember(chatId, userId, user) {
  const members = loadMembers();
  if (!members[chatId]) members[chatId] = [];
  const index = members[chatId].findIndex(u => u.id === userId);
  const member = {
    id: userId,
    first_name: user.first_name || '',
    username: user.username || '',
    lastSeen: Date.now()
  };
  if (index !== -1) {
    members[chatId][index] = member;
  } else {
    members[chatId].push(member);
  }
  members[chatId] = cleanOldMembers({ [chatId]: members[chatId] })[chatId] || [];
  saveMembers(members);
}

const nix = {
  name: 'tagall',
  version: '1.0.0',
  aliases: ['everyone', 'all', 'mention'],
  description: 'Mentionne tous les membres récents du groupe (basé sur les messages récents)',
  author: 'Christus',
  prefix: true,
  category: 'admin',
  role: 1, // 1 = admin uniquement (à ajuster selon votre système)
  cooldown: 10,
  guide: '{p}tagall <message> – Mentionne tous les membres actifs du groupe'
};

async function onStart({ bot, msg, chatId, args, usages }) {
  // Vérifier que c'est un groupe
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    return bot.sendMessage(
      chatId,
      '╭────❒ ❌ Erreur ❒\n' +
      '├⬡ Cette commande ne peut être utilisée que dans les groupes.\n' +
      '╰────────────❒',
      { reply_to_message_id: msg.message_id }
    );
  }

  // Vérifier si l'utilisateur est admin (optionnel, selon votre système)
  // Si role:1, le loader doit déjà restreindre, mais on peut ajouter une vérification supplémentaire
  const admins = await bot.getChatAdministrators(chatId);
  const isAdmin = admins.some(admin => admin.user.id === msg.from.id);
  if (!isAdmin) {
    return bot.sendMessage(
      chatId,
      '╭────❒ ❌ Accès refusé ❒\n' +
      '├⬡ Seuls les administrateurs peuvent utiliser cette commande.\n' +
      '╰────────────❒',
      { reply_to_message_id: msg.message_id }
    );
  }

  const message = args.join(' ') || 'Hello everyone!';

  // Charger les membres connus pour ce chat
  const members = loadMembers();
  const chatMembers = members[chatId] || [];

  if (chatMembers.length === 0) {
    return bot.sendMessage(
      chatId,
      '╭────❒ ⚠️ Avertissement ❒\n' +
      '├⬡ Aucun membre enregistré pour ce groupe.\n' +
      '├⬡ Les membres doivent avoir envoyé un message récemment pour être mentionnés.\n' +
      '╰────────────❒',
      { reply_to_message_id: msg.message_id }
    );
  }

  // Construire le texte avec les mentions
  let mentionText = `╭────❒ 📢 Annonce ❒\n`;
  mentionText += `├⬡ *${message}*\n`;
  mentionText += `╰────────────❒\n\n`;

  // Ajouter chaque membre sous forme de lien cliquable
  for (const member of chatMembers) {
    // Format : [Prénom](tg://user?id=123456) ou @username si disponible
    if (member.username) {
      mentionText += `@${member.username}\n`;
    } else {
      const name = member.first_name || 'Membre';
      mentionText += `[${name}](tg://user?id=${member.id})\n`;
    }
  }

  // Envoyer le message avec parse_mode Markdown pour les liens
  await bot.sendMessage(chatId, mentionText, {
    parse_mode: 'Markdown',
    reply_to_message_id: msg.message_id
  });
}

// Fonction à appeler à chaque message pour enregistrer les participants
function registerMessageUser(msg) {
  if (!msg.from || !msg.chat) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const user = msg.from;
  updateMember(chatId, userId, user);
}

module.exports = { onStart, nix, registerMessageUser };
