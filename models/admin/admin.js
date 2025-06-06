const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    createdDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
adminSchema.pre("save", async function (next) {
  const admin = this;

  // Only hash if the password has been modified or is new
  if (!admin.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10); // You can adjust salt rounds
    admin.password = await bcrypt.hash(admin.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Admin", adminSchema);
