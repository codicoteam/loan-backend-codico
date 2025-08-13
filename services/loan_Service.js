const Loan = require("../models/loan_model/loan_model");
const pdfService = require("./pdfService");
const User = require('../models/user_model');
const fs = require('fs-extra');
const path = require('path');

// Create a new loan application
const createLoan = async (loanData) => {
  try {
    const newLoan = new Loan(loanData);
    await newLoan.save();
    return newLoan;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw new Error(`Failed to create loan: ${error.message}`);
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
    return pdfPath;
  } catch (error) {
    console.error('Error generating agreement:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

// Get all loans
const getAllLoans = async () => {
  try {
    return await Loan.find().populate("user");
  } catch (error) {
    console.error('Error fetching loans:', error);
    throw new Error(`Failed to fetch loans: ${error.message}`);
  }
};

// Get a loan by ID
const getLoanById = async (id) => {
  try {
    const loan = await Loan.findById(id).populate("user");
    if (!loan) throw new Error("Loan not found");
    return loan;
  } catch (error) {
    console.error('Error fetching loan:', error);
    throw new Error(`Failed to fetch loan: ${error.message}`);
  }
};

// Get loans by user ID
const getLoansByUserId = async (userId) => {
  try {
    const loans = await Loan.find({ user: userId }).populate("user");
    return loans;
  } catch (error) {
    console.error('Error fetching user loans:', error);
    throw new Error(`Failed to fetch user loans: ${error.message}`);
  }
};

// Update a loan by ID (CRITICAL FIX)
const updateLoan = async (id, updateData) => {
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(
      id, 
      { $set: updateData },
      { 
        new: true,         // Return updated document
        runValidators: true // Validate update data
      }
    );
    
    if (!updatedLoan) {
      throw new Error("Loan not found or update failed");
    }
    
    console.log('Successfully updated loan:', updatedLoan._id);
    return updatedLoan;
  } catch (error) {
    console.error('Error updating loan:', error);
    throw new Error(`Failed to update loan: ${error.message}`);
  }
};
const updateLoanAgreement = async (loanId, pdfPath, userId) => {
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      { 
        agreementPdf: pdfPath,
        signedAt: new Date(),
        signedBy: userId
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedLoan) {
      throw new Error("Failed to update loan with PDF reference");
    }
    
    console.log('Successfully updated loan with PDF:', {
      loanId,
      pdfPath: updatedLoan.agreementPdf
    });
    
    return updatedLoan;
  } catch (error) {
    console.error('Error updating loan agreement:', error);
    throw new Error(`Failed to update loan agreement: ${error.message}`);
  }
};
// Delete a loan by ID
const deleteLoan = async (id) => {
  try {
    const loan = await Loan.findById(id);
    if (!loan) throw new Error("Loan not found");

    // Clean up associated PDFs
    if (loan.agreementPdf) {
      const pdfPath = path.join(__dirname, '../', loan.agreementPdf);
      if (await fs.pathExists(pdfPath)) {
        await fs.remove(pdfPath);
      }
    }

    const deletedLoan = await Loan.findByIdAndDelete(id);
    return deletedLoan;
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw new Error(`Failed to delete loan: ${error.message}`);
  }
};

module.exports = {
  createLoan,
  getAllLoans,
  getLoanById,
  getLoansByUserId,
  updateLoan,
  deleteLoan,
  updateLoanAgreement,
  generateLoanAgreement
};