import type http from 'node:http';
import {
  estimateTokensFromText,
  type CanonicalToolCall,
  type CanonicalUsage,
  type ModelCapabilities,
  type ProviderType,
} from '@cairn/core';

export interface GatewayCallInput {
  body: Record<string, unknown>;
  messages: Array<Record<string, unknown>>;
  selectedModel: ModelCapabilities;
  fallbackModel?: ModelCapabilities;
  windDownRequired: boolean;
  headers?: http.IncomingHttpHeaders;
}

export interface GatewayCallResult {
  responseText: string;
  thinkingText?: string;
  toolCalls: CanonicalToolCall[];
  usage: CanonicalUsage;
  cacheHit: boolean;
  effectiveModel?: ModelCapabilities;
  upstreamProviderUsed?: boolean;
}

/**
 * Extracts a pass-through API key from incoming request headers if only the client
 * (e.g., Claude Code, Cursor, OpenCode) holds the provider key.
 */
export function extractIncomingApiKey(
  headers: http.IncomingHttpHeaders | undefined,
  targetProvider: ProviderType
): string | undefined {
  if (!headers) return undefined;
  const authHeader = typeof headers.authorization === 'string' ? headers.authorization.trim() : '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const xApiKey = typeof headers['x-api-key'] === 'string' ? headers['x-api-key'].trim() : '';
  const candidate = xApiKey || bearerToken;

  if (!candidate || candidate.startsWith('cairn')) {
    return undefined;
  }

  if (targetProvider === 'anthropic' && candidate.startsWith('sk-ant-')) {
    return candidate;
  }
  if (targetProvider === 'openai' && candidate.startsWith('sk-') && !candidate.startsWith('sk-ant-') && !candidate.startsWith('sk-or-')) {
    return candidate;
  }
  if (targetProvider === 'openrouter' && candidate.startsWith('sk-or-')) {
    return candidate;
  }
  if (targetProvider === 'google' && candidate.startsWith('AIza')) {
    return candidate;
  }
  if (targetProvider === 'nim' && candidate.startsWith('nvapi-')) {
    return candidate;
  }

  return undefined;
}

export function resolveProviderApiKey(
  provider: ProviderType,
  headers?: http.IncomingHttpHeaders
): string | undefined {
  const fromHeader = extractIncomingApiKey(headers, provider);
  if (fromHeader) return fromHeader;

  switch (provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'google':
      return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    case 'nim':
      return process.env.NVIDIA_API_KEY ?? process.env.NIM_API_KEY;
    case 'ollama':
      return process.env.OLLAMA_API_KEY ?? (process.env.CAIRN_ENABLE_OLLAMA === '1' ? 'ollama-local' : undefined);
    default:
      return process.env.OPENAI_API_KEY;
  }
}

/**
 * Normalizes tool definitions from either OpenAI (`{ type: 'function', function: { name, description, parameters } }`)
 * or Anthropic (`{ name, description, input_schema }`) into OpenAI format.
 */
export function normalizeToolsToOpenAi(rawTools: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(rawTools) || rawTools.length === 0) return undefined;
  return rawTools.map((t: Record<string, unknown>) => {
    if (t.type === 'function' && t.function && typeof t.function === 'object') {
      return t;
    }
    const name = String(t.name ?? 'tool');
    const description = t.description ? String(t.description) : undefined;
    const parameters =
      (t.input_schema as Record<string, unknown>) ??
      (t.parameters as Record<string, unknown>) ?? { type: 'object', properties: {} };
    return {
      type: 'function',
      function: {
        name,
        ...(description ? { description } : {}),
        parameters,
      },
    };
  });
}

/**
 * Normalizes tool definitions from either OpenAI or Anthropic into Anthropic format (`{ name, description, input_schema }`).
 */
export function normalizeToolsToAnthropic(rawTools: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(rawTools) || rawTools.length === 0) return undefined;
  return rawTools.map((t: Record<string, unknown>) => {
    if (t.input_schema && typeof t.name === 'string') {
      return t;
    }
    const fn = (t.function ?? t) as Record<string, unknown>;
    const name = String(fn.name ?? 'tool');
    const description = fn.description ? String(fn.description) : undefined;
    const inputSchema =
      (fn.parameters as Record<string, unknown>) ??
      (t.input_schema as Record<string, unknown>) ?? { type: 'object', properties: {} };
    return {
      name,
      ...(description ? { description } : {}),
      input_schema: inputSchema,
    };
  });
}

/**
 * Converts a mixed OpenAI / Anthropic message array + top-level `system` into OpenAI-compatible messages.
 * Allows an Anthropic client (`/v1/messages`) to be transparently routed to OpenAI, Gemini, OpenRouter, or Ollama.
 */
export function normalizeMessagesToOpenAi(
  body: Record<string, unknown>,
  messages: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];

  if (body.system) {
    if (typeof body.system === 'string') {
      result.push({ role: 'system', content: body.system });
    } else if (Array.isArray(body.system)) {
      const sysText = body.system
        .map((b: Record<string, unknown>) => (typeof b.text === 'string' ? b.text : JSON.stringify(b)))
        .join('\n');
      if (sysText) {
        result.push({ role: 'system', content: sysText });
      }
    }
  }

  for (const msg of messages) {
    const role = String(msg.role ?? 'user');
    const content = msg.content;

    if (Array.isArray(content)) {
      const textParts: string[] = [];
      const toolCalls: Array<Record<string, unknown>> = [];
      const toolResults: Array<{ toolCallId: string; content: string }> = [];

      for (const block of content as Array<Record<string, unknown>>) {
        if (block.type === 'text' && typeof block.text === 'string') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: String(block.id ?? `call_${Date.now()}`),
            type: 'function',
            function: {
              name: String(block.name ?? 'tool'),
              arguments:
                typeof block.input === 'string'
                  ? block.input
                  : JSON.stringify(block.input ?? {}),
            },
          });
        } else if (block.type === 'tool_result') {
          const resultStr =
            typeof block.content === 'string'
              ? block.content
              : JSON.stringify(block.content ?? '');
          toolResults.push({
            toolCallId: String(block.tool_use_id ?? `call_${Date.now()}`),
            content: resultStr,
          });
        }
      }

      if (role === 'assistant' && (textParts.length > 0 || toolCalls.length > 0)) {
        result.push({
          role: 'assistant',
          content: textParts.join('\n') || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        });
      } else if (toolResults.length > 0) {
        if (textParts.length > 0) {
          result.push({ role: 'user', content: textParts.join('\n') });
        }
        for (const tr of toolResults) {
          result.push({
            role: 'tool',
            tool_call_id: tr.toolCallId,
            content: tr.content,
          });
        }
      } else {
        result.push({ role, content: textParts.join('\n') });
      }
    } else {
      result.push(msg);
    }
  }

  return result;
}

/**
 * Converts a mixed OpenAI / Anthropic message array into Anthropic `/v1/messages` format
 * (extracting any `role: 'system'` messages into top-level `system`, and converting `role: 'tool'` / `tool_calls`).
 */
export function normalizeMessagesToAnthropic(
  body: Record<string, unknown>,
  messages: Array<Record<string, unknown>>
): { system?: string | Array<Record<string, unknown>>; messages: Array<Record<string, unknown>> } {
  const systemParts: string[] = [];
  if (typeof body.system === 'string' && body.system.trim()) {
    systemParts.push(body.system.trim());
  }

  const anthMessages: Array<Record<string, unknown>> = [];

  for (const msg of messages) {
    const role = String(msg.role ?? 'user');
    if (role === 'system' || role === 'developer') {
      if (typeof msg.content === 'string') {
        systemParts.push(msg.content);
      }
      continue;
    }

    if (role === 'tool') {
      anthMessages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: String(msg.tool_call_id ?? 'tool_call_0'),
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? ''),
          },
        ],
      });
      continue;
    }

    if (role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      const blocks: Array<Record<string, unknown>> = [];
      if (typeof msg.content === 'string' && msg.content.trim()) {
        blocks.push({ type: 'text', text: msg.content });
      }
      for (const tc of msg.tool_calls as Array<Record<string, unknown>>) {
        const fn = (tc.function ?? {}) as Record<string, unknown>;
        let parsedInput: Record<string, unknown> = {};
        try {
          parsedInput = JSON.parse(String(fn.arguments ?? '{}'));
        } catch {
          parsedInput = { raw: String(fn.arguments ?? '') };
        }
        blocks.push({
          type: 'tool_use',
          id: String(tc.id ?? `tu_${Date.now()}`),
          name: String(fn.name ?? 'tool'),
          input: parsedInput,
        });
      }
      anthMessages.push({ role: 'assistant', content: blocks });
      continue;
    }

    anthMessages.push({
      role: role === 'assistant' ? 'assistant' : 'user',
      content: msg.content ?? '',
    });
  }

  const systemOut = Array.isArray(body.system)
    ? (body.system as Array<Record<string, unknown>>)
    : systemParts.length > 0
    ? systemParts.join('\n\n')
    : undefined;

  return { system: systemOut, messages: anthMessages };
}

/**
 * Strips the Cairn provider prefix (`openai/`, `anthropic/`, `google/`, `openrouter/`, `ollama/`, `nim/`)
 * to yield the upstream model identifier expected by the target provider endpoint.
 */
export function toUpstreamModelId(model: ModelCapabilities): string {
  const { id, provider } = model;
  const prefix = `${provider}/`;
  if (id.startsWith(prefix)) {
    return id.slice(prefix.length);
  }
  return id.replace(/^(openai|anthropic|google|openrouter|ollama|nim)\//, '');
}

/**
 * Resolves the OpenAI-compatible chat completions endpoint URL for non-Anthropic providers.
 */
export function getOpenAiCompatibleEndpoint(provider: ProviderType): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_BASE_URL
        ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`
        : 'https://api.openai.com/v1/chat/completions';
    case 'google':
      return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'nim':
      return 'https://integrate.api.nvidia.com/v1/chat/completions';
    case 'ollama': {
      const host = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
      return `${host}/v1/chat/completions`;
    }
    default:
      return 'https://api.openai.com/v1/chat/completions';
  }
}

async function callAnthropicUpstream(params: {
  body: Record<string, unknown>;
  messages: Array<Record<string, unknown>>;
  selectedModel: ModelCapabilities;
  apiKey: string;
  windDownRequired: boolean;
  headers?: http.IncomingHttpHeaders;
  totalInputEst: number;
  uncachedTokens: number;
}): Promise<GatewayCallResult | null> {
  const { body, messages, selectedModel, apiKey, windDownRequired, headers, uncachedTokens } = params;
  const normalized = normalizeMessagesToAnthropic(body, messages);
  const tools = !windDownRequired ? normalizeToolsToAnthropic(body.tools) : undefined;

  const payload: Record<string, unknown> = {
    model: toUpstreamModelId(selectedModel),
    max_tokens: Number(body.max_tokens ?? body.max_completion_tokens ?? 4096),
    messages: normalized.messages,
  };
  if (normalized.system) {
    payload.system = normalized.system;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
    if (body.tool_choice) {
      payload.tool_choice = body.tool_choice;
    }
  }
  if (body.temperature !== undefined) {
    payload.temperature = Number(body.temperature);
  }
  if (body.top_p !== undefined) {
    payload.top_p = Number(body.top_p);
  }
  if (body.thinking && typeof body.thinking === 'object') {
    payload.thinking = body.thinking;
  }
  if (Array.isArray(body.stop_sequences)) {
    payload.stop_sequences = body.stop_sequences;
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version':
      typeof headers?.['anthropic-version'] === 'string'
        ? headers['anthropic-version']
        : '2023-06-01',
  };
  if (typeof headers?.['anthropic-beta'] === 'string') {
    reqHeaders['anthropic-beta'] = headers['anthropic-beta'];
  } else if (selectedModel.promptCaching) {
    reqHeaders['anthropic-beta'] = 'prompt-caching-2024-07-31';
  }

  const upstreamRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify(payload),
  });

  if (!upstreamRes.ok) {
    return null;
  }

  const data = (await upstreamRes.json()) as Record<string, unknown>;
  const contentArr = Array.isArray(data.content) ? data.content : [];
  const textParts = contentArr
    .filter((c: Record<string, unknown>) => c.type === 'text')
    .map((c: Record<string, unknown>) => String(c.text ?? ''))
    .join('\n');
  const thinkingParts = contentArr
    .filter((c: Record<string, unknown>) => c.type === 'thinking')
    .map((c: Record<string, unknown>) => String(c.thinking ?? ''))
    .join('\n');
  const toolCalls: CanonicalToolCall[] = contentArr
    .filter((c: Record<string, unknown>) => c.type === 'tool_use')
    .map((c: Record<string, unknown>) => ({
      id: String(c.id ?? `tu_${Date.now()}`),
      name: String(c.name ?? 'tool'),
      arguments: JSON.stringify(c.input ?? {}),
    }));
  const u = (data.usage ?? {}) as Record<string, number>;

  return {
    responseText: textParts,
    ...(thinkingParts ? { thinkingText: thinkingParts } : {}),
    toolCalls,
    usage: {
      inputTokens: Number(u.input_tokens ?? uncachedTokens),
      outputTokens: Number(u.output_tokens ?? estimateTokensFromText(textParts)),
      cacheWriteTokens: Number(u.cache_creation_input_tokens ?? 0),
      cacheReadTokens: Number(u.cache_read_input_tokens ?? 0),
      reasoningTokens: thinkingParts ? estimateTokensFromText(thinkingParts) : 0,
    },
    cacheHit: false,
    effectiveModel: selectedModel,
    upstreamProviderUsed: true,
  };
}

async function callOpenAiCompatibleUpstream(params: {
  body: Record<string, unknown>;
  messages: Array<Record<string, unknown>>;
  selectedModel: ModelCapabilities;
  apiKey: string;
  windDownRequired: boolean;
  totalInputEst: number;
}): Promise<GatewayCallResult | null> {
  const { body, messages, selectedModel, apiKey, windDownRequired, totalInputEst } = params;
  const endpoint = getOpenAiCompatibleEndpoint(selectedModel.provider);
  const openAiMessages = normalizeMessagesToOpenAi(body, messages);
  const tools = !windDownRequired ? normalizeToolsToOpenAi(body.tools) : undefined;

  const payload: Record<string, unknown> = {
    model: toUpstreamModelId(selectedModel),
    messages: openAiMessages,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    if (body.tool_choice) {
      payload.tool_choice = body.tool_choice;
    }
  }
  if (body.max_tokens !== undefined) {
    payload.max_tokens = Number(body.max_tokens);
  }
  if (body.max_completion_tokens !== undefined) {
    payload.max_completion_tokens = Number(body.max_completion_tokens);
  }
  if (body.temperature !== undefined) {
    payload.temperature = Number(body.temperature);
  }
  if (body.top_p !== undefined) {
    payload.top_p = Number(body.top_p);
  }
  if (body.response_format && typeof body.response_format === 'object') {
    payload.response_format = body.response_format;
  }
  if (body.reasoning_effort) {
    payload.reasoning_effort = body.reasoning_effort;
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey && apiKey !== 'ollama-local') {
    reqHeaders.Authorization = `Bearer ${apiKey}`;
  }
  if (selectedModel.provider === 'openrouter') {
    reqHeaders['HTTP-Referer'] = 'https://cairn.local';
    reqHeaders['X-Title'] = 'Cairn Agent Control Plane';
  }

  const upstreamRes = await fetch(endpoint, {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify(payload),
  });

  if (!upstreamRes.ok) {
    return null;
  }

  const data = (await upstreamRes.json()) as Record<string, unknown>;
  const choices = Array.isArray(data.choices) ? data.choices : [];
  const firstMsg = (choices[0] as Record<string, unknown>)?.message as
    | Record<string, unknown>
    | undefined;
  const text = String(firstMsg?.content ?? '');
  const reasoning = typeof firstMsg?.reasoning_content === 'string' ? firstMsg.reasoning_content : undefined;
  const rawTcs = Array.isArray(firstMsg?.tool_calls) ? firstMsg!.tool_calls : [];
  const toolCalls: CanonicalToolCall[] = rawTcs.map((tc: Record<string, unknown>) => {
    const fn = (tc.function ?? {}) as Record<string, unknown>;
    return {
      id: String(tc.id ?? `call_${Date.now()}`),
      name: String(fn.name ?? 'tool'),
      arguments:
        typeof fn.arguments === 'string'
          ? fn.arguments
          : JSON.stringify(fn.arguments ?? {}),
    };
  });

  const u = (data.usage ?? {}) as Record<string, unknown>;
  const promptDetails = (u.prompt_tokens_details ?? {}) as Record<string, number>;
  const completionDetails = (u.completion_tokens_details ?? {}) as Record<string, number>;
  const cached = Number(promptDetails.cached_tokens ?? 0);
  const reasoningTokens = Number(completionDetails.reasoning_tokens ?? (reasoning ? estimateTokensFromText(reasoning) : 0));
  const totalPrompt = Number(u.prompt_tokens ?? totalInputEst);

  return {
    responseText: text,
    ...(reasoning ? { thinkingText: reasoning } : {}),
    toolCalls,
    usage: {
      inputTokens: Math.max(0, totalPrompt - cached),
      outputTokens: Number(u.completion_tokens ?? estimateTokensFromText(text)),
      cacheWriteTokens: 0,
      cacheReadTokens: cached,
      reasoningTokens,
    },
    cacheHit: false,
    effectiveModel: selectedModel,
    upstreamProviderUsed: true,
  };
}

/**
 * Executes an upstream LLM call across any supported provider (`anthropic`, `openai`, `google`,
 * `openrouter`, `nim`, `ollama`) with full payload preservation, cross-protocol translation,
 * fallback routing on upstream errors, and deterministic local synthesis for test/offline environments.
 */
export async function dispatchModelCall(input: GatewayCallInput): Promise<GatewayCallResult> {
  const { body, messages, selectedModel, fallbackModel, windDownRequired, headers } = input;
  const serializedPrompt = JSON.stringify({
    system: body.system ?? undefined,
    messages,
    tools: body.tools ?? undefined,
  });
  const totalInputEst = estimateTokensFromText(serializedPrompt);
  const cachedTokens = selectedModel.promptCaching ? Math.floor(totalInputEst * 0.75) : 0;
  const uncachedTokens = totalInputEst - cachedTokens;

  // 1. Deterministic test / simulation hook (`mock_tool_call`)
  if (body.mock_tool_call && !windDownRequired) {
    const mockTc = body.mock_tool_call as { name: string; arguments: Record<string, unknown> | string };
    const argsStr =
      typeof mockTc.arguments === 'string'
        ? mockTc.arguments
        : JSON.stringify(mockTc.arguments ?? {});
    const outTokens = estimateTokensFromText(argsStr) + 25;
    return {
      responseText: '',
      toolCalls: [
        {
          id: `call_tc_${Date.now()}`,
          name: mockTc.name,
          arguments: argsStr,
        },
      ],
      usage: {
        inputTokens: uncachedTokens,
        outputTokens: outTokens,
        cacheWriteTokens: selectedModel.promptCaching ? Math.ceil(uncachedTokens * 0.2) : 0,
        cacheReadTokens: cachedTokens,
        reasoningTokens: 0,
        estimatedByFallback: true,
      },
      cacheHit: false,
      effectiveModel: selectedModel,
      upstreamProviderUsed: false,
    };
  }

  // 2. Try primary provider (and optional fallback model if primary fails) when not in local mock mode
  if (!body._cairn_local_mock) {
    const candidates: ModelCapabilities[] = [selectedModel];
    if (fallbackModel && fallbackModel.id !== selectedModel.id) {
      candidates.push(fallbackModel);
    }

    for (const candidate of candidates) {
      const apiKey = resolveProviderApiKey(candidate.provider, headers);
      if (!apiKey) continue;

      try {
        if (candidate.provider === 'anthropic') {
          const res = await callAnthropicUpstream({
            body,
            messages,
            selectedModel: candidate,
            apiKey,
            windDownRequired,
            headers,
            totalInputEst,
            uncachedTokens,
          });
          if (res) return res;
        } else {
          const res = await callOpenAiCompatibleUpstream({
            body,
            messages,
            selectedModel: candidate,
            apiKey,
            windDownRequired,
            totalInputEst,
          });
          if (res) return res;
        }
      } catch {
        // Proceed to fallback candidate or local synthesis
      }
    }
  }

  // 3. Deterministic local / offline gateway synthesis
  const lastMessage = messages[messages.length - 1];
  const lastContent =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content ?? '');
  const reply = windDownRequired
    ? `[Graceful Wind-Down Complete via ${selectedModel.displayName}] Saved workspace state and halted further tool execution cleanly.`
    : `[Cairn Gateway -> ${selectedModel.displayName}] Processed request (${lastContent.slice(0, 80)})`;

  return {
    responseText: reply,
    toolCalls: [],
    usage: {
      inputTokens: uncachedTokens,
      outputTokens: estimateTokensFromText(reply),
      cacheWriteTokens: selectedModel.promptCaching ? Math.ceil(uncachedTokens * 0.15) : 0,
      cacheReadTokens: cachedTokens,
      reasoningTokens: 0,
      estimatedByFallback: true,
    },
    cacheHit: false,
    effectiveModel: selectedModel,
    upstreamProviderUsed: false,
  };
}
