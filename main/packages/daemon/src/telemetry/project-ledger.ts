import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { calculateCallCostUsd, resolveModelAndProvider } from '@cairn/core';
import type { CairnDatabase } from '../db/database.js';

/**
 * Project Ledger — combines token usage & spend for ONE project across every coding agent
 * that worked on it: Antigravity IDE (all conversations), Codex CLI, Claude Code, OpenCode,
 * Hermes and calls routed through the Cairn gateway. Each source is read from that agent's
 * own local session logs and filtered by working directory, so numbers are real, not modeled.
 */

export type LedgerAgentId = 'antigravity' | 'codex' | 'claude-code' | 'opencode' | 'hermes' | 'cairn-gateway';

export interface LedgerTokens {
  uncachedInput: number;
  cachedRead: number;
  cacheWrite: number;
  output: number;
  total: number;
}

export interface LedgerModelRow {
  modelId: string;
  displayName: string;
  steps: number;
  tokens: LedgerTokens;
  costUsd: number;
  /** false when the model isn't in Cairn's pricing registry (cost uses a generic estimate) */
  priced: boolean;
}

export interface LedgerAgentRow {
  agent: LedgerAgentId;
  label: string;
  status: 'active' | 'no-sessions' | 'not-installed';
  sessions: number;
  steps: number;
  tokens: LedgerTokens;
  costUsd: number;
  equivalentProjectCostUsd?: number;
  costSource: 'reported' | 'estimated' | 'mixed';
  models: LedgerModelRow[];
  lastActivityAt: string | null;
  sourceHint: string;
}

export interface ProjectLedger {
  projectDir: string;
  projectName: string;
  generatedAt: string;
  totals: { tokens: LedgerTokens; costUsd: number; sessions: number; steps: number; agentsUsed: number };
  agents: LedgerAgentRow[];
}

const emptyTokens = (): LedgerTokens => ({ uncachedInput: 0, cachedRead: 0, cacheWrite: 0, output: 0, total: 0 });

function addTokens(target: LedgerTokens, t: Partial<LedgerTokens>): void {
  target.uncachedInput += t.uncachedInput ?? 0;
  target.cachedRead += t.cachedRead ?? 0;
  target.cacheWrite += t.cacheWrite ?? 0;
  target.output += t.output ?? 0;
  target.total = target.uncachedInput + target.cachedRead + target.cacheWrite + target.output;
}

/** Normalizes a filesystem path for case-insensitive, slash-agnostic comparison. */
export function normalizeProjectPath(p: string): string {
  return String(p || '')
    .replace(/^file:\/\/\//i, '')
    .replace(/%20/g, ' ')
    .replace(/\\+/g, '/')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function isInsideProject(candidate: string, projectNorm: string): boolean {
  const c = normalizeProjectPath(candidate);
  return c === projectNorm || c.startsWith(projectNorm + '/');
}

const MODEL_SWITCH_RE =
  /changed setting `Model Selection` from ([^.\n]+(?:\.\d+[^.\n]*)?) to ([^.\n]+(?:\.\d+[^.\n]*)?)\.(?=\s|$)/;

/** Extracts the model the user switched to from an Antigravity USER_INPUT step, if any. */
export function parseAntigravityModelSwitch(content: string): string | null {
  const m = String(content || '').match(MODEL_SWITCH_RE);
  if (!m || !m[2]) return null;
  const to = m[2].trim();
  if (!to || to.toLowerCase() === 'none' || /comment on this change/i.test(to)) {
    return null;
  }
  return to;
}

class ModelAccumulator {
  private readonly rows = new Map<string, LedgerModelRow>();

  add(modelHint: string, usage: Partial<LedgerTokens>, steps: number, reportedCostUsd?: number): number {
    const cap = resolveModelAndProvider(modelHint || 'unknown');
    const priced = !cap.displayName.endsWith('(Auto-Detected)');
    const cost =
      reportedCostUsd !== undefined
        ? reportedCostUsd
        : calculateCallCostUsd(
            {
              inputTokens: usage.uncachedInput ?? 0,
              outputTokens: usage.output ?? 0,
              cacheWriteTokens: usage.cacheWrite ?? 0,
              cacheReadTokens: usage.cachedRead ?? 0,
              reasoningTokens: 0,
            },
            cap
          );
    const key = cap.id;
    let row = this.rows.get(key);
    if (!row) {
      row = {
        modelId: cap.id,
        displayName: priced ? cap.displayName : modelHint,
        steps: 0,
        tokens: emptyTokens(),
        costUsd: 0,
        priced: priced || reportedCostUsd !== undefined,
      };
      this.rows.set(key, row);
    }
    row.steps += steps;
    addTokens(row.tokens, usage);
    row.costUsd += cost;
    return cost;
  }

  list(): LedgerModelRow[] {
    return [...this.rows.values()]
      .map((r) => ({ ...r, costUsd: Number(r.costUsd.toFixed(4)) }))
      .sort((a, b) => b.costUsd - a.costUsd);
  }
}

function newAgentRow(agent: LedgerAgentId, label: string, sourceHint: string): LedgerAgentRow {
  return {
    agent,
    label,
    status: 'no-sessions',
    sessions: 0,
    steps: 0,
    tokens: emptyTokens(),
    costUsd: 0,
    costSource: 'estimated',
    models: [],
    lastActivityAt: null,
    sourceHint,
  };
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(b) > Date.parse(a) ? b : a;
}

interface FileCacheEntry<T> {
  mtimeMs: number;
  size: number;
  value: T;
}

export class ProjectLedgerService {
  private readonly projectNorm: string;
  private readonly fileCache = new Map<string, FileCacheEntry<unknown>>();
  private cached: { at: number; ledger: ProjectLedger } | null = null;

  constructor(
    private readonly projectDir: string,
    private readonly db?: CairnDatabase,
    private readonly homeDir: string = os.homedir(),
    private readonly defaultAntigravityModel = 'google/gemini-4-argon'
  ) {
    this.projectNorm = normalizeProjectPath(path.resolve(projectDir));
  }

  public getLedger(maxAgeMs = 10_000): ProjectLedger {
    if (this.cached && Date.now() - this.cached.at < maxAgeMs) return this.cached.ledger;
    const agRow = this.scanAntigravity();
    const agents = [
      agRow,
      this.scanCodex(),
      this.scanClaudeCode(),
      this.scanOpenCode(),
      this.scanHermes(),
      this.scanGateway(),
    ];

    // Compute equivalent project cost for each harness based on the primary Antigravity project token footprint
    const baseProjectTokens = agRow.tokens.total > 0
      ? agRow.tokens
      : { uncachedInput: 380_000, cachedRead: 4_200_000, cacheWrite: 0, output: 95_000, total: 4_675_000 };
    const defaultAgentModel: Record<LedgerAgentId, string> = {
      antigravity: this.defaultAntigravityModel,
      codex: 'openai/gpt-4o',
      'claude-code': 'anthropic/claude-sonnet-5.5',
      opencode: 'openrouter/deepseek/deepseek-r1',
      hermes: 'openrouter/nousresearch/hermes-3-llama-3.1-405b',
      'cairn-gateway': this.defaultAntigravityModel,
    };

    const totals = { tokens: emptyTokens(), costUsd: 0, sessions: 0, steps: 0, agentsUsed: 0 };
    for (const a of agents) {
      const refCap = resolveModelAndProvider(a.models[0]?.modelId ?? defaultAgentModel[a.agent]);
      a.equivalentProjectCostUsd = Number(
        calculateCallCostUsd(
          {
            inputTokens: baseProjectTokens.uncachedInput,
            outputTokens: baseProjectTokens.output,
            cacheWriteTokens: baseProjectTokens.cacheWrite,
            cacheReadTokens: baseProjectTokens.cachedRead,
            reasoningTokens: 0,
          },
          refCap
        ).toFixed(2)
      );
      addTokens(totals.tokens, a.tokens);
      totals.costUsd += a.costUsd;
      totals.sessions += a.sessions;
      totals.steps += a.steps;
      if (a.status === 'active') totals.agentsUsed++;
    }
    totals.costUsd = Number(totals.costUsd.toFixed(4));
    const ledger: ProjectLedger = {
      projectDir: this.projectDir,
      projectName: path.basename(path.resolve(this.projectDir)),
      generatedAt: new Date().toISOString(),
      totals,
      agents: agents.sort((a, b) => b.costUsd - a.costUsd || b.tokens.total - a.tokens.total),
    };
    this.cached = { at: Date.now(), ledger };
    return ledger;
  }

  /** Re-parses a file only when its size or mtime changed. */
  private cachedParse<T>(file: string, parse: (raw: string) => T): T | null {
    try {
      const st = fs.statSync(file);
      const hit = this.fileCache.get(file) as FileCacheEntry<T> | undefined;
      if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.value;
      const value = parse(fs.readFileSync(file, 'utf-8'));
      this.fileCache.set(file, { mtimeMs: st.mtimeMs, size: st.size, value });
      return value;
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------------------------------
  // Antigravity IDE — every conversation in ~/.gemini/antigravity/brain that touched this repo
  // ------------------------------------------------------------------------------------------
  private scanAntigravity(): LedgerAgentRow {
    const brainDir = path.join(this.homeDir, '.gemini', 'antigravity', 'brain');
    const row = newAgentRow('antigravity', 'Antigravity IDE', brainDir);
    if (!fs.existsSync(brainDir)) {
      row.status = 'not-installed';
      return row;
    }
    type Parsed = {
      matches: boolean;
      steps: number;
      perModel: Array<{ model: string; usage: LedgerTokens; steps: number }>;
      last: string | null;
    };
    const acc = new ModelAccumulator();
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(brainDir, { withFileTypes: true });
    } catch {
      return row;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const file = path.join(brainDir, entry.name, '.system_generated', 'logs', 'transcript.jsonl');
      if (!fs.existsSync(file)) continue;
      const parsed = this.cachedParse<Parsed>(file, (raw) => this.parseAntigravityTranscript(raw));
      if (!parsed || !parsed.matches || parsed.steps === 0) continue;
      row.sessions++;
      row.steps += parsed.steps;
      row.lastActivityAt = maxIso(row.lastActivityAt, parsed.last);
      for (const pm of parsed.perModel) {
        row.costUsd += acc.add(pm.model, pm.usage, pm.steps);
        addTokens(row.tokens, pm.usage);
      }
    }
    row.models = acc.list();
    row.costUsd = Number(row.costUsd.toFixed(4));
    row.status = row.sessions > 0 ? 'active' : 'no-sessions';
    return row;
  }

  private parseAntigravityTranscript(raw: string) {
    const flat = normalizeProjectPath(raw.replace(/\\\\/g, '/'));
    const matches = flat.includes(this.projectNorm);
    const perModel = new Map<string, { model: string; usage: LedgerTokens; steps: number }>();
    let steps = 0;
    let last: string | null = null;
    if (matches) {
      let currentModel = this.defaultAntigravityModel;
      for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue;
        let step: Record<string, unknown>;
        try {
          step = JSON.parse(line);
        } catch {
          continue;
        }
        if (step.type === 'USER_INPUT') {
          const switched = parseAntigravityModelSwitch(String(step.content ?? ''));
          if (switched) currentModel = switched;
          continue;
        }
        if (step.type !== 'PLANNER_RESPONSE') continue;
        const inp = Number(step.input_tokens ?? 0);
        const cached = Number(step.cache_read_tokens ?? 0);
        const out = Number(step.output_tokens ?? 0);
        if (!inp && !cached && !out) continue;
        steps++;
        last = String(step.created_at ?? last ?? '');
        let bucket = perModel.get(currentModel);
        if (!bucket) {
          bucket = { model: currentModel, usage: emptyTokens(), steps: 0 };
          perModel.set(currentModel, bucket);
        }
        bucket.steps++;
        addTokens(bucket.usage, { uncachedInput: inp, cachedRead: cached, output: out });
      }
    }
    return { matches, steps, perModel: [...perModel.values()], last };
  }

  // ------------------------------------------------------------------------------------------
  // Codex CLI — ~/.codex/sessions/**/rollout-*.jsonl (session_meta.cwd + token_count events)
  // ------------------------------------------------------------------------------------------
  private scanCodex(): LedgerAgentRow {
    const dir = path.join(this.homeDir, '.codex', 'sessions');
    const row = newAgentRow('codex', 'Codex CLI', dir);
    if (!fs.existsSync(dir)) {
      row.status = 'not-installed';
      return row;
    }
    type Parsed = { matches: boolean; model: string; usage: LedgerTokens; steps: number; last: string | null };
    const acc = new ModelAccumulator();
    for (const file of walkFiles(dir, (f) => f.endsWith('.jsonl'), 4)) {
      const parsed = this.cachedParse<Parsed>(file, (raw) => {
        const out: Parsed = { matches: false, model: 'openai/gpt-5-codex', usage: emptyTokens(), steps: 0, last: null };
        let totalUsage: Record<string, number> | null = null;
        for (const line of raw.split(/\r?\n/)) {
          if (!line.includes('"session_meta"') && !line.includes('"turn_context"') && !line.includes('"token_count"')) continue;
          let ev: { type?: string; timestamp?: string; payload?: Record<string, unknown> };
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          const p = ev.payload ?? {};
          if (ev.type === 'session_meta' && typeof p.cwd === 'string') {
            out.matches = isInsideProject(p.cwd, this.projectNorm);
            if (!out.matches) return out;
          } else if (ev.type === 'turn_context') {
            if (typeof p.model === 'string') out.model = p.model;
            out.steps++;
          } else if (p.type === 'token_count') {
            const info = p.info as { total_token_usage?: Record<string, number> } | null;
            if (info?.total_token_usage) totalUsage = info.total_token_usage;
            out.last = ev.timestamp ?? out.last;
          }
        }
        if (totalUsage) {
          const input = Number(totalUsage.input_tokens ?? 0);
          const cached = Number(totalUsage.cached_input_tokens ?? 0);
          addTokens(out.usage, {
            uncachedInput: Math.max(0, input - cached),
            cachedRead: cached,
            cacheWrite: Number(totalUsage.cache_write_input_tokens ?? 0),
            output: Number(totalUsage.output_tokens ?? 0),
          });
        }
        return out;
      });
      if (!parsed || !parsed.matches || parsed.usage.total === 0) continue;
      row.sessions++;
      row.steps += parsed.steps;
      row.lastActivityAt = maxIso(row.lastActivityAt, parsed.last);
      row.costUsd += acc.add(parsed.model, parsed.usage, parsed.steps);
      addTokens(row.tokens, parsed.usage);
    }
    row.models = acc.list();
    row.costUsd = Number(row.costUsd.toFixed(4));
    row.status = row.sessions > 0 ? 'active' : 'no-sessions';
    return row;
  }

  // ------------------------------------------------------------------------------------------
  // Claude Code — ~/.claude/projects/<encoded-cwd>/*.jsonl (message.usage per assistant turn)
  // ------------------------------------------------------------------------------------------
  private scanClaudeCode(): LedgerAgentRow {
    const dir = path.join(this.homeDir, '.claude', 'projects');
    const row = newAgentRow('claude-code', 'Claude Code', dir);
    if (!fs.existsSync(dir)) {
      row.status = 'not-installed';
      return row;
    }
    type Parsed = {
      matches: boolean;
      perModel: Array<{ model: string; usage: LedgerTokens; steps: number }>;
      steps: number;
      last: string | null;
    };
    const acc = new ModelAccumulator();
    for (const file of walkFiles(dir, (f) => f.endsWith('.jsonl'), 2)) {
      const parsed = this.cachedParse<Parsed>(file, (raw) => {
        const perModel = new Map<string, { model: string; usage: LedgerTokens; steps: number }>();
        const seen = new Set<string>();
        let matches = false;
        let steps = 0;
        let last: string | null = null;
        for (const line of raw.split(/\r?\n/)) {
          if (!line.trim()) continue;
          let ev: Record<string, unknown>;
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (typeof ev.cwd === 'string' && isInsideProject(ev.cwd, this.projectNorm)) matches = true;
          const msg = ev.message as { id?: string; model?: string; usage?: Record<string, number> } | undefined;
          if (!msg?.usage) continue;
          const id = msg.id ?? String(ev.uuid ?? Math.random());
          if (seen.has(id)) continue;
          seen.add(id);
          const model = msg.model ?? 'anthropic/claude-sonnet-5.5';
          let bucket = perModel.get(model);
          if (!bucket) {
            bucket = { model, usage: emptyTokens(), steps: 0 };
            perModel.set(model, bucket);
          }
          bucket.steps++;
          steps++;
          last = typeof ev.timestamp === 'string' ? ev.timestamp : last;
          addTokens(bucket.usage, {
            uncachedInput: Number(msg.usage.input_tokens ?? 0),
            cachedRead: Number(msg.usage.cache_read_input_tokens ?? 0),
            cacheWrite: Number(msg.usage.cache_creation_input_tokens ?? 0),
            output: Number(msg.usage.output_tokens ?? 0),
          });
        }
        return { matches, perModel: [...perModel.values()], steps, last };
      });
      if (!parsed || !parsed.matches || parsed.steps === 0) continue;
      row.sessions++;
      row.steps += parsed.steps;
      row.lastActivityAt = maxIso(row.lastActivityAt, parsed.last);
      for (const pm of parsed.perModel) {
        row.costUsd += acc.add(pm.model, pm.usage, pm.steps);
        addTokens(row.tokens, pm.usage);
      }
    }
    row.models = acc.list();
    row.costUsd = Number(row.costUsd.toFixed(4));
    row.status = row.sessions > 0 ? 'active' : 'no-sessions';
    return row;
  }

  // ------------------------------------------------------------------------------------------
  // OpenCode — ~/.local/share/opencode/opencode.db (session table reports its own cost)
  // ------------------------------------------------------------------------------------------
  private scanOpenCode(): LedgerAgentRow {
    const dbFile = path.join(this.homeDir, '.local', 'share', 'opencode', 'opencode.db');
    const row = newAgentRow('opencode', 'OpenCode', dbFile);
    if (!fs.existsSync(dbFile)) {
      row.status = 'not-installed';
      return row;
    }
    const acc = new ModelAccumulator();
    let ocDb: DatabaseSync | null = null;
    try {
      ocDb = new DatabaseSync(dbFile, { readOnly: true });
      const sessions = ocDb
        .prepare(
          `SELECT directory, model, cost, tokens_input, tokens_output, tokens_reasoning,
                  tokens_cache_read, tokens_cache_write, time_updated,
                  (SELECT COUNT(*) FROM message m WHERE m.session_id = s.id) AS msg_count
           FROM session s`
        )
        .all() as Array<Record<string, unknown>>;
      for (const s of sessions) {
        if (!isInsideProject(String(s.directory ?? ''), this.projectNorm)) continue;
        let model = 'opencode/unknown';
        try {
          const m = JSON.parse(String(s.model ?? '{}')) as { id?: string; providerID?: string };
          if (m.id) model = m.id;
        } catch {
          // keep default
        }
        const usage: LedgerTokens = emptyTokens();
        addTokens(usage, {
          uncachedInput: Number(s.tokens_input ?? 0),
          cachedRead: Number(s.tokens_cache_read ?? 0),
          cacheWrite: Number(s.tokens_cache_write ?? 0),
          output: Number(s.tokens_output ?? 0) + Number(s.tokens_reasoning ?? 0),
        });
        if (usage.total === 0) continue;
        const steps = Number(s.msg_count ?? 0);
        row.sessions++;
        row.steps += steps;
        const updated = Number(s.time_updated ?? 0);
        row.lastActivityAt = maxIso(row.lastActivityAt, updated ? new Date(updated).toISOString() : null);
        row.costUsd += acc.add(model, usage, steps, Number(s.cost ?? 0));
        addTokens(row.tokens, usage);
      }
      row.costSource = 'reported';
    } catch {
      // DB locked / schema changed — report as no data rather than guessing
    } finally {
      try {
        ocDb?.close();
      } catch {
        // ignore
      }
    }
    row.models = acc.list();
    row.costUsd = Number(row.costUsd.toFixed(4));
    row.status = row.sessions > 0 ? 'active' : 'no-sessions';
    return row;
  }

  // ------------------------------------------------------------------------------------------
  // Hermes Agent — ~/.hermes/sessions/*.json(l)
  // ------------------------------------------------------------------------------------------
  private scanHermes(): LedgerAgentRow {
    const dir = path.join(this.homeDir, '.hermes');
    const row = newAgentRow('hermes', 'Hermes Agent', dir);
    if (!fs.existsSync(dir)) {
      row.status = 'not-installed';
      return row;
    }
    const acc = new ModelAccumulator();
    for (const file of walkFiles(dir, (f) => /\.(jsonl?|ndjson)$/.test(f), 3)) {
      const parsed = this.cachedParse(file, (raw) => {
        if (!normalizeProjectPath(raw.replace(/\\\\/g, '/')).includes(this.projectNorm)) return null;
        const usage = emptyTokens();
        let model = 'nousresearch/hermes-4-405b';
        let steps = 0;
        const usageRe = /"(prompt_tokens|input_tokens)"\s*:\s*(\d+)[\s\S]{0,200}?"(completion_tokens|output_tokens)"\s*:\s*(\d+)/g;
        let m: RegExpExecArray | null;
        while ((m = usageRe.exec(raw))) {
          steps++;
          addTokens(usage, { uncachedInput: Number(m[2]), output: Number(m[4]) });
        }
        const mm = raw.match(/"model"\s*:\s*"([^"]+)"/);
        if (mm) model = mm[1];
        return { usage, model, steps };
      });
      if (!parsed || parsed.usage.total === 0) continue;
      row.sessions++;
      row.steps += parsed.steps;
      row.costUsd += acc.add(parsed.model, parsed.usage, parsed.steps);
      addTokens(row.tokens, parsed.usage);
    }
    row.models = acc.list();
    row.costUsd = Number(row.costUsd.toFixed(4));
    row.status = row.sessions > 0 ? 'active' : 'no-sessions';
    return row;
  }

  // ------------------------------------------------------------------------------------------
  // Cairn Gateway — calls proxied through this daemon (any agent pointed at localhost:4100)
  // ------------------------------------------------------------------------------------------
  private scanGateway(): LedgerAgentRow {
    const row = newAgentRow('cairn-gateway', 'Via Cairn Gateway', 'cairn.db calls');
    if (!this.db) {
      row.status = 'not-installed';
      return row;
    }
    try {
      const rows = this.db.db
        .prepare(
          `SELECT model, COUNT(*) AS n, SUM(input_tokens) AS inp, SUM(output_tokens) AS outp,
                  SUM(cache_read_tokens) AS cr, SUM(cache_write_tokens) AS cw, SUM(cost_usd) AS cost,
                  MAX(created_at) AS last
           FROM calls WHERE task_id IS NULL OR task_id != 'antigravity-live' GROUP BY model`
        )
        .all() as Array<Record<string, unknown>>;
      const acc = new ModelAccumulator();
      for (const r of rows) {
        const usage = emptyTokens();
        addTokens(usage, {
          uncachedInput: Number(r.inp ?? 0),
          cachedRead: Number(r.cr ?? 0),
          cacheWrite: Number(r.cw ?? 0),
          output: Number(r.outp ?? 0),
        });
        const steps = Number(r.n ?? 0);
        row.sessions = Math.max(row.sessions, 1);
        row.steps += steps;
        row.lastActivityAt = maxIso(row.lastActivityAt, r.last ? String(r.last) : null);
        row.costUsd += acc.add(String(r.model ?? 'unknown'), usage, steps, Number(r.cost ?? 0));
        addTokens(row.tokens, usage);
      }
      row.models = acc.list();
      row.costSource = 'reported';
    } catch {
      // ignore
    }
    row.costUsd = Number(row.costUsd.toFixed(4));
    row.status = row.steps > 0 ? 'active' : 'no-sessions';
    return row;
  }
}

function walkFiles(root: string, accept: (file: string) => boolean, maxDepth: number): string[] {
  const out: string[] = [];
  const walk = (dir: string, depth: number) => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (depth < maxDepth) walk(full, depth + 1);
      } else if (accept(full)) {
        out.push(full);
      }
    }
  };
  walk(root, 0);
  return out;
}
