import type {Adapter} from './base.adapter';
import type {User} from '../models';
import {userAdapter} from './user.adapter';

export interface AuthResult {
  token: string;
  user: User;
}

export const authAdapter: Adapter<AuthResult> = {
  adapt(data: any): AuthResult {
    return {
      token: data.token,
      user: userAdapter.adapt(data.user),
    };
  },
};

export interface OtpSendResult {
  message: string;
  otp?: string; // Dev mode only
}

export const otpSendAdapter: Adapter<OtpSendResult> = {
  adapt(data: any): OtpSendResult {
    return {
      message: data.message,
      otp: data.otp,
    };
  },
};
