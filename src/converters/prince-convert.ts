import { execFile, ExecFileException } from 'child_process';

export function princeConvert(src: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      'prince',
      [src, '--javascript', '-o', dest],
      { windowsHide: true },
      (error: ExecFileException | null) => {
        if (error) {
          let errorMessage = error.toString();
          if (error.message.indexOf('spawn prince ENOENT') >= 0) {
            errorMessage = '"princexml" is required to be installed.';
          }
          return reject(errorMessage);
        }
        return resolve();
      },
    );
  });
}
