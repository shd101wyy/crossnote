/**
 * @jest-environment jsdom
 */
import {
  createMermaidMeasureHost,
  MERMAID_RENDER_TIMEOUT_MS,
  mermaidErrorHtml,
  renderMermaidDiagram,
} from '../src/webview/lib/mermaid';

type RenderArgs = [
  id: string,
  code: string,
  container: Element,
  parent: Element | null,
];

const CODE = 'flowchart TB\n  A --> B';
const SVG = '<svg id="mermaid-1"></svg>';

function makeNode(): HTMLElement {
  const node = document.createElement('div');
  node.className = 'mermaid';
  node.textContent = CODE;
  document.body.appendChild(node);
  return node;
}

/** Make the node count as being rendered (jsdom lays nothing out). */
function rendered(element: HTMLElement): HTMLElement {
  element.getClientRects = () => [{}] as unknown as DOMRectList;
  return element;
}

/** What every element reports for its laid-out width. */
function layout(offsetWidth: number) {
  jest
    .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockReturnValue(offsetWidth);
}

describe('createMermaidMeasureHost', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('is a hidden, fixed element as wide as <body>, inside the diagram node', () => {
    layout(984);
    const node = rendered(makeNode());

    const host = createMermaidMeasureHost(node);

    expect(host.parentElement).toBe(node);
    expect(host.style.position).toBe('fixed');
    expect(host.style.visibility).toBe('hidden');
    expect(host.style.width).toBe('984px');
    // the element the width was read from is gone again
    expect(Array.from(document.body.children)).toEqual([node]);
  });

  it('goes under <body> when the diagram node is not being rendered', () => {
    layout(984);
    const node = makeNode();

    const host = createMermaidMeasureHost(node);

    expect(host.parentElement).toBe(document.body);
  });
});

describe('renderMermaidDiagram', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders in a measuring host inside the diagram node and returns the SVG', async () => {
    // Mermaid measures a diagram's labels where its temporary svg is attached
    // and clips the labels to what it measured. That has to happen where the
    // diagram is displayed, so the preview's styles apply while measuring
    // (vscode-mpe#2454) — but in a throwaway element, because Mermaid empties
    // its container and keeps writing to it after a timeout.
    layout(984);
    const node = rendered(makeNode());
    const calls: RenderArgs[] = [];
    const mermaid = {
      render: async (id: string, code: string, container: HTMLElement) => {
        calls.push([id, code, container, container.parentElement]);
        return { svg: SVG };
      },
    };

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(calls).toHaveLength(1);
    const [id, code, container, parent] = calls[0];
    expect(id).toBe('mermaid-1');
    expect(code).toBe(CODE);
    expect(container).not.toBe(node);
    expect(parent).toBe(node);
    expect(node.innerHTML).toBe(SVG);
    expect(svg).toBe(SVG);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('replaces a failed diagram with its error and returns null', async () => {
    layout(984);
    const node = rendered(makeNode());
    const mermaid = {
      render: async (_id: string, _code: string, container: HTMLElement) => {
        // Mermaid empties its container, appends its temporary one, and leaves
        // it behind when a render fails midway.
        container.innerHTML = '<div id="dmermaid-1"><svg></svg></div>';
        throw new Error('<b>Parse error</b> on line 2');
      },
    };

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(svg).toBeNull();
    expect(node.innerHTML).toBe(
      mermaidErrorHtml(new Error('<b>Parse error</b> on line 2')),
    );
    expect(document.getElementById('dmermaid-1')).toBeNull();
    expect(Array.from(document.body.children)).toEqual([node]);
  });

  it('keeps the error when Mermaid goes on rendering after a timeout', async () => {
    // Mermaid queues renders; one that timed out while still queued empties
    // its container when it is finally run.
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    let container: HTMLElement | undefined;
    const mermaid = {
      render: (_id: string, _code: string, host: HTMLElement) => {
        container = host;
        return new Promise<{ svg: string }>(() => {});
      },
    };

    const svg = renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');
    await jest.advanceTimersByTimeAsync(MERMAID_RENDER_TIMEOUT_MS);
    await expect(svg).resolves.toBeNull();
    const error = mermaidErrorHtml(new Error('Mermaid rendering timed out'));
    expect(node.innerHTML).toBe(error);

    container!.innerHTML = '';
    expect(node.innerHTML).toBe(error);
  });

  it('gives up on a diagram that is not rendered within the timeout', async () => {
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
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
