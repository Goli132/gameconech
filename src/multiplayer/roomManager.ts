/**
 * Real-time Peer-to-Peer Room Manager using WebRTC (PeerJS)
 * with BroadcastChannel fallback for multi-tab testing.
 * Enables zero-server real-time multiplayer over invite links.
 */

import Peer, { DataConnection } from 'peerjs';

export type MultiplayerRole = 'host' | 'guest';

export interface RoomMessage {
  type: 'move' | 'chat' | 'restart' | 'undo' | 'handshake';
  payload: any;
  senderRole: MultiplayerRole;
  timestamp: number;
}

class RoomManager {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private role: MultiplayerRole = 'host';
  private onMoveCallback: ((payload: any) => void) | null = null;
  private onChatCallback: ((msg: string) => void) | null = null;
  private onRestartCallback: (() => void) | null = null;
  private onUndoCallback: (() => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private isConnected: boolean = false;

  // Generate safe peer prefix to avoid collisions on public broker
  private getPeerId(roomId: string, role: MultiplayerRole): string {
    return `game_co_${roomId}_${role}`;
  }

  // Create a Room (Host)
  public createRoom(
    game: 'caro' | 'cotuong',
    onConnected?: () => void,
    onDisconnected?: () => void
  ): { roomId: string; inviteUrl: string } {
    this.cleanup();
    this.role = 'host';
    this.onConnectedCallback = onConnected || null;
    this.onDisconnectedCallback = onDisconnected || null;

    // Random 6-digit room code
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const roomId = `${game}_${randomCode}`;
    this.currentRoomId = roomId;

    const hostPeerId = this.getPeerId(roomId, 'host');

    // 1. Initialize PeerJS Host
    try {
      this.peer = new Peer(hostPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        // Host ready and waiting for guest
      });

      this.peer.on('connection', (connection) => {
        this.conn = connection;
        this.setupConnectionHandlers(connection);
      });

      this.peer.on('error', (err) => {
        // Fallback or retry
        console.warn('Peer host error:', err);
      });
    } catch (e) {
      console.warn('WebRTC peer error:', e);
    }

    // 2. Setup BroadcastChannel fallback (works across tabs in same browser)
    try {
      this.broadcastChannel = new BroadcastChannel(`channel_${roomId}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as RoomMessage;
        if (msg && msg.senderRole === 'guest') {
          this.handleIncomingMessage(msg);
        }
      };
    } catch {
      // Ignore if unsupported
    }

    // Build Share URL
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteUrl = `${baseUrl}?game=${game}&room=${roomId}`;

    return { roomId, inviteUrl };
  }

  // Join an existing Room (Guest)
  public joinRoom(
    roomId: string,
    onConnected?: () => void,
    onDisconnected?: () => void
  ): Promise<boolean> {
    this.cleanup();
    this.role = 'guest';
    this.currentRoomId = roomId;
    this.onConnectedCallback = onConnected || null;
    this.onDisconnectedCallback = onDisconnected || null;

    const guestPeerId = this.getPeerId(roomId, 'guest');
    const hostPeerId = this.getPeerId(roomId, 'host');

    // 1. Setup BroadcastChannel fallback
    try {
      this.broadcastChannel = new BroadcastChannel(`channel_${roomId}`);
      this.broadcastChannel.onmessage = (event) => {
        const msg = event.data as RoomMessage;
        if (msg && msg.senderRole === 'host') {
          this.handleIncomingMessage(msg);
        }
      };
      // Send handshake on channel
      this.broadcastChannel.postMessage({
        type: 'handshake',
        payload: { ready: true },
        senderRole: 'guest',
        timestamp: Date.now()
      });
    } catch {
      // Ignore
    }

    return new Promise((resolve) => {
      let resolved = false;

      const triggerConnected = () => {
        if (!resolved) {
          resolved = true;
          this.isConnected = true;
          if (this.onConnectedCallback) this.onConnectedCallback();
          resolve(true);
        }
      };

      try {
        this.peer = new Peer(guestPeerId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', () => {
          if (!this.peer) return;
          const connection = this.peer.connect(hostPeerId, {
            reliable: true
          });
          this.conn = connection;
          this.setupConnectionHandlers(connection);

          connection.on('open', () => {
            triggerConnected();
            connection.send({
              type: 'handshake',
              payload: { ready: true },
              senderRole: 'guest',
              timestamp: Date.now()
            });
          });
        });

        this.peer.on('error', (err) => {
          console.warn('Peer join error:', err);
          // If PeerJS fails, broadcast channel may still connect if local
          setTimeout(() => {
            if (!resolved) {
              resolve(false);
            }
          }, 4000);
        });

        // Timeout fallback
        setTimeout(() => {
          if (!resolved) {
            triggerConnected(); // Allow local channel or retry
          }
        }, 5000);
      } catch (e) {
        console.warn('WebRTC join exception:', e);
        resolve(false);
      }
    });
  }

  // Setup connection handlers
  private setupConnectionHandlers(connection: DataConnection) {
    connection.on('open', () => {
      this.isConnected = true;
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
    });

    connection.on('data', (data) => {
      this.handleIncomingMessage(data as RoomMessage);
    });

    connection.on('close', () => {
      this.isConnected = false;
      if (this.onDisconnectedCallback) {
        this.onDisconnectedCallback();
      }
    });

    connection.on('error', () => {
      this.isConnected = false;
    });
  }

  // Dispatch incoming room messages
  private handleIncomingMessage(msg: RoomMessage) {
    if (!msg || !msg.type) return;

    if (msg.type === 'handshake') {
      this.isConnected = true;
      if (this.onConnectedCallback) {
        this.onConnectedCallback();
      }
      return;
    }

    if (msg.type === 'move' && this.onMoveCallback) {
      this.onMoveCallback(msg.payload);
    } else if (msg.type === 'chat' && this.onChatCallback) {
      this.onChatCallback(msg.payload);
    } else if (msg.type === 'restart' && this.onRestartCallback) {
      this.onRestartCallback();
    } else if (msg.type === 'undo' && this.onUndoCallback) {
      this.onUndoCallback();
    }
  }

  // Send move data to peer
  public sendMove(payload: any) {
    const msg: RoomMessage = {
      type: 'move',
      payload,
      senderRole: this.role,
      timestamp: Date.now()
    };
    this.dispatchMessage(msg);
  }

  // Send quick chat message
  public sendChat(text: string) {
    const msg: RoomMessage = {
      type: 'chat',
      payload: text,
      senderRole: this.role,
      timestamp: Date.now()
    };
    this.dispatchMessage(msg);
  }

  // Send restart game signal
  public sendRestart() {
    const msg: RoomMessage = {
      type: 'restart',
      payload: {},
      senderRole: this.role,
      timestamp: Date.now()
    };
    this.dispatchMessage(msg);
  }

  // Send undo move signal
  public sendUndo() {
    const msg: RoomMessage = {
      type: 'undo',
      payload: {},
      senderRole: this.role,
      timestamp: Date.now()
    };
    this.dispatchMessage(msg);
  }

  private dispatchMessage(msg: RoomMessage) {
    // 1. Send via WebRTC DataConnection
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
      } catch (e) {
        console.warn('Error sending via WebRTC:', e);
      }
    }

    // 2. Also send via BroadcastChannel fallback
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        // Ignore
      }
    }
  }

  // Callback listeners
  public onMove(cb: (payload: any) => void) {
    this.onMoveCallback = cb;
  }

  public onChat(cb: (msg: string) => void) {
    this.onChatCallback = cb;
  }

  public onRestart(cb: () => void) {
    this.onRestartCallback = cb;
  }

  public onUndo(cb: () => void) {
    this.onUndoCallback = cb;
  }

  public getRole(): MultiplayerRole {
    return this.role;
  }

  public getRoomId(): string | null {
    return this.currentRoomId;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // Cleanup
  public cleanup() {
    this.isConnected = false;
    this.currentRoomId = null;
    if (this.conn) {
      try { this.conn.close(); } catch { }
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch { }
      this.peer = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch { }
      this.broadcastChannel = null;
    }
  }
}

export const roomManager = new RoomManager();
