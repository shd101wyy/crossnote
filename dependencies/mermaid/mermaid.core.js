(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["mermaid"] = factory();
	else
		root["mermaid"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/mermaid.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/dark/index.scss":
/*!*****************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/dark/index.scss ***!
  \*****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon {\n  fill: #BDD5EA;\n  stroke: purple;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: lightgrey; }\n\n.edgePath .path {\n  stroke: lightgrey;\n  stroke-width: 1.5px; }\n\n.edgeLabel {\n  background-color: #e8e8e8;\n  text-align: center; }\n\n.cluster rect {\n  fill: #6D6D65;\n  stroke: rgba(255, 255, 255, 0.25);\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #F9FFFE; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #6D6D65;\n  border: 1px solid rgba(255, 255, 255, 0.25);\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #81B1DB;\n  fill: #BDD5EA; }\n\ntext.actor {\n  fill: black;\n  stroke: none; }\n\n.actor-line {\n  stroke: lightgrey; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: lightgrey; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: lightgrey; }\n\n#arrowhead {\n  fill: lightgrey; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: lightgrey; }\n\n#crosshead path {\n  fill: lightgrey !important;\n  stroke: lightgrey !important; }\n\n.messageText {\n  fill: lightgrey;\n  stroke: none; }\n\n.labelBox {\n  stroke: #81B1DB;\n  fill: #BDD5EA; }\n\n.labelText {\n  fill: #323D47;\n  stroke: none; }\n\n.loopText {\n  fill: lightgrey;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2;\n  stroke-dasharray: '2 2';\n  stroke: #81B1DB; }\n\n.note {\n  stroke: rgba(255, 255, 255, 0.25);\n  fill: #fff5ad; }\n\n.noteText {\n  fill: black;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 14px; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: rgba(255, 255, 255, 0.3); }\n\n.section2 {\n  fill: #EAE8B9; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #F9FFFE; }\n\n.sectionTitle1 {\n  fill: #F9FFFE; }\n\n.sectionTitle2 {\n  fill: #F9FFFE; }\n\n.sectionTitle3 {\n  fill: #F9FFFE; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: lightgrey;\n  opacity: 0.3;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: #DB5757;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: #323D47;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: #323D47;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: #323D47; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #BDD5EA;\n  stroke: rgba(255, 255, 255, 0.5); }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: lightgrey; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: lightgrey; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #81B1DB;\n  stroke: rgba(255, 255, 255, 0.5); }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: #323D47 !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: grey;\n  fill: lightgrey;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: #323D47 !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #E83737;\n  fill: #E83737;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #E83737;\n  fill: #81B1DB;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #E83737;\n  fill: lightgrey;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: #323D47 !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: #323D47 !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: #323D47;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: purple;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.classGroup rect {\n  fill: #BDD5EA;\n  stroke: purple; }\n\ng.classGroup line {\n  stroke: purple;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #BDD5EA;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: purple;\n  font-size: 10px; }\n\n.relation {\n  stroke: purple;\n  stroke-width: 1;\n  fill: none; }\n\n#compositionStart {\n  fill: purple;\n  stroke: purple;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: purple;\n  stroke: purple;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #BDD5EA;\n  stroke: purple;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #BDD5EA;\n  stroke: purple;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: purple;\n  stroke: purple;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: purple;\n  stroke: purple;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: purple;\n  stroke: purple;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: purple;\n  stroke: purple;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: #323D47;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: purple;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: purple;\n  stroke: none;\n  font-size: 10px; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #BDD5EA;\n  stroke: purple; }\n\ng.stateGroup line {\n  stroke: purple;\n  stroke-width: 1; }\n\n.transition {\n  stroke: purple;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: rgba(255, 255, 255, 0.25);\n  fill: #fff5ad; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #BDD5EA;\n  opacity: 0.5; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/default/index.scss":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/default/index.scss ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: #333333; }\n\n.edgePath .path {\n  stroke: #333333;\n  stroke-width: 1.5px; }\n\n.edgeLabel {\n  background-color: #e8e8e8;\n  text-align: center; }\n\n.cluster rect {\n  fill: #ffffde;\n  stroke: #aaaa33;\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #333; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #ffffde;\n  border: 1px solid #aaaa33;\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #CCCCFF;\n  fill: #ECECFF; }\n\ntext.actor {\n  fill: black;\n  stroke: none; }\n\n.actor-line {\n  stroke: grey; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: #333; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: #333; }\n\n#arrowhead {\n  fill: #333; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: #333; }\n\n#crosshead path {\n  fill: #333 !important;\n  stroke: #333 !important; }\n\n.messageText {\n  fill: #333;\n  stroke: none; }\n\n.labelBox {\n  stroke: #CCCCFF;\n  fill: #ECECFF; }\n\n.labelText {\n  fill: black;\n  stroke: none; }\n\n.loopText {\n  fill: black;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2;\n  stroke-dasharray: '2 2';\n  stroke: #CCCCFF; }\n\n.note {\n  stroke: #aaaa33;\n  fill: #fff5ad; }\n\n.noteText {\n  fill: black;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 14px; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: rgba(102, 102, 255, 0.49); }\n\n.section2 {\n  fill: #fff400; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #333; }\n\n.sectionTitle1 {\n  fill: #333; }\n\n.sectionTitle2 {\n  fill: #333; }\n\n.sectionTitle3 {\n  fill: #333; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: lightgrey;\n  opacity: 0.3;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: red;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: black;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: black;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: white; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #8a90dd;\n  stroke: #534fbc; }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: black; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: black; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #bfc7ff;\n  stroke: #534fbc; }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: black !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: grey;\n  fill: lightgrey;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: black !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #ff8888;\n  fill: red;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #ff8888;\n  fill: #bfc7ff;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #ff8888;\n  fill: lightgrey;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: black !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: black !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #9370DB;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.classGroup rect {\n  fill: #ECECFF;\n  stroke: #9370DB; }\n\ng.classGroup line {\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #ECECFF;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #9370DB;\n  font-size: 10px; }\n\n.relation {\n  stroke: #9370DB;\n  stroke-width: 1;\n  fill: none; }\n\n#compositionStart {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #ECECFF;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #9370DB;\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #9370DB;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #9370DB;\n  stroke: none;\n  font-size: 10px; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #ECECFF;\n  stroke: #9370DB; }\n\ng.stateGroup line {\n  stroke: #9370DB;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #9370DB;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: #aaaa33;\n  fill: #fff5ad; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #ECECFF;\n  opacity: 0.5; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/forest/index.scss":
/*!*******************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/forest/index.scss ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: green; }\n\n.edgePath .path {\n  stroke: green;\n  stroke-width: 1.5px; }\n\n.edgeLabel {\n  background-color: #e8e8e8;\n  text-align: center; }\n\n.cluster rect {\n  fill: #cdffb2;\n  stroke: #6eaa49;\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #333; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #cdffb2;\n  border: 1px solid #6eaa49;\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #13540c;\n  fill: #cde498; }\n\ntext.actor {\n  fill: black;\n  stroke: none; }\n\n.actor-line {\n  stroke: grey; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: #333; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: #333; }\n\n#arrowhead {\n  fill: #333; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: #333; }\n\n#crosshead path {\n  fill: #333 !important;\n  stroke: #333 !important; }\n\n.messageText {\n  fill: #333;\n  stroke: none; }\n\n.labelBox {\n  stroke: #326932;\n  fill: #cde498; }\n\n.labelText {\n  fill: black;\n  stroke: none; }\n\n.loopText {\n  fill: black;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2;\n  stroke-dasharray: '2 2';\n  stroke: #326932; }\n\n.note {\n  stroke: #6eaa49;\n  fill: #fff5ad; }\n\n.noteText {\n  fill: black;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 14px; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: #6eaa49; }\n\n.section2 {\n  fill: #6eaa49; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #333; }\n\n.sectionTitle1 {\n  fill: #333; }\n\n.sectionTitle2 {\n  fill: #333; }\n\n.sectionTitle3 {\n  fill: #333; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: lightgrey;\n  opacity: 0.3;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: red;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: black;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: black;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: white; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #487e3a;\n  stroke: #13540c; }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: black; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: black; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #cde498;\n  stroke: #13540c; }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: black !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: grey;\n  fill: lightgrey;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: black !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #ff8888;\n  fill: red;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #ff8888;\n  fill: #cde498;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #ff8888;\n  fill: lightgrey;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: black !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: black !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #13540c;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.classGroup rect {\n  fill: #cde498;\n  stroke: #13540c; }\n\ng.classGroup line {\n  stroke: #13540c;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #cde498;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #13540c;\n  font-size: 10px; }\n\n.relation {\n  stroke: #13540c;\n  stroke-width: 1;\n  fill: none; }\n\n#compositionStart {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #cde498;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #13540c;\n  stroke: #13540c;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: black;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #13540c;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #13540c;\n  stroke: none;\n  font-size: 10px; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #cde498;\n  stroke: #13540c; }\n\ng.stateGroup line {\n  stroke: #13540c;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #13540c;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: #6eaa49;\n  fill: #fff5ad; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #cde498;\n  opacity: 0.5; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/neutral/index.scss":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/neutral/index.scss ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js")(false);
// Module
exports.push([module.i, "/* Flowchart variables */\n/* Sequence Diagram variables */\n/* Gantt chart variables */\n/* state colors */\n.label {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  color: #333; }\n\n.label text {\n  fill: #333; }\n\n.node rect,\n.node circle,\n.node ellipse,\n.node polygon {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1px; }\n\n.node .label {\n  text-align: center; }\n\n.node.clickable {\n  cursor: pointer; }\n\n.arrowheadPath {\n  fill: #333333; }\n\n.edgePath .path {\n  stroke: #666;\n  stroke-width: 1.5px; }\n\n.edgeLabel {\n  background-color: white;\n  text-align: center; }\n\n.cluster rect {\n  fill: #eaf2fb;\n  stroke: #26a;\n  stroke-width: 1px; }\n\n.cluster text {\n  fill: #333; }\n\ndiv.mermaidTooltip {\n  position: absolute;\n  text-align: center;\n  max-width: 200px;\n  padding: 2px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 12px;\n  background: #eaf2fb;\n  border: 1px solid #26a;\n  border-radius: 2px;\n  pointer-events: none;\n  z-index: 100; }\n\n.actor {\n  stroke: #999;\n  fill: #eee; }\n\ntext.actor {\n  fill: #333;\n  stroke: none; }\n\n.actor-line {\n  stroke: #666; }\n\n.messageLine0 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: #333; }\n\n.messageLine1 {\n  stroke-width: 1.5;\n  stroke-dasharray: '2 2';\n  stroke: #333; }\n\n#arrowhead {\n  fill: #333; }\n\n.sequenceNumber {\n  fill: white; }\n\n#sequencenumber {\n  fill: #333; }\n\n#crosshead path {\n  fill: #333 !important;\n  stroke: #333 !important; }\n\n.messageText {\n  fill: #333;\n  stroke: none; }\n\n.labelBox {\n  stroke: #999;\n  fill: #eee; }\n\n.labelText {\n  fill: #333;\n  stroke: none; }\n\n.loopText {\n  fill: #333;\n  stroke: none; }\n\n.loopLine {\n  stroke-width: 2;\n  stroke-dasharray: '2 2';\n  stroke: #999; }\n\n.note {\n  stroke: #777700;\n  fill: #ffa; }\n\n.noteText {\n  fill: black;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 14px; }\n\n.activation0 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation1 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n.activation2 {\n  fill: #f4f4f4;\n  stroke: #666; }\n\n/** Section styling */\n.mermaid-main-font {\n  font-family: \"trebuchet ms\", verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.section {\n  stroke: none;\n  opacity: 0.2; }\n\n.section0 {\n  fill: #80b3e6; }\n\n.section2 {\n  fill: #80b3e6; }\n\n.section1,\n.section3 {\n  fill: white;\n  opacity: 0.2; }\n\n.sectionTitle0 {\n  fill: #333; }\n\n.sectionTitle1 {\n  fill: #333; }\n\n.sectionTitle2 {\n  fill: #333; }\n\n.sectionTitle3 {\n  fill: #333; }\n\n.sectionTitle {\n  text-anchor: start;\n  font-size: 11px;\n  text-height: 14px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n/* Grid and axis */\n.grid .tick {\n  stroke: #e6e6e6;\n  opacity: 0.3;\n  shape-rendering: crispEdges; }\n  .grid .tick text {\n    font-family: 'trebuchet ms', verdana, arial;\n    font-family: var(--mermaid-font-family); }\n\n.grid path {\n  stroke-width: 0; }\n\n/* Today line */\n.today {\n  fill: none;\n  stroke: #d42;\n  stroke-width: 2px; }\n\n/* Task styling */\n/* Default task */\n.task {\n  stroke-width: 2; }\n\n.taskText {\n  text-anchor: middle;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskText:not([font-size]) {\n  font-size: 11px; }\n\n.taskTextOutsideRight {\n  fill: #333;\n  text-anchor: start;\n  font-size: 11px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.taskTextOutsideLeft {\n  fill: #333;\n  text-anchor: end;\n  font-size: 11px; }\n\n/* Special case clickable */\n.task.clickable {\n  cursor: pointer; }\n\n.taskText.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideLeft.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n.taskTextOutsideRight.clickable {\n  cursor: pointer;\n  fill: #003163 !important;\n  font-weight: bold; }\n\n/* Specific task settings for the sections*/\n.taskText0,\n.taskText1,\n.taskText2,\n.taskText3 {\n  fill: white; }\n\n.task0,\n.task1,\n.task2,\n.task3 {\n  fill: #26a;\n  stroke: #1a4d80; }\n\n.taskTextOutside0,\n.taskTextOutside2 {\n  fill: #333; }\n\n.taskTextOutside1,\n.taskTextOutside3 {\n  fill: #333; }\n\n/* Active task */\n.active0,\n.active1,\n.active2,\n.active3 {\n  fill: #eee;\n  stroke: #1a4d80; }\n\n.activeText0,\n.activeText1,\n.activeText2,\n.activeText3 {\n  fill: #333 !important; }\n\n/* Completed task */\n.done0,\n.done1,\n.done2,\n.done3 {\n  stroke: #666;\n  fill: #bbb;\n  stroke-width: 2; }\n\n.doneText0,\n.doneText1,\n.doneText2,\n.doneText3 {\n  fill: #333 !important; }\n\n/* Tasks on the critical line */\n.crit0,\n.crit1,\n.crit2,\n.crit3 {\n  stroke: #b1361b;\n  fill: #d42;\n  stroke-width: 2; }\n\n.activeCrit0,\n.activeCrit1,\n.activeCrit2,\n.activeCrit3 {\n  stroke: #b1361b;\n  fill: #eee;\n  stroke-width: 2; }\n\n.doneCrit0,\n.doneCrit1,\n.doneCrit2,\n.doneCrit3 {\n  stroke: #b1361b;\n  fill: #bbb;\n  stroke-width: 2;\n  cursor: pointer;\n  shape-rendering: crispEdges; }\n\n.milestone {\n  transform: rotate(45deg) scale(0.8, 0.8); }\n\n.milestoneText {\n  font-style: italic; }\n\n.doneCritText0,\n.doneCritText1,\n.doneCritText2,\n.doneCritText3 {\n  fill: #333 !important; }\n\n.activeCritText0,\n.activeCritText1,\n.activeCritText2,\n.activeCritText3 {\n  fill: #333 !important; }\n\n.titleText {\n  text-anchor: middle;\n  font-size: 18px;\n  fill: #333;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.classGroup text {\n  fill: #999;\n  stroke: none;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family);\n  font-size: 10px; }\n  g.classGroup text .title {\n    font-weight: bolder; }\n\ng.classGroup rect {\n  fill: #eee;\n  stroke: #999; }\n\ng.classGroup line {\n  stroke: #999;\n  stroke-width: 1; }\n\n.classLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #eee;\n  opacity: 0.5; }\n\n.classLabel .label {\n  fill: #999;\n  font-size: 10px; }\n\n.relation {\n  stroke: #999;\n  stroke-width: 1;\n  fill: none; }\n\n#compositionStart {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#compositionEnd {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#aggregationStart {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1; }\n\n#aggregationEnd {\n  fill: #eee;\n  stroke: #999;\n  stroke-width: 1; }\n\n#dependencyStart {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#dependencyEnd {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#extensionStart {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n#extensionEnd {\n  fill: #999;\n  stroke: #999;\n  stroke-width: 1; }\n\n.commit-id,\n.commit-msg,\n.branch-label {\n  fill: lightgrey;\n  color: lightgrey;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.pieTitleText {\n  text-anchor: middle;\n  font-size: 25px;\n  fill: #333;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n.slice {\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #999;\n  stroke: none;\n  font-size: 10px;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\ng.stateGroup text {\n  fill: #999;\n  stroke: none;\n  font-size: 10px; }\n\ng.stateGroup .state-title {\n  font-weight: bolder;\n  fill: black; }\n\ng.stateGroup rect {\n  fill: #eee;\n  stroke: #999; }\n\ng.stateGroup line {\n  stroke: #999;\n  stroke-width: 1; }\n\n.transition {\n  stroke: #999;\n  stroke-width: 1;\n  fill: none; }\n\n.stateGroup .composit {\n  fill: white;\n  border-bottom: 1px; }\n\n.stateGroup .alt-composit {\n  fill: #e0e0e0;\n  border-bottom: 1px; }\n\n.state-note {\n  stroke: #777700;\n  fill: #ffa; }\n  .state-note text {\n    fill: black;\n    stroke: none;\n    font-size: 10px; }\n\n.stateLabel .box {\n  stroke: none;\n  stroke-width: 0;\n  fill: #eee;\n  opacity: 0.5; }\n\n.stateLabel text {\n  fill: black;\n  font-size: 10px;\n  font-weight: bold;\n  font-family: 'trebuchet ms', verdana, arial;\n  font-family: var(--mermaid-font-family); }\n\n:root {\n  --mermaid-font-family: '\"trebuchet ms\", verdana, arial';\n  --mermaid-font-family: \"Comic Sans MS\", \"Comic Sans\", cursive; }\n", ""]);



/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function (useSourceMap) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item, useSourceMap);

      if (item[2]) {
        return '@media ' + item[2] + '{' + content + '}';
      } else {
        return content;
      }
    }).join('');
  }; // import a list of modules into the list


  list.i = function (modules, mediaQuery) {
    if (typeof modules === 'string') {
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    for (var i = 0; i < this.length; i++) {
      var id = this[i][0];

      if (id != null) {
        alreadyImportedModules[id] = true;
      }
    }

    for (i = 0; i < modules.length; i++) {
      var item = modules[i]; // skip already imported module
      // this implementation is not 100% perfect for weird media query combinations
      // when a module is imported multiple times with different media queries.
      // I hope this will never occur (Hey this way we have smaller bundles)

      if (item[0] == null || !alreadyImportedModules[item[0]]) {
        if (mediaQuery && !item[2]) {
          item[2] = mediaQuery;
        } else if (mediaQuery) {
          item[2] = '(' + item[2] + ') and (' + mediaQuery + ')';
        }

        list.push(item);
      }
    }
  };

  return list;
};

function cssWithMappingToString(item, useSourceMap) {
  var content = item[1] || '';
  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (useSourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(cssMapping);
    var sourceURLs = cssMapping.sources.map(function (source) {
      return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */';
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
} // Adapted from convert-source-map (MIT)


function toComment(sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;
  return '/*# ' + data + ' */';
}

/***/ }),

/***/ "./node_modules/node-libs-browser/mock/empty.js":
/*!******************************************************!*\
  !*** ./node_modules/node-libs-browser/mock/empty.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {



/***/ }),

/***/ "./node_modules/path-browserify/index.js":
/*!***********************************************!*\
  !*** ./node_modules/path-browserify/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "./node_modules/webpack/buildin/module.js":
/*!***********************************!*\
  !*** (webpack)/buildin/module.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "./package.json":
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/*! exports provided: name, version, description, main, keywords, scripts, repository, author, license, standard, dependencies, devDependencies, files, yarn-upgrade-all, default */
/***/ (function(module) {

module.exports = JSON.parse("{\"name\":\"mermaid\",\"version\":\"8.4.4\",\"description\":\"Markdownish syntax for generating flowcharts, sequence diagrams, class diagrams, gantt charts and git graphs.\",\"main\":\"dist/mermaid.core.js\",\"keywords\":[\"diagram\",\"markdown\",\"flowchart\",\"sequence diagram\",\"gantt\",\"class diagram\",\"git graph\"],\"scripts\":{\"build\":\"webpack --progress --colors\",\"postbuild\":\"documentation build src/mermaidAPI.js --shallow -f md --markdown-toc false -o docs/mermaidAPI.md\",\"build:watch\":\"yarn build --watch\",\"minify\":\"minify ./dist/mermaid.js > ./dist/mermaid.min.js\",\"release\":\"yarn build -p --config webpack.config.prod.babel.js\",\"lint\":\"eslint src\",\"e2e:depr\":\"yarn lint && jest e2e --config e2e/jest.config.js\",\"cypress\":\"percy exec -- cypress run\",\"e2e\":\"start-server-and-test dev http://localhost:9000/ cypress\",\"e2e-upd\":\"yarn lint && jest e2e -u --config e2e/jest.config.js\",\"dev\":\"webpack-dev-server --config webpack.config.e2e.js\",\"test\":\"yarn lint && jest src/.*\",\"test:watch\":\"jest --watch src\",\"prepublishOnly\":\"yarn build && yarn release && yarn test && yarn e2e\",\"prepush\":\"yarn test\"},\"repository\":{\"type\":\"git\",\"url\":\"https://github.com/knsv/mermaid\"},\"author\":\"Knut Sveidqvist\",\"license\":\"MIT\",\"standard\":{\"ignore\":[\"**/parser/*.js\",\"dist/**/*.js\",\"cypress/**/*.js\"],\"globals\":[\"page\"]},\"dependencies\":{\"@braintree/sanitize-url\":\"^3.1.0\",\"crypto-random-string\":\"^3.0.1\",\"d3\":\"^5.7.0\",\"dagre\":\"^0.8.4\",\"dagre-d3\":\"^0.6.4\",\"graphlib\":\"^2.1.7\",\"he\":\"^1.2.0\",\"lodash\":\"^4.17.11\",\"minify\":\"^4.1.1\",\"moment-mini\":\"^2.22.1\",\"scope-css\":\"^1.2.1\"},\"devDependencies\":{\"@babel/core\":\"^7.2.2\",\"@babel/preset-env\":\"^7.2.0\",\"@babel/register\":\"^7.0.0\",\"@percy/cypress\":\"^2.0.1\",\"babel-core\":\"7.0.0-bridge.0\",\"babel-jest\":\"^24.9.0\",\"babel-loader\":\"^8.0.4\",\"coveralls\":\"^3.0.2\",\"css-loader\":\"^2.0.1\",\"css-to-string-loader\":\"^0.1.3\",\"cypress\":\"3.4.0\",\"documentation\":\"^12.0.1\",\"eslint\":\"^6.3.0\",\"eslint-config-prettier\":\"^6.3.0\",\"eslint-plugin-prettier\":\"^3.1.0\",\"husky\":\"^1.2.1\",\"identity-obj-proxy\":\"^3.0.0\",\"jest\":\"^24.9.0\",\"jison\":\"^0.4.18\",\"moment\":\"^2.23.0\",\"node-sass\":\"^4.12.0\",\"prettier\":\"^1.18.2\",\"puppeteer\":\"^1.17.0\",\"sass-loader\":\"^7.1.0\",\"start-server-and-test\":\"^1.10.6\",\"webpack\":\"^4.27.1\",\"webpack-cli\":\"^3.1.2\",\"webpack-dev-server\":\"^3.4.1\",\"webpack-node-externals\":\"^1.7.2\",\"yarn-upgrade-all\":\"^0.5.0\"},\"files\":[\"dist\"],\"yarn-upgrade-all\":{\"ignore\":[\"babel-core\"]}}");

/***/ }),

/***/ "./src/config.js":
/*!***********************!*\
  !*** ./src/config.js ***!
  \***********************/
/*! exports provided: setConfig, getConfig, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConfig", function() { return setConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getConfig", function() { return getConfig; });
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var config = {};

var setConf = function setConf(cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  var lvl1Keys = Object.keys(cnf);

  for (var i = 0; i < lvl1Keys.length; i++) {
    if (_typeof(cnf[lvl1Keys[i]]) === 'object' && cnf[lvl1Keys[i]] != null) {
      var lvl2Keys = Object.keys(cnf[lvl1Keys[i]]);

      for (var j = 0; j < lvl2Keys.length; j++) {
        // logger.debug('Setting conf ', lvl1Keys[i], '-', lvl2Keys[j])
        if (typeof config[lvl1Keys[i]] === 'undefined') {
          config[lvl1Keys[i]] = {};
        } // logger.debug('Setting config: ' + lvl1Keys[i] + ' ' + lvl2Keys[j] + ' to ' + cnf[lvl1Keys[i]][lvl2Keys[j]])


        config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]];
      }
    } else {
      config[lvl1Keys[i]] = cnf[lvl1Keys[i]];
    }
  }
};

var setConfig = function setConfig(conf) {
  setConf(conf);
};
var getConfig = function getConfig() {
  return config;
};
var configApi = {
  setConfig: setConfig,
  getConfig: getConfig // get conf() {
  //   return config;
  // }

};
/* harmony default export */ __webpack_exports__["default"] = (configApi);

/***/ }),

/***/ "./src/diagrams/class/classDb.js":
/*!***************************************!*\
  !*** ./src/diagrams/class/classDb.js ***!
  \***************************************/
/*! exports provided: addClass, clear, getClass, getClasses, getRelations, addRelation, addAnnotation, addMember, addMembers, cleanupLabel, lineType, relationType, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addClass", function() { return addClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClass", function() { return getClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getRelations", function() { return getRelations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addRelation", function() { return addRelation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addAnnotation", function() { return addAnnotation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMember", function() { return addMember; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMembers", function() { return addMembers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cleanupLabel", function() { return cleanupLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lineType", function() { return lineType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "relationType", function() { return relationType; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");

var relations = [];
var classes = {};
/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @public
 */

var addClass = function addClass(id) {
  // Only add class if not exists
  if (typeof classes[id] !== 'undefined') return;
  classes[id] = {
    id: id,
    methods: [],
    members: [],
    annotations: []
  };
};
var clear = function clear() {
  relations = [];
  classes = {};
};
var getClass = function getClass(id) {
  return classes[id];
};
var getClasses = function getClasses() {
  return classes;
};
var getRelations = function getRelations() {
  return relations;
};
var addRelation = function addRelation(relation) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Adding relation: ' + JSON.stringify(relation));
  addClass(relation.id1);
  addClass(relation.id2);
  relations.push(relation);
};
/**
 * Adds an annotation to the specified class
 * Annotations mark special properties of the given type (like 'interface' or 'service')
 * @param className The class name
 * @param annotation The name of the annotation without any brackets
 * @public
 */

var addAnnotation = function addAnnotation(className, annotation) {
  classes[className].annotations.push(annotation);
};
/**
 * Adds a member to the specified class
 * @param className The class name
 * @param member The full name of the member.
 * If the member is enclosed in <<brackets>> it is treated as an annotation
 * If the member is ending with a closing bracket ) it is treated as a method
 * Otherwise the member will be treated as a normal property
 * @public
 */

var addMember = function addMember(className, member) {
  var theClass = classes[className];

  if (typeof member === 'string') {
    // Member can contain white spaces, we trim them out
    var memberString = member.trim();

    if (memberString.startsWith('<<') && memberString.endsWith('>>')) {
      // Remove leading and trailing brackets
      theClass.annotations.push(memberString.substring(2, memberString.length - 2));
    } else if (memberString.endsWith(')')) {
      theClass.methods.push(memberString);
    } else if (memberString) {
      theClass.members.push(memberString);
    }
  }
};
var addMembers = function addMembers(className, members) {
  if (Array.isArray(members)) {
    members.reverse();
    members.forEach(function (member) {
      return addMember(className, member);
    });
  }
};
var cleanupLabel = function cleanupLabel(label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};
var lineType = {
  LINE: 0,
  DOTTED_LINE: 1
};
var relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
};
/* harmony default export */ __webpack_exports__["default"] = ({
  addClass: addClass,
  clear: clear,
  getClass: getClass,
  getClasses: getClasses,
  addAnnotation: addAnnotation,
  getRelations: getRelations,
  addRelation: addRelation,
  addMember: addMember,
  addMembers: addMembers,
  cleanupLabel: cleanupLabel,
  lineType: lineType,
  relationType: relationType
});

/***/ }),

/***/ "./src/diagrams/class/classRenderer.js":
/*!*********************************************!*\
  !*** ./src/diagrams/class/classRenderer.js ***!
  \*********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dagre */ "dagre");
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(dagre__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _classDb__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./classDb */ "./src/diagrams/class/classDb.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _parser_classDiagram__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./parser/classDiagram */ "./src/diagrams/class/parser/classDiagram.jison");
/* harmony import */ var _parser_classDiagram__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_parser_classDiagram__WEBPACK_IMPORTED_MODULE_6__);







_parser_classDiagram__WEBPACK_IMPORTED_MODULE_6__["parser"].yy = _classDb__WEBPACK_IMPORTED_MODULE_4__["default"];
var idCache = {};
var classCnt = 0;
var conf = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10
}; // Todo optimize

var getGraphId = function getGraphId(label) {
  var keys = Object.keys(idCache);

  for (var i = 0; i < keys.length; i++) {
    if (idCache[keys[i]].label === label) {
      return keys[i];
    }
  }

  return undefined;
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */


var insertMarkers = function insertMarkers(elem) {
  elem.append('defs').append('marker').attr('id', 'extensionStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 1,7 L18,13 V 1 Z');
  elem.append('defs').append('marker').attr('id', 'extensionEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 1,1 V 13 L18,7 Z'); // this is actual shape for arrowhead

  elem.append('defs').append('marker').attr('id', 'compositionStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'compositionEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'aggregationStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'aggregationEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'dependencyStart').attr('class', 'extension').attr('refX', 0).attr('refY', 7).attr('markerWidth', 190).attr('markerHeight', 240).attr('orient', 'auto').append('path').attr('d', 'M 5,7 L9,13 L1,7 L9,1 Z');
  elem.append('defs').append('marker').attr('id', 'dependencyEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 18,7 L9,13 L14,7 L9,1 Z');
};

var edgeCount = 0;

var drawEdge = function drawEdge(elem, path, relation) {
  var getRelationType = function getRelationType(type) {
    switch (type) {
      case _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].relationType.AGGREGATION:
        return 'aggregation';

      case _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].relationType.EXTENSION:
        return 'extension';

      case _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].relationType.COMPOSITION:
        return 'composition';

      case _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].relationType.DEPENDENCY:
        return 'dependency';
    }
  };

  path.points = path.points.filter(function (p) {
    return !Number.isNaN(p.y);
  }); // The data for our line

  var lineData = path.points; // This is the accessor function we talked about above

  var lineFunction = d3__WEBPACK_IMPORTED_MODULE_0__["line"]().x(function (d) {
    return d.x;
  }).y(function (d) {
    return d.y;
  }).curve(d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"]);
  var svgPath = elem.append('path').attr('d', lineFunction(lineData)).attr('id', 'edge' + edgeCount).attr('class', 'relation');
  var url = '';

  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  if (relation.relation.type1 !== 'none') {
    svgPath.attr('marker-start', 'url(' + url + '#' + getRelationType(relation.relation.type1) + 'Start' + ')');
  }

  if (relation.relation.type2 !== 'none') {
    svgPath.attr('marker-end', 'url(' + url + '#' + getRelationType(relation.relation.type2) + 'End' + ')');
  }

  var x, y;
  var l = path.points.length; // Calculate Label position

  var labalPosition = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].calcLabelPosition(path.points);
  x = labalPosition.x;
  y = labalPosition.y;
  var p1_card_x, p1_card_y; // p1_card_padd_x = conf.padding * 2,
  // p1_card_padd_y = conf.padding;

  var p2_card_x, p2_card_y; // p2_card_padd_x = conf.padding * 2,
  // p2_card_padd_y = -conf.padding / 2;

  if (l % 2 !== 0 && l > 1) {
    var cardinality_1_point = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].calcCardinalityPosition(relation.relation.type1 !== 'none', path.points, path.points[0]);
    var cardinality_2_point = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].calcCardinalityPosition(relation.relation.type2 !== 'none', path.points, path.points[l - 1]);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('cardinality_1_point ' + JSON.stringify(cardinality_1_point));
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('cardinality_2_point ' + JSON.stringify(cardinality_2_point));
    p1_card_x = cardinality_1_point.x;
    p1_card_y = cardinality_1_point.y;
    p2_card_x = cardinality_2_point.x;
    p2_card_y = cardinality_2_point.y;
  }

  if (typeof relation.title !== 'undefined') {
    var g = elem.append('g').attr('class', 'classLabel');
    var label = g.append('text').attr('class', 'label').attr('x', x).attr('y', y).attr('fill', 'red').attr('text-anchor', 'middle').text(relation.title);
    window.label = label;
    var bounds = label.node().getBBox();
    g.insert('rect', ':first-child').attr('class', 'box').attr('x', bounds.x - conf.padding / 2).attr('y', bounds.y - conf.padding / 2).attr('width', bounds.width + conf.padding).attr('height', bounds.height + conf.padding);
  }

  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Rendering relation ' + JSON.stringify(relation));

  if (typeof relation.relationTitle1 !== 'undefined' && relation.relationTitle1 !== 'none') {
    var _g = elem.append('g').attr('class', 'cardinality');

    _g.append('text').attr('class', 'type1').attr('x', p1_card_x).attr('y', p1_card_y).attr('fill', 'black').attr('font-size', '6').text(relation.relationTitle1);
  }

  if (typeof relation.relationTitle2 !== 'undefined' && relation.relationTitle2 !== 'none') {
    var _g2 = elem.append('g').attr('class', 'cardinality');

    _g2.append('text').attr('class', 'type2').attr('x', p2_card_x).attr('y', p2_card_y).attr('fill', 'black').attr('font-size', '6').text(relation.relationTitle2);
  }

  edgeCount++;
};

var drawClass = function drawClass(elem, classDef) {
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Rendering class ' + classDef);

  var addTspan = function addTspan(textEl, txt, isFirst) {
    var tSpan = textEl.append('tspan').attr('x', conf.padding).text(txt);

    if (!isFirst) {
      tSpan.attr('dy', conf.textHeight);
    }
  };

  var id = 'classId' + classCnt;
  var classInfo = {
    id: id,
    label: classDef.id,
    width: 0,
    height: 0
  }; // add class group

  var g = elem.append('g').attr('id', id).attr('class', 'classGroup'); // add title

  var title = g.append('text').attr('y', conf.textHeight + conf.padding).attr('x', 0); // add annotations

  var isFirst = true;
  classDef.annotations.forEach(function (member) {
    var titleText2 = title.append('tspan').text('«' + member + '»');
    if (!isFirst) titleText2.attr('dy', conf.textHeight);
    isFirst = false;
  }); // add class title

  var classTitle = title.append('tspan').text(classDef.id).attr('class', 'title'); // If class has annotations the title needs to have an offset of the text height

  if (!isFirst) classTitle.attr('dy', conf.textHeight);
  var titleHeight = title.node().getBBox().height;
  var membersLine = g.append('line') // text label for the x axis
  .attr('x1', 0).attr('y1', conf.padding + titleHeight + conf.dividerMargin / 2).attr('y2', conf.padding + titleHeight + conf.dividerMargin / 2);
  var members = g.append('text') // text label for the x axis
  .attr('x', conf.padding).attr('y', titleHeight + conf.dividerMargin + conf.textHeight).attr('fill', 'white').attr('class', 'classText');
  isFirst = true;
  classDef.members.forEach(function (member) {
    addTspan(members, member, isFirst);
    isFirst = false;
  });
  var membersBox = members.node().getBBox();
  var methodsLine = g.append('line') // text label for the x axis
  .attr('x1', 0).attr('y1', conf.padding + titleHeight + conf.dividerMargin + membersBox.height).attr('y2', conf.padding + titleHeight + conf.dividerMargin + membersBox.height);
  var methods = g.append('text') // text label for the x axis
  .attr('x', conf.padding).attr('y', titleHeight + 2 * conf.dividerMargin + membersBox.height + conf.textHeight).attr('fill', 'white').attr('class', 'classText');
  isFirst = true;
  classDef.methods.forEach(function (method) {
    addTspan(methods, method, isFirst);
    isFirst = false;
  });
  var classBox = g.node().getBBox();
  var rect = g.insert('rect', ':first-child').attr('x', 0).attr('y', 0).attr('width', classBox.width + 2 * conf.padding).attr('height', classBox.height + conf.padding + 0.5 * conf.dividerMargin);
  var rectWidth = rect.node().getBBox().width; // Center title
  // We subtract the width of each text element from the class box width and divide it by 2

  title.node().childNodes.forEach(function (x) {
    x.setAttribute('x', (rectWidth - x.getBBox().width) / 2);
  });
  membersLine.attr('x2', rectWidth);
  methodsLine.attr('x2', rectWidth);
  classInfo.width = rectWidth;
  classInfo.height = classBox.height + conf.padding + 0.5 * conf.dividerMargin;
  idCache[id] = classInfo;
  classCnt++;
  return classInfo;
};

var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(text, id) {
  idCache = {};
  _parser_classDiagram__WEBPACK_IMPORTED_MODULE_6__["parser"].yy.clear();
  _parser_classDiagram__WEBPACK_IMPORTED_MODULE_6__["parser"].parse(text);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Rendering diagram ' + text); /// / Fetch the default direction, use TD if none was found

  var diagram = d3__WEBPACK_IMPORTED_MODULE_0__["select"]("[id='".concat(id, "']"));
  insertMarkers(diagram); // Layout graph, Create a new directed graph

  var g = new graphlib__WEBPACK_IMPORTED_MODULE_2___default.a.Graph({
    multigraph: true
  }); // Set an object for the graph label

  g.setGraph({
    isMultiGraph: true
  }); // Default to assigning a new object as a label for each new edge.

  g.setDefaultEdgeLabel(function () {
    return {};
  });
  var classes = _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].getClasses();
  var keys = Object.keys(classes);

  for (var i = 0; i < keys.length; i++) {
    var classDef = classes[keys[i]];
    var node = drawClass(diagram, classDef); // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.

    g.setNode(node.id, node);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Org height: ' + node.height);
  }

  var relations = _classDb__WEBPACK_IMPORTED_MODULE_4__["default"].getRelations();
  relations.forEach(function (relation) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('tjoho' + getGraphId(relation.id1) + getGraphId(relation.id2) + JSON.stringify(relation));
    g.setEdge(getGraphId(relation.id1), getGraphId(relation.id2), {
      relation: relation
    });
  });
  dagre__WEBPACK_IMPORTED_MODULE_1___default.a.layout(g);
  g.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof g.node(v) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Node ' + v + ': ' + JSON.stringify(g.node(v)));
      d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#' + v).attr('transform', 'translate(' + (g.node(v).x - g.node(v).width / 2) + ',' + (g.node(v).y - g.node(v).height / 2) + ' )');
    }
  });
  g.edges().forEach(function (e) {
    if (typeof e !== 'undefined' && typeof g.edge(e) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)));
      drawEdge(diagram, g.edge(e), g.edge(e).relation);
    }
  });
  diagram.attr('height', '100%');
  diagram.attr('width', "".concat(g.graph().width * 1.5 + 20));
  diagram.attr('viewBox', '-10 -10 ' + (g.graph().width + 20) + ' ' + (g.graph().height + 20));
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/class/parser/classDiagram.jison":
/*!******************************************************!*\
  !*** ./src/diagrams/class/parser/classDiagram.jison ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,12],$V1=[1,15],$V2=[1,13],$V3=[1,14],$V4=[1,17],$V5=[1,18],$V6=[1,19],$V7=[6,8],$V8=[1,28],$V9=[1,29],$Va=[1,30],$Vb=[1,31],$Vc=[1,32],$Vd=[1,33],$Ve=[6,8,13,18,26,29,30,31,32,33,34],$Vf=[6,8,13,18,22,26,29,30,31,32,33,34,48,49,50],$Vg=[26,48,49,50],$Vh=[26,33,34,48,49,50],$Vi=[26,29,30,31,32,48,49,50],$Vj=[6,8,13],$Vk=[1,50];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"mermaidDoc":3,"graphConfig":4,"CLASS_DIAGRAM":5,"NEWLINE":6,"statements":7,"EOF":8,"statement":9,"className":10,"alphaNumToken":11,"relationStatement":12,"LABEL":13,"classStatement":14,"methodStatement":15,"annotationStatement":16,"CLASS":17,"STRUCT_START":18,"members":19,"STRUCT_STOP":20,"ANNOTATION_START":21,"ANNOTATION_END":22,"MEMBER":23,"SEPARATOR":24,"relation":25,"STR":26,"relationType":27,"lineType":28,"AGGREGATION":29,"EXTENSION":30,"COMPOSITION":31,"DEPENDENCY":32,"LINE":33,"DOTTED_LINE":34,"commentToken":35,"textToken":36,"graphCodeTokens":37,"textNoTagsToken":38,"TAGSTART":39,"TAGEND":40,"==":41,"--":42,"PCT":43,"DEFAULT":44,"SPACE":45,"MINUS":46,"keywords":47,"UNICODE_TEXT":48,"NUM":49,"ALPHA":50,"$accept":0,"$end":1},
terminals_: {2:"error",5:"CLASS_DIAGRAM",6:"NEWLINE",8:"EOF",13:"LABEL",17:"CLASS",18:"STRUCT_START",20:"STRUCT_STOP",21:"ANNOTATION_START",22:"ANNOTATION_END",23:"MEMBER",24:"SEPARATOR",26:"STR",29:"AGGREGATION",30:"EXTENSION",31:"COMPOSITION",32:"DEPENDENCY",33:"LINE",34:"DOTTED_LINE",37:"graphCodeTokens",39:"TAGSTART",40:"TAGEND",41:"==",42:"--",43:"PCT",44:"DEFAULT",45:"SPACE",46:"MINUS",47:"keywords",48:"UNICODE_TEXT",49:"NUM",50:"ALPHA"},
productions_: [0,[3,1],[4,4],[7,1],[7,2],[7,3],[10,2],[10,1],[9,1],[9,2],[9,1],[9,1],[9,1],[14,2],[14,5],[16,4],[19,1],[19,2],[15,1],[15,2],[15,1],[15,1],[12,3],[12,4],[12,4],[12,5],[25,3],[25,2],[25,2],[25,1],[27,1],[27,1],[27,1],[27,1],[28,1],[28,1],[35,1],[35,1],[36,1],[36,1],[36,1],[36,1],[36,1],[36,1],[36,1],[38,1],[38,1],[38,1],[38,1],[11,1],[11,1],[11,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 6:
 this.$=$$[$0-1]+$$[$0]; 
break;
case 7:
 this.$=$$[$0]; 
break;
case 8:
 yy.addRelation($$[$0]); 
break;
case 9:
 $$[$0-1].title =  yy.cleanupLabel($$[$0]); yy.addRelation($$[$0-1]);        
break;
case 13:
yy.addClass($$[$0]);
break;
case 14:
/*console.log($$[$0-3],JSON.stringify($$[$0-1]));*/yy.addClass($$[$0-3]);yy.addMembers($$[$0-3],$$[$0-1]);
break;
case 15:
 yy.addAnnotation($$[$0],$$[$0-2]); 
break;
case 16:
 this.$ = [$$[$0]]; 
break;
case 17:
 $$[$0].push($$[$0-1]);this.$=$$[$0];
break;
case 18:
/*console.log('Rel found',$$[$0]);*/
break;
case 19:
yy.addMember($$[$0-1],yy.cleanupLabel($$[$0]));
break;
case 20:
/*console.warn('Member',$$[$0]);*/
break;
case 21:
/*console.log('sep found',$$[$0]);*/
break;
case 22:
 this.$ = {'id1':$$[$0-2],'id2':$$[$0], relation:$$[$0-1], relationTitle1:'none', relationTitle2:'none'}; 
break;
case 23:
 this.$ = {id1:$$[$0-3], id2:$$[$0], relation:$$[$0-1], relationTitle1:$$[$0-2], relationTitle2:'none'}
break;
case 24:
 this.$ = {id1:$$[$0-3], id2:$$[$0], relation:$$[$0-2], relationTitle1:'none', relationTitle2:$$[$0-1]}; 
break;
case 25:
 this.$ = {id1:$$[$0-4], id2:$$[$0], relation:$$[$0-2], relationTitle1:$$[$0-3], relationTitle2:$$[$0-1]} 
break;
case 26:
 this.$={type1:$$[$0-2],type2:$$[$0],lineType:$$[$0-1]}; 
break;
case 27:
 this.$={type1:'none',type2:$$[$0],lineType:$$[$0-1]}; 
break;
case 28:
 this.$={type1:$$[$0-1],type2:'none',lineType:$$[$0]}; 
break;
case 29:
 this.$={type1:'none',type2:'none',lineType:$$[$0]}; 
break;
case 30:
 this.$=yy.relationType.AGGREGATION;
break;
case 31:
 this.$=yy.relationType.EXTENSION;
break;
case 32:
 this.$=yy.relationType.COMPOSITION;
break;
case 33:
 this.$=yy.relationType.DEPENDENCY;
break;
case 34:
this.$=yy.lineType.LINE;
break;
case 35:
this.$=yy.lineType.DOTTED_LINE;
break;
}
},
table: [{3:1,4:2,5:[1,3]},{1:[3]},{1:[2,1]},{6:[1,4]},{7:5,9:6,10:11,11:16,12:7,14:8,15:9,16:10,17:$V0,21:$V1,23:$V2,24:$V3,48:$V4,49:$V5,50:$V6},{8:[1,20]},{6:[1,21],8:[2,3]},o($V7,[2,8],{13:[1,22]}),o($V7,[2,10]),o($V7,[2,11]),o($V7,[2,12]),o($V7,[2,18],{25:23,27:26,28:27,13:[1,25],26:[1,24],29:$V8,30:$V9,31:$Va,32:$Vb,33:$Vc,34:$Vd}),{10:34,11:16,48:$V4,49:$V5,50:$V6},o($V7,[2,20]),o($V7,[2,21]),{11:35,48:$V4,49:$V5,50:$V6},o($Ve,[2,7],{11:16,10:36,48:$V4,49:$V5,50:$V6}),o($Vf,[2,49]),o($Vf,[2,50]),o($Vf,[2,51]),{1:[2,2]},{7:37,8:[2,4],9:6,10:11,11:16,12:7,14:8,15:9,16:10,17:$V0,21:$V1,23:$V2,24:$V3,48:$V4,49:$V5,50:$V6},o($V7,[2,9]),{10:38,11:16,26:[1,39],48:$V4,49:$V5,50:$V6},{25:40,27:26,28:27,29:$V8,30:$V9,31:$Va,32:$Vb,33:$Vc,34:$Vd},o($V7,[2,19]),{28:41,33:$Vc,34:$Vd},o($Vg,[2,29],{27:42,29:$V8,30:$V9,31:$Va,32:$Vb}),o($Vh,[2,30]),o($Vh,[2,31]),o($Vh,[2,32]),o($Vh,[2,33]),o($Vi,[2,34]),o($Vi,[2,35]),o($V7,[2,13],{18:[1,43]}),{22:[1,44]},o($Ve,[2,6]),{8:[2,5]},o($Vj,[2,22]),{10:45,11:16,48:$V4,49:$V5,50:$V6},{10:46,11:16,26:[1,47],48:$V4,49:$V5,50:$V6},o($Vg,[2,28],{27:48,29:$V8,30:$V9,31:$Va,32:$Vb}),o($Vg,[2,27]),{19:49,23:$Vk},{10:51,11:16,48:$V4,49:$V5,50:$V6},o($Vj,[2,24]),o($Vj,[2,23]),{10:52,11:16,48:$V4,49:$V5,50:$V6},o($Vg,[2,26]),{20:[1,53]},{19:54,20:[2,16],23:$Vk},o($V7,[2,15]),o($Vj,[2,25]),o($V7,[2,14]),{20:[2,17]}],
defaultActions: {2:[2,1],20:[2,2],37:[2,5],54:[2,17]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* do nothing */
break;
case 1:return 6;
break;
case 2:/* skip whitespace */
break;
case 3:return 5;
break;
case 4: this.begin("struct"); /*console.log('Starting struct');*/return 18;
break;
case 5: /*console.log('Ending struct');*/this.popState(); return 20;
break;
case 6:/* nothing */
break;
case 7: /*console.log('lex-member: ' + yy_.yytext);*/  return "MEMBER";
break;
case 8:return 17;
break;
case 9:return 21;
break;
case 10:return 22;
break;
case 11:this.begin("string");
break;
case 12:this.popState();
break;
case 13:return "STR";
break;
case 14:return 30;
break;
case 15:return 30;
break;
case 16:return 32;
break;
case 17:return 32;
break;
case 18:return 31;
break;
case 19:return 29;
break;
case 20:return 33;
break;
case 21:return 34;
break;
case 22:return 13;
break;
case 23:return 46;
break;
case 24:return 'DOT';
break;
case 25:return 'PLUS';
break;
case 26:return 43;
break;
case 27:return 'EQUALS';
break;
case 28:return 'EQUALS';
break;
case 29:return 50;
break;
case 30:return 'PUNCTUATION';
break;
case 31:return 49;
break;
case 32:return 48;
break;
case 33:return 45;
break;
case 34:return 8;
break;
}
},
rules: [/^(?:%%[^\n]*\n*)/,/^(?:\n+)/,/^(?:\s+)/,/^(?:classDiagram\b)/,/^(?:[\{])/,/^(?:\})/,/^(?:[\n])/,/^(?:[^\{\}\n]*)/,/^(?:class\b)/,/^(?:<<)/,/^(?:>>)/,/^(?:["])/,/^(?:["])/,/^(?:[^"]*)/,/^(?:\s*<\|)/,/^(?:\s*\|>)/,/^(?:\s*>)/,/^(?:\s*<)/,/^(?:\s*\*)/,/^(?:\s*o\b)/,/^(?:--)/,/^(?:\.\.)/,/^(?::[^\n;]+)/,/^(?:-)/,/^(?:\.)/,/^(?:\+)/,/^(?:%)/,/^(?:=)/,/^(?:=)/,/^(?:\w+)/,/^(?:[!"#$%&'*+,-.`?\\\/])/,/^(?:[0-9]+)/,/^(?:[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6]|[\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377]|[\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5]|[\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA]|[\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE]|[\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA]|[\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0]|[\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977]|[\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2]|[\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A]|[\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39]|[\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8]|[\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C]|[\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C]|[\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99]|[\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0]|[\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D]|[\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3]|[\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10]|[\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1]|[\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81]|[\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3]|[\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6]|[\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A]|[\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081]|[\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D]|[\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0]|[\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310]|[\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C]|[\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711]|[\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7]|[\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C]|[\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16]|[\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF]|[\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC]|[\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D]|[\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D]|[\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3]|[\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F]|[\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128]|[\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184]|[\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3]|[\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6]|[\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE]|[\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C]|[\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D]|[\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC]|[\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B]|[\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788]|[\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805]|[\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB]|[\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28]|[\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5]|[\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4]|[\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E]|[\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D]|[\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36]|[\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D]|[\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC]|[\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF]|[\uFFD2-\uFFD7\uFFDA-\uFFDC])/,/^(?:\s)/,/^(?:$)/],
conditions: {"string":{"rules":[12,13],"inclusive":false},"struct":{"rules":[5,6,7],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,8,9,10,11,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/flowchart/flowChartShapes.js":
/*!***************************************************!*\
  !*** ./src/diagrams/flowchart/flowChartShapes.js ***!
  \***************************************************/
/*! exports provided: addToRender, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addToRender", function() { return addToRender; });
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dagre-d3 */ "dagre-d3");
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(dagre_d3__WEBPACK_IMPORTED_MODULE_0__);


function question(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var s = (w + h) * 0.9;
  var points = [{
    x: s / 2,
    y: 0
  }, {
    x: s,
    y: -s / 2
  }, {
    x: s / 2,
    y: -s
  }, {
    x: 0,
    y: -s / 2
  }];
  var shapeSvg = insertPolygonShape(parent, s, s, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function hexagon(parent, bbox, node) {
  var f = 4;
  var h = bbox.height;
  var m = h / f;
  var w = bbox.width + 2 * m;
  var points = [{
    x: m,
    y: 0
  }, {
    x: w - m,
    y: 0
  }, {
    x: w,
    y: -h / 2
  }, {
    x: w - m,
    y: -h
  }, {
    x: m,
    y: -h
  }, {
    x: 0,
    y: -h / 2
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function rect_left_inv_arrow(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: -h / 2,
    y: 0
  }, {
    x: w,
    y: 0
  }, {
    x: w,
    y: -h
  }, {
    x: -h / 2,
    y: -h
  }, {
    x: 0,
    y: -h / 2
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function lean_right(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: -2 * h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: -h
  }, {
    x: h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function lean_left(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: 2 * h / 6,
    y: 0
  }, {
    x: w + h / 6,
    y: 0
  }, {
    x: w - 2 * h / 6,
    y: -h
  }, {
    x: -h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function trapezoid(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: -2 * h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: -h
  }, {
    x: h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function inv_trapezoid(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: h / 6,
    y: 0
  }, {
    x: w - h / 6,
    y: 0
  }, {
    x: w + 2 * h / 6,
    y: -h
  }, {
    x: -2 * h / 6,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function rect_right_inv_arrow(parent, bbox, node) {
  var w = bbox.width;
  var h = bbox.height;
  var points = [{
    x: 0,
    y: 0
  }, {
    x: w + h / 2,
    y: 0
  }, {
    x: w,
    y: -h / 2
  }, {
    x: w + h / 2,
    y: -h
  }, {
    x: 0,
    y: -h
  }];
  var shapeSvg = insertPolygonShape(parent, w, h, points);

  node.intersect = function (point) {
    return dagre_d3__WEBPACK_IMPORTED_MODULE_0___default.a.intersect.polygon(node, points, point);
  };

  return shapeSvg;
}

function addToRender(render) {
  render.shapes().question = question;
  render.shapes().hexagon = hexagon; // Add custom shape for box with inverted arrow on left side

  render.shapes().rect_left_inv_arrow = rect_left_inv_arrow; // Add custom shape for box with inverted arrow on left side

  render.shapes().lean_right = lean_right; // Add custom shape for box with inverted arrow on left side

  render.shapes().lean_left = lean_left; // Add custom shape for box with inverted arrow on left side

  render.shapes().trapezoid = trapezoid; // Add custom shape for box with inverted arrow on left side

  render.shapes().inv_trapezoid = inv_trapezoid; // Add custom shape for box with inverted arrow on right side

  render.shapes().rect_right_inv_arrow = rect_right_inv_arrow;
}

function insertPolygonShape(parent, w, h, points) {
  return parent.insert('polygon', ':first-child').attr('points', points.map(function (d) {
    return d.x + ',' + d.y;
  }).join(' ')).attr('transform', 'translate(' + -w / 2 + ',' + h / 2 + ')');
}

/* harmony default export */ __webpack_exports__["default"] = ({
  addToRender: addToRender
});

/***/ }),

/***/ "./src/diagrams/flowchart/flowDb.js":
/*!******************************************!*\
  !*** ./src/diagrams/flowchart/flowDb.js ***!
  \******************************************/
/*! exports provided: addVertex, addLink, updateLinkInterpolate, updateLink, addClass, setDirection, setClass, setLink, getTooltip, setClickEvent, bindFunctions, getDirection, getVertices, getEdges, getClasses, clear, defaultStyle, addSubGraph, getDepthFirstPos, indexNodes, getSubGraphs, firstGraph, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addVertex", function() { return addVertex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLink", function() { return addLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateLinkInterpolate", function() { return updateLinkInterpolate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateLink", function() { return updateLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addClass", function() { return addClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDirection", function() { return setDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClass", function() { return setClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLink", function() { return setLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTooltip", function() { return getTooltip; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClickEvent", function() { return setClickEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindFunctions", function() { return bindFunctions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDirection", function() { return getDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getVertices", function() { return getVertices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getEdges", function() { return getEdges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultStyle", function() { return defaultStyle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSubGraph", function() { return addSubGraph; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDepthFirstPos", function() { return getDepthFirstPos; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "indexNodes", function() { return indexNodes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSubGraphs", function() { return getSubGraphs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "firstGraph", function() { return firstGraph; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @braintree/sanitize-url */ "@braintree/sanitize-url");
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./src/config.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }





 // const MERMAID_DOM_ID_PREFIX = 'mermaid-dom-id-';

var MERMAID_DOM_ID_PREFIX = '';
var config = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])();
var vertices = {};
var edges = [];
var classes = [];
var subGraphs = [];
var subGraphLookup = {};
var tooltips = {};
var subCount = 0;
var firstGraphFlag = true;
var direction; // Functions to be run after graph rendering

var funs = [];

var sanitize = function sanitize(text) {
  var txt = text;
  var htmlLabels = true;
  if (config.flowchart && (config.flowchart.htmlLabels === false || config.flowchart.htmlLabels === 'false')) htmlLabels = false;

  if (config.securityLevel !== 'loose' && htmlLabels) {
    // eslint-disable-line
    txt = txt.replace(/<br>/g, '#br#');
    txt = txt.replace(/<br\S*?\/>/g, '#br#');
    txt = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    txt = txt.replace(/=/g, '&equals;');
    txt = txt.replace(/#br#/g, '<br/>');
  }

  return txt;
};
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 * @param classes
 */


var addVertex = function addVertex(_id, text, type, style, classes) {
  var txt;
  var id = _id;

  if (typeof id === 'undefined') {
    return;
  }

  if (id.trim().length === 0) {
    return;
  }

  if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

  if (typeof vertices[id] === 'undefined') {
    vertices[id] = {
      id: id,
      styles: [],
      classes: []
    };
  }

  if (typeof text !== 'undefined') {
    txt = sanitize(text.trim()); // strip quotes if string starts and exnds with a quote

    if (txt[0] === '"' && txt[txt.length - 1] === '"') {
      txt = txt.substring(1, txt.length - 1);
    }

    vertices[id].text = txt;
  } else {
    if (!vertices[id].text) {
      vertices[id].text = _id;
    }
  }

  if (typeof type !== 'undefined') {
    vertices[id].type = type;
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
        vertices[id].styles.push(s);
      });
    }
  }

  if (typeof classes !== 'undefined') {
    if (classes !== null) {
      classes.forEach(function (s) {
        vertices[id].classes.push(s);
      });
    }
  }
};
/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */

var addLink = function addLink(_start, _end, type, linktext) {
  var start = _start;
  var end = _end;
  if (start[0].match(/\d/)) start = MERMAID_DOM_ID_PREFIX + start;
  if (end[0].match(/\d/)) end = MERMAID_DOM_ID_PREFIX + end;
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].info('Got edge...', start, end);
  var edge = {
    start: start,
    end: end,
    type: undefined,
    text: ''
  };
  linktext = type.text;

  if (typeof linktext !== 'undefined') {
    edge.text = sanitize(linktext.trim()); // strip quotes if string starts and exnds with a quote

    if (edge.text[0] === '"' && edge.text[edge.text.length - 1] === '"') {
      edge.text = edge.text.substring(1, edge.text.length - 1);
    }
  }

  if (typeof type !== 'undefined') {
    edge.type = type.type;
    edge.stroke = type.stroke;
  }

  edges.push(edge);
};
/**
 * Updates a link's line interpolation algorithm
 * @param pos
 * @param interpolate
 */

var updateLinkInterpolate = function updateLinkInterpolate(positions, interp) {
  positions.forEach(function (pos) {
    if (pos === 'default') {
      edges.defaultInterpolate = interp;
    } else {
      edges[pos].interpolate = interp;
    }
  });
};
/**
 * Updates a link with a style
 * @param pos
 * @param style
 */

var updateLink = function updateLink(positions, style) {
  positions.forEach(function (pos) {
    if (pos === 'default') {
      edges.defaultStyle = style;
    } else {
      if (_utils__WEBPACK_IMPORTED_MODULE_3__["default"].isSubstringInArray('fill', style) === -1) {
        style.push('fill:none');
      }

      edges[pos].style = style;
    }
  });
};
var addClass = function addClass(id, style) {
  if (typeof classes[id] === 'undefined') {
    classes[id] = {
      id: id,
      styles: []
    };
  }

  if (typeof style !== 'undefined') {
    if (style !== null) {
      style.forEach(function (s) {
        classes[id].styles.push(s);
      });
    }
  }
};
/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */

var setDirection = function setDirection(dir) {
  direction = dir;

  if (direction.match(/.*</)) {
    direction = 'RL';
  }

  if (direction.match(/.*\^/)) {
    direction = 'BT';
  }

  if (direction.match(/.*>/)) {
    direction = 'LR';
  }

  if (direction.match(/.*v/)) {
    direction = 'TB';
  }
};
/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */

var setClass = function setClass(ids, className) {
  ids.split(',').forEach(function (_id) {
    var id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

    if (typeof vertices[id] !== 'undefined') {
      vertices[id].classes.push(className);
    }

    if (typeof subGraphLookup[id] !== 'undefined') {
      subGraphLookup[id].classes.push(className);
    }
  });
};

var setTooltip = function setTooltip(ids, tooltip) {
  ids.split(',').forEach(function (id) {
    if (typeof tooltip !== 'undefined') {
      tooltips[id] = sanitize(tooltip);
    }
  });
};

var setClickFun = function setClickFun(_id, functionName) {
  var id = _id;
  if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

  if (config.securityLevel !== 'loose') {
    return;
  }

  if (typeof functionName === 'undefined') {
    return;
  }

  if (typeof vertices[id] !== 'undefined') {
    funs.push(function () {
      var elem = document.querySelector("[id=\"".concat(id, "\"]"));

      if (elem !== null) {
        elem.addEventListener('click', function () {
          window[functionName](id);
        }, false);
      }
    });
  }
};
/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 * @param tooltip Tooltip for the clickable element
 */


var setLink = function setLink(ids, linkStr, tooltip) {
  ids.split(',').forEach(function (_id) {
    var id = _id;
    if (_id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;

    if (typeof vertices[id] !== 'undefined') {
      if (config.securityLevel !== 'loose') {
        vertices[id].link = Object(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__["sanitizeUrl"])(linkStr); // .replace(/javascript:.*/g, '')
      } else {
        vertices[id].link = linkStr;
      }
    }
  });
  setTooltip(ids, tooltip);
  setClass(ids, 'clickable');
};
var getTooltip = function getTooltip(id) {
  return tooltips[id];
};
/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param tooltip Tooltip for the clickable element
 */

var setClickEvent = function setClickEvent(ids, functionName, tooltip) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName);
  });
  setTooltip(ids, tooltip);
  setClass(ids, 'clickable');
};
var bindFunctions = function bindFunctions(element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
var getDirection = function getDirection() {
  return direction.trim();
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */

var getVertices = function getVertices() {
  return vertices;
};
/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */

var getEdges = function getEdges() {
  return edges;
};
/**
 * Retrieval function for fetching the found class definitions after parsing has completed.
 * @returns {{}|*|classes}
 */

var getClasses = function getClasses() {
  return classes;
};

var setupToolTips = function setupToolTips(element) {
  var tooltipElem = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('.mermaidTooltip');

  if ((tooltipElem._groups || tooltipElem)[0][0] === null) {
    tooltipElem = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('body').append('div').attr('class', 'mermaidTooltip').style('opacity', 0);
  }

  var svg = d3__WEBPACK_IMPORTED_MODULE_0__["select"](element).select('svg');
  var nodes = svg.selectAll('g.node');
  nodes.on('mouseover', function () {
    var el = d3__WEBPACK_IMPORTED_MODULE_0__["select"](this);
    var title = el.attr('title'); // Dont try to draw a tooltip if no data is provided

    if (title === null) {
      return;
    }

    var rect = this.getBoundingClientRect();
    tooltipElem.transition().duration(200).style('opacity', '.9');
    tooltipElem.html(el.attr('title')).style('left', rect.left + (rect.right - rect.left) / 2 + 'px').style('top', rect.top - 14 + document.body.scrollTop + 'px');
    el.classed('hover', true);
  }).on('mouseout', function () {
    tooltipElem.transition().duration(500).style('opacity', 0);
    var el = d3__WEBPACK_IMPORTED_MODULE_0__["select"](this);
    el.classed('hover', false);
  });
};

funs.push(setupToolTips);
/**
 * Clears the internal graph db so that a new graph can be parsed.
 */

var clear = function clear() {
  vertices = {};
  classes = {};
  edges = [];
  funs = [];
  funs.push(setupToolTips);
  subGraphs = [];
  subGraphLookup = {};
  subCount = 0;
  tooltips = [];
  firstGraphFlag = true;
};
/**
 *
 * @returns {string}
 */

var defaultStyle = function defaultStyle() {
  return 'fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;';
};
/**
 * Clears the internal graph db so that a new graph can be parsed.
 */

var addSubGraph = function addSubGraph(_id, list, _title) {
  var id = _id;
  var title = _title;

  if (_id === _title && _title.match(/\s/)) {
    id = undefined;
  }

  function uniq(a) {
    var prims = {
      boolean: {},
      number: {},
      string: {}
    };
    var objs = [];
    return a.filter(function (item) {
      var type = _typeof(item);

      if (item.trim() === '') {
        return false;
      }

      if (type in prims) {
        return prims[type].hasOwnProperty(item) ? false : prims[type][item] = true; // eslint-disable-line
      } else {
        return objs.indexOf(item) >= 0 ? false : objs.push(item);
      }
    });
  }

  var nodeList = [];
  nodeList = uniq(nodeList.concat.apply(nodeList, list));

  for (var i = 0; i < nodeList.length; i++) {
    if (nodeList[i][0].match(/\d/)) nodeList[i] = MERMAID_DOM_ID_PREFIX + nodeList[i];
  }

  id = id || 'subGraph' + subCount;
  if (id[0].match(/\d/)) id = MERMAID_DOM_ID_PREFIX + id;
  title = title || '';
  title = sanitize(title);
  subCount = subCount + 1;
  var subGraph = {
    id: id,
    nodes: nodeList,
    title: title.trim(),
    classes: []
  };
  subGraphs.push(subGraph);
  subGraphLookup[id] = subGraph;
  return id;
};

var getPosForId = function getPosForId(id) {
  for (var i = 0; i < subGraphs.length; i++) {
    if (subGraphs[i].id === id) {
      return i;
    }
  }

  return -1;
};

var secCount = -1;
var posCrossRef = [];

var indexNodes2 = function indexNodes2(id, pos) {
  var nodes = subGraphs[pos].nodes;
  secCount = secCount + 1;

  if (secCount > 2000) {
    return;
  }

  posCrossRef[secCount] = pos; // Check if match

  if (subGraphs[pos].id === id) {
    return {
      result: true,
      count: 0
    };
  }

  var count = 0;
  var posCount = 1;

  while (count < nodes.length) {
    var childPos = getPosForId(nodes[count]); // Ignore regular nodes (pos will be -1)

    if (childPos >= 0) {
      var res = indexNodes2(id, childPos);

      if (res.result) {
        return {
          result: true,
          count: posCount + res.count
        };
      } else {
        posCount = posCount + res.count;
      }
    }

    count = count + 1;
  }

  return {
    result: false,
    count: posCount
  };
};

var getDepthFirstPos = function getDepthFirstPos(pos) {
  return posCrossRef[pos];
};
var indexNodes = function indexNodes() {
  secCount = -1;

  if (subGraphs.length > 0) {
    indexNodes2('none', subGraphs.length - 1, 0);
  }
};
var getSubGraphs = function getSubGraphs() {
  return subGraphs;
};
var firstGraph = function firstGraph() {
  if (firstGraphFlag) {
    firstGraphFlag = false;
    return true;
  }

  return false;
};
/* harmony default export */ __webpack_exports__["default"] = ({
  addVertex: addVertex,
  addLink: addLink,
  updateLinkInterpolate: updateLinkInterpolate,
  updateLink: updateLink,
  addClass: addClass,
  setDirection: setDirection,
  setClass: setClass,
  getTooltip: getTooltip,
  setClickEvent: setClickEvent,
  setLink: setLink,
  bindFunctions: bindFunctions,
  getDirection: getDirection,
  getVertices: getVertices,
  getEdges: getEdges,
  getClasses: getClasses,
  clear: clear,
  defaultStyle: defaultStyle,
  addSubGraph: addSubGraph,
  getDepthFirstPos: getDepthFirstPos,
  indexNodes: indexNodes,
  getSubGraphs: getSubGraphs,
  lex: {
    firstGraph: firstGraph
  }
});

/***/ }),

/***/ "./src/diagrams/flowchart/flowRenderer.js":
/*!************************************************!*\
  !*** ./src/diagrams/flowchart/flowRenderer.js ***!
  \************************************************/
/*! exports provided: setConf, addVertices, addEdges, getClasses, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addVertices", function() { return addVertices; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addEdges", function() { return addEdges; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getClasses", function() { return getClasses; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _flowDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./flowDb */ "./src/diagrams/flowchart/flowDb.js");
/* harmony import */ var _parser_flow__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/flow */ "./src/diagrams/flowchart/parser/flow.jison");
/* harmony import */ var _parser_flow__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_flow__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./src/config.js");
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! dagre-d3 */ "dagre-d3");
/* harmony import */ var dagre_d3__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(dagre_d3__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! dagre-d3/lib/label/add-html-label.js */ "dagre-d3/lib/label/add-html-label.js");
/* harmony import */ var dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _flowChartShapes__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./flowChartShapes */ "./src/diagrams/flowchart/flowChartShapes.js");





var newDagreD3 = true;
 // const newDagreD3 = false;





var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);

  for (var i = 0; i < keys.length; i++) {
    conf[keys[i]] = cnf[keys[i]];
  }
};
/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */

var addVertices = function addVertices(vert, g, svgId) {
  var svg = d3__WEBPACK_IMPORTED_MODULE_1__["select"]("[id=\"".concat(svgId, "\"]"));
  var keys = Object.keys(vert);

  var styleFromStyleArr = function styleFromStyleArr(styleStr, arr, _ref) {
    var label = _ref.label;

    if (!label) {
      // Create a compound style definition from the style definitions found for the node in the graph definition
      for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'undefined') {
          styleStr = styleStr + arr[i] + ';';
        }
      }
    } else {
      // create the style definition for the text, if property is a text-property
      for (var _i = 0; _i < arr.length; _i++) {
        if (typeof arr[_i] !== 'undefined') {
          if (arr[_i].match('^color:|^text-align:')) styleStr = styleStr + arr[_i] + ';';
        }
      }
    }

    return styleStr;
  }; // Iterate through each item in the vertex object (containing all the vertices found) in the graph definition


  keys.forEach(function (id) {
    var vertex = vert[id];
    /**
     * Variable for storing the classes for the vertex
     * @type {string}
     */

    var classStr = '';

    if (vertex.classes.length > 0) {
      classStr = vertex.classes.join(' ');
    }
    /**
     * Variable for storing the extracted style for the vertex
     * @type {string}
     */


    var style = ''; // Create a compound style definition from the style definitions found for the node in the graph definition

    style = styleFromStyleArr(style, vertex.styles, {
      label: false
    });
    var labelStyle = '';
    labelStyle = styleFromStyleArr(labelStyle, vertex.styles, {
      label: true
    }); // Use vertex id as text in the box if no text is provided by the graph definition

    var vertexText = vertex.text !== undefined ? vertex.text : vertex.id; // We create a SVG label, either by delegating to addHtmlLabel or manually

    var vertexNode;

    if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
      // TODO: addHtmlLabel accepts a labelStyle. Do we possibly have that?
      var node = {
        label: vertexText.replace(/fa[lrsb]?:fa-[\w-]+/g, function (s) {
          return "<i class='".concat(s.replace(':', ' '), "'></i>");
        })
      };
      vertexNode = dagre_d3_lib_label_add_html_label_js__WEBPACK_IMPORTED_MODULE_6___default()(svg, node).node();
      vertexNode.parentNode.removeChild(vertexNode);
    } else {
      var svgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      var rows = vertexText.split(/<br[/]{0,1}>/);

      for (var j = 0; j < rows.length; j++) {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        tspan.setAttribute('dy', '1em');
        tspan.setAttribute('x', '1');
        tspan.textContent = rows[j];
        svgLabel.appendChild(tspan);
      }

      vertexNode = svgLabel;
    } // If the node has a link, we wrap it in a SVG link


    if (vertex.link) {
      var link = document.createElementNS('http://www.w3.org/2000/svg', 'a');
      link.setAttributeNS('http://www.w3.org/2000/svg', 'href', vertex.link);
      link.setAttributeNS('http://www.w3.org/2000/svg', 'rel', 'noopener');
      link.appendChild(vertexNode);
      vertexNode = link;
    }

    var radious = 0;
    var _shape = ''; // Set the shape based parameters

    switch (vertex.type) {
      case 'round':
        radious = 5;
        _shape = 'rect';
        break;

      case 'square':
        _shape = 'rect';
        break;

      case 'diamond':
        _shape = 'question';
        break;

      case 'hexagon':
        _shape = 'hexagon';
        break;

      case 'odd':
        _shape = 'rect_left_inv_arrow';
        break;

      case 'lean_right':
        _shape = 'lean_right';
        break;

      case 'lean_left':
        _shape = 'lean_left';
        break;

      case 'trapezoid':
        _shape = 'trapezoid';
        break;

      case 'inv_trapezoid':
        _shape = 'inv_trapezoid';
        break;

      case 'odd_right':
        _shape = 'rect_left_inv_arrow';
        break;

      case 'circle':
        _shape = 'circle';
        break;

      case 'ellipse':
        _shape = 'ellipse';
        break;

      case 'group':
        _shape = 'rect';
        break;

      default:
        _shape = 'rect';
    } // Add the node


    g.setNode(vertex.id, {
      labelType: 'svg',
      labelStyle: labelStyle,
      shape: _shape,
      label: vertexNode,
      rx: radious,
      ry: radious,
      class: classStr,
      style: style,
      id: vertex.id
    });
  });
};
/**
 * Add edges to graph based on parsed graph defninition
 * @param {Object} edges The edges to add to the graph
 * @param {Object} g The graph object
 */

var addEdges = function addEdges(edges, g) {
  var cnt = 0;
  var defaultStyle;

  if (typeof edges.defaultStyle !== 'undefined') {
    defaultStyle = edges.defaultStyle.toString().replace(/,/g, ';');
  }

  edges.forEach(function (edge) {
    cnt++;
    var edgeData = {}; // Set link type for rendering

    if (edge.type === 'arrow_open') {
      edgeData.arrowhead = 'none';
    } else {
      edgeData.arrowhead = 'normal';
    }

    var style = '';

    if (typeof edge.style !== 'undefined') {
      edge.style.forEach(function (s) {
        style = style + s + ';';
      });
    } else {
      switch (edge.stroke) {
        case 'normal':
          style = 'fill:none';

          if (typeof defaultStyle !== 'undefined') {
            style = defaultStyle;
          }

          break;

        case 'dotted':
          style = 'fill:none;stroke-width:2px;stroke-dasharray:3;';
          break;

        case 'thick':
          style = ' stroke-width: 3.5px;fill:none';
          break;
      }
    }

    edgeData.style = style;

    if (typeof edge.interpolate !== 'undefined') {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_8__["interpolateToCurve"])(edge.interpolate, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    } else if (typeof edges.defaultInterpolate !== 'undefined') {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_8__["interpolateToCurve"])(edges.defaultInterpolate, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    } else {
      edgeData.curve = Object(_utils__WEBPACK_IMPORTED_MODULE_8__["interpolateToCurve"])(conf.curve, d3__WEBPACK_IMPORTED_MODULE_1__["curveLinear"]);
    }

    if (typeof edge.text === 'undefined') {
      if (typeof edge.style !== 'undefined') {
        edgeData.arrowheadStyle = 'fill: #333';
      }
    } else {
      edgeData.arrowheadStyle = 'fill: #333';

      if (typeof edge.style === 'undefined') {
        edgeData.labelpos = 'c';

        if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart.htmlLabels) {
          edgeData.labelType = 'html';
          edgeData.label = '<span class="edgeLabel">' + edge.text + '</span>';
        } else {
          edgeData.labelType = 'text';
          edgeData.style = edgeData.style || 'stroke: #333; stroke-width: 1.5px;fill:none';
          edgeData.label = edge.text.replace(/<br>/g, '\n');
        }
      } else {
        edgeData.label = edge.text.replace(/<br>/g, '\n');
      }
    } // Add the edge to the graph


    g.setEdge(edge.start, edge.end, edgeData, cnt);
  });
};
/**
 * Returns the all the styles from classDef statements in the graph definition.
 * @returns {object} classDef styles
 */

var getClasses = function getClasses(text) {
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Extracting classes');
  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_flow__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition

  parser.parse(text);
  return _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getClasses();
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(text, id) {
  _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].info('Drawing flowchart');
  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].clear();
  var parser = _parser_flow__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
  parser.yy = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"]; // Parse the graph definition

  try {
    parser.parse(text);
  } catch (err) {
    _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].debug('Parsing failed');
  } // Fetch the default direction, use TD if none was found


  var dir = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getDirection();

  if (typeof dir === 'undefined') {
    dir = 'TD';
  } // Create the input mermaid.graph


  var g; // Todo remove newDagreD3 when properly verified

  if (newDagreD3) {
    g = new graphlib__WEBPACK_IMPORTED_MODULE_0___default.a.Graph({
      multigraph: true,
      compound: true
    }).setGraph({
      rankdir: dir,
      marginx: 8,
      marginy: 8
    }).setDefaultEdgeLabel(function () {
      return {};
    });
  } else {
    g = new graphlib__WEBPACK_IMPORTED_MODULE_0___default.a.Graph({
      multigraph: true,
      compound: true
    }).setGraph({
      rankdir: dir,
      marginx: 20,
      marginy: 20
    }).setDefaultEdgeLabel(function () {
      return {};
    });
  }

  var subG;
  var subGraphs = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getSubGraphs();

  for (var _i2 = subGraphs.length - 1; _i2 >= 0; _i2--) {
    subG = subGraphs[_i2];
    _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].addVertex(subG.id, subG.title, 'group', undefined, subG.classes);
  } // Fetch the verices/nodes and edges/links from the parsed graph definition


  var vert = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getVertices();
  var edges = _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getEdges();
  var i = 0;

  for (i = subGraphs.length - 1; i >= 0; i--) {
    subG = subGraphs[i];
    d3__WEBPACK_IMPORTED_MODULE_1__["selectAll"]('cluster').append('text');

    for (var j = 0; j < subG.nodes.length; j++) {
      g.setParent(subG.nodes[j], subG.id);
    }
  }

  addVertices(vert, g, id);
  addEdges(edges, g); // Create the renderer

  var Render = dagre_d3__WEBPACK_IMPORTED_MODULE_5___default.a.render;
  var render = new Render(); // Add custom shapes

  _flowChartShapes__WEBPACK_IMPORTED_MODULE_9__["default"].addToRender(render); // Add our custom arrow - an empty arrowhead

  render.arrows().none = function normal(parent, id, edge, type) {
    var marker = parent.append('marker').attr('id', id).attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerUnits', 'strokeWidth').attr('markerWidth', 8).attr('markerHeight', 6).attr('orient', 'auto');
    var path = marker.append('path').attr('d', 'M 0 0 L 0 0 L 0 0 z');
    dagre_d3__WEBPACK_IMPORTED_MODULE_5___default.a.util.applyStyle(path, edge[type + 'Style']);
  }; // Override normal arrowhead defined in d3. Remove style & add class to allow css styling.


  render.arrows().normal = function normal(parent, id) {
    var marker = parent.append('marker').attr('id', id).attr('viewBox', '0 0 10 10').attr('refX', 9).attr('refY', 5).attr('markerUnits', 'strokeWidth').attr('markerWidth', 8).attr('markerHeight', 6).attr('orient', 'auto');
    marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('class', 'arrowheadPath').style('stroke-width', 1).style('stroke-dasharray', '1,0');
  }; // Set up an SVG group so that we can translate the final graph.


  var svg = d3__WEBPACK_IMPORTED_MODULE_1__["select"]("[id=\"".concat(id, "\"]")); // Run the renderer. This is what draws the final graph.

  var element = d3__WEBPACK_IMPORTED_MODULE_1__["select"]('#' + id + ' g');
  render(element, g);
  element.selectAll('g.node').attr('title', function () {
    return _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].getTooltip(this.id);
  });
  var conf = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().flowchart;
  var padding = 8; // Todo remove newDagreD3 when properly verified

  if (newDagreD3) {
    var svgBounds = svg.node().getBBox();
    var width = svgBounds.width + padding * 2;
    var height = svgBounds.height + padding * 2;
    _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].debug("new ViewBox 0 0 ".concat(width, " ").concat(height), "translate(".concat(padding - g._label.marginx, ", ").concat(padding - g._label.marginy, ")"));

    if (conf.useMaxWidth) {
      svg.attr('width', '100%');
      svg.attr('style', "max-width: ".concat(width, "px;"));
    } else {
      svg.attr('height', height);
      svg.attr('width', width);
    }

    svg.attr('viewBox', "0 0 ".concat(width, " ").concat(height));
    svg.select('g').attr('transform', "translate(".concat(padding - g._label.marginx, ", ").concat(padding - svgBounds.y, ")"));
  } else {
    var _width = g.maxX - g.minX + padding * 2;

    var _height = g.maxY - g.minY + padding * 2;

    if (conf.useMaxWidth) {
      svg.attr('width', '100%');
      svg.attr('style', "max-width: ".concat(_width, "px;"));
    } else {
      svg.attr('height', _height);
      svg.attr('width', _width);
    }

    _logger__WEBPACK_IMPORTED_MODULE_7__["logger"].debug("Org ViewBox 0 0 ".concat(_width, " ").concat(_height), "translate(".concat(padding - g.minX, ", ").concat(padding - g.minY, ")\n").concat(location.href));
    svg.attr('viewBox', "0 0 ".concat(_width, " ").concat(_height));
    svg.select('g').attr('transform', "translate(".concat(padding - g.minX, ", ").concat(padding - g.minY, ")")); // svg.select('g').attr('transform', `translate(${padding - minX}, ${padding - minY})`);
  } // Index nodes


  _flowDb__WEBPACK_IMPORTED_MODULE_2__["default"].indexNodes('subGraph' + i); // reposition labels

  for (i = 0; i < subGraphs.length; i++) {
    subG = subGraphs[i];

    if (subG.title !== 'undefined') {
      var clusterRects = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"] rect');
      var clusterEl = document.querySelectorAll('#' + id + ' [id="' + subG.id + '"]');
      var xPos = clusterRects[0].x.baseVal.value;
      var yPos = clusterRects[0].y.baseVal.value;
      var _width2 = clusterRects[0].width.baseVal.value;
      var cluster = d3__WEBPACK_IMPORTED_MODULE_1__["select"](clusterEl[0]);
      var te = cluster.select('.label');
      te.attr('transform', "translate(".concat(xPos + _width2 / 2, ", ").concat(yPos + 14, ")"));
      te.attr('id', id + 'Text');
    }
  } // Add label rects for non html labels


  if (!conf.htmlLabels) {
    var labels = document.querySelectorAll('[id="' + id + '"] .edgeLabel .label');

    for (var k = 0; k < labels.length; k++) {
      var label = labels[k]; // Get dimensions of label

      var dim = label.getBBox();
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', 0);
      rect.setAttribute('ry', 0);
      rect.setAttribute('width', dim.width);
      rect.setAttribute('height', dim.height);
      rect.setAttribute('style', 'fill:#e8e8e8;');
      label.insertBefore(rect, label.firstChild);
    }
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  addVertices: addVertices,
  addEdges: addEdges,
  getClasses: getClasses,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/flowchart/parser/flow.jison":
/*!**************************************************!*\
  !*** ./src/diagrams/flowchart/parser/flow.jison ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,4],$V1=[1,3],$V2=[1,5],$V3=[1,8,9,10,11,26,87,88,89,90,91,92,102,103,106,107,108,110,111,117,118,119,120,121,122],$V4=[2,2],$V5=[1,12],$V6=[1,13],$V7=[1,14],$V8=[1,15],$V9=[1,22],$Va=[1,24],$Vb=[1,25],$Vc=[1,26],$Vd=[1,27],$Ve=[1,28],$Vf=[1,40],$Vg=[1,35],$Vh=[1,37],$Vi=[1,32],$Vj=[1,36],$Vk=[1,39],$Vl=[1,43],$Vm=[1,44],$Vn=[1,45],$Vo=[1,34],$Vp=[1,38],$Vq=[1,41],$Vr=[1,42],$Vs=[1,33],$Vt=[1,50],$Vu=[1,8,9,10,11,26,30,87,88,89,90,91,92,102,103,106,107,108,110,111,117,118,119,120,121,122],$Vv=[1,54],$Vw=[1,53],$Vx=[1,55],$Vy=[8,9,11,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82],$Vz=[8,9,11,34,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82],$VA=[8,9,10,11,28,34,36,38,40,42,43,45,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,92,102,103,106,107,108,110,111,117,118,119,120,121,122],$VB=[92,102,103,106,107,108,110,111,117,118,119,120,121,122],$VC=[1,129],$VD=[1,149],$VE=[1,150],$VF=[1,151],$VG=[1,152],$VH=[1,123],$VI=[1,125],$VJ=[1,124],$VK=[1,120],$VL=[1,144],$VM=[1,145],$VN=[1,146],$VO=[1,147],$VP=[1,148],$VQ=[1,153],$VR=[1,154],$VS=[1,127],$VT=[1,134],$VU=[1,137],$VV=[1,135],$VW=[1,136],$VX=[1,130],$VY=[1,142],$VZ=[1,141],$V_=[1,126],$V$=[1,122],$V01=[1,132],$V11=[1,133],$V21=[1,138],$V31=[1,139],$V41=[1,140],$V51=[1,143],$V61=[49,83,92,102,103,106,107,108,110,111,117,118,119,120,121,122],$V71=[8,9,10,11,26,30,87,88,89,90,91,92,102,103,106,107,108,110,111,117,118,119,120,121,122],$V81=[1,171],$V91=[1,173],$Va1=[1,174],$Vb1=[8,9,10,11,12,13,26,28,29,30,37,39,41,42,44,46,50,51,53,55,57,59,61,63,65,66,67,69,71,73,83,87,88,89,90,91,92,93,96,102,103,106,107,108,110,111,112,113,117,118,119,120,121,122],$Vc1=[8,9,10,11,13,92,102,103,106,107,108,110,111,117,118,119,120,121,122],$Vd1=[10,103],$Ve1=[1,252],$Vf1=[1,256],$Vg1=[1,253],$Vh1=[1,250],$Vi1=[1,247],$Vj1=[1,248],$Vk1=[1,249],$Vl1=[1,251],$Vm1=[1,254],$Vn1=[1,255],$Vo1=[1,257],$Vp1=[8,9,11],$Vq1=[1,282],$Vr1=[8,9,11,103],$Vs1=[8,9,10,11,87,99,102,103,106,107,108,109,110,111,112];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"mermaidDoc":3,"graphConfig":4,"document":5,"line":6,"statement":7,"SEMI":8,"NEWLINE":9,"SPACE":10,"EOF":11,"GRAPH":12,"DIR":13,"FirstStmtSeperator":14,"ending":15,"endToken":16,"spaceList":17,"spaceListNewline":18,"verticeStatement":19,"separator":20,"styleStatement":21,"linkStyleStatement":22,"classDefStatement":23,"classStatement":24,"clickStatement":25,"subgraph":26,"text":27,"SQS":28,"SQE":29,"end":30,"link":31,"node":32,"vertex":33,"STYLE_SEPARATOR":34,"idString":35,"PS":36,"PE":37,"(-":38,"-)":39,"DIAMOND_START":40,"DIAMOND_STOP":41,"TAGEND":42,"TRAPSTART":43,"TRAPEND":44,"INVTRAPSTART":45,"INVTRAPEND":46,"linkStatement":47,"arrowText":48,"TESTSTR":49,"--":50,"ARROW_POINT":51,"START_DOUBLE_ARROW_POINT":52,"ARROW_CIRCLE":53,"START_DOUBLE_ARROW_CIRCLE":54,"ARROW_CROSS":55,"START_DOUBLE_ARROW_CROSS":56,"ARROW_OPEN":57,"-.":58,"DOTTED_ARROW_POINT":59,"START_DOUBLE_DOTTED_ARROW_POINT":60,"DOTTED_ARROW_CIRCLE":61,"START_DOUBLE_DOTTED_ARROW_CIRCLE":62,"DOTTED_ARROW_CROSS":63,"START_DOUBLE_DOTTED_ARROW_CROSS":64,"DOTTED_ARROW_OPEN":65,"==":66,"THICK_ARROW_POINT":67,"START_DOUBLE_THICK_ARROW_POINT":68,"THICK_ARROW_CIRCLE":69,"START_DOUBLE_THICK_ARROW_CIRCLE":70,"THICK_ARROW_CROSS":71,"START_DOUBLE_THICK_ARROW_CROSS":72,"THICK_ARROW_OPEN":73,"DOUBLE_ARROW_POINT":74,"DOUBLE_ARROW_CIRCLE":75,"DOUBLE_ARROW_CROSS":76,"DOUBLE_DOTTED_ARROW_POINT":77,"DOUBLE_DOTTED_ARROW_CIRCLE":78,"DOUBLE_DOTTED_ARROW_CROSS":79,"DOUBLE_THICK_ARROW_POINT":80,"DOUBLE_THICK_ARROW_CIRCLE":81,"DOUBLE_THICK_ARROW_CROSS":82,"PIPE":83,"textToken":84,"STR":85,"keywords":86,"STYLE":87,"LINKSTYLE":88,"CLASSDEF":89,"CLASS":90,"CLICK":91,"DOWN":92,"UP":93,"textNoTags":94,"textNoTagsToken":95,"DEFAULT":96,"stylesOpt":97,"alphaNum":98,"HEX":99,"numList":100,"INTERPOLATE":101,"NUM":102,"COMMA":103,"style":104,"styleComponent":105,"ALPHA":106,"COLON":107,"MINUS":108,"UNIT":109,"BRKT":110,"DOT":111,"PCT":112,"TAGSTART":113,"alphaNumToken":114,"idStringToken":115,"alphaNumStatement":116,"PUNCTUATION":117,"UNICODE_TEXT":118,"PLUS":119,"EQUALS":120,"MULT":121,"UNDERSCORE":122,"graphCodeTokens":123,"QUOTE":124,"$accept":0,"$end":1},
terminals_: {2:"error",8:"SEMI",9:"NEWLINE",10:"SPACE",11:"EOF",12:"GRAPH",13:"DIR",26:"subgraph",28:"SQS",29:"SQE",30:"end",34:"STYLE_SEPARATOR",36:"PS",37:"PE",38:"(-",39:"-)",40:"DIAMOND_START",41:"DIAMOND_STOP",42:"TAGEND",43:"TRAPSTART",44:"TRAPEND",45:"INVTRAPSTART",46:"INVTRAPEND",49:"TESTSTR",50:"--",51:"ARROW_POINT",52:"START_DOUBLE_ARROW_POINT",53:"ARROW_CIRCLE",54:"START_DOUBLE_ARROW_CIRCLE",55:"ARROW_CROSS",56:"START_DOUBLE_ARROW_CROSS",57:"ARROW_OPEN",58:"-.",59:"DOTTED_ARROW_POINT",60:"START_DOUBLE_DOTTED_ARROW_POINT",61:"DOTTED_ARROW_CIRCLE",62:"START_DOUBLE_DOTTED_ARROW_CIRCLE",63:"DOTTED_ARROW_CROSS",64:"START_DOUBLE_DOTTED_ARROW_CROSS",65:"DOTTED_ARROW_OPEN",66:"==",67:"THICK_ARROW_POINT",68:"START_DOUBLE_THICK_ARROW_POINT",69:"THICK_ARROW_CIRCLE",70:"START_DOUBLE_THICK_ARROW_CIRCLE",71:"THICK_ARROW_CROSS",72:"START_DOUBLE_THICK_ARROW_CROSS",73:"THICK_ARROW_OPEN",74:"DOUBLE_ARROW_POINT",75:"DOUBLE_ARROW_CIRCLE",76:"DOUBLE_ARROW_CROSS",77:"DOUBLE_DOTTED_ARROW_POINT",78:"DOUBLE_DOTTED_ARROW_CIRCLE",79:"DOUBLE_DOTTED_ARROW_CROSS",80:"DOUBLE_THICK_ARROW_POINT",81:"DOUBLE_THICK_ARROW_CIRCLE",82:"DOUBLE_THICK_ARROW_CROSS",83:"PIPE",85:"STR",87:"STYLE",88:"LINKSTYLE",89:"CLASSDEF",90:"CLASS",91:"CLICK",92:"DOWN",93:"UP",96:"DEFAULT",99:"HEX",101:"INTERPOLATE",102:"NUM",103:"COMMA",106:"ALPHA",107:"COLON",108:"MINUS",109:"UNIT",110:"BRKT",111:"DOT",112:"PCT",113:"TAGSTART",117:"PUNCTUATION",118:"UNICODE_TEXT",119:"PLUS",120:"EQUALS",121:"MULT",122:"UNDERSCORE",124:"QUOTE"},
productions_: [0,[3,2],[5,0],[5,2],[6,1],[6,1],[6,1],[6,1],[6,1],[4,2],[4,2],[4,3],[15,2],[15,1],[16,1],[16,1],[16,1],[14,1],[14,1],[14,2],[18,2],[18,2],[18,1],[18,1],[17,2],[17,1],[7,2],[7,2],[7,2],[7,2],[7,2],[7,2],[7,9],[7,6],[7,4],[20,1],[20,1],[20,1],[19,3],[19,1],[32,1],[32,3],[33,4],[33,5],[33,6],[33,7],[33,4],[33,5],[33,4],[33,5],[33,4],[33,5],[33,6],[33,7],[33,4],[33,5],[33,4],[33,5],[33,4],[33,5],[33,4],[33,5],[33,4],[33,5],[33,1],[33,2],[31,2],[31,3],[31,3],[31,1],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[31,3],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[47,1],[48,3],[27,1],[27,2],[27,1],[86,1],[86,1],[86,1],[86,1],[86,1],[86,1],[86,1],[86,1],[86,1],[86,1],[86,1],[94,1],[94,2],[23,5],[23,5],[24,5],[25,5],[25,7],[25,5],[25,7],[21,5],[21,5],[22,5],[22,5],[22,9],[22,9],[22,7],[22,7],[100,1],[100,3],[97,1],[97,3],[104,1],[104,2],[105,1],[105,1],[105,1],[105,1],[105,1],[105,1],[105,1],[105,1],[105,1],[105,1],[105,1],[84,1],[84,1],[84,1],[84,1],[84,1],[84,1],[84,1],[95,1],[95,1],[95,1],[95,1],[35,1],[35,2],[98,1],[98,2],[116,1],[116,1],[116,1],[116,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[114,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[115,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1],[123,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 2:
 this.$ = [];
break;
case 3:

	    if($$[$0] !== []){
	        $$[$0-1].push($$[$0]);
	    }
	    this.$=$$[$0-1];
break;
case 4: case 113: case 115: case 127: case 174: case 176: case 177:
this.$=$$[$0];
break;
case 11:
 yy.setDirection($$[$0-1]);this.$ = $$[$0-1];
break;
case 26:
 this.$=$$[$0-1]
break;
case 27: case 28: case 29: case 30: case 31:
this.$=[];
break;
case 32:
this.$=yy.addSubGraph($$[$0-6],$$[$0-1],$$[$0-4]);
break;
case 33:
this.$=yy.addSubGraph($$[$0-3],$$[$0-1],$$[$0-3]);
break;
case 34:
this.$=yy.addSubGraph(undefined,$$[$0-1],undefined);
break;
case 38:
 yy.addLink($$[$0-2][0],$$[$0][0],$$[$0-1]); this.$ = $$[$0].concat($$[$0-2]) 
break;
case 39:
 this.$ = $$[$0] 
break;
case 40:
 this.$ = [$$[$0]];
break;
case 41:
this.$ = [$$[$0-2]];yy.setClass($$[$0-2],$$[$0])
break;
case 42:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'square');
break;
case 43:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'square');
break;
case 44:
this.$ = $$[$0-5];yy.addVertex($$[$0-5],$$[$0-2],'circle');
break;
case 45:
this.$ = $$[$0-6];yy.addVertex($$[$0-6],$$[$0-3],'circle');
break;
case 46:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'ellipse');
break;
case 47:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'ellipse');
break;
case 48:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'round');
break;
case 49:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'round');
break;
case 50:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'diamond');
break;
case 51:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'diamond');
break;
case 52:
this.$ = $$[$0-5];yy.addVertex($$[$0-5],$$[$0-2],'hexagon');
break;
case 53:
this.$ = $$[$0-6];yy.addVertex($$[$0-6],$$[$0-3],'hexagon');
break;
case 54:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'odd');
break;
case 55:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'odd');
break;
case 56:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'trapezoid');
break;
case 57:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'trapezoid');
break;
case 58:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'inv_trapezoid');
break;
case 59:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'inv_trapezoid');
break;
case 60:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'lean_right');
break;
case 61:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'lean_right');
break;
case 62:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'lean_left');
break;
case 63:
this.$ = $$[$0-4];yy.addVertex($$[$0-4],$$[$0-2],'lean_left');
break;
case 64:
this.$ = $$[$0];yy.addVertex($$[$0]);
break;
case 65:
this.$ = $$[$0-1];yy.addVertex($$[$0-1]);
break;
case 66:
$$[$0-1].text = $$[$0];this.$ = $$[$0-1];
break;
case 67: case 68:
$$[$0-2].text = $$[$0-1];this.$ = $$[$0-2];
break;
case 69:
this.$ = $$[$0];
break;
case 70:
this.$ = {"type":"arrow","stroke":"normal","text":$$[$0-1]};
break;
case 71:
this.$ = {"type":"double_arrow_point","stroke":"normal","text":$$[$0-1]};
break;
case 72:
this.$ = {"type":"arrow_circle","stroke":"normal","text":$$[$0-1]};
break;
case 73:
this.$ = {"type":"double_arrow_circle","stroke":"normal","text":$$[$0-1]};
break;
case 74:
this.$ = {"type":"arrow_cross","stroke":"normal","text":$$[$0-1]};
break;
case 75:
this.$ = {"type":"double_arrow_cross","stroke":"normal","text":$$[$0-1]};
break;
case 76:
this.$ = {"type":"arrow_open","stroke":"normal","text":$$[$0-1]};
break;
case 77:
this.$ = {"type":"arrow","stroke":"dotted","text":$$[$0-1]};
break;
case 78:
this.$ = {"type":"double_arrow_point","stroke":"dotted","text":$$[$0-1]};
break;
case 79:
this.$ = {"type":"arrow_circle","stroke":"dotted","text":$$[$0-1]};
break;
case 80:
this.$ = {"type":"double_arrow_circle","stroke":"dotted","text":$$[$0-1]};
break;
case 81:
this.$ = {"type":"arrow_cross","stroke":"dotted","text":$$[$0-1]};
break;
case 82:
this.$ = {"type":"double_arrow_cross","stroke":"dotted","text":$$[$0-1]};
break;
case 83:
this.$ = {"type":"arrow_open","stroke":"dotted","text":$$[$0-1]};
break;
case 84:
this.$ = {"type":"arrow","stroke":"thick","text":$$[$0-1]};
break;
case 85:
this.$ = {"type":"double_arrow_point","stroke":"thick","text":$$[$0-1]};
break;
case 86:
this.$ = {"type":"arrow_circle","stroke":"thick","text":$$[$0-1]};
break;
case 87:
this.$ = {"type":"double_arrow_circle","stroke":"thick","text":$$[$0-1]};
break;
case 88:
this.$ = {"type":"arrow_cross","stroke":"thick","text":$$[$0-1]};
break;
case 89:
this.$ = {"type":"double_arrow_cross","stroke":"thick","text":$$[$0-1]};
break;
case 90:
this.$ = {"type":"arrow_open","stroke":"thick","text":$$[$0-1]};
break;
case 91:
this.$ = {"type":"arrow","stroke":"normal"};
break;
case 92:
this.$ = {"type":"double_arrow_point","stroke":"normal"};
break;
case 93:
this.$ = {"type":"arrow_circle","stroke":"normal"};
break;
case 94:
this.$ = {"type":"double_arrow_circle","stroke":"normal"};
break;
case 95:
this.$ = {"type":"arrow_cross","stroke":"normal"};
break;
case 96:
this.$ = {"type":"double_arrow_cross","stroke":"normal"};
break;
case 97:
this.$ = {"type":"arrow_open","stroke":"normal"};
break;
case 98:
this.$ = {"type":"arrow","stroke":"dotted"};
break;
case 99:
this.$ = {"type":"double_arrow_point","stroke":"dotted"};
break;
case 100:
this.$ = {"type":"arrow_circle","stroke":"dotted"};
break;
case 101:
this.$ = {"type":"double_arrow_circle","stroke":"dotted"};
break;
case 102:
this.$ = {"type":"arrow_cross","stroke":"dotted"};
break;
case 103:
this.$ = {"type":"double_arrow_cross","stroke":"dotted"};
break;
case 104:
this.$ = {"type":"arrow_open","stroke":"dotted"};
break;
case 105:
this.$ = {"type":"arrow","stroke":"thick"};
break;
case 106:
this.$ = {"type":"double_arrow_point","stroke":"thick"};
break;
case 107:
this.$ = {"type":"arrow_circle","stroke":"thick"};
break;
case 108:
this.$ = {"type":"double_arrow_circle","stroke":"thick"};
break;
case 109:
this.$ = {"type":"arrow_cross","stroke":"thick"};
break;
case 110:
this.$ = {"type":"double_arrow_cross","stroke":"thick"};
break;
case 111:
this.$ = {"type":"arrow_open","stroke":"thick"};
break;
case 112:
this.$ = $$[$0-1];
break;
case 114: case 128: case 175:
this.$=$$[$0-1]+''+$$[$0];
break;
case 129: case 130:
this.$ = $$[$0-4];yy.addClass($$[$0-2],$$[$0]);
break;
case 131:
this.$ = $$[$0-4];yy.setClass($$[$0-2], $$[$0]);
break;
case 132:
this.$ = $$[$0-4];yy.setClickEvent($$[$0-2], $$[$0], undefined);
break;
case 133:
this.$ = $$[$0-6];yy.setClickEvent($$[$0-4], $$[$0-2], $$[$0])       ;
break;
case 134:
this.$ = $$[$0-4];yy.setLink($$[$0-2], $$[$0], undefined);
break;
case 135:
this.$ = $$[$0-6];yy.setLink($$[$0-4], $$[$0-2], $$[$0]       );
break;
case 136:
this.$ = $$[$0-4];yy.addVertex($$[$0-2],undefined,undefined,$$[$0]);
break;
case 137: case 139:
this.$ = $$[$0-4];yy.updateLink($$[$0-2],$$[$0]);
break;
case 138:
this.$ = $$[$0-4];yy.updateLink([$$[$0-2]],$$[$0]);
break;
case 140:
this.$ = $$[$0-8];yy.updateLinkInterpolate([$$[$0-6]],$$[$0-2]);yy.updateLink([$$[$0-6]],$$[$0]);
break;
case 141:
this.$ = $$[$0-8];yy.updateLinkInterpolate($$[$0-6],$$[$0-2]);yy.updateLink($$[$0-6],$$[$0]);
break;
case 142:
this.$ = $$[$0-6];yy.updateLinkInterpolate([$$[$0-4]],$$[$0]);
break;
case 143:
this.$ = $$[$0-6];yy.updateLinkInterpolate($$[$0-4],$$[$0]);
break;
case 144: case 146:
this.$ = [$$[$0]]
break;
case 145: case 147:
$$[$0-2].push($$[$0]);this.$ = $$[$0-2];
break;
case 149:
this.$ = $$[$0-1] + $$[$0];
break;
case 172:
this.$=$$[$0]
break;
case 173:
this.$=$$[$0-1]+''+$$[$0]
break;
case 178:
this.$='v';
break;
case 179:
this.$='-';
break;
}
},
table: [{3:1,4:2,9:$V0,10:$V1,12:$V2},{1:[3]},o($V3,$V4,{5:6}),{4:7,9:$V0,10:$V1,12:$V2},{4:8,9:$V0,10:$V1,12:$V2},{13:[1,9]},{1:[2,1],6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,32:23,33:29,35:30,87:$Va,88:$Vb,89:$Vc,90:$Vd,91:$Ve,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,115:31,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs},o($V3,[2,9]),o($V3,[2,10]),{8:[1,47],9:[1,48],10:$Vt,14:46,17:49},o($Vu,[2,3]),o($Vu,[2,4]),o($Vu,[2,5]),o($Vu,[2,6]),o($Vu,[2,7]),o($Vu,[2,8]),{8:$Vv,9:$Vw,11:$Vx,20:51,31:52,47:56,50:[1,57],51:[1,69],52:[1,58],53:[1,71],54:[1,59],55:[1,73],56:[1,60],57:[1,75],58:[1,61],59:[1,76],60:[1,62],61:[1,78],62:[1,63],63:[1,80],64:[1,64],65:[1,82],66:[1,65],67:[1,83],68:[1,66],69:[1,85],70:[1,67],71:[1,87],72:[1,68],73:[1,89],74:[1,70],75:[1,72],76:[1,74],77:[1,77],78:[1,79],79:[1,81],80:[1,84],81:[1,86],82:[1,88]},{8:$Vv,9:$Vw,11:$Vx,20:90},{8:$Vv,9:$Vw,11:$Vx,20:91},{8:$Vv,9:$Vw,11:$Vx,20:92},{8:$Vv,9:$Vw,11:$Vx,20:93},{8:$Vv,9:$Vw,11:$Vx,20:94},{8:$Vv,9:$Vw,10:[1,95],11:$Vx,20:96},o($Vy,[2,39]),{10:[1,97]},{10:[1,98]},{10:[1,99]},{10:[1,100]},{10:[1,101]},o($Vy,[2,40],{34:[1,102]}),o($Vz,[2,64],{17:110,115:111,10:$Vt,28:[1,103],36:[1,104],38:[1,105],40:[1,106],42:[1,107],43:[1,108],45:[1,109],92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs}),o($VA,[2,172]),o($VA,[2,192]),o($VA,[2,193]),o($VA,[2,194]),o($VA,[2,195]),o($VA,[2,196]),o($VA,[2,197]),o($VA,[2,198]),o($VA,[2,199]),o($VA,[2,200]),o($VA,[2,201]),o($VA,[2,202]),o($VA,[2,203]),o($VA,[2,204]),o($VA,[2,205]),o($V3,[2,11]),o($V3,[2,17]),o($V3,[2,18]),{9:[1,112]},o($Vz,[2,25],{17:113,10:$Vt}),o($Vu,[2,26]),{32:114,33:29,35:30,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,115:31,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs},o($Vu,[2,35]),o($Vu,[2,36]),o($Vu,[2,37]),o($VB,[2,69],{48:115,49:[1,116],83:[1,117]}),{10:$VC,12:$VD,13:$VE,26:$VF,27:118,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:155,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:156,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:157,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:158,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:159,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:160,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:161,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:162,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:163,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:164,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:165,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($V61,[2,91]),o($V61,[2,92]),o($V61,[2,93]),o($V61,[2,94]),o($V61,[2,95]),o($V61,[2,96]),o($V61,[2,97]),o($V61,[2,98]),o($V61,[2,99]),o($V61,[2,100]),o($V61,[2,101]),o($V61,[2,102]),o($V61,[2,103]),o($V61,[2,104]),o($V61,[2,105]),o($V61,[2,106]),o($V61,[2,107]),o($V61,[2,108]),o($V61,[2,109]),o($V61,[2,110]),o($V61,[2,111]),o($Vu,[2,27]),o($Vu,[2,28]),o($Vu,[2,29]),o($Vu,[2,30]),o($Vu,[2,31]),{10:$VC,12:$VD,13:$VE,26:$VF,27:166,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($V71,$V4,{5:167}),{13:$V81,92:$V91,98:168,99:[1,169],102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{96:[1,175],100:176,102:[1,177]},{13:$V81,92:$V91,96:[1,178],98:179,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{13:$V81,92:$V91,98:180,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{13:$V81,92:$V91,98:181,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{35:182,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,115:31,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs},{10:$VC,12:$VD,13:$VE,26:$VF,27:183,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:185,30:$VG,36:[1,184],42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:186,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:187,30:$VG,40:[1,188],42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:189,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:190,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:191,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($Vz,[2,65]),o($VA,[2,173]),o($V3,[2,19]),o($Vz,[2,24]),o($Vy,[2,38]),o($VB,[2,66],{10:[1,192]}),{10:[1,193]},{10:$VC,12:$VD,13:$VE,26:$VF,27:194,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,51:[1,195],53:[1,196],55:[1,197],57:[1,198],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($Vb1,[2,113]),o($Vb1,[2,115]),o($Vb1,[2,161]),o($Vb1,[2,162]),o($Vb1,[2,163]),o($Vb1,[2,164]),o($Vb1,[2,165]),o($Vb1,[2,166]),o($Vb1,[2,167]),o($Vb1,[2,168]),o($Vb1,[2,169]),o($Vb1,[2,170]),o($Vb1,[2,171]),o($Vb1,[2,180]),o($Vb1,[2,181]),o($Vb1,[2,182]),o($Vb1,[2,183]),o($Vb1,[2,184]),o($Vb1,[2,185]),o($Vb1,[2,186]),o($Vb1,[2,187]),o($Vb1,[2,188]),o($Vb1,[2,189]),o($Vb1,[2,190]),o($Vb1,[2,191]),o($Vb1,[2,116]),o($Vb1,[2,117]),o($Vb1,[2,118]),o($Vb1,[2,119]),o($Vb1,[2,120]),o($Vb1,[2,121]),o($Vb1,[2,122]),o($Vb1,[2,123]),o($Vb1,[2,124]),o($Vb1,[2,125]),o($Vb1,[2,126]),{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,51:[1,200],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,53:[1,201],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,55:[1,202],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,59:[1,203],61:[1,204],63:[1,205],65:[1,206],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,59:[1,207],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,61:[1,208],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,63:[1,209],66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,66:$VJ,67:[1,210],69:[1,211],71:[1,212],73:[1,213],84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,66:$VJ,67:[1,214],84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,66:$VJ,69:[1,215],84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,66:$VJ,71:[1,216],84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{8:$Vv,9:$Vw,10:$VC,11:$Vx,12:$VD,13:$VE,20:218,26:$VF,28:[1,217],30:$VG,42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,30:[1,219],32:23,33:29,35:30,87:$Va,88:$Vb,89:$Vc,90:$Vd,91:$Ve,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,115:31,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs},{10:[1,220],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:221,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:[1,222]},o($Vc1,[2,174]),o($Vc1,[2,176]),o($Vc1,[2,177]),o($Vc1,[2,178]),o($Vc1,[2,179]),{10:[1,223]},{10:[1,224],103:[1,225]},o($Vd1,[2,144]),{10:[1,226]},{10:[1,227],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:221,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:[1,228],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:221,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:[1,229],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:221,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($Vy,[2,41],{115:111,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs}),{10:$VC,12:$VD,13:$VE,26:$VF,29:[1,230],30:$VG,42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:231,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,37:[1,232],42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,39:[1,233],42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,41:[1,234],42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,27:235,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,29:[1,236],30:$VG,42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,44:[1,237],46:[1,238],50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,44:[1,240],46:[1,239],50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($VB,[2,68]),o($VB,[2,67]),{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,42:$VH,50:$VI,66:$VJ,83:[1,241],84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($VB,[2,70]),o($VB,[2,72]),o($VB,[2,74]),o($VB,[2,76]),o($Vb1,[2,114]),o($VB,[2,71]),o($VB,[2,73]),o($VB,[2,75]),o($VB,[2,77]),o($VB,[2,79]),o($VB,[2,81]),o($VB,[2,83]),o($VB,[2,78]),o($VB,[2,80]),o($VB,[2,82]),o($VB,[2,84]),o($VB,[2,86]),o($VB,[2,88]),o($VB,[2,90]),o($VB,[2,85]),o($VB,[2,87]),o($VB,[2,89]),{10:$VC,12:$VD,13:$VE,26:$VF,27:242,30:$VG,42:$VH,50:$VI,66:$VJ,84:119,85:$VK,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($V71,$V4,{5:243}),o($Vu,[2,34]),{10:$Ve1,87:$Vf1,97:244,99:$Vg1,102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},o($Vc1,[2,175]),{10:$Ve1,87:$Vf1,97:258,99:$Vg1,102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},{10:$Ve1,87:$Vf1,97:259,99:$Vg1,101:[1,260],102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},{10:$Ve1,87:$Vf1,97:261,99:$Vg1,101:[1,262],102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},{102:[1,263]},{10:$Ve1,87:$Vf1,97:264,99:$Vg1,102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},{10:$Ve1,87:$Vf1,97:265,99:$Vg1,102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},{13:$V81,92:$V91,98:266,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{13:$V81,85:[1,268],92:$V91,98:267,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($Vz,[2,42],{17:269,10:$Vt}),{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,37:[1,270],42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($Vz,[2,48],{17:271,10:$Vt}),o($Vz,[2,46],{17:272,10:$Vt}),o($Vz,[2,50],{17:273,10:$Vt}),{10:$VC,12:$VD,13:$VE,26:$VF,30:$VG,41:[1,274],42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},o($Vz,[2,54],{17:275,10:$Vt}),o($Vz,[2,56],{17:276,10:$Vt}),o($Vz,[2,60],{17:277,10:$Vt}),o($Vz,[2,58],{17:278,10:$Vt}),o($Vz,[2,62],{17:279,10:$Vt}),o([10,92,102,103,106,107,108,110,111,117,118,119,120,121,122],[2,112]),{10:$VC,12:$VD,13:$VE,26:$VF,29:[1,280],30:$VG,42:$VH,50:$VI,66:$VJ,84:199,86:131,87:$VL,88:$VM,89:$VN,90:$VO,91:$VP,92:$VQ,93:$VR,95:121,96:$VS,102:$VT,103:$VU,106:$VV,107:$VW,108:$VX,110:$VY,111:$VZ,112:$V_,113:$V$,114:128,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,30:[1,281],32:23,33:29,35:30,87:$Va,88:$Vb,89:$Vc,90:$Vd,91:$Ve,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,115:31,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs},o($Vp1,[2,136],{103:$Vq1}),o($Vr1,[2,146],{105:283,10:$Ve1,87:$Vf1,99:$Vg1,102:$Vh1,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1}),o($Vs1,[2,148]),o($Vs1,[2,150]),o($Vs1,[2,151]),o($Vs1,[2,152]),o($Vs1,[2,153]),o($Vs1,[2,154]),o($Vs1,[2,155]),o($Vs1,[2,156]),o($Vs1,[2,157]),o($Vs1,[2,158]),o($Vs1,[2,159]),o($Vs1,[2,160]),o($Vp1,[2,137],{103:$Vq1}),o($Vp1,[2,138],{103:$Vq1}),{10:[1,284]},o($Vp1,[2,139],{103:$Vq1}),{10:[1,285]},o($Vd1,[2,145]),o($Vp1,[2,129],{103:$Vq1}),o($Vp1,[2,130],{103:$Vq1}),o($Vp1,[2,131],{114:172,116:221,13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51}),o($Vp1,[2,132],{114:172,116:221,10:[1,286],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51}),o($Vp1,[2,134],{10:[1,287]}),o($Vz,[2,43]),{37:[1,288]},o($Vz,[2,49]),o($Vz,[2,47]),o($Vz,[2,51]),{41:[1,289]},o($Vz,[2,55]),o($Vz,[2,57]),o($Vz,[2,61]),o($Vz,[2,59]),o($Vz,[2,63]),{8:$Vv,9:$Vw,11:$Vx,20:290},o($Vu,[2,33]),{10:$Ve1,87:$Vf1,99:$Vg1,102:$Vh1,104:291,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},o($Vs1,[2,149]),{13:$V81,92:$V91,98:292,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{13:$V81,92:$V91,98:293,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,114:172,116:170,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51},{85:[1,294]},{85:[1,295]},o($Vz,[2,44],{17:296,10:$Vt}),o($Vz,[2,52],{17:297,10:$Vt}),o($V71,$V4,{5:298}),o($Vr1,[2,147],{105:283,10:$Ve1,87:$Vf1,99:$Vg1,102:$Vh1,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1}),o($Vp1,[2,142],{114:172,116:221,10:[1,299],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51}),o($Vp1,[2,143],{114:172,116:221,10:[1,300],13:$V81,92:$V91,102:$VT,103:$VU,106:$VV,107:$VW,108:$Va1,110:$VY,111:$VZ,117:$V01,118:$V11,119:$V21,120:$V31,121:$V41,122:$V51}),o($Vp1,[2,133]),o($Vp1,[2,135]),o($Vz,[2,45]),o($Vz,[2,53]),{6:10,7:11,8:$V5,9:$V6,10:$V7,11:$V8,19:16,21:17,22:18,23:19,24:20,25:21,26:$V9,30:[1,301],32:23,33:29,35:30,87:$Va,88:$Vb,89:$Vc,90:$Vd,91:$Ve,92:$Vf,102:$Vg,103:$Vh,106:$Vi,107:$Vj,108:$Vk,110:$Vl,111:$Vm,115:31,117:$Vn,118:$Vo,119:$Vp,120:$Vq,121:$Vr,122:$Vs},{10:$Ve1,87:$Vf1,97:302,99:$Vg1,102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},{10:$Ve1,87:$Vf1,97:303,99:$Vg1,102:$Vh1,104:245,105:246,106:$Vi1,107:$Vj1,108:$Vk1,109:$Vl1,110:$Vm1,111:$Vn1,112:$Vo1},o($Vu,[2,32]),o($Vp1,[2,140],{103:$Vq1}),o($Vp1,[2,141],{103:$Vq1})],
defaultActions: {},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* do nothing */
break;
case 1:this.begin("string");
break;
case 2:this.popState();
break;
case 3:return "STR";
break;
case 4:return 87;
break;
case 5:return 96;
break;
case 6:return 88;
break;
case 7:return 101;
break;
case 8:return 89;
break;
case 9:return 90;
break;
case 10:return 91;
break;
case 11:if(yy.lex.firstGraph()){this.begin("dir");}  return 12;
break;
case 12:return 26;
break;
case 13:return 30;
break;
case 14:   this.popState();  return 13; 
break;
case 15:   this.popState();  return 13; 
break;
case 16:   this.popState();  return 13; 
break;
case 17:   this.popState();  return 13; 
break;
case 18:   this.popState();  return 13; 
break;
case 19:   this.popState();  return 13; 
break;
case 20:   this.popState();  return 13; 
break;
case 21:   this.popState();  return 13; 
break;
case 22:   this.popState();  return 13; 
break;
case 23:   this.popState();  return 13; 
break;
case 24: return 102;
break;
case 25:return 110;
break;
case 26:return 34;
break;
case 27:return 107;
break;
case 28:return 8;
break;
case 29:return 103;
break;
case 30:return 121;
break;
case 31:return 55;
break;
case 32:return 51;
break;
case 33:return 74;
break;
case 34:return 76;
break;
case 35:return 75;
break;
case 36:return 78;
break;
case 37:return 80;
break;
case 38:return 81;
break;
case 39:return 82;
break;
case 40:return 79;
break;
case 41:return 79;
break;
case 42:return 77;
break;
case 43:return 77;
break;
case 44:return 78;
break;
case 45:return 53;
break;
case 46:return 57;
break;
case 47:return 63;
break;
case 48:return 59;
break;
case 49:return 61;
break;
case 50:return 65;
break;
case 51:return 63;
break;
case 52:return 59;
break;
case 53:return 61;
break;
case 54:return 65;
break;
case 55:return 71;
break;
case 56:return 67;
break;
case 57:return 69;
break;
case 58:return 73;
break;
case 59:return 52;
break;
case 60:return 56;
break;
case 61:return 54;
break;
case 62:return 60;
break;
case 63:return 64;
break;
case 64:return 62;
break;
case 65:return 68;
break;
case 66:return 72;
break;
case 67:return 70;
break;
case 68:return 50;
break;
case 69:return 58;
break;
case 70:return 66;
break;
case 71:return 38;
break;
case 72:return 39;
break;
case 73:return 108;
break;
case 74:return 111;
break;
case 75:return 122;
break;
case 76:return 119;
break;
case 77:return 112;
break;
case 78:return 120;
break;
case 79:return 120;
break;
case 80:return 113;
break;
case 81:return 42;
break;
case 82:return 93;
break;
case 83:return 92;
break;
case 84:return 106;
break;
case 85:return 44;
break;
case 86:return 43;
break;
case 87:return 46;
break;
case 88:return 45;
break;
case 89:return 117;
break;
case 90:return 118;
break;
case 91:return 83;
break;
case 92:return 36;
break;
case 93:return 37;
break;
case 94:return 28;
break;
case 95:return 29;
break;
case 96:return 40
break;
case 97:return 41
break;
case 98:return 124;
break;
case 99:return 9;
break;
case 100:return 10;
break;
case 101:return 11;
break;
}
},
rules: [/^(?:%%[^\n]*\n*)/,/^(?:["])/,/^(?:["])/,/^(?:[^"]*)/,/^(?:style\b)/,/^(?:default\b)/,/^(?:linkStyle\b)/,/^(?:interpolate\b)/,/^(?:classDef\b)/,/^(?:class\b)/,/^(?:click\b)/,/^(?:graph\b)/,/^(?:subgraph\b)/,/^(?:end\b\s*)/,/^(?:\s*LR\b)/,/^(?:\s*RL\b)/,/^(?:\s*TB\b)/,/^(?:\s*BT\b)/,/^(?:\s*TD\b)/,/^(?:\s*BR\b)/,/^(?:\s*<)/,/^(?:\s*>)/,/^(?:\s*\^)/,/^(?:\s*v\b)/,/^(?:[0-9]+)/,/^(?:#)/,/^(?::::)/,/^(?::)/,/^(?:;)/,/^(?:,)/,/^(?:\*)/,/^(?:\s*--[x]\s*)/,/^(?:\s*-->\s*)/,/^(?:\s*<-->\s*)/,/^(?:\s*[x]--[x]\s*)/,/^(?:\s*[o]--[o]\s*)/,/^(?:\s*[o]\.-[o]\s*)/,/^(?:\s*<==>\s*)/,/^(?:\s*[o]==[o]\s*)/,/^(?:\s*[x]==[x]\s*)/,/^(?:\s*[x].-[x]\s*)/,/^(?:\s*[x]-\.-[x]\s*)/,/^(?:\s*<\.->\s*)/,/^(?:\s*<-\.->\s*)/,/^(?:\s*[o]-\.-[o]\s*)/,/^(?:\s*--[o]\s*)/,/^(?:\s*---\s*)/,/^(?:\s*-\.-[x]\s*)/,/^(?:\s*-\.->\s*)/,/^(?:\s*-\.-[o]\s*)/,/^(?:\s*-\.-\s*)/,/^(?:\s*.-[x]\s*)/,/^(?:\s*\.->\s*)/,/^(?:\s*\.-[o]\s*)/,/^(?:\s*\.-\s*)/,/^(?:\s*==[x]\s*)/,/^(?:\s*==>\s*)/,/^(?:\s*==[o]\s*)/,/^(?:\s*==[\=]\s*)/,/^(?:\s*<--\s*)/,/^(?:\s*[x]--\s*)/,/^(?:\s*[o]--\s*)/,/^(?:\s*<-\.\s*)/,/^(?:\s*[x]-\.\s*)/,/^(?:\s*[o]-\.\s*)/,/^(?:\s*<==\s*)/,/^(?:\s*[x]==\s*)/,/^(?:\s*[o]==\s*)/,/^(?:\s*--\s*)/,/^(?:\s*-\.\s*)/,/^(?:\s*==\s*)/,/^(?:\(-)/,/^(?:-\))/,/^(?:-)/,/^(?:\.)/,/^(?:[\_])/,/^(?:\+)/,/^(?:%)/,/^(?:=)/,/^(?:=)/,/^(?:<)/,/^(?:>)/,/^(?:\^)/,/^(?:v\b)/,/^(?:[A-Za-z]+)/,/^(?:\\\])/,/^(?:\[\/)/,/^(?:\/\])/,/^(?:\[\\)/,/^(?:[!"#$%&'*+,-.`?\\_\/])/,/^(?:[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6]|[\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377]|[\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5]|[\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA]|[\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE]|[\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA]|[\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0]|[\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977]|[\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2]|[\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A]|[\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39]|[\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8]|[\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C]|[\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C]|[\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99]|[\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0]|[\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D]|[\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3]|[\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10]|[\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1]|[\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81]|[\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3]|[\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6]|[\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A]|[\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081]|[\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D]|[\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0]|[\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310]|[\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C]|[\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711]|[\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7]|[\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C]|[\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16]|[\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF]|[\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC]|[\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D]|[\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D]|[\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3]|[\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F]|[\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128]|[\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184]|[\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3]|[\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6]|[\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE]|[\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C]|[\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D]|[\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC]|[\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B]|[\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788]|[\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805]|[\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB]|[\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28]|[\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5]|[\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4]|[\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E]|[\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D]|[\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36]|[\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D]|[\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC]|[\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF]|[\uFFD2-\uFFD7\uFFDA-\uFFDC])/,/^(?:\|)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:")/,/^(?:(\r|\n|\r\n)+)/,/^(?:\s)/,/^(?:$)/],
conditions: {"dir":{"rules":[14,15,16,17,18,19,20,21,22,23],"inclusive":false},"string":{"rules":[2,3],"inclusive":false},"INITIAL":{"rules":[0,1,4,5,6,7,8,9,10,11,12,13,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/gantt/ganttDb.js":
/*!***************************************!*\
  !*** ./src/diagrams/gantt/ganttDb.js ***!
  \***************************************/
/*! exports provided: clear, setAxisFormat, getAxisFormat, setDateFormat, enableInclusiveEndDates, endDatesAreInclusive, getDateFormat, setExcludes, getExcludes, setTitle, getTitle, addSection, getSections, getTasks, addTask, findTaskById, addTaskOrg, setLink, setClass, setClickEvent, bindFunctions, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAxisFormat", function() { return setAxisFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getAxisFormat", function() { return getAxisFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDateFormat", function() { return setDateFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "enableInclusiveEndDates", function() { return enableInclusiveEndDates; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "endDatesAreInclusive", function() { return endDatesAreInclusive; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDateFormat", function() { return getDateFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setExcludes", function() { return setExcludes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getExcludes", function() { return getExcludes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTitle", function() { return setTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTitle", function() { return getTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSection", function() { return addSection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getSections", function() { return getSections; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTasks", function() { return getTasks; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTask", function() { return addTask; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "findTaskById", function() { return findTaskById; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTaskOrg", function() { return addTaskOrg; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLink", function() { return setLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClass", function() { return setClass; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setClickEvent", function() { return setClickEvent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bindFunctions", function() { return bindFunctions; });
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! moment-mini */ "moment-mini");
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(moment_mini__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @braintree/sanitize-url */ "@braintree/sanitize-url");
/* harmony import */ var _braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../config */ "./src/config.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }





var config = Object(_config__WEBPACK_IMPORTED_MODULE_3__["getConfig"])();
var dateFormat = '';
var axisFormat = '';
var excludes = [];
var title = '';
var sections = [];
var tasks = [];
var currentSection = '';
var tags = ['active', 'done', 'crit', 'milestone'];
var funs = [];
var inclusiveEndDates = false;
var clear = function clear() {
  sections = [];
  tasks = [];
  currentSection = '';
  funs = [];
  title = '';
  taskCnt = 0;
  lastTask = undefined;
  lastTaskID = undefined;
  rawTasks = [];
  dateFormat = '';
  axisFormat = '';
  excludes = [];
  inclusiveEndDates = false;
};
var setAxisFormat = function setAxisFormat(txt) {
  axisFormat = txt;
};
var getAxisFormat = function getAxisFormat() {
  return axisFormat;
};
var setDateFormat = function setDateFormat(txt) {
  dateFormat = txt;
};
var enableInclusiveEndDates = function enableInclusiveEndDates() {
  inclusiveEndDates = true;
};
var endDatesAreInclusive = function endDatesAreInclusive() {
  return inclusiveEndDates;
};
var getDateFormat = function getDateFormat() {
  return dateFormat;
};
var setExcludes = function setExcludes(txt) {
  excludes = txt.toLowerCase().split(/[\s,]+/);
};
var getExcludes = function getExcludes() {
  return excludes;
};
var setTitle = function setTitle(txt) {
  title = txt;
};
var getTitle = function getTitle() {
  return title;
};
var addSection = function addSection(txt) {
  currentSection = txt;
  sections.push(txt);
};
var getSections = function getSections() {
  return sections;
};
var getTasks = function getTasks() {
  var allItemsPricessed = compileTasks();
  var maxDepth = 10;
  var iterationCount = 0;

  while (!allItemsPricessed && iterationCount < maxDepth) {
    allItemsPricessed = compileTasks();
    iterationCount++;
  }

  tasks = rawTasks;
  return tasks;
};

var isInvalidDate = function isInvalidDate(date, dateFormat, excludes) {
  if (date.isoWeekday() >= 6 && excludes.indexOf('weekends') >= 0) {
    return true;
  }

  if (excludes.indexOf(date.format('dddd').toLowerCase()) >= 0) {
    return true;
  }

  return excludes.indexOf(date.format(dateFormat.trim())) >= 0;
};

var checkTaskDates = function checkTaskDates(task, dateFormat, excludes) {
  if (!excludes.length || task.manualEndTime) return;
  var startTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(task.startTime, dateFormat, true);
  startTime.add(1, 'd');
  var endTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(task.endTime, dateFormat, true);
  var renderEndTime = fixTaskDates(startTime, endTime, dateFormat, excludes);
  task.endTime = endTime.toDate();
  task.renderEndTime = renderEndTime;
};

var fixTaskDates = function fixTaskDates(startTime, endTime, dateFormat, excludes) {
  var invalid = false;
  var renderEndTime = null;

  while (startTime.date() <= endTime.date()) {
    if (!invalid) {
      renderEndTime = endTime.toDate();
    }

    invalid = isInvalidDate(startTime, dateFormat, excludes);

    if (invalid) {
      endTime.add(1, 'd');
    }

    startTime.add(1, 'd');
  }

  return renderEndTime;
};

var getStartDate = function getStartDate(prevTime, dateFormat, str) {
  str = str.trim(); // Test for after

  var re = /^after\s+([\d\w-]+)/;
  var afterStatement = re.exec(str.trim());

  if (afterStatement !== null) {
    var task = findTaskById(afterStatement[1]);

    if (typeof task === 'undefined') {
      var dt = new Date();
      dt.setHours(0, 0, 0, 0);
      return dt;
    }

    return task.endTime;
  } // Check for actual date set


  var mDate = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(str, dateFormat.trim(), true);

  if (mDate.isValid()) {
    return mDate.toDate();
  } else {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Invalid date:' + str);
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('With date format:' + dateFormat.trim());
  } // Default date - now


  return new Date();
};

var durationToDate = function durationToDate(durationStatement, relativeTime) {
  if (durationStatement !== null) {
    switch (durationStatement[2]) {
      case 's':
        relativeTime.add(durationStatement[1], 'seconds');
        break;

      case 'm':
        relativeTime.add(durationStatement[1], 'minutes');
        break;

      case 'h':
        relativeTime.add(durationStatement[1], 'hours');
        break;

      case 'd':
        relativeTime.add(durationStatement[1], 'days');
        break;

      case 'w':
        relativeTime.add(durationStatement[1], 'weeks');
        break;
    }
  } // Default date - now


  return relativeTime.toDate();
};

var getEndDate = function getEndDate(prevTime, dateFormat, str, inclusive) {
  inclusive = inclusive || false;
  str = str.trim(); // Check for actual date

  var mDate = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(str, dateFormat.trim(), true);

  if (mDate.isValid()) {
    if (inclusive) {
      mDate.add(1, 'd');
    }

    return mDate.toDate();
  }

  return durationToDate(/^([\d]+)([wdhms])/.exec(str.trim()), moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(prevTime));
};

var taskCnt = 0;

var parseId = function parseId(idStr) {
  if (typeof idStr === 'undefined') {
    taskCnt = taskCnt + 1;
    return 'task' + taskCnt;
  }

  return idStr;
}; // id, startDate, endDate
// id, startDate, length
// id, after x, endDate
// id, after x, length
// startDate, endDate
// startDate, length
// after x, endDate
// after x, length
// endDate
// length


var compileData = function compileData(prevTask, dataStr) {
  var ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  var data = ds.split(',');
  var task = {}; // Get tags like active, done, crit and milestone

  getTaskTags(data, task, tags);

  for (var i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  var endTimeData = '';

  switch (data.length) {
    case 1:
      task.id = parseId();
      task.startTime = prevTask.endTime;
      endTimeData = data[0];
      break;

    case 2:
      task.id = parseId();
      task.startTime = getStartDate(undefined, dateFormat, data[0]);
      endTimeData = data[1];
      break;

    case 3:
      task.id = parseId(data[0]);
      task.startTime = getStartDate(undefined, dateFormat, data[1]);
      endTimeData = data[2];
      break;

    default:
  }

  if (endTimeData) {
    task.endTime = getEndDate(task.startTime, dateFormat, endTimeData, inclusiveEndDates);
    task.manualEndTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(endTimeData, 'YYYY-MM-DD', true).isValid();
    checkTaskDates(task, dateFormat, excludes);
  }

  return task;
};

var parseData = function parseData(prevTaskId, dataStr) {
  var ds;

  if (dataStr.substr(0, 1) === ':') {
    ds = dataStr.substr(1, dataStr.length);
  } else {
    ds = dataStr;
  }

  var data = ds.split(',');
  var task = {}; // Get tags like active, done, crit and milestone

  getTaskTags(data, task, tags);

  for (var i = 0; i < data.length; i++) {
    data[i] = data[i].trim();
  }

  switch (data.length) {
    case 1:
      task.id = parseId();
      task.startTime = {
        type: 'prevTaskEnd',
        id: prevTaskId
      };
      task.endTime = {
        data: data[0]
      };
      break;

    case 2:
      task.id = parseId();
      task.startTime = {
        type: 'getStartDate',
        startData: data[0]
      };
      task.endTime = {
        data: data[1]
      };
      break;

    case 3:
      task.id = parseId(data[0]);
      task.startTime = {
        type: 'getStartDate',
        startData: data[1]
      };
      task.endTime = {
        data: data[2]
      };
      break;

    default:
  }

  return task;
};

var lastTask;
var lastTaskID;
var rawTasks = [];
var taskDb = {};
var addTask = function addTask(descr, data) {
  var rawTask = {
    section: currentSection,
    type: currentSection,
    processed: false,
    manualEndTime: false,
    renderEndTime: null,
    raw: {
      data: data
    },
    task: descr,
    classes: []
  };
  var taskInfo = parseData(lastTaskID, data);
  rawTask.raw.startTime = taskInfo.startTime;
  rawTask.raw.endTime = taskInfo.endTime;
  rawTask.id = taskInfo.id;
  rawTask.prevTaskId = lastTaskID;
  rawTask.active = taskInfo.active;
  rawTask.done = taskInfo.done;
  rawTask.crit = taskInfo.crit;
  rawTask.milestone = taskInfo.milestone;
  var pos = rawTasks.push(rawTask);
  lastTaskID = rawTask.id; // Store cross ref

  taskDb[rawTask.id] = pos - 1;
};
var findTaskById = function findTaskById(id) {
  var pos = taskDb[id];
  return rawTasks[pos];
};
var addTaskOrg = function addTaskOrg(descr, data) {
  var newTask = {
    section: currentSection,
    type: currentSection,
    description: descr,
    task: descr,
    classes: []
  };
  var taskInfo = compileData(lastTask, data);
  newTask.startTime = taskInfo.startTime;
  newTask.endTime = taskInfo.endTime;
  newTask.id = taskInfo.id;
  newTask.active = taskInfo.active;
  newTask.done = taskInfo.done;
  newTask.crit = taskInfo.crit;
  newTask.milestone = taskInfo.milestone;
  lastTask = newTask;
  tasks.push(newTask);
};

var compileTasks = function compileTasks() {
  var compileTask = function compileTask(pos) {
    var task = rawTasks[pos];
    var startTime = '';

    switch (rawTasks[pos].raw.startTime.type) {
      case 'prevTaskEnd':
        {
          var prevTask = findTaskById(task.prevTaskId);
          task.startTime = prevTask.endTime;
          break;
        }

      case 'getStartDate':
        startTime = getStartDate(undefined, dateFormat, rawTasks[pos].raw.startTime.startData);

        if (startTime) {
          rawTasks[pos].startTime = startTime;
        }

        break;
    }

    if (rawTasks[pos].startTime) {
      rawTasks[pos].endTime = getEndDate(rawTasks[pos].startTime, dateFormat, rawTasks[pos].raw.endTime.data, inclusiveEndDates);

      if (rawTasks[pos].endTime) {
        rawTasks[pos].processed = true;
        rawTasks[pos].manualEndTime = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()(rawTasks[pos].raw.endTime.data, 'YYYY-MM-DD', true).isValid();
        checkTaskDates(rawTasks[pos], dateFormat, excludes);
      }
    }

    return rawTasks[pos].processed;
  };

  var allProcessed = true;

  for (var i = 0; i < rawTasks.length; i++) {
    compileTask(i);
    allProcessed = allProcessed && rawTasks[i].processed;
  }

  return allProcessed;
};
/**
 * Called by parser when a link is found. Adds the URL to the vertex data.
 * @param ids Comma separated list of ids
 * @param linkStr URL to create a link for
 */


var setLink = function setLink(ids, _linkStr) {
  var linkStr = _linkStr;

  if (config.securityLevel !== 'loose') {
    linkStr = Object(_braintree_sanitize_url__WEBPACK_IMPORTED_MODULE_1__["sanitizeUrl"])(_linkStr);
  }

  ids.split(',').forEach(function (id) {
    var rawTask = findTaskById(id);

    if (typeof rawTask !== 'undefined') {
      pushFun(id, function () {
        window.open(linkStr, '_self');
      });
    }
  });
  setClass(ids, 'clickable');
};
/**
 * Called by parser when a special node is found, e.g. a clickable element.
 * @param ids Comma separated list of ids
 * @param className Class to add
 */

var setClass = function setClass(ids, className) {
  ids.split(',').forEach(function (id) {
    var rawTask = findTaskById(id);

    if (typeof rawTask !== 'undefined') {
      rawTask.classes.push(className);
    }
  });
};

var setClickFun = function setClickFun(id, functionName, functionArgs) {
  if (config.securityLevel !== 'loose') {
    return;
  }

  if (typeof functionName === 'undefined') {
    return;
  }

  var argList = [];

  if (typeof functionArgs === 'string') {
    /* Splits functionArgs by ',', ignoring all ',' in double quoted strings */
    argList = functionArgs.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    for (var i = 0; i < argList.length; i++) {
      var item = argList[i].trim();
      /* Removes all double quotes at the start and end of an argument */

      /* This preserves all starting and ending whitespace inside */

      if (item.charAt(0) === '"' && item.charAt(item.length - 1) === '"') {
        item = item.substr(1, item.length - 2);
      }

      argList[i] = item;
    }
  }

  var rawTask = findTaskById(id);

  if (typeof rawTask !== 'undefined') {
    pushFun(id, function () {
      var _window;

      (_window = window)[functionName].apply(_window, _toConsumableArray(argList));
    });
  }
};
/**
 * The callbackFunction is executed in a click event bound to the task with the specified id or the task's assigned text
 * @param id The task's id
 * @param callbackFunction A function to be executed when clicked on the task or the task's text
 */


var pushFun = function pushFun(id, callbackFunction) {
  funs.push(function () {
    // const elem = d3.select(element).select(`[id="${id}"]`)
    var elem = document.querySelector("[id=\"".concat(id, "\"]"));

    if (elem !== null) {
      elem.addEventListener('click', function () {
        callbackFunction();
      });
    }
  });
  funs.push(function () {
    // const elem = d3.select(element).select(`[id="${id}-text"]`)
    var elem = document.querySelector("[id=\"".concat(id, "-text\"]"));

    if (elem !== null) {
      elem.addEventListener('click', function () {
        callbackFunction();
      });
    }
  });
};
/**
 * Called by parser when a click definition is found. Registers an event handler.
 * @param ids Comma separated list of ids
 * @param functionName Function to be called on click
 * @param functionArgs Function args the function should be called with
 */


var setClickEvent = function setClickEvent(ids, functionName, functionArgs) {
  ids.split(',').forEach(function (id) {
    setClickFun(id, functionName, functionArgs);
  });
  setClass(ids, 'clickable');
};
/**
 * Binds all functions previously added to fun (specified through click) to the element
 * @param element
 */

var bindFunctions = function bindFunctions(element) {
  funs.forEach(function (fun) {
    fun(element);
  });
};
/* harmony default export */ __webpack_exports__["default"] = ({
  clear: clear,
  setDateFormat: setDateFormat,
  getDateFormat: getDateFormat,
  enableInclusiveEndDates: enableInclusiveEndDates,
  endDatesAreInclusive: endDatesAreInclusive,
  setAxisFormat: setAxisFormat,
  getAxisFormat: getAxisFormat,
  setTitle: setTitle,
  getTitle: getTitle,
  addSection: addSection,
  getSections: getSections,
  getTasks: getTasks,
  addTask: addTask,
  findTaskById: findTaskById,
  addTaskOrg: addTaskOrg,
  setExcludes: setExcludes,
  getExcludes: getExcludes,
  setClickEvent: setClickEvent,
  setLink: setLink,
  bindFunctions: bindFunctions,
  durationToDate: durationToDate
});

function getTaskTags(data, task, tags) {
  var matchFound = true;

  while (matchFound) {
    matchFound = false;
    tags.forEach(function (t) {
      var pattern = '^\\s*' + t + '\\s*$';
      var regex = new RegExp(pattern);

      if (data[0].match(regex)) {
        task[t] = true;
        data.shift(1);
        matchFound = true;
      }
    });
  }
}

/***/ }),

/***/ "./src/diagrams/gantt/ganttRenderer.js":
/*!*********************************************!*\
  !*** ./src/diagrams/gantt/ganttRenderer.js ***!
  \*********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _parser_gantt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parser/gantt */ "./src/diagrams/gantt/parser/gantt.jison");
/* harmony import */ var _parser_gantt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_parser_gantt__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _ganttDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ganttDb */ "./src/diagrams/gantt/ganttDb.js");



_parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy = _ganttDb__WEBPACK_IMPORTED_MODULE_2__["default"];
var conf = {
  titleTopMargin: 25,
  barHeight: 20,
  barGap: 4,
  topPadding: 50,
  rightPadding: 75,
  leftPadding: 75,
  gridLineStartPadding: 35,
  fontSize: 11,
  fontFamily: '"Open-Sans", "sans-serif"'
};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
var w;
var draw = function draw(text, id) {
  _parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.clear();
  _parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].parse(text);
  var elem = document.getElementById(id);
  w = elem.parentElement.offsetWidth;

  if (typeof w === 'undefined') {
    w = 1200;
  }

  if (typeof conf.useWidth !== 'undefined') {
    w = conf.useWidth;
  }

  var taskArray = _parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getTasks(); // Set height based on number of tasks

  var h = taskArray.length * (conf.barHeight + conf.barGap) + 2 * conf.topPadding;
  elem.setAttribute('height', '100%'); // Set viewBox

  elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  var svg = d3__WEBPACK_IMPORTED_MODULE_0__["select"]("[id=\"".concat(id, "\"]")); // Set timescale

  var timeScale = d3__WEBPACK_IMPORTED_MODULE_0__["scaleTime"]().domain([d3__WEBPACK_IMPORTED_MODULE_0__["min"](taskArray, function (d) {
    return d.startTime;
  }), d3__WEBPACK_IMPORTED_MODULE_0__["max"](taskArray, function (d) {
    return d.endTime;
  })]).rangeRound([0, w - conf.leftPadding - conf.rightPadding]);
  var categories = [];

  for (var i = 0; i < taskArray.length; i++) {
    categories.push(taskArray[i].type);
  }

  var catsUnfiltered = categories; // for vert labels

  categories = checkUnique(categories);
  makeGant(taskArray, w, h);

  if (typeof conf.useWidth !== 'undefined') {
    elem.setAttribute('width', w);
  }

  svg.append('text').text(_parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getTitle()).attr('x', w / 2).attr('y', conf.titleTopMargin).attr('class', 'titleText');

  function makeGant(tasks, pageWidth, pageHeight) {
    var barHeight = conf.barHeight;
    var gap = barHeight + conf.barGap;
    var topPadding = conf.topPadding;
    var leftPadding = conf.leftPadding;
    var colorScale = d3__WEBPACK_IMPORTED_MODULE_0__["scaleLinear"]().domain([0, categories.length]).range(['#00B9FA', '#F95002']).interpolate(d3__WEBPACK_IMPORTED_MODULE_0__["interpolateHcl"]);
    makeGrid(leftPadding, topPadding, pageWidth, pageHeight);
    drawRects(tasks, gap, topPadding, leftPadding, barHeight, colorScale, pageWidth, pageHeight);
    vertLabels(gap, topPadding, leftPadding, barHeight, colorScale);
    drawToday(leftPadding, topPadding, pageWidth, pageHeight);
  }

  function drawRects(theArray, theGap, theTopPad, theSidePad, theBarHeight, theColorScale, w) {
    // Draw background rects covering the entire width of the graph, these form the section rows.
    svg.append('g').selectAll('rect').data(theArray).enter().append('rect').attr('x', 0).attr('y', function (d, i) {
      return i * theGap + theTopPad - 2;
    }).attr('width', function () {
      return w - conf.rightPadding / 2;
    }).attr('height', theGap).attr('class', function (d) {
      for (var _i = 0; _i < categories.length; _i++) {
        if (d.type === categories[_i]) {
          return 'section section' + _i % conf.numberSectionStyles;
        }
      }

      return 'section section0';
    }); // Draw the rects representing the tasks

    var rectangles = svg.append('g').selectAll('rect').data(theArray).enter();
    rectangles.append('rect').attr('id', function (d) {
      return d.id;
    }).attr('rx', 3).attr('ry', 3).attr('x', function (d) {
      if (d.milestone) {
        return timeScale(d.startTime) + theSidePad + 0.5 * (timeScale(d.endTime) - timeScale(d.startTime)) - 0.5 * theBarHeight;
      }

      return timeScale(d.startTime) + theSidePad;
    }).attr('y', function (d, i) {
      return i * theGap + theTopPad;
    }).attr('width', function (d) {
      if (d.milestone) {
        return theBarHeight;
      }

      return timeScale(d.renderEndTime || d.endTime) - timeScale(d.startTime);
    }).attr('height', theBarHeight).attr('transform-origin', function (d, i) {
      return (timeScale(d.startTime) + theSidePad + 0.5 * (timeScale(d.endTime) - timeScale(d.startTime))).toString() + 'px ' + (i * theGap + theTopPad + 0.5 * theBarHeight).toString() + 'px';
    }).attr('class', function (d) {
      var res = 'task';
      var classStr = '';

      if (d.classes.length > 0) {
        classStr = d.classes.join(' ');
      }

      var secNum = 0;

      for (var _i2 = 0; _i2 < categories.length; _i2++) {
        if (d.type === categories[_i2]) {
          secNum = _i2 % conf.numberSectionStyles;
        }
      }

      var taskClass = '';

      if (d.active) {
        if (d.crit) {
          taskClass += ' activeCrit';
        } else {
          taskClass = ' active';
        }
      } else if (d.done) {
        if (d.crit) {
          taskClass = ' doneCrit';
        } else {
          taskClass = ' done';
        }
      } else {
        if (d.crit) {
          taskClass += ' crit';
        }
      }

      if (taskClass.length === 0) {
        taskClass = ' task';
      }

      if (d.milestone) {
        taskClass = ' milestone ' + taskClass;
      }

      taskClass += secNum;
      taskClass += ' ' + classStr;
      return res + taskClass;
    }); // Append task labels

    rectangles.append('text').attr('id', function (d) {
      return d.id + '-text';
    }).text(function (d) {
      return d.task;
    }).attr('font-size', conf.fontSize).attr('x', function (d) {
      var startX = timeScale(d.startTime);
      var endX = timeScale(d.renderEndTime || d.endTime);

      if (d.milestone) {
        startX += 0.5 * (timeScale(d.endTime) - timeScale(d.startTime)) - 0.5 * theBarHeight;
      }

      if (d.milestone) {
        endX = startX + theBarHeight;
      }

      var textWidth = this.getBBox().width; // Check id text width > width of rectangle

      if (textWidth > endX - startX) {
        if (endX + textWidth + 1.5 * conf.leftPadding > w) {
          return startX + theSidePad - 5;
        } else {
          return endX + theSidePad + 5;
        }
      } else {
        return (endX - startX) / 2 + startX + theSidePad;
      }
    }).attr('y', function (d, i) {
      return i * theGap + conf.barHeight / 2 + (conf.fontSize / 2 - 2) + theTopPad;
    }).attr('text-height', theBarHeight).attr('class', function (d) {
      var startX = timeScale(d.startTime);
      var endX = timeScale(d.endTime);

      if (d.milestone) {
        endX = startX + theBarHeight;
      }

      var textWidth = this.getBBox().width;
      var classStr = '';

      if (d.classes.length > 0) {
        classStr = d.classes.join(' ');
      }

      var secNum = 0;

      for (var _i3 = 0; _i3 < categories.length; _i3++) {
        if (d.type === categories[_i3]) {
          secNum = _i3 % conf.numberSectionStyles;
        }
      }

      var taskType = '';

      if (d.active) {
        if (d.crit) {
          taskType = 'activeCritText' + secNum;
        } else {
          taskType = 'activeText' + secNum;
        }
      }

      if (d.done) {
        if (d.crit) {
          taskType = taskType + ' doneCritText' + secNum;
        } else {
          taskType = taskType + ' doneText' + secNum;
        }
      } else {
        if (d.crit) {
          taskType = taskType + ' critText' + secNum;
        }
      }

      if (d.milestone) {
        taskType += ' milestoneText';
      } // Check id text width > width of rectangle


      if (textWidth > endX - startX) {
        if (endX + textWidth + 1.5 * conf.leftPadding > w) {
          return classStr + ' taskTextOutsideLeft taskTextOutside' + secNum + ' ' + taskType;
        } else {
          return classStr + ' taskTextOutsideRight taskTextOutside' + secNum + ' ' + taskType + ' width-' + textWidth;
        }
      } else {
        return classStr + ' taskText taskText' + secNum + ' ' + taskType + ' width-' + textWidth;
      }
    });
  }

  function makeGrid(theSidePad, theTopPad, w, h) {
    var xAxis = d3__WEBPACK_IMPORTED_MODULE_0__["axisBottom"](timeScale).tickSize(-h + theTopPad + conf.gridLineStartPadding).tickFormat(d3__WEBPACK_IMPORTED_MODULE_0__["timeFormat"](_parser_gantt__WEBPACK_IMPORTED_MODULE_1__["parser"].yy.getAxisFormat() || conf.axisFormat || '%Y-%m-%d'));
    svg.append('g').attr('class', 'grid').attr('transform', 'translate(' + theSidePad + ', ' + (h - 50) + ')').call(xAxis).selectAll('text').style('text-anchor', 'middle').attr('fill', '#000').attr('stroke', 'none').attr('font-size', 10).attr('dy', '1em');
  }

  function vertLabels(theGap, theTopPad) {
    var numOccurances = [];
    var prevGap = 0;

    for (var _i4 = 0; _i4 < categories.length; _i4++) {
      numOccurances[_i4] = [categories[_i4], getCount(categories[_i4], catsUnfiltered)];
    }

    svg.append('g') // without doing this, impossible to put grid lines behind text
    .selectAll('text').data(numOccurances).enter().append('text').text(function (d) {
      return d[0];
    }).attr('x', 10).attr('y', function (d, i) {
      if (i > 0) {
        for (var j = 0; j < i; j++) {
          prevGap += numOccurances[i - 1][1];
          return d[1] * theGap / 2 + prevGap * theGap + theTopPad;
        }
      } else {
        return d[1] * theGap / 2 + theTopPad;
      }
    }).attr('class', function (d) {
      for (var _i5 = 0; _i5 < categories.length; _i5++) {
        if (d[0] === categories[_i5]) {
          return 'sectionTitle sectionTitle' + _i5 % conf.numberSectionStyles;
        }
      }

      return 'sectionTitle';
    });
  }

  function drawToday(theSidePad, theTopPad, w, h) {
    var todayG = svg.append('g').attr('class', 'today');
    var today = new Date();
    todayG.append('line').attr('x1', timeScale(today) + theSidePad).attr('x2', timeScale(today) + theSidePad).attr('y1', conf.titleTopMargin).attr('y2', h - conf.titleTopMargin).attr('class', 'today');
  } // from this stackexchange question: http://stackoverflow.com/questions/1890203/unique-for-arrays-in-javascript


  function checkUnique(arr) {
    var hash = {};
    var result = [];

    for (var _i6 = 0, l = arr.length; _i6 < l; ++_i6) {
      if (!hash.hasOwnProperty(arr[_i6])) {
        // eslint-disable-line
        // it works with objects! in FF, at least
        hash[arr[_i6]] = true;
        result.push(arr[_i6]);
      }
    }

    return result;
  } // from this stackexchange question: http://stackoverflow.com/questions/14227981/count-how-many-strings-in-an-array-have-duplicates-in-the-same-array


  function getCounts(arr) {
    var i = arr.length; // const to loop over

    var obj = {}; // obj to store results

    while (i) {
      obj[arr[--i]] = (obj[arr[i]] || 0) + 1; // count occurrences
    }

    return obj;
  } // get specific from everything


  function getCount(word, arr) {
    return getCounts(arr)[word] || 0;
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/gantt/parser/gantt.jison":
/*!***********************************************!*\
  !*** ./src/diagrams/gantt/parser/gantt.jison ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,8,10,11,12,13,14,15,16,18,20],$V1=[1,9],$V2=[1,10],$V3=[1,11],$V4=[1,12],$V5=[1,13],$V6=[1,14],$V7=[1,16],$V8=[1,17];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"gantt":4,"document":5,"EOF":6,"line":7,"SPACE":8,"statement":9,"NL":10,"dateFormat":11,"inclusiveEndDates":12,"axisFormat":13,"excludes":14,"title":15,"section":16,"clickStatement":17,"taskTxt":18,"taskData":19,"click":20,"callbackname":21,"callbackargs":22,"href":23,"clickStatementDebug":24,"$accept":0,"$end":1},
terminals_: {2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",11:"dateFormat",12:"inclusiveEndDates",13:"axisFormat",14:"excludes",15:"title",16:"section",18:"taskTxt",19:"taskData",20:"click",21:"callbackname",22:"callbackargs",23:"href"},
productions_: [0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[17,2],[17,3],[17,3],[17,4],[17,3],[17,4],[17,2],[24,2],[24,3],[24,3],[24,4],[24,3],[24,4],[24,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2:
 this.$ = [] 
break;
case 3:
$$[$0-1].push($$[$0]);this.$ = $$[$0-1]
break;
case 4: case 5:
 this.$ = $$[$0] 
break;
case 6: case 7:
 this.$=[];
break;
case 8:
yy.setDateFormat($$[$0].substr(11));this.$=$$[$0].substr(11);
break;
case 9:
yy.enableInclusiveEndDates();this.$=$$[$0].substr(18);
break;
case 10:
yy.setAxisFormat($$[$0].substr(11));this.$=$$[$0].substr(11);
break;
case 11:
yy.setExcludes($$[$0].substr(9));this.$=$$[$0].substr(9);
break;
case 12:
yy.setTitle($$[$0].substr(6));this.$=$$[$0].substr(6);
break;
case 13:
yy.addSection($$[$0].substr(8));this.$=$$[$0].substr(8);
break;
case 15:
yy.addTask($$[$0-1],$$[$0]);this.$='task';
break;
case 16:
this.$ = $$[$0-1];yy.setClickEvent($$[$0-1], $$[$0], null);
break;
case 17:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-2], $$[$0-1], $$[$0]);
break;
case 18:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-2], $$[$0-1], null);yy.setLink($$[$0-2],$$[$0]);
break;
case 19:
this.$ = $$[$0-3];yy.setClickEvent($$[$0-3], $$[$0-2], $$[$0-1]);yy.setLink($$[$0-3],$$[$0]);
break;
case 20:
this.$ = $$[$0-2];yy.setClickEvent($$[$0-2], $$[$0], null);yy.setLink($$[$0-2],$$[$0-1]);
break;
case 21:
this.$ = $$[$0-3];yy.setClickEvent($$[$0-3], $$[$0-1], $$[$0]);yy.setLink($$[$0-3],$$[$0-2]);
break;
case 22:
this.$ = $$[$0-1];yy.setLink($$[$0-1], $$[$0]);
break;
case 23: case 29:
this.$=$$[$0-1] + ' ' + $$[$0];
break;
case 24: case 25: case 27:
this.$=$$[$0-2] + ' ' + $$[$0-1] + ' ' + $$[$0];
break;
case 26: case 28:
this.$=$$[$0-3] + ' ' + $$[$0-2] + ' ' + $$[$0-1] + ' ' + $$[$0];
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:$V1,12:$V2,13:$V3,14:$V4,15:$V5,16:$V6,17:15,18:$V7,20:$V8},o($V0,[2,7],{1:[2,1]}),o($V0,[2,3]),{9:18,11:$V1,12:$V2,13:$V3,14:$V4,15:$V5,16:$V6,17:15,18:$V7,20:$V8},o($V0,[2,5]),o($V0,[2,6]),o($V0,[2,8]),o($V0,[2,9]),o($V0,[2,10]),o($V0,[2,11]),o($V0,[2,12]),o($V0,[2,13]),o($V0,[2,14]),{19:[1,19]},{21:[1,20],23:[1,21]},o($V0,[2,4]),o($V0,[2,15]),o($V0,[2,16],{22:[1,22],23:[1,23]}),o($V0,[2,22],{21:[1,24]}),o($V0,[2,17],{23:[1,25]}),o($V0,[2,18]),o($V0,[2,20],{22:[1,26]}),o($V0,[2,19]),o($V0,[2,21])],
defaultActions: {},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 10;
break;
case 1:/* skip whitespace */
break;
case 2:/* skip comments */
break;
case 3:/* skip comments */
break;
case 4:this.begin("href");
break;
case 5:this.popState();
break;
case 6:return 23;
break;
case 7:this.begin("callbackname");
break;
case 8:this.popState();
break;
case 9:this.popState(); this.begin("callbackargs");
break;
case 10:return 21;
break;
case 11:this.popState();
break;
case 12:return 22;
break;
case 13:this.begin("click");
break;
case 14:this.popState();
break;
case 15:return 20;
break;
case 16:return 4;
break;
case 17:return 11;
break;
case 18:return 12;
break;
case 19:return 13;
break;
case 20:return 14;
break;
case 21:return 'date';
break;
case 22:return 15;
break;
case 23:return 16;
break;
case 24:return 18;
break;
case 25:return 19;
break;
case 26:return ':';
break;
case 27:return 6;
break;
case 28:return 'INVALID';
break;
}
},
rules: [/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"callbackargs":{"rules":[11,12],"inclusive":false},"callbackname":{"rules":[8,9,10],"inclusive":false},"href":{"rules":[5,6],"inclusive":false},"click":{"rules":[14,15],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,7,13,16,17,18,19,20,21,22,23,24,25,26,27,28],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/git/gitGraphAst.js":
/*!*****************************************!*\
  !*** ./src/diagrams/git/gitGraphAst.js ***!
  \*****************************************/
/*! exports provided: setDirection, setOptions, getOptions, commit, branch, merge, checkout, reset, prettyPrint, clear, getBranchesAsObjArray, getBranches, getCommits, getCommitsArray, getCurrentBranch, getDirection, getHead, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDirection", function() { return setDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setOptions", function() { return setOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getOptions", function() { return getOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "commit", function() { return commit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "branch", function() { return branch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "merge", function() { return merge; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "checkout", function() { return checkout; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reset", function() { return reset; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "prettyPrint", function() { return prettyPrint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getBranchesAsObjArray", function() { return getBranchesAsObjArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getBranches", function() { return getBranches; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCommits", function() { return getCommits; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCommitsArray", function() { return getCommitsArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getCurrentBranch", function() { return getCurrentBranch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getDirection", function() { return getDirection; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getHead", function() { return getHead; });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var crypto_random_string__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! crypto-random-string */ "crypto-random-string");
/* harmony import */ var crypto_random_string__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(crypto_random_string__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");



var commits = {};
var head = null;
var branches = {
  master: head
};
var curBranch = 'master';
var direction = 'LR';
var seq = 0;

function getId() {
  return crypto_random_string__WEBPACK_IMPORTED_MODULE_1___default()({
    length: 7,
    characters: '0123456789abcdef'
  });
}

function isfastforwardable(currentCommit, otherCommit) {
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Entering isfastforwardable:', currentCommit.id, otherCommit.id);

  while (currentCommit.seq <= otherCommit.seq && currentCommit !== otherCommit) {
    // only if other branch has more commits
    if (otherCommit.parent == null) break;

    if (Array.isArray(otherCommit.parent)) {
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('In merge commit:', otherCommit.parent);
      return isfastforwardable(currentCommit, commits[otherCommit.parent[0]]) || isfastforwardable(currentCommit, commits[otherCommit.parent[1]]);
    } else {
      otherCommit = commits[otherCommit.parent];
    }
  }

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug(currentCommit.id, otherCommit.id);
  return currentCommit.id === otherCommit.id;
}

function isReachableFrom(currentCommit, otherCommit) {
  var currentSeq = currentCommit.seq;
  var otherSeq = otherCommit.seq;
  if (currentSeq > otherSeq) return isfastforwardable(otherCommit, currentCommit);
  return false;
}

var setDirection = function setDirection(dir) {
  direction = dir;
};
var options = {};
var setOptions = function setOptions(rawOptString) {
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('options str', rawOptString);
  rawOptString = rawOptString && rawOptString.trim();
  rawOptString = rawOptString || '{}';

  try {
    options = JSON.parse(rawOptString);
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].error('error while parsing gitGraph options', e.message);
  }
};
var getOptions = function getOptions() {
  return options;
};
var commit = function commit(msg) {
  var commit = {
    id: getId(),
    message: msg,
    seq: seq++,
    parent: head == null ? null : head.id
  };
  head = commit;
  commits[commit.id] = commit;
  branches[curBranch] = commit.id;
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('in pushCommit ' + commit.id);
};
var branch = function branch(name) {
  branches[name] = head != null ? head.id : null;
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('in createBranch');
};
var merge = function merge(otherBranch) {
  var currentCommit = commits[branches[curBranch]];
  var otherCommit = commits[branches[otherBranch]];

  if (isReachableFrom(currentCommit, otherCommit)) {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Already merged');
    return;
  }

  if (isfastforwardable(currentCommit, otherCommit)) {
    branches[curBranch] = branches[otherBranch];
    head = commits[branches[curBranch]];
  } else {
    // create merge commit
    var _commit = {
      id: getId(),
      message: 'merged branch ' + otherBranch + ' into ' + curBranch,
      seq: seq++,
      parent: [head == null ? null : head.id, branches[otherBranch]]
    };
    head = _commit;
    commits[_commit.id] = _commit;
    branches[curBranch] = _commit.id;
  }

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug(branches);
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('in mergeBranch');
};
var checkout = function checkout(branch) {
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('in checkout');
  curBranch = branch;
  var id = branches[curBranch];
  head = commits[id];
};
var reset = function reset(commitRef) {
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('in reset', commitRef);
  var ref = commitRef.split(':')[0];
  var parentCount = parseInt(commitRef.split(':')[1]);
  var commit = ref === 'HEAD' ? head : commits[branches[ref]];
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug(commit, parentCount);

  while (parentCount > 0) {
    commit = commits[commit.parent];
    parentCount--;

    if (!commit) {
      var err = 'Critical error - unique parent commit not found during reset';
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].error(err);
      throw err;
    }
  }

  head = commit;
  branches[curBranch] = commit.id;
};

function upsert(arr, key, newval) {
  var index = arr.indexOf(key);

  if (index === -1) {
    arr.push(newval);
  } else {
    arr.splice(index, 1, newval);
  }
}

function prettyPrintCommitHistory(commitArr) {
  var commit = lodash__WEBPACK_IMPORTED_MODULE_0___default.a.maxBy(commitArr, 'seq');

  var line = '';
  commitArr.forEach(function (c) {
    if (c === commit) {
      line += '\t*';
    } else {
      line += '\t|';
    }
  });
  var label = [line, commit.id, commit.seq];

  for (var _branch in branches) {
    if (branches[_branch] === commit.id) label.push(_branch);
  }

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug(label.join(' '));

  if (Array.isArray(commit.parent)) {
    var newCommit = commits[commit.parent[0]];
    upsert(commitArr, commit, newCommit);
    commitArr.push(commits[commit.parent[1]]);
  } else if (commit.parent == null) {
    return;
  } else {
    var nextCommit = commits[commit.parent];
    upsert(commitArr, commit, nextCommit);
  }

  commitArr = lodash__WEBPACK_IMPORTED_MODULE_0___default.a.uniqBy(commitArr, 'id');
  prettyPrintCommitHistory(commitArr);
}

var prettyPrint = function prettyPrint() {
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug(commits);
  var node = getCommitsArray()[0];
  prettyPrintCommitHistory([node]);
};
var clear = function clear() {
  commits = {};
  head = null;
  branches = {
    master: head
  };
  curBranch = 'master';
  seq = 0;
};
var getBranchesAsObjArray = function getBranchesAsObjArray() {
  var branchArr = [];

  for (var _branch2 in branches) {
    branchArr.push({
      name: _branch2,
      commit: commits[branches[_branch2]]
    });
  }

  return branchArr;
};
var getBranches = function getBranches() {
  return branches;
};
var getCommits = function getCommits() {
  return commits;
};
var getCommitsArray = function getCommitsArray() {
  var commitArr = Object.keys(commits).map(function (key) {
    return commits[key];
  });
  commitArr.forEach(function (o) {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug(o.id);
  });
  return lodash__WEBPACK_IMPORTED_MODULE_0___default.a.orderBy(commitArr, ['seq'], ['desc']);
};
var getCurrentBranch = function getCurrentBranch() {
  return curBranch;
};
var getDirection = function getDirection() {
  return direction;
};
var getHead = function getHead() {
  return head;
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setDirection: setDirection,
  setOptions: setOptions,
  getOptions: getOptions,
  commit: commit,
  branch: branch,
  merge: merge,
  checkout: checkout,
  reset: reset,
  prettyPrint: prettyPrint,
  clear: clear,
  getBranchesAsObjArray: getBranchesAsObjArray,
  getBranches: getBranches,
  getCommits: getCommits,
  getCommitsArray: getCommitsArray,
  getCurrentBranch: getCurrentBranch,
  getDirection: getDirection,
  getHead: getHead
});

/***/ }),

/***/ "./src/diagrams/git/gitGraphRenderer.js":
/*!**********************************************!*\
  !*** ./src/diagrams/git/gitGraphRenderer.js ***!
  \**********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "lodash");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _gitGraphAst__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./gitGraphAst */ "./src/diagrams/git/gitGraphAst.js");
/* harmony import */ var _parser_gitGraph__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/gitGraph */ "./src/diagrams/git/parser/gitGraph.jison");
/* harmony import */ var _parser_gitGraph__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_gitGraph__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");






var allCommitsDict = {};
var branchNum;
var config = {
  nodeSpacing: 150,
  nodeFillColor: 'yellow',
  nodeStrokeWidth: 2,
  nodeStrokeColor: 'grey',
  lineStrokeWidth: 4,
  branchOffset: 50,
  lineColor: 'grey',
  leftMargin: 50,
  branchColors: ['#442f74', '#983351', '#609732', '#AA9A39'],
  nodeRadius: 10,
  nodeLabel: {
    width: 75,
    height: 100,
    x: -25,
    y: 0
  }
};
var apiConfig = {};
var setConf = function setConf(c) {
  apiConfig = c;
};

function svgCreateDefs(svg) {
  svg.append('defs').append('g').attr('id', 'def-commit').append('circle').attr('r', config.nodeRadius).attr('cx', 0).attr('cy', 0);
  svg.select('#def-commit').append('foreignObject').attr('width', config.nodeLabel.width).attr('height', config.nodeLabel.height).attr('x', config.nodeLabel.x).attr('y', config.nodeLabel.y).attr('class', 'node-label').attr('requiredFeatures', 'http://www.w3.org/TR/SVG11/feature#Extensibility').append('p').html('');
}

function svgDrawLine(svg, points, colorIdx, interpolate) {
  var curve = Object(_utils__WEBPACK_IMPORTED_MODULE_5__["interpolateToCurve"])(interpolate, d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"]);
  var color = config.branchColors[colorIdx % config.branchColors.length];
  var lineGen = d3__WEBPACK_IMPORTED_MODULE_0__["line"]().x(function (d) {
    return Math.round(d.x);
  }).y(function (d) {
    return Math.round(d.y);
  }).curve(curve);
  svg.append('svg:path').attr('d', lineGen(points)).style('stroke', color).style('stroke-width', config.lineStrokeWidth).style('fill', 'none');
} // Pass in the element and its pre-transform coords


function getElementCoords(element, coords) {
  coords = coords || element.node().getBBox();
  var ctm = element.node().getCTM();
  var xn = ctm.e + coords.x * ctm.a;
  var yn = ctm.f + coords.y * ctm.d;
  return {
    left: xn,
    top: yn,
    width: coords.width,
    height: coords.height
  };
}

function svgDrawLineForCommits(svg, fromId, toId, direction, color) {
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('svgDrawLineForCommits: ', fromId, toId);
  var fromBbox = getElementCoords(svg.select('#node-' + fromId + ' circle'));
  var toBbox = getElementCoords(svg.select('#node-' + toId + ' circle'));

  switch (direction) {
    case 'LR':
      // (toBbox)
      //  +--------
      //          + (fromBbox)
      if (fromBbox.left - toBbox.left > config.nodeSpacing) {
        var lineStart = {
          x: fromBbox.left - config.nodeSpacing,
          y: toBbox.top + toBbox.height / 2
        };
        var lineEnd = {
          x: toBbox.left + toBbox.width,
          y: toBbox.top + toBbox.height / 2
        };
        svgDrawLine(svg, [lineStart, lineEnd], color, 'linear');
        svgDrawLine(svg, [{
          x: fromBbox.left,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: lineStart.y
        }, lineStart], color);
      } else {
        svgDrawLine(svg, [{
          x: fromBbox.left,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: fromBbox.top + fromBbox.height / 2
        }, {
          x: fromBbox.left - config.nodeSpacing / 2,
          y: toBbox.top + toBbox.height / 2
        }, {
          x: toBbox.left + toBbox.width,
          y: toBbox.top + toBbox.height / 2
        }], color);
      }

      break;

    case 'BT':
      //      +           (fromBbox)
      //      |
      //      |
      //              +   (toBbox)
      if (toBbox.top - fromBbox.top > config.nodeSpacing) {
        var _lineStart = {
          x: toBbox.left + toBbox.width / 2,
          y: fromBbox.top + fromBbox.height + config.nodeSpacing
        };
        var _lineEnd = {
          x: toBbox.left + toBbox.width / 2,
          y: toBbox.top
        };
        svgDrawLine(svg, [_lineStart, _lineEnd], color, 'linear');
        svgDrawLine(svg, [{
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + fromBbox.height
        }, {
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + fromBbox.height + config.nodeSpacing / 2
        }, {
          x: toBbox.left + toBbox.width / 2,
          y: _lineStart.y - config.nodeSpacing / 2
        }, _lineStart], color);
      } else {
        svgDrawLine(svg, [{
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + fromBbox.height
        }, {
          x: fromBbox.left + fromBbox.width / 2,
          y: fromBbox.top + config.nodeSpacing / 2
        }, {
          x: toBbox.left + toBbox.width / 2,
          y: toBbox.top - config.nodeSpacing / 2
        }, {
          x: toBbox.left + toBbox.width / 2,
          y: toBbox.top
        }], color);
      }

      break;
  }
}

function cloneNode(svg, selector) {
  return svg.select(selector).node().cloneNode(true);
}

function renderCommitHistory(svg, commitid, branches, direction) {
  var commit;
  var numCommits = Object.keys(allCommitsDict).length;

  if (typeof commitid === 'string') {
    do {
      commit = allCommitsDict[commitid];
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('in renderCommitHistory', commit.id, commit.seq);

      if (svg.select('#node-' + commitid).size() > 0) {
        return;
      }

      svg.append(function () {
        return cloneNode(svg, '#def-commit');
      }).attr('class', 'commit').attr('id', function () {
        return 'node-' + commit.id;
      }).attr('transform', function () {
        switch (direction) {
          case 'LR':
            return 'translate(' + (commit.seq * config.nodeSpacing + config.leftMargin) + ', ' + branchNum * config.branchOffset + ')';

          case 'BT':
            return 'translate(' + (branchNum * config.branchOffset + config.leftMargin) + ', ' + (numCommits - commit.seq) * config.nodeSpacing + ')';
        }
      }).attr('fill', config.nodeFillColor).attr('stroke', config.nodeStrokeColor).attr('stroke-width', config.nodeStrokeWidth);
      var branch = void 0;

      for (var branchName in branches) {
        if (branches[branchName].commit === commit) {
          branch = branches[branchName];
          break;
        }
      }

      if (branch) {
        _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('found branch ', branch.name);
        svg.select('#node-' + commit.id + ' p').append('xhtml:span').attr('class', 'branch-label').text(branch.name + ', ');
      }

      svg.select('#node-' + commit.id + ' p').append('xhtml:span').attr('class', 'commit-id').text(commit.id);

      if (commit.message !== '' && direction === 'BT') {
        svg.select('#node-' + commit.id + ' p').append('xhtml:span').attr('class', 'commit-msg').text(', ' + commit.message);
      }

      commitid = commit.parent;
    } while (commitid && allCommitsDict[commitid]);
  }

  if (Array.isArray(commitid)) {
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('found merge commmit', commitid);
    renderCommitHistory(svg, commitid[0], branches, direction);
    branchNum++;
    renderCommitHistory(svg, commitid[1], branches, direction);
    branchNum--;
  }
}

function renderLines(svg, commit, direction, branchColor) {
  branchColor = branchColor || 0;

  while (commit.seq > 0 && !commit.lineDrawn) {
    if (typeof commit.parent === 'string') {
      svgDrawLineForCommits(svg, commit.id, commit.parent, direction, branchColor);
      commit.lineDrawn = true;
      commit = allCommitsDict[commit.parent];
    } else if (Array.isArray(commit.parent)) {
      svgDrawLineForCommits(svg, commit.id, commit.parent[0], direction, branchColor);
      svgDrawLineForCommits(svg, commit.id, commit.parent[1], direction, branchColor + 1);
      renderLines(svg, allCommitsDict[commit.parent[1]], direction, branchColor + 1);
      commit.lineDrawn = true;
      commit = allCommitsDict[commit.parent[0]];
    }
  }
}

var draw = function draw(txt, id, ver) {
  try {
    var parser = _parser_gitGraph__WEBPACK_IMPORTED_MODULE_3___default.a.parser;
    parser.yy = _gitGraphAst__WEBPACK_IMPORTED_MODULE_2__["default"];
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('in gitgraph renderer', txt + '\n', 'id:', id, ver); // Parse the graph definition

    parser.parse(txt + '\n');
    config = lodash__WEBPACK_IMPORTED_MODULE_1___default.a.assign(config, apiConfig, _gitGraphAst__WEBPACK_IMPORTED_MODULE_2__["default"].getOptions());
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('effective options', config);
    var direction = _gitGraphAst__WEBPACK_IMPORTED_MODULE_2__["default"].getDirection();
    allCommitsDict = _gitGraphAst__WEBPACK_IMPORTED_MODULE_2__["default"].getCommits();
    var branches = _gitGraphAst__WEBPACK_IMPORTED_MODULE_2__["default"].getBranchesAsObjArray();

    if (direction === 'BT') {
      config.nodeLabel.x = branches.length * config.branchOffset;
      config.nodeLabel.width = '100%';
      config.nodeLabel.y = -1 * 2 * config.nodeRadius;
    }

    var svg = d3__WEBPACK_IMPORTED_MODULE_0__["select"]("[id=\"".concat(id, "\"]"));
    svgCreateDefs(svg);
    branchNum = 1;

    for (var branch in branches) {
      var v = branches[branch];
      renderCommitHistory(svg, v.commit.id, branches, direction);
      renderLines(svg, v.commit, direction);
      branchNum++;
    }

    svg.attr('height', function () {
      if (direction === 'BT') return Object.keys(allCommitsDict).length * config.nodeSpacing;
      return (branches.length + 1) * config.branchOffset;
    });
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].error('Error while rendering gitgraph');
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/git/parser/gitGraph.jison":
/*!************************************************!*\
  !*** ./src/diagrams/git/parser/gitGraph.jison ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[2,3],$V1=[1,7],$V2=[7,12,15,17,19,20,21],$V3=[7,11,12,15,17,19,20,21],$V4=[2,20],$V5=[1,32];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"GG":4,":":5,"document":6,"EOF":7,"DIR":8,"options":9,"body":10,"OPT":11,"NL":12,"line":13,"statement":14,"COMMIT":15,"commit_arg":16,"BRANCH":17,"ID":18,"CHECKOUT":19,"MERGE":20,"RESET":21,"reset_arg":22,"STR":23,"HEAD":24,"reset_parents":25,"CARET":26,"$accept":0,"$end":1},
terminals_: {2:"error",4:"GG",5:":",7:"EOF",8:"DIR",11:"OPT",12:"NL",15:"COMMIT",17:"BRANCH",18:"ID",19:"CHECKOUT",20:"MERGE",21:"RESET",23:"STR",24:"HEAD",26:"CARET"},
productions_: [0,[3,4],[3,5],[6,0],[6,2],[9,2],[9,1],[10,0],[10,2],[13,2],[13,1],[14,2],[14,2],[14,2],[14,2],[14,2],[16,0],[16,1],[22,2],[22,2],[25,0],[25,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return $$[$0-1]; 
break;
case 2:
yy.setDirection($$[$0-3]); return $$[$0-1];
break;
case 4:
 yy.setOptions($$[$0-1]); this.$ = $$[$0]
break;
case 5:
$$[$0-1] +=$$[$0]; this.$=$$[$0-1]
break;
case 7:
this.$ = []
break;
case 8:
$$[$0-1].push($$[$0]); this.$=$$[$0-1];
break;
case 9:
this.$ =$$[$0-1]
break;
case 11:
yy.commit($$[$0])
break;
case 12:
yy.branch($$[$0])
break;
case 13:
yy.checkout($$[$0])
break;
case 14:
yy.merge($$[$0])
break;
case 15:
yy.reset($$[$0])
break;
case 16:
this.$ = ""
break;
case 17:
this.$=$$[$0]
break;
case 18:
this.$ = $$[$0-1]+ ":" + $$[$0] 
break;
case 19:
this.$ = $$[$0-1]+ ":"  + yy.count; yy.count = 0
break;
case 20:
yy.count = 0
break;
case 21:
 yy.count += 1 
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},{5:[1,3],8:[1,4]},{6:5,7:$V0,9:6,12:$V1},{5:[1,8]},{7:[1,9]},o($V2,[2,7],{10:10,11:[1,11]}),o($V3,[2,6]),{6:12,7:$V0,9:6,12:$V1},{1:[2,1]},{7:[2,4],12:[1,15],13:13,14:14,15:[1,16],17:[1,17],19:[1,18],20:[1,19],21:[1,20]},o($V3,[2,5]),{7:[1,21]},o($V2,[2,8]),{12:[1,22]},o($V2,[2,10]),{12:[2,16],16:23,23:[1,24]},{18:[1,25]},{18:[1,26]},{18:[1,27]},{18:[1,30],22:28,24:[1,29]},{1:[2,2]},o($V2,[2,9]),{12:[2,11]},{12:[2,17]},{12:[2,12]},{12:[2,13]},{12:[2,14]},{12:[2,15]},{12:$V4,25:31,26:$V5},{12:$V4,25:33,26:$V5},{12:[2,18]},{12:$V4,25:34,26:$V5},{12:[2,19]},{12:[2,21]}],
defaultActions: {9:[2,1],21:[2,2],23:[2,11],24:[2,17],25:[2,12],26:[2,13],27:[2,14],28:[2,15],31:[2,18],33:[2,19],34:[2,21]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 12;
break;
case 1:/* skip all whitespace */
break;
case 2:/* skip comments */
break;
case 3:/* skip comments */
break;
case 4:return 4;
break;
case 5:return 15;
break;
case 6:return 17;
break;
case 7:return 20;
break;
case 8:return 21;
break;
case 9:return 19;
break;
case 10:return 8;
break;
case 11:return 8;
break;
case 12:return 5;
break;
case 13:return 26
break;
case 14:this.begin("options");
break;
case 15:this.popState();
break;
case 16:return 11;
break;
case 17:this.begin("string");
break;
case 18:this.popState();
break;
case 19:return 23;
break;
case 20:return 18;
break;
case 21:return 7;
break;
}
},
rules: [/^(?:(\r?\n)+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:gitGraph\b)/i,/^(?:commit\b)/i,/^(?:branch\b)/i,/^(?:merge\b)/i,/^(?:reset\b)/i,/^(?:checkout\b)/i,/^(?:LR\b)/i,/^(?:BT\b)/i,/^(?::)/i,/^(?:\^)/i,/^(?:options\r?\n)/i,/^(?:end\r?\n)/i,/^(?:[^\n]+\r?\n)/i,/^(?:["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[a-zA-Z][a-zA-Z0-9_]+)/i,/^(?:$)/i],
conditions: {"options":{"rules":[15,16],"inclusive":false},"string":{"rules":[18,19],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,17,20,21],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/info/infoDb.js":
/*!*************************************!*\
  !*** ./src/diagrams/info/infoDb.js ***!
  \*************************************/
/*! exports provided: setMessage, getMessage, setInfo, getInfo, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setMessage", function() { return setMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMessage", function() { return getMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setInfo", function() { return setInfo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getInfo", function() { return getInfo; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 * Created by knut on 15-01-14.
 */

var message = '';
var info = false;
var setMessage = function setMessage(txt) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Setting message to: ' + txt);
  message = txt;
};
var getMessage = function getMessage() {
  return message;
};
var setInfo = function setInfo(inf) {
  info = inf;
};
var getInfo = function getInfo() {
  return info;
}; // export const parseError = (err, hash) => {
//   global.mermaidAPI.parseError(err, hash)
// }

/* harmony default export */ __webpack_exports__["default"] = ({
  setMessage: setMessage,
  getMessage: getMessage,
  setInfo: setInfo,
  getInfo: getInfo // parseError

});

/***/ }),

/***/ "./src/diagrams/info/infoRenderer.js":
/*!*******************************************!*\
  !*** ./src/diagrams/info/infoRenderer.js ***!
  \*******************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _infoDb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./infoDb */ "./src/diagrams/info/infoDb.js");
/* harmony import */ var _parser_info__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser/info */ "./src/diagrams/info/parser/info.jison");
/* harmony import */ var _parser_info__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_parser_info__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 * Created by knut on 14-12-11.
 */




var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a an info picture in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */

var draw = function draw(txt, id, ver) {
  try {
    var parser = _parser_info__WEBPACK_IMPORTED_MODULE_2___default.a.parser;
    parser.yy = _infoDb__WEBPACK_IMPORTED_MODULE_1__["default"];
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Renering info diagram\n' + txt); // Parse the graph definition

    parser.parse(txt);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Parsed info diagram'); // Fetch the default direction, use TD if none was found

    var svg = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#' + id);
    var g = svg.append('g');
    g.append('text') // text label for the x axis
    .attr('x', 100).attr('y', 40).attr('class', 'version').attr('font-size', '32px').style('text-anchor', 'middle').text('v ' + ver);
    svg.attr('height', 100);
    svg.attr('width', 400); // svg.attr('viewBox', '0 0 300 150');
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error('Error while rendering info diagram');
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/info/parser/info.jison":
/*!*********************************************!*\
  !*** ./src/diagrams/info/parser/info.jison ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,9,10];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"info":4,"document":5,"EOF":6,"line":7,"statement":8,"NL":9,"showInfo":10,"$accept":0,"$end":1},
terminals_: {2:"error",4:"info",6:"EOF",9:"NL",10:"showInfo"},
productions_: [0,[3,3],[5,0],[5,2],[7,1],[7,1],[8,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
 return yy; 
break;
case 4:
 
break;
case 6:
 yy.setInfo(true);  
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:6,9:[1,7],10:[1,8]},{1:[2,1]},o($V0,[2,3]),o($V0,[2,4]),o($V0,[2,5]),o($V0,[2,6])],
defaultActions: {4:[2,1]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
	// Pre-lexer code can go here

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 4    ;
break;
case 1:return 9      ;
break;
case 2:return 'space';
break;
case 3:return 10;
break;
case 4:return 6     ;
break;
case 5:return 'TXT' ;
break;
}
},
rules: [/^(?:info\b)/i,/^(?:[\s\n\r]+)/i,/^(?:[\s]+)/i,/^(?:showInfo\b)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/pie/parser/pie.jison":
/*!*******************************************!*\
  !*** ./src/diagrams/pie/parser/pie.jison ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[6,9,10,12];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"pie":4,"document":5,"EOF":6,"line":7,"statement":8,"NL":9,"STR":10,"VALUE":11,"title":12,"$accept":0,"$end":1},
terminals_: {2:"error",4:"pie",6:"EOF",9:"NL",10:"STR",11:"VALUE",12:"title"},
productions_: [0,[3,3],[5,0],[5,2],[7,1],[7,1],[8,2],[8,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 4:
 
break;
case 6:

		console.log('str:'+$$[$0-1]+' value: '+$$[$0])
		yy.addSection($$[$0-1],yy.cleanupValue($$[$0]));  
break;
case 7:
yy.setTitle($$[$0].substr(6));this.$=$$[$0].substr(6);
break;
}
},
table: [{3:1,4:[1,2]},{1:[3]},o($V0,[2,2],{5:3}),{6:[1,4],7:5,8:6,9:[1,7],10:[1,8],12:[1,9]},{1:[2,1]},o($V0,[2,3]),o($V0,[2,4]),o($V0,[2,5]),{11:[1,10]},o($V0,[2,7]),o($V0,[2,6])],
defaultActions: {4:[2,1]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
	// Pre-lexer code can go here

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* do nothing */
break;
case 1:/* skip whitespace */
break;
case 2:return 4    ;
break;
case 3:return 9      ;
break;
case 4:return 'space';
break;
case 5:return 12;
break;
case 6:/*console.log('begin str');*/this.begin("string");
break;
case 7:/*console.log('pop-state');*/this.popState();
break;
case 8:/*console.log('ending string')*/return "STR";
break;
case 9:return "VALUE";
break;
case 10:return 6     ;
break;
}
},
rules: [/^(?:%%[^\n]*)/i,/^(?:\s+)/i,/^(?:pie\b)/i,/^(?:[\s\n\r]+)/i,/^(?:[\s]+)/i,/^(?:title\s[^#\n;]+)/i,/^(?:["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?::[\s]*[\d]+(?:\.[\d]+)?)/i,/^(?:$)/i],
conditions: {"string":{"rules":[7,8],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,5,6,9,10],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/pie/pieDb.js":
/*!***********************************!*\
  !*** ./src/diagrams/pie/pieDb.js ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 *
 */

var sections = {};
var title = '';

var addSection = function addSection(id, value) {
  if (typeof sections[id] === 'undefined') {
    sections[id] = value;
    _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Added new section :', id); // console.log('Added new section:', id, value)
  }
};

var getSections = function getSections() {
  return sections;
};

var setTitle = function setTitle(txt) {
  title = txt;
};

var getTitle = function getTitle() {
  return title;
};

var cleanupValue = function cleanupValue(value) {
  if (value.substring(0, 1) === ':') {
    value = value.substring(1).trim();
    return Number(value.trim());
  } else {
    return Number(value.trim());
  }
};

var clear = function clear() {
  sections = {};
  title = '';
}; // export const parseError = (err, hash) => {
//   global.mermaidAPI.parseError(err, hash)
// }


/* harmony default export */ __webpack_exports__["default"] = ({
  addSection: addSection,
  getSections: getSections,
  cleanupValue: cleanupValue,
  clear: clear,
  setTitle: setTitle,
  getTitle: getTitle // parseError

});

/***/ }),

/***/ "./src/diagrams/pie/pieRenderer.js":
/*!*****************************************!*\
  !*** ./src/diagrams/pie/pieRenderer.js ***!
  \*****************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _pieDb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./pieDb */ "./src/diagrams/pie/pieDb.js");
/* harmony import */ var _parser_pie__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser/pie */ "./src/diagrams/pie/parser/pie.jison");
/* harmony import */ var _parser_pie__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_parser_pie__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/**
 * Created by AshishJ on 11-09-2019.
 */




var conf = {};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
};
/**
 * Draws a Pie Chart with the data given in text.
 * @param text
 * @param id
 */

var w;
var draw = function draw(txt, id) {
  try {
    var parser = _parser_pie__WEBPACK_IMPORTED_MODULE_2___default.a.parser;
    parser.yy = _pieDb__WEBPACK_IMPORTED_MODULE_1__["default"];
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Rendering info diagram\n' + txt); // Parse the Pie Chart definition

    parser.yy.clear();
    parser.parse(txt);
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Parsed info diagram');
    var elem = document.getElementById(id);
    w = elem.parentElement.offsetWidth;

    if (typeof w === 'undefined') {
      w = 1200;
    }

    if (typeof conf.useWidth !== 'undefined') {
      w = conf.useWidth;
    }

    var h = 450;
    elem.setAttribute('height', '100%'); // Set viewBox

    elem.setAttribute('viewBox', '0 0 ' + w + ' ' + h); // Fetch the default direction, use TD if none was found

    var width = w; // 450

    var height = 450;
    var margin = 40;
    var legendRectSize = 18;
    var legendSpacing = 4;
    var radius = Math.min(width, height) / 2 - margin;
    var svg = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#' + id).append('svg').attr('width', width).attr('height', height).append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    var data = _pieDb__WEBPACK_IMPORTED_MODULE_1__["default"].getSections();
    var sum = 0;
    Object.keys(data).forEach(function (key) {
      sum += data[key];
    });
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info(data); // set the color scale

    var color = d3__WEBPACK_IMPORTED_MODULE_0__["scaleOrdinal"]().domain(data).range(d3__WEBPACK_IMPORTED_MODULE_0__["schemeSet2"]); // Compute the position of each group on the pie:

    var pie = d3__WEBPACK_IMPORTED_MODULE_0__["pie"]().value(function (d) {
      return d.value;
    });
    var dataReady = pie(d3__WEBPACK_IMPORTED_MODULE_0__["entries"](data)); // shape helper to build arcs:

    var arcGenerator = d3__WEBPACK_IMPORTED_MODULE_0__["arc"]().innerRadius(0).outerRadius(radius); // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.

    svg.selectAll('mySlices').data(dataReady).enter().append('path').attr('d', arcGenerator).attr('fill', function (d) {
      return color(d.data.key);
    }).attr('stroke', 'black').style('stroke-width', '2px').style('opacity', 0.7); // Now add the Percentage. Use the centroid method to get the best coordinates

    svg.selectAll('mySlices').data(dataReady).enter().append('text').text(function (d) {
      return (d.data.value / sum * 100).toFixed(0) + '%';
    }).attr('transform', function (d) {
      return 'translate(' + arcGenerator.centroid(d) + ')';
    }).style('text-anchor', 'middle').attr('class', 'slice').style('font-size', 17);
    svg.append('text').text(parser.yy.getTitle()).attr('x', 0).attr('y', -(h - 50) / 2).attr('class', 'pieTitleText'); //Add the slegend/annotations for each section

    var legend = svg.selectAll('.legend').data(color.domain()).enter().append('g').attr('class', 'legend').attr('transform', function (d, i) {
      var height = legendRectSize + legendSpacing;
      var offset = height * color.domain().length / 2;
      var horz = 12 * legendRectSize;
      var vert = i * height - offset;
      return 'translate(' + horz + ',' + vert + ')';
    });
    legend.append('rect').attr('width', legendRectSize).attr('height', legendRectSize).style('fill', color).style('stroke', color);
    legend.append('text').attr('x', legendRectSize + legendSpacing).attr('y', legendRectSize - legendSpacing).text(function (d) {
      return d;
    });
  } catch (e) {
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error('Error while rendering info diagram');
    _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].error(e.message);
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/sequence/parser/sequenceDiagram.jison":
/*!************************************************************!*\
  !*** ./src/diagrams/sequence/parser/sequenceDiagram.jison ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,2],$V1=[1,3],$V2=[1,4],$V3=[2,4],$V4=[1,9],$V5=[1,11],$V6=[1,12],$V7=[1,14],$V8=[1,15],$V9=[1,17],$Va=[1,18],$Vb=[1,19],$Vc=[1,20],$Vd=[1,21],$Ve=[1,22],$Vf=[1,24],$Vg=[1,25],$Vh=[1,4,5,10,15,16,18,20,21,22,23,24,26,28,29,30,41],$Vi=[1,33],$Vj=[4,5,10,15,16,18,20,21,22,23,24,26,30,41],$Vk=[4,5,10,15,16,18,20,21,22,23,24,26,29,30,41],$Vl=[4,5,10,15,16,18,20,21,22,23,24,26,28,30,41],$Vm=[39,40,41];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"SPACE":4,"NL":5,"SD":6,"document":7,"line":8,"statement":9,"participant":10,"actor":11,"AS":12,"restOfLine":13,"signal":14,"activate":15,"deactivate":16,"note_statement":17,"title":18,"text2":19,"loop":20,"end":21,"rect":22,"opt":23,"alt":24,"else_sections":25,"par":26,"par_sections":27,"and":28,"else":29,"note":30,"placement":31,"over":32,"actor_pair":33,"spaceList":34,",":35,"left_of":36,"right_of":37,"signaltype":38,"+":39,"-":40,"ACTOR":41,"SOLID_OPEN_ARROW":42,"DOTTED_OPEN_ARROW":43,"SOLID_ARROW":44,"DOTTED_ARROW":45,"SOLID_CROSS":46,"DOTTED_CROSS":47,"TXT":48,"$accept":0,"$end":1},
terminals_: {2:"error",4:"SPACE",5:"NL",6:"SD",10:"participant",12:"AS",13:"restOfLine",15:"activate",16:"deactivate",18:"title",20:"loop",21:"end",22:"rect",23:"opt",24:"alt",26:"par",28:"and",29:"else",30:"note",32:"over",35:",",36:"left_of",37:"right_of",39:"+",40:"-",41:"ACTOR",42:"SOLID_OPEN_ARROW",43:"DOTTED_OPEN_ARROW",44:"SOLID_ARROW",45:"DOTTED_ARROW",46:"SOLID_CROSS",47:"DOTTED_CROSS",48:"TXT"},
productions_: [0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,5],[9,3],[9,2],[9,3],[9,3],[9,2],[9,3],[9,4],[9,4],[9,4],[9,4],[9,4],[27,1],[27,4],[25,1],[25,4],[17,4],[17,4],[34,2],[34,1],[33,3],[33,1],[31,1],[31,1],[14,5],[14,5],[14,4],[11,1],[38,1],[38,1],[38,1],[38,1],[38,1],[38,1],[19,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 3:
 yy.apply($$[$0]);return $$[$0]; 
break;
case 4:
 this.$ = [] 
break;
case 5:
$$[$0-1].push($$[$0]);this.$ = $$[$0-1]
break;
case 6: case 7:
 this.$ = $$[$0] 
break;
case 8:
 this.$=[];
break;
case 9:
$$[$0-3].description=$$[$0-1]; this.$=$$[$0-3];
break;
case 10:
this.$=$$[$0-1];
break;
case 12:
this.$={type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $$[$0-1]};
break;
case 13:
this.$={type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $$[$0-1]};
break;
case 15:
this.$=[{type:'setTitle', text:$$[$0-1]}]
break;
case 16:

		$$[$0-1].unshift({type: 'loopStart', loopText:$$[$0-2], signalType: yy.LINETYPE.LOOP_START});
		$$[$0-1].push({type: 'loopEnd', loopText:$$[$0-2], signalType: yy.LINETYPE.LOOP_END});
		this.$=$$[$0-1];
break;
case 17:

		$$[$0-1].unshift({type: 'rectStart', color:$$[$0-2], signalType: yy.LINETYPE.RECT_START });
		$$[$0-1].push({type: 'rectEnd', color:$$[$0-2], signalType: yy.LINETYPE.RECT_END });
		this.$=$$[$0-1];
break;
case 18:

		$$[$0-1].unshift({type: 'optStart', optText:$$[$0-2], signalType: yy.LINETYPE.OPT_START});
		$$[$0-1].push({type: 'optEnd', optText:$$[$0-2], signalType: yy.LINETYPE.OPT_END});
		this.$=$$[$0-1];
break;
case 19:

		// Alt start
		$$[$0-1].unshift({type: 'altStart', altText:$$[$0-2], signalType: yy.LINETYPE.ALT_START});
		// Content in alt is already in $$[$0-1]
		// End
		$$[$0-1].push({type: 'altEnd', signalType: yy.LINETYPE.ALT_END});
		this.$=$$[$0-1];
break;
case 20:

		// Parallel start
		$$[$0-1].unshift({type: 'parStart', parText:$$[$0-2], signalType: yy.LINETYPE.PAR_START});
		// Content in par is already in $$[$0-1]
		// End
		$$[$0-1].push({type: 'parEnd', signalType: yy.LINETYPE.PAR_END});
		this.$=$$[$0-1];
break;
case 22:
 this.$ = $$[$0-3].concat([{type: 'and', parText:$$[$0-1], signalType: yy.LINETYPE.PAR_AND}, $$[$0]]); 
break;
case 24:
 this.$ = $$[$0-3].concat([{type: 'else', altText:$$[$0-1], signalType: yy.LINETYPE.ALT_ELSE}, $$[$0]]); 
break;
case 25:

		this.$ = [$$[$0-1], {type:'addNote', placement:$$[$0-2], actor:$$[$0-1].actor, text:$$[$0]}];
break;
case 26:

		// Coerce actor_pair into a [to, from, ...] array
		$$[$0-2] = [].concat($$[$0-1], $$[$0-1]).slice(0, 2);
		$$[$0-2][0] = $$[$0-2][0].actor;
		$$[$0-2][1] = $$[$0-2][1].actor;
		this.$ = [$$[$0-1], {type:'addNote', placement:yy.PLACEMENT.OVER, actor:$$[$0-2].slice(0, 2), text:$$[$0]}];
break;
case 29:
 this.$ = [$$[$0-2], $$[$0]]; 
break;
case 30:
 this.$ = $$[$0]; 
break;
case 31:
 this.$ = yy.PLACEMENT.LEFTOF; 
break;
case 32:
 this.$ = yy.PLACEMENT.RIGHTOF; 
break;
case 33:
 this.$ = [$$[$0-4],$$[$0-1],{type: 'addMessage', from:$$[$0-4].actor, to:$$[$0-1].actor, signalType:$$[$0-3], msg:$$[$0]},
	              {type: 'activeStart', signalType: yy.LINETYPE.ACTIVE_START, actor: $$[$0-1]}
	             ]
break;
case 34:
 this.$ = [$$[$0-4],$$[$0-1],{type: 'addMessage', from:$$[$0-4].actor, to:$$[$0-1].actor, signalType:$$[$0-3], msg:$$[$0]},
	             {type: 'activeEnd', signalType: yy.LINETYPE.ACTIVE_END, actor: $$[$0-4]}
	             ]
break;
case 35:
 this.$ = [$$[$0-3],$$[$0-1],{type: 'addMessage', from:$$[$0-3].actor, to:$$[$0-1].actor, signalType:$$[$0-2], msg:$$[$0]}]
break;
case 36:
this.$={type: 'addActor', actor:$$[$0]}
break;
case 37:
 this.$ = yy.LINETYPE.SOLID_OPEN; 
break;
case 38:
 this.$ = yy.LINETYPE.DOTTED_OPEN; 
break;
case 39:
 this.$ = yy.LINETYPE.SOLID; 
break;
case 40:
 this.$ = yy.LINETYPE.DOTTED; 
break;
case 41:
 this.$ = yy.LINETYPE.SOLID_CROSS; 
break;
case 42:
 this.$ = yy.LINETYPE.DOTTED_CROSS; 
break;
case 43:
this.$ = $$[$0].substring(1).trim().replace(/\\n/gm, "\n");
break;
}
},
table: [{3:1,4:$V0,5:$V1,6:$V2},{1:[3]},{3:5,4:$V0,5:$V1,6:$V2},{3:6,4:$V0,5:$V1,6:$V2},o([1,4,5,10,15,16,18,20,22,23,24,26,30,41],$V3,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:$V4,5:$V5,8:8,9:10,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,22:$Vb,23:$Vc,24:$Vd,26:$Ve,30:$Vf,41:$Vg},o($Vh,[2,5]),{9:26,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,22:$Vb,23:$Vc,24:$Vd,26:$Ve,30:$Vf,41:$Vg},o($Vh,[2,7]),o($Vh,[2,8]),{11:27,41:$Vg},{5:[1,28]},{11:29,41:$Vg},{11:30,41:$Vg},{5:[1,31]},{19:32,48:$Vi},{13:[1,34]},{13:[1,35]},{13:[1,36]},{13:[1,37]},{13:[1,38]},{38:39,42:[1,40],43:[1,41],44:[1,42],45:[1,43],46:[1,44],47:[1,45]},{31:46,32:[1,47],36:[1,48],37:[1,49]},o([5,12,35,42,43,44,45,46,47,48],[2,36]),o($Vh,[2,6]),{5:[1,51],12:[1,50]},o($Vh,[2,11]),{5:[1,52]},{5:[1,53]},o($Vh,[2,14]),{5:[1,54]},{5:[2,43]},o($Vj,$V3,{7:55}),o($Vj,$V3,{7:56}),o($Vj,$V3,{7:57}),o($Vk,$V3,{25:58,7:59}),o($Vl,$V3,{27:60,7:61}),{11:64,39:[1,62],40:[1,63],41:$Vg},o($Vm,[2,37]),o($Vm,[2,38]),o($Vm,[2,39]),o($Vm,[2,40]),o($Vm,[2,41]),o($Vm,[2,42]),{11:65,41:$Vg},{11:67,33:66,41:$Vg},{41:[2,31]},{41:[2,32]},{13:[1,68]},o($Vh,[2,10]),o($Vh,[2,12]),o($Vh,[2,13]),o($Vh,[2,15]),{4:$V4,5:$V5,8:8,9:10,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,21:[1,69],22:$Vb,23:$Vc,24:$Vd,26:$Ve,30:$Vf,41:$Vg},{4:$V4,5:$V5,8:8,9:10,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,21:[1,70],22:$Vb,23:$Vc,24:$Vd,26:$Ve,30:$Vf,41:$Vg},{4:$V4,5:$V5,8:8,9:10,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,21:[1,71],22:$Vb,23:$Vc,24:$Vd,26:$Ve,30:$Vf,41:$Vg},{21:[1,72]},{4:$V4,5:$V5,8:8,9:10,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,21:[2,23],22:$Vb,23:$Vc,24:$Vd,26:$Ve,29:[1,73],30:$Vf,41:$Vg},{21:[1,74]},{4:$V4,5:$V5,8:8,9:10,10:$V6,11:23,14:13,15:$V7,16:$V8,17:16,18:$V9,20:$Va,21:[2,21],22:$Vb,23:$Vc,24:$Vd,26:$Ve,28:[1,75],30:$Vf,41:$Vg},{11:76,41:$Vg},{11:77,41:$Vg},{19:78,48:$Vi},{19:79,48:$Vi},{19:80,48:$Vi},{35:[1,81],48:[2,30]},{5:[1,82]},o($Vh,[2,16]),o($Vh,[2,17]),o($Vh,[2,18]),o($Vh,[2,19]),{13:[1,83]},o($Vh,[2,20]),{13:[1,84]},{19:85,48:$Vi},{19:86,48:$Vi},{5:[2,35]},{5:[2,25]},{5:[2,26]},{11:87,41:$Vg},o($Vh,[2,9]),o($Vk,$V3,{7:59,25:88}),o($Vl,$V3,{7:61,27:89}),{5:[2,33]},{5:[2,34]},{48:[2,29]},{21:[2,24]},{21:[2,22]}],
defaultActions: {5:[2,1],6:[2,2],33:[2,43],48:[2,31],49:[2,32],78:[2,35],79:[2,25],80:[2,26],85:[2,33],86:[2,34],87:[2,29],88:[2,24],89:[2,22]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 5;
break;
case 1:/* skip all whitespace */
break;
case 2:/* skip same-line whitespace */
break;
case 3:/* skip comments */
break;
case 4:/* skip comments */
break;
case 5: this.begin('ID'); return 10; 
break;
case 6: yy_.yytext = yy_.yytext.trim(); this.begin('ALIAS'); return 41; 
break;
case 7: this.popState(); this.popState(); this.begin('LINE'); return 12; 
break;
case 8: this.popState(); this.popState(); return 5; 
break;
case 9: this.begin('LINE'); return 20; 
break;
case 10: this.begin('LINE'); return 22; 
break;
case 11: this.begin('LINE'); return 23; 
break;
case 12: this.begin('LINE'); return 24; 
break;
case 13: this.begin('LINE'); return 29; 
break;
case 14: this.begin('LINE'); return 26; 
break;
case 15: this.begin('LINE'); return 28; 
break;
case 16: this.popState(); return 13; 
break;
case 17:return 21;
break;
case 18:return 36;
break;
case 19:return 37;
break;
case 20:return 32;
break;
case 21:return 30;
break;
case 22: this.begin('ID'); return 15; 
break;
case 23: this.begin('ID'); return 16; 
break;
case 24:return 18;
break;
case 25:return 6;
break;
case 26:return 35;
break;
case 27:return 5;
break;
case 28: yy_.yytext = yy_.yytext.trim(); return 41; 
break;
case 29:return 44;
break;
case 30:return 45;
break;
case 31:return 42;
break;
case 32:return 43;
break;
case 33:return 46;
break;
case 34:return 47;
break;
case 35:return 48;
break;
case 36:return 39;
break;
case 37:return 40;
break;
case 38:return 5;
break;
case 39:return 'INVALID';
break;
}
},
rules: [/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:participant\b)/i,/^(?:[^\->:\n,;]+?(?=((?!\n)\s)+as(?!\n)\s|[#\n;]|$))/i,/^(?:as\b)/i,/^(?:(?:))/i,/^(?:loop\b)/i,/^(?:rect\b)/i,/^(?:opt\b)/i,/^(?:alt\b)/i,/^(?:else\b)/i,/^(?:par\b)/i,/^(?:and\b)/i,/^(?:[^#\n;]*)/i,/^(?:end\b)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:over\b)/i,/^(?:note\b)/i,/^(?:activate\b)/i,/^(?:deactivate\b)/i,/^(?:title\b)/i,/^(?:sequenceDiagram\b)/i,/^(?:,)/i,/^(?:;)/i,/^(?:[^\+\->:\n,;]+)/i,/^(?:->>)/i,/^(?:-->>)/i,/^(?:->)/i,/^(?:-->)/i,/^(?:-[x])/i,/^(?:--[x])/i,/^(?::[^#\n;]+)/i,/^(?:\+)/i,/^(?:-)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"LINE":{"rules":[2,3,16],"inclusive":false},"ALIAS":{"rules":[2,3,7,8],"inclusive":false},"ID":{"rules":[2,3,6],"inclusive":false},"INITIAL":{"rules":[0,1,3,4,5,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/sequence/sequenceDb.js":
/*!*********************************************!*\
  !*** ./src/diagrams/sequence/sequenceDb.js ***!
  \*********************************************/
/*! exports provided: addActor, addMessage, addSignal, getMessages, getActors, getActor, getActorKeys, getTitle, clear, LINETYPE, ARROWTYPE, PLACEMENT, addNote, setTitle, apply, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addActor", function() { return addActor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addMessage", function() { return addMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addSignal", function() { return addSignal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMessages", function() { return getMessages; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getActors", function() { return getActors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getActor", function() { return getActor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getActorKeys", function() { return getActorKeys; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTitle", function() { return getTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LINETYPE", function() { return LINETYPE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ARROWTYPE", function() { return ARROWTYPE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PLACEMENT", function() { return PLACEMENT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addNote", function() { return addNote; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setTitle", function() { return setTitle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "apply", function() { return apply; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");

var actors = {};
var messages = [];
var notes = [];
var title = '';
var addActor = function addActor(id, name, description) {
  // Don't allow description nulling
  var old = actors[id];
  if (old && name === old.name && description == null) return; // Don't allow null descriptions, either

  if (description == null) description = name;
  actors[id] = {
    name: name,
    description: description
  };
};
var addMessage = function addMessage(idFrom, idTo, message, answer) {
  messages.push({
    from: idFrom,
    to: idTo,
    message: message,
    answer: answer
  });
};
var addSignal = function addSignal(idFrom, idTo, message, messageType) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].debug('Adding message from=' + idFrom + ' to=' + idTo + ' message=' + message + ' type=' + messageType);
  messages.push({
    from: idFrom,
    to: idTo,
    message: message,
    type: messageType
  });
};
var getMessages = function getMessages() {
  return messages;
};
var getActors = function getActors() {
  return actors;
};
var getActor = function getActor(id) {
  return actors[id];
};
var getActorKeys = function getActorKeys() {
  return Object.keys(actors);
};
var getTitle = function getTitle() {
  return title;
};
var clear = function clear() {
  actors = {};
  messages = [];
};
var LINETYPE = {
  SOLID: 0,
  DOTTED: 1,
  NOTE: 2,
  SOLID_CROSS: 3,
  DOTTED_CROSS: 4,
  SOLID_OPEN: 5,
  DOTTED_OPEN: 6,
  LOOP_START: 10,
  LOOP_END: 11,
  ALT_START: 12,
  ALT_ELSE: 13,
  ALT_END: 14,
  OPT_START: 15,
  OPT_END: 16,
  ACTIVE_START: 17,
  ACTIVE_END: 18,
  PAR_START: 19,
  PAR_AND: 20,
  PAR_END: 21,
  RECT_START: 22,
  RECT_END: 23
};
var ARROWTYPE = {
  FILLED: 0,
  OPEN: 1
};
var PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2
};
var addNote = function addNote(actor, placement, message) {
  var note = {
    actor: actor,
    placement: placement,
    message: message
  }; // Coerce actor into a [to, from, ...] array

  var actors = [].concat(actor, actor);
  notes.push(note);
  messages.push({
    from: actors[0],
    to: actors[1],
    message: message,
    type: LINETYPE.NOTE,
    placement: placement
  });
};
var setTitle = function setTitle(titleText) {
  title = titleText;
};
var apply = function apply(param) {
  if (param instanceof Array) {
    param.forEach(function (item) {
      apply(item);
    });
  } else {
    switch (param.type) {
      case 'addActor':
        addActor(param.actor, param.actor, param.description);
        break;

      case 'activeStart':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;

      case 'activeEnd':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;

      case 'addNote':
        addNote(param.actor, param.placement, param.text);
        break;

      case 'addMessage':
        addSignal(param.from, param.to, param.msg, param.signalType);
        break;

      case 'loopStart':
        addSignal(undefined, undefined, param.loopText, param.signalType);
        break;

      case 'loopEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'rectStart':
        addSignal(undefined, undefined, param.color, param.signalType);
        break;

      case 'rectEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'optStart':
        addSignal(undefined, undefined, param.optText, param.signalType);
        break;

      case 'optEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'altStart':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;

      case 'else':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;

      case 'altEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;

      case 'setTitle':
        setTitle(param.text);
        break;

      case 'parStart':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;

      case 'and':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;

      case 'parEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
    }
  }
};
/* harmony default export */ __webpack_exports__["default"] = ({
  addActor: addActor,
  addMessage: addMessage,
  addSignal: addSignal,
  getMessages: getMessages,
  getActors: getActors,
  getActor: getActor,
  getActorKeys: getActorKeys,
  getTitle: getTitle,
  clear: clear,
  LINETYPE: LINETYPE,
  ARROWTYPE: ARROWTYPE,
  PLACEMENT: PLACEMENT,
  addNote: addNote,
  setTitle: setTitle,
  apply: apply
});

/***/ }),

/***/ "./src/diagrams/sequence/sequenceRenderer.js":
/*!***************************************************!*\
  !*** ./src/diagrams/sequence/sequenceRenderer.js ***!
  \***************************************************/
/*! exports provided: bounds, drawActors, setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bounds", function() { return bounds; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawActors", function() { return drawActors; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _svgDraw__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./svgDraw */ "./src/diagrams/sequence/svgDraw.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parser/sequenceDiagram */ "./src/diagrams/sequence/parser/sequenceDiagram.jison");
/* harmony import */ var _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _sequenceDb__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./sequenceDb */ "./src/diagrams/sequence/sequenceDb.js");





_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy = _sequenceDb__WEBPACK_IMPORTED_MODULE_4__["default"];
var conf = {
  diagramMarginX: 50,
  diagramMarginY: 30,
  // Margin between actors
  actorMargin: 50,
  // Width of actor boxes
  width: 150,
  // Height of actor boxes
  height: 65,
  actorFontSize: 14,
  actorFontFamily: '"Open-Sans", "sans-serif"',
  // Margin around loop boxes
  boxMargin: 10,
  boxTextMargin: 5,
  noteMargin: 10,
  // Space between messages
  messageMargin: 35,
  // mirror actors under diagram
  mirrorActors: false,
  // Depending on css styling this might need adjustment
  // Prolongs the edge of the diagram downwards
  bottomMarginAdj: 1,
  // width of activation box
  activationWidth: 10,
  // text placement as: tspan | fo | old only text as before
  textPlacement: 'tspan',
  showSequenceNumbers: false
};
var bounds = {
  data: {
    startx: undefined,
    stopx: undefined,
    starty: undefined,
    stopy: undefined
  },
  verticalPos: 0,
  sequenceItems: [],
  activations: [],
  init: function init() {
    this.sequenceItems = [];
    this.activations = [];
    this.data = {
      startx: undefined,
      stopx: undefined,
      starty: undefined,
      stopy: undefined
    };
    this.verticalPos = 0;
  },
  updateVal: function updateVal(obj, key, val, fun) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = val;
    } else {
      obj[key] = fun(val, obj[key]);
    }
  },
  updateBounds: function updateBounds(startx, starty, stopx, stopy) {
    var _self = this;

    var cnt = 0;

    function updateFn(type) {
      return function updateItemBounds(item) {
        cnt++; // The loop sequenceItems is a stack so the biggest margins in the beginning of the sequenceItems

        var n = _self.sequenceItems.length - cnt + 1;

        _self.updateVal(item, 'starty', starty - n * conf.boxMargin, Math.min);

        _self.updateVal(item, 'stopy', stopy + n * conf.boxMargin, Math.max);

        _self.updateVal(bounds.data, 'startx', startx - n * conf.boxMargin, Math.min);

        _self.updateVal(bounds.data, 'stopx', stopx + n * conf.boxMargin, Math.max);

        if (!(type === 'activation')) {
          _self.updateVal(item, 'startx', startx - n * conf.boxMargin, Math.min);

          _self.updateVal(item, 'stopx', stopx + n * conf.boxMargin, Math.max);

          _self.updateVal(bounds.data, 'starty', starty - n * conf.boxMargin, Math.min);

          _self.updateVal(bounds.data, 'stopy', stopy + n * conf.boxMargin, Math.max);
        }
      };
    }

    this.sequenceItems.forEach(updateFn());
    this.activations.forEach(updateFn('activation'));
  },
  insert: function insert(startx, starty, stopx, stopy) {
    var _startx = Math.min(startx, stopx);

    var _stopx = Math.max(startx, stopx);

    var _starty = Math.min(starty, stopy);

    var _stopy = Math.max(starty, stopy);

    this.updateVal(bounds.data, 'startx', _startx, Math.min);
    this.updateVal(bounds.data, 'starty', _starty, Math.min);
    this.updateVal(bounds.data, 'stopx', _stopx, Math.max);
    this.updateVal(bounds.data, 'stopy', _stopy, Math.max);
    this.updateBounds(_startx, _starty, _stopx, _stopy);
  },
  newActivation: function newActivation(message, diagram) {
    var actorRect = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getActors()[message.from.actor];
    var stackedSize = actorActivations(message.from.actor).length;
    var x = actorRect.x + conf.width / 2 + (stackedSize - 1) * conf.activationWidth / 2;
    this.activations.push({
      startx: x,
      starty: this.verticalPos + 2,
      stopx: x + conf.activationWidth,
      stopy: undefined,
      actor: message.from.actor,
      anchored: _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].anchorElement(diagram)
    });
  },
  endActivation: function endActivation(message) {
    // find most recent activation for given actor
    var lastActorActivationIdx = this.activations.map(function (activation) {
      return activation.actor;
    }).lastIndexOf(message.from.actor);
    var activation = this.activations.splice(lastActorActivationIdx, 1)[0];
    return activation;
  },
  newLoop: function newLoop(title, fill) {
    this.sequenceItems.push({
      startx: undefined,
      starty: this.verticalPos,
      stopx: undefined,
      stopy: undefined,
      title: title,
      fill: fill
    });
  },
  endLoop: function endLoop() {
    var loop = this.sequenceItems.pop();
    return loop;
  },
  addSectionToLoop: function addSectionToLoop(message) {
    var loop = this.sequenceItems.pop();
    loop.sections = loop.sections || [];
    loop.sectionTitles = loop.sectionTitles || [];
    loop.sections.push(bounds.getVerticalPos());
    loop.sectionTitles.push(message);
    this.sequenceItems.push(loop);
  },
  bumpVerticalPos: function bumpVerticalPos(bump) {
    this.verticalPos = this.verticalPos + bump;
    this.data.stopy = this.verticalPos;
  },
  getVerticalPos: function getVerticalPos() {
    return this.verticalPos;
  },
  getBounds: function getBounds() {
    return this.data;
  }
};

var _drawLongText = function _drawLongText(text, x, y, g, width) {
  var textHeight = 0;
  var lines = text.split(/<br\/?>/gi);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var line = _step.value;
      var textObj = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].getTextObj();
      textObj.x = x;
      textObj.y = y + textHeight;
      textObj.textMargin = conf.noteMargin;
      textObj.dy = '1em';
      textObj.text = line;
      textObj.class = 'noteText';
      var textElem = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawText(g, textObj, width);
      textHeight += (textElem._groups || textElem)[0][0].getBBox().height;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return textHeight;
};
/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */


var drawNote = function drawNote(elem, startx, verticalPos, msg, forceWidth) {
  var rect = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].getNoteRect();
  rect.x = startx;
  rect.y = verticalPos;
  rect.width = forceWidth || conf.width;
  rect.class = 'note';
  var g = elem.append('g');
  var rectElem = _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawRect(g, rect);

  var textHeight = _drawLongText(msg.message, startx - 4, verticalPos + 24, g, rect.width - conf.noteMargin);

  bounds.insert(startx, verticalPos, startx + rect.width, verticalPos + 2 * conf.noteMargin + textHeight);
  rectElem.attr('height', textHeight + 2 * conf.noteMargin);
  bounds.bumpVerticalPos(textHeight + 2 * conf.noteMargin);
};
/**
 * Draws a message
 * @param elem
 * @param startx
 * @param stopx
 * @param verticalPos
 * @param txtCenter
 * @param msg
 */


var drawMessage = function drawMessage(elem, startx, stopx, verticalPos, msg, sequenceIndex) {
  var g = elem.append('g');
  var txtCenter = startx + (stopx - startx) / 2;
  var textElem;
  var counterBreaklines = 0;
  var breaklineOffset = 17;
  var breaklines = msg.message.split(/<br\/?>/gi);
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = breaklines[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var breakline = _step2.value;
      textElem = g.append('text') // text label for the x axis
      .attr('x', txtCenter).attr('y', verticalPos - 7 + counterBreaklines * breaklineOffset).style('text-anchor', 'middle').attr('class', 'messageText').text(breakline.trim());
      counterBreaklines++;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var offsetLineCounter = counterBreaklines - 1;
  var totalOffset = offsetLineCounter * breaklineOffset;
  var textWidth = (textElem._groups || textElem)[0][0].getBBox().width;
  var line;

  if (startx === stopx) {
    if (conf.rightAngles) {
      line = g.append('path').attr('d', "M  ".concat(startx, ",").concat(verticalPos + totalOffset, " H ").concat(startx + conf.width / 2, " V ").concat(verticalPos + 25 + totalOffset, " H ").concat(startx));
    } else {
      line = g.append('path').attr('d', 'M ' + startx + ',' + (verticalPos + totalOffset) + ' C ' + (startx + 60) + ',' + (verticalPos - 10 + totalOffset) + ' ' + (startx + 60) + ',' + (verticalPos + 30 + totalOffset) + ' ' + startx + ',' + (verticalPos + 20 + totalOffset));
    }

    bounds.bumpVerticalPos(30 + totalOffset);
    var dx = Math.max(textWidth / 2, 100);
    bounds.insert(startx - dx, bounds.getVerticalPos() - 10 + totalOffset, stopx + dx, bounds.getVerticalPos() + totalOffset);
  } else {
    line = g.append('line');
    line.attr('x1', startx);
    line.attr('y1', verticalPos);
    line.attr('x2', stopx);
    line.attr('y2', verticalPos);
    bounds.insert(startx, bounds.getVerticalPos() - 10 + totalOffset, stopx, bounds.getVerticalPos() + totalOffset);
  } // Make an SVG Container
  // Draw the line


  if (msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED || msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS || msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_OPEN) {
    line.style('stroke-dasharray', '3, 3');
    line.attr('class', 'messageLine1');
  } else {
    line.attr('class', 'messageLine0');
  }

  var url = '';

  if (conf.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  line.attr('stroke-width', 2);
  line.attr('stroke', 'black');
  line.style('fill', 'none'); // remove any fill colour

  if (msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID || msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED) {
    line.attr('marker-end', 'url(' + url + '#arrowhead)');
  }

  if (msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_CROSS || msg.type === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS) {
    line.attr('marker-end', 'url(' + url + '#crosshead)');
  } // add node number


  if (conf.showSequenceNumbers) {
    line.attr('marker-start', 'url(' + url + '#sequencenumber)');
    g.append('text').attr('x', startx).attr('y', verticalPos + 4).attr('font-family', 'sans-serif').attr('font-size', '12px').attr('text-anchor', 'middle').attr('textLength', '16px').attr('class', 'sequenceNumber').text(sequenceIndex);
  }
};

var drawActors = function drawActors(diagram, actors, actorKeys, verticalPos) {
  // Draw the actors
  for (var i = 0; i < actorKeys.length; i++) {
    var key = actorKeys[i]; // Add some rendering data to the object

    actors[key].x = i * conf.actorMargin + i * conf.width;
    actors[key].y = verticalPos;
    actors[key].width = conf.diagramMarginX;
    actors[key].height = conf.diagramMarginY; // Draw the box with the attached line

    _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawActor(diagram, actors[key].x, verticalPos, actors[key].description, conf);
    bounds.insert(actors[key].x, verticalPos, actors[key].x + conf.width, conf.height);
  } // Add a margin between the actor boxes and the first arrow


  bounds.bumpVerticalPos(conf.height);
};
var setConf = function setConf(cnf) {
  var keys = Object.keys(cnf);
  keys.forEach(function (key) {
    conf[key] = cnf[key];
  });
  conf.actorFontFamily = cnf.fontFamily;
};

var actorActivations = function actorActivations(actor) {
  return bounds.activations.filter(function (activation) {
    return activation.actor === actor;
  });
};

var actorFlowVerticaBounds = function actorFlowVerticaBounds(actor) {
  // handle multiple stacked activations for same actor
  var actors = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getActors();
  var activations = actorActivations(actor);
  var left = activations.reduce(function (acc, activation) {
    return Math.min(acc, activation.startx);
  }, actors[actor].x + conf.width / 2);
  var right = activations.reduce(function (acc, activation) {
    return Math.max(acc, activation.stopx);
  }, actors[actor].x + conf.width / 2);
  return [left, right];
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */


var draw = function draw(text, id) {
  _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.clear();
  _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].parse(text + '\n');
  bounds.init();
  var diagram = d3__WEBPACK_IMPORTED_MODULE_0__["select"]("[id=\"".concat(id, "\"]"));
  var startx;
  var stopx;
  var forceWidth; // Fetch data from the parsing

  var actors = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getActors();
  var actorKeys = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getActorKeys();
  var messages = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getMessages();
  var title = _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.getTitle();
  drawActors(diagram, actors, actorKeys, 0); // The arrow head definition is attached to the svg once

  _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].insertArrowHead(diagram);
  _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].insertArrowCrossHead(diagram);
  _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].insertSequenceNumber(diagram);

  function activeEnd(msg, verticalPos) {
    var activationData = bounds.endActivation(msg);

    if (activationData.starty + 18 > verticalPos) {
      activationData.starty = verticalPos - 6;
      verticalPos += 12;
    }

    _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawActivation(diagram, activationData, verticalPos, conf, actorActivations(msg.from.actor).length);
    bounds.insert(activationData.startx, verticalPos - 10, activationData.stopx, verticalPos);
  } // const lastMsg
  // Draw the messages/signals


  var sequenceIndex = 1;
  messages.forEach(function (msg) {
    var loopData;

    switch (msg.type) {
      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.NOTE:
        bounds.bumpVerticalPos(conf.boxMargin);
        startx = actors[msg.from].x;
        stopx = actors[msg.to].x;

        if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.RIGHTOF) {
          drawNote(diagram, startx + (conf.width + conf.actorMargin) / 2, bounds.getVerticalPos(), msg);
        } else if (msg.placement === _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.PLACEMENT.LEFTOF) {
          drawNote(diagram, startx - (conf.width + conf.actorMargin) / 2, bounds.getVerticalPos(), msg);
        } else if (msg.to === msg.from) {
          // Single-actor over
          drawNote(diagram, startx, bounds.getVerticalPos(), msg);
        } else {
          // Multi-actor over
          forceWidth = Math.abs(startx - stopx) + conf.actorMargin;
          drawNote(diagram, (startx + stopx + conf.width - forceWidth) / 2, bounds.getVerticalPos(), msg, forceWidth);
        }

        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ACTIVE_START:
        bounds.newActivation(msg, diagram);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ACTIVE_END:
        activeEnd(msg, bounds.getVerticalPos());
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.LOOP_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.LOOP_END:
        loopData = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopData, 'loop', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.RECT_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(undefined, msg.message);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.RECT_END:
        {
          var rectData = bounds.endLoop();
          _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawBackgroundRect(diagram, rectData);
          bounds.bumpVerticalPos(conf.boxMargin);
          break;
        }

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.OPT_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.OPT_END:
        loopData = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopData, 'opt', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_ELSE:
        bounds.bumpVerticalPos(conf.boxMargin);
        loopData = bounds.addSectionToLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.ALT_END:
        loopData = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopData, 'alt', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_START:
        bounds.bumpVerticalPos(conf.boxMargin);
        bounds.newLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin + conf.boxTextMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_AND:
        bounds.bumpVerticalPos(conf.boxMargin);
        loopData = bounds.addSectionToLoop(msg.message);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      case _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.PAR_END:
        loopData = bounds.endLoop();
        _svgDraw__WEBPACK_IMPORTED_MODULE_1__["default"].drawLoop(diagram, loopData, 'par', conf);
        bounds.bumpVerticalPos(conf.boxMargin);
        break;

      default:
        try {
          // lastMsg = msg
          bounds.bumpVerticalPos(conf.messageMargin);
          var fromBounds = actorFlowVerticaBounds(msg.from);
          var toBounds = actorFlowVerticaBounds(msg.to);
          var fromIdx = fromBounds[0] <= toBounds[0] ? 1 : 0;
          var toIdx = fromBounds[0] < toBounds[0] ? 0 : 1;
          startx = fromBounds[fromIdx];
          stopx = toBounds[toIdx];
          var verticalPos = bounds.getVerticalPos();
          drawMessage(diagram, startx, stopx, verticalPos, msg, sequenceIndex);
          var allBounds = fromBounds.concat(toBounds);
          bounds.insert(Math.min.apply(null, allBounds), verticalPos, Math.max.apply(null, allBounds), verticalPos);
        } catch (e) {
          _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].error('error while drawing message', e);
        }

    } // Increment sequence counter if msg.type is a line (and not another event like activation or note, etc)


    if ([_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_OPEN, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_OPEN, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.SOLID_CROSS, _parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_3__["parser"].yy.LINETYPE.DOTTED_CROSS].includes(msg.type)) {
      sequenceIndex++;
    }
  });

  if (conf.mirrorActors) {
    // Draw actors below diagram
    bounds.bumpVerticalPos(conf.boxMargin * 2);
    drawActors(diagram, actors, actorKeys, bounds.getVerticalPos());
  }

  var box = bounds.getBounds(); // Adjust line height of actor lines now that the height of the diagram is known

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('For line height fix Querying: #' + id + ' .actor-line');
  var actorLines = d3__WEBPACK_IMPORTED_MODULE_0__["selectAll"]('#' + id + ' .actor-line');
  actorLines.attr('y2', box.stopy);
  var height = box.stopy - box.starty + 2 * conf.diagramMarginY;

  if (conf.mirrorActors) {
    height = height - conf.boxMargin + conf.bottomMarginAdj;
  }

  var width = box.stopx - box.startx + 2 * conf.diagramMarginX;

  if (title) {
    diagram.append('text').text(title).attr('x', (box.stopx - box.startx) / 2 - 2 * conf.diagramMarginX).attr('y', -25);
  }

  if (conf.useMaxWidth) {
    diagram.attr('height', '100%');
    diagram.attr('width', '100%');
    diagram.attr('style', 'max-width:' + width + 'px;');
  } else {
    diagram.attr('height', height);
    diagram.attr('width', width);
  }

  var extraVertForTitle = title ? 40 : 0;
  diagram.attr('viewBox', box.startx - conf.diagramMarginX + ' -' + (conf.diagramMarginY + extraVertForTitle) + ' ' + width + ' ' + (height + extraVertForTitle));
};
/* harmony default export */ __webpack_exports__["default"] = ({
  bounds: bounds,
  drawActors: drawActors,
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/diagrams/sequence/svgDraw.js":
/*!******************************************!*\
  !*** ./src/diagrams/sequence/svgDraw.js ***!
  \******************************************/
/*! exports provided: drawRect, drawText, drawLabel, drawActor, anchorElement, drawActivation, drawLoop, drawBackgroundRect, insertArrowHead, insertSequenceNumber, insertArrowCrossHead, getTextObj, getNoteRect, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawRect", function() { return drawRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawText", function() { return drawText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawLabel", function() { return drawLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawActor", function() { return drawActor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "anchorElement", function() { return anchorElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawActivation", function() { return drawActivation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawLoop", function() { return drawLoop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawBackgroundRect", function() { return drawBackgroundRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertArrowHead", function() { return insertArrowHead; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertSequenceNumber", function() { return insertSequenceNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertArrowCrossHead", function() { return insertArrowCrossHead; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getTextObj", function() { return getTextObj; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getNoteRect", function() { return getNoteRect; });
var drawRect = function drawRect(elem, rectData) {
  var rectElem = elem.append('rect');
  rectElem.attr('x', rectData.x);
  rectElem.attr('y', rectData.y);
  rectElem.attr('fill', rectData.fill);
  rectElem.attr('stroke', rectData.stroke);
  rectElem.attr('width', rectData.width);
  rectElem.attr('height', rectData.height);
  rectElem.attr('rx', rectData.rx);
  rectElem.attr('ry', rectData.ry);

  if (typeof rectData.class !== 'undefined') {
    rectElem.attr('class', rectData.class);
  }

  return rectElem;
};
var drawText = function drawText(elem, textData) {
  // Remove and ignore br:s
  var nText = textData.text.replace(/<br\/?>/gi, ' ');
  var textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.attr('fill', textData.fill);

  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  var span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);
  return textElem;
};
var drawLabel = function drawLabel(elem, txtObject) {
  function genPoints(x, y, width, height, cut) {
    return x + ',' + y + ' ' + (x + width) + ',' + y + ' ' + (x + width) + ',' + (y + height - cut) + ' ' + (x + width - cut * 1.2) + ',' + (y + height) + ' ' + x + ',' + (y + height);
  }

  var polygon = elem.append('polygon');
  polygon.attr('points', genPoints(txtObject.x, txtObject.y, 50, 20, 7));
  polygon.attr('class', 'labelBox');
  txtObject.y = txtObject.y + txtObject.labelMargin;
  txtObject.x = txtObject.x + 0.5 * txtObject.labelMargin;
  drawText(elem, txtObject);
};
var actorCnt = -1;
/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */

var drawActor = function drawActor(elem, left, verticalPos, description, conf) {
  var center = left + conf.width / 2;
  var g = elem.append('g');

  if (verticalPos === 0) {
    actorCnt++;
    g.append('line').attr('id', 'actor' + actorCnt).attr('x1', center).attr('y1', 5).attr('x2', center).attr('y2', 2000).attr('class', 'actor-line').attr('stroke-width', '0.5px').attr('stroke', '#999');
  }

  var rect = getNoteRect();
  rect.x = left;
  rect.y = verticalPos;
  rect.fill = '#eaeaea';
  rect.width = conf.width;
  rect.height = conf.height;
  rect.class = 'actor';
  rect.rx = 3;
  rect.ry = 3;
  drawRect(g, rect);

  _drawTextCandidateFunc(conf)(description, g, rect.x, rect.y, rect.width, rect.height, {
    class: 'actor'
  }, conf);
};
var anchorElement = function anchorElement(elem) {
  return elem.append('g');
};
/**
 * Draws an actor in the diagram with the attaced line
 * @param elem - element to append activation rect
 * @param bounds - activation box bounds
 * @param verticalPos - precise y cooridnate of bottom activation box edge
 */

var drawActivation = function drawActivation(elem, bounds, verticalPos, conf, actorActivations) {
  var rect = getNoteRect();
  var g = bounds.anchored;
  rect.x = bounds.startx;
  rect.y = bounds.starty;
  rect.class = 'activation' + actorActivations % 3; // Will evaluate to 0, 1 or 2

  rect.width = bounds.stopx - bounds.startx;
  rect.height = verticalPos - bounds.starty;
  drawRect(g, rect);
};
/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the list of actors
 * @param description The text in the box
 */

var drawLoop = function drawLoop(elem, bounds, labelText, conf) {
  var g = elem.append('g');

  var drawLoopLine = function drawLoopLine(startx, starty, stopx, stopy) {
    return g.append('line').attr('x1', startx).attr('y1', starty).attr('x2', stopx).attr('y2', stopy).attr('class', 'loopLine');
  };

  drawLoopLine(bounds.startx, bounds.starty, bounds.stopx, bounds.starty);
  drawLoopLine(bounds.stopx, bounds.starty, bounds.stopx, bounds.stopy);
  drawLoopLine(bounds.startx, bounds.stopy, bounds.stopx, bounds.stopy);
  drawLoopLine(bounds.startx, bounds.starty, bounds.startx, bounds.stopy);

  if (typeof bounds.sections !== 'undefined') {
    bounds.sections.forEach(function (item) {
      drawLoopLine(bounds.startx, item, bounds.stopx, item).style('stroke-dasharray', '3, 3');
    });
  }

  var txt = getTextObj();
  txt.text = labelText;
  txt.x = bounds.startx;
  txt.y = bounds.starty;
  txt.labelMargin = 1.5 * 10; // This is the small box that says "loop"

  txt.class = 'labelText'; // Its size & position are fixed.

  drawLabel(g, txt);
  txt = getTextObj();
  txt.text = '[ ' + bounds.title + ' ]';
  txt.x = bounds.startx + (bounds.stopx - bounds.startx) / 2;
  txt.y = bounds.starty + 1.5 * conf.boxMargin;
  txt.anchor = 'middle';
  txt.class = 'loopText';
  drawText(g, txt);

  if (typeof bounds.sectionTitles !== 'undefined') {
    bounds.sectionTitles.forEach(function (item, idx) {
      if (item !== '') {
        txt.text = '[ ' + item + ' ]';
        txt.y = bounds.sections[idx] + 1.5 * conf.boxMargin;
        drawText(g, txt);
      }
    });
  }
};
/**
 * Draws a background rectangle
 * @param color - The fill color for the background
 */

var drawBackgroundRect = function drawBackgroundRect(elem, bounds) {
  var rectElem = drawRect(elem, {
    x: bounds.startx,
    y: bounds.starty,
    width: bounds.stopx - bounds.startx,
    height: bounds.stopy - bounds.starty,
    fill: bounds.fill,
    class: 'rect'
  });
  rectElem.lower();
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

var insertArrowHead = function insertArrowHead(elem) {
  elem.append('defs').append('marker').attr('id', 'arrowhead').attr('refX', 5).attr('refY', 2).attr('markerWidth', 6).attr('markerHeight', 4).attr('orient', 'auto').append('path').attr('d', 'M 0,0 V 4 L6,2 Z'); // this is actual shape for arrowhead
};
/**
 * Setup node number. The result is appended to the svg.
 */

var insertSequenceNumber = function insertSequenceNumber(elem) {
  elem.append('defs').append('marker').attr('id', 'sequencenumber').attr('refX', 15).attr('refY', 15).attr('markerWidth', 60).attr('markerHeight', 40).attr('orient', 'auto').append('circle').attr('cx', 15).attr('cy', 15).attr('r', 6); // .style("fill", '#f00');
};
/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

var insertArrowCrossHead = function insertArrowCrossHead(elem) {
  var defs = elem.append('defs');
  var marker = defs.append('marker').attr('id', 'crosshead').attr('markerWidth', 15).attr('markerHeight', 8).attr('orient', 'auto').attr('refX', 16).attr('refY', 4); // The arrow

  marker.append('path').attr('fill', 'black').attr('stroke', '#000000').style('stroke-dasharray', '0, 0').attr('stroke-width', '1px').attr('d', 'M 9,2 V 6 L16,4 Z'); // The cross

  marker.append('path').attr('fill', 'none').attr('stroke', '#000000').style('stroke-dasharray', '0, 0').attr('stroke-width', '1px').attr('d', 'M 0,1 L 6,7 M 6,1 L 0,7'); // this is actual shape for arrowhead
};
var getTextObj = function getTextObj() {
  var txt = {
    x: 0,
    y: 0,
    fill: undefined,
    'text-anchor': 'start',
    style: '#666',
    width: 100,
    height: 100,
    textMargin: 0,
    rx: 0,
    ry: 0
  };
  return txt;
};
var getNoteRect = function getNoteRect() {
  var rect = {
    x: 0,
    y: 0,
    fill: '#EDF2AE',
    stroke: '#666',
    width: 100,
    anchor: 'start',
    height: 100,
    rx: 0,
    ry: 0
  };
  return rect;
};

var _drawTextCandidateFunc = function () {
  function byText(content, g, x, y, width, height, textAttrs) {
    var text = g.append('text').attr('x', x + width / 2).attr('y', y + height / 2 + 5).style('text-anchor', 'middle').text(content);

    _setTextAttrs(text, textAttrs);
  }

  function byTspan(content, g, x, y, width, height, textAttrs, conf) {
    var actorFontSize = conf.actorFontSize,
        actorFontFamily = conf.actorFontFamily;
    var lines = content.split(/<br\/?>/gi);

    for (var i = 0; i < lines.length; i++) {
      var dy = i * actorFontSize - actorFontSize * (lines.length - 1) / 2;
      var text = g.append('text').attr('x', x + width / 2).attr('y', y).style('text-anchor', 'middle').style('font-size', actorFontSize).style('font-family', actorFontFamily);
      text.append('tspan').attr('x', x + width / 2).attr('dy', dy).text(lines[i]);
      text.attr('y', y + height / 2.0).attr('dominant-baseline', 'central').attr('alignment-baseline', 'central');

      _setTextAttrs(text, textAttrs);
    }
  }

  function byFo(content, g, x, y, width, height, textAttrs, conf) {
    var s = g.append('switch');
    var f = s.append('foreignObject').attr('x', x).attr('y', y).attr('width', width).attr('height', height);
    var text = f.append('div').style('display', 'table').style('height', '100%').style('width', '100%');
    text.append('div').style('display', 'table-cell').style('text-align', 'center').style('vertical-align', 'middle').text(content);
    byTspan(content, s, x, y, width, height, textAttrs, conf);

    _setTextAttrs(text, textAttrs);
  }

  function _setTextAttrs(toText, fromTextAttrsDict) {
    for (var key in fromTextAttrsDict) {
      if (fromTextAttrsDict.hasOwnProperty(key)) {
        // eslint-disable-line
        toText.attr(key, fromTextAttrsDict[key]);
      }
    }
  }

  return function (conf) {
    return conf.textPlacement === 'fo' ? byFo : conf.textPlacement === 'old' ? byText : byTspan;
  };
}();

/* harmony default export */ __webpack_exports__["default"] = ({
  drawRect: drawRect,
  drawText: drawText,
  drawLabel: drawLabel,
  drawActor: drawActor,
  anchorElement: anchorElement,
  drawActivation: drawActivation,
  drawLoop: drawLoop,
  drawBackgroundRect: drawBackgroundRect,
  insertArrowHead: insertArrowHead,
  insertSequenceNumber: insertSequenceNumber,
  insertArrowCrossHead: insertArrowCrossHead,
  getTextObj: getTextObj,
  getNoteRect: getNoteRect
});

/***/ }),

/***/ "./src/diagrams/state/id-cache.js":
/*!****************************************!*\
  !*** ./src/diagrams/state/id-cache.js ***!
  \****************************************/
/*! exports provided: set, get, keys, size, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "set", function() { return set; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "keys", function() { return keys; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "size", function() { return size; });
var idCache = {};
var set = function set(key, val) {
  idCache[key] = val;
};
var get = function get(k) {
  return idCache[k];
};
var keys = function keys() {
  return Object.keys(idCache);
};
var size = function size() {
  return keys().length;
};
/* harmony default export */ __webpack_exports__["default"] = ({
  get: get,
  set: set,
  keys: keys,
  size: size
});

/***/ }),

/***/ "./src/diagrams/state/parser/stateDiagram.jison":
/*!******************************************************!*\
  !*** ./src/diagrams/state/parser/stateDiagram.jison ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, module) {/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,2],$V1=[1,3],$V2=[1,4],$V3=[2,4],$V4=[1,9],$V5=[1,11],$V6=[1,13],$V7=[1,14],$V8=[1,15],$V9=[1,16],$Va=[1,21],$Vb=[1,17],$Vc=[1,18],$Vd=[1,19],$Ve=[1,20],$Vf=[1,22],$Vg=[1,4,5,13,14,16,18,19,21,22,23,24,25,28],$Vh=[1,4,5,11,12,13,14,16,18,19,21,22,23,24,25,28],$Vi=[4,5,13,14,16,18,19,21,22,23,24,25,28];
var parser = {trace: function trace () { },
yy: {},
symbols_: {"error":2,"start":3,"SPACE":4,"NL":5,"SD":6,"document":7,"line":8,"statement":9,"idStatement":10,"DESCR":11,"-->":12,"HIDE_EMPTY":13,"scale":14,"WIDTH":15,"COMPOSIT_STATE":16,"STRUCT_START":17,"STRUCT_STOP":18,"STATE_DESCR":19,"AS":20,"ID":21,"FORK":22,"JOIN":23,"CONCURRENT":24,"note":25,"notePosition":26,"NOTE_TEXT":27,"EDGE_STATE":28,"left_of":29,"right_of":30,"$accept":0,"$end":1},
terminals_: {2:"error",4:"SPACE",5:"NL",6:"SD",11:"DESCR",12:"-->",13:"HIDE_EMPTY",14:"scale",15:"WIDTH",16:"COMPOSIT_STATE",17:"STRUCT_START",18:"STRUCT_STOP",19:"STATE_DESCR",20:"AS",21:"ID",22:"FORK",23:"JOIN",24:"CONCURRENT",25:"note",27:"NOTE_TEXT",28:"EDGE_STATE",29:"left_of",30:"right_of"},
productions_: [0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,4],[9,4],[10,1],[10,1],[26,1],[26,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 3:
 /*console.warn('Root document', $$[$0]);*/ yy.setRootDoc($$[$0]);return $$[$0]; 
break;
case 4:
 this.$ = [] 
break;
case 5:

        if($$[$0]!='nl'){
            $$[$0-1].push($$[$0]);this.$ = $$[$0-1]
        }
        // console.warn('Got document',$$[$0-1], $$[$0]);
    
break;
case 6: case 7:
 this.$ = $$[$0] 
break;
case 8:
 this.$='nl';
break;
case 9:
 /*console.warn('got id and descr', $$[$0]);*/this.$={ stmt: 'state', id: $$[$0], type: 'default', description: ''};
break;
case 10:
 /*console.warn('got id and descr', $$[$0-1], $$[$0].trim());*/this.$={ stmt: 'state', id: $$[$0-1], type: 'default', description: $$[$0].trim()};
break;
case 11:

        /*console.warn('got id', $$[$0-2]);yy.addRelation($$[$0-2], $$[$0]);*/
        this.$={ stmt: 'relation', state1: { stmt: 'state', id: $$[$0-2], type: 'default', description: '' }, state2:{ stmt: 'state', id: $$[$0] ,type: 'default', description: ''}};
    
break;
case 12:

        /*yy.addRelation($$[$0-3], $$[$0-1], $$[$0].substr(1).trim());*/
        this.$={ stmt: 'relation', state1: { stmt: 'state', id: $$[$0-3], type: 'default', description: '' }, state2:{ stmt: 'state', id: $$[$0-1] ,type: 'default', description: ''}, description: $$[$0].substr(1).trim()};
    
break;
case 16:


        /* console.warn('Adding document for state without id ', $$[$0-3]);*/
        this.$={ stmt: 'state', id: $$[$0-3], type: 'default', description: '', doc: $$[$0-1] }
    
break;
case 17:

        var id=$$[$0];
        var description = $$[$0-2].trim();
        if($$[$0].match(':')){
            var parts = $$[$0].split(':');
            id=parts[0];
            description = [description, parts[1]];
        }
        this.$={stmt: 'state', id: id, type: 'default', description: description};

    
break;
case 18:

         //console.warn('Adding document for state with id ', $$[$0-3], $$[$0-2]); yy.addDocument($$[$0-3]);
         this.$={ stmt: 'state', id: $$[$0-3], type: 'default', description: $$[$0-5], doc: $$[$0-1] }
    
break;
case 19:

        this.$={ stmt: 'state', id: $$[$0], type: 'fork' }
    
break;
case 20:

        this.$={ stmt: 'state', id: $$[$0], type: 'join' }
    
break;
case 21:

        this.$={ stmt: 'state', id: yy.getDividerId(), type: 'divider' }
    
break;
case 22:

        /*console.warn('got NOTE, position: ', $$[$0-2].trim(), 'id = ', $$[$0-1].trim(), 'note: ', $$[$0]);*/
        this.$={ stmt: 'state', id: $$[$0-1].trim(), note:{position: $$[$0-2].trim(), text: $$[$0].trim()}};
    
break;
case 24: case 25:
this.$=$$[$0];
break;
}
},
table: [{3:1,4:$V0,5:$V1,6:$V2},{1:[3]},{3:5,4:$V0,5:$V1,6:$V2},{3:6,4:$V0,5:$V1,6:$V2},o([1,4,5,13,14,16,19,21,22,23,24,25,28],$V3,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:$V4,5:$V5,8:8,9:10,10:12,13:$V6,14:$V7,16:$V8,19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,5]),{9:23,10:12,13:$V6,14:$V7,16:$V8,19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,7]),o($Vg,[2,8]),o($Vg,[2,9],{11:[1,24],12:[1,25]}),o($Vg,[2,13]),{15:[1,26]},o($Vg,[2,15],{17:[1,27]}),{20:[1,28]},o($Vg,[2,19]),o($Vg,[2,20]),o($Vg,[2,21]),{26:29,27:[1,30],29:[1,31],30:[1,32]},o($Vh,[2,24]),o($Vh,[2,25]),o($Vg,[2,6]),o($Vg,[2,10]),{10:33,21:$Va,28:$Vf},o($Vg,[2,14]),o($Vi,$V3,{7:34}),{21:[1,35]},{21:[1,36]},{20:[1,37]},{21:[2,26]},{21:[2,27]},o($Vg,[2,11],{11:[1,38]}),{4:$V4,5:$V5,8:8,9:10,10:12,13:$V6,14:$V7,16:$V8,18:[1,39],19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,17],{17:[1,40]}),{27:[1,41]},{21:[1,42]},o($Vg,[2,12]),o($Vg,[2,16]),o($Vi,$V3,{7:43}),o($Vg,[2,22]),o($Vg,[2,23]),{4:$V4,5:$V5,8:8,9:10,10:12,13:$V6,14:$V7,16:$V8,18:[1,44],19:$V9,21:$Va,22:$Vb,23:$Vc,24:$Vd,25:$Ve,28:$Vf},o($Vg,[2,18])],
defaultActions: {5:[2,1],6:[2,2],31:[2,26],32:[2,27]},
parseError: function parseError (str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
            function lex() {
            var token;
            token = tstack.pop() || lexer.lex() || EOF;
            if (typeof token !== 'number') {
                if (token instanceof Array) {
                    tstack = token;
                    token = tstack.pop();
                }
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
            var errStr = '';
            expected = [];
            for (p in table[state]) {
                if (this.terminals_[p] && p > TERROR) {
                    expected.push('\'' + this.terminals_[p] + '\'');
                }
            }
            if (lexer.showPosition) {
                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
            } else {
                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
            }
            this.parseError(errStr, {
                text: lexer.match,
                token: this.terminals_[symbol] || symbol,
                line: lexer.yylineno,
                loc: yyloc,
                expected: expected
            });
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function(match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex () {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin (condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState () {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules () {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState (n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState (condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 5;
break;
case 1:/* skip all whitespace */
break;
case 2:/* skip same-line whitespace */
break;
case 3:/* skip comments */
break;
case 4:/* skip comments */
break;
case 5: this.pushState('SCALE'); /* console.log('Got scale', yy_.yytext);*/ return 14; 
break;
case 6:return 15;
break;
case 7:this.popState();
break;
case 8: this.pushState('STATE'); 
break;
case 9:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim(); /*console.warn('Fork Fork: ',yy_.yytext);*/return 22;
break;
case 10:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yy_.yytext);*/return 23;
break;
case 11:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim();/*console.warn('Fork Fork: ',yy_.yytext);*/return 22;
break;
case 12:this.popState();yy_.yytext=yy_.yytext.slice(0,-8).trim();/*console.warn('Fork Join: ',yy_.yytext);*/return 23;
break;
case 13:this.begin("STATE_STRING");
break;
case 14:this.popState();this.pushState('STATE_ID');return "AS";
break;
case 15:this.popState();/* console.log('STATE_ID', yy_.yytext);*/return "ID";
break;
case 16:this.popState();
break;
case 17: /*console.log('Long description:', yy_.yytext);*/return "STATE_DESCR";
break;
case 18:/*console.log('COMPOSIT_STATE', yy_.yytext);*/return 16;
break;
case 19:this.popState();
break;
case 20:this.popState();this.pushState('struct'); /*console.log('begin struct', yy_.yytext);*/return 17;
break;
case 21: /*console.log('Ending struct');*/ this.popState(); return 18;
break;
case 22:/* nothing */
break;
case 23: this.begin('NOTE'); return 25; 
break;
case 24: this.popState();this.pushState('NOTE_ID');return 29;
break;
case 25: this.popState();this.pushState('NOTE_ID');return 30;
break;
case 26: this.popState();this.pushState('FLOATING_NOTE');
break;
case 27:this.popState();this.pushState('FLOATING_NOTE_ID');return "AS";
break;
case 28:/**/
break;
case 29: /*console.log('Floating note text: ', yy_.yytext);*/return "NOTE_TEXT";
break;
case 30:this.popState();/*console.log('Floating note ID', yy_.yytext);*/return "ID";
break;
case 31: this.popState();this.pushState('NOTE_TEXT');/*console.log('Got ID for note', yy_.yytext);*/return 21;
break;
case 32: this.popState();/*console.log('Got NOTE_TEXT for note',yy_.yytext);*/yy_.yytext = yy_.yytext.substr(2).trim();return 27;
break;
case 33: this.popState();/*console.log('Got NOTE_TEXT for note',yy_.yytext);*/yy_.yytext = yy_.yytext.slice(0,-8).trim();return 27;
break;
case 34: /*console.log('Got state diagram', yy_.yytext,'#');*/return 6; 
break;
case 35: /*console.log('HIDE_EMPTY', yy_.yytext,'#');*/return 13; 
break;
case 36: /*console.log('EDGE_STATE=',yy_.yytext);*/ return 28;
break;
case 37: /*console.log('=>ID=',yy_.yytext);*/ return 21;
break;
case 38: yy_.yytext = yy_.yytext.trim(); /*console.log('Descr = ', yy_.yytext);*/ return 11; 
break;
case 39:return 12;
break;
case 40:return 24;
break;
case 41:return 5;
break;
case 42:return 'INVALID';
break;
}
},
rules: [/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:["])/i,/^(?:as\s*)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:\s*[^:;]+end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"LINE":{"rules":[2,3],"inclusive":false},"struct":{"rules":[2,3,8,21,22,23,36,37,38,39,40],"inclusive":false},"FLOATING_NOTE_ID":{"rules":[30],"inclusive":false},"FLOATING_NOTE":{"rules":[27,28,29],"inclusive":false},"NOTE_TEXT":{"rules":[32,33],"inclusive":false},"NOTE_ID":{"rules":[31],"inclusive":false},"NOTE":{"rules":[24,25,26],"inclusive":false},"SCALE":{"rules":[6,7],"inclusive":false},"ALIAS":{"rules":[],"inclusive":false},"STATE_ID":{"rules":[15],"inclusive":false},"STATE_STRING":{"rules":[16,17],"inclusive":false},"FORK_STATE":{"rules":[],"inclusive":false},"STATE":{"rules":[2,3,9,10,11,12,13,14,18,19,20],"inclusive":false},"ID":{"rules":[2,3],"inclusive":false},"INITIAL":{"rules":[0,1,3,4,5,8,20,23,34,35,36,37,38,39,41,42],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (true) {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain (args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = __webpack_require__(/*! fs */ "./node_modules/node-libs-browser/mock/empty.js").readFileSync(__webpack_require__(/*! path */ "./node_modules/path-browserify/index.js").normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if ( true && __webpack_require__.c[__webpack_require__.s] === module) {
  exports.main(process.argv.slice(1));
}
}
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../../../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./src/diagrams/state/shapes.js":
/*!**************************************!*\
  !*** ./src/diagrams/state/shapes.js ***!
  \**************************************/
/*! exports provided: drawStartState, drawDivider, drawSimpleState, drawDescrState, addTitleAndBox, drawText, drawNote, drawState, drawEdge */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawStartState", function() { return drawStartState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawDivider", function() { return drawDivider; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawSimpleState", function() { return drawSimpleState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawDescrState", function() { return drawDescrState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addTitleAndBox", function() { return addTitleAndBox; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawText", function() { return drawText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawNote", function() { return drawNote; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawState", function() { return drawState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "drawEdge", function() { return drawEdge; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _id_cache_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./id-cache.js */ "./src/diagrams/state/id-cache.js");
/* harmony import */ var _stateDb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../config */ "./src/config.js");




 // let conf;

/**
 * Draws a start state as a black circle
 */

var drawStartState = function drawStartState(g) {
  return g.append('circle').style('stroke', 'black').style('fill', 'black').attr('r', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit).attr('cx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit).attr('cy', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit);
};
/**
 * Draws a start state as a black circle
 */

var drawDivider = function drawDivider(g) {
  return g.append('line').style('stroke', 'grey').style('stroke-dasharray', '3').attr('x1', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight).attr('class', 'divider').attr('x2', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight * 2).attr('y1', 0).attr('y2', 0);
};
/**
 * Draws a an end state as a black circle
 */

var drawSimpleState = function drawSimpleState(g, stateDef) {
  var state = g.append('text').attr('x', 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('font-size', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.fontSize).attr('class', 'state-title').text(stateDef.id);
  var classBox = state.node().getBBox();
  g.insert('rect', ':first-child').attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('width', classBox.width + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('height', classBox.height + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.radius);
  return state;
};
/**
 * Draws a state with descriptions
 * @param {*} g
 * @param {*} stateDef
 */

var drawDescrState = function drawDescrState(g, stateDef) {
  var addTspan = function addTspan(textEl, txt, isFirst) {
    var tSpan = textEl.append('tspan').attr('x', 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).text(txt);

    if (!isFirst) {
      tSpan.attr('dy', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight);
    }
  };

  var title = g.append('text').attr('x', 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight + 1.3 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('font-size', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.fontSize).attr('class', 'state-title').text(stateDef.descriptions[0]);
  var titleBox = title.node().getBBox();
  var titleHeight = titleBox.height;
  var description = g.append('text') // text label for the x axis
  .attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y', titleHeight + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding * 0.4 + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.dividerMargin + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight).attr('class', 'state-description');
  var isFirst = true;
  var isSecond = true;
  stateDef.descriptions.forEach(function (descr) {
    if (!isFirst) {
      addTspan(description, descr, isSecond);
      isSecond = false;
    }

    isFirst = false;
  });
  var descrLine = g.append('line') // text label for the x axis
  .attr('x1', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y1', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + titleHeight + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.dividerMargin / 2).attr('y2', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + titleHeight + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.dividerMargin / 2).attr('class', 'descr-divider');
  var descrBox = description.node().getBBox();
  var width = Math.max(descrBox.width, titleBox.width);
  descrLine.attr('x2', width + 3 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding); // const classBox = title.node().getBBox();

  g.insert('rect', ':first-child').attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('width', width + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('height', descrBox.height + titleHeight + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.radius);
  return g;
};
/**
 * Adds the creates a box around the existing content and adds a
 * panel for the id on top of the content.
 */

/**
 * Function that creates an title row and a frame around a substate for a composit state diagram.
 * The function returns a new d3 svg object with updated width and height properties;
 * @param {*} g The d3 svg object for the substate to framed
 * @param {*} stateDef The info about the
 */

var addTitleAndBox = function addTitleAndBox(g, stateDef, altBkg) {
  var pad = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding;
  var dblPad = 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding;
  var orgBox = g.node().getBBox();
  var orgWidth = orgBox.width;
  var orgX = orgBox.x;
  var title = g.append('text').attr('x', 0).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.titleShift).attr('font-size', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.fontSize).attr('class', 'state-title').text(stateDef.id);
  var titleBox = title.node().getBBox();
  var titleWidth = titleBox.width + dblPad;
  var width = Math.max(titleWidth, orgWidth); // + dblPad;

  if (width === orgWidth) {
    width = width + dblPad;
  }

  var startX; // const lineY = 1 - getConfig().state.textHeight;
  // const descrLine = g
  //   .append('line') // text label for the x axis
  //   .attr('x1', 0)
  //   .attr('y1', lineY)
  //   .attr('y2', lineY)
  //   .attr('class', 'descr-divider');

  var graphBox = g.node().getBBox(); // console.warn(width / 2, titleWidth / 2, getConfig().state.padding, orgBox);
  // descrLine.attr('x2', graphBox.width + getConfig().state.padding);

  if (stateDef.doc) {// cnsole.warn(
    //   stateDef.id,
    //   'orgX: ',
    //   orgX,
    //   'width: ',
    //   width,
    //   'titleWidth: ',
    //   titleWidth,
    //   'orgWidth: ',
    //   orgWidth,
    //   'width',
    //   width
    // );
  }

  startX = orgX - pad;

  if (titleWidth > orgWidth) {
    startX = (orgWidth - width) / 2 + pad;
  }

  if (Math.abs(orgX - graphBox.x) < pad) {
    if (titleWidth > orgWidth) {
      startX = orgX - (titleWidth - orgWidth) / 2;
    }
  }

  var lineY = 1 - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight; // White color

  g.insert('rect', ':first-child').attr('x', startX).attr('y', lineY).attr('class', altBkg ? 'alt-composit' : 'composit').attr('width', width).attr('height', graphBox.height + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.titleShift + 1).attr('rx', '0');
  title.attr('x', startX + pad);
  if (titleWidth <= orgWidth) title.attr('x', orgX + (width - dblPad) / 2 - titleWidth / 2 + pad); // Title background

  g.insert('rect', ':first-child').attr('x', startX).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.titleShift - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('width', width) // Just needs to be higher then the descr line, will be clipped by the white color box
  .attr('height', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight * 3).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.radius); // Full background

  g.insert('rect', ':first-child').attr('x', startX).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.titleShift - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('width', width).attr('height', graphBox.height + 3 + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.textHeight).attr('rx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.radius);
  return g;
};

var drawEndState = function drawEndState(g) {
  g.append('circle').style('stroke', 'black').style('fill', 'white').attr('r', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.miniPadding).attr('cx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.miniPadding).attr('cy', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.miniPadding);
  return g.append('circle').style('stroke', 'black').style('fill', 'black').attr('r', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit).attr('cx', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit + 2).attr('cy', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.sizeUnit + 2);
};

var drawForkJoinState = function drawForkJoinState(g, stateDef) {
  var width = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.forkWidth;
  var height = Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.forkHeight;

  if (stateDef.parentId) {
    var tmp = width;
    width = height;
    height = tmp;
  }

  return g.append('rect').style('stroke', 'black').style('fill', 'black').attr('width', width).attr('height', height).attr('x', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding);
};

var drawText = function drawText(elem, textData) {
  // Remove and ignore br:s
  var nText = textData.text.replace(/<br\/?>/gi, ' ');
  var textElem = elem.append('text');
  textElem.attr('x', textData.x);
  textElem.attr('y', textData.y);
  textElem.style('text-anchor', textData.anchor);
  textElem.attr('fill', textData.fill);

  if (typeof textData.class !== 'undefined') {
    textElem.attr('class', textData.class);
  }

  var span = textElem.append('tspan');
  span.attr('x', textData.x + textData.textMargin * 2);
  span.attr('fill', textData.fill);
  span.text(nText);
  return textElem;
};

var _drawLongText = function _drawLongText(_text, x, y, g) {
  var textHeight = 0;
  var textElem = g.append('text');
  textElem.style('text-anchor', 'start');
  textElem.attr('class', 'noteText');

  var text = _text.replace(/\r\n/g, '<br/>');

  text = text.replace(/\n/g, '<br/>');
  var lines = text.split(/<br\/?>/gi);
  var tHeight = 1.25 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.noteMargin;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var line = _step.value;
      var txt = line.trim();

      if (txt.length > 0) {
        var span = textElem.append('tspan');
        span.text(txt);

        if (tHeight === 0) {
          var textBounds = span.node().getBBox();
          tHeight += textBounds.height;
        } // console.warn('textBounds', textBounds);


        textHeight += tHeight;
        span.attr('x', x + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.noteMargin);
        span.attr('y', y + textHeight + 1.25 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.noteMargin);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    textWidth: textElem.node().getBBox().width,
    textHeight: textHeight
  };
};
/**
 * Draws an actor in the diagram with the attaced line
 * @param center - The center of the the actor
 * @param pos The position if the actor in the liost of actors
 * @param description The text in the box
 */


var drawNote = function drawNote(text, g) {
  g.attr('class', 'state-note');
  var note = g.append('rect').attr('x', 0).attr('y', Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding);
  var rectElem = g.append('g');

  var _drawLongText2 = _drawLongText(text, 0, 0, rectElem),
      textWidth = _drawLongText2.textWidth,
      textHeight = _drawLongText2.textHeight;

  note.attr('height', textHeight + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.noteMargin);
  note.attr('width', textWidth + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.noteMargin * 2);
  return note;
};
/**
 * Starting point for drawing a state. The function finds out the specifics
 * about the state and renders with approprtiate function.
 * @param {*} elem
 * @param {*} stateDef
 */

var drawState = function drawState(elem, stateDef) {
  var id = stateDef.id;
  var stateInfo = {
    id: id,
    label: stateDef.id,
    width: 0,
    height: 0
  };
  var g = elem.append('g').attr('id', id).attr('class', 'stateGroup');
  if (stateDef.type === 'start') drawStartState(g);
  if (stateDef.type === 'end') drawEndState(g);
  if (stateDef.type === 'fork' || stateDef.type === 'join') drawForkJoinState(g, stateDef);
  if (stateDef.type === 'note') drawNote(stateDef.note.text, g);
  if (stateDef.type === 'divider') drawDivider(g);
  if (stateDef.type === 'default' && stateDef.descriptions.length === 0) drawSimpleState(g, stateDef);
  if (stateDef.type === 'default' && stateDef.descriptions.length > 0) drawDescrState(g, stateDef);
  var stateBox = g.node().getBBox();
  stateInfo.width = stateBox.width + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding;
  stateInfo.height = stateBox.height + 2 * Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding;
  _id_cache_js__WEBPACK_IMPORTED_MODULE_1__["default"].set(id, stateInfo); // stateCnt++;

  return stateInfo;
};

var getRows = function getRows(s) {
  var str = s.replace(/<br\/?>/gi, '#br#');
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

var edgeCount = 0;
var drawEdge = function drawEdge(elem, path, relation) {
  var getRelationType = function getRelationType(type) {
    switch (type) {
      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.AGGREGATION:
        return 'aggregation';

      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.EXTENSION:
        return 'extension';

      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.COMPOSITION:
        return 'composition';

      case _stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.DEPENDENCY:
        return 'dependency';
    }
  };

  path.points = path.points.filter(function (p) {
    return !Number.isNaN(p.y);
  }); // The data for our line

  var lineData = path.points; // This is the accessor function we talked about above

  var lineFunction = d3__WEBPACK_IMPORTED_MODULE_0__["line"]().x(function (d) {
    return d.x;
  }).y(function (d) {
    return d.y;
  }).curve(d3__WEBPACK_IMPORTED_MODULE_0__["curveBasis"]);
  var svgPath = elem.append('path').attr('d', lineFunction(lineData)).attr('id', 'edge' + edgeCount).attr('class', 'transition');
  var url = '';

  if (Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.arrowMarkerAbsolute) {
    url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search;
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
  }

  svgPath.attr('marker-end', 'url(' + url + '#' + getRelationType(_stateDb__WEBPACK_IMPORTED_MODULE_2__["default"].relationType.DEPENDENCY) + 'End' + ')');

  if (typeof relation.title !== 'undefined') {
    var label = elem.append('g').attr('class', 'stateLabel');

    var _utils$calcLabelPosit = _utils__WEBPACK_IMPORTED_MODULE_3__["default"].calcLabelPosition(path.points),
        x = _utils$calcLabelPosit.x,
        y = _utils$calcLabelPosit.y;

    var rows = getRows(relation.title); // console.warn(rows);

    var titleHeight = 0;
    var titleRows = [];

    for (var i = 0; i <= rows.length; i++) {
      var title = label.append('text').attr('text-anchor', 'middle').text(rows[i]).attr('x', x).attr('y', y + titleHeight);

      if (titleHeight === 0) {
        var titleBox = title.node().getBBox();
        titleHeight = titleBox.height;
      }

      titleRows.push(title);
    }

    if (rows.length > 1) {
      var heightAdj = rows.length * titleHeight * 0.25;
      titleRows.forEach(function (title, i) {
        return title.attr('y', y + i * titleHeight - heightAdj);
      });
    }

    var bounds = label.node().getBBox();
    label.insert('rect', ':first-child').attr('class', 'box').attr('x', bounds.x - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding / 2).attr('y', bounds.y - Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding / 2).attr('width', bounds.width + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding).attr('height', bounds.height + Object(_config__WEBPACK_IMPORTED_MODULE_4__["getConfig"])().state.padding); //label.attr('transform', '0 -' + (bounds.y / 2));
    // Debug points
    // path.points.forEach(point => {
    //   g.append('circle')
    //     .style('stroke', 'red')
    //     .style('fill', 'red')
    //     .attr('r', 1)
    //     .attr('cx', point.x)
    //     .attr('cy', point.y);
    // });
    // g.append('circle')
    //   .style('stroke', 'blue')
    //   .style('fill', 'blue')
    //   .attr('r', 1)
    //   .attr('cx', x)
    //   .attr('cy', y);
  }

  edgeCount++;
};

/***/ }),

/***/ "./src/diagrams/state/stateDb.js":
/*!***************************************!*\
  !*** ./src/diagrams/state/stateDb.js ***!
  \***************************************/
/*! exports provided: addState, clear, getState, getStates, logDocuments, getRelations, addRelation, cleanupLabel, lineType, relationType, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addState", function() { return addState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clear", function() { return clear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getState", function() { return getState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getStates", function() { return getStates; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "logDocuments", function() { return logDocuments; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getRelations", function() { return getRelations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addRelation", function() { return addRelation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "cleanupLabel", function() { return cleanupLabel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "lineType", function() { return lineType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "relationType", function() { return relationType; });
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


var rootDoc = [];

var setRootDoc = function setRootDoc(o) {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Setting root doc', o);
  rootDoc = o;
};

var getRootDoc = function getRootDoc() {
  return rootDoc;
};

var extract = function extract(doc) {
  // const res = { states: [], relations: [] };
  clear();
  doc.forEach(function (item) {
    if (item.stmt === 'state') {
      addState(item.id, item.type, item.doc, item.description, item.note);
    }

    if (item.stmt === 'relation') {
      addRelation(item.state1.id, item.state2.id, item.description);
    }
  });
};

var newDoc = function newDoc() {
  return {
    relations: [],
    states: {},
    documents: {}
  };
};

var documents = {
  root: newDoc()
};
var currentDocument = documents.root;
var startCnt = 0;
var endCnt = 0; // eslint-disable-line
// let stateCnt = 0;

/**
 * Function called by parser when a node definition has been found.
 * @param id
 * @param text
 * @param type
 * @param style
 */

var addState = function addState(id, type, doc, descr, note) {
  if (typeof currentDocument.states[id] === 'undefined') {
    currentDocument.states[id] = {
      id: id,
      descriptions: [],
      type: type,
      doc: doc,
      note: note
    };
  } else {
    if (!currentDocument.states[id].doc) {
      currentDocument.states[id].doc = doc;
    }

    if (!currentDocument.states[id].type) {
      currentDocument.states[id].type = type;
    }
  }

  if (descr) {
    if (typeof descr === 'string') addDescription(id, descr.trim());

    if (_typeof(descr) === 'object') {
      descr.forEach(function (des) {
        return addDescription(id, des.trim());
      });
    }
  }

  if (note) currentDocument.states[id].note = note;
};
var clear = function clear() {
  documents = {
    root: newDoc()
  };
  currentDocument = documents.root;
};
var getState = function getState(id) {
  return currentDocument.states[id];
};
var getStates = function getStates() {
  return currentDocument.states;
};
var logDocuments = function logDocuments() {
  _logger__WEBPACK_IMPORTED_MODULE_0__["logger"].info('Documents = ', documents);
};
var getRelations = function getRelations() {
  return currentDocument.relations;
};
var addRelation = function addRelation(_id1, _id2, title) {
  var id1 = _id1;
  var id2 = _id2;
  var type1 = 'default';
  var type2 = 'default';

  if (_id1 === '[*]') {
    startCnt++;
    id1 = 'start' + startCnt;
    type1 = 'start';
  }

  if (_id2 === '[*]') {
    endCnt++;
    id2 = 'end' + startCnt;
    type2 = 'end';
  }

  addState(id1, type1);
  addState(id2, type2);
  currentDocument.relations.push({
    id1: id1,
    id2: id2,
    title: title
  });
};

var addDescription = function addDescription(id, _descr) {
  var theState = currentDocument.states[id];
  var descr = _descr;

  if (descr[0] === ':') {
    descr = descr.substr(1).trim();
  }

  theState.descriptions.push(descr);
};

var cleanupLabel = function cleanupLabel(label) {
  if (label.substring(0, 1) === ':') {
    return label.substr(2).trim();
  } else {
    return label.trim();
  }
};
var lineType = {
  LINE: 0,
  DOTTED_LINE: 1
};
var dividerCnt = 0;

var getDividerId = function getDividerId() {
  dividerCnt++;
  return 'divider-id-' + dividerCnt;
};

var relationType = {
  AGGREGATION: 0,
  EXTENSION: 1,
  COMPOSITION: 2,
  DEPENDENCY: 3
};
/* harmony default export */ __webpack_exports__["default"] = ({
  addState: addState,
  clear: clear,
  getState: getState,
  getStates: getStates,
  getRelations: getRelations,
  addRelation: addRelation,
  getDividerId: getDividerId,
  // addDescription,
  cleanupLabel: cleanupLabel,
  lineType: lineType,
  relationType: relationType,
  logDocuments: logDocuments,
  getRootDoc: getRootDoc,
  setRootDoc: setRootDoc,
  extract: extract
});

/***/ }),

/***/ "./src/diagrams/state/stateRenderer.js":
/*!*********************************************!*\
  !*** ./src/diagrams/state/stateRenderer.js ***!
  \*********************************************/
/*! exports provided: setConf, draw, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setConf", function() { return setConf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "draw", function() { return draw; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! dagre */ "dagre");
/* harmony import */ var dagre__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(dagre__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! graphlib */ "graphlib");
/* harmony import */ var graphlib__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(graphlib__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../logger */ "./src/logger.js");
/* harmony import */ var _stateDb__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./parser/stateDiagram */ "./src/diagrams/state/parser/stateDiagram.jison");
/* harmony import */ var _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./shapes */ "./src/diagrams/state/shapes.js");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../config */ "./src/config.js");





 // import idCache from './id-cache';



_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_5__["parser"].yy = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"]; // TODO Move conf object to main conf in mermaidAPI

var conf;
var transformationLog = {};
var setConf = function setConf() {}; // Todo optimize

/**
 * Setup arrow head and define the marker. The result is appended to the svg.
 */

var insertMarkers = function insertMarkers(elem) {
  elem.append('defs').append('marker').attr('id', 'dependencyEnd').attr('refX', 19).attr('refY', 7).attr('markerWidth', 20).attr('markerHeight', 28).attr('orient', 'auto').append('path').attr('d', 'M 19,7 L9,13 L14,7 L9,1 Z');
};
/**
 * Draws a flowchart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */


var draw = function draw(text, id) {
  conf = Object(_config__WEBPACK_IMPORTED_MODULE_7__["getConfig"])().state;
  _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_5__["parser"].yy.clear();
  _parser_stateDiagram__WEBPACK_IMPORTED_MODULE_5__["parser"].parse(text);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Rendering diagram ' + text); // Fetch the default direction, use TD if none was found

  var diagram = d3__WEBPACK_IMPORTED_MODULE_0__["select"]("[id='".concat(id, "']"));
  insertMarkers(diagram); // Layout graph, Create a new directed graph

  var graph = new graphlib__WEBPACK_IMPORTED_MODULE_2___default.a.Graph({
    multigraph: false,
    compound: true,
    // acyclicer: 'greedy',
    rankdir: 'RL' // ranksep: '20'

  }); // Default to assigning a new object as a label for each new edge.

  graph.setDefaultEdgeLabel(function () {
    return {};
  });
  var rootDoc = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].getRootDoc();
  renderDoc(rootDoc, diagram, undefined, false);
  var padding = conf.padding;
  var bounds = diagram.node().getBBox();
  var width = bounds.width + padding * 2;
  var height = bounds.height + padding * 2; // diagram.attr('height', '100%');
  // diagram.attr('style', `width: ${bounds.width * 3 + conf.padding * 2};`);
  // diagram.attr('height', height);
  // Zoom in a bit

  diagram.attr('width', width * 1.75); // diagram.attr('height', bounds.height * 3 + conf.padding * 2);

  diagram.attr('viewBox', "".concat(bounds.x - conf.padding, "  ").concat(bounds.y - conf.padding, " ") + width + ' ' + height); // diagram.attr('transform', `translate(, 0)`);
  // diagram.attr(
  //   'viewBox',
  //   `${conf.padding * -1} ${conf.padding * -1} ` +
  //     (bounds.width * 1.5 + conf.padding * 2) +
  //     ' ' +
  //     (bounds.height + conf.padding * 5)
  // );
};

var getLabelWidth = function getLabelWidth(text) {
  return text ? text.length * conf.fontSizeFactor : 1;
};
/* TODO: REMOVE DUPLICATION, SEE SHAPES */


var getRows = function getRows(s) {
  if (!s) return 1;
  var str = s.replace(/<br\/?>/gi, '#br#');
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

var renderDoc = function renderDoc(doc, diagram, parentId, altBkg) {
  // // Layout graph, Create a new directed graph
  var graph = new graphlib__WEBPACK_IMPORTED_MODULE_2___default.a.Graph({
    compound: true
  });
  var i;
  var edgeFreeDoc = true;

  for (i = 0; i < doc.length; i++) {
    if (doc[i].stmt === 'relation') {
      edgeFreeDoc = false;
      break;
    }
  } // Set an object for the graph label


  if (parentId) graph.setGraph({
    rankdir: 'LR',
    // multigraph: false,
    compound: true,
    // acyclicer: 'greedy',
    ranker: 'tight-tree',
    ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
    nodeSep: edgeFreeDoc ? 1 : 50 // isMultiGraph: false
    // ranksep: 5,
    // nodesep: 1

  });else {
    graph.setGraph({
      rankdir: 'TB',
      compound: true,
      // isCompound: true,
      // acyclicer: 'greedy',
      // ranker: 'longest-path'
      ranksep: edgeFreeDoc ? 1 : conf.edgeLengthFactor,
      nodeSep: edgeFreeDoc ? 1 : 50,
      ranker: 'tight-tree' // ranker: 'network-simplex'
      // isMultiGraph: false

    });
  } // Default to assigning a new object as a label for each new edge.

  graph.setDefaultEdgeLabel(function () {
    return {};
  });
  _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].extract(doc);
  var states = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].getStates();
  var relations = _stateDb__WEBPACK_IMPORTED_MODULE_4__["default"].getRelations();
  var keys = Object.keys(states);
  var first = true;

  for (var _i = 0; _i < keys.length; _i++) {
    var stateDef = states[keys[_i]];

    if (parentId) {
      stateDef.parentId = parentId;
    }

    var node = void 0;

    if (stateDef.doc) {
      var sub = diagram.append('g').attr('id', stateDef.id).attr('class', 'stateGroup');
      node = renderDoc(stateDef.doc, sub, stateDef.id, !altBkg);

      if (first) {
        // first = false;
        sub = Object(_shapes__WEBPACK_IMPORTED_MODULE_6__["addTitleAndBox"])(sub, stateDef, altBkg);
        var boxBounds = sub.node().getBBox();
        node.width = boxBounds.width;
        node.height = boxBounds.height + conf.padding / 2;
        transformationLog[stateDef.id] = {
          y: conf.compositTitleSize
        };
      } else {
        // sub = addIdAndBox(sub, stateDef);
        var _boxBounds = sub.node().getBBox();

        node.width = _boxBounds.width;
        node.height = _boxBounds.height; // transformationLog[stateDef.id] = { y: conf.compositTitleSize };
      }
    } else {
      node = Object(_shapes__WEBPACK_IMPORTED_MODULE_6__["drawState"])(diagram, stateDef, graph);
    }

    if (stateDef.note) {
      // Draw note note
      var noteDef = {
        descriptions: [],
        id: stateDef.id + '-note',
        note: stateDef.note,
        type: 'note'
      };
      var note = Object(_shapes__WEBPACK_IMPORTED_MODULE_6__["drawState"])(diagram, noteDef, graph); // graph.setNode(node.id, node);

      if (stateDef.note.position === 'left of') {
        graph.setNode(node.id + '-note', note);
        graph.setNode(node.id, node);
      } else {
        graph.setNode(node.id, node);
        graph.setNode(node.id + '-note', note);
      } // graph.setNode(node.id);


      graph.setParent(node.id, node.id + '-group');
      graph.setParent(node.id + '-note', node.id + '-group');
    } else {
      // Add nodes to the graph. The first argument is the node id. The second is
      // metadata about the node. In this case we're going to add labels to each of
      // our nodes.
      graph.setNode(node.id, node);
    }
  }

  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Count=', graph.nodeCount());
  relations.forEach(function (relation) {
    graph.setEdge(relation.id1, relation.id2, {
      relation: relation,
      width: getLabelWidth(relation.title),
      height: conf.labelHeight * getRows(relation.title).length,
      labelpos: 'c'
    });
  });
  dagre__WEBPACK_IMPORTED_MODULE_1___default.a.layout(graph);
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Graph after layout', graph.nodes());
  var svgElem = diagram.node();
  graph.nodes().forEach(function (v) {
    if (typeof v !== 'undefined' && typeof graph.node(v) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].warn('Node ' + v + ': ' + JSON.stringify(graph.node(v)));
      d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#' + svgElem.id + ' #' + v).attr('transform', 'translate(' + (graph.node(v).x - graph.node(v).width / 2) + ',' + (graph.node(v).y + (transformationLog[v] ? transformationLog[v].y : 0) - graph.node(v).height / 2) + ' )');
      d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#' + svgElem.id + ' #' + v).attr('data-x-shift', graph.node(v).x - graph.node(v).width / 2);
      var dividers = document.querySelectorAll('#' + svgElem.id + ' #' + v + ' .divider');
      dividers.forEach(function (divider) {
        var parent = divider.parentElement;
        var pWidth = 0;
        var pShift = 0;

        if (parent) {
          if (parent.parentElement) pWidth = parent.parentElement.getBBox().width;
          pShift = parseInt(parent.getAttribute('data-x-shift'), 10);

          if (Number.isNaN(pShift)) {
            pShift = 0;
          }
        }

        divider.setAttribute('x1', 0 - pShift + 8);
        divider.setAttribute('x2', pWidth - pShift - 8);
      });
    } else {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('No Node ' + v + ': ' + JSON.stringify(graph.node(v)));
    }
  });
  var stateBox = svgElem.getBBox();
  graph.edges().forEach(function (e) {
    if (typeof e !== 'undefined' && typeof graph.edge(e) !== 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));
      Object(_shapes__WEBPACK_IMPORTED_MODULE_6__["drawEdge"])(diagram, graph.edge(e), graph.edge(e).relation);
    }
  });
  stateBox = svgElem.getBBox();
  var stateInfo = {
    id: parentId ? parentId : 'root',
    label: parentId ? parentId : 'root',
    width: 0,
    height: 0
  };
  stateInfo.width = stateBox.width + 2 * conf.padding;
  stateInfo.height = stateBox.height + 2 * conf.padding;
  _logger__WEBPACK_IMPORTED_MODULE_3__["logger"].info('Doc rendered', stateInfo, graph);
  return stateInfo;
};

/* harmony default export */ __webpack_exports__["default"] = ({
  setConf: setConf,
  draw: draw
});

/***/ }),

/***/ "./src/logger.js":
/*!***********************!*\
  !*** ./src/logger.js ***!
  \***********************/
/*! exports provided: LEVELS, logger, setLogLevel */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LEVELS", function() { return LEVELS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "logger", function() { return logger; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setLogLevel", function() { return setLogLevel; });
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! moment-mini */ "moment-mini");
/* harmony import */ var moment_mini__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(moment_mini__WEBPACK_IMPORTED_MODULE_0__);

var LEVELS = {
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5
};
var logger = {
  debug: function debug() {},
  info: function info() {},
  warn: function warn() {},
  error: function error() {},
  fatal: function fatal() {}
};
var setLogLevel = function setLogLevel(level) {
  logger.debug = function () {};

  logger.info = function () {};

  logger.warn = function () {};

  logger.error = function () {};

  logger.fatal = function () {};

  if (level <= LEVELS.fatal) {
    logger.fatal = console.log.bind(console, '\x1b[35m', format('FATAL'));
  }

  if (level <= LEVELS.error) {
    logger.error = console.log.bind(console, '\x1b[31m', format('ERROR'));
  }

  if (level <= LEVELS.warn) {
    logger.warn = console.log.bind(console, "\x1B[33m", format('WARN'));
  }

  if (level <= LEVELS.info) {
    logger.info = console.log.bind(console, '\x1b[34m', format('INFO'));
  }

  if (level <= LEVELS.debug) {
    logger.debug = console.log.bind(console, '\x1b[32m', format('DEBUG'));
  }
};

var format = function format(level) {
  var time = moment_mini__WEBPACK_IMPORTED_MODULE_0___default()().format('HH:mm:ss.SSS');
  return "".concat(time, " : ").concat(level, " : ");
};

/***/ }),

/***/ "./src/mermaid.js":
/*!************************!*\
  !*** ./src/mermaid.js ***!
  \************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var he__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! he */ "he");
/* harmony import */ var he__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(he__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mermaidAPI */ "./src/mermaidAPI.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./logger */ "./src/logger.js");
/**
 * Web page integration module for the mermaid framework. It uses the mermaidAPI for mermaid functionality and to render
 * the diagrams to svg code.
 */



/**
 * ## init
 * Function that goes through the document to find the chart definitions in there and render them.
 *
 * The function tags the processed attributes with the attribute data-processed and ignores found elements with the
 * attribute already set. This way the init function can be triggered several times.
 *
 * Optionally, `init` can accept in the second argument one of the following:
 * - a DOM Node
 * - an array of DOM nodes (as would come from a jQuery selector)
 * - a W3C selector, a la `.mermaid`
 *
 * ```mermaid
 * graph LR;
 *  a(Find elements)-->b{Processed}
 *  b-->|Yes|c(Leave element)
 *  b-->|No |d(Transform)
 * ```
 * Renders the mermaid diagrams
 * @param nodes a css selector or an array of nodes
 */

var init = function init() {
  var conf = _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig();
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Starting rendering diagrams');
  var nodes;

  if (arguments.length >= 2) {
    /*! sequence config was passed as #1 */
    if (typeof arguments[0] !== 'undefined') {
      mermaid.sequenceConfig = arguments[0];
    }

    nodes = arguments[1];
  } else {
    nodes = arguments[0];
  } // if last argument is a function this is the callback function


  var callback;

  if (typeof arguments[arguments.length - 1] === 'function') {
    callback = arguments[arguments.length - 1];
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Callback function found');
  } else {
    if (typeof conf.mermaid !== 'undefined') {
      if (typeof conf.mermaid.callback === 'function') {
        callback = conf.mermaid.callback;
        _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Callback function found');
      } else {
        _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('No Callback function found');
      }
    }
  }

  nodes = nodes === undefined ? document.querySelectorAll('.mermaid') : typeof nodes === 'string' ? document.querySelectorAll(nodes) : nodes instanceof window.Node ? [nodes] : nodes; // Last case  - sequence config was passed pick next

  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Start On Load before: ' + mermaid.startOnLoad);

  if (typeof mermaid.startOnLoad !== 'undefined') {
    _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Start On Load inner: ' + mermaid.startOnLoad);
    _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].initialize({
      startOnLoad: mermaid.startOnLoad
    });
  }

  if (typeof mermaid.ganttConfig !== 'undefined') {
    _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].initialize({
      gantt: mermaid.ganttConfig
    });
  }

  var txt;

  var _loop = function _loop(i) {
    var element = nodes[i];
    /*! Check if previously processed */

    if (!element.getAttribute('data-processed')) {
      element.setAttribute('data-processed', true);
    } else {
      return "continue";
    }

    var id = "mermaid-".concat(Date.now()); // Fetch the graph definition including tags

    txt = element.innerHTML; // transforms the html to pure text

    txt = he__WEBPACK_IMPORTED_MODULE_0___default.a.decode(txt).trim().replace(/<br>/gi, '<br/>');
    _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].render(id, txt, function (svgCode, bindFunctions) {
      element.innerHTML = svgCode;

      if (typeof callback !== 'undefined') {
        callback(id);
      }

      if (bindFunctions) bindFunctions(element);
    }, element);
  };

  for (var i = 0; i < nodes.length; i++) {
    var _ret = _loop(i);

    if (_ret === "continue") continue;
  }
};

var initialize = function initialize(config) {
  _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('Initializing mermaid ');

  if (typeof config.mermaid !== 'undefined') {
    if (typeof config.mermaid.startOnLoad !== 'undefined') {
      mermaid.startOnLoad = config.mermaid.startOnLoad;
    }

    if (typeof config.mermaid.htmlLabels !== 'undefined') {
      mermaid.htmlLabels = config.mermaid.htmlLabels;
    }
  }

  _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].initialize(config);
};
/**
 * ##contentLoaded
 * Callback function that is called when page is loaded. This functions fetches configuration for mermaid rendering and
 * calls init for rendering the mermaid diagrams on the page.
 */


var contentLoaded = function contentLoaded() {
  var config;

  if (mermaid.startOnLoad) {
    // No config found, do check API config
    config = _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig();

    if (config.startOnLoad) {
      mermaid.init();
    }
  } else {
    if (typeof mermaid.startOnLoad === 'undefined') {
      _logger__WEBPACK_IMPORTED_MODULE_2__["logger"].debug('In start, no config');
      config = _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].getConfig();

      if (config.startOnLoad) {
        mermaid.init();
      }
    }
  }
};

if (typeof document !== 'undefined') {
  /*!
   * Wait for document loaded before starting the execution
   */
  window.addEventListener('load', function () {
    contentLoaded();
  }, false);
}

var mermaid = {
  startOnLoad: true,
  htmlLabels: true,
  mermaidAPI: _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"],
  parse: _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].parse,
  render: _mermaidAPI__WEBPACK_IMPORTED_MODULE_1__["default"].render,
  init: init,
  initialize: initialize,
  contentLoaded: contentLoaded
};
/* harmony default export */ __webpack_exports__["default"] = (mermaid);

/***/ }),

/***/ "./src/mermaidAPI.js":
/*!***************************!*\
  !*** ./src/mermaidAPI.js ***!
  \***************************/
/*! exports provided: encodeEntities, decodeEntities, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encodeEntities", function() { return encodeEntities; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decodeEntities", function() { return decodeEntities; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var scope_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! scope-css */ "scope-css");
/* harmony import */ var scope_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(scope_css__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../package.json */ "./package.json");
var _package_json__WEBPACK_IMPORTED_MODULE_2___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../package.json */ "./package.json", 1);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./config */ "./src/config.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./logger */ "./src/logger.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* harmony import */ var _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./diagrams/flowchart/flowRenderer */ "./src/diagrams/flowchart/flowRenderer.js");
/* harmony import */ var _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./diagrams/flowchart/parser/flow */ "./src/diagrams/flowchart/parser/flow.jison");
/* harmony import */ var _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./diagrams/flowchart/flowDb */ "./src/diagrams/flowchart/flowDb.js");
/* harmony import */ var _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./diagrams/sequence/sequenceRenderer */ "./src/diagrams/sequence/sequenceRenderer.js");
/* harmony import */ var _diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./diagrams/sequence/parser/sequenceDiagram */ "./src/diagrams/sequence/parser/sequenceDiagram.jison");
/* harmony import */ var _diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(_diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _diagrams_sequence_sequenceDb__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./diagrams/sequence/sequenceDb */ "./src/diagrams/sequence/sequenceDb.js");
/* harmony import */ var _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./diagrams/gantt/ganttRenderer */ "./src/diagrams/gantt/ganttRenderer.js");
/* harmony import */ var _diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./diagrams/gantt/parser/gantt */ "./src/diagrams/gantt/parser/gantt.jison");
/* harmony import */ var _diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(_diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_13__);
/* harmony import */ var _diagrams_gantt_ganttDb__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./diagrams/gantt/ganttDb */ "./src/diagrams/gantt/ganttDb.js");
/* harmony import */ var _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./diagrams/class/classRenderer */ "./src/diagrams/class/classRenderer.js");
/* harmony import */ var _diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./diagrams/class/parser/classDiagram */ "./src/diagrams/class/parser/classDiagram.jison");
/* harmony import */ var _diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_16___default = /*#__PURE__*/__webpack_require__.n(_diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_16__);
/* harmony import */ var _diagrams_class_classDb__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./diagrams/class/classDb */ "./src/diagrams/class/classDb.js");
/* harmony import */ var _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./diagrams/state/stateRenderer */ "./src/diagrams/state/stateRenderer.js");
/* harmony import */ var _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./diagrams/state/parser/stateDiagram */ "./src/diagrams/state/parser/stateDiagram.jison");
/* harmony import */ var _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_19___default = /*#__PURE__*/__webpack_require__.n(_diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_19__);
/* harmony import */ var _diagrams_state_stateDb__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./diagrams/state/stateDb */ "./src/diagrams/state/stateDb.js");
/* harmony import */ var _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./diagrams/git/gitGraphRenderer */ "./src/diagrams/git/gitGraphRenderer.js");
/* harmony import */ var _diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./diagrams/git/parser/gitGraph */ "./src/diagrams/git/parser/gitGraph.jison");
/* harmony import */ var _diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_22___default = /*#__PURE__*/__webpack_require__.n(_diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_22__);
/* harmony import */ var _diagrams_git_gitGraphAst__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./diagrams/git/gitGraphAst */ "./src/diagrams/git/gitGraphAst.js");
/* harmony import */ var _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./diagrams/info/infoRenderer */ "./src/diagrams/info/infoRenderer.js");
/* harmony import */ var _diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./diagrams/info/parser/info */ "./src/diagrams/info/parser/info.jison");
/* harmony import */ var _diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_25___default = /*#__PURE__*/__webpack_require__.n(_diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_25__);
/* harmony import */ var _diagrams_info_infoDb__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./diagrams/info/infoDb */ "./src/diagrams/info/infoDb.js");
/* harmony import */ var _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./diagrams/pie/pieRenderer */ "./src/diagrams/pie/pieRenderer.js");
/* harmony import */ var _diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./diagrams/pie/parser/pie */ "./src/diagrams/pie/parser/pie.jison");
/* harmony import */ var _diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_28___default = /*#__PURE__*/__webpack_require__.n(_diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_28__);
/* harmony import */ var _diagrams_pie_pieDb__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./diagrams/pie/pieDb */ "./src/diagrams/pie/pieDb.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * This is the api to be used when optionally handling the integration with the web page, instead of using the default integration provided by mermaid.js.
 *
 * The core of this api is the [**render**](https://github.com/knsv/mermaid/blob/master/docs/mermaidAPI.md#render) function which, given a graph
 * definition as text, renders the graph/diagram and returns an svg element for the graph.
 *
 * It is is then up to the user of the API to make use of the svg, either insert it somewhere in the page or do something completely different.
 *
 * In addition to the render function, a number of behavioral configuration options are available.
 *
 * @name mermaidAPI
 */






























var themes = {};

for (var _i = 0, _arr = ['default', 'forest', 'dark', 'neutral']; _i < _arr.length; _i++) {
  var themeName = _arr[_i];
  themes[themeName] = __webpack_require__("./src/themes sync recursive ^\\.\\/.*\\/index\\.scss$")("./".concat(themeName, "/index.scss"));
}
/**
 * These are the default options which can be overridden with the initialization call like so:
 * **Example 1:**
 * <pre>
 * mermaid.initialize({
 *   flowchart:{
 *      htmlLabels: false
 *   }
 * });
 * </pre>
 *
 * **Example 2:**
 * <pre>
 *  <script>
 *   var config = {
 *     startOnLoad:true,
 *     flowchart:{
 *       useMaxWidth:true,
 *       htmlLabels:true,
 *       curve:'cardinal',
 *     },
 *
 *     securityLevel:'loose',
 *   };
 *   mermaid.initialize(config);
 * </script>
 * </pre>
 * A summary of all options and their defaults is found [here](https://github.com/knsv/mermaid/blob/master/docs/mermaidAPI.md#mermaidapi-configuration-defaults). A description of each option follows below.
 *
 * @name Configuration
 */


var config = {
  /** theme , the CSS style sheet
   *
   * **theme** - Choose one of the built-in themes:
   *    * default
   *    * forest
   *    * dark
   *    * neutral.
   * To disable any pre-defined mermaid theme, use "null".
   *
   * **themeCSS** - Use your own CSS. This overrides **theme**.
   * <pre>
   *  "theme": "forest",
   *  "themeCSS": ".node rect { fill: red; }"
   * </pre>
   */
  theme: 'default',
  themeCSS: undefined,

  /**
   * **fontFamily** The font to be used for the rendered diagrams. Default value is \"trebuchet ms\", verdana, arial;
   */
  fontFamily: '"trebuchet ms", verdana, arial;',

  /**
   * This option decides the amount of logging to be used.
   *    * debug: 1
   *    * info: 2
   *    * warn: 3
   *    * error: 4
   *    * fatal: (**default**) 5
   */
  logLevel: 5,

  /**
   * Sets the level of trust to be used on the parsed diagrams.
   *  * **strict**: (**default**) tags in text are encoded, click functionality is disabeled
   *  * **loose**: tags in text are allowed, click functionality is enabled
   */
  securityLevel: 'strict',

  /**
   * This options controls whether or mermaid starts when the page loads
   * **Default value true**.
   */
  startOnLoad: true,

  /**
   * This options controls whether or arrow markers in html code will be absolute paths or
   * an anchor, #. This matters if you are using base tag settings.
   * **Default value false**.
   */
  arrowMarkerAbsolute: false,

  /**
   * The object containing configurations specific for flowcharts
   */
  flowchart: {
    /**
     * Flag for setting whether or not a html tag should be used for rendering labels
     * on the edges.
     * **Default value true**.
     */
    htmlLabels: true,

    /**
     * How mermaid renders curves for flowcharts. Possible values are
     *   * basis
     *   * linear **default**
     *   * cardinal
     */
    curve: 'linear'
  },

  /**
   * The object containing configurations specific for sequence diagrams
   */
  sequence: {
    /**
     * margin to the right and left of the sequence diagram.
     * **Default value 50**.
     */
    diagramMarginX: 50,

    /**
     * margin to the over and under the sequence diagram.
     * **Default value 10**.
     */
    diagramMarginY: 10,

    /**
     * Margin between actors.
     * **Default value 50**.
     */
    actorMargin: 50,

    /**
     * Width of actor boxes
     * **Default value 150**.
     */
    width: 150,

    /**
     * Height of actor boxes
     * **Default value 65**.
     */
    height: 65,

    /**
     * Margin around loop boxes
     * **Default value 10**.
     */
    boxMargin: 10,

    /**
     * margin around the text in loop/alt/opt boxes
     * **Default value 5**.
     */
    boxTextMargin: 5,

    /**
     * margin around notes.
     * **Default value 10**.
     */
    noteMargin: 10,

    /**
     * Space between messages.
     * **Default value 35**.
     */
    messageMargin: 35,

    /**
     * mirror actors under diagram.
     * **Default value true**.
     */
    mirrorActors: true,

    /**
     * Depending on css styling this might need adjustment.
     * Prolongs the edge of the diagram downwards.
     * **Default value 1**.
     */
    bottomMarginAdj: 1,

    /**
     * when this flag is set the height and width is set to 100% and is then scaling with the
     * available space if not the absolute space required is used.
     * **Default value true**.
     */
    useMaxWidth: true,

    /**
     * This will display arrows that start and begin at the same node as right angles, rather than a curve
     * **Default value false**.
     */
    rightAngles: false,

    /**
     * This will show the node numbers
     * **Default value false**.
     */
    showSequenceNumbers: false
  },

  /**
   * The object containing configurations specific for gantt diagrams*
   */
  gantt: {
    /**
     * Margin top for the text over the gantt diagram
     * **Default value 25**.
     */
    titleTopMargin: 25,

    /**
     * The height of the bars in the graph
     * **Default value 20**.
     */
    barHeight: 20,

    /**
     * The margin between the different activities in the gantt diagram.
     * **Default value 4**.
     */
    barGap: 4,

    /**
     *  Margin between title and gantt diagram and between axis and gantt diagram.
     * **Default value 50**.
     */
    topPadding: 50,

    /**
     *  The space allocated for the section name to the left of the activities.
     * **Default value 75**.
     */
    leftPadding: 75,

    /**
     *  Vertical starting position of the grid lines.
     * **Default value 35**.
     */
    gridLineStartPadding: 35,

    /**
     *  Font size ...
     * **Default value 11**.
     */
    fontSize: 11,

    /**
     * font family ...
     * **Default value '"Open-Sans", "sans-serif"'**.
     */
    fontFamily: '"Open-Sans", "sans-serif"',

    /**
     * The number of alternating section styles.
     * **Default value 4**.
     */
    numberSectionStyles: 4,

    /**
     * Datetime format of the axis. This might need adjustment to match your locale and preferences
     * **Default value '%Y-%m-%d'**.
     */
    axisFormat: '%Y-%m-%d'
  },
  class: {},
  git: {},
  state: {
    dividerMargin: 10,
    sizeUnit: 5,
    padding: 8,
    textHeight: 10,
    titleShift: -15,
    noteMargin: 10,
    forkWidth: 70,
    forkHeight: 7,
    // Used
    miniPadding: 2,
    // Font size factor, this is used to guess the width of the edges labels before rendering by dagre
    // layout. This might need updating if/when switching font
    fontSizeFactor: 5.02,
    fontSize: 24,
    labelHeight: 16,
    edgeLengthFactor: '20',
    compositTitleSize: 35,
    radius: 5
  }
};
Object(_logger__WEBPACK_IMPORTED_MODULE_4__["setLogLevel"])(config.logLevel);
Object(_config__WEBPACK_IMPORTED_MODULE_3__["setConfig"])(config);

function parse(text) {
  var graphType = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].detectType(text);
  var parser;
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('Type ' + graphType);

  switch (graphType) {
    case 'git':
      parser = _diagrams_git_parser_gitGraph__WEBPACK_IMPORTED_MODULE_22___default.a;
      parser.parser.yy = _diagrams_git_gitGraphAst__WEBPACK_IMPORTED_MODULE_23__["default"];
      break;

    case 'flowchart':
      _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_8__["default"].clear();
      parser = _diagrams_flowchart_parser_flow__WEBPACK_IMPORTED_MODULE_7___default.a;
      parser.parser.yy = _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_8__["default"];
      break;

    case 'sequence':
      parser = _diagrams_sequence_parser_sequenceDiagram__WEBPACK_IMPORTED_MODULE_10___default.a;
      parser.parser.yy = _diagrams_sequence_sequenceDb__WEBPACK_IMPORTED_MODULE_11__["default"];
      break;

    case 'gantt':
      parser = _diagrams_gantt_parser_gantt__WEBPACK_IMPORTED_MODULE_13___default.a;
      parser.parser.yy = _diagrams_gantt_ganttDb__WEBPACK_IMPORTED_MODULE_14__["default"];
      break;

    case 'class':
      parser = _diagrams_class_parser_classDiagram__WEBPACK_IMPORTED_MODULE_16___default.a;
      parser.parser.yy = _diagrams_class_classDb__WEBPACK_IMPORTED_MODULE_17__["default"];
      break;

    case 'state':
      parser = _diagrams_state_parser_stateDiagram__WEBPACK_IMPORTED_MODULE_19___default.a;
      parser.parser.yy = _diagrams_state_stateDb__WEBPACK_IMPORTED_MODULE_20__["default"];
      break;

    case 'info':
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('info info info');
      parser = _diagrams_info_parser_info__WEBPACK_IMPORTED_MODULE_25___default.a;
      parser.parser.yy = _diagrams_info_infoDb__WEBPACK_IMPORTED_MODULE_26__["default"];
      break;

    case 'pie':
      _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('pie');
      parser = _diagrams_pie_parser_pie__WEBPACK_IMPORTED_MODULE_28___default.a;
      parser.parser.yy = _diagrams_pie_pieDb__WEBPACK_IMPORTED_MODULE_29__["default"];
      break;
  }

  parser.parser.yy.parseError = function (str, hash) {
    var error = {
      str: str,
      hash: hash
    };
    throw error;
  };

  parser.parse(text);
}

var encodeEntities = function encodeEntities(text) {
  var txt = text;
  txt = txt.replace(/style.*:\S*#.*;/g, function (s) {
    var innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, function (s) {
    var innerTxt = s.substring(0, s.length - 1);
    return innerTxt;
  });
  txt = txt.replace(/#\w+;/g, function (s) {
    var innerTxt = s.substring(1, s.length - 1);
    var isInt = /^\+?\d+$/.test(innerTxt);

    if (isInt) {
      return 'ﬂ°°' + innerTxt + '¶ß';
    } else {
      return 'ﬂ°' + innerTxt + '¶ß';
    }
  });
  return txt;
};
var decodeEntities = function decodeEntities(text) {
  var txt = text;
  txt = txt.replace(/ﬂ°°/g, function () {
    return '&#';
  });
  txt = txt.replace(/ﬂ°/g, function () {
    return '&';
  });
  txt = txt.replace(/¶ß/g, function () {
    return ';';
  });
  return txt;
};
/**
 * Function that renders an svg with a graph from a chart definition. Usage example below.
 *
 * ```js
 * mermaidAPI.initialize({
 *      startOnLoad:true
 *  });
 *  $(function(){
 *      const graphDefinition = 'graph TB\na-->b';
 *      const cb = function(svgGraph){
 *          console.log(svgGraph);
 *      };
 *      mermaidAPI.render('id1',graphDefinition,cb);
 *  });
 *```
 * @param id the id of the element to be rendered
 * @param txt the graph definition
 * @param cb callback which is called after rendering is finished with the svg code as inparam.
 * @param container selector to element in which a div with the graph temporarily will be inserted. In one is
 * provided a hidden div will be inserted in the body of the page instead. The element will be removed when rendering is
 * completed.
 */

var render = function render(id, txt, cb, container) {
  if (typeof container !== 'undefined') {
    container.innerHTML = '';
    d3__WEBPACK_IMPORTED_MODULE_0__["select"](container).append('div').attr('id', 'd' + id).attr('style', 'font-family: ' + config.fontFamily).append('svg').attr('id', id).attr('width', '100%').attr('xmlns', 'http://www.w3.org/2000/svg').append('g');
  } else {
    var existingSvg = document.getElementById(id);

    if (existingSvg) {
      existingSvg.remove();
    }

    var _element = document.querySelector('#' + 'd' + id);

    if (_element) {
      _element.innerHTML = '';
    }

    d3__WEBPACK_IMPORTED_MODULE_0__["select"]('body').append('div').attr('id', 'd' + id).append('svg').attr('id', id).attr('width', '100%').attr('xmlns', 'http://www.w3.org/2000/svg').append('g');
  }

  window.txt = txt;
  txt = encodeEntities(txt);
  var element = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#d' + id).node();
  var graphType = _utils__WEBPACK_IMPORTED_MODULE_5__["default"].detectType(txt); // insert inline style into svg

  var svg = element.firstChild;
  var firstChild = svg.firstChild; // pre-defined theme

  var style = themes[config.theme];

  if (style === undefined) {
    style = '';
  } // user provided theme CSS


  if (config.themeCSS !== undefined) {
    style += "\n".concat(config.themeCSS);
  } // user provided theme CSS


  if (config.fontFamily !== undefined) {
    style += "\n:root { --mermaid-font-family: ".concat(config.fontFamily, "}");
  } // user provided theme CSS


  if (config.altFontFamily !== undefined) {
    style += "\n:root { --mermaid-alt-font-family: ".concat(config.altFontFamily, "}");
  } // classDef


  if (graphType === 'flowchart') {
    var classes = _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].getClasses(txt);

    for (var className in classes) {
      style += "\n.".concat(className, " > * { ").concat(classes[className].styles.join(' !important; '), " !important; }");
    }
  }

  var style1 = document.createElement('style');
  style1.innerHTML = scope_css__WEBPACK_IMPORTED_MODULE_1___default()(style, "#".concat(id));
  svg.insertBefore(style1, firstChild);
  var style2 = document.createElement('style');
  var cs = window.getComputedStyle(svg);
  style2.innerHTML = "#".concat(id, " {\n    color: ").concat(cs.color, ";\n    font: ").concat(cs.font, ";\n  }");
  svg.insertBefore(style2, firstChild);

  switch (graphType) {
    case 'git':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_21__["default"].setConf(config.git);
      _diagrams_git_gitGraphRenderer__WEBPACK_IMPORTED_MODULE_21__["default"].draw(txt, id, false);
      break;

    case 'flowchart':
      config.flowchart.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].setConf(config.flowchart);
      _diagrams_flowchart_flowRenderer__WEBPACK_IMPORTED_MODULE_6__["default"].draw(txt, id, false);
      break;

    case 'sequence':
      config.sequence.arrowMarkerAbsolute = config.arrowMarkerAbsolute;

      if (config.sequenceDiagram) {
        // backwards compatibility
        _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_9__["default"].setConf(Object.assign(config.sequence, config.sequenceDiagram));
        console.error('`mermaid config.sequenceDiagram` has been renamed to `config.sequence`. Please update your mermaid config.');
      } else {
        _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_9__["default"].setConf(config.sequence);
      }

      _diagrams_sequence_sequenceRenderer__WEBPACK_IMPORTED_MODULE_9__["default"].draw(txt, id);
      break;

    case 'gantt':
      config.gantt.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_12__["default"].setConf(config.gantt);
      _diagrams_gantt_ganttRenderer__WEBPACK_IMPORTED_MODULE_12__["default"].draw(txt, id);
      break;

    case 'class':
      config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_15__["default"].setConf(config.class);
      _diagrams_class_classRenderer__WEBPACK_IMPORTED_MODULE_15__["default"].draw(txt, id);
      break;

    case 'state':
      // config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_18__["default"].setConf(config.state);
      _diagrams_state_stateRenderer__WEBPACK_IMPORTED_MODULE_18__["default"].draw(txt, id);
      break;

    case 'info':
      config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_24__["default"].setConf(config.class);
      _diagrams_info_infoRenderer__WEBPACK_IMPORTED_MODULE_24__["default"].draw(txt, id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
      break;

    case 'pie':
      config.class.arrowMarkerAbsolute = config.arrowMarkerAbsolute;
      _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_27__["default"].setConf(config.class);
      _diagrams_pie_pieRenderer__WEBPACK_IMPORTED_MODULE_27__["default"].draw(txt, id, _package_json__WEBPACK_IMPORTED_MODULE_2__.version);
      break;
  }

  d3__WEBPACK_IMPORTED_MODULE_0__["select"]("[id=\"".concat(id, "\"]")).selectAll('foreignobject > *').attr('xmlns', 'http://www.w3.org/1999/xhtml'); // if (config.arrowMarkerAbsolute) {
  //   url =
  //     window.location.protocol +
  //     '//' +
  //     window.location.host +
  //     window.location.pathname +
  //     window.location.search;
  //   url = url.replace(/\(/g, '\\(');
  //   url = url.replace(/\)/g, '\\)');
  // }
  // Fix for when the base tag is used

  var svgCode = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#d' + id).node().innerHTML;

  if (!config.arrowMarkerAbsolute || config.arrowMarkerAbsolute === 'false') {
    svgCode = svgCode.replace(/marker-end="url\(.*?#/g, 'marker-end="url(#', 'g');
  }

  svgCode = decodeEntities(svgCode);

  if (typeof cb !== 'undefined') {
    switch (graphType) {
      case 'flowchart':
        cb(svgCode, _diagrams_flowchart_flowDb__WEBPACK_IMPORTED_MODULE_8__["default"].bindFunctions);
        break;

      case 'gantt':
        cb(svgCode, _diagrams_gantt_ganttDb__WEBPACK_IMPORTED_MODULE_14__["default"].bindFunctions);
        break;

      default:
        cb(svgCode);
    }
  } else {
    _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('CB = undefined!');
  }

  var node = d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#d' + id).node();

  if (node !== null && typeof node.remove === 'function') {
    d3__WEBPACK_IMPORTED_MODULE_0__["select"]('#d' + id).node().remove();
  }

  return svgCode;
};

var setConf = function setConf(cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  var lvl1Keys = Object.keys(cnf);

  for (var i = 0; i < lvl1Keys.length; i++) {
    if (_typeof(cnf[lvl1Keys[i]]) === 'object' && cnf[lvl1Keys[i]] != null) {
      var lvl2Keys = Object.keys(cnf[lvl1Keys[i]]);

      for (var j = 0; j < lvl2Keys.length; j++) {
        _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('Setting conf ', lvl1Keys[i], '-', lvl2Keys[j]);

        if (typeof config[lvl1Keys[i]] === 'undefined') {
          config[lvl1Keys[i]] = {};
        }

        _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('Setting config: ' + lvl1Keys[i] + ' ' + lvl2Keys[j] + ' to ' + cnf[lvl1Keys[i]][lvl2Keys[j]]);
        config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]];
      }
    } else {
      config[lvl1Keys[i]] = cnf[lvl1Keys[i]];
    }
  }
};

function initialize(options) {
  _logger__WEBPACK_IMPORTED_MODULE_4__["logger"].debug('Initializing mermaidAPI ', _package_json__WEBPACK_IMPORTED_MODULE_2__.version); // Update default config with options supplied at initialization

  if (_typeof(options) === 'object') {
    setConf(options);
  }

  Object(_config__WEBPACK_IMPORTED_MODULE_3__["setConfig"])(config);
  Object(_logger__WEBPACK_IMPORTED_MODULE_4__["setLogLevel"])(config.logLevel);
} // function getConfig () {
//   console.warn('get config')
//   return config
// }


var mermaidAPI = {
  render: render,
  parse: parse,
  initialize: initialize,
  getConfig: _config__WEBPACK_IMPORTED_MODULE_3__["getConfig"]
};
/* harmony default export */ __webpack_exports__["default"] = (mermaidAPI);
/**
 * ## mermaidAPI configuration defaults
 * <pre>
 *
 * &lt;script>
 *   var config = {
 *     theme:'default',
 *     logLevel:'fatal',
 *     securityLevel:'strict',
 *     startOnLoad:true,
 *     arrowMarkerAbsolute:false,
 *
 *     flowchart:{
 *       htmlLabels:true,
 *       curve:'linear',
 *     },
 *     sequence:{
 *       diagramMarginX:50,
 *       diagramMarginY:10,
 *       actorMargin:50,
 *       width:150,
 *       height:65,
 *       boxMargin:10,
 *       boxTextMargin:5,
 *       noteMargin:10,
 *       messageMargin:35,
 *       mirrorActors:true,
 *       bottomMarginAdj:1,
 *       useMaxWidth:true,
 *       rightAngles:false,
 *       showSequenceNumbers:false,
 *     },
 *     gantt:{
 *       titleTopMargin:25,
 *       barHeight:20,
 *       barGap:4,
 *       topPadding:50,
 *       leftPadding:75,
 *       gridLineStartPadding:35,
 *       fontSize:11,
 *       fontFamily:'"Open-Sans", "sans-serif"',
 *       numberSectionStyles:4,
 *       axisFormat:'%Y-%m-%d',
 *     }
 *   };
 *   mermaid.initialize(config);
 * &lt;/script>
 *</pre>
 */

/***/ }),

/***/ "./src/themes sync recursive ^\\.\\/.*\\/index\\.scss$":
/*!***********************************************!*\
  !*** ./src/themes sync ^\.\/.*\/index\.scss$ ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./dark/index.scss": "./src/themes/dark/index.scss",
	"./default/index.scss": "./src/themes/default/index.scss",
	"./forest/index.scss": "./src/themes/forest/index.scss",
	"./neutral/index.scss": "./src/themes/neutral/index.scss"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./src/themes sync recursive ^\\.\\/.*\\/index\\.scss$";

/***/ }),

/***/ "./src/themes/dark/index.scss":
/*!************************************!*\
  !*** ./src/themes/dark/index.scss ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/dark/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/themes/default/index.scss":
/*!***************************************!*\
  !*** ./src/themes/default/index.scss ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/default/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/themes/forest/index.scss":
/*!**************************************!*\
  !*** ./src/themes/forest/index.scss ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/forest/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/themes/neutral/index.scss":
/*!***************************************!*\
  !*** ./src/themes/neutral/index.scss ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// css-to-string-loader: transforms styles from css-loader to a string output

// Get the styles
var styles = __webpack_require__(/*! !../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/sass-loader/dist/cjs.js!./index.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/sass-loader/dist/cjs.js!./src/themes/neutral/index.scss");

if (typeof styles === 'string') {
  // Return an existing string
  module.exports = styles;
} else {
  // Call the custom toString method from css-loader module
  module.exports = styles.toString();
}

/***/ }),

/***/ "./src/utils.js":
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
/*! exports provided: detectType, isSubstringInArray, interpolateToCurve, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detectType", function() { return detectType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isSubstringInArray", function() { return isSubstringInArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "interpolateToCurve", function() { return interpolateToCurve; });
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! d3 */ "d3");
/* harmony import */ var d3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(d3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./logger */ "./src/logger.js");


/**
 * @function detectType
 * Detects the type of the graph text.
 * ```mermaid
 * graph LR
 *  a-->b
 *  b-->c
 *  c-->d
 *  d-->e
 *  e-->f
 *  f-->g
 *  g-->h
 * ```
 *
 * @param {string} text The text defining the graph
 * @returns {string} A graph definition key
 */

var detectType = function detectType(text) {
  text = text.replace(/^\s*%%.*\n/g, '\n');
  _logger__WEBPACK_IMPORTED_MODULE_1__["logger"].debug('Detecting diagram type based on the text ' + text);

  if (text.match(/^\s*sequenceDiagram/)) {
    return 'sequence';
  }

  if (text.match(/^\s*gantt/)) {
    return 'gantt';
  }

  if (text.match(/^\s*classDiagram/)) {
    return 'class';
  }

  if (text.match(/^\s*stateDiagram/)) {
    return 'state';
  }

  if (text.match(/^\s*gitGraph/)) {
    return 'git';
  }

  if (text.match(/^\s*info/)) {
    return 'info';
  }

  if (text.match(/^\s*pie/)) {
    return 'pie';
  }

  return 'flowchart';
};
/**
 * @function isSubstringInArray
 * Detects whether a substring in present in a given array
 * @param {string} str The substring to detect
 * @param {array} arr The array to search
 * @returns {number} the array index containing the substring or -1 if not present
 **/

var isSubstringInArray = function isSubstringInArray(str, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].match(str)) return i;
  }

  return -1;
};
var interpolateToCurve = function interpolateToCurve(interpolate, defaultCurve) {
  if (!interpolate) {
    return defaultCurve;
  }

  var curveName = "curve".concat(interpolate.charAt(0).toUpperCase() + interpolate.slice(1));
  return d3__WEBPACK_IMPORTED_MODULE_0__[curveName] || defaultCurve;
};

var distance = function distance(p1, p2) {
  return p1 && p2 ? Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) : 0;
};

var traverseEdge = function traverseEdge(points) {
  var prevPoint;
  var totalDistance = 0;
  points.forEach(function (point) {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  }); // Traverse half of total distance along points

  var distanceToLabel = totalDistance / 2;
  var remainingDistance = distanceToLabel;
  var center;
  prevPoint = undefined;
  points.forEach(function (point) {
    if (prevPoint && !center) {
      var vectorDistance = distance(point, prevPoint);

      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        var distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = {
          x: point.x,
          y: point.y
        };

        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y
          };
        }
      }
    }

    prevPoint = point;
  });
  return center;
};

var calcLabelPosition = function calcLabelPosition(points) {
  var p = traverseEdge(points);
  return p;
};

var calcCardinalityPosition = function calcCardinalityPosition(isRelationTypePresent, points, initialPosition) {
  var prevPoint;
  var totalDistance = 0; // eslint-disable-line

  if (points[0] !== initialPosition) {
    points = points.reverse();
  }

  points.forEach(function (point) {
    totalDistance += distance(point, prevPoint);
    prevPoint = point;
  }); // Traverse only 25 total distance along points to find cardinality point

  var distanceToCardinalityPoint = 25;
  var remainingDistance = distanceToCardinalityPoint;
  var center;
  prevPoint = undefined;
  points.forEach(function (point) {
    if (prevPoint && !center) {
      var vectorDistance = distance(point, prevPoint);

      if (vectorDistance < remainingDistance) {
        remainingDistance -= vectorDistance;
      } else {
        // The point is remainingDistance from prevPoint in the vector between prevPoint and point
        // Calculate the coordinates
        var distanceRatio = remainingDistance / vectorDistance;
        if (distanceRatio <= 0) center = prevPoint;
        if (distanceRatio >= 1) center = {
          x: point.x,
          y: point.y
        };

        if (distanceRatio > 0 && distanceRatio < 1) {
          center = {
            x: (1 - distanceRatio) * prevPoint.x + distanceRatio * point.x,
            y: (1 - distanceRatio) * prevPoint.y + distanceRatio * point.y
          };
        }
      }
    }

    prevPoint = point;
  }); // if relation is present (Arrows will be added), change cardinality point off-set distance (d)

  var d = isRelationTypePresent ? 10 : 5; //Calculate Angle for x and y axis

  var angle = Math.atan2(points[0].y - center.y, points[0].x - center.x);
  var cardinalityPosition = {
    x: 0,
    y: 0
  }; //Calculation cardinality position using angle, center point on the line/curve but pendicular and with offset-distance

  cardinalityPosition.x = Math.sin(angle) * d + (points[0].x + center.x) / 2;
  cardinalityPosition.y = -Math.cos(angle) * d + (points[0].y + center.y) / 2;
  return cardinalityPosition;
};

/* harmony default export */ __webpack_exports__["default"] = ({
  detectType: detectType,
  isSubstringInArray: isSubstringInArray,
  interpolateToCurve: interpolateToCurve,
  calcLabelPosition: calcLabelPosition,
  calcCardinalityPosition: calcCardinalityPosition
});

/***/ }),

/***/ "@braintree/sanitize-url":
/*!******************************************!*\
  !*** external "@braintree/sanitize-url" ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("@braintree/sanitize-url");

/***/ }),

/***/ "crypto-random-string":
/*!***************************************!*\
  !*** external "crypto-random-string" ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("crypto-random-string");

/***/ }),

/***/ "d3":
/*!*********************!*\
  !*** external "d3" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("d3");

/***/ }),

/***/ "dagre":
/*!************************!*\
  !*** external "dagre" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dagre");

/***/ }),

/***/ "dagre-d3":
/*!***************************!*\
  !*** external "dagre-d3" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dagre-d3");

/***/ }),

/***/ "dagre-d3/lib/label/add-html-label.js":
/*!*******************************************************!*\
  !*** external "dagre-d3/lib/label/add-html-label.js" ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("dagre-d3/lib/label/add-html-label.js");

/***/ }),

/***/ "graphlib":
/*!***************************!*\
  !*** external "graphlib" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("graphlib");

/***/ }),

/***/ "he":
/*!*********************!*\
  !*** external "he" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("he");

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),

/***/ "moment-mini":
/*!******************************!*\
  !*** external "moment-mini" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("moment-mini");

/***/ }),

/***/ "scope-css":
/*!****************************!*\
  !*** external "scope-css" ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("scope-css");

/***/ })

/******/ })["default"];
});
//# sourceMappingURL=mermaid.core.js.map