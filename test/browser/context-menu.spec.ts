import * as os from 'os';
import * as path from 'path';
import { expect, Page, test } from '@playwright/test';
import { escape } from 'html-escaper';
import { build } from 'esbuild';
import { startServer, TestServer } from './server';

/**
 * The context menu of the preview is opened by react-contexify, which fades
 * it in and out; `enablePreviewContextMenuAnimation` turns that off
 * (vscode-mpe#2341: the menus of VS Code open at once). These tests run the
 * real menu under the real preview container in a browser — an animation is
 * CSS, which nothing but a browser can show.
 */

type MenuWindow = Window & {
  /** Every class list the menu had, in order. */
  __menuClasses: string[];
};

let server: TestServer;
let harnessJs: string;
let menuCss: string;

test.beforeAll(async () => {
  server = await startServer();
  const { outputFiles } = await build({
    entryPoints: [path.resolve(__dirname, 'context-menu-harness.tsx')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    loader: { '.svg': 'dataurl' },
    // The menu's stylesheet comes out next to the script. Nothing is
    // written, and the folder is outside the repository should that change.
    outdir: path.join(os.tmpdir(), 'crossnote-context-menu-harness'),
    write: false,
  });
  harnessJs =
    outputFiles.find((file) => !file.path.endsWith('.css'))?.text ?? '';
  menuCss = outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
  expect(harnessJs).not.toBe('');
  expect(menuCss).toContain('contexify_willEnter-fade');
});

test.afterAll(async () => {
  await server?.close();
});

/** Every class the menu has had so far. */
const menuClasses = (page: Page) =>
  page.evaluate(() => (window as unknown as MenuWindow).__menuClasses);

/** The classes of an enter or a leave animation among them. */
const animationClasses = (classes: string[]) =>
  classes.filter((name) => /contexify_will(Enter|Leave)/.test(name));

/**
 * Open a page with the menu and right-click the preview, until the menu is
 * shown. The class of its enter animation is gone when the animation is
 * over, so every class the menu has is recorded from before the click.
 */
async function openMenu(page: Page, animation: boolean | undefined) {
  const config = {
    sourceUri: 'file:///tmp/menu.md',
    isVSCode: true,
    ...(animation === undefined
      ? {}
      : { enablePreviewContextMenuAnimation: animation }),
  };
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta id="crossnote-data" data-config="${escape(JSON.stringify(config))}">
    <link rel="stylesheet" href="${server.url}/webview/harness.css">
  </head>
  <body>
    <script src="${server.url}/webview/preview.js"></script>
  </body>
</html>`;
  await page.route(`${server.url}/menu.html`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: html,
    }),
  );
  await page.route(`${server.url}/webview/harness.css`, (route) =>
    route.fulfill({ contentType: 'text/css; charset=utf-8', body: menuCss }),
  );
  await page.route(`${server.url}/webview/preview.js`, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: harnessJs }),
  );
  await page.addInitScript(() => {
    const hostWindow = window as unknown as MenuWindow & {
      acquireVsCodeApi: () => unknown;
    };
    hostWindow.__menuClasses = [];
    hostWindow.acquireVsCodeApi = () => ({
      postMessage: () => undefined,
      getState: () => null,
      setState: () => undefined,
    });
    // The menu is the element that carries the `contexify` class.
    const record = (node: Node) => {
      const element = node as HTMLElement;
      if (element.classList?.contains('contexify')) {
        hostWindow.__menuClasses.push(element.className);
      }
    };
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          record(mutation.target);
        } else {
          for (const node of mutation.addedNodes) {
            record(node);
          }
        }
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  });
  await page.goto(`${server.url}/menu.html`);
  await page.getByText('Text').click({ button: 'right' });
  const menu = page.locator('.contexify[role="menu"]');
  await menu.waitFor({ state: 'visible' });
  return menu;
}

test('the menu fades in and out by default', async ({ page }) => {
  await openMenu(page, undefined);
  expect((await menuClasses(page)).join(' ')).toContain(
    'contexify_willEnter-fade',
  );

  await page.keyboard.press('Escape');
  await page.locator('.contexify[role="menu"]').waitFor({ state: 'detached' });
  expect((await menuClasses(page)).join(' ')).toContain(
    'contexify_willLeave-fade',
  );
});

test('the menu opens and closes at once when its animation is off', async ({
  page,
}) => {
  const menu = await openMenu(page, false);

  // No animation was put on the menu, and none runs.
  expect(animationClasses(await menuClasses(page))).toEqual([]);
  expect(
    await menu.evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');

  // It closes without waiting for an animation that will not come.
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'detached' });
  expect(animationClasses(await menuClasses(page))).toEqual([]);
});

test('the menu fades again when the option is on', async ({ page }) => {
  await openMenu(page, true);
  expect((await menuClasses(page)).join(' ')).toContain(
    'contexify_willEnter-fade',
  );
});
