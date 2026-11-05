// Kiểm tra danh sách route SPA trong nginx.conf và vercel.json khớp với App.tsx.
// Chạy: npm run check:spa-routes
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8').replace(/^\uFEFF/, '');

const app = read('src/App.tsx');
const nginx = read('nginx.conf');
const vercel = JSON.parse(read('vercel.json'));

const expected = new Set();

// <Route path="..."> trong App.tsx (kể cả path nằm ở dòng sau).
for (const match of app.matchAll(/<Route\s+path="([^"]+)"/g)) {
  const path = match[1];
  if (path === '*') continue;
  const prefix = path.split('/')[1];
  if (prefix) expected.add(prefix);
}

// Các route modal đăng nhập/đăng ký không khai báo bằng <Route>.
const authModal = app.match(/const isAuthModalRoute = \[([^\]]*)\]/);
if (authModal) {
  for (const match of authModal[1].matchAll(/'([^']+)'/g)) {
    const prefix = match[1].split('/')[1];
    if (prefix) expected.add(prefix);
  }
}

const parseAlternatives = (pattern, source) => {
  const match = pattern.exec(source);
  if (!match) return null;
  return new Set(match[1].split('|'));
};

const nginxRoutes = parseAlternatives(/location ~ \^\/\(([^)]*)\)\(\/\|\$\)/, nginx);
const vercelRoute = vercel.routes.find(
  (route) => route.dest === '/index.html' && typeof route.src === 'string' && route.src.startsWith('/('),
);
const vercelRoutes = vercelRoute
  ? new Set(vercelRoute.src.slice(2, vercelRoute.src.indexOf(')')).split('|'))
  : null;

const report = (name, actual) => {
  if (!actual) {
    console.error(`FAIL: khong tim thay danh sach route SPA trong ${name}`);
    return false;
  }
  const missing = [...expected].filter((route) => !actual.has(route));
  const extra = [...actual].filter((route) => !expected.has(route));
  if (missing.length) console.error(`FAIL: ${name} thieu route: ${missing.join(', ')}`);
  if (extra.length) console.error(`FAIL: ${name} co route khong dung trong App.tsx: ${extra.join(', ')}`);
  return missing.length === 0 && extra.length === 0;
};

const nginxOk = report('nginx.conf', nginxRoutes);
const vercelOk = report('vercel.json', vercelRoutes);

if (!nginxOk || !vercelOk) process.exit(1);
console.log(`OK: ${expected.size} route SPA khop giua App.tsx, nginx.conf va vercel.json.`);
