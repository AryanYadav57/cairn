import { z } from 'zod';
import YAML from 'yaml';
import type { RiskLevel } from './canonical.js';

export const BudgetConfigSchema = z.object({
  usd: z.number().positive().optional(),
  tokens: z.number().int().positive().optional(),
  requests: z.number().int().positive().optional(),
  thresholds: z.array(z.number().min(1).max(100)).default([50, 80, 95]),
  exhaustion_mode: z.enum(['wind_down', 'block']).default('wind_down'),
});

export const RoutingPolicySchema = z.object({
  default: z.string().default('smart'),
  on_budget_80: z.enum(['fast_at_task_boundary', 'fast_immediate', 'keep']).default('fast_at_task_boundary'),
  on_budget_100: z.enum(['wind_down_then_block', 'block']).default('wind_down_then_block'),
  fallback_on_error: z.string().optional(),
});

export const ActionsPolicySchema = z.object({
  allow: z.array(z.string()).default(['read_file', 'list_dir', 'grep_search', 'run_tests']),
  ask: z.array(z.string()).default(['write_file', 'edit_file', 'git_push', 'install_package', 'bash']),
  deny: z.array(z.string()).default(['rm_rf_root', 'drop_database', 'git_push_force_main']),
});

export const RemotePolicySchema = z.object({
  enabled: z.boolean().default(true),
  require_biometric_for_high_risk: z.boolean().default(true),
  session_timeout_minutes: z.number().int().positive().default(120),
});

export const CairnPolicySchema = z.object({
  project: z.string().default('default-project'),
  budgets: z
    .object({
      global: BudgetConfigSchema.optional(),
      project: BudgetConfigSchema.optional(),
      daily: BudgetConfigSchema.optional(),
      task: BudgetConfigSchema.optional(),
      session: BudgetConfigSchema.optional(),
    })
    .default({
      project: { usd: 40, thresholds: [50, 80, 95], exhaustion_mode: 'wind_down' },
      daily: { usd: 10, thresholds: [50, 80, 95], exhaustion_mode: 'wind_down' },
      task: { usd: 3, thresholds: [50, 80, 95], exhaustion_mode: 'wind_down' },
    }),
  routing: RoutingPolicySchema.default({}),
  aliases: z
    .record(z.string(), z.string())
    .default({
      smart: 'anthropic/claude-3-7-sonnet',
      fast: 'openai/gpt-4o-mini',
      local: 'ollama/qwen2.5-coder:14b',
    }),
  actions: ActionsPolicySchema.default({}),
  remote: RemotePolicySchema.default({}),
});

export type CairnPolicy = z.infer<typeof CairnPolicySchema>;
export type ActionDecision = 'allow' | 'ask' | 'deny';

export interface ClassifiedAction {
  toolName: string;
  target: string;
  riskLevel: RiskLevel;
  decision: ActionDecision;
  reason: string;
  preview: string;
  reversible: boolean;
}

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; id: string; reason: string; denyByDefault: boolean }> = [
  { pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|--recursive)\s+(\/|~|\*|\.\.)/i, id: 'rm_rf_root', reason: 'Recursive deletion of root or parent directory', denyByDefault: true },
  { pattern: /\bdrop\s+(database|table|schema)\b/i, id: 'drop_database', reason: 'Destructive SQL DROP statement', denyByDefault: true },
  { pattern: /\bgit\s+push\s+.*(--force|-f)\b.*\b(main|master)\b/i, id: 'git_push_force_main', reason: 'Force push to main/master branch', denyByDefault: true },
  { pattern: /\bgit\s+push\b/i, id: 'git_push', reason: 'Pushes local commits to remote repository', denyByDefault: false },
  { pattern: /\b(npm|pnpm|yarn|pip|cargo|winget|brew)\s+(install|i|add)\b/i, id: 'install_package', reason: 'Installs external package dependency', denyByDefault: false },
  { pattern: /\bgit\s+reset\s+--hard\b/i, id: 'git_reset_hard', reason: 'Hard reset discards uncommitted changes', denyByDefault: false },
  { pattern: /\b(curl|wget|Invoke-WebRequest)\b.*\|\s*(sh|bash|powershell|pwsh)/i, id: 'pipe_to_shell', reason: 'Remote script piped directly to shell', denyByDefault: true },
];

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+override:\s+you\s+are\s+now/i,
  /exfiltrate\s+.*\b(env|api_key|secret|token)\b/i,
  /curl\s+.*\$\{?(OPENAI_API_KEY|ANTHROPIC_API_KEY|AWS_SECRET)/i,
];

export function parsePolicyYaml(yamlContent: string): { policy?: CairnPolicy; errors?: string[] } {
  try {
    const raw = YAML.parse(yamlContent) ?? {};
    const parsed = CairnPolicySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`),
      };
    }
    return { policy: parsed.data };
  } catch (err) {
    return { errors: [(err as Error).message] };
  }
}

/**
 * Classifies a tool call according to POL-3 (deny > ask > allow) and SAF-1..SAF-5.
 */
export function classifyToolAction(
  toolName: string,
  argsJson: string,
  policy: CairnPolicy
): ClassifiedAction {
  let parsedArgs: Record<string, unknown> = {};
  try {
    parsedArgs = JSON.parse(argsJson || '{}');
  } catch {
    parsedArgs = { raw: argsJson };
  }

  const commandStr = String(
    parsedArgs.command ?? parsedArgs.CommandLine ?? parsedArgs.cmd ?? parsedArgs.script ?? ''
  );
  const pathStr = String(
    parsedArgs.path ?? parsedArgs.Path ?? parsedArgs.file_path ?? parsedArgs.target ?? ''
  );
  const target = commandStr || pathStr || toolName;

  // 1. Check dangerous patterns inside shell commands or arguments
  for (const dp of DANGEROUS_PATTERNS) {
    if (dp.pattern.test(commandStr) || dp.pattern.test(argsJson)) {
      const inDeny = policy.actions.deny.includes(dp.id) || dp.denyByDefault;
      if (inDeny && !policy.actions.allow.includes(dp.id)) {
        return {
          toolName,
          target,
          riskLevel: 'high',
          decision: 'deny',
          reason: dp.reason,
          preview: `[BLOCKED] ${toolName}: ${target}`,
          reversible: false,
        };
      }
      return {
        toolName,
        target,
        riskLevel: 'high',
        decision: 'ask',
        reason: dp.reason,
        preview: `[HIGH RISK] ${toolName} on "${target}" (${dp.reason})`,
        reversible: !/push|curl|wget/i.test(commandStr),
      };
    }
  }

  // 2. Rule precedence: deny beats ask beats allow (POL-3)
  if (policy.actions.deny.includes(toolName)) {
    return {
      toolName,
      target,
      riskLevel: 'high',
      decision: 'deny',
      reason: `Tool "${toolName}" is explicitly denied by cairn.yaml policy`,
      preview: `[DENIED] ${toolName}: ${target}`,
      reversible: false,
    };
  }

  const isReadOnly = /^(read|view|list|grep|search|get|find|inspect)/i.test(toolName);
  if (isReadOnly && !policy.actions.ask.includes(toolName)) {
    return {
      toolName,
      target,
      riskLevel: 'read-only',
      decision: 'allow',
      reason: 'Read-only inspection tool',
      preview: `Read "${target}"`,
      reversible: true,
    };
  }

  if (policy.actions.ask.includes(toolName)) {
    const isShell = /^(bash|sh|run_command|exec|terminal)/i.test(toolName);
    return {
      toolName,
      target,
      riskLevel: isShell ? 'high' : 'medium',
      decision: 'ask',
      reason: `Tool "${toolName}" requires approval per policy`,
      preview: isShell
        ? `Run shell command: ${commandStr || argsJson.slice(0, 120)}`
        : `Modify file: ${pathStr || argsJson.slice(0, 120)}`,
      reversible: true,
    };
  }

  if (policy.actions.allow.includes(toolName)) {
    return {
      toolName,
      target,
      riskLevel: 'low',
      decision: 'allow',
      reason: `Tool "${toolName}" is allowed by policy`,
      preview: `Execute ${toolName}: ${target}`,
      reversible: true,
    };
  }

  // Default safe posture: mutating or unknown tools require confirmation (Principle 5)
  return {
    toolName,
    target,
    riskLevel: 'medium',
    decision: 'ask',
    reason: `Unlisted tool "${toolName}" defaults to supervised approval`,
    preview: `Execute ${toolName} on ${target}`,
    reversible: true,
  };
}

/**
 * SAF-6: Scans tool outputs or external content for likely prompt-injection patterns.
 */
export function detectPromptInjection(text: string): { detected: boolean; matches: string[] } {
  const matches: string[] = [];
  for (const regex of PROMPT_INJECTION_PATTERNS) {
    const m = text.match(regex);
    if (m) {
      matches.push(m[0]);
    }
  }
  return { detected: matches.length > 0, matches };
}

/**
 * OBS-5: Redacts API keys, tokens, and secrets before persisting traces to SQLite.
 */
export function redactSecrets(input: string): string {
  return input
    .replace(/\b(sk-[a-zA-Z0-9_-]{16,})\b/g, 'sk-[REDACTED]')
    .replace(/\b(sk-ant-[a-zA-Z0-9_-]{16,})\b/g, 'sk-ant-[REDACTED]')
    .replace(/\b(ghp_[a-zA-Z0-9]{20,})\b/g, 'ghp_[REDACTED]')
    .replace(/\b(AKIA[0-9A-Z]{16})\b/g, 'AKIA[REDACTED]')
    .replace(/(Bearer\s+)[a-zA-Z0-9._-]{20,}/gi, '$1[REDACTED]');
}
