# Configuration

Codex HUD uses two config files:

1. Codex config: `~/.codex/config.toml`
2. HUD config: `~/.codex/plugins/codex-hud/config.json`

## Status line setup

`setup` command writes a managed block into `config.toml`:

```toml
# codex-hud:statusline:start
[tui]
status_line = ["model-name", "model-with-reasoning", "current-dir", "project-root", "context-remaining", "context-used", "five-hour-limit", "weekly-limit", "codex-version", "context-window-size", "used-tokens", "total-input-tokens", "total-output-tokens", "session-id", "fast-mode"]
# codex-hud:statusline:end
```

If write fails, `setup` prints a manual template.

## HUD presets

```bash
node dist/index.js configure --preset full
node dist/index.js configure --preset essential
node dist/index.js configure --preset minimal
```

## Main HUD config keys

- `lineLayout`: `compact` or `expanded`
- `showSeparators`: boolean
- `pathLevels`: `1|2|3`
- `display.showTools/showAgents/showTodos`
- `display.showUsage`, `display.usageBarEnabled`
- `display.usageThreshold`, `display.sevenDayThreshold`
- `gitStatus.showDirty/showAheadBehind/showFileStats`
- `colors.*`
