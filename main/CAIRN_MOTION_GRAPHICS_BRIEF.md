# Cairn — Motion Graphics Demo Brief

## What Cairn is

Cairn is a local-first control plane for AI coding agents. It helps developers understand likely project costs before work begins, monitor actual model usage while agents work, and keep risky changes reviewable and reversible. Cairn works alongside coding agents; it is not itself a coding agent.

**Core message:** *Know the cost before you build. Stay in control while agents work—from your desk or your phone.*

## Features to communicate

- **PRD and repository cost forecasting:** turns a product brief and optional repository scan into low, expected, and high token and cost estimates, with confidence, task breakdowns, and model comparisons.
- **AI gateway:** provides OpenAI-compatible and Anthropic-compatible API entry points so supported agents can route model requests through Cairn.
- **Usage and budget visibility:** tracks requests, tokens, cache use, and estimated spend by model and session; policy settings define budgets and routing behavior.
- **Agent activity:** shows recent detected agent work, model attribution, token usage, and cost. The dashboard can auto-detect Codex activity from local Codex session logs and sync Antigravity transcript activity.
- **Safety and recovery:** surfaces actions awaiting approval and keeps Git shadow snapshots that can be restored from the Safety view.
- **Remote supervision:** provides a phone-friendly dashboard for monitoring activity, sending prompts to a connected IDE when a supported window is available, reviewing approvals, and managing checkpoints.
- **Model and agent awareness:** includes choices and activity for agents such as Codex, Antigravity, Claude Code, OpenCode, and Hermes. Gateway routing depends on the selected model, provider configuration, and credentials.

## Suggested demo sequence (45–60 seconds)

1. **Set the context (0–6s):** show a project brief flowing into Cairn; introduce “estimate before execution.”
2. **Forecast (6–15s):** animate the brief and repository context becoming a task plan, then reveal a low/expected/high cost range and model comparison.
3. **Route through Cairn (15–24s):** show an agent request passing through the local gateway; labels call out model, tokens, cache, and budget tracking.
4. **Watch work live (24–34s):** show the Activity view updating with detected Codex or Antigravity activity, model attribution, and spend.
5. **Review and recover (34–44s):** show an approval waiting for review, then a Git snapshot/checkpoint and a restore action.
6. **Continue from phone (44–54s):** transition from desktop to the mobile dashboard to review status, send a prompt to a connected IDE, or manage a checkpoint.
7. **Close (54–60s):** return to the Cairn mark and the core message: “Forecast. Supervise. Stay in control.”

## Visual direction

- Keep the existing minimal, dark dashboard language: black/charcoal surfaces, restrained white dividers, clear typography, and compact technical labels.
- Use peacock blue blending into dark blue as a subtle translucent accent. Reserve brighter white for key values, active tabs, and important decisions.
- Use clean transitions to connect the product loop: **brief → estimate → agent work → live usage → approval/checkpoint → phone supervision**.
- Favor readable UI close-ups and a few large numbers over dense tables. Keep tokens and costs legible when they matter to the story.
- Motion should feel precise and calm: flowing request paths, small usage counters, restrained pulses for live state, and a clear pause at approval.

## Accuracy notes for production

- Present estimates as ranges with assumptions, not guaranteed final costs.
- Show Cairn as the supervisor and gateway around agents, not as the agent generating code.
- A remote IDE prompt requires a connected, supported IDE window. If none is available, demonstrate the honest unavailable/queued state rather than implying a prompt reached the IDE.
- Approval and restore visuals should represent actions available in Cairn’s Safety workflow; do not imply that every external action can be undone.
- Describe provider routing as configuration-dependent. Avoid implying every named model or provider is automatically connected out of the box.
