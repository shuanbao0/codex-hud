---
name: codex-hud:setup
description: Configure Codex status_line for codex-hud automatically with a manual fallback template.
allowed-tools: Bash, Read
---

Run setup for codex-hud:

```bash
npm run build
node dist/index.js setup
```

If setup cannot update `~/.codex/config.toml`, print and explain the manual `[tui] status_line = ...` template.
