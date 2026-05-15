// Vercel / Netlify Serverless Proxy for Podio API
// This solves CORS issues and exposes rate limit headers to the browser.

export default async function handler(req, res) {
  // 1. Set CORS headers to allow requests from the frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const url = `https://api.podio.com${path}`;

  try {
    const podioResponse = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    // 2. Extract and Normalize headers
    // We send both casing versions to be safe with different hosting platforms
    const limit = podioResponse.headers.get('x-rate-limit-limit');
    const remaining = podioResponse.headers.get('x-rate-limit-remaining');

    if (limit) {
      res.setHeader('X-Rate-Limit-Limit', limit);
      res.setHeader('x-rate-limit-limit', limit);
    }
    if (remaining) {
      res.setHeader('X-Rate-Limit-Remaining', remaining);
      res.setHeader('x-rate-limit-remaining', remaining);
    }

    // 3. Crucial: Tell the browser it's okay to see these headers
    res.setHeader('Access-Control-Expose-Headers', 'X-Rate-Limit-Limit, X-Rate-Limit-Remaining, x-rate-limit-limit, x-rate-limit-remaining, Content-Type');

    const data = await podioResponse.json();
    res.status(podioResponse.status).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Proxy failed to reach Podio', details: error.message });
  }
}
