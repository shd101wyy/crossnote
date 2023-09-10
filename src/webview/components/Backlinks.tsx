import React from 'react';
import PreviewContainer from '../containers/preview';

export default function Backlinks() {
  const { backlinks, isLoadingBacklinks } = PreviewContainer.useContainer();

  return (
    <div className="markdown-preview p-[2em]">
      <hr></hr>
      <h2>Backlinks</h2>
      {isLoadingBacklinks ? (
        <div className="loading">Loading...</div>
      ) : (
        <div>
          {backlinks.map(({ note, referenceHtmls }) => {
            return (
              <div className="backlink" key={`backlink-${note.filePath}`}>
                <a className="note" href={note.filePath}>
                  {note.title}
                </a>
                <ul className="references list-disc">
                  {referenceHtmls.map(html => (
                    <li
                      className="reference"
                      key={`reference-${note.filePath}-${html}`}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
