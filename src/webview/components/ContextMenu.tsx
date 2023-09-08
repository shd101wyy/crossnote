import $ from 'jquery';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.js';
import 'jquery-contextmenu/dist/jquery.ui.position.min.js';
import React, { useEffect } from 'react';
import WebviewContainer from '../containers/webview';

export default function ContextMenu() {
  const {
    isVSCodeWebExtension,
    postMessage,
    sourceUri,
    previewSyncSource,
  } = WebviewContainer.useContainer();

  /**
   * init contextmenu
   * reference: http://jsfiddle.net/w33z4bo0/1/
   */
  useEffect(() => {
    $['contextMenu']({
      selector: '.preview-container',
      items: {
        ...(isVSCodeWebExtension
          ? {}
          : {
              open_in_browser: {
                name: 'Open in Browser',
                callback: () => postMessage('openInBrowser', [sourceUri]),
              },
              sep1: '---------',
            }),
        html_export: {
          name: 'HTML',
          items: {
            ...(isVSCodeWebExtension
              ? {}
              : {
                  html_offline: {
                    name: 'HTML (offline)',
                    callback: () =>
                      postMessage('htmlExport', [sourceUri, true]),
                  },
                }),
            html_cdn: {
              name: 'HTML (cdn hosted)',
              callback: () => postMessage('htmlExport', [sourceUri, false]),
            },
          },
        },
        ...(isVSCodeWebExtension
          ? {}
          : {
              chrome_export: {
                name: 'Chrome (Puppeteer)',
                items: {
                  chrome_pdf: {
                    name: 'PDF',
                    callback: () =>
                      postMessage('chromeExport', [sourceUri, 'pdf']),
                  },
                  chrome_png: {
                    name: 'PNG',
                    callback: () =>
                      postMessage('chromeExport', [sourceUri, 'png']),
                  },
                  chrome_jpeg: {
                    name: 'JPEG',
                    callback: () =>
                      postMessage('chromeExport', [sourceUri, 'jpeg']),
                  },
                },
              },
            }),
        ...(isVSCodeWebExtension
          ? {}
          : {
              prince_export: {
                name: 'PDF (prince)',
                callback: () => postMessage('princeExport', [sourceUri]),
              },
            }),
        ...(isVSCodeWebExtension
          ? {}
          : {
              ebook_export: {
                name: 'eBook',
                items: {
                  ebook_epub: {
                    name: 'ePub',
                    callback: () =>
                      postMessage('eBookExport', [sourceUri, 'epub']),
                  },
                  ebook_mobi: {
                    name: 'mobi',
                    callback: () =>
                      postMessage('eBookExport', [sourceUri, 'mobi']),
                  },
                  ebook_pdf: {
                    name: 'PDF',
                    callback: () =>
                      postMessage('eBookExport', [sourceUri, 'pdf']),
                  },
                  ebook_html: {
                    name: 'HTML',
                    callback: () =>
                      postMessage('eBookExport', [sourceUri, 'html']),
                  },
                },
              },
            }),
        ...(isVSCodeWebExtension
          ? {}
          : {
              pandoc_export: {
                name: 'Pandoc',
                callback: () => postMessage('pandocExport', [sourceUri]),
              },
            }),
        ...(isVSCodeWebExtension
          ? {}
          : {
              save_as_markdown: {
                name: 'Save as Markdown',
                callback: () => postMessage('markdownExport', [sourceUri]),
              },
            }),
        ...(isVSCodeWebExtension
          ? {}
          : {
              sep2: '---------',
              image_helper: {
                name: 'Image Helper',
                callback: () => window['$']('#image-helper-view').modal(),
              },
            }),
        sep3: '---------',
        sync_source: {
          name: 'Sync Source',
          callback: () => previewSyncSource(),
        },
        seq4: '---------',
        preview_theme: {
          name: 'Preview Theme',
          items: {
            atom_dark_css: {
              name: 'atom-dark.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'atom-dark.css']);
              },
            },
            atom_light_css: {
              name: 'atom-light.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'atom-light.css']);
              },
            },
            atom_material_css: {
              name: 'atom-material.css',
              callback: () => {
                postMessage('setPreviewTheme', [
                  sourceUri,
                  'atom-material.css',
                ]);
              },
            },
            github_dark_css: {
              name: 'github-dark.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'github-dark.css']);
              },
            },
            github_light_css: {
              name: 'github-light.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'github-light.css']);
              },
            },
            gothic_css: {
              name: 'gothic.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'gothic.css']);
              },
            },
            medium_css: {
              name: 'medium.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'medium.css']);
              },
            },
            monokai_css: {
              name: 'monokai.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'monokai.css']);
              },
            },
            newsprint_css: {
              name: 'newsprint.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'newsprint.css']);
              },
            },
            night_css: {
              name: 'night.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'night.css']);
              },
            },
            none_css: {
              name: 'none.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'none.css']);
              },
            },
            one_dark_css: {
              name: 'one-dark.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'one-dark.css']);
              },
            },
            one_light_css: {
              name: 'one-light.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'one-light.css']);
              },
            },
            solarized_dark_css: {
              name: 'solarized-dark.css',
              callback: () => {
                postMessage('setPreviewTheme', [
                  sourceUri,
                  'solarized-dark.css',
                ]);
              },
            },
            solarized_light_css: {
              name: 'solarized-light.css',
              callback: () => {
                postMessage('setPreviewTheme', [
                  sourceUri,
                  'solarized-light.css',
                ]);
              },
            },
            vue_css: {
              name: 'vue.css',
              callback: () => {
                postMessage('setPreviewTheme', [sourceUri, 'vue.css']);
              },
            },
          },
        },
      },
    });
  }, []);

  return <div></div>;
}
