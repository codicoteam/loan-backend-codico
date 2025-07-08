const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Make sure you have a User model
      required: true,
    },
    nationalId: {
      type: String,
      required: true,
    },
    passportPhoto: {
      type: String,
      required: true,
    },
    proofOfResident: {
      type: String,
      required: true,
    },
    paySlip: {
      type: String,
      required: true,
    },
    proofOfEmployment: {
      type: String,
      required: true,
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
