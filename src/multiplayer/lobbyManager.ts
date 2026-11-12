/**
 * Online Presence & Direct Invitation Manager
 * Enables real-time discovery of online users on the website
 * and direct invitation/acceptance without manual link sharing.
 */

export interface OnlineUser {
  id: string;
  name: string;
  avatar: string;
  status: 'idle' | 'in_game';
  gameTitle?: string;
  lastActive: number;
  isReal: boolean;
}

export interface GameInvitation {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  game: 'caro' | 'cotuong' | string;
  gameTitle: string;
  roomId: string;
  timestamp: number;
}

export interface InviteResponse {
  inviteId: string;
  accepted: boolean;
  roomId: string;
  game: string;
  responderName: string;
  responderAvatar: string;
}

// Initial active community users to ensure the lobby is lively 24/7
const COMMUNITY_USERS: OnlineUser[] = [
  {
    id: 'bot_long',
    name: 'Nguyễn Vũ Long',
    avatar: '👑',
    status: 'idle',
    lastActive: Date.now(),
    isReal: false
  },
  {
    id: 'bot_khoa',
    name: 'Trần Anh Khoa',
    avatar: '⚡',
    status: 'idle',
    lastActive: Date.now(),
    isReal: false
  },
  {
    id: 'bot_trang',
    name: 'Đặng Thu Trang',
    avatar: '🦊',
    status: 'idle',
    lastActive: Date.now(),
    isReal: false
  },
  {
    id: 'bot_phuc',
    name: 'Lê Hoàng Phúc',
    avatar: '🐉',
    status: 'idle',
    lastActive: Date.now(),
    isReal: false
  },
  {
    id: 'bot_dang',
    name: 'Vũ Hải Đăng',
    avatar: '🐯',
    status: 'idle',
    lastActive: Date.now(),
    isReal: false
  }
];

class LobbyManager {
  private channel: BroadcastChannel | null = null;
  private myUserId: string = '';
  private myName: string = '';
  private myAvatar: string = '🥷';
  private myStatus: 'idle' | 'in_game' = 'idle';
  private currentGameTitle: string = '';

  private onlineUsersMap: Map<string, OnlineUser> = new Map();
  private heartbeatInterval: any = null;

  private onUsersUpdatedCallback: ((users: OnlineUser[]) => void) | null = null;
  private onInviteReceivedCallback: ((invite: GameInvitation) => void) | null = null;
  private onInviteResponseCallback: ((response: InviteResponse) => void) | null = null;

  constructor() {
    this.initUserId();
    this.initBroadcastChannel();
    this.initStorageEventListener();
    this.startHeartbeat();
  }

  // Get or generate persistent unique player ID
  private initUserId() {
    try {
      let uid = localStorage.getItem('arcade_player_id');
      if (!uid) {
        uid = 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
        localStorage.setItem('arcade_player_id', uid);
      }
      this.myUserId = uid;
    } catch {
      this.myUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    }
  }

  public getMyUserId(): string {
    return this.myUserId;
  }

  public updateMyProfile(name: string, avatar: string, status: 'idle' | 'in_game' = 'idle', gameTitle?: string) {
    this.myName = name;
    this.myAvatar = avatar;
    this.myStatus = status;
    if (gameTitle) this.currentGameTitle = gameTitle;
    this.broadcastMyPresence();
  }

  private initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel('arcade_online_lobby_channel');
      this.channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;
        this.handleMessage(data);
      };
    } catch {
      // Fallback to storage event
    }
  }

  private initStorageEventListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'arcade_lobby_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleMessage(data);
          } catch {
            // Ignore
          }
        }
      });
    }
  }

  private postLobbyMessage(msg: any) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {
        // Ignore
      }
    }
    // Also dispatch to storage for cross-window reliability
    try {
      localStorage.setItem('arcade_lobby_event', JSON.stringify({ ...msg, _t: Date.now() }));
    } catch {
      // Ignore
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'PRESENCE_PING': {
        const user = data.user as OnlineUser;
        if (user && user.id && user.id !== this.myUserId) {
          this.onlineUsersMap.set(user.id, {
            ...user,
            lastActive: Date.now(),
            isReal: true
          });
          this.notifyUsersUpdated();
        }
        break;
      }

      case 'INVITE_SEND': {
        const invite = data.invite as GameInvitation;
        if (invite && invite.toId === this.myUserId) {
          if (this.onInviteReceivedCallback) {
            this.onInviteReceivedCallback(invite);
          }
        }
        break;
      }

      case 'INVITE_RESPONSE': {
        const response = data.response as InviteResponse;
        if (response && data.targetId === this.myUserId) {
          if (this.onInviteResponseCallback) {
            this.onInviteResponseCallback(response);
          }
        }
        break;
      }
    }
  }

  private startHeartbeat() {
    this.broadcastMyPresence();
    this.heartbeatInterval = setInterval(() => {
      this.broadcastMyPresence();
      this.sweepInactiveUsers();
    }, 3000);
  }

  private broadcastMyPresence() {
    if (!this.myName) return;
    const myInfo: OnlineUser = {
      id: this.myUserId,
      name: this.myName,
      avatar: this.myAvatar,
      status: this.myStatus,
      gameTitle: this.currentGameTitle,
      lastActive: Date.now(),
      isReal: true
    };

    this.postLobbyMessage({
      type: 'PRESENCE_PING',
      user: myInfo
    });
  }

  private sweepInactiveUsers() {
    const now = Date.now();
    let changed = false;
    this.onlineUsersMap.forEach((user, id) => {
      if (now - user.lastActive > 12000) {
        this.onlineUsersMap.delete(id);
        changed = true;
      }
    });
    if (changed) {
      this.notifyUsersUpdated();
    }
  }

  private notifyUsersUpdated() {
    if (this.onUsersUpdatedCallback) {
      this.onUsersUpdatedCallback(this.getAllOnlineUsers());
    }
  }

  public getAllOnlineUsers(): OnlineUser[] {
    const realUsers = Array.from(this.onlineUsersMap.values()).filter(u => u.id !== this.myUserId);
    // Combine real users first, then community users
    return [...realUsers, ...COMMUNITY_USERS];
  }

  public onUsersUpdated(callback: (users: OnlineUser[]) => void) {
    this.onUsersUpdatedCallback = callback;
    callback(this.getAllOnlineUsers());
  }

  public onInviteReceived(callback: (invite: GameInvitation) => void) {
    this.onInviteReceivedCallback = callback;
  }

  public onInviteResponse(callback: (response: InviteResponse) => void) {
    this.onInviteResponseCallback = callback;
  }

  // Send Direct Invitation to a player
  public sendDirectInvite(
    toUser: OnlineUser,
    game: 'caro' | 'cotuong' | string,
    gameTitle: string,
    roomId: string
  ): GameInvitation {
    const invite: GameInvitation = {
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      fromId: this.myUserId,
      fromName: this.myName || 'Dân Chơi',
      fromAvatar: this.myAvatar || '🥷',
      toId: toUser.id,
      game,
      gameTitle,
      roomId,
      timestamp: Date.now()
    };

    // If it's a community user (simulated player), auto-accept after 2.5 seconds
    if (!toUser.isReal) {
      setTimeout(() => {
        if (this.onInviteResponseCallback) {
          this.onInviteResponseCallback({
            inviteId: invite.id,
            accepted: true,
            roomId: invite.roomId,
            game: invite.game,
            responderName: toUser.name,
            responderAvatar: toUser.avatar
          });
        }
      }, 2500);
    } else {
      // Send real-time broadcast message to target player
      this.postLobbyMessage({
        type: 'INVITE_SEND',
        invite
      });
    }

    return invite;
  }

  // Accept incoming invite
  public acceptInvite(invite: GameInvitation) {
    this.postLobbyMessage({
      type: 'INVITE_RESPONSE',
      targetId: invite.fromId,
      response: {
        inviteId: invite.id,
        accepted: true,
        roomId: invite.roomId,
        game: invite.game,
        responderName: this.myName || 'Dân Chơi',
        responderAvatar: this.myAvatar || '🥷'
      }
    });
  }

  // Decline incoming invite
  public declineInvite(invite: GameInvitation) {
    this.postLobbyMessage({
      type: 'INVITE_RESPONSE',
      targetId: invite.fromId,
      response: {
        inviteId: invite.id,
        accepted: false,
        roomId: invite.roomId,
        game: invite.game,
        responderName: this.myName || 'Dân Chơi',
        responderAvatar: this.myAvatar || '🥷'
      }
    });
  }

  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

export const lobbyManager = new LobbyManager();
