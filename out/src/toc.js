"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uslug = require("uslug");
function nPrefix(str, n) {
    let output = '';
    for (let i = 0; i < n; i++) {
        output += str;
    }
    return output;
}
/**
 *  eg:
 * Haha [A](www.a.com) xxx [B](www.b.com)
 *  should become
 * Haha A xxx B
 *
 * check issue #41
 */
function sanitizeContent(content) {
    let output = '';
    let offset = 0;
    // test ![...](...)
    // test [...](...)
    // <a name="myAnchor"></a>Anchor Header
    // test [^footnote]
    let r = /\!?\[([^\]]*)\]\(([^)]*)\)|<([^>]*)>([^<]*)<\/([^>]*)>|\[\^([^\]]*)\]/g;
    let match = null;
    while (match = r.exec(content)) {
        output += content.slice(offset, match.index);
        offset = match.index + match[0].length;
        if (match[0][0] === '<')
            output += match[4];
        else if (match[0][0] === '[' && match[0][1] === '^')
            output += '';
        else if (match[0][0] !== '!')
            output += match[1];
        else
            output += match[0];
    }
    output += content.slice(offset, content.length);
    return output;
}
/**
 *
 * @param opt:tocOption =
 * @param tokens = [{content:string, level:number, id:optional|string }]
 * @return {content, array}
 */
function toc(tokens, opt) {
    if (!tokens)
        return { content: '', array: [] };
    const ordered = opt.ordered;
    const depthFrom = opt.depthFrom || 1;
    const depthTo = opt.depthTo || 6;
    let tab = opt.tab || '\t';
    if (ordered)
        tab = '    ';
    tokens = tokens.filter((token) => {
        return token.level >= depthFrom && token.level <= depthTo;
    });
    if (!(tokens.length))
        return { content: '', array: [] };
    const outputArr = [];
    const tocTable = {};
    let smallestLevel = tokens[0].level;
    // get smallestLevel
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].level < smallestLevel)
            smallestLevel = tokens[i].level;
    }
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const content = token.content;
        const level = token.level;
        let slug = token.id || uslug(content);
        if (tocTable[slug] >= 0) {
            tocTable[slug] += 1;
            slug += '-' + tocTable[slug];
        }
        else {
            tocTable[slug] = 0;
        }
        const listItem = `${nPrefix(tab, level - smallestLevel)}${ordered ? "1." : '*'} [${sanitizeContent(content)}](#${slug})`;
        outputArr.push(listItem);
    }
    return {
        content: outputArr.join('\n'),
        array: outputArr
    };
}
exports.toc = toc;
