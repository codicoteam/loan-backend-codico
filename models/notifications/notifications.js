const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receivers: {
      type: [String], // IDs, emails, or usernames of receivers
      default: [],
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
