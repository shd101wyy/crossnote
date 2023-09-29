import {
  mdiCheck,
  mdiClose,
  mdiUnfoldLessHorizontal,
  mdiUnfoldMoreHorizontal,
} from '@mdi/js';
import Icon from '@mdi/react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PreviewContainer from '../containers/preview';

export default function MarkdownEditor() {
  const {
    highlightElementBeingEdited,
    markdown,
    getHighlightElementLineRange,
    setHighlightElementBeingEdited,
    theme,
  } = PreviewContainer.useContainer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco>(null);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // HACK: For re-rendering the editor
    setCount(Date.now());
  };

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
      // TODO: Remove the decoration for top empty line
      // Create line decorations

      let emptyLinesCount = 0;
      for (let i = start + 1; i < end; i++) {
        if (editorRef.current.getModal().getLineContent(i) === '') {
          emptyLinesCount++;
        }
      }

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
    }

    // Navigate to the line
    editorRef.current.revealLineNearTop(start + 1);
  }, [
    getHighlightElementLineRange,
    highlightElementBeingEdited,
    editorRef,
    monacoRef,
    markdown,
    count,
  ]);

  useEffect(() => {
    // Add `position` style to the highlightElementBeingEdited
    if (!highlightElementBeingEdited) {
      return;
    }
    const style = window.getComputedStyle(highlightElementBeingEdited);
    const position = style.position;
    if (position !== 'absolute' && position !== 'fixed') {
      highlightElementBeingEdited.style.position = 'relative';
    }

    return () => {
      if (!highlightElementBeingEdited) {
        return;
      }
      highlightElementBeingEdited.style.position = position;
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

  if (!highlightElementBeingEdited) {
    return;
  }

  return createPortal(
    <div
      className={
        expanded
          ? 'fixed top-0 left-0 w-[98vw] h-[100vh] z-[60]'
          : 'absolute top-0 w-[98vw] h-[104%]'
      }
      style={
        expanded
          ? {}
          : {
              left: -highlightElementBeingEdited.offsetLeft,
            }
      }
    >
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
          onClick={() => setHighlightElementBeingEdited(null)}
        >
          <Icon path={mdiCheck} size={0.6}></Icon>
        </button>
        <button
          className="btn btn-primary btn-circle btn-xs"
          onClick={() => setHighlightElementBeingEdited(null)}
        >
          <Icon path={mdiClose} size={0.6}></Icon>
        </button>
      </div>

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
      ></Editor>
    </div>,
    highlightElementBeingEdited,
  );
}
