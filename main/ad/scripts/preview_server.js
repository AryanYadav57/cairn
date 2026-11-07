#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const AD_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(AD_DIR, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.svg': 'image/svg+xml'
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  CAIRN PRODUCT AD — INTERACTIVE HTML PREVIEW`);
  console.log(`======================================================`);
  console.log(`URL: http://localhost:${PORT}/index.html`);
  console.log(`\nKeyboard Shortcuts:`);
  console.log(`  [Space]       Play / Pause`);
  console.log(`  [R]           Restart from beginning`);
  console.log(`  [F]           Toggle Fullscreen`);
  console.log(`  [H]           Hide / Show playback controls`);
  console.log(`\nURL Parameters:`);
  console.log(`  ?t=SECONDS    Instant seek (e.g. http://localhost:${PORT}/index.html?t=12)`);
  console.log(`  ?record=1     Clean capture mode (HUD hidden)`);
  console.log(`======================================================\n`);
});
