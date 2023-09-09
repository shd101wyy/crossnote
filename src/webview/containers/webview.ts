import CryptoJS from 'crypto-js';
import $ from 'jquery';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useContextMenu } from 'react-contexify';
import { createContainer } from 'unstated-next';
import { WebviewConfig } from '../lib/types';

window['jQuery'] = $;
window['$'] = $;

interface SlideData {
  line: number;
  h: number;
  v: number;
  offset: number;
}

const WebviewContainer = createContainer(() => {
  /**
   * Source URI of the current note
   */
  const [sourceUri, setSourceUri] = useState<string | undefined>(undefined);
  /**
   * Source scheme
   */
  const [sourceScheme, setSourceScheme] = useState<string>('file');
  /**
   * Whether finished loading preview
   */
  const [doneLoadingPreview, setDoneLoadingPreview] = useState<boolean>(false);
  /**
   * TextEditor cursor current line position
   */
  const [cursorLine, setCursorLine] = useState<number>(-1);
  /**
   * TextEditor initial line position
   */
  const [initialLine, setInitialLine] = useState<number>(0);
  /**
   * TextEditor total buffer line count
   */
  const [totalLineCount, setTotalLineCount] = useState<number>(0);
  /**
   * Used to delay preview scroll
   */
  const [previewScrollDelay, setPreviewScrollDelay] = useState<number>(0);

  const [previewElement, setPreviewElement] = useState<
    HTMLDivElement | undefined
  >(undefined);
  const [hiddenPreviewElement, setHiddenPreviewElement] = useState<
    HTMLDivElement | undefined
  >(undefined);
  const [sidebarTocElement, setSidebarTocElement] = useState<
    HTMLDivElement | undefined
  >(undefined);
  const [showImageHelper, setShowImageHelper] = useState<boolean>(false);
  const [showSidebarToc, setShowSidebarToc] = useState<boolean>(false);
  const [sidebarTocHtml, setSidebarTocHtml] = useState<string>('');
  const [scrollMap, setScrollMap] = useState<number[] | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [wavedromCache, setWavedromCache] = useState<Record<string, string>>(
    {},
  );
  const [isRefreshingPreview, setIsRefreshingPreview] = useState<boolean>(
    false,
  );
  const [, setScrollTimeout] = useState<number | null>(null);
  /**
   * Track the slide line number, and (h, v) indices
   */
  const [slidesData, setSlidesData] = useState<SlideData[]>([]);
  /**
   * Current slide offset
   */
  const [currentSlideOffset, setCurrentSlideOffset] = useState<number>(-1);

  const isPresentationMode = useMemo(() => {
    return document.body.hasAttribute('data-presentation-mode');
  }, []);
  const isVSCodeWebExtension = useMemo(() => {
    return document.body.classList.contains('vscode-web-extension');
  }, []);
  const vscodeApi = useMemo(() => {
    if (globalThis.acquireVsCodeApi) {
      return globalThis.acquireVsCodeApi();
    }
    return null;
  }, []);
  const config = useMemo(() => {
    return JSON.parse(
      document.getElementById('crossnote-data')?.getAttribute('data-config') ??
        '{}',
    ) as WebviewConfig;
  }, []);
  const isVSCode = useMemo(() => {
    return !!config.vscode;
  }, [config]);
  const contextMenuId = useMemo(() => {
    return 'crossnote-context-menu';
  }, []);
  const { show: showContextMenu } = useContextMenu({
    id: contextMenuId,
  });

  const postMessage = useCallback(
    (command: string, args: unknown[] = []) => {
      if (vscodeApi) {
        vscodeApi.postMessage({
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
    [vscodeApi],
  );

  const clickSidebarTocButton = useCallback(() => {
    if (isPresentationMode) {
      return window['Reveal'].toggleOverview();
    } else {
      setShowSidebarToc(x => !x);
      setScrollMap(null);
    }
  }, [isPresentationMode]);

  const escPressed = useCallback(
    (event?: Event) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (isVSCode) {
        if (!isPresentationMode) {
          clickSidebarTocButton();
        }
      } else {
        if (showImageHelper) {
          setShowImageHelper(false);
        } else {
          clickSidebarTocButton();
        }
      }
    },
    [isVSCode, isPresentationMode, clickSidebarTocButton, showImageHelper],
  );

  const buildScrollMap = useCallback(() => {
    if (scrollMap) {
      return scrollMap;
    }
    if (!totalLineCount || !previewElement) {
      return null;
    }
    const newScrollMap: number[] = [];
    const nonEmptyList: number[] = [];

    for (let i = 0; i < totalLineCount; i++) {
      newScrollMap.push(-1);
    }

    nonEmptyList.push(0);
    newScrollMap[0] = 0;

    // write down the offsetTop of element that has 'data-line' property to scrollMap
    const lineElements = previewElement.getElementsByClassName('sync-line');

    for (let i = 0; i < lineElements.length; i++) {
      let el = lineElements[i] as HTMLElement;
      const dataLine = el.getAttribute('data-line');
      if (!dataLine) {
        continue;
      }

      const t = parseInt(dataLine, 10);
      if (!t) {
        continue;
      }

      // this is for ignoring footnote scroll match
      if (t < nonEmptyList[nonEmptyList.length - 1]) {
        el.removeAttribute('data-line');
      } else {
        nonEmptyList.push(t);

        let offsetTop = 0;
        while (el && el !== previewElement) {
          offsetTop += el.offsetTop;
          el = el.offsetParent as HTMLElement;
        }

        newScrollMap[t] = Math.round(offsetTop);
      }
    }

    nonEmptyList.push(totalLineCount);
    newScrollMap.push(previewElement.scrollHeight);

    let pos = 0;
    for (let i = 0; i < totalLineCount; i++) {
      if (newScrollMap[i] !== -1) {
        pos++;
        continue;
      }

      const a = nonEmptyList[pos - 1];
      const b = nonEmptyList[pos];
      newScrollMap[i] = Math.round(
        (newScrollMap[b] * (i - a) + newScrollMap[a] * (b - i)) / (b - a),
      );
    }

    setScrollMap(newScrollMap);
    return newScrollMap; // scrollMap's length == screenLineCount (vscode can't get screenLineCount... sad)
  }, [previewElement, totalLineCount, scrollMap]);

  const previewSyncSource = useCallback(() => {
    let scrollToLine: number;

    if (!previewElement) {
      return;
    }

    if (previewElement.scrollTop === 0) {
      // editorScrollDelay = Date.now() + 100
      scrollToLine = 0;

      return postMessage('revealLine', [sourceUri, scrollToLine]);
    }

    const top = previewElement.scrollTop + previewElement.offsetHeight / 2;

    // try to find corresponding screen buffer row
    const scrollMap = buildScrollMap();
    if (!scrollMap) {
      return;
    }

    let i = 0;
    let j = scrollMap.length - 1;
    let count = 0;
    let screenRow = -1; // the screenRow is the bufferRow in vscode.
    let mid;

    while (count < 20) {
      if (Math.abs(top - scrollMap[i]) < 20) {
        screenRow = i;
        break;
      } else if (Math.abs(top - scrollMap[j]) < 20) {
        screenRow = j;
        break;
      } else {
        mid = Math.floor((i + j) / 2);
        if (top > scrollMap[mid]) {
          i = mid;
        } else {
          j = mid;
        }
      }
      count++;
    }

    if (screenRow === -1) {
      screenRow = mid;
    }

    scrollToLine = screenRow;

    postMessage('revealLine', [sourceUri, scrollToLine]);

    // @scrollToPosition(screenRow * @editor.getLineHeightInPixels() - @previewElement.offsetHeight / 2, @editor.getElement())
    // # @editor.getElement().setScrollTop
    // track currnet time to disable onDidChangeScrollTop
    // editorScrollDelay = Date.now() + 100
  }, [buildScrollMap, postMessage, previewElement, sourceUri]);

  const scrollPreview = useCallback(() => {
    if (!config.scrollSync) {
      return;
    }

    buildScrollMap();

    if (Date.now() < previewScrollDelay) {
      return;
    }
    previewSyncSource();
  }, [
    buildScrollMap,
    config.scrollSync,
    previewScrollDelay,
    previewSyncSource,
  ]);

  const zoomIn = useCallback(() => {
    setZoomLevel(x => x + 0.1);
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(x => x - 0.1);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const renderMathJax = useCallback(() => {
    return new Promise<void>(resolve => {
      if (!hiddenPreviewElement) {
        return resolve();
      }
      if (config.mathRenderingOption === 'MathJax' || config.usePandocParser) {
        // .mathjax-exps, .math.inline, .math.display
        const unprocessedElements = hiddenPreviewElement.querySelectorAll(
          '.mathjax-exps, .math.inline, .math.display',
        );
        if (!unprocessedElements.length) {
          return resolve();
        }

        window['MathJax'].typesetClear(); // Don't pass element here!!!
        window['MathJax'].startup.document.state(0);
        window['MathJax'].texReset();
        window['MathJax'].typesetPromise([hiddenPreviewElement]).then(() => {
          // sometimes the this callback will be called twice
          // and only the second time will the Math expressions be rendered.
          // therefore, I added the line below to check whether math is already rendered.
          if (!hiddenPreviewElement.getElementsByClassName('MathJax').length) {
            return resolve();
          }

          setScrollMap(null);
          return resolve();
        });
      } else {
        return resolve();
      }
    });
  }, [config, hiddenPreviewElement]);

  const renderWavedrom = useCallback(() => {
    if (!hiddenPreviewElement) {
      return;
    }
    const els = hiddenPreviewElement.getElementsByClassName('wavedrom');
    if (els.length) {
      const newWavedromCache = {};
      for (let i = 0; i < els.length; i++) {
        const el = els[i] as HTMLElement;
        el.id = 'wavedrom' + i;
        const text = (el.textContent ?? '').trim();
        if (!text.length) {
          continue;
        }

        if (text in wavedromCache) {
          // load cache
          const svg = wavedromCache[text];
          el.innerHTML = svg;
          newWavedromCache[text] = svg;
          continue;
        }

        try {
          const content = window.eval(`(${text})`);
          window['WaveDrom'].RenderWaveForm(i, content, 'wavedrom');
          newWavedromCache[text] = el.innerHTML;
        } catch (error) {
          el.innerText = 'Failed to eval WaveDrom code. ' + error;
        }
      }

      setWavedromCache(newWavedromCache);
    }
  }, [hiddenPreviewElement, wavedromCache]);

  const renderInteractiveVega = useCallback(() => {
    return new Promise<void>(resolve => {
      if (!previewElement) {
        return resolve();
      }

      const vegaElements = previewElement.querySelectorAll('.vega, .vega-lite');
      function reportVegaError(el, error) {
        el.innerHTML =
          '<pre class="language-text">' + error.toString() + '</pre>';
      }
      for (let i = 0; i < vegaElements.length; i++) {
        const vegaElement = vegaElements[i];
        try {
          const spec = JSON.parse((vegaElement.textContent ?? '').trim());
          window['vegaEmbed'](vegaElement, spec, { actions: false }).catch(
            error => {
              reportVegaError(vegaElement, error);
            },
          );
        } catch (error) {
          reportVegaError(vegaElement, error);
        }
      }
      resolve();
    });
  }, [previewElement]);

  const renderMermaid = useCallback(async () => {
    if (!previewElement) {
      return;
    }
    const mermaid = window['mermaid']; // window.mermaid doesn't work, has to be written as window['mermaid']
    const mermaidGraphs = previewElement.getElementsByClassName('mermaid');

    const validMermaidGraphs: HTMLElement[] = [];
    for (let i = 0; i < mermaidGraphs.length; i++) {
      const mermaidGraph = mermaidGraphs[i] as HTMLElement;
      try {
        await mermaid.parse((mermaidGraph.textContent ?? '').trim());
        validMermaidGraphs.push(mermaidGraph);
      } catch (error) {
        mermaidGraph.innerHTML = `<pre class="language-text">${error.toString()}</pre>`;
      }
    }

    if (!validMermaidGraphs.length) {
      return;
    } else {
      validMermaidGraphs.forEach(async (mermaidGraph, offset) => {
        const svgId = 'svg-mermaid-' + Date.now() + '-' + offset;
        const code = (mermaidGraph.textContent ?? '').trim();
        try {
          const { svg } = await mermaid.render(svgId, code);
          mermaidGraph.innerHTML = svg;
        } catch (error) {
          const noiseElement = document.getElementById('d' + svgId);
          if (noiseElement) {
            noiseElement.style.display = 'none';
          }
          mermaidGraph.innerHTML = `<pre class="language-text">${error.toString()}</pre>`;
        }
      });
      return;
    }
  }, [previewElement]);

  const runCodeChunk = useCallback(
    (id: string | null) => {
      if (!config.enableScriptExecution || !id) {
        return;
      }

      const codeChunk = document.querySelector(`.code-chunk[data-id="${id}"]`);
      if (!codeChunk) {
        return;
      }
      const running = codeChunk.classList.contains('running');
      if (running) {
        return;
      }
      codeChunk.classList.add('running');

      if (codeChunk.getAttribute('data-cmd') === 'javascript') {
        // javascript code chunk
        const code = codeChunk.getAttribute('data-code');
        try {
          window.eval(`((function(){${code}$})())`);
          codeChunk.classList.remove('running'); // done running javascript code

          const result = CryptoJS.AES.encrypt(
            codeChunk.getElementsByClassName('output-div')[0].outerHTML,
            'crossnote',
          ).toString();

          postMessage('cacheCodeChunkResult', [sourceUri, id, result]);
        } catch (e) {
          const outputDiv = codeChunk.getElementsByClassName('output-div')[0];
          outputDiv.innerHTML = `<pre>${e.toString()}</pre>`;
        }
      } else {
        postMessage('runCodeChunk', [sourceUri, id]);
      }
    },
    [config.enableScriptExecution, postMessage, sourceUri],
  );

  const runAllCodeChunks = useCallback(() => {
    if (!config.enableScriptExecution || !previewElement) {
      return;
    }

    const codeChunks = previewElement.getElementsByClassName('code-chunk');
    for (let i = 0; i < codeChunks.length; i++) {
      codeChunks[i].classList.add('running');
    }

    postMessage('runAllCodeChunks', [sourceUri]);
  }, [config.enableScriptExecution, postMessage, previewElement, sourceUri]);

  const runNearestCodeChunk = useCallback(() => {
    if (!previewElement) {
      return;
    }
    const elements = previewElement.children;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (
        elements[i].classList.contains('sync-line') &&
        elements[i + 1] &&
        elements[i + 1].classList.contains('code-chunk')
      ) {
        if (
          cursorLine >=
          parseInt(elements[i].getAttribute('data-line') ?? '0', 10)
        ) {
          const codeChunkId = elements[i + 1].getAttribute('data-id');
          if (codeChunkId) {
            return runCodeChunk(codeChunkId);
          }
        }
      }
    }
  }, [cursorLine, previewElement, runCodeChunk]);

  const setupCodeChunks = useCallback(() => {
    if (!previewElement) {
      return;
    }
    const codeChunks = previewElement.getElementsByClassName('code-chunk');
    if (!codeChunks.length) {
      return;
    }

    for (let i = 0; i < codeChunks.length; i++) {
      const codeChunk = codeChunks[i];
      const id = codeChunk.getAttribute('data-id');

      // bind click event
      const runBtn = codeChunk.getElementsByClassName('run-btn')[0];
      const runAllBtn = codeChunk.getElementsByClassName('run-all-btn')[0];
      if (runBtn) {
        runBtn.addEventListener('click', () => {
          runCodeChunk(id);
        });
      }
      if (runAllBtn) {
        runAllBtn.addEventListener('click', () => {
          runAllCodeChunks();
        });
      }
    }
  }, [previewElement, runAllCodeChunks, runCodeChunk]);

  const initEvents = useCallback(async () => {
    if (!previewElement || !hiddenPreviewElement) {
      return;
    }
    try {
      setIsRefreshingPreview(true);
      await Promise.all([renderMathJax(), renderWavedrom()]);

      previewElement.innerHTML = hiddenPreviewElement.innerHTML;
      hiddenPreviewElement.innerHTML = '';

      await Promise.all([renderInteractiveVega(), renderMermaid()]);

      setupCodeChunks();

      setIsRefreshingPreview(false);
    } catch (error) {
      console.error(error);
      setIsRefreshingPreview(false);
    }
  }, [
    previewElement,
    hiddenPreviewElement,
    renderMathJax,
    renderWavedrom,
    renderInteractiveVega,
    renderMermaid,
    setupCodeChunks,
  ]);

  const scrollSyncToSlide = useCallback(
    (line: number) => {
      for (let i = slidesData.length - 1; i >= 0; i--) {
        if (line >= slidesData[i].line) {
          const { h, v, offset } = slidesData[i];
          if (offset === currentSlideOffset) {
            return;
          } else {
            setCurrentSlideOffset(offset);
            window['Reveal'].slide(h, v);
            break;
          }
        }
      }
    },
    [currentSlideOffset, slidesData],
  );

  const scrollToPosition = useCallback(
    (scrollTop: number) => {
      if (!previewElement) {
        return;
      }

      const delay = 10;
      const helper = (duration = 0) => {
        setScrollTimeout(scrollTimeout => {
          if (scrollTimeout !== null) {
            clearTimeout(scrollTimeout);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newScrollTimeout: number = (setTimeout as any)(() => {
            if (duration <= 0) {
              setPreviewScrollDelay(Date.now() + 500);
              previewElement.scrollTop = scrollTop;
              return;
            }

            const difference = scrollTop - previewElement.scrollTop;

            const perTick = (difference / duration) * delay;

            // disable preview onscroll
            setPreviewScrollDelay(Date.now() + 500);

            previewElement.scrollTop += perTick;
            if (previewElement.scrollTop === scrollTop) {
              return;
            }

            helper(duration - delay);
          }, delay);
          return newScrollTimeout;
        });
      };

      const scrollDuration = 120;
      helper(scrollDuration);
    },
    [previewElement],
  );

  const scrollSyncToLine = useCallback(
    (line: number, topRatio: number = 0.372) => {
      if (!previewElement) {
        return;
      }
      const scrollMap = buildScrollMap();
      if (!scrollMap || line >= scrollMap.length) {
        return;
      }

      if (line + 1 === totalLineCount) {
        // last line
        scrollToPosition(previewElement.scrollHeight);
      } else {
        /**
         * Since I am not able to access the viewport of the editor
         * I used `golden section` (0.372) here for scrollTop.
         */
        scrollToPosition(
          Math.max(scrollMap[line] - previewElement.offsetHeight * topRatio, 0),
        );
      }
    },
    [buildScrollMap, previewElement, scrollToPosition, totalLineCount],
  );

  const scrollToRevealSourceLine = useCallback(
    (line: number, topRatio = 0.372) => {
      if (line === cursorLine) {
        return;
      } else {
        setCursorLine(line);
      }

      // disable preview onscroll
      setPreviewScrollDelay(Date.now() + 500);

      if (isPresentationMode) {
        scrollSyncToSlide(line);
      } else {
        scrollSyncToLine(line, topRatio);
      }
    },
    [cursorLine, isPresentationMode, scrollSyncToLine, scrollSyncToSlide],
  );

  const bindAnchorElementsClickEvent = useCallback(() => {
    if (!previewElement) {
      return;
    }
    const helper = (as: HTMLAnchorElement[]) => {
      for (let i = 0; i < as.length; i++) {
        const a = as[i];
        const hrefAttr = a.getAttribute('href');
        if (!hrefAttr) {
          continue;
        }
        const href = decodeURIComponent(hrefAttr); // decodeURI here for Chinese like unicode heading
        if (href && href[0] === '#') {
          const targetElement = previewElement.querySelector(
            `[id="${encodeURIComponent(href.slice(1))}"]`,
          ) as HTMLElement; // fix number id bug
          if (targetElement) {
            a.onclick = event => {
              event.preventDefault();
              event.stopPropagation();

              // jump to tag position
              let offsetTop = 0;
              let el = targetElement;
              while (el && el !== previewElement) {
                offsetTop += el.offsetTop;
                el = el.offsetParent as HTMLElement;
              }

              if (previewElement.scrollTop > offsetTop) {
                previewElement.scrollTop =
                  offsetTop - 32 - targetElement.offsetHeight;
              } else {
                previewElement.scrollTop = offsetTop;
              }
            };
          } else {
            // without the `else` here, mpe package on Atom will fail to render preview (issue #824 and #827).
            a.onclick = event => {
              event.preventDefault();
              event.stopPropagation();
            };
          }
        } else if (
          // External links, like https://google.com
          isVSCodeWebExtension &&
          href.startsWith('https://') &&
          !href.startsWith('https://file+.vscode-resource.vscode-cdn.net')
        ) {
          continue;
        } else {
          a.onclick = event => {
            event.preventDefault();
            event.stopPropagation();
            postMessage('clickTagA', [
              {
                uri: sourceUri,
                href: encodeURIComponent(href.replace(/\\/g, '/')),
                scheme: sourceScheme,
              },
            ]);
          };
        }
      }
    };
    helper(Array.from(previewElement.getElementsByTagName('a')));

    if (sidebarTocElement) {
      helper(Array.from(sidebarTocElement.getElementsByTagName('a')));
    }
  }, [
    isVSCodeWebExtension,
    postMessage,
    previewElement,
    sidebarTocElement,
    sourceScheme,
    sourceUri,
  ]);

  const bindTaskListEvent = useCallback(() => {
    if (!previewElement) {
      return;
    }
    const taskListItemCheckboxes = previewElement.getElementsByClassName(
      'task-list-item-checkbox',
    );
    for (let i = 0; i < taskListItemCheckboxes.length; i++) {
      const checkbox = taskListItemCheckboxes[i] as HTMLInputElement;
      let li = checkbox.parentElement;
      if (li && li.tagName !== 'LI') {
        li = li.parentElement;
      }
      if (li?.tagName === 'LI') {
        li.classList.add('task-list-item');

        // bind checkbox click event
        checkbox.onclick = event => {
          event.preventDefault();

          const checked = checkbox.checked;
          if (checked) {
            checkbox.setAttribute('checked', '');
          } else {
            checkbox.removeAttribute('checked');
          }

          const dataLine = parseInt(
            checkbox.getAttribute('data-line') ?? '0',
            10,
          );
          if (!isNaN(dataLine)) {
            postMessage('clickTaskListCheckbox', [sourceUri, dataLine]);
          }
        };
      }
    }
  }, [previewElement, postMessage, sourceUri]);

  const updateHtml = useCallback(
    (html: string, id: string, classes: string) => {
      if (!previewElement || !hiddenPreviewElement) {
        return;
      }
      // If it's now isPresentationMode, then this function shouldn't be called.
      // If this function is called, then it might be in the case that
      //   1. Using singlePreview
      //   2. Switch from a isPresentationMode file to not isPresentationMode file.
      if (isPresentationMode) {
        return postMessage('refreshPreview', [sourceUri]);
      } else {
        setPreviewScrollDelay(Date.now() + 500);
        hiddenPreviewElement.innerHTML = html;
        const scrollTop = previewElement.scrollTop;
        // init several events
        initEvents().then(() => {
          setScrollMap(null);

          bindAnchorElementsClickEvent();
          bindTaskListEvent();

          // set id and classes
          previewElement.id = id || '';
          previewElement.setAttribute(
            'class',
            `crossnote markdown-preview ${classes}`,
          );

          // scroll to initial position
          if (!doneLoadingPreview) {
            setDoneLoadingPreview(true);
            scrollToRevealSourceLine(initialLine);

            // clear @scrollMap after 2 seconds because sometimes
            // loading images will change scrollHeight.
            setTimeout(() => {
              setScrollMap(null);
            }, 2000);
          } else {
            // restore scrollTop
            previewElement.scrollTop = scrollTop; // <= This line is necessary...
          }
        });
      }
    },
    [
      bindAnchorElementsClickEvent,
      bindTaskListEvent,
      doneLoadingPreview,
      hiddenPreviewElement,
      initEvents,
      initialLine,
      isPresentationMode,
      postMessage,
      previewElement,
      scrollToRevealSourceLine,
      sourceUri,
    ],
  );

  const initSlidesData = useCallback(() => {
    const slideElements = document.getElementsByTagName('section');
    let offset = 0;
    const slidesData: SlideData[] = [];
    for (let i = 0; i < slideElements.length; i++) {
      const slide = slideElements[i];
      if (slide.hasAttribute('data-line')) {
        const line = parseInt(slide.getAttribute('data-line') ?? '0', 10);
        const h = parseInt(slide.getAttribute('data-h') ?? '0', 10);
        const v = parseInt(slide.getAttribute('data-v') ?? '0', 10);
        slidesData.push({ line, h, v, offset });
        offset += 1;
      }
    }
    setSlidesData(slidesData);
  }, []);

  const initPresentationEvent = useCallback(() => {
    let initialSlide: HTMLDivElement | null = null;
    const readyEvent = () => {
      if (initialSlide) {
        initialSlide.style.visibility = 'visible';
      }

      // several events...
      setupCodeChunks();
      bindAnchorElementsClickEvent();
      bindTaskListEvent();

      // scroll slides
      window['Reveal'].addEventListener('slidechanged', event => {
        if (Date.now() < previewScrollDelay) {
          return;
        }

        const { indexh, indexv } = event;
        for (const slideData of slidesData) {
          const { h, v, line } = slideData;
          if (h === indexh && v === indexv) {
            postMessage('revealLine', [sourceUri, line + 6]);
          }
        }
      });
    };

    // analyze slides
    initSlidesData();

    // slide to initial position
    window['Reveal'].configure({ transition: 'none' });
    scrollToRevealSourceLine(initialLine);
    window['Reveal'].configure({ transition: 'slide' });

    initialSlide = window['Reveal'].getCurrentSlide();
    if (initialSlide) {
      initialSlide.style.visibility = 'hidden';
    }

    if (window['Reveal'].isReady()) {
      readyEvent();
    } else {
      window['Reveal'].addEventListener('ready', readyEvent);
    }
  }, [
    bindAnchorElementsClickEvent,
    bindTaskListEvent,
    initSlidesData,
    initialLine,
    postMessage,
    previewScrollDelay,
    scrollToRevealSourceLine,
    setupCodeChunks,
    slidesData,
    sourceUri,
  ]);

  useEffect(() => {
    setSourceUri(config.sourceUri);
    setCursorLine(config.cursorLine ?? -1);
    setInitialLine(config.initialLine ?? 0);
    setZoomLevel(config.zoomLevel ?? 1);
  }, [config]);

  /**
   * Keyboard events
   */
  useEffect(() => {
    const keyboardEventHandler = (event: KeyboardEvent) => {
      if (!previewElement) {
        return;
      }

      if (event.shiftKey && event.ctrlKey && event.which === 83) {
        // ctrl+shift+s preview sync source
        return previewSyncSource();
      } else if (event.metaKey || event.ctrlKey) {
        // ctrl+c copy
        if (event.which === 67) {
          // [c] copy
          document.execCommand('copy');
        } else if (event.which === 187 && !isVSCode) {
          // [+] zoom in
          zoomIn();
        } else if (event.which === 189 && !isVSCode) {
          // [-] zoom out
          zoomOut();
        } else if (event.which === 48 && !isVSCode) {
          // [0] reset zoom
          resetZoom();
        } else if (event.which === 38) {
          // [ArrowUp] scroll to the most top
          if (isPresentationMode) {
            window['Reveal'].slide(0);
          } else {
            previewElement.scrollTop = 0;
          }
        }
      } else if (event.which === 27) {
        // [esc] toggle sidebar toc
        escPressed(event);
      }
    };
    document.addEventListener('keydown', keyboardEventHandler);
    return () => {
      document.removeEventListener('keydown', keyboardEventHandler);
    };
  }, [
    escPressed,
    isPresentationMode,
    isVSCode,
    previewElement,
    previewSyncSource,
    resetZoom,
    zoomIn,
    zoomOut,
  ]);

  /**
   * Window resize event
   */
  useEffect(() => {
    const resizeEventHandler = () => {
      setScrollMap(null);
    };
    window.addEventListener('resize', resizeEventHandler);
    return () => {
      window.removeEventListener('resize', resizeEventHandler);
    };
  }, []);

  /**
   * Message
   */
  useEffect(() => {
    const messageEventHandler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !previewElement) {
        return;
      }

      if (data.command === 'updateHTML') {
        const { totalLineCount, tocHTML, sourceUri, sourceScheme } = data;
        setTotalLineCount(totalLineCount);
        setSidebarTocHtml(tocHTML);
        setSourceUri(sourceUri);
        setSourceScheme(sourceScheme);
        updateHtml(data.html, data.id, data.class);
      } else if (
        data.command === 'changeTextEditorSelection' &&
        (config.scrollSync || data.forced)
      ) {
        const line = parseInt(data.line, 10);
        let topRatio = parseFloat(data.topRatio);
        if (isNaN(topRatio)) {
          topRatio = 0.372;
        }
        scrollToRevealSourceLine(line, topRatio);
      } else if (data.command === 'startParsingMarkdown') {
        /**
         * show refreshingIcon after 1 second
         * if preview hasn't finished rendering.
         */
        // FIXME:
        /*
        if (this.refreshingIconTimeout) {
          clearTimeout(this.refreshingIconTimeout);
        }

        this.refreshingIconTimeout = setTimeout(() => {
          if (!this.isPresentationMode) {
            this.refreshingIcon.style.display = 'block';
          }
        }, 1000);
        */
      } else if (data.command === 'openImageHelper') {
        // TODO: Replace this with headless modal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ($('#image-helper-view') as any).modal();
      } else if (data.command === 'runAllCodeChunks') {
        runAllCodeChunks();
      } else if (data.command === 'runCodeChunk') {
        runNearestCodeChunk();
      } else if (data.command === 'escPressed') {
        // this.escPressed();
      } else if (data.command === 'previewSyncSource') {
        previewSyncSource();
      } else if (data.command === 'copy') {
        document.execCommand('copy');
      } else if (data.command === 'zommIn') {
        zoomIn();
      } else if (data.command === 'zoomOut') {
        zoomOut();
      } else if (data.command === 'resetZoom') {
        resetZoom();
      } else if (data.command === 'scrollPreviewToTop') {
        if (isPresentationMode) {
          window['Reveal'].slide(0);
        } else {
          previewElement.scrollTop = 0;
        }
      }
    };
    window.addEventListener('message', messageEventHandler);
    return () => {
      window.removeEventListener('message', messageEventHandler);
    };
  }, [
    config.scrollSync,
    isPresentationMode,
    previewElement,
    previewSyncSource,
    resetZoom,
    runAllCodeChunks,
    runNearestCodeChunk,
    scrollToRevealSourceLine,
    updateHtml,
    zoomIn,
    zoomOut,
  ]);

  useEffect(() => {
    postMessage('setZoomLevel', [sourceUri, zoomLevel]);
  }, [zoomLevel, sourceUri, postMessage]);

  /**
   * On load
   */
  useEffect(() => {
    if (!previewElement || !hiddenPreviewElement || !sourceUri) {
      return;
    }
    setZoomLevel(config.zoomLevel ?? 1);

    if (document.body.hasAttribute('data-html')) {
      previewElement.innerHTML = document.body.getAttribute('data-html') ?? '';
      document.body.removeAttribute('data-html');
    }

    if (!isPresentationMode) {
      previewElement.onscroll = scrollPreview.bind(this);

      const isDarkColorScheme = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

      postMessage('webviewFinishLoading', [
        {
          uri: sourceUri,
          systemColorScheme: isDarkColorScheme ? 'dark' : 'light',
        },
      ]);
    } else {
      // TODO: presentation preview to source sync
      config.scrollSync = true; // <= force to enable scrollSync for presentation
      initPresentationEvent();
    }

    // make it possible for interactive vega to load local data files
    const base = document.createElement('base');
    base.href = sourceUri;
    document.head.appendChild(base);
  }, [
    previewElement,
    hiddenPreviewElement,
    config,
    sourceUri,
    isPresentationMode,
    postMessage,
    scrollPreview,
    initPresentationEvent,
  ]);

  return {
    clickSidebarTocButton,
    isPresentationMode,
    isRefreshingPreview,
    isVSCode,
    isVSCodeWebExtension,
    postMessage,
    previewSyncSource,
    setHiddenPreviewElement,
    setPreviewElement,
    setSidebarTocElement,
    showSidebarToc,
    sidebarTocHtml,
    sourceScheme,
    sourceUri,
    zoomLevel,
    config,
    contextMenuId,
    showContextMenu,
    showImageHelper,
    setShowImageHelper,
  };
});

export default WebviewContainer;
