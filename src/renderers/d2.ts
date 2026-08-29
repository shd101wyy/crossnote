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
 * Write the temporary D2 input file and return its path. Prefer writing beside
 * the source document so D2 can resolve relative image/icon paths against the
 * input file's own directory (not the process cwd), which lets embedded
 * diagrams reference assets like `icon: ./icons/x.svg`. Falls back to the OS
 * temp dir when that write fails (document directory missing or not writable).
 * Writing first and catching failure avoids a TOCTOU false-positive from a
 * separate `accessSync(W_OK)` pre-check (e.g. root on a read-only mount).
 */
async function writeInputFile(
  fileDirectoryPath: string | undefined,
  name: string,
  code: string,
): Promise<string> {
  if (fileDirectoryPath) {
    const preferred = path.join(fileDirectoryPath, name);
    try {
      await fs.promises.writeFile(preferred, code, 'utf8');
      return preferred;
    } catch {
      // notebook dir missing or not writable — fall back to the OS temp dir
    }
  }
  const fallback = path.join(os.tmpdir(), name);
  await fs.promises.writeFile(fallback, code, 'utf8');
  return fallback;
}

/**
 * Render a D2 diagram source string to SVG by shelling out to the `d2` CLI.
 * Returns `D2_NOT_FOUND` if the binary is not installed, or an HTML error
 * string if d2 is installed but returns an error.
 */
export async function renderD2(
  code: string,
  opts: D2RenderOptions,
  fileDirectoryPath?: string,
): Promise<string | typeof D2_NOT_FOUND> {
  // Guard: in browser/web environments, crypto.randomBytes is not available.
  if (typeof crypto?.randomBytes !== 'function') return D2_NOT_FOUND;

  const id = crypto.randomBytes(8).toString('hex');
  const inputName = `.crossnote-d2-${id}.d2`;
  const tmpOut = path.join(os.tmpdir(), `d2-${id}.svg`);
  // Input lives beside the source document (when possible) so D2 can resolve
  // relative image/icon paths; the output SVG can safely stay in the temp dir.
  let tmpIn: string | undefined;

  try {
    tmpIn = await writeInputFile(fileDirectoryPath, inputName, code);
    const inputPath = tmpIn;
    await new Promise<void>((resolve, reject) => {
      const args = [
        `--theme=${opts.d2Theme}`,
        `--layout=${opts.d2Layout}`,
        ...(opts.d2Sketch ? ['--sketch'] : []),
        inputPath,
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
    // Only treat a genuinely missing executable as "not found". Matching
    // broader phrases like "no such file or directory" would misclassify d2's
    // own image-bundling errors (missing icon/image) as a missing binary.
    const isNotFound =
      code === 'ENOENT' ||
      /not recognized as an internal or external command/i.test(msg);
    if (isNotFound) return D2_NOT_FOUND;
    return `<pre class="language-text"><code>D2 error: ${escape(msg)}</code></pre>`;
  } finally {
    if (tmpIn) {
      fs.promises.unlink(tmpIn).catch(() => undefined);
    }
    fs.promises.unlink(tmpOut).catch(() => undefined);
  }
}
