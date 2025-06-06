const express = require("express");
const router = express.Router();
const adminService = require("../services/adminService"); // Adjust the path as needed
const bcrypt = require("bcryptjs");

// Login route to authenticate admin (no token)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminService.getAdminByEmail(email);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Admin signup route (no token)
router.post("/create", async (req, res) => {
  try {
    const adminData = req.body;

    const newAdmin = await adminService.createAdmin(adminData);

    res.status(201).json({
      message: "Admin registered successfully",
      data: newAdmin,
    });
  } catch (error) {
    if (error.message === "Admin with this email already exists.") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res
      .status(400)
      .json({ message: "Error registering admin", error: error.message });
  }
});

// Get all admins
router.get("/getall", async (req, res) => {
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
router.get("/getadmin/:email", async (req, res) => {
  try {
    const admin = await adminService.getAdminByEmail(req.params.email);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res
      .status(200)
      .json({ message: "Admin retrieved successfully", data: admin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving admin", error: error.message });
  }
});

// Update admin by ID
router.put("/update/:id", async (req, res) => {
  try {
    const updatedAdmin = await adminService.updateAdmin(
      req.params.id,
      req.body
    );
    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res
      .status(200)
      .json({ message: "Admin updated successfully", data: updatedAdmin });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating admin", error: error.message });
  }
});

// Delete admin by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    await adminService.deleteAdmin(req.params.id);
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting admin", error: error.message });
  }
});

module.exports = router;
