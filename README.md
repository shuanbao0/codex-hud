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

## Install From Tag (Default: Latest Tag)

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/shuanbao0/codex-hud/main/scripts/install-from-tag.sh)"
```

Install a specific tag:

```bash
TAG=v0.1.1 bash -c "$(curl -fsSL https://raw.githubusercontent.com/shuanbao0/codex-hud/main/scripts/install-from-tag.sh)"
```

Optional preset (`full` | `essential` | `minimal`):

```bash
PRESET=minimal bash -c "$(curl -fsSL https://raw.githubusercontent.com/shuanbao0/codex-hud/main/scripts/install-from-tag.sh)"
```

If you already cloned this repo locally:

```bash
npm run install:tag
# npm run install:tag -- --tag v0.1.1 --preset essential
```

Uninstall:

```bash
node "$HOME/.codex/plugins/codex-hud/scripts/uninstall-local.mjs"
```

## Install From Source (Main Branch)

```bash
git clone https://github.com/shuanbao0/codex-hud.git
cd codex-hud
npm ci
npm run install:local:oneclick
```

Uninstall from cloned repo:

```bash
npm run uninstall:local
```

## Installation Paths

### 1) Local install (manual)

```bash
npm run install:local
```

Then run:

```bash
cd ~/.codex/plugins/codex-hud
npm ci
npm run build
node dist/index.js setup
node dist/index.js configure --preset full
node dist/index.js doctor
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

## Version Tags And Release

- CI is in `.github/workflows/ci.yml`.
- Auto release/tag is in `.github/workflows/release.yml`.
- On each push to `main`, release workflow runs build/lint/test and:
  - reads `package.json` version
  - creates tag `v<version>` and GitHub Release if that tag does not exist yet
  - skips release if the tag already exists

Release a new version:

```bash
# pick one
npm version patch --no-git-tag-version
# npm version minor --no-git-tag-version
# npm version major --no-git-tag-version

git add package.json package-lock.json
git commit -m "chore: release <version>"
git push
```

After push succeeds, GitHub Actions creates the new tag/release automatically.

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
