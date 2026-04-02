export interface ParsedArgs {
  command: string;
  flags: Record<string, string | boolean>;
}

export function parseArgv(argv = process.argv.slice(2)): ParsedArgs {
  const [command = 'status', ...rest] = argv;
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) continue;
    const keyValue = token.slice(2);
    const equalIndex = keyValue.indexOf('=');
    if (equalIndex >= 0) {
      const key = keyValue.slice(0, equalIndex);
      const value = keyValue.slice(equalIndex + 1);
      flags[key] = value;
      continue;
    }

    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      flags[keyValue] = true;
    } else {
      flags[keyValue] = next;
      i += 1;
    }
  }

  return { command, flags };
}
