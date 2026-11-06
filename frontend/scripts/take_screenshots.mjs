import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('../scratch/real_screens');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const routes = [
    { url: 'http://localhost:8088/', name: '01_home_desktop.png' },
    { url: 'http://localhost:8088/kham-pha', name: '02_map_desktop.png' },
    { url: 'http://localhost:8088/premium', name: '03_premium_desktop.png' },
    { url: 'http://localhost:8088/am-thuc-qua-tang', name: '04_souvenirs_desktop.png' },
    { url: 'http://localhost:8088/tin-tuc', name: '05_news_desktop.png' },
    { url: 'http://localhost:8088/quan-tri', name: '06_admin_overview.png' },
    { url: 'http://localhost:8088/quan-tri/di-tich', name: '07_admin_pois.png' },
    { url: 'http://localhost:8088/quan-tri/san-pham', name: '08_admin_products.png' },
    { url: 'http://localhost:8088/quan-tri/don-hang', name: '09_admin_orders.png' },
    { url: 'http://localhost:8088/quan-tri/nguoi-dung', name: '10_admin_users.png' },
    { url: 'http://localhost:8088/quan-tri/phan-tich-qr', name: '11_admin_qr_analytics.png' }
  ];

  for (const r of routes) {
    try {
      console.log(`Navigating to ${r.url}...`);
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 8000 });
      await page.waitForTimeout(1000);
      const outPath = path.join(outDir, r.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.log(`Error taking ${r.url}:`, e.message);
    }
  }

  // Also take mobile screenshots
  const mobContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const mobPage = await mobContext.newPage();

  const mobRoutes = [
    { url: 'http://localhost:8088/kham-pha', name: 'mob_01_map.png' },
    { url: 'http://localhost:8088/quet-ma', name: 'mob_02_scan.png' },
    { url: 'http://localhost:8088/premium', name: 'mob_03_premium.png' }
  ];

  for (const r of mobRoutes) {
    try {
      console.log(`Mobile navigating to ${r.url}...`);
      await mobPage.goto(r.url, { waitUntil: 'networkidle', timeout: 8000 });
      await mobPage.waitForTimeout(1000);
      const outPath = path.join(outDir, r.name);
      await mobPage.screenshot({ path: outPath });
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.log(`Error taking mob ${r.url}:`, e.message);
    }
  }

  await browser.close();
  console.log('Done capturing all screenshots!');
}

run();
