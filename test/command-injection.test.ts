/**
 * Regression tests for Windows command injection via clicked preview links
 * and diagram output filenames (reported by @byte16384).
 *
 * A crafted markdown link such as
 *   [x](mailto:hello@byte256.csrf.blog%26%20calc.exe)
 * decodes to `mailto:hello@byte256.csrf.blog& calc.exe` and used to reach
 * `child_process.exec('start ' + href)`, where cmd.exe interpreted `&` as a
 * command separator — one-click RCE on Windows. `openFile` must never use a
 * shell. Likewise the diagram `filename` attribute flows into image converters
 * that shell out, so it must be sanitized.
 *
 * The same file also covers the diagram CLI wrappers (CVE-2022-45026): the
 * mermaid and wavedrom converters must spawn without `shell: true`, so that
 * the output paths they are handed — built from untrusted markdown and from
 * the notebook's own directories — reach the CLI as literal arguments.
 */
import * as child_process from 'child_process';
import { mermaidToPNG } from '../src/tools/mermaid';
import { render as wavedromRender } from '../src/tools/wavedrom';
import { npxCommand, openFile, sanitizeImageFilename } from '../src/utility';

jest.mock('child_process', () => {
  const EventEmitter = jest.requireActual('events');
  // execFile must return a ChildProcess-ish EventEmitter — the WSL branch
  // attaches error/exit listeners to pick the next opener in the chain.
  // `wslpath` gets a callback, which we answer with a converted path so
  // the final explorer.exe hop can be asserted.
  return {
    // The diagram CLI wrappers call execFileSync; returning a Buffer keeps
    // `.toString('utf-8')` working in the wavedrom wrapper.
    execFileSync: jest.fn(() => Buffer.from('<svg></svg>')),
    execFile: jest.fn(
      (
        cmd: string,
        _args: unknown[],
        cb?: (error: unknown, stdout?: string) => void,
      ) => {
        if (cmd === 'wslpath') {
          cb?.(null, '\\\\wsl.localhost\\Ubuntu\\tmp\\crossnote.html\n');
        }
        return new EventEmitter();
      },
    ),
    exec: jest.fn(),
  };
});

const execFileMock = child_process.execFile as unknown as jest.Mock;
const execMock = child_process.exec as unknown as jest.Mock;
const execFileSyncMock = child_process.execFileSync as unknown as jest.Mock;

function withPlatform(platform: NodeJS.Platform, fn: () => void) {
  const original = Object.getOwnPropertyDescriptor(process, 'platform');
  Object.defineProperty(process, 'platform', {
    value: platform,
    configurable: true,
  });
  try {
    fn();
  } finally {
    if (original) {
      Object.defineProperty(process, 'platform', original);
    }
  }
}

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const originals = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    originals.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const [key, value] of originals) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe('openFile never uses a shell (#byte16384 Windows RCE)', () => {
  beforeEach(() => {
    // mockClear, not mockReset: reset would strip the execFile
    // implementation installed by the jest.mock factory.
    execFileMock.mockClear();
    execMock.mockClear();
  });

  it('does not call child_process.exec on Windows', () => {
    withPlatform('win32', () => {
      openFile('mailto:hello@byte256.csrf.blog& calc.exe');
    });
    expect(execMock).not.toHaveBeenCalled();
    expect(execFileMock).toHaveBeenCalledTimes(1);
  });

  it('passes a malicious href as a single, unsplit argument to explorer.exe', () => {
    withPlatform('win32', () => {
      openFile('mailto:hello@byte256.csrf.blog& calc.exe');
    });
    const [command, args] = execFileMock.mock.calls[0];
    expect(command).toBe('explorer.exe');
    // The whole string is one argument — no shell, so `&` cannot split a
    // second command.
    expect(args).toEqual(['mailto:hello@byte256.csrf.blog& calc.exe']);
  });

  it('keeps other shell metacharacters inside one argument', () => {
    withPlatform('win32', () => {
      openFile('http://x/?a=1 && calc.exe | whoami');
    });
    const [, args] = execFileMock.mock.calls[0];
    expect(args).toHaveLength(1);
    expect(args[0]).toBe('http://x/?a=1 && calc.exe | whoami');
  });

  it('normalizes a drive path to a file:// URI and opens via explorer.exe', () => {
    withPlatform('win32', () => {
      openFile('C:\\Users\\me\\report.pdf');
    });
    expect(execFileMock).toHaveBeenCalledWith('explorer.exe', [
      'file:///C:\\Users\\me\\report.pdf',
    ]);
  });

  it('uses `open --` on macOS so a leading-dash arg is not a flag', () => {
    withPlatform('darwin', () => {
      openFile('-x');
    });
    expect(execMock).not.toHaveBeenCalled();
    expect(execFileMock).toHaveBeenCalledWith('open', ['--', '-x']);
  });

  it('uses xdg-open (no shell) on Linux outside WSL', () => {
    withPlatform('linux', () => {
      withEnv({ WSL_DISTRO_NAME: undefined }, () => {
        openFile('mailto:a& calc');
      });
    });
    expect(execMock).not.toHaveBeenCalled();
    expect(execFileMock).toHaveBeenCalledWith('xdg-open', ['mailto:a& calc']);
  });

  it('on WSL prefers wslview and never uses a shell', () => {
    withPlatform('linux', () => {
      withEnv({ WSL_DISTRO_NAME: 'Ubuntu' }, () => {
        openFile('mailto:a& calc');
      });
    });
    expect(execMock).not.toHaveBeenCalled();
    expect(execFileMock).toHaveBeenCalledTimes(1);
    // The whole string is one argument — no shell, so `&` cannot split a
    // second command.
    expect(execFileMock).toHaveBeenCalledWith('wslview', ['mailto:a& calc']);
  });

  it('on WSL falls back through xdg-open to explorer.exe, args unsplit', () => {
    withPlatform('linux', () => {
      withEnv({ WSL_DISTRO_NAME: 'Ubuntu' }, () => {
        openFile('mailto:a& calc');
        // The chain is synchronous: emitting a failure immediately
        // spawns the next opener, so re-read mock.results each step.
        execFileMock.mock.results[0].value.emit('exit', 1); // wslview → xdg-open
        execFileMock.mock.results[1].value.emit('exit', 127); // xdg-open → wslpath + explorer.exe
      });
    });
    const calls = execFileMock.mock.calls.map(([cmd, args]) => [cmd, args]);
    expect(calls).toContainEqual(['wslview', ['mailto:a& calc']]);
    expect(calls).toContainEqual(['xdg-open', ['mailto:a& calc']]);
    expect(calls).toContainEqual([
      'explorer.exe',
      ['\\\\wsl.localhost\\Ubuntu\\tmp\\crossnote.html'],
    ]);
    expect(execMock).not.toHaveBeenCalled();
  });
});

describe('sanitizeImageFilename (diagram export filename injection)', () => {
  it('accepts plain file names', () => {
    expect(sanitizeImageFilename('diagram.png')).toBe('diagram.png');
    expect(sanitizeImageFilename('my-chart_v2.png')).toBe('my-chart_v2.png');
  });

  it('accepts a subdirectory path', () => {
    expect(sanitizeImageFilename('assets/diagram.png')).toBe(
      'assets/diagram.png',
    );
  });

  it('accepts non-ASCII (Unicode) filenames', () => {
    // Unicode letters have no shell meaning; non-English filenames must work.
    expect(sanitizeImageFilename('图表.png')).toBe('图表.png');
    expect(sanitizeImageFilename('schéma_électrique.png')).toBe(
      'schéma_électrique.png',
    );
    expect(sanitizeImageFilename('диаграмма.png')).toBe('диаграмма.png');
    expect(sanitizeImageFilename('assets/図.png')).toBe('assets/図.png');
  });

  it('accepts a leading-slash project-root path (MPE convention, not absolute)', () => {
    // `/assets/x.png` means "relative to the project root" — the caller
    // resolves it against projectDirectoryPath, not the filesystem root.
    expect(sanitizeImageFilename('/assets/diagram.png')).toBe(
      '/assets/diagram.png',
    );
  });

  it('rejects shell metacharacters', () => {
    expect(sanitizeImageFilename('x.png && calc.exe')).toBe('');
    expect(sanitizeImageFilename('x.png; rm -rf /')).toBe('');
    expect(sanitizeImageFilename('$(calc).png')).toBe('');
    expect(sanitizeImageFilename('`calc`.png')).toBe('');
    expect(sanitizeImageFilename('a|b.png')).toBe('');
    expect(sanitizeImageFilename('"quoted".png')).toBe('');
  });

  it('rejects whitespace and control characters', () => {
    expect(sanitizeImageFilename('my diagram.png')).toBe('');
    expect(sanitizeImageFilename('a\tb.png')).toBe('');
    expect(sanitizeImageFilename('a\nb.png')).toBe('');
    expect(sanitizeImageFilename('a\x00b.png')).toBe('');
    // Unicode RTL override (filename-spoofing / control) is rejected.
    expect(sanitizeImageFilename('evil‮gnp.png')).toBe('');
  });

  it('rejects `..` path traversal (even with a leading slash)', () => {
    expect(sanitizeImageFilename('../../etc/passwd')).toBe('');
    expect(sanitizeImageFilename('a/../../b.png')).toBe('');
    expect(sanitizeImageFilename('/../outside.png')).toBe('');
  });

  it('returns empty for empty/undefined input (caller falls back to default)', () => {
    expect(sanitizeImageFilename(undefined)).toBe('');
    expect(sanitizeImageFilename('')).toBe('');
  });
});

describe('diagram CLI wrappers never use a shell (CVE-2022-45026)', () => {
  // A project directory that is merely awkward, not exotic: a space (which
  // `shell: true` would split on) plus a shell metacharacter.
  const PROJECT_DIR = '/tmp/My Notes & Drafts';
  const MALICIOUS_PNG_PATH = '/tmp/out/$(touch pwned).png';

  beforeEach(() => {
    execFileSyncMock.mockClear();
  });

  it('mermaidToPNG does not pass shell: true', async () => {
    await mermaidToPNG('graph TD; A-->B;', MALICIOUS_PNG_PATH, PROJECT_DIR, '');

    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
    const [, , options] = execFileSyncMock.mock.calls[0];
    expect(options.shell).toBeUndefined();
    expect(options.cwd).toBe(PROJECT_DIR);
  });

  it('mermaidToPNG passes the output path as a single, unsplit argument', async () => {
    await mermaidToPNG('graph TD; A-->B;', MALICIOUS_PNG_PATH, PROJECT_DIR, '');

    const [command, args] = execFileSyncMock.mock.calls[0];
    expect(command).toBe(npxCommand());
    // The whole path is one argv entry — not split on the space, not expanded
    // by a shell. `--output` is immediately followed by it.
    expect(args[args.indexOf('--output') + 1]).toBe(MALICIOUS_PNG_PATH);
    expect(args).toContain('mmdc');
    // No argv entry may carry an embedded space-joined command.
    expect(
      args.every((arg: string) => !arg.includes('touch pwned).png ')),
    ).toBe(true);
  });

  it('mermaidToPNG defaults an empty theme to the literal "null"', async () => {
    await mermaidToPNG('graph TD; A-->B;', MALICIOUS_PNG_PATH, PROJECT_DIR, '');

    const [, args] = execFileSyncMock.mock.calls[0];
    expect(args[args.indexOf('--theme') + 1]).toBe('null');
  });

  it('wavedrom render does not pass shell: true', async () => {
    await wavedromRender('{signal:[]}', PROJECT_DIR);

    expect(execFileSyncMock).toHaveBeenCalledTimes(1);
    const [command, args, options] = execFileSyncMock.mock.calls[0];
    expect(command).toBe(npxCommand());
    expect(args).toContain('wavedrom-cli');
    expect(options.shell).toBeUndefined();
    expect(options.cwd).toBe(PROJECT_DIR);
  });
});

describe('npxCommand', () => {
  it('names npx.cmd on Windows so CreateProcess resolves it without a shell', () => {
    withPlatform('win32', () => {
      expect(npxCommand()).toBe('npx.cmd');
    });
  });

  it('uses plain npx elsewhere', () => {
    withPlatform('darwin', () => {
      expect(npxCommand()).toBe('npx');
    });
    withPlatform('linux', () => {
      expect(npxCommand()).toBe('npx');
    });
  });
});
