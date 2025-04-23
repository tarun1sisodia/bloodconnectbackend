require('dotenv').config();
const mongoose = require('mongoose');
const DonationCenter = require('../models/DonationCenter');

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
.then(() => {
  console.log('Connected to MongoDB');
  seedDonationCenters();
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Generate available slots for the next 30 days
function generateAvailableSlots() {
  const slots = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip Sundays (assuming index 0 is Sunday)
    if (date.getDay() === 0) continue;
    
    const timeSlots = [];
    
    // Morning slots
    for (let hour = 9; hour < 12; hour++) {
      timeSlots.push({
        time: `${hour}:00`,
        capacity: 5,
        booked: Math.floor(Math.random() * 3) // Random number of bookings between 0-2
      });
    }
    
    // Afternoon slots
    for (let hour = 13; hour < 17; hour++) {
      timeSlots.push({
        time: `${hour}:00`,
        capacity: 5,
        booked: Math.floor(Math.random() * 3) // Random number of bookings between 0-2
      });
    }
    
    slots.push({
      date: date,
      slots: timeSlots
    });
  }
  
  return slots;
}

// Sample donation centers data
const donationCenters = [
  {
    name: 'Red Cross Blood Center',
    address: '123 Main Street',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    phone: '+91-11-2345-6789',
    email: 'redcross@example.com',
    website: 'https://www.redcross.org',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // [longitude, latitude] for New Delhi
    },
    operatingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments'],
    isActive: true
  },
  {
    name: 'Apollo Blood Bank',
    address: '456 Hospital Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    phone: '+91-22-3456-7890',
    email: 'apollo@example.com',
    website: 'https://www.apollohospitals.com',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760] // [longitude, latitude] for Mumbai
    },
    operatingHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { open: '10:00', close: '14:00' }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments', 'WiFi'],
    isActive: true
  },
  {
    name: 'City Blood Bank',
    address: '789 Health Avenue',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    phone: '+91-80-4567-8901',
    email: 'citybloodbank@example.com',
    website: 'https://www.citybloodbank.org',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716] // [longitude, latitude] for Bangalore
    },
    operatingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '15:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments'],
    isActive: true
  },
  {
    name: 'Lifeline Blood Center',
    address: '321 Medical Plaza',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    phone: '+91-44-5678-9012',
    email: 'lifeline@example.com',
    website: 'https://www.lifelineblood.org',
    location: {
      type: 'Point',
      coordinates: [80.2707, 13.0827] // [longitude, latitude] for Chennai
    },
    operatingHours: {
      monday: { open: '08:30', close: '17:30' },
      tuesday: { open: '08:30', close: '17:30' },
      wednesday: { open: '08:30', close: '17:30' },
      thursday: { open: '08:30', close: '17:30' },
      friday: { open: '08:30', close: '17:30' },
      saturday: { open: '09:00', close: '14:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments', 'TV'],
    isActive: true
  },
  {
    name: 'National Blood Services',
    address: '555 Government Road',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    phone: '+91-33-6789-0123',
    email: 'nationalblood@example.com',
    website: 'https://www.nationalblood.org',
    location: {
      type: 'Point',
      coordinates: [88.3639, 22.5726] // [longitude, latitude] for Kolkata
    },
    operatingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments', 'WiFi'],
    isActive: true
  },
  {
    name: 'Community Blood Center',
    address: '888 Health Street',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    phone: '+91-40-7890-1234',
    email: 'community@example.com',
    website: 'https://www.communityblood.org',
    location: {
      type: 'Point',
      coordinates: [78.4867, 17.3850] // [longitude, latitude] for Hyderabad
    },
    operatingHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '09:00', close: '15:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments', 'Child Play Area'],
    isActive: true
  },
  {
    name: 'Pune Blood Bank',
    address: '777 Medical Center Road',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    phone: '+91-20-8901-2345',
    email: 'puneblood@example.com',
    website: 'https://www.punebloodbank.org',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204] // [longitude, latitude] for Pune
    },
    operatingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments'],
    isActive: true
  },
  {
    name: 'Ahmedabad Blood Services',
    address: '444 Hospital Complex',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    phone: '+91-79-9012-3456',
    email: 'ahmedabadblood@example.com',
    website: 'https://www.ahmedabadblood.org',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225] // [longitude, latitude] for Ahmedabad
    },
    operatingHours: {
      monday: { open: '08:30', close: '17:30' },
      tuesday: { open: '08:30', close: '17:30' },
      wednesday: { open: '08:30', close: '17:30' },
      thursday: { open: '08:30', close: '17:30' },
      friday: { open: '08:30', close: '17:30' },
      saturday: { open: '09:00', close: '15:00' },
      sunday: { open: null, close: null }
    },
    facilities: ['Parking', 'Wheelchair Access', 'Refreshments', 'WiFi'],
    isActive: true
  }
];

// Seed donation centers to the database
async function seedDonationCenters() {
  try {
    // Clear existing donation centers
    await DonationCenter.deleteMany({});
    console.log('Cleared existing donation centers');
    
    // Add available slots to each center
    const centersWithSlots = donationCenters.map(center => ({
      ...center,
      availableSlots: generateAvailableSlots()
    }));
    
    // Insert new donation centers
    const result = await DonationCenter.insertMany(centersWithSlots);
    console.log(`Successfully seeded ${result.length} donation centers`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding donation centers:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}
