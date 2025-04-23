const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donationCenter: {
    type: Schema.Types.ObjectId,
    ref: 'DonationCenter',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
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

// Method to check if appointment can be cancelled
appointmentSchema.methods.canCancel = function() {
  // Can cancel if appointment is scheduled and at least 24 hours before appointment
  if (this.status !== 'scheduled') return false;
  
  const appointmentTime = new Date(this.date);
  const now = new Date();
  const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
  
  return hoursDifference >= 24;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
