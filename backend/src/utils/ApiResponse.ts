import { Response } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ApiResponse {
  static success(res: Response, message: string, data: any = {}, statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message: string, errors: any[] = [], statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}
