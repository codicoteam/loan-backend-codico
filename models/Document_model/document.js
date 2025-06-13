const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "id",
        "passport",
        "proof_of_income",
        "payslip",
        "title_deed",
        "license",
        "other",
      ],
      required: true,
    },
    fileName: String,
    fileUrl: String,
    fileSize: Number, // in bytes
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);
