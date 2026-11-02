#!/usr/bin/env node
/**
 * prebuild-vercel.mjs — Cập nhật frontend/vercel.json với URL backend thật.
 *
 * Chạy trước khi `vercel --prod` hoặc thêm vào script "build" của Vercel:
 *   BACKEND_ORIGIN=https://xxxx.ngrok-free.dev node scripts/prebuild-vercel.mjs
 *
 * Nếu BACKEND_ORIGIN không được đặt, script thoát mà không thay đổi file
 * (an toàn cho môi trường CI mà không cần biến này).
 *
 * Vercel không đọc biến môi trường khi sinh routes tại thời điểm deploy;
 * do đó cách đáng tin cậy nhất là sinh file vercel.json có giá trị URL cứng
 * trước khi upload — đây là lý do script này tồn tại.
 *
 * Tham khảo: https://vercel.com/docs/projects/environment-variables
 * (biến môi trường Vercel không áp dụng cho routes/rewrites trong vercel.json
 * vì các cấu hình đó được đọc tại build time, không phải request time)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const backendOrigin = process.env.BACKEND_ORIGIN;

const vercelPath = join(root, 'vercel.json');
const raw = readFileSync(vercelPath, 'utf8');
const hasPlaceholder =
  raw.includes('BACKEND_ORIGIN_PLACEHOLDER') || raw.includes('YOUR_BACKEND_URL_HERE');

if (!backendOrigin) {
  if (hasPlaceholder) {
    console.error(
      '[prebuild-vercel] BACKEND_ORIGIN chưa được đặt nhưng vercel.json vẫn còn ' +
        'BACKEND_ORIGIN_PLACEHOLDER. Bản deploy sẽ không gọi được API.\n' +
        '  Chạy: BACKEND_ORIGIN=https://api-cua-ban.example.com npm run build:vercel'
    );
    process.exit(1);
  }
  console.log('[prebuild-vercel] BACKEND_ORIGIN không được đặt — giữ nguyên vercel.json hiện tại.');
  process.exit(0);
}

// Validate URL cơ bản
try {
  new URL(backendOrigin);
} catch {
  console.error(`[prebuild-vercel] BACKEND_ORIGIN "${backendOrigin}" không phải URL hợp lệ.`);
  process.exit(1);
}

const config = JSON.parse(raw);

let changed = false;
for (const route of config.routes ?? []) {
  if (typeof route.dest === 'string' && route.dest.match(/ngrok|BACKEND_ORIGIN_PLACEHOLDER|YOUR_BACKEND_URL_HERE/)) {
    // Thay phần origin cũ bằng origin mới, giữ nguyên path
    const url = new URL(route.dest);
    const newDest = backendOrigin.replace(/\/$/, '') + url.pathname + (url.search || '');
    if (route.dest !== newDest) {
      console.log(`[prebuild-vercel] route ${route.src}: ${route.dest} → ${newDest}`);
      route.dest = newDest;
      changed = true;
    }
  }
}

if (changed) {
  writeFileSync(vercelPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  console.log('[prebuild-vercel] vercel.json đã được cập nhật.');
} else {
  console.log('[prebuild-vercel] Không có route nào cần cập nhật.');
}
