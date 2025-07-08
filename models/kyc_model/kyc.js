const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Make sure you have a User model
      required: false,
    },
    nationalId: {
      type: String,
      required: false,
    },
    passportPhoto: {
      type: String,
      required: false,
    },
    proofOfResident: {
      type: String,
      required: false,
    },
    paySlip: {
      type: String,
      required: false,
    },
    proofOfEmployment: {
      type: String,
      required: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("KycDocument", kycSchema);
