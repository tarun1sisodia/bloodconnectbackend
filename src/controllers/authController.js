const User = require('../models/User');
const { registerUser, loginUser, resetPassword } = require('../utils/supabase');
const { sendWelcomeEmail } = require('../utils/emailSender');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, name, bloodType, phone, location } = req.body;

    // Validate input
    if (!email || !password || !name || !bloodType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Register user in Supabase
    const supabaseData = await registerUser(email, password, { name, bloodType });
    if (!supabaseData || !supabaseData.user) {
      throw new Error('Failed to register user in Supabase');
    }

    // Create user in MongoDB
    const user = new User({
      supabaseId: supabaseData.user.id,
      email,
      name,
      bloodType,
      phone,
      location
    });

    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Login with Supabase
    const supabaseData = await loginUser(email, password);
    if (!supabaseData || !supabaseData.user) {
      throw new Error('Invalid email or password');
    }

    // Find user in MongoDB
    const user = await User.findOne({ supabaseId: supabaseData.user.id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Login successful',
      token: supabaseData.session.access_token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: error.message || 'Login failed' });
  }
};

// Reset password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await resetPassword(email);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ message: error.message || 'Password reset failed' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        bloodType: user.bloodType,
        phone: user.phone,
        location: user.location,
        donationCount: user.donationCount,
        lastDonation: user.lastDonation,
        isEligible: user.isEligible,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: error.message || 'Failed to get user data' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  getCurrentUser
};
