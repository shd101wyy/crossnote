/**
 * CSV renderer.
 *
 * Turns a ```csv fenced block into an HTML table. The first row is the
 * header. Every cell is escaped so CSV content can't inject HTML.
 */
import { escape } from 'html-escaper';
import * as Papa from 'papaparse';

export function renderCsv(code: string): string {
  const { data, errors } = Papa.parse<string[]>(code.trim(), {
    skipEmptyLines: true,
  });
  // Single-column CSV has no delimiter to detect, but still parses fine.
  const error = errors.find((e) => e.type !== 'Delimiter');
  if (error) {
    throw new Error(`CSV parse error: ${error.message}`);
  }

  const [header = [], ...rows] = data;
  const tr = (cells: string[], tag: 'th' | 'td') =>
    `<tr>${cells.map((c) => `<${tag}>${escape(c)}</${tag}>`).join('')}</tr>`;
  return `<table><thead>${tr(header, 'th')}</thead><tbody>${rows
    .map((r) => tr(r, 'td'))
    .join('')}</tbody></table>`;
}
