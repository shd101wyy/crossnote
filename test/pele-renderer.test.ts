/**
 * Pele in Node (`src/renderers/pele.ts`): the pandoc and markdown exports turn
 * a `pele` block into an image with it, through the vendored browser bundle.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';
import { processGraphs } from '../src/converters/process-graphs';
import {
  inlineCssVariables,
  loadPele,
  renderPele,
} from '../src/renderers/pele';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

const FLOWCHART =
  'flowchart LR\n  A[Mermaid text] --> B{Flowchart?}\n  B -- Yes --> C[Pele]';
const INVALID = 'flowchart LR\n  A --> --> B';

/** Every tag of `svg`, to look at attribute values and nothing else. */
const tagsOf = (svg: string) => svg.match(/<[a-zA-Z][^<>]*>/g) ?? [];

/** The SVG pele draws for `source`, as it goes to the page. */
function draw(source: string): string {
  const pele = loadPele();
  if (!pele) {
    throw new Error('the vendored pele bundle did not load');
  }
  return pele.render(source).svg;
}

/** Pixels of a png that are neither white nor black nor transparent. */
async function drawnPixels(pngPath: string): Promise<number> {
  const sharp = (await import('sharp')).default;
  const { data, info } = await sharp(pngPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    const opaque = a > 0;
    const white = r > 250 && g > 250 && b > 250;
    const black = r < 5 && g < 5 && b < 5;
    if (opaque && !white && !black) {
      count++;
    }
  }
  return count;
}

describe('inlineCssVariables', () => {
  it("writes pele's default colors into the diagram", () => {
    const svg = inlineCssVariables(draw(FLOWCHART));

    // Text and lines are pele's default foreground, nodes its default fill.
    expect(svg).toContain('fill="#1f1f1f"');
    expect(svg).toContain('stroke="#1f1f1f"');
    expect(svg).toContain('fill="#f3f3f3"');
    expect(tagsOf(svg).some((tag) => tag.includes('var('))).toBe(false);
  });

  it('takes the --pele-* variables from the page', () => {
    const svg = inlineCssVariables(draw(FLOWCHART), {
      '--pele-fg': '#cecdc3',
      '--pele-line': '#cecdc3',
    });

    expect(svg).toContain('fill="#cecdc3"');
    expect(svg).not.toContain('fill="#1f1f1f"');
  });

  it('leaves text alone', () => {
    // A label that says `var(…)` is text, not a color.
    const svg = inlineCssVariables(
      draw('flowchart LR\n  A["var(--_fg)"] --> B'),
    );

    expect(svg).toContain('text-anchor="middle">var(--_fg)</text>');
  });

  it('reads a fallback with parentheses', () => {
    const svg = inlineCssVariables(
      '<svg style="--a:var(--x,rgba(1,2,3,.5))"><rect fill="var(--a)"/></svg>',
    );

    expect(svg).toBe(
      '<svg style="--a:rgba(1,2,3,.5)"><rect fill="rgba(1,2,3,.5)"/></svg>',
    );
  });

  it('resolves a variable that refers to itself to nothing', () => {
    const svg = inlineCssVariables(
      '<svg style="--a:var(--a);--b:var(--a,#fff)"><rect fill="var(--b)" stroke="var(--a,#000)"/></svg>',
    );

    expect(svg).toContain('<rect fill="#fff" stroke="#000"/>');
  });
});

describe('renderPele', () => {
  const original = getCrossnoteBuildDirectory();
  const buildDirectory = path.resolve(__dirname, '..');

  beforeEach(() => {
    setCrossnoteBuildDirectory(buildDirectory);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(original);
  });

  it('draws the diagram with concrete colors on a white background', () => {
    const svg = renderPele(FLOWCHART);

    expect(svg).toMatch(/^<svg [^>]*class="pele pele-flowchart"/);
    // The background is the first thing drawn, behind the diagram.
    expect(svg).toMatch(
      /^<svg [^>]*><rect width="100%" height="100%" fill="#ffffff"\/>/,
    );
    expect(tagsOf(svg).some((tag) => tag.includes('var('))).toBe(false);
    expect(svg).toContain('Mermaid text');
  });

  it('throws the parse error of a diagram that cannot be drawn', () => {
    expect(() => renderPele(INVALID)).toThrow(/line 2/);
  });

  it('fails plainly when the bundle is missing', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-no-pele-'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      setCrossnoteBuildDirectory(empty);

      expect(loadPele()).toBeNull();
      expect(() => renderPele(FLOWCHART)).toThrow(/pele is missing/);
    } finally {
      warn.mockRestore();
      setCrossnoteBuildDirectory(buildDirectory);
      fs.rmSync(empty, { recursive: true, force: true });
    }
    // Back in a build directory that has the bundle.
    expect(typeof loadPele()?.render).toBe('function');
  });
});

describe('processGraphs with pele blocks', () => {
  let notebook: Notebook;
  let directory: string;
  const original = getCrossnoteBuildDirectory();

  beforeAll(async () => {
    // processGraphs reads the bundle from the build directory; from the
    // sources that is the root of the repository.
    setCrossnoteBuildDirectory(path.resolve(__dirname, '..'));
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-pele-png-'));
    notebook = await Notebook.init({
      notebookPath: directory,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(original);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  /** The note with its graphs turned into images. */
  async function convert(markdown: string) {
    const { outputString, imagePaths } = await processGraphs(markdown, {
      fileDirectoryPath: directory,
      projectDirectoryPath: directory,
      imageDirectoryPath: directory,
      imageFilePrefix: 'pele_',
      useRelativeFilePath: true,
      codeChunksData: {},
      graphsCache: {},
      addOptionsStr: true,
      cacheBust: false,
      notebook,
    });
    return { outputString, imagePaths };
  }

  it('turns a pele block into an image of the diagram', async () => {
    // processGraphs embeds a failed conversion as an error block inside the
    // output instead of throwing.
    const { outputString, imagePaths } = await convert(
      `\`\`\`pele {filename=flow.png alt=Flow}\n${FLOWCHART}\n\`\`\``,
    );

    expect(outputString).not.toContain('sharp conversion failure');
    expect(outputString).not.toContain('```pele');
    expect(outputString).toMatch(
      /!\[Flow\]\(flow\.png\)\{filename=flow\.png alt=Flow\}/,
    );
    expect(imagePaths).toHaveLength(1);
    expect(fs.existsSync(imagePaths[0])).toBe(true);

    // The image shows the diagram: librsvg has no CSS variables, so an SVG
    // whose colors were left as `var(…)` comes out solid black.
    const sharp = (await import('sharp')).default;
    const { width, height } = await sharp(imagePaths[0]).metadata();
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(40);
    expect(await drawnPixels(imagePaths[0])).toBeGreaterThan(
      (width ?? 0) * (height ?? 0) * 0.02,
    );
  });

  it('reports a diagram that cannot be drawn in place of the block', async () => {
    const { outputString, imagePaths } = await convert(
      `\`\`\`pele\n${INVALID}\n\`\`\``,
    );

    expect(imagePaths).toHaveLength(0);
    expect(outputString).not.toContain('```pele');
    expect(outputString).toMatch(/```\nPeleError: Parse error on line 2:/);
  });

  it('leaves a fence of another language alone', async () => {
    const { outputString, imagePaths } = await convert(
      '```pelephant\nA --> B\n```',
    );

    expect(imagePaths).toHaveLength(0);
    expect(outputString).toContain('```pelephant');
  });
});
