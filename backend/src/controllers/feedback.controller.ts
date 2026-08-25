import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { SubmitFeedbackInput } from '../schemas/admin/platform.schema.js';

export const feedbackController = {
  /**
   * POST /api/v1/feedback
   * Allows authenticated student to submit feedback/bug reports.
   */
  submitFeedback: asyncHandler(async (req: Request, res: Response) => {
    const studentProfileId = req.user?.studentProfile?.id;
    if (!studentProfileId) {
      throw ApiError.forbidden('Only registered students can submit feedback');
    }

    const data = req.body as SubmitFeedbackInput;

    const feedback = await prisma.feedback.create({
      data: {
        studentProfileId,
        category: data.category,
        subject: data.subject,
        message: data.message,
        status: 'PENDING',
        resolvedByUserId: null,
        resolvedAt: null,
      },
      select: {
        id: true,
        category: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });

    ApiResponse.success(
      res,
      'Feedback submitted successfully. Thank you for your input!',
      feedback,
      HTTP_STATUS.CREATED
    );
  }),
};
