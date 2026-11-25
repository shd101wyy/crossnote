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

/**
 * The preview template of `markdown`, rendered as the extension renders it.
 */
async function renderPreview(markdown: string): Promise<string> {
  const tmpDir = mkdirSync({ prefix: 'xnote-presentation' });
  fs.writeFileSync(path.join(tmpDir, 'deck.md'), markdown);

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
  return engine.generateHTMLTemplateForPreview({
    inputString: markdown,
    config: notebook.config as WebviewConfig,
    vscodePreviewPanel: null,
  });
}

/** The config the preview initializes Reveal with. */
function revealConfig(html: string): Record<string, unknown> {
  const match = html.match(/Reveal\.initialize\((\{[^\n]*\})\)/);
  expect(match).not.toBeNull();
  return JSON.parse(match![1]);
}

describe('preview template of a presentation', () => {
  track();

  test('Mermaid is only configured: its diagrams are rendered by the preview, slide by slide', async () => {
    // The preview renders the diagrams of the slide that is current
    // (initPresentationEvent in src/webview/containers/preview.ts). A renderer
    // bound to Reveal's events here as well would render them a second time,
    // and one bound to the end of a transition would render none at all where
    // nothing animates (crossnote#568).
    const html = await renderPreview(PRESENTATION);

    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => match[1])
      .filter((script) => script.includes('mermaid.initialize'));
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).not.toMatch(
      /Reveal|slidetransitionend|mermaid\.(init|run)\(/,
    );
  });

  test('a deck stays paginated in a narrow preview pane', async () => {
    // reveal.js 5+ shows a deck narrower than 435px in its scroll view, which
    // moves the slides another way than the preview's cursor sync expects.
    expect(
      revealConfig(await renderPreview(PRESENTATION)).scrollActivationWidth,
    ).toBeNull();
  });

  test('the front matter still opts into the scroll view', async () => {
    const html = await renderPreview(
      PRESENTATION.replace(
        'presentation:\n  transition: none',
        'presentation:\n  transition: none\n  scrollActivationWidth: 2000',
      ),
    );
    expect(revealConfig(html).scrollActivationWidth).toBe(2000);
  });
});
