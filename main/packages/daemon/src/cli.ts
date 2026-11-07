#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  buildProjectEstimate,
  formatEstimateAsMarkdown,
  parsePolicyYaml,
  CairnPolicySchema,
} from '@cairn/core';
import { CairnDaemonServer } from './gateway/server.js';
import { CairnDatabase } from './db/database.js';
import { scanRepository } from './estimator/scanner.js';
import { GitShadowEngine } from './safety/git-shadow.js';
import { OsWindowBridge } from './os-bridge/win32.js';
import { AntigravityLiveSync } from './telemetry/antigravity-sync.js';
import { ProjectLedgerService } from './telemetry/project-ledger.js';
import { ProjectIntelService } from './intel/project-intel.js';

function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] ?? 'help';

  if (cmd === 'start' || cmd === 'daemon') {
    const port = Number(getFlagValue(args, '--port') ?? process.env.CAIRN_PORT ?? 4100);
    if (process.platform === 'win32' && !args.includes('--no-kill-existing')) {
      try {
        const { execFileSync } = await import('node:child_process');
        execFileSync(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -ne ${process.pid} } | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`,
          ],
          { stdio: 'ignore', timeout: 3000 }
        );
      } catch {
        // Ignore if no previous process was listening
      }
    }
    const server = new CairnDaemonServer({ port });
    const info = await server.start();

    console.log(`\n============================================================`);
    console.log(`  🪨 CAIRN DAEMON & GATEWAY ACTIVE (v0.2)`);
    console.log(`============================================================`);
    console.log(`  OpenAI Base URL    : http://localhost:${info.port}/v1`);
    console.log(`  Anthropic Base URL : http://localhost:${info.port}`);
    console.log(`  Task-Scoped URL    : http://localhost:${info.port}/t/<task-id>/v1`);
    console.log(`  IDE Extension WS   : ws://localhost:${info.port}/ws`);
    console.log(`------------------------------------------------------------`);
    console.log(`  📱 MOBILE REMOTE & IDE CONTROL COCKPIT`);
    console.log(`  Open on Phone      : ${info.remoteUrl}`);
    console.log(`============================================================\n`);
    return;
  }

  if (cmd === 'estimate') {
    const prdArg = args.find((a, idx) => idx > 0 && !a.startsWith('--'));
    const prdFile = prdArg ?? 'Cairn Product Requirements Document.md';
    const resolvedPrd = path.resolve(process.cwd(), prdFile);

    if (!fs.existsSync(resolvedPrd)) {
      console.error(`Error: PRD file not found at "${resolvedPrd}"`);
      process.exit(1);
    }

    const repoDir = path.resolve(getFlagValue(args, '--repo') ?? process.cwd());
    const policyPath = path.join(repoDir, 'cairn.yaml');
    const policy = fs.existsSync(policyPath)
      ? parsePolicyYaml(fs.readFileSync(policyPath, 'utf-8')).policy ?? CairnPolicySchema.parse({})
      : CairnPolicySchema.parse({});

    const modelOrAlias = getFlagValue(args, '--model') ?? policy.routing.default;
    const prdContent = fs.readFileSync(resolvedPrd, 'utf-8');
    const repoSummary = scanRepository(repoDir);
    const db = new CairnDatabase();
    const multipliers = db.getCalibration();

    const report = buildProjectEstimate({
      projectName: policy.project,
      prdContent,
      modelOrAlias,
      aliases: policy.aliases,
      repoSummary,
      multipliers,
    });

    db.saveEstimate(report);
    db.close();

    if (args.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    const md = formatEstimateAsMarkdown(report);
    const outFile = getFlagValue(args, '--out');
    if (outFile) {
      fs.writeFileSync(path.resolve(process.cwd(), outFile), md, 'utf-8');
      console.log(`Saved estimate report to ${outFile}`);
    }
    console.log(md);
    return;
  }

  if (cmd === 'status') {
    const db = new CairnDatabase();
    const spend = db.getSpendSummary();
    const cal = db.getCalibration();
    const cps = db.listCheckpoints(5);
    const est = db.getLatestEstimate();
    db.close();

    console.log(`=== Cairn Project Status ===`);
    console.log(`Project Spend : $${spend.projectUsd.toFixed(4)} (${spend.totalCalls} calls, ${spend.totalTokens.toLocaleString()} tokens)`);
    console.log(`Daily Spend   : $${spend.dailyUsd.toFixed(4)}`);
    if (est) {
      console.log(
        `Baseline Est. : $${est.totals.costUsd.low.toFixed(2)} - $${est.totals.costUsd.high.toFixed(2)} (Expected: $${est.totals.costUsd.expected.toFixed(2)} on ${est.modelDisplayName})`
      );
    }
    console.log(
      `Calibration   : ${cal.sampleSize} tasks calibrated | Expected Retry: ${cal.retryFactorExpected}x | Cache Hit Ratio: ${Math.round(
        cal.cacheHitRatio * 100
      )}%`
    );
    console.log(`Checkpoints   : ${cps.length} recent Git shadow snapshots available for instant undo`);
    return;
  }

  if (cmd === 'checkpoints') {
    const db = new CairnDatabase();
    const cps = db.listCheckpoints(20);
    db.close();
    if (cps.length === 0) {
      console.log('No Git shadow checkpoints recorded yet.');
      return;
    }
    console.log(`=== Git Shadow Checkpoints ===`);
    for (const c of cps) {
      console.log(
        `- [${c.reverted ? 'REVERTED' : 'ACTIVE'}] ${c.id} | step=${c.stepId} | tree=${c.gitTreeHash.slice(
          0,
          10
        )} | ${c.description}`
      );
    }
    return;
  }

  if (cmd === 'undo') {
    const targetId = args[1];
    const db = new CairnDatabase();
    const shadow = new GitShadowEngine(process.cwd(), db);
    const res = shadow.restoreShadowSnapshot(targetId);
    db.close();
    if (!res.restored) {
      console.error(`Undo failed: ${res.error}`);
      process.exit(1);
    }
    console.log(
      `✓ Restored working tree to Git shadow checkpoint ${res.checkpoint?.id} (${res.checkpoint?.description})`
    );
    return;
  }

  if (cmd === 'windows') {
    const bridge = new OsWindowBridge();
    const windows = await bridge.listIdeWindows();
    console.log(`=== Detected IDE & Developer Windows (${windows.length}) ===`);
    for (const w of windows) {
      console.log(`- [${w.ideType.toUpperCase()}] HWND=${w.hwnd} PID=${w.pid} "${w.title}" (${w.processName})`);
    }
    return;
  }

  if (cmd === 'doctor') {
    const repoDir = process.cwd();
    const policyPath = path.join(repoDir, 'cairn.yaml');
    console.log(`=== Cairn System & Gateway Diagnostics ===`);

    if (fs.existsSync(policyPath)) {
      const parsed = parsePolicyYaml(fs.readFileSync(policyPath, 'utf-8'));
      if (parsed.policy) {
        console.log(`✓ Policy (cairn.yaml) : Valid (project="${parsed.policy.project}", default="${parsed.policy.routing.default}")`);
      } else {
        console.log(`✕ Policy (cairn.yaml) : Invalid — ${parsed.errors?.join('; ')}`);
      }
    } else {
      console.log(`! Policy (cairn.yaml) : Not found in ${repoDir} (using default policy)`);
    }

    const db = new CairnDatabase();
    const spend = db.getSpendSummary();
    const cps = db.listCheckpoints(10);
    const shadow = new GitShadowEngine(repoDir, db);
    const gitOk = shadow.isGitRepo();
    const branch = shadow.getCurrentBranch();
    db.close();

    console.log(
      `${gitOk ? '✓' : '✕'} Git Shadow Engine   : ${
        gitOk ? `Active on branch "${branch ?? 'HEAD'}" (${cps.length} checkpoints)` : 'Not a Git repository'
      }`
    );
    console.log(
      `✓ SQLite Metering DB  : Healthy (${spend.totalCalls} recorded calls, $${spend.projectUsd.toFixed(4)} tracked)`
    );

    const providers = [
      { name: 'Anthropic', env: 'ANTHROPIC_API_KEY', set: Boolean(process.env.ANTHROPIC_API_KEY) },
      { name: 'OpenAI', env: 'OPENAI_API_KEY', set: Boolean(process.env.OPENAI_API_KEY) },
      { name: 'Google Gemini', env: 'GEMINI_API_KEY / GOOGLE_API_KEY', set: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) },
      { name: 'OpenRouter', env: 'OPENROUTER_API_KEY', set: Boolean(process.env.OPENROUTER_API_KEY) },
      { name: 'NVIDIA NIM', env: 'NVIDIA_API_KEY', set: Boolean(process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY) },
    ];
    console.log(`\nUpstream Provider Credentials (or pass-through via client Authorization header):`);
    for (const p of providers) {
      console.log(`  - ${p.name.padEnd(15)} : ${p.set ? '✓ Configured (' + p.env + ')' : '○ Pass-through / Local synthesis'}`);
    }
    return;
  }

  if (cmd === 'ask' || cmd === 'intel') {
    const repoDir = path.resolve(getFlagValue(args, '--repo') ?? process.cwd());
    const model = getFlagValue(args, '--model') ?? 'Llama-3.3-70B';
    const taskId = getFlagValue(args, '--task');
    const queryParts = args.slice(1).filter((a, i, arr) => {
      if (a.startsWith('--')) return false;
      const prev = i > 0 ? arr[i - 1] : '';
      if (prev === '--repo' || prev === '--model' || prev === '--task') return false;
      return true;
    });
    const query =
      queryParts.join(' ').trim() ||
      'Why did this project session cost what it did, where were tokens spent, and what was the last work done?';

    const policyPath = path.join(repoDir, 'cairn.yaml');
    const policy = fs.existsSync(policyPath)
      ? parsePolicyYaml(fs.readFileSync(policyPath, 'utf-8')).policy ?? CairnPolicySchema.parse({})
      : CairnPolicySchema.parse({});

    const db = new CairnDatabase();
    const agSync = new AntigravityLiveSync(db, () => policy, repoDir);
    agSync.syncNow();
    const ledger = new ProjectLedgerService(repoDir, db);
    const intel = new ProjectIntelService({
      db,
      getPolicy: () => policy,
      antigravitySync: agSync,
      projectLedger: ledger,
      repoDir,
    });

    console.log(`\n=== 🪨 CAIRN PROJECT INTELLIGENCE AI (${model}) ===`);
    console.log(`Query: "${query}"\n`);
    const res = await intel.ask({ query, model, taskId });
    db.close();

    if (res.toolsUsed.length > 0) {
      console.log(`Tools Inspected:`);
      for (const t of res.toolsUsed) {
        console.log(`  ⚡ ${t.name} — ${t.summary}`);
      }
      console.log('');
    }
    console.log(res.answer);
    console.log(`\n------------------------------------------------------------`);
    console.log(
      `Model: ${res.model} (${res.provider}) · Latency: ${res.latencyMs}ms · Tokens: ${res.usage.totalTokens}`
    );
    return;
  }

  console.log(`Cairn CLI (v0.2) — Know the cost before you build. Stay in control while agents work.`);
  console.log(`\nCommands:`);
  console.log(`  cairn start [--port 4100]                  Start local Daemon, Gateway & Mobile Remote PWA`);
  console.log(`  cairn ask "<question>" [--model Llama-3.3-70B] Ask Project Intelligence AI about costs, tokens & work`);
  console.log(`  cairn estimate <PRD.md> [--model smart]    Generate repo-aware & cache-aware PRD cost forecast`);
  console.log(`  cairn status                               Show live spend, baseline vs actual, and calibration`);
  console.log(`  cairn checkpoints                          List off-branch Git shadow snapshots`);
  console.log(`  cairn undo [checkpoint-id]                 Instantly revert working tree to a shadow snapshot`);
  console.log(`  cairn windows                              List detected IDE windows (Antigravity, VS Code, VS)`);
  console.log(`  cairn doctor                               Verify policy, Git shadow refs, SQLite DB & provider keys`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
