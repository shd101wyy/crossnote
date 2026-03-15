---
description: Security rules for HTML sanitization
globs: ["src/markdown-engine/**", "src/webview/**", "src/render-enhancers/**"]
---

# HTML Sanitization Rules

All rendered markdown HTML passes through untrusted user content. Follow these rules to prevent XSS vulnerabilities (ref: CVE-2025-65716).

## Server-side (src/markdown-engine/)

- All HTML from `md.render()` is sanitized in `parseMD` via `sanitizeRenderedHTML($)` before extraction
- If you add a new render enhancer that produces HTML, ensure it runs BEFORE the `sanitizeRenderedHTML($)` call in `parseMD`
- Never construct HTML strings from user input without escaping — use `html-escaper`'s `escape()` for text content
- The cheerio `$` instance in `parseMD` is the single chokepoint — do not bypass it by returning raw HTML

## Client-side (src/webview/)

- Import `sanitizeHtml` from `../lib/sanitize` (or `./lib/sanitize`)
- Always sanitize before `innerHTML` assignment: `el.innerHTML = sanitizeHtml(html)`
- Always sanitize before `dangerouslySetInnerHTML`: `{{ __html: sanitizeHtml(html) }}`
- SVG output from third-party renderers (mermaid, wavedrom, vega) must also be sanitized

## Dangerous patterns to avoid

```typescript
// ❌ NEVER DO THIS — raw HTML injection
element.innerHTML = untrustedHtml;
<div dangerouslySetInnerHTML={{ __html: untrustedHtml }} />

// ✅ ALWAYS sanitize first
element.innerHTML = sanitizeHtml(untrustedHtml);
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(untrustedHtml) }} />
```

## Iframe handling

- All `<iframe>` elements get `sandbox=""` (maximum restrictions)
- `srcdoc` attribute is always stripped
- `javascript:` and `data:text/html` URLs in `src` are stripped
