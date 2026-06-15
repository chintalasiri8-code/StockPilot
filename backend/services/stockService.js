const axios = require('axios');
const Stock = require('../models/Stock');

// In-memory cache for stock quotes
const cache = new Map();
const CACHE_EXPIRY_MS = 10000; // 10 seconds cache duration

const FALLBACK_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Cyclical' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' }
];

const getApiKey = () => process.env.FINNHUB_API_KEY || process.env.STOCK_API_KEY;

const getFallbackMeta = (symbol) => {
  return FALLBACK_STOCKS.find((stock) => stock.symbol === symbol) || {
    symbol,
    name: symbol,
    sector: 'Market'
  };
};

/**
 * Fetch near real-time stock price data for a symbol.
 * Uses an external API if key is present; otherwise falls back to local DB/simulated data.
 * @param {string} symbol - The stock symbol (e.g. AAPL)
 * @returns {Promise<object>} The formatted stock data
 */
const getStockData = async (symbol) => {
  const upperSymbol = symbol.trim().toUpperCase();

  // 1. Check Cache
  const cached = cache.get(upperSymbol);
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    console.log(`[StockService] Cache hit for ${upperSymbol}`);
    return cached.data;
  }

  let data = null;
  const apiKey = getApiKey();
  const provider = process.env.FINNHUB_API_KEY ? 'finnhub' : (process.env.STOCK_API_PROVIDER || 'finnhub');

  // 2. Fetch from External API if key is configured
  if (apiKey && apiKey.trim() !== '') {
    try {
      if (provider.toLowerCase() === 'finnhub') {
        console.log(`[StockService] Fetching ${upperSymbol} from Finnhub API`);
        const response = await axios.get('https://finnhub.io/api/v1/quote', {
          params: {
            symbol: upperSymbol,
            token: apiKey
          },
          timeout: 5000
        });

        const quote = response.data;
        // Finnhub returns c: 0 (current price) if the symbol is not found or invalid
        if (quote && quote.c !== undefined && quote.c !== 0) {
          data = {
            _id: upperSymbol,
            symbol: upperSymbol,
            name: getFallbackMeta(upperSymbol).name,
            sector: getFallbackMeta(upperSymbol).sector,
            price: Number(quote.c.toFixed(2)),
            previousPrice: Number((quote.pc || quote.c).toFixed(2)),
            change: Number((quote.d || 0).toFixed(2)),
            changePercent: Number((quote.dp || 0).toFixed(2)),
            isSuspended: false,
            volume: 0,
            marketCap: 0,
            lastUpdated: new Date().toISOString()
          };
        } else {
          console.warn(`[StockService] Finnhub returned invalid data or 0 price for ${upperSymbol}`);
        }
      } else if (provider.toLowerCase() === 'alphavantage') {
        console.log(`[StockService] Fetching ${upperSymbol} from Alpha Vantage API`);
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: upperSymbol,
            apikey: apiKey
          },
          timeout: 5000
        });

        const quote = response.data['Global Quote'];
        if (quote && quote['05. price'] !== undefined) {
          const price = parseFloat(quote['05. price']);
          const change = parseFloat(quote['09. change'] || '0');
          const changePercent = parseFloat((quote['10. change percent'] || '0%').replace('%', ''));
          data = {
            _id: upperSymbol,
            symbol: upperSymbol,
            name: getFallbackMeta(upperSymbol).name,
            sector: getFallbackMeta(upperSymbol).sector,
            price: Number(price.toFixed(2)),
            previousPrice: Number((price - change).toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            isSuspended: false,
            volume: 0,
            marketCap: 0,
            lastUpdated: new Date().toISOString()
          };
        } else {
          console.warn(`[StockService] Alpha Vantage global quote not found or throttled for ${upperSymbol}`);
        }
      }
    } catch (apiError) {
      console.error(`[StockService] External API fetch failed for ${upperSymbol}:`, apiError.message);
      // Fallback will catch this and handle it gracefully
    }
  }

  // 3. Fallback: Try Database or Simulation
  if (!data) {
    console.log(`[StockService] Falling back to database lookup / mock generator for ${upperSymbol}`);
    const localStock = await Stock.findOne({ symbol: upperSymbol });
    if (localStock) {
      data = {
        _id: localStock._id,
        symbol: localStock.symbol,
        name: localStock.name,
        sector: localStock.sector,
        price: localStock.price,
        previousPrice: localStock.previousPrice,
        change: localStock.change,
        changePercent: localStock.changePercent,
        isSuspended: localStock.isSuspended,
        volume: localStock.volume,
        marketCap: localStock.marketCap,
        lastUpdated: localStock.updatedAt ? localStock.updatedAt.toISOString() : new Date().toISOString()
      };
    } else {
      // Create deterministic mock data based on the symbol string
      let hash = 0;
      for (let i = 0; i < upperSymbol.length; i++) {
        hash = upperSymbol.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const basePrice = Math.abs(hash % 450) + 15; // Realistic range: $15 to $465
      // Mock some small daily price change
      const changeRange = (hash % 10) - 5; // -5 to +4
      const changePercentRange = Number((changeRange / (basePrice / 100)).toFixed(2));
      
      data = {
        _id: upperSymbol,
        symbol: upperSymbol,
        name: getFallbackMeta(upperSymbol).name,
        sector: getFallbackMeta(upperSymbol).sector,
        price: Number(basePrice.toFixed(2)),
        previousPrice: Number((basePrice - changeRange).toFixed(2)),
        change: Number(changeRange.toFixed(2)),
        changePercent: changePercentRange,
        isSuspended: false,
        volume: 0,
        marketCap: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // 4. Cache data
  cache.set(upperSymbol, {
    data,
    timestamp: Date.now()
  });

  return data;
};

module.exports = {
  FALLBACK_STOCKS,
  getStockData,
  getApiKey
};
