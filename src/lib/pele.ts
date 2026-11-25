/**
 * The part of the `pele` global that crossnote calls. The global is defined by
 * the vendored browser build, `dependencies/pele/pele.global.js`, which the
 * preview and the exported documents load with a `<script>` tag and the
 * Node-side renderer evaluates as a script.
 *
 * Declared here rather than imported from the `pele` package, which is
 * ESM-only and not a dependency (see "Updating the vendored pele bundle" in
 * dependencies/README.md).
 */
export interface PeleRenderer {
  /** Draws Mermaid syntax. Throws when the diagram cannot be parsed or drawn. */
  render(source: string, options?: PeleRenderOptions): PeleRenderResult;
}

export interface PeleRenderOptions {
  /**
   * Prefixes the ids in the SVG. Each diagram on a page has to have one of
   * its own, or diagrams share ids.
   */
  idPrefix?: string;
  /** The font labels are measured in and drawn in. */
  fontFamily?: string;
  fontFamilyMono?: string;
}

export interface PeleRenderResult {
  svg: string;
  /** Natural size of the diagram, in pixels. */
  width: number;
  height: number;
  /** The diagram type pele detected, such as `flowchart`. */
  type: string;
}
