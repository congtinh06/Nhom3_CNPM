#!/usr/bin/env node
// Generate a QR code per POI for testing the ScanPage QR flow on a phone.
//
// Usage:
//   BASE_URL=https://your-app.vercel.app node scripts/generate-qr.mjs
//   node scripts/generate-qr.mjs https://your-app.vercel.app
//
// The QR content matches what ScanPage parses: a full URL "<BASE_URL>/qr/<qrToken>".
// The POI list is fetched from the public Content Service endpoint GET /api/content/pois
// so the qrToken values always come from the live source (no hardcoded links).

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { buildPlaceQrContent, normalizeQrBaseUrl } from '../frontend/src/lib/placeQrContent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'qr-output');
const seedPath = path.join(
  repoRoot,
  'backend/content-service/src/main/resources/db/migration/R__seed_demo.sql'
);

const QR_WIDTH_PX = 640; // >= 512 for comfortable scanning
const QR_MARGIN_MODULES = 3; // quiet zone wide enough for phone cameras

function resolveBaseUrl() {
  const args = process.argv.slice(2);
  const argUrl = args.find((arg) => !arg.startsWith('-'));
  const raw = process.env.BASE_URL || process.env.QR_BASE_URL || argUrl;
  if (!raw) {
    console.error(
      'Thiếu BASE_URL. Ví dụ:\n' +
        '  BASE_URL=https://your-app.vercel.app node scripts/generate-qr.mjs\n' +
        '  node scripts/generate-qr.mjs https://your-app.vercel.app'
    );
    process.exit(1);
  }
  return normalizeQrBaseUrl(raw);
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'poi';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

async function fetchPois(baseUrl) {
  const url = `${baseUrl}/api/content/pois`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': '1' },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} thất bại: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  const list = Array.isArray(json)
    ? json
    : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.content)
        ? json.content
        : null;
  if (!list) {
    throw new Error(`Phản hồi không đúng định dạng danh sách POI tại ${url}`);
  }
  return list;
}

// Offline fallback: read the demo seed so QRs can be generated even when the
// backend/tunnel is down. The qr_token is the only field the QR actually needs.
function parseSeed(sql) {
  const pattern =
    /N?'(POI_[A-Z0-9_]+)'\s*,\s*(?:N?'[^']*'\s*,\s*)?N?'(qr-[a-z0-9-]+)'\s*,\s*N?'([^']+)'/g;
  const seen = new Set();
  const out = [];
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    const [, code, token, name] = match;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push({ code, token, name });
  }
  return out;
}

async function loadPois(baseUrl, fromSeedOnly) {
  if (!fromSeedOnly) {
    try {
      const raw = await fetchPois(baseUrl);
      const mapped = raw
        .filter((poi) => poi && typeof poi.qrToken === 'string' && poi.qrToken.trim())
        .map((poi) => ({
          id: poi.id,
          name: poi.name || poi.title || `POI ${poi.id}`,
          token: poi.qrToken.trim(),
          code: poi.code,
          source: 'api',
        }));
      if (mapped.length > 0) return mapped;
      console.warn('API trả về danh sách rỗng, chuyển sang đọc seed...');
    } catch (err) {
      console.warn(
        `Không gọi được API (${err instanceof Error ? err.message : err}). ` +
          `Đọc danh sách từ seed: ${path.relative(repoRoot, seedPath)}`
      );
    }
  }

  const sql = await readFile(seedPath, 'utf8');
  const seeded = parseSeed(sql);
  if (seeded.length === 0) {
    throw new Error(`Không tìm thấy POI nào trong seed: ${seedPath}`);
  }
  return seeded.map((item, index) => ({
    id: index + 1,
    name: item.name,
    token: item.token,
    code: item.code,
    source: 'seed',
  }));
}

function renderHtml(baseUrl, cells, generatedAt) {
  const cards = cells
    .map((cell) => {
      const img = `./${encodeURIComponent(cell.pngName)}`;
      return `      <figure class="card">
        <img src="${img}" alt="QR ${escapeHtml(cell.name)}" />
        <figcaption>
          <span class="name">${escapeHtml(cell.name)}</span>
          <span class="meta">id: ${escapeHtml(cell.id)} &middot; ${escapeHtml(cell.token)}</span>
        </figcaption>
      </figure>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SaigonVoice - QR điểm du lịch</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1a1a1a;
      background: #f4f1ea;
    }
    header { margin-bottom: 20px; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    .sub { font-size: 13px; color: #555; word-break: break-all; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .card {
      margin: 0;
      padding: 14px;
      background: #fff;
      border: 1px solid #d9d2c2;
      border-radius: 12px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .card img { width: 100%; height: auto; display: block; }
    figcaption { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
    .name { font-weight: 600; font-size: 15px; }
    .meta { font-size: 12px; color: #666; word-break: break-all; }
    @media (max-width: 820px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media print {
      body { background: #fff; padding: 0; }
      h1 { font-size: 18px; }
      .grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .card { border-color: #999; }
    }
  </style>
</head>
<body>
  <header>
    <h1>QR điểm du lịch - SaigonVoice</h1>
    <p class="sub">Base URL: ${escapeHtml(baseUrl)} &middot; tạo lúc ${escapeHtml(generatedAt)}</p>
    <p class="sub">Mở trang này trên màn hình máy tính, dùng điện thoại mở trình duyệt và quét từng mã.</p>
  </header>
  <main class="grid">
${cards}
  </main>
</body>
</html>
`;
}

async function main() {
  const baseUrl = resolveBaseUrl();
  const fromSeedOnly = process.argv.slice(2).includes('--from-seed');
  console.log(`Base URL: ${baseUrl}`);

  const pois = await loadPois(baseUrl, fromSeedOnly);
  const source = pois[0]?.source ?? 'unknown';
  console.log(`Nguồn danh sách: ${source === 'api' ? 'API /api/content/pois' : 'seed R__seed_demo.sql'}`);

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const cells = [];
  for (const poi of pois) {
    const name = poi.name || poi.title || `POI ${poi.id}`;
    const token = poi.token;
    const qrContent = buildPlaceQrContent(baseUrl, token);
    const pngName = `${poi.id}-${slugify(name)}.png`;

    await QRCode.toFile(path.join(outputDir, pngName), qrContent, {
      type: 'png',
      width: QR_WIDTH_PX,
      margin: QR_MARGIN_MODULES,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a1a1a', light: '#ffffff' },
    });

    cells.push({ pngName, name, id: poi.id, token, qrContent });
    console.log(`  + ${pngName}`);
  }

  const generatedAt = new Date().toISOString();
  await writeFile(path.join(outputDir, 'index.html'), renderHtml(baseUrl, cells, generatedAt), 'utf8');

  console.log(`\nĐã tạo ${cells.length} mã QR trong: ${outputDir}`);
  console.log(`Mở trang in: ${path.join(outputDir, 'index.html')}`);
}

main().catch((err) => {
  console.error(`Lỗi: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
