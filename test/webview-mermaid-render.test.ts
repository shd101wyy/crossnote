/**
 * @jest-environment jsdom
 */
import {
  createMermaidMeasureHost,
  MERMAID_RENDER_TIMEOUT_MS,
  mermaidErrorHtml,
  renderMermaidDiagram,
} from '../src/webview/lib/mermaid';

const CODE = 'flowchart TB\n  A --> B';
const SVG = '<svg id="mermaid-1"></svg>';
const TIMEOUT_ERROR = mermaidErrorHtml(
  new Error('Mermaid rendering timed out'),
);

function makeNode(): HTMLElement {
  const node = document.createElement('div');
  node.className = 'mermaid';
  node.textContent = CODE;
  document.body.appendChild(node);
  return node;
}

/** Make the element count as being rendered (jsdom lays nothing out). */
function rendered(element: HTMLElement): HTMLElement {
  element.getClientRects = () => [{}] as unknown as DOMRectList;
  return element;
}

/**
 * Lay the document out: every element is `offsetWidth` wide, and a width
 * written on an element measures as that number, as it does where nothing
 * scales it (jsdom lays nothing out).
 */
function layout(offsetWidth: number) {
  jest
    .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockReturnValue(offsetWidth);
  measureWidthsAsWritten((element) => {
    const own = Number.parseFloat(element.style.width);
    return own || offsetWidth;
  });
}

/** Have `getBoundingClientRect()` report widths as `widthOf` works them out. */
function measureWidthsAsWritten(widthOf: (element: HTMLElement) => number) {
  jest
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      return { width: widthOf(this as HTMLElement) } as DOMRect;
    });
}

/** A Mermaid stub that hands the measuring element to `render`. */
function mermaidRendering(
  render: (container: HTMLElement) => Promise<{ svg: string }>,
) {
  const containers: HTMLElement[] = [];
  // where the measuring element was attached when Mermaid was handed it
  const parents: (Element | null)[] = [];
  return {
    containers,
    parents,
    mermaid: {
      render: (_id: string, _code: string, container: HTMLElement) => {
        containers.push(container);
        parents.push(container.parentElement);
        return render(container);
      },
    },
  };
}

describe('createMermaidMeasureHost', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('is a hidden, fixed element as wide as <body>, inside the diagram node', () => {
    layout(984);
    const node = rendered(makeNode());

    const measure = createMermaidMeasureHost(node);
    const { container } = measure;

    expect(measure.inNode).toBe(true);
    expect(container.parentElement).toBe(node);
    expect(container.style.position).toBe('fixed');
    expect(container.style.visibility).toBe('hidden');
    expect(container.style.width).toBe('984px');
    // the element the width was read from is gone again
    expect(Array.from(document.body.children)).toEqual([node]);

    measure.remove();
    expect(container.isConnected).toBe(false);
  });

  it('goes under <body> when the diagram node is not being rendered', () => {
    layout(984);
    const node = makeNode();

    const measure = createMermaidMeasureHost(node);

    expect(measure.inNode).toBe(false);
    expect(measure.container.parentElement).toBe(document.body);
  });

  it('goes under <body> when an ancestor of the node is scaled', () => {
    // A transform on an ancestor scales what is measured in the node, and
    // jsdom has no top layer to show the host in. Here everything in the node
    // measures half again as wide as it is written.
    layout(984);
    const node = rendered(makeNode());
    measureWidthsAsWritten((element) => {
      const own = Number.parseFloat(element.style.width) || 984;
      return node.contains(element) ? own * 1.5 : own;
    });

    const measure = createMermaidMeasureHost(node);

    expect(measure.inNode).toBe(false);
    expect(measure.container.parentElement).toBe(document.body);
    expect(measure.container.style.width).toBe('984px');
  });
});

describe('renderMermaidDiagram', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('does not render a node that is already out of the document', async () => {
    // The preview refreshed while the diagram waited in Mermaid's queue. Its
    // node could only be measured under <body>, without the preview's styles,
    // and the result would be cached.
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    const { mermaid, containers } = mermaidRendering(async () => ({
      svg: SVG,
    }));
    node.remove();

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(svg).toBeNull();
    expect(containers).toHaveLength(0);
    expect(document.body.children).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('renders in a measuring host inside the diagram node and returns the SVG', async () => {
    // Mermaid measures a diagram's labels where its temporary svg is attached
    // and clips the labels to what it measured. That has to happen where the
    // diagram is displayed, so the preview's styles apply while measuring
    // (vscode-mpe#2454) — but in a throwaway element, because Mermaid empties
    // its container and keeps writing to it after a timeout.
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    const { mermaid, containers } = mermaidRendering(async () => ({
      svg: SVG,
    }));

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(containers).toHaveLength(1);
    const [host] = containers;
    expect(host).not.toBe(node);
    expect(node.innerHTML).toBe(SVG);
    expect(svg).toBe(SVG);
    // the host is gone and no timeout is left pending
    expect(host.isConnected).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('writes the SVG through the sanitizer, and returns what it wrote', async () => {
    // What Mermaid drew is content of the note. At `securityLevel: 'loose'`
    // it writes the address of a `click` as it was given, and an `onclick`
    // of its own; a label may hold HTML. The labels are HTML inside
    // <foreignObject>, and they stay.
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    const { mermaid } = mermaidRendering(async () => ({
      svg:
        '<svg id="mermaid-1" viewBox="0 0 10 10">' +
        '<a xlink:href="javascript:alert(1)" rel="noopener" target="_blank">' +
        '<g class="node" onclick="alert(1)"><rect></rect>' +
        '<foreignObject width="10" height="10">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" style="display: table;">' +
        '<span class="nodeLabel"><p><b>Label</b>' +
        '<img src="x" onerror="alert(1)"><script>alert(1)</script>' +
        '</p></span></div></foreignObject></g></a></svg>',
    }));

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(node.querySelector('foreignObject b')?.textContent).toBe('Label');
    expect(node.querySelector('foreignObject img')).not.toBeNull();
    // What was written is what is kept to be written again.
    expect(svg).toBe(node.innerHTML);
    expect(svg).not.toMatch(/onclick|onerror|<script|javascript:/);
  });

  it('replaces a failed diagram with its error and returns null', async () => {
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    const { mermaid, containers } = mermaidRendering(
      async (container: HTMLElement) => {
        // Mermaid empties its container, appends its temporary one, and
        // leaves it behind when a render fails midway.
        container.innerHTML = '<div id="dmermaid-1"><svg></svg></div>';
        throw new Error('<b>Parse error</b> on line 2');
      },
    );

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(svg).toBeNull();
    expect(node.innerHTML).toBe(
      mermaidErrorHtml(new Error('<b>Parse error</b> on line 2')),
    );
    expect(document.getElementById('dmermaid-1')).toBeNull();
    expect(containers[0].isConnected).toBe(false);
    expect(Array.from(document.body.children)).toEqual([node]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps the error when Mermaid goes on rendering after a timeout', async () => {
    // Mermaid queues renders; one that timed out while still queued empties
    // its container when it is finally run.
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    const { mermaid, containers } = mermaidRendering(
      () => new Promise<{ svg: string }>(() => {}),
    );

    const svg = renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');
    await jest.advanceTimersByTimeAsync(MERMAID_RENDER_TIMEOUT_MS);
    await expect(svg).resolves.toBeNull();
    expect(node.innerHTML).toBe(TIMEOUT_ERROR);

    containers[0].innerHTML = '';
    expect(node.innerHTML).toBe(TIMEOUT_ERROR);
  });

  it('gives up on a diagram that is not rendered within the timeout', async () => {
    jest.useFakeTimers();
    layout(984);
    const node = rendered(makeNode());
    const { mermaid, containers } = mermaidRendering(
      () => new Promise<{ svg: string }>(() => {}),
    );

    const svg = renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');
    await jest.advanceTimersByTimeAsync(MERMAID_RENDER_TIMEOUT_MS - 1);
    expect(node.textContent).toBe(CODE);

    await jest.advanceTimersByTimeAsync(1);
    await expect(svg).resolves.toBeNull();
    expect(node.innerHTML).toBe(TIMEOUT_ERROR);
    expect(containers[0].isConnected).toBe(false);
  });

  it.each([
    [
      'stopped being rendered',
      (node: HTMLElement) => {
        node.getClientRects = () => [] as unknown as DOMRectList;
      },
    ],
    [
      'was detached',
      (node: HTMLElement) => {
        node.remove();
      },
    ],
  ])(
    'does not pass on an SVG that was measured in a node that %s',
    async (_what, doToNode) => {
      // The measuring element shares the node's fate, so Mermaid measured
      // without layout; caching that SVG would show a broken diagram until
      // the webview reloads.
      jest.useFakeTimers();
      layout(984);
      const node = rendered(makeNode());
      const { mermaid } = mermaidRendering(async () => {
        doToNode(node);
        return { svg: SVG };
      });

      const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

      expect(svg).toBeNull();
      expect(node.textContent).toBe(CODE);
    },
  );

  it('passes on an SVG that was measured under <body>, whatever became of the node', async () => {
    jest.useFakeTimers();
    layout(984);
    const node = makeNode(); // not being rendered: measured under <body>
    const { mermaid, containers, parents } = mermaidRendering(async () => ({
      svg: SVG,
    }));

    const svg = await renderMermaidDiagram(mermaid, node, CODE, 'mermaid-1');

    expect(parents[0]).toBe(document.body);
    expect(svg).toBe(SVG);
    expect(node.innerHTML).toBe(SVG);
    expect(containers[0].isConnected).toBe(false);
  });
});

describe('mermaidErrorHtml', () => {
  it('shows the error as text, not as markup', () => {
    expect(mermaidErrorHtml('<img src=x onerror=alert(1)>')).toBe(
      '<pre class="language-text"><code>&lt;img src=x onerror=alert(1)&gt;</code></pre>',
    );
  });
});
