const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  medicalAidInfo: {
    type: String,
  },
  profilePicture: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  allergies: {
    type: [String],
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  familyMemberIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      default: [],
    },
  ],
  medicalHistory: [
    {
      condition: {
        type: String,
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ["Ongoing", "Resolved", "Chronic"],
        required: true,
      },
    },
  ],
});

// 🔐 Hash password before saving a patient
patientSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 🔐 Hash password before updating a patient
patientSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }

  next();
});

module.exports = mongoose.model("Patient", patientSchema);
