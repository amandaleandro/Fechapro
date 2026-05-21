const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 44;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F8FAFC';

async function bufferHasAlpha(image) {
  try {
    const meta = await sharp(image).metadata();
    return Boolean(meta.hasAlpha || meta.channels === 4);
  } catch {
    return false;
  }
}

async function readPublicImage(rel) {
  try {
    const p = path.join(process.cwd(), 'public', rel.replace(/^\//, ''));
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

function initials(value) {
  const words = value.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase()).join('') || 'FP';
}

async function drawSample() {
  const doc = new PDFDocument({ autoFirstPage: false, size: 'A4', margin: MARGIN });
  const out = path.join(__dirname, 'output-sample-proposal.pdf');
  const ws = fs.createWriteStream(out);
  doc.pipe(ws);

  doc.addPage();

  // premium cover simplified
  doc.rect(0,0,PAGE.width,366).fill('#0F172A');
  doc.rect(0,0,PAGE.width,9).fill('#0b8450');
  const logo = await readPublicImage('brand/logofechapro.png');
  if (logo) {
    const hasAlpha = await bufferHasAlpha(logo);
    const logoX = MARGIN;
    const logoY = 36;
    const logoWidth = 132;
    const logoHeight = 66;
    if (!hasAlpha) doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 8).fill('#FFFFFF');
    else doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 8).lineWidth(1).stroke('#FFFFFF');
    try { doc.image(logo, logoX+6, logoY+6, { fit: [logoWidth-12, logoHeight-12] }); } catch(e){ doc.fillColor('#fff').fontSize(24).text(initials('FechaPro'), logoX+20, logoY+20); }
  }

  // section title (FAQ)
  doc.fillColor('#BFDBFE').fontSize(8).font('Helvetica-Bold').text('PERGUNTAS FREQUENTES', MARGIN, 150);
  doc.moveDown(0.5);
  doc.fillColor(INK).fontSize(18).font('Helvetica-Bold').text('Perguntas frequentes', MARGIN, 168);

  // draw FAQ as two-column compact list
  const faqs = [
    ['O FechaPro é só um sistema de orçamento?', 'Não. Ele transforma seu orçamento em uma proposta profissional com link, PDF, aceite online e acompanhamento.'],
    ['Posso enviar pelo WhatsApp?', 'Sim. Você cria a proposta, copia o link e envia direto pelo WhatsApp para o cliente.'],
    ['O cliente precisa baixar aplicativo?', 'Não. Ele acessa a proposta por um link público.'],
    ['Consigo usar minha marca?', 'Sim. Você configura logo, cores, WhatsApp, Instagram, site e dados comerciais.'],
  ];

  doc.y = 220;
  const colGap = 18;
  const colWidth = (CONTENT_WIDTH - colGap) / 2;
  const yCol = [doc.y, doc.y];

  for (const [q, a] of faqs) {
    const qh = doc.heightOfString(q, { width: colWidth - 12, lineGap: 2 });
    const ah = doc.heightOfString(a, { width: colWidth - 12, lineGap: 2 });
    const itemH = qh + ah + 8;
    const col = yCol[0] <= yCol[1] ? 0 : 1;
    if (yCol[col] + itemH > PAGE.height - 104) {
      doc.addPage();
      doc.y = MARGIN;
      yCol[0] = doc.y;
      yCol[1] = doc.y;
    }
    const x = MARGIN + col * (colWidth + colGap);
    const y = yCol[col];
    doc.roundedRect(x, y, 8, 3, 2).fill('#0F172A');
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text(q, x + 12, y - 2, { width: colWidth - 12 });
    doc.fillColor('#475569').font('Helvetica').fontSize(8).text(a, x + 12, y + qh + 2, { width: colWidth - 12, lineGap: 2 });
    yCol[col] += itemH + 8;
  }
  doc.y = Math.max(yCol[0], yCol[1]);

  // notes block close to title
  doc.addPage();
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text('Termos comerciais', MARGIN, MARGIN);
  const notes = `Esta proposta é válida por 7 dias.\n\nO acesso ao FechaPro é liberado após confirmação do pagamento.`;
  const nheight = Math.max(68, doc.heightOfString(notes, { width: CONTENT_WIDTH - 28 }) + 28);
  doc.roundedRect(MARGIN+2, doc.y+18, CONTENT_WIDTH, nheight, 8).fill('#E2E8F0');
  doc.roundedRect(MARGIN, doc.y+14, CONTENT_WIDTH, nheight, 8).fillAndStroke('#FFFFFF', LINE);
  doc.fillColor('#475569').font('Helvetica').fontSize(10).text(notes, MARGIN+22, doc.y+30, { width: CONTENT_WIDTH - 44 });

  // footer subtle
  const footerY = PAGE.height - 64;
  doc.rect(MARGIN, footerY - 6, CONTENT_WIDTH, 1).fill(LINE);
  doc.roundedRect(MARGIN, footerY, CONTENT_WIDTH, 36, 6).fill(SOFT);
  doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(7).text('CONTATO', MARGIN + 12, footerY + 8);
  doc.fillColor(INK).font('Helvetica').fontSize(7).text('contato@fechapro.com.br  |  WhatsApp: 34993416348  |  Instagram: @usefechapro', MARGIN + 80, footerY + 9, { width: CONTENT_WIDTH - 92 });

  doc.end();
  await new Promise((res)=> ws.on('finish', res));
  console.log('Sample PDF generated at', out);
}

drawSample().catch(console.error);
