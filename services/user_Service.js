const User = require("../models/user_model/user");

// Create a new user
const createUser = async (userData) => {
  try {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const newUser = new User(userData);
    await newUser.save();
    return newUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    return await User.find();
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get user by email
const getUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get user by ID
const getUserById = async (id) => {
  try {
    return await User.findById(id);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update user
const updateUser = async (id, updateData) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete user
const deleteUser = async (id) => {
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) throw new Error("User not found");
    return deletedUser;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
};
