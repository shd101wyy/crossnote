import type { MarkdownIt } from 'markdown-it';
import { type LinkifyIt, REBuilder } from 'linkify-it';

/**
 * The regex builder of linkify-it with the rules for a host of linkify-it 5.
 *
 * The part before the `@` is read with the characters markdown allows, and
 * not with those of RFC 5322: since linkify-it 6 a quote, an asterisk or a
 * brace in front of an address is taken to be part of it (`'john@example.com'`).
 * The host of an address written without `mailto:` ends in a top-level domain
 * of the list that recognizes an address without a scheme (`example.com`) or
 * in an IP address, as before 6: linkify-it 6 takes any label there, so
 * `crossnote@0.9.44` and `lodash@4.17.20` become links. A host has any number
 * of labels and a link written without its scheme keeps its port
 * (`example.com:8080`), as before 6: linkify-it 6 reads at most eleven labels,
 * five in the host of an address, and no port.
 *
 * Every pattern is made once and kept, as the base class keeps its own: the
 * `//` schema asks for its validator at every `//` of a text.
 */
class LinkifyREBuilder extends REBuilder {
  get_mail_name(): RegExp {
    return (this.cache.src_mail_name ??= new RegExp(
      '[;\\-:&=+\\$,.a-zA-Z0-9_][;\\-:&=+\\$,"\\.a-zA-Z0-9_]{0,63}',
    ));
  }

  private labels(min: number, last: string): string {
    return `(?:(?:${this.get_domain().source})[.]){${min},}(?:${last})`;
  }

  get_fuzzy_mail_host(): RegExp {
    return (this.cache.src_fuzzy_mail_host ??= new RegExp(
      `(?:${this.get_ipv4_addr().source}|${this.get_ipv6_mail_host().source}|${this.labels(1, this.get_tld().source)})${this.get_host_terminator().source}`,
    ));
  }

  get_mail_host(): RegExp {
    return (this.cache.src_mail_host ??= new RegExp(
      `(?:${this.get_ipv6_mail_host().source}|${this.labels(0, this.get_domain().source)})${this.get_host_terminator().source}`,
    ));
  }

  get_url_host_port(): RegExp {
    return (this.cache.url_host_port ??= new RegExp(
      `(?:${this.get_ipv6_url_host().source}|${this.labels(0, this.get_domain().source)})${this.get_port().source}${this.get_host_terminator().source}`,
    ));
  }

  get_fuzzy_url_host_port(): RegExp {
    return (this.cache.fuzzy_url_host_port ??= new RegExp(
      `(?:${this.opts.fuzzyIP ? `${this.get_ipv4_addr().source}|` : ''}${this.labels(1, this.get_tld().source)})${this.get_port().source}${this.get_host_terminator().source}`,
    ));
  }

  get_relative_proto_validator(): RegExp {
    return (this.cache.relative_proto_validator ??= new RegExp(
      `${this.opts.urlAuth ? this.get_auth().source : ''}(?:localhost|${this.get_ipv6_url_host().source}|${this.labels(1, this.get_domain_root().source)})${this.get_port().source}${this.get_host_terminator().source}${this.get_path().source}`,
      'iy',
    ));
  }
}

/**
 * Keep the addresses markdown-it 14 made into links.
 *
 * - An address without a scheme (`example.com`) and one with a user name and
 *   a password in it (`http://user:pass@example.com/`) are links again:
 *   linkify-it 6 recognizes neither unless told to. A link is not cut at its
 *   10 000th character either.
 * - markdown-it 15 passes over an inline block unless linkify-it finds a link
 *   in its raw text, and an address between underscores is one linkify-it
 *   finds only once the delimiters around it are split into tokens
 *   (`_example.com_`, `_foo@bar.com_`). So a text is also asked about with
 *   its punctuation and symbols read as spaces; the links are then still
 *   taken from the text as written. That treats every mark alike: an address
 *   without a scheme is a link inside a highlight, a superscript, a subscript
 *   and a strikethrough too, where the quick check of markdown-it 14 let one
 *   through inside an emphasis and in strong text only.
 * - linkify-it 6 looks for an address without a scheme with one large pattern,
 *   which it runs over the whole text (linkify-it #126). A text without a
 *   scheme linkify-it knows, an `@` or a dotted name that ends in a top-level
 *   domain of its list has no link and is not handed to it (markdown-it 14
 *   asked a small pattern first too).
 */
export default (md: MarkdownIt) => {
  const { linkify } = md;
  linkify.re = new LinkifyREBuilder();
  linkify.set({
    fuzzyLink: true,
    urlAuth: true,
    maxLength: Number.MAX_SAFE_INTEGER,
  });

  // Built again whenever linkify-it is given another schema or top-level
  // domain: `add`, `tlds` and `set` empty its cache then.
  let cache = linkify.re.cache;
  let mayHaveLink = mayHaveLinkPattern(linkify);
  const test = linkify.test.bind(linkify);
  const match = linkify.match.bind(linkify);
  linkify.test = (text: string) => {
    if (linkify.re.cache !== cache) {
      cache = linkify.re.cache;
      mayHaveLink = mayHaveLinkPattern(linkify);
    }
    return (
      mayHaveLink.test(text) &&
      (test(text) || test(text.replace(/(?![.@:/])[\p{P}\p{S}]/gu, ' ')))
    );
  };
  // linkify-it 6 answers `null` where 5 answered an empty array.
  linkify.match = (text: string) => match(text) ?? [];
};

/**
 * Whether a text can hold a link at all: the mark of a scheme linkify-it
 * knows, an `@`, or a dotted name that ends in a top-level domain of its list.
 */
function mayHaveLinkPattern(linkify: LinkifyIt): RegExp {
  const schemas = linkify.re.get_schema_names().source;
  return new RegExp(
    [
      '//',
      '@',
      `\\.(?:${linkify.re.get_tld().source})(?![a-z0-9])`,
      schemas,
    ].join('|'),
    'i',
  );
}
