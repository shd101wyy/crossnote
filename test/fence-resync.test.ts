/**
 * Regression test for vscode-mpe#2337: a code fence left open inside a
 * list item (markdown-it auto-closes it when the list ends) used to
 * desync the transformer's own fence tracker, which treated a later
 * "```bash" *opener* as the closer of the stale fence. Every subsequent
 * bare "```" was then misclassified as an opener, received the
 * `{data-source-line=…}` attribute — making it invalid as a closing
 * fence — and everything below collapsed into a single giant code block.
 *
 * A closing fence must be bare (no info string), as in CommonMark.
 */
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

describe('fence tracking resync after a container boundary (vscode-mpe#2337)', () => {
  let notebook: Notebook;
  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {},
    });
  });

  const doc = [
    '- Setup the workspace',
    '  ```bash',
    '  echo hi',
    '  ```',
    '- Build the workspace',
    '  ```bash',
    '  ./docker/build.sh',
    '',
    '#### Run the demo',
    '',
    '```bash',
    'ls',
    '```',
    '',
    'Regular **text** after.',
  ].join('\n');

  it('renders the heading and text after the unterminated list fence', async () => {
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files', 'fence-resync.md'),
    );
    const { html } = await engine.parseMD(doc, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    // The heading must be a heading, not swallowed by a code block.
    expect(html).toMatch(/<h4[^>]*>Run the demo<\/h4>/);
    // The paragraph after the resynchronized fence renders as markdown.
    expect(html).toMatch(/<strong>text<\/strong>/);
  });

  it('keeps exactly the two closed code blocks as code', async () => {
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files', 'fence-resync.md'),
    );
    const { html } = await engine.parseMD(doc, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    // "echo hi", "./docker/build.sh" (auto-closed with the list) and "ls"
    // each render as their own <pre>. Note: this count alone also passes
    // on the buggy output (2 real + 1 collapsed block); the content
    // assertions in the other test are what pins the fix.
    expect(html.match(/<pre\b/g)?.length).toBe(3);
    expect(html).toContain('./docker/build.sh');
  });
});
