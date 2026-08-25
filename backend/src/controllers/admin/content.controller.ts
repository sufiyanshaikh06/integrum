import { Request, Response } from 'express';
import { adminContentService } from '../../services/admin/content.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  ListAnnouncementsQuery,
  CreateInstitutionalEventInput,
  UpdateInstitutionalEventInput,
  ListInstitutionalEventsQuery,
  CreateAcademicResourceInput,
  UpdateAcademicResourceInput,
  ListAcademicResourcesQuery,
} from '../../schemas/admin/content.schema.js';

export const adminContentController = {
  // ─── ANNOUNCEMENT / NOTICE CONTROLLERS ────────────────────────────────────

  createAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateAnnouncementInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const announcement = await adminContentService.createAnnouncement(actorUserId, data, ipAddress);
    ApiResponse.success(
      res,
      `${data.type === 'NOTICE' ? 'Notice' : 'Announcement'} draft created successfully`,
      announcement,
      HTTP_STATUS.CREATED
    );
  }),

  listAnnouncements: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAnnouncementsQuery;
    const result = await adminContentService.listAnnouncements(query);
    ApiResponse.success(res, 'Announcements retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getAnnouncementById: asyncHandler(async (req: Request, res: Response) => {
    const announcement = await adminContentService.getAnnouncementById(req.params.id as string);
    ApiResponse.success(res, 'Announcement retrieved successfully', announcement, HTTP_STATUS.OK);
  }),

  updateAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateAnnouncementInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminContentService.updateAnnouncement(actorUserId, req.params.id as string, data, ipAddress);
    ApiResponse.success(res, 'Announcement updated successfully', updated, HTTP_STATUS.OK);
  }),

  publishAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const published = await adminContentService.publishAnnouncement(actorUserId, req.params.id as string, ipAddress);
    ApiResponse.success(res, 'Announcement published successfully', published, HTTP_STATUS.OK);
  }),

  unpublishAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const unpublished = await adminContentService.unpublishAnnouncement(actorUserId, req.params.id as string, ipAddress);
    ApiResponse.success(res, 'Announcement unpublished successfully', unpublished, HTTP_STATUS.OK);
  }),

  deleteAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminContentService.deleteAnnouncement(actorUserId, req.params.id as string, ipAddress);
    ApiResponse.success(res, 'Announcement deleted successfully', deleted, HTTP_STATUS.OK);
  }),

  // ─── INSTITUTIONAL EVENT CONTROLLERS ──────────────────────────────────────

  createEvent: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateInstitutionalEventInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const event = await adminContentService.createEvent(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Institutional event created successfully', event, HTTP_STATUS.CREATED);
  }),

  listEvents: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListInstitutionalEventsQuery;
    const result = await adminContentService.listEvents(query);
    ApiResponse.success(res, 'Institutional events retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getEventById: asyncHandler(async (req: Request, res: Response) => {
    const event = await adminContentService.getEventById(req.params.id as string);
    ApiResponse.success(res, 'Institutional event retrieved successfully', event, HTTP_STATUS.OK);
  }),

  updateEvent: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateInstitutionalEventInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminContentService.updateEvent(actorUserId, req.params.id as string, data, ipAddress);
    ApiResponse.success(res, 'Institutional event updated successfully', updated, HTTP_STATUS.OK);
  }),

  deleteEvent: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminContentService.deleteEvent(actorUserId, req.params.id as string, ipAddress);
    ApiResponse.success(res, 'Institutional event deleted successfully', deleted, HTTP_STATUS.OK);
  }),

  // ─── ACADEMIC RESOURCE CONTROLLERS ────────────────────────────────────────

  createResource: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as CreateAcademicResourceInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const resource = await adminContentService.createResource(actorUserId, data, ipAddress);
    ApiResponse.success(res, 'Academic resource created successfully', resource, HTTP_STATUS.CREATED);
  }),

  listResources: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListAcademicResourcesQuery;
    const result = await adminContentService.listResources(query);
    ApiResponse.success(res, 'Academic resources retrieved successfully', result, HTTP_STATUS.OK);
  }),

  getResourceById: asyncHandler(async (req: Request, res: Response) => {
    const resource = await adminContentService.getResourceById(req.params.id as string);
    ApiResponse.success(res, 'Academic resource retrieved successfully', resource, HTTP_STATUS.OK);
  }),

  updateResource: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const data = req.body as UpdateAcademicResourceInput;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const updated = await adminContentService.updateResource(actorUserId, req.params.id as string, data, ipAddress);
    ApiResponse.success(res, 'Academic resource updated successfully', updated, HTTP_STATUS.OK);
  }),

  deleteResource: asyncHandler(async (req: Request, res: Response) => {
    const actorUserId = req.user!.id;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const deleted = await adminContentService.deleteResource(actorUserId, req.params.id as string, ipAddress);
    ApiResponse.success(res, 'Academic resource deleted successfully', deleted, HTTP_STATUS.OK);
  }),
};
