const Request = require('../models/Request');
const User = require('../models/User');
const { sendRequestConfirmationEmail } = require('../utils/emailSender');

// Create a new blood request
const createRequest = async (req, res) => {
  try {
    const {
      patient,
      hospital,
      unitsNeeded,
      urgency,
      description
    } = req.body;
    
    // Create new request
    const request = new Request({
      requester: req.user._id,
      patient,
      hospital,
      unitsNeeded,
      urgency: urgency || 'medium',
      description,
      status: 'pending'
    });
    
    // Set expiration date (30 days from now by default)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    request.expiresAt = expiryDate;
    
    await request.save();
    
    // Send confirmation email to requester
    await sendRequestConfirmationEmail(req.user, request);
    
    res.status(201).json({
      message: 'Blood request created successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(400).json({ message: error.message || 'Failed to create request' });
  }
};

// Get all blood requests
const getAllRequests = async (req, res) => {
  try {
    const { bloodType, status, urgency, location, limit } = req.query;
    
    let query = {};
    
    // Filter by blood type if provided
    if (bloodType) {
      query['patient.bloodType'] = bloodType;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    } else {
      // By default, only show pending and in-progress requests
      query.status = { $in: ['pending', 'in-progress'] };
    }
    
    // Filter by urgency if provided
    if (urgency) {
      query.urgency = urgency;
    }
    
    // Filter by location if provided
    if (location) {
      query['hospital.city'] = { $regex: location, $options: 'i' };
    }
    
    // Find requests matching the query
    let requestsQuery = Request.find(query)
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });
    
    // Apply limit if provided
    if (limit) {
      requestsQuery = requestsQuery.limit(parseInt(limit));
    }
    
    const requests = await requestsQuery;
    
    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ message: error.message || 'Failed to get requests' });
  }
};

// Get request by ID
const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findById(id)
      .populate('requester', 'name email phone')
      .populate('matchedDonors.donor', 'name email bloodType');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.status(200).json({ request });
  } catch (error) {
    console.error('Get request by ID error:', error);
    res.status(500).json({ message: error.message || 'Failed to get request' });
  }
};

// Get requests by current user
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ requests });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ message: error.message || 'Failed to get requests' });
  }
};

// Update request
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient, hospital, unitsNeeded, urgency, description, status } = req.body;
    
    const request = await Request.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Update fields
    if (patient) request.patient = patient;
    if (hospital) request.hospital = hospital;
    if (unitsNeeded) request.unitsNeeded = unitsNeeded;
    if (urgency) request.urgency = urgency;
    if (description) request.description = description;
    if (status) request.status = status;
    
    await request.save();
    
    res.status(200).json({
      message: 'Request updated successfully',
      request
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(400).json({ message: error.message || 'Failed to update request' });
  }
};

// Delete request
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await Request.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }
    
    // Only allow deletion if no donors have been matched or donated
    const hasDonations = request.matchedDonors.some(match => match.status === 'donated');
    if (hasDonations) {
      return res.status(400).json({ 
        message: 'Cannot delete request with confirmed donations. Please update status instead.' 
      });
    }
    
    await Request.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete request' });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  updateRequest,
  deleteRequest
};
