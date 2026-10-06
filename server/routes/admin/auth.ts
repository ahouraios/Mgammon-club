import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../db/database.ts';
import { generateToken, authenticate, AuthenticatedRequest } from '../../middleware/auth.ts';

const router = Router();

// POST /api/admin/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'نام کاربری و کلمه عبور الزامی هستند.',
      });
      return;
    }

    const user = db.findUserByUsername(username);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'نام کاربری یا کلمه عبور اشتباه است.',
      });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'نام کاربری یا کلمه عبور اشتباه است.',
      });
      return;
    }

    const token = generateToken(user);

    db.logAudit({
      user_id: user.id,
      username: user.username,
      action: 'LOGIN',
      entity: 'USER',
      entity_id: user.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'ورود با موفقیت انجام شد.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'کاربر احراز هویت نشده است.' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      full_name: req.user.full_name,
      role: req.user.role,
      email: req.user.email,
      phone: req.user.phone,
    },
  });
});

export default router;
