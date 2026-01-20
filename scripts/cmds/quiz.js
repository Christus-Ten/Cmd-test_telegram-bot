const axios = require("axios");
const fs = require('fs');
const path = require('path');

const nix = {
  name: "quiz",
  version: "4.0.0",
  aliases: ["q", "qz"],
  description: "Suite complète de jeux Quiz (Général, Anime, Drapeaux, Daily) en Français.",
  author: "Christus", 
  prefix: true,
  category: "game",
  role: 0,
  cooldown: 5,
  guide: "{p}quiz <mode>\nModes: anime, flag, torf, daily, rank, lb, hard, medium, easy",
};

const BASE_URL = 'https://qizapi.onrender.com/api';

/* ================= OUTILS & TRADUCTION ================= */

async function translate(text) {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fr&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    return res.data[0].map(segment => segment[0]).join("");
  } catch (e) {
    return text;
  }
}

const getBalanceData = () => {
  const dataPath = path.join(process.cwd(), 'database', 'balance.json');
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
};

const saveData = (data) => {
  const dataPath = path.join(process.cwd(), 'database', 'balance.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

function generateProgressBar(percentile) {
  const filled = Math.round(percentile / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/* ================= FONCTION PRINCIPALE ================= */

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const command = args[0]?.toLowerCase();
  const userId = msg.from.id;

  if (!command || command === "help") {
    return bot.sendMessage(chatId, 
      `🎮 MENU QUIZ ULTIME 🇫🇷\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🔥 Modes de Jeu :\n` +
      `• {p}quiz random : Question aléatoire\n` +
      `• {p}quiz anime : Quiz Manga/Anime 🎌\n` +
      `• {p}quiz flag : Devine le drapeau 🏳️\n` +
      `• {p}quiz torf : Vrai ou Faux ⚖️\n` +
      `• {p}quiz daily : Défi Quotidien 📅\n\n` +
      `📊 Statistiques :\n` +
      `• {p}quiz rank : Ton profil\n` +
      `• {p}quiz lb : Classement mondial\n` +
      `• {p}quiz <catégorie> : (ex: science, history)\n` +
      `━━━━━━━━━━━━━━━━`.replace(/{p}/g, "/")
    );
  }

  if (command === "rank" || command === "profile") return handleRank(chatId, msg, bot);
  if (command === "lb" || command === "leaderboard") return handleLeaderboard(chatId, msg, bot, args[1]);

  let endpoint = `${BASE_URL}/question`;
  let params = { userId: userId };
  let mode = "classic";
  
  if (command === "daily") {
    endpoint = `${BASE_URL}/challenge/daily`;
    mode = "daily";
  } else if (command === "anime") {
    params.category = "anime";
    mode = "anime";
  } else if (command === "flag") {
    params.category = "flag";
    mode = "flag";
  } else if (command === "torf") {
    params.category = "torf";
    mode = "torf";
  } else if (["easy", "medium", "hard"].includes(command)) {
    params.difficulty = command;
  } else if (command !== "random") {
    params.category = command;
  }

  try {
    const res = await axios.get(endpoint, { params });
    const data = res.data;
    const quizData = mode === "daily" ? data.question : data;
    const { _id, question, options, answer, difficulty, imageUrl, category } = quizData;
    
    const [frQuestion, frOptions] = await Promise.all([
      translate(question),
      options ? Promise.all(options.map(opt => translate(opt))) : null
    ]);

    let displayMsg = "";
    
    if (mode === "torf") {
      displayMsg = `
⚖️ VRAI ou FAUX ?
━━━━━━━━━━━━━━━━
❓ ${frQuestion}

🅰️ : Vrai
🅱️ : Faux
━━━━━━━━━━━━━━━━
Répondez A ou B (30s)
      `.trim();
    } else {
      const optText = frOptions.map((opt, i) => `├‣ ${String.fromCharCode(65 + i)}) ${opt}`).join("\n");
      const title = mode === "anime" ? "🎌 ANIME" : mode === "flag" ? "🏳️ DRAPEAU" : `📚 ${category?.toUpperCase() || "QUIZ"}`;
      
      displayMsg = `
╭──✦ ${title}
├‣ Niveau : ${difficulty || "Normal"}
├────────────────
├‣ ❓ ${frQuestion}
${optText}
╰──────────────────‣
Répondez A, B, C ou D. (30s)
      `.trim();
    }

    let sentMessage;
    const imgToSend = imageUrl || (mode === "flag" ? question : null); 

    if (imgToSend && (imgToSend.startsWith('http'))) {
       sentMessage = await bot.sendPhoto(chatId, imgToSend, {
         caption: displayMsg,
         reply_to_message_id: msg.message_id
       });
    } else {
       sentMessage = await bot.sendMessage(chatId, displayMsg, {
         reply_to_message_id: msg.message_id
       });
    }

    global.teamnix.replies.set(sentMessage.message_id, {
      nix,
      type: "quiz_reply",
      authorId: userId,
      correctAnswer: answer,
      options: options,
      questionId: mode === "daily" ? data.question._id : _id,
      startTime: Date.now(),
      mode,
      difficulty,
      isDaily: mode === "daily"
    });

    setTimeout(() => {
      if (global.teamnix.replies.has(sentMessage.message_id)) {
        global.teamnix.replies.delete(sentMessage.message_id);
        bot.sendMessage(chatId, `⏰ Temps écoulé ! La réponse était : ${answer}`, { reply_to_message_id: sentMessage.message_id });
      }
    }, 30000);

  } catch (error) {
    bot.sendMessage(chatId, "⚠️ Erreur : Impossible de récupérer le quiz ou catégorie invalide.", { reply_to_message_id: msg.message_id });
  }
}

/* ================= GESTION RÉPONSE ================= */

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  if (data.type !== "quiz_reply" || userId !== data.authorId) return;

  const userReply = msg.text?.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(userReply)) return;

  const timeSpent = (Date.now() - data.startTime) / 1000;

  try {
    let answerToSend = userReply; 
    if (data.options && data.options.length > 0) {
        const index = userReply.charCodeAt(0) - 65;
        if (index >= 0 && index < data.options.length) answerToSend = data.options[index];
    }
    if (data.mode === "torf") answerToSend = userReply === "A" ? "True" : "False";

    const res = await axios.post(`${BASE_URL}/answer`, {
      userId: userId,
      questionId: data.questionId,
      answer: answerToSend,
      timeSpent,
      userName: msg.from.first_name
    });

    const { result, user } = res.data;
    global.teamnix.replies.delete(replyMsg.message_id);

    if (result === "correct") {
      let baseReward = 10000;
      if (data.mode === "anime") baseReward = 15000;
      if (data.mode === "flag") baseReward = 12000;
      if (data.isDaily) baseReward = 20000;
      
      const streakBonus = (user.currentStreak || 0) * 500;
      const totalReward = baseReward + streakBonus;

      let balances = getBalanceData();
      balances[userId] = balances[userId] || { money: 0 };
      balances[userId].money += totalReward;
      saveData(balances);

      const msgSuccess = `
🎉 EXCELLENT ${msg.from.first_name} !
━━━━━━━━━━━━━━━━━━
💰 Gain : +${totalReward.toLocaleString()} 
✨ XP : +${user.xpGained || 15}
🔥 Série : ${user.currentStreak} 🔥
⚡ Temps : ${timeSpent.toFixed(1)}s
📊 Précision : ${user.accuracy}%
━━━━━━━━━━━━━━━━━━
💰 Solde total : ${balances[userId].money.toLocaleString()}
      `.trim();

      bot.sendMessage(chatId, msgSuccess, { reply_to_message_id: msg.message_id });
    } else {
      bot.sendMessage(chatId, `❌ Raté !\n\n🎯 La bonne réponse était : ${data.correctAnswer}\n💔 Série brisée.`, { reply_to_message_id: msg.message_id });
    }
  } catch (error) {
    bot.sendMessage(chatId, "⚠️ Erreur de validation.", { reply_to_message_id: msg.message_id });
  }
}

/* ================= STATS ================= */

async function handleRank(chatId, msg, bot) {
  try {
    const res = await axios.get(`${BASE_URL}/user/${msg.from.id}`);
    const u = res.data;
    if (!u || u.total === 0) return bot.sendMessage(chatId, "❌ Jouez d'abord !");

    const txt = `
👤 PROFIL JOUEUR : ${msg.from.first_name}
━━━━━━━━━━━━━━━━━━
🏆 Rang Mondial : #${u.position}
🎖️ Titre : ${getUserTitle(u.correct)}

📊 Stats :
✅ Correct : ${u.correct}
❌ Erreur : ${u.wrong}
🎯 Précision : ${u.accuracy}%
🔥 Série max : ${u.bestStreak}

✨ Niveau :
Progression : ${generateProgressBar(u.percentile || 0)}
    `.trim();
    bot.sendMessage(chatId, txt, { reply_to_message_id: msg.message_id });
  } catch (e) {
    bot.sendMessage(chatId, "⚠️ Erreur profil.");
  }
}

async function handleLeaderboard(chatId, msg, bot, pageArg) {
  const page = parseInt(pageArg) || 1;
  try {
    const res = await axios.get(`${BASE_URL}/leaderboards?page=${page}&limit=10`);
    const list = res.data.rankings;
    let text = `🏆 CLASSEMENT MONDIAL (Page ${page})\n━━━━━━━━━━━━━━━━\n`;
    list.forEach((u, i) => {
      text += `#${(page - 1) * 10 + i + 1} ${u.name}\n✅ ${u.correct} pts | 🎯 ${u.accuracy}%\n\n`;
    });
    bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  } catch (e) {
    bot.sendMessage(chatId, "⚠️ Erreur Leaderboard.");
  }
}

function getUserTitle(correct) {
  if (correct >= 5000) return '👑 Quiz Dieu';
  if (correct >= 1000) return '⚡ Quiz Titan';
  if (correct >= 500) return '🎓 Maître';
  return '👶 Débutant';
}

module.exports = { onStart, onReply, nix };
