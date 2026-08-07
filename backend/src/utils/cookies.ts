import { Response } from 'express';
import { env } from '../config/env.js';

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
  // Typical refresh token validity is 7 days, let's parse from string if possible, or just default to 7 days
  // But we can also just let it be a session cookie or specify a maxAge.
  // We'll set maxAge to 7 days in milliseconds.
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: sevenDays,
  });
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};
