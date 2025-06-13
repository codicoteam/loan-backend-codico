const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "moderator"],
      default: "admin",
    },
    permissions: {
      type: [String],
      default: [], // e.g., ['create_user', 'manage_loans', 'view_reports']
    },
    notifications: [
      {
        message: String,
        type: {
          type: String,
          enum: ["loan", "system", "alert"],
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
    ],
    settings: {
      interestRate: {
        type: Number,
        default: 0.05, // 5%
      },
      loanTerms: {
        type: [String], // e.g., ['6 months', '12 months']
        default: [],
      },
      workflows: {
        type: Map,
        of: String,
        default: {}, // e.g., { "approvalStep1": "manager", "approvalStep2": "admin" }
      },
    },
    auditTrail: [
      {
        action: String,
        entity: String,
        entityId: mongoose.Schema.Types.ObjectId,
        performedAt: {
          type: Date,
          default: Date.now,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Hash password before updating
adminSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
