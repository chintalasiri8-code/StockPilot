const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const StockHistory = require('../models/StockHistory');

// @desc    Get admin platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalStocks = await Stock.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    // Calculate total trading volume
    const volumeResult = await Transaction.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$totalAmount' } } }
    ]);
    const totalVolume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;

    // Find the most traded stocks (by transaction count)
    const mostTraded = await Transaction.aggregate([
      { $group: { _id: '$symbol', name: { $first: '$name' }, count: { $sum: 1 }, volume: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalUsers,
      totalStocks,
      totalTransactions,
      totalVolume: Number(totalVolume.toFixed(2)),
      mostTradedStocks: mostTraded.map(item => ({
        symbol: item._id,
        name: item.name,
        count: item.count,
        volume: Number(item.volume.toFixed(2))
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error generating platform analytics' });
  }
};

// @desc    Get all users with search
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search
      ? {
          role: 'user',
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } }
          ]
        }
      : { role: 'user' };

    const users = await User.find(search).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching users list' });
  }
};

// @desc    Get details of a single user (portfolio and history)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const transactions = await Transaction.find({ user: user._id }).sort({ date: -1 });

    res.json({
      user,
      transactions
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(500).json({ message: 'Server error fetching user details' });
  }
};

// @desc    Suspend or reactivate a user account
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status. Status must be active or inactive.');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot change status of an admin account');
    }

    user.status = status;
    await user.save();

    res.json({
      message: `User status successfully updated to ${status}`,
      userId: user._id,
      status: user.status
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Add a new stock
// @route   POST /api/admin/stocks
// @access  Private/Admin
const addStock = async (req, res) => {
  try {
    const { symbol, name, price, sector, description, volume, marketCap } = req.body;

    if (!symbol || !name || !price || !sector) {
      res.status(400);
      throw new Error('Please enter symbol, name, price, and sector');
    }

    const stockExists = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (stockExists) {
      res.status(400);
      throw new Error(`Stock symbol ${symbol.toUpperCase()} already exists`);
    }

    const stockPrice = parseFloat(price);
    const stock = await Stock.create({
      symbol: symbol.toUpperCase(),
      name,
      price: stockPrice,
      previousPrice: stockPrice,
      change: 0,
      changePercent: 0,
      sector,
      description: description || '',
      volume: volume ? parseInt(volume, 10) : 0,
      marketCap: marketCap ? parseFloat(marketCap) : 0
    });

    // Create StockHistory record
    await StockHistory.create({
      stock: stock._id,
      symbol: stock.symbol,
      priceHistory: [{ price: stockPrice, timestamp: new Date() }]
    });

    res.status(201).json(stock);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Edit stock details
// @route   PUT /api/admin/stocks/:id
// @access  Private/Admin
const editStock = async (req, res) => {
  try {
    const { name, sector, description, volume, marketCap } = req.body;

    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      res.status(404);
      throw new Error('Stock not found');
    }

    stock.name = name || stock.name;
    stock.sector = sector || stock.sector;
    stock.description = description || stock.description;
    if (volume !== undefined) stock.volume = parseInt(volume, 10);
    if (marketCap !== undefined) stock.marketCap = parseFloat(marketCap);

    await stock.save();
    res.json(stock);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Delete a stock
// @route   DELETE /api/admin/stocks/:id
// @access  Private/Admin
const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      res.status(404);
      throw new Error('Stock not found');
    }

    // Delete Stock, StockHistory, and potentially transactions (or let transaction history stay for audit logs)
    await StockHistory.deleteOne({ stock: stock._id });
    await Stock.deleteOne({ _id: stock._id });

    res.json({ message: `Stock ${stock.symbol} deleted successfully` });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Toggle trading availability (suspend/unsuspend)
// @route   PUT /api/admin/stocks/:id/toggle-trading
// @access  Private/Admin
const toggleStockTrading = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      res.status(404);
      throw new Error('Stock not found');
    }

    stock.isSuspended = !stock.isSuspended;
    await stock.save();

    res.json({
      message: `Stock ${stock.symbol} trading has been ${stock.isSuspended ? 'suspended' : 'enabled'}`,
      isSuspended: stock.isSuspended
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    View all platform transactions with filters
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getAllTransactions = async (req, res) => {
  try {
    const filter = {};

    // Filter by user
    if (req.query.user) {
      filter.user = req.query.user;
    }

    // Filter by stock (symbol)
    if (req.query.stock) {
      filter.symbol = req.query.stock.toUpperCase();
    }

    // Filter by date (YYYY-MM-DD)
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(req.query.date);
      endDate.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const transactions = await Transaction.find(filter)
      .populate('user', 'name email')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching platform transactions' });
  }
};

module.exports = {
  getPlatformAnalytics,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  addStock,
  editStock,
  deleteStock,
  toggleStockTrading,
  getAllTransactions
};
