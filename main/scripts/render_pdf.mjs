import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

function toBase64(filePath) {
  const ext = path.extname(filePath).slice(1);
  const data = fs.readFileSync(filePath);
  return `data:image/${ext === 'png' ? 'png' : ext};base64,${data.toString('base64')}`;
}

async function main() {
  const assetsDir = path.resolve(process.cwd(), 'ad/assets');
  const templatePath = path.resolve(process.cwd(), 'docs/cairn-guide.html');
  const outputPath = path.resolve(process.cwd(), 'CAIRN_SYSTEM_AND_ARCHITECTURE_GUIDE.pdf');

  console.log('Encoding brand assets to Base64...');
  const logoBase64 = toBase64(path.join(assetsDir, 'Cairn_Teal_Pyramid_Logo.png'));
  const iconBase64 = toBase64(path.join(assetsDir, 'Glowing_Mint_Pyramid_Icon.png'));
  const homeBase64 = toBase64(path.join(assetsDir, 'homepage.png'));
  const costBase64 = toBase64(path.join(assetsDir, 'costpage.png'));
  const activityBase64 = toBase64(path.join(assetsDir, 'activity_page.png'));
  const safetyBase64 = toBase64(path.join(assetsDir, 'safetypage.png'));
  const controlBase64 = toBase64(path.join(assetsDir, 'control_page.png'));

  let html = fs.readFileSync(templatePath, 'utf-8');
  html = html
    .replaceAll('{{LOGO_IMG}}', logoBase64)
    .replaceAll('{{ICON_IMG}}', iconBase64)
    .replaceAll('{{HOME_IMG}}', homeBase64)
    .replaceAll('{{COST_IMG}}', costBase64)
    .replaceAll('{{ACTIVITY_IMG}}', activityBase64)
    .replaceAll('{{SAFETY_IMG}}', safetyBase64)
    .replaceAll('{{CONTROL_IMG}}', controlBase64);

  const chromePath = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].find(p => fs.existsSync(p));

  if (!chromePath) {
    throw new Error('Chrome/Edge executable not found on Windows system');
  }

  console.log('Launching Headless Chrome:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
  
  console.log('Loading styled document into page context...');
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Rendering print PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true
  });

  await browser.close();
  const stats = fs.statSync(outputPath);
  console.log(`\n============================================================`);
  console.log(`✓ PDF GENERATION SUCCESSFUL!`);
  console.log(`File: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  console.log(`============================================================\n`);
}

main().catch(err => {
  console.error('Fatal error during PDF generation:', err);
  process.exit(1);
});
