export type ProviderType = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'nim' | 'ollama' | 'custom-openai';

export type ModelCategory = 'frontier' | 'open-source' | 'local';

export type AgentHarnessType = 'antigravity' | 'codex' | 'claude-code' | 'opencode' | 'hermes' | 'cursor' | 'custom';

export type RiskLevel = 'read-only' | 'low' | 'medium' | 'high';

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface CanonicalToolDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface CanonicalToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

export interface CanonicalMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<Record<string, unknown>>;
  name?: string;
  tool_call_id?: string;
  tool_calls?: CanonicalToolCall[];
}

export interface CanonicalRequest {
  model: string;
  messages: CanonicalMessage[];
  system?: string | Array<Record<string, unknown>>;
  tools?: CanonicalToolDefinition[];
  toolChoice?: unknown;
  stream?: boolean;
  temperature?: number;
  topP?: number;
  max_tokens?: number;
  stop?: string | string[];
  responseFormat?: Record<string, unknown>;
  thinking?: Record<string, unknown>;
  reasoningEffort?: string;
  passthroughApiKey?: string;
  anthropicBeta?: string;
  taskId?: string;
  projectId?: string;
  runId?: string;
  agentName?: string;
  rawBody?: Record<string, unknown>;
}

export interface CanonicalUsage {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  reasoningTokens: number;
  estimatedByFallback?: boolean;
}

export interface CanonicalResponse {
  id: string;
  model: string;
  provider: ProviderType;
  content: string;
  toolCalls: CanonicalToolCall[];
  usage: CanonicalUsage;
  latencyMs: number;
  costUsd: number;
  cacheHit: boolean;
  finishReason?: string;
  rawResponse?: unknown;
}

export interface ModelCapabilities {
  id: string;
  provider: ProviderType;
  displayName: string;
  category?: ModelCategory;
  harnesses?: AgentHarnessType[];
  description?: string;
  streaming: boolean;
  tools: 'strong' | 'weak' | 'none';
  vision: boolean;
  jsonMode: boolean;
  promptCaching: boolean;
  contextLength: number;
  pricing: {
    inputPerMillion: number;       // USD per 1M uncached input tokens
    outputPerMillion: number;      // USD per 1M output tokens
    cacheWritePerMillion: number;  // USD per 1M cache-write tokens
    cacheReadPerMillion: number;   // USD per 1M cache-read tokens
  };
}
