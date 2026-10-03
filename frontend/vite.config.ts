import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const url = new URL(req.url, 'http://localhost:5173');

        // 1. Dev Server TTS Proxy: fetch Google Translate TTS and return audio/mpeg directly
        if (url.pathname === '/api/tts' || url.pathname === '/api/v1/tts') {
          const lang = url.searchParams.get('lang') || 'vi';
          const text = url.searchParams.get('text') || '';
          if (!text) {
            res.statusCode = 400;
            res.end('Missing text parameter');
            return;
          }
          try {
            const shortLang = lang.split('-')[0].toLowerCase();
            const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${shortLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
            const response = await fetch(gUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.statusCode = 200;
              res.end(Buffer.from(arrayBuffer));
              return;
            }
          } catch (err) {
            console.error('Vite TTS proxy error:', err);
          }
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevMiddleware()],
  server: {
    port: 5173,
    host: true,
  },
});
