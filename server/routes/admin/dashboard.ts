import { Router } from 'express';
import { db } from '../../db/database.ts';
import { authenticate } from '../../middleware/auth.ts';

const router = Router();

// GET /api/admin/dashboard
router.get('/', authenticate, (req, res) => {
  try {
    const metrics = db.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
