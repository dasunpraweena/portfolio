import { ApiError } from '../lib/errors.js';

export function requireAdmin(supabase, ids) {
  const allowed = new Set(ids);
  return async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i);
    if (!match || authorization.length > 8192) throw new ApiError(401, 'UNAUTHENTICATED', 'A valid Bearer access token is required.');
    let result;
    try { result = await supabase.auth.getUser(match[1]); } catch { throw new ApiError(503, 'AUTH_UNAVAILABLE', 'Authentication is temporarily unavailable.'); }
    if (result.error || !result.data?.user?.id) throw new ApiError(401, 'UNAUTHENTICATED', 'The access token is invalid or expired.');
    if (!allowed.has(result.data.user.id)) throw new ApiError(403, 'FORBIDDEN', 'This account is not authorized to manage the portfolio.');
    req.admin = Object.freeze({ id: result.data.user.id });
    next();
  };
}
