import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  BUILTIN_MODELS,
  CairnPolicySchema,
  buildProjectEstimate,
  calculateCallCostUsd,
  classifyToolAction,
  detectPromptInjection,
  estimateTokensFromText,
  parsePolicyYaml,
  resolveModelAndProvider,
  type AgentHarnessType,
  type CairnPolicy,
  type CanonicalToolCall,
  type CanonicalUsage,
} from '@cairn/core';
import { CairnDatabase, type StoredActionRecord } from '../db/database.js';
import { GitShadowEngine } from '../safety/git-shadow.js';
import { BudgetAndLoopManager } from '../budget/manager.js';
import { scanRepository } from '../estimator/scanner.js';
import { OsWindowBridge } from '../os-bridge/win32.js';
import { renderMobileRemoteHtml } from '../remote/mobile-ui.js';
import { AntigravityLiveSync } from '../telemetry/antigravity-sync.js';
import { ProjectLedgerService } from '../telemetry/project-ledger.js';
import { CIRRASCALE_MODELS, ProjectIntelService } from '../intel/project-intel.js';
import { dispatchModelCall } from './providers.js';

export interface PendingApprovalItem {
  id: string;
  runId: string;
  toolName: string;
  target: string;
  riskLevel: string;
  preview: string;
  createdAt: string;
  resolve: (decision: {
    status: 'approved' | 'rejected';
    source: 'ide' | 'mobile' | 'cli' | 'policy';
    note?: string;
  }) => void;
}

export interface CairnServerOptions {
  port?: number;
  host?: string;
  repoDir?: string;
  policyPath?: string;
  dbPath?: string;
  approvalTimeoutMs?: number;
  autoApproveOnTimeout?: boolean;
}

export class CairnDaemonServer {
  public readonly db: CairnDatabase;
  public readonly gitShadow: GitShadowEngine;
  public readonly budgetManager: BudgetAndLoopManager;
  public readonly osBridge: OsWindowBridge;
  public readonly antigravitySync: AntigravityLiveSync;
  public readonly projectLedger: ProjectLedgerService;
  public readonly projectIntel: ProjectIntelService;
  public readonly repoDir: string;
  public readonly policyPath: string;
  public readonly pairingToken: string;

  private policy: CairnPolicy;
  private httpServer?: http.Server;
  private wss?: WebSocketServer;
  private readonly wsClients = new Set<WebSocket>();
  private readonly pendingApprovals = new Map<string, PendingApprovalItem>();
  private readonly exactResponseCache = new Map<string, { content: string; toolCalls: CanonicalToolCall[]; model: string }>();
  private readonly steeringQueue: string[] = [];
  private readonly approvalTimeoutMs: number;
  private readonly autoApproveOnTimeout: boolean;
  private readonly enableAntigravitySync: boolean;

  constructor(private readonly options: CairnServerOptions = {}) {
    this.repoDir = path.resolve(options.repoDir ?? process.cwd());
    this.policyPath = path.resolve(options.policyPath ?? path.join(this.repoDir, 'cairn.yaml'));
    this.db = new CairnDatabase(options.dbPath);
    this.gitShadow = new GitShadowEngine(this.repoDir, this.db);
    this.budgetManager = new BudgetAndLoopManager(this.db);
    this.osBridge = new OsWindowBridge(this.repoDir);
    this.pairingToken = crypto.randomBytes(12).toString('hex');
    this.approvalTimeoutMs = options.approvalTimeoutMs ?? 45_000;
    this.autoApproveOnTimeout = options.autoApproveOnTimeout ?? false;
    this.enableAntigravitySync = options.dbPath !== ':memory:';

    this.policy = this.loadPolicy();
    this.antigravitySync = new AntigravityLiveSync(
      this.db,
      () => this.policy,
      this.repoDir,
      (liveState) => {
        this.broadcastEvent('antigravity_step', {
          liveState,
          spend: this.db.getSpendSummary(),
        });
      }
    );
    this.db.createRemoteSession('Primary Mobile Remote', this.pairingToken);
    this.projectLedger = new ProjectLedgerService(this.repoDir, this.db);
    this.projectIntel = new ProjectIntelService({
      db: this.db,
      getPolicy: () => this.policy,
      antigravitySync: this.antigravitySync,
      projectLedger: this.projectLedger,
      repoDir: this.repoDir,
    });
    this.setupPolicyHotReload();
  }

  public getPolicy(): CairnPolicy {
    return this.policy;
  }

  private loadPolicy(): CairnPolicy {
    if (fs.existsSync(this.policyPath)) {
      const content = fs.readFileSync(this.policyPath, 'utf-8');
      const { policy } = parsePolicyYaml(content);
      if (policy) return policy;
    }
    return CairnPolicySchema.parse({});
  }

  private setupPolicyHotReload(): void {
    if (!fs.existsSync(this.policyPath)) return;
    try {
      fs.watchFile(this.policyPath, { interval: 1500 }, () => {
        try {
          const content = fs.readFileSync(this.policyPath, 'utf-8');
          const { policy } = parsePolicyYaml(content);
          if (policy) {
            this.policy = policy;
            this.broadcastEvent('policy_reloaded', { policy: this.policy });
          }
        } catch {
          // Keep existing valid policy on syntax error
        }
      });
    } catch {
      // Ignore watcher errors in restricted environments
    }
  }

  public getLanIp(): string {
    const nets = os.networkInterfaces();
    const virtualRegex = /(vethernet|wsl|vmware|virtualbox|hyper-v|docker|pseudo|loopback|teredo|npcap|tap|tun)/i;
    const candidates: Array<{ name: string; address: string; score: number }> = [];

    for (const name of Object.keys(nets)) {
      const isVirtualName = virtualRegex.test(name);
      for (const net of nets[name] ?? []) {
        if (net.family === 'IPv4' && !net.internal) {
          const addr = net.address;
          if (addr.startsWith('127.') || addr.startsWith('169.254.')) {
            continue;
          }
          let score = 0;
          const lowerName = name.toLowerCase();
          if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan')) {
            score += 100;
          } else if (lowerName.includes('ethernet') || lowerName.includes('eth') || lowerName.includes('en0')) {
            score += 80;
          }
          if (addr.startsWith('192.168.')) {
            score += 50;
          } else if (addr.startsWith('10.')) {
            score += 40;
          }
          if (isVirtualName) {
            score -= 1000;
          }
          candidates.push({ name, address: addr, score });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].address;
    }
    return '127.0.0.1';
  }

  public broadcastEvent(type: string, payload: unknown): void {
    const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    for (const client of this.wsClients) {
      if (client.readyState === 1) {
        client.send(msg);
      }
    }
  }

  public async start(): Promise<{ port: number; host: string; remoteUrl: string }> {
    const port = this.options.port ?? 4100;
    const host = this.options.host ?? '0.0.0.0';

    this.httpServer = http.createServer((req, res) => {
      this.handleHttpRequest(req, res).catch((err) => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: (err as Error).message } }));
        }
      });
    });

    this.wss = new WebSocketServer({ server: this.httpServer, path: '/ws' });
    this.wss.on('connection', (ws) => {
      this.wsClients.add(ws);
      ws.send(
        JSON.stringify({
          type: 'connected',
          payload: {
            spend: this.db.getSpendSummary(),
            policy: this.policy,
            pairingToken: this.pairingToken,
          },
        })
      );

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(String(raw));
          if (msg.type === 'approve_action' && msg.actionId) {
            this.resolvePendingApproval(
              msg.actionId,
              msg.decision ?? 'approved',
              msg.source ?? 'ide',
              typeof msg.note === 'string' ? msg.note : undefined
            );
          }
        } catch {
          // Ignore malformed WS message
        }
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
    });

    await new Promise<void>((resolve) => {
      this.httpServer!.listen(port, host, () => resolve());
    });

    if (this.enableAntigravitySync) {
      this.antigravitySync.startPolling(2000);
    }

    const address = this.httpServer.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    const lanIp = this.getLanIp();
    const remoteUrl = `http://${lanIp}:${actualPort}/remote?token=${this.pairingToken}`;

    return { port: actualPort, host, remoteUrl };
  }

  public async stop(): Promise<void> {
    this.antigravitySync.stopPolling();
    fs.unwatchFile(this.policyPath);
    for (const client of this.wsClients) {
      client.close();
    }
    if (this.wss) {
      await new Promise<void>((resolve) => this.wss!.close(() => resolve()));
    }
    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
    }
    this.db.close();
  }

  public resolvePendingApproval(
    actionId: string,
    decision: 'approved' | 'rejected',
    source: 'ide' | 'mobile' | 'cli' | 'policy',
    note?: string
  ): boolean {
    const item = this.pendingApprovals.get(actionId);
    if (!item) return false;
    this.pendingApprovals.delete(actionId);
    item.resolve({ status: decision, source, note });
    this.broadcastEvent('approval_resolved', { actionId, decision, source, note });
    return true;
  }

  private isLocalhostRequest(req: http.IncomingMessage): boolean {
    if (req.headers['x-cairn-enforce-auth'] === '1') {
      return false;
    }
    const addr = req.socket?.remoteAddress ?? '';
    return (
      addr === '127.0.0.1' ||
      addr === '::1' ||
      addr === '::ffff:127.0.0.1' ||
      addr === ''
    );
  }

  private isAuthorizedRequest(req: http.IncomingMessage, parsedUrl: URL): boolean {
    if (this.isLocalhostRequest(req)) {
      return true;
    }
    const headerToken =
      typeof req.headers['x-cairn-token'] === 'string' ? req.headers['x-cairn-token'].trim() : '';
    const queryToken = (parsedUrl.searchParams.get('token') ?? '').trim();
    const token = headerToken || queryToken;
    if (!token) return false;
    return token === this.pairingToken || this.db.isValidRemoteToken(token);
  }

  public savePolicy(updatedPolicy: CairnPolicy): void {
    this.policy = CairnPolicySchema.parse(updatedPolicy);
    this.budgetManager.resetState();
    try {
      const yamlStr = YAML.stringify(this.policy);
      fs.writeFileSync(this.policyPath, yamlStr, 'utf-8');
    } catch {
      // Ignore write failures in read-only test sandboxes
    }
    this.broadcastEvent('policy_updated', { policy: this.policy });
  }

  private async readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  }

  private sendJson(res: http.ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    });
    res.end(JSON.stringify(data));
  }

  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      this.sendJson(res, 200, { ok: true });
      return;
    }

    const parsedUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    let pathname = parsedUrl.pathname;

    // Enforce LAN pairing token security on /api/* endpoints for non-localhost requests
    if (pathname.startsWith('/api/') && !this.isAuthorizedRequest(req, parsedUrl)) {
      this.sendJson(res, 401, {
        ok: false,
        error: {
          type: 'cairn_unauthorized_remote',
          message: 'Valid x-cairn-token header or ?token= pairing parameter is required for remote LAN access.',
        },
      });
      return;
    }

    // GW-13: Extract task attribution prefix /t/:taskId/v1/...
    let pathTaskId: string | undefined;
    const taskPrefixMatch = pathname.match(/^\/t\/([^/]+)(\/v1\/.*)$/);
    if (taskPrefixMatch) {
      pathTaskId = decodeURIComponent(taskPrefixMatch[1]);
      pathname = taskPrefixMatch[2];
    }

    // 1. Control Plane & Mobile Remote PWA UI (/ or /remote) and Brand Logo Assets
    if (req.method === 'GET' && (pathname === '/favicon.svg' || pathname === '/favicon.ico')) {
      const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 32" fill="none">
        <rect width="36" height="32" rx="7" fill="#000000"/>
        <path d="M16.6 5.2C17.2 4.3 18.8 4.3 19.4 5.2L22.6 10.2C23.2 11.1 22.5 12.2 21.4 12.2H14.6C13.5 12.2 12.8 11.1 13.4 10.2L16.6 5.2Z" fill="#FFFFFF"/>
        <path d="M11.6 14.5C12.0 13.9 12.6 13.5 13.4 13.5H22.6C23.4 13.5 24.0 13.9 24.4 14.5L26.8 18.3C27.4 19.2 26.7 20.4 25.6 20.4H10.4C9.3 20.4 8.6 19.2 9.2 18.3L11.6 14.5Z" fill="#FFFFFF"/>
        <path d="M7.8 22.6C8.2 22.0 8.8 21.6 9.6 21.6H26.4C27.2 21.6 27.8 22.0 28.2 22.6L31.0 26.8C31.6 27.7 30.9 28.9 29.8 28.9H6.2C5.1 28.9 4.4 27.7 5.0 26.8L7.8 22.6Z" fill="#0069FD"/>
      </svg>`;
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
      res.end(faviconSvg);
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/brand/')) {
      const fileName = path.basename(pathname);
      const allowedBrandFiles: Record<string, string> = {
        'cairn-icon.jpg': 'image/jpeg',
        'cairn-wordmark.jpg': 'image/jpeg',
        'cairn-combined.png': 'image/png',
        'cairn-icon.png': 'image/png',
      };
      const mimeType = allowedBrandFiles[fileName];
      if (mimeType) {
        const candidates = [
          path.join(this.repoDir, 'assets', 'brand', fileName),
          path.join(process.cwd(), 'assets', 'brand', fileName),
        ];
        const foundPath = candidates.find((p) => fs.existsSync(p));
        if (foundPath) {
          res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=3600' });
          res.end(fs.readFileSync(foundPath));
          return;
        }
      }
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/remote')) {
      const token = parsedUrl.searchParams.get('token') ?? this.pairingToken;
      const html = renderMobileRemoteHtml({
        pairingToken: token,
        projectName: this.policy.project,
        lanUrl: `http://${this.getLanIp()}:${(this.httpServer?.address() as { port: number })?.port ?? 4100}`,
      });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // 2. Gateway: /v1/models (GW-1)
    if (req.method === 'GET' && pathname === '/v1/models') {
      const models = Object.values(BUILTIN_MODELS).map((m) => ({
        id: m.id,
        object: 'model',
        created: 1700000000,
        owned_by: m.provider,
        capabilities: m,
      }));
      this.sendJson(res, 200, { object: 'list', data: models });
      return;
    }

    // 3. Gateway: OpenAI /v1/chat/completions (GW-1) and Anthropic /v1/messages (GW-2)
    if (
      req.method === 'POST' &&
      (pathname === '/v1/chat/completions' || pathname === '/v1/messages')
    ) {
      const format = pathname === '/v1/messages' ? 'anthropic' : 'openai';
      await this.handleModelGatewayCall(req, res, format, pathTaskId);
      return;
    }

    // 4. Daemon REST API: Status
    if (req.method === 'GET' && pathname === '/api/status') {
      if (this.enableAntigravitySync) {
        this.antigravitySync.syncNow();
      }
      let latestEstimate = this.db.getLatestEstimate();
      if (!latestEstimate) {
        const defaultPrdPath = path.join(this.repoDir, 'Cairn Product Requirements Document.md');
        if (fs.existsSync(defaultPrdPath)) {
          try {
            const prdContent = fs.readFileSync(defaultPrdPath, 'utf-8');
            const repoSummary = scanRepository(this.repoDir);
            latestEstimate = buildProjectEstimate({
              projectName: this.policy.project,
              prdContent,
              modelOrAlias: this.policy.routing.default,
              aliases: this.policy.aliases,
              repoSummary,
              multipliers: this.db.getCalibration(),
            });
            this.db.saveEstimate(latestEstimate);
          } catch {
            // Ignore auto-estimate failure
          }
        }
      }
      const taskId = parsedUrl.searchParams.get('taskId') ?? undefined;
      this.sendJson(res, 200, {
        ok: true,
        project: this.policy.project,
        spend: this.db.getSpendSummary(taskId),
        policy: this.policy,
        antigravityLive: this.antigravitySync.getLiveState(),
        projectLedger: this.projectLedger.getLedger(),
        steeringQueue: this.steeringQueue,
        pendingApprovals: Array.from(this.pendingApprovals.values()).map((p) => ({
          id: p.id,
          runId: p.runId,
          toolName: p.toolName,
          target: p.target,
          riskLevel: p.riskLevel,
          preview: p.preview,
          createdAt: p.createdAt,
        })),
        recentCalls: this.db.listRecentCalls(20),
        recentActions: this.db.listRecentActions(20),
        checkpoints: this.db.listCheckpoints(15),
        latestEstimate,
        calibration: this.db.getCalibration(),
        remotePairUrl: `http://${this.getLanIp()}:${(this.httpServer?.address() as { port: number })?.port ?? 4100}/remote?token=${this.pairingToken}`,
      });
      return;
    }

    // 4b. Daemon REST API: Cross-Agent Project Ledger (Antigravity + Codex + Claude Code + OpenCode + Hermes)
    if (req.method === 'GET' && pathname === '/api/project-ledger') {
      const refresh = parsedUrl.searchParams.get('refresh') === '1';
      this.sendJson(res, 200, {
        ok: true,
        projectLedger: this.projectLedger.getLedger(refresh ? 0 : 5000),
      });
      return;
    }

    // 4c. Daemon REST API: Project Intelligence AI Query & History
    if (req.method === 'GET' && pathname === '/api/intel/history') {
      this.sendJson(res, 200, {
        ok: true,
        models: CIRRASCALE_MODELS,
        history: this.projectIntel.getRecentHistory(15),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/intel/query') {
      const body = await this.readJsonBody(req);
      const query = String(body.query ?? '').trim();
      const model = body.model ? String(body.model).trim() : undefined;
      const taskId = body.taskId ? String(body.taskId).trim() : undefined;
      const history = Array.isArray(body.history)
        ? (body.history as Array<{ role: 'user' | 'assistant'; content: string }>)
        : undefined;
      const localFallbackOnly = Boolean(body.localFallbackOnly);

      const intelRes = await this.projectIntel.ask({
        query,
        model,
        taskId,
        history,
        localFallbackOnly,
      });
      this.broadcastEvent('intel_response', intelRes);
      this.sendJson(res, 200, intelRes);
      return;
    }

    // 5. Daemon REST API: Estimate PRD
    if (req.method === 'POST' && pathname === '/api/estimate') {
      const body = await this.readJsonBody(req);
      const rawPrdPath = body.prdPath ? String(body.prdPath) : 'Cairn Product Requirements Document.md';
      const resolvedPrdPath = path.isAbsolute(rawPrdPath)
        ? rawPrdPath
        : path.join(this.repoDir, rawPrdPath);
      const prdContent = body.prdContent
        ? String(body.prdContent)
        : fs.existsSync(resolvedPrdPath)
        ? fs.readFileSync(resolvedPrdPath, 'utf-8')
        : '# Empty PRD';
      const modelOrAlias = String(body.model ?? this.policy.routing.default);
      const repoSummary = scanRepository(this.repoDir);
      const multipliers = this.db.getCalibration();

      const report = buildProjectEstimate({
        projectName: this.policy.project,
        prdContent,
        modelOrAlias,
        aliases: this.policy.aliases,
        repoSummary,
        multipliers,
      });

      this.db.saveEstimate(report);
      this.broadcastEvent('estimate_created', report);
      this.sendJson(res, 200, { ok: true, report });
      return;
    }

    // 5b. Daemon REST API: Switch Active Agent / IDE Harness & Model (Recalculates Live Session Cost + PRD Forecast)
    if (req.method === 'POST' && pathname === '/api/active-model') {
      const body = await this.readJsonBody(req);
      const harness = body.harness ? (String(body.harness) as AgentHarnessType) : undefined;
      const modelOrAlias = body.model ? String(body.model) : '';
      const liveState = this.antigravitySync.setActiveModel(modelOrAlias, harness, 'manual');
      this.policy.routing.default = liveState.activeModelId;

      // Also recalculate the PRD estimate for the selected active model
      const defaultPrdPath = path.join(this.repoDir, 'Cairn Product Requirements Document.md');
      const prdContent = fs.existsSync(defaultPrdPath)
        ? fs.readFileSync(defaultPrdPath, 'utf-8')
        : '# Project PRD';
      const repoSummary = scanRepository(this.repoDir);
      const report = buildProjectEstimate({
        projectName: this.policy.project,
        prdContent,
        modelOrAlias: liveState.activeModelId,
        aliases: this.policy.aliases,
        repoSummary,
        multipliers: this.db.getCalibration(),
      });
      this.db.saveEstimate(report);

      this.broadcastEvent('active_model_changed', {
        activeHarness: liveState.activeHarness,
        activeHarnessLabel: liveState.activeHarnessLabel,
        activeModelId: liveState.activeModelId,
        activeModelDisplayName: liveState.activeModelDisplayName,
        spend: this.db.getSpendSummary(),
        report,
      });

      this.sendJson(res, 200, {
        ok: true,
        activeHarness: liveState.activeHarness,
        activeHarnessLabel: liveState.activeHarnessLabel,
        activeModelId: liveState.activeModelId,
        activeModelDisplayName: liveState.activeModelDisplayName,
        spend: this.db.getSpendSummary(),
        antigravityLive: liveState,
        report,
      });
      return;
    }

    // 5c. Daemon REST API: Policy Read & Live Update (GET /api/policy & PUT /api/policy)
    if (req.method === 'GET' && pathname === '/api/policy') {
      this.sendJson(res, 200, { ok: true, policy: this.policy });
      return;
    }

    if ((req.method === 'PUT' || req.method === 'POST') && pathname === '/api/policy') {
      const body = await this.readJsonBody(req);
      if (typeof body.yaml === 'string') {
        const parsed = parsePolicyYaml(body.yaml);
        if (!parsed.policy) {
          this.sendJson(res, 400, { ok: false, errors: parsed.errors });
          return;
        }
        this.savePolicy(parsed.policy);
        this.sendJson(res, 200, { ok: true, policy: this.policy });
        return;
      }
      const candidate = (body.policy ?? body) as Record<string, unknown>;
      const merged = {
        ...this.policy,
        ...candidate,
        budgets: {
          ...this.policy.budgets,
          ...((candidate.budgets as Record<string, unknown>) ?? {}),
        },
        routing: {
          ...this.policy.routing,
          ...((candidate.routing as Record<string, unknown>) ?? {}),
        },
        aliases: {
          ...this.policy.aliases,
          ...((candidate.aliases as Record<string, string>) ?? {}),
        },
        actions: {
          ...this.policy.actions,
          ...((candidate.actions as Record<string, unknown>) ?? {}),
        },
        remote: {
          ...this.policy.remote,
          ...((candidate.remote as Record<string, unknown>) ?? {}),
        },
      };
      // A budget scope sent as null removes that cap (opt-out).
      for (const [scope, value] of Object.entries(merged.budgets as Record<string, unknown>)) {
        if (value === null) delete (merged.budgets as Record<string, unknown>)[scope];
      }
      const validated = CairnPolicySchema.safeParse(merged);
      if (!validated.success) {
        this.sendJson(res, 400, {
          ok: false,
          errors: validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        });
        return;
      }
      this.savePolicy(validated.data);
      this.sendJson(res, 200, { ok: true, policy: this.policy });
      return;
    }

    // 6. Daemon REST API: Approve / Reject held action (with optional rejection note)
    const approvalMatch = pathname.match(/^\/api\/approvals\/([^/]+)$/);
    if (req.method === 'POST' && approvalMatch) {
      const actionId = approvalMatch[1];
      const body = await this.readJsonBody(req);
      const decision = body.decision === 'rejected' ? 'rejected' : 'approved';
      const source = (body.source as 'ide' | 'mobile' | 'cli') ?? 'ide';
      const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : undefined;
      const resolved = this.resolvePendingApproval(actionId, decision, source, note);
      this.sendJson(res, 200, { ok: resolved, actionId, decision, note });
      return;
    }

    // 7. Daemon REST API: Git Shadow Undo, Manual Snapshot & Diff Preview
    const cpDiffMatch = pathname.match(/^\/api\/checkpoints\/([^/]+)\/diff$/);
    if (req.method === 'GET' && cpDiffMatch) {
      const cpId = decodeURIComponent(cpDiffMatch[1]);
      const diffResult = this.gitShadow.getCheckpointDiff(cpId === 'latest' ? undefined : cpId);
      this.sendJson(res, diffResult.found ? 200 : 404, diffResult);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/snapshot') {
      const body = await this.readJsonBody(req);
      const description = String(body.description ?? 'Manual workspace snapshot');
      const cp = this.gitShadow.createShadowSnapshot({
        runId: 'manual_snapshot',
        stepId: `snap_${Date.now()}`,
        description,
      });
      this.sendJson(res, 200, { ok: Boolean(cp), checkpoint: cp });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/undo') {
      const body = await this.readJsonBody(req);
      const id = body.id ? String(body.id) : undefined;
      const result = this.gitShadow.restoreShadowSnapshot(id);
      if (result.restored) {
        this.broadcastEvent('checkpoint_reverted', result.checkpoint);
      }
      this.sendJson(res, result.restored ? 200 : 404, result);
      return;
    }

    // 8. Daemon REST API: Remote Agent Steering & Live Prompt Execution
    if (req.method === 'POST' && pathname === '/api/remote/steer') {
      const body = await this.readJsonBody(req);
      const instruction = String(body.instruction ?? '').trim();
      const forwardToIde = body.forwardToIde !== undefined ? Boolean(body.forwardToIde) : true;
      let exchangeItems: unknown[] = [];

      if (instruction) {
        this.db.recordAction({
          id: `steer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          runId: 'remote_steer',
          toolName: 'steer_agent',
          target: forwardToIde ? 'ide_window' : 'next_agent_turn',
          riskLevel: 'read-only',
          preview: instruction,
          status: 'approved',
          approvedBy: 'mobile',
          gitCheckpointRef: null,
        });

        // 1) Try to deliver straight into the IDE chat window. Only fall back to the gateway
        //    steering queue when direct delivery is off or failed — otherwise the prompt would
        //    sit "queued" forever, since IDEs like Antigravity don't route LLM calls via Cairn.
        let delivery: 'delivered' | 'queued' | 'failed' = 'queued';
        let deliveryDetail = 'Not sent to an IDE window yet; queued for the next model request routed through Cairn Gateway';
        if (forwardToIde) {
          const sendResult = await this.osBridge.sendTextPromptToWindow(
            body.hwnd ? String(body.hwnd) : undefined,
            instruction,
            true
          );
          if (sendResult.ok) {
            delivery = 'delivered';
            deliveryDetail = sendResult.detail || 'Pasted into IDE chat and submitted';
          } else {
            delivery = 'failed';
            deliveryDetail = (sendResult.detail || 'IDE window delivery could not be confirmed') +
              ' Prompt queued for the next Cairn Gateway request only.';
          }
        }
        if (delivery !== 'delivered') {
          this.steeringQueue.push(instruction);
        }

        // 2) Run only local Cairn actions that were explicitly requested. A prompt sent
        //    to an IDE must not be answered here with a fabricated model response.
        const liveState = this.antigravitySync.getLiveState();
        const spend = this.db.getSpendSummary();
        const lower = instruction.toLowerCase();
        const executedTools: Array<{ name: string; detail: string }> = [];
        let localResult = '';

        if (/\b(cairn status|status|spend|budget)\b/.test(lower) && lower.length < 60) {
          localResult = `Session status (${liveState.activeModelDisplayName}): $${spend.projectUsd.toFixed(2)} spent across ${spend.totalTokens.toLocaleString()} tokens, ${liveState.totalSteps} synced IDE steps.`;
          executedTools.push({ name: 'cairn_status', detail: 'Read live spend summary' });
        } else if (/\b(snapshot|checkpoint|backup)\b/.test(lower)) {
          const cp = this.gitShadow.createShadowSnapshot({
            runId: 'remote_prompt',
            stepId: `snap_${Date.now()}`,
            description: `Prompt checkpoint: ${instruction.slice(0, 48)}`,
          });
          executedTools.push({
            name: 'create_shadow_snapshot',
            detail: cp ? `Created Git Shadow Tree #${cp.gitTreeHash.slice(0, 7)}` : 'No changes to snapshot',
          });
          localResult = cp
            ? `Created Git Shadow Snapshot #${cp.gitTreeHash.slice(0, 7)} before the agent acts on this prompt.`
            : 'Working tree unchanged — no snapshot needed.';
        }

        exchangeItems = this.antigravitySync.recordRemotePromptExchange({
          prompt: instruction,
          delivery,
          deliveryDetail,
          localResult: localResult || undefined,
          tools: executedTools,
        });

        this.broadcastEvent('steering_queued', {
          instruction,
          delivery,
          deliveryDetail,
          tools: executedTools,
          exchangeItems,
          queue: this.steeringQueue,
        });

        this.sendJson(res, 200, {
          ok: true,
          instruction,
          delivery,
          deliveryDetail,
          exchangeItems,
          forwardedToIde: delivery === 'delivered',
          queuedCount: this.steeringQueue.length,
          queue: this.steeringQueue,
        });
        return;
      }
      this.sendJson(res, 400, {
        ok: false,
        error: 'Empty instruction',
        queuedCount: this.steeringQueue.length,
        queue: this.steeringQueue,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/remote/steer/clear') {
      const cleared = this.steeringQueue.length;
      this.steeringQueue.splice(0, this.steeringQueue.length);
      this.broadcastEvent('steering_queued', { queue: this.steeringQueue });
      this.sendJson(res, 200, { ok: true, cleared, queuedCount: 0 });
      return;
    }

    // 9. Daemon REST API: Biometric Verification
    if (req.method === 'POST' && pathname === '/api/remote/biometric') {
      const body = await this.readJsonBody(req);
      const token = String(req.headers['x-cairn-token'] ?? this.pairingToken);
      const verified = this.db.verifyRemoteBiometric(token, String(body.credentialId ?? 'webauthn'));
      this.sendJson(res, 200, { ok: verified });
      return;
    }

    // 10. Daemon REST API: Calibration update (CAL-1..CAL-3) & Task Completion Auto-Calibration
    if (req.method === 'POST' && pathname === '/api/calibrate') {
      const body = await this.readJsonBody(req);
      const updated = this.db.recordTaskCalibration({
        scope: body.scope ? String(body.scope) : 'default',
        estimatedTokens: Number(body.estimatedTokens ?? 10000),
        actualTokens: Number(body.actualTokens ?? 10000),
        actualCacheHitRatio:
          body.actualCacheHitRatio !== undefined ? Number(body.actualCacheHitRatio) : undefined,
      });
      this.broadcastEvent('calibration_updated', { calibration: updated });
      this.sendJson(res, 200, { ok: true, calibration: updated });
      return;
    }

    const taskCompleteMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/complete$/);
    if (req.method === 'POST' && taskCompleteMatch) {
      const taskId = decodeURIComponent(taskCompleteMatch[1]);
      const body = await this.readJsonBody(req);
      const latestEst = this.db.getLatestEstimate();
      const matchedTask = latestEst?.tasks.find(
        (t) =>
          t.id.toLowerCase() === taskId.toLowerCase() ||
          t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === taskId.toLowerCase()
      );
      const estimatedTokens = Number(
        body.estimatedTokens ?? matchedTask?.tokens.expected ?? latestEst?.totals.tokens.expected ?? 10000
      );
      const estimatedCostUsd = Number(
        body.estimatedCostUsd ?? matchedTask?.costUsd.expected ?? latestEst?.totals.costUsd.expected ?? 0
      );

      const actualMetrics = this.db.getTaskActualMetrics(taskId);
      const actualTokens =
        body.actualTokens !== undefined ? Number(body.actualTokens) : actualMetrics.actualTokens;
      const actualCostUsd =
        body.actualCostUsd !== undefined ? Number(body.actualCostUsd) : actualMetrics.actualCostUsd;
      const actualCacheHitRatio =
        body.actualCacheHitRatio !== undefined
          ? Number(body.actualCacheHitRatio)
          : actualMetrics.actualCacheHitRatio;

      const updatedCalibration = this.db.recordTaskCalibration({
        scope: body.scope ? String(body.scope) : 'default',
        estimatedTokens: Math.max(1, estimatedTokens),
        actualTokens: Math.max(1, actualTokens),
        actualCacheHitRatio: actualMetrics.callCount > 0 || body.actualCacheHitRatio !== undefined
          ? actualCacheHitRatio
          : undefined,
      });

      const variance = {
        taskId,
        estimatedTokens,
        actualTokens,
        tokenDeltaPercent:
          estimatedTokens > 0
            ? Number((((actualTokens - estimatedTokens) / estimatedTokens) * 100).toFixed(1))
            : 0,
        estimatedCostUsd,
        actualCostUsd,
        actualCacheHitRatio,
      };

      this.broadcastEvent('calibration_updated', { calibration: updatedCalibration, variance });
      this.sendJson(res, 200, {
        ok: true,
        variance,
        calibration: updatedCalibration,
      });
      return;
    }

    // 11. OS Window Bridge Endpoints (Layer 3 Mobile IDE Control)
    if (req.method === 'GET' && pathname === '/api/os/windows') {
      const windows = await this.osBridge.listIdeWindows();
      this.sendJson(res, 200, { ok: true, windows });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/os/frame') {
      const hwnd = parsedUrl.searchParams.get('hwnd') ?? undefined;
      const frame = await this.osBridge.captureWindowFrame(
        hwnd,
        this.antigravitySync.getLiveState(),
        this.db.getSpendSummary()
      );
      this.sendJson(res, 200, frame);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/os/window-control') {
      const body = await this.readJsonBody(req);
      const result = await this.osBridge.controlWindow(
        String(body.hwnd ?? ''),
        (body.action as 'focus' | 'minimize' | 'maximize' | 'restore') ?? 'focus'
      );
      this.sendJson(res, 200, result);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/os/keys') {
      const body = await this.readJsonBody(req);
      const result = await this.osBridge.sendKeysToWindow(
        body.hwnd ? String(body.hwnd) : undefined,
        String(body.keys ?? 'enter')
      );
      this.sendJson(res, 200, result);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/os/click') {
      const body = await this.readJsonBody(req);
      const result = await this.osBridge.clickInWindow(
        body.hwnd ? String(body.hwnd) : undefined,
        Number(body.normX ?? 0.5),
        Number(body.normY ?? 0.5)
      );
      this.sendJson(res, 200, result);
      return;
    }

    // 12. IDE Extension RPC Command Relay (Layer 2 Mobile IDE Control)
    if (req.method === 'POST' && pathname === '/api/ide/command') {
      const body = await this.readJsonBody(req);
      this.broadcastEvent('ide_execute_command', {
        command: String(body.command ?? ''),
        args: body.args ?? [],
      });
      this.sendJson(res, 200, { ok: true });
      return;
    }

    this.sendJson(res, 404, { error: { message: `Route ${pathname} not found on Cairn Daemon` } });
  }

  /**
   * Handles OpenAI (/v1/chat/completions) and Anthropic (/v1/messages) requests with:
   * - Task attribution (GW-13)
   * - Budget evaluation, cache-safe downgrade, and Wind-Down Injection (BUD-1..BUD-6)
   * - Prompt-injection scanning on tool outputs (SAF-6)
   * - Gateway stream tool-call interception and approval holding (SAF-1..SAF-5)
   * - Git Shadow Snapshot creation before mutating actions (SAF-4)
   */
  private async handleModelGatewayCall(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    format: 'openai' | 'anthropic',
    pathTaskId?: string
  ): Promise<void> {
    const startTime = Date.now();
    const body = await this.readJsonBody(req);
    const isStream = Boolean(body.stream);
    let rawModel = String(body.model ?? this.policy.routing.default);

    // GW-13: Virtual model prefix cairn/<task-id>/<model>
    let virtualTaskId: string | undefined;
    const virtualMatch = rawModel.match(/^cairn\/([^/]+)\/(.+)$/);
    if (virtualMatch) {
      virtualTaskId = virtualMatch[1];
      rawModel = virtualMatch[2];
    }

    const headerTaskId = req.headers['x-cairn-task']
      ? String(req.headers['x-cairn-task'])
      : undefined;
    const branchTaskId = this.gitShadow.getCurrentBranch();
    const taskId = pathTaskId ?? virtualTaskId ?? headerTaskId ?? branchTaskId ?? 'default-task';
    const runId = req.headers['x-cairn-run'] ? String(req.headers['x-cairn-run']) : `run_${taskId}`;
    const isNewTaskBoundary = Boolean(req.headers['x-cairn-task-boundary'] === 'true');

    // Automatically detect IDE / Agent Harness (Antigravity, Claude Code, OpenCode, Hermes) from live gateway calls
    if (taskId !== 'live-demo') {
      const userAgent = req.headers['user-agent'] ? String(req.headers['user-agent']) : '';
      const agentHeader = req.headers['x-cairn-harness']
        ? String(req.headers['x-cairn-harness'])
        : req.headers['x-agent-name']
        ? String(req.headers['x-agent-name'])
        : '';
      this.antigravitySync.recordGatewayDetection({
        userAgent,
        agentHeader,
        modelId: rawModel,
      });
    }

    const messages = Array.isArray(body.messages)
      ? (body.messages as Array<Record<string, unknown>>)
      : [];

    // SAF-6: Scan incoming messages / tool outputs for prompt injection
    const serializedMessages = JSON.stringify({
      system: body.system ?? undefined,
      messages,
    });
    const injectionCheck = detectPromptInjection(serializedMessages);
    if (injectionCheck.detected) {
      this.broadcastEvent('prompt_injection_warning', {
        runId,
        taskId,
        matches: injectionCheck.matches,
      });
    }

    // Inject any queued mobile steering instructions into the conversation
    if (this.steeringQueue.length > 0) {
      const steerText = this.steeringQueue.splice(0, this.steeringQueue.length).join('\n');
      messages.push({
        role: 'user',
        content: `[USER REMOTE STEERING INSTRUCTION FROM PHONE]: ${steerText}`,
      });
    }

    // Evaluate budgets & cache-safe downgrades
    const budgetEval = this.budgetManager.evaluatePreCall({
      policy: this.policy,
      requestedModel: rawModel,
      taskId,
      runId,
      isNewTaskBoundary,
    });

    if (budgetEval.triggeredAlerts.length > 0) {
      this.broadcastEvent('budget_alert', { runId, taskId, alerts: budgetEval.triggeredAlerts });
    }

    if (!budgetEval.allowed) {
      this.sendJson(res, 429, {
        error: {
          type: 'cairn_budget_exceeded',
          message: 'Cairn hard budget cap reached and exhaustion_mode is set to block.',
        },
      });
      return;
    }

    if (budgetEval.windDownRequired && budgetEval.windDownInstruction) {
      messages.push({
        role: 'user',
        content: budgetEval.windDownInstruction,
      });
    }

    const selectedModel = budgetEval.selectedModel;
    const fallbackModel = this.policy.routing.fallback_on_error
      ? resolveModelAndProvider(this.policy.routing.fallback_on_error, this.policy.aliases)
      : undefined;

    // GW-11: Exact-match response cache check (in-memory + SQLite persistent cache)
    const noCacheHeader =
      req.headers['x-cairn-no-cache'] === '1' ||
      String(req.headers['cache-control'] ?? '').includes('no-cache');
    const cacheAllowed =
      !budgetEval.windDownRequired &&
      body.cache !== false &&
      !body.mock_tool_call &&
      !noCacheHeader;

    const cacheKey = crypto
      .createHash('sha256')
      .update(`${selectedModel.id}:${serializedMessages}:${JSON.stringify(body.tools ?? [])}`)
      .digest('hex');

    const cachedEntry = cacheAllowed
      ? this.exactResponseCache.get(cacheKey) ?? this.db.getCachedResponse(cacheKey) ?? undefined
      : undefined;

    // Determine response content and tool calls (upstream provider call or deterministic local gateway synthesis)
    const callOutcome = cachedEntry
      ? {
          responseText: cachedEntry.content,
          toolCalls: cachedEntry.toolCalls,
          usage: {
            inputTokens: 0,
            outputTokens: estimateTokensFromText(cachedEntry.content),
            cacheWriteTokens: 0,
            cacheReadTokens: estimateTokensFromText(serializedMessages),
            reasoningTokens: 0,
          } satisfies CanonicalUsage,
          cacheHit: true,
          effectiveModel: selectedModel,
        }
      : await dispatchModelCall({
          body,
          messages,
          selectedModel,
          fallbackModel,
          windDownRequired: budgetEval.windDownRequired,
          headers: req.headers,
        });

    const { responseText, toolCalls, usage, cacheHit } = callOutcome;
    const effectiveModel = callOutcome.effectiveModel ?? selectedModel;

    if (!cachedEntry && cacheAllowed && toolCalls.length === 0 && responseText) {
      this.exactResponseCache.set(cacheKey, {
        content: responseText,
        toolCalls,
        model: effectiveModel.id,
      });
      this.db.setCachedResponse({
        cacheKey,
        model: effectiveModel.id,
        content: responseText,
        toolCalls,
      });
    }

    // BUD-6: Runaway loop detection on proposed tool calls
    const runawayCheck = this.budgetManager.recordAndCheckRunaway(runId, toolCalls);
    if (runawayCheck.runaway) {
      this.broadcastEvent('runaway_detected', {
        runId,
        taskId,
        reason: runawayCheck.reason,
      });
    }

    // SAF-1..SAF-5: Intercept and classify every tool call before releasing response to the agent
    const approvedToolCalls: CanonicalToolCall[] = [];
    let blockedReason: string | null = null;

    for (const tc of toolCalls) {
      const classified = classifyToolAction(tc.name, tc.arguments, this.policy);
      const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // SAF-4: Take an automatic off-branch Git Shadow Snapshot before any mutating tool call
      let checkpointRef: string | null = null;
      if (classified.riskLevel !== 'read-only' && classified.decision !== 'deny') {
        const cp = this.gitShadow.createShadowSnapshot({
          runId,
          stepId: actionId,
          description: `${tc.name}: ${classified.target.slice(0, 80)}`,
        });
        if (cp) {
          checkpointRef = cp.gitRef;
        }
      }

      if (classified.decision === 'deny') {
        this.db.recordAction({
          id: actionId,
          runId,
          toolName: tc.name,
          target: classified.target,
          riskLevel: classified.riskLevel,
          preview: classified.preview,
          status: 'blocked',
          approvedBy: 'policy',
          gitCheckpointRef: checkpointRef,
        });
        blockedReason = classified.reason;
        this.broadcastEvent('action_blocked', { actionId, toolName: tc.name, reason: classified.reason });
        continue;
      }

      if (classified.decision === 'ask' || runawayCheck.runaway) {
        const recorded = this.db.recordAction({
          id: actionId,
          runId,
          toolName: tc.name,
          target: classified.target,
          riskLevel: classified.riskLevel,
          preview: classified.preview,
          status: 'pending',
          approvedBy: null,
          gitCheckpointRef: checkpointRef,
        });

        // Hold stream until approved via IDE, Mobile PWA, or CLI (sending SSE keep-alives if streaming)
        const approvalResult = await this.waitForActionApproval(recorded, isStream ? res : undefined);
        this.db.updateActionStatus(
          actionId,
          approvalResult.status,
          approvalResult.source,
          approvalResult.note ?? null
        );

        if (approvalResult.status === 'rejected') {
          blockedReason = `Action "${tc.name}" rejected by user via ${approvalResult.source}${
            approvalResult.note ? ` — Note: ${approvalResult.note}` : ''
          }`;
          continue;
        }
      } else {
        this.db.recordAction({
          id: actionId,
          runId,
          toolName: tc.name,
          target: classified.target,
          riskLevel: classified.riskLevel,
          preview: classified.preview,
          status: 'approved',
          approvedBy: 'policy',
          gitCheckpointRef: checkpointRef,
        });
      }

      approvedToolCalls.push(tc);
    }

    const finalText = blockedReason
      ? `${responseText ? responseText + '\n\n' : ''}[CAIRN SAFETY INTERCEPT]: ${blockedReason}`
      : responseText;

    const latencyMs = Math.max(1, Date.now() - startTime);
    const costUsd = cacheHit ? 0 : calculateCallCostUsd(usage, effectiveModel);

    // Record metered call in SQLite (GW-7)
    const callRecord = this.db.recordCall({
      id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      runId,
      taskId,
      model: effectiveModel.id,
      provider: effectiveModel.provider,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheWriteTokens: usage.cacheWriteTokens,
      cacheReadTokens: usage.cacheReadTokens,
      latencyMs,
      costUsd,
      cacheHit: cacheHit ? 1 : 0,
      promptPreview: serializedMessages.slice(-400),
      responsePreview: finalText || JSON.stringify(approvedToolCalls),
    });

    this.broadcastEvent('call_recorded', {
      call: callRecord,
      spend: this.db.getSpendSummary(taskId),
      downgraded: budgetEval.downgraded,
      downgradeReason: budgetEval.downgradeReason,
    });

    // Return response in requested schema (OpenAI or Anthropic, JSON or SSE stream)
    if (format === 'anthropic') {
      this.sendAnthropicResponse(res, {
        id: callRecord.id,
        model: effectiveModel.id,
        text: finalText,
        toolCalls: approvedToolCalls,
        usage,
        isStream,
      });
    } else {
      this.sendOpenAiResponse(res, {
        id: callRecord.id,
        model: effectiveModel.id,
        text: finalText,
        toolCalls: approvedToolCalls,
        usage,
        isStream,
      });
    }
  }

  private async waitForActionApproval(
    action: StoredActionRecord,
    streamRes?: http.ServerResponse
  ): Promise<{
    status: 'approved' | 'rejected';
    source: 'ide' | 'mobile' | 'cli' | 'policy';
    note?: string;
  }> {
    if (this.autoApproveOnTimeout && this.approvalTimeoutMs <= 50) {
      return { status: 'approved', source: 'policy' };
    }

    this.broadcastEvent('approval_required', action);

    // If the client requested SSE streaming, flush headers immediately and emit periodic
    // keep-alive comments so the coding agent's HTTP client never times out while waiting.
    let heartbeatTimer: NodeJS.Timeout | undefined;
    if (streamRes && !streamRes.headersSent) {
      streamRes.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      streamRes.write(`: cairn-holding-for-approval id=${action.id} tool=${action.toolName}\n\n`);
      heartbeatTimer = setInterval(() => {
        if (!streamRes.writableEnded) {
          streamRes.write(`: cairn-awaiting-approval id=${action.id}\n\n`);
        }
      }, 4000);
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        this.pendingApprovals.delete(action.id);
        resolve({
          status: this.autoApproveOnTimeout ? 'approved' : 'rejected',
          source: 'policy',
          note: 'Approval timed out',
        });
      }, this.approvalTimeoutMs);

      this.pendingApprovals.set(action.id, {
        id: action.id,
        runId: action.runId,
        toolName: action.toolName,
        target: action.target,
        riskLevel: action.riskLevel,
        preview: action.preview,
        createdAt: action.createdAt,
        resolve: (decision) => {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          clearTimeout(timer);
          resolve(decision);
        },
      });
    });
  }

  private sendOpenAiResponse(
    res: http.ServerResponse,
    params: {
      id: string;
      model: string;
      text: string;
      toolCalls: CanonicalToolCall[];
      usage: CanonicalUsage;
      isStream: boolean;
    }
  ): void {
    const { id, model, text, toolCalls, usage, isStream } = params;
    const formattedToolCalls =
      toolCalls.length > 0
        ? toolCalls.map((tc, index) => ({
            index,
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: tc.arguments },
          }))
        : undefined;

    if (isStream) {
      if (!res.headersSent) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
      }

      const created = Math.floor(Date.now() / 1000);

      // 1. Role initialization delta
      res.write(
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
        })}\n\n`
      );

      // 2. Content delta chunk(s)
      if (text) {
        res.write(
          `data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
          })}\n\n`
        );
      }

      // 3. Tool call delta chunk(s)
      if (formattedToolCalls) {
        res.write(
          `data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta: { tool_calls: formattedToolCalls }, finish_reason: null }],
          })}\n\n`
        );
      }

      // 4. Final finish_reason + usage chunk
      res.write(
        `data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: formattedToolCalls ? 'tool_calls' : 'stop',
            },
          ],
          usage: {
            prompt_tokens: usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
            completion_tokens: usage.outputTokens,
            total_tokens:
              usage.inputTokens +
              usage.cacheReadTokens +
              usage.cacheWriteTokens +
              usage.outputTokens,
            prompt_tokens_details: {
              cached_tokens: usage.cacheReadTokens,
            },
          },
        })}\n\n`
      );
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    this.sendJson(res, 200, {
      id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text || null,
            ...(formattedToolCalls ? { tool_calls: formattedToolCalls } : {}),
          },
          finish_reason: formattedToolCalls ? 'tool_calls' : 'stop',
        },
      ],
      usage: {
        prompt_tokens: usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
        completion_tokens: usage.outputTokens,
        total_tokens:
          usage.inputTokens +
          usage.cacheReadTokens +
          usage.cacheWriteTokens +
          usage.outputTokens,
        prompt_tokens_details: {
          cached_tokens: usage.cacheReadTokens,
        },
      },
    });
  }

  private sendAnthropicResponse(
    res: http.ServerResponse,
    params: {
      id: string;
      model: string;
      text: string;
      toolCalls: CanonicalToolCall[];
      usage: CanonicalUsage;
      isStream: boolean;
    }
  ): void {
    const { id, model, text, toolCalls, usage, isStream } = params;
    const contentBlocks: Array<Record<string, unknown>> = [];
    if (text) {
      contentBlocks.push({ type: 'text', text });
    }
    for (const tc of toolCalls) {
      let parsedInput: unknown = {};
      try {
        parsedInput = JSON.parse(tc.arguments || '{}');
      } catch {
        parsedInput = { raw: tc.arguments };
      }
      contentBlocks.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.name,
        input: parsedInput,
      });
    }

    if (isStream) {
      if (!res.headersSent) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
      }

      // 1. message_start
      res.write(
        `event: message_start\ndata: ${JSON.stringify({
          type: 'message_start',
          message: {
            id,
            type: 'message',
            role: 'assistant',
            model,
            content: [],
            stop_reason: null,
            stop_sequence: null,
            usage: {
              input_tokens: usage.inputTokens,
              cache_creation_input_tokens: usage.cacheWriteTokens,
              cache_read_input_tokens: usage.cacheReadTokens,
              output_tokens: 0,
            },
          },
        })}\n\n`
      );

      // 2. Full content_block_start -> content_block_delta -> content_block_stop lifecycle per block
      let blockIdx = 0;
      if (text) {
        res.write(
          `event: content_block_start\ndata: ${JSON.stringify({
            type: 'content_block_start',
            index: blockIdx,
            content_block: { type: 'text', text: '' },
          })}\n\n`
        );
        res.write(
          `event: content_block_delta\ndata: ${JSON.stringify({
            type: 'content_block_delta',
            index: blockIdx,
            delta: { type: 'text_delta', text },
          })}\n\n`
        );
        res.write(
          `event: content_block_stop\ndata: ${JSON.stringify({
            type: 'content_block_stop',
            index: blockIdx,
          })}\n\n`
        );
        blockIdx++;
      }

      for (const tc of toolCalls) {
        res.write(
          `event: content_block_start\ndata: ${JSON.stringify({
            type: 'content_block_start',
            index: blockIdx,
            content_block: {
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: {},
            },
          })}\n\n`
        );
        res.write(
          `event: content_block_delta\ndata: ${JSON.stringify({
            type: 'content_block_delta',
            index: blockIdx,
            delta: {
              type: 'input_json_delta',
              partial_json: tc.arguments || '{}',
            },
          })}\n\n`
        );
        res.write(
          `event: content_block_stop\ndata: ${JSON.stringify({
            type: 'content_block_stop',
            index: blockIdx,
          })}\n\n`
        );
        blockIdx++;
      }

      // 3. message_delta with stop_reason & final output_tokens
      res.write(
        `event: message_delta\ndata: ${JSON.stringify({
          type: 'message_delta',
          delta: {
            stop_reason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
            stop_sequence: null,
          },
          usage: {
            output_tokens: usage.outputTokens,
          },
        })}\n\n`
      );

      // 4. message_stop
      res.write(
        `event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`
      );
      res.end();
      return;
    }

    this.sendJson(res, 200, {
      id,
      type: 'message',
      role: 'assistant',
      model,
      content: contentBlocks,
      stop_reason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
      usage: {
        input_tokens: usage.inputTokens,
        cache_creation_input_tokens: usage.cacheWriteTokens,
        cache_read_input_tokens: usage.cacheReadTokens,
        output_tokens: usage.outputTokens,
      },
    });
  }
}
