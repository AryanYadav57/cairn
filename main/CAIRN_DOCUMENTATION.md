# Cairn: System Architecture, Functional Specification & Installation Manual

<div align="center">

![Cairn Logo](ad/assets/Cairn_Teal_Pyramid_Logo.png)

### **The Local-First Control Plane, Cost Estimator & Universal Remote for Coding Agents**

*Know the cost before you build. Stay in control while agents work — from your desk or your phone.*

[![Version](https://img.shields.io/badge/version-0.2.0-FFFFFF.svg?style=flat-square&labelColor=111418)](package.json)
[![License](https://img.shields.io/badge/license-MIT-FFFFFF.svg?style=flat-square&labelColor=111418)](LICENSE)
[![Architecture](https://img.shields.io/badge/architecture-local--first-FFFFFF.svg?style=flat-square&labelColor=111418)](#3-system-architecture)
[![Compatibility](https://img.shields.io/badge/compatibility-OpenAI%20%7C%20Anthropic%20%7C%20Ollama-FFFFFF.svg?style=flat-square&labelColor=111418)](#8-agent--provider-integration)

</div>

---

## Table of Contents

1. [Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
2. [The Problem Statement](#2-the-problem-statement)
3. [The Core Concept: The Cairn Closed Loop](#3-the-core-concept-the-cairn-closed-loop)
4. [System Architecture & Topology](#4-system-architecture--topology)
5. [Core Features & Modules](#5-core-features--modules)
   - [5.1 Cache-Aware PRD Cost Estimator](#51-cache-aware-prd-cost-estimator)
   - [5.2 Dual Protocol AI Gateway & Stream Interceptor](#52-dual-protocol-ai-gateway--stream-interceptor)
   - [5.3 Policy Engine & Hierarchical Budgets](#53-policy-engine--hierarchical-budgets)
   - [5.4 Git Shadow Snapshot Undo Engine](#54-git-shadow-snapshot-undo-engine)
   - [5.5 Mobile Remote & Three-Layer IDE Control](#55-mobile-remote--three-layer-ide-control)
   - [5.6 Calibration & Self-Learning Moat](#56-calibration--self-learning-moat)
   - [5.7 Security, Secret Redaction & Biometrics](#57-security-secret-redaction--biometrics)
6. [Brand Identity & Design System](#6-brand-identity--design-system)
7. [Installation & Quick Start](#7-installation--quick-start)
8. [Agent & Provider Integration](#8-agent--provider-integration)
9. [CLI Command Reference](#9-cli-command-reference)
10. [Policy Specification (`cairn.yaml`)](#10-policy-specification-cairnyaml)
11. [API & Gateway Specification](#11-api--gateway-specification)
12. [Verification, Tests & Benchmarks](#12-verification-tests--benchmarks)
13. [Troubleshooting & Frequently Asked Questions](#13-troubleshooting--frequently-asked-questions)

---

## 1. Executive Summary & Core Philosophy

**Cairn** is an open-source, local-first control plane that sits between autonomous coding agents (and the developers directing them) and the foundation model providers and cloud services they consume. Cairn executes as a lightweight background daemon and gateway, accompanied by an IDE extension and an encrypted, mobile-friendly Progressive Web App (PWA).

A **cairn** is traditionally a man-made stack of stones erected on rugged mountain paths to guide travelers through fog and uncharted terrain. In modern software engineering, AI coding agents navigate complex codebases through thousands of automated steps, tool calls, and LLM queries. Without landmarks, agents frequently suffer from **runaway cost explosions, unvetted destructive actions, and execution paralysis**. Cairn marks where you are, monitors how much token budget you have consumed, safeguards your working tree, and lets you steer the journey from anywhere.

> **Key Distinction:** Cairn is **not** a coding agent. Cairn is the **supervisor, cost forecaster, safety net, and remote cockpit** for all coding agents.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            THE CAIRN CORE LOOP                              │
│                                                                             │
│  [PRD.md + Repo Scan] ──► [Task Graph & Token Math] ──► [Forecast Range]   │
│                                                                │            │
│  [Calibration Engine] ◄── [Actual vs. Estimated] ◄── [Execution & Stream]  │
│                                                                │            │
│                                                      [Git Shadow Snapshot]  │
│                                                      [Mobile IDE Remote]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Problem Statement

While autonomous coding agents (such as Antigravity, Claude Code, Cursor, Aider, and custom agent harnesses) possess remarkable code-generation capabilities, software teams and solo developers encounter four critical failure modes:

### 2.1 Unpredictable, Quadratic Token Burn
- Building a feature with an agent might cost \$2 or \$250. Developers have zero visibility into projected costs before running `agent start`.
- Agent loops accumulate context across multiple turns. A 50-turn trajectory repeatedly pushes the entire conversation history, escalating costs quadratically unless prompt caching and context compaction are strictly budgeted.
- Repeated retry loops and oscillating test failures drain API budgets in minutes without producing working software.

### 2.2 Fragmented Provider Governance
- Model usage and spend limits are locked inside disjoint provider consoles (OpenAI, Anthropic, OpenRouter, NVIDIA NIM, local Ollama).
- Teams have no unified switchboard to enforce project-level spending caps, task-level bounds, or graceful model downgrades across mixed providers.

### 2.3 Binary Trust & High-Risk Blindspots
- Current developer workflows force an untenable choice: either click "Approve" for every single read-only command (crippling productivity), or run the agent in full "auto-approve" mode with catastrophic risks (e.g., accidental recursive file deletions, database drops, broken dependency trees, or force-pushed git branches).
- Until Cairn, there was no intermediate system that offers **intelligent risk classification, human-readable diff previews, and instant sub-20ms rollbacks** without polluting the user's primary Git history.

### 2.4 Desk-Bound Supervision & Waiting Paralysis
- Complex agent runs routinely take 10 to 45 minutes to implement multi-file features and run full test suites.
- If an agent hits an approval gate, an IDE confirmation dialog, or a budget threshold, the entire run halts indefinitely unless the engineer is tethered to their desk.
- Existing remote desktop solutions (AnyDesk, TeamViewer) transmit bloated full-screen video feeds that ignore agent semantics, consume high bandwidth, and expose sensitive desktop windows.

---

## 3. The Core Concept: The Cairn Closed Loop

Cairn solves these challenges through a unified, closed-loop lifecycle:

```
  1. INGEST & SCAN      2. ESTIMATE & WHAT-IF    3. BUDGET POLICY
 ┌─────────────────┐    ┌────────────────────┐   ┌──────────────────┐
 │  PRD.md / Brief │───►│ Cache-Aware Token  │──►│ Define Caps in   │
 │ Workspace Files │    │ Math + Task Graph  │   │ cairn.yaml       │
 └─────────────────┘    └────────────────────┘   └────────┬─────────┘
                                                          │
  6. CALIBRATION         5. SAFE EXECUTION                │
 ┌─────────────────┐    ┌────────────────────┐            ▼
 │ Update Multi-   │◄───│ Stream Intercept   │◄─── 4. SUPERVISION
 │ pliers (CAL-1)  │    │ Git Shadow Snap    │    ┌──────────────────┐
 └─────────────────┘    │ IDE + Mobile PWA   │    │ Gateway Proxy    │
                        └────────────────────┘    │ Biometric Remote │
                                                  └──────────────────┘
```

1. **Estimate Before Execution:** Upload a PRD markdown file and point Cairn to your repository. Cairn generates an editable task decomposition, sizes each task based on predicted file touches and context growth, and produces an honest **Low / Expected / High** cost range and token forecast.
2. **Budget & Routing Policy:** Establish hierarchical limits (project, daily, task) in declarative YAML. Configure automated behaviors such as **Task-Boundary Downgrades** (switching to cheaper models without busting warm prompt caches) and **Graceful Wind-Down Injection** (instructing the agent to commit work and stop cleanly when limits are reached).
3. **Gateway Stream Interception:** All agent requests pass through Cairn's dual-protocol gateway (`http://localhost:4100/v1` and Anthropic `/v1/messages`). Cairn inspects tool invocations mid-stream before forwarding them to the filesystem or shell.
4. **Git Shadow Snapshotting:** Before any mutating action executes, Cairn records an off-branch Git tree snapshot (`refs/cairn/checkpoints/...`) in under 20 milliseconds, guaranteeing zero-risk instant rollbacks without touching `git log`.
5. **Universal Remote Control:** Pair your smartphone in seconds via a QR code. Review streaming agent thoughts, inspect diff previews, approve gated actions with biometric verification (FaceID / Fingerprint), and directly control supported IDE windows (Antigravity IDE, VS Code, Cursor, Visual Studio).
6. **Closed-Loop Calibration:** Each completed task compares actual token usage and cache hits against the original estimate, continuously refining project multipliers for future accuracy.

---

## 4. System Architecture & Topology

Cairn is engineered as a zero-dependency, single-runtime architecture that requires no external databases or cloud dependencies.

```
                                  CODING AGENTS & TOOLS
               ┌───────────────────────────────────────────────────────────┐
               │  Antigravity IDE · Claude Code · Cursor · Aider · Hermes │
               └─────────────────────────────┬─────────────────────────────┘
                                             │  (Set Base URL / Proxy)
                                             ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    CAIRN DAEMON                                        │
  │                                                                                        │
  │  ┌─────────────────────────────────┐           ┌────────────────────────────────────┐  │
  │  │        API FRONT DOORS          │           │          POLICY & BUDGET           │  │
  │  │  • OpenAI (/v1/chat/completions)│           │  • cairn.yaml Parser & Hot-Reload  │  │
  │  │  • Anthropic (/v1/messages)     │◄─────────►│  • Task / Project Burn-Down Meter  │  │
  │  │  • Task Scoped (/t/:id/v1)      │           │  • Wind-Down & Downgrade Engine    │  │
  │  └────────────────┬────────────────┘           └─────────────────┬──────────────────┘  │
  │                   │                                              │                     │
  │                   ▼                                              ▼                     │
  │  ┌─────────────────────────────────┐           ┌────────────────────────────────────┐  │
  │  │   STREAM INTERCEPTOR & SAFETY   │           │      GIT SHADOW UNDO ENGINE        │  │
  │  │  • Tool-Call JSON Stream Parser │           │  • Off-Branch Tree Snapshots       │  │
  │  │  • Prompt Injection Scanner     │◄─────────►│  • refs/cairn/checkpoints/*        │  │
  │  │  • Secret Redaction Pipeline    │           │  • Sub-20ms Atomic Working Restore │  │
  │  └────────────────┬────────────────┘           └────────────────────────────────────┘  │
  │                   │                                                                    │
  │                   ▼                                                                    │
  │  ┌─────────────────────────────────┐           ┌────────────────────────────────────┐  │
  │  │    PROVIDER ROUTER & METER      │           │     OS WINDOW & INPUT BRIDGE       │  │
  │  │  • OpenAI / Anthropic / NIM     │           │  • Win32 / ScreenCaptureKit Stream │  │
  │  │  • OpenRouter / Ollama / Local  │           │  • Target Window Capture (IDE only)│  │
  │  │  • SQLite Ledger & Tracing      │           │  • Biometric WebAuthn Gate         │  │
  │  └────────────────┬────────────────┘           └─────────────────┬──────────────────┘  │
  └───────────────────┼──────────────────────────────────────────────┼─────────────────────┘
                      │                                              │
                      ▼                                              ▼
            FOUNDATION MODEL APIS                         SUPERVISION INTERFACES
      ┌───────────────────────────────┐           ┌────────────────────────────────────┐
      │  Claude 3.7 / 3.5 Sonnet      │           │  • Desktop Browser Cockpit         │
      │  Gemini 2.5 / 2.0 Flash       │           │  • Antigravity / VS Code Extension │
      │  GPT-4o / DeepSeek V3         │           │  • Encrypted Mobile PWA (Phone)    │
      │  Local Ollama / Qwen 2.5      │           │  • WebRTC Low-Latency Video Stream │
      └───────────────────────────────┘           └────────────────────────────────────┘
```

### Architectural Highlights

| Component | Implementation | Latency Overhead | Security Boundary |
| :--- | :--- | :--- | :--- |
| **Gateway Proxy** | Native Node/Bun HTTP Engine | `< 15ms` per chunk | Localhost / Token Bound |
| **Stream Interception** | Non-buffering SSE Chunk Parser | `< 2ms` stream lag | In-flight tool inspection |
| **Git Shadow Engine** | Low-level `git write-tree` plumbing | `< 20ms` per snapshot | Off-branch git ref store |
| **Local Ledger** | In-memory SQLite with WAL mode | `< 1ms` read/write | Encrypted vault / Local disk |
| **OS Window Bridge** | Win32 / ScreenCaptureKit HWND grab | `< 120ms` WebRTC LAN | Window-scoped, no desktop leak |
| **Remote Tunnel** | Encrypted WebRTC / Tailscale / Cloudflare | Peer-to-peer E2EE | WebAuthn Biometric passkey |

---

## 5. Core Features & Modules

### 5.1 Cache-Aware PRD Cost Estimator

Unlike naive calculators that multiply static word counts by flat model rates, Cairn computes the **compounding dynamics of agent trajectories**:

$$\text{Turn}_t\text{ New Input} = \begin{cases} \text{Base Context} & t = 1 \\ \text{Tool Output} + \Delta\text{Diff} & t > 1 \end{cases}$$

$$\text{Turn}_t\text{ Cached Input} = \left(\sum_{k=1}^{t-1} \text{Turn}_k\text{ New Input}\right) \times \text{CacheHitRatio}$$

$$\text{Task Cost} = \left(\sum_{t=1}^{\text{Turns}} \left[ \text{NewIn}_t \times P_{\text{write}} + \text{CachedIn}_t \times P_{\text{read}} \right] + \text{OutTokens} \times P_{\text{out}}\right) \times \text{RetryFactor}$$

```
                CUMULATIVE TOKEN BURN OVER AGENT TURNS
     Tokens (M)
        5M ┼                                              / Naive Uncached Agent
           │                                             /  (Spiraling Quadratic)
        4M ┼                                            /
           │                                           /
        3M ┼                                          /
           │                       ───────────────────   Cairn Cache-Aware &
        2M ┼             ──────────                      Task-Boundary Downgrade
           │   ──────────
        1M ┼───
           │
        0M ┴───┬───────┬───────┬───────┬───────┬───────┬──── Turns
               5      10      15      20      25      30
```

- **Repository Scanner:** Scans workspace directory, computes lines of code (LOC), file trees, language distributions, and existing test harnesses to establish a baseline context overhead factor (1.1x for clean greenfield, up to 1.8x for legacy codebases).
- **Automated Task Decomposition:** Extracts milestones, features, and atomic tasks with complexity ratings (`low`, `medium`, `high`).
- **What-If Scenario Modeling:** Instantly evaluates alternative model architectures (e.g. Claude 3.7 Sonnet vs. DeepSeek V3 vs. local Ollama Qwen 2.5 Coder 14B) and calculates projected budget savings.

---

### 5.2 Dual Protocol AI Gateway & Stream Interceptor

Cairn exposes standard, drop-in API frontdoors:
- **OpenAI Compatible Endpoint:** `http://localhost:4100/v1/chat/completions` and `http://localhost:4100/v1/models`
- **Anthropic Compatible Endpoint:** `http://localhost:4100/v1/messages`
- **Task Scoped Routing:** `http://localhost:4100/t/<task-id>/v1` enables granular attribution of token spend directly to specific PRD tickets.

```json
// Example: Task-bound request header
POST http://localhost:4100/t/auth-jwt/v1/chat/completions
Header: x-cairn-task: auth-jwt
Header: Authorization: Bearer cairn-local-key
```

- **Streaming Tool Interceptor:** As server-sent event (SSE) chunks arrive from the model provider, Cairn reconstructs incoming tool calls (`bash`, `write_file`, `edit_file`, MCP tools) in memory.
- If a tool invocation is classified as **Medium** or **High** risk by policy, the stream is halted in flight. The agent waits gracefully while a diff preview is broadcast to the IDE and the user's mobile device.

---

### 5.3 Policy Engine & Hierarchical Budgets

Defined declaratively in `cairn.yaml`, Cairn enforces three-tier spending budgets:

1. **Project Budget:** Caps total expenditures for the entire repository (e.g., \$40.00).
2. **Daily Budget:** Prevents runaway background loops overnight (e.g., \$10.00/day).
3. **Task Budget:** Binds individual feature tasks to hard ceilings (e.g., \$3.00/task).

#### Graceful Wind-Down Injection (BUD-4)
When an agent reaches 100% of its budget, abrupt termination risks leaving the repository corrupted with half-written files. Cairn intercepts the next prompt turn and injects a synthetic system instruction:

> *"CRITICAL SYSTEM NOTICE: You have reached the designated task budget limit. Do not execute new tool loops or begin new file modifications. Consolidate your changes, ensure existing syntax compiles cleanly, write a status summary, and terminate the current run."*

#### Cache-Safe Model Downgrades (BUD-5)
At 80% budget consumption, Cairn queues a model downgrade (e.g., from `claude-3-7-sonnet` to `gemini-3.8-flash`). Crucially, Cairn **never** switches models mid-trajectory, which would invalidate the warm prompt cache and increase total spend. Downgrades execute exclusively at **task boundaries**.

---

### 5.4 Git Shadow Snapshot Undo Engine

The biggest fear in autonomous agent development is an unvetted script wiping code or introducing untraceable regressions. Standard Git commits pollute branch history with messy "WIP: agent step 12" commits.

```
       USER GIT BRANCH (Clean, pristine commit history)
       ●───────────────────────────●───────────────────────────●
     Commit A                    Commit B                    Commit C

       CAIRN OFF-BRANCH SHADOW SNAPSHOT JOURNAL
       ├── refs/cairn/checkpoints/run-01/step-01 (Hash: a7f82...)
       ├── refs/cairn/checkpoints/run-01/step-02 (Hash: c91e4...)
       └── refs/cairn/checkpoints/run-01/step-03 (Hash: f4b20...)
             │
             └── [RESTORE]: Sub-20ms atomic tree swap via `git read-tree`
```

- **Instant Checkpoint Creation:** Before any mutating tool execution, Cairn runs low-level Git plumbing (`git write-tree`) to create an off-branch tree ref in under 20ms.
- **Atomic One-Click Rollback:** Reverting a botched 50-file agent mistake takes one click in the IDE or mobile phone. Cairn restores the exact working tree from `refs/cairn/checkpoints/<id>`, leaving the regular Git history untouched.

---

### 5.5 Mobile Remote & Three-Layer IDE Control

When developers step away from their workstations, Cairn keeps them in total command via an encrypted, zero-install Mobile Progressive Web App.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      THREE-LAYER CONTROL ARCHITECTURE                       │
│                                                                             │
│  LAYER 1: GATEWAY STREAM CONTROL (Universal for All Agents)                 │
│  • Token Burn Counters · Live Thought Feed · Diff Inspector · Approve/Deny  │
│                                                                             │
│  LAYER 2: IDE EXTENSION RPC BRIDGE (Antigravity IDE, VS Code, Cursor)       │
│  • Accept/Reject Inline Diffs · Send Prompts · Switch Tabs · Run Test Tasks │
│                                                                             │
│  LAYER 3: OS WINDOW & INPUT BRIDGE (Visual Studio, JetBrains, Modals)       │
│  • HWND Discovery · 60fps WebRTC Window Stream · Native Touch & Keystrokes  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Zero-Config Pairing:** Scan a terminal or status bar QR code. Pairing establishes a secure WebRTC/WebSocket channel authenticated via ephemeral tokens.
- **Hardware-Scoped Window Streaming:** Unlike invasive remote desktop tools, Cairn streams **only** the designated IDE window (`Antigravity.exe`, `Code.exe`, `devenv.exe`). Personal apps, notifications, and desktop files are physically excluded from the video stream.
- **Mobile Native Cockpit:** Includes quick-action macros: `Approve Step`, `Reject & Steer`, `Undo Checkpoint`, `Emergency Stop`, and `Save All`.

---

### 5.6 Calibration & Self-Learning Moat

Every software project and development team exhibits distinct patterns in prompt complexity, agent looping styles, and cache retention. Cairn's calibration loop records the outcome of every completed task:

```json
{
  "taskId": "gw-1",
  "estimatedTokens": 374551,
  "actualTokens": 381200,
  "cacheHitRatio": 0.88,
  "retryFactor": 1.25,
  "variance": 0.017
}
```

Over time, Cairn calculates running error distributions. After 20 tasks, median estimation error drops below 20%, creating an organization-specific accuracy moat that commercial hosted gateways cannot replicate.

---

### 5.7 Security, Secret Redaction & Biometrics

- **Localhost Default:** All daemon ports bind strictly to `127.0.0.1`. Remote sessions require explicit pairing tokens or encrypted tunnels.
- **Secret Redaction Pipeline:** Automatically scrubs API keys (`sk-ant-...`, `sk-proj-...`, `AIzaSy...`), private keys, and environment variables from local trace databases before writing to disk.
- **WebAuthn Biometric Guard:** Requiring FaceID or fingerprint verification on mobile devices before permitting irreversible shell operations or Git force pushes.

---

## 6. Brand Identity & Design System

The visual design of Cairn reflects precision engineering, calm authority, and focused minimalism:

```
                   CAIRN BRAND DESIGN SPECIFICATION
┌──────────────────────┬──────────────────────────────────────────────────────┐
│ Brand Attribute      │ Value / Specification                                │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ Primary Background   │ Deep Pitch Obsidian: #090A0C / Pure Black: #000000   │
│ Surface Cards        │ Solid Crisp Dark (No Glassmorphism): #111418, #14181E │
│ Structural Borders   │ Precision Zinc / Dark Slate: #22262C / #2B313D       │
│ Primary Accent       │ Pure Optical White: #FFFFFF                          │
│ Monochromatic Gradients Linear Gradient: #FFFFFF 0% to #828A97 100%         │
│ Alert / Warning      │ Muted Coral: #EF4444 / Caution Amber: #F59E0B        │
│ Primary Text         │ Brilliant White: #FFFFFF                             │
│ Secondary / Body     │ Zinc Silver: #A1A1AA / Muted Slate: #71717A          │
│ Code & Metrics Font  │ JetBrains Mono, monospace                            │
│ Interface Typography │ Inter, Inter Tight, -apple-system, sans-serif        │
│ Iconography Concept  │ Geometric stacked cairn stones in clean monochrome   │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 7. Installation & Quick Start

### 7.1 Prerequisites
- **Node.js**: `v20.0.0` or higher (verified compatible through Node `v24.x`)
- **Package Manager**: `npm` (`v10.x` or higher)
- **Version Control**: `git` installed and accessible in the system `PATH`
- **Operating System**: macOS, Linux, or Windows 10/11 (with PowerShell or bash)

### 7.2 Monorepo Installation

Clone the repository and install all workspace dependencies:

```bash
# 1. Clone repository
git clone https://github.com/cairn-studios/cairn.git
cd cairn

# 2. Install workspace dependencies
npm install

# 3. Build core packages (Core, Daemon, Extension)
npm run build

# 4. Run test suite to verify system integrity
npm test
```

### 7.3 Initializing Your Project

To initialize Cairn in any software project, create a `cairn.yaml` policy file in your repository root:

```yaml
project: my-awesome-app

budgets:
  project:
    usd: 35.00
  daily:
    usd: 10.00
  task:
    usd: 2.50
    exhaustion_mode: wind_down

routing:
  default: smart
  on_budget_80: fast_at_task_boundary
  on_budget_100: wind_down_then_block

aliases:
  smart: anthropic/claude-3-7-sonnet
  fast: google/gemini-3.8-flash
  local: ollama/qwen2.5-coder:14b

actions:
  allow:
    - read_file
    - list_dir
    - grep_search
    - run_tests
  ask:
    - write_file
    - edit_file
    - git_push
    - install_package
    - bash
  deny:
    - rm_rf_root
    - drop_database
    - git_push_force_main

remote:
  enabled: true
  require_biometric_for_high_risk: true
  session_timeout_minutes: 120
```

---

## 8. Agent & Provider Integration

Configuring your coding agents to route through Cairn requires changing only the API Base URL:

### 8.1 Antigravity IDE
In Antigravity IDE, open `Settings` (`Ctrl+,`) or `.agent/config.json`:
```json
{
  "models": {
    "provider": "openai-compatible",
    "baseUrl": "http://localhost:4100/v1",
    "apiKey": "cairn-local-key"
  }
}
```

### 8.2 Claude Code CLI
Point Claude Code to Cairn's Anthropic frontdoor:
```bash
export ANTHROPIC_BASE_URL="http://localhost:4100"
export ANTHROPIC_API_KEY="cairn-local-key"
claude
```

### 8.3 Cursor & Windsurf
1. Navigate to **Settings** → **Models** → **OpenAI API Key**.
2. Toggle **Override OpenAI Base URL**.
3. Set the endpoint to `http://localhost:4100/v1`.
4. Enter any non-empty string for the API key (e.g. `cairn`).

### 8.4 Aider
Launch Aider pointing at the local gateway:
```bash
aider --openai-api-base http://localhost:4100/v1 --openai-api-key cairn
```

### 8.5 Task-Scoped Routing
For automated pull request bots or multi-agent orchestrators, prepend the task ID to the route:
```bash
curl -X POST http://localhost:4100/t/feature-auth/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer cairn" \
  -d '{"model": "smart", "messages": [{"role": "user", "content": "Implement JWT auth"}]}'
```

---

## 9. CLI Command Reference

The Cairn unified CLI provides immediate control from your terminal:

```bash
# Start Daemon, Gateway & Mobile Remote Server
npm run cairn start [--port 4100]

# Generate a repo-aware, cache-aware PRD cost forecast
npm run cairn estimate "Cairn Product Requirements Document.md" --model smart

# Export estimate directly to Markdown or JSON
npm run cairn estimate "PRD.md" --out "ESTIMATE.md"
npm run cairn estimate "PRD.md" --json

# View live spend, budget health, and calibration accuracy
npm run cairn status

# Inspect recent Git shadow snapshots
npm run cairn checkpoints

# Instantly rollback working tree to a specific checkpoint
npm run cairn undo cp_1730948210_step3

# List detected developer IDE windows (Antigravity, VS Code, Visual Studio)
npm run cairn windows
```

---

## 10. Policy Specification (`cairn.yaml`)

The policy engine evaluates rules in strict order of precedence: **`deny` > `ask` > `allow`**.

| Field | Type | Description |
| :--- | :--- | :--- |
| `project` | string | Unique identifier for the repository |
| `budgets.project.usd` | number | Hard ceiling for total project expenditure |
| `budgets.daily.usd` | number | Daily rolling limit (resets every 24h) |
| `budgets.task.usd` | number | Ceiling allocated per PRD task |
| `budgets.task.exhaustion_mode` | string | `wind_down` (inject wrap-up message) or `block` |
| `routing.default` | string | Default alias or model identifier |
| `routing.on_budget_80` | string | Action taken at 80% budget consumption |
| `routing.on_budget_100` | string | Action taken at 100% budget consumption |
| `aliases` | map | Friendly names mapped to full model IDs |
| `actions.allow` | string[] | Actions auto-approved without prompt |
| `actions.ask` | string[] | Actions paused for IDE/mobile confirmation |
| `actions.deny` | string[] | Known dangerous patterns blocked unconditionally |
| `remote.enabled` | boolean | Enables mobile PWA pairing and WebRTC streaming |
| `remote.require_biometric` | boolean | Enforces FaceID/Fingerprint for high-risk approvals |

---

## 11. API & Gateway Specification

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/v1/chat/completions` | OpenAI compatible chat streaming & metering |
| `POST` | `/v1/messages` | Anthropic compatible messages API |
| `POST` | `/t/:taskId/v1/*` | Task-bound proxy route for automated ticket attribution |
| `GET` | `/api/status` | JSON telemetry of spend, calibration, and active runs |
| `GET` | `/api/checkpoints` | List available Git shadow snapshots |
| `POST` | `/api/undo` | Restore working tree to previous shadow snapshot |
| `GET` | `/api/remote/windows` | Enumerate active developer windows for streaming |
| `POST` | `/api/remote/action` | Approve, reject, or edit pending tool execution |
| `GET` | `/remote` | Serves the Mobile Remote Cockpit PWA |
| `GET` | `/ws` | Bi-directional WebSocket for IDE extension & remote PWA |

---

## 12. Verification, Tests & Benchmarks

Cairn includes a built-in automated test suite covering all functional guarantees:

```bash
$ npm test

▶ @cairn/core — Policy, Pricing, Safety & Estimator
  ✔ parses cairn.yaml and enforces rule precedence (deny > ask > allow) (9.6ms)
  ✔ calculates cache-aware token costs accurately (0.3ms)
  ✔ detects prompt injection and redacts secrets in traces (0.5ms)
  ✔ builds a repo-aware and cache-aware PRD estimate with What-If scenarios (2.6ms)
✔ @cairn/core (13.9ms)

▶ @cairn/daemon — Gateway, Git Shadow Undo, Budgets & Mobile Remote
  ✔ routes OpenAI (/v1/chat/completions) and Anthropic (/v1/messages) with task attribution (1186.9ms)
  ✔ intercepts ask-level tool calls, approves via Mobile API, creates Git Shadow Snapshot, and undoes file changes (362.4ms)
  ✔ serves the Mobile Remote Cockpit PWA with valid client JS, queues steering instructions, creates manual snapshots, and captures IDE window frames (231.6ms)
  ✔ updates calibration multipliers after task completion (CAL-1..CAL-3) (1.7ms)
✔ @cairn/daemon (2110.4ms)

ℹ tests 8, suites 2, passed 8, failed 0 (100% pass rate)
```

---

## 13. Troubleshooting & Frequently Asked Questions

#### Q: Does Cairn slow down my agent requests?
**A:** No. Cairn is built as a non-buffering stream proxy. Additional latency is strictly below 15ms per chunk, which is imperceptible during LLM generation.

#### Q: How does Git Shadow Undo differ from `git stash` or regular commits?
**A:** `git stash` only stores one uncommitted state and frequently fails or conflicts during active checkouts. Regular commits pollute your branch history. Cairn uses low-level `git write-tree` to generate isolated, off-branch tree objects stored in `refs/cairn/checkpoints/*`. They execute in under 20ms and never touch your `main` commit log.

#### Q: What happens if the daemon terminates unexpectedly?
**A:** Cairn adheres to the **fail-safe** design principle. If the daemon stops, pending tool streams are aborted, preventing unapproved operations. All past checkpoint refs remain safely recorded in your local `.git` directory and can be restored using native `git read-tree` commands.

#### Q: Can I run Cairn with 100% local, offline models?
**A:** Yes. Set your routing default to `ollama/qwen2.5-coder:14b` or any local server. Cairn tracks token throughput, execution latency, and simulated GPU power costs even when commercial API expense is zero.

---

<div align="center">

**Cairn Control Plane** · Built for Developers Building with AI Agents · *Forecast. Supervise. Stay in control.*

</div>
