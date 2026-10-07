import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 970 } });
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  // Test Option 1: Single line 'THÀNH PHỐ HỒ CHÍ MINH'
  await page.evaluate(() => {
    const t = document.querySelector('.hero-title');
    const hero = document.querySelector('.hero');
    const kicker = document.querySelector('.hero-kicker');
    kicker.textContent = 'VẺ ĐẸP ĐẤT NƯỚC VÀ CON NGƯỜI';
    t.innerHTML = 'THÀNH PHỐ HỒ CHÍ MINH'.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    t.style.letterSpacing = '0.04em';
    t.style.fontSize = '100px';
    const w100 = t.offsetWidth;
    const target = hero.clientWidth * 0.88;
    const size = Math.min((100 * target) / w100, (hero.clientHeight * 0.22) / 0.72);
    t.style.fontSize = `${size}px`;
    t.style.marginTop = `${size * 0.72 * 0.25 + 6}px`;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/test-opt1-singleline.png' });

  // Test Option 2: 'HỒ CHÍ MINH' (giống hệt cấu trúc 2 từ 'VIET NAM')
  await page.evaluate(() => {
    const t = document.querySelector('.hero-title');
    const hero = document.querySelector('.hero');
    t.innerHTML = 'HỒ CHÍ MINH'.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    t.style.letterSpacing = '0.08em';
    t.style.fontSize = '100px';
    const w100 = t.offsetWidth;
    const target = hero.clientWidth * 0.85;
    const size = Math.min((100 * target) / w100, (hero.clientHeight * 0.25) / 0.72);
    t.style.fontSize = `${size}px`;
    t.style.marginTop = `${size * 0.72 * 0.25 + 6}px`;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/test-opt2-hochiminh.png' });

  // Test Option 3: 2 lines: 'THÀNH PHỐ' trên, 'HỒ CHÍ MINH' dưới
  await page.evaluate(() => {
    const t = document.querySelector('.hero-title');
    const hero = document.querySelector('.hero');
    t.innerHTML = `
      <div style="white-space: nowrap; text-align: center;">${'THÀNH PHỐ'.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</div>
      <div style="white-space: nowrap; text-align: center;">${'HỒ CHÍ MINH'.split('').map(c => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</div>
    `;
    t.style.lineHeight = '0.88';
    t.style.fontSize = '100px';
    const divs = t.querySelectorAll('div');
    const target = hero.clientWidth * 0.82;
    const size = Math.min((hero.clientHeight * 0.16) / 0.72, 160);
    divs.forEach(d => {
      d.style.fontSize = `${size}px`;
      d.style.letterSpacing = '0.06em';
    });
    t.style.marginTop = '16px';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scripts/test-opt3-twolines.png' });

  await browser.close();
  console.log('Screenshots captured successfully');
}

test().catch(console.error);
