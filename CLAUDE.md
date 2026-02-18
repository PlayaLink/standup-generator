# CLAUDE.md

This file provides project runtime context for `standup-generator`.

## Project Overview

`standup-generator` is an npm workspaces monorepo orchestrated with Turborepo.

## Commands

```bash
npm run dev    # turbo dev across workspaces
npm run build  # turbo build
npm run lint   # turbo lint
npm run clean  # turbo clean and remove root node_modules
```

## Workspace Layout

- `apps/` app-level packages
- `packages/` shared libraries
- `scripts/` utility scripts
- `supabase/` local backend/database artifacts

## Instruction Sources

- Agent behavior/process rules are inherited from `/Users/jengland/claude/chg/AGENTS.md`.
- Keep this file focused on runtime context and workspace layout.
