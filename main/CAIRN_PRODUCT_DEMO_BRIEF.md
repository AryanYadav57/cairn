# Cairn — Product Demo Video Brief

## Product identity

- **Product name:** Cairn
- **Category:** Local-first control plane for AI coding agents
- **Tagline:** **Know the cost before you build. Stay in control while agents work—from your desk or your phone.**
- **Short positioning line:** Forecast, supervise, and recover AI-assisted software work from one place.
- **Name meaning:** A cairn is a stack of stones that marks a trail. Cairn helps developers see where an agent run is going, how far it has gone, and where it can safely proceed.

## What Cairn does

Cairn works alongside coding agents; it does not generate code itself. It gives developers a way to estimate likely model spend before a project starts, route supported agent traffic through a local gateway, see usage as work proceeds, review risky actions, and recover local Git state from checkpoints. A phone-friendly remote view can help a developer monitor a run and interact with a connected IDE when away from the desk.

The product is designed to bring four parts of agent work into one loop:

1. **Forecast:** Turn a product requirements document and optional repository context into an editable task breakdown and a low, expected, and high token and cost estimate.
2. **Route and meter:** Send configured model requests through Cairn’s OpenAI-compatible or Anthropic-compatible gateway entry points, where supported, so usage and estimated spend can be recorded.
3. **Supervise:** View run activity, model attribution, usage, cost, budgets, and actions that may need a decision.
4. **Recover and continue:** Use Git shadow checkpoints to restore local working-tree state, and use the mobile remote to monitor or steer a connected IDE workflow.

## Purpose and audience

**Purpose:** Make AI-assisted development more predictable and reviewable. Cairn helps developers answer three practical questions: *What might this project cost? What is the agent doing now? Can I safely review or recover its changes?*

**Primary audience:** Solo builders and startup engineers who use AI coding agents on real projects. Engineering leads and local-model users are secondary audiences.

**Problem to show:** Agent runs can accumulate unpredictable model costs, scatter usage information across tools, pause for decisions while the developer is away, and make it hard to see or recover changes. Cairn gives the developer a shared view and a set of controls around those runs.

## How it works

1. **Start with a project brief.** The developer provides a PRD or project requirements document. Cairn can also scan a repository for file, language, code-size, and test context.
2. **Review the estimate.** Cairn decomposes the brief into tasks and estimates tokens and cost using model pricing, expected turns, prompt caching, repository complexity, and retry/integration assumptions. It reports ranges, confidence, cost drivers, and model what-if comparisons. Estimates are forecasts, not quotes or guarantees.
3. **Connect an agent.** The developer starts Cairn’s local daemon and configures a supported coding tool to use its local gateway URL. Provider selection and model routing depend on the user’s configuration and credentials.
4. **Follow activity and spend.** Cairn records detected or gateway-routed activity, model usage, tokens, and estimated cost. Budgets and policy settings can inform warnings and routing behavior.
5. **Review and recover.** The developer reviews surfaced approvals and can restore a local Git shadow checkpoint. Git snapshots cover local working-tree state; they cannot reverse every external action.
6. **Supervise remotely.** The phone-friendly remote can show status and support actions such as sending a prompt to a connected supported IDE. The IDE must be connected and available for remote control to reach it.

## Demo video message

**Story in one sentence:** A developer starts with an uncertain project brief, gets a cost range, lets a coding agent work through Cairn, checks usage and safety from a dashboard, and stays connected to the run from a phone.

**Suggested format:** 45–60 seconds, polished product walkthrough, calm and precise. Show the real Cairn interface where possible, with close-ups of a few legible values rather than dense screens.

## Suggested 60-second sequence and voiceover

| Time | Screen / action | Voiceover |
| --- | --- | --- |
| 0–6s | Cairn mark; a project brief appears, then flows into the product. | “AI coding agents can move fast. Knowing the cost and keeping oversight shouldn’t be guesswork.” |
| 6–15s | Open a PRD estimate; show task breakdown, low/expected/high range, confidence, and model comparison. | “Give Cairn a project brief—and optionally a repository scan—to see a task-by-task forecast before the work begins.” |
| 15–24s | Show the agent request passing through Cairn’s local gateway; highlight model, tokens, and budget. | “Connect a supported agent through Cairn’s local gateway to track configured model usage and spend in one place.” |
| 24–34s | Activity view updates with detected work, model attribution, tokens, and cost. | “As the agent works, follow activity and usage, and keep an eye on your project budget.” |
| 34–44s | Show an action for review, then a Git shadow checkpoint and restore control. | “When a change needs attention, review it. If local work goes wrong, restore a saved Git checkpoint.” |
| 44–54s | Transition to phone remote; show status and a prompt sent to a connected IDE. | “Away from your desk? Check in from your phone and steer a connected IDE run.” |
| 54–60s | Cairn mark and tagline. | “Cairn. Know the cost before you build. Stay in control while agents work.” |

## On-screen copy options

- **Opening:** “Your agents are moving. Keep the work in view.”
- **Forecast:** “A range, before the first run.” / “Low · Expected · High”
- **Activity:** “Usage and spend, as work happens.”
- **Safety:** “Review the action. Restore a checkpoint.”
- **Remote:** “Your run, within reach.”
- **Closing:** “Cairn — Know the cost before you build. Stay in control while agents work.”

## Product proof points to capture

- Estimate generated from a PRD, optionally informed by a repository scan.
- Low, expected, and high cost/token ranges with visible confidence and assumptions.
- Task-level breakdown and model what-if comparison.
- Local gateway entry points compatible with OpenAI-style and Anthropic-style requests.
- Usage/activity view with model attribution, tokens, and estimated spend.
- Budget/policy visibility.
- Approval and safety workflow plus a local Git checkpoint restore.
- Mobile remote status and an interaction with a connected supported IDE.

## Accuracy notes for the demo

- Cairn is the supervisor and control plane around coding agents, not a coding agent or hosted model service.
- The project requirements describe Cairn as local-first and explicitly say hosted SaaS is not part of v1. A SaaS-style video format is fine, but do not portray a hosted multi-tenant service as currently available.
- Estimates are ranges based on assumptions; never present a forecast as an exact bill or guaranteed savings.
- Gateway routing requires a supported client, configured provider/model, and valid credentials. Do not imply every provider or agent is connected automatically.
- Activity can come from detected local agent sessions as well as gateway-routed requests; label what the chosen screen is actually showing.
- Remote IDE actions require a connected, supported IDE window. If it is unavailable, show the pending or unavailable state rather than implying a prompt was delivered.
- Git shadow restore applies to local repository state. Do not suggest it reverses external API calls, cloud changes, or every action.
- Treat approval and risk controls as capabilities shown by the current build and configuration. Avoid implying every tool action is intercepted in every agent integration.
- Keep sample prices, usage totals, estimates, and model names visibly framed as demo data when they are illustrative.

## Production checklist

- **Before recording:** Start the Cairn daemon, connect the target IDE/agent, configure a demo provider, prepare a representative PRD and repository, and seed activity/checkpoint data if needed.
- **During recording:** Make the estimate range and assumptions readable; show one live activity update; show a real checkpoint restore or clearly labeled demo state; verify phone and IDE connectivity before showing remote steering.
- **Close:** Return to Cairn’s logo and repeat the approved tagline.

## Source of truth

This brief reflects the project PRD, the motion-graphics demo brief, and the current repository structure and implementation. Where a capability depends on provider setup, a connected IDE, or current build coverage, the wording above preserves that condition.
