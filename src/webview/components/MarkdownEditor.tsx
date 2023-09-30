import {
  mdiCheck,
  mdiClose,
  mdiUnfoldLessHorizontal,
  mdiUnfoldMoreHorizontal,
} from '@mdi/js';
import Icon from '@mdi/react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PreviewContainer from '../containers/preview';

const EDITOR_MIN_HEIGHT = 19 * 3; // 3 lines
const EDITOR_FINAL_LINE_HEIGHT = 19 * 20; // 20 lines

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
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco>(null);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showConfirmCloseAlert, setShowConfirmCloseAlert] = useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    console.log('Mount editor', !!editor, !!monaco);
    editorRef.current = editor;
    monacoRef.current = monaco;
    // HACK: For re-rendering the editor
    setCount(Date.now());
  };

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
    if (
      !highlightElementBeingEdited ||
      !editorRef.current ||
      !monacoRef.current
    ) {
      return;
    }

    const range = getHighlightElementLineRange(highlightElementBeingEdited);
    if (!range) {
      return;
    }
    const [start, end] = range;
    if (!highlightElementBeingEdited.classList.contains('final-line')) {
      // NOTE: We remove the decoration for top empty line
      window['editorRef'] = editorRef.current;

      let emptyLinesCount = 0;
      for (let i = start + 1; i < end; i++) {
        if (editorRef.current.getModel().getLineContent(i) === '') {
          emptyLinesCount++;
        }
      }
      console.log('emptyLinesCount', emptyLinesCount);

      // Create line decorations
      editorRef.current.createDecorationsCollection([
        {
          range: new monacoRef.current.Range(
            start + 1 + emptyLinesCount,
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

      // Navigate to the line
      editorRef.current.revealLineNearTop(start + 1 + emptyLinesCount);
    } else {
      // Navigate to the line
      editorRef.current.revealLineInCenter(start + 1);
    }
  }, [
    getHighlightElementLineRange,
    highlightElementBeingEdited,
    editorRef,
    monacoRef,
    markdown,
    count,
  ]);

  // Bind ctrl+s or cmd+s to save the editor value
  useEffect(() => {
    console.log('Bind ctrl+s or cmd+s to save the editor value');
    if (!editorRef.current) {
      return;
    }

    // Bind commands
    const saveCommandId: string = editorRef.current.addCommand(
      monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KEY_S,
      function() {
        console.log('Pressed ctrl+s or cmd+s');
        saveEditor();
      },
    );
    console.log('saveCommandId', saveCommandId);
    /*
    const saveCommand = editorRef.current.registerCommand('save', function() {
      console.log('Pressed ctrl+s or cmd+s');
      saveEditor();
    });
    */

    return () => {
      // Unbind commands
      // saveCommand.dispose();
    };
  }, [saveEditor, count]);

  useEffect(() => {
    // Add `position` style to the highlightElementBeingEdited
    if (!highlightElementBeingEdited) {
      return;
    }
    const style = window.getComputedStyle(highlightElementBeingEdited);
    const position = style.position;
    const height = style.height;
    const minHeight = style.minHeight;
    const padding = style.padding;
    // const scale = style.scale;
    if (position !== 'absolute' && position !== 'fixed') {
      highlightElementBeingEdited.style.position = 'relative';
    }

    // If the highlightElementBeingEdited has class `final-line`, we need to
    // increase the height of it to make it higher.
    if (highlightElementBeingEdited.classList.contains('final-line')) {
      highlightElementBeingEdited.style.height = `${EDITOR_FINAL_LINE_HEIGHT}px`;
    }

    // Set editor min height
    highlightElementBeingEdited.style.minHeight = `${EDITOR_MIN_HEIGHT}px`;

    // Set editor scale
    // FIXME: Setting this will cause `expanded` state not working.
    // highlightElementBeingEdited.style.scale = '1';

    // Set editor padding
    highlightElementBeingEdited.style.padding = '0';

    return () => {
      if (!highlightElementBeingEdited) {
        return;
      }
      highlightElementBeingEdited.style.position = position;
      highlightElementBeingEdited.style.height = height;
      highlightElementBeingEdited.style.minHeight = minHeight;
      // highlightElementBeingEdited.style.scale = scale;
      highlightElementBeingEdited.style.padding = padding;
    };
  }, [highlightElementBeingEdited]);

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
      console.log('Unmount editor');
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
          ? 'fixed top-0 left-0 w-[98vw] h-[100vh] z-[60]'
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
        <div className="absolute top-0 right-0 flex flex-row items-center z-20">
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
            onClick={closeEditor}
          >
            <Icon path={mdiClose} size={0.6}></Icon>
          </button>
        </div>
      )}
      {/* Confirm Close Alert */}
      {showConfirmCloseAlert && (
        <div
          className="alert fixed top-0 left-0 w-full z-[60]"
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
              <div className="loading loading-dots loading-md"></div>
            </div>
          </div>
        }
        keepCurrentModel={true}
        className={`min-h-[${EDITOR_MIN_HEIGHT}px]`}
      ></Editor>
    </div>,
    highlightElementBeingEdited,
  );
}
