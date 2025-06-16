const express = require("express");
const router = express.Router();
const loanService = require("../services/loan_Service");
const { authenticateToken } = require("../middlewares/auth");

// Create a loan
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.createLoan(req.body);
    res.status(201).json({ message: "Loan created successfully", data: loan });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to create loan", error: error.message });
  }
});

// Get all loans
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const loans = await loanService.getAllLoans();
    res
      .status(200)
      .json({ message: "Loans fetched successfully", data: loans });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch loans", error: error.message });
  }
});

// Get loans by user ID
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const loans = await loanService.getLoansByUserId(req.params.userId);
    res.status(200).json({
      message: "User loans fetched successfully",
      data: loans,
      count: loans.length,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch user loans",
      error: error.message,
    });
  }
});
// Get loan by User ID
router.get("/get/:id", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    res.status(200).json({ message: "Loan fetched successfully", data: loan });
  } catch (error) {
    res.status(404).json({ message: "Loan not found", error: error.message });
  }
});

// Update a loan
router.put("/update/:id", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.updateLoan(req.params.id, req.body);
    res.status(200).json({ message: "Loan updated successfully", data: loan });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to update loan", error: error.message });
  }
});

// Delete a loan
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await loanService.deleteLoan(req.params.id);
    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to delete loan", error: error.message });
  }
});

module.exports = router;
