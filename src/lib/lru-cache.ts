/**
 * A small string→string LRU cache for render-output memoization.
 *
 * Preview updates re-render the same code blocks and formulas over and
 * over (every debounced keystroke with live update), so the renderers
 * cache their output keyed by the inputs that fully determine it. The
 * LRU bound keeps memory predictable on large notebooks. `Map` iteration
 * order (insertion order) doubles as the recency list: a hit re-inserts
 * the key, so the first key is always the least recently used entry.
 */
export default class LruCache {
  private readonly entries = new Map<string, string>();

  constructor(private readonly maxEntries: number) {}

  get(key: string): string | undefined {
    const value = this.entries.get(key);
    if (value === undefined) {
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key: string, value: string): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
      }
    }
    this.entries.set(key, value);
  }
}
