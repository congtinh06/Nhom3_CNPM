/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Tự động nạp biến môi trường từ cả root repo (..) và frontend/
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const localEnv = loadEnv(mode, __dirname, '');

  const googleClientId =
    localEnv.VITE_GOOGLE_CLIENT_ID ||
    localEnv.GOOGLE_CLIENT_ID ||
    rootEnv.VITE_GOOGLE_CLIENT_ID ||
    rootEnv.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID;

  if (googleClientId && !process.env.VITE_GOOGLE_CLIENT_ID) {
    process.env.VITE_GOOGLE_CLIENT_ID = googleClientId;
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      // Cho phép mở dev server qua tunnel HTTPS (ngrok) để điện thoại quét QR.
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
      proxy: {
        '/api': {
          target: 'http://localhost:18080',
          changeOrigin: true,
        },
        '/img/products': {
          target: 'http://localhost:18080',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      testTimeout: 10000,
      coverage: {
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        // Gate cho `npm run test:coverage`. Ngưỡng dưới số liệu thật 76.76% lines / 72.24% branches
        // / 59.58% funcs (run 2026-11-02), đặt lỏng để tránh chặn CI khi coverage tăng thêm.
        thresholds: {
          statements: 70,
          branches: 65,
          functions: 50,
          lines: 70,
        },
      },
    },
    build: {
      // Tách thư viện lớn khỏi bundle chính để trang du khách tải nhanh hơn.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet')) return 'vendor-map';
            if (id.includes('recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
            if (id.includes('gsap') || id.includes('lenis')) return 'vendor-motion';
            if (id.includes('qrcode') || id.includes('qr-scanner')) return 'vendor-qr';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('axios')) return 'vendor-http';
            return 'vendor';
          },
        },
      },
    },
  };
});
