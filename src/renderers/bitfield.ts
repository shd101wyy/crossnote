import { escape } from 'html-escaper';
import { JsonObject } from 'type-fest';
import { interpretJS } from '../utility';

export async function renderBitfield(code: string, options: JsonObject) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const render = require('bit-field/lib/render');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const onml = require('onml');

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
