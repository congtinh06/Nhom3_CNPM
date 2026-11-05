// Smoke test cho bản build production: chạy `vite preview` rồi mở các route
// công khai bằng Chromium headless. Fail nếu trang trắng, không render được
// #root, hoặc có console error / pageerror.
//
// Chạy: npm run smoke:preview (sau `npm run build`).

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.SMOKE_PORT || 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const routes = ['/', '/gan-toi'];
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

function startPreview() {
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });
  return { child, getOutput: () => output };
}

async function waitForServer(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: 'manual' });
      if (response.ok) return;
    } catch {
      // Server chưa lên, thử lại.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`vite preview không phản hồi trong ${timeoutMs}ms`);
}

function jsonFor(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/api/location/nearby' || pathname === '/api/location/resolve') {
    return {
      pois: [],
      degraded: false,
      notice: 'smoke-test',
      center: { lat: 21.0278, lng: 105.8342 },
    };
  }
  if (pathname === '/api/content/pois/guide') return [];
  if (pathname === '/api/content/pois') return [];
  if (pathname === '/api/content/categories') return [];
  if (pathname === '/api/content/zones') return [];
  if (pathname === '/api/content/routes') return [];
  if (pathname === '/api/auth/me/entitlements') {
    return { plan: 'FREE', premiumActive: false, entitlements: [] };
  }
  if (pathname === '/api/analytics/events' || pathname === '/api/analytics/presence') {
    return null;
  }
  return {};
}

async function stubRequest(route) {
  const url = route.request().url();
  const pathname = new URL(url).pathname;

  if (pathname.startsWith('/api/')) {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.request().method());
    if (isWrite) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(jsonFor(url)),
    });
    return;
  }

  if (pathname.startsWith('/img/')) {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
    return;
  }

  if (url.startsWith('https://fonts.googleapis.com/')) {
    await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return;
  }
  if (url.startsWith('https://fonts.gstatic.com/')) {
    await route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
    return;
  }
  if (url.includes('tile.openstreetmap.org')) {
    await route.fulfill({ status: 200, contentType: 'image/png', body: TINY_PNG });
    return;
  }

  await route.continue();
}

async function stopPreview(child) {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' }).on(
        'exit',
        resolve
      );
    });
    return;
  }
  child.kill('SIGTERM');
}

async function main() {
  const { child, getOutput } = startPreview();
  let browser;
  const failures = [];

  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      geolocation: { latitude: 21.0278, longitude: 105.8342 },
      permissions: ['geolocation'],
      viewport: { width: 1280, height: 800 },
    });
    await context.route('**/*', stubRequest);
    const page = await context.newPage();

    for (const routePath of routes) {
      const consoleErrors = [];
      const pageErrors = [];
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      const response = await page.goto(`${baseUrl}${routePath}`, {
        waitUntil: 'load',
        timeout: 30000,
      });
      await page.waitForSelector('#root > *', { timeout: 15000 });
      await page.waitForTimeout(1500);

      const status = response ? response.status() : 0;
      const rootText = (await page.locator('#root').innerText()).trim();
      const rootChildren = await page.locator('#root > *').count();
      const bodyText = (await page.locator('body').innerText()).trim();

      console.log(
        `[smoke] ${routePath} status=${status} rootChildren=${rootChildren} ` +
          `rootText=${rootText.length} bodyText=${bodyText.length} ` +
          `consoleErrors=${consoleErrors.length} pageErrors=${pageErrors.length}`
      );

      if (status !== 200) failures.push(`${routePath}: HTTP ${status}`);
      if (rootChildren === 0 || rootText.length === 0 || bodyText.length < 20) {
        failures.push(`${routePath}: trang trắng (rootChildren=${rootChildren}, text=${bodyText.length})`);
      }
      if (consoleErrors.length > 0) {
        failures.push(`${routePath}: console error -> ${consoleErrors.join(' | ')}`);
      }
      if (pageErrors.length > 0) {
        failures.push(`${routePath}: pageerror -> ${pageErrors.join(' | ')}`);
      }
    }
  } finally {
    if (browser) await browser.close();
    await stopPreview(child);
  }

  if (failures.length > 0) {
    console.error('\n[smoke] FAILED');
    for (const failure of failures) console.error(` - ${failure}`);
    const output = getOutput().trim();
    if (output) console.error(`\n[vite preview]\n${output}`);
    process.exitCode = 1;
    return;
  }

  console.log('\n[smoke] PASSED: / and /gan-toi render without console errors.');
}

main().catch((error) => {
  console.error(`[smoke] FAILED: ${error.message}`);
  process.exitCode = 1;
});
