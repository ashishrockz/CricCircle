import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import type {SportProfile} from '../models';

const adaptBatting = (b: any) => ({
  runs: b?.runs || 0,
  innings: b?.innings || 0,
  highScore: b?.highScore || 0,
  fifties: b?.fifties || 0,
  hundreds: b?.hundreds || 0,
  fours: b?.fours || 0,
  sixes: b?.sixes || 0,
  notOuts: b?.notOuts || 0,
  average: b?.average || 0,
  strikeRate: b?.strikeRate || 0,
});

const adaptBowling = (b: any) => ({
  wickets: b?.wickets || 0,
  runsConceded: b?.runs || 0,
  oversBowled: b?.overs || 0,
  bestBowling: b?.bestBowling || '0/0',
  economy: b?.economy || 0,
  maidens: b?.maidens || 0,
});

const adaptProfile = (data: any): SportProfile => {
  const sportData = data[data.sport];
  const local = sportData?.local;
  const tournament = sportData?.tournaments;

  return {
    id: data._id || data.id,
    userId: data.userId,
    sport: data.sport,
    local: {
      matchesPlayed: local?.batting?.matches || 0,
      battingStats: adaptBatting(local?.batting),
      bowlingStats: adaptBowling(local?.bowling),
    },
    tournament: {
      matchesPlayed: tournament?.batting?.matches || 0,
      battingStats: adaptBatting(tournament?.batting),
      bowlingStats: adaptBowling(tournament?.bowling),
    },
    createdAt: new Date(data.createdAt),
  };
};

export const sportService = {
  async createProfile(sport: string): Promise<SportProfile> {
    const {data} = await client.post(ENDPOINTS.SPORTS.CREATE, {sport});
    return adaptProfile(data);
  },

  async listProfiles(): Promise<SportProfile[]> {
    const {data} = await client.get(ENDPOINTS.SPORTS.LIST);
    return (Array.isArray(data) ? data : data.data || []).map(adaptProfile);
  },

  async listProfilesByUser(userId: string): Promise<SportProfile[]> {
    const {data} = await client.get(ENDPOINTS.SPORTS.BY_USER(userId));
    return (Array.isArray(data) ? data : data.data || []).map(adaptProfile);
  },

  async getProfile(id: string): Promise<SportProfile> {
    const {data} = await client.get(ENDPOINTS.SPORTS.GET(id));
    return adaptProfile(data);
  },

  async updateProfile(
    id: string,
    updates: Partial<SportProfile>,
  ): Promise<SportProfile> {
    const {data} = await client.put(ENDPOINTS.SPORTS.UPDATE(id), updates);
    return adaptProfile(data);
  },

  async deleteProfile(id: string): Promise<void> {
    await client.delete(ENDPOINTS.SPORTS.DELETE(id));
  },
};
