import { io, Socket } from "socket.io-client";

class SocketClient {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket) return this.socket;
    this.socket = io(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000", {
      auth: token ? { token } : undefined,
    });
    return this.socket;
  }

  subscribe<T>(event: string, handler: (payload: T) => void) {
    this.socket?.on(event, handler);
    return () => this.socket?.off(event, handler);
  }

  emit<T>(event: string, payload: T) {
    this.socket?.emit(event, payload);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketClient = new SocketClient();
