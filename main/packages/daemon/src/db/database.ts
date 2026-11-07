import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_CALIBRATION,
  redactSecrets,
  type CalibrationMultipliers,
  type CanonicalToolCall,
  type ProjectEstimateReport,
  type RiskLevel,
} from '@cairn/core';

export interface StoredCallRecord {
  id: string;
  runId: string;
  taskId: string | null;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  latencyMs: number;
  costUsd: number;
  cacheHit: number;
  promptPreview: string;
  responsePreview: string;
  createdAt: string;
}

export interface StoredActionRecord {
  id: string;
  runId: string;
  toolName: string;
  target: string;
  riskLevel: RiskLevel;
  preview: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked' | 'reverted';
  approvedBy: 'policy' | 'ide' | 'mobile' | 'cli' | null;
  gitCheckpointRef: string | null;
  rejectionNote?: string | null;
  createdAt: string;
}

export interface StoredCheckpointRecord {
  id: string;
  runId: string;
  stepId: string;
  gitTreeHash: string;
  gitRef: string;
  description: string;
  createdAt: string;
  reverted: number;
}

export interface StoredRemoteSession {
  id: string;
  deviceName: string;
  pairingToken: string;
  webauthnCredentialId: string | null;
  biometricVerified: number;
  pairedAt: string;
  lastActiveAt: string;
  revoked: number;
}

export class CairnDatabase {
  public readonly db: DatabaseSync;
  public readonly dbPath: string;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.join(process.cwd(), '.cairn', 'cairn.db');
    if (resolvedPath !== ':memory:') {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    }
    this.dbPath = resolvedPath;
    this.db = new DatabaseSync(resolvedPath);
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        repo_path TEXT NOT NULL,
        default_alias TEXT DEFAULT 'smart',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        task_id TEXT,
        agent TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        total_cost_usd REAL NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL,
        ended_at TEXT
      );

      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        task_id TEXT,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cache_write_tokens INTEGER NOT NULL DEFAULT 0,
        cache_read_tokens INTEGER NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL,
        cost_usd REAL NOT NULL,
        cache_hit INTEGER NOT NULL DEFAULT 0,
        prompt_preview TEXT,
        response_preview TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        target TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        preview TEXT NOT NULL,
        status TEXT NOT NULL,
        approved_by TEXT,
        git_checkpoint_ref TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        git_tree_hash TEXT NOT NULL,
        git_ref TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        reverted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS estimates (
        id TEXT PRIMARY KEY,
        project_name TEXT NOT NULL,
        prd_title TEXT NOT NULL,
        model_id TEXT NOT NULL,
        expected_tokens INTEGER NOT NULL,
        expected_cost_usd REAL NOT NULL,
        low_cost_usd REAL NOT NULL,
        high_cost_usd REAL NOT NULL,
        confidence TEXT NOT NULL,
        report_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS calibrations (
        scope TEXT PRIMARY KEY,
        retry_factor_low REAL NOT NULL,
        retry_factor_expected REAL NOT NULL,
        retry_factor_high REAL NOT NULL,
        cache_hit_ratio REAL NOT NULL,
        integration_overhead REAL NOT NULL,
        sample_size INTEGER NOT NULL DEFAULT 0,
        median_error_percent REAL DEFAULT 28.0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS remote_sessions (
        id TEXT PRIMARY KEY,
        device_name TEXT NOT NULL,
        pairing_token TEXT NOT NULL,
        webauthn_credential_id TEXT,
        biometric_verified INTEGER NOT NULL DEFAULT 0,
        paired_at TEXT NOT NULL,
        last_active_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS response_cache (
        cache_key TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        response_text TEXT NOT NULL,
        tool_calls_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);

    try {
      this.db.exec(`ALTER TABLE actions ADD COLUMN rejection_note TEXT`);
    } catch {
      // Column already exists
    }
  }

  public ensureRun(runId: string, projectId = 'default-project', agent = 'coding-agent', taskId?: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO runs (id, project_id, task_id, agent, status, total_cost_usd, total_tokens, started_at)
      VALUES (?, ?, ?, ?, 'active', 0, 0, ?)
    `);
    stmt.run(runId, projectId, taskId ?? null, agent, new Date().toISOString());
  }

  public recordCall(call: Omit<StoredCallRecord, 'createdAt'>): StoredCallRecord {
    const createdAt = new Date().toISOString();
    this.ensureRun(call.runId, 'default-project', 'coding-agent', call.taskId ?? undefined);

    const safePrompt = redactSecrets(call.promptPreview || '').slice(0, 600);
    const safeResponse = redactSecrets(call.responsePreview || '').slice(0, 600);

    const insert = this.db.prepare(`
      INSERT INTO calls (
        id, run_id, task_id, model, provider,
        input_tokens, output_tokens, cache_write_tokens, cache_read_tokens,
        latency_ms, cost_usd, cache_hit, prompt_preview, response_preview, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      call.id,
      call.runId,
      call.taskId,
      call.model,
      call.provider,
      call.inputTokens,
      call.outputTokens,
      call.cacheWriteTokens,
      call.cacheReadTokens,
      call.latencyMs,
      call.costUsd,
      call.cacheHit,
      safePrompt,
      safeResponse,
      createdAt
    );

    const totalTokens =
      call.inputTokens + call.outputTokens + call.cacheWriteTokens + call.cacheReadTokens;
    const updateRun = this.db.prepare(`
      UPDATE runs
      SET total_cost_usd = ROUND(total_cost_usd + ?, 6),
          total_tokens = total_tokens + ?
      WHERE id = ?
    `);
    updateRun.run(call.costUsd, totalTokens, call.runId);

    return {
      ...call,
      promptPreview: safePrompt,
      responsePreview: safeResponse,
      createdAt,
    };
  }

  public getSpendSummary(taskId?: string): {
    projectUsd: number;
    dailyUsd: number;
    taskUsd: number;
    totalTokens: number;
    dailyTokens: number;
    taskTokens: number;
    totalCalls: number;
    dailyCalls: number;
    taskCalls: number;
  } {
    const todayPrefix = new Date().toISOString().slice(0, 10);

    const projRow = this.db
      .prepare(
        `SELECT COALESCE(SUM(cost_usd), 0) as usd,
                COALESCE(SUM(input_tokens + output_tokens + cache_write_tokens + cache_read_tokens), 0) as tokens,
                COUNT(*) as calls
         FROM calls`
      )
      .get() as { usd: number; tokens: number; calls: number };

    const dailyRow = this.db
      .prepare(
        `SELECT COALESCE(SUM(cost_usd), 0) as usd,
                COALESCE(SUM(input_tokens + output_tokens + cache_write_tokens + cache_read_tokens), 0) as tokens,
                COUNT(*) as calls
         FROM calls WHERE created_at LIKE ?`
      )
      .get(`${todayPrefix}%`) as { usd: number; tokens: number; calls: number };

    let taskUsd = 0;
    let taskTokens = 0;
    let taskCalls = 0;
    if (taskId) {
      const tRow = this.db
        .prepare(
          `SELECT COALESCE(SUM(cost_usd), 0) as usd,
                  COALESCE(SUM(input_tokens + output_tokens + cache_write_tokens + cache_read_tokens), 0) as tokens,
                  COUNT(*) as calls
           FROM calls WHERE task_id = ?`
        )
        .get(taskId) as { usd: number; tokens: number; calls: number };
      taskUsd = tRow.usd;
      taskTokens = tRow.tokens;
      taskCalls = tRow.calls;
    }

    return {
      projectUsd: Number(projRow.usd.toFixed(6)),
      dailyUsd: Number(dailyRow.usd.toFixed(6)),
      taskUsd: Number(taskUsd.toFixed(6)),
      totalTokens: projRow.tokens,
      dailyTokens: dailyRow.tokens,
      taskTokens,
      totalCalls: projRow.calls,
      dailyCalls: dailyRow.calls,
      taskCalls,
    };
  }

  public getTaskActualMetrics(taskId: string): {
    actualTokens: number;
    actualCostUsd: number;
    actualCacheHitRatio: number;
    callCount: number;
  } {
    const row = this.db
      .prepare(
        `SELECT COALESCE(SUM(input_tokens + output_tokens + cache_write_tokens + cache_read_tokens), 0) as total_tokens,
                COALESCE(SUM(input_tokens + cache_write_tokens + cache_read_tokens), 0) as total_input,
                COALESCE(SUM(cache_read_tokens), 0) as cached_read,
                COALESCE(SUM(cost_usd), 0) as cost_usd,
                COUNT(*) as calls
         FROM calls WHERE task_id = ?`
      )
      .get(taskId) as {
      total_tokens: number;
      total_input: number;
      cached_read: number;
      cost_usd: number;
      calls: number;
    };

    const actualCacheHitRatio =
      row.total_input > 0 ? Number((row.cached_read / row.total_input).toFixed(3)) : 0;

    return {
      actualTokens: row.total_tokens,
      actualCostUsd: Number(row.cost_usd.toFixed(6)),
      actualCacheHitRatio,
      callCount: row.calls,
    };
  }

  public recordAction(action: Omit<StoredActionRecord, 'createdAt'>): StoredActionRecord {
    const createdAt = new Date().toISOString();
    this.ensureRun(action.runId);
    const stmt = this.db.prepare(`
      INSERT INTO actions (
        id, run_id, tool_name, target, risk_level, preview, status, approved_by, git_checkpoint_ref, rejection_note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      action.id,
      action.runId,
      action.toolName,
      action.target,
      action.riskLevel,
      redactSecrets(action.preview),
      action.status,
      action.approvedBy,
      action.gitCheckpointRef,
      action.rejectionNote ?? null,
      createdAt
    );
    return { ...action, rejectionNote: action.rejectionNote ?? null, createdAt };
  }

  public updateActionStatus(
    actionId: string,
    status: StoredActionRecord['status'],
    approvedBy: StoredActionRecord['approvedBy'],
    rejectionNote?: string | null
  ): void {
    this.db
      .prepare(`UPDATE actions SET status = ?, approved_by = ?, rejection_note = COALESCE(?, rejection_note) WHERE id = ?`)
      .run(status, approvedBy, rejectionNote ?? null, actionId);
  }

  public listRecentActions(limit = 30): StoredActionRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM actions ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r.id),
      runId: String(r.run_id),
      toolName: String(r.tool_name),
      target: String(r.target),
      riskLevel: r.risk_level as RiskLevel,
      preview: String(r.preview),
      status: r.status as StoredActionRecord['status'],
      approvedBy: (r.approved_by as StoredActionRecord['approvedBy']) ?? null,
      gitCheckpointRef: r.git_checkpoint_ref ? String(r.git_checkpoint_ref) : null,
      rejectionNote: r.rejection_note ? String(r.rejection_note) : null,
      createdAt: String(r.created_at),
    }));
  }

  public listRecentCalls(limit = 30): StoredCallRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM calls ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r.id),
      runId: String(r.run_id),
      taskId: r.task_id ? String(r.task_id) : null,
      model: String(r.model),
      provider: String(r.provider),
      inputTokens: Number(r.input_tokens),
      outputTokens: Number(r.output_tokens),
      cacheWriteTokens: Number(r.cache_write_tokens),
      cacheReadTokens: Number(r.cache_read_tokens),
      latencyMs: Number(r.latency_ms),
      costUsd: Number(r.cost_usd),
      cacheHit: Number(r.cache_hit),
      promptPreview: String(r.prompt_preview ?? ''),
      responsePreview: String(r.response_preview ?? ''),
      createdAt: String(r.created_at),
    }));
  }

  public recordCheckpoint(cp: Omit<StoredCheckpointRecord, 'createdAt' | 'reverted'>): StoredCheckpointRecord {
    const createdAt = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO checkpoints (id, run_id, step_id, git_tree_hash, git_ref, description, created_at, reverted)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `)
      .run(cp.id, cp.runId, cp.stepId, cp.gitTreeHash, cp.gitRef, cp.description, createdAt);
    return { ...cp, createdAt, reverted: 0 };
  }

  public listCheckpoints(limit = 25): StoredCheckpointRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM checkpoints ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r.id),
      runId: String(r.run_id),
      stepId: String(r.step_id),
      gitTreeHash: String(r.git_tree_hash),
      gitRef: String(r.git_ref),
      description: String(r.description),
      createdAt: String(r.created_at),
      reverted: Number(r.reverted),
    }));
  }

  public markCheckpointReverted(idOrStepId: string): void {
    this.db
      .prepare(`UPDATE checkpoints SET reverted = 1 WHERE id = ? OR step_id = ?`)
      .run(idOrStepId, idOrStepId);
  }

  public saveEstimate(report: ProjectEstimateReport): void {
    this.db
      .prepare(`
        INSERT OR REPLACE INTO estimates (
          id, project_name, prd_title, model_id,
          expected_tokens, expected_cost_usd, low_cost_usd, high_cost_usd,
          confidence, report_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        report.id,
        report.projectName,
        report.prdTitle,
        report.modelId,
        report.totals.tokens.expected,
        report.totals.costUsd.expected,
        report.totals.costUsd.low,
        report.totals.costUsd.high,
        report.confidence,
        JSON.stringify(report),
        report.createdAt
      );
  }

  public getLatestEstimate(): ProjectEstimateReport | null {
    const row = this.db
      .prepare(`SELECT report_json FROM estimates ORDER BY created_at DESC LIMIT 1`)
      .get() as { report_json: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.report_json) as ProjectEstimateReport;
    } catch {
      return null;
    }
  }

  public getCalibration(scope = 'default'): CalibrationMultipliers {
    const row = this.db
      .prepare(`SELECT * FROM calibrations WHERE scope = ?`)
      .get(scope) as Record<string, unknown> | undefined;
    if (!row) return DEFAULT_CALIBRATION;
    return {
      retryFactorLow: Number(row.retry_factor_low),
      retryFactorExpected: Number(row.retry_factor_expected),
      retryFactorHigh: Number(row.retry_factor_high),
      cacheHitRatio: Number(row.cache_hit_ratio),
      integrationOverhead: Number(row.integration_overhead),
      sampleSize: Number(row.sample_size),
      medianErrorPercent: Number(row.median_error_percent),
    };
  }

  /**
   * CAL-1..CAL-3: Updates calibration multipliers after a task completes based on actual vs estimated tokens/cost.
   */
  public recordTaskCalibration(params: {
    scope?: string;
    estimatedTokens: number;
    actualTokens: number;
    actualCacheHitRatio?: number;
  }): CalibrationMultipliers {
    const scope = params.scope ?? 'default';
    const current = this.getCalibration(scope);
    const ratio =
      params.estimatedTokens > 0
        ? Math.max(0.4, Math.min(3.0, params.actualTokens / params.estimatedTokens))
        : 1.0;

    // Exponential moving average (alpha = 0.25) so multipliers adapt smoothly without wild swings
    const alpha = 0.25;
    const newExpectedRetry = Number(
      (current.retryFactorExpected * (1 - alpha) + current.retryFactorExpected * ratio * alpha).toFixed(3)
    );
    const newLowRetry = Number(Math.max(1.05, newExpectedRetry * 0.68).toFixed(3));
    const newHighRetry = Number((newExpectedRetry * 1.5).toFixed(3));
    const newCacheRatio =
      params.actualCacheHitRatio !== undefined
        ? Number((current.cacheHitRatio * (1 - alpha) + params.actualCacheHitRatio * alpha).toFixed(3))
        : current.cacheHitRatio;

    const taskErrorPercent =
      params.estimatedTokens > 0
        ? Math.abs((params.actualTokens - params.estimatedTokens) / params.estimatedTokens) * 100
        : 0;
    const prevError = current.medianErrorPercent ?? 28.0;
    const newMedianError = Number((prevError * (1 - alpha) + taskErrorPercent * alpha).toFixed(1));
    const newSampleSize = current.sampleSize + 1;

    this.db
      .prepare(`
        INSERT OR REPLACE INTO calibrations (
          scope, retry_factor_low, retry_factor_expected, retry_factor_high,
          cache_hit_ratio, integration_overhead, sample_size, median_error_percent, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        scope,
        newLowRetry,
        newExpectedRetry,
        newHighRetry,
        newCacheRatio,
        current.integrationOverhead,
        newSampleSize,
        newMedianError,
        new Date().toISOString()
      );

    return {
      retryFactorLow: newLowRetry,
      retryFactorExpected: newExpectedRetry,
      retryFactorHigh: newHighRetry,
      cacheHitRatio: newCacheRatio,
      integrationOverhead: current.integrationOverhead,
      sampleSize: newSampleSize,
      medianErrorPercent: newMedianError,
    };
  }

  public createRemoteSession(deviceName: string, pairingToken: string): StoredRemoteSession {
    const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    this.db
      .prepare(`
        INSERT INTO remote_sessions (id, device_name, pairing_token, webauthn_credential_id, biometric_verified, paired_at, last_active_at, revoked)
        VALUES (?, ?, ?, NULL, 0, ?, ?, 0)
      `)
      .run(id, deviceName, pairingToken, now, now);
    return {
      id,
      deviceName,
      pairingToken,
      webauthnCredentialId: null,
      biometricVerified: 0,
      pairedAt: now,
      lastActiveAt: now,
      revoked: 0,
    };
  }

  public verifyRemoteBiometric(pairingToken: string, credentialId: string): boolean {
    const res = this.db
      .prepare(`
        UPDATE remote_sessions
        SET biometric_verified = 1, webauthn_credential_id = ?, last_active_at = ?
        WHERE pairing_token = ? AND revoked = 0
      `)
      .run(credentialId, new Date().toISOString(), pairingToken);
    return Number(res.changes) > 0;
  }

  public isValidRemoteToken(token: string): boolean {
    if (!token) return false;
    const row = this.db
      .prepare(`SELECT id FROM remote_sessions WHERE pairing_token = ? AND revoked = 0 LIMIT 1`)
      .get(token) as { id: string } | undefined;
    if (row) {
      this.db
        .prepare(`UPDATE remote_sessions SET last_active_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), row.id);
      return true;
    }
    return false;
  }

  public isBiometricVerified(token: string): boolean {
    if (!token) return false;
    const row = this.db
      .prepare(
        `SELECT biometric_verified FROM remote_sessions WHERE pairing_token = ? AND revoked = 0 LIMIT 1`
      )
      .get(token) as { biometric_verified: number } | undefined;
    return Number(row?.biometric_verified ?? 0) === 1;
  }

  public getCachedResponse(cacheKey: string): {
    content: string;
    toolCalls: CanonicalToolCall[];
    model: string;
  } | null {
    const now = Date.now();
    const row = this.db
      .prepare(
        `SELECT model, response_text, tool_calls_json, expires_at FROM response_cache WHERE cache_key = ?`
      )
      .get(cacheKey) as
      | { model: string; response_text: string; tool_calls_json: string; expires_at: number }
      | undefined;

    if (!row) return null;
    if (Number(row.expires_at) < now) {
      this.db.prepare(`DELETE FROM response_cache WHERE cache_key = ?`).run(cacheKey);
      return null;
    }
    let toolCalls: CanonicalToolCall[] = [];
    try {
      toolCalls = JSON.parse(row.tool_calls_json || '[]') as CanonicalToolCall[];
    } catch {
      toolCalls = [];
    }
    return {
      content: String(row.response_text),
      toolCalls,
      model: String(row.model),
    };
  }

  public setCachedResponse(params: {
    cacheKey: string;
    model: string;
    content: string;
    toolCalls: CanonicalToolCall[];
    ttlMs?: number;
  }): void {
    const now = Date.now();
    const expiresAt = now + (params.ttlMs ?? 24 * 60 * 60 * 1000);
    this.db
      .prepare(
        `INSERT OR REPLACE INTO response_cache (cache_key, model, response_text, tool_calls_json, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        params.cacheKey,
        params.model,
        params.content,
        JSON.stringify(params.toolCalls ?? []),
        new Date(now).toISOString(),
        expiresAt
      );

    // Keep cache bounded to 500 entries (LRU/FIFO pruning)
    this.db.exec(`
      DELETE FROM response_cache
      WHERE cache_key NOT IN (
        SELECT cache_key FROM response_cache ORDER BY expires_at DESC LIMIT 500
      )
    `);
  }

  public close(): void {
    this.db.close();
  }
}
