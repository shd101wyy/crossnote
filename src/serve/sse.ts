import * as http from 'http';

export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * Minimal Server-Sent Events hub: browsers subscribe once at `/api/events`
 * and receive every render/config/file event as JSON payloads.
 */
export class SSEHub {
  private clients = new Set<http.ServerResponse>();
  private heartbeat: NodeJS.Timeout | null = null;

  public addClient(response: http.ServerResponse): void {
    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
    });
    response.write('retry: 3000\n\n');
    this.clients.add(response);
    if (!this.heartbeat) {
      // Send a comment ping every 25s so proxies don't close idle streams.
      this.heartbeat = setInterval(() => {
        this.broadcastRaw(': ping\n\n');
      }, 25000);
    }
    response.on('close', () => {
      this.clients.delete(response);
      if (this.clients.size === 0 && this.heartbeat) {
        clearInterval(this.heartbeat);
        this.heartbeat = null;
      }
    });
  }

  public broadcast(event: SSEEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    this.broadcastRaw(payload);
  }

  private broadcastRaw(chunk: string): void {
    for (const client of this.clients) {
      try {
        client.write(chunk);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  public get clientCount(): number {
    return this.clients.size;
  }

  public dispose(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    for (const client of this.clients) {
      try {
        client.end();
      } catch {
        // Already closed.
      }
    }
    this.clients.clear();
  }
}
