/**
 * Minified by jsDelivr using UglifyJS v3.3.25.
 * Original file: /npm/viz.js@2.0.0/viz.js
 * 
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):e.Viz=n()}(this,function(){"use strict";var a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},d=function(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")},e=function(){function t(e,n){for(var r=0;r<n.length;r++){var t=n[r];t.enumerable=t.enumerable||!1,t.configurable=!0,"value"in t&&(t.writable=!0),Object.defineProperty(e,t.key,t)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),s=Object.assign||function(e){for(var n=1;n<arguments.length;n++){var r=arguments[n];for(var t in r)Object.prototype.hasOwnProperty.call(r,t)&&(e[t]=r[t])}return e},u=function(){function n(e){var i=this;d(this,n),this.worker=e,this.listeners=[],this.nextId=0,this.worker.addEventListener("message",function(e){var n=e.data.id,r=e.data.error,t=e.data.result;i.listeners[n](r,t),delete i.listeners[n]})}return e(n,[{key:"render",value:function(n,i){var o=this;return new Promise(function(r,t){var e=o.nextId++;o.listeners[e]=function(e,n){e?t(new Error(e.message,e.fileName,e.lineNumber)):r(n)},o.worker.postMessage({id:e,src:n,options:i})})}}]),n}(),l=function e(n,i){d(this,e);var o=n();this.render=function(r,t){return new Promise(function(e,n){try{e(i(o,r,t))}catch(e){n(e)}})}};function c(){return"devicePixelRatio"in window&&1<window.devicePixelRatio?window.devicePixelRatio:1}function f(e){var n=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},r=n.scale,o=void 0===r?c():r,t=n.mimeType,a=void 0===t?"image/png":t,i=n.quality,d=void 0===i?1:i;return new Promise(function(r,t){var i=new Image;i.onload=function(){var e=document.createElement("canvas");e.width=i.width*o,e.height=i.height*o,e.getContext("2d").drawImage(i,0,0,e.width,e.height),e.toBlob(function(e){var n=new Image;n.src=URL.createObjectURL(e),n.width=i.width,n.height=i.height,r(n)},a,d)},i.onerror=function(e){var n;n="error"in e?e.error:new Error("Error loading SVG"),t(n)},i.src="data:image/svg+xml;base64,"+btoa(encodeURIComponent(e).replace(/%([0-9A-F]{2})/g,function(e,n){return String.fromCharCode("0x"+n)}))})}return function(){function o(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},n=e.workerURL,r=e.worker,t=e.Module,i=e.render;if(d(this,o),void 0!==n)this.wrapper=new u(new Worker(n));else if(void 0!==r)this.wrapper=new u(r);else if(void 0!==t&&void 0!==i)this.wrapper=new l(t,i);else{if(void 0===o.Module||void 0===o.render)throw new Error("Must specify workerURL or worker option, Module and render options, or include one of full.render.js or lite.render.js after viz.js.");this.wrapper=new l(o.Module,o.render)}}return e(o,[{key:"renderString",value:function(e){for(var n=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},r=n.format,t=void 0===r?"svg":r,i=n.engine,o=void 0===i?"dot":i,a=n.files,d=void 0===a?[]:a,s=n.images,u=void 0===s?[]:s,l=n.yInvert,c=void 0!==l&&l,f=0;f<u.length;f++)d.push({path:u[f].path,data:'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg width="'+u[f].width+'" height="'+u[f].height+'"></svg>'});return this.wrapper.render(e,{format:t,engine:o,files:d,images:u,yInvert:c})}},{key:"renderSVGElement",value:function(e){var n=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{};return this.renderString(e,s({},n,{format:"svg"})).then(function(e){return(new DOMParser).parseFromString(e,"image/svg+xml").documentElement})}},{key:"renderImageElement",value:function(e){var n=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},r=n.scale,t=n.mimeType,i=n.quality;return this.renderString(e,s({},n,{format:"svg"})).then(function(e){return"object"===("undefined"==typeof fabric?"undefined":a(fabric))&&fabric.loadSVGFromString?function(e){var n=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},r=n.scale,t=void 0===r?c():r,i=n.mimeType,o=void 0===i?"image/png":i,a=n.quality,s=void 0===a?1:a,u=t,l=void 0;return"image/jpeg"==o?l="jpeg":"image/png"==o&&(l="png"),new Promise(function(a,d){fabric.loadSVGFromString(e,function(e,n){0==e.length&&d(new Error("Error loading SVG with Fabric"));var r=document.createElement("canvas");r.width=n.width,r.height=n.height;var t=new fabric.Canvas(r,{enableRetinaScaling:!1}),i=fabric.util.groupSVGElements(e,n);t.add(i).renderAll();var o=new Image;o.src=t.toDataURL({format:l,multiplier:u,quality:s}),o.width=n.width,o.height=n.height,a(o)})})}(e,{scale:r,mimeType:t,quality:i}):f(e,{scale:r,mimeType:t,quality:i})})}},{key:"renderJSONObject",value:function(e){var n=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},r=n.format;return"json"===r&&"json0"===r||(r="json"),this.renderString(e,s({},n,{format:r})).then(function(e){return JSON.parse(e)})}}]),o}()});
//# sourceMappingURL=/sm/47a93e02de24361cb2a4500b277736b1afc4f46791ce126f301eb4f5ebeb0c67.map