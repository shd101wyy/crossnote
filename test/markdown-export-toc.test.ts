import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';

/**
 * Export `markdown` as GitHub Flavored Markdown and return the file written.
 */
const exported = async (markdown: string): Promise<string> => {
  const tmp = mkdirSync({ prefix: 'xnote-md-export-toc-' });
  const filePath = path.join(tmp, 'note.md');
  fs.writeFileSync(filePath, markdown);
  const notebook = await Notebook.init({
    notebookPath: tmp,
    config: { markdownYoBinaryPath: '' },
  });
  const engine = new MarkdownEngine({ notebook, filePath });
  const dest = await engine.markdownExport({});
  return fs.readFileSync(dest, { encoding: 'utf-8' });
};

describe('the [toc] a markdown export replaces', () => {
  track();

  test('a [toc] is replaced by a markdown table of contents', async () => {
    const given = await exported(`# First

[toc]

# Second
`);

    expect(given).not.toContain('[CROSSNOTETOC]');
    expect(given).toContain('- [First](#first )');
    expect(given).toContain('- [Second](#second )');
  });

  test('a [toc] inside a block quote is replaced there too', async () => {
    const given = await exported(`> # First
> [toc]
> # Second
`);

    expect(given).not.toContain('[CROSSNOTETOC]');
    expect(given).toContain('- [First](#first )');
    expect(given).toContain('- [Second](#second )');
  });

  test('a [toc] in a list item stays as typed', async () => {
    const given = await exported(`# First

- [toc]

# Second
`);

    expect(given).toContain('- [toc]');
    expect(given).not.toContain('[CROSSNOTETOC]');
    expect(given).not.toContain('- [First](#first )');
  });
});
