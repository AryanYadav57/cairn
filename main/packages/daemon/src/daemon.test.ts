import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { CairnDaemonServer } from './gateway/server.js';
import { isSameProject, normalizeClaudeModelId, parseClaudeSession, readFileTail } from './telemetry/antigravity-sync.js';
import {
  normalizeMessagesToAnthropic,
  normalizeMessagesToOpenAi,
  normalizeToolsToAnthropic,
  normalizeToolsToOpenAi,
} from './gateway/providers.js';

describe('@cairn/daemon — Gateway, Git Shadow Undo, Budgets & Mobile Remote', () => {
  let tmpRepoDir: string;
  let server: CairnDaemonServer;
  let baseUrl: string;

  before(async () => {
    tmpRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cairn-test-repo-'));
    // Initialize a temporary git repository to test Git Shadow Checkpoints & Undo
    execFileSync('git', ['init'], { cwd: tmpRepoDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tmpRepoDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpRepoDir, stdio: 'ignore' });

    fs.writeFileSync(path.join(tmpRepoDir, 'app.ts'), 'export const version = 1;\n', 'utf-8');
    execFileSync('git', ['add', '-A'], { cwd: tmpRepoDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'Initial commit'], { cwd: tmpRepoDir, stdio: 'ignore' });

    fs.writeFileSync(
      path.join(tmpRepoDir, 'cairn.yaml'),
      `
project: cairn-test
budgets:
  project: { usd: 10 }
  daily: { usd: 5 }
  task: { usd: 0.50, exhaustion_mode: wind_down }
routing:
  default: smart
  on_budget_80: fast_at_task_boundary
  on_budget_100: wind_down_then_block
aliases:
  smart: anthropic/claude-3-7-sonnet
  fast: openai/gpt-4o-mini
actions:
  allow: [read_file]
  ask: [write_file]
  deny: [rm_rf_root]
`,
      'utf-8'
    );

    server = new CairnDaemonServer({
      port: 0, // Ephemeral port
      host: '127.0.0.1',
      repoDir: tmpRepoDir,
      policyPath: path.join(tmpRepoDir, 'cairn.yaml'),
      dbPath: ':memory:',
      approvalTimeoutMs: 10_000,
    });

    const info = await server.start();
    baseUrl = `http://127.0.0.1:${info.port}`;
  });

  after(async () => {
    await server.stop();
    try {
      fs.rmSync(tmpRepoDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup lock on Windows
    }
  });

  it('routes OpenAI (/v1/chat/completions) and Anthropic (/v1/messages) with task attribution', async () => {
    const openAiRes = await fetch(`${baseUrl}/t/auth-task/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Build the login controller' }],
      }),
    });
    assert.equal(openAiRes.status, 200);
    const openAiData = (await openAiRes.json()) as Record<string, unknown>;
    assert.equal(openAiData.object, 'chat.completion');

    const anthRes = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cairn-Task': 'auth-task',
      },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Add JWT token validation' }],
      }),
    });
    assert.equal(anthRes.status, 200);
    const anthData = (await anthRes.json()) as Record<string, unknown>;
    assert.equal(anthData.type, 'message');

    // Verify status endpoint reflects recorded calls and task spend
    const statusRes = await fetch(`${baseUrl}/api/status?taskId=auth-task`);
    const statusData = (await statusRes.json()) as {
      spend: { totalCalls: number; totalTokens: number };
    };
    assert.equal(statusData.spend.totalCalls, 2);
    assert.ok(statusData.spend.totalTokens > 0);
  });

  it('intercepts ask-level tool calls, approves via Mobile API, creates Git Shadow Snapshot, and undoes file changes', async () => {
    // Start a request that proposes a `write_file` tool call (which is in `ask` list)
    const callPromise = fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Update app.ts' }],
        mock_tool_call: {
          name: 'write_file',
          arguments: { path: 'app.ts', content: 'export const version = 2;' },
        },
      }),
    });

    // Wait briefly for the gateway stream interceptor to hold the action
    await new Promise((r) => setTimeout(r, 120));

    const statusRes = await fetch(`${baseUrl}/api/status`);
    const statusData = (await statusRes.json()) as {
      pendingApprovals: Array<{ id: string; toolName: string }>;
    };
    assert.equal(statusData.pendingApprovals.length, 1);
    const pendingId = statusData.pendingApprovals[0].id;

    // Approve the held action via Mobile Remote API
    const approveRes = await fetch(`${baseUrl}/api/approvals/${pendingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', source: 'mobile' }),
    });
    assert.equal(approveRes.status, 200);

    const completedCall = await callPromise;
    assert.equal(completedCall.status, 200);

    // Simulate the agent mutating app.ts and creating a broken file after the snapshot was taken
    fs.writeFileSync(path.join(tmpRepoDir, 'app.ts'), 'BROKEN AGENT EDIT\n', 'utf-8');
    assert.equal(fs.readFileSync(path.join(tmpRepoDir, 'app.ts'), 'utf-8'), 'BROKEN AGENT EDIT\n');

    // Trigger instant Git Shadow Undo via `/api/undo`
    const undoRes = await fetch(`${baseUrl}/api/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(undoRes.status, 200);
    const undoData = (await undoRes.json()) as { restored: boolean };
    assert.equal(undoData.restored, true);

    // Verify app.ts is restored to its pre-action state (`export const version = 1;`)
    const restoredContent = fs.readFileSync(path.join(tmpRepoDir, 'app.ts'), 'utf-8').trim();
    assert.equal(restoredContent, 'export const version = 1;');
  });

  it('serves the Mobile Remote Cockpit PWA with valid client JS, queues steering instructions, creates manual snapshots, and captures IDE window frames', async () => {
    const pwaRes = await fetch(`${baseUrl}/remote`);
    assert.equal(pwaRes.status, 200);
    const html = await pwaRes.text();
    assert.ok(html.includes('A Cairn Studios Project'));
    assert.ok(html.includes('LIVE VIEWPORT'));

    // Ensure the embedded <script> tag compiles cleanly with zero syntax errors
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(scriptMatch, 'Expected <script> block in /remote HTML');
    assert.doesNotThrow(() => {
      new vm.Script(scriptMatch[1]);
    }, 'Client-side <script> in /remote must have zero JS syntax errors');

    // Stub the OS window bridge so tests never paste into a real IDE window
    let deliverOk = true;
    const sentPrompts: string[] = [];
    server.osBridge.sendTextPromptToWindow = async (_hwnd, text) => {
      sentPrompts.push(String(text));
      return deliverOk
        ? { ok: true, sent: String(text), detail: 'stub delivered' }
        : { ok: false, sent: String(text), detail: 'stub: no window' };
    };

    type SteerResponse = {
      ok: boolean;
      queuedCount: number;
      instruction: string;
      delivery: string;
      exchangeItems: Array<{ role: string; costUsd: number; text: string }>;
    };
    const steer = async (payload: Record<string, unknown>) => {
      const r = await fetch(`${baseUrl}/api/remote/steer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      assert.equal(r.status, 200);
      return (await r.json()) as SteerResponse;
    };

    // 1) Successful direct IDE delivery must NOT leave the prompt stuck in the queue
    //    or fabricate an assistant reply before the IDE actually responds.
    const delivered = await steer({ instruction: 'How can we improve the core idea?' });
    assert.equal(delivered.ok, true);
    assert.equal(delivered.delivery, 'delivered');
    assert.equal(delivered.queuedCount, 0, 'Delivered prompts must not stay queued');
    assert.deepEqual(sentPrompts, ['How can we improve the core idea?']);
    assert.ok(
      !delivered.exchangeItems.some((i) => i.role === 'assistant'),
      'A delivered IDE prompt must wait for the real IDE transcript response'
    );
    assert.ok(
      delivered.exchangeItems.some((i) => i.role === 'user' && i.text === 'How can we improve the core idea?'),
      'Must record the user prompt turn'
    );
    assert.ok(!JSON.stringify(delivered).includes('queued for agent execution'));

    // 2) Failed IDE delivery falls back to the gateway queue
    deliverOk = false;
    const failed = await steer({ instruction: 'Fallback prompt' });
    assert.equal(failed.delivery, 'failed');
    assert.equal(failed.queuedCount, 1);
    deliverOk = true;

    // 3) Queue-only steering (no IDE forwarding)
    const steerData = await steer({ instruction: 'Focus on the database schema first', forwardToIde: false });
    assert.equal(steerData.ok, true);
    assert.equal(steerData.delivery, 'queued');
    assert.equal(steerData.instruction, 'Focus on the database schema first');
    assert.equal(steerData.queuedCount, 2);

    // 4) Clearing the queue resets the badge state
    const clearRes = await fetch(`${baseUrl}/api/remote/steer/clear`, { method: 'POST' });
    const clearData = (await clearRes.json()) as { ok: boolean; cleared: number; queuedCount: number };
    assert.equal(clearData.cleared, 2);
    assert.equal(clearData.queuedCount, 0);

    // Create a manual Git Shadow Snapshot via /api/snapshot
    const snapRes = await fetch(`${baseUrl}/api/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Manual test checkpoint' }),
    });
    assert.equal(snapRes.status, 200);
    const snapData = (await snapRes.json()) as { ok: boolean; checkpoint: { gitTreeHash: string } };
    assert.equal(snapData.ok, true);
    assert.ok(snapData.checkpoint.gitTreeHash.length > 0);

    // A daemon test must not invent a foreground IDE window when none is open.
    server.osBridge.listIdeWindows = async () => [];
    const winRes = await fetch(`${baseUrl}/api/os/windows`);
    assert.equal(winRes.status, 200);
    const winData = (await winRes.json()) as { ok: boolean; windows: Array<{ hwnd: string }> };
    assert.equal(winData.ok, true);
    assert.equal(winData.windows.length, 0, 'No visible IDE window means no direct remote target');

    // Switch Active Agent Model between Frontier & Open-Source and verify live recalculation
    const switchRes = await fetch(`${baseUrl}/api/active-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openrouter/deepseek/deepseek-r1' }),
    });
    assert.equal(switchRes.status, 200);
    const switchData = (await switchRes.json()) as {
      ok: boolean;
      activeModelId: string;
      activeModelDisplayName: string;
      antigravityLive: { sessionModelComparison: Array<{ category: string }> };
      report: { whatIfScenarios: Array<{ category: string }> };
    };
    assert.equal(switchData.ok, true);
    assert.equal(switchData.activeModelId, 'openrouter/deepseek/deepseek-r1');
    assert.ok(switchData.antigravityLive.sessionModelComparison.some((m) => m.category === 'open-source'));
    assert.ok(switchData.report.whatIfScenarios.some((w) => w.category === 'frontier'));
    assert.ok(switchData.report.whatIfScenarios.some((w) => w.category === 'open-source'));

    // Switch to Hermes harness and verify default Nous Hermes 3 405B model detection
    const hermesRes = await fetch(`${baseUrl}/api/active-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ harness: 'hermes' }),
    });
    assert.equal(hermesRes.status, 200);
    const hermesData = (await hermesRes.json()) as {
      ok: boolean;
      activeHarness: string;
      activeHarnessLabel: string;
      activeModelId: string;
    };
    assert.equal(hermesData.ok, true);
    assert.equal(hermesData.activeHarness, 'hermes');
    assert.equal(hermesData.activeModelId, 'openrouter/nousresearch/hermes-3-llama-3.1-405b');
  });

  it('updates calibration multipliers after task completion (CAL-1..CAL-3)', async () => {
    const calRes = await fetch(`${baseUrl}/api/calibrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimatedTokens: 20_000,
        actualTokens: 24_000,
        actualCacheHitRatio: 0.88,
      }),
    });
    assert.equal(calRes.status, 200);
    const calData = (await calRes.json()) as {
      calibration: { sampleSize: number; retryFactorExpected: number };
    };
    assert.equal(calData.calibration.sampleSize, 1);
    assert.ok(calData.calibration.retryFactorExpected > 1.85);

    // Also verify auto-calibration task completion endpoint (/api/tasks/:taskId/complete)
    const completeRes = await fetch(`${baseUrl}/api/tasks/auth-task/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimatedTokens: 500 }),
    });
    assert.equal(completeRes.status, 200);
    const completeData = (await completeRes.json()) as {
      ok: boolean;
      variance: { taskId: string; actualTokens: number };
      calibration: { sampleSize: number };
    };
    assert.equal(completeData.ok, true);
    assert.equal(completeData.variance.taskId, 'auth-task');
    assert.ok(completeData.variance.actualTokens > 0);
    assert.equal(completeData.calibration.sampleSize, 2);
  });

  it('streams spec-compliant Anthropic and OpenAI SSE events and translates cross-protocol payloads', async () => {
    // 1. Test cross-protocol tool and message normalization helpers
    const anthTools = normalizeToolsToAnthropic([
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read a file',
          parameters: { type: 'object', properties: { path: { type: 'string' } } },
        },
      },
    ]);
    assert.equal(anthTools?.[0].name, 'read_file');
    assert.ok(anthTools?.[0].input_schema);

    const openAiTools = normalizeToolsToOpenAi(anthTools);
    assert.equal(openAiTools?.[0].type, 'function');

    const openAiMsgs = normalizeMessagesToOpenAi(
      { system: 'You are a careful architect.' },
      [
        {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'tu_1', name: 'read_file', input: { path: 'app.ts' } }],
        },
        {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: 'export const version = 1;' }],
        },
      ]
    );
    assert.equal(openAiMsgs[0].role, 'system');
    assert.equal(openAiMsgs[1].role, 'assistant');
    assert.equal(openAiMsgs[2].role, 'tool');

    const anthNormalized = normalizeMessagesToAnthropic({}, openAiMsgs);
    assert.equal(anthNormalized.system, 'You are a careful architect.');
    assert.equal(anthNormalized.messages.length, 2);

    // 2. Test full Anthropic SSE streaming sequence (message_start -> content_block_start -> content_block_delta -> content_block_stop -> message_delta -> message_stop)
    const anthStreamRes = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'smart',
        stream: true,
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Stream Anthropic test' }],
      }),
    });
    assert.equal(anthStreamRes.status, 200);
    const anthSseText = await anthStreamRes.text();
    assert.ok(anthSseText.includes('event: message_start'));
    assert.ok(anthSseText.includes('event: content_block_start'));
    assert.ok(anthSseText.includes('event: content_block_delta'));
    assert.ok(anthSseText.includes('"type":"text_delta"'));
    assert.ok(anthSseText.includes('event: content_block_stop'));
    assert.ok(anthSseText.includes('event: message_delta'));
    assert.ok(anthSseText.includes('event: message_stop'));

    // 3. Test OpenAI SSE streaming sequence
    const openAiStreamRes = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'smart',
        stream: true,
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Stream OpenAI test' }],
      }),
    });
    assert.equal(openAiStreamRes.status, 200);
    const openAiSseText = await openAiStreamRes.text();
    assert.ok(openAiSseText.includes('"role":"assistant"'));
    assert.ok(openAiSseText.includes('"finish_reason":"stop"'));
    assert.ok(openAiSseText.includes('data: [DONE]'));
  });

  it('previews checkpoint diffs, cleans untracked agent files on undo, and passes rejection notes to the agent', async () => {
    // 1. Create a snapshot of clean state
    const snapRes = await fetch(`${baseUrl}/api/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Pre-agent edit checkpoint' }),
    });
    const snapData = (await snapRes.json()) as { ok: boolean; checkpoint: { id: string } };
    assert.equal(snapData.ok, true);
    const cpId = snapData.checkpoint.id;

    // 2. Simulate agent modifying app.ts AND creating a brand-new untracked file
    fs.writeFileSync(path.join(tmpRepoDir, 'app.ts'), 'export const version = 999;\n', 'utf-8');
    const untrackedPath = path.join(tmpRepoDir, 'hallucinated-agent-file.ts');
    fs.writeFileSync(untrackedPath, 'export const bad = true;\n', 'utf-8');

    // 3. Preview the diff against the checkpoint before undoing
    const diffRes = await fetch(`${baseUrl}/api/checkpoints/${cpId}/diff`);
    assert.equal(diffRes.status, 200);
    const diffData = (await diffRes.json()) as {
      found: boolean;
      changedFiles: string[];
      diff: string;
    };
    assert.equal(diffData.found, true);
    assert.ok(diffData.changedFiles.includes('app.ts'));
    assert.ok(diffData.changedFiles.includes('hallucinated-agent-file.ts'));
    assert.ok(diffData.diff.includes('export const version = 999;'));

    // 4. Restore the snapshot and verify both tracked file restoration AND untracked file removal
    const undoRes = await fetch(`${baseUrl}/api/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cpId }),
    });
    assert.equal(undoRes.status, 200);
    const undoData = (await undoRes.json()) as { restored: boolean; cleanedFiles?: string[] };
    assert.equal(undoData.restored, true);
    assert.ok(undoData.cleanedFiles?.includes('hallucinated-agent-file.ts'));
    assert.equal(fs.existsSync(untrackedPath), false, 'Untracked file created after snapshot must be removed');
    assert.equal(fs.readFileSync(path.join(tmpRepoDir, 'app.ts'), 'utf-8').trim(), 'export const version = 1;');

    // 5. Reject a held action with a custom feedback note
    const heldPromise = fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Overwrite config' }],
        mock_tool_call: {
          name: 'write_file',
          arguments: { path: 'app.ts', content: 'overwrite' },
        },
      }),
    });

    await new Promise((r) => setTimeout(r, 100));
    const statusRes = await fetch(`${baseUrl}/api/status`);
    const statusData = (await statusRes.json()) as { pendingApprovals: Array<{ id: string }> };
    const pendingId = statusData.pendingApprovals[0].id;

    await fetch(`${baseUrl}/api/approvals/${pendingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'rejected',
        source: 'mobile',
        note: 'Do not overwrite app.ts directly; create a helper module instead.',
      }),
    });

    const heldRes = await heldPromise;
    const heldData = (await heldRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    assert.ok(
      heldData.choices[0].message.content.includes(
        'Do not overwrite app.ts directly; create a helper module instead.'
      )
    );
  });

  it('enforces LAN pairing token auth, live policy updates, and 1-turn wind_down_then_block state transition', async () => {
    // 1. Verify LAN pairing token guard when x-cairn-enforce-auth is active
    const unauthRes = await fetch(`${baseUrl}/api/status`, {
      headers: { 'x-cairn-enforce-auth': '1' },
    });
    assert.equal(unauthRes.status, 401);

    const authRes = await fetch(`${baseUrl}/api/status`, {
      headers: {
        'x-cairn-enforce-auth': '1',
        'x-cairn-token': server.pairingToken,
      },
    });
    assert.equal(authRes.status, 200);

    // 2. Update policy via PUT /api/policy to set a 1-request cap on task scope with wind_down
    const putPolicyRes = await fetch(`${baseUrl}/api/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budgets: {
          task: {
            usd: 10,
            requests: 1,
            exhaustion_mode: 'wind_down',
          },
        },
        routing: {
          on_budget_100: 'wind_down_then_block',
        },
      }),
    });
    assert.equal(putPolicyRes.status, 200);

    // Call #1 on task 'cap-test' (0 prior calls -> allowed normally, records call #1)
    const call1 = await fetch(`${baseUrl}/t/cap-test/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cairn-no-cache': '1' },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Turn 1' }],
      }),
    });
    assert.equal(call1.status, 200);

    // Call #2 on task 'cap-test' (1 prior call == limit 1 -> triggers 1-turn graceful wind-down!)
    const call2 = await fetch(`${baseUrl}/t/cap-test/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cairn-no-cache': '1' },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Turn 2' }],
      }),
    });
    assert.equal(call2.status, 200);
    const call2Data = (await call2.json()) as { choices: Array<{ message: { content: string } }> };
    assert.ok(call2Data.choices[0].message.content.includes('Graceful Wind-Down Complete'));

    // Call #3 on task 'cap-test' (wind-down turn already used -> hard blocked with 429!)
    const call3 = await fetch(`${baseUrl}/t/cap-test/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cairn-no-cache': '1' },
      body: JSON.stringify({
        model: 'smart',
        _cairn_local_mock: true,
        messages: [{ role: 'user', content: 'Turn 3' }],
      }),
    });
    assert.equal(call3.status, 429);
  });

  it('answers Project Intelligence AI forensic queries on task cost, token spend, recent work, and enforces read-only SQL guardrails', async () => {
    // 1. Ask why auth-task cost what it did and where tokens were spent
    const costQueryRes = await fetch(`${baseUrl}/api/intel/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Why did auth-task cost so much and where were tokens spent?',
        taskId: 'auth-task',
        model: 'Llama-3.3-70B',
        localFallbackOnly: true,
      }),
    });
    assert.equal(costQueryRes.status, 200);
    const costIntel = (await costQueryRes.json()) as {
      ok: boolean;
      answer: string;
      toolsUsed: Array<{ name: string }>;
      highlights: Array<{ label: string; value: string }>;
      breakdownRows: Array<{ label: string }>;
      suggestedFollowUps: string[];
    };
    assert.equal(costIntel.ok, true);
    assert.ok(costIntel.answer.length > 40);
    assert.ok(costIntel.toolsUsed.some((t) => t.name === 'get_task_cost_breakdown'));
    assert.ok(costIntel.toolsUsed.some((t) => t.name === 'explain_token_spend'));
    assert.equal(costIntel.highlights.length, 4);
    assert.ok(costIntel.suggestedFollowUps.length > 0);

    // 2. Ask what was the last work done
    const workQueryRes = await fetch(`${baseUrl}/api/intel/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What was the last work done and what checkpoints exist?',
        localFallbackOnly: true,
      }),
    });
    assert.equal(workQueryRes.status, 200);
    const workIntel = (await workQueryRes.json()) as {
      ok: boolean;
      toolsUsed: Array<{ name: string }>;
    };
    assert.equal(workIntel.ok, true);
    assert.ok(workIntel.toolsUsed.some((t) => t.name === 'get_recent_work_summary'));

    // 3. Verify read-only SQL tool allows SELECT and blocks mutating statements
    const selectExec = server.projectIntel.executeTool('execute_safe_readonly_sql', {
      sqlQuery: 'SELECT id, task_id, model, cost_usd FROM calls LIMIT 5',
    });
    assert.ok(Array.isArray(selectExec.result.rows));
    assert.ok((selectExec.result.rows as unknown[]).length > 0);

    const dropExec = server.projectIntel.executeTool('execute_safe_readonly_sql', {
      sqlQuery: 'DROP TABLE calls',
    });
    assert.ok(String(dropExec.result.error).includes('Only read-only SELECT queries'));

    // 4. Verify history endpoint returns recent queries and Cirrascale model catalog
    const histRes = await fetch(`${baseUrl}/api/intel/history`);
    assert.equal(histRes.status, 200);
    const histData = (await histRes.json()) as {
      ok: boolean;
      models: Array<{ id: string }>;
      history: Array<{ query: string }>;
    };
    assert.equal(histData.ok, true);
    assert.ok(histData.models.some((m) => m.id === 'Llama-3.3-70B'));
    assert.equal(histData.history.length, 2);
  });
});

describe('Claude Code harness auto-detection helpers', () => {
  it('maps Claude Code model ids to catalog ids', () => {
    assert.equal(normalizeClaudeModelId('claude-opus-5-5'), 'anthropic/claude-opus-5.5');
    assert.equal(normalizeClaudeModelId('claude-sonnet-4-5-20250929'), 'anthropic/claude-sonnet-4.5');
    assert.equal(normalizeClaudeModelId('anthropic/claude-sonnet-5.5'), 'anthropic/claude-sonnet-5.5');
    assert.equal(normalizeClaudeModelId('gpt-5-codex'), 'gpt-5-codex');
  });

  it('matches a session cwd to the project dir, its subfolders, and its parent repo root', () => {
    const project = path.join(os.tmpdir(), 'repo', 'main');
    assert.equal(isSameProject(project, project), true);
    assert.equal(isSameProject(path.join(project, 'packages', 'daemon'), project), true);
    assert.equal(isSameProject(path.join(os.tmpdir(), 'repo'), project), true);
    assert.equal(isSameProject(path.join(os.tmpdir(), 'other-repo'), project), false);
    assert.equal(isSameProject(os.tmpdir(), project), false);
  });

  it('parses a Claude Code session log into turns, usage and a feed', () => {
    const lines = [
      { type: 'user', timestamp: '2026-01-01T00:00:00Z', message: { role: 'user', content: 'Fix the login bug' } },
      { type: 'user', isMeta: true, timestamp: '2026-01-01T00:00:00Z', message: { role: 'user', content: 'meta noise' } },
      { type: 'user', timestamp: '2026-01-01T00:00:00Z', message: { role: 'user', content: '<command-name>/clear</command-name>' } },
      // Streamed: the same message id appears twice; the last usage wins and tools accumulate.
      { type: 'assistant', timestamp: '2026-01-01T00:00:01Z', message: { id: 'msg_1', model: 'claude-opus-5-5', content: [{ type: 'tool_use', name: 'Read' }], usage: { input_tokens: 10, cache_read_input_tokens: 100, cache_creation_input_tokens: 5, output_tokens: 1 } } },
      { type: 'assistant', timestamp: '2026-01-01T00:00:02Z', message: { id: 'msg_1', model: 'claude-opus-5-5', content: [{ type: 'tool_use', name: 'Edit' }], usage: { input_tokens: 10, cache_read_input_tokens: 100, cache_creation_input_tokens: 5, output_tokens: 20 } } },
      { type: 'assistant', timestamp: '2026-01-01T00:00:03Z', message: { id: 'msg_2', model: 'claude-opus-5-5', content: [{ type: 'text', text: 'Fixed it.' }], usage: { input_tokens: 2, cache_read_input_tokens: 50, output_tokens: 8 } } },
      { type: 'assistant', timestamp: '2026-01-01T00:00:04Z', message: { id: 'msg_3', model: '<synthetic>', content: [], usage: { input_tokens: 0, output_tokens: 0 } } },
      'not json',
    ];
    const parsed = parseClaudeSession(lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n'));

    assert.equal(parsed.steps, 2);
    assert.equal(parsed.modelId, 'anthropic/claude-opus-5.5');
    assert.deepEqual(parsed.turns[0].tools, ['Read', 'Edit']);
    assert.equal(parsed.turns[0].outputTokens, 20);
    assert.deepEqual(parsed.usage, { uncachedInput: 17, cachedRead: 150, output: 28, total: 195 });
    assert.ok(parsed.turns.every((t) => t.costUsd > 0));
    assert.equal(parsed.events[0].stepIndex, 2, 'events are newest first');
    assert.deepEqual(parsed.feed.map((f) => [f.role, f.text]), [['user', 'Fix the login bug'], ['assistant', 'Fixed it.']]);
    assert.equal(parsed.lastActivityAt, '2026-01-01T00:00:03Z');
  });

  it('reads only the tail of large session logs', () => {
    const file = path.join(os.tmpdir(), `cairn-tail-${process.pid}.jsonl`);
    fs.writeFileSync(file, 'x'.repeat(5000) + '\n{"cwd":"/a","message":{"model":"claude-opus-5-5"}}\n');
    try {
      const tail = readFileTail(file, 200);
      assert.ok(tail.length <= 200);
      assert.ok(tail.includes('"model":"claude-opus-5-5"'));
    } finally {
      fs.rmSync(file, { force: true });
    }
  });
});
