import authClient from '../api/authClient';
import {ENDPOINTS} from '../api/endpoints';
import {authAdapter, otpSendAdapter} from '../adapters/auth.adapter';
import {userAdapter} from '../adapters/user.adapter';
import type {User} from '../models';
import type {AuthResult, OtpSendResult} from '../adapters/auth.adapter';

export const authService = {
  async sendOtp(identifier: string): Promise<OtpSendResult> {
    const type = identifier.includes('@') ? 'email' : 'phone';
    const {data} = await authClient.post(ENDPOINTS.AUTH.SEND_OTP, {identifier, type});
    return otpSendAdapter.adapt(data);
  },

  async verifyOtp(identifier: string, otp: string): Promise<AuthResult> {
    const type = identifier.includes('@') ? 'email' : 'phone';
    const {data} = await authClient.post(ENDPOINTS.AUTH.VERIFY_OTP, {identifier, type, otp});
    return authAdapter.adapt(data);
  },

  async getProfile(): Promise<User> {
    const {data} = await authClient.get(ENDPOINTS.USER.PROFILE);
    return userAdapter.adapt(data);
  },

  async updateProfile(updates: {
    name?: string;
    username?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    termsAcceptedAt?: string;
  }): Promise<User> {
    const {data} = await authClient.put(ENDPOINTS.USER.UPDATE, updates);
    return userAdapter.adapt(data);
  },

  async checkAvailability(
    field: 'username' | 'phone' | 'email',
    value: string,
  ): Promise<boolean> {
    const {data} = await authClient.get(ENDPOINTS.USER.CHECK_AVAILABILITY, {
      params: {field, value},
    });
    return data.available;
  },
};
