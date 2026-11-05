// frontend/scripts/measure-bundle-network.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist', 'assets');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const port = 4175;
const baseUrl = `http://127.0.0.1:${port}`;

// 1. Measure all JS assets in dist/assets
const files = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'));
let totalRaw = 0;
let totalGzip = 0;
const assetStats = [];

for (const file of files) {
  const buf = fs.readFileSync(path.join(distDir, file));
  const raw = buf.length;
  const gzip = zlib.gzipSync(buf, { level: 9 }).length;
  totalRaw += raw;
  totalGzip += gzip;
  assetStats.push({ file, raw, gzip });
}

assetStats.sort((a, b) => b.raw - a.raw);

const indexAsset = assetStats.find((a) => a.file.startsWith('index-'));
const vendorAsset = assetStats.find((a) => a.file.startsWith('vendor-') && !a.file.startsWith('vendor-charts'));
const chartsAsset = assetStats.find((a) => a.file.startsWith('vendor-charts'));

console.log('=== 1. BUILD ASSETS SUMMARY ===');
console.log(`Files count: ${files.length}`);
console.log(`index: ${indexAsset ? indexAsset.file : 'N/A'} -> ${(indexAsset.raw / 1024).toFixed(2)} kB raw | ${(indexAsset.gzip / 1024).toFixed(2)} kB gzip`);
console.log(`vendor: ${vendorAsset ? vendorAsset.file : 'N/A'} -> ${(vendorAsset.raw / 1024).toFixed(2)} kB raw | ${(vendorAsset.gzip / 1024).toFixed(2)} kB gzip`);
if (chartsAsset) {
  console.log(`charts: ${chartsAsset.file} -> ${(chartsAsset.raw / 1024).toFixed(2)} kB raw | ${(chartsAsset.gzip / 1024).toFixed(2)} kB gzip`);
}
console.log(`Total JS: ${(totalRaw / 1024).toFixed(2)} kB raw | ${(totalGzip / 1024).toFixed(2)} kB gzip`);

// 2. Start preview server
console.log('\n=== 2. MEASURING INITIAL JS TRANSFERRED VIA PLAYWRIGHT ===');

function startPreview() {
  const child = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  child.stdout.on('data', (d) => console.log('[preview stdout]', d.toString()));
  child.stderr.on('data', (d) => console.error('[preview stderr]', d.toString()));
  return child;
}

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Preview server did not start');
}

const previewProcess = startPreview();

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });

  const routesToTest = ['/', '/gan-toi'];
  const routeResults = {};

  for (const routePath of routesToTest) {
    const context = await browser.newContext({
      geolocation: { latitude: 21.0278, longitude: 105.8342 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();

    // Stub APIs to avoid backend dependency
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pois: [], items: [], degraded: false }),
      });
    });

    const jsRequests = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/assets/') && url.endsWith('.js')) {
        const fileName = url.split('/').pop();
        try {
          const body = await response.body();
          const rawBytes = body.length;
          const gzipBytes = zlib.gzipSync(body, { level: 9 }).length;
          jsRequests.push({ fileName, rawBytes, gzipBytes });
        } catch {
          // Response body already handled or aborted
        }
      }
    });

    await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'networkidle' });
    // Small pause to allow React.lazy to settle
    await page.waitForTimeout(500);

    let routeRaw = 0;
    let routeGzip = 0;
    for (const req of jsRequests) {
      routeRaw += req.rawBytes;
      routeGzip += req.gzipBytes;
    }

    routeResults[routePath] = {
      chunksCount: jsRequests.length,
      chunks: jsRequests.map((r) => r.fileName),
      rawBytes: routeRaw,
      rawKb: (routeRaw / 1024).toFixed(2),
      gzipBytes: routeGzip,
      gzipKb: (routeGzip / 1024).toFixed(2),
    };

    console.log(`\nRoute: ${routePath}`);
    console.log(`  Loaded ${jsRequests.length} JS chunks:`);
    jsRequests.forEach((req) => {
      console.log(`   - ${req.fileName} (${(req.rawBytes / 1024).toFixed(2)} kB raw, ${(req.gzipBytes / 1024).toFixed(2)} kB gzip)`);
    });
    console.log(`  Total JS loaded: ${routeResults[routePath].rawKb} kB raw | ${routeResults[routePath].gzipKb} kB gzip`);

    await context.close();
  }

  await browser.close();

  // Print final Markdown table
  console.log('\n=== FINAL MARKDOWN TABLE ===\n');
  console.log('| Tuyến / Trang | Chunks tải ban đầu | JS Raw tải (kB) | JS Gzip tải (kB) |');
  console.log('|---|---:|---:|---:|');
  console.log(`| \`/\` (Trang chủ) | ${routeResults['/'].chunksCount} chunks | **${routeResults['/'].rawKb}** | **${routeResults['/'].gzipKb}** |`);
  console.log(`| \`/gan-toi\` (Bản đồ / POI) | ${routeResults['/gan-toi'].chunksCount} chunks | **${routeResults['/gan-toi'].rawKb}** | **${routeResults['/gan-toi'].gzipKb}** |`);

} finally {
  previewProcess.kill('SIGTERM');
}
