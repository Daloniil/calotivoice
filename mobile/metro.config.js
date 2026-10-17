const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const { loadCaloriVoiceEnv } = require('./scripts/load-root-env');
const { sendOtpViaSes } = require('./scripts/ses-send-otp');

loadCaloriVoiceEnv();

const config = getDefaultConfig(__dirname);

function handleOtpSend(req, res, next, middleware) {
  const url = req.url?.split('?')[0];
  if (url !== '/auth/otp/send' || (req.method || 'GET').toUpperCase() !== 'POST') {
    return middleware(req, res, next);
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    void (async () => {
      let payload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      } catch {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'invalid json' }));
        return;
      }

      const email = String(payload.email || '')
        .trim()
        .toLowerCase();
      const code = String(payload.code || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'invalid email or code' }));
        return;
      }

      try {
        await sendOtpViaSes({ to: email, code });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: err instanceof Error ? err.message : 'ses send failed',
          }),
        );
      }
    })();
  });
}

const PROXIES = [
  { prefix: '/stt', port: 8080, hint: 'backend/scripts/docker-up.sh' },
  { prefix: '/guard', port: 8082, hint: 'backend/scripts/docker-up.sh' },
  { prefix: '/intake', port: 8083, hint: 'backend/scripts/docker-up.sh' },
  { prefix: '/foods', port: 8084, hint: 'backend/scripts/docker-up.sh' },
];

function proxyToLocalPort(prefix, port, failHint) {
  return (req, res, next, middleware) => {
    if (!req.url?.startsWith(prefix)) {
      return middleware(req, res, next);
    }

    const targetPath = req.url.replace(new RegExp(`^${prefix}`), '') || '/';
    const method = (req.method || 'GET').toUpperCase();

    const forward = (body) => {
      const headers = { ...req.headers, host: `127.0.0.1:${port}` };
      delete headers.connection;
      delete headers['content-length'];
      if (body.length > 0) {
        headers['content-length'] = String(body.length);
      }

      const proxyReq = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: targetPath,
          method,
          headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on('error', () => {
        res.statusCode = 502;
        res.end(`Backend not running on :${port}. Start ${failHint}`);
      });

      proxyReq.end(body.length > 0 ? body : undefined);
    };

    // GET/HEAD: не ждём body — иначе polling /v1/intake/{id} может зависнуть.
    if (method === 'GET' || method === 'HEAD') {
      forward(Buffer.alloc(0));
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => forward(Buffer.concat(chunks)));
  };
}

/** Expo Go: app → Metro :8081 → Go proxies + dev SES OTP send */
config.server.enhanceMiddleware = (middleware) => {
  const withProxies = PROXIES.reduce(
    (next, p) => (req, res, n) => proxyToLocalPort(p.prefix, p.port, p.hint)(req, res, n, next),
    middleware,
  );
  return (req, res, next) => handleOtpSend(req, res, next, withProxies);
};

module.exports = config;
