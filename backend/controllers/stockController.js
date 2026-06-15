const Stock = require('../models/Stock');
const StockHistory = require('../models/StockHistory');
const stockService = require('../services/stockService');
const mongoose = require('mongoose');

// @desc    Get all stocks
// @route   GET /api/stocks
// @access  Public (Authenticated or Guest can view listings)
const getStocks = async (req, res) => {
  try {
    const { symbol } = req.query;

    if (symbol) {
      const sanitizedSymbol = symbol.trim();
      if (!sanitizedSymbol) {
        return res.status(400).json({ message: 'Stock symbol query parameter must be a non-empty string' });
      }

      const liveData = await stockService.getStockData(sanitizedSymbol);
      return res.json(liveData);
    }

    const search = req.query.search
      ? {
          $or: [
            { symbol: { $regex: req.query.search, $options: 'i' } },
            { name: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } }
          ]
        }
      : {};

    const stocks = await Stock.find({ ...search }).sort({ symbol: 1 });

    if (stocks.length > 0 || req.query.search) {
      return res.json(stocks);
    }

    const fallbackStocks = await Promise.all(
      stockService.FALLBACK_STOCKS.map((stock) => stockService.getStockData(stock.symbol))
    );

    return res.json(fallbackStocks);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching stocks' });
  }
};

// @desc    Get stock details & price history
// @route   GET /api/stocks/:id
// @access  Public/Private
const getStockById = async (req, res) => {
  try {
    const stock = mongoose.Types.ObjectId.isValid(req.params.id)
      ? await Stock.findById(req.params.id)
      : await Stock.findOne({ symbol: req.params.id.toUpperCase() });

    if (!stock) {
      const liveData = await stockService.getStockData(req.params.id);
      return res.json({
        stock: liveData,
        priceHistory: []
      });
    }

    // Get stock history
    const history = await StockHistory.findOne({ stock: stock._id });

    res.json({
      stock,
      priceHistory: history ? history.priceHistory : []
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Stock not found' });
    }
    return res.status(500).json({ message: 'Server error fetching stock details' });
  }
};

module.exports = {
  getStocks,
  getStockById
};
