const express = require("express");
const router = express.Router();
const notificationService = require("../services/notifications_Service");
const { authenticateToken } = require("../middlewares/auth");

// Create a new notification
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res
      .status(201)
      .json({ message: "Notification created", data: notification });
  } catch (error) {
    res.status(400).json({ message: "Creation failed", error: error.message });
  }
});

// Get all notifications
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const notifications = await notificationService.getAllNotifications();
    res
      .status(200)
      .json({ message: "Notifications fetched", data: notifications });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
});

// Get notifications by receiver ID
router.get("/get/:receiverId", authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const notifications =
      await notificationService.getNotificationsByReceiverId(receiverId);
    res.status(200).json({
      message: "Notifications fetched",
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
});

// Mark a specific notification as read
router.put("/read/:id", authenticateToken, async (req, res) => {
  try {
    const updated = await notificationService.markNotificationAsRead(
      req.params.id
    );
    res
      .status(200)
      .json({ message: "Notification marked as read", data: updated });
  } catch (error) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
});

// Mark all notifications as read for a receiver
router.put("/read-all/:receiverId", authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.markAllAsReadForReceiver(
      req.params.receiverId
    );
    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Bulk update failed", error: error.message });
  }
});

// Delete a notification
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(400).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;
