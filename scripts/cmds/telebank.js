const fs = require('fs');
const path = require('path');

const nix = {
  name: "bank",
  version: "4.0",
  aliases: ["bk", "banque", "eco"],
  description: "Système bancaire complet avec investissements, immobilier, jeux et plus.",
  author: "Aryan Chauhan • Converti par Christus",
  prefix: true,
  category: "economy",
  role: 0,
  cooldown: 5,
  guide: "{p}bank help"
};

const marketData = {
  stocks: {
    "AAPL": { price: 150.25, change: 2.1, name: "Apple Inc." },
    "GOOGL": { price: 2800.50, change: 1.8, name: "Alphabet Inc." },
    "TSLA": { price: 800.75, change: -0.5, name: "Tesla Inc." },
    "MSFT": { price: 320.40, change: 1.2, name: "Microsoft Corp." },
    "AMZN": { price: 3200.00, change: 0.8, name: "Amazon.com Inc." },
    "META": { price: 330.00, change: 2.5, name: "Meta Platforms Inc." },
    "NVDA": { price: 450.00, change: 3.2, name: "NVIDIA Corp." },
    "NFLX": { price: 380.00, change: -1.1, name: "Netflix Inc." }
  },
  crypto: {
    "BTC": { price: 45000, change: 3.2, name: "Bitcoin" },
    "ETH": { price: 3200, change: 2.8, name: "Ethereum" },
    "BNB": { price: 400, change: 1.5, name: "Binance Coin" },
    "ADA": { price: 1.20, change: 4.1, name: "Cardano" },
    "DOT": { price: 25.50, change: 2.3, name: "Polkadot" },
    "LINK": { price: 28.00, change: 1.9, name: "Chainlink" },
    "MATIC": { price: 0.85, change: 5.1, name: "Polygon" },
    "SOL": { price: 120.00, change: 3.8, name: "Solana" }
  },
  bonds: {
    "US_TREASURY": { yield: 2.5, risk: "Low", term: "10 Year" },
    "CORPORATE": { yield: 3.8, risk: "Medium", term: "5 Year" },
    "MUNICIPAL": { yield: 2.1, risk: "Low", term: "7 Year" },
    "HIGH_YIELD": { yield: 6.2, risk: "High", term: "3 Year" }
  },
  properties: {
    "APARTMENT": { price: 250000, income: 2500, name: "City Apartment" },
    "HOUSE": { price: 500000, income: 4000, name: "Suburban House" },
    "MANSION": { price: 2000000, income: 15000, name: "Luxury Mansion" },
    "OFFICE": { price: 1000000, income: 8000, name: "Commercial Office" },
    "WAREHOUSE": { price: 750000, income: 6000, name: "Industrial Warehouse" },
    "MALL": { price: 5000000, income: 40000, name: "Shopping Mall" }
  },
  vehicles: {
    "TOYOTA": { price: 25000, depreciation: 0.85, name: "Toyota Camry" },
    "BMW": { price: 60000, depreciation: 0.70, name: "BMW M3" },
    "FERRARI": { price: 300000, depreciation: 0.90, name: "Ferrari 488" },
    "LAMBORGHINI": { price: 400000, depreciation: 0.85, name: "Lamborghini Huracan" },
    "ROLLS_ROYCE": { price: 500000, depreciation: 0.80, name: "Rolls-Royce Phantom" },
    "BUGATTI": { price: 3000000, depreciation: 0.75, name: "Bugatti Chiron" }
  },
  businesses: {
    "COFFEE_SHOP": { cost: 50000, income: 5000, employees: 3, name: "Coffee Shop" },
    "RESTAURANT": { cost: 150000, income: 12000, employees: 8, name: "Restaurant" },
    "TECH_STARTUP": { cost: 500000, income: 50000, employees: 20, name: "Tech Startup" },
    "HOTEL": { cost: 2000000, income: 150000, employees: 50, name: "Hotel Chain" },
    "BANK": { cost: 10000000, income: 800000, employees: 200, name: "Regional Bank" },
    "AIRLINE": { cost: 50000000, income: 3000000, employees: 1000, name: "Airline Company" }
  },
  luxury: {
    "ROLEX": { price: 15000, name: "Rolex Submariner" },
    "PAINTING": { price: 100000, name: "Van Gogh Replica" },
    "DIAMOND": { price: 50000, name: "5 Carat Diamond" },
    "YACHT": { price: 2000000, name: "Luxury Yacht" },
    "PRIVATE_JET": { price: 25000000, name: "Private Jet" },
    "ISLAND": { price: 100000000, name: "Private Island" }
  }
};

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

function formatMoney(amount) {
  if (isNaN(amount)) return "0 💰";
  const scales = [
    { value: 1e15, suffix: 'Q', color: '🌈' },
    { value: 1e12, suffix: 'T', color: '✨' },
    { value: 1e9, suffix: 'B', color: '💎' },
    { value: 1e6, suffix: 'M', color: '💰' },
    { value: 1e3, suffix: 'k', color: '💵' }
  ];
  const scale = scales.find(s => Math.abs(amount) >= s.value);
  if (scale) {
    const scaledValue = amount / scale.value;
    return `${scale.color}${scaledValue.toFixed(2)}${scale.suffix}`;
  }
  return `${amount.toLocaleString()} 💰`;
}

function generateProgressBar(percentile) {
  const filled = Math.round(percentile / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function createDefaultBank(userId) {
  return {
    userId,
    balance: 1000,
    bank: 0,
    savings: 0,
    vault: 0,
    loan: 0,
    loanDate: null,
    creditScore: 750,
    bankLevel: 1,
    multiplier: 1.0,
    premium: false,
    streak: 0,
    lastDaily: null,
    lastWork: null,
    lastRob: null,
    lastInterest: Date.now(),
    stocks: {},
    crypto: {},
    bonds: {},
    realEstate: [],
    businesses: [],
    vehicles: [],
    luxury: [],
    insurance: {},
    skills: { gambling: 0, trading: 0, business: 0, investing: 0 },
    achievements: [],
    transactions: [],
    lotteryTickets: 0
  };
}

async function onStart({ bot, message, msg, chatId, args, usages }) {
  const sub = args[0]?.toLowerCase();
  const userId = msg.from.id.toString();
  const userName = msg.from.first_name || "Joueur";

  const banks = getDatabase('bank');
  if (!banks[userId]) banks[userId] = createDefaultBank(userId);
  const bank = banks[userId];

  if (!sub || sub === "help") return showHelp(chatId, bot, msg);

  try {
    switch (sub) {
      case "balance":
      case "bal":
        return showBalance(chatId, bot, msg, bank, userName);

      case "deposit":
      case "dep":
        return deposit(chatId, bot, msg, args, bank, banks, userId);

      case "withdraw":
      case "wd":
        return withdraw(chatId, bot, msg, args, bank, banks, userId);

      case "transfer":
      case "send":
        return transfer(chatId, bot, msg, args, bank, banks, userId);

      case "loan":
        return loan(chatId, bot, msg, args, bank, banks, userId);

      case "repay":
        return repayLoan(chatId, bot, msg, args, bank, banks, userId);

      case "savings":
      case "save":
        return savings(chatId, bot, msg, args, bank, banks, userId);

      case "interest":
        return calculateInterest(chatId, bot, msg, bank, banks, userId);

      case "collect":
        return collectInterest(chatId, bot, msg, bank, banks, userId);

      case "history":
        return showHistory(chatId, bot, msg, bank);

      case "freeze":
        return freezeAccount(chatId, bot, msg, bank, banks, userId);

      case "daily":
        return dailyReward(chatId, bot, msg, bank, banks, userId);

      case "work":
        return work(chatId, bot, msg, bank, banks, userId);

      case "invest":
        return invest(chatId, bot, msg);

      case "stocks":
        return stocks(chatId, bot, msg, args, bank, banks, userId);

      case "crypto":
        return crypto(chatId, bot, msg, args, bank, banks, userId);

      case "bonds":
        return bonds(chatId, bot, msg, args, bank, banks, userId);

      case "portfolio":
        return portfolio(chatId, bot, msg, bank);

      case "market":
        return market(chatId, bot, msg);

      case "dividend":
        return dividend(chatId, bot, msg, bank, banks, userId);

      case "business":
        return business(chatId, bot, msg, args, bank, banks, userId);

      case "shop":
        return shop(chatId, bot, msg, args, bank, banks, userId);

      case "property":
      case "realestate":
        return realEstate(chatId, bot, msg, args, bank, banks, userId);

      case "house":
        return house(chatId, bot, msg, args, bank, banks, userId);

      case "rent":
        return rent(chatId, bot, msg, bank, banks, userId);

      case "luxury":
        return luxury(chatId, bot, msg, args, bank, banks, userId);

      case "car":
        return car(chatId, bot, msg, args, bank, banks, userId);

      case "gamble":
        return gamble(chatId, bot, msg, args, bank, banks, userId);

      case "slots":
        return slots(chatId, bot, msg, args, bank, banks, userId);

      case "blackjack":
        return blackjack(chatId, bot, msg, args, bank, banks, userId);

      case "roulette":
        return roulette(chatId, bot, msg, args, bank, banks, userId);

      case "lottery":
        return lottery(chatId, bot, msg, args, bank, banks, userId);

      case "premium":
        return premium(chatId, bot, msg, args, bank, banks, userId);

      case "vault":
        return vault(chatId, bot, msg, args, bank, banks, userId);

      case "insurance":
        return insurance(chatId, bot, msg, args, bank, banks, userId);

      case "credit":
        return credit(chatId, bot, msg, bank);

      case "achievements":
        return achievements(chatId, bot, msg, bank);

      case "leaderboard":
      case "lb":
        return leaderboard(chatId, bot, msg, banks);

      case "rob":
        return rob(chatId, bot, msg, args, bank, banks, userId, userName);

      default:
        return bot.sendMessage(chatId,
          `❌ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝗲 𝗶𝗻𝗰𝗼𝗻𝗻𝘂𝗲\n━━━━━━━━━━━━━━\n\nUtilisez /bank help pour voir les commandes.`,
          { reply_to_message_id: msg.message_id }
        );
    }
  } catch (err) {
    console.error("Bank error:", err);
    return bot.sendMessage(chatId,
      `⚠️ 𝗘𝗿𝗿𝗲𝘂𝗿\n━━━━━━━━\n\nUne erreur est survenue. Veuillez réessayer plus tard.`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function showHelp(chatId, bot, msg) {
  const helpText =
    `🏦 𝗦𝗬𝗦𝗧𝗘̀𝗠𝗘 𝗕𝗔𝗡𝗖𝗔𝗜𝗥𝗘\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `💰 𝗕𝗔𝗦𝗜𝗤𝗨𝗘\n` +
    `• /bank balance - Voir votre profil\n` +
    `• /bank deposit <montant|all> - Déposer\n` +
    `• /bank withdraw <montant|all> - Retirer\n` +
    `• /bank transfer @user <montant> - Transférer\n` +
    `• /bank loan <montant> - Emprunter\n` +
    `• /bank repay <montant> - Rembourser\n` +
    `• /bank savings <montant> - Épargne\n` +
    `• /bank interest - Calculer les intérêts\n` +
    `• /bank collect - Récolter les intérêts\n` +
    `• /bank history - Historique\n` +
    `• /bank daily - Récompense quotidienne\n` +
    `• /bank work - Travailler\n\n` +
    `📈 𝗜𝗡𝗩𝗘𝗦𝗧𝗜𝗦𝗦𝗘𝗠𝗘𝗡𝗧𝗦\n` +
    `• /bank market - Marché global\n` +
    `• /bank stocks [list|buy|sell] - Actions\n` +
    `• /bank crypto [list|buy|sell] - Crypto\n` +
    `• /bank bonds [list|buy] - Obligations\n` +
    `• /bank portfolio - Votre portefeuille\n` +
    `• /bank dividend - Récolter dividendes\n\n` +
    `🏢 𝗘𝗡𝗧𝗥𝗘𝗣𝗥𝗜𝗦𝗘𝗦\n` +
    `• /bank business [list|buy|collect] - Entreprises\n` +
    `• /bank shop [list|buy] - Boutique\n\n` +
    `🏠 𝗜𝗠𝗠𝗢𝗕𝗜𝗟𝗜𝗘𝗥\n` +
    `• /bank property [list|buy] - Propriétés\n` +
    `• /bank rent - Collecter loyers\n\n` +
    `💎 𝗟𝗨𝗫𝗘\n` +
    `• /bank luxury [list|buy] - Objets de luxe\n` +
    `• /bank car [list|buy] - Véhicules\n\n` +
    `🎰 𝗝𝗘𝗨𝗫\n` +
    `• /bank gamble <montant> - Jeu simple\n` +
    `• /bank slots <montant> - Machine à sous\n` +
    `• /bank blackjack <montant> - Blackjack\n` +
    `• /bank roulette <montant> <bet> - Roulette\n` +
    `• /bank lottery [buy|check] - Loterie\n\n` +
    `⭐ 𝗣𝗥𝗘𝗠𝗜𝗨𝗠\n` +
    `• /bank premium [buy] - Premium\n` +
    `• /bank vault [deposit|withdraw] - Coffre\n` +
    `• /bank insurance [list|buy] - Assurances\n` +
    `• /bank credit - Score de crédit\n` +
    `• /bank achievements - Succès\n` +
    `• /bank leaderboard - Classement\n` +
    `• /bank rob @user - Voler (risqué)`;
  return bot.sendMessage(chatId, helpText, { reply_to_message_id: msg.message_id });
}

async function showBalance(chatId, bot, msg, bank, userName) {
  const totalLiquid = bank.balance + bank.savings + bank.vault;
  const totalInvestments = calculatePortfolioValue(bank);
  const totalAssets = totalInvestments +
    calculateRealEstateValue(bank) +
    calculateBusinessValue(bank) +
    calculateVehicleValue(bank) +
    calculateLuxuryValue(bank);
  const netWorth = totalLiquid + totalAssets;

  let wealthTier = "🔰 Débutant";
  if (netWorth >= 1000000000) wealthTier = "👑 Milliardaire";
  else if (netWorth >= 1000000) wealthTier = "⭐ Millionnaire";
  else if (netWorth >= 100000) wealthTier = "✨ Riche";
  else if (netWorth >= 10000) wealthTier = "🚀 En croissance";

  let creditRating = "🔴 Mauvais";
  if (bank.creditScore >= 800) creditRating = "🟢 Excellent";
  else if (bank.creditScore >= 740) creditRating = "🟢 Très bon";
  else if (bank.creditScore >= 670) creditRating = "🟡 Bon";
  else if (bank.creditScore >= 580) creditRating = "🟠 Correct";

  const text =
    `💳 𝗣𝗼𝗿𝘁𝗲𝗳𝗲𝘂𝗶𝗹𝗹𝗲 𝗱𝗲 ${userName}\n` +
    `━━━━━━━━━━━━━━━━\n\n` +
    `💰 𝗟𝗶𝗾𝘂𝗶𝗱𝗲𝘀\n` +
    `💵 Portefeuille: ${formatMoney(bank.balance)}\n` +
    `🏦 Banque: ${formatMoney(bank.bank || 0)}\n` +
    `🏛️ Épargne: ${formatMoney(bank.savings)}\n` +
    `🔐 Coffre: ${formatMoney(bank.vault)}\n` +
    `├─ Total liquide: ${formatMoney(totalLiquid)}\n\n` +
    `📊 𝗔𝗰𝘁𝗶𝗳𝘀\n` +
    `📈 Investissements: ${formatMoney(totalInvestments)}\n` +
    `🏠 Immobilier: ${formatMoney(calculateRealEstateValue(bank))}\n` +
    `🏢 Entreprises: ${formatMoney(calculateBusinessValue(bank))}\n` +
    `🚗 Véhicules: ${formatMoney(calculateVehicleValue(bank))}\n` +
    `💎 Luxe: ${formatMoney(calculateLuxuryValue(bank))}\n` +
    `├─ Total actifs: ${formatMoney(totalAssets)}\n\n` +
    `🏆 𝗥𝗶𝗰𝗵𝗲𝘀𝘀𝗲 𝗻𝗲𝘁𝘁𝗲: ${formatMoney(netWorth)}\n` +
    `📊 ${wealthTier}\n` +
    `📉 Dette: ${formatMoney(bank.loan || 0)}\n` +
    `📈 Score de crédit: ${bank.creditScore}/850 ${creditRating}\n` +
    `⚡ Multiplicateur: ${bank.multiplier}x${bank.premium ? " (Premium)" : ""}\n` +
    `🔥 Série: ${bank.streak || 0} jours\n` +
    `🏆 Succès: ${bank.achievements.length}`;
  return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
}

async function deposit(chatId, bot, msg, args, bank, banks, userId) {
  const amount = args[1] === "all" ? bank.balance : parseInt(args[1]);
  if (isNaN(amount) || amount <= 0 || bank.balance < amount) {
    return bot.sendMessage(chatId,
      `❌ 𝗠𝗼𝗻𝘁𝗮𝗻𝘁 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━━\n\nSolde actuel: ${formatMoney(bank.balance)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  bank.balance -= amount;
  bank.bank = (bank.bank || 0) + amount;
  bank.transactions.push({
    type: "deposit",
    amount,
    date: Date.now(),
    description: "Dépôt bancaire"
  });
  if (!bank.achievements.includes("First Deposit")) {
    bank.achievements.push("First Deposit");
  }
  if (amount >= 1000000 && !bank.achievements.includes("Million Dollar Deposit")) {
    bank.achievements.push("Million Dollar Deposit");
  }
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `💰 𝗗𝗲́𝗽𝗼̂𝘁 𝗲𝗳𝗳𝗲𝗰𝘁𝘂𝗲́\n━━━━━━━━━━━━━\n\n` +
    `💵 Montant: ${formatMoney(amount)}\n` +
    `🏦 Nouveau solde banque: ${formatMoney(bank.bank)}\n` +
    `💳 Solde liquide: ${formatMoney(bank.balance)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function withdraw(chatId, bot, msg, args, bank, banks, userId) {
  const amount = args[1] === "all" ? bank.bank : parseInt(args[1]);
  if (isNaN(amount) || amount <= 0 || (bank.bank || 0) < amount) {
    return bot.sendMessage(chatId,
      `❌ 𝗠𝗼𝗻𝘁𝗮𝗻𝘁 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━━\n\nSolde banque: ${formatMoney(bank.bank || 0)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  bank.bank -= amount;
  bank.balance += amount;
  bank.transactions.push({
    type: "withdrawal",
    amount,
    date: Date.now(),
    description: "Retrait bancaire"
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `💸 𝗥𝗲𝘁𝗿𝗮𝗶𝘁 𝗲𝗳𝗳𝗲𝗰𝘁𝘂𝗲́\n━━━━━━━━━━━━━\n\n` +
    `💵 Montant: ${formatMoney(amount)}\n` +
    `💳 Nouveau solde liquide: ${formatMoney(bank.balance)}\n` +
    `🏦 Solde banque restant: ${formatMoney(bank.bank || 0)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function transfer(chatId, bot, msg, args, bank, banks, userId) {
  const targetMsg = msg.reply_to_message;
  if (!targetMsg) {
    return bot.sendMessage(chatId,
      `❌ 𝗨𝘁𝗶𝗹𝗶𝘀𝗮𝘁𝗶𝗼𝗻\n━━━━━━━━━━━\n\nRépondez au message de la personne à qui vous voulez transférer.\nExemple: /bank transfer 5000`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const targetId = targetMsg.from.id.toString();
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0 || bank.bank < amount) {
    return bot.sendMessage(chatId,
      `❌ 𝗠𝗼𝗻𝘁𝗮𝗻𝘁 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━━\n\nSolde banque: ${formatMoney(bank.bank || 0)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (!banks[targetId]) banks[targetId] = createDefaultBank(targetId);
  bank.bank -= amount;
  banks[targetId].bank += amount;
  bank.transactions.push({
    type: "transfer_out",
    amount,
    date: Date.now(),
    description: `Transfert vers ${targetMsg.from.first_name || targetId}`
  });
  banks[targetId].transactions.push({
    type: "transfer_in",
    amount,
    date: Date.now(),
    description: `Transfert de ${msg.from.first_name || userId}`
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `📤 𝗧𝗿𝗮𝗻𝘀𝗳𝗲𝗿𝘁 𝗲𝗳𝗳𝗲𝗰𝘁𝘂𝗲́\n━━━━━━━━━━━━━━\n\n` +
    `💵 Montant: ${formatMoney(amount)}\n` +
    `👤 Destinataire: ${targetMsg.from.first_name || "Inconnu"}\n` +
    `🏦 Nouveau solde banque: ${formatMoney(bank.bank || 0)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function loan(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    const maxLoan = Math.floor(bank.creditScore * 1000);
    return bot.sendMessage(chatId,
      `💳 𝗣𝗿𝗲̂𝘁\n━━━━━━━\n\n` +
      `Score de crédit: ${bank.creditScore}\n` +
      `Montant maximum: ${formatMoney(maxLoan)}\n` +
      `Taux: 5% par semaine\n` +
      `Dette actuelle: ${bank.loan > 0 ? formatMoney(bank.loan) : "Aucune"}\n\n` +
      `Utilisation: /bank loan <montant>`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (bank.loan > 0) {
    return bot.sendMessage(chatId,
      `❌ 𝗣𝗿𝗲̂𝘁 𝗲𝗻 𝗰𝗼𝘂𝗿𝘀\n━━━━━━━━━━━━━\n\nVous avez déjà un prêt de ${formatMoney(bank.loan)}. Remboursez-le d'abord.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const maxLoan = Math.floor(bank.creditScore * 1000);
  if (amount > maxLoan) {
    return bot.sendMessage(chatId,
      `❌ 𝗠𝗼𝗻𝘁𝗮𝗻𝘁 𝗱𝗲́𝗽𝗮𝘀𝘀𝗲́\n━━━━━━━━━━━━━━\n\nMaximum autorisé: ${formatMoney(maxLoan)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  bank.bank += amount;
  bank.loan = amount;
  bank.loanDate = Date.now();
  bank.transactions.push({
    type: "loan",
    amount,
    date: Date.now(),
    description: "Prêt bancaire"
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `✅ 𝗣𝗿𝗲̂𝘁 𝗮𝗽𝗽𝗿𝗼𝘂𝘃𝗲́\n━━━━━━━━━━━━\n\n` +
    `Montant: ${formatMoney(amount)}\n` +
    `Nouveau solde banque: ${formatMoney(bank.bank)}\n` +
    `Taux: 5% par semaine`,
    { reply_to_message_id: msg.message_id }
  );
}

async function repayLoan(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  if (bank.loan <= 0) {
    return bot.sendMessage(chatId,
      `❌ 𝗔𝘂𝗰𝘂𝗻 𝗽𝗿𝗲̂𝘁\n━━━━━━━━━━━\n\nVous n'avez pas de prêt en cours.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (isNaN(amount) || amount <= 0 || bank.bank < amount) {
    return bot.sendMessage(chatId,
      `❌ 𝗠𝗼𝗻𝘁𝗮𝗻𝘁 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━━\n\nSolde banque: ${formatMoney(bank.bank)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const repay = Math.min(amount, bank.loan);
  bank.bank -= repay;
  bank.loan -= repay;
  if (bank.loan === 0) {
    bank.loanDate = null;
    bank.creditScore += 10;
  }
  bank.transactions.push({
    type: "loan_repayment",
    amount: repay,
    date: Date.now(),
    description: "Remboursement prêt"
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `✅ 𝗥𝗲𝗺𝗯𝗼𝘂𝗿𝘀𝗲𝗺𝗲𝗻𝘁 𝗲𝗳𝗳𝗲𝗰𝘁𝘂𝗲́\n━━━━━━━━━━━━━━━━━━\n\n` +
    `Montant remboursé: ${formatMoney(repay)}\n` +
    `Dette restante: ${bank.loan > 0 ? formatMoney(bank.loan) : "Aucune ✅"}\n` +
    `Nouveau solde banque: ${formatMoney(bank.bank)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function savings(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0 || bank.bank < amount) {
    return bot.sendMessage(chatId,
      `❌ 𝗠𝗼𝗻𝘁𝗮𝗻𝘁 𝗶𝗻𝘃𝗮𝗹𝗶𝗱𝗲\n━━━━━━━━━━━━━\n\nSolde banque: ${formatMoney(bank.bank)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  bank.bank -= amount;
  bank.savings += amount;
  bank.transactions.push({
    type: "savings_deposit",
    amount,
    date: Date.now(),
    description: "Dépôt épargne"
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `🏛️ 𝗘́𝗽𝗮𝗿𝗴𝗻𝗲\n━━━━━━━━\n\n` +
    `Montant déposé: ${formatMoney(amount)}\n` +
    `Nouvelle épargne: ${formatMoney(bank.savings)}\n` +
    `Taux: 3% par mois`,
    { reply_to_message_id: msg.message_id }
  );
}

async function calculateInterest(chatId, bot, msg, bank, banks, userId) {
  const now = Date.now();
  const last = bank.lastInterest || now;
  const hoursPassed = (now - last) / (1000 * 60 * 60);
  if (hoursPassed < 1) {
    return bot.sendMessage(chatId,
      `⏳ 𝗣𝗮𝘀 𝗲𝗻𝗰𝗼𝗿𝗲\n━━━━━━━━━━\n\nAttendez ${Math.ceil(60 - hoursPassed * 60)} minutes.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const savingsRate = 0.03 / (30 * 24);
  const vaultRate = 0.01 / (30 * 24);
  const loanRate = 0.05 / (7 * 24);
  const savingsInterest = Math.floor(bank.savings * savingsRate * hoursPassed);
  const vaultInterest = Math.floor(bank.vault * vaultRate * hoursPassed);
  const loanInterest = Math.floor(bank.loan * loanRate * hoursPassed);
  return bot.sendMessage(chatId,
    `📊 𝗜𝗻𝘁𝗲́𝗿𝗲̂𝘁𝘀 𝗽𝗿𝗲́𝘃𝘂𝘀\n━━━━━━━━━━━━━━\n\n` +
    `⏰ Période: ${Math.floor(hoursPassed)} heures\n` +
    `💰 Épargne: +${formatMoney(savingsInterest)}\n` +
    `🔐 Coffre: +${formatMoney(vaultInterest)}\n` +
    `💸 Intérêts prêt: -${formatMoney(loanInterest)}\n` +
    `📈 Net: ${formatMoney(savingsInterest + vaultInterest - loanInterest)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function collectInterest(chatId, bot, msg, bank, banks, userId) {
  const now = Date.now();
  const last = bank.lastInterest || now;
  const hoursPassed = (now - last) / (1000 * 60 * 60);
  if (hoursPassed < 1) {
    return bot.sendMessage(chatId,
      `⏳ 𝗣𝗮𝘀 𝗲𝗻𝗰𝗼𝗿𝗲\n━━━━━━━━━━\n\nAttendez ${Math.ceil(60 - hoursPassed * 60)} minutes.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const savingsRate = 0.03 / (30 * 24);
  const vaultRate = 0.01 / (30 * 24);
  const loanRate = 0.05 / (7 * 24);
  const savingsInterest = Math.floor(bank.savings * savingsRate * hoursPassed);
  const vaultInterest = Math.floor(bank.vault * vaultRate * hoursPassed);
  const loanInterest = Math.floor(bank.loan * loanRate * hoursPassed);
  bank.savings += savingsInterest;
  bank.vault += vaultInterest;
  bank.loan += loanInterest;
  bank.lastInterest = now;
  if (savingsInterest > 0) {
    bank.transactions.push({
      type: "interest_earned",
      amount: savingsInterest,
      date: now,
      description: "Intérêts épargne"
    });
  }
  if (vaultInterest > 0) {
    bank.transactions.push({
      type: "interest_earned",
      amount: vaultInterest,
      date: now,
      description: "Intérêts coffre"
    });
  }
  if (loanInterest > 0) {
    bank.transactions.push({
      type: "interest_charged",
      amount: loanInterest,
      date: now,
      description: "Intérêts prêt"
    });
  }
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `💰 𝗜𝗻𝘁𝗲́𝗿𝗲̂𝘁𝘀 𝗿𝗲́𝗰𝗼𝗹𝘁𝗲́𝘀\n━━━━━━━━━━━━━━\n\n` +
    `⏰ Période: ${Math.floor(hoursPassed)} heures\n` +
    `💰 Épargne: +${formatMoney(savingsInterest)}\n` +
    `🔐 Coffre: +${formatMoney(vaultInterest)}\n` +
    `💸 Intérêts prêt: -${formatMoney(loanInterest)}\n` +
    `📈 Net: ${formatMoney(savingsInterest + vaultInterest - loanInterest)}\n\n` +
    `Nouveaux soldes:\n` +
    `🏛️ Épargne: ${formatMoney(bank.savings)}\n` +
    `🔐 Coffre: ${formatMoney(bank.vault)}\n` +
    `📉 Dette: ${formatMoney(bank.loan)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function showHistory(chatId, bot, msg, bank) {
  const transactions = bank.transactions.slice(-15).reverse();
  if (transactions.length === 0) {
    return bot.sendMessage(chatId,
      `📋 𝗔𝘂𝗰𝘂𝗻𝗲 𝗵𝗶𝘀𝘁𝗼𝗿𝗶𝗾𝘂𝗲`,
      { reply_to_message_id: msg.message_id }
    );
  }
  let text = `📋 𝗛𝗶𝘀𝘁𝗼𝗿𝗶𝗾𝘂𝗲 (𝟭𝟱 𝗱𝗲𝗿𝗻𝗶𝗲̀𝗿𝗲𝘀)\n━━━━━━━━━━━━━━━━\n\n`;
  transactions.forEach((tx, i) => {
    const date = new Date(tx.date).toLocaleString('fr-FR').slice(0, -3);
    const emoji = tx.type.includes('win') ? '🎉' : tx.type.includes('loss') ? '💸' : '💼';
    text += `${emoji} ${tx.type.toUpperCase()}: ${formatMoney(tx.amount)} (${date})\n`;
  });
  return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
}

async function freezeAccount(chatId, bot, msg, bank, banks, userId) {
  bank.frozen = !bank.frozen;
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    bank.frozen ? `🔒 𝗖𝗼𝗺𝗽𝘁𝗲 𝗴𝗲𝗹𝗲́` : `🔓 𝗖𝗼𝗺𝗽𝘁𝗲 𝗱𝗲́𝗴𝗲𝗹𝗲́`,
    { reply_to_message_id: msg.message_id }
  );
}

async function dailyReward(chatId, bot, msg, bank, banks, userId) {
  const now = Date.now();
  const last = bank.lastDaily || 0;
  const oneDay = 24 * 60 * 60 * 1000;
  if (now - last < oneDay) {
    const remaining = oneDay - (now - last);
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return bot.sendMessage(chatId,
      `⏰ 𝗣𝗿𝗼𝗰𝗵𝗮𝗶𝗻𝗲 𝗿𝗲́𝗰𝗼𝗺𝗽𝗲𝗻𝘀𝗲 𝗱𝗮𝗻𝘀 ${hours}h ${mins}min`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (now - last < oneDay * 2) bank.streak = (bank.streak || 0) + 1;
  else bank.streak = 1;
  const base = 1000;
  const streakBonus = Math.min(bank.streak * 100, 2000);
  const levelBonus = bank.bankLevel * 500;
  const total = Math.floor((base + streakBonus + levelBonus) * bank.multiplier);
  bank.bank += total;
  bank.lastDaily = now;
  bank.transactions.push({
    type: "daily_reward",
    amount: total,
    date: now,
    description: `Récompense quotidienne (série ${bank.streak})`
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `🎁 𝗥𝗲́𝗰𝗼𝗺𝗽𝗲𝗻𝘀𝗲 𝗾𝘂𝗼𝘁𝗶𝗱𝗶𝗲𝗻𝗻𝗲\n━━━━━━━━━━━━━━━━━\n\n` +
    `💰 Montant: ${formatMoney(total)}\n` +
    `🔥 Série: ${bank.streak} jours\n` +
    `🏦 Nouveau solde banque: ${formatMoney(bank.bank)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function work(chatId, bot, msg, bank, banks, userId) {
  const now = Date.now();
  const last = bank.lastWork || 0;
  const cooldown = 4 * 60 * 60 * 1000;
  if (now - last < cooldown) {
    const remaining = cooldown - (now - last);
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return bot.sendMessage(chatId,
      `⏰ 𝗥𝗲𝗽𝗼𝘀𝗲𝘇 𝗲𝗻𝗰𝗼𝗿𝗲 ${hours}h ${mins}min`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const jobs = [
    { name: "Livreur", min: 500, max: 1500 },
    { name: "Data Entry", min: 300, max: 800 },
    { name: "Freelance", min: 1000, max: 3000 },
    { name: "Consultant", min: 2000, max: 5000 },
    { name: "Manager", min: 3000, max: 7000 }
  ];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
  const skillBonus = (bank.skills.business || 0) * 100;
  const total = Math.floor((salary + skillBonus) * bank.multiplier);
  bank.bank += total;
  bank.lastWork = now;
  bank.skills.business = (bank.skills.business || 0) + 1;
  bank.transactions.push({
    type: "salary",
    amount: total,
    date: now,
    description: `Travail: ${job.name}`
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `💼 𝗧𝗿𝗮𝘃𝗮𝗶𝗹 𝗲𝗳𝗳𝗲𝗰𝘁𝘂𝗲́\n━━━━━━━━━━━━━\n\n` +
    `Emploi: ${job.name}\n` +
    `Salaire de base: ${formatMoney(salary)}\n` +
    `Bonus compétence: ${formatMoney(skillBonus)}\n` +
    `Total gagné: ${formatMoney(total)}\n` +
    `Nouveau solde banque: ${formatMoney(bank.bank)}\n` +
    `Compétence entreprise +1 (${bank.skills.business})`,
    { reply_to_message_id: msg.message_id }
  );
}

async function invest(chatId, bot, msg) {
  return bot.sendMessage(chatId,
    `📊 𝗜𝗻𝘃𝗲𝘀𝘁𝗶𝘀𝘀𝗲𝗺𝗲𝗻𝘁𝘀\n━━━━━━━━━━━━\n\n` +
    `• /bank stocks [list|buy|sell]\n` +
    `• /bank crypto [list|buy|sell]\n` +
    `• /bank bonds [list|buy]\n` +
    `• /bank portfolio\n` +
    `• /bank market\n` +
    `• /bank dividend`,
    { reply_to_message_id: msg.message_id }
  );
}

async function stocks(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `📈 𝗠𝗮𝗿𝗰𝗵𝗲́ 𝗮𝗰𝘁𝗶𝗼𝗻𝘀\n━━━━━━━━━━━━\n\n`;
    for (const [sym, data] of Object.entries(marketData.stocks)) {
      const changeEmoji = data.change >= 0 ? "📈" : "📉";
      text += `${changeEmoji} ${sym} - $${data.price.toLocaleString()} (${data.change > 0 ? '+' : ''}${data.change}%)\n   ${data.name}\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝗮𝗰𝘁𝗶𝗼𝗻𝘀:\n`;
    if (Object.keys(bank.stocks).length === 0) text += "Aucune\n\n";
    else {
      for (const [sym, shares] of Object.entries(bank.stocks)) {
        const price = marketData.stocks[sym]?.price || 0;
        text += `• ${sym}: ${shares} actions (${formatMoney(shares * price)})\n`;
      }
      text += "\n";
    }
    text += `Utilisation:\n• /bank stocks buy <symbole> <quantité>\n• /bank stocks sell <symbole> <quantité>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  const symbol = args[2]?.toUpperCase();
  const qty = parseInt(args[3]);
  if (!symbol || !marketData.stocks[symbol]) {
    return bot.sendMessage(chatId, "❌ Symbole invalide.", { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    if (!qty || qty <= 0) return bot.sendMessage(chatId, "❌ Quantité invalide.", { reply_to_message_id: msg.message_id });
    const price = marketData.stocks[symbol].price;
    const cost = price * qty;
    if (bank.bank < cost) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants. Besoin de ${formatMoney(cost)}`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= cost;
    bank.stocks[symbol] = (bank.stocks[symbol] || 0) + qty;
    bank.transactions.push({
      type: "stock_purchase",
      amount: cost,
      date: Date.now(),
      description: `Achat ${qty} ${symbol}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Achat effectué\n━━━━━━━━━\n\n${qty} ${symbol} pour ${formatMoney(cost)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (action === "sell") {
    if (!qty || qty <= 0) return bot.sendMessage(chatId, "❌ Quantité invalide.", { reply_to_message_id: msg.message_id });
    if (!bank.stocks[symbol] || bank.stocks[symbol] < qty) {
      return bot.sendMessage(chatId, "❌ Vous ne possédez pas assez d'actions.", { reply_to_message_id: msg.message_id });
    }
    const price = marketData.stocks[symbol].price;
    const value = price * qty;
    bank.bank += value;
    bank.stocks[symbol] -= qty;
    if (bank.stocks[symbol] === 0) delete bank.stocks[symbol];
    bank.transactions.push({
      type: "stock_sale",
      amount: value,
      date: Date.now(),
      description: `Vente ${qty} ${symbol}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Vente effectuée\n━━━━━━━━━\n\n${qty} ${symbol} pour ${formatMoney(value)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue. Utilisez list, buy ou sell.", { reply_to_message_id: msg.message_id });
}

async function crypto(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `₿ 𝗖𝗿𝘆𝗽𝘁𝗼𝗺𝗼𝗻𝗻𝗮𝗶𝗲𝘀\n━━━━━━━━━━━\n\n`;
    for (const [sym, data] of Object.entries(marketData.crypto)) {
      const changeEmoji = data.change >= 0 ? "📈" : "📉";
      text += `${changeEmoji} ${sym} - $${data.price.toLocaleString()} (${data.change > 0 ? '+' : ''}${data.change}%)\n   ${data.name}\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝗰𝗿𝘆𝗽𝘁𝗼𝘀:\n`;
    if (Object.keys(bank.crypto).length === 0) text += "Aucune\n\n";
    else {
      for (const [sym, amount] of Object.entries(bank.crypto)) {
        const price = marketData.crypto[sym]?.price || 0;
        text += `• ${sym}: ${amount} (${formatMoney(amount * price)})\n`;
      }
      text += "\n";
    }
    text += `Utilisation:\n• /bank crypto buy <symbole> <quantité>\n• /bank crypto sell <symbole> <quantité>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  const symbol = args[2]?.toUpperCase();
  const amount = parseFloat(args[3]);
  if (!symbol || !marketData.crypto[symbol]) {
    return bot.sendMessage(chatId, "❌ Symbole invalide.", { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    if (!amount || amount <= 0) return bot.sendMessage(chatId, "❌ Quantité invalide.", { reply_to_message_id: msg.message_id });
    const price = marketData.crypto[symbol].price;
    const cost = price * amount;
    if (bank.bank < cost) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants. Besoin de ${formatMoney(cost)}`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= cost;
    bank.crypto[symbol] = (bank.crypto[symbol] || 0) + amount;
    bank.transactions.push({
      type: "crypto_purchase",
      amount: cost,
      date: Date.now(),
      description: `Achat ${amount} ${symbol}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Achat effectué\n━━━━━━━━━\n\n${amount} ${symbol} pour ${formatMoney(cost)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (action === "sell") {
    if (!amount || amount <= 0) return bot.sendMessage(chatId, "❌ Quantité invalide.", { reply_to_message_id: msg.message_id });
    if (!bank.crypto[symbol] || bank.crypto[symbol] < amount) {
      return bot.sendMessage(chatId, "❌ Vous ne possédez pas assez.", { reply_to_message_id: msg.message_id });
    }
    const price = marketData.crypto[symbol].price;
    const value = price * amount;
    bank.bank += value;
    bank.crypto[symbol] -= amount;
    if (bank.crypto[symbol] === 0) delete bank.crypto[symbol];
    bank.transactions.push({
      type: "crypto_sale",
      amount: value,
      date: Date.now(),
      description: `Vente ${amount} ${symbol}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Vente effectuée\n━━━━━━━━━\n\n${amount} ${symbol} pour ${formatMoney(value)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function bonds(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `🏛️ 𝗢𝗯𝗹𝗶𝗴𝗮𝘁𝗶𝗼𝗻𝘀\n━━━━━━━━━━\n\n`;
    for (const [type, data] of Object.entries(marketData.bonds)) {
      text += `📊 ${type.replace(/_/g, ' ')}\n   Rendement: ${data.yield}% annuel\n   Risque: ${data.risk}\n   Durée: ${data.term}\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝗼𝗯𝗹𝗶𝗴𝗮𝘁𝗶𝗼𝗻𝘀:\n`;
    if (Object.keys(bank.bonds).length === 0) text += "Aucune\n\n";
    else {
      for (const [type, amount] of Object.entries(bank.bonds)) {
        text += `• ${type.replace(/_/g, ' ')}: ${formatMoney(amount)}\n`;
      }
      text += "\n";
    }
    text += `Utilisation:\n• /bank bonds buy <type> <montant>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const bondType = args[2]?.toUpperCase();
    const amount = parseInt(args[3]);
    if (!bondType || !marketData.bonds[bondType] || !amount || amount <= 0) {
      return bot.sendMessage(chatId, "❌ Type ou montant invalide.", { reply_to_message_id: msg.message_id });
    }
    if (bank.bank < amount) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= amount;
    bank.bonds[bondType] = (bank.bonds[bondType] || 0) + amount;
    bank.transactions.push({
      type: "bond_purchase",
      amount,
      date: Date.now(),
      description: `Achat obligation ${bondType}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Achat obligation\n━━━━━━━━━━━━\n\n${bondType.replace(/_/g, ' ')}: ${formatMoney(amount)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function portfolio(chatId, bot, msg, bank) {
  const total = calculatePortfolioValue(bank);
  let text = `📊 𝗣𝗼𝗿𝘁𝗲𝗳𝗲𝘂𝗶𝗹𝗹𝗲 𝗱'𝗶𝗻𝘃𝗲𝘀𝘁𝗶𝘀𝘀𝗲𝗺𝗲𝗻𝘁\n━━━━━━━━━━━━━━━━━━━━\n\n`;
  if (Object.keys(bank.stocks).length) {
    text += `📈 𝗔𝗰𝘁𝗶𝗼𝗻𝘀:\n`;
    for (const [sym, shares] of Object.entries(bank.stocks)) {
      const price = marketData.stocks[sym]?.price || 0;
      text += `• ${sym}: ${shares} actions (${formatMoney(shares * price)})\n`;
    }
    text += `\n`;
  }
  if (Object.keys(bank.crypto).length) {
    text += `₿ 𝗖𝗿𝘆𝗽𝘁𝗼𝘀:\n`;
    for (const [sym, amount] of Object.entries(bank.crypto)) {
      const price = marketData.crypto[sym]?.price || 0;
      text += `• ${sym}: ${amount} (${formatMoney(amount * price)})\n`;
    }
    text += `\n`;
  }
  if (Object.keys(bank.bonds).length) {
    text += `🏛️ 𝗢𝗯𝗹𝗶𝗴𝗮𝘁𝗶𝗼𝗻𝘀:\n`;
    for (const [type, amount] of Object.entries(bank.bonds)) {
      text += `• ${type.replace(/_/g, ' ')}: ${formatMoney(amount)}\n`;
    }
    text += `\n`;
  }
  if (total === 0) text = `📊 Aucun investissement. Commencez avec /bank stocks list.`;
  else text += `💰 𝗧𝗼𝘁𝗮𝗹: ${formatMoney(total)}`;
  return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
}

async function market(chatId, bot, msg) {
  let text = `📊 𝗠𝗮𝗿𝗰𝗵𝗲́ 𝗴𝗹𝗼𝗯𝗮𝗹\n━━━━━━━━━━━━\n\n`;
  text += `📈 𝗔𝗰𝘁𝗶𝗼𝗻𝘀:\n`;
  for (const [sym, data] of Object.entries(marketData.stocks).slice(0, 4)) {
    text += `• ${sym}: $${data.price} (${data.change > 0 ? '+' : ''}${data.change}%)\n`;
  }
  text += `\n₿ 𝗖𝗿𝘆𝗽𝘁𝗼𝘀:\n`;
  for (const [sym, data] of Object.entries(marketData.crypto).slice(0, 4)) {
    text += `• ${sym}: $${data.price} (${data.change > 0 ? '+' : ''}${data.change}%)\n`;
  }
  text += `\n🏛️ 𝗢𝗯𝗹𝗶𝗴𝗮𝘁𝗶𝗼𝗻𝘀:\n`;
  for (const [type, data] of Object.entries(marketData.bonds)) {
    text += `• ${type.replace(/_/g, ' ')}: ${data.yield}% (${data.risk})\n`;
  }
  return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
}

async function dividend(chatId, bot, msg, bank, banks, userId) {
  let total = 0;
  for (const [sym, shares] of Object.entries(bank.stocks)) {
    total += shares * 5; // 5$ par action
  }
  for (const [type, amount] of Object.entries(bank.bonds)) {
    const yieldRate = marketData.bonds[type]?.yield || 2.5;
    total += amount * (yieldRate / 100) / 12;
  }
  if (total === 0) {
    return bot.sendMessage(chatId,
      `💰 Aucun dividende. Investissez dans des actions ou obligations.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  total = Math.floor(total);
  bank.bank += total;
  bank.transactions.push({
    type: "dividend",
    amount: total,
    date: Date.now(),
    description: "Dividendes perçus"
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `💰 𝗗𝗶𝘃𝗶𝗱𝗲𝗻𝗱𝗲𝘀 𝗿𝗲́𝗰𝗼𝗹𝘁𝗲́𝘀\n━━━━━━━━━━━━━━━\n\nMontant: ${formatMoney(total)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function business(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `🏢 𝗢𝗽𝗽𝗼𝗿𝘁𝘂𝗻𝗶𝘁𝗲́𝘀 𝗱'𝗲𝗻𝘁𝗿𝗲𝗽𝗿𝗶𝘀𝗲\n━━━━━━━━━━━━━━━━━\n\n`;
    for (const [type, data] of Object.entries(marketData.businesses)) {
      text += `🏢 ${data.name}\n   Coût: ${formatMoney(data.cost)}\n   Revenu mensuel: ${formatMoney(data.income)}\n   Employés: ${data.employees}\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝗲𝗻𝘁𝗿𝗲𝗽𝗿𝗶𝘀𝗲𝘀:\n`;
    if (bank.businesses.length === 0) text += "Aucune\n\n";
    else {
      bank.businesses.forEach((b, i) => {
        text += `${i+1}. ${b.name} (Niv.${b.level})\n`;
      });
      text += "\n";
    }
    text += `Utilisation:\n• /bank business buy <type>\n• /bank business collect`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const type = args[2]?.toUpperCase();
    if (!type || !marketData.businesses[type]) {
      return bot.sendMessage(chatId, "❌ Type invalide.", { reply_to_message_id: msg.message_id });
    }
    const data = marketData.businesses[type];
    if (bank.bank < data.cost) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= data.cost;
    bank.businesses.push({
      type,
      name: data.name,
      level: 1,
      revenue: data.income,
      employees: data.employees,
      established: Date.now(),
      lastCollected: Date.now()
    });
    bank.transactions.push({
      type: "business_purchase",
      amount: data.cost,
      date: Date.now(),
      description: `Achat ${data.name}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Entreprise achetée\n━━━━━━━━━━━━━\n\n${data.name} pour ${formatMoney(data.cost)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (action === "collect") {
    if (bank.businesses.length === 0) {
      return bot.sendMessage(chatId, "❌ Vous n'avez pas d'entreprise.", { reply_to_message_id: msg.message_id });
    }
    let total = 0;
    const now = Date.now();
    bank.businesses.forEach(b => {
      const elapsed = now - (b.lastCollected || b.established);
      const hours = elapsed / (1000 * 60 * 60);
      const income = Math.floor((b.revenue / 30 / 24) * hours * b.level);
      if (income > 0) {
        total += income;
        b.lastCollected = now;
      }
    });
    if (total === 0) {
      return bot.sendMessage(chatId, "💼 Pas de revenu à collecter pour l'instant.", { reply_to_message_id: msg.message_id });
    }
    bank.bank += total;
    bank.transactions.push({
      type: "business_income",
      amount: total,
      date: now,
      description: "Revenus entreprises"
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `💼 Revenus d'entreprise\n━━━━━━━━━━━━━━━\n\nTotal: ${formatMoney(total)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function shop(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    const items = {
      "CREDIT_BOOST": { price: 50000, name: "Boost de crédit (+50 points)", desc: "Augmente votre score de crédit de 50 points" },
      "MULTIPLIER": { price: 1000000, name: "Multiplicateur 1.5x (7 jours)", desc: "Augmente tous vos gains de 50% pendant 7 jours" },
      "INSURANCE_BUNDLE": { price: 100000, name: "Pack assurance complet", desc: "Toutes les assurances à prix réduit" },
      "LOTTERY_PACK": { price: 5000, name: "Pack loterie (100 tickets)", desc: "100 tickets de loterie" },
      "SKILL_BOOST": { price: 25000, name: "Boost compétences (+10)", desc: "Augmente toutes vos compétences de 10 niveaux" },
      "PREMIUM_TRIAL": { price: 100000, name: "Essai Premium (30 jours)", desc: "Débloque les fonctionnalités premium pour 30 jours" }
    };
    let text = `🛒 𝗕𝗼𝘂𝘁𝗶𝗾𝘂𝗲\n━━━━━━━━\n\n`;
    for (const [id, it] of Object.entries(items)) {
      text += `🛍️ ${it.name}\n   Prix: ${formatMoney(it.price)}\n   ${it.desc}\n\n`;
    }
    text += `Utilisation: /bank shop buy <ID>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const itemId = args[2]?.toUpperCase();
    const items = {
      "CREDIT_BOOST": { price: 50000, name: "Boost de crédit (+50 points)" },
      "MULTIPLIER": { price: 1000000, name: "Multiplicateur 1.5x (7 jours)" },
      "INSURANCE_BUNDLE": { price: 100000, name: "Pack assurance complet" },
      "LOTTERY_PACK": { price: 5000, name: "Pack loterie (100 tickets)" },
      "SKILL_BOOST": { price: 25000, name: "Boost compétences (+10)" },
      "PREMIUM_TRIAL": { price: 100000, name: "Essai Premium (30 jours)" }
    };
    if (!itemId || !items[itemId]) {
      return bot.sendMessage(chatId, "❌ Article invalide.", { reply_to_message_id: msg.message_id });
    }
    const item = items[itemId];
    if (bank.bank < item.price) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= item.price;
    switch (itemId) {
      case "CREDIT_BOOST":
        bank.creditScore = Math.min(850, bank.creditScore + 50);
        break;
      case "MULTIPLIER":
        bank.multiplier = 1.5;
        break;
      case "INSURANCE_BUNDLE":
        bank.insurance = {
          LIFE: { active: true, coverage: 100000, purchased: Date.now() },
          HEALTH: { active: true, coverage: 50000, purchased: Date.now() },
          PROPERTY: { active: true, coverage: 200000, purchased: Date.now() },
          BUSINESS: { active: true, coverage: 500000, purchased: Date.now() },
          THEFT: { active: true, coverage: 75000, purchased: Date.now() }
        };
        break;
      case "LOTTERY_PACK":
        bank.lotteryTickets = (bank.lotteryTickets || 0) + 100;
        break;
      case "SKILL_BOOST":
        bank.skills.trading += 10;
        bank.skills.business += 10;
        bank.skills.investing += 10;
        bank.skills.gambling += 10;
        break;
      case "PREMIUM_TRIAL":
        bank.premium = true;
        bank.multiplier = 2.0;
        break;
    }
    bank.transactions.push({
      type: "shop_purchase",
      amount: item.price,
      date: Date.now(),
      description: `Achat ${item.name}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Achat effectué\n━━━━━━━━━\n\n${item.name} pour ${formatMoney(item.price)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function realEstate(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `🏠 𝗜𝗺𝗺𝗼𝗯𝗶𝗹𝗶𝗲𝗿\n━━━━━━━━━\n\n`;
    for (const [type, data] of Object.entries(marketData.properties)) {
      text += `🏠 ${data.name}\n   Prix: ${formatMoney(data.price)}\n   Loyer mensuel: ${formatMoney(data.income)}\n   ROI annuel: ${Math.round((data.income * 12 / data.price) * 100)}%\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝗯𝗶𝗲𝗻𝘀:\n`;
    if (bank.realEstate.length === 0) text += "Aucun\n\n";
    else {
      bank.realEstate.forEach((p, i) => {
        text += `${i+1}. ${p.name} - ${formatMoney(p.value)}\n`;
      });
      text += "\n";
    }
    text += `Utilisation:\n• /bank property buy <type>\n• /bank rent`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const type = args[2]?.toUpperCase();
    if (!type || !marketData.properties[type]) {
      return bot.sendMessage(chatId, "❌ Type invalide.", { reply_to_message_id: msg.message_id });
    }
    const data = marketData.properties[type];
    if (bank.bank < data.price) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= data.price;
    bank.realEstate.push({
      type,
      name: data.name,
      value: data.price,
      income: data.income,
      purchased: Date.now(),
      lastRentCollected: Date.now()
    });
    bank.transactions.push({
      type: "property_purchase",
      amount: data.price,
      date: Date.now(),
      description: `Achat ${data.name}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Propriété achetée\n━━━━━━━━━━━━━\n\n${data.name} pour ${formatMoney(data.price)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function house(chatId, bot, msg, args, bank, banks, userId) {
  return realEstate(chatId, bot, msg, args, bank, banks, userId);
}

async function rent(chatId, bot, msg, bank, banks, userId) {
  if (bank.realEstate.length === 0) {
    return bot.sendMessage(chatId, "❌ Vous n'avez pas de propriété.", { reply_to_message_id: msg.message_id });
  }
  let total = 0;
  const now = Date.now();
  bank.realEstate.forEach(p => {
    const elapsed = now - (p.lastRentCollected || p.purchased);
    const hours = elapsed / (1000 * 60 * 60);
    const rent = Math.floor((p.income / 30 / 24) * hours);
    if (rent > 0) {
      total += rent;
      p.lastRentCollected = now;
    }
  });
  if (total === 0) {
    return bot.sendMessage(chatId, "🏠 Pas de loyer à collecter pour l'instant.", { reply_to_message_id: msg.message_id });
  }
  bank.bank += total;
  bank.transactions.push({
    type: "rental_income",
    amount: total,
    date: now,
    description: "Loyers perçus"
  });
  saveDatabase('bank', banks);
  return bot.sendMessage(chatId,
    `🏠 𝗟𝗼𝘆𝗲𝗿𝘀 𝗿𝗲́𝗰𝗼𝗹𝘁𝗲́𝘀\n━━━━━━━━━━━━━\n\nTotal: ${formatMoney(total)}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function luxury(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `💎 𝗢𝗯𝗷𝗲𝘁𝘀 𝗱𝗲 𝗹𝘂𝘅𝗲\n━━━━━━━━━━━\n\n`;
    for (const [type, data] of Object.entries(marketData.luxury)) {
      text += `💎 ${data.name}\n   Prix: ${formatMoney(data.price)}\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝗼𝗯𝗷𝗲𝘁𝘀:\n`;
    if (bank.luxury.length === 0) text += "Aucun\n\n";
    else {
      bank.luxury.forEach((l, i) => {
        text += `${i+1}. ${l.name} - ${formatMoney(l.value)}\n`;
      });
      text += "\n";
    }
    text += `Utilisation:\n• /bank luxury buy <type>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const type = args[2]?.toUpperCase();
    if (!type || !marketData.luxury[type]) {
      return bot.sendMessage(chatId, "❌ Type invalide.", { reply_to_message_id: msg.message_id });
    }
    const data = marketData.luxury[type];
    if (bank.bank < data.price) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= data.price;
    bank.luxury.push({
      type,
      name: data.name,
      value: data.price,
      purchased: Date.now()
    });
    bank.transactions.push({
      type: "luxury_purchase",
      amount: data.price,
      date: Date.now(),
      description: `Achat ${data.name}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Objet acheté\n━━━━━━━━━\n\n${data.name} pour ${formatMoney(data.price)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function car(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    let text = `🚗 𝗩𝗲́𝗵𝗶𝗰𝘂𝗹𝗲𝘀 𝗱𝗲 𝗹𝘂𝘅𝗲\n━━━━━━━━━━━━━━\n\n`;
    for (const [type, data] of Object.entries(marketData.vehicles)) {
      text += `🚗 ${data.name}\n   Prix: ${formatMoney(data.price)}\n   Dépréciation annuelle: ${Math.round((1 - data.depreciation) * 100)}%\n\n`;
    }
    text += `📦 𝗩𝗼𝘀 𝘃𝗲́𝗵𝗶𝗰𝘂𝗹𝗲𝘀:\n`;
    if (bank.vehicles.length === 0) text += "Aucun\n\n";
    else {
      bank.vehicles.forEach((v, i) => {
        text += `${i+1}. ${v.name} - ${formatMoney(v.currentValue)}\n`;
      });
      text += "\n";
    }
    text += `Utilisation:\n• /bank car buy <type>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const type = args[2]?.toUpperCase();
    if (!type || !marketData.vehicles[type]) {
      return bot.sendMessage(chatId, "❌ Type invalide.", { reply_to_message_id: msg.message_id });
    }
    const data = marketData.vehicles[type];
    if (bank.bank < data.price) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= data.price;
    bank.vehicles.push({
      type,
      name: data.name,
      purchasePrice: data.price,
      currentValue: data.price,
      depreciation: data.depreciation,
      purchased: Date.now()
    });
    bank.transactions.push({
      type: "vehicle_purchase",
      amount: data.price,
      date: Date.now(),
      description: `Achat ${data.name}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Véhicule acheté\n━━━━━━━━━━━\n\n${data.name} pour ${formatMoney(data.price)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function gamble(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId,
      `🎰 𝗝𝗲𝘂 x2\n━━━━━━━\n\nUtilisation: /bank gamble <montant>`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (bank.bank < amount) {
    return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
  }
  const win = Math.random() < 0.45 + (bank.skills.gambling || 0) * 0.01;
  if (win) {
    const multiplier = Math.random() < 0.1 ? 3 : 2;
    const winnings = amount * multiplier;
    bank.bank += winnings - amount;
    bank.skills.gambling += 1;
    bank.transactions.push({
      type: "gambling_win",
      amount: winnings - amount,
      date: Date.now(),
      description: `Gain jeu x${multiplier}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `🎉 𝗚𝗮𝗴𝗻𝗲́ !\n━━━━━━━\n\nVous gagnez ${formatMoney(winnings - amount)} (x${multiplier})\nNouveau solde: ${formatMoney(bank.bank)}`,
      { reply_to_message_id: msg.message_id }
    );
  } else {
    bank.bank -= amount;
    bank.transactions.push({
      type: "gambling_loss",
      amount,
      date: Date.now(),
      description: "Perte jeu"
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `💸 𝗣𝗲𝗿𝗱𝘂 !\n━━━━━━\n\nVous perdez ${formatMoney(amount)}\nNouveau solde: ${formatMoney(bank.bank)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

async function slots(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId,
      `🎰 𝗠𝗮𝗰𝗵𝗶𝗻𝗲 à 𝘀𝗼𝘂𝘀\n━━━━━━━━━━━━━\n\nUtilisation: /bank slots <montant>`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (bank.bank < amount) {
    return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
  }
  const symbols = ["🍒", "🍋", "🍊", "🍇", "🔔", "💎", "7️⃣", "⭐"];
  const r1 = symbols[Math.floor(Math.random() * symbols.length)];
  const r2 = symbols[Math.floor(Math.random() * symbols.length)];
  const r3 = symbols[Math.floor(Math.random() * symbols.length)];
  let multiplier = 0;
  if (r1 === r2 && r2 === r3) {
    if (r1 === "7️⃣") multiplier = 50;
    else if (r1 === "💎") multiplier = 25;
    else if (r1 === "⭐") multiplier = 15;
    else multiplier = 10;
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    multiplier = 2;
  }
  const winnings = multiplier > 0 ? amount * multiplier : 0;
  if (winnings > 0) {
    bank.bank += winnings - amount;
    bank.transactions.push({
      type: "gambling_win",
      amount: winnings - amount,
      date: Date.now(),
      description: `Slots x${multiplier}`
    });
  } else {
    bank.bank -= amount;
    bank.transactions.push({
      type: "gambling_loss",
      amount,
      date: Date.now(),
      description: "Slots perdu"
    });
  }
  saveDatabase('bank', banks);
  const result = `🎰 𝗠𝗮𝗰𝗵𝗶𝗻𝗲 à 𝘀𝗼𝘂𝘀\n━━━━━━━━━━━━━\n\n${r1} | ${r2} | ${r3}\n\n${winnings > 0 ? `🎉 Gagné ${formatMoney(winnings - amount)} (x${multiplier})` : `💸 Perdu ${formatMoney(amount)}`}\nNouveau solde: ${formatMoney(bank.bank)}`;
  return bot.sendMessage(chatId, result, { reply_to_message_id: msg.message_id });
}

async function blackjack(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId,
      `🃏 𝗕𝗹𝗮𝗰𝗸𝗷𝗮𝗰𝗸\n━━━━━━━━━\n\nUtilisation: /bank blackjack <montant>`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (bank.bank < amount) {
    return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
  }
  const getCard = () => Math.min(Math.floor(Math.random() * 13) + 1, 10);
  const player = getCard() + getCard();
  const dealer = getCard() + getCard();
  let result, winAmount = 0;
  if (player > 21) {
    result = "💸 BUST";
    winAmount = 0;
  } else if (dealer > 21 || player > dealer) {
    result = "🎉 WIN";
    winAmount = amount * 2;
  } else if (player === dealer) {
    result = "🤝 PUSH";
    winAmount = amount;
  } else {
    result = "💸 LOSE";
    winAmount = 0;
  }
  const net = winAmount - amount;
  bank.bank += net;
  bank.transactions.push({
    type: net > 0 ? "gambling_win" : "gambling_loss",
    amount: Math.abs(net),
    date: Date.now(),
    description: `Blackjack ${result}`
  });
  saveDatabase('bank', banks);
  const msgText = `🃏 𝗕𝗹𝗮𝗰𝗸𝗷𝗮𝗰𝗸\n━━━━━━━━━\n\nVous: ${player}\nCroupier: ${dealer}\n\n${result}\n${net > 0 ? `Gain: ${formatMoney(net)}` : net < 0 ? `Perte: ${formatMoney(-net)}` : 'Égalité'}\nNouveau solde: ${formatMoney(bank.bank)}`;
  return bot.sendMessage(chatId, msgText, { reply_to_message_id: msg.message_id });
}

async function roulette(chatId, bot, msg, args, bank, banks, userId) {
  const amount = parseInt(args[1]);
  const bet = args[2]?.toLowerCase();
  if (isNaN(amount) || amount <= 0 || !bet) {
    return bot.sendMessage(chatId,
      `🎯 𝗥𝗼𝘂𝗹𝗲𝘁𝘁𝗲\n━━━━━━━━\n\nUtilisation: /bank roulette <montant> <rouge/noir/pair/impair/manque/passe/numéro>\nExemple: /bank roulette 1000 rouge`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (bank.bank < amount) {
    return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
  }
  const num = Math.floor(Math.random() * 37);
  const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
  const isBlack = num !== 0 && !isRed;
  const isOdd = num > 0 && num % 2 === 1;
  const isEven = num > 0 && num % 2 === 0;
  const isLow = num >= 1 && num <= 18;
  const isHigh = num >= 19 && num <= 36;
  let win = false, multiplier = 0;
  if (bet === "rouge" && isRed) { win = true; multiplier = 2; }
  else if (bet === "noir" && isBlack) { win = true; multiplier = 2; }
  else if (bet === "pair" && isEven) { win = true; multiplier = 2; }
  else if (bet === "impair" && isOdd) { win = true; multiplier = 2; }
  else if (bet === "manque" && isLow) { win = true; multiplier = 2; }
  else if (bet === "passe" && isHigh) { win = true; multiplier = 2; }
  else if (parseInt(bet) === num) { win = true; multiplier = 36; }
  const net = win ? amount * multiplier - amount : -amount;
  bank.bank += net;
  bank.transactions.push({
    type: net > 0 ? "gambling_win" : "gambling_loss",
    amount: Math.abs(net),
    date: Date.now(),
    description: `Roulette ${num}`
  });
  saveDatabase('bank', banks);
  const color = num === 0 ? "🟢" : isRed ? "🔴" : "⚫";
  const result = `🎯 𝗥𝗼𝘂𝗹𝗲𝘁𝘁𝗲\n━━━━━━━━\n\nNuméro: ${color} ${num}\nMise: ${bet}\n\n${win ? `🎉 Gagné ${formatMoney(net)} (x${multiplier})` : `💸 Perdu ${formatMoney(amount)}`}\nNouveau solde: ${formatMoney(bank.bank)}`;
  return bot.sendMessage(chatId, result, { reply_to_message_id: msg.message_id });
}

async function lottery(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "buy") {
    const tickets = parseInt(args[2]) || 1;
    const price = 100 * tickets;
    if (bank.bank < price) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= price;
    bank.lotteryTickets = (bank.lotteryTickets || 0) + tickets;
    bank.transactions.push({
      type: "lottery_buy",
      amount: price,
      date: Date.now(),
      description: `Achat ${tickets} tickets de loterie`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `🎫 Achat effectué\n━━━━━━━━━\n\n${tickets} tickets pour ${formatMoney(price)}\nTotal tickets: ${bank.lotteryTickets}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (action === "check") {
    if (!bank.lotteryTickets || bank.lotteryTickets === 0) {
      return bot.sendMessage(chatId, "❌ Vous n'avez pas de tickets.", { reply_to_message_id: msg.message_id });
    }
    const winChance = Math.min(bank.lotteryTickets * 0.01, 0.5);
    if (Math.random() < winChance) {
      const prize = Math.floor(Math.random() * 1000000) + 50000;
      bank.bank += prize;
      bank.lotteryTickets = 0;
      bank.transactions.push({
        type: "lottery_win",
        amount: prize,
        date: Date.now(),
        description: "Gros lot de loterie"
      });
      saveDatabase('bank', banks);
      return bot.sendMessage(chatId,
        `🎊 𝗝𝗔𝗖𝗞𝗣𝗢𝗧 !\n━━━━━━━━\n\nVous gagnez ${formatMoney(prize)} !`,
        { reply_to_message_id: msg.message_id }
      );
    } else {
      bank.lotteryTickets = 0;
      saveDatabase('bank', banks);
      return bot.sendMessage(chatId,
        `😞 Pas de chance cette fois. Tickets épuisés.`,
        { reply_to_message_id: msg.message_id }
      );
    }
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function premium(chatId, bot, msg, args, bank, banks, userId) {
  if (args[1]?.toLowerCase() === "buy") {
    const cost = 1000000;
    if (bank.bank < cost) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= cost;
    bank.premium = true;
    bank.multiplier = 2.0;
    bank.transactions.push({
      type: "premium_purchase",
      amount: cost,
      date: Date.now(),
      description: "Achat premium"
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `💎 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 𝗮𝗰𝘁𝗶𝘃𝗲́\n━━━━━━━━━━━━\n\nVous bénéficiez désormais du multiplicateur x2.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId,
    `💎 𝗣𝗿𝗲𝗺𝗶𝘂𝗺\n━━━━━━━\n\nStatut: ${bank.premium ? "✅ Actif" : "❌ Inactif"}\nMultiplicateur: ${bank.multiplier}x\nCoût: 1 000 000\n\nUtilisez /bank premium buy pour acheter.`,
    { reply_to_message_id: msg.message_id }
  );
}

async function vault(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  const amount = parseInt(args[2]);
  if (!action) {
    return bot.sendMessage(chatId,
      `🔐 𝗖𝗼𝗳𝗳𝗿𝗲\n━━━━━━━\n\nSolde coffre: ${formatMoney(bank.vault)}\nTaux: 1% mensuel\n\nUtilisation:\n/bank vault deposit <montant>\n/bank vault withdraw <montant>`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (isNaN(amount) || amount <= 0) {
    return bot.sendMessage(chatId, "❌ Montant invalide.", { reply_to_message_id: msg.message_id });
  }
  if (action === "deposit") {
    if (bank.bank < amount) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= amount;
    bank.vault += amount;
    bank.transactions.push({
      type: "vault_deposit",
      amount,
      date: Date.now(),
      description: "Dépôt coffre"
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `🔐 Dépôt effectué\n━━━━━━━━━━\n\nMontant: ${formatMoney(amount)}\nNouveau coffre: ${formatMoney(bank.vault)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (action === "withdraw") {
    if (bank.vault < amount) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants dans le coffre.`, { reply_to_message_id: msg.message_id });
    }
    bank.vault -= amount;
    bank.bank += amount;
    bank.transactions.push({
      type: "vault_withdrawal",
      amount,
      date: Date.now(),
      description: "Retrait coffre"
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `🔓 Retrait effectué\n━━━━━━━━━━━\n\nMontant: ${formatMoney(amount)}\nNouveau coffre: ${formatMoney(bank.vault)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function insurance(chatId, bot, msg, args, bank, banks, userId) {
  const action = args[1]?.toLowerCase();
  if (!action || action === "list") {
    const types = {
      "LIFE": { cost: 10000, coverage: 100000, name: "Vie" },
      "HEALTH": { cost: 5000, coverage: 50000, name: "Santé" },
      "PROPERTY": { cost: 15000, coverage: 200000, name: "Propriété" },
      "BUSINESS": { cost: 25000, coverage: 500000, name: "Entreprise" },
      "THEFT": { cost: 8000, coverage: 75000, name: "Vol" }
    };
    let text = `🛡️ 𝗔𝘀𝘀𝘂𝗿𝗮𝗻𝗰𝗲𝘀\n━━━━━━━━━━\n\n`;
    for (const [id, data] of Object.entries(types)) {
      const owned = bank.insurance?.[id] ? "✅" : "❌";
      text += `🛡️ ${data.name}\n   Prix: ${formatMoney(data.cost)}\n   Couverture: ${formatMoney(data.coverage)}\n   Possédée: ${owned}\n\n`;
    }
    text += `Utilisation:\n/bank insurance buy <type>`;
    return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
  }
  if (action === "buy") {
    const type = args[2]?.toUpperCase();
    const types = {
      "LIFE": { cost: 10000, coverage: 100000, name: "Vie" },
      "HEALTH": { cost: 5000, coverage: 50000, name: "Santé" },
      "PROPERTY": { cost: 15000, coverage: 200000, name: "Propriété" },
      "BUSINESS": { cost: 25000, coverage: 500000, name: "Entreprise" },
      "THEFT": { cost: 8000, coverage: 75000, name: "Vol" }
    };
    if (!type || !types[type]) {
      return bot.sendMessage(chatId, "❌ Type invalide.", { reply_to_message_id: msg.message_id });
    }
    if (bank.insurance?.[type]) {
      return bot.sendMessage(chatId, "❌ Vous possédez déjà cette assurance.", { reply_to_message_id: msg.message_id });
    }
    const data = types[type];
    if (bank.bank < data.cost) {
      return bot.sendMessage(chatId, `❌ Fonds insuffisants.`, { reply_to_message_id: msg.message_id });
    }
    bank.bank -= data.cost;
    if (!bank.insurance) bank.insurance = {};
    bank.insurance[type] = { active: true, coverage: data.coverage, purchased: Date.now() };
    bank.transactions.push({
      type: "insurance_purchase",
      amount: data.cost,
      date: Date.now(),
      description: `Achat assurance ${data.name}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `✅ Assurance achetée\n━━━━━━━━━━━━━\n\n${data.name} pour ${formatMoney(data.cost)}`,
      { reply_to_message_id: msg.message_id }
    );
  }
  return bot.sendMessage(chatId, "❌ Action inconnue.", { reply_to_message_id: msg.message_id });
}

async function credit(chatId, bot, msg, bank) {
  const score = bank.creditScore;
  let rating = "🔴 Mauvais";
  if (score >= 800) rating = "🟢 Excellent";
  else if (score >= 740) rating = "🟢 Très bon";
  else if (score >= 670) rating = "🟡 Bon";
  else if (score >= 580) rating = "🟠 Correct";
  return bot.sendMessage(chatId,
    `📊 𝗦𝗰𝗼𝗿𝗲 𝗱𝗲 𝗰𝗿𝗲́𝗱𝗶𝘁\n━━━━━━━━━━━━\n\n` +
    `📈 Score: ${score}/850 (${rating})\n` +
    `💰 Prêt max: ${formatMoney(Math.floor(score * 1000))}\n` +
    `🏦 Taux prêt: ${score >= 750 ? '5%' : score >= 650 ? '7%' : '10%'}`,
    { reply_to_message_id: msg.message_id }
  );
}

async function achievements(chatId, bot, msg, bank) {
  const list = bank.achievements;
  let text = `🏆 𝗦𝘂𝗰𝗰𝗲̀𝘀\n━━━━━━━━\n\n`;
  if (list.length === 0) text += "Aucun succès pour l'instant. Continuez à jouer !";
  else {
    list.forEach((ach, i) => {
      text += `${i+1}. ${ach}\n`;
    });
  }
  return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
}

async function leaderboard(chatId, bot, msg, banks) {
  const sorted = Object.entries(banks)
    .filter(([uid, b]) => b && (b.bank + b.savings + b.vault) > 0)
    .map(([uid, b]) => ({
      uid,
      wealth: (b.bank || 0) + (b.savings || 0) + (b.vault || 0),
      name: uid
    }))
    .sort((a, b) => b.wealth - a.wealth)
    .slice(0, 10);

  if (sorted.length === 0) {
    return bot.sendMessage(chatId, "🏆 Aucun joueur riche pour l'instant.", { reply_to_message_id: msg.message_id });
  }

  let text = `🏆 𝗖𝗹𝗮𝘀𝘀𝗲𝗺𝗲𝗻𝘁 𝗱𝗲𝘀 𝗽𝗹𝘂𝘀 𝗿𝗶𝗰𝗵𝗲𝘀\n━━━━━━━━━━━━━━━━━━\n\n`;
  sorted.forEach((user, idx) => {
    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx+1}.`;
    text += `${medal} Utilisateur ${user.uid.slice(0, 5)}... - ${formatMoney(user.wealth)}\n`;
  });
  return bot.sendMessage(chatId, text, { reply_to_message_id: msg.message_id });
}

async function rob(chatId, bot, msg, args, bank, banks, userId, userName) {
  const targetMsg = msg.reply_to_message;
  if (!targetMsg) {
    return bot.sendMessage(chatId,
      `❌ 𝗩𝗼𝗹\n━━━━\n\nRépondez au message de la personne que vous voulez voler.\nExemple: /bank rob`,
      { reply_to_message_id: msg.message_id }
    );
  }
  const targetId = targetMsg.from.id.toString();
  if (targetId === userId) {
    return bot.sendMessage(chatId, "❌ Vous ne pouvez pas vous voler vous-même.", { reply_to_message_id: msg.message_id });
  }
  const now = Date.now();
  const lastRob = bank.lastRob || 0;
  const cooldown = 6 * 60 * 60 * 1000;
  if (now - lastRob < cooldown) {
    const remaining = cooldown - (now - lastRob);
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return bot.sendMessage(chatId,
      `⏰ Vous êtes fatigué. Attendez ${hours}h ${mins}min.`,
      { reply_to_message_id: msg.message_id }
    );
  }
  if (!banks[targetId]) {
    return bot.sendMessage(chatId, "❌ Cette personne n'a pas de compte bancaire.", { reply_to_message_id: msg.message_id });
  }
  const target = banks[targetId];
  const robbable = target.bank || 0;
  if (robbable < 100) {
    return bot.sendMessage(chatId, "❌ Cette personne n'a pas assez d'argent liquide.", { reply_to_message_id: msg.messageId });
  }
  if (target.insurance?.THEFT) {
    return bot.sendMessage(chatId, "🛡️ Cette personne a une assurance vol !", { reply_to_message_id: msg.message_id });
  }
  const success = Math.random() < 0.5; // 50% de base
  if (success) {
    const stolen = Math.floor(robbable * (Math.random() * 0.3 + 0.1)); // 10-40%
    bank.bank += stolen;
    target.bank -= stolen;
    bank.lastRob = now;
    bank.transactions.push({
      type: "robbery_success",
      amount: stolen,
      date: now,
      description: `Vol réussi sur ${targetMsg.from.first_name}`
    });
    target.transactions.push({
      type: "robbed",
      amount: stolen,
      date: now,
      description: `Volé par ${userName}`
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `💰 𝗩𝗼𝗹 𝗿𝗲́𝘂𝘀𝘀𝗶 !\n━━━━━━━━━━\n\nVous avez volé ${formatMoney(stolen)} à ${targetMsg.from.first_name}.`,
      { reply_to_message_id: msg.message_id }
    );
  } else {
    const fine = Math.min(bank.bank * 0.1, 10000);
    bank.bank -= fine;
    bank.lastRob = now;
    bank.transactions.push({
      type: "robbery_failed",
      amount: fine,
      date: now,
      description: "Amende pour vol raté"
    });
    saveDatabase('bank', banks);
    return bot.sendMessage(chatId,
      `🚔 𝗩𝗼𝗹 𝗿𝗮𝘁𝗲́ !\n━━━━━━━━━\n\nVous avez été attrapé et payez une amende de ${formatMoney(fine)}.`,
      { reply_to_message_id: msg.message_id }
    );
  }
}

// Helper calculation functions
function calculatePortfolioValue(bank) {
  let total = 0;
  for (const [sym, shares] of Object.entries(bank.stocks || {})) {
    total += shares * (marketData.stocks[sym]?.price || 0);
  }
  for (const [sym, amount] of Object.entries(bank.crypto || {})) {
    total += amount * (marketData.crypto[sym]?.price || 0);
  }
  for (const [type, amount] of Object.entries(bank.bonds || {})) {
    total += amount;
  }
  return total;
}

function calculateRealEstateValue(bank) {
  return (bank.realEstate || []).reduce((sum, p) => sum + p.value, 0);
}

function calculateBusinessValue(bank) {
  return (bank.businesses || []).reduce((sum, b) => {
    const cost = marketData.businesses[b.type]?.cost || 100000;
    return sum + cost * b.level;
  }, 0);
}

function calculateVehicleValue(bank) {
  return (bank.vehicles || []).reduce((sum, v) => sum + v.currentValue, 0);
}

function calculateLuxuryValue(bank) {
  return (bank.luxury || []).reduce((sum, l) => sum + l.value, 0);
}

module.exports = { onStart, nix };