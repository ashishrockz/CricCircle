import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import {
  friendAdapter,
  friendRequestAdapter,
  friendStatsAdapter,
} from '../adapters/friend.adapter';
import type {Friend, FriendRequest, FriendStats, FriendshipStatus} from '../models';

export const friendService = {
  async listFriends(): Promise<Friend[]> {
    const {data} = await client.get(ENDPOINTS.FRIENDS.LIST);
    return (Array.isArray(data) ? data : data.data || []).map((f: any) =>
      friendAdapter.adapt(f),
    );
  },

  async getStats(): Promise<FriendStats> {
    const {data} = await client.get(ENDPOINTS.FRIENDS.STATS);
    return friendStatsAdapter.adapt(data);
  },

  async getIncomingRequests(): Promise<FriendRequest[]> {
    const {data} = await client.get(ENDPOINTS.FRIENDS.INCOMING);
    return (Array.isArray(data) ? data : data.data || []).map((r: any) =>
      friendRequestAdapter.adapt(r),
    );
  },

  async getOutgoingRequests(): Promise<FriendRequest[]> {
    const {data} = await client.get(ENDPOINTS.FRIENDS.OUTGOING);
    return (Array.isArray(data) ? data : data.data || []).map((r: any) =>
      friendRequestAdapter.adapt(r),
    );
  },

  async getStatus(userId: string): Promise<FriendshipStatus> {
    const {data} = await client.get(ENDPOINTS.FRIENDS.STATUS(userId));
    return data.status || 'none';
  },

  async sendRequest(userId: string): Promise<FriendRequest> {
    const {data} = await client.post(ENDPOINTS.FRIENDS.REQUEST(userId));
    return friendRequestAdapter.adapt(data);
  },

  async acceptRequest(requestId: string): Promise<void> {
    await client.put(ENDPOINTS.FRIENDS.ACCEPT(requestId));
  },

  async rejectRequest(requestId: string): Promise<void> {
    await client.put(ENDPOINTS.FRIENDS.REJECT(requestId));
  },

  async cancelRequest(requestId: string): Promise<void> {
    await client.delete(ENDPOINTS.FRIENDS.CANCEL(requestId));
  },

  async unfriend(userId: string): Promise<void> {
    await client.delete(ENDPOINTS.FRIENDS.UNFRIEND(userId));
  },

  async blockUser(userId: string): Promise<void> {
    await client.post(ENDPOINTS.FRIENDS.BLOCK(userId));
  },

  async unblockUser(userId: string): Promise<void> {
    await client.delete(ENDPOINTS.FRIENDS.UNBLOCK(userId));
  },
};
