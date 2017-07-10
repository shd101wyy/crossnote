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
const path = require("path");
const utility_1 = require("./utility");
const child_process_1 = require("child_process");
const PlantUMLJarPath = path.resolve(utility_1.extensionDirectoryPath, './dependencies/plantuml/plantuml.jar');
/**
 * key is fileDirectoryPath, value is PlantUMLTask
 */
const TASKS = {};
/**
 * key is fileDirectoryPath, value is String
 */
const CHUNKS = {};
/**
 * key is fileDirectoryPath, value is Array
 */
const CALLBACKS = {};
class PlantUMLTask {
    constructor(fileDirectoryPath) {
        this.fileDirectoryPath = fileDirectoryPath;
        this.chunks = CHUNKS[this.fileDirectoryPath] || '';
        this.callbacks = CALLBACKS[this.fileDirectoryPath] || [];
        this.task = null;
        this.startTask();
    }
    startTask() {
        this.task = child_process_1.spawn("java", ['-Djava.awt.headless=true',
            '-Dplantuml.include.path=' + this.fileDirectoryPath,
            '-jar', PlantUMLJarPath,
            // '-graphvizdot', 'exe'
            '-pipe',
            '-tsvg',
            '-charset', 'UTF-8']);
        this.task.stdout.on("data", (chunk) => {
            let data = chunk.toString().trimRight(); // `trimRight()` here is necessary.
            if (data.endsWith('</svg>')) {
                data = this.chunks + data;
                this.chunks = ''; // clear CHUNKS
                let diagrams = data.split('</svg>');
                diagrams.forEach((diagram, i) => {
                    if (diagram.length) {
                        const callback = this.callbacks.shift();
                        if (callback) {
                            callback(diagram + '</svg>');
                        }
                    }
                });
            }
            else {
                this.chunks += data;
            }
        });
        this.task.on("error", () => this.closeSelf());
        this.task.on("exit", () => this.closeSelf());
    }
    generateSVG(content) {
        return new Promise((resolve, reject) => {
            this.callbacks.push(resolve);
            this.task.stdin.write(content + '\n');
        });
    }
    /**
     * stop this.task and store this.chunks and this.callbacks
     */
    closeSelf() {
        TASKS[this.fileDirectoryPath] = null;
        CHUNKS[this.fileDirectoryPath] = this.chunks;
        CALLBACKS[this.fileDirectoryPath] = this.callbacks;
    }
}
// async call 
function render(content, fileDirectoryPath = "") {
    return __awaiter(this, void 0, void 0, function* () {
        content = content.trim();
        // ' @mpe_file_directory_path:/fileDirectoryPath
        // fileDirectoryPath 
        let match = null;
        if (match = content.match(/^'\s@mpe_file_directory_path:(.+)$/m)) {
            fileDirectoryPath = match[1];
        }
        let startMatch;
        if (startMatch = content.match(/^\@start(.+?)\s+/m)) {
            if (content.match(new RegExp(`^\\@end${startMatch[1]}`, 'm')))
                null; // do nothing
            else
                content = "@startuml\n@enduml"; // error
        }
        else {
            content = `@startuml
${content}
@enduml`;
        }
        if (!TASKS[fileDirectoryPath])
            TASKS[fileDirectoryPath] = new PlantUMLTask(fileDirectoryPath);
        return yield TASKS[fileDirectoryPath].generateSVG(content);
    });
}
exports.render = render;
