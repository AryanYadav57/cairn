import type { AgentHarnessType, ModelCapabilities, TaskComplexity } from '../schema/canonical.js';
import { BUILTIN_MODELS, resolveModelAndProvider } from '../pricing/registry.js';

export interface RepoScanSummary {
  repoPath: string;
  totalFiles: number;
  totalLinesOfCode: number;
  languages: Record<string, number>;
  hasTests: boolean;
  repoComplexityFactor: number; // 1.0 for greenfield, up to 2.2 for large legacy repos
}

export interface EstimatedTask {
  id: string;
  title: string;
  feature: string;
  complexity: TaskComplexity;
  predictedFiles: string[];
  turns: number;
  baseContextTokens: number;
  perTurnNewInputTokens: number;
  outputTokensPerTurn: number;
  recommendedModelAlias: 'smart' | 'fast' | 'local';
  tokens: {
    low: number;
    expected: number;
    high: number;
    uncachedInput: number;
    cachedInput: number;
    output: number;
  };
  costUsd: {
    low: number;
    expected: number;
    high: number;
  };
}

export interface CalibrationMultipliers {
  retryFactorLow: number;
  retryFactorExpected: number;
  retryFactorHigh: number;
  cacheHitRatio: number;
  integrationOverhead: number;
  sampleSize: number;
  medianErrorPercent?: number;
}

export interface ProjectEstimateReport {
  id: string;
  projectName: string;
  prdTitle: string;
  modelId: string;
  modelDisplayName: string;
  createdAt: string;
  confidence: 'low' | 'medium' | 'high';
  confidenceReasons: string[];
  repoSummary: RepoScanSummary;
  multipliers: CalibrationMultipliers;
  tasks: EstimatedTask[];
  totals: {
    tokens: {
      low: number;
      expected: number;
      high: number;
      uncachedInput: number;
      cachedInput: number;
      output: number;
    };
    costUsd: {
      low: number;
      expected: number;
      high: number;
    };
  };
  topCostDrivers: Array<{
    taskId: string;
    title: string;
    expectedUsd: number;
    sharePercent: number;
  }>;
  whatIfScenarios: Array<{
    label: string;
    modelId: string;
    category?: 'frontier' | 'open-source' | 'local' | 'hybrid';
    harnesses?: AgentHarnessType[];
    description?: string;
    contextLength?: number;
    promptCaching?: boolean;
    inputPerMillion?: number;
    cacheReadPerMillion?: number;
    outputPerMillion?: number;
    expectedUsd: number;
    lowUsd?: number;
    highUsd?: number;
    savingsPercent: number;
  }>;
}

export const DEFAULT_CALIBRATION: CalibrationMultipliers = {
  retryFactorLow: 1.25,
  retryFactorExpected: 1.85,
  retryFactorHigh: 2.8,
  cacheHitRatio: 0.85,
  integrationOverhead: 1.12,
  sampleSize: 0,
};

const COMPLEXITY_DEFAULTS: Record<
  TaskComplexity,
  {
    turns: number;
    baseContextTokens: number;
    perTurnNewInputTokens: number;
    outputTokensPerTurn: number;
    recommendedAlias: 'smart' | 'fast' | 'local';
  }
> = {
  low: {
    turns: 4,
    baseContextTokens: 4_500,
    perTurnNewInputTokens: 1_400,
    outputTokensPerTurn: 900,
    recommendedAlias: 'fast',
  },
  medium: {
    turns: 8,
    baseContextTokens: 9_000,
    perTurnNewInputTokens: 2_200,
    outputTokensPerTurn: 1_500,
    recommendedAlias: 'smart',
  },
  high: {
    turns: 15,
    baseContextTokens: 16_000,
    perTurnNewInputTokens: 3_200,
    outputTokensPerTurn: 2_400,
    recommendedAlias: 'smart',
  },
};

/**
 * Extracts tasks deterministically from a Markdown/Text PRD when offline or before LLM refinement.
 */
export function decomposePrdMarkdown(prdContent: string): Array<{
  id: string;
  title: string;
  feature: string;
  complexity: TaskComplexity;
  predictedFiles: string[];
}> {
  const lines = prdContent.split(/\r?\n/);
  const tasks: Array<{
    id: string;
    title: string;
    feature: string;
    complexity: TaskComplexity;
    predictedFiles: string[];
  }> = [];

  let currentFeature = 'Core Architecture';
  let counter = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const h3Match = line.match(/^#{2,3}\s+(?:\d+(?:\.\d+)?\s*)?(.+)$/);
    if (h3Match) {
      const heading = h3Match[1].trim();
      if (
        !/^(overview|problem|core idea|goals|non-goals|target users|product principles|scope|risks|competitive|open questions|immediate next|data model|user flows|non-functional|success metrics|roadmap|business)/i.test(
          heading
        )
      ) {
        currentFeature = heading;
      }
      continue;
    }

    // Match requirement bullets like "- **GW-1:** Expose an OpenAI-compatible endpoint..."
    // or numbered/bulleted actionable feature items
    const reqMatch = line.match(/^-\s+\*\*([A-Z]{2,4}-\d+):\*\*\s+(.+)$/);
    if (reqMatch) {
      const reqCode = reqMatch[1];
      const desc = reqMatch[2];
      const complexity: TaskComplexity =
        /stream|proxy|webrtc|window|intercept|calibrate|decompos|rollback|shadow|biometric|tunnel/i.test(
          desc
        )
          ? 'high'
          : /schema|config|export|report|alert|status|table|filter/i.test(desc)
          ? 'low'
          : 'medium';

      tasks.push({
        id: reqCode.toLowerCase(),
        title: `${reqCode}: ${desc.slice(0, 90)}${desc.length > 90 ? '...' : ''}`,
        feature: currentFeature,
        complexity,
        predictedFiles: inferPredictedFiles(currentFeature, desc),
      });
      counter++;
    }
  }

  // Fallback if PRD doesn't use bold requirement codes: extract bullet points under feature sections
  if (tasks.length === 0) {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      const bullet = line.match(/^[-*]\s+(.{15,140})$/);
      if (bullet && tasks.length < 25) {
        const desc = bullet[1].replace(/\*\*/g, '');
        const complexity: TaskComplexity =
          /auth|payment|stream|database|migration|security|compiler|engine/i.test(desc)
            ? 'high'
            : /ui|style|copy|readme|config/i.test(desc)
            ? 'low'
            : 'medium';
        tasks.push({
          id: `task-${counter++}`,
          title: desc,
          feature: currentFeature,
          complexity,
          predictedFiles: inferPredictedFiles(currentFeature, desc),
        });
      }
    }
  }

  if (tasks.length === 0) {
    tasks.push({
      id: 'task-1',
      title: 'Core Project Implementation',
      feature: 'MVP',
      complexity: 'medium',
      predictedFiles: ['src/index.ts'],
    });
  }

  return tasks;
}

function inferPredictedFiles(feature: string, description: string): string[] {
  const combined = `${feature} ${description}`.toLowerCase();
  if (combined.includes('gateway') || combined.includes('endpoint') || combined.includes('stream')) {
    return ['packages/daemon/src/gateway/server.ts', 'packages/daemon/src/adapters/index.ts'];
  }
  if (combined.includes('estimat') || combined.includes('prd') || combined.includes('token')) {
    return ['packages/core/src/estimator/engine.ts', 'packages/daemon/src/estimator/scanner.ts'];
  }
  if (combined.includes('budget') || combined.includes('downgrade') || combined.includes('wind-down')) {
    return ['packages/daemon/src/budget/manager.ts'];
  }
  if (combined.includes('safe') || combined.includes('undo') || combined.includes('checkpoint')) {
    return ['packages/daemon/src/safety/git-shadow.ts', 'packages/core/src/schema/policy.ts'];
  }
  if (combined.includes('mobile') || combined.includes('remote') || combined.includes('window')) {
    return ['packages/daemon/src/remote/hub.ts', 'packages/daemon/src/os-bridge/win32.ts'];
  }
  if (combined.includes('extension') || combined.includes('ide') || combined.includes('status bar')) {
    return ['packages/extension/src/extension.ts'];
  }
  return ['packages/daemon/src/index.ts'];
}

/**
 * Computes the cache-aware multi-turn token and dollar cost for a single task (Section 8.2 formula).
 */
export function computeTaskEstimate(
  rawTask: {
    id: string;
    title: string;
    feature: string;
    complexity: TaskComplexity;
    predictedFiles: string[];
    turns?: number;
  },
  model: ModelCapabilities,
  repoFactor: number,
  multipliers: CalibrationMultipliers
): EstimatedTask {
  const defaults = COMPLEXITY_DEFAULTS[rawTask.complexity];
  const turns = rawTask.turns ?? defaults.turns;
  const baseContext = Math.round(defaults.baseContextTokens * repoFactor);
  const newPerTurn = Math.round(defaults.perTurnNewInputTokens * Math.sqrt(repoFactor));
  const outPerTurn = defaults.outputTokensPerTurn;

  const effectiveCacheRatio = model.promptCaching ? multipliers.cacheHitRatio : 0;

  let cumulativeUncachedInput = 0;
  let cumulativeCachedInput = 0;

  for (let t = 1; t <= turns; t++) {
    const turnNew = t === 1 ? baseContext : newPerTurn;
    const priorContext = t === 1 ? 0 : baseContext + (t - 2) * newPerTurn;
    const turnCached = Math.round(priorContext * effectiveCacheRatio);
    const turnUncachedPrefix = priorContext - turnCached;

    cumulativeUncachedInput += turnNew + turnUncachedPrefix;
    cumulativeCachedInput += turnCached;
  }

  const baseOutput = outPerTurn * turns;

  const uncachedInputExpected = Math.round(
    cumulativeUncachedInput * multipliers.retryFactorExpected * multipliers.integrationOverhead
  );
  const cachedInputExpected = Math.round(
    cumulativeCachedInput * multipliers.retryFactorExpected * multipliers.integrationOverhead
  );
  const outputExpected = Math.round(
    baseOutput * multipliers.retryFactorExpected * multipliers.integrationOverhead
  );

  const expectedTotalTokens = uncachedInputExpected + cachedInputExpected + outputExpected;
  const lowTotalTokens = Math.round(
    expectedTotalTokens * (multipliers.retryFactorLow / multipliers.retryFactorExpected)
  );
  const highTotalTokens = Math.round(
    expectedTotalTokens * (multipliers.retryFactorHigh / multipliers.retryFactorExpected)
  );

  // Price calculation accounting for cache write & cache read rates
  const { pricing } = model;
  const baseTurnCost =
    (cumulativeUncachedInput / 1_000_000) *
      (model.promptCaching ? pricing.cacheWritePerMillion : pricing.inputPerMillion) +
    (cumulativeCachedInput / 1_000_000) * pricing.cacheReadPerMillion +
    (baseOutput / 1_000_000) * pricing.outputPerMillion;

  const expectedUsd = Number(
    (baseTurnCost * multipliers.retryFactorExpected * multipliers.integrationOverhead).toFixed(4)
  );
  const lowUsd = Number(
    (baseTurnCost * multipliers.retryFactorLow * multipliers.integrationOverhead).toFixed(4)
  );
  const highUsd = Number(
    (baseTurnCost * multipliers.retryFactorHigh * multipliers.integrationOverhead).toFixed(4)
  );

  return {
    id: rawTask.id,
    title: rawTask.title,
    feature: rawTask.feature,
    complexity: rawTask.complexity,
    predictedFiles: rawTask.predictedFiles,
    turns,
    baseContextTokens: baseContext,
    perTurnNewInputTokens: newPerTurn,
    outputTokensPerTurn: outPerTurn,
    recommendedModelAlias: defaults.recommendedAlias,
    tokens: {
      low: lowTotalTokens,
      expected: expectedTotalTokens,
      high: highTotalTokens,
      uncachedInput: uncachedInputExpected,
      cachedInput: cachedInputExpected,
      output: outputExpected,
    },
    costUsd: {
      low: lowUsd,
      expected: expectedUsd,
      high: highUsd,
    },
  };
}

/**
 * Generates a full ProjectEstimateReport including top cost drivers and What-If scenarios (EST-1..EST-6).
 */
export function buildProjectEstimate(params: {
  projectName: string;
  prdContent: string;
  modelOrAlias: string;
  aliases?: Record<string, string>;
  repoSummary?: RepoScanSummary;
  multipliers?: CalibrationMultipliers;
  customTasks?: Array<{
    id: string;
    title: string;
    feature: string;
    complexity: TaskComplexity;
    predictedFiles: string[];
    turns?: number;
  }>;
}): ProjectEstimateReport {
  const aliases = params.aliases ?? {
    smart: 'anthropic/claude-3-7-sonnet',
    fast: 'openai/gpt-4o-mini',
    local: 'ollama/qwen2.5-coder:14b',
  };
  const model = resolveModelAndProvider(params.modelOrAlias, aliases);
  const multipliers = params.multipliers ?? DEFAULT_CALIBRATION;
  const repoSummary: RepoScanSummary = params.repoSummary ?? {
    repoPath: '.',
    totalFiles: 1,
    totalLinesOfCode: 450,
    languages: { markdown: 1 },
    hasTests: false,
    repoComplexityFactor: 1.0,
  };

  const titleMatch = params.prdContent.match(/^#\s+(.+)$/m);
  const prdTitle = titleMatch ? titleMatch[1].trim() : params.projectName;

  const rawTasks = params.customTasks ?? decomposePrdMarkdown(params.prdContent);
  const tasks = rawTasks.map((t) =>
    computeTaskEstimate(t, model, repoSummary.repoComplexityFactor, multipliers)
  );

  const totals = tasks.reduce(
    (acc, t) => {
      acc.tokens.low += t.tokens.low;
      acc.tokens.expected += t.tokens.expected;
      acc.tokens.high += t.tokens.high;
      acc.tokens.uncachedInput += t.tokens.uncachedInput;
      acc.tokens.cachedInput += t.tokens.cachedInput;
      acc.tokens.output += t.tokens.output;
      acc.costUsd.low += t.costUsd.low;
      acc.costUsd.expected += t.costUsd.expected;
      acc.costUsd.high += t.costUsd.high;
      return acc;
    },
    {
      tokens: { low: 0, expected: 0, high: 0, uncachedInput: 0, cachedInput: 0, output: 0 },
      costUsd: { low: 0, expected: 0, high: 0 },
    }
  );

  totals.costUsd.low = Number(totals.costUsd.low.toFixed(2));
  totals.costUsd.expected = Number(totals.costUsd.expected.toFixed(2));
  totals.costUsd.high = Number(totals.costUsd.high.toFixed(2));

  // Top 5 feature/task cost drivers
  const byFeature = new Map<string, number>();
  for (const t of tasks) {
    byFeature.set(t.feature, (byFeature.get(t.feature) ?? 0) + t.costUsd.expected);
  }
  const topCostDrivers = Array.from(byFeature.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([feature, usd], idx) => ({
      taskId: `driver-${idx + 1}`,
      title: feature,
      expectedUsd: Number(usd.toFixed(2)),
      sharePercent:
        totals.costUsd.expected > 0
          ? Math.round((usd / totals.costUsd.expected) * 100)
          : Math.round(100 / Math.max(1, byFeature.size)),
    }));

  // Dynamically build What-If Scenarios from all registered & auto-discovered models + Hybrid routing
  const candidateModels: Array<{
    label: string;
    id: string;
    category: 'frontier' | 'open-source' | 'local' | 'hybrid';
    harnesses?: AgentHarnessType[];
    description?: string;
    contextLength?: number;
    promptCaching?: boolean;
  }> = [
    ...Object.values(BUILTIN_MODELS).map((m) => ({
      label: m.displayName,
      id: m.id,
      category: m.category ?? 'frontier',
      harnesses: m.harnesses ?? ['antigravity', 'opencode'],
      description: m.description ?? `${m.provider} model`,
      contextLength: m.contextLength,
      promptCaching: m.promptCaching,
    })),
    {
      label: 'Smart + Fast Auto-Routing (Policy Hybrid)',
      id: 'hybrid',
      category: 'hybrid',
      harnesses: [],
      description: 'Automatic Cairn policy routing: frontier model for complex tasks, fast model for simple tasks',
      contextLength: 200_000,
      promptCaching: true,
    },
  ];

  const whatIfScenarios = candidateModels.map((cand) => {
    let scenarioUsd = 0;
    let lowUsd = 0;
    let highUsd = 0;
    let inputPerMillion = 0;
    let cacheReadPerMillion = 0;
    let outputPerMillion = 0;

    if (cand.id === 'hybrid') {
      const smartModel = resolveModelAndProvider(aliases.smart ?? 'anthropic/claude-3-7-sonnet', aliases);
      const fastModel = resolveModelAndProvider(aliases.fast ?? 'openai/gpt-4o-mini', aliases);
      inputPerMillion = smartModel.pricing.inputPerMillion;
      cacheReadPerMillion = smartModel.pricing.cacheReadPerMillion;
      outputPerMillion = smartModel.pricing.outputPerMillion;
      for (const rawTask of rawTasks) {
        const chosen = rawTask.complexity === 'low' ? fastModel : smartModel;
        const est = computeTaskEstimate(
          rawTask,
          chosen,
          repoSummary.repoComplexityFactor,
          multipliers
        );
        scenarioUsd += est.costUsd.expected;
        lowUsd += est.costUsd.low;
        highUsd += est.costUsd.high;
      }
    } else {
      const m = resolveModelAndProvider(cand.id, aliases);
      inputPerMillion = m.pricing.inputPerMillion;
      cacheReadPerMillion = m.pricing.cacheReadPerMillion;
      outputPerMillion = m.pricing.outputPerMillion;
      for (const rawTask of rawTasks) {
        const est = computeTaskEstimate(
          rawTask,
          m,
          repoSummary.repoComplexityFactor,
          multipliers
        );
        scenarioUsd += est.costUsd.expected;
        lowUsd += est.costUsd.low;
        highUsd += est.costUsd.high;
      }
    }
    scenarioUsd = Number(scenarioUsd.toFixed(2));
    lowUsd = Number(lowUsd.toFixed(2));
    highUsd = Number(highUsd.toFixed(2));
    const savingsPercent =
      totals.costUsd.expected > 0
        ? Math.round(((totals.costUsd.expected - scenarioUsd) / totals.costUsd.expected) * 100)
        : 0;
    return {
      label: cand.label,
      modelId: cand.id,
      category: cand.category,
      harnesses: cand.harnesses,
      description: cand.description,
      contextLength: cand.contextLength,
      promptCaching: cand.promptCaching,
      inputPerMillion,
      cacheReadPerMillion,
      outputPerMillion,
      expectedUsd: scenarioUsd,
      lowUsd,
      highUsd,
      savingsPercent,
    };
  });

  // Determine Confidence Rating
  const confidenceReasons: string[] = [];
  let confidenceScore = 0;
  if (rawTasks.length >= 5) {
    confidenceScore += 1;
    confidenceReasons.push(`Structured PRD with ${rawTasks.length} decomposable tasks`);
  } else {
    confidenceReasons.push(`Sparse PRD (${rawTasks.length} tasks extracted)`);
  }
  if (params.repoSummary) {
    confidenceScore += 1;
    confidenceReasons.push(
      `Repo scanned (${repoSummary.totalFiles} files, ${repoSummary.totalLinesOfCode} LOC, factor ${repoSummary.repoComplexityFactor}x)`
    );
  }
  if (multipliers.sampleSize >= 10) {
    confidenceScore += 1;
    confidenceReasons.push(`Calibrated on ${multipliers.sampleSize} historical runs`);
  } else {
    confidenceReasons.push(
      `Using default retry (${multipliers.retryFactorExpected}x) & cache (${Math.round(
        multipliers.cacheHitRatio * 100
      )}%) priors`
    );
  }

  const confidence: 'low' | 'medium' | 'high' =
    confidenceScore >= 3 ? 'high' : confidenceScore === 2 ? 'medium' : 'low';

  return {
    id: `est_${Date.now()}`,
    projectName: params.projectName,
    prdTitle,
    modelId: model.id,
    modelDisplayName: model.displayName,
    createdAt: new Date().toISOString(),
    confidence,
    confidenceReasons,
    repoSummary,
    multipliers,
    tasks,
    totals,
    topCostDrivers,
    whatIfScenarios,
  };
}

/**
 * EST-6: Formats a ProjectEstimateReport as clean Markdown.
 */
export function formatEstimateAsMarkdown(report: ProjectEstimateReport): string {
  const fmtNum = (n: number) => n.toLocaleString('en-US');
  const lines: string[] = [
    `# Cairn Estimate: ${report.prdTitle}`,
    ``,
    `- **Model:** ${report.modelDisplayName} (\`${report.modelId}\`)`,
    `- **Confidence:** **${report.confidence.toUpperCase()}** (${report.confidenceReasons.join('; ')})`,
    `- **Forecasted Spend Range:** **$${report.totals.costUsd.low.toFixed(2)} – $${report.totals.costUsd.high.toFixed(2)}** (Expected: **$${report.totals.costUsd.expected.toFixed(2)}**)`,
    `- **Forecasted Tokens:** ${fmtNum(report.totals.tokens.low)} – ${fmtNum(report.totals.tokens.high)} (Expected: ${fmtNum(report.totals.tokens.expected)} total | ${fmtNum(report.totals.tokens.cachedInput)} cached reads)`,
    ``,
    `## Top Cost Drivers`,
    `| Feature / Module | Expected Cost (USD) | Share of Spend |`,
    `| :--- | ---: | ---: |`,
    ...report.topCostDrivers.map(
      (d) => `| ${d.title} | $${d.expectedUsd.toFixed(2)} | ${d.sharePercent}% |`
    ),
    ``,
    `## What-If Scenarios`,
    `| Scenario | Expected Cost (USD) | Relative Savings |`,
    `| :--- | ---: | ---: |`,
    ...report.whatIfScenarios.map(
      (w) =>
        `| ${w.label} | $${w.expectedUsd.toFixed(2)} | ${
          w.savingsPercent >= 0 ? `${w.savingsPercent}% cheaper` : `${Math.abs(w.savingsPercent)}% more`
        } |`
    ),
    ``,
    `## Task Breakdown (${report.tasks.length} Tasks)`,
    `| ID | Feature | Task | Complexity | Turns | Expected Tokens | Expected Cost | Rec. Alias |`,
    `| :--- | :--- | :--- | :---: | ---: | ---: | ---: | :---: |`,
    ...report.tasks.map(
      (t) =>
        `| \`${t.id}\` | ${t.feature} | ${t.title} | ${t.complexity} | ${t.turns} | ${fmtNum(
          t.tokens.expected
        )} | $${t.costUsd.expected.toFixed(2)} | \`${t.recommendedModelAlias}\` |`
    ),
  ];
  return lines.join('\n');
}
