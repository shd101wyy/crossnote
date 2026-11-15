/**
 * The mermaid init scripts must treat `mermaidTheme` (the VS Code setting)
 * as a *fallback*: an explicit `mermaidConfig.theme` from the notebook
 * config script wins. vscode-mpe#2457 reported the opposite — `theme` was
 * the one mermaidConfig key the preview silently overwrote.
 */
import { buildMermaidExportScript } from '../src/markdown-engine/mermaid-export';
import {
  getDefaultNotebookConfig,
  type MermaidConfig,
  type NotebookConfig,
} from '../src/notebook/types';

describe('mermaid theme precedence', () => {
  const configWith = (mermaidConfig: MermaidConfig): NotebookConfig => ({
    ...getDefaultNotebookConfig(),
    mermaidConfig,
    mermaidTheme: 'forest',
  });

  it('keeps an explicit mermaidConfig.theme over mermaidTheme (export script)', () => {
    const script = buildMermaidExportScript(
      configWith({ theme: 'dark' }),
      false,
    );
    expect(script).toContain(
      'MERMAID_CONFIG.theme = MERMAID_CONFIG.theme || "forest"',
    );
    // The user config is what mermaid.initialize receives.
    expect(script).toContain('{"theme":"dark"}');
  });

  it('falls back to mermaidTheme when the config sets no theme (export script)', () => {
    const script = buildMermaidExportScript(
      configWith({ startOnLoad: false }),
      false,
    );
    expect(script).toContain(
      'MERMAID_CONFIG.theme = MERMAID_CONFIG.theme || "forest"',
    );
    expect(script).toContain('{"startOnLoad":false}');
  });
});
