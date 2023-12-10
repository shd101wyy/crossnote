import {
  mdiCancel,
  mdiExportVariant,
  mdiImageOutline,
  mdiInformationOutline,
  mdiMoonFull,
  mdiMoonNew,
  mdiOpenInNew,
  mdiPaletteOutline,
  mdiPencil,
  mdiSpaOutline,
  mdiSync,
} from '@mdi/js';
import Icon from '@mdi/react';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { Item, ItemParams, Menu, Separator, Submenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';
import PreviewContainer from '../containers/preview';

export default function ContextMenu() {
  const {
    config,
    contextMenuId,
    isVSCode,
    isVSCodeWebExtension,
    highlightElementBeingEdited,
    postMessage,
    previewSyncSource,
    setHighlightElementBeingEdited,
    setMarkdownEditorExpanded,
    setShowImageHelper,
    sourceUri,
    theme,
    isPresentationMode,
    enablePreviewZenMode,
  } = PreviewContainer.useContainer();

  const handleItemClick = useCallback(
    ({ id }: ItemParams<unknown, unknown>) => {
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
        case 'toggle-zen-mode': {
          postMessage('togglePreviewZenMode', [sourceUri.current]);
          break;
        }
        case 'open-image-helper': {
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
        case 'select-code-block-theme-github-dark':
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
        case 'open-external-editor': {
          postMessage('openExternalEditor', [sourceUri.current]);
          break;
        }
        case 'open-documentation': {
          postMessage('openDocumentation');
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
    <div data-theme={theme} className="select-none">
      <Menu id={contextMenuId} theme={theme === 'dark' ? 'dark' : undefined}>
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
                Export
              </span>
            }
          >
            <Submenu
              label={
                <span className="inline-flex flex-row items-center">HTML</span>
              }
            >
              <Item id="export-html-offline" onClick={handleItemClick}>
                {'HTML (offline)'}
              </Item>
              <Item id="export-html-cdn" onClick={handleItemClick}>
                {'HTML (cdn hosted)'}
              </Item>
            </Submenu>
            <Submenu
              label={
                <span className="inline-flex flex-row items-center">
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
            <Item id="export-prince" onClick={handleItemClick}>
              <span className="inline-flex flex-row items-center">
                PDF (Prince)
              </span>
            </Item>
            <Submenu
              label={
                <span className="inline-flex flex-row items-center">eBook</span>
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
            <Item id="export-pandoc" onClick={handleItemClick}>
              <span className="inline-flex flex-row items-center">Pandoc</span>
            </Item>
            <Item id="export-markdown" onClick={handleItemClick}>
              <span className="inline-flex flex-row items-center">
                Save as Markdown
              </span>
            </Item>
          </Submenu>
        )}
        {!isVSCodeWebExtension && <Separator></Separator>}
        <Submenu
          label={
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiPencil} size={0.8} className="mr-2"></Icon>
              Edit Markdown
            </span>
          }
        >
          <Item id="open-external-editor" onClick={handleItemClick}>
            <span>
              {isVSCode ? 'Open VS Code Editor' : 'Open External Editor'}
            </span>
          </Item>
          {!isPresentationMode && (
            <Item
              id="open-in-preview-editor"
              onClick={() => {
                const finalLineElement = document.querySelector('.final-line');
                if (finalLineElement) {
                  if (
                    highlightElementBeingEdited &&
                    highlightElementBeingEdited !== finalLineElement
                  ) {
                    highlightElementBeingEdited.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'start', // horizontal
                      block: 'center', // vertical
                    });
                  } else {
                    setMarkdownEditorExpanded(true);
                    setHighlightElementBeingEdited(
                      finalLineElement as HTMLElement,
                    );
                  }
                }
              }}
            >
              <span>Open In-preview Editor </span>
            </Item>
          )}
        </Submenu>
        <Separator></Separator>
        <Item id="toggle-zen-mode" onClick={handleItemClick}>
          <span
            className={classNames(
              'inline-flex flex-row items-center',
              enablePreviewZenMode ? 'text-primary font-bold' : '',
            )}
          >
            <Icon path={mdiSpaOutline} size={0.8} className="mr-2"></Icon>
            Zen Mode
          </span>
        </Item>
        <Separator></Separator>
        {!isVSCodeWebExtension && (
          <>
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
              <span
                className={
                  config.previewTheme === 'atom-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                atom-light.css
              </span>
            </Item>
            <Item
              id="select-preview-theme-github-light"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.previewTheme === 'github-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                github-light.css
              </span>
            </Item>
            <Item id="select-preview-theme-gothic" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'gothic.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                gothic.css
              </span>
            </Item>
            <Item id="select-preview-theme-medium" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'medium.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                medium.css
              </span>
            </Item>
            <Item id="select-preview-theme-newsprint" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'newsprint.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                newsprint.css
              </span>
            </Item>
            <Item id="select-preview-theme-one-light" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'one-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                one-light.css
              </span>
            </Item>
            <Item
              id="select-preview-theme-solarized-light"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.previewTheme === 'solarized-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                solarized-light.css
              </span>
            </Item>
            <Item id="select-preview-theme-vue" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'vue.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                vue.css
              </span>
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
            <Item id="select-preview-theme-atom-dark" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'atom-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                atom-dark.css
              </span>
            </Item>
            <Item
              id="select-preview-theme-atom-material"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.previewTheme === 'atom-material.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                atom-material.css
              </span>
            </Item>
            <Item
              id="select-preview-theme-github-dark"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.previewTheme === 'github-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                github-dark.css
              </span>
            </Item>
            <Item id="select-preview-theme-monokai" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'monokai.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                monokai.css
              </span>
            </Item>
            <Item id="select-preview-theme-night" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'night.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                night.css
              </span>
            </Item>
            <Item id="select-preview-theme-one-dark" onClick={handleItemClick}>
              <span
                className={
                  config.previewTheme === 'one-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                one-dark.css
              </span>
            </Item>
            <Item
              id="select-preview-theme-solarized-dark"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.previewTheme === 'solarized-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                solarized-dark.css
              </span>
            </Item>
          </Submenu>
          <Item id="select-preview-theme-none" onClick={handleItemClick}>
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              <span
                className={
                  config.previewTheme === 'none.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                None
              </span>
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
              <span
                className={
                  config.codeBlockTheme === 'default.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                default.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-atom-light"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'atom-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                atom-light.css
              </span>
            </Item>
            <Item id="select-code-block-theme-coy" onClick={handleItemClick}>
              <span
                className={
                  config.codeBlockTheme === 'coy.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                coy.css
              </span>
            </Item>
            <Item id="select-code-block-theme-funky" onClick={handleItemClick}>
              <span
                className={
                  config.codeBlockTheme === 'funky.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                funky.css
              </span>
            </Item>
            <Item id="select-code-block-theme-github" onClick={handleItemClick}>
              <span
                className={
                  config.codeBlockTheme === 'github.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                github.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-one-light"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'one-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                one-light.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-pen-paper-coffee"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'pen-paper-coffee.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                pen-paper-coffee.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-solarized-light"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'solarized-light.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                solarized-light.css
              </span>
            </Item>
            <Item id="select-code-block-theme-vue" onClick={handleItemClick}>
              <span
                className={
                  config.codeBlockTheme === 'vue.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                vue.css
              </span>
            </Item>
            <Item id="select-code-block-theme-vs" onClick={handleItemClick}>
              <span
                className={
                  config.codeBlockTheme === 'vs.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                vs.css
              </span>
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
              <span
                className={
                  config.codeBlockTheme === 'atom-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                atom-dark.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-atom-material"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'atom-material.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                atom-material.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-darcula"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'darcula.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                default.css
              </span>
            </Item>
            <Item id="select-code-block-theme-dark" onClick={handleItemClick}>
              <span
                className={
                  config.codeBlockTheme === 'dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                dark.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-github-dark"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'github-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                github-dark.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-hopscotch"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'hopscotch.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                hopscotch.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-monokai"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'monokai.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                monokai.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-okaidia"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'okaidia.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                okaidia.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-one-dark"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'one-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                one-dark.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-pojoaque"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'pojoaque.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                pojoaque.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-solarized-dark"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'solarized-dark.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                solarized-dark.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-twilight"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'twilight.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                twilight.css
              </span>
            </Item>
            <Item
              id="select-code-block-theme-xonokai"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.codeBlockTheme === 'xonokai.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                xonokai.css
              </span>
            </Item>
          </Submenu>
          <Item id="select-code-block-theme-auto" onClick={handleItemClick}>
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              <span
                className={
                  config.codeBlockTheme === 'auto.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                Auto
              </span>
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
              <span
                className={
                  config.revealjsTheme === 'beige.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                beige.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-serif" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'serif.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                serif.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-simple" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'simple.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                simple.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-sky" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'sky.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                sky.css
              </span>
            </Item>
            <Item
              id="select-revealjs-theme-solarized"
              onClick={handleItemClick}
            >
              <span
                className={
                  config.revealjsTheme === 'solarized.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                solarized.css
              </span>{' '}
            </Item>
            <Item id="select-revealjs-theme-white" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'white.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                white.css
              </span>
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
              <span
                className={
                  config.revealjsTheme === 'black.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                black.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-blood" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'blood.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                blood.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-league" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'league.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                league.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-moon" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'moon.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                moon.css
              </span>
            </Item>
            <Item id="select-revealjs-theme-night" onClick={handleItemClick}>
              <span
                className={
                  config.revealjsTheme === 'night.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                night.css
              </span>
            </Item>
          </Submenu>
          <Item id="select-revealjs-theme-none" onClick={handleItemClick}>
            <span className="inline-flex flex-row items-center">
              <Icon path={mdiCancel} size={0.8} className="mr-2"></Icon>
              <span
                className={
                  config.revealjsTheme === 'none.css'
                    ? 'text-primary font-bold'
                    : ''
                }
              >
                None
              </span>
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
          <Item id="open-documentation" onClick={handleItemClick}>
            Documentation
          </Item>
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
