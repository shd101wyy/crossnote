interface RevealAPI {
  slide(h: number, v?: number): void;
  toggleOverview(): void;
  getCurrentSlide(): HTMLElement;
  addEventListener(event: string, handler: (data?: unknown) => void): void;
  configure(config: Record<string, unknown>): void;
  layout(): void;
}

interface MathJaxAPI {
  typesetClear(): void;
  texReset(): void;
  typesetPromise(elements: Element[]): Promise<void>;
  startup: {
    document: {
      state(n: number): void;
    };
  };
}

interface MermaidAPI {
  parse(text: string): Promise<unknown>;
  render(id: string, code: string): Promise<{ svg: string }>;
  initialize(config: Record<string, unknown>): void;
}

declare global {
  interface Window {
    [key: string]: unknown;
    Reveal: RevealAPI;
    MathJax: MathJaxAPI;
    WaveDrom: {
      RenderWaveForm(i: number, content: unknown, id: string): void;
    };
    mermaid: MermaidAPI;
    vegaEmbed: (el: Element, spec: unknown, opts: unknown) => Promise<unknown>;
    initRevealPresentation?: () => Promise<void>;
    setHighlightElement?: (element: HTMLElement) => void;
  }
}
export {};
