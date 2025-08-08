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

  signLoanAgreement: async (pdfPath, signer, options = {}) => {
    try {
      const { name, title, signatureImagePath } = signer;
      const { x = 50, y = 100, width = 200, height = 60 } = options;

      const pdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPages()[0];

      // Draw signature box
      page.drawRectangle({
        x: x,
        y: y,
        width: width,
        height: height,
        borderWidth: 1,
        borderColor: rgb(0.2, 0.2, 0.6),
        borderOpacity: 0.7,
      });

      // Add signature text
      page.drawText(`Signed by: ${name}`, {
        x: x + 10,
        y: y + 40,
        size: 12,
        color: rgb(0, 0, 0),
      });

      if (title) {
        page.drawText(`Title: ${title}`, {
          x: x + 10,
          y: y + 25,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
        x: x + 10,
        y: y + 10,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Add signature image if provided
      if (signatureImagePath && await fs.pathExists(signatureImagePath)) {
        try {
          const imageBytes = await fs.readFile(signatureImagePath);
          let image;
          
          if (signatureImagePath.endsWith('.png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else if (signatureImagePath.endsWith('.jpg') || signatureImagePath.endsWith('.jpeg')) {
            image = await pdfDoc.embedJpg(imageBytes);
          }

          if (image) {
            page.drawImage(image, {
              x: x + width - 90,
              y: y + 10,
              width: 80,
              height: 40,
            });
          }
        } catch (imageError) {
          console.error('Signature image processing failed:', imageError);
        }
      }

      const signedPath = pdfPath.replace('.pdf', '_signed.pdf');
      await fs.writeFile(signedPath, await pdfDoc.save());
      return signedPath;
    } catch (error) {
      throw new Error(`PDF signing failed: ${error.message}`);
    }
  }
};

module.exports = pdfService;