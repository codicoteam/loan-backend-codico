const Notification = require("../models/notifications/notifications");

// Create a new notification
const createNotification = async (notificationData) => {
  try {
    const newNotification = new Notification(notificationData);
    await newNotification.save();
    return newNotification;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all notifications
const getAllNotifications = async () => {
  try {
    return await Notification.find().sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get notifications by receiver ID (receiverId is a string inside the receivers array)
const getNotificationsByReceiverId = async (receiverId) => {
  try {
    return await Notification.find({ receivers: receiverId }).sort({
      createdAt: -1,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mark a specific notification as read
const markNotificationAsRead = async (id) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
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

// Mark all notifications as read for a receiver
const markAllAsReadForReceiver = async (receiverId) => {
  try {
    const result = await Notification.updateMany(
      { receivers: receiverId, read: false },
      { read: true }
    );
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete a notification
const deleteNotification = async (id) => {
  try {
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) throw new Error("Notification not found");
    return notification;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationsByReceiverId,
  markNotificationAsRead,
  markAllAsReadForReceiver,
  deleteNotification,
};
