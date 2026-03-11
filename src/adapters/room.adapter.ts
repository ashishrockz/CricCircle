import type {Adapter} from './base.adapter';
import type {Room, PlayerSlot, TossResult} from '../models';
import {userAdapter} from './user.adapter';

export const playerSlotAdapter: Adapter<PlayerSlot> = {
  adapt(data: any): PlayerSlot {
    return {
      id: data._id || data.id,
      userId: data.userId?._id || data.userId,
      name: data.name || '',
      isStatic: data.isStatic ?? false,
      team: data.team || null,
      role: data.role || '',
      isActive: data.isActive ?? true,
    };
  },
};

export const tossAdapter: Adapter<TossResult> = {
  adapt(data: any): TossResult {
    return {
      initiatedBy: data.initiatedBy,
      coinResult: data.coinResult,
      call: data.call,
      callerTeam: data.callerTeam,
      winnerTeam: data.winnerTeam,
      choice: data.choice,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
    };
  },
};

export const roomAdapter: Adapter<Room> = {
  adapt(data: any): Room {
    const creator =
      typeof data.creator === 'object' && data.creator
        ? userAdapter.adapt(data.creator)
        : data.creator;

    return {
      id: data._id || data.id,
      sportTypeId:
        typeof data.sportTypeId === 'object'
          ? data.sportTypeId._id
          : data.sportTypeId,
      name: data.name || '',
      creator,
      status: data.status || 'waiting',
      matchType: data.matchType || 'local',
      players: (data.players || []).map((p: any) => playerSlotAdapter.adapt(p)),
      toss: data.toss?.coinResult ? tossAdapter.adapt(data.toss) : null,
      matchId: data.matchId?._id || data.matchId,
      maxPlayers: data.maxPlayers || 0,
      minPlayers: data.minPlayers || 0,
      teamAName: data.teamAName || 'Team A',
      teamBName: data.teamBName || 'Team B',
      oversPerInnings: data.oversPerInnings ?? null,
      captainA: data.captainA || null,
      captainB: data.captainB || null,
      createdAt: new Date(data.createdAt),
    };
  },
};
