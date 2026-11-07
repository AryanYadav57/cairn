const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Add audio element before HUD controls
const audioTag = `<audio id="bg-audio-music" src="audio/music.wav" preload="auto"></audio>\n\n    <!-- ====================================================================\n         PLAYER CONTROLS & HUD`;
if (!content.includes('id="bg-audio-music"')) {
  content = content.replace('    <!-- ====================================================================\n         PLAYER CONTROLS & HUD', audioTag);
}

// 2. Update player controls to hook audio
const oldPlayFunc = `function play() {
  if (currentTime >= CONFIG.totalDuration) currentTime = 0;
  isPlaying = true;
  iconPlay.style.display = 'none';
  iconPause.style.display = 'block';
  lastTimestamp = performance.now();
  requestAnimationFrame(loop);
}

function pause() {
  isPlaying = false;
  iconPlay.style.display = 'block';
  iconPause.style.display = 'none';
}`;

const newPlayFunc = `const bgAudio = document.getElementById('bg-audio-music');

function play() {
  if (currentTime >= CONFIG.totalDuration) currentTime = 0;
  isPlaying = true;
  iconPlay.style.display = 'none';
  iconPause.style.display = 'block';
  lastTimestamp = performance.now();
  if (bgAudio && !document.body.classList.contains('record-mode')) {
    bgAudio.currentTime = currentTime;
    bgAudio.play().catch(() => {});
  }
  requestAnimationFrame(loop);
}

function pause() {
  isPlaying = false;
  iconPlay.style.display = 'block';
  iconPause.style.display = 'none';
  if (bgAudio) {
    bgAudio.pause();
  }
}`;

content = content.replace(oldPlayFunc, newPlayFunc);

// 3. Update seekTo to sync audio
const oldSeekFunc = `function seekTo(t) {
  currentTime = clamp(t, 0, CONFIG.totalDuration);
  renderFrame(currentTime);
  if (currentTime >= CONFIG.totalDuration && isPlaying) {
    pause();
  }
}`;

const newSeekFunc = `function seekTo(t) {
  currentTime = clamp(t, 0, CONFIG.totalDuration);
  renderFrame(currentTime);
  if (bgAudio && !document.body.classList.contains('record-mode')) {
    if (Math.abs(bgAudio.currentTime - currentTime) > 0.15) {
      bgAudio.currentTime = currentTime;
    }
  }
  if (currentTime >= CONFIG.totalDuration && isPlaying) {
    pause();
  }
}`;

content = content.replace(oldSeekFunc, newSeekFunc);

// 4. Update startup logic
const oldStartup = `const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('record') === '1') {
  document.body.classList.add('record-mode');
}

const paramT = parseFloat(urlParams.get('t'));
if (!isNaN(paramT)) {
  seekTo(paramT);
  pause();
} else {
  seekTo(0);
  play();
}`;

const newStartup = `const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('record') === '1') {
  document.body.classList.add('record-mode');
  seekTo(0);
  pause();
} else {
  const paramT = parseFloat(urlParams.get('t'));
  if (!isNaN(paramT)) {
    seekTo(paramT);
    pause();
  } else {
    seekTo(0);
    play();
  }
}`;

content = content.replace(oldStartup, newStartup);

fs.writeFileSync(indexPath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('Audio and record-mode startup updated in ad/index.html');
