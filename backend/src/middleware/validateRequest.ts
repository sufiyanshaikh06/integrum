import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const validateRequest = (schema: z.ZodType<{ body?: unknown; query?: unknown; params?: unknown }>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Express 5 exposes query through a getter. Shadow it on this request
      // so controllers consume the validated/coerced result, not raw input.
      for (const key of ['body', 'query', 'params'] as const) {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) {
          Object.defineProperty(req, key, {
            value: parsed[key], writable: true, enumerable: true, configurable: true,
          });
        }
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as any;
        const issues = zodError.issues || zodError.errors || [];
        const errors = issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(ApiError.badRequest('Validation failed', errors));
      } else {
        next(error);
      }
    }
  };
};

