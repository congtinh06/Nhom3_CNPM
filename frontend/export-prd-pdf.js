import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePrdPdf() {
  const rootDir = path.resolve(__dirname, '..');
  const docsDir = path.join(rootDir, 'docs');
  const htmlPath = path.join(docsDir, 'PRD.html');
  const cssPath = path.join(docsDir, 'pdf-style.css');
  const pdfPath = path.join(docsDir, 'PRD.pdf');

  console.log(`Reading HTML from: ${htmlPath}`);
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

  // Wrap in complete HTML shell with embedded CSS and utf-8 charset
  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>ECHORA — Tài liệu Yêu cầu Sản phẩm (PRD)</title>
  <style>
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

  const renderHtmlPath = path.join(docsDir, 'PRD_full.html');
  fs.writeFileSync(renderHtmlPath, fullHtml, 'utf8');
  console.log(`Wrote full HTML to: ${renderHtmlPath}`);

  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Navigate to file URL
  const fileUrl = `file:///${renderHtmlPath.replace(/\\/g, '/')}`;
  console.log(`Navigating to: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Ensure all images are fully loaded
  console.log('Waiting for all images to complete loading...');
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = resolve;
            }
          })
      )
    );
  });

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 8px; color: #8c959f; width: 100%; text-align: right; padding-right: 16mm; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ECHORA — TÀI LIỆU YÊU CẦU SẢN PHẨM (PRD) — NHÓM 3 CNPM
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 8px; color: #8c959f; width: 100%; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Trang <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '16mm',
      right: '16mm'
    }
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`PDF successfully generated: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

generatePrdPdf().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
