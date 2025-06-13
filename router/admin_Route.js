const express = require("express");
const router = express.Router();
const adminService = require("../services/admin"); // Adjust path
const { authenticateToken } = require("../middlewares/auth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminService.getAdminByEmail(email);

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      "Pocket_2025",
      { expiresIn: "8h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Admin Signup
router.post("/signup", async (req, res) => {
  try {
    const newAdmin = await adminService.createAdmin(req.body);

    const token = jwt.sign(
      { id: newAdmin._id, email: newAdmin.email },
      "Pocket_2025",
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "Admin registered successfully",
      data: newAdmin,
      token,
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res
      .status(400)
      .json({ message: "Error registering admin", error: error.message });
  }
});

// Get all admins
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const admins = await adminService.getAllAdmins();
    res
      .status(200)
      .json({ message: "Admins retrieved successfully", data: admins });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving admins", error: error.message });
  }
});

// Get admin by email
router.get("/getadmin/:email", authenticateToken, async (req, res) => {
  try {
    const admin = await adminService.getAdminByEmail(req.params.email);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res
      .status(200)
      .json({ message: "Admin retrieved successfully", data: admin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving admin", error: error.message });
  }
});

// Update admin
router.put("/updateadmin/:id", authenticateToken, async (req, res) => {
  try {
    const updatedAdmin = await adminService.updateAdmin(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json({ message: "Admin updated successfully", data: updatedAdmin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating admin", error: error.message });
  }
});

// Delete admin
router.delete("/deleteadmin/:id", authenticateToken, async (req, res) => {
  try {
    await adminService.deleteAdmin(req.params.id);
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting admin", error: error.message });
  }
});

// Add notification
router.post("/add-notification/:id", authenticateToken, async (req, res) => {
  try {
    const notifications = await adminService.addNotification(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json({ message: "Notification added", data: notifications });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding notification", error: error.message });
  }
});

// Mark all notifications as read
router.put(
  "/mark-notifications-read/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const notifications = await adminService.markNotificationsRead(
        req.params.id
      );
      res
        .status(200)
        .json({ message: "Notifications marked as read", data: notifications });
    } catch (error) {
      res.status(500).json({
        message: "Error updating notifications",
        error: error.message,
      });
    }
  }
);

// Update admin settings
router.put("/update-settings/:id", authenticateToken, async (req, res) => {
  try {
    const updatedSettings = await adminService.updateSettings(
      req.params.id,
      req.body
    );
    res
      .status(200)
      .json({ message: "Settings updated", data: updatedSettings });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating settings", error: error.message });
  }
});

// Add audit trail entry
router.post("/audit-trail/:id", authenticateToken, async (req, res) => {
  try {
    const { action, entity, entityId } = req.body;
    const trail = await adminService.addAuditTrail(
      req.params.id,
      action,
      entity,
      entityId
    );
    res.status(200).json({ message: "Audit trail recorded", data: trail });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging audit trail", error: error.message });
  }
});

module.exports = router;
