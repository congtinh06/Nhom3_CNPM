/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function rssNewsPlugin(): Plugin {
  return {
    name: 'vite-rss-news-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || '';
        if (urlStr.startsWith('/api/content/news')) {
          try {
            const { fetchAndCacheRssArticles } = await import('./src/services/rssNewsServer');
            const articles = await fetchAndCacheRssArticles();
            const parsedUrl = new URL(urlStr, 'http://localhost:5173');
            const category = parsedUrl.searchParams.get('category');
            const limit = parseInt(parsedUrl.searchParams.get('limit') || '0', 10);
            const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

            // Single article detail request: /api/content/news/{slug}
            if (pathParts.length > 3) {
              const slug = pathParts[3];
              const article = articles.find((a) => a.slug === slug);
              if (article) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(article));
                return;
              } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: 'Article not found' }));
                return;
              }
            }

            let filtered = articles;
            if (category && category !== 'all') {
              filtered = filtered.filter((a) => a.category === category);
            }
            if (limit && limit > 0) {
              filtered = filtered.slice(0, limit);
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                items: filtered,
                total: articles.length,
                announcement:
                  'Thông báo: Tuyến khám phá di sản trung tâm Quận 1 cập nhật thêm thông tin và câu chuyện mới phục vụ du khách.',
              })
            );
            return;
          } catch {
            next();
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), rssNewsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
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
  },
});
