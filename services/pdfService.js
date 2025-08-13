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

const pdfService = {
  generateLoanAgreement: async (loan, user) => {
    try {
      await ensureTempDir();
      
      const docDefinition = {
        content: [
          { text: 'LOAN AGREEMENT', style: 'header' },
          { text: `Generated: ${new Date().toLocaleString()}`, style: 'subheader' },
          { 
            table: {
              widths: ['*', '*'],
              body: [
                ['Loan Amount', `$${loan.amount}`],
                ['Term', `${loan.term} months`],
                ['Interest Rate', `${loan.interestRate}%`],
                ['Borrower', `${user.firstName} ${user.lastName}`]
              ]
            }
          },
          { 
            text: 'Signatures', 
            style: 'signatureHeader',
            margin: [0, 20, 0, 10] 
          },
          {
            columns: [
              { text: '__________________\nLender', width: '50%' },
              { text: '__________________\nBorrower', width: '50%' }
            ]
          }
        ],
        styles: {
          header: { fontSize: 18, bold: true, alignment: 'center' },
          subheader: { fontSize: 10, alignment: 'center', margin: [0, 0, 0, 10] },
          signatureHeader: { bold: true, alignment: 'center' }
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
        color: rgb(0.2, 0.2, 0.6),
      });
      
      page.drawText(`Date: ${new Date().toISOString()}`, {
        x: 50,
        y: 30,
        size: 10,
        color: rgb(0.2, 0.2, 0.6),
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

    // 1. Verify the image exists
    if (signatureImagePath && await fs.pathExists(signatureImagePath)) {
      const imageBytes = await fs.readFile(signatureImagePath);
      let image;

      // 2. Check image type
      if (signatureImagePath.endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (signatureImagePath.endsWith('.jpg') || signatureImagePath.endsWith('.jpeg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      // 3. Draw the image
      page.drawImage(image, {
  x: 120,       
  y: 100,         // Move it slightly down if it’s taller
  width: 300,    // Bigger width
  height: 150    // Bigger height
});

    } else {
      console.log('Signature image not found at:', signatureImagePath);
    }

    // 4. Save the PDF
    await fs.writeFile(outputPath, await pdfDoc.save());
    return outputPath;
  } catch (error) {
    console.error('PDF signing failed:', error);
    throw error;
  }
}}
  

module.exports = pdfService;