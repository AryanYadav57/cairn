import type {
  AgentHarnessType,
  CanonicalUsage,
  ModelCapabilities,
  ModelCategory,
  ProviderType,
} from '../schema/canonical.js';

export const BUILTIN_MODELS: Record<string, ModelCapabilities> = {
  // ============================================================================
  // ANTIGRAVITY IDE NATIVE MODELS (Exact 5 models from Antigravity Model Selector)
  // ============================================================================
  'google/gemini-4-argon': {
    id: 'google/gemini-4-argon',
    provider: 'google',
    displayName: 'Gemini 4 Argon · Medium (New)',
    category: 'frontier',
    harnesses: ['antigravity'],
    description: 'Antigravity IDE flagship reasoning & autonomous coding agent (Medium tier · New)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 2_000_000,
    pricing: {
      inputPerMillion: 1.5,
      outputPerMillion: 10.0,
      cacheWritePerMillion: 1.5,
      cacheReadPerMillion: 0.3,
    },
  },
  'google/gemini-3.8-flash': {
    id: 'google/gemini-3.8-flash',
    provider: 'google',
    displayName: 'Gemini 3.8 Flash · Medium',
    category: 'frontier',
    harnesses: ['antigravity'],
    description: 'Antigravity IDE high-speed coding & subagent execution model (Medium tier)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 1_000_000,
    pricing: {
      inputPerMillion: 0.2,
      outputPerMillion: 0.8,
      cacheWritePerMillion: 0.2,
      cacheReadPerMillion: 0.05,
    },
  },
  'anthropic/claude-opus-5.5': {
    id: 'anthropic/claude-opus-5.5',
    provider: 'anthropic',
    displayName: 'Claude Opus 5.5 · Medium (New)',
    category: 'frontier',
    harnesses: ['antigravity', 'claude-code'],
    description: 'Next-gen Anthropic frontier architecture & deep multi-file reasoning model (Medium · New)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 500_000,
    pricing: {
      inputPerMillion: 12.0,
      outputPerMillion: 60.0,
      cacheWritePerMillion: 15.0,
      cacheReadPerMillion: 1.2,
    },
  },
  'anthropic/claude-sonnet-5.5': {
    id: 'anthropic/claude-sonnet-5.5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 5.5 · Medium (New)',
    category: 'frontier',
    harnesses: ['antigravity', 'claude-code', 'opencode'],
    description: 'Anthropic high-velocity frontier coding agent in Antigravity IDE (Medium · New · 90% cache discount)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 400_000,
    pricing: {
      inputPerMillion: 3.0,
      outputPerMillion: 15.0,
      cacheWritePerMillion: 3.75,
      cacheReadPerMillion: 0.3,
    },
  },
  'openai/gpt-oss-120b': {
    id: 'openai/gpt-oss-120b',
    provider: 'openai',
    displayName: 'GPT-OSS 120B (Medium)',
    category: 'open-source',
    harnesses: ['antigravity', 'opencode'],
    description: 'OpenAI 120B open-weights coding & reasoning model in Antigravity IDE (Medium · Notice)',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 128_000,
    pricing: {
      inputPerMillion: 0.45,
      outputPerMillion: 1.35,
      cacheWritePerMillion: 0.45,
      cacheReadPerMillion: 0.11,
    },
  },

  // ============================================================================
  // EXTENDED GOOGLE GEMINI MODELS (OpenCode / Cursor / Extended)
  // ============================================================================
  'google/gemini-2.5-pro': {
    id: 'google/gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini 2.5 Pro',
    category: 'frontier',
    harnesses: ['opencode', 'cursor'],
    description: 'Google Gemini 2.5 Pro reasoning & coding agent (1M context window)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 1_000_000,
    pricing: {
      inputPerMillion: 1.25,
      outputPerMillion: 10.0,
      cacheWritePerMillion: 1.25,
      cacheReadPerMillion: 0.31,
    },
  },
  'google/gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    provider: 'google',
    displayName: 'Gemini 2.5 Flash',
    category: 'frontier',
    harnesses: ['opencode', 'cursor'],
    description: 'Google Gemini 2.5 Flash fast iteration model (1M context)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 1_000_000,
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
      cacheWritePerMillion: 0.15,
      cacheReadPerMillion: 0.0375,
    },
  },
  'google/gemini-2.5-flash-lite': {
    id: 'google/gemini-2.5-flash-lite',
    provider: 'google',
    displayName: 'Gemini 2.5 Flash-Lite',
    category: 'frontier',
    harnesses: ['opencode'],
    description: 'Ultra-light research & background task subagent',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 1_000_000,
    pricing: {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3,
      cacheWritePerMillion: 0.075,
      cacheReadPerMillion: 0.018,
    },
  },

  // ============================================================================
  // CLAUDE CODE / OPENCODE ANTHROPIC MODELS
  // ============================================================================
  'anthropic/claude-3-7-sonnet': {
    id: 'anthropic/claude-3-7-sonnet',
    provider: 'anthropic',
    displayName: 'Claude 3.7 Sonnet',
    category: 'frontier',
    harnesses: ['claude-code', 'opencode', 'cursor'],
    description: 'Default frontier coding agent for Claude Code & OpenCode (90% cache discount)',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 200_000,
    pricing: {
      inputPerMillion: 3.0,
      outputPerMillion: 15.0,
      cacheWritePerMillion: 3.75,
      cacheReadPerMillion: 0.3,
    },
  },
  'anthropic/claude-4-opus': {
    id: 'anthropic/claude-4-opus',
    provider: 'anthropic',
    displayName: 'Claude 4 Opus',
    category: 'frontier',
    harnesses: ['claude-code', 'opencode'],
    description: 'Maximum-capability frontier architect model for complex multi-file refactors',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 200_000,
    pricing: {
      inputPerMillion: 15.0,
      outputPerMillion: 75.0,
      cacheWritePerMillion: 18.75,
      cacheReadPerMillion: 1.5,
    },
  },
  'anthropic/claude-3-5-haiku': {
    id: 'anthropic/claude-3-5-haiku',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Haiku',
    category: 'frontier',
    harnesses: ['claude-code', 'opencode'],
    description: 'Fast background indexing & command model used by Claude Code & OpenCode',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 200_000,
    pricing: {
      inputPerMillion: 0.8,
      outputPerMillion: 4.0,
      cacheWritePerMillion: 1.0,
      cacheReadPerMillion: 0.08,
    },
  },

  // ============================================================================
  // HERMES (NOUS RESEARCH AGENT MODELS)
  // ============================================================================
  'openrouter/nousresearch/hermes-3-llama-3.1-405b': {
    id: 'openrouter/nousresearch/hermes-3-llama-3.1-405b',
    provider: 'openrouter',
    displayName: 'Nous Hermes 3 405B (Hermes Agent)',
    category: 'open-source',
    harnesses: ['hermes', 'opencode'],
    description: 'Flagship Nous Research Hermes 3 405B open-weights agent with native tool-calling & steering',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 131_072,
    pricing: {
      inputPerMillion: 0.8,
      outputPerMillion: 0.8,
      cacheWritePerMillion: 0.8,
      cacheReadPerMillion: 0.4,
    },
  },
  'openrouter/nousresearch/hermes-3-llama-3.1-70b': {
    id: 'openrouter/nousresearch/hermes-3-llama-3.1-70b',
    provider: 'openrouter',
    displayName: 'Nous Hermes 3 70B (Hermes Fast)',
    category: 'open-source',
    harnesses: ['hermes', 'opencode'],
    description: 'High-speed Nous Research Hermes 3 70B open-source agent for autonomous loops',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 131_072,
    pricing: {
      inputPerMillion: 0.3,
      outputPerMillion: 0.3,
      cacheWritePerMillion: 0.3,
      cacheReadPerMillion: 0.15,
    },
  },
  'ollama/hermes3:8b': {
    id: 'ollama/hermes3:8b',
    provider: 'ollama',
    displayName: 'Nous Hermes 3 8B (Local Ollama · $0)',
    category: 'local',
    harnesses: ['hermes', 'opencode'],
    description: 'Local on-device Nous Hermes 3 8B agent running via Ollama ($0 API cost)',
    streaming: true,
    tools: 'weak',
    vision: false,
    jsonMode: true,
    promptCaching: false,
    contextLength: 32_768,
    pricing: {
      inputPerMillion: 0.0,
      outputPerMillion: 0.0,
      cacheWritePerMillion: 0.0,
      cacheReadPerMillion: 0.0,
    },
  },

  // ============================================================================
  // OPENCODE & FRONTIER OPENAI MODELS
  // ============================================================================
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openai',
    displayName: 'OpenAI GPT-4o',
    category: 'frontier',
    harnesses: ['opencode', 'cursor'],
    description: 'Omni frontier model with 50% automatic prompt cache read discount',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 128_000,
    pricing: {
      inputPerMillion: 2.5,
      outputPerMillion: 10.0,
      cacheWritePerMillion: 2.5,
      cacheReadPerMillion: 1.25,
    },
  },
  'openai/o3-mini': {
    id: 'openai/o3-mini',
    provider: 'openai',
    displayName: 'OpenAI o3-mini (Reasoning)',
    category: 'frontier',
    harnesses: ['opencode', 'cursor'],
    description: 'Fast STEM & code reasoning frontier model for OpenCode & Cursor',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 200_000,
    pricing: {
      inputPerMillion: 1.1,
      outputPerMillion: 4.4,
      cacheWritePerMillion: 1.1,
      cacheReadPerMillion: 0.55,
    },
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openai',
    displayName: 'OpenAI GPT-4o Mini',
    category: 'frontier',
    harnesses: ['opencode', 'cursor'],
    description: 'Low-cost frontier cloud model for lightweight coding tasks',
    streaming: true,
    tools: 'strong',
    vision: true,
    jsonMode: true,
    promptCaching: true,
    contextLength: 128_000,
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6,
      cacheWritePerMillion: 0.15,
      cacheReadPerMillion: 0.075,
    },
  },

  // ============================================================================
  // OPEN-SOURCE CLOUD CODING MODELS (DeepSeek, Qwen, Llama, Mistral)
  // ============================================================================
  'openrouter/deepseek/deepseek-r1': {
    id: 'openrouter/deepseek/deepseek-r1',
    provider: 'openrouter',
    displayName: 'DeepSeek R1 671B (Open-Source Reasoning)',
    category: 'open-source',
    harnesses: ['opencode', 'hermes', 'cursor'],
    description: 'Open-weights reasoning model rivaling frontier models at a fraction of the cost',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 128_000,
    pricing: {
      inputPerMillion: 0.55,
      outputPerMillion: 2.19,
      cacheWritePerMillion: 0.55,
      cacheReadPerMillion: 0.14,
    },
  },
  'openrouter/deepseek/deepseek-chat': {
    id: 'openrouter/deepseek/deepseek-chat',
    provider: 'openrouter',
    displayName: 'DeepSeek V3 671B (Open-Source)',
    category: 'open-source',
    harnesses: ['opencode', 'hermes', 'cursor'],
    description: '671B MoE open-source model with disk-cached context reads ($0.07/M cached)',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 64_000,
    pricing: {
      inputPerMillion: 0.27,
      outputPerMillion: 1.1,
      cacheWritePerMillion: 0.27,
      cacheReadPerMillion: 0.07,
    },
  },
  'openrouter/qwen/qwen-2.5-coder-32b-instruct': {
    id: 'openrouter/qwen/qwen-2.5-coder-32b-instruct',
    provider: 'openrouter',
    displayName: 'Qwen 2.5 Coder 32B (Open-Source)',
    category: 'open-source',
    harnesses: ['opencode', 'hermes'],
    description: 'Specialized 32B open-weights coding model with ultra-low token rates',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 128_000,
    pricing: {
      inputPerMillion: 0.18,
      outputPerMillion: 0.18,
      cacheWritePerMillion: 0.18,
      cacheReadPerMillion: 0.09,
    },
  },
  'nim/meta/llama-3.3-70b-instruct': {
    id: 'nim/meta/llama-3.3-70b-instruct',
    provider: 'nim',
    displayName: 'Llama 3.3 70B (Open-Source · NIM)',
    category: 'open-source',
    harnesses: ['opencode', 'hermes'],
    description: 'Meta Llama 3.3 70B Instruct hosted on high-speed NVIDIA NIM inference',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: false,
    contextLength: 128_000,
    pricing: {
      inputPerMillion: 0.4,
      outputPerMillion: 0.4,
      cacheWritePerMillion: 0.4,
      cacheReadPerMillion: 0.4,
    },
  },
  'openrouter/mistralai/codestral-2501': {
    id: 'openrouter/mistralai/codestral-2501',
    provider: 'openrouter',
    displayName: 'Mistral Codestral 2501 (Open-Source)',
    category: 'open-source',
    harnesses: ['opencode'],
    description: 'Mistral 256K-context code generation & FIM specialist model',
    streaming: true,
    tools: 'strong',
    vision: false,
    jsonMode: true,
    promptCaching: true,
    contextLength: 256_000,
    pricing: {
      inputPerMillion: 0.3,
      outputPerMillion: 0.9,
      cacheWritePerMillion: 0.3,
      cacheReadPerMillion: 0.15,
    },
  },

  // ============================================================================
  // LOCAL ZERO-COST OPEN-SOURCE MODELS (Ollama)
  // ============================================================================
  'ollama/qwen2.5-coder:14b': {
    id: 'ollama/qwen2.5-coder:14b',
    provider: 'ollama',
    displayName: 'Qwen 2.5 Coder 14B (Local Ollama)',
    category: 'local',
    harnesses: ['opencode', 'hermes'],
    description: 'Local zero-API-cost coding model running on your GPU via Ollama',
    streaming: true,
    tools: 'weak',
    vision: false,
    jsonMode: true,
    promptCaching: false,
    contextLength: 32_768,
    pricing: {
      inputPerMillion: 0.0,
      outputPerMillion: 0.0,
      cacheWritePerMillion: 0.0,
      cacheReadPerMillion: 0.0,
    },
  },
  'ollama/deepseek-r1:14b': {
    id: 'ollama/deepseek-r1:14b',
    provider: 'ollama',
    displayName: 'DeepSeek R1 14B (Local Ollama)',
    category: 'local',
    harnesses: ['opencode', 'hermes'],
    description: 'Local distilled reasoning model running offline via Ollama ($0 API cost)',
    streaming: true,
    tools: 'weak',
    vision: false,
    jsonMode: true,
    promptCaching: false,
    contextLength: 32_768,
    pricing: {
      inputPerMillion: 0.0,
      outputPerMillion: 0.0,
      cacheWritePerMillion: 0.0,
      cacheReadPerMillion: 0.0,
    },
  },
};

/**
 * Automatically detects which IDE / CLI Agent Harness (Antigravity, Claude Code, OpenCode, Hermes)
 * originated a request or model call.
 */
export function detectHarnessFromContext(params: {
  userAgent?: string;
  agentHeader?: string;
  modelId?: string;
}): { harness: AgentHarnessType; label: string } {
  const combined = `${params.agentHeader ?? ''} ${params.userAgent ?? ''} ${params.modelId ?? ''}`.toLowerCase();
  if (combined.includes('hermes') || combined.includes('nousresearch')) {
    return { harness: 'hermes', label: 'Hermes Agent' };
  }
  if (combined.includes('codex') || combined.includes('openai-cli')) {
    return { harness: 'codex', label: 'ChatGPT Codex' };
  }
  if (combined.includes('opencode') || combined.includes('open-code')) {
    return { harness: 'opencode', label: 'OpenCode CLI/IDE' };
  }
  if (combined.includes('claude-code') || combined.includes('claudecode') || combined.includes('anthropic-cli')) {
    return { harness: 'claude-code', label: 'Claude Code' };
  }
  if (combined.includes('cursor')) {
    return { harness: 'cursor', label: 'Cursor IDE' };
  }
  return { harness: 'antigravity', label: 'Antigravity IDE' };
}

export function resolveModelAndProvider(
  modelOrAlias: string,
  aliases: Record<string, string> = {}
): ModelCapabilities {
  const normalizedInput = String(modelOrAlias || '').trim();
  if (
    !normalizedInput ||
    normalizedInput.length > 64 ||
    normalizedInput.split(/\s+/).length > 5 ||
    /comment on this change|ask about it/i.test(normalizedInput)
  ) {
    return BUILTIN_MODELS['google/gemini-4-argon'];
  }
  const resolvedId = aliases[normalizedInput] ?? normalizedInput;

  if (BUILTIN_MODELS[resolvedId]) {
    return BUILTIN_MODELS[resolvedId];
  }

  const lower = resolvedId.toLowerCase();
  if (lower.includes('argon') || lower.includes('gemini-4')) {
    return BUILTIN_MODELS['google/gemini-4-argon'];
  }
  if (lower.includes('3.8-flash') || lower.includes('3.8 flash')) {
    return BUILTIN_MODELS['google/gemini-3.8-flash'];
  }
  if (lower.includes('opus-5.5') || lower.includes('opus 5.5')) {
    return BUILTIN_MODELS['anthropic/claude-opus-5.5'];
  }
  if (lower.includes('sonnet-5.5') || lower.includes('sonnet 5.5')) {
    return BUILTIN_MODELS['anthropic/claude-sonnet-5.5'];
  }
  if (lower.includes('gpt-oss') || lower.includes('120b')) {
    return BUILTIN_MODELS['openai/gpt-oss-120b'];
  }
  if (lower === 'pro' || lower.includes('gemini-2.5-pro') || lower.includes('gemini pro')) {
    return BUILTIN_MODELS['google/gemini-2.5-pro'];
  }
  if (lower === 'flash_lite' || lower.includes('flash-lite')) {
    return BUILTIN_MODELS['google/gemini-2.5-flash-lite'];
  }
  if (lower === 'flash' || lower.includes('gemini-2.5-flash') || lower.includes('gemini flash')) {
    return BUILTIN_MODELS['google/gemini-2.5-flash'];
  }
  if (lower.includes('hermes') && lower.includes('405')) {
    return BUILTIN_MODELS['openrouter/nousresearch/hermes-3-llama-3.1-405b'];
  }
  if (lower.includes('hermes') && lower.includes('8b')) {
    return BUILTIN_MODELS['ollama/hermes3:8b'];
  }
  if (lower.includes('hermes')) {
    return BUILTIN_MODELS['openrouter/nousresearch/hermes-3-llama-3.1-70b'];
  }
  if (lower.includes('sonnet')) {
    return BUILTIN_MODELS['anthropic/claude-3-7-sonnet'];
  }
  if (lower.includes('opus')) {
    return BUILTIN_MODELS['anthropic/claude-4-opus'];
  }
  if (lower.includes('haiku')) {
    return BUILTIN_MODELS['anthropic/claude-3-5-haiku'];
  }
  if (lower.includes('deepseek-r1') || lower.includes('deepseek r1')) {
    return BUILTIN_MODELS['openrouter/deepseek/deepseek-r1'];
  }
  if (lower.includes('deepseek')) {
    return BUILTIN_MODELS['openrouter/deepseek/deepseek-chat'];
  }
  if (lower.includes('qwen') && !lower.includes('ollama')) {
    return BUILTIN_MODELS['openrouter/qwen/qwen-2.5-coder-32b-instruct'];
  }
  if (lower.includes('llama')) {
    return BUILTIN_MODELS['nim/meta/llama-3.3-70b-instruct'];
  }
  if (lower.includes('codestral') || lower.includes('mistral')) {
    return BUILTIN_MODELS['openrouter/mistralai/codestral-2501'];
  }
  if (lower.includes('o3')) {
    return BUILTIN_MODELS['openai/o3-mini'];
  }

  for (const [key, cap] of Object.entries(BUILTIN_MODELS)) {
    const bareName = key.split('/').slice(1).join('/');
    if (resolvedId === bareName || resolvedId.startsWith(bareName)) {
      return cap;
    }
  }

  // Dynamically adapt and register any newly discovered model from Antigravity, OpenCode, Claude Code, or Hermes!
  const parts = resolvedId.split('/');
  const inferredProvider: ProviderType =
    parts[0] === 'anthropic' ||
    parts[0] === 'openai' ||
    parts[0] === 'google' ||
    parts[0] === 'openrouter' ||
    parts[0] === 'nim' ||
    parts[0] === 'ollama'
      ? parts[0]
      : lower.startsWith('claude')
      ? 'anthropic'
      : lower.startsWith('gemini')
      ? 'google'
      : lower.startsWith('ollama')
      ? 'ollama'
      : 'openrouter';

  const inferredCategory: ModelCategory =
    inferredProvider === 'ollama'
      ? 'local'
      : inferredProvider === 'openrouter' || inferredProvider === 'nim'
      ? 'open-source'
      : 'frontier';

  const detectedHarness = detectHarnessFromContext({ modelId: resolvedId }).harness;

  const adaptedCap: ModelCapabilities = {
    id: resolvedId,
    provider: inferredProvider,
    displayName: `${resolvedId} (Auto-Detected)`,
    category: inferredCategory,
    harnesses: [detectedHarness, 'antigravity', 'opencode'],
    description: `Dynamically discovered ${inferredCategory} model from live agent telemetry`,
    streaming: true,
    tools: inferredProvider === 'ollama' ? 'weak' : 'strong',
    vision: false,
    jsonMode: true,
    promptCaching:
      inferredProvider === 'anthropic' || inferredProvider === 'openai' || inferredProvider === 'google',
    contextLength: 128_000,
    pricing:
      inferredProvider === 'ollama'
        ? { inputPerMillion: 0, outputPerMillion: 0, cacheWritePerMillion: 0, cacheReadPerMillion: 0 }
        : inferredCategory === 'open-source'
        ? { inputPerMillion: 0.35, outputPerMillion: 0.9, cacheWritePerMillion: 0.35, cacheReadPerMillion: 0.12 }
        : { inputPerMillion: 2.0, outputPerMillion: 8.0, cacheWritePerMillion: 2.25, cacheReadPerMillion: 0.4 },
  };

  // Persist into BUILTIN_MODELS so all UI lists & estimators include this newly seen model automatically!
  if (resolvedId.length > 1) {
    BUILTIN_MODELS[resolvedId] = adaptedCap;
  }

  return adaptedCap;
}

/**
 * Calculates exact USD cost including prompt caching tiers (GW-7).
 */
export function calculateCallCostUsd(usage: CanonicalUsage, model: ModelCapabilities): number {
  const { pricing } = model;
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const cacheWriteCost = (usage.cacheWriteTokens / 1_000_000) * pricing.cacheWritePerMillion;
  const cacheReadCost = (usage.cacheReadTokens / 1_000_000) * pricing.cacheReadPerMillion;
  const outputCost =
    ((usage.outputTokens + usage.reasoningTokens) / 1_000_000) * pricing.outputPerMillion;
  return Number((inputCost + cacheWriteCost + cacheReadCost + outputCost).toFixed(6));
}

export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3.8));
}
