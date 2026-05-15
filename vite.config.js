import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'podio-local-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/proxy')) {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const targetPath = urlObj.searchParams.get('path');
            
            if (!targetPath) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing path parameter' }));
              return;
            }

            const targetUrl = `https://api.podio.com${targetPath}`;
            
            // Collect body if any
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            
            req.on('end', async () => {
              try {
                const fetchOptions = {
                  method: req.method,
                  headers: {
                    'Authorization': req.headers.authorization || '',
                    'Content-Type': 'application/json',
                  }
                };

                if (['POST', 'PUT', 'PATCH'].includes(req.method) && body) {
                  fetchOptions.body = body;
                }

                // Node 18+ fetch is global
                const podioRes = await fetch(targetUrl, fetchOptions);
                const data = await podioRes.json();

                // Expose CORS
                res.setHeader('Access-Control-Allow-Origin', '*');
                
                const limit = podioRes.headers.get('x-rate-limit-limit');
                const remaining = podioRes.headers.get('x-rate-limit-remaining');

                if (limit) {
                  res.setHeader('X-Rate-Limit-Limit', limit);
                  res.setHeader('x-rate-limit-limit', limit);
                }
                if (remaining) {
                  res.setHeader('X-Rate-Limit-Remaining', remaining);
                  res.setHeader('x-rate-limit-remaining', remaining);
                }

                res.setHeader('Access-Control-Expose-Headers', 'X-Rate-Limit-Limit, X-Rate-Limit-Remaining, x-rate-limit-limit, x-rate-limit-remaining, Content-Type');
                res.setHeader('Content-Type', 'application/json');
                
                res.statusCode = podioRes.status;
                res.end(JSON.stringify(data));
              } catch (err) {
                console.error('Local Proxy Error:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Proxy failed', details: err.message }));
              }
            });
            return; // Don't call next() for proxy requests
          }
          next();
        });
      }
    }
  ],
})
