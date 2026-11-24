import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import { WebviewConfig } from '../src/notebook/types';

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

const PRESENTATION = `---
presentation:
  transition: none
---

# One

\`\`\`mermaid
flowchart LR
    Idea --> Decide
\`\`\`

---

<!-- slide -->

# Two

\`\`\`mermaid
flowchart LR
    Decide --> Release
\`\`\`
`;

describe('preview template of a presentation', () => {
  track();

  test('Mermaid is only configured: its diagrams are rendered by the preview, slide by slide', async () => {
    // The preview renders the diagrams of the slide that is current
    // (initPresentationEvent in src/webview/containers/preview.ts). A renderer
    // bound to Reveal's events here as well would render them a second time,
    // and one bound to the end of a transition would render none at all where
    // nothing animates (crossnote#568).
    const tmpDir = mkdirSync({ prefix: 'xnote-presentation' });
    fs.writeFileSync(path.join(tmpDir, 'deck.md'), PRESENTATION);

    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'deck.md'),
    });
    const html = await engine.generateHTMLTemplateForPreview({
      inputString: PRESENTATION,
      config: notebook.config as WebviewConfig,
      vscodePreviewPanel: null,
    });

    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => match[1])
      .filter((script) => script.includes('mermaid.initialize'));
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).not.toMatch(
      /Reveal|slidetransitionend|mermaid\.(init|run)\(/,
    );
  });
});
