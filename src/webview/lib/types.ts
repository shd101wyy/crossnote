export type WebviewMessageEvent = {
  command: 'updateHtml';
  totalLineCount: number;
  sidebarTOCHTML: string;
  sourceUri: string;
  sourceScheme: string;
  html: string;
  id: string;
  class: string;
};

export type WebviewMessageType = WebviewMessageEvent['command'];
