// services/pdfService.js
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

async function ensureTempDir() {
  await fs.ensureDir(tempDir);
}

// ✅ Convert image file to Base64
async function getBase64Image(filePath) {
  if (await fs.pathExists(filePath)) {
    const imageBytes = await fs.readFile(filePath);
    return `data:image/${path.extname(filePath).slice(1)};base64,${imageBytes.toString('base64')}`;
  }
  return null;
}

const pdfService = {
  generateLoanAgreement: async (loan, user) => {
    try {
      await ensureTempDir();
      const today = new Date().toLocaleDateString();

      // ✅ Get Base64 logo
      const logoPath = path.join(__dirname, '../assets/logo.jpg');
      const base64Logo = await getBase64Image(logoPath);

      const docDefinition = {
        content: [
          // ✅ Professional logo placement (only if logo exists)
          ...(base64Logo
            ? [{ image: base64Logo, width: 120, alignment: 'center', margin: [0, 0, 0, 15] }]
            : []),

          { text: 'LOAN AGREEMENT', style: 'header' },
          { text: `Date: ${today}`, style: 'subheader' },
          { text: '\n' },

          { text: 'LENDER', style: 'sectionHeader' },
          { text: 'Pockett Loan' },
          { text: '\n' },

          { text: 'BORROWER', style: 'sectionHeader' },
          { text: `${user.firstName} ${user.lastName}` },
          { text: '\n' },

          { text: 'LOAN DETAILS', style: 'sectionHeader' },
          { text: `Principal Amount: $${loan.amount}` },
          { text: `Term: ${loan.term} months` },
          { text: `Interest Rate: ${loan.interestRate}%` },
          { text: `Repayment Schedule: Monthly installments` },
          { text: '\n' },

          { text: 'BORROWER OBLIGATIONS', style: 'sectionHeader' },
          { text: 'The Borrower agrees to repay the Loan in full according to the repayment schedule. Late or missed payments may result in penalties as provided by law.' },
          { text: '\n' },

          { text: 'DEFAULT', style: 'sectionHeader' },
          { text: 'In the event of default, the Lender may demand immediate repayment of the outstanding balance, and take necessary legal action.' },
          { text: '\n' },

          { text: 'GOVERNING LAW', style: 'sectionHeader' },
          { text: 'This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Lender operates.' },
          { text: '\n\n\n' },

          {
            columns: [
              { text: '__________________________\nLender Representative', alignment: 'center' },
              { text: '__________________________\nBorrower', alignment: 'center' }
            ]
          },
          { text: '\nDate: ________________________' }
        ],
        styles: {
          header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
          subheader: { fontSize: 12, margin: [0, 5, 0, 15] },
          sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] }
        },
        defaultStyle: { font: 'Roboto' }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const pdfPath = path.join(tempDir, `loan_${loan._id}.pdf`);
      const writeStream = fs.createWriteStream(pdfPath);

      return new Promise((resolve, reject) => {
        pdfDoc.pipe(writeStream);
        pdfDoc.on('end', () => resolve(pdfPath));
        pdfDoc.on('error', reject);
        pdfDoc.end();
      });

    } catch (error) {
      throw new Error(`Failed to generate loan agreement: ${error.message}`);
    }
  },

  addDigitalSignature: async (pdfPath, signer) => {
    try {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPages()[0];

      page.drawText(`Digitally signed by: ${signer}`, {
        x: 50,
        y: 50,
        size: 10,
        color: rgb(0.2, 0.2, 0.6)
      });

      page.drawText(`Date: ${new Date().toISOString()}`, {
        x: 50,
        y: 30,
        size: 10,
        color: rgb(0.2, 0.2, 0.6)
      });

      const signedPath = pdfPath.replace('.pdf', '_signed.pdf');
      await fs.writeFile(signedPath, await pdfDoc.save());
      return signedPath;

    } catch (error) {
      throw new Error(`Failed to add digital signature: ${error.message}`);
    }
  },

  signLoanAgreement: async (pdfPath, signer, outputPath) => {
    try {
      const { signatureImagePath } = signer;
      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPages()[0];

      if (signatureImagePath && await fs.pathExists(signatureImagePath)) {
        const imageBytes = await fs.readFile(signatureImagePath);
        let image;

        if (signatureImagePath.endsWith('.png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (signatureImagePath.endsWith('.jpg') || signatureImagePath.endsWith('.jpeg')) {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        page.drawImage(image, {
          x: 120,
          y: 100,
          width: 300,
          height: 150
        });
      }

      await fs.writeFile(outputPath, await pdfDoc.save());
      return outputPath;

    } catch (error) {
      console.error('PDF signing failed:', error);
      throw error;
    }
  }
};

module.exports = pdfService;
