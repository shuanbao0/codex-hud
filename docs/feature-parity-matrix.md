# Feature Parity Matrix (claude-hud -> codex-hud)

| Capability | claude-hud | codex-hud v1 | Strategy |
|---|---|---|---|
| Model + provider label | Native | Native | Session snapshot from stdin + fallback |
| Project path + git state | Native | Native | Git provider with timeouts and graceful fallback |
| Context bar/value modes | Native | Native | Core metrics + renderer |
| Usage windows (5h/7d) | Native | Native | Uses stdin rate-limit payload when available |
| Activity: tools | Transcript parser | Transcript parser | Shared transcript parser logic |
| Activity: agents | Transcript parser | Transcript parser | Shared transcript parser logic |
| Activity: todos | Transcript parser | Transcript parser | Shared transcript parser logic |
| Multi-line HUD | Native status line output | Rendered command view + status line | Degradation path when UI is single-line |
| Interactive setup/configure | Plugin commands | Plugin skills + CLI commands | `setup/configure/doctor/status` |

## V1 Degradation Rules

- If `tui.status_line` cannot display full multiline content in a given client, codex-hud still exposes full information through `status` command output.
- If transcript path is unavailable, codex-hud displays session and git context without activity lines.
- If usage payload is unavailable, codex-hud hides usage section instead of showing stale or fake data.
