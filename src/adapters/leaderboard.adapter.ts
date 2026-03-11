import type {Adapter} from './base.adapter';
import type {LeaderboardEntry} from '../models';

export const leaderboardAdapter: Adapter<LeaderboardEntry[]> = {
  adapt(data: any): LeaderboardEntry[] {
    const items = data?.leaderboard || data?.data || data;
    if (!Array.isArray(items)) return [];
    return items.map((item: any, index: number) => ({
      rank: item.rank || index + 1,
      userId: item.userId || item._id,
      name: item.name || '',
      avatar: item.avatar,
      value: item.runs ?? item.wickets ?? item.wins ?? item.matches ?? 0,
      extra: {
        ...(item.balls !== undefined && {balls: item.balls}),
        ...(item.average !== undefined && {average: item.average}),
        ...(item.strikeRate !== undefined && {strikeRate: item.strikeRate}),
        ...(item.economy !== undefined && {economy: item.economy}),
        ...(item.highScore !== undefined && {highScore: item.highScore}),
        ...(item.bestBowling !== undefined && {bestBowling: item.bestBowling}),
        ...(item.fours !== undefined && {fours: item.fours}),
        ...(item.sixes !== undefined && {sixes: item.sixes}),
        ...(item.losses !== undefined && {losses: item.losses}),
        ...(item.winPercentage !== undefined && {
          winPercentage: item.winPercentage,
        }),
      },
    }));
  },
};
