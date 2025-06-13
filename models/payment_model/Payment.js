const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Ecocash', 'OneMoney', 'Innsbucks', 'BankTransfer', 'Cash', 'Card'],
    required: true,
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true,
  },
  forInstallmentDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'failed'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
