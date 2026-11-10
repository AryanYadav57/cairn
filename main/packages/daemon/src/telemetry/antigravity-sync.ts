import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  BUILTIN_MODELS,
  calculateCallCostUsd,
  classifyToolAction,
  detectHarnessFromContext,
  resolveModelAndProvider,
  type AgentHarnessType,
  type CairnPolicy,
} from '@cairn/core';
import type { CairnDatabase } from '../db/database.js';
import { parseAntigravityModelSwitch } from './project-ledger.js';

export interface SessionModelComparisonItem {
  modelId: string;
  displayName: string;
  category: 'frontier' | 'open-source' | 'local';
  harnesses: AgentHarnessType[];
  description: string;
  contextLength: number;
  promptCaching: boolean;
  provider: string;
  inputPerMillion: number;
  cacheReadPerMillion: number;
  outputPerMillion: number;
  sessionCostUsd: number;
  isCurrent: boolean;
}

export interface TechnicalLayerCostItem {
  id: 'ui-frontend' | 'backend-gateway' | 'telemetry-pricing' | 'safety-infra' | 'testing-build';
  label: string;
  description: string;
  stepsCount: number;
  totalTokens: number;
  uncachedInputTokens: number;
  cachedReadTokens: number;
  outputTokens: number;
  costUsd: number;
  sharePercent: number;
}

export interface ConversationFeedItem {
  id: string;
  stepIndex: number;
  role: 'user' | 'assistant' | 'tool';
  source: 'ide' | 'phone' | 'gateway';
  modelDisplayName: string;
  text: string;
  thinking?: string;
  tools: Array<{ name: string; detail: string }>;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: string;
}

export interface LiveModelUsageItem {
  modelId: string;
  displayName: string;
  category: 'frontier' | 'open-source' | 'local';
  contextLength: number;
  isActive: boolean;
  steps: number;
  tokens: { uncachedInput: number; cachedRead: number; output: number; total: number };
  costUsd: number;
  sessionEquivalentCostUsd: number;
  cacheHitPct: number;
  /** Prompt size (uncached + cached input) of this model's most recent turn */
  lastContextTokens: number;
  contextFillPct: number;
  lastUsedAt: string | null;
}

/** The exact models offered by the Antigravity IDE model picker. */
export const ANTIGRAVITY_NATIVE_MODEL_IDS = [
  'google/gemini-4-argon',
  'google/gemini-3.8-flash',
  'anthropic/claude-opus-5.5',
  'anthropic/claude-sonnet-5.5',
  'openai/gpt-oss-120b',
];

export interface AntigravityLiveState {
  connected: boolean;
  conversationId: string | null;
  transcriptPath: string | null;
  activeHarness: AgentHarnessType;
  activeHarnessLabel: string;
  detectionSource: 'auto-transcript' | 'auto-gateway' | 'auto-config' | 'manual';
  activeModelId: string;
  activeModelDisplayName: string;
  activeModelCategory: 'frontier' | 'open-source' | 'local';
  activeModelDescription: string;
  activeModelContextLength: number;
  activeModelPromptCaching: boolean;
  /** When the active model was last switched in the IDE (from the transcript), if known */
  activeModelSwitchedAt: string | null;
  /** Live per-model consumption for every Antigravity model in the current session */
  modelUsage: LiveModelUsageItem[];
  detectedSubagentRole: string | null;
  totalSteps: number;
  plannerTurns: number;
  sessionTokens: {
    uncachedInput: number;
    cachedRead: number;
    output: number;
    total: number;
  };
  lastActivityAt: string | null;
  lastToolName: string | null;
  lastToolSummary: string | null;
  lastThinkingSnippet: string | null;
  sessionModelComparison: SessionModelComparisonItem[];
  technicalBreakdown: TechnicalLayerCostItem[];
  conversationFeed: ConversationFeedItem[];
  recentEvents: Array<{
    stepIndex: number;
    type: string;
    harnessLabel: string;
    modelDisplayName: string;
    inputTokens: number;
    cachedTokens: number;
    outputTokens: number;
    costUsd: number;
    tools: string[];
    summary: string;
    timestamp: string;
  }>;
}

const HARNESS_DEFAULT_MODELS: Record<AgentHarnessType, string> = {
  codex: 'openai/gpt-5-codex',
  antigravity: 'google/gemini-4-argon',
  'claude-code': 'anthropic/claude-sonnet-5.5',
  opencode: 'openrouter/deepseek/deepseek-r1',
  hermes: 'openrouter/nousresearch/hermes-3-llama-3.1-405b',
  cursor: 'anthropic/claude-3-7-sonnet',
  custom: 'google/gemini-4-argon',
};

const HARNESS_LABELS: Record<AgentHarnessType, string> = {
  codex: 'ChatGPT Codex',
  antigravity: 'Antigravity IDE',
  'claude-code': 'Claude Code',
  opencode: 'OpenCode CLI/IDE',
  hermes: 'Hermes Agent',
  cursor: 'Cursor IDE',
  custom: 'Custom Agent',
};

/**
 * Automatically discovers and tails active Antigravity IDE transcripts as well as
 * detecting switches to Claude Code, OpenCode, or Hermes (via local config/logs or gateway traffic),
 * dynamically adapting the model catalog and recalculating live session & PRD costs.
 */
/** Reads at most the last `maxBytes` of a file (session logs can be many MB). */
export function readFileTail(file: string, maxBytes: number): string {
  let fd: number | undefined;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    const length = Math.min(size, maxBytes);
    const buf = Buffer.alloc(length);
    fs.readSync(fd, buf, 0, length, size - length);
    return buf.toString('utf-8');
  } catch {
    return '';
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/**
 * True when an agent's working directory belongs to this project: the project dir itself,
 * anything inside it, or its immediate parent (e.g. the repo root when Cairn runs from `main/`).
 */
export function isSameProject(agentCwd: string, projectDir: string): boolean {
  const norm = (p: string) => path.resolve(p).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  const cwd = norm(agentCwd);
  const project = norm(projectDir);
  return cwd === project || cwd.startsWith(project + '/') || cwd === norm(path.dirname(projectDir));
}

/** Maps Claude Code model ids (`claude-opus-5-5`, `claude-sonnet-4-5-20250929`) to catalog ids. */
export function normalizeClaudeModelId(model: string): string {
  const m = model.match(/^(?:anthropic\/)?claude-([a-z]+)-(\d+)-(\d+)(?:-\d{8})?$/);
  return m ? `anthropic/claude-${m[1]}-${m[2]}.${m[3]}` : model;
}

/**
 * Parses a Claude Code session log (~/.claude/projects/<dir>/<session>.jsonl) into live activity:
 * one turn per assistant message id (streamed lines repeat the id; the last usage wins),
 * plus the user prompts and assistant replies for the conversation feed.
 */
export function parseClaudeSession(raw: string, aliases: Record<string, string> = {}) {
  type Turn = {
    messageId: string;
    stepIndex: number;
    modelId: string;
    modelDisplayName: string;
    inputTokens: number;
    cachedTokens: number;
    cacheWriteTokens: number;
    outputTokens: number;
    costUsd: number;
    tools: string[];
    text: string;
    summary: string;
    timestamp: string;
  };
  const turns = new Map<string, Turn>();
  const feed: ConversationFeedItem[] = [];
  let lastModelId: string | undefined;
  let lastActivityAt: string | null = null;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let ev: {
      type?: string;
      isMeta?: boolean;
      timestamp?: string;
      message?: {
        id?: string;
        model?: string;
        content?: unknown;
        usage?: Record<string, number>;
      };
    };
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    const timestamp = typeof ev.timestamp === 'string' ? ev.timestamp : '';
    const msg = ev.message;
    if (!msg) continue;

    if (ev.type === 'user' && !ev.isMeta) {
      const parts = typeof msg.content === 'string'
        ? [msg.content]
        : Array.isArray(msg.content)
        ? msg.content
            .filter((c: { type?: string; text?: unknown }) => c?.type === 'text' && typeof c.text === 'string')
            .map((c: { text: string }) => c.text)
        : [];
      const text = parts.join('\n').trim();
      if (text && !text.startsWith('<')) {
        feed.push({
          id: `cc_user_${feed.length}`,
          stepIndex: turns.size,
          role: 'user',
          source: 'ide',
          modelDisplayName: 'You (Claude Code)',
          text: text.slice(0, 600),
          tools: [],
          inputTokens: 0,
          cachedTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          timestamp,
        });
      }
      continue;
    }

    if (ev.type !== 'assistant' || !msg.id || !msg.usage) continue;
    if (typeof msg.model === 'string' && msg.model.startsWith('<')) continue; // <synthetic>
    const modelId = normalizeClaudeModelId(msg.model ?? lastModelId ?? 'anthropic/claude-sonnet-5.5');
    lastModelId = modelId;
    let turn = turns.get(msg.id);
    if (!turn) {
      const cap = resolveModelAndProvider(modelId, aliases);
      turn = {
        messageId: msg.id,
        stepIndex: turns.size + 1,
        modelId: cap.id,
        modelDisplayName: cap.displayName,
        inputTokens: 0,
        cachedTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        tools: [],
        text: '',
        summary: '',
        timestamp,
      };
      turns.set(msg.id, turn);
    }
    const u = msg.usage;
    turn.inputTokens = Number(u.input_tokens ?? 0);
    turn.cachedTokens = Number(u.cache_read_input_tokens ?? 0);
    turn.cacheWriteTokens = Number(u.cache_creation_input_tokens ?? 0);
    turn.outputTokens = Number(u.output_tokens ?? 0);
    if (Array.isArray(msg.content)) {
      for (const c of msg.content as Array<{ type?: string; name?: unknown; text?: unknown }>) {
        if (c?.type === 'tool_use' && typeof c.name === 'string' && !turn.tools.includes(c.name)) {
          turn.tools.push(c.name);
        } else if (c?.type === 'text' && typeof c.text === 'string' && c.text.trim()) {
          turn.text = turn.text ? `${turn.text}\n${c.text.trim()}` : c.text.trim();
        }
      }
    }
    if (timestamp) lastActivityAt = timestamp;
  }

  const usage = { uncachedInput: 0, cachedRead: 0, output: 0, total: 0 };
  for (const turn of turns.values()) {
    const cap = resolveModelAndProvider(turn.modelId, aliases);
    turn.costUsd = calculateCallCostUsd(
      {
        inputTokens: turn.inputTokens,
        cacheReadTokens: turn.cachedTokens,
        cacheWriteTokens: turn.cacheWriteTokens,
        outputTokens: turn.outputTokens,
        reasoningTokens: 0,
      },
      cap
    );
    turn.summary = turn.text
      ? turn.text.replace(/\s+/g, ' ').slice(0, 160)
      : turn.tools.length
      ? `Claude Code ran ${turn.tools.join(', ')}`
      : 'Claude Code completed an agent turn';
    usage.uncachedInput += turn.inputTokens + turn.cacheWriteTokens;
    usage.cachedRead += turn.cachedTokens;
    usage.output += turn.outputTokens;
    if (turn.text) {
      feed.push({
        id: `cc_asst_${turn.messageId}`,
        stepIndex: turn.stepIndex,
        role: 'assistant',
        source: 'ide',
        modelDisplayName: turn.modelDisplayName,
        text: turn.text.slice(0, 1200),
        tools: turn.tools.map((name) => ({ name, detail: '' })),
        inputTokens: turn.inputTokens,
        cachedTokens: turn.cachedTokens,
        outputTokens: turn.outputTokens,
        costUsd: turn.costUsd,
        timestamp: turn.timestamp,
      });
    }
  }
  usage.total = usage.uncachedInput + usage.cachedRead + usage.output;

  const turnList = [...turns.values()];
  const events: AntigravityLiveState['recentEvents'] = turnList.slice(-15).reverse().map((t) => ({
    stepIndex: t.stepIndex,
    type: 'agent_turn',
    harnessLabel: 'Claude Code',
    modelDisplayName: t.modelDisplayName,
    inputTokens: t.inputTokens + t.cacheWriteTokens,
    cachedTokens: t.cachedTokens,
    outputTokens: t.outputTokens,
    costUsd: t.costUsd,
    tools: t.tools,
    summary: t.summary,
    timestamp: t.timestamp,
  }));
  feed.sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0));

  return {
    turns: turnList,
    events,
    feed: feed.slice(-16),
    usage,
    steps: turnList.length,
    lastActivityAt,
    modelId: lastModelId,
  };
}

export class AntigravityLiveSync {
  private readonly syncedStepIds = new Set<string>();
  private activeModelOverride: string | null = null;
  private activeHarnessOverride: AgentHarnessType | null = null;
  private detectionSource: 'auto-transcript' | 'auto-gateway' | 'auto-config' | 'manual' =
    'auto-transcript';
  private readonly remoteConversationReplies: ConversationFeedItem[] = [];
  /** When a manual / gateway model override was set — a newer IDE model switch supersedes it */
  private overrideSetAt = 0;

  private lastState: AntigravityLiveState = {
    connected: false,
    conversationId: null,
    transcriptPath: null,
    activeHarness: 'antigravity',
    activeHarnessLabel: 'Antigravity IDE',
    detectionSource: 'auto-transcript',
    activeModelId: 'google/gemini-4-argon',
    activeModelDisplayName: 'Gemini 4 Argon · Medium (New)',
    activeModelCategory: 'frontier',
    activeModelDescription:
      'Antigravity IDE flagship reasoning & autonomous coding agent (Medium tier · New)',
    activeModelContextLength: 2_000_000,
    activeModelPromptCaching: true,
    activeModelSwitchedAt: null,
    modelUsage: [],
    detectedSubagentRole: null,
    totalSteps: 0,
    plannerTurns: 0,
    sessionTokens: {
      uncachedInput: 0,
      cachedRead: 0,
      output: 0,
      total: 0,
    },
    lastActivityAt: null,
    lastToolName: null,
    lastToolSummary: null,
    lastThinkingSnippet: null,
    sessionModelComparison: [],
    technicalBreakdown: [],
    conversationFeed: [],
    recentEvents: [],
  };
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly db: CairnDatabase,
    private readonly getPolicy: () => CairnPolicy,
    private readonly projectDir: string = process.cwd(),
    private readonly onNewStep?: (state: AntigravityLiveState) => void
  ) {}

  /** Read Codex's local rollout logs as the live Activity source when Codex is active. */
  private readCodexActivity(modelFallback: string): {
    events: AntigravityLiveState['recentEvents'];
    usage: AntigravityLiveState['sessionTokens'];
    steps: number;
    lastActivityAt: string | null;
  } {
    const root = path.join(os.homedir(), '.codex', 'sessions');
    const candidates: Array<{ file: string; mtime: number }> = [];
    const walk = (dir: string, depth: number) => {
      if (depth > 4) return;
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file, depth + 1);
        else if (entry.name.startsWith('rollout-') && entry.name.endsWith('.jsonl')) {
          try { candidates.push({ file, mtime: fs.statSync(file).mtimeMs }); } catch { /* file rotated */ }
        }
      }
    };
    walk(root, 0);
    const project = path.resolve(this.projectDir).toLowerCase();
    const matching = candidates.sort((a, b) => b.mtime - a.mtime).find(({ file }) => {
      try {
        const firstLines = fs.readFileSync(file, 'utf8').split(/\r?\n/, 2);
        const meta = JSON.parse(firstLines[0] || '{}') as { type?: string; payload?: { cwd?: string } };
        return meta.type === 'session_meta' && typeof meta.payload?.cwd === 'string' && path.resolve(meta.payload.cwd).toLowerCase() === project;
      } catch { return false; }
    });
    const usage = { uncachedInput: 0, cachedRead: 0, output: 0, total: 0 };
    if (!matching) return { events: [], usage, steps: 0, lastActivityAt: null };

    let lines: string[];
    try { lines = fs.readFileSync(matching.file, 'utf8').split(/\r?\n/).filter(Boolean); }
    catch { return { events: [], usage, steps: 0, lastActivityAt: null }; }
    let modelId = modelFallback;
    let previous = { input: 0, cached: 0, output: 0 };
    let current: AntigravityLiveState['recentEvents'][number] | null = null;
    const events: AntigravityLiveState['recentEvents'] = [];
    let turn = 0;
    let lastActivityAt: string | null = null;
    const finalize = () => {
      if (!current) return;
      current.summary = current.tools.length ? `Codex ran ${current.tools.join(', ')}` : 'Codex completed an agent turn';
      events.push(current);
      current = null;
    };
    for (const line of lines) {
      let row: { type?: string; timestamp?: string; payload?: Record<string, any> };
      try { row = JSON.parse(line) as typeof row; } catch { continue; }
      const payload = row.payload ?? {};
      const timestamp = row.timestamp || new Date(matching.mtime).toISOString();
      if (row.type === 'turn_context') {
        finalize();
        turn += 1;
        if (typeof payload.model === 'string') modelId = payload.model;
        const model = resolveModelAndProvider(modelId);
        current = { stepIndex: turn, type: 'agent_turn', harnessLabel: 'ChatGPT Codex', modelDisplayName: `${model.displayName} · Codex`, inputTokens: 0, cachedTokens: 0, outputTokens: 0, costUsd: 0, tools: [], summary: '', timestamp };
        lastActivityAt = timestamp;
      } else if (row.type === 'response_item' && payload.type === 'custom_tool_call') {
        if (!current) {
          turn += 1;
          const model = resolveModelAndProvider(modelId);
          current = { stepIndex: turn, type: 'agent_turn', harnessLabel: 'ChatGPT Codex', modelDisplayName: `${model.displayName} · Codex`, inputTokens: 0, cachedTokens: 0, outputTokens: 0, costUsd: 0, tools: [], summary: '', timestamp };
        }
        const name = typeof payload.name === 'string' ? payload.name : 'tool';
        if (!current.tools.includes(name)) current.tools.push(name);
        lastActivityAt = timestamp;
      } else if (row.type === 'event_msg' && payload.type === 'token_count') {
        const totals = payload.info?.total_token_usage;
        if (!totals) continue;
        const input = Number(totals.input_tokens || 0);
        const cached = Number(totals.cached_input_tokens || 0);
        const output = Number(totals.output_tokens || 0) + Number(totals.reasoning_output_tokens || 0);
        const inputDelta = Math.max(0, input - previous.input);
        const cachedDelta = Math.max(0, cached - previous.cached);
        const outputDelta = Math.max(0, output - previous.output);
        previous = { input, cached, output };
        usage.uncachedInput += Math.max(0, inputDelta - cachedDelta);
        usage.cachedRead += cachedDelta;
        usage.output += outputDelta;
        usage.total = usage.uncachedInput + usage.cachedRead + usage.output;
        if (!current) {
          turn += 1;
          const model = resolveModelAndProvider(modelId);
          current = { stepIndex: turn, type: 'agent_turn', harnessLabel: 'ChatGPT Codex', modelDisplayName: `${model.displayName} · Codex`, inputTokens: 0, cachedTokens: 0, outputTokens: 0, costUsd: 0, tools: [], summary: '', timestamp };
        }
        current.inputTokens += Math.max(0, inputDelta - cachedDelta);
        current.cachedTokens += cachedDelta;
        current.outputTokens += outputDelta;
        const model = resolveModelAndProvider(modelId);
        current.costUsd += calculateCallCostUsd({ inputTokens: Math.max(0, inputDelta - cachedDelta), cacheReadTokens: cachedDelta, cacheWriteTokens: 0, outputTokens: outputDelta, reasoningTokens: 0 }, model);
        lastActivityAt = timestamp;
      }
    }
    finalize();
    return { events: events.slice(-15).reverse(), usage, steps: turn, lastActivityAt };
  }

  public startPolling(intervalMs = 2000): void {
    this.syncNow();
    this.timer = setInterval(() => {
      this.syncNow();
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  public getLiveState(): AntigravityLiveState {
    return this.lastState;
  }

  public getActiveModelId(): string {
    const policy = this.getPolicy();
    const resolved = resolveModelAndProvider(
      this.activeModelOverride ?? policy.routing.default,
      policy.aliases
    );
    return resolved.id;
  }

  /**
   * Records a prompt sent from the Remote Cockpit. The actual agent reply is added
   * later from the IDE transcript; delivery alone must not create a fake reply turn.
   */
  public recordRemotePromptExchange(params: {
    prompt: string;
    delivery: 'delivered' | 'queued' | 'failed';
    deliveryDetail: string;
    agentResponse?: string;
    modelDisplayName?: string;
    locationInfo?: string;
    localResult?: string;
    tools?: Array<{ name: string; detail: string }>;
    inputTokens?: number;
    cachedTokens?: number;
    outputTokens?: number;
    costUsd?: number;
  }): ConversationFeedItem[] {
    const nowIso = new Date().toISOString();
    const nextStep = (this.lastState.totalSteps || 0) + 1;
    const userItem: ConversationFeedItem = {
      id: `remote_user_${Date.now()}`,
      stepIndex: nextStep,
      role: 'user',
      source: 'phone',
      modelDisplayName: 'You (Remote Cockpit)',
      text: params.prompt,
      tools: [{ name: `delivery:${params.delivery}`, detail: params.deliveryDetail }],
      inputTokens: 0,
      cachedTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      timestamp: nowIso,
    };
    const items: ConversationFeedItem[] = [userItem];

    if (params.localResult) {
      items.push({
        id: `remote_cairn_${Date.now() + 1}`,
        stepIndex: nextStep,
        role: 'tool',
        source: 'gateway',
        modelDisplayName: 'Cairn (local action)',
        text: params.localResult,
        tools: params.tools ?? [],
        inputTokens: 0,
        cachedTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        timestamp: new Date(Date.now() + 1).toISOString(),
      });
    }

    if (params.agentResponse) {
      const respTools = [
        ...(params.locationInfo ? [{ name: 'location', detail: params.locationInfo }] : []),
        ...(params.tools ?? []),
      ];
      items.push({
        id: `remote_agent_${Date.now() + 2}`,
        stepIndex: nextStep,
        role: 'assistant',
        source: 'phone',
        modelDisplayName: params.modelDisplayName || this.lastState.activeModelDisplayName,
        text: params.agentResponse,
        tools: respTools,
        inputTokens: params.inputTokens ?? 0,
        cachedTokens: params.cachedTokens ?? 0,
        outputTokens: params.outputTokens ?? 0,
        costUsd: params.costUsd ?? 0,
        timestamp: new Date(Date.now() + 20).toISOString(),
      });
    }

    this.remoteConversationReplies.push(...items);
    if (this.remoteConversationReplies.length > 30) {
      this.remoteConversationReplies.splice(0, this.remoteConversationReplies.length - 30);
    }
    this.lastState.conversationFeed = this.mergeConversationFeed(
      this.lastState.conversationFeed.filter((item) => !item.id.startsWith('remote_'))
    );
    return items;
  }

  /**
   * Merges real transcript turns with remote-cockpit prompts chronologically. Once the IDE
   * transcript contains the same user prompt, the remote placeholder is dropped (no duplicates).
   */
  private mergeConversationFeed(transcriptFeed: ConversationFeedItem[]): ConversationFeedItem[] {
    const norm = (s: string) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const transcriptUserTexts = new Set(
      transcriptFeed.filter((i) => i.role === 'user').map((i) => norm(i.text))
    );
    const remoteItems = this.remoteConversationReplies.filter(
      (i) => !(i.role === 'user' && transcriptUserTexts.has(norm(i.text)))
    );
    // Guarantee that remote prompt & agent response pairs remain visible in the cockpit
    const combined = [...transcriptFeed.slice(-16), ...remoteItems.slice(-12)];
    return combined
      .sort((a, b) => (Date.parse(a.timestamp || '') || 0) - (Date.parse(b.timestamp || '') || 0));
  }

  /**
   * Called automatically when a gateway request arrives from Antigravity, Claude Code, OpenCode, or Hermes.
   */
  public recordGatewayDetection(params: {
    userAgent?: string;
    agentHeader?: string;
    modelId: string;
  }): AntigravityLiveState {
    const detected = detectHarnessFromContext(params);
    const policy = this.getPolicy();
    const resolved = resolveModelAndProvider(params.modelId, policy.aliases);

    const changed =
      this.activeHarnessOverride !== detected.harness ||
      this.activeModelOverride !== resolved.id;

    this.activeHarnessOverride = detected.harness;
    this.activeModelOverride = resolved.id;
    this.overrideSetAt = Date.now();
    this.detectionSource = 'auto-gateway';

    this.applyActiveMetadata(detected.harness, resolved);

    if (this.timer && changed) {
      this.syncedStepIds.clear();
      return this.syncNow(true);
    }
    return this.lastState;
  }

  /**
   * Switches the active IDE/Agent Harness and/or Model and immediately recalculates all session & step costs.
   */
  public setActiveModel(
    modelOrAlias: string,
    harness?: AgentHarnessType,
    source: 'auto-gateway' | 'manual' = 'manual'
  ): AntigravityLiveState {
    const policy = this.getPolicy();
    if (harness) {
      this.activeHarnessOverride = harness;
    }
    const targetModel =
      modelOrAlias ||
      (harness ? HARNESS_DEFAULT_MODELS[harness] : policy.routing.default);
    const resolved = resolveModelAndProvider(targetModel, policy.aliases);
    this.activeModelOverride = resolved.id;
    this.overrideSetAt = Date.now();

    if (!harness && resolved.harnesses && resolved.harnesses.length > 0) {
      // If switching to a Hermes-specific model, automatically reflect Hermes harness
      if (resolved.id.includes('hermes')) {
        this.activeHarnessOverride = 'hermes';
      }
    }

    this.detectionSource = source;
    const currentHarness: AgentHarnessType = this.activeHarnessOverride ?? 'antigravity';
    this.applyActiveMetadata(currentHarness, resolved);

    if (this.timer) {
      this.syncedStepIds.clear();
      return this.syncNow(true);
    }
    return this.lastState;
  }

  private applyActiveMetadata(
    currentHarness: AgentHarnessType,
    baseModelCap: ReturnType<typeof resolveModelAndProvider>
  ): void {
    this.lastState.activeHarness = currentHarness;
    this.lastState.activeHarnessLabel = HARNESS_LABELS[currentHarness] ?? 'Antigravity IDE';
    this.lastState.detectionSource = this.detectionSource;
    this.lastState.activeModelId = baseModelCap.id;
    this.lastState.activeModelDisplayName = currentHarness === 'codex' && baseModelCap.displayName.endsWith('(Auto-Detected)')
      ? `${baseModelCap.id.split('/').pop()} · Codex`
      : baseModelCap.displayName;
    this.lastState.activeModelCategory = baseModelCap.category ?? 'frontier';
    this.lastState.activeModelDescription =
      baseModelCap.description ?? `${baseModelCap.provider} coding model`;
    this.lastState.activeModelContextLength = baseModelCap.contextLength;
    this.lastState.activeModelPromptCaching = baseModelCap.promptCaching;
    this.lastState.sessionModelComparison = this.buildSessionComparison(
      this.lastState.sessionTokens,
      baseModelCap.id
    );
  }

  /**
   * Finds the newest Claude Code session for this project.
   * Sessions live in ~/.claude/projects/<encoded-cwd>/<session>.jsonl, where the folder name is the
   * session cwd with every non-alphanumeric character replaced by '-'. Only folders for this repo
   * (the project dir's parent and below) are scanned; each candidate is confirmed by the `cwd`
   * recorded in its log. `maxAgeMs` limits the search to recently written sessions.
   */
  private findClaudeSession(maxAgeMs?: number): { file: string; mtime: number; modelId?: string } | null {
    const root = path.join(os.homedir(), '.claude', 'projects');
    const encode = (p: string) => path.resolve(p).replace(/[^A-Za-z0-9]/g, '-').toLowerCase();
    const repoPrefix = encode(path.dirname(this.projectDir));
    const now = Date.now();
    let dirs: fs.Dirent[];
    try {
      dirs = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      return null;
    }
    const candidates: Array<{ file: string; mtime: number }> = [];
    for (const d of dirs) {
      if (!d.isDirectory() || !d.name.toLowerCase().startsWith(repoPrefix)) continue;
      const dir = path.join(root, d.name);
      let files: string[];
      try {
        files = fs.readdirSync(dir);
      } catch {
        continue;
      }
      for (const name of files) {
        if (!name.endsWith('.jsonl')) continue;
        try {
          const mtime = fs.statSync(path.join(dir, name)).mtimeMs;
          if (maxAgeMs === undefined || now - mtime < maxAgeMs) {
            candidates.push({ file: path.join(dir, name), mtime });
          }
        } catch {
          // File vanished between readdir and stat.
        }
      }
    }
    candidates.sort((a, b) => b.mtime - a.mtime);
    for (const { file, mtime } of candidates.slice(0, 8)) {
      const tail = readFileTail(file, 256 * 1024);
      let cwd: string | null = null;
      let model: string | undefined;
      for (const line of tail.split(/\r?\n/)) {
        if (!line.includes('"cwd"') && !line.includes('"model"')) continue;
        try {
          const ev = JSON.parse(line) as { cwd?: unknown; message?: { model?: unknown } };
          if (typeof ev.cwd === 'string') cwd = ev.cwd;
          if (typeof ev.message?.model === 'string' && !ev.message.model.startsWith('<')) {
            model = ev.message.model;
          }
        } catch {
          // The first line of a tail read is usually partial.
        }
      }
      if (cwd && isSameProject(cwd, this.projectDir)) {
        return { file, mtime, modelId: model ? normalizeClaudeModelId(model) : undefined };
      }
    }
    return null;
  }

  /** A Claude Code session for this project written to in the last 2 minutes. */
  private detectClaudeCodeSession(): { modelId?: string; mtime: number } | null {
    return this.findClaudeSession(120_000);
  }

  private claudeActivityCache: {
    key: string;
    result: ReturnType<typeof parseClaudeSession>;
  } | null = null;

  /**
   * Reads the newest Claude Code session for this project as the live Activity source, and records
   * each assistant turn as a call so it counts toward session cost (ids are stable, so no double count).
   */
  private readClaudeActivity(): (ReturnType<typeof parseClaudeSession> & { file: string }) | null {
    const session = this.findClaudeSession();
    if (!session) return null;
    let size = 0;
    try {
      size = fs.statSync(session.file).size;
    } catch {
      return null;
    }
    const key = `${session.file}:${session.mtime}:${size}`;
    if (this.claudeActivityCache?.key !== key) {
      let raw = '';
      try {
        raw = fs.readFileSync(session.file, 'utf-8');
      } catch {
        return null;
      }
      const result = parseClaudeSession(raw, this.getPolicy().aliases);
      this.claudeActivityCache = { key, result };

      const sessionId = path.basename(session.file, '.jsonl');
      const runId = `claude_${sessionId.slice(0, 8)}`;
      for (const turn of result.turns) {
        const callId = `cc_${sessionId.slice(0, 8)}_${turn.messageId}`;
        if (this.syncedStepIds.has(callId)) continue;
        this.syncedStepIds.add(callId);
        const existing = this.db.db.prepare(`SELECT id FROM calls WHERE id = ?`).get(callId);
        if (existing) continue;
        this.db.recordCall({
          id: callId,
          runId,
          taskId: 'claude-code-live',
          model: turn.modelDisplayName,
          provider: 'anthropic',
          inputTokens: turn.inputTokens,
          outputTokens: turn.outputTokens,
          cacheWriteTokens: turn.cacheWriteTokens,
          cacheReadTokens: turn.cachedTokens,
          latencyMs: 0,
          costUsd: turn.costUsd,
          cacheHit: turn.cachedTokens > 0 ? 1 : 0,
          promptPreview: `Claude Code Step #${turn.stepIndex}`,
          responsePreview: turn.summary,
        });
      }
    }
    return { ...this.claudeActivityCache!.result, file: session.file };
  }

  /**
   * Probes local sessions/configs for Codex, Claude Code (~/.claude/projects) and OpenCode
   * if no explicit override is set; Antigravity IDE is the fallback.
   */
  private detectExternalHarnessConfig(): {
    harness: AgentHarnessType;
    modelId?: string;
    source?: 'auto-transcript' | 'auto-config';
  } | null {
    try {
      let codexRunning = false;
      if (process.platform === 'win32') {
        try { codexRunning = /codex\.exe/i.test(execFileSync('tasklist', ['/FI', 'IMAGENAME eq codex.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch { codexRunning = false; }
      } else {
        try { execFileSync('pgrep', ['-f', '(^|/)codex($| )'], { stdio: 'ignore' }); codexRunning = true; } catch { codexRunning = false; }
      }
      const root = path.join(os.homedir(), '.codex', 'sessions');
      const candidates: Array<{ file: string; mtime: number }> = [];
      const walk = (dir: string, depth: number) => {
        if (depth > 4) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const file = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(file, depth + 1);
          else if (entry.name.startsWith('rollout-') && entry.name.endsWith('.jsonl')) {
            const mtime = fs.statSync(file).mtimeMs;
            candidates.push({ file, mtime });
          }
        }
      };
      if (fs.existsSync(root)) walk(root, 0);
      const latest = candidates.sort((a, b) => b.mtime - a.mtime)[0];
      if (latest && (codexRunning || Date.now() - latest.mtime < 120_000)) {
        const raw = fs.readFileSync(latest.file, 'utf-8');
        let cwdMatches = false;
        let modelId = 'openai/gpt-5-codex';
        for (const line of raw.split(/\r?\n/)) {
          try {
            const ev = JSON.parse(line) as { type?: string; payload?: Record<string, unknown> };
            const p = ev.payload ?? {};
            if (ev.type === 'session_meta' && typeof p.cwd === 'string') {
              const a = path.resolve(p.cwd).toLowerCase();
              cwdMatches = a === path.resolve(process.cwd()).toLowerCase();
            }
            if (ev.type === 'turn_context' && typeof p.model === 'string') modelId = p.model;
          } catch { /* Ignore partial JSONL lines. */ }
        }
        if (cwdMatches && (codexRunning || Date.now() - latest.mtime < 120_000)) {
          this.detectionSource = 'auto-config';
          return { harness: 'codex', modelId };
        }
      }
    } catch { /* Codex CLI may not be installed or its session may be unavailable. */ }
    const claude = this.detectClaudeCodeSession();
    if (claude) {
      // Keep Antigravity if its transcript was written more recently than the Claude session.
      const ag = this.findLatestTranscript();
      let agMtime = 0;
      try {
        if (ag) agMtime = fs.statSync(ag.transcriptPath).mtimeMs;
      } catch {
        agMtime = 0;
      }
      if (claude.mtime >= agMtime) {
        return { harness: 'claude-code', modelId: claude.modelId, source: 'auto-transcript' };
      }
    }
    try {
      const opencodeConfig = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
      if (fs.existsSync(opencodeConfig)) {
        const stat = fs.statSync(opencodeConfig);
        // Only auto-switch if modified within the last 2 minutes
        if (Date.now() - stat.mtimeMs < 120_000) {
          const parsed = JSON.parse(fs.readFileSync(opencodeConfig, 'utf-8')) as Record<
            string,
            unknown
          >;
          return {
            harness: 'opencode',
            modelId: typeof parsed.model === 'string' ? parsed.model : undefined,
          };
        }
      }
    } catch {
      // Ignore config read errors
    }
    return null;
  }

  private findLatestTranscript(): { conversationId: string; transcriptPath: string } | null {
    const brainDir = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');
    if (!fs.existsSync(brainDir)) return null;

    let bestConvId: string | null = null;
    let bestPath: string | null = null;
    let bestMtime = 0;

    try {
      const entries = fs.readdirSync(brainDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidate = path.join(
          brainDir,
          entry.name,
          '.system_generated',
          'logs',
          'transcript.jsonl'
        );
        if (fs.existsSync(candidate)) {
          const stat = fs.statSync(candidate);
          if (stat.mtimeMs > bestMtime) {
            bestMtime = stat.mtimeMs;
            bestConvId = entry.name;
            bestPath = candidate;
          }
        }
      }
    } catch {
      return null;
    }

    if (!bestConvId || !bestPath) return null;
    return { conversationId: bestConvId, transcriptPath: bestPath };
  }

  public syncNow(forceRecalculateDb = false): AntigravityLiveState {
    const policy = this.getPolicy();
    const externalConfig = !this.activeHarnessOverride ? this.detectExternalHarnessConfig() : null;

    const currentHarness: AgentHarnessType =
      this.activeHarnessOverride ?? externalConfig?.harness ?? 'antigravity';
    if (!this.activeHarnessOverride && externalConfig) this.detectionSource = externalConfig.source ?? 'auto-config';
    process.env.CAIRN_ACTIVE_IDE = currentHarness;
    const currentHarnessLabel = HARNESS_LABELS[currentHarness] ?? 'Antigravity IDE';

    const baseModelCap = resolveModelAndProvider(
      this.activeModelOverride ?? externalConfig?.modelId ?? policy.routing.default,
      policy.aliases
    );

    if (currentHarness === 'claude-code') {
      const claude = this.readClaudeActivity();
      if (claude) {
        const cap = !this.activeModelOverride && claude.modelId
          ? resolveModelAndProvider(claude.modelId, policy.aliases)
          : baseModelCap;
        this.lastState.activeHarness = currentHarness;
        this.lastState.activeHarnessLabel = currentHarnessLabel;
        this.lastState.detectionSource = this.detectionSource;
        this.lastState.activeModelId = cap.id;
        this.lastState.activeModelDisplayName = cap.displayName;
        this.lastState.activeModelCategory = cap.category ?? 'frontier';
        this.lastState.activeModelDescription = cap.description ?? `${cap.provider} coding model`;
        this.lastState.activeModelContextLength = cap.contextLength;
        this.lastState.activeModelPromptCaching = cap.promptCaching;
        this.lastState.connected = claude.steps > 0;
        this.lastState.transcriptPath = claude.file;
        this.lastState.conversationId = path.basename(claude.file, '.jsonl');
        this.lastState.recentEvents = claude.events;
        this.lastState.sessionTokens = claude.usage;
        this.lastState.totalSteps = claude.steps;
        this.lastState.lastActivityAt = claude.lastActivityAt;
        this.lastState.conversationFeed = this.mergeConversationFeed(claude.feed);
        this.lastState.sessionModelComparison = this.buildSessionComparison(claude.usage, cap.id);
        return this.lastState;
      }
    }

    const latest = this.findLatestTranscript();
    if (!latest) {
      const codex = currentHarness === 'codex' ? this.readCodexActivity(baseModelCap.id) : null;
      this.lastState.activeHarness = currentHarness;
      this.lastState.activeHarnessLabel = currentHarnessLabel;
      this.lastState.detectionSource = this.detectionSource;
      this.lastState.activeModelId = baseModelCap.id;
      this.lastState.activeModelDisplayName = currentHarness === 'codex' && baseModelCap.displayName.endsWith('(Auto-Detected)')
        ? `${baseModelCap.id.split('/').pop()} · Codex`
        : baseModelCap.displayName;
      this.lastState.activeModelCategory = baseModelCap.category ?? 'frontier';
      this.lastState.activeModelDescription =
        baseModelCap.description ?? `${baseModelCap.provider} coding model`;
      this.lastState.activeModelContextLength = baseModelCap.contextLength;
      this.lastState.activeModelPromptCaching = baseModelCap.promptCaching;
      this.lastState.sessionModelComparison = this.buildSessionComparison(
        codex?.usage ?? this.lastState.sessionTokens,
        baseModelCap.id
      );
      if (codex) {
        this.lastState.connected = codex.events.length > 0;
        this.lastState.transcriptPath = null;
        this.lastState.conversationId = null;
        this.lastState.recentEvents = codex.events;
        this.lastState.sessionTokens = codex.usage;
        this.lastState.totalSteps = codex.steps;
        this.lastState.lastActivityAt = codex.lastActivityAt;
        this.lastState.conversationFeed = [];
      }
      return this.lastState;
    }

    let rawContent = '';
    try {
      rawContent = fs.readFileSync(latest.transcriptPath, 'utf-8');
    } catch {
      return this.lastState;
    }

    const lines = rawContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let plannerTurns = 0;
    let lastActivityAt: string | null = null;
    let lastToolName: string | null = null;
    let lastToolSummary: string | null = null;
    let lastThinkingSnippet: string | null = null;
    let detectedSubagentRole: string | null = null;
    let detectedTranscriptModel: string | null = null;
    let activeModelSwitchedAt: string | null = null;
    let totalUncachedInput = 0;
    let totalCachedRead = 0;
    let totalOutput = 0;
    const recentEvents: AntigravityLiveState['recentEvents'] = [];
    const transcriptFeed: ConversationFeedItem[] = [];
    let addedNewStep = false;

    const perModelMap = new Map<
      string,
      {
        steps: number;
        uncachedInput: number;
        cachedRead: number;
        output: number;
        costUsd: number;
        lastContextTokens: number;
        lastUsedAt: string | null;
      }
    >();
    for (const nativeId of ANTIGRAVITY_NATIVE_MODEL_IDS) {
      perModelMap.set(nativeId, {
        steps: 0,
        uncachedInput: 0,
        cachedRead: 0,
        output: 0,
        costUsd: 0,
        lastContextTokens: 0,
        lastUsedAt: null,
      });
    }

    const runId = `antigravity_${latest.conversationId.slice(0, 8)}`;

    // Pre-scan for the most recent IDE model switch so we know whether a newer IDE switch
    // happened after any manual UI selection
    for (const line of lines) {
      if (!line.includes('Model Selection')) continue;
      try {
        const s = JSON.parse(line) as Record<string, unknown>;
        if (s.type === 'USER_INPUT') {
          const sw = parseAntigravityModelSwitch(String(s.content ?? ''));
          if (sw) {
            activeModelSwitchedAt = String(s.created_at ?? '');
          }
        }
      } catch {
        // ignore
      }
    }
    if (currentHarness !== 'codex' && activeModelSwitchedAt && Date.parse(activeModelSwitchedAt) > this.overrideSetAt) {
      this.activeModelOverride = null;
      this.detectionSource = 'auto-transcript';
    }

    for (const line of lines) {
      let step: Record<string, unknown>;
      try {
        step = JSON.parse(line);
      } catch {
        continue;
      }

      const stepIndex = Number(step.step_index ?? 0);
      const stepType = String(step.type ?? '');
      const createdAt = String(step.created_at ?? new Date().toISOString());
      lastActivityAt = createdAt;

      if (typeof step.model === 'string' && step.model.trim()) {
        detectedTranscriptModel = step.model.trim();
      }

      if (stepType === 'USER_INPUT') {
        const rawUserContent = String(step.content ?? '');
        const switchedModel = parseAntigravityModelSwitch(rawUserContent);
        if (switchedModel) {
          detectedTranscriptModel = switchedModel;
          activeModelSwitchedAt = createdAt;
        }
        let userText = rawUserContent.trim();
        const reqMatch = userText.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/i);
        if (reqMatch && reqMatch[1]) {
          userText = reqMatch[1].trim();
        }
        if (userText && !userText.startsWith('<CONTEXT_SUMMARY>')) {
          transcriptFeed.push({
            id: `step_user_${stepIndex}`,
            stepIndex,
            role: 'user',
            source: 'ide',
            modelDisplayName: 'You (Antigravity IDE)',
            text: userText.slice(0, 600),
            tools: [],
            inputTokens: 0,
            cachedTokens: 0,
            outputTokens: 0,
            costUsd: 0,
            timestamp: createdAt,
          });
        }
        continue;
      }

      if (stepType !== 'PLANNER_RESPONSE') continue;
      plannerTurns++;

      const inputTokens = Number(step.input_tokens ?? 0);
      const cachedTokens = Number(step.cache_read_tokens ?? 0);
      const outputTokens = Number(step.output_tokens ?? 0);
      if (inputTokens === 0 && cachedTokens === 0 && outputTokens === 0) continue;

      totalUncachedInput += inputTokens;
      totalCachedRead += cachedTokens;
      totalOutput += outputTokens;

      const rawTools = Array.isArray(step.tool_calls)
        ? (step.tool_calls as Array<Record<string, unknown>>)
        : [];
      const toolNames = rawTools.map((t) => String(t.name ?? 'tool'));

      let subagentStepModel: string | null = null;
      for (const t of rawTools) {
        if (t.name === 'invoke_subagent') {
          const argsObj = (t.args ?? t.arguments ?? {}) as Record<string, unknown>;
          if (argsObj.Role) {
            detectedSubagentRole = String(argsObj.Role);
          }
          if (argsObj.Model && String(argsObj.Model) !== 'inherit') {
            subagentStepModel = String(argsObj.Model);
          }
        }
      }

      const transcriptCapForStep = resolveModelAndProvider(
        subagentStepModel ?? detectedTranscriptModel ?? policy.routing.default,
        policy.aliases
      );
      const effectiveModelCap = this.activeModelOverride
        ? baseModelCap
        : transcriptCapForStep;

      // Record per-model consumption in the transcript bucket
      const bucketKey = transcriptCapForStep.id;
      let bucket = perModelMap.get(bucketKey);
      if (!bucket) {
        bucket = {
          steps: 0,
          uncachedInput: 0,
          cachedRead: 0,
          output: 0,
          costUsd: 0,
          lastContextTokens: 0,
          lastUsedAt: null,
        };
        perModelMap.set(bucketKey, bucket);
      }
      bucket.steps += 1;
      bucket.uncachedInput += inputTokens;
      bucket.cachedRead += cachedTokens;
      bucket.output += outputTokens;
      bucket.costUsd += calculateCallCostUsd(
        {
          inputTokens,
          outputTokens,
          cacheWriteTokens: 0,
          cacheReadTokens: cachedTokens,
          reasoningTokens: 0,
        },
        transcriptCapForStep
      );
      bucket.lastContextTokens = inputTokens + cachedTokens + outputTokens;
      bucket.lastUsedAt = createdAt;

      let stepSummary = String(step.content ?? '').trim();
      if (!stepSummary && rawTools.length > 0) {
        const firstTool = rawTools[0];
        const argsObj = (firstTool.args ?? firstTool.arguments ?? {}) as Record<string, unknown>;
        const detail = String(
          argsObj.toolSummary ??
            argsObj.Path ??
            argsObj.CommandLine ??
            argsObj.query ??
            firstTool.name ??
            ''
        );
        stepSummary = `${firstTool.name}: ${detail}`.slice(0, 110);
        lastToolName = String(firstTool.name ?? '');
        lastToolSummary = stepSummary;
      }

      if (step.thinking) {
        lastThinkingSnippet = String(step.thinking).trim().slice(0, 160);
      }

      const costUsd = calculateCallCostUsd(
        {
          inputTokens,
          outputTokens,
          cacheWriteTokens: 0,
          cacheReadTokens: cachedTokens,
          reasoningTokens: 0,
        },
        effectiveModelCap
      );

      const callId = `ag_${latest.conversationId.slice(0, 8)}_step_${stepIndex}`;

      if (!this.syncedStepIds.has(callId)) {
        this.syncedStepIds.add(callId);
        const existing = this.db.db
          .prepare(`SELECT id FROM calls WHERE id = ?`)
          .get(callId) as { id: string } | undefined;

        if (!existing) {
          this.db.recordCall({
            id: callId,
            runId,
            taskId: 'antigravity-live',
            model: effectiveModelCap.displayName,
            provider: effectiveModelCap.provider,
            inputTokens,
            outputTokens,
            cacheWriteTokens: 0,
            cacheReadTokens: cachedTokens,
            latencyMs: 850,
            costUsd,
            cacheHit: cachedTokens > 0 ? 1 : 0,
            promptPreview: `${currentHarnessLabel} Step #${stepIndex}`,
            responsePreview: stepSummary || `Executed ${toolNames.join(', ') || 'response'}`,
          });

          for (let i = 0; i < rawTools.length; i++) {
            const t = rawTools[i];
            const tName = String(t.name ?? 'tool');
            const tArgs = JSON.stringify(t.args ?? t.arguments ?? {});
            const classified = classifyToolAction(tName, tArgs, policy);
            const actId = `ag_act_${latest.conversationId.slice(0, 6)}_${stepIndex}_${i}`;
            const existingAct = this.db.db
              .prepare(`SELECT id FROM actions WHERE id = ?`)
              .get(actId);
            if (!existingAct) {
              this.db.recordAction({
                id: actId,
                runId,
                toolName: tName,
                target: classified.target.slice(0, 120),
                riskLevel: classified.riskLevel,
                preview: stepSummary || classified.preview,
                status: 'approved',
                approvedBy: 'ide',
                gitCheckpointRef: null,
              });
            }
          }

          addedNewStep = true;
        } else if (forceRecalculateDb) {
          this.db.db
            .prepare(`UPDATE calls SET model = ?, provider = ?, cost_usd = ? WHERE id = ?`)
            .run(effectiveModelCap.displayName, effectiveModelCap.provider, costUsd, callId);
          addedNewStep = true;
        }
      }

      const fullAgentContent = String(step.content ?? '').trim();
      const toolDetailItems = rawTools.map((t) => {
        const argsObj = (t.args ?? t.arguments ?? {}) as Record<string, unknown>;
        const detail = String(
          argsObj.toolSummary ??
            argsObj.Path ??
            argsObj.CommandLine ??
            argsObj.query ??
            t.name ??
            ''
        );
        return {
          name: String(t.name ?? 'tool'),
          detail: detail.slice(0, 140),
        };
      });

      if (fullAgentContent || toolDetailItems.length > 0) {
        transcriptFeed.push({
          id: `step_agent_${stepIndex}`,
          stepIndex,
          role: fullAgentContent ? 'assistant' : 'tool',
          source: 'ide',
          modelDisplayName: effectiveModelCap.displayName,
          text: fullAgentContent
            ? fullAgentContent.slice(0, 1200)
            : toolDetailItems.map((td) => `${td.name}: ${td.detail}`).join('\n'),
          thinking: step.thinking ? String(step.thinking).trim().slice(0, 240) : undefined,
          tools: toolDetailItems,
          inputTokens,
          cachedTokens,
          outputTokens,
          costUsd,
          timestamp: createdAt,
        });
      }

      recentEvents.push({
        stepIndex,
        type: stepType,
        harnessLabel: currentHarnessLabel,
        modelDisplayName: effectiveModelCap.displayName,
        inputTokens,
        cachedTokens,
        outputTokens,
        costUsd,
        tools: toolNames,
        summary: stepSummary || (lastThinkingSnippet ? lastThinkingSnippet.slice(0, 90) : 'Agent response'),
        timestamp: createdAt,
      });
    }

    // Codex and Claude Code report their own model; the Antigravity transcript must not override it.
    const finalActiveCap = currentHarness === 'codex' || currentHarness === 'claude-code'
      ? baseModelCap
      : this.activeModelOverride
      ? baseModelCap
      : detectedTranscriptModel
      ? resolveModelAndProvider(detectedTranscriptModel, policy.aliases)
      : baseModelCap;

    const sessionTokens = {
      uncachedInput: totalUncachedInput,
      cachedRead: totalCachedRead,
      output: totalOutput,
      total: totalUncachedInput + totalCachedRead + totalOutput,
    };

    const latestStepEvent = recentEvents.length > 0 ? recentEvents[recentEvents.length - 1] : null;
    const latestTurnContextTok = latestStepEvent
      ? latestStepEvent.inputTokens + latestStepEvent.cachedTokens + latestStepEvent.outputTokens
      : 0;
    const sessionCacheHitPct =
      sessionTokens.uncachedInput + sessionTokens.cachedRead > 0
        ? (sessionTokens.cachedRead / (sessionTokens.uncachedInput + sessionTokens.cachedRead)) * 100
        : 0;

    // Ensure all 5 Antigravity IDE models + active model are represented in modelUsage
    if (!perModelMap.has(finalActiveCap.id)) {
      perModelMap.set(finalActiveCap.id, {
        steps: 0,
        uncachedInput: 0,
        cachedRead: 0,
        output: 0,
        costUsd: 0,
        lastContextTokens: 0,
        lastUsedAt: null,
      });
    }

    const modelUsage: LiveModelUsageItem[] = [...perModelMap.entries()].map(([mId, b]) => {
      const mCap = resolveModelAndProvider(mId, policy.aliases);
      const isActive = mCap.id === finalActiveCap.id;
      const eqCost = calculateCallCostUsd(
        {
          inputTokens: sessionTokens.uncachedInput,
          outputTokens: sessionTokens.output,
          cacheWriteTokens: 0,
          cacheReadTokens: sessionTokens.cachedRead,
          reasoningTokens: 0,
        },
        mCap
      );
      const promptTok = b.uncachedInput + b.cachedRead;
      const cachePct = promptTok > 0 ? (b.cachedRead / promptTok) * 100 : sessionCacheHitPct;
      const lastCtx = b.lastContextTokens > 0 ? b.lastContextTokens : latestTurnContextTok;
      const ctxFill =
        mCap.contextLength > 0 ? Math.min(100, (lastCtx / mCap.contextLength) * 100) : 0;

      return {
        modelId: mCap.id,
        displayName: mCap.displayName,
        category: mCap.category ?? 'frontier',
        contextLength: mCap.contextLength,
        isActive,
        steps: b.steps,
        tokens: {
          uncachedInput: b.uncachedInput,
          cachedRead: b.cachedRead,
          output: b.output,
          total: b.uncachedInput + b.cachedRead + b.output,
        },
        costUsd: Number(b.costUsd.toFixed(4)),
        sessionEquivalentCostUsd: Number(eqCost.toFixed(2)),
        cacheHitPct: Number(cachePct.toFixed(1)),
        lastContextTokens: lastCtx,
        contextFillPct: Number(ctxFill.toFixed(1)),
        lastUsedAt: b.lastUsedAt,
      };
    });

    const combinedFeed = this.mergeConversationFeed(transcriptFeed);
    const codex = currentHarness === 'codex' ? this.readCodexActivity(finalActiveCap.id) : null;

    this.lastState = {
      connected: codex ? codex.events.length > 0 : true,
      conversationId: latest.conversationId,
      transcriptPath: latest.transcriptPath,
      activeHarness: currentHarness,
      activeHarnessLabel: currentHarnessLabel,
      detectionSource: this.detectionSource,
      activeModelId: finalActiveCap.id,
      activeModelDisplayName: currentHarness === 'codex' && finalActiveCap.displayName.endsWith('(Auto-Detected)')
        ? `${finalActiveCap.id.split('/').pop()} · Codex`
        : finalActiveCap.displayName,
      activeModelCategory: finalActiveCap.category ?? 'frontier',
      activeModelDescription:
        finalActiveCap.description ?? `${finalActiveCap.provider} coding agent model`,
      activeModelContextLength: finalActiveCap.contextLength,
      activeModelPromptCaching: finalActiveCap.promptCaching,
      activeModelSwitchedAt,
      modelUsage,
      detectedSubagentRole,
      totalSteps: codex?.steps ?? lines.length,
      plannerTurns,
      sessionTokens: codex?.usage ?? sessionTokens,
      lastActivityAt: codex?.lastActivityAt ?? lastActivityAt,
      lastToolName,
      lastToolSummary,
      lastThinkingSnippet,
      sessionModelComparison: this.buildSessionComparison(sessionTokens, finalActiveCap.id),
      technicalBreakdown: codex ? [] : this.buildTechnicalBreakdown(recentEvents),
      conversationFeed: codex ? this.remoteConversationReplies.slice(-12) : combinedFeed,
      recentEvents: codex?.events ?? recentEvents.slice(-15).reverse(),
    };

    if (addedNewStep && this.onNewStep) {
      this.onNewStep(this.lastState);
    }

    return this.lastState;
  }

  private buildTechnicalBreakdown(
    allEvents: AntigravityLiveState['recentEvents']
  ): TechnicalLayerCostItem[] {
    const buckets: Record<
      TechnicalLayerCostItem['id'],
      {
        label: string;
        description: string;
        stepsCount: number;
        uncachedInputTokens: number;
        cachedReadTokens: number;
        outputTokens: number;
        costUsd: number;
      }
    > = {
      'ui-frontend': {
        label: 'UI, Frontend & Mobile Remote Cockpit',
        description: 'Dashboard layout, phone UI responsiveness, tabs, viewport & styling (mobile-ui.ts, extension)',
        stepsCount: 0,
        uncachedInputTokens: 0,
        cachedReadTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      },
      'backend-gateway': {
        label: 'Backend, Gateway API & Control Plane',
        description: 'HTTP/WebSocket server, model routing, remote steering & approvals (server.ts, cli.ts)',
        stepsCount: 0,
        uncachedInputTokens: 0,
        cachedReadTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      },
      'telemetry-pricing': {
        label: 'Agent Telemetry, Model Catalog & Cost Engine',
        description: 'Live transcript sync, IDE detection, pricing registry & PRD estimator (antigravity-sync.ts, registry.ts)',
        stepsCount: 0,
        uncachedInputTokens: 0,
        cachedReadTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      },
      'safety-infra': {
        label: 'OS Window Bridge, Git Undo & Database',
        description: 'Win32 desktop control, Git shadow snapshots, SQLite persistence & policy (win32.ts, git-shadow.ts, db)',
        stepsCount: 0,
        uncachedInputTokens: 0,
        cachedReadTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      },
      'testing-build': {
        label: 'Testing, Build & Verification',
        description: 'TypeScript compilation, unit/integration test suites & live endpoint verification',
        stepsCount: 0,
        uncachedInputTokens: 0,
        cachedReadTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      },
    };

    for (const ev of allEvents) {
      const s = `${ev.summary} ${ev.tools.join(' ')}`.toLowerCase();
      let bucketId: TechnicalLayerCostItem['id'] = 'backend-gateway';

      if (
        s.includes('mobile-ui') ||
        s.includes('remote') ||
        s.includes('extension') ||
        s.includes('ui') ||
        s.includes('css') ||
        s.includes('layout') ||
        s.includes('phone') ||
        s.includes('dashboard')
      ) {
        bucketId = 'ui-frontend';
      } else if (
        s.includes('test') ||
        s.includes('build') ||
        s.includes('tsc') ||
        s.includes('invoke-restmethod') ||
        s.includes('run_command')
      ) {
        bucketId = 'testing-build';
      } else if (
        s.includes('antigravity-sync') ||
        s.includes('registry') ||
        s.includes('engine.ts') ||
        s.includes('scanner') ||
        s.includes('canonical') ||
        s.includes('pricing') ||
        s.includes('estimator')
      ) {
        bucketId = 'telemetry-pricing';
      } else if (
        s.includes('win32') ||
        s.includes('git-shadow') ||
        s.includes('database') ||
        s.includes('cairn.yaml') ||
        s.includes('policy') ||
        s.includes('snapshot')
      ) {
        bucketId = 'safety-infra';
      }

      const b = buckets[bucketId];
      b.stepsCount += 1;
      b.uncachedInputTokens += ev.inputTokens;
      b.cachedReadTokens += ev.cachedTokens;
      b.outputTokens += ev.outputTokens;
      b.costUsd += ev.costUsd;
    }

    const totalCost = Object.values(buckets).reduce((acc, b) => acc + b.costUsd, 0) || 1;

    return (Object.entries(buckets) as Array<[TechnicalLayerCostItem['id'], (typeof buckets)['ui-frontend']]>)
      .map(([id, b]) => ({
        id,
        label: b.label,
        description: b.description,
        stepsCount: b.stepsCount,
        totalTokens: b.uncachedInputTokens + b.cachedReadTokens + b.outputTokens,
        uncachedInputTokens: b.uncachedInputTokens,
        cachedReadTokens: b.cachedReadTokens,
        outputTokens: b.outputTokens,
        costUsd: Number(b.costUsd.toFixed(2)),
        sharePercent: Math.round((b.costUsd / totalCost) * 100),
      }))
      .sort((a, b) => b.costUsd - a.costUsd);
  }

  private buildSessionComparison(
    tokens: { uncachedInput: number; cachedRead: number; output: number; total: number },
    currentModelId: string
  ): SessionModelComparisonItem[] {
    return Object.values(BUILTIN_MODELS).map((m) => {
      const cost = calculateCallCostUsd(
        {
          inputTokens: tokens.uncachedInput,
          outputTokens: tokens.output,
          cacheWriteTokens: 0,
          cacheReadTokens: tokens.cachedRead,
          reasoningTokens: 0,
        },
        m
      );
      return {
        modelId: m.id,
        displayName: m.displayName,
        category: m.category ?? 'frontier',
        harnesses: m.harnesses ?? ['antigravity', 'opencode'],
        description: m.description ?? `${m.provider} model`,
        contextLength: m.contextLength,
        promptCaching: m.promptCaching,
        provider: m.provider,
        inputPerMillion: m.pricing.inputPerMillion,
        cacheReadPerMillion: m.pricing.cacheReadPerMillion,
        outputPerMillion: m.pricing.outputPerMillion,
        sessionCostUsd: Number(cost.toFixed(2)),
        isCurrent: m.id === currentModelId,
      };
    });
  }
}
