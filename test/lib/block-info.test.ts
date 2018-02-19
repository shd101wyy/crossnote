import {
  normalizeCodeBlockInfo,
  parseBlockInfo,
} from "../../src/lib/block-info";

const testCasesForParseBlockInfo: Array<{
  info: object;
  raw: string | string[];
}> = [
  {
    info: { lang: "js", cmd: true },
    raw: [
      "js cmd=true",
      "js {cmd=true}",
      "js  {  cmd=true  }  ",
      "js{cmd=true}",
    ],
  },
  {
    info: { lang: "hello" },
    raw: ["hello", " hello ", "hello {}", "hello {   }"],
  },
  {
    info: { just: "attribute" },
    raw: [" {just=attribute}"],
  },
];

const testCasesForNormalizeCodeBlockInfo: Array<{
  infos: object[];
  normalizedInfo: object;
}> = [
  {
    infos: [{}],
    normalizedInfo: {},
  },
  {
    infos: [{ lang: "js", cmd: true }],
    normalizedInfo: { lang: "js", cmd: true, literate: true },
  },
  {
    infos: [{ lang: "vega" }, { lang: "vega", literate: true, hide: true }],
    normalizedInfo: { lang: "vega", literate: true, hide: true },
  },
];

describe("lib/block-info", () => {
  testCasesForParseBlockInfo.map(({ raw, info }) => {
    const arrayOfTexts = typeof raw === "string" ? [raw] : raw;
    arrayOfTexts.map((text) => {
      it(`parseBlockInfo() correctly parses ${text}`, () => {
        const result = parseBlockInfo(text);
        expect(result).toEqual(info);
      });
    });
  });

  testCasesForNormalizeCodeBlockInfo.map(({ infos, normalizedInfo }) => {
    infos.map((info) => {
      it(`normalizeCodeBlockInfo() correctly normalizes ${JSON.stringify(
        info,
      )}`, () => {
        const result = normalizeCodeBlockInfo(info);
        expect(result).toEqual(normalizedInfo);
      });
    });
  });
});
