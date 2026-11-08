/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import FloatingActions from '../src/webview/components/FloatingActions';

const mockCopyTextToClipboard = jest.fn();
const mockPreviewState = {
  enablePreviewZenMode: false,
  getHighlightElementLineRange: jest.fn(),
  highlightElement: null as HTMLElement | null,
  highlightElementBeingEdited: null,
  isVSCodeWebExtension: false,
  markdown: '',
  setHighlightElementBeingEdited: jest.fn(),
};

jest.mock('../src/webview/containers/preview', () => ({
  __esModule: true,
  default: {
    useContainer: () => mockPreviewState,
  },
}));

jest.mock('../src/webview/lib/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('../src/webview/lib/utility', () => ({
  copyBlobToClipboard: jest.fn(),
  copyTextToClipboard: (...args: unknown[]) => mockCopyTextToClipboard(...args),
}));

describe('FloatingActions code block copy', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = `
      <div id="root"></div>
      <pre data-role="codeBlock">
        <code><span class="token keyword">const</span> answer = 42;</code>
      </pre>
    `;
    container = document.getElementById('root') as HTMLDivElement;
    root = createRoot(container);
    mockCopyTextToClipboard.mockClear();
    mockPreviewState.enablePreviewZenMode = false;
    mockPreviewState.highlightElement = document.querySelector(
      'pre[data-role="codeBlock"]',
    );
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
  });

  it('copies the source code without Markdown fences', () => {
    act(() => {
      root.render(<FloatingActions />);
    });

    const button = document.querySelector<HTMLButtonElement>(
      'button[title="floatingActions.copyCode"]',
    );
    expect(button).not.toBeNull();

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mockCopyTextToClipboard).toHaveBeenCalledWith('const answer = 42;');
  });

  it('keeps the code copy action available in preview zen mode', () => {
    mockPreviewState.enablePreviewZenMode = true;

    act(() => {
      root.render(<FloatingActions />);
    });

    expect(
      document.querySelector('button[title="floatingActions.copyCode"]'),
    ).not.toBeNull();
    expect(document.querySelector('.floating-action button:last-of-type')).toBe(
      document.querySelector('button[title="floatingActions.copyCode"]'),
    );
  });
});
