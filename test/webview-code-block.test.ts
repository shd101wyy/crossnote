/**
 * @jest-environment jsdom
 */

import { getCodeBlockSource } from '../src/webview/lib/code-block';

describe('getCodeBlockSource', () => {
  it('returns null when no preview block is highlighted', () => {
    expect(getCodeBlockSource(null)).toBeNull();
  });

  it('returns the source code element of a fenced code block', () => {
    document.body.innerHTML = `
      <pre data-role="codeBlock">
        <code><span class="token keyword">const</span> value = 1;</code>
      </pre>
    `;

    const codeBlock = document.querySelector<HTMLElement>(
      'pre[data-role="codeBlock"]',
    );

    expect(getCodeBlockSource(codeBlock)).toBe(
      codeBlock?.querySelector('code'),
    );
  });

  it('returns only the input source of a code chunk', () => {
    document.body.innerHTML = `
      <div class="code-chunk">
        <div class="input-div">
          <pre><code>print("input")</code></pre>
        </div>
        <div class="output-div">
          <pre><code>input</code></pre>
        </div>
      </div>
    `;

    const codeChunk = document.querySelector<HTMLElement>('.code-chunk');

    expect(getCodeBlockSource(codeChunk)?.textContent).toBe('print("input")');
  });

  it('does not treat other highlighted preview blocks as code', () => {
    document.body.innerHTML = '<p>paragraph</p>';

    expect(
      getCodeBlockSource(document.querySelector<HTMLElement>('p')),
    ).toBeNull();
  });
});
