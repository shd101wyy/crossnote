import render from 'bit-field/lib/render';
import { escape } from 'html-escaper';
import onml from 'onml';
import { JsonObject } from 'type-fest';
import { interpretJS } from '../utility';

export async function renderBitfield(code: string, options: JsonObject) {
  try {
    const reg = interpretJS(code);
    const jsonml = render(reg, options);
    const html = onml.stringify(jsonml);
    return html;
  } catch (error) {
    return `<pre class="language-text"><code>${escape(
      error.toString(),
    )}</code></pre>`;
  }
}
