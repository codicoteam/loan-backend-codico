const UserNotification = require("../models/notifications/user_notification");

// Create a new notification
const createNotification = async (notificationData) => {
  try {
    const newNotification = new UserNotification(notificationData);
    await newNotification.save();
    return newNotification;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all notifications
const getAllNotifications = async () => {
  try {
    return await UserNotification.find().populate(
      "user",
      "firstName lastName email"
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get notifications by user ID
const getNotificationsByUserId = async (userId) => {
  try {
    return await UserNotification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName email");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark a notification as read
const markNotificationAsRead = async (notificationId) => {
  try {
    const updated = await UserNotification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    if (!updated) throw new Error("Notification not found");
    return updated;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark all notifications as read for a user
const markAllAsReadForUser = async (userId) => {
  try {
    return await UserNotification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete a notification
const deleteNotification = async (id) => {
  try {
    const deleted = await UserNotification.findByIdAndDelete(id);
    if (!deleted) throw new Error("Notification not found");
    return deleted;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllAsReadForUser,
  deleteNotification,
};
