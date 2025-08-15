import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import PlantUMLServerTask from './puml-server';

/**
 * key is fileDirectoryPath, value is PlantUMLTask
 */
const TASKS: { [key: string]: PlantUMLTask | PlantUMLServerTask | null } = {};

/**
 * key is fileDirectoryPath, value is String
 */
const CHUNKS: { [key: string]: string } = {};

/**
 * key is fileDirectoryPath, value is Array
 */
const CALLBACKS: { [key: string]: ((result: string) => void)[] } = {};

class PlantUMLTask {
  private plantumlJarPath: string;
  private fileDirectoryPath: string;
  private chunks: string;
  private callbacks: ((result: string) => void)[];
  private task: ChildProcessWithoutNullStreams | null;

  constructor(plantumlJarPath: string, fileDirectoryPath: string) {
    this.plantumlJarPath = plantumlJarPath;
    this.fileDirectoryPath = fileDirectoryPath;
    this.chunks = CHUNKS[this.fileDirectoryPath] || '';
    this.callbacks = CALLBACKS[this.fileDirectoryPath] || [];
    this.task = null;

    this.startTask();
  }

  public generateSVG(content: string): Promise<string> {
    return new Promise((resolve) => {
      this.callbacks.push(resolve);
      this.task?.stdin.write(content + '\n');
    });
  }

  private startTask() {
    this.task = spawn('java', [
      '-Djava.awt.headless=true',
      '-Dfile.encoding=UTF-8',
      '-Dplantuml.include.path=' +
        [this.fileDirectoryPath /*getExtensionConfigPath()*/].join(
          path.delimiter,
        ),
      '-jar',
      this.plantumlJarPath,
      // '-graphvizdot', 'exe'
      '-pipe',
      '-tsvg',
      '-charset',
      'UTF-8',
    ]);

    this.task.stdout.on('data', (chunk) => {
      let data = chunk.toString();
      this.chunks += data;
      if (
        this.chunks.trimRight().endsWith('</svg>') &&
        (this.chunks.match(/<svg/g) ?? []).length ===
          (this.chunks.match(/<\/svg>/g) ?? []).length
      ) {
        data = this.chunks;
        this.chunks = ''; // clear CHUNKS
        const regex = /<svg[^>]*>[\s\S]*?<\/svg>/g;
        const diagrams = data.match(regex);
        if (diagrams != null) {
          diagrams.forEach((diagram) => {
            if (diagram.length) {
              const callback = this.callbacks.shift();
              if (callback) {
                callback(diagram.startsWith('<') ? diagram : '<svg ' + diagram);
              }
            }
          });
        }
      }
    });

    this.task.on('error', (err) => {
      // Return error object to rendered doc
      this.callbacks.forEach((cb) => cb(JSON.stringify(err)));
      this.closeSelf();
    });
    this.task.on('exit', () => this.closeSelf());
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
export async function render({
  content,
  fileDirectoryPath,
  serverURL,
  plantumlJarPath,
}: {
  content: string;
  fileDirectoryPath: string;
  serverURL: string;
  plantumlJarPath: string;
}): Promise<string> {
  content = content.trim();
  // ' @crossnote_file_directory_path:/fileDirectoryPath
  // fileDirectoryPath
  const match = content.match(/^'\s@crossnote_file_directory_path:(.+)$/m);
  if (match) {
    fileDirectoryPath = match[1];
  }

  const startMatch = content.match(/^@start(.+?)\s+/m);
  if (startMatch) {
    if (!content.match(new RegExp(`^\\@end${startMatch[1]}`, 'm'))) {
      content = '@startuml\n@enduml'; // error
    }
  } else {
    content = `@startuml
${content}
@enduml`;
  }

  if (!TASKS[fileDirectoryPath]) {
    if (serverURL) {
      TASKS[fileDirectoryPath] = new PlantUMLServerTask(serverURL);
    } else {
      if (!existsSync(plantumlJarPath)) {
        throw new Error(`plantuml.jar file not found: "${plantumlJarPath}"

Please download plantuml.jar from https://plantuml.com/download.  
${plantumlJarPath ? `Then please put it at "${plantumlJarPath}"` : ``}

If you are using VSCode or coc.nvim, then please set the setting "markdown-preview-enhanced.plantumlJarPath" to the absolute path of plantuml.jar file.

If you don't want to use plantuml.jar, then you can use the online plantuml server 
by setting the setting "markdown-preview-enhanced.plantumlServer" to the URL of the online plantuml server, for example: https://kroki.io/plantuml/svg/
`);
      }
      // init `plantuml.jar` task
      TASKS[fileDirectoryPath] = new PlantUMLTask(
        plantumlJarPath,
        fileDirectoryPath,
      );
    }
  }

  return (await TASKS[fileDirectoryPath]?.generateSVG(content)) ?? '';
}
