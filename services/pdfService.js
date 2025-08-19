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
const tempDir = path.join(__dirname, '../documents');
const signaturesDir = path.join(__dirname, '../uploads/signatures');

fs.ensureDirSync(tempDir);
fs.ensureDirSync(signaturesDir);

const pdfService = {
  generateLoanAgreement: async (loan, user) => {
    const docDefinition = {
      content: [
        { text: 'LOAN AGREEMENT', style: 'header' },
        { text: `Generated: ${new Date().toLocaleString()}`, style: 'subheader' },
        { 
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Loan ID', loan._id.toString()],
              ['Borrower', `${loan.borrowerInfo.firstName} ${loan.borrowerInfo.surname}`],
              ['ID Number', loan.borrowerInfo.idNumber || 'Not provided'],
              ['Product Type', loan.productType],
              ['Amount', `$${loan.amount.toLocaleString()}`],
              ['Term', `${loan.term} months`],
              ['Interest Rate', `${loan.interestRate}%`]
            ]
          }
        },
        { text: 'Signatures', style: 'signatureHeader', margin: [0, 30, 0, 10] },
        {
          columns: [
            { text: '__________________\nLender Representative', width: '50%' },
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

    const pdfPath = path.join(tempDir, `loan_agreement_${loan._id}.pdf`);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(pdfPath);
      pdfDoc.pipe(stream);
      pdfDoc.on('end', resolve);
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });

    return pdfPath;
  },

  signLoanAgreement: async (unsignedPath, signaturePath, outputPath) => {
    const pdfBytes = await fs.readFile(unsignedPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    if (await fs.pathExists(signaturePath)) {
      const imageBytes = await fs.readFile(signaturePath);
      let image;

      if (signaturePath.endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (signaturePath.endsWith('.jpg') || signaturePath.endsWith('.jpeg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      page.drawImage(image, {
        x: 350,
        y: 100,
        width: 120,
        height: 60
      });

      page.drawText(`Signed at: ${new Date().toLocaleString()}`, {
        x: 350,
        y: 80,
        size: 8,
        color: rgb(0.3, 0.3, 0.3)
      });
    }

    await fs.writeFile(outputPath, await pdfDoc.save());
    return outputPath;
  }
};

module.exports = pdfService;