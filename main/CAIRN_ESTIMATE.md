# Cairn Estimate: Cairn: Product Requirements Document

- **Model:** Claude 3.7 Sonnet (`anthropic/claude-3-7-sonnet`)
- **Confidence:** **MEDIUM** (Structured PRD with 65 decomposable tasks; Repo scanned (29 files, 6087 LOC, factor 1.35x); Using default retry (1.85x) & cache (85%) priors)
- **Forecasted Spend Range:** **$48.06 – $107.66** (Expected: **$71.13**)
- **Forecasted Tokens:** 23,619,264 – 52,907,157 (Expected: 34,956,514 total | 23,977,723 cached reads)

## Top Cost Drivers
| Feature / Module | Expected Cost (USD) | Share of Spend |
| :--- | ---: | ---: |
| Gateway | $16.14 | 23% |
| Local Daemon and Storage | $10.85 | 15% |
| Safe Actions Layer | $9.76 | 14% |
| Mobile Remote and Universal IDE Control | $9.41 | 13% |
| Budget and Usage Control | $6.36 | 9% |

## What-If Scenarios
| Scenario | Expected Cost (USD) | Relative Savings |
| :--- | ---: | ---: |
| Hybrid (Smart for High/Med, Fast for Low) | $69.34 | 3% cheaper |
| Claude 3.7 Sonnet (Prompt Cached) | $71.13 | 0% cheaper |
| GPT-4o | $72.60 | 2% more |
| DeepSeek V3 (OpenRouter) | $6.32 | 91% cheaper |
| GPT-4o Mini (Budget Cloud) | $4.35 | 94% cheaper |
| Qwen 2.5 Coder 14B (Local Ollama - $0 API) | $0.00 | 100% cheaper |

## Task Breakdown (65 Tasks)
| ID | Feature | Task | Complexity | Turns | Expected Tokens | Expected Cost | Rec. Alias |
| :--- | :--- | :--- | :---: | ---: | ---: | ---: | :---: |
| `gw-1` | Gateway | GW-1: Expose an OpenAI-compatible endpoint (`/v1/chat/completions`, `/v1/models`, and embeddings... | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-2` | Gateway | GW-2: Expose an Anthropic-compatible endpoint (`/v1/messages`). | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-3` | Gateway | GW-3: Translate every request into one canonical internal schema (messages, tools, parameters, s... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `gw-4` | Gateway | GW-4: Support provider adapters for OpenAI, Anthropic, OpenRouter, NVIDIA NIM, Ollama, and any O... | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-5` | Gateway | GW-5: Support streaming (SSE) in both formats while still capturing final token usage and interc... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `gw-6` | Gateway | GW-6: Normalize tool calling across providers and flag models with weak tool support. | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-7` | Gateway | GW-7: Meter every request: uncached input tokens, cache-write tokens, cache-read tokens, output ... | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-8` | Gateway | GW-8: Fall back to a tokenizer-based estimate when a provider omits usage data (common with loca... | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-9` | Gateway | GW-9: Support model aliases (for example `fast`, `smart`, `local`) mapped to real models in conf... | low | 4 | 78,035 | $0.24 | `fast` |
| `gw-10` | Gateway | GW-10: Support routing rules: fallback on error, fallback on budget (at safe task boundaries), an... | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-11` | Gateway | GW-11: Provide an optional response cache (exact match first, semantic later). | medium | 8 | 374,551 | $0.84 | `smart` |
| `gw-12` | Gateway | GW-12: Provide an MCP proxy mode that sits in front of tool servers (see 8.4). | high | 15 | 1,554,808 | $2.78 | `smart` |
| `gw-13` | Gateway | GW-13: **Task attribution:** Map incoming agent requests to active PRD tasks via URL path tags (`... | medium | 8 | 374,551 | $0.84 | `smart` |
| `est-1` | PRD Estimator | EST-1: Accept PRD upload (plus optional local repo path) through the extension, CLI, or mobile re... | medium | 8 | 374,551 | $0.84 | `smart` |
| `est-2` | PRD Estimator | EST-2: Produce an editable task breakdown the user can adjust before estimating. | low | 4 | 78,035 | $0.24 | `fast` |
| `est-3` | PRD Estimator | EST-3: Re-estimate instantly when the user edits tasks or changes the model. | medium | 8 | 374,551 | $0.84 | `smart` |
| `est-4` | PRD Estimator | EST-4: Always show ranges and confidence, with an explanation of assumptions (including caching a... | medium | 8 | 374,551 | $0.84 | `smart` |
| `est-5` | PRD Estimator | EST-5: Save the estimate as a baseline for tracking actual spend against it. | medium | 8 | 374,551 | $0.84 | `smart` |
| `est-6` | PRD Estimator | EST-6: Export the estimate as Markdown or JSON. | low | 4 | 78,035 | $0.24 | `fast` |
| `bud-1` | Budget and Usage Control | BUD-1: Budgets by scope: global, project, task, agent session, and day. | medium | 8 | 374,551 | $0.84 | `smart` |
| `bud-2` | Budget and Usage Control | BUD-2: Budget units: dollars, tokens, or request count. | medium | 8 | 374,551 | $0.84 | `smart` |
| `bud-3` | Budget and Usage Control | BUD-3: Soft alerts at configurable thresholds (for example 50, 80, and 95 percent) pushed to the ... | low | 4 | 78,035 | $0.24 | `fast` |
| `bud-4` | Budget and Usage Control | BUD-4: **Graceful hard caps (Wind-Down Injection):** when a hard cap is reached, optionally injec... | medium | 8 | 374,551 | $0.84 | `smart` |
| `bud-5` | Budget and Usage Control | BUD-5: **Cache-safe auto-downgrade:** on nearing a limit, route to a cheaper model or alias only ... | medium | 8 | 374,551 | $0.84 | `smart` |
| `bud-6` | Budget and Usage Control | BUD-6: Runaway detection: flag loops (identical tool call repeated, error-retry oscillation, or s... | medium | 8 | 374,551 | $0.84 | `smart` |
| `bud-7` | Budget and Usage Control | BUD-7: Live burn-down: estimated vs. actual spend per task and per project. | medium | 8 | 374,551 | $0.84 | `smart` |
| `bud-8` | Budget and Usage Control | BUD-8: Per-model and per-provider usage reports. | low | 4 | 78,035 | $0.24 | `fast` |
| `bud-9` | Budget and Usage Control | BUD-9: Local-model accounting: tokens and time tracked even when dollar cost is zero, with an opt... | medium | 8 | 374,551 | $0.84 | `smart` |
| `saf-1` | Safe Actions Layer | SAF-1: Intercept tool calls both at the Gateway HTTP stream level (works for all agents) and thro... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `saf-2` | Safe Actions Layer | SAF-2: Show a diff-style preview for file edits, shell commands, and API calls in both the IDE an... | medium | 8 | 374,551 | $0.84 | `smart` |
| `saf-3` | Safe Actions Layer | SAF-3: Support risk-based auto-approval rules in policy. | medium | 8 | 374,551 | $0.84 | `smart` |
| `saf-4` | Safe Actions Layer | SAF-4: Maintain a Git shadow checkpoint journal per run, with one-click revert of a whole run or ... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `saf-5` | Safe Actions Layer | SAF-5: Block or require approval for known-dangerous patterns (for example recursive delete, forc... | medium | 8 | 374,551 | $0.84 | `smart` |
| `saf-6` | Safe Actions Layer | SAF-6: Detect likely prompt-injection patterns in tool outputs and warn before the agent acts on ... | medium | 8 | 374,551 | $0.84 | `smart` |
| `saf-7` | Safe Actions Layer | SAF-7: Charge action costs against the same budget as model calls where relevant (for example pai... | medium | 8 | 374,551 | $0.84 | `smart` |
| `pol-1` | Policy Engine | POL-1: Load policy from a per-project file with global defaults. | medium | 8 | 374,551 | $0.84 | `smart` |
| `pol-2` | Policy Engine | POL-2: Validate policy and explain errors clearly. | medium | 8 | 374,551 | $0.84 | `smart` |
| `pol-3` | Policy Engine | POL-3: Support rule precedence (deny beats ask beats allow). | medium | 8 | 374,551 | $0.84 | `smart` |
| `pol-4` | Policy Engine | POL-4: Hot-reload without restarting the daemon. | medium | 8 | 374,551 | $0.84 | `smart` |
| `obs-1` | Observability | OBS-1: Trace every run: prompts, responses, tool calls, tokens, latency, and cost. | medium | 8 | 374,551 | $0.84 | `smart` |
| `obs-2` | Observability | OBS-2: Timeline view of a run in the IDE and mobile remote. | medium | 8 | 374,551 | $0.84 | `smart` |
| `obs-3` | Observability | OBS-3: Replay a run and diff it against another (for example two models on the same task). | medium | 8 | 374,551 | $0.84 | `smart` |
| `obs-4` | Observability | OBS-4: Tamper-evident local audit log of approvals and actions (recording whether approved via ID... | medium | 8 | 374,551 | $0.84 | `smart` |
| `obs-5` | Observability | OBS-5: Redaction of secrets in stored traces, and a configurable retention period. | low | 4 | 78,035 | $0.24 | `fast` |
| `obs-6` | Observability | OBS-6: Export to OpenTelemetry-compatible formats (later). | low | 4 | 78,035 | $0.24 | `fast` |
| `ide-1` | IDE Extension (Antigravity IDE, VS Code, Cursor, Windsurf) | IDE-1: Connect to the local daemon automatically via bi-directional WebSocket. | medium | 8 | 374,551 | $0.84 | `smart` |
| `ide-2` | IDE Extension (Antigravity IDE, VS Code, Cursor, Windsurf) | IDE-2: Work offline with local models. | medium | 8 | 374,551 | $0.84 | `smart` |
| `ide-3` | IDE Extension (Antigravity IDE, VS Code, Cursor, Windsurf) | IDE-3: Never block the editor; all heavy work is asynchronous. | medium | 8 | 374,551 | $0.84 | `smart` |
| `ide-4` | IDE Extension (Antigravity IDE, VS Code, Cursor, Windsurf) | IDE-4: One-command setup that points supported agents at the gateway. | medium | 8 | 374,551 | $0.84 | `smart` |
| `ide-5` | IDE Extension (Antigravity IDE, VS Code, Cursor, Windsurf) | IDE-5: Expose an RPC bridge to the daemon so authorized mobile sessions can trigger IDE commands ... | medium | 8 | 374,551 | $0.84 | `smart` |
| `dmn-1` | Local Daemon and Storage | DMN-1: Runs as a background service on macOS, Linux, and Windows. | high | 15 | 1,554,808 | $2.78 | `smart` |
| `dmn-2` | Local Daemon and Storage | DMN-2: SQLite for traces, budgets, estimates, and calibration data. | medium | 8 | 374,551 | $0.84 | `smart` |
| `dmn-3` | Local Daemon and Storage | DMN-3: Secrets stored in the OS keychain or an encrypted local vault. | medium | 8 | 374,551 | $0.84 | `smart` |
| `dmn-4` | Local Daemon and Storage | DMN-4: Local REST, WebSocket, and WebRTC API used by the extension, CLI, and mobile remote PWA. | high | 15 | 1,554,808 | $2.78 | `smart` |
| `dmn-5` | Local Daemon and Storage | DMN-5: Binds to localhost by default, with QR-paired token + WebAuthn authentication for LAN or e... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `dmn-6` | Local Daemon and Storage | DMN-6: Safe upgrades and data migrations. | medium | 8 | 374,551 | $0.84 | `smart` |
| `cal-1` | Calibration Loop | CAL-1: After each task, record estimated vs. actual tokens, cache hit rate, and cost. | medium | 8 | 374,551 | $0.84 | `smart` |
| `cal-2` | Calibration Loop | CAL-2: Update multipliers (retry factor, turns, context growth, cache hit ratio) per model, task ... | medium | 8 | 374,551 | $0.84 | `smart` |
| `cal-3` | Calibration Loop | CAL-3: Show estimate accuracy over time (for example "last 20 tasks: median error 24 percent"). | medium | 8 | 374,551 | $0.84 | `smart` |
| `cal-4` | Calibration Loop | CAL-4: Allow opt-in anonymous sharing of aggregate calibration data later, to improve default pri... | medium | 8 | 374,551 | $0.84 | `smart` |
| `rem-1` | Mobile Remote and Universal IDE Control | REM-1: Serve a zero-install Mobile Progressive Web App (PWA) from the daemon, paired in under 30 ... | medium | 8 | 374,551 | $0.84 | `smart` |
| `rem-2` | Mobile Remote and Universal IDE Control | REM-2: Support both local Wi-Fi (LAN) connection and zero-config encrypted P2P/tunnel relay (Tail... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `rem-3` | Mobile Remote and Universal IDE Control | REM-3: Enforce WebAuthn biometric verification (FaceID / TouchID / Android Biometrics) on the pho... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `rem-4` | Mobile Remote and Universal IDE Control | REM-4: Provide both a **Mobile-Native Cockpit View** (diffs, approvals, terminal, chat steering, ... | high | 15 | 1,554,808 | $2.78 | `smart` |
| `rem-5` | Mobile Remote and Universal IDE Control | REM-5: Automatically revoke mobile session tokens on inactivity, daemon restart (configurable), o... | low | 4 | 78,035 | $0.24 | `fast` |