import { buildRuntimeState } from '../runtime.js';
import { renderHud } from '../../render/status.js';

export async function runStatus(): Promise<number> {
  const state = await buildRuntimeState();
  const lines = renderHud({
    session: state.session,
    activity: state.activity,
    config: state.config,
    memory: state.memory,
  });
  for (const line of lines) {
    console.log(line);
  }
  return 0;
}
