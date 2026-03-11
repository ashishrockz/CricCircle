import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import {highlightsAdapter} from '../adapters/highlights.adapter';
import type {MatchHighlights} from '../models';

export const highlightsService = {
  async getHighlights(matchId: string): Promise<MatchHighlights> {
    const {data} = await client.get(ENDPOINTS.HIGHLIGHTS.GET(matchId));
    return highlightsAdapter.adapt(data);
  },
};
