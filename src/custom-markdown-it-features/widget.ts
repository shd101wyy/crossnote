import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import { Notebook } from '../notebook';

/**
 *
 * NOTE: The following syntax is under design.
 *
 * The crossnote widget has the following syntax by extending the markdown-it image syntax
 *
 * ![@widget-name](script-path){attribute1=value1 attribute2=value2}
 *
 */
export default (md: MarkdownIt, notebook: Notebook) => {
  const defaultImageRenderer: Renderer.RenderRule =
    md.renderer.rules.image!.bind(md.renderer);

  md.renderer.rules.image = (tokens, idx, options, env, renderer) => {
    const token = tokens[idx];
    /*
    const attributes = (token.attrs ?? []).reduce((acc, attr) => {
      acc[attr[0]] = attr[1];
      return acc;
    }, {});
    */
    // const src = token.attrGet('src');
    /*
    if (src && alt && alt.startsWith("@")) {
      const widgetName = alt.slice(1);
      const widget = notebok.widgets.find((widget) => widget.name === widgetName);
      if (widget) {
        return `<div class="crossnote-widget" data-widget-name="${widgetName}" data-widget-src="${src}" data-widget-attributes="${JSON.stringify(
          attributes
        )}"></div>`;
      }
    }
    */
    if (token.children && token.children[0]?.content === '@embedding') {
      const error = token.attrGet('error') ?? '';
      if (error) {
        return decodeURIComponent(atob(error));
      } else {
        const embedding = token.attrGet('embedding') ?? '';
        const decoded = decodeURIComponent(atob(embedding));

        // NOTE: We disable the source map here.
        const newMd = notebook.initMarkdownIt({
          ...md.options,
          sourceMap: false,
        });
        const rendered = newMd.render(decoded);
        return rendered;
      }
    }

    return defaultImageRenderer(tokens, idx, options, env, renderer);
  };
};
