import {
  mdiCancel,
  mdiExport,
  mdiExportVariant,
  mdiImageOutline,
  mdiMoonFull,
  mdiMoonNew,
  mdiOpenInNew,
  mdiPaletteOutline,
  mdiSync,
} from '@mdi/js';
import Icon from '@mdi/react';
import React, { useCallback } from 'react';
import { Item, ItemParams, Menu, Separator, Submenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';
import WebviewContainer from '../containers/webview';

export default function ContextMenu() {
  const {
    postMessage,
    sourceUri,
    contextMenuId,
    isVSCodeWebExtension,
    previewSyncSource,
  } = WebviewContainer.useContainer();

  const handleItemClick = useCallback(
    ({ id }: ItemParams<unknown, unknown>) => {
      switch (id) {
        case 'open-in-browser': {
          postMessage('openInBrowser', [sourceUri]);
          break;
        }
        case 'export-html-offline': {
          postMessage('htmlExport', [sourceUri, true]);
          break;
        }
        case 'export-html-cdn': {
          postMessage('htmlExport', [sourceUri, false]);
          break;
        }
        case 'export-chrome-pdf': {
          postMessage('chromeExport', [sourceUri, 'pdf']);
          break;
        }
        case 'export-chrome-png': {
          postMessage('chromeExport', [sourceUri, 'png']);
          break;
        }
        case 'export-chrome-jpeg': {
          postMessage('chromeExport', [sourceUri, 'jpeg']);
          break;
        }
        case 'export-prince': {
          postMessage('princeExport', [sourceUri]);
          break;
        }
        case 'export-ebook-epub': {
          postMessage('eBookExport', [sourceUri, 'epub']);
          break;
        }
        case 'export-ebook-mobi': {
          postMessage('eBookExport', [sourceUri, 'mobi']);
          break;
        }
        case 'export-ebook-pdf': {
          postMessage('eBookExport', [sourceUri, 'pdf']);
          break;
        }
        case 'export-ebook-html': {
          postMessage('eBookExport', [sourceUri, 'html']);
          break;
        }
        case 'export-pandoc': {
          postMessage('pandocExport', [sourceUri]);
          break;
        }
        case 'export-markdown': {
          postMessage('markdownExport', [sourceUri]);
          break;
        }
        case 'open-image-helper': {
          window['$']('#image-helper-view').modal();
          break;
        }
        case 'sync-source': {
          previewSyncSource();
          break;
        }
        case 'select-preview-theme-atom-dark':
        case 'select-preview-theme-atom-light':
        case 'select-preview-theme-atom-material':
        case 'select-preview-theme-github-dark':
        case 'select-preview-theme-github-light':
        case 'select-preview-theme-gothic':
        case 'select-preview-theme-medium':
        case 'select-preview-theme-monokai':
        case 'select-preview-theme-newsprint':
        case 'select-preview-theme-night':
        case 'select-preview-theme-none':
        case 'select-preview-theme-one-dark':
        case 'select-preview-theme-one-light':
        case 'select-preview-theme-solarized-dark':
        case 'select-preview-theme-solarized-light':
        case 'select-preview-theme-vue': {
          postMessage('setPreviewTheme', [
            sourceUri,
            `${id.replace('select-preview-theme-', '')}.css`,
          ]);
          break;
        }

        default:
          break;
      }
    },
    [postMessage, previewSyncSource, sourceUri],
  );

  return (
    <div>
      <Menu id={contextMenuId}>
        {!isVSCodeWebExtension && (
          <>
            <Item id="open-in-browser" onClick={handleItemClick}>
              <Icon path={mdiOpenInNew} size={0.8} className="mr-2"></Icon> Open
              in Browser
            </Item>
            <Separator></Separator>
          </>
        )}
        {!isVSCodeWebExtension && (
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon
                  path={mdiExportVariant}
                  size={0.8}
                  className="mr-2"
                ></Icon>
                HTML
              </span>
            }
          >
            <Item id="export-html-offline">{'HTML (offline)'}</Item>
            <Item id="export-html-cdn">{'HTML (cdn hosted)'}</Item>
          </Submenu>
        )}
        {!isVSCodeWebExtension && (
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon
                  path={mdiExport}
                  size={0.8}
                  className="mr-2 invisible"
                ></Icon>
                Chrome (Puppeteer)
              </span>
            }
          >
            <Item id="export-chrome-pdf">PDF</Item>
            <Item id="export-chrome-png">PNG</Item>
            <Item id="export-chrome-jpeg">JPEG</Item>
          </Submenu>
        )}
        {!isVSCodeWebExtension && (
          <Item id="export-prince">
            <span className="inline-flex flex-row items-center">
              <Icon
                path={mdiExportVariant}
                size={0.8}
                className="mr-2 invisible"
              ></Icon>
              PDF (Prince)
            </span>
          </Item>
        )}
        {!isVSCodeWebExtension && (
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon
                  path={mdiExport}
                  size={0.8}
                  className="mr-2 invisible"
                ></Icon>
                eBook
              </span>
            }
          >
            <Item id="export-ebook-epub">ePub</Item>
            <Item id="export-ebook-mobi">mobi</Item>
            <Item id="export-ebook-pdf">PDF</Item>
            <Item id="export-ebook-html">HTML</Item>
          </Submenu>
        )}
        {!isVSCodeWebExtension && (
          <Item id="export-pandoc">
            <span className="inline-flex flex-row items-center">
              <Icon
                path={mdiExportVariant}
                size={0.8}
                className="mr-2 invisible"
              ></Icon>
              Pandoc
            </span>
          </Item>
        )}
        {!isVSCodeWebExtension && (
          <Item id="export-markdown">
            <span className="inline-flex flex-row items-center">
              <Icon
                path={mdiExportVariant}
                size={0.8}
                className="mr-2 invisible"
              ></Icon>
              Save as Markdown
            </span>
          </Item>
        )}
        {!isVSCodeWebExtension && (
          <>
            <Separator></Separator>
            <Item id="open-image-helper">
              <span className="inline-flex flex-row items-center">
                <Icon path={mdiImageOutline} size={0.8} className="mr-2"></Icon>
                Image Helper
              </span>
            </Item>
          </>
        )}
        <Separator></Separator>
        <Item id="sync-source">
          <span className="inline-flex flex-row items-center">
            <Icon path={mdiSync} size={0.8} className="mr-2"></Icon>
            Sync Source
          </span>
        </Item>
        <Separator></Separator>
        <Submenu
          label={
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiPaletteOutline} size={0.8} className="mr-2"></Icon>
              Preview Theme
            </span>
          }
        >
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon path={mdiMoonNew} size={0.8} className="mr-2"></Icon>
                Light
              </span>
            }
          >
            <Item id="select-preview-theme-atom-light">atom-light.css</Item>
            <Item id="select-preview-theme-github-light">github-light.css</Item>
            <Item id="select-preview-theme-gothic">gothic.css</Item>
            <Item id="select-preview-theme-medium">medium.css</Item>
            <Item id="select-preview-theme-newsprint">newsprint.css</Item>
            <Item id="select-preview-theme-one-light">one-light.css</Item>
            <Item id="select-preview-theme-solarized-light">
              solarized-light.css
            </Item>
            <Item id="select-preview-theme-vue">vue.css</Item>
          </Submenu>
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon path={mdiMoonFull} size={0.8} className="mr-2"></Icon>
                Dark
              </span>
            }
          >
            <Item id="select-preview-theme-atom-dark">atom-dark.css</Item>
            <Item id="select-preview-theme-atom-material">
              atom-material.css
            </Item>
            <Item id="select-preview-theme-github-dark">github-dark.css</Item>
            <Item id="select-preview-theme-monokai">monokai.css</Item>
            <Item id="select-preview-theme-night">night.css</Item>
            <Item id="select-preview-theme-one-dark">one-dark.css</Item>
            <Item id="select-preview-theme-solarized-dark">
              solarized-dark.css
            </Item>
          </Submenu>
          <Item id="select-preview-theme-none">
            {' '}
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              None
            </span>
          </Item>
        </Submenu>
      </Menu>
    </div>
  );
}
