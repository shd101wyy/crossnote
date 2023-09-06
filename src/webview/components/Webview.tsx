import parse from 'html-react-parser';
import React, { useEffect, useRef } from 'react';
import WebviewContainer from '../containers/webview';

export default function Webview() {
  const previewElementRef = useRef<HTMLDivElement>(null);
  const { html, setHtml, id, className } = WebviewContainer.useContainer();

  useEffect(() => {
    console.log('Entered Webview WTF');
    const html = document.body.getAttribute('data-html') ?? '';
    setHtml(html);
  }, []);

  return (
    <div>
      {/** The real preview */}
      <div
        className={'crossnote markdown-preview ' + className}
        data-for="preview"
        ref={previewElementRef}
        id={id}
      >
        {parse(html)}
      </div>
    </div>
  );
}
