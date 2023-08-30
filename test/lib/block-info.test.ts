import {
  BlockInfo,
  normalizeBlockInfo,
  parseBlockInfo,
} from '../../src/lib/block-info/index.js';

const testCasesForParseBlockInfo: {
  info: object;
  raw: string | string[];
}[] = [
  {
    info: { language: 'js', attributes: { cmd: true } },
    raw: [
      'js cmd=true',
      'js {cmd=true}',
      'js  {  cmd=true  }  ',
      'js{cmd=True}',
    ],
  },
  {
    info: { language: 'hello', attributes: {} },
    raw: ['hello', ' hello ', 'hello {}', 'hello {   }'],
  },
  {
    info: { language: undefined, attributes: { just: 'attribute' } },
    raw: [' {just=attribute}'],
  },
];

const testCasesForNormalizeCodeBlockInfo: {
  infos: object[];
  normalizedInfo: object;
}[] = [
  {
    infos: [{}],
    normalizedInfo: { language: '', attributes: {} },
  },
  {
    infos: [
      { language: 'js', attributes: { cmd: true } },
      { language: 'js', attributes: { Cmd: true } },
      { language: 'js', attributes: { CMD: true } },
    ],
    normalizedInfo: { language: 'js', attributes: { cmd: true } },
  },
  {
    infos: [{ language: 'vega' }, { language: 'VEGA', attributes: {} }],
    normalizedInfo: { language: 'vega', attributes: {} },
  },
];

describe('lib/block-info', () => {
  testCasesForParseBlockInfo.map(({ raw, info }) => {
    const arrayOfTexts = typeof raw === 'string' ? [raw] : raw;
    arrayOfTexts.map(text => {
      it(`parseBlockInfo() correctly parses ${text}`, () => {
        const result: object = parseBlockInfo(text);
        expect(result).toEqual(info);
      });
    });
  });

  testCasesForNormalizeCodeBlockInfo.map(({ infos, normalizedInfo }) => {
    infos.map(info => {
      it(`normalizeCodeBlockInfo() correctly normalizes ${JSON.stringify(
        info,
      )}`, () => {
        const result: object = normalizeBlockInfo(info as BlockInfo);
        expect(result).toEqual(normalizedInfo);
      });
    });
  });
});
