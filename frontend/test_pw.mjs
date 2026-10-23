import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent('<h1>Test Playwright OK</h1>');
  await page.screenshot({ path: '../scratch/pw_test.png' });
  await browser.close();
  console.log('Playwright screenshot created successfully!');
}

test().catch(err => console.error('Playwright error:', err));
