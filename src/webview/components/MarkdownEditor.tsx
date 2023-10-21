import {
  mdiCheck,
  mdiClose,
  mdiUnfoldLessHorizontal,
  mdiUnfoldMoreHorizontal,
} from '@mdi/js';
import Icon from '@mdi/react';
import Editor, { OnMount } from '@monaco-editor/react';
import classNames from 'classnames';
import * as Monaco from 'monaco-editor';
import { editor as monacoEditor } from 'monaco-editor';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PreviewContainer from '../containers/preview';

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MIN_HEIGHT = EDITOR_LINE_HEIGHT * 3; // 3 lines
const EDITOR_FINAL_LINE_HEIGHT = EDITOR_LINE_HEIGHT * 20; // 20 lines

export default function MarkdownEditor() {
  const {
    highlightElementBeingEdited,
    markdown,
    getHighlightElementLineRange,
    setHighlightElementBeingEdited,
    theme,
    postMessage,
    sourceUri,
    markdownEditorExpanded,
    setMarkdownEditorExpanded,
  } = PreviewContainer.useContainer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const isSuggestionWidgetOpened = useRef(false);
  const hasRegisteredMarkdownCompletionItemsProvider = useRef(false);
  const [isEditorInitialized, setIsEditorInitialized] = useState(false);
  const [showConfirmCloseAlert, setShowConfirmCloseAlert] = useState(false);
  const [editorMinHeight, setEditorMinHeight] = useState(EDITOR_MIN_HEIGHT);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorInitialized(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)['editor'] = editor;
  }, []);

  const closeEditor = useCallback(() => {
    // Check if there is change between markdown and editor value
    if (editorRef.current && editorRef.current.getValue() !== markdown) {
      setShowConfirmCloseAlert(true);
    } else {
      setHighlightElementBeingEdited(null);
    }
  }, [setHighlightElementBeingEdited, markdown, editorRef]);

  const saveEditor = useCallback(() => {
    if (!editorRef.current) {
      return;
    }
    const value = editorRef.current.getValue();
    postMessage('updateMarkdown', [sourceUri.current, value]);
    setHighlightElementBeingEdited(null);
  }, [setHighlightElementBeingEdited, postMessage, sourceUri]);

  // Jump to the line of the highlightElementBeingEdited
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (
      !isEditorInitialized ||
      !highlightElementBeingEdited ||
      !editor ||
      !monaco
    ) {
      return;
    }

    const range = getHighlightElementLineRange(highlightElementBeingEdited);
    if (!range) {
      return;
    }
    const [start, end] = range;
    // console.log('range', range);
    // window['editor'] = editor;
    if (!highlightElementBeingEdited.classList.contains('final-line')) {
      // NOTE: We add try catch here because sometimes it will throw error
      let emptyLinesCountAtStart = 0;
      try {
        for (let i = start + 1; i < end; i++) {
          if (editor.getModel()?.getLineContent(i) === '') {
            emptyLinesCountAtStart++;
          } else {
            break;
          }
        }
      } catch (error) {
        console.error(error);
      }

      // NOTE: We add try catch here because sometimes it will throw error
      let endLineLength = 0;
      try {
        endLineLength = editor.getModel()?.getLineLength(end) ?? 0;
      } catch (error) {
        console.error(error);
      }

      // Create line decorations
      editor.createDecorationsCollection([
        {
          range: new monaco.Range(
            start + 1 + emptyLinesCountAtStart,
            1,
            end,
            endLineLength + 1,
          ),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: 'monaco-line-decoration',
          },
        },
      ]);

      // Focus on the editor
      editor.focus();

      // Select the lines
      editor.setSelection(
        new monaco.Range(
          start + 1 + emptyLinesCountAtStart,
          1,
          end,
          endLineLength + 1,
        ),
      );

      setEditorMinHeight(
        Math.max(
          (end - start - emptyLinesCountAtStart) * EDITOR_LINE_HEIGHT,
          EDITOR_MIN_HEIGHT,
        ),
      );

      // Navigate to the line
      editor.revealLines(
        start + 1 + emptyLinesCountAtStart,
        end === start + 1 + emptyLinesCountAtStart ? end + 1 : end,
        monacoEditor.ScrollType.Immediate,
      );
    } else {
      // Focus on the editor
      editor.focus();

      // Navigate to the line
      // NOTE: Timeout is needed here; otherwise it might not scroll for some unknown reason.
      setTimeout(() => {
        editor.revealLineInCenter(start, monacoEditor.ScrollType.Immediate);
      }, 100);
    }
  }, [
    getHighlightElementLineRange,
    highlightElementBeingEdited,
    editorRef,
    monacoRef,
    markdown,
    isEditorInitialized,
  ]);

  // Bind
  // - ctrl+s or cmd+s to save the editor value
  // - esc to close the editor
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!isEditorInitialized || !editor || !monaco) {
      return;
    }

    // Bind commands
    /// Save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      saveEditor();
    });

    /// Close command
    editor.addCommand(monaco.KeyCode.Escape, function () {
      // Close editor suggestion widget if it is opened
      if (isSuggestionWidgetOpened.current) {
        editor.trigger('keyboard', 'hideSuggestWidget', {});
      } else {
        closeEditor();
      }
    });

    return () => {
      // Unbind commands
      // saveCommand.dispose();
    };
  }, [saveEditor, closeEditor, isEditorInitialized]);

  // Bind
  // When user press "/", show list of commands
  // - Heading 1
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!isEditorInitialized || !editor || !monaco) {
      return;
    }

    // Bind commands
    /// Save command
    editor.addCommand(monaco.KeyCode.Slash, function () {
      // Show list of commands
      // Insert `/` to the editor
      editor.trigger('keyboard', 'type', { text: '/' });

      // Show completion items
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });
  }, [isEditorInitialized]);

  // Register completion items provider
  useEffect(() => {
    const monaco = monacoRef.current;
    if (
      !isEditorInitialized ||
      !monaco ||
      hasRegisteredMarkdownCompletionItemsProvider.current
    ) {
      return;
    }

    monaco.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: function (model, position) {
        const text = model.getValueInRange({
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column - 1,
          endColumn: position.column,
        });
        if (
          text !== '/' // Not trigger command
        ) {
          return {
            suggestions: [],
          };
        }
        const suggestRange: Monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column, // - 1,
          endColumn: position.column,
        };
        const additionalTextEdits: Monaco.editor.ISingleEditOperation[] = [
          // Delete `/`
          {
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - 1,
              endColumn: position.column,
            },
            text: '',
          },
        ];
        return {
          suggestions: [
            {
              label: 'Header 1',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '# ',
              documentation: '# Header 1',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Header 2',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '## ',
              documentation: '## Header 2',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Header 3',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '### ',
              documentation: '### Header 3',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Header 4',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '#### ',
              documentation: '#### Header 4',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Header 5',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '#### ',
              documentation: '#### Header 5',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Header 6',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '###### ',
              documentation: '###### Header 6',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Blockquote',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '> ',
              documentation: '> Blockquote',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Unordered List',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '- ',
              documentation: '- Unordered List',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Ordered List',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '1. ',
              documentation: '1. Ordered List',
              range: suggestRange,
              additionalTextEdits,
            },
            {
              label: 'Slide',
              kind: monaco.languages.CompletionItemKind.Event,
              insertText: '<!-- slide --> \n',
              documentation: '<!-- slide -->',
              range: suggestRange,
              additionalTextEdits,
            },
          ],
        };
      },
    });

    hasRegisteredMarkdownCompletionItemsProvider.current = true;
  }, [isEditorInitialized]);

  // Check suggestion widget open state
  useEffect(() => {
    const editor = editorRef.current;
    if (!isEditorInitialized || !editor) {
      return;
    }

    const suggestionWidget = editor.getContribution(
      'editor.contrib.suggestController',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    )?.widget as any;

    if (suggestionWidget) {
      suggestionWidget.value.onDidShow(() => {
        isSuggestionWidgetOpened.current = true;
      });
      suggestionWidget.value.onDidHide(() => {
        isSuggestionWidgetOpened.current = false;
      });
    }
  }, [isEditorInitialized]);

  useEffect(() => {
    // Add `position` style to the highlightElementBeingEdited
    if (!highlightElementBeingEdited) {
      return;
    }
    const cssText = highlightElementBeingEdited.style.cssText;

    // Set the position to `relative`
    highlightElementBeingEdited.style.position = 'relative';

    // Set the position left so it will be at the left of the screen
    highlightElementBeingEdited.style.left =
      -highlightElementBeingEdited.offsetLeft + 'px';

    // Set the width
    highlightElementBeingEdited.style.maxWidth = '100vw';

    // If the highlightElementBeingEdited has class `final-line`, we need to
    // increase the height of it to make it higher.
    if (highlightElementBeingEdited.classList.contains('final-line')) {
      highlightElementBeingEdited.style.height = `${EDITOR_FINAL_LINE_HEIGHT}px`;
    }

    // Set editor scale
    // FIXME: Setting this will cause `expanded` state not working.
    // highlightElementBeingEdited.style.scale = '1';

    // Set editor padding
    highlightElementBeingEdited.style.padding = '0';

    // Set editor overflow to `unset`
    highlightElementBeingEdited.style.overflow = 'unset';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (highlightElementBeingEdited.style as any).zoom = '1';

    return () => {
      // Restore the styles
      highlightElementBeingEdited.style.cssText = cssText;
    };
  }, [highlightElementBeingEdited]);

  // Set highlightElementBeingEdited min height according to the editorMinHeight
  useEffect(() => {
    if (!highlightElementBeingEdited) {
      return;
    }
    const style = window.getComputedStyle(highlightElementBeingEdited);
    const minHeight = style.minHeight;

    highlightElementBeingEdited.style.minHeight = `${editorMinHeight}px`;

    return () => {
      highlightElementBeingEdited.style.minHeight = minHeight;
    };
  }, [highlightElementBeingEdited, editorMinHeight]);

  useEffect(() => {
    if (!highlightElementBeingEdited) {
      return;
    }

    const highlightLineElements = document.querySelectorAll('.highlight-line');
    highlightLineElements.forEach((element) => {
      element.classList.remove('highlight-active');
    });
  }, [highlightElementBeingEdited]);

  useEffect(() => {
    return () => {
      editorRef.current = null;
      monacoRef.current = null;
      isSuggestionWidgetOpened.current = false;
      setIsEditorInitialized(false);
      setMarkdownEditorExpanded(false);
    };
  }, [setMarkdownEditorExpanded]);

  if (!highlightElementBeingEdited) {
    return null;
  }

  return createPortal(
    <div
      className={classNames(
        'markdown-editor',
        markdownEditorExpanded
          ? 'fixed top-0 left-0 w-[98vw] h-[100vh] z-[70]'
          : 'absolute top-0 w-[98vw] h-[100%]',
      )}
    >
      {/* Action buttons */}
      {!showConfirmCloseAlert && (
        <div className="absolute top-0 right-4 flex flex-row items-center z-20">
          {markdownEditorExpanded ? (
            <button
              className="btn btn-primary btn-circle btn-xs mr-1"
              onClick={() => setMarkdownEditorExpanded(false)}
              title="Collapse"
            >
              <Icon path={mdiUnfoldLessHorizontal} size={0.6}></Icon>
            </button>
          ) : (
            <button
              className="btn btn-primary btn-circle btn-xs mr-1"
              onClick={() => setMarkdownEditorExpanded(true)}
              title="Expand"
            >
              <Icon path={mdiUnfoldMoreHorizontal} size={0.6}></Icon>
            </button>
          )}
          <button
            className="btn btn-primary btn-circle btn-xs mr-1"
            onClick={saveEditor}
            title="Save changes"
          >
            <Icon path={mdiCheck} size={0.6}></Icon>
          </button>
          <button
            className="btn btn-primary btn-circle btn-xs"
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              closeEditor();
            }}
            title="Discard changes"
          >
            <Icon path={mdiClose} size={0.6}></Icon>
          </button>
        </div>
      )}
      {/* Confirm Close Alert */}
      {showConfirmCloseAlert && (
        <div
          className="alert fixed top-1/2 left-[5%] w-[90%] z-[70] box-border"
          data-theme={theme}
        >
          <div className="flex flex-col items-center text-base font-normal not-italic text-left">
            <div className="flex flex-row items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-info shrink-0 w-6 h-6 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                There is unsaved change. Are you sure to discard the change?
              </span>
            </div>
            <div className="flex flex-row mt-2">
              <button
                className="btn btn-sm w-[54px] mx-1"
                onClick={() => {
                  setShowConfirmCloseAlert(false);
                }}
              >
                No
              </button>
              <button
                className="btn btn-sm btn-error text-white w-[54px] mx-1"
                onClick={() => {
                  setShowConfirmCloseAlert(false);
                  setHighlightElementBeingEdited(null);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Editor */}
      <Editor
        height="100%"
        defaultLanguage="markdown"
        onMount={handleEditorDidMount}
        defaultValue={markdown}
        defaultPath={sourceUri.current}
        // A list of Monaco Editor options can be found here:
        // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
        options={{
          wordWrap: 'on',
          // lineNumbers: 'off',
          useShadowDOM: true,
        }}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        loading={
          <div
            className="relative bg-base-100 w-full h-full"
            data-theme={theme}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center">
                <div className="loading loading-dots loading-md"></div>
                <div className="text-base font-normal not-italic">
                  Loading editor...
                </div>
              </div>
            </div>
          </div>
        }
        keepCurrentModel={false}
        className={`min-h-[${editorMinHeight}px]`}
      ></Editor>
    </div>,
    highlightElementBeingEdited,
  );
}
