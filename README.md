# Codex HUD

Codex HUD is a Codex plugin + CLI toolkit that recreates Claude-HUD-style visibility for Codex sessions.

## V1 Goals

- High-fidelity parity for session and activity insights
- Clean architecture with clear boundaries:
  - `core`: pure domain logic and formatting
  - `providers`: data collection (stdin/transcript/git/system)
  - `render`: HUD string rendering
  - `app/commands`: setup/configure/doctor/status entry points
- Dual installation paths:
  - Local one-command install
  - Marketplace-compatible local catalog install
- Cross-platform behavior for macOS/Linux/Windows

## Features

- Session line:
  - model/provider label
  - project path
  - git branch/dirty/ahead-behind/file stats
  - context usage bar and value
  - usage windows (5h/7d) with threshold and reset display
- Activity:
  - tools summary (running + completed count)
  - agents summary (running + recent completed)
  - todos summary (in-progress and completion ratio)
- Commands:
  - `setup`: configures Codex `tui.status_line`
  - `configure`: applies HUD presets
  - `doctor`: validates environment/config paths
  - `status`: renders HUD output

## Quick Start

```bash
npm ci
npm run build
node dist/index.js setup
node dist/index.js configure --preset full
node dist/index.js status
```

## Installation Paths

### 1) Local install

```bash
npm run install:local
```

### 2) Marketplace-style local catalog

```bash
npm run install:marketplace
```

Then open Codex `/plugins` and install `codex-hud`.

## Plugin Commands

- `/codex-hud:setup`
- `/codex-hud:configure`
- `/codex-hud:doctor`
- `/codex-hud:status`

Skills are under `skills/` and call the same CLI commands.

## Development

```bash
npm run build
npm run lint
npm test
```

## Docs

- `docs/feature-parity-matrix.md`
- `docs/configuration.md`
- `docs/platform-guide.md`
- `docs/architecture.md`
- `docs/troubleshooting.md`
