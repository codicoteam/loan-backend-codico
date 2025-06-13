const Loan = require("../models/loan_model/loan_model");

// Create a new loan application
const createLoan = async (loanData) => {
  try {
    const newLoan = new Loan(loanData);
    await newLoan.save();
    return newLoan;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all loans
const getAllLoans = async () => {
  try {
    return await Loan.find().populate("user");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get a loan by ID
const getLoanById = async (id) => {
  try {
    const loan = await Loan.findById(id).populate("user");
    if (!loan) throw new Error("Loan not found");
    return loan;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update a loan by ID
const updateLoan = async (id, updateData) => {
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedLoan) throw new Error("Loan not found");
    return updatedLoan;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete a loan by ID
const deleteLoan = async (id) => {
  try {
    const deletedLoan = await Loan.findByIdAndDelete(id);
    if (!deletedLoan) throw new Error("Loan not found");
    return deletedLoan;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createLoan,
  getAllLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
};
