import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  if (res.headersSent) return _next(err);
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  if (err instanceof multer.MulterError) {
    // multer limit errors (file too large, too many files, etc.)
    if (err.code === 'LIMIT_FILE_SIZE') {
      ApiResponse.error(res, 'File too large. Maximum allowed size is 10 MB.', [], 413);
    } else {
      ApiResponse.error(res, `Upload error: ${err.message}`, [], 400);
    }
    return;
  }

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors ?? [];
    if (env.NODE_ENV !== 'production') {
      console.error(err);
    } else {
      console.error(`[${statusCode}] ${message}`);
    }
  } else if (err?.name === 'ZodError' || err?.issues) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues ?? err.errors ?? [];
  } else {
    // Unknown error — NEVER send raw err.message to client
    if (env.NODE_ENV !== 'production') {
      console.error(err);
    } else {
      console.error(`[500] Unhandled: ${err?.message ?? 'unknown'}`);
    }
    // statusCode = 500, message = 'Internal Server Error' by default
  }

  ApiResponse.error(res, message, errors, statusCode);
};
