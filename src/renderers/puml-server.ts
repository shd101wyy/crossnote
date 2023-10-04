import fetch from 'cross-fetch';
import plantumlEncoder from 'plantuml-encoder';

export default class PlantUMLServerTask {
  private serverURL: string;

  constructor(serverURL: string) {
    this.serverURL = serverURL;
  }

  public generateSVG(content: string): Promise<string> {
    if (this.serverURL.match(/^https?:\/\/(www\.)?plantuml\.com\/plantuml/)) {
      // NOTE: The official plantuml server doesn't support POST method,
      // so we fallback to encode the content and send it as a GET request.
      const encoded = plantumlEncoder.encode(content);
      return fetch(`http://www.plantuml.com/plantuml/svg/${encoded}`).then(
        (res) => res.text(),
      );
    } else {
      // const contentStream = new Readable();
      // contentStream.setEncoding('utf-8');
      // contentStream.push(content);
      // contentStream.push(null); // Mark end of stream
      return fetch(this.serverURL, {
        method: 'POST',
        body: content,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }).then((res) => res.text());
    }
  }
}
