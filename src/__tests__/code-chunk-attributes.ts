import { parseAttributes } from '../code-chunk-attributes';

const testCases = [{
  // classic behavior
  raw: ['cmd=true', '{cmd=true}', '  {  cmd=true  }  '],
  expectedAttributes: { cmd: true }
}, {
  raw: 'cmd=true hello=world',
  expectedAttributes: { cmd: true, hello: 'world' }
}, {
  raw: 'cmd=true hello=true',
  expectedAttributes: { cmd: true, hello: true }
}, {
  raw: 'cmd=true hello="true"',
  expectedAttributes: { cmd: true, hello: 'true' }
}, {
  raw: 'cmd=true hello=\'true\'',
  expectedAttributes: { cmd: true, hello: 'true' }
}, {
  raw: 'cmd=true .class1',
  expectedAttributes: { cmd: true, class: 'class1' }
}, {
  raw: 'cmd=true #some-id',
  expectedAttributes: { cmd: true, id: 'some-id' }
}, {
  raw: 'cmd=true .class1 .class2',
  expectedAttributes: { cmd: true, class: 'class1 class2' }
}, {
  raw: '.class1 cmd=true .class2',
  expectedAttributes: { cmd: true, class: 'class1 class2' }
}, {
  raw: 'cmd=true args=["-v"]',
  expectedAttributes: { cmd: true, args: ['-v'] }
}, {
  raw: 'cmd=true args=["-i", "$input_file", "-o", "./output.png"] .class1',
  expectedAttributes: { cmd: true, args: ['-i', '$input_file', '-o', './output.png'], class: 'class1' }
}, {
  // shortcuts
  raw: 'cmd hide',
  expectedAttributes: { cmd: true, hide: true }
}, {
  raw: 'cmd output="path.html" hide',
  expectedAttributes: { cmd: true, output: 'path.html', hide: true }
}, {
  raw: 'cmd hide .class1',
  expectedAttributes: { cmd: true, hide: true, class: 'class1' }
}, {
  raw: 'cmd .class1 hide .class2',
  expectedAttributes: { cmd: true, hide: true, class: 'class1 class2' }
}]

describe('code-chunk-attributes', () => {
  testCases.map(({ raw, expectedAttributes }) => {
    const arrayOfTexts = typeof raw === 'string' ? [raw] : raw
    arrayOfTexts.map(text => {
      it(`parseAttributes() correctly parses ${text}`, () => {
        const result = parseAttributes(text)
        expect(result).toEqual(expectedAttributes);
      });
    })
  });
})
