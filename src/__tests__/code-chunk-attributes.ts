import { parseAttributes } from '../code-chunk-attributes';

const testCases = [{
  // classic behavior
  text: 'cmd=true',
  expectedResult: { cmd: true }
}, {
  text: 'cmd=true hello=world',
  expectedResult: { cmd: true, hello: 'world' }
}, {
  text: 'cmd=true hello=true',
  expectedResult: { cmd: true, hello: true }
}, {
  text: 'cmd=true hello="true"',
  expectedResult: { cmd: true, hello: 'true' }
}, {
  text: 'cmd=true hello=\'true\'',
  expectedResult: { cmd: true, hello: 'true' }
}, {
  text: 'cmd=true .class1',
  expectedResult: { cmd: true, class: 'class1' }
}, {
  text: 'cmd=true #some-id',
  expectedResult: { cmd: true, id: 'some-id' }
}, {
  text: 'cmd=true .class1 .class2',
  expectedResult: { cmd: true, class: 'class1 class2' }
}, {
  text: '.class1 cmd=true .class2',
  expectedResult: { cmd: true, class: 'class1 class2' }
}, {
  text: 'cmd=true args=["-v"]',
  expectedResult: { cmd: true, args: ['-v'] }
}, {
  text: 'cmd=true args=["-i", "$input_file", "-o", "./output.png"] .class1',
  expectedResult: { cmd: true, args: ['-i', '$input_file', '-o', './output.png'], class: 'class1' }
}, {
  // shortcuts
  text: 'cmd hide',
  expectedResult: { cmd: true, hide: true }
}, {
  text: 'cmd output="path.html" hide',
  expectedResult: { cmd: true, output: 'path.html', hide: true }
}, {
  text: 'cmd hide .class1',
  expectedResult: { cmd: true, hide: true, class: 'class1' }
}, {
  text: 'cmd .class1 hide .class2',
  expectedResult: { cmd: true, hide: true, class: 'class1 class2' }
}]

describe('code-chunk-attributes', () => {
  testCases.map(({ text, expectedResult }) => {
    it(`parseAttributes() correctly parses ${text}`, () => {
      const result = parseAttributes(text)
      expect(result).toEqual(expectedResult);
    });
  });
})
