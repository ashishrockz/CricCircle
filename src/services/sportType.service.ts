import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import {sportTypeAdapter} from '../adapters/sportType.adapter';
import type {SportType} from '../models';

export const sportTypeService = {
  async getBySlug(slug: string): Promise<SportType> {
    const {data} = await client.get(ENDPOINTS.SPORT_TYPES.SLUG(slug));
    return sportTypeAdapter.adapt(data);
  },

  async getById(id: string): Promise<SportType> {
    const {data} = await client.get(ENDPOINTS.SPORT_TYPES.GET(id));
    return sportTypeAdapter.adapt(data);
  },

  async list(): Promise<SportType[]> {
    const {data} = await client.get(ENDPOINTS.SPORT_TYPES.LIST);
    return (Array.isArray(data) ? data : data.data || []).map((st: any) =>
      sportTypeAdapter.adapt(st),
    );
  },
};
