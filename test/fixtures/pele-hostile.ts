/**
 * Pele diagrams written to get markup of their own into a page — HTML in
 * labels and titles, links to script URLs, a JavaScript callback, an image
 * from a data URL — across pele's diagram types. Each parses: the attack is to
 * go through the drawing, not fail in front of it.
 *
 * Used twice. The webview draws them through its sanitizer
 * (`test/webview-pele-render.test.ts`). And the vendored bundle is asked for
 * their SVG as it is (`test/pele-vendor.test.ts`), which is what an exported
 * document is given: there is no sanitizer there, so the output itself has to
 * be clean.
 */
export const PELE_HOSTILE: string[] = [
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
  // Markup written with entities, decoded by the parser before it is drawn.
  `flowchart LR
  A["&lt;img src=x onerror=alert(1)&gt;"] --> B`,
  // A link to somewhere else than the web, in every spelling.
  `flowchart LR
  A --> B
  click A "//evil.example/x" "open"
  click B "/\\evil.example/x" "open"
  click A "file:///etc/passwd" "open"
  click B "JaVaScRiPt:alert(1)" "open"
  click A "jav\tascript:alert(1)" "open"`,
  // A style that would put a part of the diagram in a place of its own on
  // the page. (A quote that breaks out of a style — `font-family:Arial"
  // onmouseover="alert(1)` — is rejected before the drawing: a lexical error.)
  `flowchart LR
  A --> B
  style A fill:red;position:fixed
  linkStyle 0 position:fixed,stroke:#f00`,
  // A quote that breaks out of an attribute, and one that closes a text.
  `flowchart LR
  A@{ label: '" onload="alert(1)' } --> B`,
  `sequenceDiagram
  accDescr: </desc><img src=x onerror=alert(1)>
  A->>B: x`,
  // Configuration of the drawing, which the diagram is not to have a say in.
  `%%{init: {"securityLevel": "loose", "themeCSS": "body{background:url(javascript:alert(1))}", "htmlLabels": true}}%%
  flowchart LR
  A["<img src=x onerror=alert(1)>"] --> B`,
];

/**
 * The one attack of which a drawing keeps a trace: a link of the diagram's
 * own (`internal-link`) carries the label in a `data-href` attribute, and no
 * `href`. Nothing of crossnote reads `data-href`, so it cannot go anywhere.
 * The webview suite leaves this one out: its sanitizer keeps data attributes,
 * and its test is of what could run or leave the page.
 */
export const PELE_HOSTILE_INERT_TRACE: string[] = [
  `flowchart LR
  A["javascript:alert(1)"] --> B
  class A internal-link`,
];
