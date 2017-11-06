# 0.2.4
* Fixed PDF page import order issue.  
* Fixed id=`exports` element error [#671](https://github.com/shd101wyy/markdown-preview-enhanced/issues/671).  
* Fixed `maxBuffer` issue [#660](https://github.com/shd101wyy/markdown-preview-enhanced/issues/660).  
* Fixed ebook export UTF-8 link issue [#666](https://github.com/shd101wyy/markdown-preview-enhanced/issues/666).
* Fixed html export font import bug [#655](https://github.com/shd101wyy/markdown-preview-enhanced/issues/655).    

# 0.2.3 
* ~~Support `Reading mode`~~.  
* Supported [markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) and [font-awesome](https://github.com/FortAwesome/Font-Awesome).  
* Fixed pandoc code block bug.  

# 0.2.2
* Added `enableCriticMarkupSyntax` option. enableCriticMarkupSyntax. [Syntax guide](http://criticmarkup.com/users-guide.php).  
* Added `toc` config to front-matter for `[TOC]` and sidebar TOC [#606](https://github.com/shd101wyy/markdown-preview-enhanced/issues/606).  
* Fixed ordered list TODO box bug [#592](https://github.com/shd101wyy/markdown-preview-enhanced/issues/592).  
* Upgraded `KaTeX` to version `0.8.3`.  
* Changed `MathJax` CDN url.  
* Fixed markdown export math issue [#601](https://github.com/shd101wyy/markdown-preview-enhanced/issues/601).  

# 0.2.1 
* Added `ignoreLink` option to TOC [#583](https://github.com/shd101wyy/markdown-preview-enhanced/issues/583).  
* Fixed issue [#585](https://github.com/shd101wyy/markdown-preview-enhanced/issues/585), [#586](https://github.com/shd101wyy/markdown-preview-enhanced/issues/585).  

# 0.2.0
* Only display the scrollbar of code block when you actually scroll it.  
* Try [puppeteer](https://github.com/GoogleChrome/puppeteer).  
* Upgrade KaTeX to `0.8.2` (Check CDN). 

# 0.1.9
* Changed `printBackground` logic.  
* Fixed presentation export style bug.  
* Added `style.less` compilation error messages.  
* Upgraded several dependencies.  

# 0.1.8 
* atom version sync source bug.  
* check vscode markdown preview scroll sync element highlight logic.  (**<= not done**)

# 0.1.7  
* ~~https://github.com/hakimel/reveal.js/issues/1949#issuecomment-318869906.~~    
* ~~Change `fs.watch` to `fs.watchFile`~~.    
* Change presentation `data-...` attributes to be appended directly to `<section>` tag.  
* Add `paypal.me` paypal.me/shd101wyy link.  
* Change customize css doc.   
* Put `wavedrome` back.  
* Revealjs front-matter `presentation: path_to_js_file` support.  (**<= not done**)
* Fix `vega` not first time rendering bug. (**<= not fixed**)   
* `width height class` attributes for `PlantUML` and `GraphViz` svg diagrams. (**<= not done**)  

# 0.1.6
* Supported [vega](https://vega.github.io/vega/) and [vega-lite](https://vega.github.io/vega-lite/).   
* Supported [ditaa](https://github.com/stathissideris/ditaa).  
* Changed the key-value pair way of writing attributes to the pandoc way.   
* Supported multiple new preview themes and code block themes ported from atom.    

# 0.1.5
* Fixed `webview.ts` `clickTagA` action bug.  

# 0.1.4
* Fixed header id bug [#516](https://github.com/shd101wyy/markdown-preview-enhanced/issues/516).  
* Fixed `enableExtendedTableSyntax` bug.  
* Fixed `MathJax` init error.  
* Fixed plain text code block font size issue.  
* Fixed `transformMarkdown` function `Maximum call stack size exceeded` issue [515](https://github.com/shd101wyy/markdown-preview-enhanced/issues/515), [#517](https://github.com/shd101wyy/markdown-preview-enhanced/issues/517).  

