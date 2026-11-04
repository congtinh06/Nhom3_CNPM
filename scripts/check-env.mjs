#!/usr/bin/env node
/**
 * check-env.mjs — Kiểm tra .env trước khi chạy Docker Compose.
 *
 * Chặn các lỗi cấu hình từng làm hỏng "chạy 1 lệnh từ máy sạch":
 * - thiếu key bắt buộc (compose dùng cú pháp ${VAR:?}),
 * - JWT_SECRET ngắn hơn 32 ký tự (auth-service fail-closed),
 * - ADMIN_SEED_PASSWORD không đạt PasswordPolicy,
 * - PAYMENTS_MOCK_ENABLED=true khi chạy production.
 *
 * Cách dùng:
 *   node scripts/check-env.mjs
 *   node scripts/check-env.mjs --file .env.example --allow-placeholder
 *   node scripts/check-env.mjs --production
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const production = args.includes('--production');
const allowPlaceholder = args.includes('--allow-placeholder');
const fileArgIndex = args.indexOf('--file');
const filePath = resolve(
  fileArgIndex >= 0 && args[fileArgIndex + 1] ? args[fileArgIndex + 1] : join(root, '.env')
);

const REQUIRED_KEYS = [
  'MSSQL_SA_PASSWORD',
  'CONTENT_DB_PASSWORD',
  'TRANSLATION_DB_PASSWORD',
  'ANALYTICS_DB_PASSWORD',
  'AUTH_DB_PASSWORD',
  'ORDER_DB_PASSWORD',
  'RABBITMQ_DEFAULT_USER',
  'RABBITMQ_DEFAULT_PASS',
  'RABBITMQ_ERLANG_COOKIE',
  'INTERNAL_API_KEY',
  'JWT_SECRET',
];

const PLACEHOLDER_PATTERN = /^(CHANGE_ME|ChangeMe|YOUR_|PLACEHOLDER)/;

if (!existsSync(filePath)) {
  console.error(`[check-env] Không tìm thấy ${filePath}. Chạy: node scripts/setup-env.mjs`);
  process.exit(1);
}

const values = new Map();
for (const rawLine of readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const separator = line.indexOf('=');
  if (separator < 0) continue;
  values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
}

const errors = [];
const warnings = [];

for (const key of REQUIRED_KEYS) {
  const value = values.get(key);
  if (!value) errors.push(`${key} đang trống hoặc thiếu (docker compose sẽ từ chối khởi động).`);
}

const jwtSecret = values.get('JWT_SECRET') ?? '';
if (jwtSecret && jwtSecret.length < 32) {
  errors.push(`JWT_SECRET chỉ có ${jwtSecret.length} ký tự; auth-service yêu cầu tối thiểu 32.`);
}

const adminPassword = values.get('ADMIN_SEED_PASSWORD') ?? '';
if (adminPassword) {
  const policyErrors = [];
  if (adminPassword.length < 8) policyErrors.push('>=8 ký tự');
  if (!/[A-Z]/.test(adminPassword)) policyErrors.push('có chữ hoa');
  if (!/[a-z]/.test(adminPassword)) policyErrors.push('có chữ thường');
  if (!/[0-9]/.test(adminPassword)) policyErrors.push('có chữ số');
  if (policyErrors.length > 0) {
    errors.push(`ADMIN_SEED_PASSWORD không đạt PasswordPolicy: cần ${policyErrors.join(', ')}.`);
  }
}

if ((values.get('PAYMENTS_MOCK_ENABLED') ?? 'false').toLowerCase() === 'true' && production) {
  errors.push('PAYMENTS_MOCK_ENABLED=true không được phép ở production.');
}

const seedDemoEnabled = (values.get('ECHORA_SEED_DEMO') ?? 'false').toLowerCase() === 'true';
if (seedDemoEnabled && production) {
  errors.push('ECHORA_SEED_DEMO=true không được phép ở production (phải giữ false để tắt seed demo).');
}

for (const [key, value] of values) {
  if (PLACEHOLDER_PATTERN.test(value)) {
    const message = `${key} vẫn là giá trị placeholder mẫu.`;
    if (allowPlaceholder || !production) warnings.push(message);
    else errors.push(message);
  }
}

for (const warning of warnings) console.warn(`[check-env] CẢNH BÁO: ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`[check-env] LỖI: ${error}`);
  console.error('[check-env] Cấu hình chưa hợp lệ. Chạy "node scripts/setup-env.mjs" để sinh .env an toàn.');
  process.exit(1);
}

console.log(`[check-env] OK — ${filePath} hợp lệ để khởi động Docker Compose.`);
