import { Request, Response, NextFunction } from 'express';

// Temporal implementation

export interface AuthUser {
    id: number;
    role: 'customer' | 'store_admin' | 'platform_admin';
    storeId?: number | null; // Solo relevante para store_admin, puede ser null para otros roles
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // TODO: Replace with real JWT verification once auth service is defined
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId || !userRole) {
    res.status(401).json({ error: 'Unauthorized — missing auth headers' });
    return;
  }

  const id = Number(userId);
  if (isNaN(id)) {
    res.status(401).json({ error: 'Unauthorized — invalid user id' });
    return;
  }

  const validRoles = ['customer', 'store_admin', 'platform_admin'];
  if (!validRoles.includes(userRole as string)) {
    res.status(401).json({ error: 'Unauthorized — invalid role' });
    return;
  }

  req.user = {
    id: id,
    role: userRole as AuthUser['role'],
  };

  next();
}

// Role guard factory
// Usage: requireRole('store_admin') or requireRole('store_admin', 'platform_admin')
export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden — insufficient permissions' });
      return;
    }
    next();
  };
}