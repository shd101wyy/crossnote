/**
 * The preview page loads the pele bundle next to mermaid's
 * (`generateScriptsForPreview` in src/markdown-engine/index.ts): the VS Code
 * preview, `crossnote serve` and the wiki all go through that template.
 */
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

const NOTE = `# Flows

\`\`\`pele
flowchart LR
  Idea --> Release
\`\`\`
`;

const PRESENTATION = `---
presentation:
  transition: none
---

# One

\`\`\`pele
flowchart LR
  Idea --> Decide
\`\`\`

---

<!-- slide -->

# Two

\`\`\`pele
flowchart LR
  Decide --> Release
\`\`\`
`;

describe('preview template', () => {
  track();

  test.each([
    ['a note', NOTE],
    ['a presentation', PRESENTATION],
  ])(
    '%s loads the pele bundle before the preview itself',
    async (_what, markdown) => {
      const tmpDir = mkdirSync({ prefix: 'xnote-pele-preview' });
      fs.writeFileSync(path.join(tmpDir, 'note.md'), markdown);

      const notebook = await Notebook.init({
        notebookPath: tmpDir,
        config: {
          markdownParser: 'markdown-it',
          markdownYoBinaryPath: '',
        },
      });
      const engine = new MarkdownEngine({
        notebook,
        filePath: path.join(tmpDir, 'note.md'),
      });
      const html = await engine.generateHTMLTemplateForPreview({
        inputString: markdown,
        config: notebook.config as WebviewConfig,
        vscodePreviewPanel: null,
      });

      // The page carries every diagram of the document for the preview to
      // draw. The rendered page rides in the <body>'s data-html attribute,
      // escaped once more.
      const fences = markdown.match(/^```pele$/gm) ?? [];
      expect(fences.length).toBeGreaterThan(0);
      expect(
        html.match(
          /class=&quot;pele&quot;&gt;flowchart LR\n {2}\w+ --&amp;gt; \w+\n&lt;\/div&gt;/g,
        ),
      ).toHaveLength(fences.length);
      // The bundle is a classic script, so `window.pele` is there when the
      // preview bundle runs: the page has the diagrams of a presentation, and
      // every refresh of a note, drawn from it.
      const bundle = html.match(
        /<script type="text\/javascript" src="[^"]*dependencies\/pele\/pele\.global\.js" charset="UTF-8"><\/script>/,
      );
      expect(bundle).not.toBeNull();
      expect(bundle?.index).toBeGreaterThanOrEqual(0);
      const preview = html.lastIndexOf('<script src="');
      expect(preview).toBeGreaterThan(bundle?.index ?? -1);
      expect(html.slice(preview)).toMatch(/webview\/preview\.js/);
    },
  );
});
