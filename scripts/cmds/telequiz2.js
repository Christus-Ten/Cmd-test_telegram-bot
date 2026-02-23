const axios = require('axios');
const fs = require('fs');
const path = require('path');

// -------------------- Database Helpers --------------------
const getDatabasePath = (dbName) => {
  const dbPath = path.join(process.cwd(), 'database', `${dbName}.json`);
  const dbDir = path.join(process.cwd(), 'database');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}));
  return dbPath;
};

const getDatabase = (dbName) => {
  const dbPath = getDatabasePath(dbName);
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
};

const saveDatabase = (dbName, data) => {
  const dbPath = getDatabasePath(dbName);
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};
// ----------------------------------------------------------

const BASE_URL = 'https://qizapi.onrender.com/api';

// -------------------- Helper Functions --------------------
function generateProgressBar(percentile) {
  const filled = Math.round(percentile / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getUserTitle(correct) {
  if (correct >= 50000) return '🌟 Quiz Omniscient';
  if (correct >= 25000) return '👑 Quiz Divin';
  if (correct >= 15000) return '⚡ Quiz Titan';
  if (correct >= 10000) return '🏆 Quiz Légende';
  if (correct >= 7500) return '🎓 Grand Maître';
  if (correct >= 5000) return '👨‍🎓 Maître du Quiz';
  if (correct >= 2500) return '🔥 Expert en Quiz';
  if (correct >= 1500) return '📚 Savant du Quiz';
  if (correct >= 1000) return '🎯 Apprenti Quiz';
  if (correct >= 750) return '🌟 Chercheur de Savoir';
  if (correct >= 500) return '📖 Apprenant Rapide';
  if (correct >= 250) return '🚀 Étoile Montante';
  if (correct >= 100) return '💡 Débutant';
  if (correct >= 50) return '🎪 Premiers Pas';
  if (correct >= 25) return '🌱 Nouveau Venu';
  if (correct >= 10) return '🔰 Débutant';
  if (correct >= 1) return '👶 Recrue';
  return '🆕 Nouveau Joueur';
}

async function getAvailableCategories() {
  try {
    const res = await axios.get(`${BASE_URL}/categories`);
    return res.data.map(cat => cat.toLowerCase());
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
// ----------------------------------------------------------

const nix = {
  name: "quiz",
  version: "3.0",
  aliases: ["q"],
  description: "Jeu de quiz avancé avec fonctionnalités sociales, multijoueur, réalisations et analyses complètes",
  author: "Christus x Aesther (converted)",
  prefix: true,
  category: "game",
  role: 0,
  cooldown: 5,
  guide: "{p}quiz <catégorie>\n{p}quiz rank - Voir votre profil\n{p}quiz lb - Classement\n{p}quiz daily - Défi quotidien\n{p}quiz torf - Vrai/Faux\n{p}quiz flag - Drapeaux\n{p}quiz anime - Quiz Anime"
};

// -------------------- Handlers --------------------
async function handleDefaultView(chatId, bot, msg) {
  try {
    const res = await axios.get(`${BASE_URL}/categories`);
    const categories = res.data;
    const catText = categories.map(c => `📍 ${c.charAt(0).toUpperCase() + c.slice(1)}`).join("\n");

    return bot.sendMessage(chatId,
      `🎯 𝗤𝘂𝗶𝘇\n━━━━━━━━\n\n` +
      `📚 𝗖𝗮𝘁é𝗴𝗼𝗿𝗶𝗲𝘀\n\n${catText}\n\n` +
      `━━━━━━━━━\n\n` +
      `🏆 Utilisation\n` +
      `• /quiz rang - Voir votre rang\n` +
      `• /quiz classement - Voir le classement\n` +
      `• /quiz vrai/faux - Jouer au quiz Vrai/Faux\n` +
      `• /quiz drapeau - Jouer au quiz de drapeaux\n` +
      `• /quiz anime - Jouer au quiz de personnages anime\n\n` +
      `🎮 Utilisez: /quiz <catégorie> pour commencer`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    console.error("Default view error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de récupérer les catégories. Essayez '/quiz help' pour les commandes.", { reply_to_message_id: msg.message_id });
  }
}

async function handleRank(chatId, msg, bot, userId, userName) {
  try {
    const res = await axios.get(`${BASE_URL}/user/${userId}`);
    const user = res.data;
    if (!user || user.total === 0) {
      return bot.sendMessage(chatId, `❌ Vous n'avez pas encore joué au quiz ! Utilisez '/quiz aléatoire' pour commencer.\n👤 Bienvenue, ${userName}!`, { reply_to_message_id: msg.message_id });
    }

    const position = user.position ?? "N/A";
    const totalUser = user.totalUsers ?? "N/A";
    const progressBar = generateProgressBar(user.percentile ?? 0);
    const title = getUserTitle(user.correct || 0);

    const balances = getDatabase('balances');
    const userMoney = balances[userId]?.money || 0;

    const currentXP = user.xp ?? 0;
    const xpProgress = Math.min(100, (currentXP / 1000) * 100);
    const xpProgressBar = generateProgressBar(xpProgress);

    return bot.sendMessage(chatId,
      `🎮 𝗣𝗿𝗼𝗳𝗶𝗹 𝗤𝘂𝗶𝘇\n━━━━━━━━━\n\n` +
      `👤 ${userName}\n` +
      `🎖️ ${title}\n` +
      `🏆 𝗥𝗮𝗻𝗴 𝗴𝗹𝗼𝗯𝗮𝗹: #${position}/${totalUser}\n` +
      `📈 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗶𝗹𝗲: ${progressBar} ${user.percentile ?? 0}%\n\n` +
      `📊 𝗦𝘁𝗮𝘁𝗶𝘀𝘁𝗶𝗾𝘂𝗲𝘀\n` +
      `✅ 𝗖𝗼𝗿𝗿𝗲𝗰𝘁: ${user.correct ?? 0}\n` +
      `❌ 𝗜𝗻𝗰𝗼𝗿𝗿𝗲𝗰𝘁: ${user.wrong ?? 0}\n` +
      `📝 𝗧𝗼𝘁𝗮𝗹: ${user.total ?? 0}\n` +
      `🎯 𝗣𝗿é𝗰𝗶𝘀𝗶𝗼𝗻: ${user.accuracy ?? 0}%\n` +
      `⚡ 𝗧𝗲𝗺𝗽𝘀 𝗠𝗼𝘆𝗲𝗻: ${(user.avgResponseTime ?? 0).toFixed(1)}s\n\n` +
      `💰 𝗥𝗶𝗰𝗵𝗲𝘀𝘀𝗲 & 𝗫𝗣\n` +
      `💵 𝗔𝗿𝗴𝗲𝗻𝘁: ${userMoney.toLocaleString()}\n` +
      `✨ 𝗫𝗣: ${currentXP}/1000\n` +
      `${xpProgressBar} ${xpProgress.toFixed(1)}%\n\n` +
      `🔥 𝗦𝗲́𝗿𝗶𝗲\n` +
      `🔥 𝗔𝗰𝘁𝘂𝗲𝗹𝗹𝗲: ${user.currentStreak || 0}${user.currentStreak >= 5 ? ' 🚀' : ''}\n` +
      `🏅 𝗠𝗲𝗶𝗹𝗹𝗲𝘂𝗿𝗲: ${user.bestStreak || 0}${user.bestStreak >= 10 ? ' 👑' : user.bestStreak >= 5 ? ' ⭐' : ''}\n\n` +
      `🎯 𝗣𝗿𝗼𝗰𝗵𝗮𝗶𝗻 𝗼𝗯𝗷𝗲𝗰𝘁𝗶𝗳: ${user.nextMilestone || "Continuez à jouer !"}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    console.error("Rank error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de récupérer votre rang. Veuillez réessayer plus tard.", { reply_to_message_id: msg.message_id });
  }
}

async function handleLeaderboard(chatId, msg, bot, args) {
  try {
    const page = parseInt(args?.[0]) || 1;
    const res = await axios.get(`${BASE_URL}/leaderboards?page=${page}&limit=8`);
    const { rankings, pagination } = res.data;

    if (!rankings || rankings.length === 0) {
      return bot.sendMessage(chatId, "🏆 Aucun joueur trouvé dans le classement. Commencez à jouer pour être le premier !", { reply_to_message_id: msg.message_id });
    }

    const players = rankings.map((u, i) => {
      const position = (pagination.currentPage - 1) * 8 + i + 1;
      const crown = position === 1 ? "👑" : position === 2 ? "🥈" : position === 3 ? "🥉" : "🏅";
      const title = getUserTitle(u.correct || 0);
      const accuracy = u.accuracy ?? (u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0);
      return `${crown} #${position} ${u.name || 'Joueur Anonyme'}\n` +
             `🎖️ ${title}\n` +
             `📊 ${u.correct || 0} ✅ / ${u.wrong || 0} ❌ (${accuracy}%)\n` +
             `🔥 Série: ${u.currentStreak || 0} | 🏅 Meilleure: ${u.bestStreak || 0}`;
    });

    return bot.sendMessage(chatId,
      `🏆 𝗖𝗹𝗮𝘀𝘀𝗲𝗺𝗲𝗻𝘁 𝗚𝗹𝗼𝗯𝗮𝗹\n━━━━━━━━━\n\n${players.join('\n\n')}\n\n` +
      `📖 Page ${pagination.currentPage}/${pagination.totalPages}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    console.error("Leaderboard error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de récupérer le classement.", { reply_to_message_id: msg.message_id });
  }
}

async function handleCategories(chatId, bot, msg) {
  try {
    const res = await axios.get(`${BASE_URL}/categories`);
    const categories = res.data;
    const catText = categories.map(c => `📍 ${c.charAt(0).toUpperCase() + c.slice(1)}`).join("\n");
    return bot.sendMessage(chatId,
      `📚 𝗖𝗮𝘁é𝗴𝗼𝗿𝗶𝗲𝘀 𝗱𝘂 𝗤𝘂𝗶𝘇\n━━━━━━━━\n\n${catText}\n\n` +
      `🎯 Utilisez: /quiz <catégorie>\n` +
      `🎲 Aléatoire: /quiz aléatoire\n` +
      `🏆 Quotidien: /quiz quotidien\n` +
      `🌟 Spécial: /quiz vrai/faux, /quiz drapeau`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    console.error("Categories error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de récupérer les catégories.", { reply_to_message_id: msg.message_id });
  }
}

async function handleCategoryLeaderboard(chatId, msg, bot, args) {
  try {
    const category = args[0]?.toLowerCase();
    if (!category) {
      return bot.sendMessage(chatId, "📚 Veuillez spécifier une catégorie pour voir le classement.", { reply_to_message_id: msg.message_id });
    }

    const page = parseInt(args[1]) || 1;
    const res = await axios.get(`${BASE_URL}/leaderboard/category/${category}?page=${page}&limit=10`);
    const { users, pagination } = res.data;

    if (!users || users.length === 0) {
      return bot.sendMessage(chatId, `🏆 Aucun joueur trouvé pour la catégorie : ${category}.`, { reply_to_message_id: msg.message_id });
    }

    const players = users.map((u, i) => {
      const position = (pagination.currentPage - 1) * 10 + i + 1;
      const crown = position === 1 ? "👑" : position === 2 ? "🥈" : position === 3 ? "🥉" : "🏅";
      const title = getUserTitle(u.correct || 0);
      return `${crown} #${position} ${u.name || 'Joueur Anonyme'}\n🎖️ ${title}\n📊 ${u.correct || 0}/${u.total || 0} (${u.accuracy || 0}%)`;
    });

    return bot.sendMessage(chatId,
      `🏆 𝗖𝗹𝗮𝘀𝘀𝗲𝗺𝗲𝗻𝘁 : ${category.charAt(0).toUpperCase() + category.slice(1)}\n━━━━━━━━━\n\n${players.join('\n\n')}\n\n` +
      `📖 Page ${pagination.currentPage}/${pagination.totalPages}`,
      { reply_to_message_id: msg.message_id }
    );
  } catch (err) {
    console.error("Category leaderboard error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de récupérer le classement de la catégorie.", { reply_to_message_id: msg.message_id });
  }
}

async function handleDailyChallenge(chatId, msg, bot, userId, userName) {
  try {
    const res = await axios.get(`${BASE_URL}/challenge/daily?userId=${userId}`);
    const { question, challengeDate, reward, streak } = res.data;

    const optText = question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");

    const info = await bot.sendMessage(chatId,
      `🌟 𝗗𝗲́𝗳𝗶 𝗤𝘂𝗼𝘁𝗶𝗱𝗶𝗲𝗻\n━━━━━━━━━\n\n` +
      `📅 ${challengeDate}\n` +
      `🎯 Récompense bonus: +${reward} XP\n` +
      `🔥 Série quotidienne: ${streak}\n\n\n` +
      `❓ ${question.question}\n\n${optText}\n\n⏰ 30 secondes pour répondre !`,
      { reply_to_message_id: msg.message_id }
    );

    global.teamnix.replies.set(info.message_id, {
      nix,
      type: "quiz_reply",
      authorId: userId,
      correctAnswer: question.answer,
      options: question.options,
      questionId: question._id,
      startTime: Date.now(),
      isDaily: true,
      difficulty: "daily"
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(info.message_id)) {
        global.teamnix.replies.delete(info.message_id);
        bot.sendMessage(chatId, `⏰ Temps écoulé ! La bonne réponse était: ${question.answer}`, { reply_to_message_id: info.message_id });
      }
    }, 30000);
  } catch (err) {
    console.error("Daily challenge error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de créer le défi quotidien.", { reply_to_message_id: msg.message_id });
  }
}

async function handleTrueOrFalse(chatId, msg, bot, userId, userName) {
  try {
    const res = await axios.get(`${BASE_URL}/question?category=torf&userId=${userId}`);
    const { _id, question, answer } = res.data;

    const info = await bot.sendMessage(chatId,
      `⚙ 𝗤𝘂𝗶𝘇 ( Vrai/Faux )\n━━━━━━━━━━\n\n💭 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻: ${question}\n\n` +
      `Répondez avec "Vrai" ou "Faux".\n⏰ 30 secondes pour répondre`,
      { reply_to_message_id: msg.message_id }
    );

    global.teamnix.replies.set(info.message_id, {
      nix,
      type: "quiz_reply",
      authorId: userId,
      correctAnswer: answer, // "A" or "B"
      questionId: _id,
      startTime: Date.now(),
      isTorf: true
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(info.message_id)) {
        const correctText = answer === "A" ? "Vrai" : "Faux";
        global.teamnix.replies.delete(info.message_id);
        bot.sendMessage(chatId, `⏰ Temps écoulé ! La bonne réponse était: ${correctText}`, { reply_to_message_id: info.message_id });
      }
    }, 30000);
  } catch (err) {
    console.error("True/False error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de créer une question Vrai/Faux.", { reply_to_message_id: msg.message_id });
  }
}

async function handleFlagQuiz(chatId, msg, bot, userId, userName) {
  try {
    const res = await axios.get(`${BASE_URL}/question?category=flag&userId=${userId}`);
    const { _id, question, options, answer } = res.data;

    const flagEmbed = {
      caption: `🏁 𝗤𝘂𝗶𝘇 𝗱𝗲 𝗗𝗿𝗮𝗽𝗲𝗮𝘂𝘅\n━━━━━━━━\n\n🌍 Devinez le pays de ce drapeau :\n\n` +
              options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n") +
              `\n\n⏰ Temps : 30 secondes pour répondre.`
    };

    let info;
    if (question && question.startsWith('http')) {
      info = await bot.sendPhoto(chatId, question, {
        caption: flagEmbed.caption,
        reply_to_message_id: msg.message_id
      });
    } else {
      info = await bot.sendMessage(chatId, flagEmbed.caption, { reply_to_message_id: msg.message_id });
    }

    global.teamnix.replies.set(info.message_id, {
      nix,
      type: "quiz_reply",
      authorId: userId,
      correctAnswer: answer,
      options: options,
      questionId: _id,
      startTime: Date.now(),
      isFlag: true
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(info.message_id)) {
        global.teamnix.replies.delete(info.message_id);
        bot.sendMessage(chatId, `⏰ Temps écoulé ! La bonne réponse était: ${answer}`, { reply_to_message_id: info.message_id });
      }
    }, 30000);
  } catch (err) {
    console.error("Flag quiz error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de créer un quiz de drapeau.", { reply_to_message_id: msg.message_id });
  }
}

async function handleAnimeQuiz(chatId, msg, bot, userId, userName) {
  try {
    const res = await axios.get(`${BASE_URL}/question?category=anime&userId=${userId}`);
    const { _id, question, options, answer, imageUrl } = res.data;

    const animeEmbed = {
      caption: `🎌 𝗤𝘂𝗶𝘇 𝗔𝗻𝗶𝗺𝗲\n━━━━━━━━\n\n❔ 𝗜𝗻𝗱𝗶𝗰𝗲 : ${question}\n\n` +
              options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n") +
              `\n\n⏰ Temps : 30 secondes\n🎯 Défi de reconnaissance de personnages animés !`
    };

    let info;
    if (imageUrl && imageUrl.startsWith('http')) {
      info = await bot.sendPhoto(chatId, imageUrl, {
        caption: animeEmbed.caption,
        reply_to_message_id: msg.message_id
      });
    } else {
      info = await bot.sendMessage(chatId, animeEmbed.caption, { reply_to_message_id: msg.message_id });
    }

    global.teamnix.replies.set(info.message_id, {
      nix,
      type: "quiz_reply",
      authorId: userId,
      correctAnswer: answer,
      options: options,
      questionId: _id,
      startTime: Date.now(),
      isAnime: true
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(info.message_id)) {
        global.teamnix.replies.delete(info.message_id);
        bot.sendMessage(chatId, `⏰ Temps écoulé ! La bonne réponse était: ${answer}\n🎌 Continuez à regarder des animés pour améliorer vos compétences !`, { reply_to_message_id: info.message_id });
      }
    }, 30000);
  } catch (err) {
    console.error("Anime quiz error:", err);
    return bot.sendMessage(chatId, "⚠️ Impossible de créer un quiz anime.", { reply_to_message_id: msg.message_id });
  }
}

async function handleQuiz(chatId, msg, bot, userId, userName, args, forcedDifficulty = null) {
  try {
    const category = args[0]?.toLowerCase() || "";

    let queryParams = { userId: userId };
    if (category && category !== "random") {
      queryParams.category = category;
    }
    if (forcedDifficulty) {
      queryParams.difficulty = forcedDifficulty;
    }

    const res = await axios.get(`${BASE_URL}/question`, { params: queryParams });
    const { _id, question, options, answer, category: qCategory, difficulty } = res.data;

    const optText = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");

    const info = await bot.sendMessage(chatId,
      `🎯 𝗗𝗲́𝗳𝗶 𝗤𝘂𝗶𝘇\n━━━━━━━━━━\n\n` +
      `📚 𝖢𝖺𝗍𝖾́𝗀𝗈𝗋𝗂𝖾: ${qCategory?.charAt(0).toUpperCase() + qCategory?.slice(1) || "Aléatoire"}\n` +
      `🎚️ 𝖣𝗂𝖿𝖿𝗂𝖼𝗎𝗅𝗍𝖾́: ${difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1) || "Moyen"}\n` +
      `❓ 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻: ${question}\n\n${optText}\n\n` +
      `⏰ 𝖵𝗈𝗎𝗌 𝖺𝗏𝖾𝗓 30 𝗌𝖾𝖼𝗈𝗇𝖽𝖾𝗌 𝗉𝗈𝗎𝗋 𝗋épondre (A/B/C/D):`,
      { reply_to_message_id: msg.message_id }
    );

    global.teamnix.replies.set(info.message_id, {
      nix,
      type: "quiz_reply",
      authorId: userId,
      correctAnswer: answer,
      options: options,
      questionId: _id,
      startTime: Date.now(),
      difficulty: difficulty,
      category: qCategory
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(info.message_id)) {
        global.teamnix.replies.delete(info.message_id);
        bot.sendMessage(chatId, `⏰ Temps écoulé ! La bonne réponse était: ${answer}`, { reply_to_message_id: info.message_id });
      }
    }, 30000);
  } catch (err) {
    console.error("Quiz error:", err);
    bot.sendMessage(chatId, "⚠️ Impossible de récupérer une question. Essayez '/quiz categories' pour voir les options disponibles.", { reply_to_message_id: msg.message_id });
  }
}
// ----------------------------------------------------------

async function onStart({ bot, msg, chatId, args }) {
  const command = args[0]?.toLowerCase();
  const userId = msg.from.id;
  const userName = msg.from.first_name || msg.from.username || "Joueur";

  try {
    await axios.post(`${BASE_URL}/user/update`, {
      userId: userId,
      name: userName
    }).catch(() => {});

    if (!args[0] || command === "help") {
      return handleDefaultView(chatId, bot, msg);
    }

    switch (command) {
      case "rank":
      case "profile":
      case "rang":
      case "profil":
        return await handleRank(chatId, msg, bot, userId, userName);

      case "leaderboard":
      case "lb":
      case "classement":
        return await handleLeaderboard(chatId, msg, bot, args.slice(1));

      case "category":
      case "categorie":
        if (args.length > 1) {
          return await handleCategoryLeaderboard(chatId, msg, bot, args.slice(1));
        }
        return await handleCategories(chatId, bot, msg);

      case "daily":
      case "quotidien":
        return await handleDailyChallenge(chatId, msg, bot, userId, userName);

      case "torf":
      case "vrai/faux":
        return await handleTrueOrFalse(chatId, msg, bot, userId, userName);

      case "flag":
      case "drapeau":
        return await handleFlagQuiz(chatId, msg, bot, userId, userName);

      case "anime":
        return await handleAnimeQuiz(chatId, msg, bot, userId, userName);

      case "hard":
      case "difficile":
        return await handleQuiz(chatId, msg, bot, userId, userName, [], "hard");

      case "medium":
      case "moyen":
        return await handleQuiz(chatId, msg, bot, userId, userName, [], "medium");

      case "easy":
      case "facile":
        return await handleQuiz(chatId, msg, bot, userId, userName, [], "easy");

      case "random":
      case "aleatoire":
        return await handleQuiz(chatId, msg, bot, userId, userName, []);

      default:
        const categories = await getAvailableCategories();
        if (categories.includes(command)) {
          return await handleQuiz(chatId, msg, bot, userId, userName, [command]);
        } else {
          return handleDefaultView(chatId, bot, msg);
        }
    }
  } catch (err) {
    console.error("Quiz start error:", err);
    return bot.sendMessage(chatId, "⚠️ Erreur, réessayez plus tard.", { reply_to_message_id: msg.message_id });
  }
}

async function onReply({ bot, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "quiz_reply" || userId !== data.authorId) return;

  try {
    const ans = msg.text?.trim();
    if (!ans) return;

    // Handle True/False special case
    let userAnswerLetter = null;
    if (data.isTorf) {
      const lowerAns = ans.toLowerCase();
      if (lowerAns === "vrai" || lowerAns === "true") {
        userAnswerLetter = "A";
      } else if (lowerAns === "faux" || lowerAns === "false") {
        userAnswerLetter = "B";
      } else {
        return bot.sendMessage(chatId, "❌ Veuillez répondre avec 'Vrai' ou 'Faux'.", { reply_to_message_id: msg.message_id });
      }
    } else {
      // Normal A/B/C/D
      const upperAns = ans.toUpperCase();
      if (!["A", "B", "C", "D"].includes(upperAns)) {
        return bot.sendMessage(chatId, "❌ Veuillez répondre avec A, B, C ou D uniquement !", { reply_to_message_id: msg.message_id });
      }
      userAnswerLetter = upperAns;
    }

    const timeSpent = (Date.now() - data.startTime) / 1000;
    if (timeSpent > 30) {
      global.teamnix.replies.delete(replyMsg.message_id);
      return bot.sendMessage(chatId, `⏰ Temps écoulé ! La bonne réponse était: ${data.correctAnswer}`, { reply_to_message_id: msg.message_id });
    }

    const userName = msg.from.first_name || msg.from.username || "Joueur";

    let finalAnswer = userAnswerLetter;
    if ((data.isFlag || data.isAnime) && data.options) {
      const optionIndex = userAnswerLetter.charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < data.options.length) {
        finalAnswer = data.options[optionIndex];
      }
    }

    const answerData = {
      userId: userId,
      questionId: data.questionId,
      answer: finalAnswer,
      timeSpent,
      userName
    };

    const res = await axios.post(`${BASE_URL}/answer`, answerData);

    if (!res.data) throw new Error('Aucune donnée reçue');

    const { result, user } = res.data;
    let responseMsg;

    const balances = getDatabase('balances');
    if (!balances[userId]) balances[userId] = { money: 0 };

    if (result === "correct") {
      let baseMoneyReward = 10000;
      if (data.difficulty === 'hard') baseMoneyReward = 15000;
      if (data.difficulty === 'easy') baseMoneyReward = 7500;
      if (data.isFlag) baseMoneyReward = 12000;
      if (data.isAnime) baseMoneyReward = 15000;
      if (data.isDaily) baseMoneyReward = 20000;

      const streakBonus = (user.currentStreak || 0) * 1000;
      const totalMoneyReward = baseMoneyReward + streakBonus;

      balances[userId].money += totalMoneyReward;
      saveDatabase('balances', balances);

      const difficultyBonus = data.difficulty === 'hard' ? ' 🔥' : data.difficulty === 'easy' ? ' ⭐' : '';
      const streakBonus2 = (user.currentStreak || 0) >= 5 ? ` 🚀 ${user.currentStreak}x série !` : '';

      responseMsg = 
        `🎉 𝗕𝗼𝗻𝗻𝗲 𝗿𝗲́𝗽𝗼𝗻𝘀𝗲 !\n` +
        `━━━━━━━━━━\n\n` +
        `💰 𝗔𝗿𝗴𝗲𝗻𝘁: +${totalMoneyReward.toLocaleString()}\n` +
        `✨ 𝗫𝗣: +${user.xpGained || 15}\n` +
        `📊 𝗦𝗰𝗼𝗿𝗲: ${user.correct || 0}/${user.total || 0} (${user.accuracy || 0}%)\n` +
        `🔥 𝗦𝗲́𝗿𝗶𝗲: ${user.currentStreak || 0}\n` +
        `⚡ 𝗧𝗲𝗺𝗽𝘀: ${timeSpent.toFixed(1)}s\n` +
        `🎯 𝗫𝗣 𝗧𝗼𝘁𝗮𝗹: ${user.xp || 0}/1000\n` +
        `💰 𝗦𝗼𝗹𝗱𝗲: ${balances[userId].money.toLocaleString()}\n` +
        `👤 ${userName}` + difficultyBonus + streakBonus2;
    } else {
      responseMsg = 
        `❌ 𝗠𝗮𝘂𝘃𝗮𝗶𝘀𝗲 𝗿𝗲́𝗽𝗼𝗻𝘀𝗲\n` +
        `━━━━━━━━━━\n\n` +
        `🎯 𝗕𝗼𝗻𝗻𝗲 𝗿𝗲́𝗽𝗼𝗻𝘀𝗲: ${data.correctAnswer}\n` +
        `📊 𝗦𝗰𝗼𝗿𝗲: ${user.correct || 0}/${user.total || 0} (${user.accuracy || 0}%)\n` +
        `💔 𝗦𝗲́𝗿𝗶𝗲 𝗿𝗲́𝗶𝗻𝗶𝘁𝗶𝗮𝗹𝗶𝘀𝗲́𝗲\n` +
        `👤 ${userName}` + (data.isFlag ? ' 🏁' : '') + (data.isAnime ? ' 🎌' : '');
    }

    await bot.sendMessage(chatId, responseMsg, { reply_to_message_id: msg.message_id });

    if (user.achievements && user.achievements.length > 0) {
      balances[userId].money += 50000;
      saveDatabase('balances', balances);
      const achievementMsg = user.achievements.map(ach => `🏆 ${ach}`).join('\n');
      await bot.sendMessage(chatId, 
        `🏆 𝗦𝘂𝗰𝗰𝗲̀𝘀 𝗱𝗲́𝗯𝗹𝗼𝗾𝘂𝗲́ !\n${achievementMsg}\n💰 +50 000 pièces bonus !\n✨ +100 XP bonus !`,
        { reply_to_message_id: msg.message_id }
      );
    }

    global.teamnix.replies.delete(replyMsg.message_id);
  } catch (err) {
    console.error("Answer error:", err);
    const errorMsg = err.response?.data?.error || err.message || "Erreur inconnue";
    bot.sendMessage(chatId, `⚠️ Erreur lors du traitement: ${errorMsg}`, { reply_to_message_id: msg.message_id });
  }
}

module.exports = { onStart, onReply, nix };