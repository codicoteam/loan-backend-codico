const Admin = require("../models/admin/admin"); // adjust the path as needed
const bcrypt = require("bcrypt");

const createAdmin = async (adminData) => {
  const existing = await Admin.findOne({ email: adminData.email });
  if (existing) {
    throw new Error("Admin with this email already exists.");
  }

  const newAdmin = new Admin(adminData);
  return await newAdmin.save();
};

// Service to get all admins
const getAllAdmins = async () => {
  try {
    return await Admin.find();
  } catch (error) {
    throw new Error(error.message);
  }
};

const getAdminById = async (id) => {
  return await Admin.findById(id).select("-password"); // Exclude password
};

const getAdminByEmail = async (email) => {
  return await Admin.findOne({ email });
};

const updateAdmin = async (id, updateData) => {
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
  }

  return await Admin.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");
};

const deleteAdmin = async (id) => {
  return await Admin.findByIdAndDelete(id);
};

const comparePasswords = async (enteredPassword, storedHash) => {
  return await bcrypt.compare(enteredPassword, storedHash);
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  getAdminByEmail,
  updateAdmin,
  deleteAdmin,
  comparePasswords,
};
