#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vercelPath = join(root, 'vercel.json');

const PLACEHOLDERS = new Set(['BACKEND_ORIGIN_PLACEHOLDER', 'YOUR_BACKEND_URL_HERE']);

const readVar = (name) => (process.env[name] ?? '').trim();

function parseOrigin(value) {
  if (!value || PLACEHOLDERS.has(value)) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : '';
  } catch {
    return '';
  }
}

const rawOrigin = readVar('BACKEND_ORIGIN');
const backendOrigin = parseOrigin(rawOrigin);
const vercelEnv = readVar('VERCEL_ENV');
const canSkip = vercelEnv === 'preview' || vercelEnv === 'development';

if (!backendOrigin) {
  if (canSkip) {
    console.warn(
      '[prebuild-vercel] Không có BACKEND_ORIGIN cho bản Preview, bỏ qua cập nhật vercel.json.'
    );
    process.exit(0);
  }

  if (rawOrigin && !PLACEHOLDERS.has(rawOrigin)) {
    console.error(`[prebuild-vercel] BACKEND_ORIGIN "${rawOrigin}" không phải URL hợp lệ.`);
  } else {
    console.error(
      '[prebuild-vercel] Thiếu BACKEND_ORIGIN.\n' +
        '  Đặt biến môi trường BACKEND_ORIGIN trên Vercel bằng origin backend,\n' +
        '  ví dụ: https://xxxx.ngrok-free.dev, rồi deploy lại.'
    );
  }
  process.exit(1);
}

const config = JSON.parse(readFileSync(vercelPath, 'utf8').replace(/^\uFEFF/, ''));
let changed = false;

for (const route of config.routes ?? []) {
  if (typeof route.dest !== 'string' || !/^https?:\/\//.test(route.dest)) continue;

  const current = new URL(route.dest);
  const next = backendOrigin + current.pathname + current.search;

  if (route.dest !== next) {
    console.log(`[prebuild-vercel] route ${route.src}: ${route.dest} → ${next}`);
    route.dest = next;
    changed = true;
  }
}

if (changed) {
  writeFileSync(vercelPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  console.log('[prebuild-vercel] Đã cập nhật vercel.json.');
} else {
  console.log('[prebuild-vercel] Không có route nào cần cập nhật.');
}
