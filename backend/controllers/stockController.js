const Stock = require('../models/Stock');
const StockHistory = require('../models/StockHistory');
const stockService = require('../services/stockService');

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
    res.json(stocks);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching stocks' });
  }
};

// @desc    Get stock details & price history
// @route   GET /api/stocks/:id
// @access  Public/Private
const getStockById = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
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
