import { ZodError } from 'zod';
import multer from 'multer';

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; }
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error instanceof ApiError ? error.status : 500;
  let code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  let message = error instanceof ApiError ? error.message : 'The request could not be completed.';
  let details;
  if (error instanceof ZodError) {
    status = 422; code = 'VALIDATION_ERROR'; message = 'Check the submitted fields.';
    details = error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = 'INVALID_UPLOAD'; message = 'Upload one file within the allowed size limit.';
  } else if (error.type === 'entity.too.large') {
    status = 413; code = 'BODY_TOO_LARGE'; message = 'The request body is too large.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'Supply a valid JSON request body.';
  } else if (error.code === 'P2002') {
    status = 409; code = 'CONFLICT'; message = 'A record with this unique value already exists.';
  } else if (error.code === 'P2003') {
    status = 409; code = 'REFERENCED_RECORD'; message = 'Check related records; a referenced record cannot be deleted.';
  } else if (error.code === 'P2025') {
    status = 404; code = 'NOT_FOUND'; message = 'This record does not exist.';
  } else if (/^P10\d\d$/.test(error.code || '') || ['ECONNREFUSED', 'ETIMEDOUT'].includes(error.code)) {
    status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'The database is temporarily unavailable.';
  }
  // Never log request bodies, tokens, connection strings, or raw SDK/database errors.
  if (status >= 500) console.error(JSON.stringify({ requestId: req.id, code, status }));
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}), requestId: req.id } });
}
