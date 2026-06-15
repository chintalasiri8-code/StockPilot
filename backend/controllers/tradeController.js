const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Buy shares of a stock
// @route   POST /api/trades/buy
// @access  Private
const buyStock = async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    // 1. Quantity validation (cannot enter zero or negative quantities)
    if (isNaN(qty) || qty <= 0) {
      res.status(400);
      throw new Error('Quantity must be a positive integer greater than zero');
    }

    // 2. Fetch User & check status (prevent transactions if user account is inactive)
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.status === 'inactive') {
      res.status(403);
      throw new Error('Transactions are blocked. Your account is suspended.');
    }

    // 3. Fetch Stock & check suspension status (cannot trade suspended stocks)
    const stock = mongoose.Types.ObjectId.isValid(stockId)
      ? await Stock.findById(stockId)
      : await Stock.findOne({ symbol: stockId.toUpperCase() });
    if (!stock) {
      res.status(404);
      throw new Error('Stock not found');
    }

    if (stock.isSuspended) {
      res.status(400);
      throw new Error(`Trading is currently suspended for ${stock.symbol}`);
    }

    // 4. Balance validation (cannot buy when balance is insufficient)
    const totalCost = Number((stock.price * qty).toFixed(2));
    if (user.balance < totalCost) {
      res.status(400);
      throw new Error(`Insufficient funds. Required: $${totalCost.toLocaleString()}, Available: $${user.balance.toLocaleString()}`);
    }

    // 5. Execute purchase - deduct balance & update portfolio
    user.balance = Number((user.balance - totalCost).toFixed(2));

    // Find stock in user's portfolio
    const portfolioIndex = user.portfolio.findIndex(
      (item) => item.stock.toString() === stock._id.toString()
    );

    if (portfolioIndex > -1) {
      // Stock already exists in portfolio - calculate new average buy price
      const existingItem = user.portfolio[portfolioIndex];
      const existingQty = existingItem.quantity;
      const existingAvgPrice = existingItem.averageBuyPrice;

      const newQty = existingQty + qty;
      const newAvgPrice = Number(
        (((existingQty * existingAvgPrice) + (qty * stock.price)) / newQty).toFixed(2)
      );

      user.portfolio[portfolioIndex].quantity = newQty;
      user.portfolio[portfolioIndex].averageBuyPrice = newAvgPrice;
    } else {
      // Add new stock to portfolio
      user.portfolio.push({
        stock: stock._id,
        symbol: stock.symbol,
        name: stock.name,
        quantity: qty,
        averageBuyPrice: Number(stock.price.toFixed(2))
      });
    }

    await user.save();

    // 6. Record transaction history
    const transaction = await Transaction.create({
      user: user._id,
      stock: stock._id,
      symbol: stock.symbol,
      name: stock.name,
      type: 'buy',
      quantity: qty,
      price: stock.price,
      totalAmount: totalCost
    });

    res.status(201).json({
      success: true,
      message: `Successfully purchased ${qty} shares of ${stock.symbol}`,
      balance: user.balance,
      portfolio: user.portfolio,
      transaction
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Sell shares of a stock
// @route   POST /api/trades/sell
// @access  Private
const sellStock = async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    // 1. Quantity validation (cannot enter zero or negative quantities)
    if (isNaN(qty) || qty <= 0) {
      res.status(400);
      throw new Error('Quantity must be a positive integer greater than zero');
    }

    // 2. Fetch User & check status (prevent transactions if user account is inactive)
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.status === 'inactive') {
      res.status(403);
      throw new Error('Transactions are blocked. Your account is suspended.');
    }

    // 3. Fetch Stock & check suspension status (cannot trade suspended stocks)
    const stock = mongoose.Types.ObjectId.isValid(stockId)
      ? await Stock.findById(stockId)
      : await Stock.findOne({ symbol: stockId.toUpperCase() });
    if (!stock) {
      res.status(404);
      throw new Error('Stock not found');
    }

    if (stock.isSuspended) {
      res.status(400);
      throw new Error(`Trading is currently suspended for ${stock.symbol}`);
    }

    // 4. Portfolio ownership validation (cannot sell more than owned)
    const portfolioIndex = user.portfolio.findIndex(
      (item) => item.stock.toString() === stock._id.toString()
    );

    if (portfolioIndex === -1) {
      res.status(400);
      throw new Error(`You do not own any shares of ${stock.symbol}`);
    }

    const ownedQty = user.portfolio[portfolioIndex].quantity;
    if (ownedQty < qty) {
      res.status(400);
      throw new Error(`Insufficient shares. You own ${ownedQty} shares of ${stock.symbol}, but attempted to sell ${qty}`);
    }

    // 5. Execute sale - add to balance & update portfolio
    const totalProceeds = Number((stock.price * qty).toFixed(2));
    user.balance = Number((user.balance + totalProceeds).toFixed(2));

    if (ownedQty === qty) {
      // Remove stock completely from portfolio
      user.portfolio.splice(portfolioIndex, 1);
    } else {
      // Decrease quantity
      user.portfolio[portfolioIndex].quantity = ownedQty - qty;
    }

    await user.save();

    // 6. Record transaction history
    const transaction = await Transaction.create({
      user: user._id,
      stock: stock._id,
      symbol: stock.symbol,
      name: stock.name,
      type: 'sell',
      quantity: qty,
      price: stock.price,
      totalAmount: totalProceeds
    });

    res.status(200).json({
      success: true,
      message: `Successfully sold ${qty} shares of ${stock.symbol}`,
      balance: user.balance,
      portfolio: user.portfolio,
      transaction
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
};

// @desc    Get logged in user's transactions
// @route   GET /api/trades/history
// @access  Private
const getTradeHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error retrieving transaction history' });
  }
};

module.exports = {
  buyStock,
  sellStock,
  getTradeHistory
};
