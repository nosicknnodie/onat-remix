export interface BrowserStableWebSocketOptions {
  reconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  maxReconnectAttempts?: number;
  pingIntervalMs?: number;
  onOpen?: () => void;
  onMessage?: (data: unknown) => void;
  onError?: (event: Event) => void;
  onClose?: () => void;
  onReconnectAttempt?: (attempt: number, delay: number) => void;
  pingMessage?: string; // optional ping payload
}

export class BrowserStableWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private heartbeatInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private closedByUser = false;

  constructor(
    private url: string,
    private options: BrowserStableWebSocketOptions = {},
  ) {
    this.connect();
  }

  private connect() {
    if (this.closedByUser) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.startHeartbeat();
      this.options.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        this.options.onMessage?.(JSON.parse(event.data));
      } catch (e) {
        console.error("⚠️ 메시지 파싱 오류", e);
      }
    };

    this.ws.onerror = (event) => {
      this.options.onError?.(event);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.options.onClose?.();
      this.scheduleReconnect();
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    const interval = this.options.pingIntervalMs ?? 15000;
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingMsg = this.options.pingMessage ?? JSON.stringify({ type: "ping" });
        this.ws.send(pingMsg);
      }
    }, interval);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }

  private scheduleReconnect() {
    if (this.closedByUser) return;
    const maxAttempts = this.options.maxReconnectAttempts ?? 10;
    if (this.reconnectAttempt >= maxAttempts) return;

    const baseDelay = this.options.reconnectDelayMs ?? 1000;
    const maxDelay = this.options.maxReconnectDelayMs ?? 10000;
    const delay = Math.min(baseDelay * 2 ** this.reconnectAttempt, maxDelay);

    this.options.onReconnectAttempt?.(this.reconnectAttempt + 1, delay);
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  send(data: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      throw new Error("WebSocket is not open");
    }
  }

  close() {
    this.closedByUser = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      // 연결 완료 후 닫기 (너무 빨리 close() 호출된 경우 방어)
      this.ws.addEventListener("open", () => {
        this.ws?.close();
      });
    } else if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CLOSING
    ) {
      this.ws.close();
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSocket(): WebSocket | null {
    return this.ws;
  }
}

// 사용 예시
/*
const socket = new BrowserStableWebSocket('wss://your.url/ws', {
  onOpen: () => console.log('🔌 연결됨'),
  onMessage: (data) => console.log('📥 메시지:', data),
  onError: (e) => console.error('❗ 오류:', e),
  onClose: () => console.log('❎ 연결 종료'),
  onReconnectAttempt: (n, d) => console.log(`🔁 재시도 #${n} (${d}ms 후)`),
  pingIntervalMs: 15000,
  maxReconnectAttempts: 5,
  pingMessage: 'ping'
});
*/
