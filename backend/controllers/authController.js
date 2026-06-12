const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretstockpilotjwtkeytoken', {
    expiresIn: '24h'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Determine and validate role, default to 'user'
    let userRole = 'user';
    if (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'user')) {
      userRole = role.toLowerCase();
    }

    // Create user (balance defaults to 10,000, status to active)
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      balance: userRole === 'admin' ? 1000000.00 : 10000.00
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        portfolio: user.portfolio,
        token: generateToken(user._id)
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Your account is suspended. Please contact the administrator.' });
      }

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        portfolio: user.portfolio,
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get user profile data
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      return res.json(user);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// @desc    Reset user virtual balance and clear portfolio
// @route   POST /api/auth/reset-balance
// @access  Private
const resetBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Reset properties
    user.balance = 10000.00;
    user.portfolio = [];
    await user.save();
    
    // Clear user's transactions
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({ user: user._id });

    return res.json({
      message: 'Virtual balance reset to $10,000.00 and portfolio cleared successfully.',
      balance: user.balance,
      portfolio: user.portfolio
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error resetting virtual balance' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  resetBalance
};
