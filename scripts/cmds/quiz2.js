const path = require('path');
const fs = require('fs');
const { randomInt } = require('crypto');

const quizDataPath = path.join(__dirname, 'json');
if (!fs.existsSync(quizDataPath)) {
  fs.mkdirSync(quizDataPath, { recursive: true });
}

const activeQuizzes = new Map();

const nix = {
  name: "quiz2",
  version: "1.0.0",
  aliases: ["quizgame"],
  description: "Jouer à un jeu de quiz",
  author: "Christus",
  prefix: true,
  category: "games",
  role: 0,
  cooldown: 5,
  guide: "{p}quiz"
};

async function getRandomQuestion() {
  const allFiles = fs.readdirSync(quizDataPath).filter(file => file.endsWith('.json'));
  if (allFiles.length === 0) return null;

  const randomFile = allFiles[randomInt(allFiles.length)];
  const filePath = path.join(quizDataPath, randomFile);

  try {
    const data = JSON.parse(fs.readFileSync(filePath));
    return data[randomInt(data.length)];
  } catch (error) {
    console.error(`Error reading quiz data from ${filePath}:`, error.message);
    return null;
  }
}

async function onStart({ bot, msg, chatId, args }) {
  const questionData = await getRandomQuestion();

  if (!questionData) {
    return bot.sendMessage(chatId, "❌ Impossible de charger une question. Réessayez plus tard.", {
      reply_to_message_id: msg.message_id
    });
  }

  // Clean up previous quiz for this chat
  if (activeQuizzes.has(chatId)) {
    clearTimeout(activeQuizzes.get(chatId).timeout);
    bot.removeListener('callback_query', activeQuizzes.get(chatId).handler);
    activeQuizzes.delete(chatId);
  }

  const options = [
    { text: 'A', callback_data: questionData.answer === 'A' ? 'correct' : 'incorrect' },
    { text: 'B', callback_data: questionData.answer === 'B' ? 'correct' : 'incorrect' },
    { text: 'C', callback_data: questionData.answer === 'C' ? 'correct' : 'incorrect' },
    { text: 'D', callback_data: questionData.answer === 'D' ? 'correct' : 'incorrect' }
  ];

  const inlineKeyboard = {
    inline_keyboard: [options]
  };

  const messageText = `${questionData.question}\n\n[A]. ${questionData.A}\n[B]. ${questionData.B}\n[C]. ${questionData.C}\n[D]. ${questionData.D}`;

  try {
    const sentMsg = await bot.sendMessage(chatId, messageText, {
      reply_markup: inlineKeyboard,
      reply_to_message_id: msg.message_id
    });

    const handleCallbackQuery = async (callbackQuery) => {
      if (callbackQuery.message.chat.id !== chatId) return;
      if (callbackQuery.message.message_id !== sentMsg.message_id) return;

      const isCorrect = callbackQuery.data === 'correct';
      const userName = callbackQuery.from.first_name || "Joueur";
      const responseText = isCorrect
        ? `🎉 Félicitations ${userName} ! Votre réponse est correcte.`
        : `😞 Désolé ${userName}, c'est incorrect ! La bonne réponse est ${questionData.answer}.`;

      try {
        await bot.sendMessage(chatId, responseText, {
          reply_to_message_id: callbackQuery.message.message_id
        });
        await bot.deleteMessage(chatId, callbackQuery.message.message_id);
      } catch (err) {
        console.error("Erreur lors de l'envoi de la réponse:", err);
      }

      // Clean up
      clearTimeout(activeQuizzes.get(chatId).timeout);
      bot.removeListener('callback_query', handleCallbackQuery);
      activeQuizzes.delete(chatId);
    };

    bot.on('callback_query', handleCallbackQuery);

    const timeout = setTimeout(() => {
      bot.removeListener('callback_query', handleCallbackQuery);
      activeQuizzes.delete(chatId);
      bot.sendMessage(chatId, "⏰ Temps écoulé ! Personne n'a répondu.", {
        reply_to_message_id: sentMsg.message_id
      });
    }, 60000);

    activeQuizzes.set(chatId, {
      handler: handleCallbackQuery,
      timeout
    });

  } catch (error) {
    console.error("Erreur lors de l'envoi de la question:", error);
    bot.sendMessage(chatId, "❌ Erreur lors de l'envoi de la question.", {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Not used
}

module.exports = { onStart, onReply, nix };
