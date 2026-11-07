import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type { AntigravityLiveState } from '../telemetry/antigravity-sync.js';

const execFileAsync = promisify(execFile);

export interface IdeWindowInfo {
  hwnd: string;
  pid: number;
  processName: string;
  title: string;
  ideType: 'antigravity' | 'codex' | 'vscode' | 'cursor' | 'visualstudio';
  isCurrentWorkspace: boolean;
}

function runPowerShellEncoded(
  psScript: string,
  timeout = 4500
): Promise<{ stdout: string; stderr: string }> {
  const fullScript = `$ProgressPreference = 'SilentlyContinue'\n` + psScript;
  const encoded = Buffer.from(fullScript, 'utf16le').toString('base64');
  return execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
    { timeout, maxBuffer: 12 * 1024 * 1024 }
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class OsWindowBridge {
  private lastClickPos: { x: number; y: number; time: string } | null = null;
  private lastSentKeys: string | null = null;
  private lastAgentReply: string | null = null;
  private recentPhonePrompts: Array<{ text: string; reply?: string; time: string }> = [];

  constructor(private readonly workspaceDir: string = process.cwd()) {}

  public recordPromptReply(promptText: string, replyText: string): void {
    this.lastSentKeys = `Prompt: "${promptText.slice(0, 48)}"`;
    this.lastAgentReply = replyText.slice(0, 72);
    if (this.recentPhonePrompts.length > 0 && this.recentPhonePrompts[0].text === promptText) {
      this.recentPhonePrompts[0].reply = replyText;
    } else {
      this.recentPhonePrompts.unshift({
        text: promptText,
        reply: replyText,
        time: new Date().toLocaleTimeString(),
      });
    }
  }

  /**
   * Returns ONLY the single current Antigravity IDE window for this workspace
   * so the user never sees 8 duplicate background Electron helper PIDs.
   */
  public async listIdeWindows(): Promise<IdeWindowInfo[]> {
    const workspaceName = path.basename(this.workspaceDir);
    const preferredProcess = process.env.CAIRN_ACTIVE_IDE === 'codex' ? 'codex' : null;

    if (process.platform === 'win32') {
      const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$ag = Get-Process -Name 'Antigravity','codex','Code','Cursor','devenv' -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } |
  Sort-Object @{Expression={ if ($_.ProcessName -ieq '${preferredProcess ?? ''}') { 1 } else { 0 } }; Descending=$true}, @{Expression='WorkingSet64'; Descending=$true} |
  Select-Object -First 1 Id, ProcessName, MainWindowTitle, MainWindowHandle
if ($ag) {
  @{
    Id = [int]$ag.Id
    ProcessName = [string]$ag.ProcessName
    Title = if ($ag.MainWindowTitle) { [string]$ag.MainWindowTitle } else { "${workspaceName} — Antigravity IDE" }
    Hwnd = [string]$ag.MainWindowHandle
  } | ConvertTo-Json -Compress
}
`;
      try {
        const { stdout } = await runPowerShellEncoded(psScript, 3500);
        const clean = stdout.trim();
        if (clean.startsWith('{')) {
          const parsed = JSON.parse(clean) as Record<string, unknown>;
          const proc = String(parsed.ProcessName ?? 'Antigravity');
          const rawHwnd = String(parsed.Hwnd ?? '0');
          return [
            {
              hwnd: rawHwnd,
              pid: Number(parsed.Id ?? process.pid),
              processName: proc,
              title: `${workspaceName} — ${proc} IDE (Current Window)`,
              ideType: /codex/i.test(proc)
                ? 'codex'
                : /code/i.test(proc)
                ? 'vscode'
                : /cursor/i.test(proc)
                ? 'cursor'
                : /devenv/i.test(proc)
                ? 'visualstudio'
                : 'antigravity',
              isCurrentWorkspace: true,
            },
          ];
        }
      } catch {
        // Fallback below
      }
    }

    return [];
  }

  public async controlWindow(
    hwnd: string,
    action: 'focus' | 'minimize' | 'maximize' | 'restore'
  ): Promise<{ ok: boolean; action: string }> {
    this.lastSentKeys = `Window Action: ${action.toUpperCase()}`;
    if (process.platform === 'win32' && /^\d+$/.test(hwnd) && hwnd !== '0') {
      const showCmd =
        action === 'minimize' ? 6 : action === 'maximize' ? 3 : 9;
      const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32Control {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
$h = [IntPtr]::new([long]${Number(hwnd)})
[Win32Control]::ShowWindow($h, ${showCmd}) | Out-Null
if ("${action}" -ne "minimize") {
  [Win32Control]::SetForegroundWindow($h) | Out-Null
}
`;
      try {
        await runPowerShellEncoded(psScript, 2500);
      } catch {
        // Ignore if running in non-interactive session
      }
    }
    return { ok: true, action };
  }

  /**
   * Captures the current IDE window.
   * 1. Attempts native Win32 PrintWindow / CopyFromScreen if running in an interactive desktop session.
   * 2. If running in a headless/service session where GDI screen handles are blocked, renders a
   *    high-DPI Live Antigravity Workspace Mirror frame from the live workspace & transcript state.
   */
  public async captureWindowFrame(
    hwnd?: string,
    liveState?: AntigravityLiveState,
    spendSummary?: { projectUsd: number; totalTokens: number; totalCalls: number }
  ): Promise<{
    ok: boolean;
    dataUrl: string;
    width: number;
    height: number;
    mode: 'native-win32' | 'live-workspace-mirror';
  }> {
    if (process.platform === 'win32' && hwnd && /^\d+$/.test(hwnd) && hwnd !== '0') {
      const psScript = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
public class Win32Cap {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);
}
"@
$h = [IntPtr]::new([long]${Number(hwnd)})
$rect = New-Object RECT
if ([Win32Cap]::GetWindowRect($h, [ref]$rect)) {
  $w = $rect.Right - $rect.Left
  $ht = $rect.Bottom - $rect.Top
  if ($w -ge 300 -and $ht -ge 200) {
    $bmp = New-Object System.Drawing.Bitmap($w, $ht)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $hdc = $g.GetHdc()
    $printed = [Win32Cap]::PrintWindow($h, $hdc, 2)
    $g.ReleaseHdc($hdc)
    if (-not $printed) {
      $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
    }
    $g.Dispose()
    $targetW = [Math]::Min(1280, $w)
    $targetH = [int]($ht * ($targetW / [double]$w))
    $resized = New-Object System.Drawing.Bitmap($bmp, $targetW, $targetH)
    $bmp.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $resized.Dispose()
    $b64 = [Convert]::ToBase64String($ms.ToArray())
    $ms.Dispose()
    @{ width = $w; height = $ht; dataUrl = "data:image/jpeg;base64," + $b64 } | ConvertTo-Json -Compress
  }
}
`;
      try {
        const { stdout } = await runPowerShellEncoded(psScript, 3000);
        const clean = stdout.trim();
        if (clean.startsWith('{')) {
          const parsed = JSON.parse(clean);
          if (parsed.dataUrl) {
            return {
              ok: true,
              dataUrl: parsed.dataUrl,
              width: Number(parsed.width ?? 1280),
              height: Number(parsed.height ?? 720),
              mode: 'native-win32',
            };
          }
        }
      } catch {
        // Fall through to Live Workspace Mirror
      }
    }

    // Render Live Antigravity IDE Workspace Mirror SVG
      const svg = this.renderLiveIdeMirrorSvg(liveState, spendSummary);
    const b64 = Buffer.from(svg, 'utf-8').toString('base64');
    return {
      ok: true,
      dataUrl: `data:image/svg+xml;base64,${b64}`,
      width: 1280,
      height: 720,
      mode: 'live-workspace-mirror',
    };
  }

  private renderLiveIdeMirrorSvg(
    liveState?: AntigravityLiveState,
    spendSummary?: { projectUsd: number; totalTokens: number; totalCalls: number }
  ): string {
    const workspaceName = path.basename(this.workspaceDir);
    const nowTime = new Date().toLocaleTimeString();

    // Read a few lines from cairn.yaml or PRD to show real editor content
    let codeLines: string[] = [];
    try {
      const sampleFile = path.join(this.workspaceDir, 'cairn.yaml');
      if (fs.existsSync(sampleFile)) {
        codeLines = fs.readFileSync(sampleFile, 'utf-8').split(/\r?\n/).slice(0, 18);
      }
    } catch {
      codeLines = ['project: cairn-workspace', 'budgets:', '  project: { usd: 40 }'];
    }

    const events = (liveState?.recentEvents ?? []).slice(0, 5);
    const totalTokensStr = (spendSummary?.totalTokens ?? 0).toLocaleString();
    const totalUsdStr = (spendSummary?.projectUsd ?? 0).toFixed(4);
    const stepsCount = liveState?.totalSteps ?? 0;

    const codeSvgRows = codeLines
      .map(
        (line, idx) => `
      <text x="255" y="${125 + idx * 22}" fill="#4b5563" font-family="monospace" font-size="12">${
          idx + 1
        }</text>
      <text x="285" y="${125 + idx * 22}" fill="${
          line.trim().startsWith('#')
            ? '#6b7280'
            : line.includes(':')
            ? '#93c5fd'
            : '#e5e7eb'
        }" font-family="monospace" font-size="12.5">${escapeXml(line.slice(0, 62))}</text>`
      )
      .join('');

    const agentFeedRows = events
      .map(
        (ev, idx) => `
      <g transform="translate(835, ${120 + idx * 86})">
        <rect width="420" height="74" rx="7" fill="#0d1220" stroke="#1e2d4a" stroke-width="1"/>
        <text x="14" y="24" fill="#60a5fa" font-family="sans-serif" font-weight="bold" font-size="12">Step #${
          ev.stepIndex
        } · ${escapeXml(ev.tools.join(', ') || 'Agent Turn')}</text>
        <text x="310" y="24" fill="#0069fd" font-family="monospace" font-weight="bold" font-size="11">$${ev.costUsd.toFixed(
          4
        )}</text>
        <text x="14" y="45" fill="#d1d5db" font-family="monospace" font-size="11.5">${escapeXml(
          ev.summary.slice(0, 52)
        )}</text>
        <text x="14" y="63" fill="#6b7280" font-family="monospace" font-size="10.5">In: ${ev.inputTokens.toLocaleString()} · Cached: ${ev.cachedTokens.toLocaleString()} · Out: ${ev.outputTokens.toLocaleString()}</text>
      </g>`
      )
      .join('');

    const clickMarker = this.lastClickPos
      ? `<circle cx="${Math.round(this.lastClickPos.x * 1280)}" cy="${Math.round(
          this.lastClickPos.y * 720
        )}" r="16" fill="rgba(0, 105, 253, 0.28)" stroke="#0069fd" stroke-width="2.5"/>`
      : '';

    const lastInputBanner = this.lastSentKeys
      ? `Last Remote Input: ${escapeXml(this.lastSentKeys)}`
      : `Live Antigravity Session Synced (${stepsCount} steps)`;
    const lastReplyBanner = this.lastAgentReply
      ? `Agent Output: ${escapeXml(this.lastAgentReply)}`
      : escapeXml('Ready for remote prompts & interactive IDE control');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        <linearGradient id="cairnWhiteBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="48%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#0069fd"/>
        </linearGradient>
      </defs>
      <!-- Window Frame Background -->
      <rect width="1280" height="720" rx="10" fill="#070a12" stroke="#1e2d4a" stroke-width="2"/>

      <!-- Title Bar -->
      <rect width="1280" height="38" rx="10" fill="#0c1220"/>
      <circle cx="22" cy="19" r="6" fill="#f43f5e"/>
      <circle cx="42" cy="19" r="6" fill="#f59e0b"/>
      <circle cx="62" cy="19" r="6" fill="#0069fd"/>
      <g transform="translate(82, 9) scale(0.62)">
        <path d="M16.6 4.2L22.8 9.6H13.2L16.6 4.2Z" fill="#FFFFFF"/>
        <path d="M11.4 14.0H24.6L27.2 19.5H8.8L11.4 14.0Z" fill="#FFFFFF"/>
        <path d="M7.4 22.4H28.6L31.4 28.5H4.6L7.4 22.4Z" fill="#0069FD"/>
      </g>
      <text x="640" y="24" text-anchor="middle" fill="url(#cairnWhiteBlue)" font-family="sans-serif" font-size="12.5" font-weight="700">${escapeXml(
        workspaceName
      )} — Antigravity IDE (Live Window Mirror · ${escapeXml(nowTime)})</text>

      <!-- Left Activity Sidebar -->
      <rect x="0" y="38" width="235" height="650" fill="#090d16" stroke="#1b263b" stroke-width="1"/>
      <text x="18" y="68" fill="#6b7280" font-family="sans-serif" font-size="11" font-weight="bold">EXPLORER: ${escapeXml(
        workspaceName.toUpperCase()
      )}</text>
      <rect x="10" y="82" width="215" height="26" rx="5" fill="#132038"/>
      <text x="22" y="99" fill="#ffffff" font-family="monospace" font-size="12">📄 cairn.yaml</text>
      <text x="22" y="128" fill="#9ca3af" font-family="monospace" font-size="12">📘 Cairn PRD.md</text>
      <text x="22" y="156" fill="#9ca3af" font-family="monospace" font-size="12">📦 package.json</text>
      <text x="22" y="184" fill="#60a5fa" font-family="monospace" font-size="12">📁 packages/core</text>
      <text x="22" y="212" fill="#60a5fa" font-family="monospace" font-size="12">📁 packages/daemon</text>
      <text x="22" y="240" fill="#60a5fa" font-family="monospace" font-size="12">📁 packages/extension</text>

      <!-- Center Code Editor &amp; Integrated Terminal -->
      <rect x="235" y="38" width="580" height="470" fill="#070a12" stroke="#1b263b" stroke-width="1"/>
      <rect x="235" y="38" width="580" height="34" fill="#0c1220"/>
      <text x="255" y="60" fill="#ffffff" font-family="monospace" font-size="12">cairn.yaml — Active Policy</text>
      ${codeSvgRows}

      <!-- Bottom Integrated Terminal -->
      <rect x="235" y="508" width="580" height="180" fill="#04070d" stroke="#1b263b" stroke-width="1"/>
      <text x="252" y="532" fill="#9ca3af" font-family="monospace" font-size="11" font-weight="bold">TERMINAL · powershell (cairn daemon)</text>
      <text x="252" y="558" fill="#60a5fa" font-family="monospace" font-size="12">PS E:\\class related\\Cairn Studios\\cairn1&gt; npm start</text>
      <text x="252" y="582" fill="#ffffff" font-family="monospace" font-size="12">▲ CAIRN DAEMON ACTIVE on http://localhost:4100</text>
      <text x="252" y="606" fill="#0069fd" font-family="monospace" font-size="12">⚡ Antigravity Live Transcript Sync: CONNECTED (${stepsCount} steps)</text>
      <text x="252" y="630" fill="#93c5fd" font-family="monospace" font-size="12">&gt; ${lastInputBanner}</text>
      <text x="252" y="654" fill="#60a5fa" font-family="monospace" font-size="12">✓ ${lastReplyBanner}</text>

      <!-- Right Antigravity Agent Panel -->
      <rect x="815" y="38" width="465" height="650" fill="#090d16" stroke="#1b263b" stroke-width="1"/>
      <text x="835" y="68" fill="url(#cairnWhiteBlue)" font-family="sans-serif" font-size="13" font-weight="bold">ANTIGRAVITY AGENT · LIVE SESSION</text>
      <text x="835" y="92" fill="#9ca3af" font-family="monospace" font-size="11.5">Total Spend: $${totalUsdStr} · Tokens: ${totalTokensStr}</text>
      ${agentFeedRows}

      <!-- Bottom Status Bar -->
      <rect x="0" y="688" width="1280" height="32" fill="#0b1528"/>
      <circle cx="20" cy="704" r="5" fill="#0069fd"/>
      <text x="34" y="708" fill="#ffffff" font-family="monospace" font-size="11.5">Cairn Shield: $${totalUsdStr} / $40.00  |  Tokens: ${totalTokensStr}  |  Antigravity Live Connected</text>
      <text x="1260" y="708" text-anchor="end" fill="#60a5fa" font-family="monospace" font-size="11.5">Tap anywhere to click or send keys</text>

      ${clickMarker}
    </svg>`;
  }

  /**
   * Reliably focuses the active Antigravity IDE window, pastes a full text prompt/instruction
   * via the system clipboard, and submits with Enter.
   */
  public async sendTextPromptToWindow(
    hwnd: string | undefined,
    text: string,
    submitWithEnter = true
  ): Promise<{ ok: boolean; sent: string; detail?: string }> {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) return { ok: false, sent: '', detail: 'Empty prompt' };

    this.lastSentKeys = `Prompt sent: "${cleanText.slice(0, 60)}"`;
    this.recentPhonePrompts.unshift({
      text: cleanText,
      time: new Date().toLocaleTimeString(),
    });
    if (this.recentPhonePrompts.length > 5) {
      this.recentPhonePrompts.pop();
    }

    if (process.platform === 'win32') {
      const b64Text = Buffer.from(cleanText, 'utf-8').toString('base64');
      const numericHwnd = hwnd && /^\d+$/.test(hwnd) && hwnd !== '0' ? Number(hwnd) : 0;
      const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32Focus {
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
}
"@
$targetHwnd = [long]${numericHwnd}
$proc = Get-Process -Name 'Antigravity','codex','Code','Cursor' -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } |
  Sort-Object @{Expression={ if ($_.ProcessName -ieq '${process.env.CAIRN_ACTIVE_IDE ?? ''}') { 1 } else { 0 } }; Descending=$true}, @{Expression='WorkingSet64'; Descending=$true} |
  Select-Object -First 1
if (-not $proc) {
  $proc = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -match 'Antigravity|Codex|Visual Studio Code|Cursor|cairn' } |
    Select-Object -First 1
}
if ($targetHwnd -eq 0 -and $proc) {
  $targetHwnd = [long]$proc.MainWindowHandle
}
if ($targetHwnd -eq 0 -or -not $proc) {
  Write-Output 'CAIRN_ERROR:NO_SUPPORTED_IDE_WINDOW'
  exit 2
}
$targetProcess = Get-Process -Name 'Antigravity','codex','Code','Cursor' -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -eq [IntPtr]::new($targetHwnd) } |
  Select-Object -First 1
if (-not $targetProcess) {
  Write-Output 'CAIRN_ERROR:TARGET_WINDOW_NOT_SUPPORTED'
  exit 3
}
if ($targetHwnd -ne 0) {
  $h = [IntPtr]::new($targetHwnd)
  [Win32Focus]::ShowWindow($h, 9) | Out-Null
  [Win32Focus]::SetForegroundWindow($h) | Out-Null
}
if ($targetProcess) {
  $wshell = New-Object -ComObject WScript.Shell
  $wshell.AppActivate([int]$targetProcess.Id) | Out-Null
}
Start-Sleep -Milliseconds 60
$msg = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Text}'))
[System.Windows.Forms.Clipboard]::SetText($msg)
Start-Sleep -Milliseconds 40
[System.Windows.Forms.SendKeys]::SendWait('^v')
${submitWithEnter ? "Start-Sleep -Milliseconds 50\n[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')" : ''}
Write-Output ("CAIRN_SUBMITTED:" + $targetHwnd + ':' + $targetProcess.ProcessName)
`;
      try {
        const { stdout } = await runPowerShellEncoded(psScript, 4500);
        const submitted = stdout.trim().split(/\r?\n/).find((line) => line.startsWith('CAIRN_SUBMITTED:'));
        if (submitted) {
          const values = submitted.split(':');
          return {
            ok: true,
            sent: cleanText,
            detail: 'Submitted to ' + values[2] + ' window (' + values[1] + '); waiting for the IDE response',
          };
        }
        return {
          ok: false,
          sent: cleanText,
          detail: stdout.includes('CAIRN_ERROR:NO_SUPPORTED_IDE_WINDOW')
            ? 'No supported IDE window is open. Open Antigravity, Codex, VS Code, or Cursor and retry.'
            : 'Cairn could not confirm that the prompt was submitted to the IDE window.',
        };
      } catch (error) {
        const errorOutput = String((error as { stdout?: unknown })?.stdout ?? '');
        return {
          ok: false,
          sent: cleanText,
          detail: errorOutput.includes('CAIRN_ERROR:NO_SUPPORTED_IDE_WINDOW')
            ? 'No supported IDE window is open. Open Antigravity, Codex, VS Code, or Cursor and retry.'
            : errorOutput.includes('CAIRN_ERROR:TARGET_WINDOW_NOT_SUPPORTED')
            ? 'The selected window is not a supported IDE target. Refresh the window list and retry.'
            : error instanceof Error && error.message.includes('timed out')
            ? 'IDE prompt delivery timed out before Cairn could confirm submission.'
            : 'IDE prompt delivery failed before Cairn could confirm submission.',
        };
      }
    }

    return {
      ok: false,
      sent: cleanText,
      detail: 'IDE window delivery is only available on a supported Windows desktop session.',
    };
  }

  public async sendKeysToWindow(
    hwnd: string | undefined,
    keyOrMacro: string
  ): Promise<{ ok: boolean; sent: string }> {
    const raw = String(keyOrMacro ?? '').trim();
    if (!raw) return { ok: false, sent: '' };

    const macroMap: Record<string, string> = {
      enter: '{ENTER}',
      esc: '{ESC}',
      tab: '{TAB}',
      'ctrl+c': '^c',
      'ctrl+s': '^s',
      'ctrl+z': '^z',
      approve: '{ENTER}',
      reject: '{ESC}',
    };

    const lower = raw.toLowerCase();
    // If this is a freeform text message (not a single macro), route through clipboard-paste prompt sender!
    if (!macroMap[lower]) {
      const endsWithEnter = raw.endsWith('{ENTER}');
      const cleanPrompt = endsWithEnter ? raw.slice(0, -7).trim() : raw;
      if (cleanPrompt.length > 0) {
        return this.sendTextPromptToWindow(hwnd, cleanPrompt, endsWithEnter);
      }
    }

    this.lastSentKeys = `Macro: ${raw.toUpperCase()}`;
    if (process.platform === 'win32') {
      const sendSequence = macroMap[lower] ?? '{ENTER}';
      const numericHwnd = hwnd && /^\d+$/.test(hwnd) && hwnd !== '0' ? Number(hwnd) : 0;

      const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32MacroFocus {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
$targetHwnd = [long]${numericHwnd}
$proc = Get-Process -Name 'Antigravity','codex','Code','Cursor' -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } |
  Sort-Object @{Expression={ if ($_.ProcessName -ieq '${process.env.CAIRN_ACTIVE_IDE ?? ''}') { 1 } else { 0 } }; Descending=$true}, @{Expression='WorkingSet64'; Descending=$true} |
  Select-Object -First 1
if (-not $proc) {
  $proc = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -match 'Antigravity|Codex|Visual Studio Code|Cursor' } |
    Select-Object -First 1
}
if ($targetHwnd -eq 0 -and $proc) {
  $targetHwnd = [long]$proc.MainWindowHandle
}
if ($targetHwnd -ne 0) {
  [Win32MacroFocus]::SetForegroundWindow([IntPtr]::new($targetHwnd)) | Out-Null
}
if ($proc) {
  (New-Object -ComObject WScript.Shell).AppActivate([int]$proc.Id) | Out-Null
}
Start-Sleep -Milliseconds 60
[System.Windows.Forms.SendKeys]::SendWait('${sendSequence.replace(/'/g, "''")}')
`;
      try {
        await runPowerShellEncoded(psScript, 2500);
      } catch {
        // Recorded in lastSentKeys for mirror visibility
      }
    }
    return { ok: true, sent: raw };
  }

  public async clickInWindow(
    hwnd: string | undefined,
    normX: number,
    normY: number
  ): Promise<{ ok: boolean; x: number; y: number }> {
    const clampedX = Math.max(0, Math.min(1, normX));
    const clampedY = Math.max(0, Math.min(1, normY));
    this.lastClickPos = {
      x: clampedX,
      y: clampedY,
      time: new Date().toLocaleTimeString(),
    };
    this.lastSentKeys = `Click at (${Math.round(clampedX * 100)}%, ${Math.round(clampedY * 100)}%)`;

    if (process.platform === 'win32' && hwnd && /^\d+$/.test(hwnd) && hwnd !== '0') {
      const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
public class Win32Mouse {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
}
"@
$h = [IntPtr]::new([long]${Number(hwnd)})
$rect = New-Object RECT
if ([Win32Mouse]::GetWindowRect($h, [ref]$rect)) {
  $w = [Math]::Max(320, $rect.Right - $rect.Left)
  $ht = [Math]::Max(240, $rect.Bottom - $rect.Top)
  $tx = [int]($rect.Left + ($w * ${clampedX}))
  $ty = [int]($rect.Top + ($ht * ${clampedY}))
  [Win32Mouse]::SetCursorPos($tx, $ty) | Out-Null
  [Win32Mouse]::mouse_event(0x0002, 0, 0, 0, 0)
  Start-Sleep -Milliseconds 30
  [Win32Mouse]::mouse_event(0x0004, 0, 0, 0, 0)
}
`;
      try {
        await runPowerShellEncoded(psScript, 2500);
      } catch {
        // Recorded in lastClickPos for mirror feedback
      }
    }

    return { ok: true, x: clampedX, y: clampedY };
  }
}
