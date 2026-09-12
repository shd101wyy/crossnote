export interface FuzzyResult {
  /** Absolute path of the file. */
  absolutePath: string;
  relativePath: string;
  score: number;
}

export interface IndexedFile {
  /** Absolute path of the file. */
  absolutePath: string;
  relativePath: string;
  /** Lowercased path split into dirname and basename parts. */
  dir: string;
  base: string;
}

/**
 * Subsequence match: every query character must appear in order in `target`.
 * Returns a score (higher = better) or null when the query doesn't match.
 * Bonuses for consecutive runs and word-start boundaries (`/`, `.`, `-`, `_`).
 */
function subsequenceScore(query: string, target: string): number | null {
  if (query.length === 0) {
    return 0;
  }
  let score = 0;
  let targetIndex = 0;
  let previousMatchIndex = -2;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === ' ') {
      continue;
    }
    const found = target.indexOf(char, targetIndex);
    if (found === -1) {
      return null;
    }
    score += 1;
    if (found === previousMatchIndex + 1) {
      score += 2; // consecutive run
    }
    const before = found > 0 ? target[found - 1] : '/';
    if ('/._- '.includes(before)) {
      score += 3; // word start
    }
    previousMatchIndex = found;
    targetIndex = found + 1;
  }
  // Shorter targets that still match are more relevant.
  score -= target.length / 100;
  return score;
}

export function indexFiles(
  files: { absolutePath: string; relativePath: string }[],
): IndexedFile[] {
  return files.map((file) => {
    const separator = file.relativePath.lastIndexOf('/');
    return {
      absolutePath: file.absolutePath,
      relativePath: file.relativePath,
      dir: file.relativePath.slice(0, separator + 1).toLowerCase(),
      base: file.relativePath.slice(separator + 1).toLowerCase(),
    };
  });
}

/**
 * Fuzzy-rank files for a picker query. An empty query returns `null` so the
 * caller can show recents/mtime ordering instead.
 */
export function rankFiles(
  query: string,
  indexed: IndexedFile[],
): FuzzyResult[] | null {
  const q = query.trim().toLowerCase();
  if (!q) {
    return null;
  }
  const results: FuzzyResult[] = [];
  for (const file of indexed) {
    const baseScore = subsequenceScore(q, file.base);
    if (baseScore !== null) {
      // Basename hits are what users mean most of the time.
      results.push({
        absolutePath: file.absolutePath,
        relativePath: file.relativePath,
        score: baseScore * 2 + (file.base.includes(q) ? 10 : 0),
      });
      continue;
    }
    const fullPathScore = subsequenceScore(q, file.dir + file.base);
    if (fullPathScore !== null) {
      results.push({
        absolutePath: file.absolutePath,
        relativePath: file.relativePath,
        score: fullPathScore,
      });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}
