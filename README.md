# Cairn

<p align="center">
  <img src="main/assets/brand/cairn-combined.png" alt="Cairn logo" width="420">
</p>

<p align="center"><strong>A local-first control plane for AI coding agents.</strong><br>
Estimate project costs, apply policy and budget guardrails, review risky actions, and keep an eye on agent work from your desktop or phone.</p>

<p align="center">
  <img alt="Version 0.2.0" src="https://img.shields.io/badge/version-0.2.0-397D75">
  <img alt="Node.js 20 or newer" src="https://img.shields.io/badge/Node.js-20%2B-43853D">
  <img alt="TypeScript" src="https://img.shields.io/badge/language-TypeScript-3178C6">
</p>

<p align="center">
  <img src="main/docs/screenshots/dashboard-home.jpg" alt="Cairn dashboard home: active agent, session cost, prompt cache rate and live token chart" width="860">
</p>

## About

Cairn runs locally alongside your coding tools. Its gateway can meter model usage and estimated spend, apply project policies, and hold actions for review. A repository-aware estimator forecasts the token and cost range for a Markdown product brief. Git shadow checkpoints support restoring a working tree, while the built-in dashboard provides a desktop and mobile view of activity and approvals.

Cairn is a supervisor for coding agents; it does not generate or edit your project code itself. This repository is an actively developed **v0.2.0** project. Provider integrations, IDE support, and operating-system-specific controls depend on your setup and are still evolving.

## Features

- **PRD cost estimates** — break down a Markdown brief into tasks and estimate low, expected, and high token and cost ranges.
- **Local model gateway** — route compatible OpenAI and Anthropic API clients through a local endpoint; provider credentials can come from environment variables or the client request.
- **Session cost by default, caps when you want them** — Cairn tracks what each session spends without enforcing any limit. Add a cost cap from the dashboard (**Home → Session cost → Set cost cap**) or in `cairn.yaml`, and remove it the same way.
- **Action policies** — model aliases plus allow, ask, and deny rules for agent tool calls in `cairn.yaml`.
- **Agent auto-detection** — recognises the agent you're working with (Claude Code, Antigravity IDE, Codex, OpenCode) from its local session files or gateway traffic, and shows that agent's model, steps, tokens and conversation.
- **Action review and checkpoints** — inspect gated actions and use Git shadow snapshots to restore a previous working tree state.
- **Desktop and mobile dashboard** — view activity, costs, approvals, and remote controls while the daemon is running.
- **VS Code-compatible extension source** — build the extension workspace and connect it to the local daemon.

## Screenshots

| Telemetry & step history | Cost estimator & model comparison |
| --- | --- |
| <img src="main/docs/screenshots/telemetry-history.jpg" alt="Per-step telemetry table with model, tool, tokens, cache reads and cost" width="420"> | <img src="main/docs/screenshots/costs-estimator.jpg" alt="PRD cost range and per-model cost comparison" width="420"> |
| **Safety gate & instant undo** | **Phone cockpit** |
| <img src="main/docs/screenshots/safety-gate.png" alt="Actions waiting for approval and Git shadow snapshots" width="420"> | <img src="main/docs/screenshots/mobile-cockpit.jpg" alt="Cairn dashboard on a phone" width="200"> |

## Requirements

- Node.js **20 or newer**
- npm **10 or newer**
- Git available on your `PATH` (needed for Git shadow checkpoints)
- Windows, macOS, or Linux; some IDE-window controls are platform-specific

## Install and run

The application source and Node workspaces live in [`main/`](main/). From a terminal:

```bash
git clone https://github.com/AryanYadav57/cairn.git
cd cairn/main
npm install
npm run build
npm start
```

The daemon starts on port `4100` by default. Open `http://localhost:4100` on the computer running Cairn. The startup output also prints a phone-ready remote URL containing a pairing token; open that link from a device on your trusted local network to pair it. Keep the link private.

To use another port:

```bash
npm start -- --port 4200
```

Stop the daemon with **Ctrl+C**.

## Configure a project

The included [`cairn.yaml`](main/cairn.yaml) is an example policy. Edit it to set your project name, model aliases, action rules and, optionally, cost caps. No caps are set by default (`budgets: {}`); to add one:

```yaml
budgets:
  project: { usd: 40, exhaustion_mode: wind_down }   # whole-project cap
  daily:   { usd: 10 }                                # resets each day
```

Saving a cap from the dashboard rewrites `cairn.yaml`, which currently drops comments in that file. To point Cairn at a different repository, start the daemon from that repository (so it can read that folder's `cairn.yaml` and use its Git history), or use the relevant CLI `--repo` option.

Set a provider key in your shell if you want the gateway to call that provider. Keys are read from environment variables and should not be committed:

```bash
# macOS / Linux
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
npm start
```

```powershell
# Windows PowerShell (for this terminal session)
$env:ANTHROPIC_API_KEY = "your-key"
$env:OPENAI_API_KEY = "your-key"
npm start
```

Supported provider variables include `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), `OPENROUTER_API_KEY`, and `NVIDIA_API_KEY` (or `NIM_API_KEY`). You can also pass a provider key from a compatible client request. Do not put real keys in `cairn.yaml` or source control.

## Route an agent through Cairn

Start the daemon first, then configure your client to use the local API endpoint:

| Client protocol | Base URL |
| --- | --- |
| OpenAI-compatible | `http://localhost:4100/v1` |
| Anthropic Messages | `http://localhost:4100` |

For example, Claude Code can be launched from a shell with:

```bash
ANTHROPIC_BASE_URL=http://localhost:4100 ANTHROPIC_API_KEY=cairn-local-key claude
```

For other clients, set the matching custom API base URL and use the provider's API key or a local placeholder where supported. See the [integration guide](main/CAIRN_DOCUMENTATION.md#8-agent--provider-integration) for client-specific examples and additional configuration.

## CLI commands

Run these commands from `main/`:

```bash
npm run cairn -- doctor
npm run cairn -- status
npm run cairn -- checkpoints
npm run cairn -- ask "How does current spend compare with the estimate?"
npm run estimate -- "Cairn Product Requirements Document.md" --repo .
```

`estimate` prints a report; add `--json` for JSON output or `--out estimate.md` to save a Markdown report. Other available commands include `start`, `undo [checkpoint-id]`, and `windows` (IDE window detection is platform-specific). Run `npm run cairn` to display the CLI help.

## Development

```bash
cd main
npm install
npm run build
npm test
```

The npm workspaces are:

- [`packages/core`](main/packages/core/) — policy schemas, pricing, and cost estimation
- [`packages/daemon`](main/packages/daemon/) — local gateway, dashboard, telemetry, and CLI
- [`packages/extension`](main/packages/extension/) — editor extension source

The `video/` and `ad/` folders contain Remotion and product-demo assets. Their optional scripts are listed in [`package.json`](main/package.json).

## Security notes

- The phone pairing link contains a token. Treat it like a password and only open it on devices on a trusted network.
- Requests from the same computer (`localhost`) are currently trusted without the token. Don't run Cairn on a shared machine, and don't browse untrusted sites while it is running, until per-request token checks land (Phase 1 of the [improvement plan](main/docs/IMPROVEMENT_PLAN.md)).
- Provider API keys are read from environment variables or forwarded by the client. They are never written to `cairn.yaml`, and secrets are redacted from stored prompts and responses.

## Roadmap

The phased [improvement plan](main/docs/IMPROVEMENT_PLAN.md) covers data correctness, security hardening, an end-to-end safety test, **Cost per Feature** (spend attributed to each branch, commit and pull request), a multi-agent view, opt-in budgets with notifications, and session replay. It includes time and token estimates calibrated against Cairn's own metered development.

## Troubleshooting

- **Port already in use:** start with another port, such as `npm start -- --port 4200`, and configure clients to use that port.
- **Provider call fails:** check that the relevant key is set in the same shell that starts Cairn, or that the client is forwarding its provider key.
- **No checkpoints appear:** run Cairn from a Git repository and confirm Git is installed and available on `PATH`.
- **Phone cannot connect:** keep the phone and computer on the same trusted network and use the full remote URL printed at startup. Local firewall rules may need to allow the selected port.
- **IDE window controls are unavailable:** the `windows` command and some window-management controls require platform-specific support.

## Documentation

- [System architecture, setup, CLI, and integration guide](main/CAIRN_DOCUMENTATION.md)
- [Product requirements](<main/Cairn Product Requirements Document.md>)
- [System and architecture guide (PDF)](main/CAIRN_SYSTEM_AND_ARCHITECTURE_GUIDE.pdf)
- [Estimate notes](main/CAIRN_ESTIMATE.md)
- [Improvement plan and roadmap](main/docs/IMPROVEMENT_PLAN.md)

## Project structure

```text
.
├── README.md           # Project overview and quick start
└── main/               # Cairn application, packages, config, and docs
    ├── packages/
    ├── ad/
    ├── assets/
    ├── docs/
    ├── scripts/
    └── video/
```
