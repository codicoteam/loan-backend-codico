const AdminNotification = require("../models/notifications/admin_notification");

// Create a new admin notification
const createAdminNotification = async (notificationData) => {
  try {
    const newNotification = new AdminNotification(notificationData);
    await newNotification.save();
    return newNotification;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all admin notifications
const getAllAdminNotifications = async () => {
  try {
    return await AdminNotification.find().populate(
      "user",
      "firstName lastName email"
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get notifications by admin ID
const getAdminNotificationsByUserId = async (adminId) => {
  try {
    return await AdminNotification.find({ user: adminId }).sort({
      createdAt: -1,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark a specific admin notification as read
const markAdminNotificationAsRead = async (id) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    if (!notification) throw new Error("Notification not found");
    return notification;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark all admin notifications as read for a user
const markAllAdminAsReadForUser = async (adminId) => {
  try {
    const result = await AdminNotification.updateMany(
      { user: adminId, read: false },
      { read: true }
    );
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete an admin notification
const deleteAdminNotification = async (id) => {
  try {
    const notification = await AdminNotification.findByIdAndDelete(id);
    if (!notification) throw new Error("Notification not found");
    return notification;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createAdminNotification,
  getAllAdminNotifications,
  getAdminNotificationsByUserId,
  markAdminNotificationAsRead,
  markAllAdminAsReadForUser,
  deleteAdminNotification,
};
