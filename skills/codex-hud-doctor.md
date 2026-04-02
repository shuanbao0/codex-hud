---
name: codex-hud:doctor
description: Diagnose codex-hud setup issues for config paths and expected files.
allowed-tools: Bash, Read
---

Run doctor:

```bash
npm run build
node dist/index.js doctor
```

Summarize any issue lines and suggest the next command (`setup` or `configure`).
