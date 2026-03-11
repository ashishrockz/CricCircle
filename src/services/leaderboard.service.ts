import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import {leaderboardAdapter} from '../adapters/leaderboard.adapter';
import type {LeaderboardEntry} from '../models';

interface LeaderboardParams {
  period?: 'weekly' | 'monthly' | 'alltime';
  limit?: number;
  scope?: 'all' | 'friends';
  matchType?: 'all' | 'local' | 'tournament';
}

export const leaderboardService = {
  async getCricketBatting(
    params?: LeaderboardParams,
  ): Promise<LeaderboardEntry[]> {
    const {data} = await client.get(ENDPOINTS.LEADERBOARDS.CRICKET_BATTING, {
      params,
    });
    return leaderboardAdapter.adapt(data);
  },

  async getCricketBowling(
    params?: LeaderboardParams,
  ): Promise<LeaderboardEntry[]> {
    const {data} = await client.get(ENDPOINTS.LEADERBOARDS.CRICKET_BOWLING, {
      params,
    });
    return leaderboardAdapter.adapt(data);
  },

  async getWins(params?: LeaderboardParams): Promise<LeaderboardEntry[]> {
    const {data} = await client.get(ENDPOINTS.LEADERBOARDS.WINS, {params});
    return leaderboardAdapter.adapt(data);
  },

  async getMostMatches(
    params?: LeaderboardParams,
  ): Promise<LeaderboardEntry[]> {
    const {data} = await client.get(ENDPOINTS.LEADERBOARDS.MOST_MATCHES, {
      params,
    });
    return leaderboardAdapter.adapt(data);
  },
};
