import { Readable } from "stream";
import * as fetch from "node-fetch";

export default class PlantUMLServerTask {
  private serverURL: string;

  constructor(serverURL: string) {
    this.serverURL = serverURL;
  }

  public generateSVG(content: string): Promise<string> {
    const contentStream = new Readable();
    contentStream.setEncoding("utf-8");
    contentStream.push(content);
    contentStream.push(null); // Mark end of stream
    return fetch(this.serverURL, {
      method: "POST",
      body: contentStream,
    }).then((res) => res.text());
  }
}
