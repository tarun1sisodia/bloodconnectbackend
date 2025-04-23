const User = require('../models/User');
const Donation = require('../models/Donation');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's donations
    const donations = await Donation.find({ donor: user._id })
      .populate('request')
      .sort({ donationDate: -1 });
    
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
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      },
      donations
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message || 'Failed to get profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, bloodType, location, profilePicture } = req.body;
    const user = req.user;
    
    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bloodType) user.bloodType = bloodType;
    if (location) user.location = location;
    if (profilePicture) user.profilePicture = profilePicture;
    
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        bloodType: user.bloodType,
        phone: user.phone,
        location: user.location,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ message: error.message || 'Failed to update profile' });
  }
};

// Get all donors
const getDonors = async (req, res) => {
  try {
    const { bloodType, location } = req.query;
    let query = {};
    
    // Filter by blood type if provided
    if (bloodType) {
      query.bloodType = bloodType;
    }
    
    // Filter by location if provided
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    
    // Find donors with at least one donation
    query.donationCount = { $gt: 0 };
    
    const donors = await User.find(query)
      .select('name bloodType location donationCount lastDonation profilePicture')
      .sort({ donationCount: -1 });
    
    res.status(200).json({ donors });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ message: error.message || 'Failed to get donors' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('name bloodType location donationCount lastDonation profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDonors,
  getUserById
};
