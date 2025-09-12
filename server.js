require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbUrl = "mongodb+srv://pockettloan:pockettloan12345@pocket.sbssyen.mongodb.net/?retryWrites=true&w=majority&appName=pocket";

mongoose.connect(dbUrl)
.then(() => console.log("Database connected successfully"))
.catch((err) => console.error("Error connecting to the database:", err));

// Ensure all necessary directories exist
fs.ensureDirSync(path.join(__dirname, 'documents'));
fs.ensureDirSync(path.join(__dirname, 'uploads/signatures'));
fs.ensureDirSync(path.join(__dirname, 'temp'));
fs.ensureDirSync(path.join(__dirname, 'temp/signatures'));
fs.ensureDirSync(path.join(__dirname, 'assets'));

// Configure multer for signature uploads
const signatureStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const signaturesDir = path.join(__dirname, 'temp', 'signatures');
    await fs.ensureDir(signaturesDir);
    cb(null, signaturesDir);
  },
  filename: (req, file, cb) => {
    // Use a temporary name first, we'll rename it later
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `temp_signature_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: signatureStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Import PDF service
const pdfService = require('./services/pdfService');

// ===== SIGNATURE ENDPOINTS (ADD THESE BEFORE ROUTERS) =====

// Upload signature for a specific document - FIXED VERSION
app.post('/api/upload-signature/:documentId', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No signature file provided' });
    }

    const documentId = req.params.documentId;
    console.log(`Uploading signature for document: ${documentId}`);
    console.log(`Temp file path: ${req.file.path}`);

    // Wait a moment to ensure file is fully written
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the file exists before proceeding
    if (!await fs.pathExists(req.file.path)) {
      console.error('File does not exist at path:', req.file.path);
      return res.status(500).json({ error: 'Uploaded file was not saved correctly' });
    }

    // Get file stats to verify it's there
    let stats;
    try {
      stats = await fs.stat(req.file.path);
      console.log(`File size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        console.error('File is empty (0 bytes)');
        await fs.remove(req.file.path);
        return res.status(500).json({ error: 'Uploaded file is empty' });
      }
    } catch (statError) {
      console.error('Error getting file stats:', statError);
      await fs.remove(req.file.path);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }

    // Create the new path for the signature
    const signaturesDir = path.join(__dirname, 'temp', 'signatures');
    await fs.ensureDir(signaturesDir);
    
    const ext = path.extname(req.file.originalname);
    const newPath = path.join(signaturesDir, `borrower_signature_${documentId}${ext}`);
    console.log(`New path: ${newPath}`);

    // Remove any existing signature for this document
    try {
      const existingSignatures = await fs.readdir(signaturesDir);
      for (const file of existingSignatures) {
        if (file.startsWith(`borrower_signature_${documentId}`)) {
          const oldPath = path.join(signaturesDir, file);
          console.log(`Removing old signature: ${oldPath}`);
          await fs.remove(oldPath);
        }
      }
    } catch (error) {
      console.log('No existing signatures to remove or error removing:', error.message);
    }

    // Use readFile + writeFile instead of copy for better reliability
    try {
      const fileData = await fs.readFile(req.file.path);
      await fs.writeFile(newPath, fileData);
      console.log(`File written to: ${newPath}`);
      
      // Remove the temporary file
      await fs.remove(req.file.path);
      console.log('Temp file removed');
    } catch (copyError) {
      console.error('Error copying file:', copyError);
      await fs.remove(req.file.path);
      return res.status(500).json({ error: 'Failed to save signature file' });
    }

    // Verify the new file exists
    if (!await fs.pathExists(newPath)) {
      return res.status(500).json({ error: 'Failed to save signature file' });
    }

    // Verify the new file has content
    const newStats = await fs.stat(newPath);
    if (newStats.size === 0) {
      await fs.remove(newPath);
      return res.status(500).json({ error: 'Saved signature file is empty' });
    }

    console.log(`Signature successfully saved: ${newPath}, size: ${newStats.size} bytes`);

    res.json({ 
      success: true, 
      message: 'Signature uploaded successfully',
      signaturePath: newPath,
      documentId: documentId
    });

  } catch (error) {
    console.error('Error uploading signature:', error);
    
    // Clean up uploaded file in case of error
    if (req.file && await fs.pathExists(req.file.path)) {
      try {
        await fs.remove(req.file.path);
      } catch (removeError) {
        console.error('Error removing temp file:', removeError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to upload signature: ' + error.message,
      details: 'Check server logs for more information'
    });
  }
});

// Sign agreement with uploaded signature for a specific document
app.post('/api/sign-document/:documentId', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    console.log(`Signing document: ${documentId}`);

    // Find the original PDF - it's in the documents directory based on your debug output
    let pdfPath = path.join(__dirname, 'documents', `loan_agreement_${documentId}.pdf`);
    if (!await fs.pathExists(pdfPath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found',
        details: `Checked path: ${pdfPath}`
      });
    }

    console.log(`Found PDF at: ${pdfPath}`);

    // Check if borrower signature exists
    const signaturesDir = path.join(__dirname, 'temp', 'signatures');
    let borrowerSignaturePath = null;
    
    if (await fs.pathExists(signaturesDir)) {
      const files = await fs.readdir(signaturesDir);
      console.log(`Files in signatures directory: ${files.join(', ')}`);
      
      const signatureFile = files.find(file => file.startsWith(`borrower_signature_${documentId}`));
      if (signatureFile) {
        borrowerSignaturePath = path.join(signaturesDir, signatureFile);
        console.log(`Found signature: ${borrowerSignaturePath}`);
      }
    }

    if (!borrowerSignaturePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'No signature found for this document. Please upload a signature first.' 
      });
    }

    // Generate output path for signed PDF (in temp directory)
    const outputPath = path.join(__dirname, 'temp', `loan_agreement_${documentId}_signed.pdf`);
    console.log(`Output path: ${outputPath}`);

    // Sign the PDF with the borrower's signature
    await pdfService.signLoanAgreement(
      pdfPath, 
      { signatureImagePath: borrowerSignaturePath }, 
      outputPath
    );

    // Verify the signed PDF was created
    if (!await fs.pathExists(outputPath)) {
      return res.status(500).json({ 
        success: false, 
        message: 'PDF signing completed but output file was not created' 
      });
    }

    // Return the URL to download the signed PDF
    res.json({ 
      success: true, 
      message: 'PDF signed successfully',
      signedDocumentUrl: `/api/v1/loan_route/${documentId}/agreement`
    });

  } catch (error) {
    console.error('Error signing agreement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sign agreement: ' + error.message 
    });
  }
});

// Check if a signature exists for a document
app.get('/api/check-signature/:documentId', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const signaturesDir = path.join(__dirname, 'temp', 'signatures');
    
    let signatureExists = false;
    let signaturePath = null;
    
    if (await fs.pathExists(signaturesDir)) {
      const files = await fs.readdir(signaturesDir);
      const signatureFile = files.find(file => file.startsWith(`borrower_signature_${documentId}`));
      
      if (signatureFile) {
        signatureExists = true;
        signaturePath = path.join(signaturesDir, signatureFile);
        
        // Get file info
        const stats = await fs.stat(signaturePath);
        res.json({
          exists: true,
          path: signaturePath,
          size: stats.size,
          modified: stats.mtime,
          message: 'Signature found for this document'
        });
        return;
      }
    }
    
    res.json({
      exists: false,
      message: 'No signature found for this document'
    });

  } catch (error) {
    console.error('Error checking signature:', error);
    res.status(500).json({ error: 'Failed to check signature: ' + error.message });
  }
});

// Debug endpoint for signatures directory
app.get('/api/debug-signatures', async (req, res) => {
  try {
    const signaturesDir = path.join(__dirname, 'temp', 'signatures');
    
    if (!await fs.pathExists(signaturesDir)) {
      return res.json({ 
        exists: false, 
        message: 'Signatures directory does not exist',
        path: signaturesDir
      });
    }

    const files = await fs.readdir(signaturesDir);
    const fileDetails = [];
    
    for (const file of files) {
      const filePath = path.join(signaturesDir, file);
      try {
        const stats = await fs.stat(filePath);
        fileDetails.push({
          name: file,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        });
      } catch (error) {
        fileDetails.push({
          name: file,
          error: error.message,
          path: filePath
        });
      }
    }
    
    res.json({ 
      exists: true,
      path: signaturesDir,
      files: fileDetails,
      message: `Found ${fileDetails.length} files in signatures directory`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test upload endpoint
app.post('/api/test-upload', upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Test upload successful');
    console.log('File details:', {
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Verify file exists
    const exists = await fs.pathExists(req.file.path);
    console.log('File exists:', exists);

    if (exists) {
      const stats = await fs.stat(req.file.path);
      console.log('File stats:', stats);
      
      // Clean up
      await fs.remove(req.file.path);
    }

    res.json({ 
      success: true, 
      message: 'Test upload successful',
      file: {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        exists: exists
      }
    });

  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ error: 'Test failed: ' + error.message });
  }
});

// Debug endpoint to see all files in directories
app.get('/api/debug-files', async (req, res) => {
  try {
    const tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
    
    const files = await fs.readdir(tempDir);
    const fileDetails = [];
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      fileDetails.push({
        name: file,
        size: stats.size,
        modified: stats.mtime
      });
    }
    
    // Check signatures directory
    const signaturesDir = path.join(tempDir, 'signatures');
    let signatureFiles = [];
    if (await fs.pathExists(signaturesDir)) {
      const sigFiles = await fs.readdir(signaturesDir);
      for (const file of sigFiles) {
        const filePath = path.join(signaturesDir, file);
        const stats = await fs.stat(filePath);
        signatureFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }

    // Check documents directory
    const documentsDir = path.join(__dirname, 'documents');
    let documentFiles = [];
    if (await fs.pathExists(documentsDir)) {
      const docFiles = await fs.readdir(documentsDir);
      for (const file of docFiles) {
        const filePath = path.join(documentsDir, file);
        const stats = await fs.stat(filePath);
        documentFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    res.json({ 
      tempFiles: fileDetails,
      signatureFiles: signatureFiles,
      documentFiles: documentFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTER IMPORTS (AFTER SIGNATURE ENDPOINTS) =====

// Import routers
const adminRouter = require("./router/admin_Route");
const userRouter = require("./router/user_Route");
const loanRouter = require("./router/loan_Route");
const paymentRouter = require("./router/payment_Route");
const kycRouter = require("./router/kyc_Route");
const notificationRouter = require("./router/notification_Route");
const documentRoutes = require('./router/documentRoutes');

// Use routers
app.use("/api/v1/admin_route", adminRouter);
app.use("/api/v1/user_route", userRouter);
app.use("/api/v1/loan_route", loanRouter);
app.use("/api/v1/payment_route", paymentRouter);
app.use("/api/v1/kyc_route", kycRouter);
app.use("/api/v1/notification_route", notificationRouter);
app.use('/api/documents', documentRoutes);

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the signature page
app.get('/sign-agreement', (req, res) => {
  const loanId = req.query.loanId;
  if (!loanId) {
    return res.status(400).send('Loan ID is required. Add ?loanId=YOUR_LOAN_ID to the URL.');
  }
  
  res.sendFile(path.join(__dirname, 'public', 'signature.html'));
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

const port = 5050;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`PDF signature endpoints available:`);
  console.log(`  POST /api/upload-signature/:documentId - Upload signature for document`);
  console.log(`  POST /api/sign-document/:documentId - Sign document with uploaded signature`);
  console.log(`  GET /api/check-signature/:documentId - Check if signature exists`);
  console.log(`  GET /api/debug-signatures - Debug signatures directory`);
  console.log(`  POST /api/test-upload - Test file upload functionality`);
  console.log(`  GET /api/debug-files - Debug files in directories`);
});