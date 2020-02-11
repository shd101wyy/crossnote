import {
  normalizeAttributes,
  parseAttributes,
  stringifyAttributes,
} from "../../src/lib/attributes";

const testCases: {
  attributes?: any;
  normalizedAttributes?: any;
  raw?: string | string[];
  stringified?: string;
}[] = [
  {
    // classic behavior
    attributes: { cmd: true },
    raw: ["cmd=true", "{cmd=true}", "  {  cmd=true  }  "],
    stringified: "cmd=true",
  },
  {
    attributes: { cmd: true, hello: "world" },
    raw: "cmd=true hello=world",
    stringified: 'cmd=true hello="world"',
  },
  {
    attributes: { cmd: true, hello: true },
    raw: "cmd=true hello=true",
    stringified: "cmd=true hello=true",
  },
  {
    attributes: { cmd: true, hello: "true" },
    raw: 'cmd=true hello="true"',
    stringified: 'cmd=true hello="true"',
  },
  {
    attributes: { cmd: true, hello: "true" },
    raw: "cmd=true hello='true'",
    stringified: 'cmd=true hello="true"',
  },
  {
    attributes: { cmd: true, hello: false },
    raw: "cmd=true hello=false",
    stringified: "cmd=true hello=false",
  },
  {
    attributes: { cmd: true, hello: 42 },
    raw: "cmd=true hello=42",
    stringified: "cmd=true hello=42",
  },
  {
    attributes: { cmd: true, hello: 42.2 },
    raw: "cmd=true hello=42.2",
    stringified: "cmd=true hello=42.2",
  },
  {
    attributes: { cmd: true, class: "class1" },
    raw: "cmd=true .class1",
    stringified: 'cmd=true class="class1"',
  },
  {
    attributes: { cmd: true, id: "some-id" },
    raw: "cmd=true #some-id",
    stringified: 'cmd=true id="some-id"',
  },
  {
    attributes: { cmd: true, id: "some-id:with-colon" },
    raw: "cmd=true #some-id:with-colon",
    stringified: 'cmd=true id="some-id:with-colon"',
  },
  {
    attributes: {
      id: "some-id:with-colon",
      class: "class1 class2",
      key1: "value1",
      key2: "value2",
    },
    raw: "#some-id:with-colon .class1 .class2 key1=value1 key2=value2",
    stringified:
      'id="some-id:with-colon" class="class1 class2" key1="value1" key2="value2"',
  },
  {
    attributes: { cmd: true, id: "0" },
    raw: "cmd=true #0",
    stringified: 'cmd=true id="0"',
  },
  {
    attributes: { cmd: true, class: "class1 class2" },
    raw: "cmd=true .class1 .class2",
    stringified: 'cmd=true class="class1 class2"',
  },
  {
    attributes: { cmd: true, class: "class1 class2" },
    raw: ".class1 cmd=true .class2",
    stringified: 'cmd=true class="class1 class2"',
  },
  {
    attributes: { cmd: true, args: ["-v"] },
    raw: 'cmd=true args=["-v"]',
    stringified: 'cmd=true args=["-v"]',
  },
  {
    attributes: {
      cmd: true,
      args: ["-i", "$input_file", "-o", "./output.png"],
      class: "class1",
    },
    raw: [
      'cmd=true args=["-i", "$input_file", "-o", "./output.png"] .class1',
      "cmd=true args=[-i, \"$input_file\", -o, './output.png'] .class1",
      "cmd=true args=[ -i ,\"$input_file\" , -o , './output.png' ] .class1",
    ],
    stringified:
      'cmd=true args=["-i", "$input_file", "-o", "./output.png"] class="class1"',
  },
  {
    attributes: { quotes: "h'e\"r`e", hello: "world" },
    raw: [
      'quotes="h\'e\\"r`e" hello=world',
      "quotes='h\\'e\"r`e' hello=world",
      "quotes=`h'e\"r\\`e` hello=world",
    ],
    stringified: 'quotes="h\'e\\"r`e" hello="world"',
  },
  {
    attributes: { quotes: ["h'e\"r`e", "etc."], hello: "world" },
    raw: [
      "quotes=['h\\'e\"r`e', etc.] hello=world",
      'quotes=["h\'e\\"r`e", etc.] hello=world',
      "quotes=[`h'e\"r\\`e`, etc.] hello=world",
    ],
    stringified: 'quotes=["h\'e\\"r`e", "etc."] hello="world"',
  },
  {
    attributes: {
      nested: ["something", ["something", "else"], "etc."],
      hello: "world",
    },
    raw: [
      "nested=[something, [something, else], etc.] hello=world",
      "nested=[ something, [ something, else ], etc. ] hello=world",
      "nested=['something', [\"something\", `else`], etc.] hello=world",
      "nested=[ 'something' ,[\"something\" ,`else`] , etc. ] hello=world",
    ],
    stringified:
      'nested=["something", ["something", "else"], "etc."] hello="world"',
  },
  {
    // edge cases
    attributes: {},
    raw: ["", " ", null, undefined, "#", ".", "['a', 'b', 'c']"],
    stringified: "",
  },
  {
    attributes: { _hello: "world_" },
    raw: ["_hello=world_"],
    stringified: '_hello="world_"',
  },
  {
    attributes: { "hello[": "world" },
    raw: ["hello[=world"],
    stringified: 'hello[="world"',
  },
  {
    attributes: { hello: "world" },
    raw: ['hello="world', 'hello="world\\'],
    stringified: 'hello="world"',
  },
  {
    attributes: { true: true },
    raw: ["true=true", '"true"=true', "true", '"true"'],
    stringified: "true=true",
  },
  {
    attributes: { "1": 1 },
    raw: ["1=1", '"1"=1'],
    stringified: "1=1",
  },
  {
    // shortcuts
    attributes: { cmd: true, hide: true },
    raw: ["cmd hide", "cmd=true hide"],
    stringified: "cmd=true hide=true",
  },
  {
    attributes: { cmd: true, output: "path.html", hide: true },
    raw: 'cmd output="path.html" hide',
    stringified: 'cmd=true output="path.html" hide=true',
  },
  {
    attributes: { cmd: true, hide: true, class: "class1" },
    raw: "cmd hide .class1",
    stringified: 'cmd=true hide=true class="class1"',
  },
  {
    attributes: { cmd: true, hide: true, class: "class1 class2" },
    raw: "cmd .class1 hide .class2",
    stringified: 'cmd=true hide=true class="class1 class2"',
  },
  {
    // highlight
    attributes: { highlight: "10-20" },
    raw: "highlight=10-20",
    stringified: 'highlight="10-20"',
  },
  {
    attributes: { highlight: ["1-10", 15, "20-22"] },
    raw: "highlight=[1-10,15,20-22]",
    stringified: 'highlight=["1-10", 15, "20-22"]',
  },
  {
    attributes: { highlight: ["1-10", 15, "20-22"], a: 12 },
    raw: "highlight=[1-10,15,20-22] a=12",
    stringified: 'highlight=["1-10", 15, "20-22"] a=12',
  },
  {
    attributes: { highlight: "1-10,15,20-22", a: 12 },
    raw: 'highlight="1-10,15,20-22" a=12',
    stringified: 'highlight="1-10,15,20-22" a=12',
  },
  {
    // normalization
    attributes: { hello_world: "test" },
    normalizedAttributes: { hello_world: "test" },
  },
  {
    attributes: { HELLO_WORLD: true },
    normalizedAttributes: { hello_world: true },
  },
  {
    attributes: { HelloWorld: "test" },
    normalizedAttributes: { hello_world: "test" },
  },
];

describe("lib/attributes", () => {
  testCases.map(({ raw, attributes }) => {
    if (!raw || !attributes) {
      return;
    }
    const arrayOfTexts = typeof raw === "string" ? [raw] : raw;
    arrayOfTexts.map((text) => {
      test(`parseAttributes() correctly parses ${text}`, () => {
        const result = parseAttributes(text);
        expect(result).toEqual(attributes);
      });
    });
  });

  testCases.map(({ attributes = null, normalizedAttributes = null }) => {
    if (!attributes || !normalizedAttributes) {
      return;
    }
    test(`normalizeAttributes() correctly normalizes ${JSON.stringify(
      attributes,
    )}`, () => {
      const result = normalizeAttributes(attributes);
      expect(result).toEqual(normalizedAttributes);
    });
  });

  testCases.map(
    ({
      attributes = null,
      normalizedAttributes = null,
      stringified = null,
    }) => {
      if (typeof stringified !== "string") {
        return;
      }
      const attributesToTest = [];
      if (normalizedAttributes) {
        attributesToTest.push(normalizedAttributes);
      } else if (attributes) {
        attributesToTest.push(attributes);
      }
      attributesToTest.map((attrs) => {
        test(`stringifyAttributes() correctly stringifies ${JSON.stringify(
          attrs,
        )}`, () => {
          // without curly parentheses
          const resultWithoutCurlyParentheses = stringifyAttributes(attrs);
          expect(resultWithoutCurlyParentheses).toEqual(stringified);

          // with curly parentheses (default)
          const resultWithCurlyParentheses = stringifyAttributes(attrs, true);
          expect(resultWithCurlyParentheses).toEqual(`{${stringified}}`);
        });
      });
    },
  );
});
