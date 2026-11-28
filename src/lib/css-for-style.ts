/**
 * A value as the text of a `style` element. A `</style>` in the value would
 * end the element, so `</` is written as `<\/` there: a stylesheet reads `\/`
 * as `/` inside a string, and as text inside a comment. (A custom property
 * keeps the `\/` in its value.) What is not a string is given back as it is:
 * no stylesheet is written for it, as before.
 */
export function cssForStyle(css: string): string {
  return typeof css === 'string' ? css.replace(/<\//g, '<\\/') : css;
}
