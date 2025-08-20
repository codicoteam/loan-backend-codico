// routes/documentRoutes.js
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

// ---------- Multer setup for signature uploads ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/signatures');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG/JPEG images allowed'), false);
  }
});

// ---------- POST /:loanId/generate - generate and stream PDF ----------
router.post('/:loanId/generate', auth.authenticateToken, async (req, res) => {
  try {
    const loanId = req.params.loanId;

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).send('Loan not found');

    const user = await User.findById(loan.user);
    if (!user) return res.status(404).send('User not found');

    // Generate new PDF
    const pdfPath = await pdfService.generateLoanAgreement(loan, user);

    // Save or update tracking
    let tracking = await DocumentTracking.findOne({ loanId });
    if (!tracking) {
      tracking = new DocumentTracking({
        loanId: loan._id,
        userId: user._id,
        unsignedDocPath: pdfPath
      });
    } else {
      tracking.unsignedDocPath = pdfPath; // overwrite old PDF
      tracking.isSigned = false;
      tracking.signedDocPath = null;
      tracking.signaturePath = null;
      tracking.signedAt = null;
    }
    await tracking.save();

    // Link tracking to loan
    loan.documentTracking = tracking._id;
    await loan.save();

    // Stream PDF to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=loan_${loan._id}.pdf`);
    fs.createReadStream(pdfPath).pipe(res);

  } catch (error) {
    console.error('PDF generation failed:', error);
    res.status(500).send('Failed to generate PDF');
  }
});

// ---------- POST /:documentId/sign - sign PDF ----------
router.post('/:documentId/sign', auth.authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    const tracking = await DocumentTracking.findById(req.params.documentId);
    if (!tracking) return res.status(404).json({ success: false, message: 'Document not found' });

    const loan = await Loan.findById(tracking.loanId);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });

    if (tracking.isSigned) {
      return res.status(400).json({
        success: false,
        message: 'Document already signed',
        documentTrackingId: tracking._id,
        loanId: tracking.loanId
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Signature image is required' });
    }

    const signedDir = path.join(__dirname, '../../documents');
    fs.ensureDirSync(signedDir);
    const signedPath = path.join(signedDir, `loan_${loan._id}_signed.pdf`);

    await pdfService.signLoanAgreement(tracking.unsignedDocPath, { signatureImagePath: req.file.path }, signedPath);

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
    console.error('Signing failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------- GET /:loanId/status - document status ----------
router.get('/:loanId/status', auth.authenticateToken, async (req, res) => {
  try {
    const tracking = await DocumentTracking.findOne({ loanId: req.params.loanId });
    if (!tracking) {
      return res.json({ exists: false, status: "UNSIGNED", isSigned: false });
    }
    res.json({
      exists: true,
      status: tracking.isSigned ? "SIGNED" : "UNSIGNED",
      isSigned: tracking.isSigned,
      signedAt: tracking.signedAt,
      unsignedUrl: tracking.unsignedDocPath ? `/api/documents/${req.params.loanId}/unsigned` : null,
      signedUrl: tracking.signedDocPath ? `/api/documents/${req.params.loanId}/signed` : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------- GET /:loanId/unsigned - serve unsigned PDF ----------
router.get('/:loanId/unsigned', auth.authenticateToken, async (req, res) => {
  try {
    const tracking = await DocumentTracking.findOne({ loanId: req.params.loanId });
    if (!tracking || !tracking.unsignedDocPath || !fs.existsSync(tracking.unsignedDocPath)) {
      return res.status(404).send('Unsigned document not found');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=loan_${req.params.loanId}.pdf`);
    fs.createReadStream(tracking.unsignedDocPath).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch PDF');
  }
});

// ---------- GET /:loanId/signed - serve signed PDF ----------
router.get('/:loanId/signed', auth.authenticateToken, async (req, res) => {
  try {
    const tracking = await DocumentTracking.findOne({ loanId: req.params.loanId });
    if (!tracking || !tracking.signedDocPath || !fs.existsSync(tracking.signedDocPath)) {
      return res.status(404).send('Signed document not found');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=loan_${req.params.loanId}_signed.pdf`);
    fs.createReadStream(tracking.signedDocPath).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch PDF');
  }
});

// ---------- GET /:loanId/document - legacy URL support ----------
router.get('/:loanId/document', auth.authenticateToken, async (req, res) => {
  try {
    const tracking = await DocumentTracking.findOne({ loanId: req.params.loanId });
    if (!tracking) return res.status(404).send('Document not found');

    const pdfPath = tracking.signedDocPath || tracking.unsignedDocPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) return res.status(404).send('Document file not found');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=loan_${req.params.loanId}.pdf`);
    fs.createReadStream(pdfPath).pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to fetch document');
  }
});

module.exports = router;
