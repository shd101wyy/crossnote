import React, { useEffect, useRef } from 'react';
import WebviewContainer from '../containers/webview';

export default function Webview() {
  const previewElementRef = useRef<HTMLDivElement>(null);
  const {
    setHtml,
    htmlComponent,
    id,
    className,
    setPreviewElement,
  } = WebviewContainer.useContainer();

  useEffect(() => {
    console.log('Entered Webview WTF');
    const html = document.body.getAttribute('data-html') ?? '';
    setHtml(html);
  }, []);

  useEffect(() => {
    if (previewElementRef.current) {
      setPreviewElement(previewElementRef.current);
    }
  }, [htmlComponent, setPreviewElement]);

  return (
    <div>
      {/** The real preview */}
      <div
        className={'crossnote markdown-preview ' + className}
        data-for="preview"
        ref={previewElementRef}
        id={id}
      >
        {htmlComponent}
      </div>
    </div>
  );
}
