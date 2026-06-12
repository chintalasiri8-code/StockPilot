require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const StockHistory = require('../models/StockHistory');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedStocksData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.41, sector: 'Technology', description: 'Consumer electronics, software, and services company.', volume: 52000000, marketCap: 2850000000000 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 418.52, sector: 'Technology', description: 'Developer of software, hardware, cloud services, and computer systems.', volume: 22000000, marketCap: 3100000000000 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 173.69, sector: 'Technology', description: 'Multinational conglomerate and parent company of search provider Google.', volume: 28000000, marketCap: 2150000000000 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 184.72, sector: 'Consumer Cyclical', description: 'E-commerce, cloud computing, online advertising, and digital streaming.', volume: 34000000, marketCap: 1910000000000 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 898.78, sector: 'Technology', description: 'Designer of graphics processing units (GPUs) and AI computing platforms.', volume: 45000000, marketCap: 2240000000000 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 177.46, sector: 'Automotive', description: 'Electric vehicle manufacturer, clean energy systems, and battery storage.', volume: 88000000, marketCap: 565000000000 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 476.20, sector: 'Technology', description: 'Social media network provider, VR developer, and metaverse company.', volume: 18000000, marketCap: 1210000000000 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 615.15, sector: 'Entertainment', description: 'Subscription video-on-demand streaming service and media production company.', volume: 3200000, marketCap: 266000000000 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 162.67, sector: 'Technology', description: 'Semiconductor manufacturer developing computer processors and graphics technology.', volume: 62000000, marketCap: 262000000000 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.88, sector: 'Financial Services', description: 'Multinational investment bank and financial services holding company.', volume: 9800000, marketCap: 572000000000 },
  { symbol: 'BAC', name: 'Bank of America Corp.', price: 39.22, sector: 'Financial Services', description: 'Investment banking and retail commercial banking institution.', volume: 39000000, marketCap: 308000000000 },
  { symbol: 'V', name: 'Visa Inc.', price: 278.44, sector: 'Financial Services', description: 'Global payments technology company facilitating digital financial transactions.', volume: 5100000, marketCap: 568000000000 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', price: 66.85, sector: 'Financial Services', description: 'Digital payments provider operating an online transaction processing system.', volume: 8200000, marketCap: 70000000000 },
  { symbol: 'DIS', name: 'The Walt Disney Company', price: 116.10, sector: 'Entertainment', description: 'Mass media, entertainment conglomerate, theme parks, and streaming provider.', volume: 7500000, marketCap: 212000000000 },
  { symbol: 'NKE', name: 'NIKE Inc.', price: 96.35, sector: 'Consumer Goods', description: 'Athletic footwear, apparel, accessories, equipment, and services.', volume: 6800000, marketCap: 145000000000 },
  { symbol: 'KO', name: 'The Coca-Cola Company', price: 61.12, sector: 'Consumer Goods', description: 'Carbonated soft drink manufacturer, distributor, and marketer.', volume: 12000000, marketCap: 264000000000 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', price: 172.90, sector: 'Consumer Goods', description: 'Multinational food, snack, and beverage corporation.', volume: 4600000, marketCap: 236000000000 },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', price: 728.45, sector: 'Consumer Goods', description: 'Membership-only warehouse club retail chain operator.', volume: 2100000, marketCap: 323000000000 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 60.25, sector: 'Consumer Goods', description: 'Multinational retail corporation operating hypermarkets, discount department stores.', volume: 15000000, marketCap: 485000000000 },
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', price: 118.60, sector: 'Energy', description: 'Oil and gas exploration, production, refining, and marketing corporation.', volume: 16000000, marketCap: 472000000000 },
  { symbol: 'CVX', name: 'Chevron Corporation', price: 157.12, sector: 'Energy', description: 'Energy, oil, and gas exploration and production conglomerate.', volume: 7800000, marketCap: 292000000000 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 148.95, sector: 'Healthcare', description: 'Medical devices, pharmaceuticals, and consumer packaged goods manufacturer.', volume: 6100000, marketCap: 358000000000 },
  { symbol: 'PFE', name: 'Pfizer Inc.', price: 28.54, sector: 'Healthcare', description: 'Biopharmaceutical corporation developing medicines and vaccines.', volume: 29000000, marketCap: 162000000000 },
  { symbol: 'LLY', name: 'Eli Lilly and Company', price: 772.30, sector: 'Healthcare', description: 'Pharmaceutical company developing products for endocrine, neuroscience, oncology.', volume: 3100000, marketCap: 733000000000 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 485.60, sector: 'Healthcare', description: 'Managed healthcare and insurance products provider.', volume: 3500000, marketCap: 448000000000 }
];

const seedUsersData = [
  {
    name: 'Platform Admin',
    email: 'admin@stockpilot.com',
    password: 'Admin@123',
    role: 'admin',
    balance: 1000000.00 // Admins have infinite virtual funds
  },
  {
    name: 'John Doe',
    email: 'user1@stockpilot.com',
    password: 'User@123',
    role: 'user',
    balance: 10000.00
  },
  {
    name: 'Jane Smith',
    email: 'user2@stockpilot.com',
    password: 'User@123',
    role: 'user',
    balance: 10000.00
  },
  {
    name: 'Alex Johnson',
    email: 'user3@stockpilot.com',
    password: 'User@123',
    role: 'user',
    balance: 10000.00
  },
  {
    name: 'Emily Davis',
    email: 'user4@stockpilot.com',
    password: 'User@123',
    role: 'user',
    balance: 10000.00
  },
  {
    name: 'Michael Brown',
    email: 'user5@stockpilot.com',
    password: 'User@123',
    role: 'user',
    balance: 10000.00
  }
];

const seedDatabase = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockpilot';
    console.log(`Connecting to database at ${dbUri}...`);
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB. Clearing existing collections...');

    // Clear existing collections
    await User.deleteMany({});
    await Stock.deleteMany({});
    await Transaction.deleteMany({});
    await StockHistory.deleteMany({});

    console.log('Collections cleared.');

    // Seed Stocks
    console.log('Seeding stocks...');
    const createdStocks = [];
    const apiKey = process.env.STOCK_API_KEY;
    const provider = process.env.STOCK_API_PROVIDER || 'finnhub';
    const hasApiKey = apiKey && apiKey.trim() !== '';

    for (const stockInfo of seedStocksData) {
      let initialPrice = stockInfo.price;
      let change = 0;
      let changePercent = 0;
      let apiSuccess = false;

      if (hasApiKey) {
        try {
          if (provider.toLowerCase() === 'finnhub') {
            console.log(`[Seeder] Fetching real-time quote for ${stockInfo.symbol} from Finnhub`);
            const response = await axios.get('https://finnhub.io/api/v1/quote', {
              params: {
                symbol: stockInfo.symbol,
                token: apiKey
              },
              timeout: 5000
            });

            const quote = response.data;
            if (quote && quote.c !== undefined && quote.c !== 0) {
              initialPrice = Number(quote.c.toFixed(2));
              change = Number((quote.d || 0).toFixed(2));
              changePercent = Number((quote.dp || 0).toFixed(2));
              apiSuccess = true;
            }
          }
          // Sleep for 200ms between calls to respect API limits
          await sleep(200);
        } catch (apiError) {
          console.error(`[Seeder] API fetch failed for ${stockInfo.symbol}:`, apiError.message);
        }
      }

      const previousPrice = Number((initialPrice - change).toFixed(2));

      if (!apiSuccess) {
        // Fallback: Calculate previous price slightly differently if no API data
        const deviation = (Math.random() * 4) - 2; // -2% to +2%
        const fallbackPrevPrice = Number((initialPrice / (1 + (deviation / 100))).toFixed(2));
        change = Number((initialPrice - fallbackPrevPrice).toFixed(2));
        changePercent = Number(((change / fallbackPrevPrice) * 100).toFixed(2));
      }

      const stock = await Stock.create({
        ...stockInfo,
        price: initialPrice,
        previousPrice: apiSuccess ? previousPrice : Number((initialPrice - change).toFixed(2)),
        change,
        changePercent
      });
      createdStocks.push(stock);

      // Generate 15 historical price ticks
      const historyPoints = [];
      let runningPrice = apiSuccess ? previousPrice : Number((initialPrice - change).toFixed(2));
      const baseTime = Date.now() - (15 * 60 * 1000); // Start 15 minutes ago

      for (let i = 0; i < 15; i++) {
        const tickDeviation = (Math.random() * 2) - 1; // -1% to +1% price movement
        runningPrice = Number((runningPrice * (1 + (tickDeviation / 100))).toFixed(2));
        historyPoints.push({
          price: runningPrice,
          timestamp: new Date(baseTime + (i * 60 * 1000))
        });
      }

      // Add final current price as the 16th tick
      historyPoints.push({
        price: initialPrice,
        timestamp: new Date()
      });

      await StockHistory.create({
        stock: stock._id,
        symbol: stock.symbol,
        priceHistory: historyPoints
      });
    }
    console.log(`Successfully seeded ${createdStocks.length} stocks and their historical tickers.`);

    // Seed Users
    console.log('Seeding users (hashing passwords)...');
    // Using User.create() so schema's pre-save middleware (which hashes passwords) is executed.
    const createdUsers = [];
    for (const userInfo of seedUsersData) {
      const user = await User.create(userInfo);
      createdUsers.push(user);
    }
    console.log(`Successfully seeded ${createdUsers.length} users (including 1 Admin).`);

    // Generate some mock transactions to populate user portolios and platform statistics
    console.log('Generating sample transactions & portfolios for seed users...');
    
    // User1 buys some Apple & Nvidia
    const user1 = createdUsers[1]; // John Doe
    const aapl = createdStocks.find(s => s.symbol === 'AAPL');
    const nvda = createdStocks.find(s => s.symbol === 'NVDA');

    if (user1 && aapl && nvda) {
      // John buys 10 shares of AAPL
      const qtyAapl = 10;
      const costAapl = Number((aapl.price * qtyAapl).toFixed(2));
      user1.balance -= costAapl;
      user1.portfolio.push({
        stock: aapl._id,
        symbol: aapl.symbol,
        name: aapl.name,
        quantity: qtyAapl,
        averageBuyPrice: aapl.price
      });

      await Transaction.create({
        user: user1._id,
        stock: aapl._id,
        symbol: aapl.symbol,
        name: aapl.name,
        type: 'buy',
        quantity: qtyAapl,
        price: aapl.price,
        totalAmount: costAapl,
        date: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });

      // John buys 2 shares of NVDA
      const qtyNvda = 2;
      const costNvda = Number((nvda.price * qtyNvda).toFixed(2));
      user1.balance -= costNvda;
      user1.portfolio.push({
        stock: nvda._id,
        symbol: nvda.symbol,
        name: nvda.name,
        quantity: qtyNvda,
        averageBuyPrice: nvda.price
      });

      await Transaction.create({
        user: user1._id,
        stock: nvda._id,
        symbol: nvda.symbol,
        name: nvda.name,
        type: 'buy',
        quantity: qtyNvda,
        price: nvda.price,
        totalAmount: costNvda,
        date: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      });

      user1.balance = Number(user1.balance.toFixed(2));
      await user1.save();
    }

    // User2 (Jane Smith) buys Microsoft
    const user2 = createdUsers[2];
    const msft = createdStocks.find(s => s.symbol === 'MSFT');

    if (user2 && msft) {
      const qtyMsft = 8;
      const costMsft = Number((msft.price * qtyMsft).toFixed(2));
      user2.balance -= costMsft;
      user2.portfolio.push({
        stock: msft._id,
        symbol: msft.symbol,
        name: msft.name,
        quantity: qtyMsft,
        averageBuyPrice: msft.price
      });

      await Transaction.create({
        user: user2._id,
        stock: msft._id,
        symbol: msft.symbol,
        name: msft.name,
        type: 'buy',
        quantity: qtyMsft,
        price: msft.price,
        totalAmount: costMsft,
        date: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
      });

      user2.balance = Number(user2.balance.toFixed(2));
      await user2.save();
    }

    console.log('Successfully completed portfolio/transaction seeding.');
    console.log('Database Seeding Complete! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
