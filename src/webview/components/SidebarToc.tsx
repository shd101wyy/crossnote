import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PreviewContainer from '../containers/preview';
import { getElementBackgroundColor } from '../lib/utility';

const SIDEBAR_WIDTH_KEY = 'crossnote.sidebarTocWidth';
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH_RATIO = 0.5; // max 50% of viewport

function clampWidth(width: number): number {
  const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
  return Math.max(MIN_WIDTH, Math.min(width, maxWidth));
}

function loadWidth(): number {
  const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (Number.isFinite(parsed)) {
      return clampWidth(parsed);
    }
  }
  return DEFAULT_WIDTH;
}

export default function SidebarToc() {
  const { sidebarTocElement, showSidebarToc, onSidebarResized } =
    PreviewContainer.useContainer();
  const [width, setWidth] = useState(loadWidth);
  const isDragging = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);

  // Re-clamp on window resize
  useEffect(() => {
    const onResize = () => setWidth((w) => clampWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist and propagate width as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-toc-width',
      `${width}px`,
    );
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  }, [width]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const newWidth = window.innerWidth - ev.clientX;
        setWidth(clampWidth(newWidth));
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onSidebarResized();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [onSidebarResized],
  );

  return (
    <div
      ref={shellRef}
      className={classNames('md-sidebar-toc', showSidebarToc ? '' : 'hidden')}
      style={{
        backgroundColor: getElementBackgroundColor(document.body),
        width: `${width}px`,
      }}
    >
      {/* Resize handle */}
      <div className="md-sidebar-toc-resize-handle" onMouseDown={onMouseDown} />
      {/* Scrollable TOC content */}
      <div className="md-sidebar-toc-content" ref={sidebarTocElement} />
    </div>
  );
}
