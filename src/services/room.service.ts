import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { roomAdapter } from '../adapters/room.adapter';
import type {
  Room,
  CreateRoomPayload,
  AddFriendPlayerPayload,
  AddStaticPlayerPayload,
  TossPayload,
  TossChoicePayload,
  SwitchPlayerTeamPayload,
  SetPlayerRolePayload,
} from '../models';

export const roomService = {
  async createRoom(payload: CreateRoomPayload): Promise<Room> {
    const { data } = await client.post(ENDPOINTS.ROOMS.CREATE, payload);
    return roomAdapter.adapt(data);
  },

  async listRooms(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rooms: Room[]; pagination: any }> {
    const { data } = await client.get(ENDPOINTS.ROOMS.LIST, { params });
    return {
      rooms: (data.rooms || data.data || []).map((r: any) => roomAdapter.adapt(r)),
      pagination: data.pagination,
    };
  },

  async getRoom(roomId: string): Promise<Room> {
    const { data } = await client.get(ENDPOINTS.ROOMS.GET(roomId));
    return roomAdapter.adapt(data);
  },

  async addFriendPlayer(
    roomId: string,
    payload: AddFriendPlayerPayload,
  ): Promise<Room> {
    const { data } = await client.post(
      ENDPOINTS.ROOMS.ADD_FRIEND(roomId),
      payload,
    );
    return roomAdapter.adapt(data);
  },

  async addStaticPlayer(
    roomId: string,
    payload: AddStaticPlayerPayload,
  ): Promise<Room> {
    const { data } = await client.post(
      ENDPOINTS.ROOMS.ADD_STATIC(roomId),
      payload,
    );
    return roomAdapter.adapt(data);
  },

  async removePlayer(roomId: string, slotId: string): Promise<Room> {
    const { data } = await client.delete(
      ENDPOINTS.ROOMS.REMOVE_PLAYER(roomId, slotId),
    );
    return roomAdapter.adapt(data);
  },

  async lockRoom(roomId: string): Promise<Room> {
    const { data } = await client.post(ENDPOINTS.ROOMS.LOCK(roomId));
    return roomAdapter.adapt(data);
  },

  async performToss(roomId: string, payload: TossPayload): Promise<Room> {
    const { data } = await client.post(ENDPOINTS.ROOMS.TOSS(roomId), payload);
    return roomAdapter.adapt(data);
  },

  async tossChoice(roomId: string, payload: TossChoicePayload): Promise<Room> {
    const { data } = await client.post(ENDPOINTS.ROOMS.TOSS_CHOICE(roomId), payload);
    return roomAdapter.adapt(data);
  },

  async startRoom(roomId: string): Promise<Room> {
    const { data } = await client.post(ENDPOINTS.ROOMS.START(roomId));
    return roomAdapter.adapt(data);
  },

  async switchPlayerTeam(
    roomId: string,
    slotId: string,
    payload: SwitchPlayerTeamPayload,
  ): Promise<Room> {
    const { data } = await client.patch(
      ENDPOINTS.ROOMS.SWITCH_TEAM(roomId, slotId),
      payload,
    );
    return roomAdapter.adapt(data);
  },

  async setPlayerRole(
    roomId: string,
    slotId: string,
    payload: SetPlayerRolePayload,
  ): Promise<Room> {
    const { data } = await client.patch(
      ENDPOINTS.ROOMS.SET_ROLE(roomId, slotId),
      payload,
    );
    return roomAdapter.adapt(data);
  },

  async setCaptain(roomId: string, slotId: string): Promise<Room> {
    const { data } = await client.patch(
      ENDPOINTS.ROOMS.SET_CAPTAIN(roomId, slotId),
    );
    return roomAdapter.adapt(data);
  },

  async abandonRoom(roomId: string): Promise<Room> {
    const { data } = await client.post(ENDPOINTS.ROOMS.ABANDON(roomId));
    return roomAdapter.adapt(data);
  },
};
