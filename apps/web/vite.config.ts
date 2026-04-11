import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import type { IncomingMessage } from 'http';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'smartspend-dev-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url ?? '';

            if (url.startsWith('/api/anthropic') && req.method === 'POST') {
              const key = env.ANTHROPIC_API_KEY;
              if (!key) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: 'ANTHROPIC_API_KEY is not set (use apps/web/.env for local dev)',
                  }),
                );
                return;
              }
              try {
                const body = await readBody(req);
                const r = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01',
                  },
                  body,
                });
                const text = await r.text();
                res.statusCode = r.status;
                const ct = r.headers.get('content-type');
                if (ct) res.setHeader('Content-Type', ct);
                res.end(text);
              } catch (e) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: String(e) }));
              }
              return;
            }

            if (url.startsWith('/api/validate-unlock-pin') && req.method === 'POST') {
              const devPin = env.DEV_UNLOCK_PIN ?? '1234';
              try {
                const body = JSON.parse(await readBody(req)) as { pin?: string };
                const ok = body?.pin === devPin;
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = ok ? 200 : 401;
                res.end(JSON.stringify({ ok }));
              } catch {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false }));
              }
              return;
            }

            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
