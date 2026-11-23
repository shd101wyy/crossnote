/**
 * @jest-environment jsdom
 */
import {
  MERMAID_RENDER_TIMEOUT_MS,
  mermaidErrorHtml,
  renderMermaidDiagram,
} from '../src/webview/lib/mermaid';

type RenderArgs = [id: string, code: string, container: Element | undefined];

const CODE = 'flowchart TB\n  A --> B';

function makeNode(): HTMLElement {
  const node = document.createElement('div');
  node.className = 'mermaid';
  node.textContent = CODE;
  document.body.appendChild(node);
  return node;
}

describe('renderMermaidDiagram', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('renders in the diagram node passed as container and returns the SVG', async () => {
    // Mermaid measures a diagram's labels where the temporary svg is
    // attached, and clips the labels to what it measured. The container must
    // therefore be the node the diagram is displayed in, so the labels are
    // measured under the preview's styles (vscode-mpe#2454).
    const node = makeNode();
    const calls: RenderArgs[] = [];
    const mermaid = {
      render: async (...args: RenderArgs) => {
        calls.push(args);
        return { svg: '<svg id="mermaid-1"></svg>' };
      },
    };

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(calls).toEqual([['mermaid-1', CODE, node]]);
    expect(node.innerHTML).toBe('<svg id="mermaid-1"></svg>');
    expect(svg).toBe('<svg id="mermaid-1"></svg>');
  });

  it('replaces a failed diagram with its error and returns null', async () => {
    const node = makeNode();
    const mermaid = {
      render: async () => {
        // Mermaid empties the container, appends its temporary one, and
        // leaves it behind when a render fails midway.
        node.innerHTML = '<div id="dmermaid-1"><svg></svg></div>';
        throw new Error('<b>Parse error</b> on line 2');
      },
    };

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(svg).toBeNull();
    expect(node.innerHTML).toBe(
      mermaidErrorHtml(new Error('<b>Parse error</b> on line 2')),
    );
    expect(node.querySelector('#dmermaid-1')).toBeNull();
  });

  it('gives up on a diagram that is not rendered within the timeout', async () => {
    jest.useFakeTimers();
    const node = makeNode();
    const mermaid = { render: () => new Promise<{ svg: string }>(() => {}) };

    const svg = renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');
    await jest.advanceTimersByTimeAsync(MERMAID_RENDER_TIMEOUT_MS - 1);
    expect(node.textContent).toBe(CODE);

    await jest.advanceTimersByTimeAsync(1);
    await expect(svg).resolves.toBeNull();
    expect(node.innerHTML).toBe(
      mermaidErrorHtml(new Error('Mermaid rendering timed out')),
    );
  });
});

describe('mermaidErrorHtml', () => {
  it('shows the error as text, not as markup', () => {
    expect(mermaidErrorHtml('<img src=x onerror=alert(1)>')).toBe(
      '<pre class="language-text"><code>&lt;img src=x onerror=alert(1)&gt;</code></pre>',
    );
  });
});
