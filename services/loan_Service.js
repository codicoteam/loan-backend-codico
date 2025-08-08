const Loan = require("../models/loan_model/loan_model");
const pdfService = require("./pdfService");
const User = require('../models/user_model');

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

const generateLoanAgreement = async (loanId, userId) => {
  try {
    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan not found");
    
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    
    // Generate PDF
    const pdfPath = await pdfService.generateLoanAgreement(loan, user);
    
    // Optionally sign it
    const signatureDetails = {
      signerName: `${user.firstName} ${user.lastName}`,
      signatureId: `SIG-${Date.now()}`
    };
    const signedPdfPath = await pdfService.signPdf(pdfPath, signatureDetails);
    
    // Update loan with PDF reference
    loan.agreementPdf = signedPdfPath;
    await loan.save();
    
    return signedPdfPath;
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

// Get loans by user ID
const getLoansByUserId = async (userId) => {
  try {
    const loans = await Loan.find({ user: userId }).populate("user");
    return loans;
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
  getLoansByUserId,
  updateLoan,
  deleteLoan,
  generateLoanAgreement
};
