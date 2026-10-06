import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';
import { RoleName, User } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'cafenard_club_production_jwt_secret_token_12345';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'توکن امنیتی یافت نشد. لطفاً مجدداً وارد حساب کاربری خود شوید.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; username: string; role: RoleName };
    const user = db.findUserById(payload.sub);

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'حساب کاربری نامعتبر یا غیرفعال است.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'توکن نامعتبر یا منقضی شده است.',
    });
  }
}

export function requireRole(allowedRoles: RoleName[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'ابتدا وارد سامانه شوید.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'شما دسترسی مجاز به این بخش از مدیریت را ندارید.',
      });
      return;
    }

    next();
  };
}
