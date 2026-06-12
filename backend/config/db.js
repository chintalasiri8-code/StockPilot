const mongoose = require('mongoose');
const User = require('../models/User');

const seedDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@stockpilot.com' });
    if (!adminExists) {
      console.log('Default Admin account not found. Creating default admin account...');
      await User.create({
        name: 'Platform Admin',
        email: 'admin@stockpilot.com',
        password: 'Admin@123',
        role: 'admin',
        balance: 1000000.00
      });
      console.log('Default Admin account created successfully (Email: admin@stockpilot.com, Password: Admin@123)');
    }
  } catch (error) {
    console.error(`Error seeding default admin account: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockpilot');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedDefaultAdmin();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.warn('Warning: Server is running without an active database connection. Please ensure MongoDB is started.');
  }
};

module.exports = connectDB;
