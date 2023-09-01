/**
 * This file includes the functions that should only
 * be used in nodejs environment, not the browser.
 */
import * as child_process from 'child_process';
import * as temp from 'temp';

temp.track();

export function tempOpen(options): Promise<temp.OpenFile> {
  return new Promise((resolve, reject) => {
    temp.open(options, (error, info) => {
      if (error) {
        return reject(error.toString());
      } else {
        return resolve(info);
      }
    });
  });
}

export function execFile(
  file: string,
  args: string[],
  options?: object,
): Promise<string> {
  return new Promise((resolve, reject) => {
    child_process.execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        return reject(error.toString());
      } else if (stderr) {
        return reject(stderr);
      } else {
        return resolve(stdout as string);
      }
    });
  });
}

/**
 * open html file in browser or open pdf file in reader ... etc
 * @param filePath
 */
export function openFile(filePath: string) {
  if (process.platform === 'win32') {
    if (filePath.match(/^[a-zA-Z]:\\/)) {
      // C:\ like url.
      filePath = 'file:///' + filePath;
    }
    if (filePath.startsWith('file:///')) {
      return child_process.execFile('explorer.exe', [filePath]);
    } else {
      return child_process.exec(`start ${filePath}`);
    }
  } else if (process.platform === 'darwin') {
    child_process.execFile('open', [filePath]);
  } else {
    child_process.execFile('xdg-open', [filePath]);
  }
}
