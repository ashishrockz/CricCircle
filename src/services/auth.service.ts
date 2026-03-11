import client from '../api/client';
import {ENDPOINTS} from '../api/endpoints';
import {authAdapter, otpSendAdapter} from '../adapters/auth.adapter';
import {userAdapter} from '../adapters/user.adapter';
import type {User} from '../models';
import type {AuthResult, OtpSendResult} from '../adapters/auth.adapter';

export const authService = {
  async sendOtp(identifier: string): Promise<OtpSendResult> {
    const type = identifier.includes('@') ? 'email' : 'phone';
    const {data} = await client.post(ENDPOINTS.AUTH.SEND_OTP, {identifier, type});
    return otpSendAdapter.adapt(data);
  },

  async verifyOtp(identifier: string, otp: string): Promise<AuthResult> {
    const type = identifier.includes('@') ? 'email' : 'phone';
    const {data} = await client.post(ENDPOINTS.AUTH.VERIFY_OTP, {identifier, type, otp});
    return authAdapter.adapt(data);
  },

  async getProfile(): Promise<User> {
    const {data} = await client.get(ENDPOINTS.USER.PROFILE);
    return userAdapter.adapt(data);
  },

  async updateProfile(updates: {
    name?: string;
    avatar?: string;
  }): Promise<User> {
    const {data} = await client.put(ENDPOINTS.USER.UPDATE, updates);
    return userAdapter.adapt(data);
  },
};
