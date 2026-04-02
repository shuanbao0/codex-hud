---
name: codex-hud:status
description: Render current codex-hud status view from stdin/session data.
allowed-tools: Bash, Read
---

Render status:

```bash
npm run build
node dist/index.js status
```

If session input is not piped, the command still renders based on local cwd and git status.
