const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const donationSchema = new Schema({
  donor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  request: {
    type: Schema.Types.ObjectId,
    ref: 'Request'
  },
  hospital: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    }
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  units: {
    type: Number,
    default: 1,
    min: 1
  },
  donationDate: {
    type: Date,
    default: Date.now
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    url: String,
    issuedAt: Date
  },
  notes: {
    type: String
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

// Post-save hook to update user donation count and request status
donationSchema.post('save', async function(doc) {
  try {
    // Update donor's donation count and last donation date
    const User = mongoose.model('User');
    const donor = await User.findById(doc.donor);
    
    if (donor) {
      donor.donationCount += doc.units;
      donor.lastDonation = doc.donationDate;
      await donor.save();
    }
    
    // If donation is linked to a request, update request status
    if (doc.request) {
      const Request = mongoose.model('Request');
      const request = await Request.findById(doc.request);
      
      if (request) {
        // Update the matched donor status to 'donated'
        const matchedDonor = request.matchedDonors.find(match => 
          match.donor.toString() === doc.donor.toString()
        );
        
        if (matchedDonor) {
          matchedDonor.status = 'donated';
        }
        
        // Increment units received
        request.unitsReceived += doc.units;
        
        // Check if request is fulfilled
        if (request.unitsReceived >= request.unitsNeeded) {
          request.status = 'fulfilled';
        } else if (request.status === 'pending') {
          request.status = 'in-progress';
        }
        
        await request.save();
      }
    }
  } catch (error) {
    console.error('Error in donation post-save hook:', error);
  }
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
