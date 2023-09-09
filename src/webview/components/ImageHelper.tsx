import { Dialog, Transition } from '@headlessui/react';
import React, {
  DragEvent,
  Fragment,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import WebviewContainer from '../containers/webview';

export default function ImageHelper() {
  const {
    postMessage,
    config,
    showImageHelper,
    setShowImageHelper,
  } = WebviewContainer.useContainer();
  const urlEditor = useRef<HTMLInputElement>(null);
  const imagePasterInput = useRef<HTMLInputElement>(null);
  const imageUploaderInput = useRef<HTMLInputElement>(null);
  const [imageUploader, setImageUploader] = useState<string>(
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
          postMessage('insertImageUrl', [this.sourceUri, url]);
        }
        return false;
      } else {
        return true;
      }
    },
    [urlEditor, postMessage, setShowImageHelper],
  );

  const dropFilesToCopy = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      // paste
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        // TODO:
        console.log(files[i]);
      }
      setShowImageHelper(false);
    },
    [setShowImageHelper],
  );

  const dropFilesToUpload = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      // upload
      const files = event.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        // TODO:
        console.log(files[i]);
      }
      setShowImageHelper(false);
    },
    [setShowImageHelper],
  );

  console.log(showImageHelper);

  return (
    <Transition.Root show={showImageHelper} as={Fragment}>
      <Dialog
        as="div"
        className={'relative z-10'}
        onClose={() => {
          setShowImageHelper(false);
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-left sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Image helper
                    </Dialog.Title>
                    <div className="mt-2 text-left">
                      <div>
                        <label
                          htmlFor="link"
                          className="block text-sm font-medium leading-6 text-gray-900"
                        >
                          Link
                        </label>
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Enter image URL here, then press 'Enter' to insert."
                            onKeyDown={urlEditorOnKeyDown}
                            className="block w-full rounded-md border-0 px-1.5 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            ref={urlEditor}
                          />
                        </div>
                      </div>
                      <div className="relative my-4">
                        <div
                          className="inset-0 flex items-center"
                          aria-hidden="true"
                        >
                          <div className="w-full border-t border-gray-300" />
                        </div>
                      </div>
                      <div className="">
                        <label className="text-sm">
                          Copy image to{' '}
                          {config.imageFolderPath &&
                          config.imageFolderPath[0] === '/'
                            ? 'workspace'
                            : 'relative'}{' '}
                          <code>{config.imageFolderPath}</code> folder.
                        </label>
                        <div
                          className="bg-gray-200 hover:bg-gray-300 p-4 rounded-md mt-2 cursor-pointer"
                          onDrop={dropFilesToCopy}
                          onDrag={dropFilesToCopy}
                          onClick={() => {
                            imagePasterInput.current?.click();
                          }}
                        >
                          <div className="text-sm">
                            Click me to browse image file
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            multiple={true}
                            ref={imagePasterInput}
                            onChange={event => {
                              const files = event.target.files ?? [];
                              for (let i = 0; i < files.length; i++) {
                                // TODO:
                              }
                              event.target.value = '';
                            }}
                          />
                        </div>
                      </div>
                      <div className="relative my-4">
                        <div
                          className="inset-0 flex items-center"
                          aria-hidden="true"
                        >
                          <div className="w-full border-t border-gray-300" />
                        </div>
                      </div>
                      <div className="">
                        <label className="text-sm">Upload</label>
                        <div
                          className="bg-gray-200 hover:bg-gray-300 p-4 rounded-md mt-2 cursor-pointer"
                          onDrop={dropFilesToUpload}
                          onDrag={dropFilesToUpload}
                          onClick={() => {
                            imageUploaderInput.current?.click();
                          }}
                        >
                          <div className="text-sm">
                            Click me to browse image file
                          </div>
                          <input
                            type="file"
                            multiple={true}
                            ref={imageUploaderInput}
                            className="hidden"
                            onChange={event => {
                              const files = event.target.files ?? [];
                              for (let i = 0; i < files.length; i++) {
                                // TODO:
                              }
                              event.target.value = '';
                            }}
                          />
                        </div>
                        <div className="mt-2 text-sm">
                          <span>use</span>
                          <select
                            value={imageUploader}
                            onChange={event => {
                              setImageUploader(event.target.value);
                              postMessage('setImageUploader', [
                                event.target.value,
                              ]);
                            }}
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
