const Payment = require("../models/payment_model/Payment");

// Create a new payment
const createPayment = async (paymentData) => {
  try {
    const existing = await Payment.findOne({
      paymentReference: paymentData.paymentReference,
    });
    if (existing) throw new Error("Payment reference already exists");

    const payment = new Payment(paymentData);
    await payment.save();
    return payment;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get all payments
const getAllPayments = async () => {
  try {
    return await Payment.find().populate("user").populate("loan");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get payment by ID
const getPaymentById = async (id) => {
  try {
    return await Payment.findById(id).populate("user").populate("loan");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get payments by user
const getPaymentsByUser = async (userId) => {
  try {
    return await Payment.find({ user: userId }).populate("loan");
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update payment
const updatePayment = async (id, updateData) => {
  try {
    const updated = await Payment.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updated) throw new Error("Payment not found");
    return updated;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete payment
const deletePayment = async (id) => {
  try {
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) throw new Error("Payment not found");
    return deleted;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByUser,
  updatePayment,
  deletePayment,
};
