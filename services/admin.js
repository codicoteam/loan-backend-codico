const Admin = require("../models/admin_model/admin"); // Adjust the path if needed

// Create a new admin
const createAdmin = async (adminData) => {
  try {
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) {
      throw new Error("Email already exists");
    }

    const newAdmin = new Admin(adminData);
    await newAdmin.save();
    return newAdmin;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all admins
const getAllAdmins = async () => {
  try {
    return await Admin.find().select("-password"); // Exclude password
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get admin by ID
const getAdminById = async (id) => {
  try {
    const admin = await Admin.findById(id).select("-password");
    if (!admin) throw new Error("Admin not found");
    return admin;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get admin by email
const getAdminByEmail = async (email) => {
  try {
    return await Admin.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update admin
const updateAdmin = async (id, updateData) => {
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedAdmin) {
      throw new Error("Admin not found");
    }
    return updatedAdmin;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete admin
const deleteAdmin = async (id) => {
  try {
    const deletedAdmin = await Admin.findByIdAndDelete(id);
    if (!deletedAdmin) {
      throw new Error("Admin not found");
    }
    return deletedAdmin;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Add a notification to an admin
const addNotification = async (adminId, notification) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error("Admin not found");

    admin.notifications.push(notification);
    await admin.save();
    return admin.notifications;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark all notifications as read
const markNotificationsRead = async (adminId) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error("Admin not found");

    admin.notifications.forEach((n) => (n.read = true));
    await admin.save();
    return admin.notifications;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update admin settings
const updateSettings = async (adminId, newSettings) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error("Admin not found");

    admin.settings = { ...admin.settings.toObject(), ...newSettings };
    await admin.save();
    return admin.settings;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Add an audit trail entry
const addAuditTrail = async (adminId, action, entity, entityId) => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error("Admin not found");

    admin.auditTrail.push({
      action,
      entity,
      entityId,
      performedBy: adminId,
    });

    await admin.save();
    return admin.auditTrail;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  getAdminByEmail,
  updateAdmin,
  deleteAdmin,
  addNotification,
  markNotificationsRead,
  updateSettings,
  addAuditTrail,
};
