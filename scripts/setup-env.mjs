#!/usr/bin/env node
/**
 * setup-env.mjs — Sinh file .env từ .env.example với secret ngẫu nhiên.
 *
 * Mục tiêu: máy sạch chỉ cần 1 lệnh là có cấu hình hợp lệ để `docker compose up`.
 * Script KHÔNG in secret ra stdout. Nếu .env đã tồn tại, script giữ nguyên giá trị
 * hiện có và chỉ bổ sung các key còn thiếu từ .env.example (secret thiếu được sinh ngẫu nhiên).
 * Dùng --force để ghi đè toàn bộ.
 *
 * Cách dùng:
 *   node scripts/setup-env.mjs
 *   node scripts/setup-env.mjs --force
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const force = process.argv.includes('--force');

const examplePath = join(root, '.env.example');
const envPath = join(root, '.env');
const frontendExamplePath = join(root, 'frontend', '.env.example');
const frontendEnvPath = join(root, 'frontend', '.env');

const hex = (bytes) => randomBytes(bytes).toString('hex');
const base64url = (bytes) => randomBytes(bytes).toString('base64url');

/** Mật khẩu thoả PasswordPolicy: >=8 ký tự, có chữ hoa, chữ thường và chữ số. */
const strongPassword = () => `Ec1${hex(12)}`;

const generated = {
  MSSQL_SA_PASSWORD: strongPassword(),
  CONTENT_DB_PASSWORD: strongPassword(),
  TRANSLATION_DB_PASSWORD: strongPassword(),
  ANALYTICS_DB_PASSWORD: strongPassword(),
  AUTH_DB_PASSWORD: strongPassword(),
  ORDER_DB_PASSWORD: strongPassword(),
  RABBITMQ_DEFAULT_PASS: strongPassword(),
  RABBITMQ_ERLANG_COOKIE: hex(16),
  INTERNAL_API_KEY: hex(32),
  JWT_SECRET: base64url(48),
  ADMIN_SEED_PASSWORD: strongPassword(),
  SEED_TEST_USER_PASSWORD: strongPassword(),
};

function upsert(lines, key, value) {
  const pattern = new RegExp(`^${key}=`);
  const index = lines.findIndex((line) => pattern.test(line));
  if (index >= 0) {
    lines[index] = `${key}=${value}`;
  } else {
    lines.push(`${key}=${value}`);
  }
}

if (!existsSync(examplePath)) {
  console.error('[setup-env] Không tìm thấy .env.example.');
  process.exit(1);
}

if (existsSync(envPath) && !force) {
  const envLines = readFileSync(envPath, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const present = new Set();
  for (const line of envLines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (match) present.add(match[1]);
  }

  const added = [];
  const additions = [];
  for (const line of readFileSync(examplePath, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match || present.has(match[1])) continue;
    const key = match[1];
    const value = Object.hasOwn(generated, key) ? generated[key] : line.slice(line.indexOf('=') + 1);
    additions.push(`${key}=${value}`);
    added.push(key);
    present.add(key);
  }

  if (added.length > 0) {
    const body = envLines.join('\n').replace(/\n*$/, '');
    writeFileSync(envPath, `${body}\n${additions.join('\n')}\n`, 'utf8');
    console.log(`[setup-env] Đã bổ sung ${added.length} key còn thiếu vào .env: ${added.join(', ')}`);
  } else {
    console.log('[setup-env] .env đã tồn tại và đủ key — không thay đổi.');
  }
} else {
  const lines = readFileSync(examplePath, 'utf8').replace(/\r\n/g, '\n').split('\n');
  for (const [key, value] of Object.entries(generated)) {
    upsert(lines, key, value);
  }
  writeFileSync(envPath, `${lines.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
  console.log('[setup-env] Đã tạo .env với secret ngẫu nhiên (không in giá trị ra màn hình).');
}

if (existsSync(frontendExamplePath) && !existsSync(frontendEnvPath)) {
  writeFileSync(
    frontendEnvPath,
    readFileSync(frontendExamplePath, 'utf8').replace(/\r\n/g, '\n'),
    'utf8'
  );
  console.log('[setup-env] Đã tạo frontend/.env từ frontend/.env.example.');
}

console.log('[setup-env] Bước tiếp theo: node scripts/check-env.mjs && docker compose up -d --build');
