import encryptionUtils from "../utils/encryption";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const requestSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      name: {
        type: Object,
        required: true,
      },
      age: {
        type: Number,
        required: true,
      },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
      bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: true,
      },
    },
    hospital: {
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
      },
      state: {
        type: String,
        required: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0],
        },
      },
    },
    unitsNeeded: {
      type: Number,
      required: true,
      min: 1,
    },
    unitsReceived: {
      type: Number,
      default: 0,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "fulfilled", "cancelled"],
      default: "pending",
    },
    description: {
      type: String,
      trim: true,
    },
    matchedDonors: [
      {
        donor: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["matched", "contacted", "confirmed", "donated", "cancelled"],
          default: "matched",
        },
        matchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
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

// Encrypt sensitive fields before saving
requestSchema.pre("save", function (next) {
  if (this.isModified("patient.name") && this.patient.name) {
    this.patient.name = encryptionUtils.encrypt(this.patient.name);
  }
  if (this.isModified("hospital.name") && this.hospital.name) {
    this.hospital.name = encryptionUtils.encrypt(this.hospital.name);
  }
  if (this.isModified("hospital.address") && this.hospital.address) {
    this.hospital.address = encryptionUtils.encrypt(this.hospital.address);
  }
  next();
});

// Decrypt sensitive fields after finding
const decryptFields = (doc) => {
  if (doc && doc.patient && doc.patient.name) {
    doc.patient.name = encryptionUtils.decrypt(doc.patient.name);
  }
  if (doc && doc.hospital && doc.hospital.name) {
    doc.hospital.name = encryptionUtils.decrypt(doc.hospital.name);
  }
  if (doc && doc.hospital && doc.hospital.address) {
    doc.hospital.address = encryptionUtils.decrypt(doc.hospital.address);
  }
};

requestSchema.post("findOne", decryptFields);
requestSchema.post("find", (docs) => {
  docs.forEach(decryptFields);
});
requestSchema.post("findOneAndUpdate", decryptFields);

// Helper to compute compatible donor blood types for this request
requestSchema.methods.getCompatibleBloodTypes = function () {
  const compatibilityChart = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"],
  };
  return compatibilityChart[this.patient?.bloodType] || [];
};

// Index for geospatial queries
requestSchema.index({ "hospital.coordinates": "2dsphere" });

// Method to add a matched donor
requestSchema.methods.addMatchedDonor = function (donorId) {
  // Check if donor is already matched
  const isAlreadyMatched = this.matchedDonors.some(
    (match) => match.donor.toString() === donorId.toString()
  );

  if (!isAlreadyMatched) {
    this.matchedDonors.push({
      donor: donorId,
      status: "matched",
      matchedAt: new Date(),
    });

    // If status is pending, update to in-progress
    if (this.status === "pending") {
      this.status = "in-progress";
    }

    return this.save();
  }

  return Promise.resolve(this);
};

// Method to update donor status
requestSchema.methods.updateDonorStatus = function (donorId, newStatus) {
  const matchedDonor = this.matchedDonors.find(
    (match) => match.donor.toString() === donorId.toString()
  );

  if (matchedDonor) {
    matchedDonor.status = newStatus;

    // If donor has donated, increment unitsReceived
    if (newStatus === "donated") {
      this.unitsReceived += 1;

      // Check if request is fulfilled
      if (this.unitsReceived >= this.unitsNeeded) {
        this.status = "fulfilled";
      }
    }

    return this.save();
  }

  return Promise.reject(new Error("Donor not found in matched donors"));
};

// Static method to find nearby requests
requestSchema.statics.findNearbyRequests = function (
  coordinates,
  maxDistance = 50000
) {
  return this.find({
    status: { $in: ["pending", "in-progress"] },
  })
    .where("hospital.coordinates")
    .near({
      center: {
        type: "Point",
        coordinates: coordinates,
      },
      maxDistance: maxDistance, // in meters
      spherical: true,
    });
};

export const Request = mongoose.model("Request", requestSchema);
