// server.js - Local Dev Server mimicking Vercel Serverless Functions
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load local .env if available
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

const PORT = process.env.PORT || 3000;

// Import serverless functions
const authHandler = require('./api/auth');
const manifestHandler = require('./api/manifest');
const fileHandler = require('./api/file');
const zipHandler = require('./api/zip');
const searchHandler = require('./api/search');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  req.query = parsedUrl.query;

  // Enhance res with status and json
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };
  res.send = (body) => {
    res.end(body);
  };

  // 1. API Routes
  if (pathname === '/api/auth/verify') {
    return authHandler(req, res);
  }
  if (pathname.startsWith('/api/v1/manifest/')) {
    const appId = pathname.replace('/api/v1/manifest/', '').split('/')[0];
    req.query.appId = appId;
    return manifestHandler(req, res);
  }
  if (pathname === '/api/v1/search') {
    return searchHandler(req, res);
  }
  if (pathname.startsWith('/api/files/')) {
    const parts = pathname.replace('/api/files/', '').split('/');
    const appId = parts[0];
    const sub = parts[1];
    req.query.appId = appId;

    if (sub === 'zip') {
      return zipHandler(req, res);
    }
    if (sub === 'lua') {
      req.query.type = 'lua';
      return fileHandler(req, res);
    }
    if (sub === 'key') {
      req.query.type = 'key';
      return fileHandler(req, res);
    }
    if (sub === 'manifest') {
      req.query.type = 'manifest';
      req.query.file = decodeURIComponent(parts[2] || '');
      return fileHandler(req, res);
    }
  }

  // 2. Static Files from public/
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 500;
      res.end('500 Server Error');
      return;
    }
    res.setHeader('Content-Type', contentType);
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`🌸 WhoziaoHub (Hu Tao Edition) running at: http://localhost:${PORT}`);
});
