import { spawn } from "child_process";
import * as path from "path";
import { extensionDirectoryPath } from "./utility";
import { getExtensionConfigPath } from "./mume";

const PlantUMLJarPath = path.resolve(
  extensionDirectoryPath,
  "./dependencies/plantuml/plantuml.jar",
);

/**
 * key is fileDirectoryPath, value is PlantUMLTask
 */
const TASKS: { [key: string]: PlantUMLTask } = {};

/**
 * key is fileDirectoryPath, value is String
 */
const CHUNKS: { [key: string]: string } = {};

/**
 * key is fileDirectoryPath, value is Array
 */
const CALLBACKS: { [key: string]: ((result: string) => void)[] } = {};

class PlantUMLTask {
  private fileDirectoryPath: string;
  private chunks: string;
  private callbacks: ((result: string) => void)[];
  private task;

  constructor(fileDirectoryPath: string) {
    this.fileDirectoryPath = fileDirectoryPath;
    this.chunks = CHUNKS[this.fileDirectoryPath] || "";
    this.callbacks = CALLBACKS[this.fileDirectoryPath] || [];
    this.task = null;

    this.startTask();
  }

  public generateSVG(content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.callbacks.push(resolve);
      this.task.stdin.write(content + "\n");
    });
  }

  private startTask() {
    this.task = spawn("java", [
      "-Djava.awt.headless=true",
      "-Dfile.encoding=UTF-8",
      "-Dplantuml.include.path=" +
        [this.fileDirectoryPath, getExtensionConfigPath()].join(path.delimiter),
      "-jar",
      PlantUMLJarPath,
      // '-graphvizdot', 'exe'
      "-pipe",
      "-tsvg",
      "-charset",
      "UTF-8",
    ]);

    this.task.stdout.on("data", (chunk) => {
        let data = chunk.toString();
        data = data.replace(/<svg[\n\r\s]+>$/, "</svg>");
        this.chunks += data;
        if (data.trimRight().endsWith("</svg>") &&
            this.chunks.match(/<svg/g).length ===
                this.chunks.match(/<\/svg/g).length) {
            data = this.chunks.trim();
            if (!data.startsWith("<?xml")) {
                data = "<?xml encoding=\"utf-8\" version=\"1.0\"?>" + data;
            }
            this.chunks = ""; // clear CHUNKS
            const diagrams = data.split("<?xml ");
            diagrams.forEach((diagram, i) => {
                if (diagram.length) {
                    const callback = this.callbacks.shift();
                    if (callback) {
                        callback("<?xml " + diagram);
                    }
                }
            });
        }
    });
    this.task.stderr.on("data", (chunk)=>console.log(chunk.toString().trim()));

    this.task.on("error", () => this.closeSelf());
    this.task.on("exit", () => this.closeSelf());
  }

  /**
   * stop this.task and store this.chunks and this.callbacks
   */
  private closeSelf() {
    TASKS[this.fileDirectoryPath] = null;
    CHUNKS[this.fileDirectoryPath] = this.chunks;
    CALLBACKS[this.fileDirectoryPath] = this.callbacks;
  }
}

// async call
export async function render(
  content: string,
  fileDirectoryPath: string = "",
): Promise<string> {
  content = content.trim();
  // ' @mume_file_directory_path:/fileDirectoryPath
  // fileDirectoryPath
  const match = content.match(/^'\s@mume_file_directory_path:(.+)$/m);
  if (match) {
    fileDirectoryPath = match[1];
  }

  const startMatch = content.match(/^\@start(.+?)\s+/m);
  if (startMatch) {
    if (!content.match(new RegExp(`^\\@end${startMatch[1]}`, "m"))) {
      content = "@startuml\n@enduml"; // error
    }
  } else {
    content = `@startuml
${content}
@enduml`;
  }

  if (!TASKS[fileDirectoryPath]) {
    // init `plantuml.jar` task
    TASKS[fileDirectoryPath] = new PlantUMLTask(fileDirectoryPath);
  }

  return await TASKS[fileDirectoryPath].generateSVG(content);
}
