import $ from 'jquery';
import 'jquery-modal/jquery.modal.min.css';
import 'jquery-modal/jquery.modal.min.js';
import React, {
  DragEvent,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from 'react';
import WebviewContainer from '../containers/webview';

export default function ImageHelper() {
  const { postMessage, config } = WebviewContainer.useContainer();
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
          $['modal'].close(); // close modal
          postMessage('insertImageUrl', [this.sourceUri, url]);
        }
        return false;
      } else {
        return true;
      }
    },
    [urlEditor, postMessage],
  );

  const dropFilesToCopy = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // paste
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      // TODO:
      console.log(files[i]);
    }
    $['modal'].close(); // Close modal
  }, []);

  const dropFilesToUpload = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // upload
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      // TODO:
      console.log(files[i]);
    }
    $['modal'].close(); // Close modal
  }, []);

  return (
    <div id="image-helper-view">
      <h4>Image Helper</h4>
      <div className="upload-div">
        <label>Link</label>
        <input
          type="text"
          placeholder="enter image URL here, then press 'Enter' to insert."
          onKeyDown={urlEditorOnKeyDown}
          ref={urlEditor}
        />
        <div className="splitter"></div>
        <label>{`Copy image to ${
          config.imageFolderPath && config.imageFolderPath[0] === '/'
            ? 'workspace'
            : 'relative'
        } ${config.imageFolderPath} folder`}</label>
        <div
          className="drop-area paster"
          onDrop={dropFilesToCopy}
          onDrag={dropFilesToCopy}
          onClick={() => {
            imagePasterInput.current?.click();
          }}
        >
          <p className="paster"> Click me to browse image file </p>
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
        <div className="splitter"></div>
        <label>Upload</label>
        <div
          className="drop-area uploader"
          onDrop={dropFilesToUpload}
          onDrag={dropFilesToUpload}
          onClick={() => {
            imageUploaderInput.current?.click();
          }}
        >
          <p className="uploader">Click me to browse image file</p>
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
        <div>
          <span>use</span>
          <select
            value={imageUploader}
            onChange={event => {
              setImageUploader(event.target.value);
              postMessage('setImageUploader', [event.target.value]);
            }}
          >
            <option value={'imgur'}>imgur</option>
            <option value={'sm.ms'}>sm.ms</option>
            <option value={'qiniu'}>qiniu</option>
          </select>
          <span> to upload images</span>
        </div>
        <a href="#" id="show-uploaded-image-history">
          Show history
        </a>
      </div>
    </div>
  );
}
