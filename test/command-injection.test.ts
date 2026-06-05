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
 */
import * as child_process from 'child_process';
import { openFile, sanitizeImageFilename } from '../src/utility';

jest.mock('child_process', () => ({
  execFile: jest.fn(),
  exec: jest.fn(),
}));

const execFileMock = child_process.execFile as unknown as jest.Mock;
const execMock = child_process.exec as unknown as jest.Mock;

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

describe('openFile never uses a shell (#byte16384 Windows RCE)', () => {
  beforeEach(() => {
    execFileMock.mockReset();
    execMock.mockReset();
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

  it('uses xdg-open (no shell) on Linux', () => {
    withPlatform('linux', () => {
      openFile('mailto:a& calc');
    });
    expect(execMock).not.toHaveBeenCalled();
    expect(execFileMock).toHaveBeenCalledWith('xdg-open', ['mailto:a& calc']);
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
