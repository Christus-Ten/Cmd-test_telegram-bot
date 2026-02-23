const nix = {
  name: "demote",
  version: "1.0.0",
  aliases: ["unadmin", "delmote"],
  description: "Retirer les privilèges d'administrateur à un membre du groupe",
  author: "Christus",
  prefix: false,
  category: "admin",
  role: 2, // Nécessite que l'utilisateur soit admin du groupe
  cooldown: 10,
  guide: "{p}demote (en répondant à un message) ou {p}demote <user_id>"
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
  else {
    return bot.sendMessage(chatId, 
      "❌ Veuillez répondre au message de l'utilisateur ou fournir son ID numérique.\n" +
      "Exemple : /demote 123456789", {
      reply_to_message_id: msg.message_id
    });
  }

  // Vérifier que la cible n'est pas le bot lui-même
  const botInfo = await bot.getMe();
  if (targetUserId === botInfo.id) {
    return bot.sendMessage(chatId, "❌ Je ne peux pas me rétrograder moi-même.", {
      reply_to_message_id: msg.message_id
    });
  }

  try {
    // Vérifier que le bot a les droits de promouvoir/démote
    const botMember = await bot.getChatMember(chatId, botInfo.id);
    if (botMember.status !== 'administrator' || !botMember.can_promote_members) {
      return bot.sendMessage(chatId, "❌ Le bot doit être administrateur avec le droit de promouvoir/démote des membres.", {
        reply_to_message_id: msg.message_id
      });
    }

    // Vérifier le statut de l'utilisateur cible
    const targetMember = await bot.getChatMember(chatId, targetUserId);
    if (targetMember.status !== 'administrator') {
      return bot.sendMessage(chatId, "❌ Cet utilisateur n'est pas administrateur.", {
        reply_to_message_id: msg.message_id
      });
    }

    // On ne peut pas démote le créateur du groupe
    if (targetMember.status === 'creator') {
      return bot.sendMessage(chatId, "❌ Impossible de rétrograder le créateur du groupe.", {
        reply_to_message_id: msg.message_id
      });
    }

    // Démote l'utilisateur (révoquer tous les privilèges)
    await bot.promoteChatMember(chatId, targetUserId, {}); // empty object revokes all privileges

    // Récupérer le nom de l'utilisateur pour le message
    let targetName = `@${targetUserId}`;
    try {
      const user = await bot.getChat(targetUserId);
      targetName = user.first_name || targetName;
    } catch (e) {}

    await bot.sendMessage(chatId, 
      `╭────❒ 👤 Rétrogradé(e) avec succès ❒\n` +
      `├⬡ ${targetName} n'est plus administrateur.\n` +
      `╰────────────❒`, {
      reply_to_message_id: msg.message_id
    });

  } catch (err) {
    console.error("Erreur demote:", err);
    bot.sendMessage(chatId, "❌ Échec de la rétrogradation. Vérifiez que le bot a les droits nécessaires.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Not used
}

module.exports = { onStart, onReply, nix };
