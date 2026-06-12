const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, resetBalance } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);
router.post('/reset-balance', protect, resetBalance);

module.exports = router;
