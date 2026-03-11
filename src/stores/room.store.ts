import {create} from 'zustand';
import type {Room} from '../models';
import {roomService} from '../services/room.service';

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  pagination: {page: number; pages: number; total: number} | null;

  fetchRooms: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room) => void;
  updateFromSocket: (room: Room) => void;
  clearCurrent: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  pagination: null,

  fetchRooms: async (params?) => {
    set({isLoading: true});
    try {
      const result = await roomService.listRooms(params);
      set({rooms: result.rooms, pagination: result.pagination, isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  fetchRoom: async (roomId: string) => {
    set({isLoading: true});
    try {
      const room = await roomService.getRoom(roomId);
      set({currentRoom: room, isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  setCurrentRoom: (room: Room) => set({currentRoom: room}),

  updateFromSocket: (room: Room) => {
    const state = get();
    if (state.currentRoom?.id === room.id) {
      set({currentRoom: room});
    }
    set({
      rooms: state.rooms.map(r => (r.id === room.id ? room : r)),
    });
  },

  clearCurrent: () => set({currentRoom: null}),
}));
