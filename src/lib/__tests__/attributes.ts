import { parseAttributes, stringifyAttributes } from "../attributes";

const testCases: {
  attributes: any;
  raw: string | string[];
  stringified?: string;
}[] = [
  {
    // classic behavior
    attributes: { cmd: true },
    raw: ["cmd=true", "{cmd=true}", "  {  cmd=true  }  "],
    stringified: "cmd=true"
  },
  {
    attributes: { cmd: true, hello: "world" },
    raw: "cmd=true hello=world",
    stringified: 'cmd=true hello="world"'
  },
  {
    attributes: { cmd: true, hello: true },
    raw: "cmd=true hello=true",
    stringified: "cmd=true hello=true"
  },
  {
    raw: 'cmd=true hello="true"',
    attributes: { cmd: true, hello: "true" },
    stringified: 'cmd=true hello="true"'
  },
  {
    attributes: { cmd: true, hello: "true" },
    raw: "cmd=true hello='true'",
    stringified: 'cmd=true hello="true"'
  },
  {
    attributes: { cmd: true, class: "class1" },
    raw: "cmd=true .class1",
    stringified: 'cmd=true class="class1"'
  },
  {
    attributes: { cmd: true, id: "some-id" },
    raw: "cmd=true #some-id",
    stringified: 'cmd=true id="some-id"'
  },
  {
    attributes: { cmd: true, class: "class1 class2" },
    raw: "cmd=true .class1 .class2",
    stringified: 'cmd=true class="class1 class2"'
  },
  {
    attributes: { cmd: true, class: "class1 class2" },
    raw: ".class1 cmd=true .class2",
    stringified: 'cmd=true class="class1 class2"'
  },
  {
    attributes: { cmd: true, args: ["-v"] },
    raw: 'cmd=true args=["-v"]',
    stringified: 'cmd=true args=["-v"]'
  },
  {
    attributes: {
      cmd: true,
      args: ["-i", "$input_file", "-o", "./output.png"],
      class: "class1"
    },
    raw: 'cmd=true args=["-i", "$input_file", "-o", "./output.png"] .class1',
    stringified:
      'cmd=true args=["-i", "$input_file", "-o", "./output.png"] class="class1"'
  },
  {
    // shortcuts
    attributes: { cmd: true, hide: true },
    raw: "cmd hide",
    stringified: "cmd=true hide=true"
  },
  {
    attributes: { cmd: true, output: "path.html", hide: true },
    raw: 'cmd output="path.html" hide',
    stringified: 'cmd=true output="path.html" hide=true'
  },
  {
    attributes: { cmd: true, hide: true, class: "class1" },
    raw: "cmd hide .class1",
    stringified: 'cmd=true hide=true class="class1"'
  },
  {
    attributes: { cmd: true, hide: true, class: "class1 class2" },
    raw: "cmd .class1 hide .class2",
    stringified: 'cmd=true hide=true class="class1 class2"'
  }
];

describe("lib/attributes", () => {
  testCases.map(({ raw, attributes }) => {
    const arrayOfTexts = typeof raw === "string" ? [raw] : raw;
    arrayOfTexts.map(text => {
      it(`parseAttributes() correctly parses ${text}`, () => {
        const result = parseAttributes(text);
        expect(result).toEqual(attributes);
      });
    });
  });

  testCases.map(({ attributes, stringified = null }) => {
    if (typeof stringified !== "string") {
      return;
    }
    it(`stringifyAttributes() correctly stringifies ${JSON.stringify(
      attributes
    )}`, () => {
      // without curly parentheses
      const resultWithoutCurlyParentheses = stringifyAttributes(
        attributes,
        false
      );
      expect(resultWithoutCurlyParentheses).toEqual(stringified);

      // with curly parentheses (default)
      const resultWithCurlyParentheses = stringifyAttributes(attributes);
      expect(resultWithCurlyParentheses).toEqual(`{${stringified}}`);
    });
  });
});
