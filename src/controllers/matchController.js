const Request = require('../models/Request');
const User = require('../models/User');
const { sendDonorMatchEmail, sendRequesterNotificationEmail } = require('../utils/emailSender');

// Find matching donors for a request
const findMatchingDonors = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to find matches for this request' });
    }
    
    // Get compatible blood types
    const compatibleBloodTypes = request.getCompatibleBloodTypes();
    
    // Find eligible donors with compatible blood types
    const donors = await User.find({
      bloodType: { $in: compatibleBloodTypes },
      isEligible: true,
      _id: { $ne: req.user._id } // Exclude requester
    }).select('name bloodType location email');
    
    // Filter by location if hospital location is provided
    let matchedDonors = donors;
    if (request.hospital && request.hospital.city) {
      // Simple location matching by city
      matchedDonors = donors.filter(donor => 
        donor.location && 
        donor.location.city && 
        donor.location.city.toLowerCase() === request.hospital.city.toLowerCase()
      );
      
      // If no donors in the same city, return all compatible donors
      if (matchedDonors.length === 0) {
        matchedDonors = donors;
      }
    }
    
    // Send emails to matched donors
    for (const donor of matchedDonors) {
      await sendDonorMatchEmail(donor, request);
    }
    
    res.status(200).json({
      message: `Found ${matchedDonors.length} potential donors`,
      donors: matchedDonors
    });
  } catch (error) {
    console.error('Find matching donors error:', error);
    res.status(500).json({ message: error.message || 'Failed to find matching donors' });
  }
};

// Volunteer as a donor for a request
const volunteerForRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Check if request is still open or in progress
    if (!['open', 'in-progress'].includes(request.status)) {
      return res.status(400).json({ message: 'This request is no longer accepting donors' });
    }
    
    // Check if user is eligible to donate
    const user = req.user;
    const isEligible = user.checkEligibility();
    
    if (!isEligible) {
      return res.status(400).json({
        message: 'You are not eligible to donate at this time. Please wait at least 3 months between donations.'
      });
    }
    
    // Check if blood type is compatible
    const compatibleBloodTypes = request.getCompatibleBloodTypes();
    if (!compatibleBloodTypes.includes(user.bloodType)) {
      return res.status(400).json({
        message: `Your blood type (${user.bloodType}) is not compatible with the requested blood type (${request.bloodType})`
      });
    }
    
    // Add user as a matched donor
    await request.addMatchedDonor(user._id);
    
    // Get requester details
    const requester = await User.findById(request.requester);
    
    // Send notification to requester
    await sendRequesterNotificationEmail(requester, user, request);
    
    res.status(200).json({
      message: 'You have successfully volunteered for this request',
      request
    });
  } catch (error) {
    console.error('Volunteer for request error:', error);
    res.status(400).json({ message: error.message || 'Failed to volunteer for request' });
  }
};

module.exports = {
  findMatchingDonors,
  volunteerForRequest
};
