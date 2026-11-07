import {
  resolveModelAndProvider,
  type CairnPolicy,
  type CanonicalToolCall,
  type ModelCapabilities,
} from '@cairn/core';
import type { CairnDatabase } from '../db/database.js';

export interface BudgetEvaluation {
  allowed: boolean;
  windDownRequired: boolean;
  windDownInstruction?: string;
  selectedModel: ModelCapabilities;
  downgraded: boolean;
  downgradeReason?: string;
  triggeredAlerts: Array<{
    scope: 'project' | 'daily' | 'task';
    thresholdPercent: number;
    spentUsd: number;
    limitUsd: number;
  }>;
  runawayDetected: boolean;
  runawayReason?: string;
}

export class BudgetAndLoopManager {
  private readonly pendingTaskBoundaryDowngrade = new Set<string>();
  private readonly recentToolFingerprints = new Map<string, string[]>();
  private readonly windDownIssuedKeys = new Set<string>();
  private readonly notifiedThresholds = new Map<string, Set<number>>();

  constructor(private readonly db: CairnDatabase) {}

  public resetState(): void {
    this.windDownIssuedKeys.clear();
    this.notifiedThresholds.clear();
  }

  /**
   * Evaluates budgets (BUD-1..BUD-5) and runaway loops (BUD-6) before dispatching a model request.
   */
  public evaluatePreCall(params: {
    policy: CairnPolicy;
    requestedModel: string;
    taskId?: string;
    runId: string;
    isNewTaskBoundary?: boolean;
  }): BudgetEvaluation {
    const { policy, requestedModel, taskId, runId, isNewTaskBoundary } = params;
    const spend = this.db.getSpendSummary(taskId);
    const triggeredAlerts: BudgetEvaluation['triggeredAlerts'] = [];

    let maxPercentUsed = 0;
    let hardCapExceededScope: string | null = null;
    let exhaustionMode: 'wind_down' | 'block' = 'wind_down';

    const scopes: Array<{
      name: 'project' | 'daily' | 'task';
      spentUsd: number;
      limitUsd?: number;
      spentTokens: number;
      limitTokens?: number;
      spentCalls: number;
      limitCalls?: number;
      thresholds: number[];
      mode: 'wind_down' | 'block';
    }> = [
      {
        name: 'project',
        spentUsd: spend.projectUsd,
        limitUsd: policy.budgets.project?.usd,
        spentTokens: spend.totalTokens,
        limitTokens: policy.budgets.project?.tokens,
        spentCalls: spend.totalCalls,
        limitCalls: policy.budgets.project?.requests,
        thresholds: policy.budgets.project?.thresholds ?? [50, 80, 95],
        mode: policy.budgets.project?.exhaustion_mode ?? 'wind_down',
      },
      {
        name: 'daily',
        spentUsd: spend.dailyUsd,
        limitUsd: policy.budgets.daily?.usd,
        spentTokens: spend.dailyTokens,
        limitTokens: policy.budgets.daily?.tokens,
        spentCalls: spend.dailyCalls,
        limitCalls: policy.budgets.daily?.requests,
        thresholds: policy.budgets.daily?.thresholds ?? [50, 80, 95],
        mode: policy.budgets.daily?.exhaustion_mode ?? 'wind_down',
      },
      {
        name: 'task',
        spentUsd: spend.taskUsd,
        limitUsd: policy.budgets.task?.usd,
        spentTokens: spend.taskTokens,
        limitTokens: policy.budgets.task?.tokens,
        spentCalls: spend.taskCalls,
        limitCalls: policy.budgets.task?.requests,
        thresholds: policy.budgets.task?.thresholds ?? [50, 80, 95],
        mode: policy.budgets.task?.exhaustion_mode ?? 'wind_down',
      },
    ];

    for (const s of scopes) {
      const usdPct = s.limitUsd && s.limitUsd > 0 ? (s.spentUsd / s.limitUsd) * 100 : 0;
      const tokPct = s.limitTokens && s.limitTokens > 0 ? (s.spentTokens / s.limitTokens) * 100 : 0;
      const reqPct = s.limitCalls && s.limitCalls > 0 ? (s.spentCalls / s.limitCalls) * 100 : 0;
      const pct = Math.max(usdPct, tokPct, reqPct);

      if (pct <= 0) continue;
      if (pct > maxPercentUsed) {
        maxPercentUsed = pct;
      }

      const alertKey = `${s.name}:${s.name === 'task' ? taskId ?? 'default' : 'global'}`;
      let notifiedSet = this.notifiedThresholds.get(alertKey);
      if (!notifiedSet) {
        notifiedSet = new Set<number>();
        this.notifiedThresholds.set(alertKey, notifiedSet);
      }

      for (const th of s.thresholds) {
        if (pct >= th && !notifiedSet.has(th)) {
          notifiedSet.add(th);
          triggeredAlerts.push({
            scope: s.name,
            thresholdPercent: th,
            spentUsd: s.spentUsd,
            limitUsd: s.limitUsd ?? 0,
          });
        }
      }

      if (pct >= 100) {
        if (usdPct >= 100 && s.limitUsd) {
          hardCapExceededScope = `${s.name} ($${s.spentUsd.toFixed(2)} / $${s.limitUsd.toFixed(2)})`;
        } else if (tokPct >= 100 && s.limitTokens) {
          hardCapExceededScope = `${s.name} (${s.spentTokens.toLocaleString()} / ${s.limitTokens.toLocaleString()} tokens)`;
        } else {
          hardCapExceededScope = `${s.name} (${s.spentCalls} / ${s.limitCalls} requests)`;
        }
        exhaustionMode = s.mode;
      }
    }

    // BUD-5: Cache-safe auto-downgrade at 80% budget
    let effectiveModelName = requestedModel || policy.routing.default;
    let downgraded = false;
    let downgradeReason: string | undefined;

    if (maxPercentUsed >= 80) {
      if (policy.routing.on_budget_80 === 'fast_immediate') {
        effectiveModelName = 'fast';
        downgraded = true;
        downgradeReason = `Budget at ${Math.round(maxPercentUsed)}% — immediate downgrade to 'fast' alias`;
      } else if (policy.routing.on_budget_80 === 'fast_at_task_boundary') {
        this.pendingTaskBoundaryDowngrade.add(runId);
        if (isNewTaskBoundary) {
          effectiveModelName = 'fast';
          downgraded = true;
          downgradeReason = `Budget at ${Math.round(
            maxPercentUsed
          )}% — cache-safe downgrade to 'fast' alias at task boundary`;
        } else {
          downgradeReason = `Budget at ${Math.round(
            maxPercentUsed
          )}% — queued downgrade for next task boundary (keeping warm prompt cache for current task)`;
        }
      }
    }

    const selectedModel = resolveModelAndProvider(effectiveModelName, policy.aliases);

    // BUD-4: Hard cap handling (Graceful 1-Turn Wind-Down vs Hard Block)
    if (hardCapExceededScope) {
      const windDownKey = `${runId}:${taskId ?? 'default'}`;
      if (
        exhaustionMode === 'wind_down' &&
        policy.routing.on_budget_100 === 'wind_down_then_block' &&
        !this.windDownIssuedKeys.has(windDownKey)
      ) {
        this.windDownIssuedKeys.add(windDownKey);
        return {
          allowed: true,
          windDownRequired: true,
          windDownInstruction: `[CAIRN BUDGET CAP REACHED: ${hardCapExceededScope}] Do NOT invoke any further mutating tools or start new loops. Save any clean state, summarize your progress and remaining work concisely, and finish your turn immediately.`,
          selectedModel,
          downgraded,
          downgradeReason,
          triggeredAlerts,
          runawayDetected: false,
        };
      }

      return {
        allowed: false,
        windDownRequired: false,
        selectedModel,
        downgraded,
        downgradeReason,
        triggeredAlerts,
        runawayDetected: false,
      };
    }

    return {
      allowed: true,
      windDownRequired: false,
      selectedModel,
      downgraded,
      downgradeReason,
      triggeredAlerts,
      runawayDetected: false,
    };
  }

  /**
   * BUD-6: Runaway detection — flags when an agent repeats the exact same tool call 3+ times in a row.
   */
  public recordAndCheckRunaway(
    runId: string,
    toolCalls: CanonicalToolCall[]
  ): { runaway: boolean; reason?: string } {
    if (toolCalls.length === 0) return { runaway: false };

    const history = this.recentToolFingerprints.get(runId) ?? [];
    for (const tc of toolCalls) {
      const fingerprint = `${tc.name}:${tc.arguments.trim()}`;
      history.push(fingerprint);
    }
    while (history.length > 8) {
      history.shift();
    }
    this.recentToolFingerprints.set(runId, history);

    if (history.length >= 3) {
      const last3 = history.slice(-3);
      if (last3[0] === last3[1] && last3[1] === last3[2]) {
        return {
          runaway: true,
          reason: `Agent repeated identical tool call 3 times in a row (${last3[0].slice(0, 80)})`,
        };
      }
    }
    return { runaway: false };
  }
}
