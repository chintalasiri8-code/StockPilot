const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'Please add a stock symbol'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a stock name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add stock price'],
    min: [0.01, 'Price must be greater than zero']
  },
  previousPrice: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  sector: {
    type: String,
    required: [true, 'Please add a sector'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  volume: {
    type: Number,
    default: 0
  },
  marketCap: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Stock', stockSchema);
