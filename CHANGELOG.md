# Changelog

All notable changes to the OpenClaw Productivity Agent are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/) and is inspired by the [OpenClaw core changelog](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

## 1.1.0 — 2026-02-26

### Changes

- Config/Version: bump `meta.lastTouchedVersion` from `1.0.0` to `2026.2.19` and update `lastTouchedAt` timestamp to track compatibility baseline.
- Config/Memory: add QMD (Queryable Markdown) memory backend with hybrid search (BM25 + vectors + reranking), session persistence (`retentionDays: 30`), scoping rules, and citation mode. Replaces implicit default memory with explicit `memory.backend: "qmd"` configuration.
- Config/Model: add `model.fallbacks` array for automatic provider failover (`google/gemini-2.0-flash` -> `google/gemini-2.5-flash` -> `openai/gpt-4o-mini`). Remove legacy `models` object from `agents.defaults` — v2026.2.19 uses the fallback chain pattern instead.
- Config/Gateway: add `gateway.auth.mode: "none"` (required by OpenClaw v2026.2.19 for loopback setups — without this, the gateway defaults to token auth and rejects local connections). Add `gateway.trustedProxies: ["127.0.0.1", "::1"]` for reverse proxy support.
- Config/Hooks: add `hooks.internal` with bundled `command-logger` (tool usage logging) and `session-memory` (pre-compaction context persistence) hooks.
- Config/Plugins: add `plugins.load.paths: ["./plugins"]` for v2026.2.19 plugin discovery.
- Config/Compaction: add `compaction.memoryFlush` with `softThresholdTokens: 4000` to automatically save important context before session compaction.
- Config/Subagents: add `subagents.maxConcurrent: 8` configuration.
- Config/Messages: add `messages.ackReactionScope: "group-mentions"` for scoped reaction acknowledgments.
- Config/Telegram: add `reactionNotifications: "own"` to Telegram channel config.
- Plugin/Manifest: add `openclaw.plugin.json` manifest file (required by OpenClaw v2026.2.19+ for structured plugin discovery). Defines plugin id, name, version, description, main entry, and config schema.
- Plugin/Dependencies: bump `@sinclair/typebox` from `^0.32.0` to `^0.34.48`. All 16 tool schemas verified compatible — uses only stable APIs (`Type.Object`, `Type.String`, `Type.Optional`, `Type.Union`, `Type.Literal`, `Type.Number`, `Type.Boolean`).
- Plugin/Naming: rename package from `tempo-core-plugin` to `openclaw-core-plugin`.
- Dashboard/Naming: rename package from `tempo-core-dashboard` to `openclaw-agent-dashboard`.
- Dashboard/Branding: update header from "Tempo Core" to "OpenClaw Agent" in `App.tsx` and browser tab `<title>` in `index.html`.
- Docs/README: document QMD memory, hooks, model fallbacks, gateway auth, trusted proxies, compaction memory flush, and plugin manifests. Fix broken repo URLs (`jdanjohnson/tempo-core` -> `jdanjohnson/Openclaw-AI-Assistant-Project`). Fix systemd service paths.
- Docs/Heartbeat: update `HEARTBEAT.md` with v2026.2.19 heartbeat guard behavior and `HEARTBEAT_OK` suppression (skips Telegram delivery when all checks pass).
- Docs/Env: add `.env.example` template with all required and optional environment variables.

### Fixes

- Dashboard/Title: fix browser tab still showing "Tempo Core" instead of "OpenClaw Agent" (`dashboard/index.html` `<title>` tag was missed in initial branding update).
- Docs/Paths: fix systemd service example still referencing `/home/ubuntu/tempo-core/` paths — updated to `/home/ubuntu/Openclaw-AI-Assistant-Project/`.
- Docs/URLs: fix all README links pointing to `jdanjohnson/tempo-core` (old repo name) — updated to `jdanjohnson/Openclaw-AI-Assistant-Project`.

### Breaking

- **Config/Model**: the `agents.defaults.models` object (`"models": {"google/gemini-2.0-flash": {}}`) has been removed. OpenClaw v2026.2.19 uses `model.fallbacks` instead. If running OpenClaw < v2026.2.19, you may need to re-add the `models` object.
- **Config/Gateway**: `gateway.auth.mode: "none"` is now explicitly set. Previous versions used implicit auth behavior. This is required for v2026.2.19 local development — without it, the gateway rejects connections with "device identity required" errors.

## 1.0.0 — 2026-02-16

### Changes

- Initial release extracted from [Tempo](https://github.com/jdanjohnson/tempo-assistant), a personal AI Chief of Staff system.
- Agent/Config: base `openclaw.json` with Gemini 2.0 Flash model, 30-minute heartbeat, Telegram integration, and local gateway mode.
- Agent/Plugin: core plugin with 16 registered tools — task CRUD (`create_task`, `list_tasks`, `update_task`, `complete_task`, `archive_task`, `delete_task`, `sync_board`, `list_projects`, `create_project`), email management (`run_email_triage`, `list_emails`, `read_email`, `send_email`, `create_draft`), and follow-up tracking (`update_follow_ups`, `list_follow_ups`).
- Agent/Skills: `task-planner` (brain dump to structured tasks) and `email-composer` (draft email replies).
- Agent/Workspace: `SOUL.md` identity, `HEARTBEAT.md` proactive check system.
- Agent/Lib: vault sync engine (`vault-sync.ts`, `vault-tasks.ts`), Gmail adapter (`gmail-adapter.ts`, `gmail-email.ts`), and follow-up tracker (`follow-up-tracker.ts`).
- Dashboard: React/Vite/Tailwind command center with three views — Kanban task board (`TaskBoard.tsx`), 8-category email summary (`EmailSummary.tsx`), and agent chat interface (`ChatPanel.tsx`).
- Vault Template: ready-to-use Obsidian vault structure with `Tasks/Board.md`, `Templates/Task.md`, `Follow-Ups.md`, and `Projects/` directory.
