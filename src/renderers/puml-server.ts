import fetch from 'cross-fetch';
import plantumlEncoder from 'plantuml-encoder';

function isImageResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') ?? '';
  return ct.startsWith('image/');
}

async function responseToSvg(res: Response): Promise<string> {
  if (isImageResponse(res)) {
    // The server returned binary image data (e.g. PNG) instead of SVG
    // text.  Convert it to a base64 data URI and wrap in an <img> tag
    // so the consumer can embed it inline.  (#416)
    const contentType = res.headers.get('content-type') ?? 'image/png';
    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `<img src="data:${contentType};base64,${base64}" />`;
  }
  return res.text();
}

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
        responseToSvg,
      );
    } else {
      return fetch(this.serverURL, {
        method: 'POST',
        body: content,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }).then(responseToSvg);
    }
  }
}
