import type { CheerioAPI } from 'cheerio';

/**
 * Render the speaker notes that an `aside.notes` marked `data-markdown` holds.
 *
 * The notes of such an aside are markdown. Left as they are, reveal.js
 * renders them itself, with the `marked` bundled in its notes plugin, and
 * writes the result into the window of its speaker view as it is: `marked`
 * keeps a `javascript:` link, and to the sanitizer of crossnote the markdown
 * was only text (#600). So the notes are rendered here, with the renderer of
 * the notebook, and the marker is taken off. reveal.js then takes the notes
 * as the HTML they now are, which goes through the sanitizer with the slide.
 *
 * reveal.js takes the notes of every `aside.notes` of a slide, and reads them
 * as markdown when the first of them has the attribute. Here every aside
 * that has it is rendered on its own, and one without it is left as it is:
 * its notes are HTML, as they are when it stands alone.
 *
 * This has to run before the sanitizer sees the slide: what the rendering
 * makes — an attribute a heading is given in markdown — it has to see.
 *
 * The innermost aside is rendered first, so that the markdown around it
 * takes the notes rendered within it as HTML.
 */
export function renderMarkdownNotes(
  $: CheerioAPI,
  render: (markdown: string) => string,
): void {
  $('aside.notes[data-markdown]')
    .toArray()
    .reverse()
    .forEach((aside) => {
      $(aside)
        .html(render($(aside).html() ?? ''))
        .removeAttr('data-markdown');
    });
}
