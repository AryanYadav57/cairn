import { execFileSync } from 'node:child_process';
import type { CairnPolicy } from '@cairn/core';
import type { CairnDatabase } from '../db/database.js';
import type { AntigravityLiveSync, AntigravityLiveState } from '../telemetry/antigravity-sync.js';
import type { ProjectLedgerService } from '../telemetry/project-ledger.js';

export interface IntelToolExecutionRecord {
  name: string;
  args: Record<string, unknown>;
  summary: string;
  resultPreview?: unknown;
}

export interface IntelHighlightCard {
  label: string;
  value: string;
  sub: string;
  tone: 'blue' | 'green' | 'red' | 'silver';
}

export interface IntelBreakdownRow {
  label: string;
  detail: string;
  metric: string;
  cost: string;
  pct: number;
}

export interface IntelQueryRequest {
  query: string;
  model?: string;
  taskId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  localFallbackOnly?: boolean;
}

export interface IntelQueryResponse {
  ok: boolean;
  query: string;
  answer: string;
  model: string;
  provider: string;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolsUsed: IntelToolExecutionRecord[];
  highlights: IntelHighlightCard[];
  breakdownTitle: string;
  breakdownRows: IntelBreakdownRow[];
  suggestedFollowUps: string[];
  createdAt: string;
}

export interface ProjectIntelOptions {
  db: CairnDatabase;
  getPolicy: () => CairnPolicy;
  antigravitySync?: AntigravityLiveSync;
  projectLedger?: ProjectLedgerService;
  repoDir: string;
  apiKey?: string;
  endpoint?: string;
}

export const CIRRASCALE_MODELS = [
  {
    id: 'Llama-3.3-70B',
    label: 'Llama 3.3 70B · Deep Forensics',
    badge: 'RECOMMENDED',
    description: 'High-precision root-cause analysis for task costs, token spikes, and PRD variance.',
  },
  {
    id: 'Llama-3.1-8B',
    label: 'Llama 3.1 8B · Instant Fast',
    badge: '1.0s FAST',
    description: 'Sub-second responses for recent work summaries, status checks, and quick lookups.',
  },
  {
    id: 'DeepSeek-R1-Distill-Llama-70B',
    label: 'DeepSeek R1 70B · Reasoning',
    badge: 'REASONING',
    description: 'Extended chain-of-thought reasoning for complex multi-agent cost diagnostics.',
  },
  {
    id: 'Qwen-QwQ-32B',
    label: 'Qwen QwQ 32B · Analytical',
    badge: 'ANALYTICAL',
    description: 'Quantitative token math and SQL telemetry auditing.',
  },
] as const;

const DEFAULT_INFERENCE_KEY = '55c989c5-1072-4bfc-ad79-eb39e99ff2b8';
const DEFAULT_INFERENCE_ENDPOINT = 'https://aisuite.cirrascale.com/apis/v2';

const INTEL_TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'get_task_cost_breakdown',
      description:
        'Get detailed cost forensics, token distribution, retry count, top expensive steps/calls, and automated root-cause diagnostics for a specific task or the current session.',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Optional task ID to inspect. Omit or pass "latest" to analyze the active/most expensive task and session.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'explain_token_spend',
      description:
        'Break down where tokens were spent across technical layers (UI, Backend, Telemetry, Safety, Testing), models, cache read vs uncached input, and heaviest turns.',
      parameters: {
        type: 'object',
        properties: {
          timeframe: {
            type: 'string',
            enum: ['today', 'session', 'all'],
            description: 'Timeframe for token breakdown (default: session)',
          },
          taskId: {
            type: 'string',
            description: 'Optional task ID filter',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_work_summary',
      description:
        'Get the most recent work done on the project, including recent prompts, agent outputs, tool executions, modified files, git shadow checkpoints, and recent git commits.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of recent items to retrieve (default: 8)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_ledger_by_agent',
      description:
        'Compare token usage, sessions, steps, and USD spend across all coding agents (Antigravity IDE, Codex CLI, Claude Code, OpenCode, Hermes, and Cairn Gateway).',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Optional agent ID filter (e.g., antigravity, claude-code, codex)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_estimate_vs_actual',
      description:
        'Compare the PRD project cost estimate and budget caps against actual recorded spend, token consumption, and calibration multipliers.',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Optional task ID to compare',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_action_audit_log',
      description:
        'Retrieve safety gate tool actions, approval status, high-risk blocks, and git shadow checkpoint references.',
      parameters: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            enum: ['all', 'high_risk', 'rejected', 'pending'],
            description: 'Filter actions by safety status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_safe_readonly_sql',
      description:
        'Execute a read-only SQLite SELECT query against Cairn tables (calls, runs, actions, checkpoints, estimates, calibrations) for custom analytical questions.',
      parameters: {
        type: 'object',
        properties: {
          sqlQuery: {
            type: 'string',
            description: 'A read-only SELECT SQL query',
          },
        },
        required: ['sqlQuery'],
      },
    },
  },
];

function formatTokensCompact(n: number): string {
  const val = Number(n || 0);
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return String(val);
}

export class ProjectIntelService {
  private readonly historyLog: IntelQueryResponse[] = [];

  constructor(private readonly options: ProjectIntelOptions) {}

  private getApiKey(): string {
    return (
      this.options.apiKey ??
      process.env.INFERENCE_CLOUD_API_KEY ??
      DEFAULT_INFERENCE_KEY
    ).trim();
  }

  private getEndpoint(): string {
    return (
      this.options.endpoint ??
      process.env.INFERENCE_CLOUD_ENDPOINT ??
      DEFAULT_INFERENCE_ENDPOINT
    )
      .trim()
      .replace(/\/+$/, '');
  }

  public getRecentHistory(limit = 15): IntelQueryResponse[] {
    return this.historyLog.slice(0, limit);
  }

  public executeTool(
    toolName: string,
    rawArgs: Record<string, unknown>
  ): { result: Record<string, unknown>; summary: string } {
    const liveState: AntigravityLiveState | null = this.options.antigravitySync
      ? this.options.antigravitySync.getLiveState()
      : null;

    switch (toolName) {
      case 'get_task_cost_breakdown':
        return this.toolGetTaskCostBreakdown(rawArgs, liveState);
      case 'explain_token_spend':
        return this.toolExplainTokenSpend(rawArgs, liveState);
      case 'get_recent_work_summary':
        return this.toolGetRecentWorkSummary(rawArgs, liveState);
      case 'query_ledger_by_agent':
        return this.toolQueryLedgerByAgent(rawArgs);
      case 'compare_estimate_vs_actual':
        return this.toolCompareEstimateVsActual(rawArgs, liveState);
      case 'get_action_audit_log':
        return this.toolGetActionAuditLog(rawArgs);
      case 'execute_safe_readonly_sql':
        return this.toolExecuteSafeSql(rawArgs);
      default:
        return this.toolGetTaskCostBreakdown(rawArgs, liveState);
    }
  }

  private toolGetTaskCostBreakdown(
    args: Record<string, unknown>,
    liveState: AntigravityLiveState | null
  ): { result: Record<string, unknown>; summary: string } {
    const requestedTask =
      typeof args.taskId === 'string' && args.taskId.trim() && args.taskId !== 'latest'
        ? args.taskId.trim()
        : undefined;

    const allCalls = this.options.db.listRecentCalls(100);
    const taskGroups = new Map<
      string,
      {
        taskId: string;
        calls: number;
        costUsd: number;
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
        models: Set<string>;
      }
    >();

    for (const c of allCalls) {
      const tid = c.taskId || 'default-session';
      const cur = taskGroups.get(tid) ?? {
        taskId: tid,
        calls: 0,
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        models: new Set<string>(),
      };
      cur.calls += 1;
      cur.costUsd += c.costUsd;
      cur.inputTokens += c.inputTokens;
      cur.outputTokens += c.outputTokens;
      cur.cacheReadTokens += c.cacheReadTokens;
      cur.cacheWriteTokens += c.cacheWriteTokens;
      cur.models.add(c.model);
      taskGroups.set(tid, cur);
    }

    const filteredCalls = requestedTask
      ? allCalls.filter((c) => (c.taskId || '').toLowerCase().includes(requestedTask.toLowerCase()))
      : allCalls;

    const spend = this.options.db.getSpendSummary(requestedTask);
    const recentEvents = liveState?.recentEvents ?? [];
    const topEvents = [...recentEvents]
      .sort((a, b) => b.costUsd - a.costUsd)
      .slice(0, 5)
      .map((e) => ({
        stepIndex: e.stepIndex,
        model: e.modelDisplayName,
        costUsd: Number(e.costUsd.toFixed(4)),
        inputTokens: e.inputTokens,
        cachedTokens: e.cachedTokens,
        outputTokens: e.outputTokens,
        tools: e.tools,
        summary: e.summary.slice(0, 180),
        timestamp: e.timestamp,
      }));

    const topDbCalls = [...filteredCalls]
      .sort((a, b) => b.costUsd - a.costUsd)
      .slice(0, 5)
      .map((c) => ({
        callId: c.id,
        taskId: c.taskId ?? 'session',
        model: c.model,
        costUsd: Number(c.costUsd.toFixed(4)),
        inputTokens: c.inputTokens,
        cachedTokens: c.cacheReadTokens,
        outputTokens: c.outputTokens,
        latencyMs: c.latencyMs,
        promptPreview: c.promptPreview.slice(0, 140),
        createdAt: c.createdAt,
      }));

    const totalUncached = liveState?.sessionTokens.uncachedInput ?? spend.totalTokens;
    const totalCached = liveState?.sessionTokens.cachedRead ?? 0;
    const totalOutput = liveState?.sessionTokens.output ?? 0;
    const totalSessionTokens = liveState?.sessionTokens.total || spend.totalTokens;
    const cacheHitRatioPct =
      totalUncached + totalCached > 0
        ? Number(((totalCached / (totalUncached + totalCached)) * 100).toFixed(1))
        : 0;

    // Identify root-cause cost drivers
    const rootCauses: string[] = [];
    if (topEvents.length > 0) {
      const peak = topEvents[0];
      rootCauses.push(
        `Peak turn was Step #${peak.stepIndex} (${peak.model}) costing $${peak.costUsd.toFixed(4)} with ${formatTokensCompact(peak.inputTokens)} uncached input and ${formatTokensCompact(peak.cachedTokens)} cached tokens while running [${peak.tools.join(', ') || 'agent_turn'}].`
      );
    }
    if (liveState?.technicalBreakdown && liveState.technicalBreakdown.length > 0) {
      const topTech = liveState.technicalBreakdown[0];
      rootCauses.push(
        `Technical layer "${topTech.label}" accounted for ${topTech.sharePercent.toFixed(1)}% of spend ($${topTech.costUsd.toFixed(4)} across ${topTech.stepsCount} steps and ${formatTokensCompact(topTech.totalTokens)} tokens).`
      );
    }
    if (cacheHitRatioPct < 50 && totalSessionTokens > 10_000) {
      rootCauses.push(
        `Low prompt cache hit rate (${cacheHitRatioPct}%) meant ${formatTokensCompact(totalUncached)} input tokens were billed at full uncached input rates.`
      );
    } else if (cacheHitRatioPct >= 50) {
      rootCauses.push(
        `Prompt caching absorbed ${cacheHitRatioPct}% of input context (${formatTokensCompact(totalCached)} cached read tokens), significantly reducing raw input cost, while uncached input (${formatTokensCompact(totalUncached)}) and output generation (${formatTokensCompact(totalOutput)}) drove net spend.`
      );
    }
    if (liveState?.sessionModelComparison && liveState.sessionModelComparison.length > 1) {
      const cheapest = [...liveState.sessionModelComparison]
        .filter((m) => m.sessionCostUsd > 0)
        .sort((a, b) => a.sessionCostUsd - b.sessionCostUsd)[0];
      if (cheapest) {
        rootCauses.push(
          `Running this exact session workload on ${cheapest.displayName} would have cost $${cheapest.sessionCostUsd.toFixed(4)} compared to $${spend.projectUsd.toFixed(4)} actual.`
        );
      }
    }

    const tasksSummary = Array.from(taskGroups.values())
      .sort((a, b) => b.costUsd - a.costUsd)
      .slice(0, 6)
      .map((t) => ({
        taskId: t.taskId,
        calls: t.calls,
        costUsd: Number(t.costUsd.toFixed(4)),
        totalTokens: t.inputTokens + t.outputTokens + t.cacheReadTokens + t.cacheWriteTokens,
        inputTokens: t.inputTokens,
        outputTokens: t.outputTokens,
        cacheReadTokens: t.cacheReadTokens,
        models: Array.from(t.models).slice(0, 3),
      }));

    const result = {
      requestedTask: requestedTask ?? 'active-session',
      projectSpendUsd: spend.projectUsd,
      dailySpendUsd: spend.dailyUsd,
      taskSpendUsd: requestedTask ? spend.taskUsd : spend.projectUsd,
      totalCalls: spend.totalCalls,
      totalSteps: liveState?.totalSteps ?? spend.totalCalls,
      activeModel: liveState?.activeModelDisplayName ?? 'Gemini 4 Argon',
      tokens: {
        uncachedInput: totalUncached,
        cachedRead: totalCached,
        output: totalOutput,
        total: totalSessionTokens,
        cacheHitRatioPct,
      },
      tasksBreakdown: tasksSummary,
      topExpensiveSteps: topEvents.length > 0 ? topEvents : topDbCalls,
      technicalLayerBreakdown: (liveState?.technicalBreakdown ?? []).map((t) => ({
        layer: t.label,
        steps: t.stepsCount,
        tokens: t.totalTokens,
        costUsd: Number(t.costUsd.toFixed(4)),
        sharePercent: t.sharePercent,
      })),
      rootCauseDiagnostics: rootCauses,
    };

    return {
      result,
      summary: `Analyzed ${result.totalSteps} steps ($${result.projectSpendUsd.toFixed(4)} total, ${formatTokensCompact(result.tokens.total)} tokens, ${cacheHitRatioPct}% cached)`,
    };
  }

  private toolExplainTokenSpend(
    args: Record<string, unknown>,
    liveState: AntigravityLiveState | null
  ): { result: Record<string, unknown>; summary: string } {
    const spend = this.options.db.getSpendSummary(
      typeof args.taskId === 'string' ? args.taskId : undefined
    );
    const ledger = this.options.projectLedger?.getLedger();

    const uncachedInput = liveState?.sessionTokens.uncachedInput ?? spend.totalTokens;
    const cachedRead = liveState?.sessionTokens.cachedRead ?? 0;
    const output = liveState?.sessionTokens.output ?? 0;
    const total = liveState?.sessionTokens.total || spend.totalTokens;
    const cacheHitPct =
      uncachedInput + cachedRead > 0
        ? Number(((cachedRead / (uncachedInput + cachedRead)) * 100).toFixed(1))
        : 0;

    const byLayer = (liveState?.technicalBreakdown ?? []).map((layer) => ({
      id: layer.id,
      label: layer.label,
      description: layer.description,
      steps: layer.stepsCount,
      totalTokens: layer.totalTokens,
      uncachedInputTokens: layer.uncachedInputTokens,
      cachedReadTokens: layer.cachedReadTokens,
      outputTokens: layer.outputTokens,
      costUsd: Number(layer.costUsd.toFixed(4)),
      sharePercent: layer.sharePercent,
    }));

    const byModel = (liveState?.modelUsage ?? [])
      .filter((m) => m.steps > 0 || m.isActive)
      .map((m) => ({
        modelId: m.modelId,
        displayName: m.displayName,
        steps: m.steps,
        tokens: m.tokens,
        costUsd: Number(m.costUsd.toFixed(4)),
        cacheHitPct: m.cacheHitPct,
        contextFillPct: m.contextFillPct,
      }));

    const heaviestSteps = [...(liveState?.recentEvents ?? [])]
      .sort((a, b) => b.inputTokens + b.cachedTokens + b.outputTokens - (a.inputTokens + a.cachedTokens + a.outputTokens))
      .slice(0, 6)
      .map((e) => ({
        stepIndex: e.stepIndex,
        model: e.modelDisplayName,
        totalTokens: e.inputTokens + e.cachedTokens + e.outputTokens,
        inputTokens: e.inputTokens,
        cachedTokens: e.cachedTokens,
        outputTokens: e.outputTokens,
        costUsd: Number(e.costUsd.toFixed(4)),
        tools: e.tools,
        summary: e.summary.slice(0, 150),
      }));

    const result = {
      timeframe: args.timeframe ?? 'session',
      tokenTotals: {
        uncachedInput,
        cachedRead,
        output,
        total,
        cacheHitPct,
        uncachedSharePct: total > 0 ? Number(((uncachedInput / total) * 100).toFixed(1)) : 0,
        cachedSharePct: total > 0 ? Number(((cachedRead / total) * 100).toFixed(1)) : 0,
        outputSharePct: total > 0 ? Number(((output / total) * 100).toFixed(1)) : 0,
      },
      byTechnicalLayer: byLayer,
      byModel,
      heaviestTokenSteps: heaviestSteps,
      multiAgentLedgerTotals: ledger?.totals ?? null,
    };

    return {
      result,
      summary: `Token breakdown across ${byLayer.length} layers and ${byModel.length} active models (${formatTokensCompact(total)} total tokens)`,
    };
  }

  private toolGetRecentWorkSummary(
    args: Record<string, unknown>,
    liveState: AntigravityLiveState | null
  ): { result: Record<string, unknown>; summary: string } {
    const limit = Math.min(25, Math.max(3, Number(args.limit ?? 8)));
    const recentActions = this.options.db.listRecentActions(limit);
    const checkpoints = this.options.db.listCheckpoints(limit);
    const recentCalls = this.options.db.listRecentCalls(limit);

    const recentTurns = (liveState?.conversationFeed ?? []).slice(-limit).map((turn) => ({
      stepIndex: turn.stepIndex,
      role: turn.role,
      source: turn.source,
      model: turn.modelDisplayName,
      text: turn.text.slice(0, 260),
      tools: turn.tools.map((t) => `${t.name}: ${t.detail.slice(0, 80)}`),
      costUsd: Number(turn.costUsd.toFixed(4)),
      tokens: turn.inputTokens + turn.cachedTokens + turn.outputTokens,
      timestamp: turn.timestamp,
    }));

    const recentSteps = (liveState?.recentEvents ?? []).slice(0, limit).map((ev) => ({
      stepIndex: ev.stepIndex,
      model: ev.modelDisplayName,
      tools: ev.tools,
      summary: ev.summary.slice(0, 200),
      costUsd: Number(ev.costUsd.toFixed(4)),
      tokens: ev.inputTokens + ev.cachedTokens + ev.outputTokens,
      timestamp: ev.timestamp,
    }));

    let gitCommits: string[] = [];
    let gitStatusFiles: string[] = [];
    try {
      const logOut = execFileSync('git', ['log', '-n', '5', '--oneline'], {
        cwd: this.options.repoDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      gitCommits = logOut
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      const statusOut = execFileSync('git', ['status', '--short'], {
        cwd: this.options.repoDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      gitStatusFiles = statusOut
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 15);
    } catch {
      // Ignore if git is unavailable
    }

    const result = {
      activeIde: liveState?.activeHarnessLabel ?? 'Antigravity IDE',
      activeModel: liveState?.activeModelDisplayName ?? 'Gemini 4 Argon',
      lastActivityAt: liveState?.lastActivityAt ?? recentCalls[0]?.createdAt ?? null,
      lastToolExecuted: liveState?.lastToolName
        ? `${liveState.lastToolName} (${liveState.lastToolSummary ?? ''})`
        : recentActions[0]
        ? `${recentActions[0].toolName} on ${recentActions[0].target}`
        : 'None',
      recentSteps,
      recentConversationTurns: recentTurns,
      recentRecordedActions: recentActions.map((a) => ({
        id: a.id,
        toolName: a.toolName,
        target: a.target,
        riskLevel: a.riskLevel,
        status: a.status,
        preview: a.preview.slice(0, 140),
        createdAt: a.createdAt,
      })),
      recentCheckpoints: checkpoints.map((cp) => ({
        id: cp.id,
        treeHash: cp.gitTreeHash.slice(0, 8),
        description: cp.description,
        reverted: Boolean(cp.reverted),
        createdAt: cp.createdAt,
      })),
      gitRecentCommits: gitCommits,
      gitModifiedFiles: gitStatusFiles,
    };

    return {
      result,
      summary: `Retrieved ${recentSteps.length} recent IDE steps, ${recentActions.length} tool actions, and ${checkpoints.length} git snapshots`,
    };
  }

  private toolQueryLedgerByAgent(args: Record<string, unknown>): {
    result: Record<string, unknown>;
    summary: string;
  } {
    const ledger = this.options.projectLedger?.getLedger();
    if (!ledger) {
      const spend = this.options.db.getSpendSummary();
      return {
        result: {
          totals: {
            costUsd: spend.projectUsd,
            tokens: spend.totalTokens,
            calls: spend.totalCalls,
          },
          agents: [],
        },
        summary: `Queried gateway spend ($${spend.projectUsd.toFixed(4)})`,
      };
    }

    const filterAgent = typeof args.agentId === 'string' ? args.agentId.toLowerCase() : undefined;
    const agents = filterAgent
      ? ledger.agents.filter(
          (a) => a.agent.toLowerCase().includes(filterAgent) || a.label.toLowerCase().includes(filterAgent)
        )
      : ledger.agents;

    const result = {
      projectName: ledger.projectName,
      generatedAt: ledger.generatedAt,
      totals: ledger.totals,
      agents: agents.map((a) => ({
        agent: a.agent,
        label: a.label,
        status: a.status,
        sessions: a.sessions,
        steps: a.steps,
        tokens: a.tokens,
        costUsd: Number(a.costUsd.toFixed(4)),
        equivalentProjectCostUsd: a.equivalentProjectCostUsd,
        models: a.models.map((m) => ({
          modelId: m.modelId,
          displayName: m.displayName,
          steps: m.steps,
          totalTokens: m.tokens.total,
          costUsd: Number(m.costUsd.toFixed(4)),
        })),
        lastActivityAt: a.lastActivityAt,
      })),
    };

    return {
      result,
      summary: `Cross-agent ledger: $${ledger.totals.costUsd.toFixed(2)} across ${ledger.totals.agentsUsed} active agents (${formatTokensCompact(ledger.totals.tokens.total)} tokens)`,
    };
  }

  private toolCompareEstimateVsActual(
    args: Record<string, unknown>,
    liveState: AntigravityLiveState | null
  ): { result: Record<string, unknown>; summary: string } {
    const taskId = typeof args.taskId === 'string' ? args.taskId : undefined;
    const spend = this.options.db.getSpendSummary(taskId);
    const estimate = this.options.db.getLatestEstimate();
    const calibration = this.options.db.getCalibration();
    const policy = this.options.getPolicy();
    const ledger = this.options.projectLedger?.getLedger();

    const actualProjectUsd = Math.max(spend.projectUsd, ledger?.totals.costUsd ?? 0);
    const budgetCapUsd = policy.budgets.project?.usd ?? null;
    const dailyCapUsd = policy.budgets.daily?.usd ?? null;
    const taskCapUsd = policy.budgets.task?.usd ?? null;

    const result = {
      budgets: {
        projectCapUsd: budgetCapUsd,
        projectUsedUsd: Number(spend.projectUsd.toFixed(4)),
        projectUsedPct: budgetCapUsd && budgetCapUsd > 0 ? Number(((spend.projectUsd / budgetCapUsd) * 100).toFixed(1)) : 0,
        combinedAllAgentsUsd: Number(actualProjectUsd.toFixed(4)),
        dailyCapUsd,
        dailyUsedUsd: Number(spend.dailyUsd.toFixed(4)),
        taskCapUsd,
        taskUsedUsd: Number(spend.taskUsd.toFixed(4)),
      },
      prdEstimate: estimate
        ? {
            prdTitle: estimate.prdTitle,
            modelDisplayName: estimate.modelDisplayName,
            confidence: estimate.confidence,
            totalTasks: estimate.tasks.length,
            estimatedTokens: estimate.totals.tokens,
            estimatedCostUsd: estimate.totals.costUsd,
            topCostDrivers: estimate.topCostDrivers.slice(0, 5),
            topExpensiveTasks: [...estimate.tasks]
              .sort((a, b) => b.costUsd.expected - a.costUsd.expected)
              .slice(0, 6)
              .map((t) => ({
                id: t.id,
                title: t.title,
                complexity: t.complexity,
                expectedTokens: t.tokens.expected,
                expectedCostUsd: t.costUsd.expected,
              })),
          }
        : null,
      calibrationMultipliers: calibration,
      modelCostAlternatives: (liveState?.sessionModelComparison ?? []).slice(0, 5).map((m) => ({
        model: m.displayName,
        category: m.category,
        sessionCostUsd: m.sessionCostUsd,
      })),
    };

    return {
      result,
      summary: `${budgetCapUsd ? `Budget ${result.budgets.projectUsedPct}% used ($${spend.projectUsd.toFixed(2)} / $${budgetCapUsd.toFixed(2)} cap)` : `Session cost $${spend.projectUsd.toFixed(2)} (no cost cap set)`}${estimate ? ` vs PRD forecast $${estimate.totals.costUsd.expected.toFixed(2)}` : ''}`,
    };
  }

  private toolGetActionAuditLog(args: Record<string, unknown>): {
    result: Record<string, unknown>;
    summary: string;
  } {
    const filter = typeof args.filter === 'string' ? args.filter : 'all';
    const actions = this.options.db.listRecentActions(40);
    const filtered = actions.filter((a) => {
      if (filter === 'high_risk') return a.riskLevel === 'high' || (a.riskLevel as string) === 'critical';
      if (filter === 'rejected') return a.status === 'rejected' || a.status === 'blocked';
      if (filter === 'pending') return a.status === 'pending';
      return true;
    });

    const checkpoints = this.options.db.listCheckpoints(10);
    return {
      result: {
        filter,
        totalRecordedActions: actions.length,
        matchingActionsCount: filtered.length,
        actions: filtered.slice(0, 15).map((a) => ({
          id: a.id,
          toolName: a.toolName,
          target: a.target,
          riskLevel: a.riskLevel,
          status: a.status,
          approvedBy: a.approvedBy,
          rejectionNote: a.rejectionNote,
          checkpointRef: a.gitCheckpointRef,
          preview: a.preview.slice(0, 160),
          createdAt: a.createdAt,
        })),
        checkpoints: checkpoints.map((c) => ({
          id: c.id,
          treeHash: c.gitTreeHash.slice(0, 8),
          description: c.description,
          reverted: Boolean(c.reverted),
          createdAt: c.createdAt,
        })),
      },
      summary: `Audited ${filtered.length} tool actions and ${checkpoints.length} git shadow checkpoints`,
    };
  }

  private toolExecuteSafeSql(args: Record<string, unknown>): {
    result: Record<string, unknown>;
    summary: string;
  } {
    const rawSql = String(args.sqlQuery ?? '').trim();
    const normalized = rawSql.replace(/\s+/g, ' ').trim();
    if (!/^SELECT\b/i.test(normalized) || /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|PRAGMA)\b/i.test(normalized)) {
      return {
        result: {
          error: 'Only read-only SELECT queries are permitted on Cairn telemetry tables (calls, runs, actions, checkpoints, estimates, calibrations).',
        },
        summary: 'Blocked non-SELECT SQL query',
      };
    }

    try {
      const rows = this.options.db.db.prepare(rawSql).all().slice(0, 50);
      return {
        result: {
          sqlQuery: rawSql,
          rowCount: rows.length,
          rows,
        },
        summary: `Executed read-only SQL query (${rows.length} rows returned)`,
      };
    } catch (err) {
      return {
        result: {
          sqlQuery: rawSql,
          error: (err as Error).message,
        },
        summary: 'SQL query error',
      };
    }
  }

  /**
   * Selects the primary deterministic tools to pre-seed or fallback based on user query intent.
   */
  private inferRelevantTools(query: string, taskId?: string): Array<{ name: string; args: Record<string, unknown> }> {
    const q = query.toLowerCase();
    const selected: Array<{ name: string; args: Record<string, unknown> }> = [];

    if (
      q.includes('last work') ||
      q.includes('recent') ||
      q.includes('what was done') ||
      q.includes('what happened') ||
      q.includes('modified') ||
      q.includes('changed') ||
      q.includes('commit') ||
      q.includes('checkpoint') ||
      q.includes('history')
    ) {
      selected.push({ name: 'get_recent_work_summary', args: { limit: 8 } });
    }

    if (
      q.includes('token') ||
      q.includes('where') ||
      q.includes('layer') ||
      q.includes('cache') ||
      q.includes('context')
    ) {
      selected.push({ name: 'explain_token_spend', args: { timeframe: 'session', ...(taskId ? { taskId } : {}) } });
    }

    if (
      q.includes('cost') ||
      q.includes('expensive') ||
      q.includes('why') ||
      q.includes('much') ||
      q.includes('spend') ||
      q.includes('spent') ||
      q.includes('task') ||
      q.includes('money') ||
      q.includes('dollar') ||
      q.includes('usd')
    ) {
      selected.push({
        name: 'get_task_cost_breakdown',
        args: { taskId: taskId ?? 'latest' },
      });
    }

    if (
      q.includes('agent') ||
      q.includes('ledger') ||
      q.includes('claude') ||
      q.includes('codex') ||
      q.includes('antigravity') ||
      q.includes('compare')
    ) {
      selected.push({ name: 'query_ledger_by_agent', args: {} });
    }

    if (q.includes('estimate') || q.includes('prd') || q.includes('forecast') || q.includes('budget') || q.includes('cap')) {
      selected.push({ name: 'compare_estimate_vs_actual', args: taskId ? { taskId } : {} });
    }

    if (q.includes('safety') || q.includes('risk') || q.includes('approv') || q.includes('block') || q.includes('reject') || q.includes('undo')) {
      selected.push({ name: 'get_action_audit_log', args: { filter: 'all' } });
    }

    if (selected.length === 0) {
      selected.push(
        { name: 'get_task_cost_breakdown', args: { taskId: taskId ?? 'latest' } },
        { name: 'get_recent_work_summary', args: { limit: 6 } }
      );
    }

    return selected.slice(0, 3);
  }

  /**
   * Builds structured visual KPI cards and breakdown progress rows from live Cairn state.
   */
  private buildVisualMetadata(
    query: string,
    liveState: AntigravityLiveState | null,
    taskId?: string
  ): {
    highlights: IntelHighlightCard[];
    breakdownTitle: string;
    breakdownRows: IntelBreakdownRow[];
    suggestedFollowUps: string[];
  } {
    const q = query.toLowerCase();
    const spend = this.options.db.getSpendSummary(taskId);
    const ledger = this.options.projectLedger?.getLedger();
    const policy = this.options.getPolicy();

    const uncached = liveState?.sessionTokens.uncachedInput ?? spend.totalTokens;
    const cached = liveState?.sessionTokens.cachedRead ?? 0;
    const output = liveState?.sessionTokens.output ?? 0;
    const totalTokens = liveState?.sessionTokens.total || spend.totalTokens;
    const cachePct =
      uncached + cached > 0 ? Number(((cached / (uncached + cached)) * 100).toFixed(1)) : 0;

    const events = liveState?.recentEvents ?? [];
    const peakEvent = [...events].sort((a, b) => b.costUsd - a.costUsd)[0];
    const checkpoints = this.options.db.listCheckpoints(10);

    const highlights: IntelHighlightCard[] = [
      {
        label: 'Session Spend',
        value: `$${spend.projectUsd.toFixed(2)}`,
        sub: `${spend.totalCalls} recorded calls · ${policy.budgets.project?.usd ? `$${policy.budgets.project.usd.toFixed(0)} cap` : 'no cap'}`,
        tone: policy.budgets.project?.usd && spend.projectUsd > policy.budgets.project.usd * 0.8 ? 'red' : 'blue',
      },
      {
        label: 'Session Tokens',
        value: formatTokensCompact(totalTokens),
        sub: `In: ${formatTokensCompact(uncached)} · Out: ${formatTokensCompact(output)}`,
        tone: 'silver',
      },
      {
        label: 'Prompt Cache Hit',
        value: `${cachePct}%`,
        sub: `${formatTokensCompact(cached)} cached read tokens`,
        tone: cachePct >= 50 ? 'green' : 'silver',
      },
      peakEvent
        ? {
            label: 'Peak Step Cost',
            value: `$${peakEvent.costUsd.toFixed(4)}`,
            sub: `Step #${peakEvent.stepIndex} · ${peakEvent.tools[0] || 'agent_turn'}`,
            tone: 'blue',
          }
        : {
            label: 'Git Snapshots',
            value: String(checkpoints.length),
            sub: liveState?.activeModelDisplayName ?? 'Active session ready',
            tone: 'green',
          },
    ];

    let breakdownTitle = 'Token & Spend Distribution by Technical Layer';
    let breakdownRows: IntelBreakdownRow[] = [];

    if (
      (q.includes('agent') || q.includes('ledger') || q.includes('claude') || q.includes('codex')) &&
      ledger &&
      ledger.agents.length > 0
    ) {
      breakdownTitle = 'Multi-Agent Project Ledger Comparison';
      const totalLedgerUsd = Math.max(0.0001, ledger.totals.costUsd);
      breakdownRows = ledger.agents
        .filter((a) => a.steps > 0 || a.costUsd > 0)
        .slice(0, 5)
        .map((a) => ({
          label: a.label,
          detail: `${a.sessions} sessions · ${a.steps} steps`,
          metric: `${formatTokensCompact(a.tokens.total)} tok`,
          cost: `$${a.costUsd.toFixed(2)}`,
          pct: Math.min(100, Math.max(4, Number(((a.costUsd / totalLedgerUsd) * 100).toFixed(1)))),
        }));
    } else if (
      (q.includes('last work') || q.includes('recent') || q.includes('what was done')) &&
      events.length > 0
    ) {
      breakdownTitle = 'Most Recent Agent Execution Steps';
      const maxStepTok = Math.max(
        1,
        ...events.slice(0, 5).map((e) => e.inputTokens + e.cachedTokens + e.outputTokens)
      );
      breakdownRows = events.slice(0, 5).map((e) => {
        const tot = e.inputTokens + e.cachedTokens + e.outputTokens;
        return {
          label: `Step #${e.stepIndex} · ${e.tools.join(', ') || 'agent_turn'}`,
          detail: e.summary.slice(0, 72),
          metric: `${formatTokensCompact(tot)} tok`,
          cost: `$${e.costUsd.toFixed(4)}`,
          pct: Math.min(100, Math.max(6, Math.round((tot / maxStepTok) * 100))),
        };
      });
    } else if (liveState?.technicalBreakdown && liveState.technicalBreakdown.length > 0) {
      breakdownTitle = 'Cost & Token Attribution by Technical Layer';
      breakdownRows = liveState.technicalBreakdown.map((t) => ({
        label: t.label,
        detail: `${t.stepsCount} steps · ${t.description}`,
        metric: `${formatTokensCompact(t.totalTokens)} tok`,
        cost: `$${t.costUsd.toFixed(4)}`,
        pct: Math.min(100, Math.max(4, Number(t.sharePercent.toFixed(1)))),
      }));
    } else {
      const recentCalls = this.options.db.listRecentCalls(5);
      breakdownTitle = 'Recent Gateway & Task Calls';
      const maxCost = Math.max(0.0001, ...recentCalls.map((c) => c.costUsd));
      breakdownRows = recentCalls.map((c) => ({
        label: `${c.taskId ? `[${c.taskId}] ` : ''}${c.model}`,
        detail: c.promptPreview.slice(0, 68) || 'Model call',
        metric: `${formatTokensCompact(c.inputTokens + c.outputTokens + c.cacheReadTokens)} tok`,
        cost: `$${c.costUsd.toFixed(4)}`,
        pct: Math.min(100, Math.max(6, Math.round((c.costUsd / maxCost) * 100))),
      }));
    }

    const allSuggestions = [
      'Why did the most expensive step or task cost so much?',
      'Where were the most tokens spent across UI vs Backend?',
      'What was the last work done and which files were modified?',
      'How does our actual spend compare to the PRD estimate?',
      'Compare token spend across Antigravity, Claude Code, and Codex',
      'Which model would make this session cheapest if we switched?',
    ];
    const suggestedFollowUps = allSuggestions
      .filter((s) => s.toLowerCase() !== q.trim())
      .slice(0, 3);

    return {
      highlights,
      breakdownTitle,
      breakdownRows,
      suggestedFollowUps,
    };
  }

  /**
   * Deterministic synthesis when running in offline/test mode or if upstream API is unreachable.
   */
  private synthesizeDeterministicAnswer(
    query: string,
    toolRecords: Array<{ name: string; args: Record<string, unknown>; result: Record<string, unknown> }>,
    liveState: AntigravityLiveState | null
  ): string {
    const lines: string[] = [];
    const spend = this.options.db.getSpendSummary();
    const uncached = liveState?.sessionTokens.uncachedInput ?? spend.totalTokens;
    const cached = liveState?.sessionTokens.cachedRead ?? 0;
    const output = liveState?.sessionTokens.output ?? 0;
    const totalTok = liveState?.sessionTokens.total || spend.totalTokens;
    const cachePct =
      uncached + cached > 0 ? ((cached / (uncached + cached)) * 100).toFixed(1) : '0.0';

    lines.push(`## Project Intelligence Analysis`);
    lines.push(
      `Across **${liveState?.totalSteps ?? spend.totalCalls} recorded steps**, the active session has spent **$${spend.projectUsd.toFixed(4)}** across **${formatTokensCompact(totalTok)} total tokens** (**${formatTokensCompact(uncached)}** uncached input, **${formatTokensCompact(cached)}** cached reads at **${cachePct}%** hit rate, and **${formatTokensCompact(output)}** output tokens).`
    );

    for (const rec of toolRecords) {
      const r = rec.result;
      if (rec.name === 'get_task_cost_breakdown') {
        const causes = (r.rootCauseDiagnostics as string[]) ?? [];
        if (causes.length > 0) {
          lines.push(`### Why It Cost What It Did (Root Causes)`);
          for (const c of causes) {
            lines.push(`- ${c}`);
          }
        }
        const topSteps = (r.topExpensiveSteps as Array<Record<string, unknown>>) ?? [];
        if (topSteps.length > 0) {
          lines.push(`### Top Cost-Driving Steps / Calls`);
          for (const s of topSteps.slice(0, 3)) {
            const label = s.stepIndex !== undefined ? `Step #${s.stepIndex}` : `Call ${s.callId}`;
            lines.push(
              `- **${label}** (${s.model}): **$${Number(s.costUsd ?? 0).toFixed(4)}** — In: \`${formatTokensCompact(Number(s.inputTokens ?? 0))}\`, Cache: \`${formatTokensCompact(Number(s.cachedTokens ?? 0))}\`, Out: \`${formatTokensCompact(Number(s.outputTokens ?? 0))}\` — ${s.summary || s.promptPreview || 'Agent execution'}`
            );
          }
        }
      } else if (rec.name === 'explain_token_spend') {
        const layers = (r.byTechnicalLayer as Array<Record<string, unknown>>) ?? [];
        if (layers.length > 0) {
          lines.push(`### Where Tokens Were Spent (By Technical Layer)`);
          for (const l of layers) {
            lines.push(
              `- **${l.label}**: **${l.sharePercent}%** of spend (**$${Number(l.costUsd ?? 0).toFixed(4)}** · \`${formatTokensCompact(Number(l.totalTokens ?? 0))} tokens\` across ${l.steps} steps)`
            );
          }
        }
      } else if (rec.name === 'get_recent_work_summary') {
        lines.push(`### Most Recent Work Completed`);
        lines.push(
          `- **Active IDE & Model**: ${r.activeIde} running **${r.activeModel}** (Last tool: \`${r.lastToolExecuted}\`)`
        );
        const steps = (r.recentSteps as Array<Record<string, unknown>>) ?? [];
        for (const s of steps.slice(0, 4)) {
          lines.push(
            `- **Step #${s.stepIndex}** (\`${((s.tools as string[]) ?? []).join(', ') || 'turn'}\` · **$${Number(s.costUsd ?? 0).toFixed(4)}**): ${s.summary}`
          );
        }
        const commits = (r.gitRecentCommits as string[]) ?? [];
        if (commits.length > 0) {
          lines.push(`### Recent Git Commits`);
          for (const c of commits.slice(0, 3)) {
            lines.push(`- \`${c}\``);
          }
        }
      } else if (rec.name === 'compare_estimate_vs_actual') {
        const b = (r.budgets as Record<string, unknown>) ?? {};
        const est = r.prdEstimate as Record<string, unknown> | null;
        lines.push(`### Budget & PRD Forecast Comparison`);
        lines.push(
          b.projectCapUsd
            ? `- **Session Budget Used**: **$${Number(b.projectUsedUsd ?? 0).toFixed(2)}** of **$${Number(b.projectCapUsd).toFixed(2)}** cap (**${b.projectUsedPct}%**)`
            : `- **Session Cost**: **$${Number(b.projectUsedUsd ?? 0).toFixed(2)}** (no cost cap set)`
        );
        if (est) {
          const estCost = (est.estimatedCostUsd as Record<string, number>) ?? {};
          lines.push(
            `- **Full PRD Forecast (${est.modelDisplayName})**: Expected **$${Number(estCost.expected ?? 0).toFixed(2)}** (Range: $${Number(estCost.low ?? 0).toFixed(2)} – $${Number(estCost.high ?? 0).toFixed(2)} across ${est.totalTasks} tasks)`
          );
        }
      } else if (rec.name === 'query_ledger_by_agent') {
        const agents = (r.agents as Array<Record<string, unknown>>) ?? [];
        lines.push(`### Multi-Agent Project Ledger`);
        for (const a of agents) {
          const tok = (a.tokens as Record<string, number>) ?? {};
          lines.push(
            `- **${a.label}** (${a.status}): **$${Number(a.costUsd ?? 0).toFixed(2)}** across ${a.sessions} sessions / ${a.steps} steps (\`${formatTokensCompact(Number(tok.total ?? 0))} tokens\`)`
          );
        }
      }
    }

    return lines.join('\n\n');
  }

  /**
   * Main entry point: answers any natural language project query using live Cairn tool-calling + Cirrascale AI Suite.
   */
  public async ask(req: IntelQueryRequest): Promise<IntelQueryResponse> {
    const startTime = Date.now();
    const query = String(req.query || '').trim() || 'Give me a complete summary of project spend, tokens, and recent work.';
    const selectedModel = req.model && req.model.trim() ? req.model.trim() : 'Llama-3.3-70B';

    if (this.options.antigravitySync) {
      try {
        this.options.antigravitySync.syncNow();
      } catch {
        // Ignore sync errors in test environments
      }
    }
    const liveState = this.options.antigravitySync
      ? this.options.antigravitySync.getLiveState()
      : null;

    const toolsUsed: IntelToolExecutionRecord[] = [];
    const detailedToolResults: Array<{
      name: string;
      args: Record<string, unknown>;
      result: Record<string, unknown>;
    }> = [];

    // Pre-execute the most relevant Cairn telemetry tools so the model ALWAYS has grounded real metrics
    // even if it decides to answer directly or call additional tools.
    const initialTools = this.inferRelevantTools(query, req.taskId);
    for (const t of initialTools) {
      const exec = this.executeTool(t.name, t.args);
      toolsUsed.push({
        name: t.name,
        args: t.args,
        summary: exec.summary,
      });
      detailedToolResults.push({
        name: t.name,
        args: t.args,
        result: exec.result,
      });
    }

    let answer = '';
    let provider = 'cirrascale-aisuite';
    let promptTokens = 0;
    let completionTokens = 0;

    const apiKey = this.getApiKey();
    const endpoint = this.getEndpoint();
    const shouldCallUpstream = !req.localFallbackOnly && Boolean(apiKey && endpoint);

    if (shouldCallUpstream) {
      try {
        const systemPrompt = [
          `You are Cairn Project Intelligence AI — an expert financial, token-telemetry, and engineering forensics assistant built into the Cairn Control Plane.`,
          `You have direct access to real-time ground-truth telemetry for this repository (${this.options.getPolicy().project}).`,
          `Rules:`,
          `1. NEVER invent or hallucinate numbers. Always cite the exact USD costs, token counts (uncached input, cached reads, output), step numbers, model names, technical layers, and git hashes from the provided tool telemetry.`,
          `2. Structure your answer clearly using concise Markdown headings (###), bullet points, bold key metrics, and inline code backticks for file paths, step IDs, and tools.`,
          `3. When asked WHY a task or session cost so much or where tokens went, explain: (a) which specific steps/calls and technical layers consumed the most tokens, (b) the ratio of cached reads vs uncached input tokens, (c) output token generation, and (d) how switching models would reduce cost.`,
          `4. When asked what work was done recently, summarize the latest steps, tools run, files touched, and git checkpoints.`,
          `5. Keep your response sharp, executive, and actionable.`,
        ].join('\n');

        const messages: Array<Record<string, unknown>> = [
          { role: 'system', content: systemPrompt },
        ];

        if (Array.isArray(req.history)) {
          for (const h of req.history.slice(-6)) {
            if (h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') {
              messages.push({ role: h.role, content: h.content.slice(0, 1500) });
            }
          }
        }

        const groundedContext = detailedToolResults
          .map((tr) => `Tool \`${tr.name}\` (${JSON.stringify(tr.args)}):\n${JSON.stringify(tr.result)}`)
          .join('\n\n');

        messages.push({
          role: 'user',
          content: `User Question: ${query}\n\nLive Cairn Telemetry Ground Truth:\n${groundedContext}`,
        });

        const needsCustomSqlTool = /\b(sql|table|column|schema|select\s+)\b/i.test(query);
        const candidateModels =
          selectedModel === 'Llama-3.1-8B'
            ? ['Llama-3.1-8B']
            : [selectedModel, 'Llama-3.1-8B'];

        for (const candidateModel of candidateModels) {
          if (answer) break;
          const controller = new AbortController();
          const timeoutMs = candidateModel === 'Llama-3.1-8B' ? 12_000 : 14_000;
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          const reqPayload: Record<string, unknown> = {
            model: candidateModel,
            messages,
            max_tokens: 650,
            temperature: 0.2,
          };
          if (needsCustomSqlTool) {
            reqPayload.tools = INTEL_TOOLS_SCHEMA.filter(
              (t) => t.function.name === 'execute_safe_readonly_sql'
            );
            reqPayload.tool_choice = 'auto';
          }

          try {
            const res1 = await fetch(`${endpoint}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify(reqPayload),
              signal: controller.signal,
            });
            clearTimeout(timer);

            if (res1.ok) {
              const data1 = (await res1.json()) as {
                choices?: Array<{
                  message?: {
                    role?: string;
                    content?: string;
                    tool_calls?: Array<{
                      id: string;
                      type: string;
                      function: { name: string; arguments: string };
                    }>;
                  };
                }>;
                usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
              };

              promptTokens += Number(data1.usage?.prompt_tokens ?? 0);
              completionTokens += Number(data1.usage?.completion_tokens ?? 0);

              const msg1 = data1.choices?.[0]?.message;
              if (msg1?.tool_calls && msg1.tool_calls.length > 0) {
                messages.push(msg1 as Record<string, unknown>);

                for (const tc of msg1.tool_calls) {
                  let parsedArgs: Record<string, unknown> = {};
                  try {
                    parsedArgs = JSON.parse(tc.function.arguments || '{}');
                  } catch {
                    parsedArgs = {};
                  }
                  const exec = this.executeTool(tc.function.name, parsedArgs);
                  if (!toolsUsed.some((u) => u.name === tc.function.name)) {
                    toolsUsed.push({
                      name: tc.function.name,
                      args: parsedArgs,
                      summary: exec.summary,
                    });
                  }
                  detailedToolResults.push({
                    name: tc.function.name,
                    args: parsedArgs,
                    result: exec.result,
                  });
                  messages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify(exec.result),
                  });
                }

                const controller2 = new AbortController();
                const timer2 = setTimeout(() => controller2.abort(), 14_000);
                const res2 = await fetch(`${endpoint}/chat/completions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: candidateModel,
                    messages,
                    max_tokens: 650,
                    temperature: 0.2,
                  }),
                  signal: controller2.signal,
                });
                clearTimeout(timer2);

                if (res2.ok) {
                  const data2 = (await res2.json()) as {
                    choices?: Array<{ message?: { content?: string } }>;
                    usage?: { prompt_tokens?: number; completion_tokens?: number };
                  };
                  promptTokens += Number(data2.usage?.prompt_tokens ?? 0);
                  completionTokens += Number(data2.usage?.completion_tokens ?? 0);
                  answer = String(data2.choices?.[0]?.message?.content ?? '').trim();
                }
              } else if (msg1?.content) {
                answer = String(msg1.content).trim();
              }
            }
          } catch {
            clearTimeout(timer);
          }
        }
      } catch {
        // Fallback to deterministic synthesis if network/upstream fails
      }
    }

    if (!answer) {
      provider = req.localFallbackOnly ? 'cairn-local-engine' : 'cairn-telemetry-fallback';
      answer = this.synthesizeDeterministicAnswer(query, detailedToolResults, liveState);
    }

    // Strip any <think>...</think> wrapper if a reasoning model (like DeepSeek-R1 or QwQ) emitted raw think tags
    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const visual = this.buildVisualMetadata(query, liveState, req.taskId);
    const response: IntelQueryResponse = {
      ok: true,
      query,
      answer,
      model: selectedModel,
      provider,
      latencyMs: Math.max(1, Date.now() - startTime),
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      toolsUsed,
      highlights: visual.highlights,
      breakdownTitle: visual.breakdownTitle,
      breakdownRows: visual.breakdownRows,
      suggestedFollowUps: visual.suggestedFollowUps,
      createdAt: new Date().toISOString(),
    };

    this.historyLog.unshift(response);
    if (this.historyLog.length > 30) {
      this.historyLog.length = 30;
    }

    return response;
  }
}
