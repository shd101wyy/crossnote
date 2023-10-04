import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { mdiOpenInNew, mdiPin, mdiPinOutline } from '@mdi/js';
import Icon from '@mdi/react';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { URI, Utils } from 'vscode-uri';
import { Backlink } from '../../notebook';
import PreviewContainer from '../containers/preview';
import { BacklinksOrderDirection, BacklinksOrderRecord } from '../lib/types';

export default function Backlinks() {
  const {
    backlinks: originalBacklinks,
    isLoadingBacklinks,
    backlinksElement,
    refreshBacklinks,
    bindAnchorElementsClickEvent,
    theme,
    config,
    postMessage,
    sourceUri,
  } = PreviewContainer.useContainer();
  const [backlinksOrderRecord] = useState<BacklinksOrderRecord>(
    BacklinksOrderRecord.ModifiedAt,
  );
  const [backlinksOrderDirection] = useState<BacklinksOrderDirection>(
    BacklinksOrderDirection.Desc,
  );
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);

  const totalReferenceCount = useMemo(
    () =>
      backlinks.reduce(
        (acc, { referenceHtmls }) => acc + referenceHtmls.length,
        0,
      ),
    [backlinks],
  );

  useEffect(() => {
    if (!backlinksElement.current || isLoadingBacklinks) {
      return;
    }
    bindAnchorElementsClickEvent(
      Array.from(backlinksElement.current.getElementsByTagName('a')),
    );
  }, [
    backlinks,
    bindAnchorElementsClickEvent,
    backlinksElement,
    isLoadingBacklinks,
  ]);

  useEffect(() => {
    const backlinks = [...originalBacklinks].sort((a, b) => {
      const noteA = a.note;
      const noteB = b.note;

      if (backlinksOrderRecord === BacklinksOrderRecord.CreatedAt) {
        if (backlinksOrderDirection === BacklinksOrderDirection.Asc) {
          return (
            new Date(noteA.config?.createdAt ?? 0).getTime() -
            new Date(noteB.config?.createdAt ?? 0).getTime()
          );
        } else {
          return (
            new Date(noteB.config?.createdAt ?? 0).getTime() -
            new Date(noteA.config?.createdAt ?? 0).getTime()
          );
        }
      } else if (backlinksOrderRecord === BacklinksOrderRecord.ModifiedAt) {
        if (backlinksOrderDirection === BacklinksOrderDirection.Asc) {
          return (
            new Date(noteA.config?.modifiedAt ?? 0).getTime() -
            new Date(noteB.config?.modifiedAt ?? 0).getTime()
          );
        } else {
          return (
            new Date(noteB.config?.modifiedAt ?? 0).getTime() -
            new Date(noteA.config?.modifiedAt ?? 0).getTime()
          );
        }
      }
      return 0;
    });
    setBacklinks(backlinks);
  }, [originalBacklinks, backlinksOrderRecord, backlinksOrderDirection]);

  return (
    <div
      className="markdown-preview p-[2em] pb-48 backlinks relative select-none"
      ref={backlinksElement}
    >
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
                'flex flex-row items-center bg-transparent',
                // isMobile || isMouseOverPreview ? '' : 'hidden',
                // isPresentationMode ? 'hidden' : '',
              )}
              data-theme={theme}
            >
              <div
                className="p-2 cursor-pointer hover:text-primary"
                title='Toggle "Always show backlinks in preview"'
                onClick={() => {
                  postMessage('toggleAlwaysShowBacklinksInPreview', [
                    sourceUri.current,
                    !config.alwaysShowBacklinksInPreview,
                  ]);
                }}
              >
                {config.alwaysShowBacklinksInPreview ? (
                  <Icon className="text-primary" path={mdiPin} size={1}></Icon>
                ) : (
                  <Icon path={mdiPinOutline} size={1}></Icon>
                )}
              </div>

              <div
                className="p-2 cursor-pointer hover:text-primary"
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
                    const href = URI.from({
                      ...noteUri,
                      fragment:
                        typeof line === 'number'
                          ? `L${line}`
                          : noteUri.fragment,
                    }).toString();
                    return (
                      <li
                        className="list-none"
                        key={`reference-${note.filePath}-${html}`}
                      >
                        <div className="inline-flex">
                          <a
                            href={href}
                            className="mr-2 mt-1 text-inherit hover:text-primary"
                            title={href}
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
