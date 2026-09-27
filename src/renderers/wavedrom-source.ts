import JSON5 from 'json5';

/**
 * SVG element tags that WaveDrom must never emit from diagram data.
 *
 * WaveDrom labels (and other array-valued data) are passed through
 * `tspan.parse()` verbatim when they are not strings, so an array like
 * `['image', {href: 'x.png', onerror: '...'}]` inside a `name` is rendered as
 * a real SVG element with arbitrary attributes — *after* server-side HTML
 * sanitization has finished. These tags either execute script directly,
 * embed an arbitrary HTML document, or (SMIL) can retarget another
 * element's attributes to a dangerous URL.
 */
const DANGEROUS_SVG_TAGS = new Set([
  'script',
  'handler', // SVG Tiny 1.2 event scripting
  'listener', // SVG Tiny 1.2 event wiring
  'foreignobject', // switches to the HTML namespace inside SVG
  'iframe',
  'embed',
  'object',
  'applet',
  // SMIL animation elements: <animate attributeName="href" to="javascript:...">
  'animate',
  'animatemotion',
  'animatetransform',
  'set',
]);

// Keep in sync with src/markdown-engine/sanitize.ts (duplicated here to
// avoid a circular import).
const DANGEROUS_URL_PATTERN =
  /^\s*(javascript|vbscript)\s*:|^\s*data\s*:\s*text\/html/i;

const URL_ATTRIBUTES = ['href', 'src', 'action', 'formaction', 'xlink:href'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively strip everything from parsed WaveDrom data that could become
 * an event handler, a dangerous URL, or a dangerous SVG element when the
 * client-side WaveDrom renderer turns label arrays into live SVG markup.
 *
 * Runs before serialization in `normalizeWavedromSource`, so every consumer
 * (preview `RenderWaveForm`, presentation/export `ProcessAll`) only ever
 * sees cleaned data. Safe content is preserved: element arrays with benign
 * tags (e.g. `['image', {href: 'icon.png'}]`) and ordinary data arrays are
 * untouched.
 */
function sanitizeWavedromData(value: unknown): unknown {
  if (Array.isArray(value)) {
    const tag = typeof value[0] === 'string' ? value[0].toLowerCase() : null;
    if (tag !== null && DANGEROUS_SVG_TAGS.has(tag)) {
      // A dangerous element either carries its payload in an attribute
      // object (`['animate', {attributeName: 'href', to: 'javascript:…'}]`)
      // or, for `script`/`handler`, as raw text children (`['script',
      // 'alert(1)']`). Anything else starting with these tags inside data
      // arrays (`data: ['set', 'reset']`) keeps plain-string shapes and is
      // not affected. Replace with '' — onml appends strings as text, while
      // null/undefined would crash or leak into the markup.
      if (isPlainObject(value[1]) || tag === 'script' || tag === 'handler') {
        return '';
      }
    }
    return value.map(sanitizeWavedromData);
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (/^on/i.test(key)) {
        delete value[key];
        continue;
      }
      const attrValue = value[key];
      if (
        URL_ATTRIBUTES.includes(key.toLowerCase()) &&
        typeof attrValue === 'string' &&
        DANGEROUS_URL_PATTERN.test(attrValue)
      ) {
        delete value[key];
        continue;
      }
      value[key] = sanitizeWavedromData(attrValue);
    }
  }
  return value;
}

/**
 * Validate and normalize untrusted WaveDrom source.
 *
 * WaveDrom diagrams are embedded in the rendered HTML as
 * `<script type="WaveDrom">...</script>` data containers. Historically the
 * client evaluated this content with `eval("(" + source + ")")` (both in our
 * own preview code and inside the bundled `WaveDrom.ProcessAll()` /
 * `WaveDrom.eva()` helpers used for presentation mode and HTML export). Since
 * the content comes straight from a user's markdown file, that allowed
 * arbitrary JavaScript execution in the webview context
 * (shd101wyy/vscode-markdown-preview-enhanced#2315).
 *
 * To neutralize every downstream consumer at once, we parse the source as
 * JSON5 (WaveDrom's actual data syntax: unquoted keys, comments, trailing
 * commas, single-quoted strings) and re-serialize it to *strict* JSON. After
 * this, any later `eval`/`JSON.parse`/`ProcessAll` only ever sees inert data —
 * a JSON object literal cannot execute code.
 *
 * Valid-but-malicious *data* is additionally scrubbed by
 * `sanitizeWavedromData`: array-valued labels are interpreted by the
 * client-side renderer as SVG element descriptions, so event handler
 * attributes, dangerous URLs, and script-bearing/HTML-embedding elements
 * must be stripped before the data reaches the renderer.
 *
 * The `<` escaping prevents a `</script>` substring inside a string value from
 * breaking out of the surrounding `<script type="WaveDrom">` container (HTML
 * does not interpret `<` inside a JSON string, but the browser would
 * otherwise treat a literal `</script>` as the end of the script element).
 *
 * @returns the safe, strict-JSON string, or `null` if the source is not valid
 * WaveDrom data (in which case callers should drop the diagram).
 */
export function normalizeWavedromSource(raw: string): string | null {
  try {
    const data = JSON5.parse(raw);
    // WaveDrom roots are objects ({signal:[...]}, {reg:[...]}), {assign:[...]}).
    // Anything else (bare numbers/strings/null, or a top-level array) is not a
    // valid diagram.
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return null;
    }
    sanitizeWavedromData(data);
    // Re-serialize to strict JSON. JSON5 accepts `Infinity`/`-Infinity`/`NaN`,
    // but `JSON.stringify` silently coerces them to `null`; throw instead so a
    // diagram relying on those values is dropped rather than rendered with
    // corrupted data.
    const json = JSON.stringify(data, (_key, value) => {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new SyntaxError('WaveDrom data contains a non-finite number');
      }
      return value;
    });
    return json.replace(/</g, '\\u003c');
  } catch {
    return null;
  }
}
