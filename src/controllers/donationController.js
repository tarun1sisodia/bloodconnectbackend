const Donation = require('../models/Donation');
const Request = require('../models/Request');
const User = require('../models/User');

// Record a new donation
const createDonation = async (req, res) => {
  try {
    const {
      requestId,
      hospital,
      donationDate,
      units,
      notes
    } = req.body;
    
    // Check if user is eligible to donate
    const user = req.user;
    const isEligible = user.checkEligibility();
    
    if (!isEligible) {
      return res.status(400).json({
        message: 'You are not eligible to donate at this time. Please wait at least 3 months between donations.'
      });
    }
    
    // Create donation record
    const donation = new Donation({
      donor: user._id,
      request: requestId,
      hospital,
      donationDate: donationDate || new Date(),
      units: units || 1,
      notes
    });
    
    await donation.save();
    
    // If donation is linked to a request, update the request
    if (requestId) {
      const request = await Request.findById(requestId);
      if (request) {
        // Add donor to matched donors if not already there
        await request.addMatchedDonor(user._id);
        
        // Update donor status to 'donated'
        const donorMatch = request.matchedDonors.find(
          match => match.donor.toString() === user._id.toString()
        );
        
        if (donorMatch) {
          donorMatch.status = 'donated';
          await request.save();
        }
      }
    }
    
    res.status(201).json({
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(400).json({ message: error.message || 'Failed to record donation' });
  }
};

// Get donations by current user
const getUserDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('request')
      .sort({ donationDate: -1 });
    
    res.status(200).json({ donations });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ message: error.message || 'Failed to get donations' });
  }
};

// Get donation by ID
const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const donation = await Donation.findById(id)
      .populate('donor', 'name email')
      .populate('request');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Check if user is the donor or the requester of the linked request
    const isDonor = donation.donor._id.toString() === req.user._id.toString();
    let isRequester = false;
    
    if (donation.request) {
      const request = await Request.findById(donation.request._id);
      isRequester = request.requester.toString() === req.user._id.toString();
    }
    
    if (!isDonor && !isRequester) {
      return res.status(403).json({ message: 'Not authorized to view this donation' });
    }
    
    res.status(200).json({ donation });
  } catch (error) {
    console.error('Get donation by ID error:', error);
    res.status(500).json({ message: error.message || 'Failed to get donation' });
  }
};

// Verify a donation (admin only)
const verifyDonation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Add admin check here
    
    const donation = await Donation.findById(id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    donation.verified = true;
    await donation.save();
    
    res.status(200).json({
      message: 'Donation verified successfully',
      donation
    });
  } catch (error) {
    console.error('Verify donation error:', error);
    res.status(500).json({ message: error.message || 'Failed to verify donation' });
  }
};

module.exports = {
  createDonation,
  getUserDonations,
  getDonationById,
  verifyDonation
};
