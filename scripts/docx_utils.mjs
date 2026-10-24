import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 1.5 line spacing in docx OpenXML is w:line="360" w:lineRule="auto" (240 is single line, 360 is 1.5 lines)
// Font size: 26 = 13pt, 28 = 14pt, 32 = 16pt, 24 = 12pt
const BODY_SZ = '26'; // 13pt as requested
const LINE_SP = '360'; // 1.5 line spacing

function h1(text) {
  return `<w:p><w:pPr><w:spacing w:before="360" w:after="180" w:line="360" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:b/><w:color w:val="000000"/><w:sz w:val="32"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

function h2(text) {
  return `<w:p><w:pPr><w:spacing w:before="260" w:after="120" w:line="360" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:b/><w:color w:val="000000"/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

function h3(text) {
  return `<w:p><w:pPr><w:spacing w:before="180" w:after="80" w:line="360" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:b/><w:i/><w:color w:val="000000"/><w:sz w:val="26"/></w:rPr><w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

function p(text, opts = {}) {
  const jc = opts.center ? 'center' : (opts.left ? 'left' : 'both');
  const bold = opts.bold ? '<w:b/>' : '';
  const italic = opts.italic ? '<w:i/>' : '';
  const size = opts.size ? opts.size : BODY_SZ;
  const before = opts.before !== undefined ? opts.before : '0';
  const after = opts.after !== undefined ? opts.after : '100';
  const indent = opts.indent ? `<w:ind w:left="${opts.indent}"/>` : '';

  if (text.includes('**')) {
    const parts = text.split('**');
    let rXml = '';
    parts.forEach((part, idx) => {
      if (!part) return;
      const isPartBold = (idx % 2 === 1);
      rXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>${isPartBold ? '<w:b/>' : ''}${italic}<w:color w:val="000000"/><w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`;
    });
    return `<w:p><w:pPr>${indent}<w:spacing w:before="${before}" w:after="${after}" w:line="${LINE_SP}" w:lineRule="auto"/><w:jc w:val="${jc}"/></w:pPr>${rXml}</w:p>`;
  }

  return `<w:p><w:pPr>${indent}<w:spacing w:before="${before}" w:after="${after}" w:line="${LINE_SP}" w:lineRule="auto"/><w:jc w:val="${jc}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>${bold}${italic}<w:color w:val="000000"/><w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function bullet(text, level = 1) {
  const indent = level === 1 ? '360' : '720';
  return p(`• ${text}`, { indent, after: '60' });
}

function numbered(num, text) {
  return p(`${num}. ${text}`, { indent: '360', after: '60' });
}

function figure(rId, caption, cx = 5486400, cy = 3869111, docId = 101) {
  const drawXml = `<w:p><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${docId}" name="Picture ${docId}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${docId}" name="Picture ${docId}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  const capXml = `<w:p><w:pPr><w:spacing w:before="40" w:after="200" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:b w:val="0"/><w:i/><w:color w:val="000000"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(caption)}</w:t></w:r></w:p>`;
  return drawXml + capXml;
}

function table(headers, rows, colWidths, caption = '') {
  let capXml = '';
  if (caption) {
    capXml = `<w:p><w:pPr><w:spacing w:before="160" w:after="80" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(caption)}</w:t></w:r></w:p>`;
  }

  let gridCols = colWidths.map(w => `<w:gridCol w:w="${w}"/>`).join('');
  let tblPr = `<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>`;

  let thCells = headers.map((h, i) => {
    return `<w:tc><w:tcPr><w:tcW w:w="${colWidths[i]}" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:color="000000" w:sz="6" w:space="0"/><w:left w:val="single" w:color="000000" w:sz="4" w:space="0"/><w:bottom w:val="single" w:color="000000" w:sz="8" w:space="0"/><w:right w:val="single" w:color="000000" w:sz="4" w:space="0"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="F0F0F0"/></w:tcPr><w:p><w:pPr><w:spacing w:before="60" w:after="60" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(h)}</w:t></w:r></w:p></w:tc>`;
  }).join('');
  let headerTr = `<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>${thCells}</w:tr>`;

  let trRows = rows.map((row, rIdx) => {
    let fill = (rIdx % 2 === 1) ? 'FAFAFA' : 'FFFFFF';
    let tdCells = row.map((cellText, i) => {
      let isCenter = (i === 0 && row.length > 2);
      let jc = isCenter ? 'center' : 'left';
      return `<w:tc><w:tcPr><w:tcW w:w="${colWidths[i]}" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:color="CCCCCC" w:sz="4" w:space="0"/><w:left w:val="single" w:color="000000" w:sz="4" w:space="0"/><w:bottom w:val="single" w:color="CCCCCC" w:sz="4" w:space="0"/><w:right w:val="single" w:color="000000" w:sz="4" w:space="0"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:tcPr><w:p><w:pPr><w:spacing w:before="50" w:after="50" w:line="240" w:lineRule="auto"/><w:jc w:val="${jc}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="21"/></w:rPr><w:t>${escapeXml(cellText)}</w:t></w:r></w:p></w:tc>`;
    }).join('');
    return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${tdCells}</w:tr>`;
  }).join('');

  return capXml + `<w:tbl>${tblPr}${headerTr}${trRows}</w:tbl>`;
}

function pageBreak() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

export {
  escapeXml,
  h1,
  h2,
  h3,
  p,
  bullet,
  numbered,
  figure,
  table,
  pageBreak,
  BODY_SZ,
  LINE_SP
};
