# MUME
The core library for:

* [markdown preview enhanced for atom](https://github.com/shd101wyy/markdown-preview-enhanced)
* [markdown preview enhanced for vscode](https://github.com/shd101wyy/vscode-markdown-preview-enhanced)

This documentation will be released sooooon...

```sh
npm install --save @shd101wyy/mume
```


## Example

```javascript 
const mume = require('./out/src/mume.js')

async function main() {
  await mume.init()

  const engine = new mume.MarkdownEngine({
    filePath: "/Users/wangyiyi/Desktop/markdown-example/test3.md",
    config: {
      previewTheme: "newsprint.css",
      codeBlockTheme: "atom-dark.css" 
    }
  })

  await engine.saveAsHTML({offline: false, runAllCodeChunks: true})
  return process.exit()
}

main()
```