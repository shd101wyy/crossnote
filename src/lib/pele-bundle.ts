import type { PeleRenderer } from './pele';
import * as vm from 'vm';

/**
 * The `pele` global of a pele browser build, evaluated in a context of its
 * own: the bundle gets no `require` and no `process`. It gets `URL`, which a
 * browser page always has and an empty context lacks — pele checks `http:`
 * and `https:` links and images with `new URL(…)`, and without the
 * constructor it drops every one of them. Throws when the build does not
 * evaluate.
 */
export function evaluatePeleBundle(bundle: string): PeleRenderer {
  return vm.runInNewContext(
    `${bundle}\n;pele`,
    { URL },
    {
      filename: 'pele.global.js',
    },
  ) as PeleRenderer;
}
