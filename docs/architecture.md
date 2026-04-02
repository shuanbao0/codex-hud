# Architecture

Codex HUD v1 uses a strict 4-layer architecture:

1. `core/`
   - Pure domain models and deterministic logic.
   - No filesystem or process access.
2. `providers/`
   - Data collection from stdin, transcript, git, and system.
   - No UI formatting responsibilities.
3. `render/`
   - String composition, bars/colors, compact/expanded layouts.
   - No direct shell or file reads.
4. `app/commands/`
   - Command orchestration for setup/configure/doctor/status.
   - Binds providers + core + render in one place.

This separation keeps complexity low and enables focused unit tests by layer.
