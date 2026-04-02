import { loadHudConfig, saveHudConfig } from '../../config/hud-config.js';
import type { HudConfig } from '../../core/types.js';

export async function runConfigure(flags: Record<string, string | boolean>): Promise<number> {
  const preset = typeof flags.preset === 'string' ? flags.preset : 'full';
  const current = loadHudConfig();
  const next = applyPreset(current, preset);
  saveHudConfig(next);

  console.log(`Saved codex-hud config with preset: ${preset}`);
  console.log('Config file is now ready for status rendering.');
  return 0;
}

function applyPreset(config: HudConfig, preset: string): HudConfig {
  const merged: HudConfig = JSON.parse(JSON.stringify(config));
  if (preset === 'minimal') {
    merged.display.showTools = false;
    merged.display.showAgents = false;
    merged.display.showTodos = false;
    merged.display.showUsage = true;
    merged.display.showSessionName = false;
    merged.display.showDuration = false;
    return merged;
  }

  if (preset === 'essential') {
    merged.display.showTools = true;
    merged.display.showAgents = true;
    merged.display.showTodos = true;
    merged.display.showUsage = true;
    merged.display.showSessionName = false;
    merged.display.showDuration = true;
    return merged;
  }

  merged.display.showTools = true;
  merged.display.showAgents = true;
  merged.display.showTodos = true;
  merged.display.showUsage = true;
  merged.display.showSessionName = true;
  merged.display.showDuration = true;
  merged.display.showMemoryUsage = true;
  return merged;
}
