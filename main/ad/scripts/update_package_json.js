const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.scripts = {
  ...pkg.scripts,
  "export": "node ad/scripts/export.js",
  "export:30": "node ad/scripts/export.js --fps 30",
  "preview": "node ad/scripts/preview_server.js",
  "capture:verify": "node ad/scripts/capture_verification.js"
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('package.json updated with export & preview scripts!');
