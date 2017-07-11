"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The core of mumei package.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const utility_ = require("./utility");
const engine = require("./markdown-engine");
let INITIALIZED = false;
let CONFIG_CHANGE_CALLBACK = null;
exports.utility = utility_;
exports.configs = exports.utility.configs;
exports.MarkdownEngine = engine.MarkdownEngine;
/**
 * init mume config folder at ~/.mume
 */
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        if (INITIALIZED)
            return;
        const homeDir = os.homedir();
        const extensionConfigDirectoryPath = path.resolve(homeDir, './.mume');
        if (!fs.existsSync(extensionConfigDirectoryPath)) {
            fs.mkdirSync(extensionConfigDirectoryPath);
        }
        exports.configs.globalStyle = yield exports.utility.getGlobalStyles();
        exports.configs.mermaidConfig = yield exports.utility.getMermaidConfig();
        exports.configs.mathjaxConfig = yield exports.utility.getMathJaxConfig();
        exports.configs.phantomjsConfig = yield exports.utility.getPhantomjsConfig();
        exports.configs.parserConfig = yield exports.utility.getParserConfig();
        exports.configs.config = yield exports.utility.getExtensionConfig();
        fs.watch(extensionConfigDirectoryPath, (eventType, fileName) => {
            if (eventType === 'change') {
                if (fileName === 'style.less') {
                    exports.utility.getGlobalStyles()
                        .then((css) => {
                        exports.configs.globalStyle = css;
                        if (CONFIG_CHANGE_CALLBACK)
                            CONFIG_CHANGE_CALLBACK();
                    });
                }
                else if (fileName === 'mermaid_config.js') {
                    exports.utility.getMermaidConfig()
                        .then((mermaidConfig) => {
                        exports.configs.mermaidConfig = mermaidConfig;
                        if (CONFIG_CHANGE_CALLBACK)
                            CONFIG_CHANGE_CALLBACK();
                    });
                }
                else if (fileName === 'mathjax_config.js') {
                    exports.utility.getMathJaxConfig()
                        .then((mathjaxConfig) => {
                        exports.configs.mathjaxConfig = mathjaxConfig;
                        if (CONFIG_CHANGE_CALLBACK)
                            CONFIG_CHANGE_CALLBACK();
                    });
                }
                else if (fileName === 'parser.js') {
                    exports.utility.getParserConfig()
                        .then((parserConfig) => {
                        exports.configs.parserConfig = parserConfig;
                        if (CONFIG_CHANGE_CALLBACK)
                            CONFIG_CHANGE_CALLBACK();
                    });
                }
                else if (fileName === 'config.json') {
                    exports.utility.getExtensionConfig()
                        .then((config) => {
                        exports.configs.config = config;
                        if (CONFIG_CHANGE_CALLBACK)
                            CONFIG_CHANGE_CALLBACK();
                    });
                }
            }
        });
        INITIALIZED = true;
        return;
    });
}
exports.init = init;
/**
 * cb will be called when global style.less like files is changed.
 * @param cb function(error, css){}
 */
function onDidChangeConfigFile(cb) {
    CONFIG_CHANGE_CALLBACK = cb;
}
exports.onDidChangeConfigFile = onDidChangeConfigFile;
