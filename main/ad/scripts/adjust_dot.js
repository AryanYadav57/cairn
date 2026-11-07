const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

content = content.replace(/top: -0.22em;/g, 'top: -0.07em;');

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Updated dot position to top: -0.07em');
