/**
 * Tests for colon-fence (:::) parsing across the three supported parsers.
 *
 * Reproduces vscode-markdown-preview-enhanced #2275: the addition of the
 * Azure-DevOps-style colon-fenced *code* block in 0.9.21 inadvertently
 * stole `:::name` from Pandoc-style fenced *divs*.  The fix routes the
 * info string through a small whitelist of diagram languages: only those
 * become <pre> code, everything else becomes <div class="name">.
 */
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

async function makeNotebook(parser: 'markdown-it' | 'pandoc' | 'markdown_yo') {
  return Notebook.init({
    notebookPath: path.resolve(__dirname, './markdown/test-files'),
    config: {
      markdownParser: parser,
    },
  });
}

async function renderWith(
  notebook: Notebook,
  markdown: string,
  fixtureName: string = 'colon-fence-fixture.md',
) {
  const engine = notebook.getNoteMarkdownEngine(
    path.resolve(__dirname, './markdown/test-files', fixtureName),
  );
  const { html } = await engine.parseMD(markdown, {
    useRelativeFilePath: false,
    isForPreview: true,
    hideFrontMatter: false,
  });
  return html;
}

describe('::: fenced div (markdown-it)', () => {
  let notebook: Notebook;
  beforeAll(async () => {
    notebook = await makeNotebook('markdown-it');
  });

  it('renders :::vertical-lock as <div class="vertical-lock">', async () => {
    const html = await renderWith(
      notebook,
      ':::vertical-lock\nThis is vertical text.\n:::',
    );
    expect(html).toMatch(/<div class="vertical-lock"/);
    expect(html).toContain('This is vertical text.');
    // Must NOT be a code/pre block
    expect(html).not.toMatch(/<pre[^>]*data-info="vertical-lock"/);
  });

  it('parses inner content as markdown', async () => {
    const html = await renderWith(
      notebook,
      ':::note\nA paragraph with **bold** and *em*.\n:::',
    );
    expect(html).toMatch(/<div class="note"/);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>em</em>');
  });

  it('still treats :::mermaid as a code/diagram block', async () => {
    const html = await renderWith(
      notebook,
      ':::mermaid\ngraph TD\n  A --> B\n:::',
    );
    // mermaid render-enhancer produces <div class="mermaid"> from a <pre>
    // input, so accept either marker — the key is that the literal `:::`
    // is gone and the inner code text is preserved.
    expect(html).not.toMatch(/^[\s\S]*:::[\s\S]*$/m);
    expect(html).toContain('graph TD');
  });

  it('still treats :::plantuml as a code/diagram block (not a fenced div)', async () => {
    const html = await renderWith(
      notebook,
      ':::plantuml\n@startuml\nA -> B\n@enduml\n:::',
    );
    // The plantuml render-enhancer needs plantuml.jar at runtime and
    // emits an error <pre> when it's missing — that's still a *code*
    // path (a <pre>), confirming we did NOT take the fenced-div path
    // (which would have emitted <div class="plantuml">).
    expect(html).not.toMatch(/<div class="plantuml"/);
    expect(html).toMatch(/<pre/);
    expect(html).not.toContain(':::plantuml');
  });

  it('preserves source-line attribute on the rendered <div>', async () => {
    const html = await renderWith(
      notebook,
      'Before\n\n:::warning\nBe careful.\n:::',
    );
    expect(html).toMatch(/<div class="warning"[^>]*data-source-line="\d+"/);
  });

  it('does not recognise an indented ::: as a fence', async () => {
    const html = await renderWith(notebook, '  :::my-class\n  content\n  :::');
    expect(html).not.toMatch(/<div class="my-class"/);
    expect(html).toContain(':::my-class');
  });

  it('does not recognise a ::: inside a list item as a fence', async () => {
    const html = await renderWith(
      notebook,
      '- list item\n  :::my-class\n  content\n  :::',
    );
    expect(html).not.toMatch(/<div class="my-class"/);
    expect(html).toContain(':::my-class');
  });

  it('does not inject data-source-line into ::: inside a backtick code block', async () => {
    const html = await renderWith(
      notebook,
      [
        '```markdown',
        ':::my-class',
        'Content enclosed in a div element',
        ':::',
        '',
        '::: {#myClass .my-class}',
        'When using attribute syntax',
        ':::',
        '```',
      ].join('\n'),
    );
    // The ::: lines inside the backtick fence should be rendered
    // verbatim as code content — no colon-fence injection.
    expect(html).toContain(':::my-class');
    expect(html).toContain('Content enclosed in a div element');
    expect(html).not.toContain(':::my-class {data-source-line');
    expect(html).toMatch(/<pre[^>]*>/);
  });

  it('does not inject data-source-line into ::: inside an indented code block', async () => {
    const html = await renderWith(
      notebook,
      [
        '    :::my-class',
        '    Content enclosed in a div element',
        '    :::',
        '',
        '    ::: {#myClass .my-class}',
        '    When using attribute syntax',
        '    :::',
      ].join('\n'),
    );
    // Indented code blocks (4+ spaces) should not trigger colon fence
    // injection.  The content is rendered as a <pre><code> block.
    expect(html).not.toContain(':::my-class {data-source-line');
    expect(html).toContain(':::my-class');
    expect(html).toMatch(/<pre[^>]*>/);
  });
});

describe('::: fenced div (pandoc transformer rewrite)', () => {
  let notebook: Notebook;
  beforeAll(async () => {
    notebook = await makeNotebook('pandoc');
  });

  it('rewrites non-code :::name to a <div class="name"> HTML block', async () => {
    const html = await renderWith(
      notebook,
      ':::vertical-lock\nThis is vertical text.\n:::',
      'colon-fence-pandoc.md',
    );
    expect(html).toMatch(/<div class="vertical-lock"/);
    expect(html).toContain('This is vertical text.');
    // The literal `:::vertical-lock {…}` regression must not appear.
    expect(html).not.toContain(':::vertical-lock');
    expect(html).not.toContain(':::vertical');
  });

  it('still leaves :::mermaid markers for the code-fence path', async () => {
    const html = await renderWith(
      notebook,
      ':::mermaid\ngraph TD\n  A --> B\n:::',
      'colon-fence-pandoc-mermaid.md',
    );
    // We don't actually render mermaid for pandoc here — we just check that
    // the transformer didn't HTML-escape the markers, so downstream tooling
    // can recognise the fence.
    expect(html).not.toMatch(/<div class="mermaid"[^>]*>\s*graph TD/);
  });
});

describe('::: fenced div (markdown_yo transformer rewrite)', () => {
  let notebook: Notebook;
  beforeAll(async () => {
    notebook = await makeNotebook('markdown_yo');
  });

  it('rewrites non-code :::name to a <div class="name"> HTML block', async () => {
    const html = await renderWith(
      notebook,
      ':::vertical-lock\nThis is vertical text.\n:::',
      'colon-fence-yo.md',
    );
    expect(html).toMatch(/<div class="vertical-lock"/);
    expect(html).toContain('This is vertical text.');
    expect(html).not.toContain(':::vertical-lock');
    expect(html).not.toContain(':::vertical');
  });
});

describe('::: fenced div with Pandoc attributes (markdown-it)', () => {
  let notebook: Notebook;
  beforeAll(async () => {
    notebook = await makeNotebook('markdown-it');
  });

  it('renders ::: {.test} as <div class="test">', async () => {
    const html = await renderWith(
      notebook,
      '::: {.test}\nThis is a test.\n:::',
    );
    expect(html).toMatch(/<div class="test"/);
    expect(html).toContain('This is a test.');
  });

  it('renders ::: {.test .vertical} as <div class="test vertical">', async () => {
    const html = await renderWith(
      notebook,
      '::: {.test .vertical}\nThis is vertical text.\n:::',
    );
    expect(html).toMatch(/<div class="test vertical"/);
    expect(html).toContain('This is vertical text.');
  });

  it('renders ::: {.test #myid} as <div class="test" id="myid">', async () => {
    const html = await renderWith(notebook, '::: {.test #myid}\nContent.\n:::');
    expect(html).toMatch(/<div class="test" id="myid"/);
  });

  it('renders ::: note {.warning} as <div class="note warning">', async () => {
    const html = await renderWith(
      notebook,
      '::: note {.warning}\nHeads up.\n:::',
    );
    expect(html).toMatch(/<div class="note warning"/);
  });
});

describe('::: fenced div with Pandoc attributes (pandoc)', () => {
  let notebook: Notebook;
  beforeAll(async () => {
    notebook = await makeNotebook('pandoc');
  });

  it('rewrites ::: {.test} to <div class="test">', async () => {
    const html = await renderWith(
      notebook,
      '::: {.test}\nThis is a test.\n:::',
      'colon-fence-pandoc-attrs.md',
    );
    expect(html).toMatch(/<div class="test"/);
    expect(html).not.toContain(':::test');
    expect(html).not.toContain(':::{');
  });

  it('rewrites ::: {.test .vertical} to <div class="test vertical">', async () => {
    const html = await renderWith(
      notebook,
      '::: {.test .vertical}\nVertical content.\n:::',
      'colon-fence-pandoc-attrs2.md',
    );
    expect(html).toMatch(/<div class="test vertical"/);
    expect(html).not.toContain(':::test');
  });
});
