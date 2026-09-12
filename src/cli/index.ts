import * as fs from 'fs';
import * as path from 'path';
import { startServeServer } from '../serve';

const USAGE = `crossnote

Usage:
  crossnote serve [directory] [options]

Commands:
  serve        Start an HTTP server that renders markdown previews for the
               given directory (default: current working directory).

Options:
  --port <n>        Port to listen on (default: 3000, auto-increments when
                    busy).
  --host <host>     Host to bind (default: 127.0.0.1).
  --vscode          Load config from VS Code user settings on top of the
                    global crossnote config (for use alongside the
                    markdown-preview-enhanced extension).
  --vscode-settings <path>
                    Explicit path to the VS Code user settings.json
                    (auto-detected by default).
  -h, --help        Show this help.

Examples:
  crossnote serve
  crossnote serve ~/notes --port 8080
  crossnote serve . --vscode
`;

interface ParsedServeArgs {
  directory: string;
  port?: number;
  host?: string;
  vscode?: boolean;
  vscodeSettingsPath?: string;
}

function parseServeArgs(argv: string[]): ParsedServeArgs | null {
  const parsed: ParsedServeArgs = {
    directory: process.cwd(),
  };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case '--port':
      case '-p': {
        const value = argv[i + 1];
        const port = value === undefined ? NaN : parseInt(value, 10);
        if (!Number.isInteger(port) || port < 0 || port > 65535) {
          console.error(`Invalid port: ${value ?? '(missing)'}`);
          return null;
        }
        parsed.port = port;
        i += 2;
        break;
      }
      case '--host': {
        const value = argv[i + 1];
        if (!value) {
          console.error('Missing value for --host');
          return null;
        }
        parsed.host = value;
        i += 2;
        break;
      }
      case '--vscode':
        parsed.vscode = true;
        i += 1;
        break;
      case '--vscode-settings': {
        const value = argv[i + 1];
        if (!value) {
          console.error('Missing value for --vscode-settings');
          return null;
        }
        parsed.vscodeSettingsPath = value;
        i += 2;
        break;
      }
      case '--help':
      case '-h':
        return null;
      default: {
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          return null;
        }
        parsed.directory = path.resolve(process.cwd(), arg);
        i += 1;
        break;
      }
    }
  }
  return parsed;
}

async function serve(argv: string[]): Promise<void> {
  const parsed = parseServeArgs(argv);
  if (!parsed) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }
  const stat = await fs.promises.stat(parsed.directory).catch(() => null);
  if (!stat?.isDirectory()) {
    console.error(`Not a directory: ${parsed.directory}`);
    process.exitCode = 1;
    return;
  }

  const server = await startServeServer({
    directory: parsed.directory,
    port: parsed.port,
    host: parsed.host,
    vscode: parsed.vscode,
    vscodeSettingsPath: parsed.vscodeSettingsPath,
    // The CLI bundle lives in <package>/out/cli, so the build directory with
    // webview/, dependencies/ and styles/ is one level up.
    crossnoteBuildDirectory: path.resolve(__dirname, '../'),
  });

  console.log(`crossnote serve`);
  console.log(`  root:    ${server.rootDirectory}`);
  console.log(
    `  config: ${parsed.vscode ? 'vscode + global + workspace' : 'global + workspace'}`,
  );
  console.log(`  app:     ${server.url}`);
  console.log(`  (press Ctrl+C to stop)`);

  const shutdown = () => {
    console.log('\nshutting down…');
    void server.close().then(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case 'serve':
      await serve(rest);
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

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
