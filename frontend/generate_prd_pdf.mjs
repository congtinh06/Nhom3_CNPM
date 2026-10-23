import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function generatePdf() {
  const prdMdPath = path.join(rootDir, 'docs', 'PRD.md');
  const prdPdfPath = path.join(rootDir, 'docs', 'PRD.pdf');

  if (!fs.existsSync(prdMdPath)) {
    console.error('File docs/PRD.md not found!');
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(prdMdPath, 'utf8');

  const htmlTemplate = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Echora — Product Requirements Document (PRD)</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    h2 {
      font-size: 13.5pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #e2e8f0;
      letter-spacing: -0.01em;
      page-break-after: avoid;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    p {
      margin-top: 0;
      margin-bottom: 8px;
      text-align: justify;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 5px;
    }

    hr {
      border: 0;
      border-top: 1px solid #cbd5e1;
      margin: 16px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9pt;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      background-color: #f1f5f9;
      color: #0369a1;
      padding: 2px 4px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      overflow-x: auto;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    pre code {
      background: none;
      padding: 0;
      border: none;
      color: #334155;
    }

    blockquote {
      border-left: 3px solid #3b82f6;
      margin: 8px 0;
      padding: 4px 12px;
      background-color: #eff6ff;
      color: #1e40af;
      font-size: 9.5pt;
    }

    .mermaid {
      display: flex;
      justify-content: center;
      margin: 16px 0;
      page-break-inside: avoid;
      background: #ffffff;
      padding: 10px;
      border-radius: 8px;
    }

    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }
  </style>
</head>
<body>
  <div id="content"></div>

  <script>
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      fontFamily: 'Inter, sans-serif',
      flowchart: { curve: 'linear' },
      sequence: { showSequenceNumbers: true, actorMargin: 40 }
    });

    const rawMd = ${JSON.stringify(markdownContent)};

    const renderer = new marked.Renderer();
    renderer.code = function(code, language) {
      if (language === 'mermaid') {
        return '<div class="mermaid">' + code + '</div>';
      }
      return '<pre><code>' + code + '</code></pre>';
    };

    marked.setOptions({ renderer: renderer });
    document.getElementById('content').innerHTML = marked.parse(rawMd);
  </script>
</body>
</html>`;

  console.log('Starting Chromium to render PDF...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 }
  });

  await page.setContent(htmlTemplate, { waitUntil: 'networkidle' });

  // Run mermaid rendering
  await page.evaluate(async () => {
    try {
      await window.mermaid.run();
    } catch (e) {
      console.warn('Mermaid render warning:', e);
    }
  });

  await page.waitForTimeout(1500);

  console.log('Generating PDF to:', prdPdfPath);
  await page.pdf({
    path: prdPdfPath,
    format: 'A4',
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '15mm',
      right: '15mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 15mm; font-family: sans-serif;">Echora — Product Requirements Document (PRD)</div>',
    footerTemplate: '<div style="font-size: 8pt; color: #94a3b8; width: 100%; text-align: center; font-family: sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });

  await browser.close();
  console.log('PDF generated successfully at:', prdPdfPath);
}

generatePdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
