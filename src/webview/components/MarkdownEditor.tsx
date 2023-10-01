import {
  mdiCheck,
  mdiClose,
  mdiUnfoldLessHorizontal,
  mdiUnfoldMoreHorizontal,
} from '@mdi/js';
import Icon from '@mdi/react';
import Editor, { OnMount } from '@monaco-editor/react';
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
  } = PreviewContainer.useContainer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showConfirmCloseAlert, setShowConfirmCloseAlert] = useState(false);
  const [editorMinHeight, setEditorMinHeight] = useState(EDITOR_MIN_HEIGHT);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // HACK: For re-rendering the editor
    setCount(Date.now());
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
    if (!highlightElementBeingEdited || !editor || !monaco) {
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
      // NOTE: We remove the decoration for top empty line

      let emptyLinesCountAtStart = 0;
      for (let i = start + 1; i < end; i++) {
        if (editor.getModel()?.getLineContent(i) === '') {
          emptyLinesCountAtStart++;
        } else {
          break;
        }
      }

      // Create line decorations
      editor.createDecorationsCollection([
        {
          range: new monaco.Range(
            start + 1 + emptyLinesCountAtStart,
            1,
            end,
            1,
          ),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: 'monaco-line-decoration',
          },
        },
      ]);

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
      // Navigate to the line
      editor.revealLineInCenter(start + 1, monacoEditor.ScrollType.Immediate);
    }
  }, [
    getHighlightElementLineRange,
    highlightElementBeingEdited,
    editorRef,
    monacoRef,
    markdown,
    count,
  ]);

  // Bind
  // - ctrl+s or cmd+s to save the editor value
  // - esc to close the editor
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) {
      return;
    }

    // Bind commands
    /// Save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      saveEditor();
    });

    /// Close command
    editor.addCommand(monaco.KeyCode.Escape, function () {
      closeEditor();
    });

    return () => {
      // Unbind commands
      // saveCommand.dispose();
    };
  }, [saveEditor, closeEditor, count]);

  useEffect(() => {
    // Add `position` style to the highlightElementBeingEdited
    if (!highlightElementBeingEdited) {
      return;
    }
    const cssText = highlightElementBeingEdited.style.cssText;

    // Set the position to `relative`
    highlightElementBeingEdited.style.position = 'relative';

    // Set the width to 100vw
    highlightElementBeingEdited.style.width = '100vw';

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
    };
  }, []);

  if (!highlightElementBeingEdited) {
    return;
  }

  return createPortal(
    <div
      className={
        expanded
          ? 'fixed top-0 left-0 w-[98vw] h-[100vh] z-[70]'
          : 'absolute top-0 w-[98vw] h-[100%]'
      }
      style={
        expanded
          ? {}
          : {
              left: -highlightElementBeingEdited.offsetLeft,
            }
      }
    >
      {/* Action buttons */}
      {!showConfirmCloseAlert && (
        <div className="absolute top-0 right-4 flex flex-row items-center z-20">
          {expanded ? (
            <button
              className="btn btn-primary btn-circle btn-xs mr-1"
              onClick={() => setExpanded(false)}
            >
              <Icon path={mdiUnfoldLessHorizontal} size={0.6}></Icon>
            </button>
          ) : (
            <button
              className="btn btn-primary btn-circle btn-xs mr-1"
              onClick={() => setExpanded(true)}
            >
              <Icon path={mdiUnfoldMoreHorizontal} size={0.6}></Icon>
            </button>
          )}
          <button
            className="btn btn-primary btn-circle btn-xs mr-1"
            onClick={saveEditor}
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
          >
            <Icon path={mdiClose} size={0.6}></Icon>
          </button>
        </div>
      )}
      {/* Confirm Close Alert */}
      {showConfirmCloseAlert && (
        <div
          className="alert fixed top-0 left-0 w-full z-[70]"
          data-theme={theme}
        >
          <div className="flex flex-row items-center text-base font-normal not-italic text-left">
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
            <div>
              <button
                className="btn btn-sm w-[54px]"
                onClick={() => {
                  setShowConfirmCloseAlert(false);
                }}
              >
                No
              </button>
              <button
                className="btn btn-sm btn-error text-white w-[54px]"
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
