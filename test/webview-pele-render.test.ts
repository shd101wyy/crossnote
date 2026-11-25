/**
 * @jest-environment jsdom
 */
import type { PeleRenderer } from '../src/lib/pele';
import { loadPele } from '../src/renderers/pele';
import { renderPeleDiagrams } from '../src/webview/lib/pele';

// The renderer finds the bundle through src/utility, which does not load in
// the jsdom environment: jest resolves that module's `yaml` import to the ESM
// browser build. In the sources the bundle is at the root of the repository.
jest.mock('../src/utility', () => ({
  getCrossnoteBuildDirectory: () => `${__dirname}/..`,
}));

/**
 * Pele diagrams in the preview (`src/webview/lib/pele.ts`). The renderer is a
 * stub in the first suite, so that each test says what is handed to pele and
 * what is written into the page; the second runs the real vendored bundle and
 * the real sanitizer.
 */

const FLOWCHART = 'flowchart LR\n  A[Mermaid text] --> B[SVG]';
const SVG = '<svg class="pele pele-flowchart"><text>Mermaid text</text></svg>';

/** A renderer stub that records its calls and answers as told. */
function stubPele(
  answer: (call: { source: string; options: unknown }) => { svg: string },
) {
  const calls: Array<{ source: string; options: unknown }> = [];
  const pele: PeleRenderer = {
    render: (source, options) => {
      const call = { source, options };
      calls.push(call);
      return { ...answer(call), width: 1, height: 1, type: 'flowchart' };
    },
  };
  return { pele, calls };
}

function makeNode(code: string = FLOWCHART, root: ParentNode = document.body) {
  const node = document.createElement('div');
  node.className = 'pele';
  node.textContent = code;
  root.appendChild(node);
  return node;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  jest.restoreAllMocks();
});

describe('renderPeleDiagrams', () => {
  it('draws every pele diagram under the root that was not drawn before', () => {
    const outside = makeNode('flowchart LR\n  X --> Y');
    const container = document.createElement('div');
    document.body.appendChild(container);
    const first = makeNode(FLOWCHART, container);
    const second = makeNode('pie title Pets\n  "Dogs" : 386', container);
    const drawn = makeNode(FLOWCHART, container);
    drawn.setAttribute('data-processed', 'true');
    drawn.innerHTML = SVG;
    const { pele, calls } = stubPele(() => ({ svg: SVG }));

    renderPeleDiagrams(container, pele);

    expect(calls.map((call) => call.source)).toEqual([
      FLOWCHART,
      'pie title Pets\n  "Dogs" : 386',
    ]);
    expect(first.querySelector('svg')).not.toBeNull();
    expect(second.querySelector('svg')).not.toBeNull();
    // A diagram drawn before, and one outside the root, are left alone.
    expect(drawn.innerHTML).toBe(SVG);
    expect(outside.textContent).toBe('flowchart LR\n  X --> Y');
  });

  it('marks the diagrams drawn, and does not draw them again', () => {
    const node = makeNode();
    const { pele, calls } = stubPele(() => ({ svg: SVG }));

    renderPeleDiagrams(document.body, pele);
    renderPeleDiagrams(document.body, pele);

    expect(node.hasAttribute('data-processed')).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it('gives each diagram its own id prefix', () => {
    makeNode();
    makeNode();
    const { pele, calls } = stubPele(() => ({ svg: SVG }));

    renderPeleDiagrams(document.body, pele);

    const prefixes = calls.map(
      (call) => (call.options as { idPrefix: string }).idPrefix,
    );
    expect(prefixes[0]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(prefixes[1]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(prefixes[0]).not.toBe(prefixes[1]);
  });

  it('measures the labels in the font of the page', () => {
    const node = makeNode();
    node.style.fontFamily = 'Arial, sans-serif';
    const { pele, calls } = stubPele(() => ({ svg: SVG }));

    renderPeleDiagrams(document.body, pele);

    expect(calls[0].options).toMatchObject({ fontFamily: 'Arial, sans-serif' });
  });

  it('measures them in --pele-font when the page sets it', () => {
    const node = makeNode();
    node.style.fontFamily = 'Arial, sans-serif';
    node.style.setProperty('--pele-font', 'Fira Sans, sans-serif');
    node.style.setProperty('--pele-font-mono', 'Fira Mono, monospace');
    const { pele, calls } = stubPele(() => ({ svg: SVG }));

    renderPeleDiagrams(document.body, pele);

    expect(calls[0].options).toMatchObject({
      fontFamily: 'Fira Sans, sans-serif',
      fontFamilyMono: 'Fira Mono, monospace',
    });
  });

  it('sanitizes what pele draws', () => {
    const node = makeNode();
    // Pele draws none of this, but its output is markup built from untrusted
    // source: a renderer bug must not reach the page.
    const { pele } = stubPele(() => ({
      svg: `<svg class="pele" onload="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)"><text>Mermaid text</text></a><rect fill="red"/></svg>`,
    }));

    renderPeleDiagrams(document.body, pele);

    expect(node.innerHTML).not.toMatch(/onload|<script|javascript:/i);
    expect(node.querySelector('svg.pele')).not.toBeNull();
    expect(node.querySelector('rect')).not.toBeNull();
    expect(node.textContent).toBe('Mermaid text');
  });

  it('replaces a diagram that cannot be drawn with its error, as text', () => {
    const node = makeNode();
    const { pele } = stubPele(() => {
      throw new Error('<b>Parse error</b> on line 2');
    });

    renderPeleDiagrams(document.body, pele);

    expect(node.innerHTML).toBe(
      '<pre class="language-text"><code>Error: &lt;b&gt;Parse error&lt;/b&gt; on line 2</code></pre>',
    );
    expect(node.hasAttribute('data-processed')).toBe(true);
  });

  it('says so when pele is not loaded', () => {
    const node = makeNode();

    renderPeleDiagrams(document.body, undefined);

    expect(node.innerHTML).toBe(
      '<pre class="language-text"><code>Error: pele is not loaded.</code></pre>',
    );
  });

  it('leaves an empty block empty', () => {
    const node = makeNode('  \n');
    const { pele, calls } = stubPele(() => ({ svg: SVG }));

    renderPeleDiagrams(document.body, pele);

    expect(node.innerHTML).toBe('');
    expect(node.hasAttribute('data-processed')).toBe(true);
    expect(calls).toHaveLength(0);
  });
});

describe('the vendored pele bundle in the preview', () => {
  /** The real renderer, loaded the way the Node-side renderer loads it. */
  function vendoredPele(): PeleRenderer {
    const pele = loadPele();
    if (!pele) {
      throw new Error('the vendored pele bundle did not load');
    }
    return pele;
  }

  /** Everything under `root` that could run script or leave the page. */
  function attackSurface(root: Element): string[] {
    const found: string[] = [];
    root.querySelectorAll('*').forEach((element) => {
      const tag = element.localName.toLowerCase();
      if (
        ['script', 'iframe', 'object', 'embed', 'foreignobject'].includes(tag)
      ) {
        found.push(`<${tag}>`);
      }
      Array.from(element.attributes).forEach((attribute) => {
        if (/^on/i.test(attribute.name)) {
          found.push(`${attribute.name}@${tag}`);
        }
        if (/javascript:|vbscript:|data:text\/html/i.test(attribute.value)) {
          found.push(`${attribute.name}=${attribute.value}@${tag}`);
        }
      });
    });
    return found;
  }

  /** What a diagram comes to as markup: its elements and their attributes. */
  function shapeOf(root: Element): string[] {
    return Array.from(root.querySelectorAll('*')).flatMap((element) => [
      element.localName,
      ...Array.from(element.attributes)
        .map((attribute) => `${attribute.name}=${attribute.value}`)
        .sort(),
    ]);
  }

  it('draws a diagram, and the sanitizer leaves the drawing as it was', () => {
    const node = makeNode(FLOWCHART);
    const pele = vendoredPele();
    // What pele hands back for the block, drawn with the id prefix that the
    // page's copy is reduced to for the comparison.
    const raw = document.createElement('div');
    raw.innerHTML = pele.render(FLOWCHART, { idPrefix: 'pele-' }).svg;

    renderPeleDiagrams(document.body, pele);

    const svg = node.querySelector('svg.pele');
    expect(svg).not.toBeNull();
    expect([...(svg?.classList ?? [])]).toEqual(['pele', 'pele-flowchart']);
    expect(
      [...node.querySelectorAll('text.pele-label')].map(
        (label) => label.textContent,
      ),
    ).toEqual(['Mermaid text', 'SVG']);

    const comparable = (shape: string[]) =>
      JSON.stringify(shape)
        .replace(/pele-\d+-/g, 'pele-')
        .replace(/ xmlns="[^"]*"/g, '');
    expect(comparable(shapeOf(node))).toBe(comparable(shapeOf(raw)));
  });

  describe('a hostile diagram', () => {
    /**
     * Written to get markup of its own into the page — HTML in labels and
     * titles, links to script URLs, a JavaScript callback, an image from a
     * data URL — across pele's diagram types. Each parses: the attack is to
     * go through the drawing, not fail in front of it.
     */
    const HOSTILE = [
      `flowchart LR
  A["<img src=x onerror=alert(1)>"] --> B["<script>alert(1)</script>"]
  click A "javascript:alert(1)" "open"
  click B "javascript:alert(2)"
  C["<a href='javascript:alert(3)'>x</a>"] --> D["<svg onload=alert(4)>"]
  click C "data:text/html,<script>alert(6)</script>" "open"
  click D "vbscript:msgbox(1)"
  E["x"] --> F["y"]
  click F "https://example.com/?a=<script>alert(7)</script>" "open"
  click E call alert(8)
  classDef x fill:#f00,color:#fff,stroke:#000
  class A x
  style B fill:#00f,stroke:#000
  linkStyle 0 stroke:#f00`,
      `flowchart LR
  I@{ img: "javascript:alert(1)", label: "pic" } --> J@{ img: "data:image/svg+xml,<svg onload=alert(1)>", label: "data" }`,
      `sequenceDiagram
  participant A as <img src=x onerror=alert(1)>
  A->>B: <script>alert(1)</script>
  link A: "javascript:alert(1)" "open"`,
      `pie title <script>alert(1)</script>
  "a" : 1
  "b" : 2`,
      `mindmap
  root["<img src=x onerror=alert(1)>"]
    a
      b`,
      `classDiagram
  class A {
    +<img src=x onerror=alert(1)>
  }
  link A "javascript:alert(1)" "open"
  A --> B`,
      `stateDiagram-v2
  state "<img src=x onerror=alert(1)>" as s2
  s1 --> s2
  click s1 "javascript:alert(1)" "open"`,
      `gantt
  title <script>alert(1)</script>
  dateFormat YYYY-MM-DD
  section S
  <img src=x onerror=alert(1)> :a1, 2026-01-01, 30d`,
      `journey
  title <script>alert(1)</script>
  section S
    <img src=x onerror=alert(1)>: 5: me`,
      `kanban
  todo["<img src=x onerror=alert(1)>"]
  A["<script>alert(1)</script>"]`,
      `timeline
  title <script>alert(1)</script>
    2001 : <img src=x onerror=alert(1)>`,
      `C4Context
  title <script>alert(1)</script>
  Person(a, "<img src=x onerror=alert(1)>")
  System(b, "B")
  Rel(a, b, "uses")`,
      `sankey-beta
  "<img src=x onerror=alert(1)>","<script>alert(1)</script>",10`,
      `radar-beta
  title <script>alert(1)</script>
  axis a["<img src=x onerror=alert(1)>"]
  curve c1["<script>alert(1)</script>"] {1, 2}`,
    ];

    it.each(HOSTILE.map((source, index) => [index, source] as const))(
      'leaves nothing of hostile diagram %i in the page',
      (_index, source) => {
        const node = makeNode(source);

        renderPeleDiagrams(document.body, vendoredPele());

        expect(node.querySelector('svg.pele')).not.toBeNull();
        expect(attackSurface(node)).toEqual([]);
        expect(attackSurface(document.body)).toEqual([]);
        expect(attackSurface(document.head)).toEqual([]);
      },
    );

    it('keeps the web links of a diagram, each without a target', () => {
      const node = makeNode(
        'flowchart LR\n  A[Site] --> B\n  click A "https://pele.run/x?a=1&b=2" "open"\n  click B "mailto:a@b.c" "open"',
      );

      renderPeleDiagrams(document.body, vendoredPele());

      const links = [...node.querySelectorAll('a')];
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        'https://pele.run/x?a=1&b=2',
        'mailto:a@b.c',
      ]);
      // `target` is the one thing the sanitizer takes off a diagram; a click
      // on a link is handled by the preview, which opens it its own way.
      expect(links.every((link) => !link.hasAttribute('target'))).toBe(true);
      expect(links.every((link) => link.hasAttribute('rel'))).toBe(true);
    });

    it('keeps an image that comes from the web, and draws none from a script or data URL', () => {
      const node = makeNode(
        [
          'flowchart LR',
          '  I@{ img: "javascript:alert(1)", label: "pic" } --> J@{ img: "data:image/svg+xml,<svg onload=alert(1)>", label: "data" }',
          '  J --> K@{ img: "https://example.com/a.png", label: "web" }',
        ].join('\n'),
      );

      renderPeleDiagrams(document.body, vendoredPele());

      expect(
        [...node.querySelectorAll('image')].map((image) =>
          image.getAttribute('href'),
        ),
      ).toEqual(['https://example.com/a.png']);
    });

    it('shows the parse error of a diagram as text', () => {
      const node = makeNode(
        'flowchart LR\n  A["<img src=x onerror=alert(1)>"] --> --> B',
      );

      renderPeleDiagrams(document.body, vendoredPele());

      expect(node.innerHTML).toMatch(
        /^<pre class="language-text"><code>PeleError: Parse error on line 2:\n {2}A\["&lt;img src=x onerror/,
      );
      expect(node.querySelector('svg')).toBeNull();
      expect(node.querySelector('img')).toBeNull();
      expect(attackSurface(node)).toEqual([]);
    });
  });
});
