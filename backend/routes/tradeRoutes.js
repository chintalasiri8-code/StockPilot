const express = require('express');
const router = express.Router();
const { buyStock, sellStock, getTradeHistory } = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/buy', protect, buyStock);
router.post('/sell', protect, sellStock);
router.get('/history', protect, getTradeHistory);

module.exports = router;
