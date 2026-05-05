# Tag Syntax Test {#tag-syntax-test  data-source-line="1"}

Here is a #mytag in the middle of text.

Multiple tags: #tag1 and #tag2

Nested tag: #parent/child

#not-a-heading should render as text with tag

Tags should not match in `#inline-code` or code blocks:
``` {data-source-line="12"}
#not-a-tag
```
