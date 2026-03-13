import type {Adapter} from './base.adapter';
import type {User} from '../models';

export const userAdapter: Adapter<User> = {
  adapt(data: any): User {
    return {
      id: data._id || data.id,
      name: data.name || '',
      username: data.username || '',
      phone: data.phone,
      email: data.email,
      avatar: data.avatar,
      friendsCount: data.friendsCount || 0,
      role: data.role || 'user',
      status: data.status || 'active',
      termsAcceptedAt: data.termsAcceptedAt ? new Date(data.termsAcceptedAt) : null,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  },
};
