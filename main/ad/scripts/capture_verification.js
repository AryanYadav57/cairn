const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const AD_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(AD_DIR, 'out');
const CHECKLIST_TIMES = [4, 12, 20, 28, 36, 44, 51, 58];

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. Simple static HTTP server
function startServer(port = 8765) {
  return new Promise((resolve) => {
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

    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}/`);
      resolve(server);
    });
  });
}

async function capture() {
  const server = await startServer(8765);
  console.log("Launching headless Chrome...");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log("Navigating to ad page with record mode...");
  await page.goto('http://localhost:8765/index.html?record=1', { waitUntil: 'networkidle0' });

  // Ensure fonts and rendering ready
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  console.log("Capturing quality checklist screenshots...");
  for (const t of CHECKLIST_TIMES) {
    const padT = String(t).padStart(2, '0');
    console.log(`Rendering frame at t=${t}s...`);

    await page.evaluate((targetTime) => {
      window.seekTo(targetTime);
    }, t);

    // Let any RAF or styles settle
    await new Promise(r => setTimeout(r, 150));

    const filename = `cairn-ad-t${padT}s.png`;
    const outPath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`Saved screenshot: ${filename}`);
  }

  await browser.close();
  server.close();
  console.log("All checklist screenshots saved to ad/out/ !");
}

capture().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
