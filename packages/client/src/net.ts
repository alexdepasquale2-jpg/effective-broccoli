import { ServerMessageSchema, type ClientMessage, type ServerMessage } from '@glimmer/shared';

type Handler = (msg: ServerMessage) => void;

/**
 * The client half of the game socket.
 *
 * Reconnects with backoff, because a dropped connection on a flaky train
 * should not mean losing the session. Outgoing input is dropped while
 * disconnected rather than queued: stale movement intent is worse than none.
 */
export class Connection {
  private ws: WebSocket | null = null;
  private handlers: Handler[] = [];
  private statusHandlers: ((status: ConnectionStatus) => void)[] = [];
  private reconnectDelay = 500;
  private closedByUs = false;

  status: ConnectionStatus = 'connecting';

  constructor(private readonly url: string) {}

  onMessage(fn: Handler): void {
    this.handlers.push(fn);
  }

  onStatus(fn: (status: ConnectionStatus) => void): void {
    this.statusHandlers.push(fn);
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const fn of this.statusHandlers) fn(status);
  }

  connect(): void {
    this.closedByUs = false;
    this.setStatus(this.ws ? 'reconnecting' : 'connecting');

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.reconnectDelay = 500;
      this.setStatus('online');
    });

    ws.addEventListener('message', (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const result = ServerMessageSchema.safeParse(parsed);
      if (!result.success) return;
      for (const fn of this.handlers) fn(result.data);
    });

    ws.addEventListener('close', () => {
      if (this.closedByUs) return;
      this.setStatus('offline');
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10_000);
    });

    ws.addEventListener('error', () => ws.close());
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    this.closedByUs = true;
    this.ws?.close();
  }
}

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline';
