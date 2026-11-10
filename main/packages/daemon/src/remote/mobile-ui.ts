export function renderMobileRemoteHtml(params: {
  pairingToken: string;
  projectName: string;
  lanUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Cairn — A Cairn Studios Project</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/brand/cairn-icon.jpg" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #000000;
      --surface: #070709;
      --surface-elevated: #0e0f13;
      --surface-hover: #16181f;
      --line-solid: rgba(255, 255, 255, 0.14);
      --line-dashed: rgba(255, 255, 255, 0.10);
      --line-strong: rgba(255, 255, 255, 0.24);
      --text: #ffffff;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --silver-bg: rgba(255, 255, 255, 0.06);
      --silver-border: rgba(255, 255, 255, 0.16);
      --silver-text: #e4e4e7;
      --brand-blue: #0069fd;
      --brand-blue-rgb: 0, 105, 253;
      --green: #60a5fa;
      --green-rgb: 96, 165, 250;
      --peacock: #3b82f6;
      --peacock-rgb: 59, 130, 246;
      --navy: #18181b;
      --navy-rgb: 24, 24, 27;
      --green-soft: rgba(0, 105, 253, 0.12);
      --peacock-soft: rgba(0, 105, 253, 0.12);
      --accent-gradient: linear-gradient(90deg, #ffffff 0%, #60a5fa 45%, #0069fd 100%);
      --accent-gradient-soft: linear-gradient(112deg, rgba(255, 255, 255, 0.06) 0%, rgba(0, 105, 253, 0.10) 100%);
      --white-blue-gradient: linear-gradient(95deg, #ffffff 0%, #93c5fd 48%, #3b82f6 100%);
      --red: #fb7185;
      --red-soft: rgba(244, 63, 94, 0.14);
      --radius: 6px;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
      --rail-width: 100%;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
    }

    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.22);
      border-radius: 99px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.38);
    }

    html, body {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      overscroll-behavior-x: none;
      position: relative;
    }

    body {
      background-color: var(--bg);
      background-attachment: fixed;
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
      padding-bottom: 40px;
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.014em;
      background-image:
        radial-gradient(ellipse at 12% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 45%),
        radial-gradient(ellipse at 88% 12%, rgba(255, 255, 255, 0.035) 0%, transparent 38%),
        linear-gradient(160deg, #101114 0%, #08090b 48%, #030304 100%);
    }

    /* ===================================================================== */
    /* ARCHITECTURAL LONG LINES SYSTEM (Full-Bleed 100vw Horizontal + Rails)  */
    /* ===================================================================== */
    .band {
      width: 100%;
      border-bottom: 1px solid var(--line-solid);
      position: relative;
    }

    .rail {
      width: 100%;
      max-width: var(--rail-width);
      margin: 0 auto;
      border-left: none;
      border-right: none;
      position: relative;
    }

    .rail::before,
    .rail::after {
      content: "";
      position: absolute;
      bottom: -4px;
      width: 7px;
      height: 7px;
      pointer-events: none;
      z-index: 5;
      display: none;
    }
    .band:not(.header-band)::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 1px;
      pointer-events: none;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.12) 12%, rgba(255,255,255,.22) 50%, rgba(255,255,255,.12) 88%, transparent 100%);
    }
    .band:not(.header-band) .rail::before,
    .band:not(.header-band) .rail::after {
      width: 9px;
      height: 9px;
      border-color: rgba(255, 255, 255, 0.34);
    }
    .rail::before {
      left: -4px;
      border-left: 1px solid rgba(255, 255, 255, 0.28);
      border-bottom: 1px solid rgba(255, 255, 255, 0.28);
    }
    .rail::after {
      right: -4px;
      border-right: 1px solid rgba(255, 255, 255, 0.28);
      border-bottom: 1px solid rgba(255, 255, 255, 0.28);
    }

    /* ===================================================================== */
    /* TOP NAVIGATION BAR (Band 1)                                           */
    /* ===================================================================== */
    .header-band {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(5, 5, 7, 0.90);
      backdrop-filter: blur(18px);
      width: 100%;
      border-bottom: 1px solid var(--line-solid);
    }

    .header-rail {
      width: 100%;
      max-width: var(--rail-width);
      margin: 0 auto;
      height: 62px;
      padding: 0 28px;
      border-left: none;
      border-right: none;
      display: grid;
      grid-template-columns: auto 1fr auto;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.045), transparent 45%),
        radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.03), transparent 45%);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      text-decoration: none;
      color: var(--text);
      cursor: pointer;
      justify-self: start;
    }

    .brand-mark {
      width: 32px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-combined-img {
      height: 28px;
      width: auto;
      display: block;
      object-fit: contain;
    }

    .brand-name {
      font-weight: 700;
      font-size: 19px;
      letter-spacing: -0.035em;
      color: #ffffff;
      display: inline-flex;
      align-items: baseline;
    }

    .brand-i-wrap {
      position: relative;
      display: inline-block;
      font-style: normal;
    }

    .brand-i-dot {
      position: absolute;
      top: 1px;
      left: 50%;
      transform: translateX(-50%);
      width: 4.5px;
      height: 4.5px;
      border-radius: 50%;
      background: #0069fd;
      box-shadow: 0 0 8px rgba(0, 105, 253, 0.85);
    }

    .brand-divider {
      color: rgba(255, 255, 255, 0.28);
      font-weight: 300;
      margin: 0 6px;
    }

    .brand-studio {
      font-size: 12.5px;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .nav-links {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      align-items: center;
      gap: 5px;
      width: 100%;
      justify-self: stretch;
      padding: 4px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 10px;
      background: rgba(255,255,255,.04);
    }

    .nav-btn {
      background: transparent;
      border: 1px solid transparent;
      border-radius: 7px;
      color: var(--text-secondary);
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 500;
      padding: 8px 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
      width: 100%;
    }

    .nav-btn:hover {
      color: var(--text);
      border-color: rgba(255, 255, 255, 0.16);
    }

    .nav-btn + .nav-btn { border-left-color: rgba(255,255,255,.075); }

    .nav-btn.active {
      color: #ffffff;
      border: 1px solid rgba(96, 165, 250, 0.45);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.16);
    }
    #tabOverview #pendingBadge { display: none; }
    .nav-btn:focus-visible { outline: 2px solid rgba(96, 165, 250, 0.75); outline-offset: 2px; }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
      justify-self: end;
    }

    .live-status {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #0069fd;
      box-shadow: 0 0 8px rgba(0, 105, 253, 0.85);
      flex-shrink: 0;
    }

    .pill-cta {
      background: #ffffff;
      color: #000000;
      border: 1px solid #ffffff;
      border-radius: 999px;
      padding: 7px 14px;
      font-family: var(--font-sans);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .pill-cta:hover {
      background: #e4e4e7;
    }

    /* ===================================================================== */
    /* BAND 2: MULTI-IDE / AGENT HARNESS AUTO-DETECTION & SWITCHER BAR       */
    /* ===================================================================== */
    .announce-rail {
      padding: 10px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12.5px;
      background:
        radial-gradient(circle at 0% 50%, rgba(255, 255, 255, 0.035), transparent 40%),
        radial-gradient(circle at 100% 50%, rgba(255, 255, 255, 0.025), transparent 40%);
    }

    .studio-tag {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: linear-gradient(180deg, rgba(96, 165, 250, 0.12) 0%, rgba(15, 23, 42, 0.32) 100%);
      border: 1px solid rgba(147, 197, 253, 0.34);
      box-shadow:
        inset 0 1px 0 rgba(191, 219, 254, 0.32),
        0 0 10px rgba(59, 130, 246, 0.14);
      color: #f4f4f5;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      padding: 5px 12px;
      border-radius: 999px;
      letter-spacing: 0.015em;
      white-space: nowrap;
    }

    .studio-tag-dot {
      width: 6.5px;
      height: 6.5px;
      border-radius: 50%;
      background: #0069fd;
      box-shadow: 0 0 8px rgba(0, 105, 253, 0.9);
      flex-shrink: 0;
    }

    .studio-tag-kicker {
      color: #93c5fd;
      font-weight: 600;
    }

    .harness-switcher {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .harness-current, .harness-select-wrap { display: none; }
    .harness-select-wrap { position: relative; }
    .harness-select {
      appearance: none;
      min-width: 190px;
      padding: 9px 34px 9px 12px;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: #0c0d11;
      color: #fff;
      font: 600 12px var(--font-sans);
      cursor: pointer;
    }
    .harness-select-wrap::after {
      content: '⌄';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-55%);
      color: var(--text-secondary);
      pointer-events: none;
    }
    .harness-select:focus-visible { outline: 2px solid #0069fd; outline-offset: 2px; }

    .harness-summary {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      width: 100%;
      padding: 16px 20px;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 12px;
      background:
        linear-gradient(180deg, #111216 0%, #0c0d10 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 24px rgba(0, 0, 0, 0.35);
      overflow: hidden;
    }
    .harness-summary::before {
      display: none;
      content: '';
      position: absolute;
      left: 0; top: 18px; bottom: 18px;
      width: 2px;
      border-radius: 0 2px 2px 0;
      background: linear-gradient(180deg, #93c5fd, #2f80ff);
      box-shadow: 0 0 10px rgba(47, 128, 255, 0.6);
    }
    .harness-summary-left { display: flex; align-items: center; gap: 16px; min-width: 0; }
    .harness-summary-icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      flex-shrink: 0;
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.10);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    .harness-summary-icon img { width: 26px; height: 26px; display: block; object-fit: contain; }
    .harness-summary-main { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
    .harness-summary-label {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #60a5fa;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .1em;
      line-height: 1;
      text-transform: uppercase;
      margin-bottom: 7px;
    }
    .harness-live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
      animation: harnessPulse 2s ease-out infinite;
    }
    @keyframes harnessPulse {
      0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
      70% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
      100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
    }
    @media (prefers-reduced-motion: reduce) { .harness-live-dot { animation: none; } }
    .harness-summary-name { color: #fff; font-size: 17px; font-weight: 650; letter-spacing: -0.01em; line-height: 1.15; }
    .harness-summary-model {
      display: inline-flex;
      align-items: baseline;
      gap: 7px;
      max-width: 100%;
      margin-top: 6px;
      line-height: 1.3;
      color: var(--text-secondary);
      font-size: 12.5px;
      overflow: hidden;
      white-space: nowrap;
    }
    .harness-summary-model strong { color: #d4d4d8; font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
    .harness-chip-key {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .harness-summary-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .harness-budget {
      --hb: #60a5fa;
      display: grid;
      gap: 5px;
      min-width: 150px;
      padding-right: 16px;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }
    .harness-budget[hidden] { display: none; }
    .harness-budget[data-state="warn"] { --hb: #f59e0b; }
    .harness-budget[data-state="over"] { --hb: #f43f5e; }
    .harness-budget-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
    .harness-budget-key { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
    .harness-budget-amt { font-family: var(--font-mono); font-size: 15px; font-weight: 600; color: #fff; font-variant-numeric: tabular-nums; }
    .harness-budget-track { height: 4px; border-radius: 999px; background: rgba(255, 255, 255, 0.08); overflow: hidden; }
    .harness-budget-track span { display: block; height: 100%; width: 0; border-radius: inherit; background: var(--hb); box-shadow: 0 0 8px var(--hb); transition: width 0.45s ease; }
    .harness-budget-scope { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-muted); }
    .panel-cell {
      background-image: linear-gradient(145deg, rgba(255, 255, 255, 0.025) 0%, rgba(0, 0, 0, 0.12) 100%);
    }
    .shortcut-group {
      border-top: 1px solid var(--line-solid);
      margin-top: 4px;
      padding-top: 15px;
    }
    .shortcut-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .shortcut-heading span:first-child { color: #60a5fa; font-size: 10.5px; letter-spacing: .1em; }
    .shortcut-heading span:last-child { color: var(--text-muted); font-size: 11px; }
    .quick-ide-grid .btn { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .icon { width: 15px; height: 15px; flex: 0 0 15px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .btn-icon { width: 15px; height: 15px; }
    .btn:active { transform: translateY(1px) scale(.985); }
    .view-enter { animation: view-enter .22s ease both; }
    @keyframes view-enter { from { opacity: .72; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .view-enter { animation: none; } .btn, .nav-btn { transition: none !important; } }

    .harness-pill {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--line-solid);
      border-radius: 999px;
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      padding: 5px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .harness-pill:hover {
      color: #ffffff;
      border-color: var(--line-strong);
    }

    .harness-pill.active {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
      font-weight: 600;
    }

    /* ===================================================================== */
    /* HERO STAGE BAND (Band 3 - Matte Obsidian Surface + 4 Cells)           */
    /* ===================================================================== */
    .hero-rail {
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.05) 0%, transparent 48%),
        radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.035) 0%, transparent 48%),
        linear-gradient(180deg, rgba(16, 17, 21, 0.65) 0%, rgba(7, 8, 10, 0.92) 100%);
    }

    .metrics-architectural-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
    }

    .metric-cell {
      min-width: 0;
      padding: 24px 26px 22px;
      border-right: 1px solid var(--line-solid);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      position: relative;
      background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.025), transparent 60%);
      transition: background 0.2s ease;
    }

    .metric-cell:last-child {
      border-right: none;
    }

    .metric-cell:hover {
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.05), transparent 65%),
        radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.03), transparent 65%);
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .metric-giant {
      font-size: 36px;
      font-weight: 600;
      letter-spacing: -0.04em;
      line-height: 1.08;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
      margin: 2px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .metric-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .agent-switcher-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin: 2px 0;
    }

    /* Custom cross-platform <select> so iOS Safari never renders a mismatched native pill */
    .agent-switcher-select,
    select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      border-radius: var(--radius);
      background-color: #0b0c10;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 11px center;
      background-size: 12px;
      border: 1px solid var(--line-strong);
      color: #ffffff;
      height: 38px;
      padding: 0 30px 0 12px;
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .agent-switcher-select {
      flex: 1;
      min-width: 0;
    }

    .agent-switcher-select option,
    .agent-switcher-select optgroup,
    select option,
    select optgroup {
      background: #090a0f;
      color: #ffffff;
      font-weight: 500;
    }

    /* + Extended Models Popover Dropdown Menu */
    .extended-dropdown-wrap {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
    }

    .extended-btn {
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--line-strong);
      color: #e4e4e7;
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      padding: 0 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .extended-btn:hover,
    .extended-btn.active {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
    }

    .extended-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      width: min(320px, calc(100vw - 32px));
      max-width: calc(100vw - 32px);
      max-height: 380px;
      overflow-y: auto;
      background: #08090d;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 8px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.92);
      z-index: 100;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-sizing: border-box;
    }

    .extended-menu-section {
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 8px 10px 4px;
      border-top: 1px solid var(--line-solid);
      margin-top: 4px;
    }

    .extended-menu-section:first-child {
      border-top: none;
      margin-top: 0;
    }

    .extended-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
      text-align: left;
      background: transparent;
      border: none;
      color: #e4e4e7;
      padding: 8px 10px;
      font-family: var(--font-sans);
      font-size: 12.5px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.12s ease;
    }

    .extended-menu-item:hover {
      background: rgba(255, 255, 255, 0.09);
      color: #ffffff;
    }

    .extended-menu-item.active {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      font-weight: 600;
    }

    .hero-status-strip {
      padding: 16px 28px;
      border-top: 1px solid var(--line-solid);
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: stretch;
      gap: 10px;
      background: rgba(255, 255, 255, 0.012);
    }

    .hero-status-card {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      padding: 14px 16px;
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 10px;
      background: linear-gradient(180deg, #111216 0%, #0a0b0e 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 8px 22px rgba(0, 0, 0, 0.32);
    }
    .hero-status-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .hero-status-label { color: #60a5fa; font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
    .hero-status-value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; min-width: 0; color: #fff; font-family: var(--font-mono); font-size: 13px; font-variant-numeric: tabular-nums; }
    .hero-status-value strong { font-size: 16px; font-weight: 650; }
    .hero-status-value span { color: var(--text-muted); font-size: 11px; }
    .hero-status-card .segment-track { width: 100%; flex: none; }
    .hero-workspace-card { justify-content: space-between; }
    .hero-workspace-name { min-width: 0; overflow: hidden; color: #fff; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; }
    .hero-quick-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    .hero-quick-btns .btn { min-height: 38px; justify-content: center; white-space: nowrap; }

    /* ===================================================================== */
    /* PROFOUND-INSPIRED EDITORIAL CARDS & LIVE 5-AGENT CONSUMPTION STRIP    */
    /* ===================================================================== */
    .ag-models-strip {
      padding: 14px 28px 16px;
      border-top: 1px solid var(--line-solid);
      background: rgba(255, 255, 255, 0.008);
    }

    .ag-models-strip-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .profound-dots {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .profound-dot {
      height: 2px;
      width: 10px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.22);
      transition: all 0.2s ease;
    }

    .profound-dot.active {
      width: 22px;
      background: var(--accent-gradient);
    }

    .ag-models-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .profound-card {
      position: relative;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.10);
      background: linear-gradient(180deg, #111216 0%, #0a0b0e 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
      padding: 13px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      cursor: pointer;
      transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
      min-width: 0;
    }

    .profound-card:hover {
      border-color: rgba(255, 255, 255, 0.24);
      transform: translateY(-1px);
    }

    .profound-card.active {
      border-color: rgba(255, 255, 255, 0.34);
      background: linear-gradient(180deg, #17191f 0%, #0d0e12 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 8px 20px rgba(0, 0, 0, 0.4);
    }

    .corner-arrow-pill {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      line-height: 1;
      flex-shrink: 0;
      transition: background 0.15s ease, transform 0.15s ease;
    }

    .profound-card:hover .corner-arrow-pill,
    .profound-card.active .corner-arrow-pill {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
      font-weight: 700;
    }

    .ledger-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 12px;
    }

    .ledger-card {
      position: relative;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.10);
      background: linear-gradient(180deg, #111216 0%, #0a0b0e 100%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      min-width: 0;
      transition: border-color 0.2s ease;
    }

    .ledger-card:hover {
      border-color: rgba(255, 255, 255, 0.26);
    }

    .ledger-stat-big {
      font-size: 32px;
      font-weight: 600;
      letter-spacing: -0.04em;
      color: #ffffff;
      line-height: 1.05;
      font-variant-numeric: tabular-nums;
    }

    .segmented-budget {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .segment-track {
      flex: 1;
      height: 5px;
      border-radius: 99px;
      background-color: rgba(255, 255, 255, 0.09);
      background-image: repeating-linear-gradient(
        90deg,
        transparent 0px,
        transparent 4px,
        rgba(0, 0, 0, 0.55) 4px,
        rgba(0, 0, 0, 0.55) 6px
      );
      position: relative;
      overflow: hidden;
    }

    .segment-fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0%;
      border-radius: 99px;
      background: var(--accent-gradient);
      transition: width 0.35s ease;
    }

    .segment-fill-green {
      background: var(--accent-gradient);
    }

    .hero-window-actions { display: none; }

    /* ===================================================================== */
    /* GFT & STAKENT INSPIRED TERMINAL / ANALYTICS STAGE (Matte Obsidian)     */
    /* ===================================================================== */
    .gft-overview-tabs {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 28px 0;
      border-top: 1px solid var(--line-solid);
      background: linear-gradient(110deg, rgba(255, 255, 255, 0.035) 0%, transparent 70%);
      flex-wrap: wrap;
    }

    .gft-tab-group {
      display: inline-flex;
      align-items: center;
      gap: 22px;
    }

    .gft-tab-item {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-muted);
      padding-bottom: 10px;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
    }

    .gft-tab-item.active {
      color: #ffffff;
      font-weight: 600;
      border-bottom-color: #ffffff;
    }

    .gft-pill-row {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .gft-micro-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.13);
      color: #d4d4d8;
    }

    .gft-micro-pill.blue {
      background: rgba(0, 105, 253, 0.10);
      border-color: rgba(0, 105, 253, 0.38);
      color: #60a5fa;
    }

    .gft-split-hero {
      display: grid;
      grid-template-columns: 1.05fr 1.35fr;
      gap: 14px;
      padding: 16px 28px;
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
      border-top: 1px solid rgba(255, 255, 255, 0.07);
    }

    .gft-hero-card {
      background: linear-gradient(180deg, #111216 0%, #0b0c0e 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 28px rgba(0, 0, 0, 0.42);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }

    .gft-hero-card.gft-cost-panel {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 55%),
        radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.025) 0%, transparent 55%),
        linear-gradient(180deg, #111216 0%, #0b0c0e 100%);
      border: 1px solid var(--line-solid);
    }

    .gft-pnl-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
      align-items: stretch;
      height: 100%;
    }

    .gft-pnl-left {
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      gap: 0;
      min-width: 0;
      height: 100%;
    }

    .gft-pnl-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: nowrap;
      padding: 18px 22px 16px;
      border-bottom: 1px solid var(--line-solid);
      background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.025), transparent 60%);
      flex: 0 0 auto;
    }

    .gft-risk-box {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--line-solid);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      font-size: 11.5px;
      font-weight: 600;
      color: #f4f4f5;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .gft-risk-Pip {
      width: 9px;
      height: 9px;
      border-radius: 2px;
      background: #3b82f6;
      box-shadow: 0 0 10px rgba(0, 105, 253, 0.7);
      flex-shrink: 0;
    }

    .gft-layer-mini-box {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
      padding: 14px 22px;
      border-radius: 0;
      background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.015), transparent 60%);
      border: none;
      border-bottom: 1px solid var(--line-solid);
      flex: 1 1 auto;
      transition: background 0.2s ease;
    }

    .gft-layer-mini-box:hover {
      background: radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.035), transparent 65%);
    }

    .gft-layer-mini-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .gft-layer-mini-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .gft-layer-mini-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
    }

    .gft-barcode-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      align-items: stretch;
      flex: 0 0 auto;
    }

    .gft-barcode-col {
      --meter-a: #93c5fd;
      --meter-b: #2f80ff;
      --meter-glow: rgba(47, 128, 255, 0.45);
      --meter-ink: #93c5fd;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
      padding: 16px 22px 18px;
      background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--meter-b) 7%, transparent), transparent 60%);
      transition: background 0.3s ease;
    }
    .gft-barcode-col[data-state="warn"] { --meter-a: #fde68a; --meter-b: #f59e0b; --meter-glow: rgba(245, 158, 11, 0.45); --meter-ink: #fcd34d; }
    .gft-barcode-col[data-state="over"] { --meter-a: #fecdd3; --meter-b: #f43f5e; --meter-glow: rgba(244, 63, 94, 0.5); --meter-ink: #fda4af; }
    .gft-barcode-col[data-state="cache"] { --meter-a: #ffffff; --meter-b: #7dd3fc; --meter-glow: rgba(125, 211, 252, 0.35); --meter-ink: #bae6fd; }
    .gft-barcode-col:first-child { border-right: 1px solid var(--line-solid); }

    .gft-barcode-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      white-space: nowrap;
    }
    .gft-meter-label {
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .gft-meter-state {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--meter-ink);
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--meter-b) 35%, transparent);
      background: color-mix(in srgb, var(--meter-b) 10%, transparent);
    }
    .gft-meter-state::before {
      content: '';
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--meter-b);
      box-shadow: 0 0 6px var(--meter-glow);
    }
    .gft-meter-value {
      font-family: var(--font-mono);
      font-size: 26px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -0.02em;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }
    .gft-meter-value small {
      font-size: 13px;
      font-weight: 500;
      margin-left: 2px;
      color: var(--meter-ink);
    }
    .gft-meter-track { position: relative; padding: 4px 0; }
    .gft-barcode-bars {
      display: grid;
      grid-template-columns: repeat(30, 1fr);
      gap: 3px;
      height: 22px;
    }
    .gft-tick {
      position: relative;
      overflow: hidden;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.07);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
    }
    .gft-tick::after {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: calc(var(--fill, 0) * 100%);
      background: linear-gradient(180deg, var(--meter-a) 0%, var(--meter-b) 100%);
      opacity: var(--shade, 1);
      transition: width 0.45s cubic-bezier(.2,.8,.2,1), opacity 0.3s ease;
    }
    .gft-tick.is-lead::after { box-shadow: 0 0 10px var(--meter-glow); }
    .gft-meter-mark {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      margin-left: -1px;
      border-radius: 1px;
      background: rgba(255, 255, 255, 0.55);
      box-shadow: 0 0 0 2px #0b0c0f;
      pointer-events: none;
    }
    .gft-meter-foot {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .gft-meter-scale { color: var(--text-muted); }
    .gft-meter-legacy { display: none !important; }
    .gft-barcode-col[data-state="nocap"] { --meter-a: #e4e4e7; --meter-b: #a1a1aa; --meter-glow: rgba(161, 161, 170, 0.3); --meter-ink: #d4d4d8; background: none; }
    .gft-barcode-col[data-state="nocap"] .gft-cap-only { display: none; }
    .gft-barcode-col[data-state="nocap"] .gft-meter-state::before { box-shadow: none; }
    .gft-cap-link {
      flex-shrink: 0;
      padding: 0;
      border: none;
      background: none;
      font: 600 11px var(--font-sans);
      color: #93c5fd;
      cursor: pointer;
    }
    .gft-cap-link:hover { color: #bfdbfe; text-decoration: underline; text-underline-offset: 3px; }
    .gft-cap-link:focus-visible, .gft-cap-btn:focus-visible { outline: 2px solid rgba(96, 165, 250, 0.75); outline-offset: 2px; border-radius: 4px; }
    .gft-cap-editor { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .gft-cap-editor[hidden] { display: none; }
    .gft-cap-field {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 30px;
      padding: 0 8px;
      border: 1px solid var(--line-strong, rgba(255, 255, 255, 0.18));
      border-radius: 7px;
      background: #0c0d11;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
    }
    .gft-cap-field:focus-within { border-color: rgba(96, 165, 250, 0.6); }
    .gft-cap-field input {
      width: 76px;
      border: none;
      outline: none;
      background: transparent;
      color: #fff;
      font: 500 12.5px var(--font-mono);
      -moz-appearance: textfield;
      appearance: textfield;
    }
    .gft-cap-field input::-webkit-outer-spin-button,
    .gft-cap-field input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .gft-cap-btn {
      height: 30px;
      padding: 0 11px;
      border-radius: 7px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-secondary);
      font: 600 11.5px var(--font-sans);
      cursor: pointer;
    }
    .gft-cap-btn:hover { color: #fff; border-color: rgba(255, 255, 255, 0.24); }
    .gft-cap-btn.is-primary { color: #fff; border-color: rgba(96, 165, 250, 0.5); background: rgba(59, 130, 246, 0.16); }
    .gft-cap-btn.is-danger { color: #fda4af; border-color: rgba(244, 63, 94, 0.35); background: transparent; }
    .gft-cap-btn[hidden] { display: none; }
    .gft-cap-msg { flex-basis: 100%; font-size: 11px; color: #fda4af; }
    .gft-cap-msg:empty { display: none; }
    @media (prefers-reduced-motion: reduce) { .gft-tick::after { transition: none; } }

    .gft-pnl-right {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--line-solid);
      border-radius: 0;
      min-width: 0;
      flex: 0 0 auto;
    }

    .gft-kv-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      min-width: 0;
      padding: 14px 20px;
      border-radius: 0;
      background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.02), transparent 60%);
      border: none;
      border-right: 1px solid var(--line-solid);
      position: relative;
      transition: background 0.2s ease;
    }

    .gft-kv-item:hover {
      background: radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.04), transparent 65%);
    }

    .gft-kv-item:last-child {
      border-right: none;
    }

    .gft-kv-label {
      font-size: 10.5px;
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .gft-kv-val {
      font-family: var(--font-mono);
      font-size: 12.5px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .gft-chart-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .gft-timeframe-pills {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #0c0d10;
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 7px;
      padding: 3px;
    }

    .gft-tf-pill {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      padding: 3px 7px;
      border-radius: 5px;
      cursor: pointer;
      border: none;
      background: transparent;
    }

    .gft-tf-pill.active {
      background: linear-gradient(180deg, rgba(96, 165, 250, 0.14) 0%, rgba(15, 23, 42, 0.35) 100%);
      border: 1px solid rgba(147, 197, 253, 0.35);
      box-shadow: inset 0 1px 0 rgba(191, 219, 254, 0.35), 0 0 8px rgba(59, 130, 246, 0.16);
      color: #ffffff;
    }

    .gft-chart-stage {
      position: relative;
      width: 100%;
      height: 156px;
      margin-top: 4px;
      cursor: crosshair;
      user-select: none;
      touch-action: none;
    }

    .gft-chart-tooltip {
      position: absolute;
      top: 6px;
      left: 12px;
      z-index: 20;
      pointer-events: none;
      width: 186px;
      padding: 6px 9px;
      border-radius: 7px;
      background: rgba(9, 10, 14, 0.96);
      border: 1px solid rgba(147, 197, 253, 0.36);
      box-shadow:
        inset 0 1px 0 rgba(191, 219, 254, 0.28),
        0 8px 20px rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(10px);
      display: flex;
      flex-direction: column;
      gap: 2px;
      opacity: 0;
      transform: translateY(3px) scale(0.98);
      transition: opacity 0.14s ease, transform 0.14s ease, left 0.06s ease-out, top 0.06s ease-out;
    }

    .gft-chart-tooltip.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .gft-tt-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: 9.5px;
      color: #93c5fd;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .gft-tt-val {
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .gft-tt-desc {
      font-size: 10.5px;
      color: #d4d4d8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .gft-tt-sub {
      font-family: var(--font-mono);
      font-size: 9.5px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
    }

    /* Subtle Auto-Detect IDE & Agent Usage Window Strip */
    .agent-usage-window {
      margin-top: 6px;
      padding: 8px 11px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .agent-usage-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 11px;
    }

    .agent-usage-stats {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--text-secondary);
    }

    .gft-objectives-wrap {
      padding: 6px 28px 16px;
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
    }

    .gft-section-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #e4e4e7;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .gft-objectives-grid {
      display: grid;
      grid-template-columns: repeat(8, minmax(0, 1fr));
      background: linear-gradient(180deg, #111216 0%, #0b0c0e 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 11px;
      overflow: hidden;
    }

    .gft-obj-cell {
      padding: 13px 14px;
      border-right: 1px solid rgba(255, 255, 255, 0.07);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    .gft-obj-cell:last-child {
      border-right: none;
    }

    .gft-obj-label {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .gft-obj-bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 6px;
    }

    .gft-obj-val {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }

    .gft-obj-delta {
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: #60a5fa;
      margin-left: 4px;
      font-weight: 500;
    }

    .gft-mini-bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 18px;
      flex-shrink: 0;
    }

    .gft-mini-bars span {
      width: 2.5px;
      border-radius: 1px;
      background: rgba(255, 255, 255, 0.16);
    }

    .gft-mini-bars span.accent {
      background: #3b82f6;
    }

    .stakent-spark-wrap {
      position: relative;
      width: 100%;
      height: 36px;
      margin: 2px 0;
    }

    .gft-side-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 10px;
      border-radius: 5px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 600;
      background: rgba(0, 105, 253, 0.14);
      color: #60a5fa;
      border: 1px solid rgba(0, 105, 253, 0.28);
    }

    @media (max-width: 1100px) {
      .gft-split-hero { grid-template-columns: 1fr; }
      .gft-objectives-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .gft-obj-cell:nth-child(-n+4) { border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
    }

    @media (max-width: 640px) {
      .gft-overview-tabs, .gft-split-hero, .gft-objectives-wrap { padding-left: 14px; padding-right: 14px; }
      .gft-pnl-layout { grid-template-columns: 1fr; }
      .gft-hero-card.gft-cost-panel { padding: 0; }
      .gft-pnl-top { padding: 14px 16px 12px; }
      .gft-pnl-right { grid-template-columns: 1fr 1fr; gap: 0; }
      .gft-pnl-right .gft-kv-item:nth-child(1) {
        border-right: 1px solid var(--line-solid);
        border-bottom: 1px solid var(--line-solid);
        padding: 10px 14px;
      }
      .gft-pnl-right .gft-kv-item:nth-child(2) {
        border-right: none;
        border-bottom: 1px solid var(--line-solid);
        padding: 10px 14px;
      }
      .gft-pnl-right .gft-kv-item:nth-child(3) {
        grid-column: 1 / -1;
        border-right: none;
        border-bottom: none;
        padding: 10px 14px;
      }
      .gft-layer-mini-box { padding: 12px 14px; }
      .gft-barcode-pair { grid-template-columns: 1fr 1fr; gap: 0; }
      .gft-barcode-col { padding: 12px 14px 14px; gap: 8px; }
      .gft-barcode-col:first-child { border-right: 1px solid var(--line-solid); }
      .gft-barcode-head { flex-wrap: wrap; gap: 4px; }
      .gft-meter-value { font-size: 21px; }
      .gft-barcode-bars { grid-template-columns: repeat(20, 1fr); height: 18px; gap: 2px; }
      .gft-meter-scale { display: none; }
      .gft-meter-foot { white-space: normal; font-size: 10.5px; line-height: 1.4; }
      .gft-objectives-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    /* ===================================================================== */
    /* ARCHITECTURAL WORKBENCH PANELS (Band 4 - Strict 50/50 Alignment)       */
    /* ===================================================================== */
    .workbench-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      width: 100%;
    }

    .workbench-col {
      min-width: 0;
      max-width: 100%;
      display: flex;
      flex-direction: column;
    }

    .workbench-col:first-child {
      border-right: 1px solid var(--line-solid);
    }

    .panel-cell {
      min-width: 0;
      max-width: 100%;
      padding: 24px 28px;
      border-bottom: 1px solid var(--line-solid);
      display: flex;
      flex-direction: column;
      gap: 14px;
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
    }

    .panel-cell:last-child {
      border-bottom: none;
    }

    .panel-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
    }

    .panel-kicker {
      font-family: var(--font-mono);
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 3px;
    }

    .panel-title {
      font-size: 15.5px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .panel-sub {
      font-size: 12.5px;
      color: var(--text-secondary);
      margin-top: 2px;
      line-height: 1.45;
    }

    /* Quick IDE Controls Grid (Replaces screen-blocking floating dock) */
    .quick-ide-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      padding-top: 4px;
    }

    /* ===================================================================== */
    /* FILTER TABS FOR FRONTIER VS OPEN-SOURCE COMPARISON                    */
    /* ===================================================================== */
    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-pill {
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--line-solid);
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 11.5px;
      padding: 0 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .filter-pill:hover {
      color: #ffffff;
      border-color: var(--line-strong);
    }

    .filter-pill.active {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
      font-weight: 600;
    }

    /* ===================================================================== */
    /* CLEAN CARDS & ACTIVITY ROWS (No inner scroll clipping!)               */
    /* ===================================================================== */
    .card-stack {
      width: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line-solid);
      border-radius: var(--radius);
      background: var(--surface);
      overflow: hidden;
    }

    .feed-list {
      width: 100%;
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--line-solid);
      border-radius: var(--radius);
      background: var(--surface);
      max-height: 520px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .feed-item {
      width: 100%;
      min-width: 0;
      padding: 13px 15px;
      border-bottom: 1px solid var(--line-solid);
      display: flex;
      flex-direction: column;
      gap: 7px;
      background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.02), transparent 60%);
      transition: background 0.15s ease;
    }

    .feed-item:last-child {
      border-bottom: none;
    }

    .feed-item:hover {
      background: rgba(255, 255, 255, 0.035);
    }

    .feed-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
    }

    .step-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .tool-tag {
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 500;
      color: #60a5fa;
      background: transparent;
      border: none;
      padding: 0;
      white-space: nowrap;
    }

    .clean-path-box {
      width: 100%;
      max-width: 100%;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.45;
      color: #a1a1aa;
      background: #040406;
      border: 1px solid var(--line-solid);
      border-radius: 4px;
      padding: 8px 11px;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .token-breakdown {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .safety-clear-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 11px 14px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.03);
      font-size: 12.5px;
      color: #60a5fa;
    }

    .empty-box {
      padding: 20px 16px;
      text-align: center;
      color: var(--text-muted);
      font-size: 12.5px;
      border: 1px dashed var(--line-dashed);
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.015);
    }

    /* ===================================================================== */
    /* BUTTONS, BLUE/WHITE BADGES & INPUTS                                   */
    /* ===================================================================== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: var(--font-sans);
      font-size: 12.5px;
      font-weight: 500;
      padding: 8px 13px;
      border-radius: var(--radius);
      border: 1px solid var(--line-strong);
      background: var(--surface-elevated);
      color: var(--text);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .btn:hover {
      background: var(--surface-hover);
      border-color: rgba(255, 255, 255, 0.38);
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn-white {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
      font-weight: 600;
    }

    .btn-white:hover {
      background: #e4e4e7;
      border-color: #e4e4e7;
    }

    .btn-green {
      background: var(--green-soft);
      color: #60a5fa;
      border-color: rgba(0, 105, 253, 0.35);
    }

    .btn-red {
      background: var(--red-soft);
      color: #fb7185;
      border-color: rgba(244, 63, 94, 0.35);
    }

    .badge {
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      padding: 0;
      border-radius: 0;
      background: transparent;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      flex-shrink: 0;
      line-height: 1.35;
      letter-spacing: -0.01em;
    }

    .badge-neutral {
      background: transparent;
      color: #a1a1aa;
      border: none;
    }

    .badge-silver {
      background: transparent;
      color: #ffffff;
      border: none;
    }

    .badge-green {
      background: var(--white-blue-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      color: #60a5fa;
      border: none;
    }

    .badge-red {
      background: transparent;
      color: #fb7185;
      border: none;
    }

    input, textarea {
      width: 100%;
      background: #07080a;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      color: var(--text);
      padding: 10px 13px;
      font-family: var(--font-sans);
      font-size: 13.5px;
      transition: border-color 0.15s ease;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #ffffff;
    }

    /* ===================================================================== */
    /* LIVE IDE WINDOW VIEWPORT & LIVE CONVERSATION / OUTPUT CONSOLE         */
    /* ===================================================================== */
    .window-stage {
      position: relative;
      background: #09090b;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      overflow: hidden;
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 300px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255,255,255,.04);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #ideViewport {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      cursor: crosshair;
    }

    #viewIde .panel-cell:first-child { gap: 18px; }
    #viewIde .panel-head { align-items: center; }
    #viewIde .panel-title { font-size: 17px; }
    #viewIde .panel-sub { max-width: 66ch; }
    #viewIde .stage-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border-radius: 999px; background: rgba(7,7,9,.88); backdrop-filter: blur(12px); }
    #viewIde .stage-pill::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #0069fd; box-shadow: 0 0 9px #0069fd; }
    #viewIde .panel-head > div:last-child .btn { min-height: 38px; }
    #viewIde #remoteKeyInput { min-height: 48px; padding: 12px 15px; background: #08090c; border-color: rgba(255, 255, 255, 0.22); }
    #viewIde #remoteKeyInput:focus { border-color: #ffffff; box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08); }
    #viewIde #liveIdeSendBtn { min-height: 48px; padding-inline: 18px; }
    #viewIde .quick-ide-grid { border-top: 1px solid var(--line-solid); padding-top: 14px; }
    #viewIde .quick-ide-grid .btn { min-height: 46px; }
    #viewIde .quick-ide-grid .btn::after { color: var(--text-muted); font: 10px var(--font-mono); }
    #viewIde .quick-ide-grid .btn:nth-child(1)::after { content: 'ENTER'; }
    #viewIde .quick-ide-grid .btn:nth-child(2)::after { content: 'ESC'; }
    #viewIde .quick-ide-grid .btn:nth-child(3)::after { content: 'CTRL+C'; }
    #viewIde .quick-ide-grid .btn:nth-child(4)::after { content: 'CTRL+S'; }
    #viewIde .quick-ide-grid .btn { justify-content: space-between; padding-inline: 14px; }
    #viewIde .workbench-col:first-child { background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 42%); }

    .live-output-stream {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid var(--line-solid);
      border-radius: var(--radius);
      background: #050507;
      padding: 12px;
      max-height: 460px;
      overflow-y: auto;
    }

    .chat-turn {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 14px;
      border-radius: var(--radius);
      border: 1px solid var(--line-solid);
      background: rgba(255, 255, 255, 0.025);
    }

    .chat-turn.user-turn {
      background: rgba(255, 255, 255, 0.055);
      border-color: rgba(255, 255, 255, 0.22);
    }

    .chat-turn.agent-turn {
      background: #08090c;
      border-color: rgba(255, 255, 255, 0.14);
    }

    .chat-turn-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
    }

    .chat-turn-body {
      font-size: 13px;
      line-height: 1.5;
      color: #f4f4f5;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .chat-tool-box {
      font-family: var(--font-mono);
      font-size: 11.5px;
      line-height: 1.45;
      color: #a1a1aa;
      background: #030305;
      border: 1px solid var(--line-solid);
      border-radius: 4px;
      padding: 7px 10px;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .stage-pill {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.85);
      border: 1px solid var(--line-strong);
      border-radius: 4px;
      padding: 4px 10px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-secondary);
      pointer-events: none;
    }

    .click-ripple {
      position: absolute;
      width: 24px;
      height: 24px;
      border: 1.5px solid #ffffff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: ripple 0.5s ease-out forwards;
    }

    @keyframes ripple {
      from { opacity: 1; transform: translate(-50%, -50%) scale(0.4); }
      to { opacity: 0; transform: translate(-50%, -50%) scale(2.1); }
    }

    /* ===================================================================== */
    /* ARCHITECTURAL DATA TABLE                                              */
    /* ===================================================================== */
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--line-solid);
      border-radius: var(--radius);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    th {
      background: rgba(255, 255, 255, 0.05);
      color: #e4e4e7;
      font-family: var(--font-mono);
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 11px 16px;
      border-bottom: 1px solid var(--line-solid);
    }

    td {
      padding: 11px 16px;
      border-bottom: 1px solid rgba(255,255,255,.12);
      border-right: 1px solid rgba(255,255,255,.055);
    }
    td:last-child, th:last-child { border-right: 0; }
    tbody tr:hover td { background: rgba(255, 255, 255, 0.03); }

    .toast-banner {
      position: fixed;
      top: 72px;
      right: 20px;
      z-index: 90;
      background: #0d0e12;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: var(--radius);
      color: #ffffff;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: calc(100vw - 40px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    @media (max-width: 1420px) {
      .rail, .header-rail {
        border-left: none;
        border-right: none;
      }
      .rail::before, .rail::after {
        display: none;
      }
    }

    @media (max-width: 960px) {
      .metrics-architectural-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hero-status-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hero-workspace-card { grid-column: 1 / -1; }
      .metric-cell:nth-child(2) { border-right: none; }
      .metric-cell:nth-child(1), .metric-cell:nth-child(2) { border-bottom: 1px solid var(--line-solid); }
      .workbench-grid { grid-template-columns: minmax(0, 1fr); }
      .workbench-col:first-child { border-right: none; border-bottom: 1px solid var(--line-solid); }
      .header-rail {
        display: flex;
        height: auto;
        padding: 12px 16px;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 10px;
      }
      .nav-links {
        order: 3;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 6px;
      }
      .ag-models-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .ledger-cards-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .nav-btn {
        justify-content: center;
        padding: 8px 6px;
        font-size: 12.5px;
      }
    }

    @media (max-width: 640px) {
      body { padding-bottom: 20px; }
      .header-band { position: sticky; top: 0; }
      .header-rail {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas: "brand actions" "nav nav";
        align-items: center;
        gap: 8px 10px !important;
        padding: calc(8px + env(safe-area-inset-top)) 12px 10px !important;
      }
      .brand { grid-area: brand; min-width: 0; min-height: 34px; }
      .header-actions { grid-area: actions; width: auto !important; margin: 0; justify-content: flex-end; }
      .brand-studio, .brand-divider { display: none; }
      .nav-links {
        position: static;
        grid-area: nav;
        order: initial;
        width: 100%;
        display: grid !important;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 3px;
        padding: 3px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 10px;
        background: linear-gradient(145deg, rgba(20, 22, 27, 0.88), rgba(10, 11, 14, 0.94) 58%, rgba(5, 6, 8, 0.98));
        box-shadow: none;
        backdrop-filter: blur(16px);
      }
      .nav-btn {
        position: relative;
        min-height: 44px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 3px;
        padding: 5px 2px !important;
        font-size: 10.5px !important;
        line-height: 1.1;
      }
      .nav-btn.active {
        border-color: rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.08);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.12);
      }
      .nav-btn.active::before {
        display: none;
      }
      .nav-btn .badge { font-size: 9px; padding: 1px 4px; }
      .header-actions { width: auto; margin-left: auto; }
      .live-status { font-size: 10.5px; }
      .live-status #connText { max-width: 94px; overflow: hidden; text-overflow: ellipsis; }
      .pill-cta { padding: 7px 9px; font-size: 10.5px; }
      .ag-models-strip { padding: 12px 16px; }
      .ag-models-grid { grid-template-columns: minmax(0, 1fr); }
      .ledger-cards-grid { grid-template-columns: minmax(0, 1fr); }
      .metrics-architectural-grid { grid-template-columns: minmax(0, 1fr); }
      .hero-rail > .metrics-architectural-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric-cell {
        border-right: none !important;
        border-bottom: 1px solid var(--line-solid);
        padding: 16px;
      }
      .hero-rail > .metrics-architectural-grid .metric-cell { padding: 12px 14px; min-height: 112px; }
      .hero-rail > .metrics-architectural-grid .metric-cell:nth-child(n+3) { display: none; }
      .hero-rail > .metrics-architectural-grid .metric-giant { font-size: 23px; }
      body.home-mode .ag-models-strip { display: block !important; }
      body.home-mode .ag-models-grid { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 5px; }
      body.home-mode .profound-card { min-width: 245px; scroll-snap-align: start; }
      .hero-rail .hero-status-strip { padding: 10px 14px; gap: 8px; }
      .metric-cell:last-child { border-bottom: none; }
      .metric-giant { font-size: 30px; }
      .announce-rail {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
      }
      .harness-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
        padding: 14px 16px;
      }
      .harness-summary { flex-wrap: wrap; gap: 14px; }
      .harness-summary-name { font-size: 15px; }
      .harness-summary-model { font-size: 11.5px; white-space: normal; flex-wrap: wrap; line-height: 1.4; }
      .harness-summary .studio-tag { display: none; }
      .harness-summary-right { width: 100%; }
      .harness-budget { width: 100%; padding-right: 0; border-right: none; }
      .harness-switcher {
        width: 100%;
        box-sizing: border-box;
        display: flex;
      }
      .harness-switcher > span, .harness-switcher > .harness-pill { display: none; }
      .harness-current { display: none; }
      .harness-select-wrap {
        display: block;
        width: 100%;
      }
      .harness-select {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        padding: 10px 34px 10px 14px;
        font-size: 12.5px;
        border-radius: 9px;
      }
      .header-rail { padding: 10px 14px !important; gap: 10px !important; }
      .badge { font-size: 10.5px; }
      .panel-kicker { font-size: 10.5px; letter-spacing: .075em; }
      .metric-desc, .panel-sub { font-size: 12px; line-height: 1.55; }
      .metric-header { font-size: 12px; }
      .panel-title { line-height: 1.3; }
      .header-actions { width: 100%; justify-content: space-between; gap: 8px; }
      .live-status { font-size: 11px; }
      .pill-cta { padding: 8px 11px; font-size: 11px; }
      .hero-status-strip {
        grid-template-columns: minmax(0, 1fr);
        padding: 12px;
        gap: 8px;
      }
      .hero-status-card { padding: 12px; gap: 8px; }
      .hero-workspace-card { grid-column: auto; }
      .panel-cell {
        padding: 18px 16px;
      }
      .quick-ide-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .extended-menu {
        position: fixed;
        left: 14px;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        width: auto;
        max-width: calc(100vw - 28px);
        max-height: 70vh;
        z-index: 9999;
        box-sizing: border-box;
      }
      .window-stage {
        min-height: 200px;
      }
      #viewIde .panel-head { align-items: flex-start; flex-direction: column; }
      #viewIde .panel-head > div:last-child { width: 100%; display: grid !important; grid-template-columns: 1fr 1fr; }
      #viewEstimator .panel-head { flex-direction: column; align-items: flex-start; }
      #viewEstimator .panel-head > div:last-child { width: 100%; }
      #viewIde .window-stage { aspect-ratio: 4 / 3; }
      #viewIde #remoteKeyInput { min-width: 100% !important; }
      #viewIde #liveIdeSendBtn { width: 100%; justify-content: center; }
      #viewIde .quick-ide-grid .btn { padding-inline: 10px; font-size: 12px; }
      .page-intro { padding: 18px 16px 14px; }
      .page-intro h1 { font-size: 19px; }
      .panel-cell { gap: 12px; }
      .nav-btn { min-height: 54px; }
      .subview-details > summary { padding: 15px 16px; min-height: 52px; }
    }

    .hidden { display: none !important; }
    body.home-mode {
      --line-solid: rgba(255, 255, 255, .14);
      --line-dashed: rgba(255, 255, 255, .10);
      --line-strong: rgba(255, 255, 255, .24);
    }
    body:not(.home-mode) #harnessBand, body:not(.home-mode) #heroBand { display: none; }
    body.home-mode .profound-card { border-color: rgba(255, 255, 255, .11); }
    body.home-mode .profound-card.active { border-color: rgba(255, 255, 255, .32); background: linear-gradient(180deg, #17191f 0%, #0d0e12 100%); }

    /* Focused remote dashboard hierarchy */
    .page-intro { padding: 24px 28px 18px; border-bottom: 1px solid var(--line-solid); background: linear-gradient(110deg, rgba(255,255,255,.035) 0%, transparent 70%); }
    .workbench-grid > .page-intro, .workbench-grid > .home-attention, .workbench-grid > .safety-demo-disclosure { grid-column: 1 / -1; }
    .page-intro h1 { font-size: 22px; line-height: 1.25; letter-spacing: -.035em; color: #ffffff; }
    .page-intro p { color: var(--text-secondary); font-size: 13px; margin-top: 5px; max-width: 62ch; }
    .subview-details { border-top: 1px solid var(--line-solid); }
    .subview-details > summary { list-style: none; cursor: pointer; padding: 15px 20px; color: var(--text-secondary); font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
    .subview-details > summary::-webkit-details-marker { display: none; }
    .subview-details > summary::after { content: '+'; color: #60a5fa; font: 18px var(--font-mono); }
    .subview-details[open] > summary::after { content: '−'; }
    .subview-details-content { border-top: 1px solid var(--line-solid); }
    #viewOverview .panel-kicker, #viewIde .panel-kicker, #viewActivity .panel-kicker, #viewSafety .panel-kicker { letter-spacing: .045em; }
    #viewOverview #pendingList .safety-clear-bar { padding: 10px 12px; }
    #viewOverview #pendingList .safety-clear-bar button { display: none; }
    #viewIde .more-controls-summary { padding: 16px 20px; }
    #viewActivity .live-output-stream, #viewActivity .feed-list { max-height: none !important; }
    #viewOverview .workbench-col:first-child { border-right: 0; }
    #viewSafety { max-width: 1120px; margin: 0 auto; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    #viewSafety .workbench-col:first-child { border-right: 0; border-bottom: 0; }
    #viewSafety .panel-cell { min-height: 100%; padding: 24px; }
    #viewSafety .panel-head { align-items: center; }
    #viewSafety #pendingList .safety-clear-bar { min-height: 50px; }
    #viewSafety #pendingList .feed-item { padding: 16px; gap: 12px; }
    #viewSafety #pendingList .feed-item > div:last-child { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px !important; }
    #viewSafety #pendingList .feed-item > div:last-child .btn { min-height: 46px; white-space: normal; }
    #viewSafety #checkpointList .feed-item { padding: 16px; gap: 12px; }
    #viewSafety #checkpointList .feed-item > div:last-child { gap: 10px; flex-wrap: wrap; }
    #viewSafety #checkpointList .btn { min-height: 44px; }
    #viewSafety .safety-demo-disclosure { margin-bottom: 12px; }
    @media (max-width: 960px) {
      #viewSafety { grid-template-columns: minmax(0, 1fr); }
      #viewSafety .panel-cell { min-height: 0; }
    }
    .chat-remote { display: flex; flex-direction: column; gap: 12px; padding: 16px 28px 24px; height: calc(100vh - 165px); max-height: calc(100vh - 165px); box-sizing: border-box; }
    body.chat-mode #harnessBand, body.chat-mode #heroBand { display: none; }
    .control-ai-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      background: linear-gradient(180deg, #111319 0%, #0a0c10 100%);
      border: 1px solid rgba(255, 255, 255, 0.10);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      flex-wrap: wrap;
    }
    .control-mode-pills {
      display: inline-flex;
      align-items: center;
      background: #060709;
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 9px;
      padding: 3px;
      gap: 3px;
    }
    .control-mode-pill {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .control-mode-pill.active {
      background: rgba(0, 105, 253, 0.22);
      color: #93c5fd;
      box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.40);
    }
    .control-ai-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .control-model-select {
      height: 32px;
      background: #141720;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      color: #ffffff;
      font-size: 11.5px;
      padding: 0 10px;
      outline: none;
      cursor: pointer;
    }
    .control-quick-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding: 2px 0 4px;
      scrollbar-width: none;
    }
    .control-quick-chips::-webkit-scrollbar {
      display: none;
    }
    .control-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.035);
      border: 1px solid rgba(255, 255, 255, 0.10);
      color: #e4e4e7;
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.18s ease;
      flex-shrink: 0;
    }
    .control-chip:hover {
      background: rgba(0, 105, 253, 0.16);
      border-color: rgba(96, 165, 250, 0.45);
      color: #ffffff;
    }
    .chat-message-list { display: flex; flex-direction: column; gap: 12px; flex: 1 1 auto; min-height: 200px; overflow-y: auto; overscroll-behavior: contain; scroll-behavior: smooth; padding: 18px; border: 1px solid var(--line-solid); border-radius: 12px; background: radial-gradient(ellipse at 50% 0, rgba(255, 255, 255, 0.04), transparent 60%), #07080a; }
    .chat-message-list .live-output-stream { width: 100%; max-height: none; overflow: visible; padding: 0; border: 0; background: transparent; }
    .chat-message-list .empty-box { margin: auto; border: 0 !important; text-align: center; color: var(--text-muted); }
    .chat-message-list .intel-report-card { width: 100%; max-width: 100%; margin: 4px 0; }
    .chat-message-list .intel-turn-user { align-self: flex-end; max-width: min(88%, 760px); margin: 4px 0; }
    .chat-message-list .chat-turn { max-width: min(88%, 760px); padding: 13px 15px; border-radius: 14px; gap: 0; }
    .chat-message-list .chat-turn.user-turn { align-self: flex-end; background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.22); }
    .chat-message-list .chat-turn.agent-turn { align-self: flex-start; background: #0d0f13; border-color: rgba(255,255,255,.11); }
    .chat-message-list .chat-turn-header { margin-bottom: 7px; font-size: 10.5px; color: var(--text-muted); }
    .chat-message-list .chat-turn.agent-turn .chat-turn-body { white-space: pre-wrap; overflow-wrap: anywhere; }
    .chat-composer { display: flex; gap: 10px; align-items: flex-end; padding: 10px; border: 1px solid rgba(255, 255, 255, 0.20); border-radius: 14px; background: #0c0d11; box-shadow: 0 12px 32px rgba(0,0,0,.35); }
    .chat-composer input { width: auto; min-width: 0; min-height: 48px; flex: 1 1 auto; border: 0; background: transparent; box-shadow: none !important; }
    .chat-composer .btn { min-height: 46px; padding-inline: 18px; }
    .chat-send-status { min-height: 18px; padding: 0 4px; color: var(--text-secondary); font-size: 12px; }
    .brand-footer-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding: 18px 28px;
      border-top: 1px solid var(--line-solid);
      background: #050507;
    }
    .brand-footer-assets {
      display: inline-flex;
      align-items: center;
      gap: 14px;
    }
    .brand-asset-img {
      height: 24px;
      width: auto;
      display: block;
      mix-blend-mode: screen;
      border-radius: 4px;
    }
    @media (max-width: 640px) {
      .page-intro { padding: 18px 16px 14px; }
      .page-intro h1 { font-size: 19px; }
      .panel-cell { gap: 12px; }
      .nav-btn { min-height: 54px; }
      .subview-details > summary { padding: 15px 16px; min-height: 52px; }
      #viewSafety { grid-template-columns: minmax(0, 1fr); width: 100%; }
      #viewSafety .panel-cell { padding: 18px 16px; }
      #viewSafety .panel-head { align-items: flex-start; gap: 10px; }
      #viewSafety #checkpointList .feed-item > div:last-child { align-items: center; }
      #viewSafety #checkpointList .feed-item > div:last-child .btn { width: 100%; }
      #viewSafety .safety-demo-disclosure { margin: 0 12px 12px; }
      .chat-remote { padding: 10px 12px calc(154px + env(safe-area-inset-bottom)); gap: 10px; }
      .chat-message-list { height: max(46vh, 360px); max-height: calc(100dvh - 330px - env(safe-area-inset-bottom)); min-height: 300px; padding: 12px; border-radius: 10px; }
      .chat-message-list .chat-turn { max-width: 94%; padding: 11px 12px; }
      .chat-composer { position: fixed; z-index: 60; left: 12px; right: 12px; bottom: calc(96px + env(safe-area-inset-bottom)); padding: 8px; gap: 8px; backdrop-filter: blur(16px); }
      #viewIde .chat-composer #remoteKeyInput { width: auto; min-width: 0 !important; flex: 1 1 auto; min-height: 46px; padding: 9px 10px; font-size: 14px; }
      .chat-composer .btn { flex: 0 0 auto; min-height: 46px; padding-inline: 14px; }
      .chat-send-status { padding: 2px 4px; }
    }

    /* ===================================================================== */
    /* PROJECT INTELLIGENCE AI (ASK AI FORENSICS VIEW & MOBILE DRAWER)       */
    /* ===================================================================== */
    @media (max-width: 960px) {
      .nav-links {
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
      }
    }
    @media (max-width: 640px) {
      .nav-links {
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
      }
      .nav-btn {
        min-height: 44px !important;
        font-size: 10px !important;
        padding: 4px 2px !important;
      }
    }

    .intel-shell {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .intel-hero-bar {
      padding: 22px 28px 18px;
      border-bottom: 1px solid var(--line-solid);
      background: linear-gradient(110deg, rgba(255, 255, 255, 0.035) 0%, transparent 70%);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
    }

    .intel-hero-left {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 680px;
    }

    .intel-kicker-row {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .intel-spark-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.03em;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .intel-hero-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #ffffff;
      line-height: 1.25;
    }

    .intel-hero-sub {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .intel-controls-box {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .intel-model-select {
      height: 36px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid var(--line-solid);
      background: #0c0e14;
      color: #ffffff;
      font-family: var(--font-sans);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }

    .intel-task-input {
      height: 36px;
      width: 155px;
      padding: 0 11px;
      border-radius: 8px;
      border: 1px solid var(--line-solid);
      background: #0a0b0e;
      color: #ffffff;
      font-family: var(--font-mono);
      font-size: 12px;
    }

    .intel-prompts-band {
      padding: 16px 28px;
      border-bottom: 1px solid var(--line-solid);
      background: #06070a;
    }

    .intel-prompts-label {
      font-family: var(--font-mono);
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .intel-prompts-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .intel-prompt-card {
      text-align: left;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 9px;
      padding: 11px 13px;
      color: var(--text);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.16s ease;
    }

    .intel-prompt-card:hover {
      border-color: rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.045);
      transform: translateY(-1px);
    }

    .intel-prompt-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .intel-prompt-card-title {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.35;
    }

    .intel-prompt-card-sub {
      font-size: 11.5px;
      color: var(--text-muted);
      line-height: 1.35;
    }

    .intel-body-stage {
      padding: 20px 28px 26px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      background:
        radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
    }

    .intel-composer-box {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: #0a0b0f;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .intel-composer-box input {
      flex: 1 1 auto;
      min-width: 0;
      height: 44px;
      border: none !important;
      background: transparent !important;
      color: #ffffff;
      font-size: 14px;
      padding: 0 8px;
      box-shadow: none !important;
    }

    .intel-composer-box input:focus {
      outline: none;
    }

    .intel-ask-btn {
      min-height: 44px;
      padding: 0 18px;
      border-radius: 9px;
      font-weight: 600;
      font-size: 13.5px;
      flex-shrink: 0;
    }

    .intel-stream {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .intel-turn-user {
      align-self: flex-end;
      max-width: min(86%, 720px);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 12px 12px 3px 12px;
      padding: 12px 16px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    }

    .intel-turn-user-meta {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .intel-report-card {
      background: linear-gradient(180deg, #0d0f14 0%, #08090c 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42);
    }

    .intel-report-head {
      padding: 13px 18px;
      border-bottom: 1px solid var(--line-solid);
      background: rgba(255, 255, 255, 0.025);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .intel-report-tools {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .intel-tool-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-secondary);
    }

    .intel-kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-bottom: 1px solid var(--line-solid);
      background: #07080b;
    }

    .intel-kpi-cell {
      padding: 13px 16px;
      border-right: 1px solid var(--line-solid);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .intel-kpi-cell:last-child {
      border-right: none;
    }

    .intel-kpi-label {
      font-family: var(--font-mono);
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .intel-kpi-val {
      font-family: var(--font-mono);
      font-size: 19px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .intel-kpi-val.tone-blue { color: #60a5fa; }
    .intel-kpi-val.tone-green { color: #93c5fd; }
    .intel-kpi-val.tone-red { color: #fb7185; }

    .intel-kpi-sub {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .intel-breakdown-section {
      padding: 14px 18px;
      border-bottom: 1px solid var(--line-solid);
      background: rgba(255, 255, 255, 0.015);
    }

    .intel-breakdown-title {
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 10px;
    }

    .intel-breakdown-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .intel-bd-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 10px;
      border-radius: 7px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }

    .intel-bd-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12.5px;
    }

    .intel-bd-label {
      font-weight: 600;
      color: #ffffff;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .intel-bd-metrics {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: #93c5fd;
      flex-shrink: 0;
    }

    .intel-bd-sub {
      font-size: 11px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .intel-answer-body {
      padding: 18px 20px;
      font-size: 13.8px;
      line-height: 1.65;
      color: #e4e4e7;
    }

    .intel-followups {
      padding: 12px 18px;
      border-top: 1px solid var(--line-solid);
      background: #06070a;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .intel-followup-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      padding: 6px 12px;
      font-family: var(--font-sans);
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
    }

    .intel-followup-chip:hover {
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.32);
      background: rgba(255, 255, 255, 0.08);
    }

    .intel-fab {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 55;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 16px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.22);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(12px);
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }

    .intel-fab:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.14);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    }

    body.intel-mode #harnessBand,
    body.intel-mode #heroBand,
    body.intel-mode .intel-fab,
    body.chat-mode .intel-fab {
      display: none !important;
    }

    @media (max-width: 900px) {
      .intel-prompts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .intel-kpi-strip {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .intel-kpi-cell:nth-child(2) {
        border-right: none;
      }
      .intel-kpi-cell:nth-child(1),
      .intel-kpi-cell:nth-child(2) {
        border-bottom: 1px solid var(--line-solid);
      }
    }

    @media (max-width: 640px) {
      .intel-hero-bar {
        padding: 16px 14px 14px;
        gap: 12px;
      }
      .intel-hero-title {
        font-size: 19px;
      }
      .intel-controls-box {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr;
      }
      .intel-model-select,
      .intel-task-input {
        width: 100%;
        height: 40px;
      }
      .intel-prompts-band {
        padding: 12px 14px;
      }
      .intel-prompts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .intel-prompt-card {
        padding: 9px 10px;
      }
      .intel-prompt-card-title {
        font-size: 12px;
      }
      .intel-prompt-card-sub {
        display: none;
      }
      .intel-body-stage {
        padding: 14px 12px 24px;
        gap: 14px;
      }
      .intel-composer-box {
        flex-wrap: nowrap;
        padding: 6px 8px;
      }
      .intel-composer-box input {
        font-size: 13.5px;
        height: 40px;
      }
      .intel-ask-btn {
        min-height: 40px;
        padding: 0 12px;
        font-size: 12.5px;
      }
      .intel-report-head {
        padding: 11px 12px;
      }
      .intel-kpi-cell {
        padding: 10px 12px;
      }
      .intel-kpi-val {
        font-size: 16.5px;
      }
      .intel-breakdown-section,
      .intel-answer-body,
      .intel-followups {
        padding: 12px 14px;
      }
      .intel-turn-user {
        max-width: 94%;
        padding: 10px 13px;
        font-size: 13px;
      }
      .intel-fab {
        right: 14px;
        bottom: 16px;
        padding: 10px 14px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body class="home-mode">

  <!-- ===================================================================== -->
  <!-- BAND 1: FULL-BLEED ARCHITECTURAL TOP NAVBAR                           -->
  <!-- ===================================================================== -->
  <header class="header-band">
    <div class="header-rail">
      <a class="brand" onclick="switchView('overview')" title="Cairn — AI Agent Control Plane">
        <div class="brand-mark">
          <svg width="30" height="26" viewBox="0 0 36 32" fill="none" aria-hidden="true">
            <path d="M16.6 4.2C17.2 3.3 18.8 3.3 19.4 4.2L22.8 9.6C23.4 10.5 22.7 11.7 21.6 11.7H14.4C13.3 11.7 12.6 10.5 13.2 9.6L16.6 4.2Z" fill="#FFFFFF"/>
            <path d="M11.4 14.0C11.8 13.4 12.5 13.0 13.3 13.0H22.7C23.5 13.0 24.2 13.4 24.6 14.0L27.2 18.0C27.8 18.9 27.1 20.1 26.0 20.1H10.0C8.9 20.1 8.2 18.9 8.8 18.0L11.4 14.0Z" fill="#FFFFFF"/>
            <path d="M7.4 22.4C7.8 21.8 8.5 21.4 9.3 21.4H26.7C27.5 21.4 28.2 21.8 28.6 22.4L31.4 26.8C32.0 27.7 31.3 29.0 30.2 29.0H5.8C4.7 29.0 4.0 27.7 4.6 26.8L7.4 22.4Z" fill="#0069FD"/>
          </svg>
        </div>
        <span style="width: 1px; height: 22px; background: rgba(255, 255, 255, 0.26); display: inline-block;"></span>
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <img src="/brand/cairn-wordmark.jpg" alt="Cairn" class="brand-asset-img" style="height: 21px;" onerror="this.style.display='none'" />
          <span class="brand-name" style="display: none;">Ca<span class="brand-i-wrap">ı<span class="brand-i-dot"></span></span>rn</span>
          <span class="brand-divider">/</span>
          <span class="brand-studio">Cairn Studios</span>
        </div>
      </a>

      <nav class="nav-links">
        <button type="button" class="nav-btn active" id="tabOverview" onclick="switchView('overview')">
          <span>Home</span>
          <span class="badge badge-neutral" id="pendingBadge">0</span>
        </button>
        <button type="button" class="nav-btn" id="tabIntel" onclick="switchView('intel')">
          <span>Ask AI</span>
        </button>
        <button type="button" class="nav-btn" id="tabRuns" onclick="switchView('activity')">
          <span>Activity</span>
        </button>
        <button type="button" class="nav-btn" id="tabSafety" onclick="switchView('safety')">
          <span>Safety</span>
        </button>
        <button type="button" class="nav-btn" id="tabEstimator" onclick="switchView('estimator')">
          <span>Costs</span>
        </button>
        <button type="button" class="nav-btn" id="tabIde" onclick="switchView('ide')">
          <span>Control</span>
        </button>
      </nav>

      <div class="header-actions">
        <button type="button" class="btn" style="padding: 6px 11px; font-size: 12px; border-radius: 8px;" onclick="createManualSnapshot()" title="Create Git Shadow Checkpoint">+ Snapshot</button>
        <div class="live-status" style="padding: 5px 11px; border-radius: 999px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.10);">
          <span class="live-dot" id="connDot"></span>
          <span id="connText">Antigravity Live</span>
        </div>
      </div>
    </div>
  </header>

  <!-- ===================================================================== -->
  <!-- BAND 2: DYNAMIC IDE & AGENT HARNESS AUTO-DETECTION RIBBON             -->
  <!-- ===================================================================== -->
  <div class="band" id="harnessBand">
    <div class="rail announce-rail">
      <div class="harness-summary">
        <div class="harness-summary-left">
          <span class="harness-summary-icon"><img src="/brand/cairn-icon.png" alt="Cairn" width="26" height="26" /></span>
          <div class="harness-summary-main">
            <span class="harness-summary-label">Currently using <span class="harness-live-dot" title="Live"></span></span>
            <span class="harness-summary-name" id="harnessSummaryName">Antigravity IDE</span>
            <span class="harness-summary-model"><span class="harness-chip-key">Model</span><strong id="bannerAgentName">Gemini 4 Argon · Medium (New)</strong></span>
          </div>
        </div>
        <div class="harness-summary-right">
          <div class="harness-budget" id="cairnBudgetRemaining" hidden>
            <div class="harness-budget-top">
              <span class="harness-budget-key">Budget left</span>
              <span class="harness-budget-amt" id="cairnBudgetRemainingAmt">$0.00</span>
            </div>
            <div class="harness-budget-track"><span id="cairnBudgetRemainingBar"></span></div>
            <span class="harness-budget-scope" id="cairnBudgetRemainingScope">Task limit</span>
          </div>
          <span class="studio-tag" id="detectedHarnessBadge"><span class="studio-tag-dot"></span><span class="studio-tag-kicker">Active IDE</span><span style="color: rgba(255,255,255,0.28);">·</span><span>Antigravity IDE</span></span>
        </div>
      </div>

      <div class="harness-switcher">
        <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-right: 4px;">Switch IDE / Agent:</span>
        <span class="harness-current" id="harnessCurrentMobile">Antigravity IDE</span>
        <label class="harness-select-wrap" aria-label="Choose active IDE or agent">
          <select class="harness-select" id="harnessSelectMobile" onchange="switchActiveHarness(this.value)">
            <option value="antigravity">Antigravity IDE</option>
            <option value="codex">ChatGPT Codex</option>
            <option value="claude-code">Claude Code</option>
            <option value="opencode">OpenCode</option>
            <option value="hermes">Hermes</option>
          </select>
        </label>
        <button type="button" class="harness-pill active" id="harnessBtn_antigravity" onclick="switchActiveHarness('antigravity')">Antigravity IDE</button>
        <button type="button" class="harness-pill" id="harnessBtn_codex" onclick="switchActiveHarness('codex')">Codex</button>
        <button type="button" class="harness-pill" id="harnessBtn_claude-code" onclick="switchActiveHarness('claude-code')">Claude Code</button>
        <button type="button" class="harness-pill" id="harnessBtn_opencode" onclick="switchActiveHarness('opencode')">OpenCode</button>
        <button type="button" class="harness-pill" id="harnessBtn_hermes" onclick="switchActiveHarness('hermes')">Hermes</button>
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- BAND 3: FULL-BLEED HERO METRICS STAGE (Inside Continuous Grid Lines)  -->
  <!-- ===================================================================== -->
  <section class="band" id="heroBand">
    <div class="rail hero-rail">

      <!-- GFT-Style Overview Sub-Navigation & Status Pills -->
      <div class="gft-overview-tabs">
        <div class="gft-tab-group">
          <span class="gft-tab-item active">Telemetry Overview</span>
          <span class="gft-tab-item" onclick="switchView('intel')">✦ Ask Project AI</span>
          <span class="gft-tab-item" onclick="switchView('estimator')">Cost &amp; PRD Simulator</span>
          <span class="gft-tab-item" onclick="switchView('ledger')">Multi-Agent Ledger</span>
        </div>
        <div class="gft-pill-row">
          <span class="gft-micro-pill blue">● Active</span>
          <span class="gft-micro-pill">Instant Undo</span>
          <span class="gft-micro-pill" id="activeCellHarnessTitle">Antigravity IDE Model</span>
          <span class="badge badge-silver" id="activeModelCategoryBadge" style="font-size: 10.5px;">FRONTIER</span>
        </div>
      </div>

      <!-- GFT-Style 2-Card Split Hero: Left = Session Cost & Vertical Barcode Meter | Right = Live Telemetry Curve -->
      <div class="gft-split-hero">

        <!-- LEFT CARD: SESSION COST — Consolidated Clean Layout -->
        <div class="gft-hero-card gft-cost-panel">
          <div class="gft-pnl-layout">
            <div class="gft-pnl-left">
              <div class="gft-pnl-top">
                <div style="min-width: 0;">
                  <div class="metric-header" style="justify-content: flex-start; gap: 6px;">
                    <span>Session Cost</span>
                    <span style="color: var(--text-muted); font-size: 11px;">ⓘ</span>
                  </div>
                  <div class="metric-giant" id="statSpend">$0.00</div>
                  <div class="metric-desc" id="statCalls">0 requests tracked in session</div>
                </div>
                <div class="gft-risk-box" id="gftRiskBox" title="Cairn Safety Gate &amp; Budget Status">
                  <span class="gft-risk-Pip" id="gftRiskPip"></span>
                  <span id="gftRiskLabel">Low Risks</span>
                </div>
              </div>

              <!-- Horizontal stat row: Budget Cap | PRD Forecast | Active Context -->
              <div class="gft-pnl-right">
                <div class="gft-kv-item">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <span class="gft-kv-label">Budget Cap ⓘ</span>
                    <span class="badge badge-silver" id="budgetCapBadge" style="font-size: 9.5px; padding: 1px 6px;">$40.00 Limit</span>
                  </div>
                  <span class="gft-kv-val" id="burnLimitText">$40.00 cap</span>
                  <span class="gft-kv-val" id="burnText" style="font-size: 10.5px; font-weight: 500; color: var(--text-secondary);">$0.00 spent</span>
                </div>
                <div class="gft-kv-item">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <span class="gft-kv-label">PRD Forecast ⓘ</span>
                    <span class="badge badge-neutral" id="statConfidence" style="font-size: 9.5px; padding: 1px 6px;">MEDIUM</span>
                  </div>
                  <span class="gft-kv-val" id="statForecast">$71.36</span>
                  <span class="metric-desc" id="statForecastSub" style="font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Estimated across 65 repository tasks</span>
                </div>
                <div class="gft-kv-item">
                  <span class="gft-kv-label">Active Context ⓘ</span>
                  <span class="gft-kv-val" id="agLiveUsageText" style="font-size: 11.5px;">Antigravity: 0 tok</span>
                  <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">Cap: <span id="agLiveContextCapText">2,000K ctx</span></span>
                </div>
              </div>

              <!-- Live Technical Layer Spend Distribution -->
              <div class="gft-layer-mini-box" id="gftLeftLayerMiniBars">
                <div class="gft-layer-mini-head">
                  <span>Cost Attribution by Layer</span>
                  <span style="color: #60a5fa; cursor: pointer;" onclick="switchView('intel')">✦ Ask Why →</span>
                </div>
                <div id="gftLeftLayerMiniList" style="display: flex; flex-direction: column; gap: 6px;">
                  <div class="gft-layer-mini-row">
                    <div class="gft-layer-mini-top">
                      <span style="color: #e4e4e7; font-weight: 500;">UI &amp; Frontend</span>
                      <span style="font-family: var(--font-mono); font-size: 10.5px; color: #93c5fd;">48% · Primary driver</span>
                    </div>
                    <div class="segment-track" style="height: 3.5px;"><div class="segment-fill" style="width: 48%;"></div></div>
                  </div>
                  <div class="gft-layer-mini-row">
                    <div class="gft-layer-mini-top">
                      <span style="color: #e4e4e7; font-weight: 500;">Backend &amp; Gateway</span>
                      <span style="font-family: var(--font-mono); font-size: 10.5px; color: var(--text-secondary);">31% · API &amp; Intel</span>
                    </div>
                    <div class="segment-track" style="height: 3.5px;"><div class="segment-fill" style="width: 31%;"></div></div>
                  </div>
                </div>
              </div>

              <!-- Segmented Meters -->
              <div class="gft-barcode-pair">
                <div class="gft-barcode-col" id="gftMeterBudget" data-state="nocap">
                  <div class="gft-barcode-head">
                    <span class="gft-meter-label" id="gftBudgetLabel">Session cost</span>
                    <span class="gft-meter-state" id="gftBudgetState">No cap</span>
                  </div>
                  <div class="gft-meter-value" id="gftBudgetValue">$0.00</div>
                  <div class="gft-meter-track gft-cap-only">
                    <div class="gft-barcode-bars" id="gftBarcodeBudget" role="meter" aria-label="Budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
                    <span class="gft-meter-mark" style="left: 80%;" title="80% budget alert"></span>
                  </div>
                  <div class="gft-meter-foot">
                    <span id="gftBudgetFoot">Tracking spend only · no limit enforced</span>
                    <button type="button" class="gft-cap-link" id="gftCapToggle" onclick="openCostCapEditor()">Set cost cap</button>
                  </div>
                  <form class="gft-cap-editor" id="gftCapEditor" hidden onsubmit="saveCostCap(event)">
                    <label class="gft-cap-field" for="gftCapInput"><span>$</span><input id="gftCapInput" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="40.00" aria-label="Cost cap in US dollars" required /></label>
                    <button type="submit" class="gft-cap-btn is-primary">Save</button>
                    <button type="button" class="gft-cap-btn" onclick="closeCostCapEditor()">Cancel</button>
                    <button type="button" class="gft-cap-btn is-danger" id="gftCapRemove" onclick="removeCostCap()" hidden>Remove cap</button>
                    <span class="gft-cap-msg" id="gftCapMsg" role="status"></span>
                  </form>
                  <span class="badge badge-green gft-meter-legacy" id="burnPctBadge">0% used</span>
                  <div class="gft-meter-legacy"><div id="budgetBar"></div></div>
                </div>

                <div class="gft-barcode-col" id="gftMeterCache" data-state="cache">
                  <div class="gft-barcode-head">
                    <span class="gft-meter-label">Prompt cache</span>
                    <span class="gft-meter-state" id="gftCacheState">Warming up</span>
                  </div>
                  <div class="gft-meter-value"><span id="gftCachePctNum">0.0</span><small>%</small></div>
                  <div class="gft-meter-track">
                    <div class="gft-barcode-bars" id="gftBarcodeCache" role="meter" aria-label="Prompt cache hit rate" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
                  </div>
                  <div class="gft-meter-foot">
                    <span>of input tokens served from cache</span>
                  </div>
                  <span class="badge badge-green gft-meter-legacy" id="agLiveCacheRateBadge">0% cached</span>
                  <div class="gft-meter-legacy"><div id="agLiveUsageBar"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT CARD: LIVE TOKENS & TELEMETRY CURVE CHART (Matches GFT Account Balance Chart Card) -->
        <div class="gft-hero-card" style="overflow: visible;">
          <div class="gft-chart-head">
            <div>
              <div class="metric-header" style="justify-content: flex-start; gap: 8px;">
                <span>Live Tokens Used ⓘ</span>
                <span class="badge badge-green">Prompt Cached</span>
              </div>
              <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-top: 2px;">
                <div class="metric-giant" id="statTokens">0</div>
                <span id="statSteps" style="font-family: var(--font-mono); font-size: 11.5px; color: #60a5fa;">Real-time sync with Antigravity IDE</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              <div class="gft-timeframe-pills">
                <button type="button" class="gft-tf-pill" onclick="setTelemetryChartMode('cost', this)">COST</button>
                <button type="button" class="gft-tf-pill active" onclick="setTelemetryChartMode('tokens', this)">TOKENS</button>
                <button type="button" class="gft-tf-pill" onclick="setTelemetryChartMode('cache', this)">CACHE</button>
                <button type="button" class="gft-tf-pill" onclick="setTelemetryChartMode('all', this)">ALL</button>
              </div>
              <div class="agent-switcher-row" style="width: auto; margin: 0;">
                <select id="activeAgentSelect" class="agent-switcher-select" style="height: 32px; font-size: 12px; min-width: 165px;" onchange="onModelSelectChange(this, 'heroExtendedMenu')"></select>
                <div class="extended-dropdown-wrap">
                  <button type="button" class="extended-btn" id="heroExtendedBtn" style="height: 32px; font-size: 11px;" onclick="toggleExtendedMenu('heroExtendedMenu', event)">+ Extended ▾</button>
                  <div id="heroExtendedMenu" class="extended-menu hidden"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="gft-chart-stage" id="gftLiveChartStage">
            <div class="gft-chart-tooltip" id="gftChartTooltip">
              <div class="gft-tt-top">
                <span id="gftTtTitle">★ PEAK STEP</span>
                <span id="gftTtMeta">Drag pointer to inspect</span>
              </div>
              <div class="gft-tt-val" id="gftTtValue">--</div>
              <div class="gft-tt-desc" id="gftTtDesc">Syncing session telemetry...</div>
              <div class="gft-tt-sub">
                <span id="gftTtTools">agent_turn</span>
                <span id="gftTtCost">$0.0000</span>
              </div>
            </div>
            <svg id="gftTelemetrySvg" width="100%" height="156" viewBox="0 0 640 156" preserveAspectRatio="none" style="display: block; width: 100%; height: 156px;"></svg>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
            <div class="metric-desc" id="activeModelRatesHint">2000K ctx · In: $1.5/M · Cache: $0.3/M · Out: $10/M</div>
            <div style="font-family: var(--font-mono); font-size: 10.5px; color: #93c5fd;" id="gftChartPeakHint">● Drag curve · Peak highlighted</div>
          </div>

          <!-- Subtle Auto-Detected IDE & Agent Usage Window (Used vs Remaining) -->
          <div class="agent-usage-window" id="agentUsageWindowBox">
            <div class="agent-usage-head">
              <div style="display: inline-flex; align-items: center; gap: 6px; min-width: 0;">
                <span class="studio-tag-dot" style="width: 5.5px; height: 5.5px;"></span>
                <span style="color: var(--text-muted);">Auto-Detected:</span>
                <strong style="color: #ffffff;" id="autoDetectIdeName">Antigravity IDE</strong>
                <span style="color: rgba(255,255,255,0.24);">·</span>
                <span style="color: #93c5fd; font-weight: 600;" id="autoDetectAgentName">Gemini 4 Argon</span>
              </div>
              <span class="badge badge-silver" id="autoDetectSourceBadge" style="font-size: 9.5px; padding: 1px 6px;">AUTO-SYNC</span>
            </div>
            <div class="segment-track" style="height: 4px;">
              <div class="segment-fill" id="autoDetectWindowBar" style="width: 6%;"></div>
            </div>
            <div class="agent-usage-stats">
              <span>Used: <strong style="color: #ffffff;" id="autoDetectUsedText">0 tok</strong> <span style="color: #60a5fa;" id="autoDetectUsedPct">(0.0%)</span></span>
              <span>Remaining: <strong style="color: #ffffff;" id="autoDetectRemainText">2,000K tok</strong> <span style="color: var(--text-muted);" id="autoDetectRemainUsd">· $40.00 left</span></span>
            </div>
          </div>
        </div>

      </div>

      <!-- GFT-Style "Telemetry Objectives" 8-Cell Horizontal KPI Strip -->
      <div class="gft-objectives-wrap">
        <div class="gft-section-title">
          <span>Telemetry Objectives</span>
          <div style="display: inline-flex; align-items: center; gap: 8px;">
            <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);" id="currentWindowLabel" title="cairn1 — Antigravity IDE">cairn1 — Antigravity IDE</span>
            <button type="button" class="btn" style="padding: 4px 10px; font-size: 11px;" onclick="createManualSnapshot()">+ Snapshot</button>
            <button type="button" class="btn" style="padding: 4px 10px; font-size: 11px;" onclick="revertLatestShadow()">↺ Undo</button>
          </div>
        </div>

        <div class="gft-objectives-grid">
          <div class="gft-obj-cell">
            <span class="gft-obj-label">Requests ⓘ</span>
            <div class="gft-obj-bottom">
              <div><span class="gft-obj-val" id="gftObjRequests">0</span><span class="gft-obj-delta">+live</span></div>
              <div class="gft-mini-bars">
                <span style="height: 35%"></span><span style="height: 55%"></span><span style="height: 45%"></span><span style="height: 75%"></span><span class="accent" style="height: 100%"></span>
              </div>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">Session Steps ⓘ</span>
            <div class="gft-obj-bottom">
              <div><span class="gft-obj-val" id="gftObjSteps">0</span><span class="gft-obj-delta">+sync</span></div>
              <div class="gft-mini-bars">
                <span style="height: 40%"></span><span style="height: 60%"></span><span style="height: 50%"></span><span style="height: 85%"></span><span class="accent" style="height: 95%"></span>
              </div>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">Cache Hit Rate ⓘ</span>
            <div class="gft-obj-bottom">
              <span class="gft-obj-val" id="gftObjCacheHit">0.0%</span>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">Context Fill ⓘ</span>
            <div class="gft-obj-bottom">
              <span class="gft-obj-val" id="gftObjCtxFill">0.0%</span>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">PRD Tasks ⓘ</span>
            <div class="gft-obj-bottom">
              <div><span class="gft-obj-val" id="gftObjPrdTasks">65</span><span class="gft-obj-delta">repo</span></div>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">Cache Savings ⓘ</span>
            <div class="gft-obj-bottom">
              <span class="gft-obj-val" id="gftObjCacheSavings">80%</span>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">Avg. Step Cost ⓘ</span>
            <div class="gft-obj-bottom">
              <span class="gft-obj-val" id="gftObjAvgTurnUsd">$0.00</span>
            </div>
          </div>

          <div class="gft-obj-cell">
            <span class="gft-obj-label">Safety Gate ⓘ</span>
            <div class="gft-obj-bottom">
              <div><span class="gft-obj-val" id="gftObjSafetyStatus">Clear</span><span class="gft-obj-delta" id="gftObjSafetySub">0 held</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stakent-Style Live Model Usage Cards Strip (5 Models with Mini Trend Sparklines) -->
      <div class="ag-models-strip">
        <div class="ag-models-strip-head">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="font-size: 13.5px; font-weight: 600; color: #e4e4e7;">Top Coding Agents &amp; Models</span>
            <span class="gft-micro-pill">5 Models</span>
            <span style="font-size: 12px; color: var(--text-muted);">Select a model to inspect its session usage and pricing</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="profound-dots" id="agModelProgressDots">
              <span class="profound-dot active"></span>
              <span class="profound-dot"></span>
              <span class="profound-dot"></span>
              <span class="profound-dot"></span>
              <span class="profound-dot"></span>
            </div>
            <button type="button" class="btn" style="padding: 4px 10px; font-size: 11px;" onclick="switchView('ledger')">Combined Project Ledger ↗</button>
          </div>
        </div>
        <div class="ag-models-grid" id="agModelsLiveConsumptionGrid"></div>
      </div>

    </div>
  </section>

  <!-- ===================================================================== -->
  <!-- BAND 4: MAIN WORKBENCH COMPARTMENTS (Exact 50/50 Vertical Alignment)  -->
  <!-- ===================================================================== -->
  <main class="band">
    <div class="rail">

      <!-- ================================================================= -->
      <!-- VIEW 1: OVERVIEW WORKBENCH                                        -->
      <!-- ================================================================= -->
      <div id="viewOverview" class="workbench-grid">

        <!-- LEFT COLUMN -->
        <div class="workbench-col">

          <!-- COMPARTMENT 1: REMOTE PHONE -> ANTIGRAVITY IDE CONTROL & QUICK ACTIONS -->
          <div class="panel-cell">
            <div class="panel-head">
              <div>
                <div class="panel-kicker">01 / REMOTE CONTROL & STEERING</div>
                <div class="panel-title">Send a message to <span id="steerHarnessTitle">your active IDE</span></div>
                <div class="panel-sub">Send an instruction directly to the active IDE window, or queue it for the next agent turn.</div>
              </div>
              <span class="badge badge-neutral" id="queuedSteerBadge">Ready</span>
            </div>

            <textarea id="steerInput" rows="2" placeholder="Describe the change, fix, or task you want the agent to handle..."></textarea>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
              <label style="display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="steerForwardIde" checked style="width: auto; accent-color: #ffffff;" />
                <span>Paste and submit in the active IDE window</span>
              </label>
              <button type="button" class="btn btn-white" id="sendSteerBtn" onclick="sendSteerMessage()"><svg class="icon btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg><span>Send to IDE</span></button>
            </div>

            <div id="steerStatus" style="font-size: 12.5px; color: var(--green); min-height: 4px;"></div>

            <!-- Inline Quick IDE Controls (Never blocks the screen or Safari bottom bar) -->
            <div class="shortcut-group">
              <div class="shortcut-heading"><span>QUICK ACTIONS</span><span>Send to active IDE</span></div>
              <div class="quick-ide-grid">
                <button type="button" class="btn" title="Send the Enter key to the active IDE" onclick="sendMacro('enter')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Enter</button>
                <button type="button" class="btn" title="Send Escape to the active IDE" onclick="sendMacro('esc')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>Escape</button>
                <button type="button" class="btn" onclick="sendMacro('ctrl+c')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 17V5a2 2 0 0 1 2-2h12"/></svg>Stop</button>
                <button type="button" class="btn" onclick="sendMacro('ctrl+s')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></svg>Save</button>
              </div>
            </div>

            <div id="steerQueueList"></div>
          </div>

          <!-- COMPARTMENT 2: SAFETY GATE APPROVALS (Compact when 0 waiting, expands when needed) -->
          <div class="panel-cell">
            <div class="panel-head" style="align-items: center;">
              <div>
                <div class="panel-kicker">02 / SAFETY GATE</div>
                <div class="panel-title">Actions Waiting for Approval</div>
              </div>
              <span class="badge badge-neutral" id="pendingCountLabel">0 waiting</span>
            </div>
            <div id="pendingList">
              <div class="safety-clear-bar">
                <span>✓ All clear — no risky edits or commands waiting</span>
              </div>
            </div>
          </div>

          <!-- COMPARTMENT 3: ANTIGRAVITY IDE MODELS & COST COMPARISON (No inner scroll trap!) -->
          <div class="panel-cell">
            <div class="panel-head" style="align-items: center;">
              <div>
                <div class="panel-kicker">03 / MODEL COST COMPARISON</div>
                <div class="panel-title">Antigravity IDE Models & Extended Catalog</div>
                <div class="panel-sub">Compare your live session and full project cost across your 5 Antigravity IDE models or switch with one tap.</div>
              </div>
              <button type="button" class="btn" style="padding: 6px 11px; font-size: 11.5px;" onclick="switchView('estimator')">Full Table →</button>
            </div>

            <div class="filter-bar">
              <div class="filter-pills">
                <button type="button" class="filter-pill active" id="ovFilterHarness" onclick="setOverviewModelFilter('harness')">Antigravity Models (5)</button>
                <button type="button" class="filter-pill" id="ovFilterAll" onclick="setOverviewModelFilter('all')">All Models</button>
              </div>
              <div class="extended-dropdown-wrap">
                <button type="button" class="extended-btn" style="height: 34px; font-size: 11px;" onclick="toggleExtendedMenu('ovExtendedMenu', event)">+ Extended Models ▾</button>
                <div id="ovExtendedMenu" class="extended-menu hidden"></div>
              </div>
            </div>

            <div id="overviewModelCompareList" class="card-stack"></div>
          </div>

          <!-- COMPARTMENT 4: COST BY TECHNICAL PART (UI vs BACKEND vs TELEMETRY vs INFRA) -->
          <div class="panel-cell">
            <div class="panel-head" style="align-items: center;">
              <div>
                <div class="panel-kicker">04 / COST BY TECHNICAL LAYER</div>
                <div class="panel-title">Tokens & Spend by Project Part (UI vs. Backend)</div>
                <div class="panel-sub">Simple breakdown of how your session tokens and money were spent across UI, Backend, Telemetry, and Testing.</div>
              </div>
              <span class="badge badge-silver" id="techTotalBadge">5 Layers</span>
            </div>
            <div id="technicalBreakdownList" class="card-stack">
              <div class="empty-box" style="border: none;">Calculating technical cost distribution...</div>
            </div>
          </div>

          <!-- COMPARTMENT 5: INSTANT UNDO CHECKPOINTS -->
          <div class="panel-cell">
            <div class="panel-head" style="align-items: center;">
              <div>
                <div class="panel-kicker">05 / TIME MACHINE</div>
                <div class="panel-title">Instant Undo (Git Shadow Snapshots)</div>
                <div class="panel-sub">Zero-noise working-tree snapshots created before agent file edits.</div>
              </div>
              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button type="button" class="btn" onclick="createManualSnapshot()" style="padding: 6px 10px; font-size: 12px;">+ Snapshot</button>
              <button type="button" class="btn btn-white" onclick="revertLatestShadow()" style="padding: 6px 10px; font-size: 12px;"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a8 8 0 1 1 2 6"/><path d="M3 4v7h7"/></svg>Revert</button>
              </div>
            </div>
            <div id="checkpointList" class="card-stack">
              <div class="empty-box" style="border: none;">No file checkpoints recorded yet.</div>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN -->
        <div class="workbench-col">

          <!-- COMPARTMENT 6: LIVE ANTIGRAVITY ACTIVITY STREAM -->
          <div class="panel-cell" style="height: 100%;">
            <div class="panel-head" style="align-items: center;">
              <div>
                <div class="panel-kicker">06 / LIVE TELEMETRY STREAM</div>
                <div class="panel-title" id="activityStreamTitle">Live Antigravity IDE Activity</div>
                <div class="panel-sub">Real-time agent steps, detected model attribution, prompt cache reads, and per-turn cost.</div>
              </div>
              <span class="badge badge-silver" id="agStepsBadge">Live Sync</span>
            </div>
            <div id="liveActivityList" class="feed-list" style="max-height: 1150px;">
              <div class="empty-box" style="border: none;">Waiting for activity from the detected IDE…</div>
            </div>
          </div>

        </div>

      </div>

      <div id="viewActivity" class="hidden"></div>

      <!-- ================================================================= -->
      <!-- VIEW 2: LIVE IDE WINDOW & REAL-TIME PROMPT + OUTPUT CONSOLE       -->
      <!-- ================================================================= -->
      <div id="viewIde" class="workbench-grid hidden">

        <!-- LEFT: INTERACTIVE LIVE WINDOW + PROMPT COMPOSER + LIVE OUTPUT -->
        <div class="workbench-col">
          <div class="panel-cell">
            <div class="panel-head">
              <div>
                <div class="panel-kicker">01 / LIVE VIEWPORT</div>
                <div class="panel-title" id="liveWindowTitle">cairn1 — Antigravity IDE (Current Window)</div>
                <div class="panel-sub">See what is happening in your workspace, tap the window to click, type a prompt below, and see the live output immediately.</div>
              </div>
              <div style="display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap;">
                <button type="button" class="btn" onclick="captureFrameOnce()">↻ Refresh</button>
                <button type="button" class="btn btn-white" id="streamToggleBtn" onclick="toggleAutoStream()">● Live Stream: ON</button>
              </div>
            </div>

            <div class="window-stage" id="viewportWrap">
              <div class="stage-pill" id="fpsLabel">Live Window Ready</div>
              <img id="ideViewport" alt="Current Antigravity IDE Window" onclick="onViewportTap(event)" />
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input id="remoteKeyInput" style="flex: 1; min-width: 180px;" placeholder="Type a prompt or instruction to send directly into Antigravity IDE..." onkeydown="if(event.key==='Enter') sendCustomTextToIde()" />
              <button type="button" class="btn btn-white" id="liveIdeSendBtn" onclick="sendCustomTextToIde()"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>Send Prompt</button>
            </div>
            <div id="liveIdeSendStatus" style="font-size: 12.5px; color: var(--green); min-height: 6px;"></div>

            <div class="quick-ide-grid">
              <button type="button" class="btn" title="Send the Enter key to the active IDE" onclick="sendMacro('enter')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Enter</button>
              <button type="button" class="btn" title="Send Escape to the active IDE" onclick="sendMacro('esc')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>Escape</button>
              <button type="button" class="btn" onclick="sendMacro('ctrl+c')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 17V5a2 2 0 0 1 2-2h12"/></svg>Stop</button>
              <button type="button" class="btn" onclick="sendMacro('ctrl+s')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/></svg>Save</button>
            </div>
          </div>

          <!-- LIVE CONVERSATION & AGENT OUTPUT CONSOLE (Directly below prompt composer on mobile!) -->
          <div class="panel-cell">
            <div class="panel-head" style="align-items: center;">
              <div>
                <div class="panel-kicker">02 / LIVE CONVERSATION & AGENT OUTPUT</div>
                <div class="panel-title">Your Prompts & Live Antigravity Output</div>
                <div class="panel-sub">Real-time view of every prompt you send and the exact response, tool calls, and output from your Antigravity agent.</div>
              </div>
              <span class="badge badge-green" id="liveConsoleCountBadge">Live Output</span>
            </div>
            <div id="liveIdeOutputConsole" class="live-output-stream">
              <div class="empty-box" style="border: none;">Send your first prompt to the active IDE agent.</div>
            </div>
          </div>
        </div>

        <!-- RIGHT: WINDOW CONTROLS & PHONE LINK -->
        <div class="workbench-col">
          <div class="panel-cell">
            <div class="panel-kicker">03 / OS WINDOW MANAGEMENT</div>
            <div class="panel-title">Window State Controls</div>
            <div class="panel-sub">Control your active Antigravity IDE window on your desktop:</div>
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">
              <button type="button" class="btn btn-white" onclick="windowAction('focus')">Bring to Front</button>
              <button type="button" class="btn" onclick="windowAction('maximize')">Maximize</button>
              <button type="button" class="btn" onclick="windowAction('minimize')">Minimize</button>
            </div>
          </div>

          <div class="panel-cell">
            <div class="panel-kicker">04 / EDITOR SHORTCUTS</div>
            <div class="panel-title">One-Tap IDE Macros</div>
            <div class="panel-sub">Trigger instant IDE commands and keystrokes remotely:</div>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">
              <button type="button" class="btn" onclick="sendIdeRpc('workbench.action.files.saveAll')">Save All Files</button>
              <button type="button" class="btn" onclick="sendIdeRpc('workbench.action.terminal.toggleTerminal')">Toggle Terminal</button>
              <button type="button" class="btn" onclick="sendMacro('ctrl+z')">Send Ctrl+Z (Undo)</button>
              <button type="button" class="btn" onclick="revertLatestShadow()">↩ Git Shadow Undo</button>
            </div>
          </div>

          <div class="panel-cell">
            <div class="panel-kicker">05 / MOBILE PAIRING</div>
            <div class="panel-title">Open on Your Phone</div>
            <div class="panel-sub">Open this LAN URL on your phone to monitor and control Antigravity IDE from anywhere on Wi-Fi:</div>
            <div class="clean-path-box" style="user-select: all;"><a href="${params.lanUrl}/remote?token=${params.pairingToken}" target="_blank" style="color: #93c5fd; text-decoration: underline; word-break: break-all;">${params.lanUrl}/remote?token=${params.pairingToken}</a></div>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <button type="button" class="btn btn-silver" onclick="navigator.clipboard.writeText('${params.lanUrl}/remote?token=${params.pairingToken}'); showToast('✓ Remote pairing link copied to clipboard');">Copy Link</button>
              <button type="button" class="btn btn-silver" onclick="navigator.clipboard.writeText('${params.pairingToken}'); showToast('✓ Pairing token copied to clipboard');">Copy Token</button>
            </div>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- VIEW 3: MODEL & COST COMPARISON (FRONTIER VS. OPEN-SOURCE)        -->
      <!-- ================================================================= -->
      <div id="viewEstimator" class="hidden">

        <div class="panel-cell" style="border-bottom: 1px solid var(--line-solid);">
          <div class="panel-head">
            <div>
              <div class="panel-kicker">01 / MULTI-AGENT & PRD COST SIMULATOR</div>
              <div class="panel-title">Antigravity, Claude Code, OpenCode & Hermes Cost Benchmark</div>
              <div class="panel-sub">Compare your live session tokens and full 65-task PRD across Frontier, Open-Source Cloud, and Local ($0) models.</div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 480px;">
              <select id="estimateModelSelect" style="flex: 1; min-width: 160px;" onchange="onModelSelectChange(this, 'estTopExtendedMenu')"></select>
              <div class="extended-dropdown-wrap">
                <button type="button" class="extended-btn" onclick="toggleExtendedMenu('estTopExtendedMenu', event)">+ Extended ▾</button>
                <div id="estTopExtendedMenu" class="extended-menu hidden"></div>
              </div>
              <button type="button" class="btn btn-white" onclick="runPrdEstimate()">Recalculate →</button>
            </div>
          </div>
        </div>

        <div class="metrics-architectural-grid" style="border-bottom: 1px solid var(--line-solid);">
          <div class="metric-cell">
            <div class="metric-header"><span>Best-Case Project Cost</span></div>
            <div class="metric-giant" id="estLowUsd">--</div>
            <div class="metric-desc" id="estLowTokens">-- tokens</div>
          </div>
          <div class="metric-cell">
            <div class="metric-header"><span>Expected Project Cost</span><span class="badge badge-silver">Selected Agent</span></div>
            <div class="metric-giant" id="estExpectedUsd">--</div>
            <div class="metric-desc" id="estExpectedTokens">-- tokens</div>
          </div>
          <div class="metric-cell">
            <div class="metric-header"><span>High-Retry Bound</span></div>
            <div class="metric-giant" id="estHighUsd">--</div>
            <div class="metric-desc" id="estHighTokens">-- tokens</div>
          </div>
          <div class="metric-cell">
            <div class="metric-header"><span>Scanned Repository</span></div>
            <div class="metric-giant" id="estConfidence">--</div>
            <div class="metric-desc" id="estRepoSub">--</div>
          </div>
        </div>

        <!-- FULL SIDE-BY-SIDE COMPARISON TABLE: FRONTIER VS OPEN-SOURCE VS LOCAL -->
        <div class="panel-cell" style="border-bottom: 1px solid var(--line-solid);">
          <div class="panel-head">
            <div>
              <div class="panel-kicker">02 / FRONTIER VS. OPEN-SOURCE BENCHMARK</div>
              <div class="panel-title">Same Project & Live Session Cost Across Models</div>
              <div class="panel-sub">Focused on your active IDE's models by default. Use <strong>+ Extended Models ▾</strong> to compare or switch to any extended Frontier, Open-Source, or Local ($0) model.</div>
            </div>
            <div class="filter-pills">
              <button type="button" class="filter-pill active" id="estFilterHarness" onclick="setEstimatorModelFilter('harness')">Antigravity Models (5)</button>
              <button type="button" class="filter-pill" id="estFilterAll" onclick="setEstimatorModelFilter('all')">All Models</button>
              <div class="extended-dropdown-wrap">
                <button type="button" class="extended-btn" style="height: 34px; font-size: 11px;" onclick="toggleExtendedMenu('estExtendedMenu', event)">+ Extended Models ▾</button>
                <div id="estExtendedMenu" class="extended-menu hidden"></div>
              </div>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model / Agent</th>
                  <th>Category</th>
                  <th>Pricing (In / Cache / Out per 1M)</th>
                  <th>Live Session Cost</th>
                  <th>Full Project PRD Cost (Low – High)</th>
                  <th>Comparison</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="fullComparisonTableBody"></tbody>
            </table>
          </div>
        </div>

        <div class="workbench-grid" style="border-bottom: 1px solid var(--line-solid);">
          <div class="workbench-col">
            <div class="panel-cell">
              <div class="panel-kicker">03 / MODULE COST ATTRIBUTION</div>
              <div class="panel-title">Top Project Cost Drivers</div>
              <div id="costDriversList" class="card-stack"></div>
            </div>
          </div>
          <div class="workbench-col">
            <div class="panel-cell">
              <div class="panel-kicker">04 / TASK BREAKDOWN</div>
              <div class="panel-title" id="taskTableTitle">Project Tasks</div>
              <div class="table-wrap" style="max-height: 360px; overflow-y: auto;">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Task</th>
                      <th>Size</th>
                      <th>Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody id="estimateTasksBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- VIEW 4: PROJECT LEDGER (COMBINED MULTI-AGENT PROJECT TELEMETRY)   -->
      <!-- ================================================================= -->
      <div id="viewLedger" class="hidden">

        <div class="panel-cell" style="border-bottom: 1px solid var(--line-solid); background: radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.05), transparent 55%), radial-gradient(circle at 80% 0%, rgba(255, 255, 255, 0.03), transparent 55%);">
          <div class="panel-head">
            <div>
              <div class="panel-kicker">01 / COMBINED MULTI-AGENT PROJECT LEDGER</div>
              <div class="panel-title" id="ledgerHeroTitle">Overall Project Consumption Across All Coding Agents</div>
              <div class="panel-sub">Unified live telemetry combining Antigravity IDE (all 5 models), Codex CLI, Claude Code, OpenCode, Hermes Agent, and Cairn Gateway for this project.</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="profound-dots">
                <span class="profound-dot active"></span>
                <span class="profound-dot"></span>
                <span class="profound-dot"></span>
              </div>
              <button type="button" class="btn btn-white" onclick="refreshProjectLedgerNow()">↻ Sync All Agents</button>
            </div>
          </div>
        </div>

        <div class="metrics-architectural-grid" style="border-bottom: 1px solid var(--line-solid);">
          <div class="metric-cell">
            <div class="metric-header">
              <span>Combined Project Spend</span>
              <span class="badge badge-green" id="ledgerActiveAgentsCount">All Agents</span>
            </div>
            <div class="metric-giant" id="ledgerTotalUsd">$0.00</div>
            <div class="metric-desc" id="ledgerTotalUsdSub">Combined across all coding agents on this project</div>
          </div>
          <div class="metric-cell">
            <div class="metric-header">
              <span>Combined Project Tokens</span>
              <span class="badge badge-green" id="ledgerCacheHitBadge">Prompt Cached</span>
            </div>
            <div class="metric-giant" id="ledgerTotalTokens">0</div>
            <div class="metric-desc" id="ledgerTotalTokensSub">Uncached In + Cache Reads + Output tokens</div>
          </div>
          <div class="metric-cell">
            <div class="metric-header">
              <span>Total Agent Turns &amp; Sessions</span>
              <span class="badge badge-silver">Multi-Harness</span>
            </div>
            <div class="metric-giant" id="ledgerTotalSteps">0</div>
            <div class="metric-desc" id="ledgerTotalSessionsSub">Synced across Antigravity, Codex, OpenCode &amp; Hermes</div>
          </div>
          <div class="metric-cell">
            <div class="metric-header">
              <span>Active Antigravity Agent</span>
              <span class="badge badge-green">Live</span>
            </div>
            <div class="metric-giant" style="font-size: 22px;" id="ledgerPrimaryModelName">Gemini 4 Argon</div>
            <div class="metric-desc" id="ledgerPrimaryModelSub">Switch agents anytime in the bar above</div>
          </div>
        </div>

        <div class="panel-cell" style="border-bottom: 1px solid var(--line-solid);">
          <div class="panel-head">
            <div>
              <div class="panel-kicker">02 / MULTI-HARNESS BREAKDOWN (ANTIGRAVITY · CODEX · CLAUDE CODE · OPENCODE · HERMES)</div>
              <div class="panel-title">Combined Project Spend &amp; Token Telemetry by Agent</div>
              <div class="panel-sub">Shows actual recorded sessions on this workspace plus the equivalent full-project cost on each coding agent.</div>
            </div>
          </div>
          <div class="ledger-cards-grid" id="projectLedgerAgentsGrid"></div>
        </div>

        <div class="panel-cell">
          <div class="panel-head">
            <div>
              <div class="panel-kicker">03 / ANTIGRAVITY IDE — ALL 5 MODELS CONSUMPTION BREAKDOWN</div>
              <div class="panel-title">Live Consumption Across All 5 Antigravity IDE Agents</div>
              <div class="panel-sub">Click any model row to switch the active Antigravity bar and recalculate live session metrics immediately.</div>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Antigravity IDE Agent</th>
                  <th>Status</th>
                  <th>Steps Executed</th>
                  <th>Tokens (In / Cache / Out)</th>
                  <th>Context Fill &amp; Cache</th>
                  <th>Recorded Spend</th>
                  <th>Equivalent Session Cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="ledgerAntigravityModelsTable"></tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- VIEW 5: PROJECT INTELLIGENCE AI (CONVERSATIONAL FORENSICS)        -->
      <!-- ================================================================= -->
      <div id="viewIntel" class="intel-shell hidden">
        <div class="intel-hero-bar">
          <div class="intel-hero-left">
            <div class="intel-kicker-row">
              <span class="intel-spark-pill">✦ PROJECT INTELLIGENCE AI · GROUND-TRUTH TELEMETRY</span>
              <span class="badge badge-green" id="intelStatusBadge">Cirrascale AI Suite Ready</span>
            </div>
            <div class="intel-hero-title">Ask Anything About Project Costs, Tokens &amp; Recent Work</div>
            <div class="intel-hero-sub">Every answer is computed directly from Cairn's SQLite call ledger, live IDE transcripts, technical layer attribution, and Git Shadow checkpoints.</div>
          </div>

          <div class="intel-controls-box">
            <select id="intelModelSelect" class="intel-model-select" aria-label="Select Intelligence Model">
              <option value="Llama-3.3-70B">Llama 3.3 70B · Deep Forensics</option>
              <option value="Llama-3.1-8B">Llama 3.1 8B · Instant Fast (~1s)</option>
              <option value="DeepSeek-R1-Distill-Llama-70B">DeepSeek R1 70B · Reasoning</option>
              <option value="Qwen-QwQ-32B">Qwen QwQ 32B · Analytical</option>
            </select>
            <input id="intelTaskFilterInput" class="intel-task-input" placeholder="Task ID (optional)" aria-label="Optional Task ID filter" />
          </div>
        </div>

        <div class="intel-prompts-band">
          <div class="intel-prompts-label">
            <span>ONE-TAP FORENSIC QUERIES</span>
            <span style="color: #93c5fd;">7 Read-Only Telemetry Tools Connected</span>
          </div>
          <div class="intel-prompts-grid">
            <button type="button" class="intel-prompt-card" onclick="askProjectIntel('Why did this session cost what it did, and which specific steps or retries were the most expensive?')">
              <div class="intel-prompt-card-top"><span>01 / COST FORENSICS</span><span>→</span></div>
              <div class="intel-prompt-card-title">Why did this task / session cost so much?</div>
              <div class="intel-prompt-card-sub">Isolates peak steps, retry loops, and uncached prompt spikes</div>
            </button>

            <button type="button" class="intel-prompt-card" onclick="askProjectIntel('Where were the most tokens spent across UI, Backend, Telemetry, models, and cache reads vs uncached input?')">
              <div class="intel-prompt-card-top"><span>02 / TOKEN ANATOMY</span><span>→</span></div>
              <div class="intel-prompt-card-title">Where were all the tokens spent?</div>
              <div class="intel-prompt-card-sub">Breaks down tokens by technical layer, model, and cache hit ratio</div>
            </button>

            <button type="button" class="intel-prompt-card" onclick="askProjectIntel('What was the last work done on this project, which tools executed, and what files or commits were modified?')">
              <div class="intel-prompt-card-top"><span>03 / WORK &amp; GIT AUDIT</span><span>→</span></div>
              <div class="intel-prompt-card-title">What was the last work done?</div>
              <div class="intel-prompt-card-sub">Summarizes latest agent turns, modified files, and git snapshots</div>
            </button>

            <button type="button" class="intel-prompt-card" onclick="askProjectIntel('How does our actual session and project spend compare to our PRD cost estimate and budget cap?')">
              <div class="intel-prompt-card-top"><span>04 / PRD &amp; BUDGET VARIANCE</span><span>→</span></div>
              <div class="intel-prompt-card-title">How does spend compare to PRD forecast?</div>
              <div class="intel-prompt-card-sub">Compares real spend against the 65-task PRD baseline &amp; caps</div>
            </button>

            <button type="button" class="intel-prompt-card" onclick="askProjectIntel('Compare token usage, sessions, and USD spend across Antigravity IDE, Claude Code, Codex, and OpenCode.')">
              <div class="intel-prompt-card-top"><span>05 / MULTI-AGENT LEDGER</span><span>→</span></div>
              <div class="intel-prompt-card-title">Which coding agent spent the most?</div>
              <div class="intel-prompt-card-sub">Cross-agent attribution across Antigravity, Claude Code &amp; Codex</div>
            </button>

            <button type="button" class="intel-prompt-card" onclick="askProjectIntel('If we ran this exact session workload on other models, how much would each cost and which model is most cost-effective?')">
              <div class="intel-prompt-card-top"><span>06 / MODEL SAVINGS</span><span>→</span></div>
              <div class="intel-prompt-card-title">How much could we save switching models?</div>
              <div class="intel-prompt-card-sub">Simulates exact session tokens across Frontier, Flash &amp; Local models</div>
            </button>
          </div>
        </div>

        <div class="intel-body-stage">
          <div class="intel-composer-box">
            <input id="intelQueryInput" placeholder="Ask any question about project costs, where tokens went, or recent work..." onkeydown="if(event.key==='Enter') submitIntelInput()" />
            <button type="button" class="btn btn-white intel-ask-btn" id="intelAskBtn" onclick="submitIntelInput()">✦ Ask AI →</button>
          </div>

          <div id="intelStreamList" class="intel-stream"></div>
        </div>
      </div>

    </div>
      <div id="viewSafety" class="workbench-grid hidden">
        <div class="workbench-col" id="safetyActionsColumn"></div>
        <div class="workbench-col" id="safetyUndoColumn"></div>
      </div>
  </main>

  <button type="button" class="intel-fab" onclick="switchView('intel')" title="Ask Cairn Project Intelligence AI">
    <span>✦ Ask Cairn AI</span>
  </button>

  <footer class="band">
    <div class="rail brand-footer-strip">
      <div class="brand-footer-assets">
        <img src="/brand/cairn-combined.png" alt="Cairn Combined Logo" class="brand-combined-img" />
        <img src="/brand/cairn-icon.jpg" alt="Cairn Pyramid Icon" class="brand-asset-img" style="height: 22px;" />
        <img src="/brand/cairn-wordmark.jpg" alt="Cairn Wordmark" class="brand-asset-img" style="height: 20px;" />
      </div>
      <div style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">
        <span style="background: var(--white-blue-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 600;">Cairn Gateway &amp; Control Plane</span> · Local-First AI Agent Governance
      </div>
    </div>
  </footer>

  <!-- ===================================================================== -->
  <!-- TOP TOAST NOTIFICATION                                                -->
  <!-- ===================================================================== -->
  <div id="toastBanner" class="toast-banner hidden"></div>

  <script>
    let TOKEN = ${JSON.stringify(params.pairingToken)};
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken && urlToken.trim()) {
        TOKEN = urlToken.trim();
        localStorage.setItem('cairn_pairing_token', TOKEN);
      } else if (!TOKEN || TOKEN === 'null' || TOKEN === 'undefined' || TOKEN === '') {
        const saved = localStorage.getItem('cairn_pairing_token');
        if (saved) TOKEN = saved;
      } else {
        localStorage.setItem('cairn_pairing_token', TOKEN);
      }
    } catch (e) {}
    let autoStream = true;
    let currentView = 'overview';
    let currentWindowHwnd = '';
    let toastTimer = null;
    let overviewModelFilter = 'harness';
    let estimatorModelFilter = 'harness';
    let latestEstimateData = null;
    let latestSessionComparison = [];
    let latestProjectLedger = null;
    let latestAntigravityState = null;
    let currentActiveModelId = 'google/gemini-4-argon';
    let currentActiveHarness = 'antigravity';
    let currentActiveHarnessLabel = 'Antigravity IDE';
    const pendingRemoteReplies = new Map();

    document.addEventListener('click', () => {
      closeAllExtendedMenus();
    });

    function closeAllExtendedMenus() {
      const menus = ['heroExtendedMenu', 'ovExtendedMenu', 'estTopExtendedMenu', 'estExtendedMenu'];
      for (const id of menus) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      }
    }

    function toggleExtendedMenu(menuId, ev) {
      if (ev) ev.stopPropagation();
      const target = document.getElementById(menuId);
      if (!target) return;
      const isHidden = target.classList.contains('hidden');
      closeAllExtendedMenus();
      if (isHidden) {
        target.classList.remove('hidden');
        if (window.innerWidth > 640) {
          target.style.left = 'auto';
          target.style.right = '0';
          const r = target.getBoundingClientRect();
          if (r.left < 8) {
            target.style.left = '0';
            target.style.right = 'auto';
          }
        }
      }
    }

    function onModelSelectChange(selectEl, menuId) {
      const val = selectEl.value;
      if (val === '__open_extended__') {
        selectEl.value = currentActiveModelId;
        toggleExtendedMenu(menuId);
        return;
      }
      switchActiveAgentModel(val);
    }

    function showToast(msg) {
      const el = document.getElementById('toastBanner');
      if (!el) return;
      el.textContent = msg;
      el.classList.remove('hidden');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        el.classList.add('hidden');
      }, 3200);
    }

    function formatCompactTokens(n) {
      const val = Number(n || 0);
      if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return String(val);
    }

    function escapeHtml(str) {
      return String(str || '')
        .split('&').join('&amp;')
        .split('<').join('&lt;')
        .split('>').join('&gt;')
        .split('"').join('&quot;');
    }

    function cleanWorkspaceSummary(raw) {
      if (!raw) return '';
      const bs = String.fromCharCode(92);
      let s = String(raw).split(bs + bs).join('/').split(bs).join('/');
      const prefixes = [
        'e:/class related/Cairn Studios/cairn1/',
        'E:/class related/Cairn Studios/cairn1/',
        'C:/Users/Aryan/.gemini/antigravity/brain/'
      ];
      for (const p of prefixes) {
        s = s.split(p).join('');
      }
      return escapeHtml(s);
    }

    function formatTurnContent(raw, isUser) {
      if (!raw) return '';
      const bs = String.fromCharCode(92);
      let s = String(raw).split(bs + bs).join('/').split(bs).join('/');
      const prefixes = [
        'e:/class related/Cairn Studios/cairn1/',
        'E:/class related/Cairn Studios/cairn1/',
        'C:/Users/Aryan/.gemini/antigravity/brain/'
      ];
      for (const p of prefixes) {
        s = s.split(p).join('');
      }
      if (isUser) {
        return escapeHtml(s);
      }
      const bt = String.fromCharCode(96);
      let res = escapeHtml(s)
        .replace(/^### (.*?)$/gm, '<div style="font-size: 13.5px; font-weight: 700; color: var(--peacock); margin: 10px 0 4px 0;">$1</div>')
        .replace(/^## (.*?)$/gm, '<div style="font-size: 14.5px; font-weight: 700; color: #ffffff; margin: 12px 0 6px 0;">$1</div>')
        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong style="color: #ffffff; font-weight: 600;">$1</strong>')
        .replace(/^[•\\-\\*]\\s+(.*?)$/gm, '<div style="display: flex; gap: 6px; margin: 3px 0 3px 8px;"><span style="color: var(--green);">•</span><span>$1</span></div>')
        .replace(/^(\\d+)\\.\\s+(.*?)$/gm, '<div style="display: flex; gap: 6px; margin: 4px 0 4px 8px;"><span style="color: var(--peacock); font-weight: 600; font-family: var(--font-mono); font-size: 11.5px;">$1.</span><span>$2</span></div>')
        .replace(/^&gt;\\s+(.*?)$/gm, '<blockquote style="margin: 4px 0; padding: 4px 10px; border-left: 2px solid var(--peacock); background: var(--peacock-soft); color: #d4d4d8; font-style: italic;">$1</blockquote>');
      if (res.indexOf(bt) !== -1) {
        res = res.split(bt).map((part, idx) => idx % 2 === 1 ? '<code style="background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-family: var(--font-mono); font-size: 11.5px; color: #93c5fd;">' + part + '</code>' : part).join('');
      }
      return res;
    }

    function switchView(view) {
      currentView = view;
      const destination = (view === 'estimator' || view === 'ledger') ? 'costs' : view;
      document.body.classList.toggle('home-mode', destination === 'overview');
      document.body.classList.toggle('chat-mode', destination === 'ide');
      document.body.classList.toggle('intel-mode', destination === 'intel');
      document.getElementById('viewOverview').classList.toggle('hidden', destination !== 'overview');
      document.getElementById('viewIde').classList.toggle('hidden', destination !== 'ide');
      document.getElementById('viewActivity').classList.toggle('hidden', destination !== 'activity');
      document.getElementById('viewEstimator').classList.toggle('hidden', destination !== 'costs');
      const intelView = document.getElementById('viewIntel');
      if (intelView) intelView.classList.toggle('hidden', destination !== 'intel');
      const ledgerView = document.getElementById('viewLedger');
      if (ledgerView) ledgerView.classList.remove('hidden');
      const safetyView = document.getElementById('viewSafety');
      if (safetyView) safetyView.classList.toggle('hidden', destination !== 'safety');
      const ledgerDisclosure = document.querySelector('#viewEstimator .ledger-disclosure');
      if (ledgerDisclosure && view === 'ledger') ledgerDisclosure.open = true;

      document.getElementById('tabOverview').classList.toggle('active', destination === 'overview');
      const tabIntelEl = document.getElementById('tabIntel');
      if (tabIntelEl) tabIntelEl.classList.toggle('active', destination === 'intel');
      document.getElementById('tabIde').classList.toggle('active', destination === 'ide');
      document.getElementById('tabEstimator').classList.toggle('active', destination === 'costs');
      document.getElementById('tabRuns').classList.toggle('active', destination === 'activity');
      document.getElementById('tabSafety').classList.toggle('active', destination === 'safety');

      if (destination === 'intel') {
        ensureIntelWelcomeCard();
      } else if (destination === 'ide') {
        ensureControlWelcomeCard();
      } else if (view === 'ledger') {
        if (latestProjectLedger) {
          renderProjectLedgerView(latestProjectLedger, latestAntigravityState);
        } else {
          refreshProjectLedgerNow();
        }
      } else if (destination === 'costs') {
        if (!latestEstimateData) {
          runPrdEstimate();
        } else {
          renderEstimateView(latestEstimateData);
        }
      }
      const viewId = destination === 'intel' ? 'viewIntel' : destination === 'safety' ? 'viewSafety' : destination === 'activity' ? 'viewActivity' : destination === 'ledger' ? 'viewLedger' : destination === 'ide' ? 'viewIde' : destination === 'costs' ? 'viewEstimator' : 'viewOverview';
      const activeView = document.getElementById(viewId);
      if (activeView) {
        activeView.classList.remove('view-enter');
        requestAnimationFrame(() => activeView.classList.add('view-enter'));
      }
    }

    function organizeSafetyTools() {
      const targets = [
        ['02 / SAFETY GATE', 'safetyActionsColumn'],
        ['05 / TIME MACHINE', 'safetyUndoColumn'],
      ];
      for (const [prefix, targetId] of targets) {
        const kicker = Array.from(document.querySelectorAll('.panel-kicker')).find(el => el.textContent.trim().startsWith(prefix));
        const panel = kicker && kicker.closest('.panel-cell');
        const target = document.getElementById(targetId);
        if (panel && target) target.appendChild(panel);
      }
    }
    organizeSafetyTools();

    function addPageIntro(container, title, description) {
      if (!container || container.querySelector(':scope > .page-intro')) return;
      const intro = document.createElement('div');
      intro.className = 'page-intro';
      intro.innerHTML = '<h1>' + title + '</h1><p>' + description + '</p>';
      container.prepend(intro);
    }

    function makeDisclosure(title, className) {
      const details = document.createElement('details');
      details.className = 'subview-details' + (className ? ' ' + className : '');
      const summary = document.createElement('summary');
      summary.textContent = title;
      const content = document.createElement('div');
      content.className = 'subview-details-content';
      details.append(summary, content);
      return { details, content };
    }

    function organizeDashboardViews() {
      const overview = document.getElementById('viewOverview');
      const activity = document.getElementById('viewActivity');
      const ide = document.getElementById('viewIde');
      const estimator = document.getElementById('viewEstimator');
      const ledger = document.getElementById('viewLedger');
      const safety = document.getElementById('viewSafety');
      const main = document.querySelector('main .rail');
      if (!overview || !activity || !ide || !estimator || !main) return;

      addPageIntro(overview, 'Home', 'See whether your agent is connected, needs attention, or is ready for your next instruction.');
      addPageIntro(activity, 'Activity', 'Follow recent agent work. Open a turn to inspect its output and technical details.');
      addPageIntro(ide, 'Control', 'Chat with your connected IDE agent. Send a prompt and follow its reply here.');
      addPageIntro(estimator, 'Costs', 'Understand current spend first, then explore estimates and model comparisons.');
      addPageIntro(safety, 'Safety', 'Review actions waiting for approval and restore a recent workspace checkpoint.');
      const safetyDemo = makeDisclosure('Test approval flow · demo');
      safetyDemo.details.classList.add('safety-demo-disclosure');
      safetyDemo.content.style.padding = '14px 20px';
      safetyDemo.content.innerHTML = '<button type="button" class="btn" onclick="simulateRiskyAction()">Create a demo approval request</button>';
      safety.appendChild(safetyDemo.details);

      const homeIntro = overview.querySelector(':scope > .page-intro');
      if (homeIntro) {
        const attention = document.createElement('div');
        attention.className = 'panel-cell';
        attention.classList.add('home-attention');
        attention.style.cssText = 'padding-top:14px;padding-bottom:14px;flex-direction:row;align-items:center;justify-content:space-between;gap:12px;';
        attention.innerHTML = '<div><div class="panel-title" style="font-size:14px;" id="homeAttentionText">You are all caught up</div><div class="panel-sub">Cairn will flag actions that need your review.</div></div><button type="button" class="btn" onclick="switchView(&#39;safety&#39;)">Open Safety</button>';
        homeIntro.insertAdjacentElement('afterend', attention);
      }

      const homeQuickActions = overview.querySelector('.shortcut-group');
      if (homeQuickActions) {
        const quickDisclosure = makeDisclosure('IDE keyboard actions');
        homeQuickActions.parentElement.insertBefore(quickDisclosure.details, homeQuickActions);
        quickDisclosure.content.appendChild(homeQuickActions);
      }

      const activityFeedPanel = document.getElementById('liveActivityList')?.closest('.panel-cell');
      if (activityFeedPanel) activity.appendChild(activityFeedPanel);

      const overviewModelPanel = document.getElementById('overviewModelCompareList')?.closest('.panel-cell');
      const technicalPanel = document.getElementById('technicalBreakdownList')?.closest('.panel-cell');
      const costDisclosure = makeDisclosure('Model comparison and cost breakdown');
      estimator.appendChild(costDisclosure.details);
      if (overviewModelPanel) costDisclosure.content.appendChild(overviewModelPanel);
      if (technicalPanel) costDisclosure.content.appendChild(technicalPanel);

      const comparisonPanel = estimator.querySelector('#fullComparisonTableBody')?.closest('.panel-cell');
      const taskBreakdown = estimator.querySelector('.workbench-grid');
      const estimateDisclosure = makeDisclosure('Detailed estimate and task breakdown');
      estimator.appendChild(estimateDisclosure.details);
      if (comparisonPanel) estimateDisclosure.content.appendChild(comparisonPanel);
      if (taskBreakdown) estimateDisclosure.content.appendChild(taskBreakdown);

      const ledgerDisclosure = makeDisclosure('Combined project ledger');
      ledgerDisclosure.details.classList.add('ledger-disclosure');
      estimator.appendChild(ledgerDisclosure.details);
      if (ledger) {
        ledger.classList.remove('hidden');
        ledgerDisclosure.content.appendChild(ledger);
      }

      const controlColumns = ide.querySelectorAll('.workbench-col');
      const chatInput = document.getElementById('remoteKeyInput');
      const chatSend = document.getElementById('liveIdeSendBtn');
      const chatStatus = document.getElementById('liveIdeSendStatus');
      const chatLog = document.getElementById('liveIdeOutputConsole');
      const chatPanel = document.createElement('section');
      chatPanel.className = 'chat-remote';
      chatPanel.setAttribute('aria-label', 'Control & Project Intelligence Chat');

      const aiBar = document.createElement('div');
      aiBar.className = 'control-ai-bar';
      aiBar.innerHTML = '<div class="control-mode-pills">' +
        '<button type="button" class="control-mode-pill active" id="controlModeAiBtn" onclick="setControlChatMode(&apos;ai&apos;)">✦ Ask Project AI</button>' +
        '<button type="button" class="control-mode-pill" id="controlModeIdeBtn" onclick="setControlChatMode(&apos;ide&apos;)">⇄ Forward to IDE</button>' +
        '</div>' +
        '<div class="control-ai-meta">' +
        '<span class="badge badge-green" id="controlAiStatusBadge">✦ Telemetry AI Ready</span>' +
        '<select id="controlAiModelSelect" class="control-model-select">' +
        '<option value="Llama-3.3-70B">Llama 3.3 70B (Cirrascale Deep Forensics)</option>' +
        '<option value="Llama-3.1-8B">Llama 3.1 8B (Fast / Low Latency)</option>' +
        '<option value="DeepSeek-R1-Distill-Llama-70B">DeepSeek R1 70B (Reasoning)</option>' +
        '<option value="Qwen-QwQ-32B">Qwen QwQ 32B (Analytical)</option>' +
        '</select>' +
        '</div>';

      const chipsBar = document.createElement('div');
      chipsBar.className = 'control-quick-chips';
      chipsBar.id = 'controlQuickChips';
      chipsBar.innerHTML = '<button type="button" class="control-chip" data-q="Why did this task cost so much and what drove the spend?" onclick="askControlAi(this.getAttribute(&apos;data-q&apos;))">· Why did this cost so much?</button>' +
        '<button type="button" class="control-chip" data-q="Where were tokens spent across tasks and layers in this project?" onclick="askControlAi(this.getAttribute(&apos;data-q&apos;))">· Where were tokens spent?</button>' +
        '<button type="button" class="control-chip" data-q="What was the last work done in the project session?" onclick="askControlAi(this.getAttribute(&apos;data-q&apos;))">· What was the last work done?</button>' +
        '<button type="button" class="control-chip" data-q="Compare PRD estimated costs vs actual real-time spend so far" onclick="askControlAi(this.getAttribute(&apos;data-q&apos;))">· PRD vs Actual</button>' +
        '<button type="button" class="control-chip" data-q="Show multi-agent ledger breakdown across Antigravity, Codex, and Claude Code" onclick="askControlAi(this.getAttribute(&apos;data-q&apos;))">· Multi-Agent Spend</button>' +
        '<button type="button" class="control-chip" data-q="If we switch models, how much can we save on this session workload?" onclick="askControlAi(this.getAttribute(&apos;data-q&apos;))">· Model Savings</button>';

      const chatMessages = document.createElement('div');
      chatMessages.className = 'chat-message-list';
      chatMessages.id = 'remoteChatMessages';
      if (chatLog) chatMessages.appendChild(chatLog);

      const composer = document.createElement('div');
      composer.className = 'chat-composer';
      if (chatInput) {
        chatInput.placeholder = 'Ask any question about costs, tokens, PRD estimates, or recent work…';
        chatInput.setAttribute('aria-label', 'Ask Cairn Project AI or message IDE');
        composer.appendChild(chatInput);
      }
      if (chatSend) {
        chatSend.textContent = '✦ Ask AI →';
        chatSend.setAttribute('aria-label', 'Submit query or send prompt');
        composer.appendChild(chatSend);
      }
      chatPanel.append(aiBar, chipsBar, chatMessages, composer);
      if (chatStatus) {
        chatStatus.className = 'chat-send-status';
        chatPanel.appendChild(chatStatus);
      }
      ide.appendChild(chatPanel);
      if (chatSend) {
        chatSend.onclick = () => submitControlChatInput();
      }
      if (chatInput) {
        chatInput.addEventListener('keydown', event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitControlChatInput();
          }
        });
      }
      ide.style.gridTemplateColumns = 'minmax(0, 1fr)';
      for (const column of controlColumns) column.remove();

      for (const column of overview.querySelectorAll('.workbench-col')) {
        if (!column.children.length) column.remove();
      }
      if (overview.querySelectorAll('.workbench-col').length === 1) overview.style.gridTemplateColumns = 'minmax(0, 1fr)';

      // Add GFT-Style "Live Telemetry History" table section directly to Home overview
      const gftHistoryPanel = document.createElement('div');
      gftHistoryPanel.className = 'panel-cell';
      gftHistoryPanel.style.cssText = 'border-top: 1px solid var(--line-solid); padding: 20px 28px;';
      gftHistoryPanel.innerHTML = \`
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <div class="panel-kicker">LIVE TELEMETRY LEDGER</div>
            <div class="panel-title">Telemetry &amp; Step History</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input id="gftHistorySearchInput" placeholder="Search step, tool, or model..." oninput="filterGftHistoryRows(this.value)" style="width: 220px; height: 32px; padding: 4px 10px; font-size: 12px; background: #0c0d10; border-radius: 7px;" />
            <button type="button" class="btn" style="padding: 5px 10px; font-size: 11.5px;" onclick="switchView('activity')">Full Stream →</button>
          </div>
        </div>
        <div class="table-wrap" style="border-color: rgba(255,255,255,0.09); border-radius: 10px; background: #090a0d;">
          <table>
            <thead>
              <tr>
                <th>Ticket / Step</th>
                <th>Timestamp</th>
                <th>Model / Agent</th>
                <th>Tool / Action</th>
                <th>Type</th>
                <th>Input</th>
                <th>Cache Read</th>
                <th>Output</th>
                <th style="text-align: right;">Net Spend</th>
              </tr>
            </thead>
            <tbody id="gftHomeHistoryTableBody">
              <tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 18px;">Syncing live telemetry history...</td></tr>
            </tbody>
          </table>
        </div>
      \`;
      // Add Project Intelligence Quick-Ask Strip directly on Home Overview
      const homeIntelStrip = document.createElement('div');
      homeIntelStrip.className = 'panel-cell';
      homeIntelStrip.style.cssText = 'border-top: 1px solid var(--line-solid); padding: 18px 28px; background: radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.02) 0%, transparent 50%);';
      homeIntelStrip.innerHTML = \`
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <div class="panel-kicker" style="color: var(--text-muted);">✦ PROJECT INTELLIGENCE AI · FORENSICS</div>
            <div class="panel-title">Ask Why Tasks Cost What They Did, Where Tokens Went &amp; Recent Work</div>
          </div>
          <button type="button" class="btn btn-white" style="padding: 6px 12px; font-size: 12px;" onclick="switchView('intel')">Open Project AI →</button>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="intel-followup-chip" onclick="askFromAnywhere('Why did this session cost what it did, and which specific steps or retries were the most expensive?')">· Why did this cost so much?</button>
          <button type="button" class="intel-followup-chip" onclick="askFromAnywhere('Where were the most tokens spent across UI, Backend, Telemetry, and models?')">· Where were tokens spent?</button>
          <button type="button" class="intel-followup-chip" onclick="askFromAnywhere('What was the last work done on this project, which tools executed, and what files or commits were modified?')">· What was the last work done?</button>
          <button type="button" class="intel-followup-chip" onclick="askFromAnywhere('How does our actual session and project spend compare to our PRD cost estimate and budget cap?')">· PRD Forecast vs Actual</button>
        </div>
      \`;
      overview.appendChild(homeIntelStrip);

      overview.appendChild(gftHistoryPanel);

      for (const kicker of document.querySelectorAll('.panel-kicker')) {
        kicker.textContent = kicker.textContent.replace(/^\\d+\\s*\\/\\s*/, '');
      }
    }
    organizeDashboardViews();

    const intelHistoryTurns = [];
    let isIntelLoading = false;
    let controlChatMode = 'ai';
    let isControlAiLoading = false;
    const controlHistoryTurns = [];

    function setControlChatMode(mode) {
      controlChatMode = mode;
      const aiBtn = document.getElementById('controlModeAiBtn');
      const ideBtn = document.getElementById('controlModeIdeBtn');
      const input = document.getElementById('remoteKeyInput');
      const sendBtn = document.getElementById('liveIdeSendBtn');
      const statusBadge = document.getElementById('controlAiStatusBadge');
      const chips = document.getElementById('controlQuickChips');

      if (aiBtn) aiBtn.classList.toggle('active', mode === 'ai');
      if (ideBtn) ideBtn.classList.toggle('active', mode === 'ide');

      if (mode === 'ai') {
        if (input) input.placeholder = 'Ask any question about costs, tokens, PRD estimates, or recent work…';
        if (sendBtn) sendBtn.textContent = '✦ Ask AI →';
        if (statusBadge) {
          statusBadge.textContent = '✦ Telemetry AI Ready';
          statusBadge.className = 'badge badge-green';
        }
        if (chips) chips.style.display = 'flex';
      } else {
        if (input) input.placeholder = 'Message your IDE agent (forwarded to window)…';
        if (sendBtn) sendBtn.textContent = 'Send to IDE';
        if (statusBadge) {
          statusBadge.textContent = '⇄ Forwarding to IDE';
          statusBadge.className = 'badge badge-silver';
        }
        if (chips) chips.style.display = 'none';
      }
    }

    async function submitControlChatInput() {
      const inp = document.getElementById('remoteKeyInput');
      if (!inp) return;
      const text = inp.value.trim();
      if (!text) {
        showToast(controlChatMode === 'ai' ? 'Enter a question about the project' : 'Enter a prompt for the IDE');
        inp.focus();
        return;
      }
      inp.value = '';

      if (controlChatMode === 'ide' || text.startsWith('/ide ') || text.startsWith('!ide ')) {
        const cleaned = (text.startsWith('/ide ') || text.startsWith('!ide ')) ? text.slice(5).trim() : text;
        inp.value = cleaned;
        await sendCustomTextToIde();
        inp.value = '';
        return;
      }

      await askControlAi(text);
    }

    async function askControlAi(queryText) {
      const q = String(queryText || '').trim();
      if (!q || isControlAiLoading) return;
      isControlAiLoading = true;

      const chatMessages = document.getElementById('remoteChatMessages');
      const modelSelect = document.getElementById('controlAiModelSelect');
      const sendBtn = document.getElementById('liveIdeSendBtn');
      const statusEl = document.getElementById('liveIdeSendStatus');
      const selectedModel = modelSelect ? modelSelect.value : 'Llama-3.3-70B';

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '⏳ Analyzing…';
      }
      if (statusEl) {
        statusEl.textContent = '⏳ Executing telemetry tools & synthesizing root-cause answer…';
      }

      const pendingId = 'ctrl_intel_pending_' + Date.now();
      if (chatMessages) {
        const turnWrap = document.createElement('div');
        turnWrap.style.cssText = 'display: flex; flex-direction: column; gap: 10px; width: 100%;';
        turnWrap.innerHTML = '<div class="intel-turn-user" style="max-width: min(88%, 760px); align-self: flex-end;">' +
          '<div class="intel-turn-user-meta">You · Project Forensic Query</div>' +
          '<div>' + escapeHtml(q) + '</div>' +
          '</div>' +
          '<div class="intel-report-card" id="' + pendingId + '">' +
          '<div class="intel-report-head">' +
          '<span class="badge badge-silver">⏳ Querying Cairn SQLite DB, Transcript &amp; Git Shadow…</span>' +
          '<span style="font-family: var(--font-mono); font-size: 11px; color: #93c5fd;">' + escapeHtml(selectedModel) + '</span>' +
          '</div>' +
          '<div class="intel-answer-body" style="color: var(--text-secondary); font-size: 13px;">' +
          'Executing read-only telemetry tools (<code>get_task_cost_breakdown</code>, <code>explain_token_spend</code>, <code>get_recent_work_summary</code>) and synthesizing root-cause explanation…' +
          '</div>' +
          '</div>';
        chatMessages.appendChild(turnWrap);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      try {
        const res = await fetch('/api/intel/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
          body: JSON.stringify({
            query: q,
            model: selectedModel,
            history: controlHistoryTurns.slice(-6)
          })
        });
        const data = await res.json();
        const pendingEl = document.getElementById(pendingId);
        if (data && data.ok) {
          controlHistoryTurns.push({ role: 'user', content: q });
          controlHistoryTurns.push({ role: 'assistant', content: data.answer || '' });
          if (pendingEl) {
            pendingEl.outerHTML = buildIntelReportCardHtml(data);
          }
          if (statusEl) {
            statusEl.innerHTML = '<span style="color: var(--peacock); font-weight: 600;">✓ Answered by ' +
              escapeHtml(data.model || selectedModel) + ' (' + (data.latencyMs || 0) + 'ms)</span>';
          }
        } else if (pendingEl) {
          pendingEl.innerHTML = '<div class="intel-answer-body" style="color: var(--red);">Could not complete query: ' + escapeHtml((data && data.error && data.error.message) || 'Unknown error') + '</div>';
          if (statusEl) statusEl.textContent = '✕ Analysis query failed';
        }
      } catch (err) {
        const pendingEl = document.getElementById(pendingId);
        if (pendingEl) {
          pendingEl.innerHTML = '<div class="intel-answer-body" style="color: var(--red);">Network error contacting Cairn Daemon.</div>';
        }
        if (statusEl) statusEl.textContent = '✕ Network error contacting daemon';
      } finally {
        isControlAiLoading = false;
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = controlChatMode === 'ai' ? '✦ Ask AI →' : 'Send to IDE';
        }
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }
    }

    function ensureControlWelcomeCard() {
      const chatMessages = document.getElementById('remoteChatMessages');
      if (!chatMessages) return;
      const existing = document.getElementById('controlWelcomeCard');
      if (existing) return;
      const spendText = document.getElementById('statSpend') ? document.getElementById('statSpend').textContent : '$0.00';
      const tokensText = document.getElementById('statTokens') ? document.getElementById('statTokens').textContent : '0';
      const cacheText = document.getElementById('agLiveCacheRateBadge') ? document.getElementById('agLiveCacheRateBadge').textContent : '0% cached';
      const activeModel = (latestAntigravityState && latestAntigravityState.activeModelDisplayName) ? latestAntigravityState.activeModelDisplayName : 'Gemini 4 Argon';

      const welcomeDiv = document.createElement('div');
      welcomeDiv.className = 'intel-report-card';
      welcomeDiv.id = 'controlWelcomeCard';
      welcomeDiv.style.marginBottom = '8px';
      welcomeDiv.innerHTML = '<div class="intel-report-head">' +
        '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span class="badge badge-green">✦ CAIRN PROJECT INTELLIGENCE</span>' +
        '<span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary);">Direct SQLite &amp; Transcript Forensics</span>' +
        '</div>' +
        '<span class="badge badge-silver">Cirrascale AI Suite</span>' +
        '</div>' +
        '<div class="intel-kpi-strip">' +
        '<div class="intel-kpi-cell">' +
        '<span class="intel-kpi-label">Session Spend</span>' +
        '<span class="intel-kpi-val tone-blue">' + escapeHtml(spendText) + '</span>' +
        '</div>' +
        '<div class="intel-kpi-cell">' +
        '<span class="intel-kpi-label">Session Tokens</span>' +
        '<span class="intel-kpi-val">' + escapeHtml(tokensText) + '</span>' +
        '</div>' +
        '<div class="intel-kpi-cell">' +
        '<span class="intel-kpi-label">Prompt Cache</span>' +
        '<span class="intel-kpi-val tone-green">' + escapeHtml(cacheText) + '</span>' +
        '</div>' +
        '<div class="intel-kpi-cell">' +
        '<span class="intel-kpi-label">Active Agent</span>' +
        '<span class="intel-kpi-val" style="font-size: 14px;">' + escapeHtml(activeModel) + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="intel-answer-body">' +
        '<div style="font-size: 14.5px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">Ask any question about your project right here</div>' +
        '<div style="color: var(--text-secondary); font-size: 12.5px; line-height: 1.5;">' +
        'Ask why a task cost so much, where tokens were spent, what the last work done was, or compare PRD estimates vs actual costs. Tap any suggestion chip above or type your question below.' +
        '</div>' +
        '</div>';
      chatMessages.prepend(welcomeDiv);
    }

    function askFromAnywhere(questionText) {
      switchView('intel');
      askProjectIntel(questionText);
    }

    function submitIntelInput() {
      const inp = document.getElementById('intelQueryInput');
      if (!inp) return;
      const text = inp.value.trim();
      if (!text) {
        showToast('Enter a question about project costs, tokens, or recent work');
        inp.focus();
        return;
      }
      inp.value = '';
      askProjectIntel(text);
    }

    function ensureIntelWelcomeCard() {
      const streamEl = document.getElementById('intelStreamList');
      if (!streamEl || streamEl.children.length > 0) return;
      const ag = latestAntigravityState;
      const spendText = document.getElementById('statSpend') ? document.getElementById('statSpend').textContent : '$0.00';
      const tokensText = document.getElementById('statTokens') ? document.getElementById('statTokens').textContent : '0';
      const cacheText = document.getElementById('agLiveCacheRateBadge') ? document.getElementById('agLiveCacheRateBadge').textContent : '0% cached';
      const activeModel = (ag && ag.activeModelDisplayName) ? ag.activeModelDisplayName : 'Gemini 4 Argon';
      const layers = (ag && ag.technicalBreakdown) ? ag.technicalBreakdown : [];

      const bdHtml = layers.length > 0
        ? '<div class="intel-breakdown-section"><div class="intel-breakdown-title">Live Cost &amp; Token Attribution by Technical Layer</div><div class="intel-breakdown-rows">' +
          layers.map(l => \`
            <div class="intel-bd-row">
              <div class="intel-bd-top">
                <span class="intel-bd-label">\${escapeHtml(l.label)}</span>
                <span class="intel-bd-metrics">$\${Number(l.costUsd || 0).toFixed(4)} · \${formatCompactTokens(l.totalTokens)} tok (\${Number(l.sharePercent || 0).toFixed(1)}%)</span>
              </div>
              <div class="segment-track" style="height: 4px;"><div class="segment-fill" style="width: \${Math.max(4, Math.min(100, l.sharePercent))}%;"></div></div>
              <div class="intel-bd-sub">\${l.stepsCount} steps · \${escapeHtml(l.description)}</div>
            </div>
          \`).join('') + '</div></div>'
        : '';

      streamEl.innerHTML = \`
        <div class="intel-report-card" id="intelWelcomeCard">
          <div class="intel-report-head">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="badge badge-green">✦ CAIRN TELEMETRY READY</span>
              <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">Connected to SQLite Ledger · Live Transcript · Git Shadow</span>
            </div>
            <span class="badge badge-silver">Cirrascale AI Suite</span>
          </div>
          <div class="intel-kpi-strip">
            <div class="intel-kpi-cell">
              <span class="intel-kpi-label">Session Spend</span>
              <span class="intel-kpi-val tone-blue">\${escapeHtml(spendText)}</span>
              <span class="intel-kpi-sub">Real-time tracked cost</span>
            </div>
            <div class="intel-kpi-cell">
              <span class="intel-kpi-label">Session Tokens</span>
              <span class="intel-kpi-val">\${escapeHtml(tokensText)}</span>
              <span class="intel-kpi-sub">Uncached + Cache + Output</span>
            </div>
            <div class="intel-kpi-cell">
              <span class="intel-kpi-label">Prompt Cache</span>
              <span class="intel-kpi-val tone-green">\${escapeHtml(cacheText)}</span>
              <span class="intel-kpi-sub">Discounted context reads</span>
            </div>
            <div class="intel-kpi-cell">
              <span class="intel-kpi-label">Active IDE Agent</span>
              <span class="intel-kpi-val" style="font-size: 15px;">\${escapeHtml(activeModel)}</span>
              <span class="intel-kpi-sub">Auto-detected from IDE</span>
            </div>
          </div>
          \${bdHtml}
          <div class="intel-answer-body">
            <div style="font-size: 14.5px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">Ask any question about this project</div>
            <div style="color: var(--text-secondary); font-size: 13px;">Tap any forensic card above or type a custom question below. Cairn AI will execute read-only telemetry tools (<code>get_task_cost_breakdown</code>, <code>explain_token_spend</code>, <code>get_recent_work_summary</code>, <code>compare_estimate_vs_actual</code>) and synthesize an exact, root-cause breakdown.</div>
          </div>
        </div>
      \`;
    }

    function buildIntelReportCardHtml(data) {
      const tools = Array.isArray(data.toolsUsed) ? data.toolsUsed : [];
      const highlights = Array.isArray(data.highlights) ? data.highlights : [];
      const bdRows = Array.isArray(data.breakdownRows) ? data.breakdownRows : [];
      const followUps = Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : [];

      const toolsHtml = tools.map(t => \`
        <span class="intel-tool-pill" title="\${escapeHtml(t.summary || '')}">⚡ \${escapeHtml(t.name)}</span>
      \`).join('');

      const kpiHtml = highlights.length > 0
        ? '<div class="intel-kpi-strip">' + highlights.map(h => \`
            <div class="intel-kpi-cell">
              <span class="intel-kpi-label">\${escapeHtml(h.label)}</span>
              <span class="intel-kpi-val tone-\${escapeHtml(h.tone || 'silver')}">\${escapeHtml(h.value)}</span>
              <span class="intel-kpi-sub">\${escapeHtml(h.sub || '')}</span>
            </div>
          \`).join('') + '</div>'
        : '';

      const bdHtml = bdRows.length > 0
        ? \`<div class="intel-breakdown-section">
            <div class="intel-breakdown-title">\${escapeHtml(data.breakdownTitle || 'Telemetry Breakdown')}</div>
            <div class="intel-breakdown-rows">
              \${bdRows.map(r => \`
                <div class="intel-bd-row">
                  <div class="intel-bd-top">
                    <span class="intel-bd-label">\${escapeHtml(r.label)}</span>
                    <span class="intel-bd-metrics">\${escapeHtml(r.cost)} · \${escapeHtml(r.metric)} (\${r.pct}%)</span>
                  </div>
                  <div class="segment-track" style="height: 4px;"><div class="segment-fill" style="width: \${Math.max(4, Math.min(100, Number(r.pct || 0)))}%;"></div></div>
                  <div class="intel-bd-sub">\${escapeHtml(r.detail || '')}</div>
                </div>
              \`).join('')}
            </div>
          </div>\`
        : '';

      const followUpHtml = followUps.length > 0
        ? \`<div class="intel-followups">
            <span style="font-family: var(--font-mono); font-size: 10.5px; color: var(--text-muted); margin-right: 4px;">FOLLOW UP:</span>
            \${followUps.map((f, idx) => \`
              <button type="button" class="intel-followup-chip" data-followup="\${escapeHtml(f)}" onclick="askProjectIntel(this.getAttribute('data-followup'))">↳ \${escapeHtml(f)}</button>
            \`).join('')}
          </div>\`
        : '';

      return \`
        <div class="intel-report-card">
          <div class="intel-report-head">
            <div class="intel-report-tools">
              <span class="badge badge-green">✦ \${escapeHtml(data.model || 'Llama-3.3-70B')}</span>
              \${toolsHtml}
            </div>
            <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">\${Number(data.latencyMs || 0)}ms · \${escapeHtml(data.provider || 'cirrascale-aisuite')}</span>
          </div>
          \${kpiHtml}
          \${bdHtml}
          <div class="intel-answer-body">\${formatTurnContent(data.answer || '', false)}</div>
          \${followUpHtml}
        </div>
      \`;
    }

    async function askProjectIntel(queryText) {
      const q = String(queryText || '').trim();
      if (!q || isIntelLoading) return;
      isIntelLoading = true;

      const streamEl = document.getElementById('intelStreamList');
      const welcomeEl = document.getElementById('intelWelcomeCard');
      if (welcomeEl) welcomeEl.remove();

      const modelSelect = document.getElementById('intelModelSelect');
      const taskInput = document.getElementById('intelTaskFilterInput');
      const askBtn = document.getElementById('intelAskBtn');
      const badgeEl = document.getElementById('intelStatusBadge');

      const selectedModel = modelSelect ? modelSelect.value : 'Llama-3.3-70B';
      const taskId = taskInput && taskInput.value.trim() ? taskInput.value.trim() : undefined;

      if (askBtn) {
        askBtn.disabled = true;
        askBtn.textContent = '⏳ Analyzing...';
      }
      if (badgeEl) {
        badgeEl.textContent = 'Running Telemetry Tools...';
      }

      const pendingId = 'intel_pending_' + Date.now();
      if (streamEl) {
        const turnWrap = document.createElement('div');
        turnWrap.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
        turnWrap.innerHTML = \`
          <div class="intel-turn-user">
            <div class="intel-turn-user-meta">You · Project Forensic Query</div>
            <div>\${escapeHtml(q)}</div>
          </div>
          <div class="intel-report-card" id="\${pendingId}">
            <div class="intel-report-head">
              <span class="badge badge-silver">⏳ Inspecting Cairn SQLite DB, Live Transcript &amp; Git Shadow...</span>
              <span style="font-family: var(--font-mono); font-size: 11px; color: #93c5fd;">\${escapeHtml(selectedModel)}</span>
            </div>
            <div class="intel-answer-body" style="color: var(--text-secondary);">
              Executing read-only telemetry tools (<code>get_task_cost_breakdown</code>, <code>explain_token_spend</code>, <code>get_recent_work_summary</code>) and synthesizing root-cause explanation...
            </div>
          </div>
        \`;
        streamEl.prepend(turnWrap);
        if (window.innerWidth <= 768) {
          turnWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      try {
        const res = await fetch('/api/intel/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
          body: JSON.stringify({
            query: q,
            model: selectedModel,
            taskId,
            history: intelHistoryTurns.slice(-6)
          })
        });
        const data = await res.json();
        const pendingEl = document.getElementById(pendingId);
        if (data && data.ok) {
          intelHistoryTurns.push({ role: 'user', content: q });
          intelHistoryTurns.push({ role: 'assistant', content: data.answer || '' });
          if (pendingEl) {
            pendingEl.outerHTML = buildIntelReportCardHtml(data);
          }
          if (badgeEl) {
            badgeEl.textContent = '✓ ' + (data.model || selectedModel) + ' · ' + (data.latencyMs || 0) + 'ms';
          }
        } else if (pendingEl) {
          pendingEl.innerHTML = '<div class="intel-answer-body" style="color: var(--red);">Could not complete query: ' + escapeHtml((data && data.error && data.error.message) || 'Unknown error') + '</div>';
        }
      } catch (err) {
        const pendingEl = document.getElementById(pendingId);
        if (pendingEl) {
          pendingEl.innerHTML = '<div class="intel-answer-body" style="color: var(--red);">Network error contacting Cairn Daemon.</div>';
        }
      } finally {
        isIntelLoading = false;
        if (askBtn) {
          askBtn.disabled = false;
          askBtn.textContent = '✦ Ask AI →';
        }
      }
    }

    let currentTelemetryChartMode = 'tokens';
    function setTelemetryChartMode(mode, btnEl) {
      currentTelemetryChartMode = mode || 'tokens';
      if (btnEl && btnEl.parentElement) {
        for (const b of btnEl.parentElement.querySelectorAll('.gft-tf-pill')) {
          b.classList.toggle('active', b === btnEl);
        }
      }
      if (latestAntigravityState) {
        renderGftTelemetryChart(latestAntigravityState);
      }
    }

    function filterGftHistoryRows(query) {
      const q = String(query || '').trim().toLowerCase();
      const tbody = document.getElementById('gftHomeHistoryTableBody');
      if (!tbody) return;
      for (const row of tbody.querySelectorAll('tr[data-search]')) {
        const text = row.getAttribute('data-search') || '';
        row.style.display = (!q || text.indexOf(q) !== -1) ? '' : 'none';
      }
    }

    let gftBudgetMeta = { spent: 0, cap: 0 };
    function paintGftMeter(el, pct) {
      if (!el) return;
      const total = window.matchMedia('(max-width: 640px)').matches ? 20 : 30;
      const v = Math.max(0, Math.min(100, Number(pct) || 0));
      const filled = (v / 100) * total;
      const lead = Math.min(total - 1, Math.floor(Math.max(0, filled - 0.0001)));
      let html = '';
      for (let i = 0; i < total; i++) {
        const fill = Math.max(0, Math.min(1, filled - i));
        const shade = (0.55 + 0.45 * ((i + 1) / total)).toFixed(2);
        html += '<span class="gft-tick' + (fill > 0 && i === lead ? ' is-lead' : '') + '" style="--fill:' + fill.toFixed(3) + ';--shade:' + shade + '"></span>';
      }
      el.innerHTML = html;
      el.setAttribute('aria-valuenow', v.toFixed(1));
    }

    function renderGftBarcodes(budgetPct, cachePct) {
      const b = Math.max(0, Number(budgetPct) || 0);
      const c = Math.max(0, Number(cachePct) || 0);
      paintGftMeter(document.getElementById('gftBarcodeBudget'), b);
      paintGftMeter(document.getElementById('gftBarcodeCache'), c);

      const hasCap = gftBudgetMeta.cap > 0;
      const bCol = document.getElementById('gftMeterBudget');
      const state = !hasCap ? 'nocap' : b >= 100 ? 'over' : b >= 80 ? 'warn' : 'ok';
      if (bCol) bCol.dataset.state = state;
      const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
      setText('gftBudgetLabel', hasCap ? 'Budget used' : 'Session cost');
      setText('gftBudgetState', { nocap: 'No cap', over: 'Cap reached', warn: 'Near cap', ok: 'On track' }[state]);
      setText('gftCapToggle', hasCap ? 'Edit cap' : 'Set cost cap');
      const bVal = document.getElementById('gftBudgetValue');
      if (bVal) {
        bVal.innerHTML = hasCap
          ? b.toFixed(1) + '<small>%</small>'
          : '$' + gftBudgetMeta.spent.toFixed(2);
      }
      setText('gftBudgetFoot', hasCap
        ? '$' + gftBudgetMeta.spent.toFixed(2) + ' of $' + gftBudgetMeta.cap.toFixed(2) + ' · $' + Math.max(0, gftBudgetMeta.cap - gftBudgetMeta.spent).toFixed(2) + ' left'
        : 'Tracking spend only · no limit enforced');

      const cNum = document.getElementById('gftCachePctNum');
      if (cNum) cNum.textContent = c.toFixed(1);
      const cState = document.getElementById('gftCacheState');
      if (cState) cState.textContent = c >= 70 ? 'Hot' : c >= 30 ? 'Warm' : c > 0 ? 'Cold' : 'Warming up';
    }

    // ---- Opt-in cost cap (project budget). No cap is set unless the user adds one. ----
    function openCostCapEditor() {
      const form = document.getElementById('gftCapEditor');
      const input = document.getElementById('gftCapInput');
      if (!form || !input) return;
      form.hidden = false;
      document.getElementById('gftCapToggle').hidden = true;
      document.getElementById('gftCapRemove').hidden = !(gftBudgetMeta.cap > 0);
      document.getElementById('gftCapMsg').textContent = '';
      input.value = gftBudgetMeta.cap > 0 ? gftBudgetMeta.cap.toFixed(2) : '';
      input.focus();
    }
    function closeCostCapEditor() {
      const form = document.getElementById('gftCapEditor');
      if (form) form.hidden = true;
      const toggle = document.getElementById('gftCapToggle');
      if (toggle) toggle.hidden = false;
    }
    async function putCostCap(projectBudget) {
      const msg = document.getElementById('gftCapMsg');
      try {
        const res = await fetch('/api/policy', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
          body: JSON.stringify({ budgets: { project: projectBudget } })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error((data.errors && data.errors[0]) || ('HTTP ' + res.status));
        closeCostCapEditor();
        await refreshStatus(false);
        return true;
      } catch (err) {
        if (msg) msg.textContent = 'Could not save: ' + err.message;
        return false;
      }
    }
    async function saveCostCap(event) {
      event.preventDefault();
      const usd = Number(document.getElementById('gftCapInput').value);
      if (!(usd > 0)) {
        document.getElementById('gftCapMsg').textContent = 'Enter an amount above $0.';
        return;
      }
      if (await putCostCap({ usd: Math.round(usd * 100) / 100, exhaustion_mode: 'wind_down' })) {
        showToast('Cost cap set to $' + usd.toFixed(2));
      }
    }
    async function removeCostCap() {
      if (await putCostCap(null)) showToast('Cost cap removed. Tracking session cost only.');
    }

    let gftChartSeriesPoints = [];
    let gftChartPeakIndex = 0;
    let gftChartSelectedIndex = -1;
    let gftChartIsDragging = false;
    let gftChartInteractionBound = false;

    function formatShortStepInfo(rawSummary, toolsArr) {
      const tool = (Array.isArray(toolsArr) && toolsArr.length > 0) ? toolsArr[0] : 'agent_turn';
      const bs = String.fromCharCode(92);
      const bt = String.fromCharCode(96);
      let s = String(rawSummary || '')
        .split('&quot;').join('"')
        .split('&amp;').join('&')
        .split('&lt;').join('<')
        .split('&gt;').join('>')
        .split(bs + bs).join('/')
        .split(bs).join('/')
        .split('"').join('')
        .split("'").join('')
        .split(bt).join('')
        .trim();

      s = s.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '');
      if (s.indexOf('/') === 0) s = s.slice(1);
      const colonIdx = s.indexOf(':');
      if (colonIdx !== -1 && colonIdx < 24) {
        s = s.slice(colonIdx + 1).trim();
      }
      s = s.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig, '');
      if (s.indexOf('/') === 0) s = s.slice(1);

      if (s.indexOf('/') !== -1) {
        const parts = s.split('/').filter(Boolean);
        s = parts.length >= 2 ? (parts[parts.length - 2] + '/' + parts[parts.length - 1]) : (parts[parts.length - 1] || s);
      }
      if (!s) s = tool;
      return tool + ' · ' + s;
    }

    function buildSmoothBezierPath(points) {
      if (!points || points.length === 0) return '';
      if (points.length === 1) return 'M ' + points[0].x + ' ' + points[0].y;
      let d = 'M ' + points[0].x + ' ' + points[0].y;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const midX = Number(((p0.x + p1.x) / 2).toFixed(1));
        d += ' C ' + midX + ' ' + p0.y + ', ' + midX + ' ' + p1.y + ', ' + p1.x + ' ' + p1.y;
      }
      return d;
    }

    function updateGftChartCrosshair(idx, showBox) {
      const tt = document.getElementById('gftChartTooltip');
      const crossLine = document.getElementById('gftCrosshairLine');
      const crossDot = document.getElementById('gftCrosshairDot');
      const crossRing = document.getElementById('gftCrosshairRing');

      if (!showBox || idx < 0 || !gftChartSeriesPoints || idx >= gftChartSeriesPoints.length) {
        if (tt) tt.classList.remove('visible');
        if (crossLine) crossLine.setAttribute('opacity', '0');
        if (crossDot) crossDot.setAttribute('opacity', '0');
        if (crossRing) crossRing.setAttribute('opacity', '0');
        return;
      }

      const pt = gftChartSeriesPoints[idx];
      if (!pt) return;

      if (crossLine) {
        crossLine.setAttribute('x1', String(pt.x));
        crossLine.setAttribute('x2', String(pt.x));
        crossLine.setAttribute('opacity', '1');
      }
      if (crossDot) {
        crossDot.setAttribute('cx', String(pt.x));
        crossDot.setAttribute('cy', String(pt.y));
        crossDot.setAttribute('opacity', '1');
      }
      if (crossRing) {
        crossRing.setAttribute('cx', String(pt.x));
        crossRing.setAttribute('cy', String(pt.y));
        crossRing.setAttribute('opacity', '1');
      }

      const stage = document.getElementById('gftLiveChartStage');
      if (tt && stage) {
        const stageW = stage.clientWidth || 520;
        const stageH = stage.clientHeight || 156;
        const ttW = 186;
        const ttH = 66;
        const dotPxX = (pt.x / 640) * stageW;
        const dotPxY = (pt.y / 156) * stageH;

        const preferLeft = dotPxX > stageW * 0.56 ? (dotPxX - ttW - 12) : (dotPxX + 12);
        const clampedLeft = Math.max(6, Math.min(stageW - ttW - 6, preferLeft));
        const preferTop = dotPxY - ttH * 0.5;
        const clampedTop = Math.max(4, Math.min(stageH - ttH - 4, preferTop));

        tt.style.left = Math.round(clampedLeft) + 'px';
        tt.style.top = Math.round(clampedTop) + 'px';
        tt.classList.add('visible');
      }

      const isPeak = idx === gftChartPeakIndex;
      const titleEl = document.getElementById('gftTtTitle');
      const metaEl = document.getElementById('gftTtMeta');
      const valEl = document.getElementById('gftTtValue');
      const descEl = document.getElementById('gftTtDesc');
      const toolsEl = document.getElementById('gftTtTools');
      const costEl = document.getElementById('gftTtCost');

      if (titleEl) {
        titleEl.textContent = (isPeak ? '★ MAX · ' : '') + 'STEP #' + pt.stepIndex;
        titleEl.style.color = isPeak ? '#60a5fa' : '#93c5fd';
      }
      if (metaEl) metaEl.textContent = pt.timeLabel;
      if (valEl) valEl.textContent = pt.formattedValue;
      if (descEl) descEl.textContent = pt.whatFor;
      if (toolsEl) toolsEl.textContent = pt.modelShort;
      if (costEl) costEl.textContent = '$' + Number(pt.costUsd || 0).toFixed(4);
    }

    function bindGftChartScrubber() {
      if (gftChartInteractionBound) return;
      const stage = document.getElementById('gftLiveChartStage');
      if (!stage) return;
      gftChartInteractionBound = true;

      const handlePointerAt = (clientX, clientY, forceSnap) => {
        if (!gftChartSeriesPoints || gftChartSeriesPoints.length === 0) return;
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const pxX = clientX - rect.left;
        const pxY = clientY - rect.top;

        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < gftChartSeriesPoints.length; i++) {
          const dotPxX = (gftChartSeriesPoints[i].x / 640) * rect.width;
          const dotPxY = (gftChartSeriesPoints[i].y / 156) * rect.height;
          const dx = dotPxX - pxX;
          const dy = dotPxY - pxY;
          const dist = forceSnap ? Math.abs(dx) : Math.hypot(dx, dy * 0.65);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }

        // Only show the compact info box when hovering over/near a dot or actively dragging the pointer
        const thresholdPx = forceSnap ? 9999 : 28;
        if (bestIdx >= 0 && bestDist <= thresholdPx) {
          gftChartSelectedIndex = bestIdx;
          updateGftChartCrosshair(bestIdx, true);
        } else {
          gftChartSelectedIndex = -1;
          updateGftChartCrosshair(-1, false);
        }
      };

      stage.addEventListener('pointerdown', (e) => {
        gftChartIsDragging = true;
        try { stage.setPointerCapture(e.pointerId); } catch {}
        handlePointerAt(e.clientX, e.clientY, true);
      });
      stage.addEventListener('pointermove', (e) => {
        if (gftChartIsDragging) {
          handlePointerAt(e.clientX, e.clientY, true);
        } else {
          handlePointerAt(e.clientX, e.clientY, false);
        }
      });
      stage.addEventListener('pointerup', () => {
        gftChartIsDragging = false;
      });
      stage.addEventListener('pointerleave', () => {
        if (!gftChartIsDragging) {
          gftChartSelectedIndex = -1;
          updateGftChartCrosshair(-1, false);
        }
      });
    }

    function renderGftTelemetryChart(ag) {
      const svg = document.getElementById('gftTelemetrySvg');
      if (!svg) return;
      bindGftChartScrubber();

      const rawEvents = (ag && Array.isArray(ag.recentEvents) && ag.recentEvents.length > 0)
        ? ag.recentEvents.slice(0, 24).slice().reverse()
        : [];

      const W = 640;
      const H = 156;
      const padT = 22;
      const padB = 18;
      const usableH = H - padT - padB;

      // Build accurate per-step telemetry points so users can see exact peaks & what each step was for
      const series = [];
      if (rawEvents.length > 0) {
        let runningUsd = 0;
        for (let i = 0; i < rawEvents.length; i++) {
          const ev = rawEvents[i];
          const inTok = Number(ev.inputTokens || 0);
          const cacheTok = Number(ev.cachedTokens || 0);
          const outTok = Number(ev.outputTokens || 0);
          const stepTok = inTok + cacheTok + outTok;
          const stepCost = Number(ev.costUsd || 0);
          runningUsd += stepCost;
          const promptTot = inTok + cacheTok;
          const cacheHit = promptTot > 0 ? (cacheTok / promptTot) * 100 : 0;

          let metricVal = stepTok;
          let formattedValue = formatCompactTokens(stepTok) + ' tok · Cache ' + formatCompactTokens(cacheTok);
          if (currentTelemetryChartMode === 'cost') {
            metricVal = stepCost;
            formattedValue = '$' + stepCost.toFixed(4) + ' · Cum $' + runningUsd.toFixed(2);
          } else if (currentTelemetryChartMode === 'cache') {
            metricVal = cacheHit;
            formattedValue = cacheHit.toFixed(1) + '% cached (' + formatCompactTokens(cacheTok) + ')';
          } else if (currentTelemetryChartMode === 'all') {
            metricVal = stepTok;
            formattedValue = formatCompactTokens(stepTok) + ' tok · $' + stepCost.toFixed(4);
          }

          const toolsArr = (Array.isArray(ev.tools) && ev.tools.length > 0) ? ev.tools : ['agent_turn'];
          const cleanWhy = formatShortStepInfo(ev.summary, toolsArr);
          const timeStr = ev.timestamp
            ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ('Turn #' + (ev.stepIndex || (i + 1)));

          series.push({
            stepIndex: ev.stepIndex || (i + 1),
            metricVal,
            formattedValue,
            whatFor: cleanWhy,
            toolLabel: toolsArr[0],
            modelShort: String(ev.modelDisplayName || (ag && ag.activeModelDisplayName) || 'Gemini 4').split('·')[0].trim(),
            costUsd: stepCost,
            stepTok,
            timeLabel: timeStr,
            x: 0,
            y: 0
          });
        }
      } else {
        const fallbackSteps = [
          { stepIndex: 1, tok: 42000, cost: 0.018, tool: 'read_file', why: 'read_file · packages/daemon/cli.ts' },
          { stepIndex: 2, tok: 86000, cost: 0.034, tool: 'grep_search', why: 'grep_search · gateway/server.ts' },
          { stepIndex: 3, tok: 164000, cost: 0.072, tool: 'edit_file', why: 'edit_file · remote/mobile-ui.ts' },
          { stepIndex: 4, tok: 118000, cost: 0.049, tool: 'run_command', why: 'run_command · npm test' }
        ];
        for (const f of fallbackSteps) {
          series.push({
            stepIndex: f.stepIndex,
            metricVal: currentTelemetryChartMode === 'cost' ? f.cost : f.tok,
            formattedValue: currentTelemetryChartMode === 'cost' ? ('$' + f.cost.toFixed(4)) : (formatCompactTokens(f.tok) + ' tok'),
            whatFor: f.why,
            toolLabel: f.tool,
            modelShort: 'Gemini 4 Argon',
            costUsd: f.cost,
            stepTok: f.tok,
            timeLabel: 'Step #' + f.stepIndex,
            x: 0,
            y: 0
          });
        }
      }

      const vals = series.map(s => s.metricVal);
      const rawMin = Math.min(...vals);
      const rawMax = Math.max(...vals);
      const span = Math.max(rawMax - rawMin, rawMax * 0.18, 1e-6);
      const plotMin = Math.max(0, rawMin - span * 0.15);
      const plotMax = rawMax + span * 0.08;

      let peakIdx = 0;
      for (let i = 0; i < series.length; i++) {
        if (series[i].metricVal >= series[peakIdx].metricVal) {
          peakIdx = i;
        }
      }
      gftChartPeakIndex = peakIdx;

      for (let i = 0; i < series.length; i++) {
        const x = series.length === 1 ? W / 2 : (i / (series.length - 1)) * (W - 28) + 14;
        const norm = (series[i].metricVal - plotMin) / Math.max(1e-6, plotMax - plotMin);
        const y = padT + usableH - norm * usableH;
        series[i].x = Number(x.toFixed(1));
        series[i].y = Number(y.toFixed(1));
      }
      gftChartSeriesPoints = series;

      const linePath = buildSmoothBezierPath(series);
      const areaPath = linePath + \` L \${series[series.length - 1].x} \${H - 6} L \${series[0].x} \${H - 6} Z\`;
      const peakPt = series[peakIdx] || series[series.length - 1];
      const activePt = (gftChartSelectedIndex >= 0 && series[gftChartSelectedIndex]) ? series[gftChartSelectedIndex] : peakPt;
      const isShowingHover = gftChartSelectedIndex >= 0;

      const peakHintEl = document.getElementById('gftChartPeakHint');
      if (peakHintEl && peakPt) {
        peakHintEl.textContent = '★ Peak: Step #' + peakPt.stepIndex + ' (' + formatCompactTokens(peakPt.stepTok) + ' tok · $' + Number(peakPt.costUsd || 0).toFixed(4) + ') · Hover any dot';
      }

      svg.innerHTML = \`
        <defs>
          <linearGradient id="gftAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.24"/>
            <stop offset="68%" stop-color="#0069fd" stop-opacity="0.04"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="gftStrokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
            <stop offset="45%" stop-color="#60a5fa"/>
            <stop offset="100%" stop-color="#0069fd"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="\${padT + usableH * 0.25}" x2="\${W}" y2="\${padT + usableH * 0.25}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <line x1="0" y1="\${padT + usableH * 0.60}" x2="\${W}" y2="\${padT + usableH * 0.60}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
        <line x1="0" y1="\${H - 6}" x2="\${W}" y2="\${H - 6}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
        <line x1="\${peakPt.x}" y1="\${peakPt.y}" x2="\${peakPt.x}" y2="\${H - 6}" stroke="rgba(96, 165, 250, 0.22)" stroke-width="1" stroke-dasharray="2 3"/>
        <path d="\${areaPath}" fill="url(#gftAreaGrad)"/>
        <path d="\${linePath}" fill="none" stroke="url(#gftStrokeGrad)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
        \${series.map((p, i) => {
          const isPk = i === peakIdx;
          return \`
            <circle cx="\${p.x}" cy="\${p.y}" r="\${isPk ? 4.2 : 2.6}" fill="\${isPk ? '#ffffff' : '#60a5fa'}" stroke="\${isPk ? '#0069fd' : 'rgba(11,12,16,0.9)'}" stroke-width="\${isPk ? 2.2 : 1.2}"/>
          \`;
        }).join('')}
        <line id="gftCrosshairLine" x1="\${activePt.x}" y1="6" x2="\${activePt.x}" y2="\${H - 6}" stroke="rgba(147, 197, 253, 0.55)" stroke-width="1.1" stroke-dasharray="3 3" opacity="\${isShowingHover ? '1' : '0'}"/>
        <circle id="gftCrosshairRing" cx="\${activePt.x}" cy="\${activePt.y}" r="8" fill="rgba(0, 105, 253, 0.20)" opacity="\${isShowingHover ? '1' : '0'}"/>
        <circle id="gftCrosshairDot" cx="\${activePt.x}" cy="\${activePt.y}" r="4.5" fill="#ffffff" stroke="#0069fd" stroke-width="2.2" opacity="\${isShowingHover ? '1' : '0'}"/>
      \`;

      updateGftChartCrosshair(gftChartSelectedIndex, isShowingHover);
    }

    async function refreshProjectLedgerNow() {
      try {
        const res = await fetch('/api/project-ledger?refresh=1', { headers: { 'X-Cairn-Token': TOKEN } });
        const data = await res.json();
        if (data.projectLedger) {
          latestProjectLedger = data.projectLedger;
          renderProjectLedgerView(latestProjectLedger, latestAntigravityState);
          showToast('✓ Synced combined project ledger across all agents');
        }
      } catch {}
    }

    function renderAntigravityLiveAgentsStrip(ag) {
      const gridEl = document.getElementById('agModelsLiveConsumptionGrid');
      if (!gridEl || !ag) return;
      const usageList = Array.isArray(ag.modelUsage) ? ag.modelUsage : [];
      if (usageList.length === 0) return;

      const dotsEl = document.getElementById('agModelProgressDots');
      if (dotsEl) {
        dotsEl.innerHTML = usageList.slice(0, 5).map(m =>
          \`<span class="profound-dot \${m.modelId === ag.activeModelId ? 'active' : ''}"></span>\`
        ).join('');
      }

      const sparkPaths = [
        'M 2 30 Q 28 26, 48 18 T 96 20 T 142 10 T 188 6',
        'M 2 28 Q 30 22, 54 25 T 102 15 T 148 12 T 188 8',
        'M 2 31 Q 32 28, 60 20 T 110 18 T 152 11 T 188 9',
        'M 2 26 Q 26 29, 58 21 T 106 14 T 150 13 T 188 7',
        'M 2 32 Q 36 24, 66 22 T 114 16 T 156 12 T 188 10'
      ];

      gridEl.innerHTML = usageList.slice(0, 5).map((m, idx) => {
        const isActive = m.modelId === ag.activeModelId;
        const shortName = String(m.displayName || m.modelId).split('·')[0].trim();
        const tierPart = String(m.displayName || '').includes('·')
          ? String(m.displayName).split('·').slice(1).join('·').trim()
          : (m.category || 'frontier');
        const tokDisplay = m.tokens && m.tokens.total > 0
          ? formatCompactTokens(m.tokens.total) + ' tok'
          : formatCompactTokens((ag.sessionTokens && ag.sessionTokens.total) || 0) + ' sim';
        const mainMetric = m.costUsd > 0
          ? '$' + Number(m.costUsd).toFixed(2)
          : '$' + Number(m.sessionEquivalentCostUsd || 0).toFixed(2);
        const subMetricLabel = m.costUsd > 0 ? 'Session Spend' : 'Equivalent Rate';
        const sparkD = sparkPaths[idx % sparkPaths.length];

        return \`
          <div class="profound-card \${isActive ? 'active' : ''}" onclick="switchActiveAgentModel('\${m.modelId}')">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
              <div style="min-width: 0;">
                <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">\${escapeHtml(tierPart)} · \${Math.round((m.contextLength || 200000) / 1000)}K ctx</div>
                <div style="font-size: 13.5px; font-weight: 600; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">\${escapeHtml(shortName)}</div>
              </div>
              <span class="corner-arrow-pill" title="Switch active bar to \${escapeHtml(m.displayName)}">\${isActive ? '✓' : '↗'}</span>
            </div>

            <div style="margin-top: 4px;">
              <div style="font-size: 10.5px; color: var(--text-muted);">\${subMetricLabel}</div>
              <div style="font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.03em; line-height: 1.15; margin-top: 1px;">\${mainMetric}</div>
              <div style="display: inline-flex; align-items: center; gap: 5px; margin-top: 3px; font-family: var(--font-mono); font-size: 10.5px; color: #60a5fa;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #0069fd; display: inline-block;"></span>
                <span>\${tokDisplay}</span>
              </div>
            </div>

            <div class="stakent-spark-wrap">
              <svg width="100%" height="34" viewBox="0 0 196 34" preserveAspectRatio="none" style="display: block; width: 100%; height: 34px;">
                <line x1="0" y1="26" x2="196" y2="26" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="2 2"/>
                <path d="\${sparkD}" fill="none" stroke="\${isActive ? '#3b82f6' : 'rgba(255,255,255,0.28)'}" stroke-width="1.6" stroke-linecap="round"/>
                <circle cx="188" cy="8" r="3" fill="#ffffff" stroke="#0069fd" stroke-width="1.8"/>
              </svg>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderProjectLedgerView(ledger, ag) {
      if (!ledger || !ledger.totals) return;
      const tot = ledger.totals;
      const totalTok = (tot.tokens && tot.tokens.total) || 0;
      const cachedTok = (tot.tokens && tot.tokens.cachedRead) || 0;
      const uncachedTok = (tot.tokens && tot.tokens.uncachedInput) || 0;
      const outTok = (tot.tokens && tot.tokens.output) || 0;
      const cachePct = (cachedTok + uncachedTok) > 0 ? ((cachedTok / (cachedTok + uncachedTok)) * 100) : 0;

      const badgeNav = document.getElementById('ledgerAgentsBadge');
      if (badgeNav) {
        badgeNav.textContent = '$' + Number(tot.costUsd || 0).toFixed(2);
      }
      const countEl = document.getElementById('ledgerActiveAgentsCount');
      if (countEl) {
        countEl.textContent = (tot.agentsUsed || 1) + ' Active · ' + (ledger.agents || []).length + ' Tracked';
      }
      const usdEl = document.getElementById('ledgerTotalUsd');
      if (usdEl) usdEl.textContent = '$' + Number(tot.costUsd || 0).toFixed(2);
      const usdSubEl = document.getElementById('ledgerTotalUsdSub');
      if (usdSubEl) usdSubEl.textContent = 'Project: ' + (ledger.projectName || 'cairn1') + ' · Combined across all agents';

      const tokEl = document.getElementById('ledgerTotalTokens');
      if (tokEl) tokEl.textContent = formatCompactTokens(totalTok);
      const tokSubEl = document.getElementById('ledgerTotalTokensSub');
      if (tokSubEl) {
        tokSubEl.textContent = 'In: ' + formatCompactTokens(uncachedTok) + ' · Cache: ' + formatCompactTokens(cachedTok) + ' · Out: ' + formatCompactTokens(outTok);
      }
      const cacheBadge = document.getElementById('ledgerCacheHitBadge');
      if (cacheBadge) cacheBadge.textContent = cachePct.toFixed(1) + '% Cached';

      const stepsEl = document.getElementById('ledgerTotalSteps');
      if (stepsEl) stepsEl.textContent = Number(tot.steps || 0).toLocaleString() + ' steps';
      const sessSubEl = document.getElementById('ledgerTotalSessionsSub');
      if (sessSubEl) sessSubEl.textContent = (tot.sessions || 1) + ' workspace sessions synced';

      if (ag && ag.activeModelDisplayName) {
        const pmEl = document.getElementById('ledgerPrimaryModelName');
        if (pmEl) pmEl.textContent = ag.activeModelDisplayName.split('·')[0].trim();
        const pmSub = document.getElementById('ledgerPrimaryModelSub');
        if (pmSub) pmSub.textContent = ag.activeHarnessLabel + ' · ' + Math.round((ag.activeModelContextLength || 2000000) / 1000).toLocaleString() + 'K ctx';
      }

      const cardsEl = document.getElementById('projectLedgerAgentsGrid');
      if (cardsEl && Array.isArray(ledger.agents)) {
        const harnessSwitchMap = {
          'antigravity': 'antigravity',
          'claude-code': 'claude-code',
          'opencode': 'opencode',
          'hermes': 'hermes',
          'codex': 'opencode',
          'cairn-gateway': 'antigravity'
        };
        cardsEl.innerHTML = ledger.agents.map(a => {
          const isAct = a.status === 'active';
          const mainCost = isAct ? '$' + Number(a.costUsd || 0).toFixed(2) : '$' + Number(a.equivalentProjectCostUsd || 0).toFixed(2);
          const costSub = isAct
            ? \`Recorded across \${a.sessions} session(s) · \${a.steps} steps\`
            : \`Equivalent full-project cost on \${escapeHtml(a.label)} (\${a.status === 'not-installed' ? 'ready via gateway' : '0 sessions in this folder'})\`;
          const tokTotal = (a.tokens && a.tokens.total) || 0;
          const sharePct = tot.costUsd > 0 && isAct ? Math.min(100, Math.max(8, (a.costUsd / tot.costUsd) * 100)) : 28;
          const modelsListHtml = Array.isArray(a.models) && a.models.length > 0
            ? a.models.slice(0, 4).map(m => \`
                <div style="display: flex; justify-content: space-between; gap: 8px; font-family: var(--font-mono); font-size: 11px; padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.06);">
                  <span style="color: #e4e4e7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHtml(m.displayName)}</span>
                  <span style="color: var(--green); flex-shrink: 0;">\${formatCompactTokens(m.tokens.total)} tok · $\${Number(m.costUsd).toFixed(2)}</span>
                </div>
              \`).join('')
            : \`<div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06);">Project Equivalent: $\${Number(a.equivalentProjectCostUsd || 0).toFixed(2)}</div>\`;
          const targetHarness = harnessSwitchMap[a.agent] || 'antigravity';

          return \`
            <div class="ledger-card">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 15px; font-weight: 600; color: #ffffff;">\${escapeHtml(a.label)}</span>
                    <span class="badge \${isAct ? 'badge-green' : 'badge-neutral'}">\${isAct ? 'ACTIVE' : 'BENCHMARK'}</span>
                  </div>
                  <button type="button" class="corner-arrow-pill" onclick="switchActiveHarness('\${targetHarness}')" title="Switch active harness to \${escapeHtml(a.label)}">↗</button>
                </div>
                <div class="ledger-stat-big">\${mainCost}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">\${costSub}</div>
              </div>

              <div>
                <div class="segment-track" style="margin-bottom: 8px;">
                  <div class="segment-fill \${isAct ? 'segment-fill-green' : ''}" style="width: \${sharePct.toFixed(0)}%;"></div>
                </div>
                <div class="token-breakdown" style="margin-bottom: 6px;">
                  <span>Tokens: <strong style="color: #ffffff;">\${formatCompactTokens(tokTotal)}</strong></span>
                  <span>·</span>
                  <span>Eq. Project: <strong style="color: #ffffff;">$\${Number(a.equivalentProjectCostUsd || 0).toFixed(2)}</strong></span>
                </div>
                \${modelsListHtml}
              </div>
            </div>
          \`;
        }).join('');
      }

      const agTableEl = document.getElementById('ledgerAntigravityModelsTable');
      if (agTableEl && ag && Array.isArray(ag.modelUsage)) {
        agTableEl.innerHTML = ag.modelUsage.map(m => {
          const isCurrent = m.modelId === ag.activeModelId;
          const t = m.tokens || { uncachedInput: 0, cachedRead: 0, output: 0, total: 0 };
          return \`
            <tr style="\${isCurrent ? 'background: rgba(255, 255, 255, 0.045);' : ''}">
              <td>
                <div style="font-weight: 600; color: #ffffff;">\${escapeHtml(m.displayName)}</div>
                <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">\${Math.round((m.contextLength || 200000) / 1000).toLocaleString()}K context window</div>
              </td>
              <td><span class="badge \${isCurrent ? 'badge-green' : m.steps > 0 ? 'badge-silver' : 'badge-neutral'}">\${isCurrent ? '● Active in Bar' : m.steps > 0 ? 'Used in Session' : 'Available'}</span></td>
              <td style="font-family: var(--font-mono); color: #ffffff;">\${m.steps} steps</td>
              <td style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">
                <strong style="color: #ffffff;">\${formatCompactTokens(t.total)}</strong>
                (In: \${formatCompactTokens(t.uncachedInput)} · Cache: \${formatCompactTokens(t.cachedRead)} · Out: \${formatCompactTokens(t.output)})
              </td>
              <td style="font-family: var(--font-mono); font-size: 12px;">
                <span class="badge badge-green">\${m.cacheHitPct}% cached · \${m.contextFillPct}% ctx</span>
              </td>
              <td style="font-family: var(--font-mono); font-weight: 600; color: #ffffff;">$\${Number(m.costUsd || 0).toFixed(2)}</td>
              <td style="font-family: var(--font-mono); color: var(--green);">$\${Number(m.sessionEquivalentCostUsd || 0).toFixed(2)}</td>
              <td>
                <button type="button" class="btn \${isCurrent ? 'btn-white' : ''}" style="padding: 5px 10px; font-size: 11.5px;" onclick="switchActiveAgentModel('\${m.modelId}')">
                  \${isCurrent ? '✓ Active' : 'Pick Agent ↗'}
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      }
    }

    function setOverviewModelFilter(filter) {
      overviewModelFilter = filter;
      const btnH = document.getElementById('ovFilterHarness');
      const btnA = document.getElementById('ovFilterAll');
      if (btnH) btnH.classList.toggle('active', filter === 'harness');
      if (btnA) btnA.classList.toggle('active', filter !== 'harness');
      closeAllExtendedMenus();
      renderModelComparisonPanels();
    }

    function setEstimatorModelFilter(filter) {
      estimatorModelFilter = filter;
      const btnH = document.getElementById('estFilterHarness');
      const btnA = document.getElementById('estFilterAll');
      if (btnH) btnH.classList.toggle('active', filter === 'harness');
      if (btnA) btnA.classList.toggle('active', filter !== 'harness');
      closeAllExtendedMenus();
      renderModelComparisonPanels();
    }

    function updateHarnessPillsUi(harness, harnessLabel) {
      currentActiveHarness = harness || 'antigravity';
      currentActiveHarnessLabel = harnessLabel || 'Antigravity IDE';
      const ids = ['antigravity', 'codex', 'claude-code', 'opencode', 'hermes'];
      for (const id of ids) {
        const btn = document.getElementById('harnessBtn_' + id);
        if (btn) btn.classList.toggle('active', id === currentActiveHarness);
      }
      document.getElementById('detectedHarnessBadge').innerHTML =
        '<span class="studio-tag-dot"></span><span class="studio-tag-kicker">Active IDE</span><span style="color: rgba(255,255,255,0.28);">·</span><span>' +
        escapeHtml(currentActiveHarnessLabel) +
        '</span>';
      const summaryName = document.getElementById('harnessSummaryName');
      const mobileCurrent = document.getElementById('harnessCurrentMobile');
      const mobileSelect = document.getElementById('harnessSelectMobile');
      if (summaryName) summaryName.textContent = currentActiveHarnessLabel;
      if (mobileCurrent) mobileCurrent.textContent = currentActiveHarnessLabel;
      if (mobileSelect) mobileSelect.value = currentActiveHarness;
      const steerTitle = document.getElementById('steerHarnessTitle');
      const sendLabel = document.querySelector('#sendSteerBtn span');
      if (steerTitle) steerTitle.textContent = currentActiveHarnessLabel;
      if (sendLabel) sendLabel.textContent = 'Send to ' + currentActiveHarnessLabel;
      document.getElementById('activeCellHarnessTitle').textContent = currentActiveHarnessLabel + ' Model';
    }

    /**
     * Dynamically populates the primary <select> with ONLY the active IDE's native models
     * (e.g. the exact 5 Antigravity IDE models when in Antigravity IDE), while placing all
     * remaining Frontier, Open-Source, and Local models into the "+ Extended ▾" dropdown menu.
     */
    function populateDynamicModelSelectors(modelsList, selectedModelId) {
      if (!Array.isArray(modelsList) || modelsList.length === 0) return;

      const harnessNative = modelsList.filter(m =>
        Array.isArray(m.harnesses) && m.harnesses.includes(currentActiveHarness)
      );
      const extendedModels = modelsList.filter(m =>
        !Array.isArray(m.harnesses) || !m.harnesses.includes(currentActiveHarness)
      );

      const btnH1 = document.getElementById('ovFilterHarness');
      const btnH2 = document.getElementById('estFilterHarness');
      if (btnH1) btnH1.textContent = currentActiveHarnessLabel + ' (' + harnessNative.length + ')';
      if (btnH2) btnH2.textContent = currentActiveHarnessLabel + ' (' + harnessNative.length + ')';

      const selectedInNative = harnessNative.some(m => m.modelId === selectedModelId);
      const selectedExtendedObj = !selectedInNative
        ? modelsList.find(m => m.modelId === selectedModelId)
        : null;

      const buildOptions = (arr) => arr.map(m =>
        \`<option value="\${escapeHtml(m.modelId)}" \${m.modelId === selectedModelId ? 'selected' : ''}>\${escapeHtml(m.displayName)}</option>\`
      ).join('');

      const selectHtml = \`
        <optgroup label="\${escapeHtml(currentActiveHarnessLabel)} Models">
          \${buildOptions(harnessNative)}
        </optgroup>
        \${selectedExtendedObj ? \`
          <optgroup label="Selected Extended Model">
            \${buildOptions([selectedExtendedObj])}
          </optgroup>
        \` : ''}
        <optgroup label="More Models">
          <option value="__open_extended__">+ Extended Models (\${extendedModels.length} more)...</option>
        </optgroup>
      \`;

      const sel1 = document.getElementById('activeAgentSelect');
      const sel2 = document.getElementById('estimateModelSelect');
      if (sel1) {
        sel1.innerHTML = selectHtml;
        sel1.value = selectedModelId;
      }
      if (sel2) {
        sel2.innerHTML = selectHtml;
        sel2.value = selectedModelId;
      }

      // Build the "+ Extended Models ▾" popover menus
      const extFrontier = extendedModels.filter(m => m.category === 'frontier');
      const extOpenSource = extendedModels.filter(m => m.category === 'open-source');
      const extLocal = extendedModels.filter(m => m.category === 'local');

      const renderMenuItems = (arr) => arr.map(m => \`
        <button type="button" class="extended-menu-item \${m.modelId === selectedModelId ? 'active' : ''}" onclick="closeAllExtendedMenus(); switchActiveAgentModel('\${escapeHtml(m.modelId)}')">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHtml(m.displayName)}</span>
          <span class="badge badge-neutral" style="font-size: 10px;">$\${Number(m.sessionCostUsd || 0).toFixed(2)}</span>
        </button>
      \`).join('');

      const buildMenuHtml = (isOverviewOrTable, filterFnName) => \`
        \${isOverviewOrTable ? \`
          <div class="extended-menu-section">Filter Comparison View</div>
          <button type="button" class="extended-menu-item" onclick="\${filterFnName}('harness')">
            <span>● Only \${escapeHtml(currentActiveHarnessLabel)} Models (\${harnessNative.length})</span>
            <span class="badge badge-silver">Default</span>
          </button>
          <button type="button" class="extended-menu-item" onclick="\${filterFnName}('all')">
            <span>+ Show All Extended Models (\${modelsList.length})</span>
          </button>
          <button type="button" class="extended-menu-item" onclick="\${filterFnName}('frontier')">
            <span>+ Frontier Models Only</span>
          </button>
          <button type="button" class="extended-menu-item" onclick="\${filterFnName}('open-source')">
            <span>+ Open-Source Cloud Models</span>
          </button>
          <button type="button" class="extended-menu-item" onclick="\${filterFnName}('local')">
            <span>+ Local Ollama Models ($0 API)</span>
          </button>
        \` : ''}
        \${extFrontier.length > 0 ? \`
          <div class="extended-menu-section">Extended Frontier Models</div>
          \${renderMenuItems(extFrontier)}
        \` : ''}
        \${extOpenSource.length > 0 ? \`
          <div class="extended-menu-section">Extended Open-Source Models</div>
          \${renderMenuItems(extOpenSource)}
        \` : ''}
        \${extLocal.length > 0 ? \`
          <div class="extended-menu-section">Extended Local Models ($0 API)</div>
          \${renderMenuItems(extLocal)}
        \` : ''}
      \`;

      const heroMenu = document.getElementById('heroExtendedMenu');
      const estTopMenu = document.getElementById('estTopExtendedMenu');
      const ovMenu = document.getElementById('ovExtendedMenu');
      const estMenu = document.getElementById('estExtendedMenu');

      if (heroMenu) heroMenu.innerHTML = buildMenuHtml(false, '');
      if (estTopMenu) estTopMenu.innerHTML = buildMenuHtml(false, '');
      if (ovMenu) ovMenu.innerHTML = buildMenuHtml(true, 'setOverviewModelFilter');
      if (estMenu) estMenu.innerHTML = buildMenuHtml(true, 'setEstimatorModelFilter');
    }

    async function switchActiveHarness(harness) {
      showToast('Adapting model catalog & cost telemetry for ' + harness + '...');
      const res = await fetch('/api/active-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ harness })
      });
      const data = await res.json();
      if (data.ok) {
        currentActiveModelId = data.activeModelId;
        updateHarnessPillsUi(data.activeHarness, data.activeHarnessLabel);
        if (data.report) {
          latestEstimateData = data.report;
          renderEstimateView(data.report);
        }
        await refreshStatus(true);
        showToast('✓ Switched to ' + data.activeHarnessLabel + ' (' + data.activeModelDisplayName + ')');
      }
    }

    async function switchActiveAgentModel(modelId) {
      if (!modelId) return;
      showToast('Switching active model to ' + modelId + '...');
      const res = await fetch('/api/active-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ model: modelId })
      });
      const data = await res.json();
      if (data.ok) {
        currentActiveModelId = data.activeModelId;
        updateHarnessPillsUi(data.activeHarness, data.activeHarnessLabel);
        if (data.report) {
          latestEstimateData = data.report;
          renderEstimateView(data.report);
        }
        await refreshStatus(true);
        showToast('✓ Active Model updated to ' + data.activeModelDisplayName);
      }
    }

    function matchesFilter(scenario, filter) {
      if (filter === 'all') return true;
      if (filter === 'harness') {
        return (
          scenario.modelId === currentActiveModelId ||
          (Array.isArray(scenario.harnesses) && scenario.harnesses.includes(currentActiveHarness))
        );
      }
      return (scenario.category || 'frontier') === filter;
    }

    function formatCategoryLabel(cat) {
      if (cat === 'open-source') return 'Open-Source';
      if (cat === 'local') return 'Local ($0)';
      if (cat === 'hybrid') return 'Auto-Route';
      return 'Frontier';
    }

    function renderModelComparisonPanels() {
      const scenarios = (latestEstimateData && latestEstimateData.whatIfScenarios) ? latestEstimateData.whatIfScenarios : [];
      const sessionMap = {};
      for (const item of latestSessionComparison) {
        sessionMap[item.modelId] = item;
      }

      // 1. Overview Clean Model List (No clipped scrollbars or noisy developer tags)
      const ovFiltered = scenarios.filter(s => matchesFilter(s, overviewModelFilter));

      const ovEl = document.getElementById('overviewModelCompareList');
      if (ovEl && ovFiltered.length > 0) {
        ovEl.innerHTML = ovFiltered.map(w => {
          const sess = sessionMap[w.modelId];
          const sessCost = sess ? '$' + sess.sessionCostUsd.toFixed(2) : '$' + (w.expectedUsd * 0.25).toFixed(2);
          const isCurrent = w.modelId === currentActiveModelId;
          const catBadge = formatCategoryLabel(w.category);
          const diffBadgeHtml = isCurrent
            ? '<span class="badge badge-silver">Current Model</span>'
            : w.savingsPercent > 0
              ? \`<span class="badge badge-green">\${w.savingsPercent}% cheaper</span>\`
              : w.savingsPercent < 0
                ? \`<span class="badge badge-neutral">\${Math.abs(w.savingsPercent)}% more</span>\`
                : '<span class="badge badge-neutral">Same cost</span>';

          return \`
            <div class="feed-item" style="flex-direction: row; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; \${isCurrent ? 'background: rgba(255, 255, 255, 0.045);' : ''}">
              <div style="min-width: 180px; flex: 1;">
                <div class="step-title">
                  <span>\${escapeHtml(w.label)}</span>
                  <span class="badge \${w.category === 'open-source' || w.category === 'local' ? 'badge-green' : 'badge-neutral'}">\${escapeHtml(catBadge)}</span>
                </div>
                <div class="token-breakdown" style="margin-top: 4px;">
                  <span>Session: <strong style="color: #ffffff;">\${sessCost}</strong></span>
                  <span>·</span>
                  <span>Full Project: <strong style="color: #ffffff;">$\${w.expectedUsd.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                \${diffBadgeHtml}
                \${w.modelId !== 'hybrid' ? \`
                  <button type="button" class="btn \${isCurrent ? 'btn-white' : ''}" style="padding: 5px 10px; font-size: 11.5px;" onclick="switchActiveAgentModel('\${w.modelId}')">
                    \${isCurrent ? '✓ Active' : 'Switch'}
                  </button>
                \` : ''}
              </div>
            </div>
          \`;
        }).join('');
      }

      // 2. Full Estimator Comparison Table
      const estFiltered = scenarios.filter(s => matchesFilter(s, estimatorModelFilter));

      const tableEl = document.getElementById('fullComparisonTableBody');
      if (tableEl && estFiltered.length > 0) {
        tableEl.innerHTML = estFiltered.map(w => {
          const sess = sessionMap[w.modelId];
          const sessCost = sess ? '$' + sess.sessionCostUsd.toFixed(2) : '--';
          const isCurrent = w.modelId === currentActiveModelId;
          const catBadge = formatCategoryLabel(w.category);
          const rates = (w.inputPerMillion !== undefined)
            ? '$' + w.inputPerMillion.toFixed(2) + ' / $' + w.cacheReadPerMillion.toFixed(2) + ' / $' + w.outputPerMillion.toFixed(2)
            : '--';
          const rangeText = (w.lowUsd !== undefined && w.highUsd !== undefined)
            ? ' ($' + w.lowUsd.toFixed(2) + ' – $' + w.highUsd.toFixed(2) + ')'
            : '';
          return \`
            <tr style="\${isCurrent ? 'background: rgba(255, 255, 255, 0.04);' : ''}">
              <td>
                <div style="font-weight: 600; color: #ffffff;">\${escapeHtml(w.label)}</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">\${escapeHtml(w.description || '')}</div>
              </td>
              <td><span class="badge \${w.category === 'open-source' || w.category === 'local' ? 'badge-green' : 'badge-neutral'}">\${escapeHtml(catBadge)}</span></td>
              <td style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">\${rates}</td>
              <td style="font-family: var(--font-mono); font-weight: 600; color: #ffffff;">\${sessCost}</td>
              <td>
                <strong style="color: #ffffff; font-size: 14px;">$\${w.expectedUsd.toFixed(2)}</strong>
                <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted);">\${rangeText}</span>
              </td>
              <td>
                <span class="badge \${isCurrent ? 'badge-silver' : w.savingsPercent >= 0 ? 'badge-green' : 'badge-neutral'}">
                  \${isCurrent ? 'Current Model' : w.savingsPercent === 0 ? 'Same cost' : w.savingsPercent > 0 ? w.savingsPercent + '% cheaper' : Math.abs(w.savingsPercent) + '% more'}
                </span>
              </td>
              <td>
                \${w.modelId !== 'hybrid' ? \`
                  <button type="button" class="btn \${isCurrent ? 'btn-white' : ''}" style="padding: 5px 10px; font-size: 12px;" onclick="switchActiveAgentModel('\${w.modelId}')">
                    \${isCurrent ? '✓ Active' : 'Switch Model'}
                  </button>
                \` : '<span class="badge badge-silver">Auto-Policy</span>'}
              </td>
            </tr>
          \`;
        }).join('');
      }
    }

    async function simulateRiskyAction() {
      showToast('⚡ Simulated risky file edit sent — waiting for your approval');
      switchView('overview');
      fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Task': 'live-demo' },
        body: JSON.stringify({
          model: 'smart',
          _cairn_local_mock: true,
          messages: [{ role: 'user', content: 'Update configuration in cairn.yaml' }],
          mock_tool_call: {
            name: 'write_file',
            arguments: { path: 'cairn.yaml', content: '# Updated by agent' }
          }
        })
      });
      setTimeout(() => refreshStatus(false), 180);
    }

    function renderEstimateView(est) {
      if (!est || !est.totals) return;
      latestEstimateData = est;
      document.getElementById('statForecast').textContent = '$' + est.totals.costUsd.expected.toFixed(2);
      document.getElementById('statConfidence').textContent = String(est.confidence || 'medium').toUpperCase();
      document.getElementById('statForecastSub').textContent =
        'Range: $' + est.totals.costUsd.low.toFixed(2) + ' – $' + est.totals.costUsd.high.toFixed(2) + ' (' + (est.tasks || []).length + ' tasks)';

      document.getElementById('estLowUsd').textContent = '$' + est.totals.costUsd.low.toFixed(2);
      document.getElementById('estLowTokens').textContent = formatCompactTokens(est.totals.tokens.low) + ' tokens';
      document.getElementById('estExpectedUsd').textContent = '$' + est.totals.costUsd.expected.toFixed(2);
      document.getElementById('estExpectedTokens').textContent = formatCompactTokens(est.totals.tokens.expected) + ' tokens';
      document.getElementById('estHighUsd').textContent = '$' + est.totals.costUsd.high.toFixed(2);
      document.getElementById('estHighTokens').textContent = formatCompactTokens(est.totals.tokens.high) + ' tokens';
      document.getElementById('estConfidence').textContent = est.repoSummary.totalFiles + ' files';
      document.getElementById('estRepoSub').textContent = est.repoSummary.totalLinesOfCode.toLocaleString() + ' lines of code';

      document.getElementById('costDriversList').innerHTML = (est.topCostDrivers || []).map(d => \`
        <div class="feed-item">
          <div class="feed-item-top">
            <span class="step-title">\${escapeHtml(d.title)}</span>
            <span class="badge badge-silver">$\${d.expectedUsd.toFixed(2)} (\${d.sharePercent}%)</span>
          </div>
          <div class="segment-track" style="margin-top: 4px;">
            <div class="segment-fill" style="width: \${d.sharePercent}%;"></div>
          </div>
        </div>
      \`).join('');

      document.getElementById('taskTableTitle').textContent = 'Project Tasks (' + (est.tasks || []).length + ')';
      document.getElementById('estimateTasksBody').innerHTML = (est.tasks || []).map(t => \`
        <tr>
          <td style="font-family: var(--font-mono); color: var(--text-muted);">\${escapeHtml(t.id)}</td>
          <td>\${escapeHtml(t.title)}</td>
          <td><span class="badge \${t.complexity === 'high' ? 'badge-red' : t.complexity === 'medium' ? 'badge-neutral' : 'badge-green'}">\${escapeHtml(t.complexity)}</span></td>
          <td style="font-weight: 600;">$\${t.costUsd.expected.toFixed(2)}</td>
        </tr>
      \`).join('');

      renderModelComparisonPanels();
    }

    async function runPrdEstimate() {
      const model = document.getElementById('estimateModelSelect').value;
      await switchActiveAgentModel(model);
    }

    function reconcilePendingRemoteReplies(feed) {
      const normalizePrompt = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const now = Date.now();
      for (const [key, pending] of pendingRemoteReplies) {
        const prompt = normalizePrompt(pending.prompt);
        const userIndex = feed.findIndex(item =>
          item.role === 'user' &&
          item.source === 'ide' &&
          normalizePrompt(item.text) === prompt &&
          Date.parse(item.timestamp || '') >= pending.sentAt - 10000
        );
        const response = userIndex >= 0
          ? feed.slice(userIndex + 1).find(item =>
              item.role === 'assistant' && Date.parse(item.timestamp || '') >= pending.sentAt
            )
          : null;
        if (response) {
          const statusEl = document.getElementById('liveIdeSendStatus');
          if (statusEl) {
            statusEl.innerHTML = '<span style="color: var(--peacock); font-weight: 600;">✓ Reply received from ' +
              escapeHtml(response.modelDisplayName || 'IDE agent') + '</span>';
          }
          pendingRemoteReplies.delete(key);
        } else if (now - pending.sentAt > 120000) {
          const statusEl = document.getElementById('liveIdeSendStatus');
          if (statusEl) {
            statusEl.textContent = 'No IDE reply appeared within 2 minutes. Check the target IDE window and its connection, then resend if needed.';
          }
          pendingRemoteReplies.delete(key);
        }
      }
    }

    async function loadSingleCurrentWindow() {
      try {
        const res = await fetch('/api/os/windows', { headers: { 'X-Cairn-Token': TOKEN } });
        const data = await res.json();
        const win = (data.windows || [])[0];
        if (win) {
          currentWindowHwnd = win.hwnd;
          document.getElementById('currentWindowLabel').textContent = win.title;
          document.getElementById('liveWindowTitle').textContent = win.title;
          if (pendingRemoteReplies.size === 0) {
            document.getElementById('liveIdeSendStatus').textContent =
              'IDE window ready. Replies appear here when the IDE transcript syncs.';
          }
        } else {
          currentWindowHwnd = '';
          document.getElementById('currentWindowLabel').textContent = 'No supported IDE window detected';
          document.getElementById('currentWindowLabel').title = 'Open Antigravity, VS Code, or Cursor on the desktop to send prompts directly.';
          document.getElementById('liveWindowTitle').textContent = 'No supported IDE window detected';
          if (pendingRemoteReplies.size === 0) {
            document.getElementById('liveIdeSendStatus').textContent =
              'Open Antigravity, VS Code, or Cursor on the desktop. Gateway queued prompts run only when an agent request passes through Cairn.';
          }
        }
      } catch {}
    }

    function handleUnauthorizedPairing() {
      document.getElementById('connDot').style.background = '#fb7185';
      document.getElementById('connText').textContent = 'Pairing Required';
      let pairCard = document.getElementById('mobilePairingModal');
      if (!pairCard) {
        pairCard = document.createElement('div');
        pairCard.id = 'mobilePairingModal';
        pairCard.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
        pairCard.innerHTML = '<div style="background:#0e0f13;border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:24px;max-width:420px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,0.7);">' +
          '<div style="font-size:12px;font-family:var(--font-mono);color:#93c5fd;font-weight:600;letter-spacing:0.08em;margin-bottom:6px;">CAIRN REMOTE CONTROL</div>' +
          '<div style="font-size:18px;font-weight:700;color:#ffffff;margin-bottom:8px;">Enter Pairing Token</div>' +
          '<div style="font-size:13px;color:#a1a1aa;margin-bottom:16px;line-height:1.5;">To connect your phone, copy the pairing token or full link displayed in your desktop Cairn dashboard under the Safety or Control tab.</div>' +
          '<input id="manualPairTokenInput" placeholder="Paste pairing token here..." style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#ffffff;font-family:var(--font-mono);font-size:13px;margin-bottom:12px;box-sizing:border-box;" />' +
          '<div style="display:flex;gap:10px;">' +
          '<button type="button" class="btn btn-white" style="flex:1;padding:10px;justify-content:center;font-weight:600;" onclick="submitManualPairToken()">Pair Phone</button>' +
          '</div>' +
          '</div>';
        document.body.appendChild(pairCard);
      }
      pairCard.style.display = 'flex';
    }

    function hideUnauthorizedPairing() {
      const pairCard = document.getElementById('mobilePairingModal');
      if (pairCard) pairCard.style.display = 'none';
    }

    function submitManualPairToken() {
      const input = document.getElementById('manualPairTokenInput');
      if (!input || !input.value.trim()) {
        showToast('Please enter a valid pairing token');
        return;
      }
      let val = input.value.trim();
      if (val.indexOf('token=') !== -1) {
        try {
          const u = new URL(val);
          val = u.searchParams.get('token') || val;
        } catch {
          const m = val.match(/token=([a-zA-Z0-9_-]+)/);
          if (m) val = m[1];
        }
      }
      TOKEN = val;
      try {
        localStorage.setItem('cairn_pairing_token', TOKEN);
      } catch {}
      hideUnauthorizedPairing();
      showToast('Pairing token saved. Connecting...');
      refreshStatus(true);
    }

    async function refreshStatus(forceEstimateRender) {
      try {
        const res = await fetch('/api/status', { headers: { 'X-Cairn-Token': TOKEN } });
        if (res.status === 401) {
          handleUnauthorizedPairing();
          return;
        }
        const data = await res.json();
        if (!data || !data.policy) {
          throw new Error('Invalid status payload');
        }
        hideUnauthorizedPairing();

        document.getElementById('connDot').style.background = 'var(--peacock)';

        const activeState = data.antigravityLive || {};
        if (activeState.activeHarness) updateHarnessPillsUi(activeState.activeHarness, activeState.activeHarnessLabel);
        const remaining = [];
        for (const [scope, usedKey] of [['Project', 'projectUsd'], ['Today', 'dailyUsd'], ['Task', 'taskUsd']]) {
          const budget = data.policy?.budgets?.[scope.toLowerCase()];
          if (budget?.usd > 0) remaining.push({ scope, amount: Math.max(0, budget.usd - Number(data.spend?.[usedKey] || 0)) });
        }
        const budgetLeft = remaining.length ? Math.min(...remaining.map(x => x.amount)) : null;
        const budgetBox = document.getElementById('cairnBudgetRemaining');
        if (budgetBox) {
          budgetBox.hidden = budgetLeft === null;
          if (budgetLeft !== null) {
            const tight = remaining.find(x => x.amount === budgetLeft);
            const cap = Number(data.policy?.budgets?.[tight.scope.toLowerCase()]?.usd) || 0;
            const leftPct = cap > 0 ? Math.max(0, Math.min(100, (budgetLeft / cap) * 100)) : 0;
            budgetBox.dataset.state = leftPct <= 0 ? 'over' : leftPct <= 20 ? 'warn' : 'ok';
            document.getElementById('cairnBudgetRemainingAmt').textContent = '$' + budgetLeft.toFixed(2);
            document.getElementById('cairnBudgetRemainingScope').textContent = tight.scope + ' limit · of $' + cap.toFixed(2);
            document.getElementById('cairnBudgetRemainingBar').style.width = leftPct.toFixed(1) + '%';
          }
        }

        const projLimit = Number(data.policy.budgets.project && data.policy.budgets.project.usd) || 0;
        const hasCostCap = projLimit > 0;
        const spent = data.spend.projectUsd || 0;
        const pct = hasCostCap ? Math.min(100, (spent / projLimit) * 100) : 0;

        document.getElementById('budgetCapBadge').textContent = hasCostCap ? '$' + projLimit.toFixed(2) + ' Limit' : 'Off';
        document.getElementById('statSpend').textContent = '$' + spent.toFixed(2);
        document.getElementById('statCalls').textContent = data.spend.totalCalls + ' requests tracked in session';
        document.getElementById('statTokens').textContent = formatCompactTokens(data.spend.totalTokens);

        document.getElementById('burnPctBadge').textContent = pct.toFixed(1) + '% used';
        document.getElementById('burnText').textContent = '$' + spent.toFixed(2) + ' spent';
        document.getElementById('burnLimitText').textContent = hasCostCap ? '$' + projLimit.toFixed(2) + ' cap' : 'No cap';
        document.getElementById('budgetBar').style.width = pct + '%';

        const objReqEl = document.getElementById('gftObjRequests');
        if (objReqEl) objReqEl.textContent = String(data.spend.totalCalls || 0);
        gftBudgetMeta = { spent: Number(spent) || 0, cap: Number(projLimit) || 0 };
        renderGftBarcodes(pct, Number((document.getElementById("gftCachePctNum") || {}).textContent) || 0);

        // Queued steering instructions
        const steerQueue = data.steeringQueue || [];
        const steerActions = (data.recentActions || []).filter(a => a.toolName === 'steer_agent').slice(0, 3);
        const queuedBadge = document.getElementById('queuedSteerBadge');
        queuedBadge.textContent = steerQueue.length > 0 ? (steerQueue.length + ' pending · clear') : 'Ready';
        queuedBadge.style.cursor = steerQueue.length > 0 ? 'pointer' : 'default';
        queuedBadge.title = steerQueue.length > 0 ? 'Waiting for the next agent request through the Cairn gateway. Click to clear.' : '';
        queuedBadge.onclick = steerQueue.length > 0 ? clearSteerQueue : null;
        const steerListEl = document.getElementById('steerQueueList');
        if (steerActions.length > 0) {
          steerListEl.innerHTML = '<div class="card-stack" style="margin-top: 4px;">' + steerActions.map(s => \`
            <div class="feed-item" style="padding: 9px 12px;">
              <div class="feed-item-top">
                <span class="step-title" style="font-size: 12.5px;"><span class="tool-tag">Sent</span> \${escapeHtml(s.preview)}</span>
                <span class="badge \${s.target === 'ide_window' ? 'badge-green' : 'badge-silver'}">\${s.target === 'ide_window' ? 'Sent to IDE' : 'Via gateway'}</span>
              </div>
            </div>
          \`).join('') + '</div>';
        } else {
          steerListEl.innerHTML = '';
        }

        // Antigravity & Multi-Harness Live Sync Feed
        const ag = data.antigravityLive;
        if (ag) {
          latestAntigravityState = ag;
          reconcilePendingRemoteReplies(Array.isArray(ag.conversationFeed) ? ag.conversationFeed : []);
          updateHarnessPillsUi(ag.activeHarness, ag.activeHarnessLabel);
          document.getElementById('connText').textContent = (ag.activeHarnessLabel || 'Antigravity') + ' Live';
          document.getElementById('activityStreamTitle').textContent = 'Live ' + (ag.activeHarnessLabel || 'Antigravity IDE') + ' Activity';

          // Update Live Antigravity Usage Bar dynamically based on the currently picked agent
          const agTokensObj = ag.sessionTokens || { uncachedInput: 0, cachedRead: 0, output: 0, total: 0 };
          const agTotalTok = Number(agTokensObj.total || 0);
          const agCachedTok = Number(agTokensObj.cachedRead || 0);
          const agUncachedTok = Number(agTokensObj.uncachedInput || 0);
          const totalPromptTok = agCachedTok + agUncachedTok;
          const cacheHitPct = totalPromptTok > 0 ? ((agCachedTok / totalPromptTok) * 100) : 0;
          const ctxCap = Number(ag.activeModelContextLength || 2000000);
          const latestEvent = (Array.isArray(ag.recentEvents) && ag.recentEvents.length > 0) ? ag.recentEvents[0] : null;
          const activeTurnContextTok = latestEvent
            ? Number(latestEvent.inputTokens || 0) + Number(latestEvent.cachedTokens || 0) + Number(latestEvent.outputTokens || 0)
            : Math.min(ctxCap, agTotalTok);
          const ctxFillPct = ctxCap > 0 ? Math.min(100, (activeTurnContextTok / ctxCap) * 100) : 0;
          const barFillPct = Math.min(100, Math.max(5, ctxFillPct > 1 ? ctxFillPct : cacheHitPct));

          const activeModelUsageItem = Array.isArray(ag.modelUsage)
            ? ag.modelUsage.find(m => m.modelId === ag.activeModelId)
            : null;
          const shortAgentName = String(ag.activeModelDisplayName || 'Antigravity').split('·')[0].trim();
          const eqAgentCost = activeModelUsageItem
            ? '$' + Number(activeModelUsageItem.sessionEquivalentCostUsd || spent).toFixed(2)
            : '$' + spent.toFixed(2);

          const agUsageTextEl = document.getElementById('agLiveUsageText');
          if (agUsageTextEl) {
            agUsageTextEl.textContent = shortAgentName + ': ' + formatCompactTokens(agTotalTok) + ' tok (' + (ag.totalSteps || 0) + ' steps · ' + eqAgentCost + ')';
          }
          const agUsageBarEl = document.getElementById('agLiveUsageBar');
          if (agUsageBarEl) {
            agUsageBarEl.style.width = barFillPct.toFixed(1) + '%';
          }
          const agCtxCapEl = document.getElementById('agLiveContextCapText');
          if (agCtxCapEl) {
            agCtxCapEl.textContent = Math.round(ctxCap / 1000).toLocaleString() + 'K ctx';
          }
          const agCacheBadgeEl = document.getElementById('agLiveCacheRateBadge');
          if (agCacheBadgeEl) {
            agCacheBadgeEl.textContent = cacheHitPct.toFixed(1) + '% cached';
          }

          const leftLayerList = document.getElementById('gftLeftLayerMiniList');
          if (leftLayerList && Array.isArray(ag.technicalBreakdown) && ag.technicalBreakdown.length > 0) {
            leftLayerList.innerHTML = ag.technicalBreakdown.slice(0, 2).map(function(l) {
              return '<div class="gft-layer-mini-row">' +
                '<div class="gft-layer-mini-top">' +
                '<span style="color: #e4e4e7; font-weight: 500;">' + escapeHtml(l.label) + '</span>' +
                '<span style="font-family: var(--font-mono); font-size: 10.5px; color: #93c5fd;">' + Number(l.sharePercent || 0).toFixed(0) + '% · $' + Number(l.costUsd || 0).toFixed(2) + '</span>' +
                '</div>' +
                '<div class="segment-track" style="height: 3.5px;"><div class="segment-fill" style="width: ' + Math.max(4, Math.min(100, l.sharePercent)) + '%;"></div></div>' +
                '</div>';
            }).join('');
          }

          renderGftBarcodes(pct, cacheHitPct);
          renderGftTelemetryChart(ag);

          // Populate subtle Auto-Detected IDE & Agent Usage Window (Used vs Remaining)
          const autoIdeEl = document.getElementById('autoDetectIdeName');
          if (autoIdeEl) autoIdeEl.textContent = ag.activeHarnessLabel || 'Antigravity IDE';
          const autoAgentEl = document.getElementById('autoDetectAgentName');
          if (autoAgentEl) {
            autoAgentEl.textContent = shortAgentName + (ag.detectedSubagentRole ? ' (' + ag.detectedSubagentRole + ')' : '');
          }
          const autoSrcEl = document.getElementById('autoDetectSourceBadge');
          if (autoSrcEl) {
            const srcMap = {
              'auto-transcript': 'IDE TRANSCRIPT SYNC',
              'auto-gateway': 'GATEWAY AUTO-DETECT',
              'auto-config': 'CONFIG AUTO-DETECT',
              'manual': 'ACTIVE SELECTION'
            };
            autoSrcEl.textContent = srcMap[ag.detectionSource] || 'AUTO-DETECTED';
          }
          const usedWindowTok = activeTurnContextTok > 0 ? activeTurnContextTok : Math.min(ctxCap, agTotalTok);
          const remainWindowTok = Math.max(0, ctxCap - usedWindowTok);
          const windowUsedPct = ctxCap > 0 ? Math.min(100, (usedWindowTok / ctxCap) * 100) : 0;
          const remainBudgetUsd = Math.max(0, projLimit - spent);

          const autoBarEl = document.getElementById('autoDetectWindowBar');
          if (autoBarEl) autoBarEl.style.width = Math.max(4, windowUsedPct).toFixed(1) + '%';
          const autoUsedTextEl = document.getElementById('autoDetectUsedText');
          if (autoUsedTextEl) autoUsedTextEl.textContent = formatCompactTokens(usedWindowTok) + ' / ' + Math.round(ctxCap / 1000).toLocaleString() + 'K ctx';
          const autoUsedPctEl = document.getElementById('autoDetectUsedPct');
          if (autoUsedPctEl) autoUsedPctEl.textContent = '(' + windowUsedPct.toFixed(1) + '% used · ' + formatCompactTokens(agTotalTok) + ' session)';
          const autoRemainTextEl = document.getElementById('autoDetectRemainText');
          if (autoRemainTextEl) autoRemainTextEl.textContent = formatCompactTokens(remainWindowTok) + ' ctx free';
          const autoRemainUsdEl = document.getElementById('autoDetectRemainUsd');
          if (autoRemainUsdEl) {
            autoRemainUsdEl.textContent = !hasCostCap
              ? ('· $' + spent.toFixed(2) + ' session cost')
              : remainBudgetUsd > 0
              ? ('· $' + remainBudgetUsd.toFixed(2) + ' budget left')
              : ('· $' + spent.toFixed(2) + ' / $' + projLimit.toFixed(2) + ' cap');
          }

          const objStepsEl = document.getElementById('gftObjSteps');
          if (objStepsEl) objStepsEl.textContent = String(ag.totalSteps || 0);
          const objCacheHitEl = document.getElementById('gftObjCacheHit');
          if (objCacheHitEl) objCacheHitEl.textContent = cacheHitPct.toFixed(1) + '%';
          const objCtxFillEl = document.getElementById('gftObjCtxFill');
          if (objCtxFillEl) objCtxFillEl.textContent = ctxFillPct.toFixed(1) + '%';
          const objPrdTasksEl = document.getElementById('gftObjPrdTasks');
          if (objPrdTasksEl && data.latestEstimate && Array.isArray(data.latestEstimate.tasks)) {
            objPrdTasksEl.textContent = String(data.latestEstimate.tasks.length);
          }
          const avgTurnVal = (ag.totalSteps && ag.totalSteps > 0) ? (spent / ag.totalSteps) : 0;
          const objAvgTurnEl = document.getElementById('gftObjAvgTurnUsd');
          if (objAvgTurnEl) objAvgTurnEl.textContent = '$' + avgTurnVal.toFixed(3);
          const estCacheSavedUsd = (agCachedTok / 1000000) * 1.125;
          const objCacheSavedEl = document.getElementById('gftObjCacheSavings');
          if (objCacheSavedEl) objCacheSavedEl.textContent = '$' + estCacheSavedUsd.toFixed(2);

          renderAntigravityLiveAgentsStrip(ag);
          if (data.projectLedger) {
            latestProjectLedger = data.projectLedger;
            renderProjectLedgerView(data.projectLedger, ag);
          }

          if (ag.activeModelId) {
            currentActiveModelId = ag.activeModelId;
          }
          if (ag.activeModelDisplayName) {
            document.getElementById('bannerAgentName').textContent = ag.activeModelDisplayName;
          }
          if (ag.activeModelCategory) {
            document.getElementById('activeModelCategoryBadge').textContent = ag.activeModelCategory.toUpperCase();
          }

          if (Array.isArray(ag.sessionModelComparison)) {
            latestSessionComparison = ag.sessionModelComparison;
            populateDynamicModelSelectors(ag.sessionModelComparison, currentActiveModelId);
            const cur = ag.sessionModelComparison.find(m => m.modelId === ag.activeModelId);
            if (cur) {
              const ctxK = Math.round((cur.contextLength || 128000) / 1000) + 'K';
              document.getElementById('activeModelRatesHint').textContent =
                ctxK + ' ctx · In: $' + cur.inputPerMillion + '/M · Cache: $' + cur.cacheReadPerMillion + '/M · Out: $' + cur.outputPerMillion + '/M';
            }
          }

          // Render Technical Cost & Token Breakdown (UI vs Backend vs Telemetry vs Infra vs Testing)
          if (Array.isArray(ag.technicalBreakdown) && ag.technicalBreakdown.length > 0) {
            const techEl = document.getElementById('technicalBreakdownList');
            const totalTechUsd = ag.technicalBreakdown.reduce((sum, item) => sum + Number(item.costUsd || 0), 0);
            const techBadge = document.getElementById('techTotalBadge');
            if (techBadge) {
              techBadge.textContent = '$' + totalTechUsd.toFixed(2) + ' total';
            }
            if (techEl) {
              techEl.innerHTML = ag.technicalBreakdown.map(t => \`
                <div class="feed-item">
                  <div class="feed-item-top" style="flex-wrap: wrap;">
                    <div class="step-title">
                      <span>\${escapeHtml(t.label)}</span>
                      <span class="tool-tag">\${t.stepsCount} turns</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span class="badge badge-green">$\${Number(t.costUsd || 0).toFixed(2)}</span>
                      <span class="badge badge-neutral">\${t.sharePercent}%</span>
                    </div>
                  </div>
                  <div class="segment-track" style="margin: 2px 0;">
                    <div class="segment-fill" style="width: \${Math.max(3, t.sharePercent)}%;"></div>
                  </div>
                  <div class="token-breakdown">
                    <span>Total: <strong style="color: #ffffff;">\${formatCompactTokens(t.totalTokens)} tokens</strong></span>
                    <span>·</span>
                    <span>In: \${formatCompactTokens(t.uncachedInputTokens)}</span>
                    <span>·</span>
                    <span>Cache: \${formatCompactTokens(t.cachedReadTokens)}</span>
                    <span>·</span>
                    <span>Out: \${formatCompactTokens(t.outputTokens)}</span>
                  </div>
                </div>
              \`).join('');
            }
          }

          const events = Array.isArray(ag.recentEvents) ? ag.recentEvents : [];
          const feedEl = document.getElementById('liveActivityList');
          if (events.length > 0) {
            feedEl.innerHTML = events.slice(0, 12).map(ev => {
              const tools = (ev.tools && ev.tools.length) ? ev.tools : ['agent_turn'];
              return \`
                <div class="feed-item">
                  <div class="feed-item-top">
                    <div class="step-title">
                      <span>Step #\${ev.stepIndex}</span>
                      \${tools.map(t => \`<span class="tool-tag">\${escapeHtml(t)}</span>\`).join('')}
                      <span class="badge badge-neutral">\${escapeHtml(ev.modelDisplayName || ag.activeModelDisplayName)}</span>
                    </div>
                    <span class="badge badge-green">$\${Number(ev.costUsd || 0).toFixed(4)}</span>
                  </div>
                  <div class="clean-path-box">\${cleanWorkspaceSummary(ev.summary)}</div>
                  <div class="token-breakdown"><span>In: \${formatCompactTokens(ev.inputTokens)}</span><span> · Cache: \${formatCompactTokens(ev.cachedTokens)}</span><span> · Out: \${formatCompactTokens(ev.outputTokens)}</span></div>
                </div>\`;
            }).join('');
          } else {
            feedEl.innerHTML = '<div class="empty-box" style="border: none;">No recent activity for ' + escapeHtml(ag.activeHarnessLabel || 'the detected IDE') + ' yet.</div>';
          }

          const gftHistoryBody = document.getElementById('gftHomeHistoryTableBody');
          if (gftHistoryBody) {
            if (events.length > 0) {
              gftHistoryBody.innerHTML = events.slice(0, 14).map((ev, idx) => {
                const tools = (ev.tools && ev.tools.length) ? ev.tools : ['agent_turn'];
                const primaryTool = tools[0];
                const isWriteAction = primaryTool.includes('edit') || primaryTool.includes('write') || primaryTool.includes('run');
                const pillClass = isWriteAction ? 'gft-side-pill' : 'gft-side-pill gft-side-pill-neutral';
                const pillLabel = isWriteAction ? 'Action' : 'Read';
                const modelShort = escapeHtml(String(ev.modelDisplayName || ag.activeModelDisplayName || 'Gemini 4').split('·')[0].trim());
                const stepTime = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ('Turn #' + (events.length - idx));
                return \`
                  <tr>
                    <td style="font-family: var(--font-mono); color: #ffffff; font-weight: 600;">#\${ev.stepIndex || (events.length - idx)}</td>
                    <td style="font-family: var(--font-mono); color: var(--text-secondary); font-size: 11.5px;">\${escapeHtml(stepTime)}</td>
                    <td style="color: #e4e4e7; font-weight: 500;">\${modelShort}</td>
                    <td style="font-family: var(--font-mono); color: var(--text-secondary); font-size: 11.5px;">\${escapeHtml(primaryTool)}</td>
                    <td><span class="\${pillClass}">\${pillLabel}</span></td>
                    <td style="font-family: var(--font-mono); color: #ffffff;">\${formatCompactTokens(ev.inputTokens || 0)}</td>
                    <td style="font-family: var(--font-mono); color: var(--text-secondary);">\${formatCompactTokens(ev.cachedTokens || 0)}</td>
                    <td style="font-family: var(--font-mono); color: var(--text-secondary);">\${formatCompactTokens(ev.outputTokens || 0)}</td>
                    <td style="text-align: right; font-family: var(--font-mono); font-weight: 600; color: #60a5fa;">$\${Number(ev.costUsd || 0).toFixed(4)}</td>
                  </tr>
                \`;
              }).join('');
              const searchInput = document.getElementById('gftHistorySearchInput');
              if (searchInput && searchInput.value) {
                filterGftHistoryRows(searchInput.value);
              }
            } else {
              gftHistoryBody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 18px;">No session step history recorded yet.</td></tr>';
            }
          }

          if (ag.connected) {
            document.getElementById('statSteps').textContent = ag.totalSteps + ' steps in current session';
            document.getElementById('agStepsBadge').textContent = ag.totalSteps + ' steps synced';

            // Render conversation turns in the remote chat view
            const consoleEl = document.getElementById('liveIdeOutputConsole');
            const consoleBadge = document.getElementById('liveConsoleCountBadge');
            const convFeed = Array.isArray(ag.conversationFeed) ? ag.conversationFeed : [];
            if (consoleBadge) {
              consoleBadge.textContent = convFeed.length + ' turns synced';
            }
            if (consoleEl && convFeed.length > 0) {
              consoleEl.innerHTML = convFeed.filter(item => item.role !== 'tool').map(item => {
                const isUser = item.role === 'user';
                const isLocal = item.role === 'tool';
                const roleLabel = isUser
                  ? (item.source === 'phone' ? '📱 You (Remote Prompt)' : '👤 You (IDE Prompt)')
                  : isLocal
                    ? '🪨 Cairn (local action)'
                    : '🤖 ' + escapeHtml(item.modelDisplayName || ag.activeModelDisplayName || 'Antigravity Agent');
                const deliveryTool = Array.isArray(item.tools) ? item.tools.find(t => String(t.name).indexOf('delivery:') === 0) : null;
                const visibleTools = Array.isArray(item.tools) ? item.tools.filter(t => String(t.name).indexOf('delivery:') !== 0 && t.name !== 'location') : [];
                const locationTool = Array.isArray(item.tools) ? item.tools.find(t => t.name === 'location') : null;
                const toolsHtml = visibleTools.length > 0
                  ? '<div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">' +
                    visibleTools.map(t => \`
                      <div class="chat-tool-box">
                        <strong style="color: #e4e4e7;">⚡ \${escapeHtml(t.name)}</strong>: \${cleanWorkspaceSummary(t.detail)}
                      </div>
                    \`).join('') +
                    '</div>'
                  : '';
                let costHtml;
                if (deliveryTool) {
                  const state = String(deliveryTool.name).slice(9);
                  const label = state === 'delivered' ? 'Submitted · awaiting reply' : state === 'failed' ? 'Not sent · gateway queued' : 'Gateway queued';
                  const cls = state === 'delivered' ? 'badge-green' : 'badge-silver';
                  costHtml = \`<span class="badge \${cls}" title="\${escapeHtml(deliveryTool.detail)}">\${label}</span>\`;
                } else if (!isUser && item.costUsd > 0) {
                  costHtml = \`<span class="badge badge-green">$\${Number(item.costUsd).toFixed(4)}</span>\`;
                } else {
                  costHtml = \`<span class="badge badge-silver">\${isLocal ? 'Local' : 'Prompt'}</span>\`;
                }

                const savedPill = (!isUser && !isLocal) || locationTool
                  ? \`<span class="badge badge-neutral" style="font-size: 10px; color: var(--text-muted); border-color: rgba(255,255,255,0.12);" title="Saved to .cairn/remote_prompts.md">📁 Saved to .cairn/remote_prompts.md</span>\`
                  : '';

                return \`
                  <div class="chat-turn \${isUser ? 'user-turn' : 'agent-turn'}">
                    <div class="chat-turn-header">
                      <span style="font-weight: 600; color: #ffffff;">\${roleLabel} <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); font-weight: 400;">· Step #\${item.stepIndex}</span></span>
                      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                        \${savedPill}
                        \${costHtml}
                      </div>
                    </div>
                    \${item.text ? \`<div class="chat-turn-body">\${formatTurnContent(item.text, isUser)}</div>\` : ''}
                    \${toolsHtml}
                    \${!isUser && (item.inputTokens > 0 || item.outputTokens > 0) ? \`
                      <div class="token-breakdown" style="margin-top: 4px;">
                        <span>In: \${formatCompactTokens(item.inputTokens)}</span>
                        <span>·</span>
                        <span>Cache: \${formatCompactTokens(item.cachedTokens)}</span>
                        <span>·</span>
                        <span>Out: \${formatCompactTokens(item.outputTokens)}</span>
                      </div>
                    \` : ''}
                  </div>
                \`;
              }).join('');
              consoleEl.scrollTop = consoleEl.scrollHeight;
            }

            const events = ag.recentEvents || [];
            const feedEl = document.getElementById('liveActivityList');
            if (events.length > 0) {
              feedEl.innerHTML = events.slice(0, 12).map(ev => {
                const tools = (ev.tools && ev.tools.length) ? ev.tools : ['agent_turn'];
                const cleanSum = cleanWorkspaceSummary(ev.summary);
                return \`
                  <div class="feed-item">
                    <div class="feed-item-top">
                      <div class="step-title">
                        <span>Step #\${ev.stepIndex}</span>
                        \${tools.map(t => \`<span class="tool-tag">\${escapeHtml(t)}</span>\`).join('')}
                        <span class="badge badge-neutral">\${escapeHtml(ev.modelDisplayName || ag.activeModelDisplayName)}</span>
                      </div>
                      <span class="badge badge-green">$\${ev.costUsd.toFixed(4)}</span>
                    </div>
                    <div class="clean-path-box">\${cleanSum}</div>
                    <div class="token-breakdown">
                      <span>In: \${formatCompactTokens(ev.inputTokens)}</span>
                      <span>·</span>
                      <span>Cache: \${formatCompactTokens(ev.cachedTokens)}</span>
                      <span>·</span>
                      <span>Out: \${formatCompactTokens(ev.outputTokens)}</span>
                    </div>
                  </div>
                \`;
              }).join('');
            }
          }
        }

        if (data.latestEstimate) {
          latestEstimateData = data.latestEstimate;
          if (forceEstimateRender || document.getElementById('estExpectedUsd').textContent === '--') {
            renderEstimateView(data.latestEstimate);
          } else {
            renderModelComparisonPanels();
          }
        }

        // Pending Approvals (Compact green bar when 0 waiting, expanded list when > 0)
        const pending = data.pendingApprovals || [];
        document.getElementById('pendingBadge').textContent = pending.length;
        const gftRiskLbl = document.getElementById('gftRiskLabel');
        const gftRiskPipEl = document.getElementById('gftRiskPip');
        const objSafetyEl = document.getElementById('gftObjSafetyStatus');
        const objSafetySubEl = document.getElementById('gftObjSafetySub');
        if (gftRiskLbl && gftRiskPipEl) {
          if (pending.length > 0) {
            gftRiskLbl.textContent = pending.length + ' Action Risk';
            gftRiskPipEl.style.background = '#f43f5e';
            gftRiskPipEl.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.7)';
          } else {
            gftRiskLbl.textContent = 'Low Risks';
            gftRiskPipEl.style.background = '#3b82f6';
            gftRiskPipEl.style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.65)';
          }
        }
        if (objSafetyEl) {
          objSafetyEl.textContent = pending.length > 0 ? (pending.length + ' Waiting') : 'All Clear';
          objSafetyEl.style.color = pending.length > 0 ? '#fda4af' : '#ffffff';
        }
        if (objSafetySubEl) {
          objSafetySubEl.textContent = pending.length + ' waiting';
        }
        const homeAttention = document.getElementById('homeAttentionText');
        if (homeAttention) homeAttention.textContent = pending.length ? pending.length + (pending.length === 1 ? ' action needs your review' : ' actions need your review') : 'You are all caught up';
        const countLabel = document.getElementById('pendingCountLabel');
        countLabel.textContent = pending.length + ' waiting';
        countLabel.className = 'badge ' + (pending.length > 0 ? 'badge-red' : 'badge-green');
        const pendingEl = document.getElementById('pendingList');

        if (pending.length === 0) {
          pendingEl.innerHTML = \`
            <div class="safety-clear-bar">
              <span>✓ All clear — no risky edits or commands waiting</span>
            </div>
          \`;
        } else {
          pendingEl.innerHTML = '<div class="card-stack">' + pending.map(p => \`
            <div class="feed-item" style="background: rgba(244, 63, 94, 0.06);">
              <div class="feed-item-top">
                <span class="badge badge-red">\${escapeHtml(p.riskLevel.toUpperCase())} RISK · \${escapeHtml(p.toolName)}</span>
                <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">\${escapeHtml(p.id)}</span>
              </div>
              <div class="clean-path-box">\${cleanWorkspaceSummary(p.preview)}</div>
              <input id="rejectNote_\${p.id}" placeholder="Optional feedback or alternative instruction if blocking..." style="font-size: 12px; padding: 6px 10px; margin-top: 4px;" />
              <div style="font-size:12px;color:var(--text-secondary);">Approve releases this action to the agent. Block keeps it from running.</div>
              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button type="button" class="btn btn-white" onclick="decideApproval('\${p.id}', 'approved')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>Approve Action</button>
                <button type="button" class="btn btn-red" onclick="decideApproval('\${p.id}', 'rejected')"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>Block Action</button>
              </div>
            </div>
          \`).join('') + '</div>';
        }

        // Checkpoints
        const cps = (data.checkpoints || []).slice(0, 5);
        const cpEl = document.getElementById('checkpointList');
        if (cps.length === 0) {
          cpEl.innerHTML = '<div class="empty-box" style="border: none;">No file checkpoints recorded yet. Tap "+ Snapshot" above to create one.</div>';
        } else {
          cpEl.innerHTML = cps.map(c => \`
            <div class="feed-item">
              <div class="feed-item-top">
                <span class="step-title">\${cleanWorkspaceSummary(c.description)}</span>
                <span class="badge \${c.reverted ? 'badge-neutral' : 'badge-green'}">\${c.reverted ? 'Reverted' : 'Saved'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="token-breakdown">Tree #\${escapeHtml(c.gitTreeHash.slice(0, 7))}</span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn" onclick="previewCheckpointDiff('\${c.id}')" style="padding: 4px 10px; font-size: 12px;">Diff</button>
                  <button type="button" class="btn" onclick="revertCheckpoint('\${c.id}')" style="padding: 4px 10px; font-size: 12px;" \${c.reverted ? 'disabled' : ''}>
                    \${c.reverted ? '✓ Restored' : '↩ Restore'}
                  </button>
                </div>
              </div>
              <div id="cpDiff_\${c.id}" class="clean-path-box hidden" style="margin-top: 6px; font-family: var(--font-mono); font-size: 11px; white-space: pre-wrap; max-height: 180px; overflow-y: auto;"></div>
            </div>
          \`).join('');
        }
      } catch (e) {
        document.getElementById('connDot').style.background = '#f43f5e';
        document.getElementById('connText').textContent = 'Offline';
      }
    }

    async function decideApproval(actionId, decision, noteOverride) {
      const noteEl = document.getElementById('rejectNote_' + actionId);
      const note = noteOverride || (noteEl && noteEl.value ? noteEl.value.trim() : undefined);
      await fetch('/api/approvals/' + actionId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ decision, source: 'mobile', note })
      });
      showToast(decision === 'approved' ? '✓ Action approved and released to agent' : '✕ Action blocked');
      refreshStatus(false);
    }

    async function previewCheckpointDiff(cpId) {
      const box = document.getElementById('cpDiff_' + cpId);
      if (box && !box.classList.contains('hidden')) {
        box.classList.add('hidden');
        return;
      }
      const res = await fetch('/api/checkpoints/' + encodeURIComponent(cpId) + '/diff', {
        headers: { 'X-Cairn-Token': TOKEN }
      });
      const data = await res.json();
      if (box) {
        box.classList.remove('hidden');
        box.textContent = data.diff || data.stat || 'Working tree matches this checkpoint (0 changed lines).';
      }
      return data;
    }

    async function savePolicyBudgets(budgetsPatch) {
      const res = await fetch('/api/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ budgets: budgetsPatch })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✓ Updated Cairn budget policy');
        refreshStatus(false);
      }
      return data;
    }

    async function sendSteerMessage() {
      const input = document.getElementById('steerInput');
      const forwardEl = document.getElementById('steerForwardIde');
      const text = input.value.trim();
      if (!text) {
        showToast('Please enter a message or instruction first');
        input.focus();
        return;
      }
      const forwardToIde = Boolean(forwardEl && forwardEl.checked);
      const res = await fetch('/api/remote/steer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ instruction: text, forwardToIde, hwnd: currentWindowHwnd })
      });
      const data = await res.json();
      if (data.ok) {
        input.value = '';
        const steerStatusEl = document.getElementById('steerStatus');
        if (steerStatusEl) {
          if (data.agentOutput) {
            const costStr = data.costUsd > 0 ? \` · $\${Number(data.costUsd).toFixed(4)}\` : '';
            steerStatusEl.innerHTML = \`<span style="color: var(--peacock); font-weight: 600;">✓ Responded by \${escapeHtml(data.modelDisplayName || 'Agent')}\${costStr}</span> <span style="color: var(--text-muted); font-size: 11.5px;">· Saved to <code>.cairn/remote_prompts.md</code></span> <a href="javascript:void(0)" onclick="switchView('ide')" style="color: var(--peacock); text-decoration: underline; margin-left: 6px; font-size: 11.5px;">View Live Output Console →</a>\`;
          } else {
            steerStatusEl.textContent = describeDelivery(data, text);
          }
        }
        showToast(data.agentOutput ? \`✓ Responded by \${data.modelDisplayName || 'Agent'}!\` : (data.delivery === 'delivered' ? '✓ Delivered to IDE' : 'Queued'));
        await refreshStatus(false);
        captureFrameOnce();
      } else {
        document.getElementById('steerStatus').textContent = '✕ ' + (data.error || 'Could not send instruction');
      }
    }

    async function createManualSnapshot() {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ description: 'Manual workspace checkpoint' })
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✓ Created Git Shadow Snapshot #' + data.checkpoint.gitTreeHash.slice(0, 7));
        refreshStatus(false);
      } else {
        showToast('Could not create snapshot');
      }
    }

    async function revertCheckpoint(id) {
      const res = await fetch('/api/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('↩ Restored workspace files to Git Shadow Snapshot');
      } else {
        showToast('No snapshot available to revert yet — tap "+ Snapshot" first');
      }
      refreshStatus(false);
    }

    async function revertLatestShadow() {
      await revertCheckpoint(undefined);
    }

    async function windowAction(action) {
      await fetch('/api/os/window-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ hwnd: currentWindowHwnd, action })
      });
      showToast('Window action sent: ' + action);
      setTimeout(captureFrameOnce, 200);
    }

    async function captureFrameOnce() {
      const start = performance.now();
      try {
        const res = await fetch('/api/os/frame?hwnd=' + encodeURIComponent(currentWindowHwnd || ''), {
          headers: { 'X-Cairn-Token': TOKEN }
        });
        const data = await res.json();
        if (data.ok && data.dataUrl) {
          document.getElementById('ideViewport').src = data.dataUrl;
          const ms = Math.round(performance.now() - start);
          document.getElementById('fpsLabel').textContent = 'Live · ' + ms + 'ms';
        }
      } catch {}
    }

    function toggleAutoStream() {
      autoStream = !autoStream;
      document.getElementById('streamToggleBtn').textContent = autoStream ? '● Live Stream: ON' : '⏸ Live Stream: PAUSED';
      showToast(autoStream ? 'Live IDE stream resumed' : 'Live IDE stream paused');
    }

    async function onViewportTap(ev) {
      const img = document.getElementById('ideViewport');
      const rect = img.getBoundingClientRect();
      const normX = (ev.clientX - rect.left) / rect.width;
      const normY = (ev.clientY - rect.top) / rect.height;

      const wrap = document.getElementById('viewportWrap');
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = (ev.clientX - rect.left) + 'px';
      ripple.style.top = (ev.clientY - rect.top) + 'px';
      wrap.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);

      await fetch('/api/os/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ hwnd: currentWindowHwnd, normX, normY })
      });
      showToast('Forwarded click to IDE window');
      setTimeout(captureFrameOnce, 180);
    }

    async function sendMacro(macro) {
      await fetch('/api/os/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ hwnd: currentWindowHwnd, keys: macro })
      });
      showToast('Sent keystroke macro: ' + macro.toUpperCase());
      setTimeout(captureFrameOnce, 180);
    }

    async function sendCustomTextToIde() {
      const inp = document.getElementById('remoteKeyInput');
      const txt = inp.value.trim();
      if (!txt) {
        showToast('Please enter a message or prompt first');
        inp.focus();
        return;
      }
      inp.value = '';
      const statusEl = document.getElementById('liveIdeSendStatus');
      if (statusEl) {
        statusEl.textContent = '⏳ Sending prompt to your IDE…';
      }
      const res = await fetch('/api/remote/steer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ instruction: txt, forwardToIde: true, hwnd: currentWindowHwnd })
      });
      const data = await res.json();
      if (data.ok) {
        if (data.delivery === 'delivered') {
          const key = Date.now() + '-' + Math.random().toString(36).slice(2);
          pendingRemoteReplies.set(key, { prompt: txt, sentAt: Date.now() });
        }
        if (statusEl) {
          if (data.agentOutput) {
            const costStr = data.costUsd > 0 ? \` · $\${Number(data.costUsd).toFixed(4)}\` : '';
            statusEl.innerHTML = \`<span style="color: var(--peacock); font-weight: 600;">✓ Reply from \${escapeHtml(data.modelDisplayName || 'Agent')}\${costStr}</span>\`;
          } else {
            statusEl.textContent = describeDelivery(data, txt);
          }
        }
        showToast(data.agentOutput ? \`✓ Responded by \${data.modelDisplayName || 'Agent'}! View below.\` : (data.delivery === 'delivered' ? 'Prompt submitted · waiting for IDE reply' : 'Prompt not sent to the IDE'));
        await refreshStatus(false);
      } else if (statusEl) {
        statusEl.textContent = '✕ ' + (data.error || 'Could not send prompt');
      }
    }

    function describeDelivery(data, txt) {
      const short = '"' + String(txt || '').slice(0, 48) + '"';
      if (data.agentOutput) {
        const costStr = data.costUsd > 0 ? ' · $' + Number(data.costUsd).toFixed(4) : '';
        return \`✓ Responded by \${data.modelDisplayName || 'Agent'}\${costStr} · Saved to .cairn/remote_prompts.md\`;
      }
      if (data.delivery === 'delivered') {
        return '✓ Submitted ' + short + ' to the IDE window. Waiting for the IDE reply; it will appear here when synced.';
      }
      if (data.delivery === 'failed') {
        return 'Not sent to the IDE. ' + short + ' is queued for the next request routed through Cairn Gateway.';
      }
      return 'Queued ' + short + ' for the next request routed through Cairn Gateway.';
    }

    async function clearSteerQueue() {
      await fetch('/api/remote/steer/clear', {
        method: 'POST',
        headers: { 'X-Cairn-Token': TOKEN }
      });
      showToast('Cleared pending instructions');
      refreshStatus(false);
    }

    async function sendIdeRpc(command) {
      await fetch('/api/ide/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Cairn-Token': TOKEN },
        body: JSON.stringify({ command })
      });
      showToast('Triggered IDE command: ' + command);
    }

    document.getElementById('steerInput').addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendSteerMessage();
      }
    });

    loadSingleCurrentWindow();
    setInterval(loadSingleCurrentWindow, 10000);
    refreshStatus(true);
    setInterval(() => refreshStatus(false), 2000);
  </script>
</body>
</html>`;
}
