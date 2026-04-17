// These imports are Node.js-only. In web/browser environments they are either
// unavailable or polyfilled as empty stubs. We guard all usage below so that
// the web extension gracefully falls back to a plain code block.
import { execFile } from 'child_process';
import * as crypto from 'crypto';
import { escape } from 'html-escaper';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface D2RenderOptions {
  d2Path: string;
  d2Layout: string;
  d2Theme: number;
  d2Sketch: boolean;
}

/**
 * Returned when the d2 binary is not found — callers should leave the
 * original code block in place rather than showing an error.
 */
export const D2_NOT_FOUND = Symbol('D2_NOT_FOUND');

/**
 * Render a D2 diagram source string to SVG by shelling out to the `d2` CLI.
 * Returns `D2_NOT_FOUND` if the binary is not installed, or an HTML error
 * string if d2 is installed but returns an error.
 */
export async function renderD2(
  code: string,
  opts: D2RenderOptions,
): Promise<string | typeof D2_NOT_FOUND> {
  // Guard: in browser/web environments, crypto.randomBytes is not available.
  if (typeof crypto?.randomBytes !== 'function') return D2_NOT_FOUND;

  const id = crypto.randomBytes(8).toString('hex');
  const tmpIn = path.join(os.tmpdir(), `d2-${id}.d2`);
  const tmpOut = path.join(os.tmpdir(), `d2-${id}.svg`);

  try {
    await fs.promises.writeFile(tmpIn, code, 'utf8');
    await new Promise<void>((resolve, reject) => {
      const args = [
        `--theme=${opts.d2Theme}`,
        `--layout=${opts.d2Layout}`,
        ...(opts.d2Sketch ? ['--sketch'] : []),
        tmpIn,
        tmpOut,
      ];
      execFile(
        opts.d2Path,
        args,
        { timeout: 30000 },
        (err, _stdout, stderr) => {
          if (err) {
            const wrapped = new Error(stderr || err.message) as Error & {
              code?: string;
            };
            wrapped.code = (err as NodeJS.ErrnoException).code;
            reject(wrapped);
          } else {
            resolve();
          }
        },
      );
    });
    return await fs.promises.readFile(tmpOut, 'utf8');
  } catch (err: unknown) {
    // d2 binary not found — caller falls back to plain code block.
    // Some Windows environments report a missing executable via stderr text
    // such as "is not recognized..." instead of an OS-level ENOENT.
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as NodeJS.ErrnoException).code;
    const isNotFound =
      code === 'ENOENT' ||
      /not recognized as an internal or external command/i.test(msg) ||
      /not found/i.test(msg) ||
      /cannot find/i.test(msg) ||
      /No such file or directory/i.test(msg);
    if (isNotFound) return D2_NOT_FOUND;
    return `<pre class="language-text"><code>D2 error: ${escape(msg)}</code></pre>`;
  } finally {
    fs.promises.unlink(tmpIn).catch(() => undefined);
    fs.promises.unlink(tmpOut).catch(() => undefined);
  }
}
