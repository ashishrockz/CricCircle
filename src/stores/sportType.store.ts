import {create} from 'zustand';
import type {SportType} from '../models';
import {sportTypeService} from '../services/sportType.service';
import {CONFIG} from '../config';

interface SportTypeState {
  sportType: SportType | null;
  sportTypeId: string | null;
  isLoaded: boolean;
  error: string | null;

  fetchBySlug: () => Promise<void>;
}

export const useSportTypeStore = create<SportTypeState>(set => ({
  sportType: null,
  sportTypeId: null,
  isLoaded: false,
  error: null,

  fetchBySlug: async () => {
    try {
      set({error: null});
      const sportType = await sportTypeService.getBySlug(
        CONFIG.SPORT_TYPE_SLUG,
      );
      set({sportType, sportTypeId: sportType.id, isLoaded: true});
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to load sport type',
        isLoaded: false,
      });
    }
  },
}));
