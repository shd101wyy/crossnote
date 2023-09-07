export interface WebviewConfig {
  usePandocParser?: boolean;
  scrollSync?: boolean;
  mathRenderingOption?: string;
  imageFolderPath?: string;
  imageUploader?: string;
  enableScriptExecution?: boolean;
  /**
   * Whether this preview is for vscode or not.
   */
  vscode?: boolean;
  zoomLevel?: number;

  sourceUri?: string;
  initialLine?: number;
  cursorLine?: number;
}

export type WebviewMessageEvent = {
  command: 'updateHTML';
  totalLineCount: number;
  sidebarTOCHTML: string;
  sourceUri: string;
  sourceScheme: string;
  html: string;
  id: string;
  class: string;
};

export type WebviewMessageType = WebviewMessageEvent['command'];
