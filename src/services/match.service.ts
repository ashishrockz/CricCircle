import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import {matchAdapter} from '../adapters/match.adapter';
import type {
  Match,
  RecordBallPayload,
  SetLineupPayload,
  CommentaryEntry,
} from '../models';

export const matchService = {
  async getMatch(matchId: string): Promise<Match> {
    const {data} = await client.get(ENDPOINTS.MATCHES.GET(matchId));
    return matchAdapter.adapt(data);
  },

  async getMatchByRoom(roomId: string): Promise<Match> {
    const {data} = await client.get(ENDPOINTS.MATCHES.BY_ROOM(roomId));
    return matchAdapter.adapt(data);
  },

  async startMatch(matchId: string): Promise<Match> {
    const {data} = await client.post(ENDPOINTS.MATCHES.START(matchId));
    return matchAdapter.adapt(data);
  },

  async completeMatch(
    matchId: string,
    body: {winner: string; margin?: string; description?: string},
  ): Promise<Match> {
    const {data} = await client.post(ENDPOINTS.MATCHES.COMPLETE(matchId), body);
    return matchAdapter.adapt(data);
  },

  async abandonMatch(matchId: string): Promise<Match> {
    const {data} = await client.post(ENDPOINTS.MATCHES.ABANDON(matchId));
    return matchAdapter.adapt(data);
  },

  async setLineup(matchId: string, payload: SetLineupPayload): Promise<Match> {
    const {data} = await client.post(
      ENDPOINTS.MATCHES.CRICKET_LINEUP(matchId),
      payload,
    );
    return matchAdapter.adapt(data);
  },

  async recordBall(
    matchId: string,
    payload: RecordBallPayload,
  ): Promise<Match> {
    const {data} = await client.post(
      ENDPOINTS.MATCHES.CRICKET_BALL(matchId),
      payload,
    );
    return matchAdapter.adapt(data);
  },

  async resumeInnings(matchId: string): Promise<Match> {
    const {data} = await client.post(ENDPOINTS.MATCHES.CRICKET_RESUME(matchId));
    return matchAdapter.adapt(data);
  },

  async getCommentary(
    matchId: string,
  ): Promise<{matchId: string; status: string; commentary: CommentaryEntry[]}> {
    const {data} = await client.get(ENDPOINTS.MATCHES.COMMENTARY(matchId));
    return {
      matchId: data.matchId,
      status: data.status,
      commentary: (data.commentary || []).map((c: any) => ({
        text: c.text || '',
        type: c.type || 'ball',
        inningsNumber: c.inningsNumber,
        overNumber: c.overNumber,
        ballNumber: c.ballNumber,
        timestamp: new Date(c.timestamp),
      })),
    };
  },
};
