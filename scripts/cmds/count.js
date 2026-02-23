const fs = require('fs');
const path = require('path');

// Database helpers (copied from telequiz.js)
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
  author: "Christus",
  prefix: true,
  category: "utility",
  role: 0,
  cooldown: 5,
  guide: "{p}count [<user_id>/all]"
};

async function onStart({ bot, msg, chatId, args }) {
  try {
    const threads = getDatabase('threads');
    const thread = threads[chatId];

    if (!thread || !thread.users || Object.keys(thread.users).length === 0) {
      return bot.sendMessage(chatId, 'No message data available for this group.', {
        reply_to_message_id: msg.message_id
      });
    }

    const usersData = thread.users; // { userId: totalMsg, ... }
    const usersArray = Object.entries(usersData).map(([userId, totalMsg]) => ({
      userId,
      totalMsg: parseInt(totalMsg)
    }));

    usersArray.sort((a, b) => b.totalMsg - a.totalMsg);

    if (args.length === 0) {
      // Count messages for the user who executed the command
      const userId = msg.from.id.toString();
      const userIndex = usersArray.findIndex(u => u.userId === userId);

      if (userIndex === -1) {
        return bot.sendMessage(chatId, 'You are not in the message data.', {
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
      // Count messages for all users (limit to first 20 to avoid long messages)
      const limit = 20;
      const displayUsers = usersArray.slice(0, limit);
      let message = '📊 Message ranks:\n';
      for (let i = 0; i < displayUsers.length; i++) {
        const user = displayUsers[i];
        const rank = getOrdinalSuffix(i + 1);
        // Try to get user name from users database
        const usersDb = getDatabase('users');
        const userInfo = usersDb[user.userId];
        const name = userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : user.userId;
        message += `${rank}. ${name || user.userId} - ${user.totalMsg}\n`;
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

    const usersDb = getDatabase('users');
    const userInfo = usersDb[userId];
    if (!userInfo) {
      return bot.sendMessage(chatId, `User with ID ${userId} does not exist in the database.`, {
        reply_to_message_id: msg.message_id
      });
    }

    const totalMsg = usersArray[userIndex].totalMsg;
    const position = getOrdinalSuffix(userIndex + 1);
    const fullName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();

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
