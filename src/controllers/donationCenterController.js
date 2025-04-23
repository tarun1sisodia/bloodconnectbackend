const DonationCenter = require('../models/DonationCenter');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Get all donation centers
exports.getAllCenters = async (req, res) => {
  try {
    const { city, state, date, timeSlot } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (city) query.city = city;
    if (state) query.state = state;
    
    // Get centers matching basic criteria
    let centers = await DonationCenter.find(query);
    
    // If date is provided, filter centers with available slots on that date
    if (date) {
      const dateObj = new Date(date);
      centers = centers.filter(center => {
        const slots = center.getAvailableSlotsForDate(dateObj);
        return slots.length > 0;
      });
    }
    
    // If timeSlot is provided, further filter centers
    if (timeSlot) {
      const timeRange = getTimeRangeForSlot(timeSlot);
      if (timeRange) {
        centers = centers.filter(center => {
          const availableSlots = center.getAvailableSlotsForDate(date || new Date());
          return availableSlots.some(slot => {
            const slotHour = parseInt(slot.time.split(':')[0]);
            return slotHour >= timeRange.start && slotHour < timeRange.end;
          });
        });
      }
    }
    
    // Format response
    const formattedCenters = centers.map(center => formatCenterResponse(center, req.user));
    
    res.json({ centers: formattedCenters });
  } catch (error) {
    console.error('Error getting donation centers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get donation centers near user
exports.getNearbyDonationCenters = async (req, res) => {
  try {
    // Get user's location from their profile
    if (!req.user || !req.user.location || !req.user.location.coordinates) {
      return res.status(400).json({ message: 'User location not available' });
    }
    
    const { coordinates } = req.user.location;
    const maxDistance = req.query.distance ? parseInt(req.query.distance) * 1000 : 10000; // Convert km to meters
    
    // Find centers near user
    const centers = await DonationCenter.findNearby(coordinates, maxDistance);
    
    // Format response
    const formattedCenters = centers.map(center => formatCenterResponse(center, req.user));
    
    res.json({ centers: formattedCenters });
  } catch (error) {
    console.error('Error getting nearby donation centers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single donation center by ID
exports.getDonationCenterById = async (req, res) => {
  try {
    const center = await DonationCenter.findById(req.params.id);
    
    if (!center) {
      return res.status(404).json({ message: 'Donation center not found' });
    }
    
    // Format response
    const formattedCenter = formatCenterResponse(center, req.user);
    
    res.json({ center: formattedCenter });
  } catch (error) {
    console.error('Error getting donation center:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Book an appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { donationCenter: centerId, date, timeSlot } = req.body;
    
    // Check if user is eligible to donate
    if (!req.user.isEligibleToDonate()) {
      return res.status(400).json({ 
        message: 'You are not eligible to donate at this time. Please wait at least 3 months between donations.' 
      });
    }
    
    // Find the donation center
    const center = await DonationCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: 'Donation center not found' });
    }
    
    // Check if the slot is available
    const dateObj = new Date(date);
    const availableSlots = center.getAvailableSlotsForDate(dateObj);
    const slot = availableSlots.find(s => s.time === timeSlot);
    
    if (!slot) {
      return res.status(400).json({ message: 'The selected time slot is not available' });
    }
    
    // Create appointment
    const appointment = new Appointment({
      user: req.user._id,
      donationCenter: center._id,
      date: dateObj,
      timeSlot,
      status: 'scheduled'
    });
    
    await appointment.save();
    
    // Update slot availability in the donation center
    const slotDate = center.availableSlots.find(s => 
      new Date(s.date).toISOString().split('T')[0] === dateObj.toISOString().split('T')[0]
    );
    
    if (slotDate) {
      const slotIndex = slotDate.slots.findIndex(s => s.time === timeSlot);
      if (slotIndex !== -1) {
        slotDate.slots[slotIndex].booked += 1;
        await center.save();
      }
    }
    
    res.status(201).json({ 
      message: 'Appointment booked successfully', 
      appointment: {
        id: appointment._id,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        center: {
          id: center._id,
          name: center.name,
          address: center.address,
          city: center.city
        }
      }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('donationCenter', 'name address city state phone')
      .sort({ date: 1 });
    
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment._id,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
      center: {
        id: appointment.donationCenter._id,
        name: appointment.donationCenter.name,
        address: appointment.donationCenter.address,
        city: appointment.donationCenter.city,
        state: appointment.donationCenter.state,
        phone: appointment.donationCenter.phone
      },
      canCancel: appointment.canCancel()
    }));
    
    res.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Error getting user appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel an appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Check if appointment belongs to user
    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }
    
    // Check if appointment can be cancelled
    if (!appointment.canCancel()) {
      return res.status(400).json({ 
        message: 'This appointment cannot be cancelled. Appointments must be cancelled at least 24 hours in advance.' 
      });
    }
    
    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();
    
    // Update slot availability in the donation center
    const center = await DonationCenter.findById(appointment.donationCenter);
    if (center) {
      const dateObj = new Date(appointment.date);
      const slotDate = center.availableSlots.find(s => 
        new Date(s.date).toISOString().split('T')[0] === dateObj.toISOString().split('T')[0]
      );
      if (slotDate) {
        const slotIndex = slotDate.slots.findIndex(s => s.time === appointment.timeSlot);
        if (slotIndex !== -1) {
          slotDate.slots[slotIndex].booked -= 1;
          await center.save();
        }
      }
    }
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete an appointment (admin only)
exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Update appointment status
    appointment.status = 'completed';
    await appointment.save();
    
    // Update user's donation count and last donation date
    const user = await User.findById(appointment.user);
    if (user) {
      await user.updateDonationCount();
    }
    
    res.json({ message: 'Appointment marked as completed' });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to format center response
function formatCenterResponse(center, user) {
  // Calculate distance if user has location
  let distance = null;
  if (user && user.location && user.location.coordinates && 
      center.location && center.location.coordinates) {
    distance = calculateDistance(
      user.location.coordinates[1], // user latitude
      user.location.coordinates[0], // user longitude
      center.location.coordinates[1], // center latitude
      center.location.coordinates[0]  // center longitude
    );
  }
  
  // Format operating hours
  const hours = formatOperatingHours(center.operatingHours);
  
  // Get available slots for today and next 7 days
  const availableSlots = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const slots = center.getAvailableSlotsForDate(date);
    if (slots.length > 0) {
      availableSlots.push({
        date: date.toISOString().split('T')[0],
        slots: slots.map(s => s.time)
      });
    }
  }
  
  return {
    id: center._id,
    name: center.name,
    address: center.address,
    city: center.city,
    state: center.state,
    country: center.country,
    phone: center.phone,
    email: center.email,
    website: center.website,
    hours,
    distance: distance ? parseFloat(distance.toFixed(1)) : null,
    availableSlots,
    facilities: center.facilities || []
  };
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Helper function to format operating hours
function formatOperatingHours(hours) {
  if (!hours) return 'Hours not available';
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const formattedHours = [];
  
  for (const day of days) {
    if (hours[day] && hours[day].open && hours[day].close) {
      formattedHours.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours[day].open} - ${hours[day].close}`);
    } else {
      formattedHours.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`);
    }
  }
  
  return formattedHours.join(', ');
}

// Helper function to get time range for slot filter
function getTimeRangeForSlot(timeSlot) {
  switch (timeSlot) {
    case 'morning':
      return { start: 6, end: 12 };
    case 'afternoon':
      return { start: 12, end: 17 };
    case 'evening':
      return { start: 17, end: 22 };
    default:
      return null;
  }
}
// Get all cities with donation centers
exports.getAllCities = async (req, res) => {
    try {
      // Find all unique cities with active donation centers
      const cities = await DonationCenter.distinct('city', { isActive: true });
      
      res.json({ cities });
    } catch (error) {
      console.error('Error getting cities:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Get available slots for a specific donation center and date
  exports.getAvailableSlots = async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: 'Date parameter is required' });
      }
      
      const center = await DonationCenter.findById(id);
      
      if (!center) {
        return res.status(404).json({ message: 'Donation center not found' });
      }
      
      // Get available slots for the specified date
      const dateObj = new Date(date);
      const availableSlots = center.getAvailableSlotsForDate(dateObj);
      
      // Extract just the time strings
      const slots = availableSlots.map(slot => slot.time);
      
      res.json({ slots });
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  

module.exports = exports;
