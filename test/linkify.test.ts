import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

/**
 * The links a text is given on its own (`enableLinkify`, on by default).
 * markdown-it 15 brought linkify-it 6, which recognizes fewer addresses
 * unless told to, and more besides;
 * `src/custom-markdown-it-features/linkify.ts` keeps the first as they were.
 */
describe('the links a text is given on its own', () => {
  let tmp: string;
  let notebook: Notebook;

  const render = (markdown: string): string =>
    notebook.md.render(markdown).trim();

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'linkify-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  describe('as before markdown-it 15', () => {
    test('an address without a scheme is a link', () => {
      expect(render('go to example.com and www.example.org now')).toBe(
        '<p data-source-line="1">go to <a href="http://example.com">example.com</a> and <a href="http://www.example.org">www.example.org</a> now</p>',
      );
    });

    test('an address with a user name and a password is a link', () => {
      expect(
        render(
          'see http://user:pass@example.com/a?b=c and https://user@example.com',
        ),
      ).toBe(
        '<p data-source-line="1">see <a href="http://user:pass@example.com/a?b=c">http://user:pass@example.com/a?b=c</a> and <a href="https://user@example.com">https://user@example.com</a></p>',
      );
    });

    test('a link without its scheme keeps its port', () => {
      expect(render('go to example.com:8080/x now')).toBe(
        '<p data-source-line="1">go to <a href="http://example.com:8080/x">example.com:8080/x</a> now</p>',
      );
      // an address at an IP host has neither a scheme nor a top-level domain
      expect(render('write to a@127.0.0.1 now')).toBe(
        '<p data-source-line="1">write to <a href="mailto:a@127.0.0.1">a@127.0.0.1</a> now</p>',
      );
      expect(render('at localhost:3000')).toBe(
        '<p data-source-line="1">at localhost:3000</p>',
      );
    });

    test('a name at a version is not an address', () => {
      expect(render('crossnote@0.9.44, lodash@4.17.20 and foo@bar.baz')).toBe(
        '<p data-source-line="1">crossnote@0.9.44, lodash@4.17.20 and foo@bar.baz</p>',
      );
    });

    test('an address is a link', () => {
      expect(render('write first.last@example.com or mailto:a@b.c')).toBe(
        '<p data-source-line="1">write <a href="mailto:first.last@example.com">first.last@example.com</a> or <a href="mailto:a@b.c">mailto:a@b.c</a></p>',
      );
    });

    test('a quote in front of an address is not taken up by it', () => {
      expect(
        render(`write to "john@example.com" or 'jane@example.com' now`),
      ).toBe(
        '<p data-source-line="1">write to &quot;<a href="mailto:john@example.com">john@example.com</a>&quot; or \'jane@example.com\' now</p>',
      );
    });

    test('a host is read whole, however many labels it has', () => {
      const host = 'a.b.c.d.e.f.g.h.i.j.k.example.com';
      expect(
        render(`mailto:x@${host} and x@${host} and mailto:a@b.c.d.e.f.g`),
      ).toBe(
        `<p data-source-line="1"><a href="mailto:x@${host}">mailto:x@${host}</a> and <a href="mailto:x@${host}">x@${host}</a> and <a href="mailto:a@b.c.d.e.f.g">mailto:a@b.c.d.e.f.g</a></p>`,
      );
      expect(render(`https://${host}/p //${host}/p ${host}`)).toBe(
        `<p data-source-line="1"><a href="https://${host}/p">https://${host}/p</a> <a href="//${host}/p">//${host}/p</a> <a href="http://${host}">${host}</a></p>`,
      );
    });

    test('an address whose host has no top-level domain is a link', () => {
      expect(
        render(
          'http://localhost:3000/ and http://192.168.0.1:8080/ and mailto:a@b',
        ),
      ).toBe(
        '<p data-source-line="1"><a href="http://localhost:3000/">http://localhost:3000/</a> and <a href="http://192.168.0.1:8080/">http://192.168.0.1:8080/</a> and <a href="mailto:a@b">mailto:a@b</a></p>',
      );
    });

    test('a long link is not cut', () => {
      const address = 'http://example.com/' + 'a'.repeat(10050);
      expect(render(address)).toBe(
        `<p data-source-line="1"><a href="${address}">${address}</a></p>`,
      );
    });

    test('a link is found wherever the marks of markdown put it', () => {
      expect(
        render(
          '_example.com_ and __http://example.com__ and \\_http://example.com\\_',
        ),
      ).toBe(
        '<p data-source-line="1"><em><a href="http://example.com">example.com</a></em> and <strong><a href="http://example.com">http://example.com</a></strong> and _<a href="http://example.com">http://example.com</a>_</p>',
      );
      expect(render('*foo@bar.com* and **http://example.com**')).toBe(
        '<p data-source-line="1"><em><a href="mailto:foo@bar.com">foo@bar.com</a></em> and <strong><a href="http://example.com">http://example.com</a></strong></p>',
      );
      expect(render('`code`foo@bar.com and `code`http://example.com')).toBe(
        '<p data-source-line="1"><code>code</code><a href="mailto:foo@bar.com">foo@bar.com</a> and <code>code</code><a href="http://example.com">http://example.com</a></p>',
      );
    });

    test('an address within a word is not a link', () => {
      expect(render('x_http://example.com_x and foo_example.com_bar')).toBe(
        '<p data-source-line="1">x_http://example.com_x and foo_example.com_bar</p>',
      );
    });

    test('a text with the marks of a link and no link is left as it is', () => {
      expect(render('e.g. i.e. foo_bar_baz a@b __init__ _private_ a.b.c')).toBe(
        '<p data-source-line="1">e.g. i.e. foo_bar_baz a@b <strong>init</strong> <em>private</em> a.b.c</p>',
      );
    });

    test('code is left alone', () => {
      const html = render(
        '`http://example.com`\n\n```\nhttp://example.com\n```\n\n[link](http://example.com)',
      );
      expect(html.split('<a ').length - 1).toBe(1);
      expect(html).toContain('<code>http://example.com</code>');
    });
  });

  describe('the module itself', () => {
    test('a pattern of the module is made once', () => {
      // linkify-it asks the `//` schema for its validator at every `//` of a
      // text: made again each time, a page of them takes seconds.
      const { re } = notebook.md.linkify;
      expect(re.get_relative_proto_validator()).toBe(
        re.get_relative_proto_validator(),
      );
      expect(re.get_fuzzy_url_host_port()).toBe(re.get_fuzzy_url_host_port());
    });

    test('a schema or a top-level domain given to linkify afterwards is found', async () => {
      // a library that uses crossnote can teach `notebook.md.linkify` its own
      const other = fs.mkdtempSync(path.join(os.tmpdir(), 'linkify-added-'));
      try {
        const notebook2 = await Notebook.init({
          notebookPath: other,
          config: { markdownParser: 'markdown-it' },
        });
        notebook2.md.linkify.add('skype:', {
          // the text behind the prefix; its length, or 0
          validate: (text, pos) =>
            /^[a-z]+/.exec(text.slice(pos))?.[0].length ?? 0,
        });
        notebook2.md.linkify.tlds('onion', true);
        expect(
          notebook2.md.render('call skype:john or see foo.onion/x').trim(),
        ).toBe(
          '<p data-source-line="1">call <a href="skype:john">skype:john</a> or see <a href="http://foo.onion/x">foo.onion/x</a></p>',
        );
      } finally {
        fs.rmSync(other, { recursive: true, force: true });
      }
    });
  });

  describe('new with markdown-it 15', () => {
    test('an address without a scheme is a link inside every mark of markdown', () => {
      // Not linkify-it's: a text is asked again with its punctuation read as
      // spaces, so the address is found in what a highlight, a superscript, a
      // subscript and a strikethrough enclose, as one in an emphasis was before.
      expect(
        render(
          '==example.com== and x^example.com^y and H~example.com~O and ~~example.com~~',
        ),
      ).toBe(
        '<p data-source-line="1"><mark><a href="http://example.com">example.com</a></mark> and x<sup><a href="http://example.com">example.com</a></sup>y and H<sub><a href="http://example.com">example.com</a></sub>O and <s><a href="http://example.com">example.com</a></s></p>',
      );
    });

    test('a link ends where punctuation of the text begins', () => {
      expect(render('https://example.com/path。后面的文字')).toBe(
        '<p data-source-line="1"><a href="https://example.com/path">https://example.com/path</a>。后面的文字</p>',
      );
      expect(render('https://example.com/x’s')).toBe(
        '<p data-source-line="1"><a href="https://example.com/x">https://example.com/x</a>’s</p>',
      );
    });

    test('an IPv6 address is a link', () => {
      expect(render('http://[2001:db8::1]:8080/path')).toBe(
        '<p data-source-line="1"><a href="http://[2001:db8::1]:8080/path">http://[2001:db8::1]:8080/path</a></p>',
      );
    });

    test('parentheses in a link are balanced', () => {
      expect(render('http://example.com/(a(b)c)')).toBe(
        '<p data-source-line="1"><a href="http://example.com/(a(b)c)">http://example.com/(a(b)c)</a></p>',
      );
    });

    test('a link ends before a bracket that is left open', () => {
      expect(render('https://example.com/((a)')).toBe(
        '<p data-source-line="1"><a href="https://example.com/">https://example.com/</a>((a)</p>',
      );
    });
  });
});
