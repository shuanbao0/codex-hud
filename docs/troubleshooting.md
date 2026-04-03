# Troubleshooting

## `setup` says config update failed

- Codex HUD prints a manual `status_line` TOML block.
- Copy the block into `~/.codex/config.toml` under `[tui]`.

## `Ignored invalid status line items` warning appears

- This means `status_line` contains unsupported values for your Codex version.
- Re-run setup from the latest codex-hud version:

```bash
npm run build
node dist/index.js setup
```

## No tool/agent/todo activity appears

- Ensure stdin includes `transcript_path`.
- Verify transcript file exists and is readable.

## Git info missing

- Confirm you are inside a git repository.
- If the repository is very large, command timeout fallback may hide git details.

## Doctor reports missing files

Run:

```bash
node dist/index.js setup
node dist/index.js configure --preset full
node dist/index.js doctor
```
