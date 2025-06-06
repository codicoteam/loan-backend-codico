const Patient = require("../models/patient/patient"); // Adjust path as necessary
const bcrypt = require("bcryptjs");

const patientService = {
  // 🧾 Create a new patient
  async createPatient(data) {
    const existing = await Patient.findOne({ email: data.email });
    if (existing) {
      throw new Error("Patient with this email already exists.");
    }

    const patient = new Patient(data);
    return await patient.save();
  },

  // 📄 Get all patients
  async getAllPatients() {
    return await Patient.find({});
  },

  // 🔍 Get a patient by ID
  async getPatientById(id) {
    return await Patient.findById(id);
  },

  // ✏️ Update a patient
  async updatePatient(id, updateData) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updated = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new Error("Patient not found.");
    }

    return updated;
  },

  // 🗑️ Delete a patient
  async deletePatient(id) {
    const result = await Patient.findByIdAndDelete(id);
    if (!result) {
      throw new Error("Patient not found.");
    }
    return result;
  },

  // 🔐 Verify patient credentials (e.g., for login)
  async verifyCredentials(email, password) {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    return patient;
  },
};

module.exports = patientService;
