const User = require('../models/User');
const Request = require('../models/Request');
const Donation = require('../models/Donation');

// Get application statistics
const getStats = async (req, res) => {
  try {
    // Count documents in each collection
    const userCount = await User.countDocuments();
    const donorCount = await User.countDocuments({ isDonor: true });
    const requestCount = await Request.countDocuments();
    const donationCount = await Donation.countDocuments();
    
    // Get fulfilled requests count
    const fulfilledRequestCount = await Request.countDocuments({ status: 'fulfilled' });
    
    // Get blood type distribution
    const bloodTypeStats = await User.aggregate([
      { $group: { _id: "$bloodType", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Get recent donations
    const recentDonations = await Donation.find()
      .sort({ donationDate: -1 })
      .limit(5)
      .populate('donor', 'name');
    
    // Get urgent requests
    const urgentRequests = await Request.find({ 
      urgency: { $in: ['high', 'critical'] },
      status: { $in: ['pending', 'in-progress'] }
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    res.status(200).json({
      userCount,
      donorCount,
      requestCount,
      donationCount,
      fulfilledRequestCount,
      bloodTypeStats,
      recentDonations,
      urgentRequests
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch statistics' });
  }
};

module.exports = {
  getStats
};
