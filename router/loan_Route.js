const express = require("express");
const router = express.Router();
const loanService = require("../services/loan_Service");
const { authenticateToken } = require("../middlewares/auth");
const pdfService = require('../services/pdfService');
const fs = require('fs-extra');
const multer = require('multer');
const path = require('path');
const User = require('../models/user_model');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/signatures/';
    fs.mkdirsSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
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

// Generate loan agreement PDF
router.post('/:id/generate-agreement', authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    const user = await User.findById(loan.user || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const pdfPath = await pdfService.generateLoanAgreement(loan, user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=loan_${loan._id}.pdf`);
    
    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);
    
    readStream.on('close', async () => {
      try {
        await fs.remove(pdfPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp PDF:', cleanupError);
      }
    });

  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
});

// GET endpoint to generate PDF
router.get("/:id/generate", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    const user = await User.findById(loan.user || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const pdfPath = await pdfService.generateLoanAgreement(loan, user);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=loan_${loan._id}.pdf`);
    
    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);
    
    readStream.on('close', async () => {
      try {
        await fs.remove(pdfPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp PDF:', cleanupError);
      }
    });

  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
});

// Download loan agreement
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
        console.error('Error deleting temp PDF:', unlinkErr);
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to generate loan agreement", 
      error: error.message 
    });
  }
});

// Get signed PDF agreement - FIXED to work with documentRoutes.js signing
router.get("/:id/agreement", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    if (!loan.agreementPdf) {
      return res.status(404).json({ message: "No agreement PDF found for this loan" });
    }
    
    // ✅ Handle the relative path stored by documentRoutes.js
    let fullPath;
    if (loan.agreementPdf.startsWith('temp/')) {
      fullPath = path.join(__dirname, '../', loan.agreementPdf);
    } else {
      fullPath = loan.agreementPdf;
    }
    
    console.log(`🔍 Looking for signed PDF at: ${fullPath}`);
    
    if (!await fs.pathExists(fullPath)) {
      console.error(`❌ Signed PDF not found at: ${fullPath}`);
      
      // ✅ Try to find the PDF in documents folder (documentRoutes.js fallback)
      const documentsPath = path.join(__dirname, '../documents', `loan_${loan._id}_signed.pdf`);
      console.log(`🔍 Trying alternative path: ${documentsPath}`);
      
      if (await fs.pathExists(documentsPath)) {
        fullPath = documentsPath;
        console.log('✅ Found signed PDF in documents folder');
      } else {
        return res.status(404).json({ 
          message: "Signed PDF file not found",
          details: `Checked: ${fullPath}`
        });
      }
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=signed_loan_agreement_${req.params.id}.pdf`);
    fs.createReadStream(fullPath).pipe(res);
    
  } catch (error) {
    console.error('Error retrieving signed agreement:', error);
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

// Serve generated PDF
router.get("/:id/document", authenticateToken, async (req, res) => {
  try {
    const loan = await loanService.getLoanById(req.params.id);
    const user = await User.findById(loan.user || req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pdfPath = await pdfService.generateLoanAgreement(loan, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=loan_${req.params.id}.pdf`);
    
    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);
    
    readStream.on('close', async () => {
      try {
        await fs.remove(pdfPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp PDF:', cleanupError);
      }
    });

  } catch (error) {
    console.error('PDF serving error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ COMMENT OUT the signing route to avoid conflicts with documentRoutes.js
/*
router.post('/:id/sign', authenticateToken, upload.single('signature'), async (req, res) => {
  // This route is disabled to avoid conflicts
  res.status(400).json({ 
    success: false, 
    message: 'Use /api/documents/:documentId/sign for signing' 
  });
});
*/

// Debug endpoint to check logo
router.get("/debug/logo", authenticateToken, async (req, res) => {
  try {
    const logoPath = await pdfService.checkLogoExists();
    
    if (logoPath) {
      const exists = await fs.pathExists(logoPath);
      const logoSize = exists ? (await fs.stat(logoPath)).size : 0;
      
      res.json({
        success: true,
        message: "Logo found",
        path: logoPath,
        exists: exists,
        size: logoSize,
        directory: __dirname,
        workingDir: process.cwd()
      });
    } else {
      res.json({
        success: false,
        message: "Logo not found. Place logo.jpg in services/assets/ folder"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check lender signature
router.get("/debug/lender-signature", authenticateToken, async (req, res) => {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'screenshot3.png'),
      path.join(__dirname, '../screenshot3.png'),
      path.join(process.cwd(), 'assets', 'screenshot3.png'),
      'C:/Users/DELL/loan-backend/screenshot3.png'
    ];
    
    let foundPath = null;
    for (const filePath of possiblePaths) {
      if (await fs.pathExists(filePath)) {
        foundPath = filePath;
        break;
      }
    }
    
    if (foundPath) {
      const fileStats = await fs.stat(foundPath);
      res.json({ 
        success: true, 
        message: `Lender signature found at: ${foundPath}`,
        path: foundPath,
        size: fileStats.size,
        exists: true
      });
    } else {
      res.json({ 
        success: false, 
        message: 'screenshot3.png not found. Place it in project root.',
        searchedPaths: possiblePaths
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug endpoint to check temp directory
router.get("/debug/temp-directory", authenticateToken, async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '../temp');
    const exists = await fs.pathExists(tempDir);
    
    if (exists) {
      const stats = await fs.stat(tempDir);
      const files = await fs.readdir(tempDir);
      
      res.json({
        success: true,
        message: "Temp directory exists",
        path: tempDir,
        isDirectory: stats.isDirectory(),
        fileCount: files.length,
        files: files
      });
    } else {
      res.json({
        success: false,
        message: 'Temp directory does not exist',
        path: tempDir
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;