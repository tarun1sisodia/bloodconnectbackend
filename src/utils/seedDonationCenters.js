const mongoose = require('mongoose');
const DonationCenter = require('../models/DonationCenter');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Check if MongoDB URI is available
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('MongoDB URI is not defined in environment variables');
  console.error('Please make sure you have MONGODB_URI defined in your .env file');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Sample donation centers data
const donationCenters = [
  {
    name: 'City Blood Bank',
    address: '123 Main Street',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // [longitude, latitude]
    },
    phone: '+91 11-2345-6789',
    email: 'info@citybloodbank.org',
    website: 'www.citybloodbank.org',
    operatingHours: {
      monday: { open: '8:00 AM', close: '8:00 PM' },
      tuesday: { open: '8:00 AM', close: '8:00 PM' },
      wednesday: { open: '8:00 AM', close: '8:00 PM' },
      thursday: { open: '8:00 AM', close: '8:00 PM' },
      friday: { open: '8:00 AM', close: '8:00 PM' },
      saturday: { open: '9:00 AM', close: '5:00 PM' },
      sunday: { open: '10:00 AM', close: '2:00 PM' }
    },
    facilities: ['Free Parking', 'Refreshments', 'WiFi'],
    isActive: true
  },
  {
    name: 'Apollo Blood Center',
    address: '456 Hospital Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760]
    },
    phone: '+91 22-3456-7890',
    email: 'blood@apollohospital.com',
    website: 'www.apollohospital.com/blood-center',
    operatingHours: {
      monday: { open: '9:00 AM', close: '6:00 PM' },
      tuesday: { open: '9:00 AM', close: '6:00 PM' },
      wednesday: { open: '9:00 AM', close: '6:00 PM' },
      thursday: { open: '9:00 AM', close: '6:00 PM' },
      friday: { open: '9:00 AM', close: '6:00 PM' },
      saturday: { open: '9:00 AM', close: '4:00 PM' },
      sunday: { open: '', close: '' }
    },
    facilities: ['Air Conditioning', 'TV', 'Medical Consultation'],
    isActive: true
  },
  {
    name: 'Red Cross Donation Center',
    address: '789 Charity Lane',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716]
    },
    phone: '+91 80-4567-8901',
    email: 'bangalore@redcross.org',
    website: 'www.redcross.org/bangalore',
    operatingHours: {
      monday: { open: '8:30 AM', close: '7:30 PM' },
      tuesday: { open: '8:30 AM', close: '7:30 PM' },
      wednesday: { open: '8:30 AM', close: '7:30 PM' },
      thursday: { open: '8:30 AM', close: '7:30 PM' },
      friday: { open: '8:30 AM', close: '7:30 PM' },
      saturday: { open: '9:30 AM', close: '5:30 PM' },
      sunday: { open: '10:30 AM', close: '3:30 PM' }
    },
    facilities: ['Refreshments', 'Child Care', 'Free Health Check-up'],
    isActive: true
  },
  {
    name: 'Community Blood Services',
    address: '321 Health Avenue',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    location: {
      type: 'Point',
      coordinates: [80.2707, 13.0827]
    },
    phone: '+91 44-5678-9012',
    email: 'info@communityblood.org',
    website: 'www.communityblood.org',
    operatingHours: {
      monday: { open: '9:00 AM', close: '5:00 PM' },
      tuesday: { open: '9:00 AM', close: '5:00 PM' },
      wednesday: { open: '9:00 AM', close: '5:00 PM' },
      thursday: { open: '9:00 AM', close: '5:00 PM' },
      friday: { open: '9:00 AM', close: '5:00 PM' },
      saturday: { open: '10:00 AM', close: '2:00 PM' },
      sunday: { open: '', close: '' }
    },
    facilities: ['Parking', 'Refreshments'],
    isActive: true
  },
  {
    name: 'National Blood Bank',
    address: '555 Government Road',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    location: {
      type: 'Point',
      coordinates: [88.3639, 22.5726]
    },
    phone: '+91 33-6789-0123',
    email: 'kolkata@nationalbloodbank.gov.in',
    website: 'www.nationalbloodbank.gov.in',
    operatingHours: {
      monday: { open: '8:00 AM', close: '6:00 PM' },
      tuesday: { open: '8:00 AM', close: '6:00 PM' },
      wednesday: { open: '8:00 AM', close: '6:00 PM' },
      thursday: { open: '8:00 AM', close: '6:00 PM' },
      friday: { open: '8:00 AM', close: '6:00 PM' },
      saturday: { open: '9:00 AM', close: '3:00 PM' },
      sunday: { open: '', close: '' }
    },
    facilities: ['Government ID Required', 'Free Testing', 'Medical Consultation'],
    isActive: true
  }
];

// Function to generate available slots for the next 30 days
function generateAvailableSlots() {
  const slots = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip generating slots for past dates
    if (date < today) continue;
    
    // Generate different time slots
    const timeSlots = [
      { time: '8:00 AM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '9:00 AM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '10:00 AM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '11:00 AM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '12:00 PM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '1:00 PM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '2:00 PM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '3:00 PM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '4:00 PM', capacity: 5, booked: Math.floor(Math.random() * 3) },
      { time: '5:00 PM', capacity: 5, booked: Math.floor(Math.random() * 3) }
    ];
    slots.push({
        date: date,
        slots: timeSlots
      });
    }
    
    return slots;
  }
  
  // Add available slots to each donation center
  donationCenters.forEach(center => {
    center.availableSlots = generateAvailableSlots();
  });
  
  // Seed function
  async function seedDonationCenters() {
    try {
      // Clear existing data
      await DonationCenter.deleteMany({});
      console.log('Cleared existing donation centers');
      
      // Insert new data
      const result = await DonationCenter.insertMany(donationCenters);
      console.log(`Successfully seeded ${result.length} donation centers`);
      
      // Close connection
      mongoose.connection.close();
    } catch (error) {
      console.error('Error seeding donation centers:', error);
      mongoose.connection.close();
    }
  }
  
  // Run the seed function
  seedDonationCenters();
  