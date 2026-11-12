import { CorsOptions } from 'cors';
import { env } from './env.js';

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'https://integrum-beta.vercel.app',
  'https://integrum-app.vercel.app',
];

export const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>(defaultAllowedOrigins);

  if (env.CLIENT_URL) {
    origins.add(env.CLIENT_URL.trim().replace(/\/$/, ''));
  }

  if (env.ALLOWED_ORIGINS) {
    env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  return Array.from(origins);
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowed = getAllowedOrigins();
    const cleanOrigin = origin.trim().replace(/\/$/, '');

    if (allowed.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow Vercel preview environments (e.g., https://integrum-preview-xyz.vercel.app)
    if (/^https:\/\/integrum-[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow any localhost port in development
    if (env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
};
