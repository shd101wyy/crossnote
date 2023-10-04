import React, {
  DragEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ImageUploader } from '../../notebook';
import PreviewContainer from '../containers/preview';

export default function ImageHelper() {
  const {
    postMessage,
    config,
    showImageHelper,
    setShowImageHelper,
    sourceUri,
    theme,
  } = PreviewContainer.useContainer();
  const imageHelperDialog = useRef<HTMLDialogElement>(null);
  const urlEditor = useRef<HTMLInputElement>(null);
  const imagePasterInput = useRef<HTMLInputElement>(null);
  const imageUploaderInput = useRef<HTMLInputElement>(null);
  const [imageUploader, setImageUploader] = useState<ImageUploader>(
    config.imageUploader ?? 'imgur',
  );

  const urlEditorOnKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!urlEditor.current) {
        return;
      }
      if (event.key === 'Enter') {
        let url = urlEditor.current.value.trim();
        if (url.indexOf(' ') >= 0) {
          url = `<${url}>`;
        }
        if (url.length) {
          setShowImageHelper(false);
          postMessage('insertImageUrl', [sourceUri.current, url]);
        }
        return false;
      } else {
        return true;
      }
    },
    [setShowImageHelper, postMessage, sourceUri],
  );

  const dropFilesToCopy = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      // paste
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i] as { path?: string };
        if (file && file.path) {
          postMessage('pasteImageFile', [sourceUri.current, file.path]);
        }
      }
      setShowImageHelper(false);
    },
    [setShowImageHelper, postMessage, sourceUri],
  );

  const dropFilesToUpload = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      // upload
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i] as { path?: string };
        if (file && file.path) {
          postMessage('uploadImageFile', [
            sourceUri.current,
            file.path,
            imageUploader,
          ]);
        }
      }
      setShowImageHelper(false);
    },
    [setShowImageHelper, postMessage, imageUploader, sourceUri],
  );

  useEffect(() => {
    if (showImageHelper) {
      imageHelperDialog.current?.showModal();
    } else {
      imageHelperDialog.current?.close();
    }
  }, [imageHelperDialog, showImageHelper]);

  return (
    <dialog
      className={'modal select-none'}
      onClose={() => {
        setShowImageHelper(false);
      }}
      ref={imageHelperDialog}
      data-theme={theme}
    >
      <div className="modal-box">
        <div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-base font-semibold leading-6">Image helper</h3>
            <div className="mt-2 text-left">
              <div>
                <label
                  htmlFor="link"
                  className="block text-sm font-medium leading-6 "
                >
                  Link
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Enter image URL here, then press 'Enter' to insert."
                    onKeyDown={urlEditorOnKeyDown}
                    className="block w-full rounded-md border-0 px-1.5 py-1.5  shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm sm:leading-6"
                    ref={urlEditor}
                  />
                </div>
              </div>
              <div className="relative my-4">
                <div className="divider">OR</div>
              </div>
              <div className="">
                <label className="text-sm">
                  Copy image to{' '}
                  {config.imageFolderPath && config.imageFolderPath[0] === '/'
                    ? 'workspace'
                    : 'relative'}{' '}
                  <code>{config.imageFolderPath}</code> folder.
                </label>
                <div
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 p-4 rounded-md mt-2 cursor-pointer"
                  onDrop={dropFilesToCopy}
                  onDrag={dropFilesToCopy}
                  onClick={() => {
                    imagePasterInput.current?.click();
                  }}
                >
                  <div className="text-sm">Click me to browse image file</div>
                  <input
                    type="file"
                    className="hidden"
                    multiple={true}
                    ref={imagePasterInput}
                    onChange={(event) => {
                      const files = event.target.files ?? [];
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i] as { path?: string };
                        if (file && file.path) {
                          postMessage('pasteImageFile', [
                            sourceUri.current,
                            file.path,
                          ]);
                        }
                      }
                      event.target.value = '';
                    }}
                  />
                </div>
              </div>
              <div className="relative my-4">
                <div className="divider">OR</div>
              </div>
              <div className="">
                <label className="text-sm">Upload</label>
                <div
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 p-4 rounded-md mt-2 cursor-pointer"
                  onDrop={dropFilesToUpload}
                  onDrag={dropFilesToUpload}
                  onClick={() => {
                    imageUploaderInput.current?.click();
                  }}
                >
                  <div className="text-sm">Click me to browse image file</div>
                  <input
                    type="file"
                    multiple={true}
                    ref={imageUploaderInput}
                    className="hidden"
                    onChange={(event) => {
                      const files = event.target.files ?? [];
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i] as { path?: string };
                        if (file && file.path) {
                          postMessage('uploadImageFile', [
                            sourceUri.current,
                            file.path,
                            imageUploader,
                          ]);
                        }
                      }
                      event.target.value = '';
                    }}
                  />
                </div>
                <div className="mt-2 text-sm">
                  <span>use</span>
                  <select
                    value={imageUploader}
                    onChange={(event) => {
                      setImageUploader(event.target.value as ImageUploader);
                      postMessage('setImageUploader', [event.target.value]);
                    }}
                    className="select select-bordered select-sm mx-2"
                  >
                    <option value={'imgur'}>imgur</option>
                    <option value={'sm.ms'}>sm.ms</option>
                    <option value={'qiniu'}>qiniu</option>
                  </select>
                  <span> to upload images</span>
                </div>
              </div>
              <div className="text-sm mt-4">
                <a href="#">Show history</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
