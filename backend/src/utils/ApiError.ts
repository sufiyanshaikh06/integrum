import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: any[];

  constructor(statusCode: number, message: string, errors: any[] = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors: any[] = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized', errors: any[] = []) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  static forbidden(message = 'Forbidden', errors: any[] = []) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  static notFound(message = 'Not Found', errors: any[] = []) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  static conflict(message = 'Conflict', errors: any[] = []) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  static internal(message = 'Internal Server Error', errors: any[] = []) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors, false);
  }
}
