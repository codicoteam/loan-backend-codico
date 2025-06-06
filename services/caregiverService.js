const CareGiver = require("../models/caregiver/caregiver"); // Adjust path as needed
const bcrypt = require("bcryptjs");

const careGiverService = {
  // 🧾 Create a new caregiver
  async createCareGiver(data) {
    const existing = await CareGiver.findOne({ email: data.email });
    if (existing) {
      throw new Error("Caregiver with this email already exists.");
    }

    const careGiver = new CareGiver(data);
    return await careGiver.save();
  },

  // 📄 Get all caregivers
  async getAllCareGivers() {
    return await CareGiver.find({});
  },

  // 🔍 Get a caregiver by ID
  async getCareGiverById(id) {
    return await CareGiver.findById(id);
  },

  // ✏️ Update a caregiver
  async updateCareGiver(id, updateData) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updated = await CareGiver.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new Error("Caregiver not found.");
    }

    return updated;
  },

  // 🗑️ Delete a caregiver
  async deleteCareGiver(id) {
    const result = await CareGiver.findByIdAndDelete(id);
    if (!result) {
      throw new Error("Caregiver not found.");
    }
    return result;
  },

  // 🔐 Verify caregiver credentials (e.g., for login)
  async verifyCredentials(email, password) {
    const careGiver = await CareGiver.findOne({ email });
    if (!careGiver) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, careGiver.password);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    return careGiver;
  },
};

module.exports = careGiverService;
