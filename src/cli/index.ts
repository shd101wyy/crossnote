import * as fs from 'fs';
import * as path from 'path';
import { startServeServer } from '../serve';
import { buildWiki } from '../wiki';

const USAGE = `crossnote

Usage:
  crossnote serve [directory...] [options]
  crossnote build-wiki [directory...] [options]

Commands:
  serve        Start an HTTP server that renders markdown previews for the
               given directories (like a VS Code multi-root workspace; the
               current working directory is used when none is given).
  build-wiki   Build a standalone, single-file wiki (index.html) that embeds
               the rendered notes of the given directories — readable
               anywhere in a browser, no server, no writes.

Global options:
  --vscode          Load config from VS Code user settings on top of the
                    global crossnote config (for use alongside the
                    markdown-preview-enhanced extension).
  --vscode-settings <path>
                    Explicit path to the VS Code user settings.json
                    (auto-detected by default).
  --build-dir <path>
                    Directory containing webview/, styles/ and dependencies/
                    (default: the build output next to this CLI bundle). Host
                    applications that bundle the CLI elsewhere pass their own
                    copy here.
  -h, --help        Show this help.

serve options:
  --port <n>        Port to listen on (default: 3000, auto-increments when
                    busy).
  --host <host>     Host to bind (default: 127.0.0.1).
  --json            Print one JSON line on stdout when the server is up
                    ({"event":"listening",...}) instead of the human-readable
                    block — for hosts that spawn this CLI.

build-wiki options:
  -o, --output <path>
                    Output HTML file (default: ./index.html).

Examples:
  crossnote serve
  crossnote serve ~/notes --port 8080
  crossnote serve docs wiki --port 8080
  crossnote serve . --vscode
  crossnote build-wiki ~/notes
  crossnote build-wiki docs wiki -o ~/public/notes.html
`;

interface FlagSpec {
  /** Flags that take a value, alias → canonical name. */
  valueFlags: Record<string, string>;
  /** Boolean flags, alias → canonical name. */
  booleanFlags: Record<string, string>;
  /** Optional per-flag validation; returns an error message or null. */
  validate?: (flag: string, value: string) => string | null;
}

interface ParsedCommandLine {
  values: Record<string, string | boolean>;
  directories: string[];
}

/**
 * Shared command-line core for the crossnote subcommands: recognized value
 * and boolean flags plus bare directory arguments (resolved against the
 * cwd). Returns null for `--help` and for any parse error (already reported
 * to stderr).
 */
function parseCommandLine(
  argv: string[],
  spec: FlagSpec,
): ParsedCommandLine | null {
  const values: Record<string, string | boolean> = {};
  const directories: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      return null;
    }
    const valueFlag = spec.valueFlags[arg];
    if (valueFlag) {
      const value = argv[i + 1];
      if (!value) {
        console.error(`Missing value for ${arg}`);
        return null;
      }
      const error = spec.validate?.(valueFlag, value) ?? null;
      if (error) {
        console.error(error);
        return null;
      }
      values[valueFlag] = value;
      i += 2;
      continue;
    }
    const booleanFlag = spec.booleanFlags[arg];
    if (booleanFlag) {
      values[booleanFlag] = true;
      i += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      return null;
    }
    directories.push(path.resolve(process.cwd(), arg));
    i += 1;
  }
  return { values, directories };
}

function validatePort(flag: string, value: string): string | null {
  if (flag !== 'port') {
    return null;
  }
  const port = parseInt(value, 10);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    return `Invalid port: ${value}`;
  }
  return null;
}

const SHARED_VALUE_FLAGS: Record<string, string> = {
  '--vscode-settings': 'vscodeSettingsPath',
  '--build-dir': 'buildDirectory',
};

const SHARED_BOOLEAN_FLAGS: Record<string, string> = {
  '--vscode': 'vscode',
};

interface ParsedServeArgs {
  directories: string[];
  port?: number;
  host?: string;
  vscode?: boolean;
  vscodeSettingsPath?: string;
  buildDirectory?: string;
  json?: boolean;
}

export function parseServeArgs(argv: string[]): ParsedServeArgs | null {
  const parsed = parseCommandLine(argv, {
    valueFlags: {
      '--port': 'port',
      '-p': 'port',
      '--host': 'host',
      ...SHARED_VALUE_FLAGS,
    },
    booleanFlags: { '--json': 'json', ...SHARED_BOOLEAN_FLAGS },
    validate: validatePort,
  });
  if (!parsed) {
    return null;
  }
  return {
    directories: parsed.directories,
    port:
      parsed.values.port === undefined
        ? undefined
        : parseInt(String(parsed.values.port), 10),
    host: parsed.values.host as string | undefined,
    vscode: parsed.values.vscode as boolean | undefined,
    vscodeSettingsPath: parsed.values.vscodeSettingsPath as string | undefined,
    // Kept raw; startServeServer resolves it against the cwd.
    buildDirectory: parsed.values.buildDirectory as string | undefined,
    json: parsed.values.json as boolean | undefined,
  };
}

interface ParsedBuildWikiArgs {
  directories: string[];
  output?: string;
  vscode?: boolean;
  vscodeSettingsPath?: string;
  buildDirectory?: string;
}

export function parseBuildWikiArgs(argv: string[]): ParsedBuildWikiArgs | null {
  const parsed = parseCommandLine(argv, {
    valueFlags: {
      '--output': 'output',
      '-o': 'output',
      ...SHARED_VALUE_FLAGS,
    },
    booleanFlags: { ...SHARED_BOOLEAN_FLAGS },
  });
  if (!parsed) {
    return null;
  }
  return {
    directories: parsed.directories,
    // Kept raw; resolved against the cwd below.
    output: parsed.values.output as string | undefined,
    vscode: parsed.values.vscode as boolean | undefined,
    vscodeSettingsPath: parsed.values.vscodeSettingsPath as string | undefined,
    buildDirectory: parsed.values.buildDirectory as string | undefined,
  };
}

async function resolveDirectories(
  argvDirectories: string[],
): Promise<string[]> {
  const directories =
    argvDirectories.length > 0 ? argvDirectories : [process.cwd()];
  for (const directory of directories) {
    const stat = await fs.promises.stat(directory).catch(() => null);
    if (!stat?.isDirectory()) {
      throw new Error(`Not a directory: ${directory}`);
    }
  }
  return directories;
}

async function serve(argv: string[]): Promise<void> {
  const parsed = parseServeArgs(argv);
  if (!parsed) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }
  let directories: string[];
  try {
    directories = await resolveDirectories(parsed.directories);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }

  const server = await startServeServer({
    directories,
    port: parsed.port,
    host: parsed.host,
    vscode: parsed.vscode,
    vscodeSettingsPath: parsed.vscodeSettingsPath,
    // The CLI bundle lives in <package>/out/cli, so the build directory with
    // webview/, dependencies/ and styles/ is one level up unless a host that
    // bundles the CLI elsewhere passes its own copy via --build-dir.
    crossnoteBuildDirectory:
      parsed.buildDirectory ?? path.resolve(__dirname, '../'),
  });

  if (parsed.json) {
    console.log(
      JSON.stringify({
        event: 'listening',
        url: server.url,
        port: server.port,
        host: server.host,
        rootDirectories: server.rootDirectories,
        vscode: !!parsed.vscode,
      }),
    );
  } else {
    console.log(`crossnote serve`);
    for (const root of server.rootDirectories) {
      console.log(`  root:    ${root}`);
    }
    console.log(
      `  config: ${parsed.vscode ? 'vscode + global + workspace' : 'global + workspace'}`,
    );
    console.log(`  app:     ${server.url}`);
    console.log(`  (press Ctrl+C to stop)`);
  }

  const shutdown = () => {
    if (!parsed.json) {
      console.log('\nshutting down…');
    }
    void server.close().then(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function buildWikiCommand(argv: string[]): Promise<void> {
  const parsed = parseBuildWikiArgs(argv);
  if (!parsed) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }
  let directories: string[];
  try {
    directories = await resolveDirectories(parsed.directories);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }
  const outputPath = path.resolve(
    process.cwd(),
    parsed.output ?? './index.html',
  );
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  let lastRoot: string | null = null;
  const result = await buildWiki({
    directories,
    vscode: parsed.vscode,
    vscodeSettingsPath: parsed.vscodeSettingsPath,
    crossnoteBuildDirectory:
      parsed.buildDirectory ?? path.resolve(__dirname, '../'),
    onProgress: ({ rendered, total, root }) => {
      if (root !== lastRoot) {
        if (lastRoot !== null) {
          process.stderr.write('\n');
        }
        lastRoot = root;
        process.stderr.write(`crossnote build-wiki: ${root}\n`);
      }
      process.stderr.write(`\r  rendering ${rendered}/${total}…`);
    },
  });
  process.stderr.write('\n');

  await fs.promises.writeFile(outputPath, result.html);

  console.log(`crossnote build-wiki`);
  for (const root of result.rootDirectories) {
    console.log(`  root:    ${root}`);
  }
  console.log(`  notes:   ${result.files.length}`);
  console.log(
    `  output:  ${outputPath} (${(Buffer.byteLength(result.html) / 1e6).toFixed(1)} MB)`,
  );
  for (const failure of result.failures) {
    console.error(`  failed:  ${failure.path}\n    ${failure.error}`);
  }
}

export async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'serve':
      await serve(rest);
      break;
    case 'build-wiki':
      await buildWikiCommand(rest);
      break;
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      console.log(USAGE);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exitCode = 1;
      break;
  }
}

// Run only when executed directly (the bundled bin), not on import — the
// vscode-markdown-preview-enhanced extension bundles this module for its
// server commands and drives it via argv.
if (require.main === module) {
  void main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
