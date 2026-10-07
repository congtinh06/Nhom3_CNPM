import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const shotsDir = path.resolve(__dirname, '../../docs/design/shots');
if (!fs.existsSync(shotsDir)) {
  fs.mkdirSync(shotsDir, { recursive: true });
}

const viewports = [
  { width: 1920, height: 970, name: '1920x970' },
  { width: 1366, height: 768, name: '1366x768' },
  { width: 390, height: 844, name: '390x844' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);

    // Verify 5 reloads on each viewport
    for (let i = 0; i < 5; i++) {
      const h1Text = await page.$eval('.hero-title', el => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim());
      if (!h1Text.toUpperCase().includes('HỒ CHÍ MINH')) {
        console.error(`Reload ${i + 1} failed: title missing text at ${vp.name}`);
      } else {
        console.log(`Reload ${i + 1} passed at ${vp.name}: "${h1Text}"`);
      }
      if (i < 4) {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);
      }
    }

    // Check lenis active
    const isLenis = await page.evaluate(() => {
      return document.documentElement.classList.contains('lenis') || typeof window.__lenis !== 'undefined';
    });
    console.log(`Viewport ${vp.name}: Lenis active = ${isLenis}`);

    // Capture measurements
    const m = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const block = document.querySelector('.hero-block');
      const kicker = document.querySelector('.hero-kicker');
      const title = document.querySelector('.hero-title');
      const date = document.querySelector('.hero-date');
      const spans = document.querySelectorAll('.hero-title span');
      const spanFirst = spans[0];
      const spanLast = spans[spans.length - 1];

      const heroRect = hero.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      const kickerRect = kicker.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const dateRect = date.getBoundingClientRect();
      const firstRect = spanFirst.getBoundingClientRect();
      const lastRect = spanLast.getBoundingClientRect();

      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;

      return {
        hero: { width: heroRect.width, height: heroRect.height },
        block: { left: blockRect.left, right: blockRect.right, width: blockRect.width, top: blockRect.top },
        kicker: { left: kickerRect.left, right: kickerRect.right, top: kickerRect.top, bottom: kickerRect.bottom, height: kickerRect.height },
        title: { left: titleRect.left, right: titleRect.right, top: titleRect.top, bottom: titleRect.bottom, width: titleRect.width, height: titleRect.height },
        date: { left: dateRect.left, right: dateRect.right, top: dateRect.top, bottom: dateRect.bottom, width: dateRect.width },
        first: { left: firstRect.left, right: firstRect.right, top: firstRect.top, bottom: firstRect.bottom, width: firstRect.width, height: firstRect.height },
        last: { left: lastRect.left, right: lastRect.right, top: lastRect.top, bottom: lastRect.bottom, width: lastRect.width, height: lastRect.height },
        scrollWidth,
        innerWidth,
        hasHorizontalScroll: scrollWidth > innerWidth,
      };
    });

    const capHeightRatio = m.first.height / m.hero.height;
    const topCapRatio = m.first.top / m.hero.height;
    const bottomCapRatio = m.first.bottom / m.hero.height;
    const dateBottomRatio = m.date.bottom / m.hero.height;
    const leftMargin = m.first.left;
    const rightMargin = m.innerWidth - m.last.right;
    const diffSideMargins = Math.abs(leftMargin - rightMargin);
    const textWidth = m.last.right - m.first.left;
    const textWidthRatio = textWidth / m.innerWidth;
    const diffKicker = Math.abs(m.kicker.left - m.first.left);
    const diffDate = Math.abs(m.date.right - m.last.right);
    const kickerTitleGap = m.title.top - m.kicker.bottom;

    await page.waitForTimeout(2000);
    const shotPath = path.join(shotsDir, `hero-${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Test smooth scroll down and capture a section reveal
    await page.evaluate(() => {
      if (window.__lenis) {
        window.__lenis.scrollTo(800, { immediate: false, duration: 1.0 });
      } else {
        window.scrollTo({ top: 800, behavior: 'smooth' });
      }
    });
    await page.waitForTimeout(1100);
    const scrollShotPath = path.join(shotsDir, `scroll-${vp.name}.png`);
    await page.screenshot({ path: scrollShotPath, fullPage: false });

    results.push({
      viewport: vp.name,
      leftMargin,
      rightMargin,
      diffSideMargins,
      textWidth,
      textWidthRatio: (textWidthRatio * 100).toFixed(1) + '%',
      capHeightRatio: (capHeightRatio * 100).toFixed(1) + '%',
      topCapRatio: (topCapRatio * 100).toFixed(1) + '%',
      bottomCapRatio: (bottomCapRatio * 100).toFixed(1) + '%',
      diffKicker,
      diffDate,
      kickerTitleGap,
      hasHorizontalScroll: m.hasHorizontalScroll,
      shotPath,
      scrollShotPath,
    });

    await page.close();
  }

  await browser.close();

  console.log('\n--- MEASUREMENT REPORT ---');
  console.table(results.map(r => ({
    Viewport: r.viewport,
    'Left Margin': `${r.leftMargin.toFixed(1)}px`,
    'Right Margin': `${r.rightMargin.toFixed(1)}px`,
    'Diff Margins': `${r.diffSideMargins.toFixed(1)}px`,
    'Width %': r.textWidthRatio,
    'Cap Height %': r.capHeightRatio,
    'Top %': r.topCapRatio,
    'Bottom %': r.bottomCapRatio,
    'Kicker Diff': `${r.diffKicker.toFixed(1)}px`,
    'Date Diff': `${r.diffDate.toFixed(1)}px`,
    'Gap (px)': `${r.kickerTitleGap.toFixed(1)}px`,
    'Horiz Scroll': r.hasHorizontalScroll ? 'YES (FAIL)' : 'NO (PASS)'
  })));
}

run().catch(console.error);
