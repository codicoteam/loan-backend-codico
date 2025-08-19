const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const Loan = require('../models/loan_model/loan_model');
const User = require('../models/user_model');
const DocumentTracking = require('../models/DocumentTracking');
const pdfService = require('../services/pdfService');
const auth = require('../middlewares/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.ensureDirSync(path.join(__dirname, '../../uploads/signatures'));
    cb(null, path.join(__dirname, '../../uploads/signatures'));
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG/JPEG images allowed'), false);
    }
  }
});

router.post('/:loanId/generate', auth.authenticateToken, async (req, res) => {
  try {
    const loanId = req.params.loanId;

    // Check if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Check if a DocumentTracking already exists for this loan
    let tracking = await DocumentTracking.findOne({ loanId });
    if (tracking) {
      return res.status(200).json({
        success: false,
        message: "Document already exists for this loan",
        documentTrackingId: tracking._id,
        loanId: tracking.loanId
      });
    }


    const pdfPath = await pdfService.generateLoanAgreement(loan, user);
    
    tracking = new DocumentTracking({
      loanId: loan._id,
      userId: user._id,
      unsignedDocPath: pdfPath
    });
    await tracking.save();

    loan.documentTracking = tracking._id;
    await loan.save();

    res.json({
      success: true,
      documentId: tracking._id,
      pdfUrl: `/api/documents/${loan._id}/unsigned`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:documentId/sign', auth.authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    const tracking = await DocumentTracking.findById(req.params.documentId);
    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const loan = await Loan.findById(tracking.loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (tracking.isSigned) {
  return res.status(400).json({
    success: false,
    message: 'Document already signed',
    documentTrackingId: tracking._id,   // 👈 include tracking id
    loanId: tracking.loanId             // 👈 include loan id
  });
}
if (tracking.isSigned) {
      return res.status(400).json({
        success: false,
        message: 'Document already signed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Signature image is required'
      });
    }

    const signedPath = path.join(__dirname, '../../documents', `loan_${loan._id}_signed.pdf`);
    await pdfService.signLoanAgreement(tracking.unsignedDocPath, req.file.path, signedPath);

    tracking.signedDocPath = signedPath;
    tracking.signaturePath = req.file.path;
    tracking.isSigned = true;
    tracking.signedAt = new Date();
    tracking.signingIP = req.ip;
    tracking.signingDevice = req.headers['user-agent'];
    await tracking.save();

    loan.agreementPdf = signedPath;
    loan.signedAt = new Date();
    loan.signedBy = req.user.id;
    await loan.save();

    res.json({
      success: true,
      signedDocumentUrl: `/api/documents/${loan._id}/signed`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:loanId/status', auth.authenticateToken, async (req, res) => {
  try {
    const tracking = await DocumentTracking.findOne({ loanId: req.params.loanId });
    
    if (!tracking) {
      return res.json({ 
        exists: false, 
        status: "UNSIGNED",   // default
        isSigned: false 
      });
    }

    res.json({
      exists: true,
      status: tracking.isSigned ? "SIGNED" : "UNSIGNED",   // 👈 human-readable status
      isSigned: tracking.isSigned,
      signedAt: tracking.signedAt,
      unsignedUrl: tracking.unsignedDocPath ? `/api/documents/${req.params.loanId}/unsigned` : null,
      signedUrl: tracking.signedDocPath ? `/api/documents/${req.params.loanId}/signed` : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/:loanId/:type(unsigned|signed)', auth.authenticateToken, async (req, res) => {
  try {
    const tracking = await DocumentTracking.findOne({ loanId: req.params.loanId });
    if (!tracking) {
      return res.status(404).json({ success: false, message: 'Document tracking not found' });
    }

    const filePath = req.params.type === 'unsigned' ? tracking.unsignedDocPath : tracking.signedDocPath;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;