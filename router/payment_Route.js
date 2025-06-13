const express = require("express");
const router = express.Router();
const paymentService = require("../services/payment_Service");
const { authenticateToken } = require("../middlewares/auth");

// Create new payment
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res
      .status(201)
      .json({ message: "Payment created successfully", data: payment });
  } catch (error) {
    const code =
      error.message === "Payment reference already exists" ? 409 : 400;
    res
      .status(code)
      .json({ message: "Payment creation failed", error: error.message });
  }
});

// Get all payments
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.status(200).json({ message: "Payments retrieved", data: payments });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch payments", error: error.message });
  }
});

// Get payment by ID
router.get("/get/:id", authenticateToken, async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ message: "Payment found", data: payment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving payment", error: error.message });
  }
});

// Get payments by user ID
router.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsByUser(req.params.userId);
    res
      .status(200)
      .json({ message: "User payments retrieved", data: payments });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve user payments",
      error: error.message,
    });
  }
});

// Update payment
router.put("/update/:id", authenticateToken, async (req, res) => {
  try {
    const updatedPayment = await paymentService.updatePayment(
      req.params.id,
      req.body
    );
    res.status(200).json({ message: "Payment updated", data: updatedPayment });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to update payment", error: error.message });
  }
});

// Delete payment
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await paymentService.deletePayment(req.params.id);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to delete payment", error: error.message });
  }
});

module.exports = router;
