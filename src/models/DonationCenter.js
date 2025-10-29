import encryptionUtils from "../utils/encryption";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const donationCenterSchema = new Schema(
  {
    name: {
      type: Object,
      required: true,
    },
    address: {
      type: Object,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    phone: {
      type: Object,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    facilities: [String],
    availableSlots: [
      {
        date: {
          type: Date,
          required: true,
        },
        slots: [
          {
            time: {
              type: String,
              required: true,
            },
            capacity: {
              type: Number,
              default: 5,
            },
            booked: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
donationCenterSchema.index({ location: "2dsphere" });

// Encrypt sensitive fields before saving
donationCenterSchema.pre("save", function (next) {
  if (this.isModified("name") && this.name) {
    this.name = encryptionUtils.encrypt(this.name);
  }
  if (this.isModified("address") && this.address) {
    this.address = encryptionUtils.encrypt(this.address);
  }
  if (this.isModified("phone") && this.phone) {
    this.phone = encryptionUtils.encrypt(this.phone);
  }
  next();
});

// Decrypt sensitive fields after finding
const decryptFields = (doc) => {
  if (doc && doc.name) {
    doc.name = encryptionUtils.decrypt(doc.name);
  }
  if (doc && doc.address) {
    doc.address = encryptionUtils.decrypt(doc.address);
  }
  if (doc && doc.phone) {
    doc.phone = encryptionUtils.decrypt(doc.phone);
  }
};

donationCenterSchema.post("findOne", decryptFields);
donationCenterSchema.post("find", (docs) => {
  docs.forEach(decryptFields);
});
donationCenterSchema.post("findOneAndUpdate", decryptFields);

// Method to check if center is open on a specific day and time
donationCenterSchema.methods.isOpen = function (day, time) {
  if (!this.operatingHours || !this.operatingHours[day]) {
    return false;
  }

  const { open, close } = this.operatingHours[day];
  if (!open || !close) {
    return false;
  }

  // Convert time strings to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const openMinutes = timeToMinutes(open);
  const closeMinutes = timeToMinutes(close);
  const currentMinutes = timeToMinutes(time);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

// Method to get available slots for a specific date
donationCenterSchema.methods.getAvailableSlotsForDate = function (date) {
  // Normalize the date to remove time component
  const dateString = new Date(date).toISOString().split("T")[0];

  // Find the slot for the given date
  const daySlots = this.availableSlots.find(
    (slot) => new Date(slot.date).toISOString().split("T")[0] === dateString
  );

  if (!daySlots) return [];

  // Return only slots that have available capacity
  return daySlots.slots.filter((slot) => slot.booked < slot.capacity);
};

// Static method to find nearby donation centers
donationCenterSchema.statics.findNearby = function (
  coordinates,
  maxDistance = 10000
) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates,
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    isActive: true,
  });
};

export const DonationCenter = mongoose.model(
  "DonationCenter",
  donationCenterSchema
);
