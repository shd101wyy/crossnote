import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { mdiOpenInNew } from '@mdi/js';
import Icon from '@mdi/react';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { URI, Utils } from 'vscode-uri';
import PreviewContainer from '../containers/preview';

export default function Backlinks() {
  const {
    backlinks,
    isLoadingBacklinks,
    backlinksElement,
    refreshBacklinks,
    bindAnchorElementsClickEvent,
  } = PreviewContainer.useContainer();

  const totalReferenceCount = useMemo(
    () =>
      backlinks.reduce(
        (acc, { referenceHtmls }) => acc + referenceHtmls.length,
        0,
      ),
    [backlinks],
  );

  useEffect(() => {
    bindAnchorElementsClickEvent();
  }, [backlinks, bindAnchorElementsClickEvent]);

  return (
    <div className="markdown-preview p-[2em]" ref={backlinksElement}>
      <hr></hr>
      <div className="flex flex-row items-center justify-between mb-4">
        {isLoadingBacklinks ? (
          <strong>Backlinks</strong>
        ) : (
          <>
            <strong>
              <span className="font-light">{totalReferenceCount}</span>{' '}
              Backlinks
            </strong>
            <div
              className={classNames(
                'flex flex-row items-center',
                // isMobile || isMouseOverPreview ? '' : 'hidden',
                // isPresentationMode ? 'hidden' : '',
              )}
            >
              {/*
              <div className="p-2 cursor-pointer hover:scale-105">
                <FunnelIcon className="w-5 h-5"></FunnelIcon>
              </div>
              */}
              <div
                className="p-2 cursor-pointer hover:scale-105"
                onClick={() => refreshBacklinks(true)}
                title="Refresh backlinks"
              >
                <ArrowPathIcon className="w-5 h-5"></ArrowPathIcon>
              </div>
            </div>
          </>
        )}
      </div>
      {isLoadingBacklinks ? (
        <div className="loading">Loading...</div>
      ) : (
        <div>
          {backlinks.map(({ note, referenceHtmls, references }) => {
            if (!note.notebookPath || !note.filePath) {
              return;
            }
            const noteUri = Utils.joinPath(
              URI.from(note.notebookPath),
              note.filePath,
            );
            return (
              <div className="backlink" key={`backlink-${note.filePath}`}>
                <a
                  className="note"
                  href={noteUri.toString()}
                  title={note.filePath}
                >
                  {note.title}
                </a>
                <ul className="list-disc">
                  {referenceHtmls.map((html, index) => {
                    const reference = references[index];
                    const line = (reference.parentToken?.map ??
                      reference.token?.map ??
                      [])[0];
                    if (!note.notebookPath || !note.filePath) {
                      return;
                    }
                    return (
                      <li
                        className="list-none"
                        key={`reference-${note.filePath}-${html}`}
                      >
                        <div className="inline-flex">
                          <a
                            href={URI.from({
                              ...noteUri,
                              fragment:
                                typeof line === 'number'
                                  ? `L${line}`
                                  : noteUri.fragment,
                            }).toString()}
                            className="mr-2 mt-1 text-inherit hover:scale-110"
                          >
                            <Icon path={mdiOpenInNew} size={0.8}></Icon>
                          </a>
                          <div dangerouslySetInnerHTML={{ __html: html }}></div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
