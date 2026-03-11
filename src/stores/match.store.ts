import {create} from 'zustand';
import type {Match, CommentaryEntry} from '../models';
import {matchService} from '../services/match.service';
import {useConfigStore} from './config.store';

interface MatchState {
  currentMatch: Match | null;
  commentary: CommentaryEntry[];
  isLoading: boolean;

  fetchMatch: (matchId: string) => Promise<void>;
  setMatch: (match: Match) => void;
  updateFromSocket: (match: Match) => void;
  fetchCommentary: (matchId: string) => Promise<void>;
  addCommentary: (entries: CommentaryEntry[]) => void;
  clearMatch: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  commentary: [],
  isLoading: false,

  fetchMatch: async (matchId: string) => {
    set({isLoading: true});
    try {
      const match = await matchService.getMatch(matchId);
      set({currentMatch: match, commentary: match.commentary, isLoading: false});
    } catch {
      set({isLoading: false});
    }
  },

  setMatch: (match: Match) => {
    set({currentMatch: match, commentary: match.commentary});
  },

  updateFromSocket: (match: Match) => {
    set({currentMatch: match, commentary: match.commentary});
  },

  fetchCommentary: async (matchId: string) => {
    try {
      const result = await matchService.getCommentary(matchId);
      set({commentary: result.commentary});
    } catch {}
  },

  addCommentary: (entries: CommentaryEntry[]) => {
    const limit = useConfigStore.getState().config.settings.commentaryLimit;
    set(state => ({
      commentary: [...entries, ...state.commentary].slice(0, limit),
    }));
  },

  clearMatch: () => set({currentMatch: null, commentary: []}),
}));
