import { loadHudConfig } from '../config/hud-config.js';
import { getGitSnapshot } from '../providers/git-provider.js';
import { getMemorySnapshot } from '../providers/system-provider.js';
import { getTranscriptPath, readStdinPayload, toSessionSnapshot } from '../providers/stdin-provider.js';
import { parseTranscript } from '../providers/transcript-provider.js';

export async function buildRuntimeState() {
  const stdin = await readStdinPayload();
  const session = toSessionSnapshot(stdin);
  session.git = await getGitSnapshot(session.cwd);

  const transcriptPath = getTranscriptPath(stdin);
  const transcript = await parseTranscript(transcriptPath);
  if (!session.sessionName && transcript.sessionName) {
    session.sessionName = transcript.sessionName;
  }
  if (!session.startedAt && transcript.sessionStart) {
    session.startedAt = transcript.sessionStart;
  }

  return {
    config: loadHudConfig(),
    session,
    activity: transcript.activity,
    memory: getMemorySnapshot(),
  };
}
