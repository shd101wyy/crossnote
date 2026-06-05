import JSON5 from 'json5';

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
    // WaveDrom roots are objects ({signal:[...]}, {reg:[...]}, {assign:[...]}).
    // Anything else (bare numbers/strings/null, or a top-level array) is not a
    // valid diagram.
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return null;
    }
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
