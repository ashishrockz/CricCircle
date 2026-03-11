import type {Adapter} from './base.adapter';
import type {MatchHighlights, HighlightItem} from '../models';

const adaptHighlightItem = (data: any): HighlightItem => ({
  type: data.type || 'general',
  title: data.title || '',
  description: data.description || '',
  value: data.value,
});

export const highlightsAdapter: Adapter<MatchHighlights> = {
  adapt(data: any): MatchHighlights {
    return {
      matchId: data.matchId || data._id,
      sport: data.sport || 'cricket',
      highlights: (data.highlights || []).map(adaptHighlightItem),
    };
  },
};
