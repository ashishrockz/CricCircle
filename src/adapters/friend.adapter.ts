import type {Adapter} from './base.adapter';
import type {Friend, FriendRequest, FriendStats} from '../models';
import {userAdapter} from './user.adapter';

export const friendAdapter: Adapter<Friend> = {
  adapt(data: any): Friend {
    return {
      id: data._id || data.id,
      user: userAdapter.adapt(data.friend || data.user || data),
      since: new Date(data.createdAt || data.since),
    };
  },
};

export const friendRequestAdapter: Adapter<FriendRequest> = {
  adapt(data: any): FriendRequest {
    const fromRaw = data.from || data.requester;
    const toRaw = data.to || data.recipient;
    return {
      id: data._id || data.id || data.friendshipId,
      from:
        typeof fromRaw === 'object' && fromRaw
          ? userAdapter.adapt(fromRaw)
          : ({id: fromRaw, name: '', username: ''} as any),
      to:
        typeof toRaw === 'object' && toRaw
          ? userAdapter.adapt(toRaw)
          : ({id: toRaw, name: '', username: ''} as any),
      status: data.status || 'pending',
      createdAt: new Date(data.createdAt),
    };
  },
};

export const friendStatsAdapter: Adapter<FriendStats> = {
  adapt(data: any): FriendStats {
    return {
      total: data.total || 0,
      incoming: data.incoming || 0,
      outgoing: data.outgoing || 0,
    };
  },
};
