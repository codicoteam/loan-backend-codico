const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userService = require("../services/user_Service");
const { authenticateToken } = require("../middlewares/auth");
const User = require('../models/user_model');
const auth = require('../middlewares/auth');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // 3) If everything is OK, send token
    auth.createSendToken(user, 200, res);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Signup
router.post("/signup", async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      "Pocket_2025",
      { expiresIn: "8h" }
    );

    // Create user object without password for security
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phoneNumber: newUser.phoneNumber,
      address: newUser.address,
      profilePicture: newUser.profilePicture,
      role: newUser.role,
      createdByAgent: newUser.createdByAgent,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    res.status(201).json({
      message: "User registered successfully",
      data: userResponse,
      token,
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(409).json({ message: "Email already exists" });
    }
    res
      .status(400)
      .json({ message: "Registration failed", error: error.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "Pocket_2025",
      {
        expiresIn: "8h",
      }
    );

    // Create user object without password for security
    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      profilePicture: user.profilePicture,
      role: user.role,
      createdByAgent: user.createdByAgent,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Get all users
router.get("/all", authenticateToken, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ message: "Users retrieved", data: users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Get user by ID
router.get("/get/:id", authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User found", data: user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
});

// Get users by agent ID
router.get("/get/agent/:agentId", authenticateToken, async (req, res) => {
  try {
    const users = await userService.getUsersByAgentId(req.params.agentId);
    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      count: users.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users by agent", error: error.message });
  }
});

// Update user
router.put("/update/:id", authenticateToken, async (req, res) => {
  try {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ message: "User updated", data: updatedUser });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating user", error: error.message });
  }
});

// Delete user
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error deleting user", error: error.message });
  }
});

module.exports = router;
