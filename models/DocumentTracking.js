const mongoose = require('mongoose');

const documentTrackingSchema = new mongoose.Schema({
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unsignedDocPath: String,
  signedDocPath: String,
  signaturePath: String,
  isSigned: {
    type: Boolean,
    default: false
  },
  signedAt: Date,
  signingIP: String,
  signingDevice: String,
  versions: [{
    docPath: String,
    signed: Boolean,
    createdAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('DocumentTracking', documentTrackingSchema);