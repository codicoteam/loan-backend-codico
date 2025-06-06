const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const careGiverSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  employmentType: {
    type: String,
    enum: ["FullTime", "PartTime", "Contract"],
    required: true,
  },
  workingHours: {
    startHour: {
      type: String,
      required: true,
    },
    endHour: {
      type: String,
      required: true,
    },
  },
  hasCar: {
    type: Boolean,
    default: false,
  },
  carDetails: {
    type: String,
    default: "",
  },
  insurance: {
    type: Boolean,
    default: false,
  },
  insuranceDetails: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
});

// 🔐 Hash password before saving a caregiver
careGiverSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// 🔐 Hash password before updating caregiver
careGiverSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }

  next();
});

module.exports = mongoose.model("CareGiver", careGiverSchema);
