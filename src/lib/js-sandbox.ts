import releaseSyncVariant from '@jitl/quickjs-singlefile-cjs-release-sync';
import {
  newQuickJSWASMModuleFromVariant,
  QuickJSContext,
  QuickJSHandle,
  QuickJSRuntime,
  QuickJSWASMModule,
} from 'quickjs-emscripten-core';
import { ParserConfig } from '../notebook/types';

/**
 * Securely evaluate the untrusted JavaScript found in `.crossnote/config.js`
 * and `.crossnote/parser.js`.
 *
 * Background: these files used to be evaluated with `vm.runInNewContext()`
 * (desktop) and `sval` (web). Neither is a security boundary — both share the
 * host realm's object prototypes, so untrusted code could climb
 * `({}).constructor.constructor` to reach the host `Function` constructor and,
 * from there, `process` / `child_process`, achieving arbitrary code execution
 * just by opening a markdown file in a malicious repository
 * (GHSA-427h-jhpr-8jch).
 *
 * QuickJS runs the guest code inside a complete JavaScript engine compiled to
 * WebAssembly. The guest has its own heap and its own intrinsics living in the
 * WASM linear memory; the host's `process`, `Object`, and `Function` simply do
 * not exist in that realm, so there is no prototype chain to traverse back to
 * the host. Values cross the boundary only as explicitly-marshaled data
 * (strings here). This same module works in Node and in the browser/VS Code web
 * extension because WebAssembly is available in both.
 */

// Guard rails against a malicious file hanging or OOMing the extension host.
const MEMORY_LIMIT_BYTES = 64 * 1024 * 1024; // 64 MB
const EVAL_TIMEOUT_MS = 5000;
const HOOK_TIMEOUT_MS = 5000;

let quickJSModulePromise: Promise<QuickJSWASMModule> | null = null;
function loadQuickJS(): Promise<QuickJSWASMModule> {
  if (!quickJSModulePromise) {
    // The "singlefile" variant embeds the WebAssembly module as base64 and
    // instantiates it synchronously — no dynamic `import()` or asset fetch.
    // That keeps loading portable across Node, jest, and the bundled VS Code
    // web extension without extra build configuration.
    quickJSModulePromise = newQuickJSWASMModuleFromVariant(releaseSyncVariant);
  }
  return quickJSModulePromise;
}

/**
 * Strip a trailing `;` / `,` and wrap the snippet in parentheses so a bare
 * object literal (`{ ... }`) is parsed as an expression rather than a block —
 * matching the historical `interpretJS` behaviour.
 */
function toExpression(code: string): string {
  return `(${code.trim().replace(/[;,]+$/, '')})`;
}

/**
 * A runtime + context pair with a mutable interrupt deadline. The interrupt
 * handler is polled by QuickJS during execution; bumping `deadline` before each
 * operation gives every evaluation/ hook-call its own time budget.
 */
interface Sandbox {
  runtime: QuickJSRuntime;
  context: QuickJSContext;
  setDeadline: (ms: number) => void;
}

function createSandbox(module: QuickJSWASMModule): Sandbox {
  const runtime = module.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT_BYTES);
  let deadline = 0;
  // Returning `true` from the interrupt handler aborts the running guest code.
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const context = runtime.newContext();
  return {
    runtime,
    context,
    setDeadline: (ms: number) => {
      deadline = Date.now() + ms;
    },
  };
}

function disposeSandbox(sandbox: Sandbox): void {
  sandbox.context.dispose();
  sandbox.runtime.dispose();
}

/** Read a QuickJS error handle into a host Error, then dispose it. */
function consumeError(
  context: QuickJSContext,
  errorHandle: QuickJSHandle,
): Error {
  const dumped = context.dump(errorHandle) as
    | { name?: string; message?: string }
    | string
    | undefined;
  errorHandle.dispose();
  if (dumped && typeof dumped === 'object') {
    return new Error(`${dumped.name ?? 'Error'}: ${dumped.message ?? ''}`);
  }
  return new Error(String(dumped));
}

/**
 * Evaluate untrusted JavaScript that is expected to return plain *data*
 * (used for `.crossnote/config.js`). The result is deep-copied out of the
 * sandbox as ordinary host values; any functions it contains are dropped,
 * which is intentional — config files should be declarative data.
 *
 * @throws if the code throws, times out, or exceeds the memory limit.
 */
export async function evalConfigJS(code: string): Promise<unknown> {
  const module = await loadQuickJS();
  const sandbox = createSandbox(module);
  try {
    sandbox.setDeadline(EVAL_TIMEOUT_MS);
    const result = sandbox.context.evalCode(toExpression(code));
    if (result.error) {
      throw consumeError(sandbox.context, result.error);
    }
    const data = sandbox.context.dump(result.value);
    result.value.dispose();
    return data;
  } finally {
    disposeSandbox(sandbox);
  }
}

/** Parser hooks plus an explicit disposer for the backing QuickJS context. */
export type SandboxedParserConfig = ParserConfig & { dispose: () => void };

/**
 * Evaluate untrusted JavaScript that returns parser hooks
 * (`.crossnote/parser.js`) and wrap them so the host can call them with a
 * string and receive a string back, all marshaled across the WASM boundary.
 *
 * The QuickJS context is kept alive for the lifetime of the returned config so
 * the hooks (and any module-level state they close over) persist between calls.
 * Call `dispose()` to free it.
 *
 * @throws if the setup code throws, times out, or exceeds the memory limit.
 */
export async function createSandboxedParserConfig(
  code: string,
  defaults: ParserConfig,
): Promise<SandboxedParserConfig> {
  const module = await loadQuickJS();
  const sandbox = createSandbox(module);
  const { context, runtime } = sandbox;

  // Install the user module and a host-callable dispatcher. Wrapping the hook
  // call in `Promise.resolve(...).then(String)` normalizes both sync and async
  // hooks to a promise of a string, so the host side is uniform.
  const setupSource = `
    var __module = ${toExpression(code)};
    globalThis.__crossnoteCallHook = function (hookName, input) {
      var hook =
        __module && typeof __module[hookName] === 'function'
          ? __module[hookName]
          : null;
      if (!hook) {
        return Promise.resolve(input);
      }
      return Promise.resolve(hook(input)).then(function (result) {
        return String(result);
      });
    };
  `;

  let dispatcher: QuickJSHandle;
  try {
    sandbox.setDeadline(EVAL_TIMEOUT_MS);
    const setupResult = context.evalCode(setupSource);
    if (setupResult.error) {
      throw consumeError(context, setupResult.error);
    }
    setupResult.value.dispose();
    dispatcher = context.getProp(context.global, '__crossnoteCallHook');
  } catch (e) {
    disposeSandbox(sandbox);
    throw e;
  }

  let disposed = false;
  const invoke = async (hookName: string, input: string): Promise<string> => {
    if (disposed) {
      return input;
    }
    sandbox.setDeadline(HOOK_TIMEOUT_MS);
    const hookNameHandle = context.newString(hookName);
    const inputHandle = context.newString(input);
    try {
      const callResult = context.callFunction(dispatcher, context.undefined, [
        hookNameHandle,
        inputHandle,
      ]);
      if (callResult.error) {
        throw consumeError(context, callResult.error);
      }
      // The dispatcher always returns a promise; resolve it via the job queue.
      const resolved = context.resolvePromise(callResult.value);
      callResult.value.dispose();
      runtime.executePendingJobs();
      const settled = await resolved;
      if (settled.error) {
        throw consumeError(context, settled.error);
      }
      const output = context.getString(settled.value);
      settled.value.dispose();
      return output;
    } finally {
      hookNameHandle.dispose();
      inputHandle.dispose();
    }
  };

  return {
    onWillParseMarkdown: (markdown: string) =>
      invoke('onWillParseMarkdown', markdown).catch(() =>
        defaults.onWillParseMarkdown(markdown),
      ),
    onDidParseMarkdown: (html: string) =>
      invoke('onDidParseMarkdown', html).catch(() =>
        defaults.onDidParseMarkdown(html),
      ),
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      dispatcher.dispose();
      disposeSandbox(sandbox);
    },
  };
}
