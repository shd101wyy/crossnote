/**
 * Minimal drop-in replacement for the `temp` package's API surface that
 * crossnote uses (`open`, `mkdirSync`, `track`), implemented with
 * `node:fs` / `node:os` / `node:crypto` so we no longer transitively
 * depend on the deprecated `rimraf@2` → `glob@7` → `inflight` chain.
 *
 * Generated names follow the same shape as `temp` — random hex suffix
 * inside the system temp dir — so on-disk layout is unchanged.
 *
 * Tracked files and directories are removed on process exit only when
 * `track()` has been called, matching `temp`'s opt-in cleanup model.
 */
import { closeSync, mkdtempSync, openSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

export interface AffixOptions {
  prefix?: string;
  suffix?: string;
  dir?: string;
}

export interface OpenFile {
  path: string;
  fd: number;
}

const trackedFiles = new Map<string, number>();
const trackedDirs = new Set<string>();
let tracking = false;
let exitHandlerRegistered = false;

function registerExitHandler() {
  if (exitHandlerRegistered) return;
  exitHandlerRegistered = true;
  process.on('exit', () => {
    if (!tracking) return;
    for (const [filePath, fd] of trackedFiles) {
      try {
        closeSync(fd);
      } catch {
        // fd may already be closed
      }
      try {
        rmSync(filePath, { force: true });
      } catch {
        // best-effort cleanup
      }
    }
    for (const dirPath of trackedDirs) {
      try {
        rmSync(dirPath, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  });
}

export function track(value?: boolean): boolean {
  tracking = value === undefined ? true : value;
  if (tracking) registerExitHandler();
  return tracking;
}

function normalizeAffixes(affixes: AffixOptions | string | undefined): {
  prefix: string;
  suffix: string;
  dir: string;
} {
  if (typeof affixes === 'string') {
    return { prefix: affixes, suffix: '', dir: tmpdir() };
  }
  return {
    prefix: affixes?.prefix ?? '',
    suffix: affixes?.suffix ?? '',
    dir: affixes?.dir ?? tmpdir(),
  };
}

function generatePath(
  affixes: AffixOptions | string | undefined,
  marker: 'f-' | 'd-',
): string {
  const { prefix, suffix, dir } = normalizeAffixes(affixes);
  const random = randomBytes(8).toString('hex');
  return join(dir, `${prefix}-${marker}${random}${suffix}`);
}

/**
 * Create a uniquely named temp file and return its path + open file
 * descriptor. The descriptor is opened with `wx+` so callers can read
 * and write, and the open fails if the (extremely unlikely) name
 * collision occurs. The file is deleted on process exit when
 * `track()` has been enabled.
 *
 * The returned promise mirrors `temp.open`'s callback-style API for
 * drop-in compatibility, but the work itself is synchronous — the
 * caller owns the returned `fd` and is responsible for closing it.
 */
export async function open(
  affixes: AffixOptions | string = {},
): Promise<OpenFile> {
  const filePath = generatePath(affixes, 'f-');
  const fd = openSync(filePath, 'wx+', 0o600);
  if (tracking) trackedFiles.set(filePath, fd);
  return { path: filePath, fd };
}

/**
 * Create a uniquely named temp directory and return its path. The
 * directory (and its contents) are removed on process exit when
 * `track()` has been enabled.
 */
export function mkdirSync(affixes: AffixOptions | string = ''): string {
  const { prefix, dir } = normalizeAffixes(affixes);
  // mkdtempSync appends 6 random chars to the provided prefix.
  const created = mkdtempSync(join(dir, `${prefix}-d-`));
  if (tracking) trackedDirs.add(created);
  return created;
}
