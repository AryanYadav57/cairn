# Cairn Improvement Plan

> Status: proposal · Drafted 2026-11-10 · Branch baseline: `dashboard-opt-in-cost-cap` (65d71b3 + uncommitted Claude Code activity work)

This plan turns the review findings and improvement ideas into phased, shippable work. The headline new feature is **Cost per Feature**: every dollar an agent spends is attributed to the git branch, commit and PR it produced.

---

## How the estimates were made

Estimates are in **agent turns** (one model response plus its tool calls), calibrated against this repo's own Claude Code session, which Cairn metered live:

| Measured on this repo (one session) | Value |
|---|---|
| Turns | 144 |
| Total tokens | 28.5M (98.7% cache reads) |
| Uncached input / output | 285K / 91K → ~2.0K input + ~630 output per turn |
| Average context per turn | ~198K tokens (mostly cached) |
| Cost | $43.42 → **~$0.30 per turn** at the rates in Cairn's catalog for Claude Opus 5.5 |

Assumptions used below:
- **Tokens per turn:** ~150K average (fresh session per phase keeps context smaller than the 198K measured in one long session); ~95% are cheap cache reads.
- **Cost per turn:** ~$0.30 (range $0.20–$0.45 depending on context size).
- **Agent time:** ~1 minute per turn including builds/tests. **Calendar time** adds human review, manual testing and decisions (roughly 3–4× agent time).
- Ranges are ±40%. UI work in `mobile-ui.ts` costs more until Phase 3 splits it up, because every edit needs searching a ~7,000-line file.

---

## Phase overview

| # | Phase | Why | Turns | Tokens | Est. cost | Agent time | Calendar |
|---|---|---|---|---|---|---|---|
| 0 | Foundations & data correctness | Prerequisite for trustworthy cost and Cost per Feature | 55 | ~8M | ~$17 | ~1 h | 1–2 days |
| 1 | Security hardening | Safety tool must not be bypassable | 95 | ~14M | ~$29 | ~1.6 h | 3–4 days |
| 2 | End-to-end safety test | Proves the core promise works | 35 | ~5M | ~$11 | ~0.6 h | 1 day |
| 3 | Dashboard codebase split | Makes every later UI phase cheaper and safer | 80 | ~13M | ~$24 | ~1.3 h | 2–3 days |
| 4 | **Cost per Feature** | Headline feature | 120 | ~18M | ~$36 | ~2 h | 4–5 days |
| 5 | Multi-agent view & importer plugins | Real multi-agent monitoring | 115 | ~17M | ~$35 | ~1.9 h | 4 days |
| 6 | Opt-in budgets & notifications | Useful caps for people who want them | 75 | ~11M | ~$23 | ~1.3 h | 2–3 days |
| 7 | Phone cockpit upgrades | Remote control people actually use | 55 | ~8M | ~$17 | ~0.9 h | 2 days |
| 8 | Pricing & forecast accuracy | Numbers you can trust and calibrate | 50 | ~7.5M | ~$15 | ~0.8 h | 2 days |
| 9 | Session replay | Review what agents did while away | 45 | ~7M | ~$14 | ~0.8 h | 1–2 days |
| | **Total (excluding Team mode)** | | **~725** | **~109M** | **~$220** | **~12 h** | **~4–5 weeks part-time / ~2 weeks focused** |
| — | Team mode (optional, later) | Shared spend across machines | 120+ | ~18M+ | ~$36+ | ~2 h+ | 1–2 weeks |

Token mix for the whole plan (approx.): ~103M cache reads, ~1.5M uncached input, ~0.5M output.

**Recommended order:** 0 → 1 → 2 → 3 → 4 → 5 → 6/7 → 8 → 9. Phase 0 is required before Phase 4 (real timestamps). Doing Phase 3 before the UI-heavy phases saves an estimated 15–25% of their tokens.

---

## Phase 0 — Foundations & data correctness (~55 turns)

| Task | Detail | Turns |
|---|---|---|
| Real call timestamps | Add `occurred_at` to `calls` (migration, backfill from `created_at`). Importers pass the agent's own timestamp (Antigravity step `created_at`, Claude line `timestamp`, Codex row `timestamp`). Daily spend and charts use `occurred_at`. | 25 |
| Per-project Antigravity import | Filter `~/.gemini/antigravity/brain` conversations to ones whose steps reference this project's paths (same rule the project ledger already uses). Stops other projects' work inflating spend. | 20 |
| Docs + CI | Fix "12 test suites" (2 suites / 16 tests). Add a CI workflow: `npm ci`, typecheck all packages, `npm test`. | 10 |

**Done when:** spend for this repo excludes unrelated Antigravity work; a backfilled session shows per-day spend on the days it actually happened; CI is green.

## Phase 1 — Security hardening (~95 turns)

| Task | Detail | Turns |
|---|---|---|
| Lock down localhost | Require the token for every state-changing route (`/api/undo`, `/api/os/*`, `/api/remote/steer`, `/api/policy`, approvals, snapshots) even from 127.0.0.1. Check `Host`/`Origin` to block DNS rebinding and cross-site requests; reject `text/plain` JSON bodies (CSRF). Dashboard receives the token via a same-origin bootstrap, never a cross-site-readable endpoint. | 35 |
| Policy-change confirmation | Loosening rules (removing `deny`/`ask`, raising/removing caps) from a phone requires biometric/second confirmation and is written to the audit log. | 20 |
| QR pairing + per-device tokens | Replace the single shared token with per-device tokens issued by QR pairing; list and revoke devices; tokens expire. | 40 |

**Done when:** a page on another origin cannot trigger undo/click/steer (covered by tests); devices can be revoked.

## Phase 2 — End-to-end safety test (~35 turns)

Spin up the daemon against a temp git repo and a mock upstream provider. Send an agent request that issues a `write_file` tool call → assert it is held → approve → assert a Git Shadow snapshot exists → undo → assert the working tree is restored. Repeat with reject (note passed back) and a `deny` rule (blocked + audit entry).

**Done when:** the full approve/reject/deny/undo loop runs in `npm test`.

## Phase 3 — Dashboard codebase split (~80 turns)

| Task | Detail | Turns |
|---|---|---|
| Split `mobile-ui.ts` | Move the ~7,000-line HTML/CSS/JS string into `remote/ui/` (`index.html`, `styles/*.css`, `app/*.ts`), bundled with esbuild at build time and served by the daemon. Type-check the client code. No visual change. | 70 |
| Comment-preserving `cairn.yaml` saves | Use the `yaml` Document API (`parseDocument` + `setIn`) so saving a cap from the dashboard no longer drops comments. | 10 |

**Done when:** the dashboard looks identical (screenshot check), client code is type-checked, saving a cap keeps comments.

## Phase 4 — Cost per Feature (~120 turns) ★

Attribute every call to the **branch**, **commit** and **PR** it produced.

**Attribution sources (most precise first):**
1. Claude Code — each log line already carries `gitBranch` and `cwd`.
2. Codex — `session_meta` carries git info.
3. Antigravity and gateway calls — a lightweight git poller records `work_segments` (branch, HEAD sha, start/end time) every sync; a call maps to the segment active at its `occurred_at`.
4. Manual — "Start feature / Stop feature" tag from dashboard or phone overrides automatic attribution.

| Task | Detail | Turns |
|---|---|---|
| Schema | `calls.git_branch`, `calls.head_sha`, `calls.feature_tag`; new `work_segments` and `feature_tags` tables; migration. | 15 |
| Attribution | Wire the three sources + git poller; backfill existing calls where possible. | 25 |
| Commit mapping | Calls on a branch between commit N-1 and commit N are attributed to commit N (via `git log --format=%H %ct`); uncommitted work shown as "in progress". | 20 |
| API + UI | `GET /api/features` (by branch / commit / PR / tag: cost, tokens, turns, agent mix, cache rate). New **Costs → By feature** view with drill-down to the turns behind each number. | 30 |
| Opt-in outputs | Optional `prepare-commit-msg` hook adding a `Cairn-Cost: $4.20 (Claude Code 82%, Antigravity 18%)` trailer; optional PR comment via `gh` (explicit opt-in per repo, since it posts publicly). | 15 |
| Tests | Attribution rules, commit windows, tag override, hook output. | 15 |

**Done when:** "this PR cost $X across N agent turns" is visible in the dashboard and matches the sum of its calls.

## Phase 5 — Multi-agent view & importer plugins (~115 turns)

| Task | Detail | Turns |
|---|---|---|
| Importer plugin interface | One shape for every agent reader: `detect()`, `readActivity()`, `importCalls()`. Port Antigravity, Claude Code, Codex, OpenCode. Adding Cursor/Aider becomes one file. Splits the oversized `antigravity-sync.ts`. | 60 |
| All-agents row | One row per agent with live status, model, today's cost and last activity, instead of a single "active" agent. | 25 |
| Auto mode for the switcher | Manual selection expires (or an explicit "Auto" chip) so auto-detection resumes. | 10 |
| Session switcher | Pick among multiple Claude/Codex sessions on the same project. | 20 |

## Phase 6 — Opt-in budgets & notifications (~75 turns)

| Task | Detail | Turns |
|---|---|---|
| Per-session / per-task caps | Caps that reset per agent session or task, alongside the project cap. | 20 |
| Burn-rate forecast | "At this rate you'll reach $X by end of task", combining live burn rate with the PRD forecast. | 20 |
| Web push notifications | Service worker + VAPID; alerts at 80% / cap reached / action held for approval. | 35 |

## Phase 7 — Phone cockpit upgrades (~55 turns)

| Task | Detail | Turns |
|---|---|---|
| Approve from the notification | Approve / Reject actions on the push notification for held actions. | 25 |
| Undo history with diffs | List snapshots with a file diff preview before undoing. | 30 |

## Phase 8 — Pricing & forecast accuracy (~50 turns)

| Task | Detail | Turns |
|---|---|---|
| Pricing as dated data | Move model prices to a versioned data file; warn on unknown models instead of fuzzy-matching (e.g. `claude-opus-5-5` once resolved to Claude 4 Opus). | 20 |
| Predicted vs actual | Record PRD-forecast vs actual cost per task; feed the CAL-1..3 calibration (currently 0 samples); show forecast accuracy. | 30 |

## Phase 9 — Session replay (~45 turns)

Timeline of a session: each turn's tools, files touched, tokens and cost, scrubbable, with links to the snapshot at each step. Reuses Phase 4 attribution and Phase 7 diffs.

## Later — Team mode (~120+ turns)

Optional shared server that aggregates redacted spend and feature costs across teammates' machines. Needs auth, hosting and a privacy review; scope separately.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Agent log formats change (Antigravity/Claude/Codex) | Importer plugins with fixture-based tests per format; fail soft and flag "format not recognized". |
| Security changes break the phone flow | Phase 2 E2E test lands before Phase 1 is merged, or alongside it. |
| UI split regresses visuals | Screenshot comparison of key views before/after Phase 3. |
| Attribution ambiguity (agent switches branch mid-turn) | Prefer the agent's own `gitBranch`; otherwise attribute to the segment at the turn's start and mark it "approximate". |
| Estimate drift | Cairn meters its own development: track actual turns/tokens per phase against this plan and re-estimate after Phases 0–1. |

## Measuring this plan with Cairn itself

Run each phase in its own Claude Code session on its own branch. Once Phase 4 ships, the **By feature** view reports the real cost of every phase in this plan, giving a live comparison against these estimates.
