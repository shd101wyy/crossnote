/**
 * A value as the text of a `style` element. A `</style>` in the value would
 * end the element, so `</` is written as `<\/` there: a stylesheet reads `\/`
 * as `/` inside a string, and as text inside a comment.
 */
export function cssForStyle(css: string): string {
  return css.replace(/<\//g, '<\\/');
}
