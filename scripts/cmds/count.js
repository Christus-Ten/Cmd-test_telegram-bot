const fs = require('fs');
const path = require('path');

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

function getOrdinalSuffix(rank) {
  const j = rank % 10, k = rank % 100;
  if (j === 1 && k !== 11) return `${rank}st`;
  if (j === 2 && k !== 12) return `${rank}nd`;
  if (j === 3 && k !== 13) return `${rank}rd`;
  return `${rank}th`;
}

const nix = {
  name: "count",
  version: "1.0.0",
  aliases: ["msgcount", "totalmsg"],
  description: "Count messages and ranks of users in the chat",
  author: "Samir Thakuri (converted)",
  prefix: true,
  category: "utility",
  role: 0,
  cooldown: 5,
  guide: "{p}count [<user_id>/all]"
};

async function onStart({ bot, msg, chatId, args }) {
  try {
    let threads = getDatabase('threads');
    
    // Initialize thread data if it doesn't exist
    if (!threads[chatId]) {
      threads[chatId] = {
        users: {}
      };
      saveDatabase('threads', threads);
    }

    const thread = threads[chatId];
    const usersData = thread.users || {};
    const usersArray = Object.entries(usersData).map(([userId, totalMsg]) => ({
      userId,
      totalMsg: parseInt(totalMsg) || 0
    }));

    usersArray.sort((a, b) => b.totalMsg - a.totalMsg);

    // Helper to get user name
    const getUserName = (userId) => {
      const usersDb = getDatabase('users');
      const userInfo = usersDb[userId];
      if (userInfo) {
        return `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userId;
      }
      // Fallback: try to get from msg if it's the current user
      if (userId === msg.from.id.toString()) {
        return msg.from.first_name || msg.from.username || userId;
      }
      return userId;
    };

    if (args.length === 0) {
      const userId = msg.from.id.toString();
      const userIndex = usersArray.findIndex(u => u.userId === userId);

      if (userIndex === -1 || usersArray[userIndex].totalMsg === 0) {
        return bot.sendMessage(chatId, 'You have no messages recorded yet.', {
          reply_to_message_id: msg.message_id
        });
      }

      const totalMsg = usersArray[userIndex].totalMsg;
      const position = getOrdinalSuffix(userIndex + 1);

      return bot.sendMessage(chatId, `You have ranked ${position} position with a total of ${totalMsg} messages.`, {
        reply_to_message_id: msg.message_id
      });
    }

    if (args[0].toLowerCase() === 'all') {
      if (usersArray.length === 0) {
        return bot.sendMessage(chatId, 'No message data available for this group yet.', {
          reply_to_message_id: msg.message_id
        });
      }

      const limit = 20;
      const displayUsers = usersArray.slice(0, limit);
      let message = '📊 Message ranks:\n';
      for (let i = 0; i < displayUsers.length; i++) {
        const user = displayUsers[i];
        const rank = getOrdinalSuffix(i + 1);
        const name = getUserName(user.userId);
        message += `${rank}. ${name} - ${user.totalMsg}\n`;
      }
      if (usersArray.length > limit) {
        message += `... and ${usersArray.length - limit} more.`;
      }
      return bot.sendMessage(chatId, message, {
        reply_to_message_id: msg.message_id
      });
    }

    // Count messages for the specified user ID
    const userId = args[0].toString();
    const userIndex = usersArray.findIndex(u => u.userId === userId);

    if (userIndex === -1) {
      return bot.sendMessage(chatId, `User with ID ${userId} is not in the message data.`, {
        reply_to_message_id: msg.message_id
      });
    }

    const totalMsg = usersArray[userIndex].totalMsg;
    const position = getOrdinalSuffix(userIndex + 1);
    const fullName = getUserName(userId);

    return bot.sendMessage(chatId, `${fullName} has ranked ${position} position with a total of ${totalMsg} messages.`, {
      reply_to_message_id: msg.message_id
    });

  } catch (error) {
    console.error('Error executing count command:', error);
    bot.sendMessage(chatId, 'Error executing count command.', {
      reply_to_message_id: msg.message_id
    });
  }
}

async function onReply({ bot, message, msg, chatId, userId, data, replyMsg }) {
  // Not used
}

module.exports = { onStart, onReply, nix };
