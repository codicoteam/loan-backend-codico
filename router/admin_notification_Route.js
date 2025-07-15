const express = require("express");
const router = express.Router();
const adminNotificationService = require("../services/admin_notification_Service");
const { authenticateToken } = require("../middlewares/auth");

// Create a new admin notification
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const notification = await adminNotificationService.createAdminNotification(
      req.body
    );
    res
      .status(201)
      .json({ message: "Notification created", data: notification });
  } catch (error) {
    res.status(400).json({ message: "Creation failed", error: error.message });
  }
});

// Get all admin notifications
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const notifications =
      await adminNotificationService.getAllAdminNotifications();
    res
      .status(200)
      .json({ message: "Notifications fetched", data: notifications });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
});

// Get notifications by admin ID
router.get("/get/:adminId", authenticateToken, async (req, res) => {
  try {
    const notifications =
      await adminNotificationService.getAdminNotificationsByUserId(
        req.params.adminId
      );
    res.status(200).json({
      message: "Admin notifications fetched",
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
    const updated = await adminNotificationService.markAdminNotificationAsRead(
      req.params.id
    );
    res
      .status(200)
      .json({ message: "Notification marked as read", data: updated });
  } catch (error) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
});

// Mark all notifications as read for an admin
router.put("/read-all/:adminId", authenticateToken, async (req, res) => {
  try {
    const result = await adminNotificationService.markAllAdminAsReadForUser(
      req.params.adminId
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

// Delete an admin notification
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await adminNotificationService.deleteAdminNotification(req.params.id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(400).json({ message: "Delete failed", error: error.message });
  }
});

module.exports = router;
