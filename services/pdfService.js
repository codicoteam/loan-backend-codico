const fs = require('fs-extra');
const path = require('path');
const PdfPrinter = require('pdfmake');
const { PDFDocument, rgb } = require('pdf-lib');

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);
const tempDir = path.join(__dirname, '../temp');
const assetsDir = path.join(__dirname, 'assets');

// 🎨 LOGO-MATCHING COLORS - Orange to Yellow Gradient Theme
const PDF_COLORS = {
  primary: '#FF6B35',        // Vibrant orange (main brand color)
  secondary: '#FF8C42',      // Medium orange
  accent: '#FFF8F0',         // Very light cream/orange tint
  text: '#2D1810',           // Deep brown (warm dark)
  textLight: '#8B4513',      // Warm brown
  textMuted: '#CD853F',      // Peru/tan color
  border: '#FFE4B5',         // Moccasin (light orange-yellow)
  highlight: '#FFD700',      // Gold (matching logo yellow)
  gradient: '#FFA500',       // Orange accent
  warm: '#FFEB3B'            // Bright yellow (logo gradient end)
};

async function ensureTempDir() {
  await fs.ensureDir(tempDir);
}

async function ensureAssetsDir() {
  await fs.ensureDir(assetsDir);
}

// ✅ Function to copy loan.jpg to services/assets and remove old logo files
async function setupLogo() {
  try {
    await ensureAssetsDir();
    
    const sourceLoanPath = 'C:\\Users\\DELL\\Documents\\loan.jpg';
    const targetLoanPath = path.join(assetsDir, 'loan.jpg');
    
    // Remove existing logo files
    const oldLogoFiles = [
      path.join(assetsDir, 'logo.jpg'),
      path.join(assetsDir, 'logo.png'),
      path.join(process.cwd(), 'assets', 'logo.jpg'),
      path.join(process.cwd(), 'assets', 'logo.png'),
      path.join(__dirname, '../assets', 'logo.jpg'),
      path.join(__dirname, '../assets', 'logo.png')
    ];
    
    for (const oldLogoPath of oldLogoFiles) {
      if (await fs.pathExists(oldLogoPath)) {
        await fs.remove(oldLogoPath);
        console.log(`🗑  Removed old logo file: ${oldLogoPath}`);
      }
    }
    
    // Copy loan.jpg to services/assets if it exists in Documents
    if (await fs.pathExists(sourceLoanPath)) {
      await fs.copy(sourceLoanPath, targetLoanPath);
      console.log(`✅ Copied loan.jpg from Documents to: ${targetLoanPath}`);
      return targetLoanPath;
    } else {
      console.log('ℹ  loan.jpg not found in Documents folder');
      return null;
    }
    
  } catch (error) {
    console.error('Error setting up logo:', error.message);
    return null;
  }
}

// ✅ Improved getBase64Image function
async function getBase64Image(filePath) {
  try {
    if (await fs.pathExists(filePath)) {
      const imageBytes = await fs.readFile(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      
      const validFormats = ['jpg', 'jpeg', 'png'];
      if (!validFormats.includes(ext)) {
        console.warn(`Unsupported image format: ${ext}`);
        return null;
      }
      
      return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${imageBytes.toString('base64')}`;
    }
  } catch (error) {
    console.error('Error reading image file:', error.message);
  }
  return null;
}

// ✅ Get logo path - NOW ONLY looks for loan.jpg in services/assets
async function getLogoPath() {
  const possibleLogoPaths = [
    // Primary location - services/assets/loan.jpg
    path.join(assetsDir, 'loan.jpg'),
    
    // Fallback location - original Documents folder
    'C:\\Users\\DELL\\Documents\\loan.jpg'
  ];

  for (const logoPath of possibleLogoPaths) {
    if (await fs.pathExists(logoPath)) {
      console.log(`✅ Logo found at: ${logoPath}`);
      return logoPath;
    }
  }
  
  console.error('❌ loan.jpg not found in any location');
  console.error('Please place loan.jpg in services/assets/ folder');
  return null;
}

// ✅ Get lender signature path
async function getLenderSignaturePath() {
  const possibleLenderSignaturePaths = [
    // Primary location - signature5.jpg in project assets
    path.join(assetsDir, 'signature5.jpg'),
    
    // Original screenshot3.png locations (as fallbacks)
    path.join(process.cwd(), 'screenshot3.png'),
    path.join(__dirname, '../screenshot3.png'),
    path.join(process.cwd(), 'assets', 'screenshot3.png'),
    path.join(process.cwd(), 'assets', 'signatures', 'screenshot3.png'),
    'C:/Users/DELL/loan-backend/screenshot3.png',
    
    // signature5.jpg in other possible locations
    path.join(process.cwd(), 'signature5.jpg'),
    path.join(__dirname, '../signature5.jpg'),
    path.join(process.cwd(), 'assets', 'signature5.jpg'),
    
    // Original Screenshots folder as last resort
    'C:/Users/DELL/Pictures/Screenshots/signature5.jpg'
  ];

  for (const lenderPath of possibleLenderSignaturePaths) {
    if (await fs.pathExists(lenderPath)) {
      console.log(`✅ Lender signature found: ${lenderPath}`);
      return lenderPath;
    }
  }
  
  console.log('ℹ  Lender signature not found. Please place signature5.jpg in services/assets/ folder');
  return null;
}

// ✅ Check lender signature on server start
async function checkLenderSignature() {
  const lenderSignaturePath = await getLenderSignaturePath();
  
  if (lenderSignaturePath) {
    const stats = await fs.stat(lenderSignaturePath);
    console.log(`✅ Lender signature ready: ${lenderSignaturePath}`);
    console.log(`   Size: ${stats.size} bytes`);
    return true;
  } else {
    console.log('❌ Lender signature not found. Please place screenshot3.png in project root');
    return false;
  }
}

// Setup logo and check signature when server starts
async function initializePdfService() {
  console.log('🔄 Initializing PDF service...');
  await setupLogo();
  await checkLenderSignature();
  console.log('✅ PDF service initialized');
}

// Initialize when this module is loaded
initializePdfService();

const pdfService = {
  generateLoanAgreement: async (loan, user) => {
    try {
      await ensureTempDir();
      const today = new Date().toLocaleDateString();

      // ✅ Get Base64 logo
      const logoPath = await getLogoPath();
      const base64Logo = logoPath ? await getBase64Image(logoPath) : null;

      // ✅ Get lender signature for ALL PDFs
      const lenderSignaturePath = await getLenderSignaturePath();
      const base64LenderSignature = lenderSignaturePath ? await getBase64Image(lenderSignaturePath) : null;

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [50, 80, 50, 60],
        
        content: [
          // ✅ Header section with logo on left and title on right
          {
            columns: [
              // Logo on left - smaller size
              ...(base64Logo
                ? [{
                    image: base64Logo,
                    width: 120,
                    height: 60,
                    margin: [0, 0, 0, 0]
                  }]
                : [
                    {
                      text: '⚠ LOGO FILE NOT FOUND',
                      style: 'errorMessage',
                      margin: [0, 0, 0, 0]
                    }
                  ]),
              
              // Spacer
              { width: '*', text: '' },
              
              // Title on right
              {
                stack: [
                  { text: 'LOAN AGREEMENT', style: 'header' },
                  { text: `Date: ${today}`, style: 'subheader' }
                ],
                alignment: 'right',
                margin: [0, 0, 0, 0]
              }
            ],
            margin: [0, 0, 0, 30]
          },

          // Error message if logo not found
          ...(!base64Logo ? [
            {
              text: 'Please place loan.jpg in services/assets/ folder',
              style: 'errorSubmessage',
              alignment: 'center',
              margin: [0, 0, 0, 20]
            }
          ] : []),

          { text: 'LENDER', style: 'sectionHeader' },
          { 
            text: [
              { text: 'Company: ', style: 'labelText' },
              { text: 'Clear Finance\n', style: 'valueText' },
              { text: 'Address: ', style: 'labelText' },
              { text: '123 Financial District, Business City, BC 10001\n', style: 'valueText' },
              { text: 'Contact: ', style: 'labelText' },
              { text: 'info@clearfinance.com | +1 (555) 123-4567', style: 'valueText' }
            ],
            margin: [0, 0, 0, 15],
            background: PDF_COLORS.accent,
            fillColor: PDF_COLORS.accent
          },

          { text: 'BORROWER', style: 'sectionHeader' },
          { 
            text: [
              { text: 'Name: ', style: 'labelText' },
              { text: `${user.firstName} ${user.lastName}\n`, style: 'valueTextImportant' },
              { text: 'Email: ', style: 'labelText' },
              { text: `${user.email || 'N/A'}\n`, style: 'valueText' },
              { text: 'Phone: ', style: 'labelText' },
              { text: `${user.phone || 'N/A'}\n`, style: 'valueText' },
              { text: 'Address: ', style: 'labelText' },
              { text: `${user.address || 'Address not provided'}`, style: 'valueText' }
            ],
            margin: [0, 0, 0, 15],
            background: PDF_COLORS.accent,
            fillColor: PDF_COLORS.accent
          },

          { text: 'LOAN DETAILS', style: 'sectionHeader' },
          {
            table: {
              widths: ['40%', '60%'],
              body: [
                [
                  { text: 'Principal Amount:', style: 'tableLabel', border: [false, false, false, false] },
                  { text: `$${Number(loan.amount).toLocaleString()} USD`, style: 'tableValueImportant', border: [false, false, false, false] }
                ],
                [
                  { text: 'Loan Term:', style: 'tableLabel', border: [false, false, false, false] },
                  { text: `${loan.term} months`, style: 'tableValue', border: [false, false, false, false] }
                ],
                [
                  { text: 'Annual Interest Rate:', style: 'tableLabel', border: [false, false, false, false] },
                  { text: `${loan.interestRate}% per annum`, style: 'tableValue', border: [false, false, false, false] }
                ],
                [
                  { text: 'Monthly Payment:', style: 'tableLabel', border: [false, false, false, false] },
                  { text: `$${Math.round(loan.amount * (loan.interestRate/100/12) / (1 - Math.pow(1 + loan.interestRate/100/12, -loan.term))).toLocaleString()} USD`, style: 'tableValueImportant', border: [false, false, false, false] }
                ],
                [
                  { text: 'Total Repayment:', style: 'tableLabel', border: [false, false, false, false] },
                  { text: `$${Math.round(loan.amount * (loan.interestRate/100/12) * loan.term / (1 - Math.pow(1 + loan.interestRate/100/12, -loan.term))).toLocaleString()} USD`, style: 'tableValueImportant', border: [false, false, false, false] }
                ],
                [
                  { text: 'Payment Schedule:', style: 'tableLabel', border: [false, false, false, false] },
                  { text: 'Monthly installments, due on the 1st of each month', style: 'tableValue', border: [false, false, false, false] }
                ]
              ]
            },
            margin: [0, 0, 0, 20]
          },

          // Removed "TERMS AND CONDITIONS" title and kept the content
          { text: 'BORROWER OBLIGATIONS', style: 'subsectionHeader' },
          { 
            text: [
              '1. The Borrower agrees to repay the Loan in full according to the repayment schedule.\n',
              '2. Payments must be made on or before the due date each month.\n',
              '3. Late payments may incur a fee of $25 or 5% of the payment amount, whichever is greater.\n',
              '4. The Borrower must notify the Lender of any change in contact information within 14 days.'
            ],
            style: 'termsText',
            margin: [0, 0, 0, 15]
          },
          
          { text: 'DEFAULT PROVISIONS', style: 'subsectionHeader' },
          { 
            text: [
              '1. Failure to make payments for 30 days or more constitutes default.\n',
              '2. In event of default, the Lender may demand immediate repayment of the outstanding balance.\n',
              '3. The Lender reserves the right to take legal action to recover the debt.\n',
              '4. Default may result in additional collection fees and legal costs.'
            ],
            style: 'termsText',
            margin: [0, 0, 0, 15]
          },
          
          { text: 'GOVERNING LAW', style: 'subsectionHeader' },
          { 
            text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Business City. Any disputes arising from this agreement shall be resolved through arbitration in Business City, BC.',
            style: 'termsText',
            margin: [0, 0, 0, 30]
          },

          // ✅ SIGNATURE SECTION AT THE BOTTOM - WITH LENDER SIGNATURE IN ALL PDFs
          {
            columns: [
              {
                width: '45%',
                stack: [
                  { text: 'LENDER', style: 'signatureLabel' },
                  
                  // ✅ LENDER SIGNATURE IMAGE (ALWAYS INCLUDED)
                  ...(base64LenderSignature
                    ? [{
                        image: base64LenderSignature,
                        width: 120,
                        height: 60,
                        alignment: 'center',
                        margin: [0, 5, 0, 5]
                      }]
                    : [
                        { text: '', alignment: 'center', style: 'signatureLine' }
                      ]),
                  
                  { text: 'Authorized Representative', alignment: 'center', style: 'signatureTitle' },
                  { text: 'Clear Finance', alignment: 'center', style: 'companyName' },
                  { text: 'Date: __________________', alignment: 'center', style: 'dateField' }
                ]
              },
              { width: '10%', text: '' },
              {
                width: '45%',
                stack: [
                  { text: 'BORROWER', style: 'signatureLabel' },
                  { text: '', alignment: 'center', style: 'signatureLine' },
                  { text: `${user.firstName} ${user.lastName}`, alignment: 'center', style: 'borrowerName' },
                  { text: 'Date: __________________', alignment: 'center', style: 'dateField' }
                ]
              }
            ],
            margin: [0, 40, 0, 20]
          },
          
          {
            text: [
              { text: 'Agreement ID: ', style: 'footerLabel' },
              { text: `${loan._id || 'N/A'}`, style: 'footerValue' },
              { text: ' | Generated: ', style: 'footerLabel' },
              { text: new Date().toLocaleDateString(), style: 'footerValue' }
            ],
            alignment: 'center',
            margin: [0, 20, 0, 10]
          },
          {
            text: 'This document was generated by Clear Finance',
            alignment: 'center',
            style: 'footerCompany',
            margin: [0, 0, 0, 10]
          }
        ],
        
        // 🎨 LOGO-MATCHING STYLES - Orange to Yellow Gradient Theme
        styles: {
          errorMessage: {
            fontSize: 12,
            color: PDF_COLORS.primary,
            bold: true
          },
          errorSubmessage: {
            fontSize: 10,
            color: PDF_COLORS.secondary,
            italics: true
          },
          header: { 
            fontSize: 22, 
            bold: true, 
            margin: [0, 0, 0, 0],
            color: PDF_COLORS.primary
          },
          subheader: { 
            fontSize: 14, 
            margin: [0, 5, 0, 0],
            color: PDF_COLORS.textLight
          },
          sectionHeader: { 
            fontSize: 16, 
            bold: true, 
            margin: [0, 20, 0, 12],
            color: PDF_COLORS.primary
          },
          subsectionHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 12, 0, 8],
            color: PDF_COLORS.secondary
          },
          labelText: {
            fontSize: 11,
            bold: true,
            color: PDF_COLORS.textLight
          },
          valueText: {
            fontSize: 11,
            color: PDF_COLORS.text
          },
          valueTextImportant: {
            fontSize: 11,
            bold: true,
            color: PDF_COLORS.primary
          },
          termsText: {
            fontSize: 10,
            lineHeight: 1.2,
            color: PDF_COLORS.text
          },
          tableLabel: {
            fontSize: 11,
            bold: true,
            color: PDF_COLORS.secondary
          },
          tableValue: {
            fontSize: 11,
            color: PDF_COLORS.text
          },
          tableValueImportant: {
            fontSize: 11,
            bold: true,
            color: PDF_COLORS.highlight
          },
          signatureLabel: {
            fontSize: 14,
            bold: true,
            alignment: 'center',
            color: PDF_COLORS.secondary,
            margin: [0, 0, 0, 5]
          },
          signatureLine: {
            fontSize: 12,
            bold: true,
            color: PDF_COLORS.textMuted,
            margin: [0, 0, 0, 5]
          },
          signatureTitle: {
            fontSize: 10,
            color: PDF_COLORS.textLight,
            margin: [0, 0, 0, 5]
          },
          companyName: {
            fontSize: 10,
            bold: true,
            color: PDF_COLORS.primary,
            margin: [0, 0, 0, 5]
          },
          borrowerName: {
            fontSize: 10,
            bold: true,
            color: PDF_COLORS.secondary,
            margin: [0, 0, 0, 5]
          },
          dateField: {
            fontSize: 10,
            color: PDF_COLORS.textMuted
          },
          footerLabel: {
            fontSize: 9,
            color: PDF_COLORS.textMuted
          },
          footerValue: {
            fontSize: 9,
            bold: true,
            color: PDF_COLORS.text
          },
          footerCompany: {
            fontSize: 9,
            italics: true,
            color: PDF_COLORS.primary
          }
        },
        
        defaultStyle: { 
          font: 'Roboto',
          fontSize: 11,
          lineHeight: 1.4,
          color: PDF_COLORS.text
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const pdfPath = path.join(tempDir, `loan_agreement_${loan._id || Date.now()}.pdf`);
      const writeStream = fs.createWriteStream(pdfPath);

      return new Promise((resolve, reject) => {
        pdfDoc.pipe(writeStream);
        
        pdfDoc.on('end', () => {
          console.log('✅ PDF generated successfully with lender signature');
          resolve(pdfPath);
        });
        
        pdfDoc.on('error', (error) => {
          console.error('❌ PDF generation error:', error);
          reject(error);
        });
        
        pdfDoc.end();
      });

    } catch (error) {
      console.error('❌ Failed to generate loan agreement:', error);
      throw new Error(`Failed to generate loan agreement: ${error.message}`);
    }
  },

  signLoanAgreement: async (pdfPath, signer, outputPath) => {
    try {
      console.log('📝 Starting PDF signing process...');
      console.log(`   Input PDF: ${pdfPath}`);
      console.log(`   Output PDF: ${outputPath}`);

      // ✅ Check if the source PDF exists
      if (!await fs.pathExists(pdfPath)) {
        throw new Error(`Source PDF not found: ${pdfPath}`);
      }

      const { signatureImagePath } = signer; // Only need borrower signature now
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[pages.length - 1];

      // ✅ Add BORROWER signature ONLY (if provided) - RIGHT SIDE
      if (signatureImagePath && await fs.pathExists(signatureImagePath)) {
        console.log(`✅ Adding borrower signature: ${signatureImagePath}`);
        const imageBytes = await fs.readFile(signatureImagePath);
        let image;

        const ext = path.extname(signatureImagePath).toLowerCase();
        if (ext === '.png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (['.jpg', '.jpeg'].includes(ext)) {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        if (image) {
          page.drawImage(image, {
            x: 320, // Right side for borrower
            y: 100,
            width: 150,
            height: 70
          });
          
          // Add a subtle border around the signature area with logo colors
          page.drawRectangle({
            x: 318,
            y: 98,
            width: 154,
            height: 74,
            borderColor: rgb(1, 0.42, 0.21), // Orange border matching logo
            borderWidth: 1,
            opacity: 0.5
          });
          
          console.log('✅ Borrower signature added to PDF');
        }
      } else {
        console.log('ℹ  No borrower signature provided - PDF will have blank borrower signature line');
      }

      // ❌ REMOVED the lender signature addition here
      // The lender signature is already in the template from generateLoanAgreement

      // ✅ Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      
      // ✅ Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, signedPdfBytes);
      
      console.log(`✅ Loan agreement successfully signed: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('❌ PDF signing failed:', error);
      throw new Error(`PDF signing failed: ${error.message}`);
    }
  },

  // ✅ Add method to check lender signature
  checkLenderSignature: checkLenderSignature,

  // ✅ Add method to get logo path
  checkLogoExists: getLogoPath,
  
  // ✅ Add method to setup logo (can be called externally if needed)
  setupLogo: setupLogo,
  
  // 🎨 New method to get colors for external use
  getColors: () => PDF_COLORS
};

module.exports = pdfService;
