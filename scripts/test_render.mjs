import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
  <rect width="400" height="200" fill="white"/>
  <text x="200" y="100" font-family="Times New Roman" font-size="20" text-anchor="middle">TEST PLAYWRIGHT</text>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 200 } });
await page.setContent(svg);
await page.screenshot({ path: 'test_render.png' });
await browser.close();
console.log('Test render OK! File size:', fs.statSync('test_render.png').size);
