import JSON5 from 'json5';
import { isDangerousUrl, URL_ATTRIBUTES } from '../lib/dangerous-urls';

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

/**
 * A string that could plausibly serve as an XML element name (tested against
 * the lowercased tag). Arrays `[tag, ...]` whose head passes this are treated
 * as SVG element descriptions; anything else (`'a->b'`, `'R&W'`, …) is plain
 * label/data content and is left for WaveDrom's own escaping (`tspan`).
 */
const TAG_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9:._-]*$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Escape XML-significant characters. WaveDrom's markup library (onml)
 * stringifies element arrays into SVG *without* escaping attribute names,
 * attribute values, or text children, so a `"` or `<` arriving through
 * diagram data can otherwise break out and inject new markup/attributes.
 * The escaped string is parsed back as XML by the renderer, so benign
 * content (`a&b`, `say "hi"`) round-trips and renders exactly the same.
 */
function escapeXml(s: string): string {
  return /[&<>"]/.test(s)
    ? s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    : s;
}

/** Escape the attribute name/values of an onml attribute bag. */
function escapeAttrBag(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(attrs)) {
    const escapedKey = /[&<>"]/.test(key) ? escapeXml(key) : key;
    out[escapedKey] = Array.isArray(val)
      ? val.map((v) => (typeof v === 'string' ? escapeXml(v) : v))
      : typeof val === 'string'
        ? escapeXml(val)
        : val;
  }
  return out;
}

/**
 * Recursively strip everything from parsed WaveDrom data that could become
 * an event handler, a dangerous URL, or a dangerous/escapable SVG element
 * when the client-side WaveDrom renderer turns label arrays into live SVG
 * markup.
 *
 * Runs before serialization in `normalizeWavedromSource`, so every consumer
 * (preview `RenderWaveForm`, presentation/export `ProcessAll`) only ever
 * sees cleaned data. Safe content is preserved: element arrays with benign
 * tags (e.g. `['image', {href: 'icon.png'}]`) and ordinary label data are
 * untouched.
 */
function sanitizeWavedromData(value: unknown, parentKey?: string): unknown {
  if (Array.isArray(value)) {
    const rawTag = value[0];
    const tag = typeof rawTag === 'string' ? rawTag.toLowerCase() : null;
    if (tag !== null && DANGEROUS_SVG_TAGS.has(tag)) {
      // A dangerous element either carries its payload in an attribute
      // object (`['animate', {attributeName: 'href', to: 'javascript:…'}]`)
      // or, for `script`/`handler`, as raw text children (`['script',
      // 'alert(1)']`). Anything else starting with these tags inside label
      // data (`data: ['set', 'reset']`) keeps plain-string shapes and is
      // not affected. Replace with '' — onml appends strings as text, while
      // null/undefined would crash or leak into the markup.
      if (isPlainObject(value[1]) || tag === 'script' || tag === 'handler') {
        return '';
      }
    }

    const bag = value[1];
    const isElement =
      tag !== null && (isPlainObject(bag) || TAG_NAME_PATTERN.test(tag));

    // `data: [...]` holds label strings that WaveDrom renders through tspan
    // (which escapes them itself); only nested arrays/objects inside it can
    // become elements. Plain data arrays (edge strings, signal objects, …)
    // take the same path — their heads are not element names.
    if (!isElement || parentKey === 'data') {
      return value.map((v) =>
        Array.isArray(v) || isPlainObject(v) ? sanitizeWavedromData(v) : v,
      );
    }

    // Element description `[tag, attrs?, children...]`: sanitize the
    // attribute bag (event handlers / dangerous URLs) and XML-escape every
    // string that onml would append raw. Children start at index 2 when an
    // attribute bag is present, at index 1 otherwise.
    const out: unknown[] = [rawTag];
    let i = 1;
    if (isPlainObject(bag)) {
      sanitizeWavedromData(bag);
      out.push(escapeAttrBag(bag));
      i = 2;
    }
    for (; i < value.length; i++) {
      const child = value[i];
      out.push(
        typeof child === 'string'
          ? escapeXml(child)
          : sanitizeWavedromData(child),
      );
    }
    return out;
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
        isDangerousUrl(attrValue)
      ) {
        delete value[key];
        continue;
      }
      value[key] = sanitizeWavedromData(attrValue, key);
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
 * attributes, dangerous URLs, script-bearing/HTML-embedding elements, and
 * markup-escaping characters must be stripped or escaped before the data
 * reaches the renderer.
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
