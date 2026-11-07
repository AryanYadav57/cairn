# Cairn: Product Requirements Document

*Version 0.2 · Draft · Owner: You · Status: Pre-build*

**Tagline:** Know the cost before you build. Stay in control while agents work—from your desk or your phone.

## 1. Overview

Cairn is an open-source control plane that sits between coding agents (and the people using them) and the model providers and cloud services they depend on. It runs as a local gateway and daemon with an IDE extension and mobile remote control on top. It does four things in one loop:

1. **Estimate**: upload a PRD (plus optional repo context) and get a cache-aware token and cost forecast for building the whole project.
2. **Control**: enforce budgets and limits on every model call, across any provider, with graceful wind-down and task-boundary downgrades.
3. **Protect**: preview, approve, and undo risky agent actions before they touch real systems using gateway stream interception and instant Git shadow snapshots.
4. **Supervise Anywhere**: monitor live burn, approve actions, steer agents, and remotely control your IDE window (Antigravity IDE, VS Code, Cursor, Visual Studio, and others) straight from your phone.

The name comes from a cairn, a stack of stones that marks a trail. Cairn marks where you are, how far you have come, and the safe path forward.

## 2. Problem Statement

Agents now write code, run commands, and call cloud APIs, but four problems keep teams from trusting them:

- **Unpredictable cost.** Nobody knows whether building a project with an agent will cost 5 dollars or 500. Retries, quadratic context accumulation, and loops make spend explode without warning.
- **Fragmented control.** Usage limits live inside each tool or provider dashboard. There is no single place to cap spend across OpenAI, Anthropic, OpenRouter, NVIDIA NIM, Ollama, and others.
- **Unsafe actions.** Agents are either gated by approving every step or trusted blindly. There is no middle ground of readable previews, risk-based approval, and instant rollback.
- **Desk-bound supervision.** Agent runs take 10 to 30 minutes, but the moment an agent hits an approval prompt, a budget limit, or an IDE modal in Antigravity IDE, VS Code, or Visual Studio, the run stalls unless the developer is sitting at their computer.

## 3. Core Idea

> Every agent run should have a forecast before it starts, a budget while it runs, a safety net around what it does, and remote supervision from anywhere.

Cairn's loop:

**PRD (+ Repo Context) → plan → estimate → budget → supervised execution (IDE + Mobile Remote) → actual vs. estimate → calibration**

The calibration step is the long-term moat. Every finished task produces an estimated-vs-actual data point, so Cairn's forecasts get more accurate for each user's codebase, models, and workflow over time.

## 4. Goals and Non-Goals

### Goals

- Give an honest, cache-aware, and repo-aware token and cost range for a project from its PRD, with a confidence level.
- Work with any model provider through one gateway (OpenAI-compatible and Anthropic-compatible front doors).
- Enforce budgets in real time with soft alerts, cache-safe model downgrades, and graceful hard caps.
- Make risky agent actions previewable, approvable, and reversible where possible using gateway stream interception and Git shadow snapshots.
- Let users monitor runs, approve actions, steer agents, and remotely control their IDE window (Antigravity IDE, VS Code, Cursor, Visual Studio, and others) from their phone.
- Be local-first, private, and easy to adopt (change one base URL, scan one QR code).
- Learn from actual runs to improve estimates.

### Non-Goals (v1)

- Not an agent or coding assistant itself. Cairn supervises agents; it does not replace them.
- Not a full observability platform for production LLM apps.
- Not a hosted SaaS in v1 (local-first; cloud and team features come later).
- No guarantee of exact estimates. Cairn gives ranges, never promises.
- Not full rollback of every external action type. Local file and git changes are reversible via snapshots; irreversible external actions are flagged before execution, not hidden.

## 5. Target Users

| Persona | Description | Primary need |
| --- | --- | --- |
| Solo builder | Uses Antigravity IDE, Claude Code, Cursor, or similar for projects and freelance work | Predictable bills, no surprise spend, mobile supervision away from desk |
| Startup engineer | Runs agents on real repos and cloud accounts | Safe actions, instant rollback, audit trail |
| Engineering lead | Manages a small team using agents | Shared budgets, policy, visibility |
| Local-model tinkerer | Mixes Ollama or NIM with paid APIs | One gateway across everything, cost comparison |

**Primary persona for v1:** the solo builder and startup engineer.

## 6. Product Principles

1. **Estimate honestly.** Show ranges and confidence, never fake precision.
2. **Drop-in adoption.** If setup takes more than five minutes, we have failed.
3. **Local-first and private.** Prompts, keys, and remote control streams stay on the user's machine or encrypted peer-to-peer tunnel by default.
4. **Provider-neutral and IDE-neutral.** No provider or IDE gets special treatment in the core.
5. **Safe by default, never in the way.** Low-risk actions flow freely; high-risk ones pause on desktop and phone.
6. **Everything is inspectable.** Every call, cost, and action is traceable.

## 7. Product Scope: Modules

Cairn consists of ten modules. The MVP includes modules 1, 2, 3, a minimal 4 (Git shadow checkpoints), 7, and 10 (Mobile PWA remote approvals + IDE control).

1. Gateway
2. PRD Estimator
3. Budget and Usage Control
4. Safe Actions Layer
5. Policy Engine
6. Observability
7. IDE Extension
8. Local Daemon and Storage
9. Calibration Loop
10. Mobile Remote and Universal IDE Control

## 8. Functional Requirements

### 8.1 Gateway

The gateway is the heart of Cairn. All model and tool traffic passes through it.

**Requirements**

- **GW-1:** Expose an OpenAI-compatible endpoint (`/v1/chat/completions`, `/v1/models`, and embeddings later).
- **GW-2:** Expose an Anthropic-compatible endpoint (`/v1/messages`).
- **GW-3:** Translate every request into one canonical internal schema (messages, tools, parameters, streaming), with fast pass-through for native OpenAI and Anthropic calls.
- **GW-4:** Support provider adapters for OpenAI, Anthropic, OpenRouter, NVIDIA NIM, Ollama, and any OpenAI-compatible server (vLLM, LM Studio, Groq, Together). Gemini, Bedrock, and Azure OpenAI come later.
- **GW-5:** Support streaming (SSE) in both formats while still capturing final token usage and intercepting `tool_use` blocks before forwarding.
- **GW-6:** Normalize tool calling across providers and flag models with weak tool support.
- **GW-7:** Meter every request: uncached input tokens, cache-write tokens, cache-read tokens, output tokens, reasoning tokens, latency, and cost.
- **GW-8:** Fall back to a tokenizer-based estimate when a provider omits usage data (common with local models).
- **GW-9:** Support model aliases (for example `fast`, `smart`, `local`) mapped to real models in config.
- **GW-10:** Support routing rules: fallback on error, fallback on budget (at safe task boundaries), and manual override.
- **GW-11:** Provide an optional response cache (exact match first, semantic later).
- **GW-12:** Provide an MCP proxy mode that sits in front of tool servers (see 8.4).
- **GW-13:** **Task attribution:** Map incoming agent requests to active PRD tasks via URL path tags (`/t/<task-id>/v1`), virtual model prefixes (`cairn/<task-id>/...`), git branch bindings, or lightweight semantic classification of touched file paths.

**Provider capability registry:** each model entry declares support for streaming, tools, vision, JSON mode, prompt caching, context length, and pricing. The router never falls back to a model that lacks a feature the request needs.

### 8.2 PRD Estimator

Turns a product requirements document and optional repository context into a token and cost forecast.

**Inputs:** PRD file (Markdown, text, PDF, or DOCX), optional existing repo scan (file tree, LOC, language/framework detection), chosen model or alias, and chosen agent tool.

**Pipeline**

1. **Scan Repo (optional but recommended):** index the repository's file tree, total lines of code, and test harness to determine baseline context overhead (greenfield vs. brownfield multiplier).
2. **Parse:** extract goals, features, and constraints from the PRD.
3. **Decompose:** break the PRD into a task graph (features, then tasks, then subtasks) using a model call.
4. **Size each task:** estimate files touched, lines to generate, base context to read, per-turn context growth, and complexity (low, medium, high).
5. **Convert to tokens:** apply a cache-aware cumulative turn formula per task (see below).
6. **Apply multipliers:** retry factor, tool-call overhead, test-and-fix loops, and review passes.
7. **Price it:** convert to dollars for each candidate model, accounting for prompt cache write and read pricing.
8. **Report:** output a range, confidence, cost drivers, and what-if scenarios.

**Core formula (per task)**

Coding agents accumulate context across turns while leveraging provider prompt caching:

```
turn_t_new_input    = base_context (if t=1) else avg_tool_output_and_diff
turn_t_cached_input = Σ_{k=1..t-1} turn_k_new_input × cache_hit_ratio
input_cost          = Σ_{t=1..turns} [ (turn_t_new_input × price_in_write) + (turn_t_cached_input × price_in_cached) ]
output_tokens       = (code_generated + reasoning + tool_calls) × turns
task_cost           = (input_cost + output_tokens × price_out) × retry_factor
project_total       = Σ task_cost × repo_complexity_factor × integration_overhead
```

- `turns` depends on complexity and the agent's loop style.
- `cache_hit_ratio` defaults to provider/agent empirical priors (for example 0.85 for Claude Code / Antigravity) and is refined via calibration.
- `retry_factor` starts as a default range (for example 1.5 to 3.5) and is calibrated from real runs.

**Output**

- Low, expected, and high token and dollar estimates (broken down by uncached input, cached input, and output).
- Confidence rating (low, medium, high) based on PRD clarity, repo scan availability, and calibration data.
- Top five cost drivers (for example "authentication module: 22 percent of spend").
- What-if panel: switch model, adjust cache hit ratio, cut a feature, or use a local model for simple tasks.
- Suggested model assignment per task (cheap model for boilerplate, strong model for hard logic).

**Requirements**

- **EST-1:** Accept PRD upload (plus optional local repo path) through the extension, CLI, or mobile remote.
- **EST-2:** Produce an editable task breakdown the user can adjust before estimating.
- **EST-3:** Re-estimate instantly when the user edits tasks or changes the model.
- **EST-4:** Always show ranges and confidence, with an explanation of assumptions (including caching and repo size).
- **EST-5:** Save the estimate as a baseline for tracking actual spend against it.
- **EST-6:** Export the estimate as Markdown or JSON.

### 8.3 Budget and Usage Control

**Requirements**

- **BUD-1:** Budgets by scope: global, project, task, agent session, and day.
- **BUD-2:** Budget units: dollars, tokens, or request count.
- **BUD-3:** Soft alerts at configurable thresholds (for example 50, 80, and 95 percent) pushed to the IDE and mobile remote.
- **BUD-4:** **Graceful hard caps (Wind-Down Injection):** when a hard cap is reached, optionally inject a synthetic wind-down instruction ("Budget reached: do not start new tool loops; save current file state and summarize progress") before blocking further calls so the agent never leaves the repo half-broken.
- **BUD-5:** **Cache-safe auto-downgrade:** on nearing a limit, route to a cheaper model or alias only at task boundaries or after context compaction—never mid-trajectory when invalidating a warm prompt cache would increase net cost.
- **BUD-6:** Runaway detection: flag loops (identical tool call repeated, error-retry oscillation, or spend rate spiking) and pause the agent for desktop/mobile review.
- **BUD-7:** Live burn-down: estimated vs. actual spend per task and per project.
- **BUD-8:** Per-model and per-provider usage reports.
- **BUD-9:** Local-model accounting: tokens and time tracked even when dollar cost is zero, with an optional electricity or GPU cost estimate.

### 8.4 Safe Actions Layer

Controls what agents do, not just what they spend, without requiring custom wrappers for every agent tool.

**Components**

- **Gateway Stream Interceptor:** inspects LLM responses in flight for `tool_use` / function-call blocks (`bash`, `write_file`, `edit`, MCP tools). If a proposed tool call is medium or high risk, the gateway holds the stream until the user approves it in the IDE or on their phone.
- **Action classifier:** labels each tool call as read-only, low risk, medium risk, or high risk, based on tool type, command AST/regex, target resource, and policy.
- **Dry-run engine:** produces a human-readable preview of what will change (for example "will delete 3 files, modify 2, run 1 shell command"). Where an API supports it, uses native dry-run or plan modes.
- **Approval flow:** low risk is auto-approved, medium risk is approved with one click in the IDE or mobile remote, and high risk requires explicit confirmation with the preview shown. Optional Slack or webhook approvals later.
- **Git Shadow Snapshot Undo Engine:** before executing any mutating turn or tool call, Cairn creates a fast, off-branch Git tree snapshot (`git write-tree` stored under `refs/cairn/checkpoints/<run-id>/<step-id>`). This provides 100% reliable, sub-20ms rollback of file creations, edits, and deletions for *any* agent without polluting the user's git commit history. Irreversible external actions (e.g., `git push --force`, external API calls) are clearly labeled before approval.
- **Scoped credentials:** the agent never sees real secrets. Cairn injects short-lived, narrowly scoped credentials at execution time.
- **Idempotency:** every action gets an ID so retries do not double-execute.

**Requirements**

- **SAF-1:** Intercept tool calls both at the Gateway HTTP stream level (works for all agents) and through the MCP proxy / shell hooks.
- **SAF-2:** Show a diff-style preview for file edits, shell commands, and API calls in both the IDE and mobile remote.
- **SAF-3:** Support risk-based auto-approval rules in policy.
- **SAF-4:** Maintain a Git shadow checkpoint journal per run, with one-click revert of a whole run or a single step.
- **SAF-5:** Block or require approval for known-dangerous patterns (for example recursive delete, force push, production database writes).
- **SAF-6:** Detect likely prompt-injection patterns in tool outputs and warn before the agent acts on them.
- **SAF-7:** Charge action costs against the same budget as model calls where relevant (for example paid API calls).

**v1 supported targets:** local filesystem, shell, and git first (via Gateway tool interception + Git shadow snapshots). Then GitHub and AWS actions. Everything else later.

### 8.5 Policy Engine

Declarative rules that drive budgets, routing, and safety.

**Example policy file (`cairn.yaml`)**

```yaml
project: my-app
budgets:
  project: { usd: 40 }
  daily:   { usd: 10 }
  task:    { usd: 3 }
routing:
  default: smart
  on_budget_80: fast_at_task_boundary
  on_budget_100: wind_down_then_block
aliases:
  smart: anthropic/claude-sonnet
  fast:  openrouter/cheap-model
  local: ollama/llama3
actions:
  allow: [read_file, write_file, run_tests]
  ask:   [git_push, install_package]
  deny:  [rm_rf_root, drop_database]
remote:
  enabled: true
  require_biometric_for_high_risk: true
```

**Requirements**

- **POL-1:** Load policy from a per-project file with global defaults.
- **POL-2:** Validate policy and explain errors clearly.
- **POL-3:** Support rule precedence (deny beats ask beats allow).
- **POL-4:** Hot-reload without restarting the daemon.

### 8.6 Observability

- **OBS-1:** Trace every run: prompts, responses, tool calls, tokens, latency, and cost.
- **OBS-2:** Timeline view of a run in the IDE and mobile remote.
- **OBS-3:** Replay a run and diff it against another (for example two models on the same task).
- **OBS-4:** Tamper-evident local audit log of approvals and actions (recording whether approved via IDE or mobile remote).
- **OBS-5:** Redaction of secrets in stored traces, and a configurable retention period.
- **OBS-6:** Export to OpenTelemetry-compatible formats (later).

### 8.7 IDE Extension (Antigravity IDE, VS Code, Cursor, Windsurf)

A thin client compatible with VS Code and all VS Code-based AI IDEs (including Antigravity IDE, Cursor, and Windsurf). All core logic lives in the daemon.

**Views**

- **Status bar:** current spend, budget remaining, active model, and **Mobile Remote QR pairing button**.
- **Estimate panel:** upload PRD, review the task breakdown, see the forecast, and run what-ifs.
- **Budget panel:** burn-down chart, per-task spend, and alerts.
- **Run timeline:** live feed of model calls and actions with risk badges.
- **Approval prompts:** preview plus approve, reject, or edit.
- **Undo panel:** list of reversible Git shadow checkpoints with a revert button.
- **Settings:** providers, keys, aliases, mobile pairing devices, and policy editor.

**Requirements**

- **IDE-1:** Connect to the local daemon automatically via bi-directional WebSocket.
- **IDE-2:** Work offline with local models.
- **IDE-3:** Never block the editor; all heavy work is asynchronous.
- **IDE-4:** One-command setup that points supported agents at the gateway.
- **IDE-5:** Expose an RPC bridge to the daemon so authorized mobile sessions can trigger IDE commands (accept/reject diffs, send prompts, switch files, control integrated terminals).

### 8.8 Local Daemon and Storage

- **DMN-1:** Runs as a background service on macOS, Linux, and Windows.
- **DMN-2:** SQLite for traces, budgets, estimates, and calibration data.
- **DMN-3:** Secrets stored in the OS keychain or an encrypted local vault.
- **DMN-4:** Local REST, WebSocket, and WebRTC API used by the extension, CLI, and mobile remote PWA.
- **DMN-5:** Binds to localhost by default, with QR-paired token + WebAuthn authentication for LAN or encrypted tunnel (Tailscale / Cloudflare Quick Tunnel / WireGuard) mobile access.
- **DMN-6:** Safe upgrades and data migrations.

### 8.9 Calibration Loop

- **CAL-1:** After each task, record estimated vs. actual tokens, cache hit rate, and cost.
- **CAL-2:** Update multipliers (retry factor, turns, context growth, cache hit ratio) per model, task type, and repo.
- **CAL-3:** Show estimate accuracy over time (for example "last 20 tasks: median error 24 percent").
- **CAL-4:** Allow opt-in anonymous sharing of aggregate calibration data later, to improve default priors for everyone.

### 8.10 Mobile Remote and Universal IDE Control

Lets developers supervise agents, approve actions, and directly control their IDE window (Antigravity IDE, VS Code, Cursor, Visual Studio, JetBrains, etc.) from their phone when away from their desk.

**Three-Layer Control Architecture**

1. **Layer 1 — Gateway Stream Control (Universal across all agents):**
   - View live token burn, streaming agent thoughts, and file diffs on the phone.
   - Approve, reject, or edit held tool calls before the gateway releases them to the agent.
   - Inject steering instructions into the agent's next turn, or pause/wind-down the active run.
2. **Layer 2 — IDE Extension RPC Bridge (Antigravity IDE, VS Code, Cursor, Windsurf):**
   - Bi-directional command bridge over the extension WebSocket (`vscode.commands.executeCommand`).
   - Trigger native IDE actions from a mobile-native button bar: accept/reject inline diffs, send chat messages to the IDE agent, switch open files, run build/test tasks, and type into integrated PTY terminals.
3. **Layer 3 — OS Window & Input Bridge (Visual Studio, JetBrains, and native IDE modals):**
   - **Window Discovery & Focus:** Enumerates active IDE windows by process/handle (`Antigravity.exe`, `Code.exe`, `devenv.exe` for Visual Studio, etc. via Win32 / UI Automation on Windows, Accessibility/Quartz on macOS) to bring windows to focus, switch windows, or minimize/maximize.
   - **Window-Scoped Live Stream:** Captures *only* the target IDE window (via Windows Graphics Capture API / ScreenCaptureKit) and streams it over low-latency WebRTC (or on-demand high-DPI snapshots) to the phone—never exposing the rest of the user's desktop.
   - **Targeted Touch, Keyboard & Macro Input:** Translates mobile taps, scrolling, text input, and customizable quick-macro buttons (`Approve Modal`, `Enter`, `Esc`, `Ctrl+C`, `Save All`) into native OS window input events targeted at the IDE window.

**Requirements**

- **REM-1:** Serve a zero-install Mobile Progressive Web App (PWA) from the daemon, paired in under 30 seconds by scanning a QR code in the IDE or CLI.
- **REM-2:** Support both local Wi-Fi (LAN) connection and zero-config encrypted P2P/tunnel relay (Tailscale, Cloudflare Quick Tunnel, or WebRTC STUN/TURN) for out-of-home control.
- **REM-3:** Enforce WebAuthn biometric verification (FaceID / TouchID / Android Biometrics) on the phone before permitting high-risk action approvals, shell input, or OS window control.
- **REM-4:** Provide both a **Mobile-Native Cockpit View** (diffs, approvals, terminal, chat steering, quick macros) and a **Live IDE Window View** (interactive WebRTC window stream for Antigravity IDE, Visual Studio, etc.).
- **REM-5:** Automatically revoke mobile session tokens on inactivity, daemon restart (configurable), or one-click "Disconnect All Devices" in the IDE.

## 9. System Architecture

```
  Agent / IDE / CLI tool
          │  (change base URL)
          ▼
  ┌───────────────────────────────────────────────────────────┐
  │                       Cairn Daemon                        │
  │                                                           │
  │  Front doors: OpenAI API · Anthropic API · MCP proxy      │
  │                            │                              │
  │          Policy Engine ────┴──── Budget Manager           │
  │                │                       │                  │
  │   Gateway Stream Interceptor / Dry-run / Git Shadow Undo  │
  │                │                       │                  │
  │          Router + Provider Adapters                       │
  │          Tracer · Meter · Cache · Task Attributor         │
  │                │                       │                  │
  │          SQLite · Vault          OS Window Bridge         │
  │                                 (Capture & Input)         │
  └────────────────┼─────────────────────────┼────────────────┘
                   │                         │
        ┌──────────┴──────────┐              ▼
        ▼                     ▼       IDE Windows (Antigravity,
  Model providers        Tools / Git  VS Code, Visual Studio)
  (OpenAI, Anthropic,    (filesystem,        ▲
   OpenRouter, NIM,       git refs,          │
   Ollama, ...)           MCP servers)       │
                                             ▼
  IDE Extension ◄──── REST + WS ────► Cairn Daemon ◄──── WebRTC / WSS (E2EE) ────► Phone PWA
```

**Suggested tech stack**

- **Unified Daemon, Gateway, and Estimator:** TypeScript (Bun/Node) or Go for a unified single-binary distribution (avoiding separate Python runtimes on user machines), with native OS bindings (Win32/macOS) for window capture and input injection.
- **Extension:** TypeScript with the VS Code API (compatible with Antigravity IDE, VS Code, Cursor, Windsurf) and a webview for charts.
- **Mobile Remote Client:** Responsive React/Preact Progressive Web App (PWA) bundled directly inside the daemon binary, using WebRTC for window streaming and WebAuthn for biometric confirmation.
- **Storage:** SQLite + Git object database (`refs/cairn/checkpoints/*`) for file state snapshots.
- **Provider translation:** build thin adapters on a small internal interface; pass through native OpenAI and Anthropic schemas directly whenever possible.

**Adapter interface (sketch)**

```
interface ProviderAdapter {
  name: string
  capabilities(model): Capabilities
  toProvider(canonicalRequest): ProviderRequest
  fromProvider(providerResponse): CanonicalResponse
  stream(canonicalRequest): AsyncIterable<CanonicalChunk>
  usage(response): Usage | null
  pricing(model): Pricing
}
```

## 10. Data Model (Core Entities)

| Entity | Key fields |
| --- | --- |
| Project | id, name, repo path, repo stats (LOC, file count), policy, default alias |
| Provider | id, type, base URL, key reference, status |
| Model | id, provider, capabilities, context length, price in/out/cache_write/cache_read |
| Alias | name, target model, fallback chain |
| Budget | id, scope, unit, limit, thresholds, period, exhaustion mode (wind_down / block) |
| Run | id, project, task_id, agent, start, end, status, total cost |
| Call | id, run, model, tokens in/out/cache_write/cache_read, latency, cost, cache hit |
| Action | id, run, type, target, risk level, preview, status, approval (ide / mobile), git_checkpoint_ref |
| Estimate | id, project, PRD hash, repo_hash, low/expected/high tokens and cost, confidence, assumptions |
| Task | id, estimate, parent, complexity, predicted_files, estimated tokens, actual tokens |
| Calibration | scope, model, task type, multipliers (retry, turns, cache_ratio), sample size, error stats |
| RemoteSession | id, device_name, public_key, webauthn_credential_id, paired_at, last_active, permissions |

## 11. User Flows

### Flow A: Estimate a project

1. User opens the Cairn panel and selects `PRD.md` (Cairn automatically scans the workspace repo structure).
2. Cairn shows an editable task breakdown with predicted file touches and cache-aware token math.
3. User picks a model or alias and clicks Estimate.
4. Cairn shows a range, confidence, cost drivers, and what-if options.
5. User sets a budget (for example 120 percent of the expected estimate) and saves it as the baseline.

### Flow B: Run an agent under control

1. User points their agent's base URL at Cairn.
2. The agent runs. Every call is metered, attributed to the active task, and charged to the active budget.
3. A medium-risk action is intercepted in the response stream; Cairn creates a Git shadow snapshot and shows a diff preview in the IDE (and phone). The user approves it.
4. At 80 percent of budget, Cairn queues a model downgrade for the next task boundary (preserving the warm prompt cache for the current task) and notifies the user.
5. The run ends with a summary of actual vs. estimated spend.

### Flow C: Undo a bad run

1. User opens the Undo panel (in the IDE or on their phone) and sees the Git shadow checkpoints from the last run.
2. User reverts a single step or the whole run.
3. Cairn restores the working tree from `refs/cairn/checkpoints/...` in milliseconds and logs the result. Irreversible external steps are listed as not undone.

### Flow D: Supervise and control the IDE from a phone

1. User clicks **Connect Phone** in the Antigravity IDE / VS Code status bar (or runs `cairn remote`) and scans the QR code on their phone.
2. User walks away from their desk while the agent builds a feature.
3. The agent pauses on a high-risk command or an IDE confirmation dialog. The user's phone receives a push alert.
4. User opens the Cairn Mobile PWA, verifies with FaceID/fingerprint, inspects the diff in the mobile cockpit, or switches to the **Live IDE Window View** to see and tap directly inside the Antigravity IDE or Visual Studio window.
5. User approves the step or types a follow-up instruction from their phone; the IDE executes it immediately.

## 12. Non-Functional Requirements

- **Performance:** gateway overhead under 20 ms added latency per request (excluding provider time); streaming must not buffer; Git shadow snapshots under 20 ms; WebRTC window stream latency under 150 ms on LAN.
- **Reliability:** if Cairn's policy or metering fails, it fails safe (blocks high-risk actions) but never corrupts agent traffic.
- **Security:** keys encrypted at rest, localhost binding by default, E2EE + WebAuthn biometrics for mobile remote control, secret redaction in logs, and no telemetry without opt-in.
- **Privacy:** prompts, traces, and window streams stay local/peer-to-peer unless the user exports them.
- **Portability:** single binary install; macOS, Linux, and Windows.
- **Compatibility:** works with any tool that lets the user set a base URL (Antigravity IDE, Claude Code, Cursor, Continue, Aider, custom scripts) and any IDE window via the OS Window Bridge (Visual Studio, JetBrains, etc.).
- **Extensibility:** adapters and policy rules are plug-ins.

## 13. Success Metrics

**Product**

- Time to first metered request under 5 minutes; time to pair phone under 30 seconds.
- Median estimate error under 35 percent after 10 calibrated tasks (target under 20 percent after 50).
- Percentage of runs that stay within budget without leaving broken working trees.
- Number of risky actions caught and previewed (on desktop or mobile) per user per week.

**Adoption**

- GitHub stars and weekly active daemons (opt-in count).
- Number of supported providers, agent tools, and IDEs.
- Retention: users still running Cairn after 30 days.

**Quality**

- Gateway error rate attributable to Cairn below 0.1 percent.
- Zero secret leaks in stored traces (verified by tests).

## 14. Roadmap

| Phase | Timeline | Deliverables |
| --- | --- | --- |
| 0. Foundations | Week 1 | Repo, canonical schema, adapter interface, `cairn.yaml` config format, SQLite schema |
| 1. Gateway + Git Undo MVP | Weeks 2 to 3 | OpenAI and Anthropic front doors (covering OpenRouter, Ollama, NIM via OpenAI compatibility); streaming usage + cache capture; Gateway tool-call interception; Git shadow checkpoints |
| 2. Estimator + CLI | Weeks 4 to 5 | Repo scanner, PRD parser, task decomposition, cache-aware token formula, price what-ifs, `cairn estimate` CLI |
| 3. Budgets & Wind-Down | Weeks 6 to 7 | Budgets, alerts, graceful wind-down injection, cache-safe task-boundary downgrade, runaway loop detection |
| 4. IDE Extension | Weeks 8 to 9 | Antigravity IDE / VS Code status bar, estimate panel, budget panel, undo panel, extension RPC bridge |
| 5. Mobile Remote & IDE Control | Weeks 10 to 12 | Mobile PWA, QR pairing, WebAuthn auth, mobile approvals/steering, Extension RPC actions, OS Window Bridge (WebRTC window stream + touch/key input for Antigravity, VS Code, Visual Studio) |
| 6. Public Alpha | Week 13 | Docs, demo video ("Estimate a PRD and control Antigravity IDE from your phone"), case study on 5 real projects |
| 7. Advanced Safe Actions & Policy | Weeks 14 to 18 | MCP proxy, policy engine hot-reload, prompt-injection scanner, GitHub/AWS dry-run previews |
| 8. Observability & Calibration | Weeks 19 to 22 | Automated calibration loop, accuracy dashboard, run replay and diffing |
| 9. Teams (optional) | Later | Shared budgets, dashboards, hosted relay option, Slack approvals |

**MVP definition:** phases 0 to 5. A builder can estimate a PRD, route agents through Cairn with budgets and Git shadow undo, and supervise or control their IDE window from their phone.

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Estimates are inaccurate | Loss of trust | Use repo-aware + cache-aware math; show ranges and confidence; calibrate from real runs |
| Crowded gateway space | Weak differentiation | Lead with the PRD estimator, Git shadow undo, and mobile IDE remote control |
| Mid-run model downgrade breaks cache/tools | Higher cost or broken runs | Only downgrade at task boundaries or after context compaction; use Wind-Down Injection at hard caps |
| Platform risk (big tools add budgets) | Reduced need | Stay provider-neutral and cross-IDE; focus on the PRD-to-cost loop, universal undo, and mobile control |
| Provider API drift | Maintenance burden | Thin pass-through adapters, contract tests, capability registry |
| Undo is not always possible | User disappointment | Use instant Git shadow snapshots for 100% of repo changes; label external irreversible actions clearly |
| Security of remote IDE control & keys | Severe if breached | Localhost by default, QR pairing, E2EE WebRTC/WebSocket, mandatory WebAuthn biometric check for risky actions, window-scoped capture only |
| Scope creep | Never ships | Strict MVP cut; ship pass-through OpenAI/Anthropic gateway first instead of 10 bespoke adapters |

## 16. Competitive Notes (verify before launch)

Existing LLM gateways and cost trackers (such as LiteLLM, Portkey, and Helicone) cover metering, routing, and budgets for production apps, while remote desktop tools (like TeamViewer or AnyDesk) stream entire desktops without understanding agent loops, budgets, or tool calls. Cairn's unique position is the unified loop for builders: **PRD-to-cost estimation, calibrated budget enforcement, instant Git shadow undo, and agent-aware mobile IDE remote control** across any provider and IDE.

## 17. Business and Distribution

- **License:** open source core (Apache 2.0 or MIT).
- **Distribution:** single binary, VS Code / OpenVSX Marketplace (for Antigravity IDE, VS Code, Cursor), Homebrew, Winget, and npm installers.
- **Growth:** an estimate-vs-actual case study, a short demo of "paste a PRD, get a cost, walk away and control your IDE from your phone," and integration guides for popular agent tools.
- **Possible monetization later:** hosted zero-config P2P mobile relay, team dashboards, shared budgets, SSO, audit export, and managed calibration priors.

## 18. Open Questions

1. Which agent tools and IDEs should be officially tested first (Antigravity IDE, Claude Code, Cursor, Visual Studio, Aider)?
2. For the OS Window Bridge (Layer 3), should v1 start with Windows (Win32 / Windows Graphics Capture API) and macOS (ScreenCaptureKit / Accessibility API) simultaneously, or Windows first?
3. Should the unified daemon + estimator be written in TypeScript (Bun single-executable) for maximum code sharing with the VS Code extension and Mobile PWA, or Go + embedded TypeScript frontend?
4. How do we benchmark estimator accuracy fairly across different repos and models?
5. Which tunnel provider should be built-in as the default out-of-network option for the Mobile Remote (Tailscale integration, Cloudflare Quick Tunnels, or custom WebRTC signaling)?

## 19. Immediate Next Steps

1. Validate the idea: talk to 5 to 10 people running agents regularly about cost, undo, and away-from-desk supervision pain.
2. Lock the tech stack (e.g., TypeScript/Bun monorepo vs. Go + TS) and define the canonical request schema (`Phase 0`).
3. Build the pass-through Gateway for Anthropic + OpenAI-compatible providers with SQLite metering and Git shadow snapshots (`Phase 1`).
4. Prototype the repo-aware, cache-aware PRD estimator on 3 real projects and compare its forecast to actual spend (`Phase 2`).
5. Prototype the Mobile Remote PWA with QR pairing, live approval notifications, and IDE window control for Antigravity IDE and VS Code (`Phase 4–5`).
