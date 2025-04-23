const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  supabaseId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  location: {
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    }
  },
  isDonor: {
    type: Boolean,
    default: true
  },
  lastDonation: {
    type: Date
  },
  donationCount: {
    type: Number,
    default: 0
  },
  medicalInfo: {
    weight: Number,
    height: Number,
    hasMedicalConditions: Boolean,
    medicalConditionsDetails: String
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for geospatial queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Method to check if user is eligible to donate
userSchema.methods.isEligibleToDonate = function() {
  // If user has never donated, they are eligible
  if (!this.lastDonation) return true;
  
  // Check if at least 3 months (90 days) have passed since last donation
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
  
  return this.lastDonation <= threeMonthsAgo;
};

// Method to update donation count
userSchema.methods.updateDonationCount = function() {
  this.donationCount += 1;
  this.lastDonation = new Date();
  return this.save();
};

// Static method to find compatible donors for a blood type
userSchema.statics.findCompatibleDonors = function(bloodType, location, maxDistance = 50000) {
  // Blood type compatibility chart
  const compatibilityChart = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // AB+ can receive from all
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-'] // O- can only receive O-
  };
  
  const compatibleTypes = compatibilityChart[bloodType] || [];
  
  // Find donors with compatible blood types
  const query = {
    bloodType: { $in: compatibleTypes },
    isDonor: true,
    isVerified: true
  };
  
  // If location is provided, find donors within maxDistance (in meters)
  if (location && location.coordinates && location.coordinates.length === 2) {
    return this.find(query).where('location.coordinates').near({
      center: {
        type: 'Point',
        coordinates: location.coordinates
      },
      maxDistance: maxDistance, // in meters
      spherical: true
    });
  }
  
  // If no location, just return compatible donors
  return this.find(query);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
