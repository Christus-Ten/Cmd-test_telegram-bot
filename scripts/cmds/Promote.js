const nix = {
  name: "promote",
  version: "1.0.0",
  aliases: [],
  description: "Promouvoir un membre en tant qu'administrateur du groupe",
  author: "Christus (converted)",
  prefix: false,
  category: "admin",
  role: 2, // Nécessite que l'utilisateur soit admin du groupe
  cooldown: 10,
  guide: "{p}promote (en répondant à un message) ou {p}promote <user_id>"
};

async function onStart({ bot, msg, chatId, args }) {
  // Vérifier si c'est un groupe
  if (chatId >= 0) {
    return bot.sendMessage(chatId, "❌ Cette commande ne peut être utilisée que dans un groupe.", {
      reply_to_message_id: msg.message_id
    });
  }

  // Vérifier que l'utilisateur qui exécute la commande est admin du groupe
  try {
    const caller = await bot.getChatMember(chatId, msg.from.id);
    const callerStatus = caller.status;
    if (callerStatus !== 'creator' && callerStatus !== 'administrator') {
      return bot.sendMessage(chatId, "❌ Vous devez être administrateur du groupe pour utiliser cette commande.", {
        reply_to_message_id: msg.message_id
      });
    }
  } catch (err) {
    console.error("Erreur vérification admin:", err);
    return bot.sendMessage(chatId, "❌ Impossible de vérifier vos permissions.", {
      reply_to_message_id: msg.message_id
    });
  }

  // Déterminer l'utilisateur cible
  let targetUserId = null;

  // 1. Réponse à un message
  if (msg.reply_to_message && msg.reply_to_message.from) {
    targetUserId = msg.reply_to_message.from.id;
  }
  // 2. Argument contenant un ID numérique
  else if (args[0] && /^\d+$/.test(args[0])) {
    targetUserId = parseInt(args[0], 10);
  }
  // 3. Mention (via entities) – optionnel, mais plus complexe, on peut ignorer
  else {
    return bot.sendMessage(chatId, 
      "❌ Veuillez répondre au message de l'utilisateur ou fournir son ID numérique.\n" +
      "Exemple : /promote 123456789", {
      reply_to_message_id: msg.message_id
    });
  }

  // Vérifier que la cible n'est pas le bot lui-même
  const botInfo = await bot.getMe();
  if (targetUserId === botInfo.id) {
    return bot.sendMessage(chatId, "❌ Je ne peux pas me promouvoir moi-même.", {
      reply_to_message_id: msg.message_id
    });
  }

  try {
    // Vérifier que le bot a les droits de promouvoir
    const botMember = await bot.getChatMember(chatId, botInfo.id);
    if (botMember.status !== 'administrator' || !botMember.can_promote_members) {
      return bot.sendMessage(chatId, "❌ Le bot doit être administrateur avec le droit de promouvoir des membres.", {
        reply_to_message_id: msg.message_id
      });
    }

    // Vérifier si l'utilisateur cible est déjà admin
    const targetMember = await bot.getChatMember(chatId, targetUserId);
    if (targetMember.status === 'administrator' || targetMember.status === 'creator') {
      return bot.sendMessage(chatId, "❌ Cet utilisateur est déjà administrateur.", {
        reply_to_message_id: msg.message_id
      });
    }

    // Promouvoir l'utilisateur (ensemble de permissions standard)
    await bot.promoteChatMember(chatId, targetUserId, {
      can_change_info: true,
      can_post_messages: true,
      can_edit_messages: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
      can_promote_members: false // Par défaut, on ne donne pas le droit de promouvoir d'autres admins (sécurité)
    });

    // Récupérer le nom de l'utilisateur pour le message
    let targetName = `@${targetUserId}`;
    try {
      const user = await bot.getChat(targetUserId);
      targetName = user.first_name || targetName;
    } catch (e) {}

    await bot.sendMessage(chatId, 
      `╭────❒ 👑 Promu(e) avec succès ❒\n` +
      `├⬡ ${targetName} est maintenant administrateur.\n` +
      `╰────────────❒`, {
      reply_to_message_id: msg.message_id
    });

  } catch (err) {
    console.error("Erreur promote:", err);
    bot.sendMessage(chatId, "❌ Échec de la promotion. Vérifiez que le bot a les droits nécessaires.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Not used
}

module.exports = { onStart, onReply, nix };
