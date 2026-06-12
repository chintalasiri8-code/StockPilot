const express = require('express');
const router = express.Router();
const {
  getPlatformAnalytics,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  addStock,
  editStock,
  deleteStock,
  toggleStockTrading,
  getAllTransactions
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes are protected and restricted to administrators
router.use(protect);
router.use(admin);

router.get('/analytics', getPlatformAnalytics);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', toggleUserStatus);

router.post('/stocks', addStock);
router.put('/stocks/:id', editStock);
router.delete('/stocks/:id', deleteStock);
router.put('/stocks/:id/toggle-trading', toggleStockTrading);

router.get('/transactions', getAllTransactions);

module.exports = router;
