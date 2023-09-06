import { useCallback, useEffect, useMemo, useState } from 'react';
import { createContainer } from 'unstated-next';
import {
  WebviewConfig,
  WebviewMessageEvent,
  WebviewMessageType,
} from '../lib/types';

const WebviewContainer = createContainer(() => {
  const [html, setHtml] = useState<string>('');
  const [id, setId] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [config, setConfig] = useState<WebviewConfig>({});
  const [vscodeApi, setVSCodeApi] = useState<{
    postMessage: (args: { command: string; args: unknown[] }) => void;
  } | null>(null);

  /**
   * Whether finished loading preview
   */
  /*
  const [doneLoadingPreview, setDoneLoadingPreview] = useState(false);
  */

  /**
   * Whether to enable sidebar toc
   */
  // const [enableSidebarTOC, setEnableSidebarTOC] = useState(false);

  /**
   * Scroll map that maps buffer line to scrollTops of html elements
   */
  // const [scrollMap, setScrollMap] = useState<number[] | null>(null);

  /**
   * TextEditor total buffer line count
   */
  const [totalLineCount, setTotalLineCount] = useState<number>(0);

  /**
   * TextEditor cursor current line position
   */
  // const [cursorLine, setCursorLine] = useState<number>(0);

  /**
   * TextEditor inital line position
   */
  // const [initialLine, setInitialLine] = useState<number>(0);

  /**
   * Used to delay preview scroll
   */
  // const [previewScrollDelay, setPreviewScrollDelay] = useState<number>(0);

  /**
   * Whether enter presentation mode
   */
  // const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  /**
   * Track the slide line number, and (h, v) indices
   */
  // const [slidesData, setSlidesData] = useState<
  //   { line: number; h: number; v: number; offset: number }[]
  // >([]);

  /**
   * Current slide offset
   */
  // const [currentSlideOffset, setCurrentSlideOffset] = useState<number>(0);

  /**
   * SetTimeout value
   */
  // const [scrollTimeout, setScrollTimeout] = useState<number | null>(null);

  /**
   *  Markdown file URI
   */
  const [sourceUri, setSourceUri] = useState<string | null>(null);

  /**
   *  Source scheme
   */
  const [sourceScheme, setSourceScheme] = useState<string>('file');

  /**
   * Caches
   */
  // const [wavedromCache, setWavedromCache] = useState<{ [key: string]: string }>(
  //   {},
  // );
  const [sidebarTOCHTML, setSidebarTOCHTML] = useState<string>('');

  /**
   * Whether this is rendering in VSCode Web extension.
   */
  const isVSCodeWebExtension = useMemo(() => {
    return document.body.classList.contains('vscode-web-extension');
  }, [document.body.classList]);

  const postMessage = useCallback(
    (command: string, args: never[]) => {
      if (config.vscode) {
        // post message to vscode
        vscodeApi?.postMessage({
          command,
          args,
        });
      } else {
        window.parent.postMessage(
          {
            command,
            args,
          },
          'file://',
        );
      }
    },
    [config, vscodeApi],
  );

  useEffect(() => {
    if (config.vscode && !vscodeApi) {
      setVSCodeApi(acquireVsCodeApi());
    }
  }, [config, vscodeApi]);

  useEffect(() => {
    console.log('useEffect: window.addEventListener');
    const eventListener = (event: MessageEvent) => {
      console.log('event.data', event.data);
      const data = event.data as WebviewMessageEvent;
      if (!data) {
        return;
      }
      const command: WebviewMessageType = data.command;

      switch (command) {
        case 'updateHTML': {
          const {
            class: className,
            html,
            id,
            sidebarTOCHTML,
            sourceScheme,
            sourceUri,
            totalLineCount,
          } = data;
          setHtml(html);
          setId(id);
          setClassName(className);
          setSidebarTOCHTML(sidebarTOCHTML);
          setSourceUri(sourceUri);
          setSourceScheme(sourceScheme);
          setTotalLineCount(totalLineCount);
        }
      }
    };
    window.addEventListener('message', eventListener);
    return () => {
      console.log('useEffect: window.removeEventListener');
      window.removeEventListener('message', eventListener);
    };
  }, []);

  return {
    postMessage,
    setConfig,
    // doneLoadingPreview,
    // enableSidebarTOC,
    isVSCodeWebExtension,
    html,
    setHtml,
    id,
    className,
    sidebarTOCHTML,
    totalLineCount,
    sourceScheme,
    sourceUri,
  };
});

export default WebviewContainer;
