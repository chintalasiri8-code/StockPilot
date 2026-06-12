const mongoose = require('mongoose');

const pricePointSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const stockHistorySchema = new mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: true,
    unique: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  priceHistory: [pricePointSchema]
});

module.exports = mongoose.model('StockHistory', stockHistorySchema);
