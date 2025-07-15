const express = require("express");
const router = express.Router();
const notificationService = require("../services/user_notification_Service");
const { authenticateToken } = require("../middlewares/auth");

// Create a notification
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json({
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to create notification", error: error.message });
  }
});

// Get all notifications (admin)
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const notifications = await notificationService.getAllNotifications();
    res
      .status(200)
      .json({ message: "All notifications fetched", data: notifications });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
});

// Get notifications by user ID
router.get("/get/:userId", authenticateToken, async (req, res) => {
  try {
    const notifications = await notificationService.getNotificationsByUserId(
      req.params.userId
    );
    res.status(200).json({
      message: "User notifications fetched",
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user notifications",
      error: error.message,
    });
  }
});

// Mark a specific notification as read
router.put("/read/:id", authenticateToken, async (req, res) => {
  try {
    const updatedNotification =
      await notificationService.markNotificationAsRead(req.params.id);
    res.status(200).json({
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating notification", error: error.message });
  }
});

// Mark all notifications as read for a user
router.put("/read-all/:userId", authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.markAllAsReadForUser(
      req.params.userId
    );
    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating notifications", error: error.message });
  }
});

// Delete a notification
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting notification", error: error.message });
  }
});

module.exports = router;
