# Platform Guide

## Supported platforms

- macOS
- Linux
- Windows

## Path handling

- All internal path logic normalizes Windows and POSIX separators.
- HUD project display uses forward slashes for consistent rendering.

## Runtime assumptions

- Node.js 18+ required.
- `setup` writes status line command using `node dist/index.js status`.

## Reliability behavior

- External commands (git) use short timeout with graceful fallback.
- Missing stdin/transcript data never crashes rendering.
- `doctor` command reports missing files and gives recovery steps.
