import {io, Socket} from 'socket.io-client';
import {CONFIG} from '../config';
import {useConfigStore} from '../stores/config.store';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  const {socketReconnectAttempts, socketReconnectDelayMs} =
    useConfigStore.getState().config.settings;

  socket = io(CONFIG.WS_URL, {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: socketReconnectAttempts,
    reconnectionDelay: socketReconnectDelayMs,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', reason => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('error', (err: {message: string}) => {
    console.error('[Socket] Error:', err.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const joinRoom = (roomId: string): void => {
  socket?.emit('join_room', {roomId});
};

export const leaveRoom = (roomId: string): void => {
  socket?.emit('leave_room', {roomId});
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event names for type-safe listeners
export const SOCKET_EVENTS = {
  ROOM_UPDATED: 'room:updated',
  TOSS_COMPLETED: 'toss:completed',
  MATCH_STARTED: 'match:started',
  MATCH_SCORE_UPDATE: 'match:score_update',
  MATCH_INNINGS_BREAK: 'match:innings_break',
  MATCH_INNINGS_RESUME: 'match:innings_resume',
  MATCH_COMPLETED: 'match:completed',
  MATCH_ABANDONED: 'match:abandoned',
  JOINED: 'joined',
} as const;
