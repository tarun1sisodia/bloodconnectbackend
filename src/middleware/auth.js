const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// Debug
console.log('Auth middleware - Supabase URL:', supabaseUrl);
console.log('Auth middleware - Supabase Key available:', !!supabaseKey);

// Make sure we have valid configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration in auth middleware');
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to authenticate user using JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Find user in MongoDB
    const mongoUser = await User.findOne({ supabaseId: user.id });
    
    if (!mongoUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Set user in request
    req.user = mongoUser;
    req.supabaseUser = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to ensure user exists in MongoDB (used after Supabase auth)
const ensureUserInMongoDB = async (req, res, next) => {
  try {
    if (!req.supabaseUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user exists in MongoDB
    let user = await User.findOne({ supabaseId: req.supabaseUser.id });
    
    // If user doesn't exist, create a basic record
    if (!user) {
      user = new User({
        supabaseId: req.supabaseUser.id,
        email: req.supabaseUser.email,
        name: req.supabaseUser.user_metadata?.name || 'New User',
        profileComplete: false
      });
      
      await user.save();
    }
    
    // Update req.user with MongoDB user
    req.user = user;
    
    next();
  } catch (error) {
    console.error('ensureUserInMongoDB error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, ensureUserInMongoDB };
