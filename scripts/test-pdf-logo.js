const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 44;

async function bufferHasAlpha(image) {
  try {
    const meta = await sharp(image).metadata();
    return Boolean(meta.hasAlpha || meta.channels === 4);
  } catch (e) {
    return false;
  }
}

async function run() {
  const logoPath = path.join(__dirname, '..', 'public', 'brand', 'logofechapro.png');
  if (!fs.existsSync(logoPath)) {
    console.error('Logo not found at', logoPath);
    process.exit(1);
  }

  const logo = fs.readFileSync(logoPath);
  const hasAlpha = await bufferHasAlpha(logo);
  console.log('Logo has alpha:', hasAlpha);

  const outPath = path.join(__dirname, 'output-test-logo.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  // draw a cover area
  doc.rect(0, 0, PAGE.width, 200).fill('#0F172A');
  doc.fillColor('#FFFFFF');

  const logoX = MARGIN;
  const logoY = 36;
  const logoWidth = 132;
  const logoHeight = 66;

  if (!hasAlpha) {
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 8).fill('#FFFFFF');
  } else {
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 8).lineWidth(1).stroke('#FFFFFF');
  }

  try {
    doc.image(logo, logoX + 6, logoY + 6, { fit: [logoWidth - 12, logoHeight - 12], align: 'center', valign: 'center' });
  } catch (e) {
    console.error('Failed to draw image', e);
    // fallback: draw initials
    doc.fillColor('#FFFFFF').fontSize(24).text('FP', logoX + 20, logoY + 18);
  }

  doc.end();

  stream.on('finish', () => {
    console.log('PDF generated at', outPath);
  });
}

run();
