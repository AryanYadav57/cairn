# CLAUDE.md — Agent & Assistant Guide for Cairn

> **Project:** Cairn (`v0.2.0`) — Local-First Control Plane, Cost Estimator & Remote Cockpit for AI Coding Agents  
> **Creator & Architect:** [Aryan Yadav](https://github.com/AryanYadav57) (@AryanYadav57)  
> **Brand & Studio:** Cairn Studios  
> **Full System Specification:** Read [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md) and [`main/CAIRN_DOCUMENTATION.md`](./main/CAIRN_DOCUMENTATION.md).

---

## 1. What is Cairn?
Cairn is a local supervisor and safety control plane for coding agents (Claude Code, Antigravity, Cursor, Codex, OpenCode).
- **Cairn is NOT an agent**: It does not replace the developer or the agent; it monitors spending, guards against destructive actions via Git Shadow snapshots, provides cost forecasts for Markdown PRDs, and enables remote phone monitoring and steering.

---

## 2. Monorepo Structure & Commands

All development happens in the `main/` workspace:

```bash
cd main

# Install dependencies across all workspaces
npm install

# Build all TypeScript packages (@cairn/core, @cairn/daemon, cairn-vscode)
npm run build

# Run unit and integration tests (12 test suites)
npm test

# Launch the Cairn Control Plane & Dashboard on http://localhost:4100
npm start

# Launch the Interactive Product Showcase & Preview on http://localhost:3000
npm run preview

# Run PRD cost estimation CLI
npm run estimate
```

### Workspaces:
- `main/packages/core`: Pure business logic, model pricing catalog, PRD token math, safety rules, and secret redactor.
- `main/packages/daemon`: Local HTTP/WebSocket gateway server, SQLite store (`cairn.db`), Git Shadow snapshot engine, Win32 window bridge, and mobile cockpit UI.
- `main/packages/extension`: VS Code bridge extension.
- `main/ad`: Interactive HTML product showcase and preview server.
- `main/video`: Remotion programmatic video rendering pipeline.

---

## 3. Working with Cairn as Claude

### Gateway Integration
- **Anthropic Messages Endpoint**: `http://localhost:4100`
- **OpenAI Compatible Endpoint**: `http://localhost:4100/v1`
- When launched with `ANTHROPIC_BASE_URL=http://localhost:4100`, Claude requests are metered and guarded by Cairn.

### Safety Gate & Git Shadow Snapshots
- Any tool action matching an `ask` pattern in [`main/cairn.yaml`](./main/cairn.yaml) pauses execution for human approval.
- Before file modifications, Cairn captures a Git Shadow snapshot (`git-shadow.ts`).
- If a human operator clicks **Reject** or sends an undo request from their phone or desktop, Cairn restores the working tree and passes the rejection note. Claude should gracefully accept this and offer an alternative solution.

### Policy Configuration (`main/cairn.yaml`)
- Keep policies declarative: do not hardcode secrets into `cairn.yaml`.
- Respect budget thresholds (`on_budget_80` and `on_budget_100`).
