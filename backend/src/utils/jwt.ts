import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  sid?: string;
  version?: number;
  exp?: number;
  sub: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    jwtid: randomUUID(),
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    jwtid: randomUUID(),
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

function verify(token: string, secret: string): JwtPayload {
  const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (typeof payload === 'string' || typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' || !Number.isInteger(payload.version) ||
      typeof payload.exp !== 'number' || typeof payload.email !== 'string' ||
      !['STUDENT', 'ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY'].includes(payload.role)) throw new Error('Invalid session claims');
  return payload as JwtPayload;
}
export const verifyAccessToken = (token: string): JwtPayload => verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token: string): JwtPayload => verify(token, env.JWT_REFRESH_SECRET);
