declare const Prism: {
  languages: Record<string, unknown> & {
    plain: Record<string, unknown>;
    plaintext: Record<string, unknown>;
    text: Record<string, unknown>;
    txt: Record<string, unknown>;
    extend(id: string, redef: Record<string, unknown>): Record<string, unknown>;
    insertBefore(
      inside: string,
      before: string,
      insert: Record<string, unknown>,
      root?: Record<string, unknown>,
    ): Record<string, unknown>;
    DFS(
      o: Record<string, unknown>,
      callback: (token: unknown, type: string, rest: unknown) => void,
      type?: string,
      visited?: Record<string, unknown>,
    ): void;
  };
  highlight(text: string, grammar: unknown, language: string): string;
  hooks: {
    add(hook: string, callback: (env: Record<string, unknown>) => void): void;
  };
};
export default Prism;
