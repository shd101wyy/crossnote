import {
  mdiCancel,
  mdiExport,
  mdiExportVariant,
  mdiImageOutline,
  mdiInformationOutline,
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
import PreviewContainer from '../containers/preview';

export default function ContextMenu() {
  const {
    postMessage,
    sourceUri,
    contextMenuId,
    isVSCodeWebExtension,
    setShowImageHelper,
    previewSyncSource,
  } = PreviewContainer.useContainer();

  const handleItemClick = useCallback(
    ({ id }: ItemParams<unknown, unknown>) => {
      console.log(id);
      switch (id) {
        case 'open-in-browser': {
          postMessage('openInBrowser', [sourceUri.current]);
          break;
        }
        case 'export-html-offline': {
          postMessage('htmlExport', [sourceUri.current, true]);
          break;
        }
        case 'export-html-cdn': {
          postMessage('htmlExport', [sourceUri.current, false]);
          break;
        }
        case 'export-chrome-pdf': {
          postMessage('chromeExport', [sourceUri.current, 'pdf']);
          break;
        }
        case 'export-chrome-png': {
          postMessage('chromeExport', [sourceUri.current, 'png']);
          break;
        }
        case 'export-chrome-jpeg': {
          postMessage('chromeExport', [sourceUri.current, 'jpeg']);
          break;
        }
        case 'export-prince': {
          postMessage('princeExport', [sourceUri.current]);
          break;
        }
        case 'export-ebook-epub': {
          postMessage('eBookExport', [sourceUri.current, 'epub']);
          break;
        }
        case 'export-ebook-mobi': {
          postMessage('eBookExport', [sourceUri.current, 'mobi']);
          break;
        }
        case 'export-ebook-pdf': {
          postMessage('eBookExport', [sourceUri.current, 'pdf']);
          break;
        }
        case 'export-ebook-html': {
          postMessage('eBookExport', [sourceUri.current, 'html']);
          break;
        }
        case 'export-pandoc': {
          postMessage('pandocExport', [sourceUri.current]);
          break;
        }
        case 'export-markdown': {
          postMessage('markdownExport', [sourceUri.current]);
          break;
        }
        case 'open-image-helper': {
          console.log('open-image-helper');
          setShowImageHelper(true);
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
            sourceUri.current,
            `${id.replace('select-preview-theme-', '')}.css`,
          ]);
          break;
        }
        case 'select-code-block-theme-auto':
        case 'select-code-block-theme-default':
        case 'select-code-block-theme-atom-dark':
        case 'select-code-block-theme-atom-light':
        case 'select-code-block-theme-atom-material':
        case 'select-code-block-theme-coy':
        case 'select-code-block-theme-darcula':
        case 'select-code-block-theme-dark':
        case 'select-code-block-theme-funky':
        case 'select-code-block-theme-github':
        case 'select-code-block-theme-hopscotch':
        case 'select-code-block-theme-monokai':
        case 'select-code-block-theme-okaidia':
        case 'select-code-block-theme-one-dark':
        case 'select-code-block-theme-one-light':
        case 'select-code-block-theme-pen-paper-coffee':
        case 'select-code-block-theme-pojoaque':
        case 'select-code-block-theme-solarized-dark':
        case 'select-code-block-theme-solarized-light':
        case 'select-code-block-theme-twilight':
        case 'select-code-block-theme-vue':
        case 'select-code-block-theme-vs':
        case 'select-code-block-theme-xonokai': {
          postMessage('setCodeBlockTheme', [
            sourceUri.current,
            `${id.replace('select-code-block-theme-', '')}.css`,
          ]);
          break;
        }
        case 'select-revealjs-theme-beige':
        case 'select-revealjs-theme-black':
        case 'select-revealjs-theme-blood':
        case 'select-revealjs-theme-league':
        case 'select-revealjs-theme-moon':
        case 'select-revealjs-theme-night':
        case 'select-revealjs-theme-none':
        case 'select-revealjs-theme-serif':
        case 'select-revealjs-theme-simple':
        case 'select-revealjs-theme-sky':
        case 'select-revealjs-theme-solarized':
        case 'select-revealjs-theme-white': {
          postMessage('setRevealjsTheme', [
            sourceUri.current,
            `${id.replace('select-revealjs-theme-', '')}.css`,
          ]);
          break;
        }
        case 'open-changelog': {
          postMessage('openChangelog');
          break;
        }
        case 'open-issues': {
          postMessage('openIssues');
          break;
        }
        case 'open-sponsors': {
          postMessage('openSponsors');
          break;
        }
        default:
          break;
      }
    },
    [postMessage, previewSyncSource, setShowImageHelper, sourceUri],
  );

  return (
    <div>
      <Menu id={contextMenuId} className="text-sm">
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
            <Item id="export-html-offline" onClick={handleItemClick}>
              {'HTML (offline)'}
            </Item>
            <Item id="export-html-cdn" onClick={handleItemClick}>
              {'HTML (cdn hosted)'}
            </Item>
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
            <Item id="export-chrome-pdf" onClick={handleItemClick}>
              PDF
            </Item>
            <Item id="export-chrome-png" onClick={handleItemClick}>
              PNG
            </Item>
            <Item id="export-chrome-jpeg" onClick={handleItemClick}>
              JPEG
            </Item>
          </Submenu>
        )}
        {!isVSCodeWebExtension && (
          <Item id="export-prince" onClick={handleItemClick}>
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
            <Item id="export-ebook-epub" onClick={handleItemClick}>
              ePub
            </Item>
            <Item id="export-ebook-mobi" onClick={handleItemClick}>
              Mobi
            </Item>
            <Item id="export-ebook-pdf" onClick={handleItemClick}>
              PDF
            </Item>
            <Item id="export-ebook-html" onClick={handleItemClick}>
              HTML
            </Item>
          </Submenu>
        )}
        {!isVSCodeWebExtension && (
          <Item id="export-pandoc" onClick={handleItemClick}>
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
          <Item id="export-markdown" onClick={handleItemClick}>
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
            <Item id="open-image-helper" onClick={handleItemClick}>
              <span className="inline-flex flex-row items-center">
                <Icon path={mdiImageOutline} size={0.8} className="mr-2"></Icon>
                Image Helper
              </span>
            </Item>
            <Separator></Separator>
          </>
        )}
        <Item id="sync-source" onClick={handleItemClick}>
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
            <Item
              id="select-preview-theme-atom-light"
              onClick={handleItemClick}
            >
              atom-light.css
            </Item>
            <Item
              id="select-preview-theme-github-light"
              onClick={handleItemClick}
            >
              github-light.css
            </Item>
            <Item id="select-preview-theme-gothic" onClick={handleItemClick}>
              gothic.css
            </Item>
            <Item id="select-preview-theme-medium" onClick={handleItemClick}>
              medium.css
            </Item>
            <Item id="select-preview-theme-newsprint" onClick={handleItemClick}>
              newsprint.css
            </Item>
            <Item id="select-preview-theme-one-light" onClick={handleItemClick}>
              one-light.css
            </Item>
            <Item
              id="select-preview-theme-solarized-light"
              onClick={handleItemClick}
            >
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
            <Item id="select-preview-theme-atom-dark" onClick={handleItemClick}>
              atom-dark.css
            </Item>
            <Item
              id="select-preview-theme-atom-material"
              onClick={handleItemClick}
            >
              atom-material.css
            </Item>
            <Item
              id="select-preview-theme-github-dark"
              onClick={handleItemClick}
            >
              github-dark.css
            </Item>
            <Item id="select-preview-theme-monokai" onClick={handleItemClick}>
              monokai.css
            </Item>
            <Item id="select-preview-theme-night" onClick={handleItemClick}>
              night.css
            </Item>
            <Item id="select-preview-theme-one-dark" onClick={handleItemClick}>
              one-dark.css
            </Item>
            <Item
              id="select-preview-theme-solarized-dark"
              onClick={handleItemClick}
            >
              solarized-dark.css
            </Item>
          </Submenu>
          <Item id="select-preview-theme-none" onClick={handleItemClick}>
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              None
            </span>
          </Item>
        </Submenu>
        <Submenu
          label={
            <span className="inline-flex flex-row items-center">
              <Icon
                path={mdiPaletteOutline}
                size={0.8}
                className="mr-2 invisible"
              ></Icon>
              Code Block Theme
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
            <Item
              id="select-code-block-theme-default"
              onClick={handleItemClick}
            >
              default.css
            </Item>
            <Item
              id="select-code-block-theme-atom-light"
              onClick={handleItemClick}
            >
              atom-light.css
            </Item>
            <Item id="select-code-block-theme-coy" onClick={handleItemClick}>
              coy.css
            </Item>
            <Item id="select-code-block-theme-funky" onClick={handleItemClick}>
              funky.css
            </Item>
            <Item id="select-code-block-theme-github" onClick={handleItemClick}>
              github.css
            </Item>
            <Item
              id="select-code-block-theme-one-light"
              onClick={handleItemClick}
            >
              one-light.css
            </Item>
            <Item
              id="select-code-block-theme-pen-paper-coffee"
              onClick={handleItemClick}
            >
              pen-paper-coffee.css
            </Item>
            <Item
              id="select-code-block-theme-solarized-light"
              onClick={handleItemClick}
            >
              solarized-light.css
            </Item>
            <Item id="select-code-block-theme-vue" onClick={handleItemClick}>
              vue.css
            </Item>
            <Item id="select-code-block-theme-vs" onClick={handleItemClick}>
              vs.css
            </Item>
          </Submenu>
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon path={mdiMoonFull} size={0.8} className="mr-2"></Icon>
                Dark
              </span>
            }
          >
            <Item
              id="select-code-block-theme-atom-dark"
              onClick={handleItemClick}
            >
              atom-dark.css
            </Item>
            <Item
              id="select-code-block-theme-atom-material"
              onClick={handleItemClick}
            >
              atom-material.css
            </Item>
            <Item
              id="select-code-block-theme-darcula"
              onClick={handleItemClick}
            >
              darcula.css
            </Item>
            <Item id="select-code-block-theme-dark" onClick={handleItemClick}>
              dark.css
            </Item>
            <Item
              id="select-code-block-theme-hopscotch"
              onClick={handleItemClick}
            >
              hopscotch.css
            </Item>
            <Item
              id="select-code-block-theme-monokai"
              onClick={handleItemClick}
            >
              monokai.css
            </Item>
            <Item
              id="select-code-block-theme-okaidia"
              onClick={handleItemClick}
            >
              okaidia.css
            </Item>
            <Item
              id="select-code-block-theme-one-dark"
              onClick={handleItemClick}
            >
              one-dark.css
            </Item>
            <Item
              id="select-code-block-theme-pojoaque"
              onClick={handleItemClick}
            >
              pojoaque.css
            </Item>
            <Item
              id="select-code-block-theme-solarized-dark"
              onClick={handleItemClick}
            >
              solarized-dark.css
            </Item>
            <Item
              id="select-code-block-theme-twilight"
              onClick={handleItemClick}
            >
              twilight.css
            </Item>
            <Item
              id="select-code-block-theme-xonokai"
              onClick={handleItemClick}
            >
              xonokai.css
            </Item>
          </Submenu>
          <Item id="select-code-block-theme-auto" onClick={handleItemClick}>
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              Auto
            </span>
          </Item>
        </Submenu>
        <Submenu
          label={
            <span className="inline-flex flex-row items-center">
              <Icon
                path={mdiPaletteOutline}
                size={0.8}
                className="mr-2 invisible"
              ></Icon>
              Reveal.js Theme
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
            <Item id="select-revealjs-theme-beige" onClick={handleItemClick}>
              beige.css
            </Item>
            <Item id="select-revealjs-theme-serif" onClick={handleItemClick}>
              serif.css
            </Item>
            <Item id="select-revealjs-theme-simple" onClick={handleItemClick}>
              simple.css
            </Item>
            <Item id="select-revealjs-theme-sky" onClick={handleItemClick}>
              sky.css
            </Item>
            <Item
              id="select-revealjs-theme-solarized"
              onClick={handleItemClick}
            >
              solarized.css
            </Item>
            <Item id="select-revealjs-theme-white" onClick={handleItemClick}>
              white.css
            </Item>
          </Submenu>
          <Submenu
            label={
              <span className="inline-flex flex-row items-center">
                <Icon path={mdiMoonFull} size={0.8} className="mr-2"></Icon>
                Dark
              </span>
            }
          >
            <Item id="select-revealjs-theme-black" onClick={handleItemClick}>
              black.css
            </Item>
            <Item id="select-revealjs-theme-blood" onClick={handleItemClick}>
              blood.css
            </Item>
            <Item id="select-revealjs-theme-league" onClick={handleItemClick}>
              league.css
            </Item>
            <Item id="select-revealjs-theme-moon" onClick={handleItemClick}>
              moon.css
            </Item>
            <Item id="select-revealjs-theme-night" onClick={handleItemClick}>
              night.css
            </Item>
          </Submenu>
          <Item id="select-revealjs-theme-none" onClick={handleItemClick}>
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              None
            </span>
          </Item>
        </Submenu>
        <Separator></Separator>
        <Submenu
          label={
            <span className="inline-flex flex-row items-center">
              <Icon
                path={mdiInformationOutline}
                size={0.8}
                className="mr-2"
              ></Icon>
              About
            </span>
          }
        >
          <Item id="open-changelog" onClick={handleItemClick}>
            Change Log
          </Item>
          <Item id="open-issues" onClick={handleItemClick}>
            Feature Requests or Bug Reports
          </Item>
          <Item id="open-sponsors" onClick={handleItemClick}>
            Sponsor This Project 😊
          </Item>
        </Submenu>
      </Menu>
    </div>
  );
}
