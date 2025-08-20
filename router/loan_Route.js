const express = require("express");
const router = express.Router();
const loanService = require("../services/loan_Service");
const { authenticateToken } = require("../middlewares/auth");
const pdfService = require('../services/pdfService');
const fs = require('fs-extra');
const multer = require('multer');
const path = require('path');
const User = require('../models/user_model'); // Add this import

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/signatures/';
    fs.mkdirsSync(dir); // Ensure directory exists
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG/JPEG images allowed'), false);
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

// Generate loan agreement PDF - FIXED VERSION
router.post('/:id/generate-agreement', authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    // Get user data properly (not just from req.user which might be limited)
    const user = await User.findById(loan.user || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Use the same pdfService method that works in documentRoutes
    const pdfPath = await pdfService.generateLoanAgreement(loan, user);

    // Stream the PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=loan_${loan._id}.pdf`);
    fs.createReadStream(pdfPath).pipe(res);

  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF"
    });
  }
});

// Download loan agreement - FIXED VERSION
router.get("/:id/download-agreement", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    const user = await User.findById(loan.user || req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    console.log('Signature uploaded to:', req.file.path);
    res.json({ 
      success: true,
      signaturePath: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Remove duplicate upload route
// router.post('/upload-signature', authenticateToken, upload.single('signature'), async (req, res) => {
//   // This is a duplicate - remove it
// });

// Serve the generated PDF
router.get("/:id/document", authenticateToken, async (req, res) => {
  try {
    const loanId = req.params.id;
    const pdfPath = path.join(__dirname, '../temp', `loan_${loanId}.pdf`);
    
    if (!await fs.pathExists(pdfPath)) {
      // Generate it on the fly if it doesn't exist
      const loan = await loanService.getLoanById(loanId);
      const user = await User.findById(loan.user || req.user.id);
      await pdfService.generateLoanAgreement(loan, user);
    }

    // Stream the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=loan_${loanId}.pdf`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sign PDF route - FIXED VERSION
router.post('/:id/sign', authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    const user = await User.findById(loan.user || req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate the PDF using the proper service method
    const pdfPath = await pdfService.generateLoanAgreement(loan, user);

    // Prepare signer data
    const signer = {
      name: `${user.firstName} ${user.lastName}`,
      title: req.body.title || 'Borrower',
      signatureImagePath: req.file ? req.file.path : null,
      options: {
        x: 120, // Match coordinates from documentRoutes
        y: 100,
        width: 300,
        height: 150
      }
    };

    // Sign the PDF
    const signedPath = path.join(__dirname, '../temp', `loan_${loan._id}_signed.pdf`);
    await pdfService.signLoanAgreement(pdfPath, signer, signedPath);

    // Update database
    const relativePath = `temp/loan_${loan._id}_signed.pdf`;
    await loanService.updateLoan(loan._id, { 
      agreementPdf: relativePath,
      signedAt: new Date(),
      signedBy: user._id
    });

    res.json({ 
      success: true,
      message: 'PDF signed successfully',
      pdfUrl: `/api/v1/loan_route/${loan._id}/agreement`
    });

  } catch (error) {
    console.error('Signing failed:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

module.exports = router;