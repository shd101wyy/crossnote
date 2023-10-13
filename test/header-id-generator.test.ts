import HeadingIdGenerator from '../src/markdown-engine/heading-id-generator';

const testCasesForHeaderIdGenerator: {
  input: string;
  expected: string;
}[] = [
  {
    input: 'Hello world!',
    expected: 'hello-world',
  },
  {
    input: '  Leading space world!',
    expected: 'leading-space-world',
  },
  {
    input: 'Trailing space world!   ',
    expected: 'trailing-space-world',
  },
  {
    input: 'Hello, world!',
    expected: 'hello-world-1',
  },
  {
    input: 'foo0 ~  bar',
    expected: 'foo0---bar',
  },
  {
    input: 'foo1 `,` bar',
    expected: 'foo1--bar',
  },
  {
    input: 'foo2 `` bar',
    expected: 'foo2--bar',
  },
  {
    input: 'foo3 `` ` `` bar',
    expected: 'foo3--bar',
  },
  {
    input: 'foo4 `` abc`def `` bar',
    expected: 'foo4-abc-def-bar',
  },
  {
    input: 'foo5 `` `` bar',
    expected: 'foo5---bar',
  },
  {
    input: 'foo6 `,-!(){}[]` bar',
    expected: 'foo6---bar',
  },
  {
    input: 'foo7 `abc-def` bar',
    expected: 'foo7-abc-def-bar',
  },
  {
    input: 'foo8 `.` `.` `.` `.` `.` bar',
    expected: 'foo8------bar',
  },
  {
    input: 'foo9 `` `` `` `` `` bar',
    expected: 'foo9------bar',
  },
  {
    input: 'foo10` , `bar',
    expected: 'foo10bar',
  },
  {
    input: 'foo11!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~bar',
    expected: 'foo11-_bar',
  },
  {
    input: 'The _Real_ Deal',
    expected: 'the-real-deal',
  },
  {
    input: 'The __Real__ Deal',
    expected: 'the-real-deal-1',
  },
  {
    input: 'test_test_test',
    expected: 'test_test_test',
  },
  {
    input: 'test _test_ test',
    expected: 'test-test-test',
  },
  {
    input: 'test__test__test',
    expected: 'test__test__test',
  },
  {
    input: 'test __test__ test',
    expected: 'test-test-test-1',
  },
];

describe('header-id-generator', () => {
  const headerIdGenerator = new HeadingIdGenerator();

  testCasesForHeaderIdGenerator.map(({ input, expected }) => {
    it(`generates header ID for |${input}| correctly`, () => {
      const actual: string = headerIdGenerator.generateId(input);
      expect(actual).toEqual(expected);
    });
  });
});
