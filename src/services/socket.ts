import { io, Socket } from "socket.io-client";

// ==================== SOCKET DISABLED ====================
// WebSocket connection is currently disabled to prevent console errors
// Enable when backend WebSocket server is ready
const SOCKET_ENABLED = false;

class SocketClient {
  private socket: Socket | null = null;

  connect(token?: string) {
    // Socket connection disabled - return null to prevent ERR_CONNECTION_REFUSED
    if (!SOCKET_ENABLED) {
      console.log("ℹ️ [Socket] WebSocket disabled - enable SOCKET_ENABLED flag when ready");
      return null;
    }
    
    if (this.socket) return this.socket;
    this.socket = io(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000", {
      auth: token ? { token } : undefined,
    });
    return this.socket;
  }

  subscribe<T>(event: string, handler: (payload: T) => void) {
    if (!SOCKET_ENABLED || !this.socket) return () => {}; // Return noop cleanup function
    
    this.socket.on(event, handler);
    return () => this.socket?.off(event, handler);
  }

  emit<T>(event: string, payload: T) {
    if (!SOCKET_ENABLED || !this.socket) return;
    
    this.socket.emit(event, payload);
  }

  disconnect() {
    if (!SOCKET_ENABLED || !this.socket) return;
    
    this.socket.disconnect();
    this.socket = null;
  }
}

export const socketClient = new SocketClient();
