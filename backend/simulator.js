const Stock = require('./models/Stock');
const StockHistory = require('./models/StockHistory');
const axios = require('axios');
const stockService = require('./services/stockService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runMarketSimulation = async () => {
  try {
    let stocks = await Stock.find({});
    if (stocks.length === 0) {
      console.log('[Market Simulator] No stocks found. Creating fallback stock list.');
      const fallbackStocks = await Promise.all(
        stockService.FALLBACK_STOCKS.map((stock) => stockService.getStockData(stock.symbol))
      );

      for (const stock of fallbackStocks) {
        await Stock.findOneAndUpdate(
          { symbol: stock.symbol },
          {
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            price: stock.price,
            previousPrice: stock.previousPrice || stock.price,
            change: stock.change || 0,
            changePercent: stock.changePercent || 0,
            isSuspended: false,
            volume: stock.volume || 0,
            marketCap: stock.marketCap || 0
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      stocks = await Stock.find({});
    }

    const apiKey = stockService.getApiKey();
    const provider = process.env.STOCK_API_PROVIDER || 'finnhub';
    const hasApiKey = apiKey && apiKey.trim() !== '';

    const timestamp = new Date();
    if (hasApiKey) {
      console.log(`[Market Simulator] Fetching real-time stock prices from ${provider} at ${timestamp.toLocaleTimeString()}...`);
    } else {
      console.log(`[Market Simulator] Updating stock prices via random simulation at ${timestamp.toLocaleTimeString()}...`);
    }

    for (const stock of stocks) {
      const previousPrice = stock.price;
      let newPrice = previousPrice;
      let change = stock.change;
      let changePercent = stock.changePercent;
      let apiSuccess = false;

      if (hasApiKey) {
        try {
          if (provider.toLowerCase() === 'finnhub') {
            const response = await axios.get('https://finnhub.io/api/v1/quote', {
              params: {
                symbol: stock.symbol.toUpperCase(),
                token: apiKey
              },
              timeout: 5000
            });

            const quote = response.data;
            if (quote && quote.c !== undefined && quote.c !== 0) {
              newPrice = Number(quote.c.toFixed(2));
              change = Number((quote.d || 0).toFixed(2));
              changePercent = Number((quote.dp || 0).toFixed(2));
              apiSuccess = true;
            }
          }
          // Sleep for 200ms between symbols to avoid rate limits
          await sleep(200);
        } catch (apiError) {
          console.error(`[Market Simulator] API fetch failed for ${stock.symbol}:`, apiError.message);
        }
      }

      if (!apiSuccess) {
        // Fallback to random fluctuation (-4.0% to +4.0%)
        const fluctuationPercent = (Math.random() * 8.0) - 4.0;
        newPrice = Number((previousPrice * (1 + (fluctuationPercent / 100))).toFixed(2));
        
        // Prevent stock price from falling below a minimum value (e.g. $0.50)
        if (newPrice < 0.50) {
          newPrice = 0.50;
        }

        change = Number((newPrice - previousPrice).toFixed(2));
        changePercent = Number(((change / previousPrice) * 100).toFixed(2));
      }

      // Update Stock Document
      stock.previousPrice = previousPrice;
      stock.price = newPrice;
      stock.change = change;
      stock.changePercent = changePercent;
      
      // Simulate random fluctuations in volume (Finnhub quote doesn't provide daily volume)
      const volumeChange = Math.floor((Math.random() * 10000) - 4000);
      stock.volume = Math.max(0, stock.volume + volumeChange);

      await stock.save();

      // Update Stock Price History (keep last 20 entries)
      await StockHistory.findOneAndUpdate(
        { stock: stock._id },
        {
          $push: {
            priceHistory: {
              $each: [{ price: newPrice, timestamp }],
              $slice: -20
            }
          }
        },
        { upsert: true }
      );
    }

    console.log('[Market Simulator] Stock prices successfully updated.');
  } catch (error) {
    console.error('[Market Simulator Error] Failed to update stock prices:', error.message);
  }
};

const startSimulator = () => {
  const apiKey = stockService.getApiKey();
  const hasApiKey = apiKey && apiKey.trim() !== '';
  // Run every 60 seconds if API key is present to respect rate limits, else 30 seconds
  const interval = hasApiKey ? 60000 : 30000;

  console.log(`[Market Simulator] Starting stock market price update worker (interval: ${interval / 1000}s)...`);
  runMarketSimulation();
  const intervalId = setInterval(runMarketSimulation, interval);
  return intervalId;
};

module.exports = { startSimulator, runMarketSimulation };
