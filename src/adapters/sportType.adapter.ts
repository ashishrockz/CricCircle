import type {Adapter} from './base.adapter';
import type {SportType} from '../models';

export const sportTypeAdapter: Adapter<SportType> = {
  adapt(data: any): SportType {
    return {
      id: data._id || data.id,
      name: data.name || '',
      slug: data.slug || '',
      sport: data.sport || 'cricket',
      description: data.description,
      config: {
        minPlayers: data.config?.minPlayers || 2,
        maxPlayers: data.config?.maxPlayers || 22,
        teamSize: data.config?.teamSize || 11,
        innings: data.config?.innings || 2,
        oversPerInnings: data.config?.oversPerInnings || 20,
        tossOptions: data.config?.tossOptions || ['bat', 'bowl'],
        roles: (data.config?.roles || []).map((r: any) => ({
          name: r.name,
          perTeam: r.perTeam || 0,
          required: r.required ?? false,
        })),
      },
      isActive: data.isActive ?? true,
      createdAt: new Date(data.createdAt),
    };
  },
};
