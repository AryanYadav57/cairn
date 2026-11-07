const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Normalize line breaks for matching
content = content.replace(/\r\n/g, '\n');

// 1. Update CSS
const cssTarget = `    /* Wordmark builder helper */
    .cairn-wordmark-exact {
      font-family: 'Inter Tight', 'Inter', sans-serif;
      font-weight: 750;
      letter-spacing: -0.04em;
      color: #FFFFFF;
      display: inline-flex;
      align-items: baseline;
    }
    .cairn-wordmark-exact .i-wrap {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      position: relative;
    }
    .cairn-wordmark-exact .mint-dot {
      width: 0.2em;
      height: 0.2em;
      border-radius: 50%;
      background: #3EE8B5;
      box-shadow: 0 0 16px #3EE8B5;
      margin-bottom: 0.12em;
    }`;

const cssReplacement = `    /* Wordmark builder helper */
    .cairn-wordmark-exact {
      font-family: 'Inter Tight', 'Inter', sans-serif;
      font-weight: 750;
      letter-spacing: -0.04em;
      color: #FFFFFF;
      display: inline-flex;
      align-items: baseline;
      font-feature-settings: "cv11" 1, "ss01" 1;
      line-height: 1;
    }
    .cairn-wordmark-exact .i-wrap {
      display: inline-block;
      position: relative;
      line-height: 1;
    }
    .cairn-wordmark-exact .mint-dot {
      position: absolute;
      top: -0.22em;
      left: 50%;
      margin-left: -0.10em;
      width: 0.20em;
      height: 0.20em;
      border-radius: 50%;
      background: #3EE8B5;
      box-shadow: 0 0 16px #3EE8B5;
      pointer-events: none;
    }`;

if (!content.includes(cssTarget)) {
  console.error("cssTarget not found!");
} else {
  content = content.replace(cssTarget, cssReplacement);
}

// 2. Update Scene 1 HTML
const s1Target = `<div id="intro-logo-wordmark" class="cairn-wordmark-exact" style="font-size: 84px; opacity: 0;">
              <span>Ca</span>
              <span class="i-wrap">
                <span id="intro-dot" class="mint-dot" style="transform: translateY(-60px); opacity: 0;"></span>
                <span>ı</span>
              </span>
              <span>rn</span>
            </div>`;

const s1Replacement = `<div id="intro-logo-wordmark" class="cairn-wordmark-exact" style="font-size: 84px; opacity: 0;"><span>Ca</span><span class="i-wrap"><span id="intro-dot" class="mint-dot" style="transform: translateY(-60px); opacity: 0;"></span><span>ı</span></span><span>rn</span></div>`;

if (!content.includes(s1Target)) {
  console.error("s1Target not found!");
} else {
  content = content.replace(s1Target, s1Replacement);
}

// 3. Update Scene 8 HTML
const s8Target = `<div class="cairn-wordmark-exact" style="font-size: 96px;">
                <span>Ca</span>
                <span class="i-wrap">
                  <span class="mint-dot"></span>
                  <span>ı</span>
                </span>
                <span>rn</span>
              </div>`;

const s8Replacement = `<div class="cairn-wordmark-exact" style="font-size: 96px;"><span>Ca</span><span class="i-wrap"><span class="mint-dot"></span><span>ı</span></span><span>rn</span></div>`;

if (!content.includes(s8Target)) {
  console.error("s8Target not found!");
} else {
  content = content.replace(s8Target, s8Replacement);
}

// Write back with CRLF
fs.writeFileSync(indexPath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("ad/index.html updated successfully!");
