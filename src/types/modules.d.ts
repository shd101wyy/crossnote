declare module 'markdown-it-emoji' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginWithOptions;
  export default plugin;
}

declare module 'markdown-it-html5-embed' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginWithOptions;
  export default plugin;
}

declare module 'markdown-it-abbr' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-deflist' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-mark' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-sub' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'markdown-it-sup' {
  import type MarkdownIt from 'markdown-it';
  const plugin: MarkdownIt.PluginSimple;
  export default plugin;
}

declare module 'chrome-paths' {
  const chromePaths: {
    chrome: string | undefined;
    chromeCanary: string | undefined;
    chromium: string | undefined;
  };
  export default chromePaths;
}

declare module 'object-hash' {
  function hash(value: unknown, options?: object): string;
  export default hash;
}

declare module 'onml' {
  export function stringify(arr: unknown[]): string;
}

declare module 'bit-field/lib/render' {
  function render(reg: unknown, options: unknown): unknown[];
  export default render;
}

declare module 'plantuml-encoder' {
  const plantumlEncoder: { encode(str: string): string };
  export default plantumlEncoder;
}

declare module 'vega-loader' {
  export function loader(options?: { baseURL?: string }): unknown;
}

declare module 'imagemagick-cli' {
  const imagemagickCli: { exec(cmd: string): Promise<void> };
  export default imagemagickCli;
}

declare module '@ungap/structured-clone' {
  function structuredClone<T>(value: T): T;
  export default structuredClone;
}

declare module 'reading-time/lib/reading-time' {
  function readingTime(text: string): {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
  export default readingTime;
}
