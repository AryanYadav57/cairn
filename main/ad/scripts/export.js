#!/usr/bin/env node
/**
 * ============================================================================
 * CAIRN PRODUCT AD EXPORTER (1080p60 / 1080p30 H.264 MP4)
 * ============================================================================
 * 
 * Deterministic frame-by-frame renderer using headless Chrome via Puppeteer-Core,
 * piped into FFmpeg (H.264, yuv420p, CRF 14, AAC audio mux).
 * 
 * Usage:
 *   npm run export                            # Full 60.0s at 60fps -> ad/out/cairn-ad-1080p60.mp4
 *   npm run export:30                         # Full 60.0s at 30fps -> ad/out/cairn-ad-1080p30.mp4
 *   node ad/scripts/export.js --duration 5    # Quick 5-second test render
 *   node ad/scripts/export.js --png           # Lossless PNG pipe (slower)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

// Parse CLI Arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${name}`) {
      return args[i + 1] !== undefined ? args[i + 1] : true;
    }
    if (args[i].startsWith(`--${name}=`)) {
      return args[i].split('=')[1];
    }
  }
  return defaultValue;
}

const hasFlag = (name) => args.includes(`--${name}`);

const FPS = parseInt(getArg('fps', '60'), 10);
const DURATION = parseFloat(getArg('duration', '60.0'));
const START_TIME = parseFloat(getArg('start', '0.0'));
const END_TIME = parseFloat(getArg('end', String(DURATION)));
const CRF = getArg('crf', '14');
const PRESET = getArg('preset', 'fast');
const USE_PNG = hasFlag('png');
const FORMAT = USE_PNG ? 'png' : 'jpeg';

const AD_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(AD_DIR, 'out');
const DEFAULT_OUT = path.join(OUT_DIR, `cairn-ad-1080p${FPS}.mp4`);
const OUT_PATH = path.resolve(process.cwd(), getArg('out', DEFAULT_OUT));
const AUDIO_PATH = path.join(AD_DIR, 'audio', 'music.wav');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1. Locate Chrome / Chromium Executable
function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('Could not find Google Chrome executable. Please set PUPPETEER_EXECUTABLE_PATH.');
}

// 2. Locate FFmpeg Executable
function findFFmpeg() {
  const localRemotionFfmpeg = path.resolve(
    __dirname,
    '../../node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
  );
  if (fs.existsSync(localRemotionFfmpeg)) {
    return localRemotionFfmpeg;
  }
  return 'ffmpeg';
}

// 3. Static HTTP Server for local assets
function startServer() {
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

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

// Main Export Pipeline
async function exportVideo() {
  const chromePath = findChrome();
  const ffmpegPath = findFFmpeg();
  const hasAudio = fs.existsSync(AUDIO_PATH);

  const startFrame = Math.round(START_TIME * FPS);
  const endFrame = Math.round(END_TIME * FPS);
  const totalFrames = endFrame - startFrame;

  console.log('='.repeat(70));
  console.log('  CAIRN PRODUCT AD EXPORTER');
  console.log('='.repeat(70));
  console.log(`Resolution  : 1920x1080 (16:9)`);
  console.log(`Framerate   : ${FPS} fps`);
  console.log(`Time Range  : ${START_TIME.toFixed(2)}s to ${END_TIME.toFixed(2)}s (${totalFrames} frames)`);
  console.log(`H.264 CRF   : ${CRF} (Preset: ${PRESET}, Pixel Format: yuv420p)`);
  console.log(`Pipe Format : ${FORMAT === 'jpeg' ? 'JPEG (quality 98)' : 'PNG'}`);
  console.log(`Audio Track : ${hasAudio ? 'Included (' + AUDIO_PATH + ')' : 'None found'}`);
  console.log(`Output Path : ${OUT_PATH}`);
  console.log(`Chrome Path : ${chromePath}`);
  console.log(`FFmpeg Path : ${ffmpegPath}`);
  console.log('-'.repeat(70));

  const { server, port } = await startServer();
  const url = `http://127.0.0.1:${port}/index.html?record=1`;

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--window-size=1920,1080',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log(`Navigating to stage (${url})...`);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));

  // Build FFmpeg spawn arguments
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', FORMAT === 'jpeg' ? 'mjpeg' : 'png',
    '-r', String(FPS),
    '-i', '-',
  ];

  if (hasAudio) {
    ffmpegArgs.push('-i', AUDIO_PATH);
  }

  ffmpegArgs.push(
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', String(CRF),
    '-preset', PRESET
  );

  if (hasAudio) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  }

  ffmpegArgs.push(OUT_PATH);

  console.log('Starting FFmpeg encoder process...');
  const ffmpeg = spawn(ffmpegPath, ffmpegArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

  let ffmpegErr = '';
  ffmpeg.stderr.on('data', (d) => {
    ffmpegErr += d.toString();
  });

  const ffmpegExitPromise = new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}.\n${ffmpegErr}`));
    });
    ffmpeg.on('error', reject);
  });

  async function writeFrame(buffer) {
    if (!ffmpeg.stdin.write(buffer)) {
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    }
  }

  console.log('Beginning deterministic frame capture...\n');
  const startTimeMs = Date.now();
  let lastLogTime = 0;

  const screenshotOpts = FORMAT === 'jpeg' ? { type: 'jpeg', quality: 98 } : { type: 'png' };

  for (let frame = startFrame; frame < endFrame; frame++) {
    const t = frame / FPS;

    // Deterministically seek animation state
    await page.evaluate((targetT) => {
      window.seekTo(targetT);
    }, t);

    // Capture exact 1920x1080 frame
    const frameBuffer = await page.screenshot(screenshotOpts);
    await writeFrame(frameBuffer);

    const completed = frame - startFrame + 1;
    const now = Date.now();
    if (now - lastLogTime > 1000 || completed === totalFrames) {
      lastLogTime = now;
      const elapsedSec = (now - startTimeMs) / 1000;
      const fpsRate = completed / elapsedSec;
      const remainingSec = (totalFrames - completed) / Math.max(fpsRate, 0.1);
      const pct = ((completed / totalFrames) * 100).toFixed(1);

      process.stdout.write(
        `\r[Frame ${String(completed).padStart(String(totalFrames).length, ' ')}/${totalFrames}] ` +
        `${pct.padStart(5, ' ')}% | t=${t.toFixed(2)}s | ` +
        `${fpsRate.toFixed(1)} fps | ` +
        `Elapsed: ${formatDuration(elapsedSec)} | ` +
        `ETA: ${formatDuration(remainingSec)}    `
      );
    }
  }

  process.stdout.write('\n\nFinalizing encode & flushing buffers...\n');
  ffmpeg.stdin.end();
  await ffmpegExitPromise;

  await browser.close();
  server.close();

  const totalTimeSec = ((Date.now() - startTimeMs) / 1000).toFixed(1);
  const stat = fs.statSync(OUT_PATH);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);

  console.log('-'.repeat(70));
  console.log(`\x1b[32m✔ EXPORT COMPLETE!\x1b[0m`);
  console.log(`Video file : ${OUT_PATH}`);
  console.log(`File size  : ${sizeMb} MB`);
  console.log(`Total time : ${totalTimeSec} seconds`);
  console.log('='.repeat(70));
}

exportVideo().catch((err) => {
  console.error('\n\x1b[31mExport failed:\x1b[0m', err);
  process.exit(1);
});
