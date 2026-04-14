import {
  BlockInfo,
  normalizeBlockInfo,
  parseBlockInfo,
} from '../../src/lib/block-info';

const testCasesForParseBlockInfo: {
  expect: BlockInfo;
  input: string;
}[] = [
  {
    input: '',
    expect: { language: '', attributes: { class: '' } },
  },
  {
    input: '{}',
    expect: { language: '', attributes: { class: '' } },
  },
  {
    input: '{#id}',
    expect: { language: '', attributes: { id: 'id', class: '' } },
  },
  {
    input: 'js cmd=true',
    expect: { language: 'js', attributes: { class: 'js', cmd: true } },
  },
  {
    input: 'js {cmd=true}',
    expect: { language: 'js', attributes: { class: 'js', cmd: true } },
  },
  {
    input: 'js  {  cmd=true  }  ',
    expect: { language: 'js', attributes: { class: 'js', cmd: true } },
  },
  {
    input: 'js{cmd=True}',
    expect: { language: 'js', attributes: { class: 'js', cmd: true } },
  },
  {
    input: '{.js}',
    expect: { language: 'js', attributes: { class: 'js' } },
  },
  {
    input: '{.js .text}',
    expect: { language: 'js', attributes: { class: 'js text' } },
  },
  {
    input: '{.js .text cmd=true}',
    expect: { language: 'js', attributes: { class: 'js text', cmd: true } },
  },
  {
    input: '{.js .text cmd=true hello=world}',
    expect: {
      language: 'js',
      attributes: { class: 'js text', cmd: true, hello: 'world' },
    },
  },
  {
    input: 'hello',
    expect: { language: 'hello', attributes: { class: 'hello' } },
  },
  {
    input: ' hello ',
    expect: { language: 'hello', attributes: { class: 'hello' } },
  },
  {
    input: 'hello {}',
    expect: { language: 'hello', attributes: { class: 'hello' } },
  },
  {
    input: 'hello {.text}',
    expect: { language: 'hello', attributes: { class: 'hello text' } },
  },
  {
    input: 'hello {   }',
    expect: { language: 'hello', attributes: { class: 'hello' } },
  },
  {
    input: ' {just=attribute}',
    expect: {
      language: '',
      attributes: { just: 'attribute', class: '' },
    },
  },
  {
    input: ' {just=attribute .python}',
    expect: {
      language: 'python',
      attributes: { just: 'attribute', class: 'python' },
    },
  },
  {
    input: ' {just=attribute .python .js}',
    expect: {
      language: 'python',
      attributes: { just: 'attribute', class: 'python js' },
    },
  },
  {
    input: 'html {just=attribute .python .js}',
    expect: {
      language: 'html',
      attributes: { just: 'attribute', class: 'html python js' },
    },
  },
  // D2-style space-separated attributes (no braces)
  {
    input: 'd2 layout=elk theme=200 sketch',
    expect: {
      language: 'd2',
      attributes: { class: 'd2', layout: 'elk', theme: 200, sketch: true },
    },
  },
  // Transformer output for d2 block: space-attrs + appended {data-source-line="N"}
  {
    input: 'd2 layout=elk theme=200 sketch {data-source-line="5"}',
    expect: {
      language: 'd2',
      attributes: {
        'class': 'd2',
        'layout': 'elk',
        'theme': 200,
        'sketch': true,
        'data-source-line': '5',
      },
    },
  },
  // Transformer output when original attrs were in braces: merged into single group
  // lang {attrs data-source-line="N"}
  {
    input: 'd2 {layout=elk theme=200 data-source-line="5"}',
    expect: {
      language: 'd2',
      attributes: {
        'class': 'd2',
        'layout': 'elk',
        'theme': 200,
        'data-source-line': '5',
      },
    },
  },
  // Transformer output when fence had no prior attrs: lang {data-source-line="N"}
  {
    input: 'd2 {data-source-line="5"}',
    expect: {
      language: 'd2',
      attributes: { 'class': 'd2', 'data-source-line': '5' },
    },
  },
];

const testCasesForNormalizeCodeBlockInfo: {
  input: object;
  expect: BlockInfo;
}[] = [
  {
    input: { language: '', attributes: {} },
    expect: { language: '', attributes: {} },
  },
  {
    input: { language: 'js', attributes: { cmd: true } },
    expect: { language: 'js', attributes: { cmd: true } },
  },
  {
    input: { language: 'js', attributes: { Cmd: true } },
    expect: { language: 'js', attributes: { cmd: true } },
  },
  {
    input: { language: 'js', attributes: { CMD: true } },
    expect: { language: 'js', attributes: { cmd: true } },
  },
  {
    input: { language: 'vega' },
    expect: { language: 'vega', attributes: {} },
  },
  {
    input: { language: 'VEGA', attributes: {} },
    expect: { language: 'vega', attributes: {} },
  },
];

describe('lib/block-info', () => {
  testCasesForParseBlockInfo.map(({ input, expect: expect_ }) => {
    it(`parseBlockInfo() correctly parses ${input}`, () => {
      const result: object = parseBlockInfo(input);
      expect(result).toEqual(expect_);
    });
  });

  testCasesForNormalizeCodeBlockInfo.map(({ input, expect: expect_ }) => {
    it(`normalizeCodeBlockInfo() correctly normalizes ${JSON.stringify(
      input,
    )}`, () => {
      const result: object = normalizeBlockInfo(input as BlockInfo);
      expect(result).toEqual(expect_);
    });
  });
});
