import { instance, RenderOptions } from '@viz-js/viz';

type ValueType<T> = T extends Promise<infer U> ? U : T;

let viz: ValueType<ReturnType<typeof instance>> | null = null;

/*
 * @param renderOption https://github.com/mdaines/viz.js/wiki/API#render-options
 */
export async function Viz(digraph: string, renderOption: RenderOptions) {
  try {
    if (!viz) {
      viz = await instance();
    }
    return await viz.renderString(digraph, { format: 'svg', ...renderOption });
  } catch (error) {
    // Create a new Viz instance (@see Caveats page for more info)
    viz = null;
    throw error;
  }
}
