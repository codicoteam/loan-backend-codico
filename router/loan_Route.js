const express = require("express");
const router = express.Router();
const loanService = require("../services/loan_Service");
const { authenticateToken } = require("../middlewares/auth");
const pdfService = require('../services/pdfService');
const fs = require('fs-extra');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPG images are allowed'));
    }
  }
});

// Create a loan
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.createLoan(req.body);
    res.status(201).json({ message: "Loan created successfully", data: loan });
  } catch (error) {
    res.status(400).json({ message: "Failed to create loan", error: error.message });
  }
});

// Get all loans
router.get("/getall", authenticateToken, async (req, res) => {
  try {
    const loans = await loanService.getAllLoans();
    res.status(200).json({ message: "Loans fetched successfully", data: loans });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch loans", error: error.message });
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

// Get loan by ID
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
    res.status(400).json({ message: "Failed to update loan", error: error.message });
  }
});

// Delete a loan
router.delete("/delete/:id", authenticateToken, async (req, res) => {
  try {
    await loanService.deleteLoan(req.params.id);
    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete loan", error: error.message });
  }
});

// Generate loan agreement PDF
router.post('/:id/generate-agreement', authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    const user = req.user;
    const pdfPath = await pdfService.generateLoanAgreement(loan, user);
    
    res.json({
      success: true,
      message: 'PDF generated successfully',
      pdfUrl: `/loans/${loan._id}/document`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Download loan agreement
router.get("/:id/download-agreement", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    const user = req.user;
    const pdfPath = await pdfService.generateLoanAgreement(loan, user);
    
    res.download(pdfPath, `loan_agreement_${req.params.id}.pdf`, async (err) => {
      if (err) {
        console.error("Error sending PDF:", err);
      }
      try {
        await fs.remove(pdfPath);
      } catch (unlinkErr) {
        console.error("Error deleting temp PDF:", unlinkErr);
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to generate loan agreement", 
      error: error.message 
    });
  }
});

// Get signed PDF agreement
router.get("/:id/agreement", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    if (!loan.agreementPdf) {
      return res.status(404).json({ message: "No agreement PDF found for this loan" });
    }
    
    res.download(loan.agreementPdf, `signed_loan_agreement_${req.params.id}.pdf`);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to retrieve loan agreement", 
      error: error.message 
    });
  }
});

// Upload signature image
router.post('/upload-signature', authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    await fs.ensureDir('uploads/signatures');

    res.json({
      success: true,
      message: 'Signature uploaded successfully',
      signaturePath: req.file.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Sign existing PDF
router.post('/:id/sign', authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    const user = req.user;

    const pdfPath = path.join(__dirname, '../temp', `loan_${loan._id}.pdf`);
    if (!await fs.pathExists(pdfPath)) {
      await pdfService.generateLoanAgreement(loan, user);
    }

    const signedPath = await pdfService.signLoanAgreement(
      pdfPath,
      {
        name: `${user.firstName} ${user.lastName}`,
        title: req.body.title || 'Borrower',
        signatureImagePath: req.body.signatureImagePath
      },
      {
        x: req.body.x || 50,
        y: req.body.y || 100
      }
    );

    const updatedLoan = await loanService.updateLoan(loan._id, { 
      agreementPdf: signedPath,
      signedAt: new Date(),
      signedBy: user._id
    });

    res.json({
      success: true,
      message: 'PDF signed successfully',
      signedPdfUrl: `/loans/${loan._id}/agreement`,
      loan: updatedLoan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;