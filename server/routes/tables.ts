import { Router } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// GET /api/tables/validate-token/:token
// Validates a QR code token scanned by customer
router.get('/validate-token/:token', (req, res) => {
  try {
    const { token } = req.params;
    const table = db.getTableByToken(token);

    if (!table) {
      res.status(404).json({
        success: false,
        message: 'کد QR نامعتبر است یا این میز در حال حاضر فعال نیست.',
      });
      return;
    }

    // Create a secure table session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const session = db.createTableSession(table.id, userAgent);

    res.json({
      success: true,
      data: {
        table: {
          id: table.id,
          number: table.table_number,
          name: table.name,
          capacity: table.capacity,
        },
        session: {
          token: session.session_token,
          expires_at: session.expires_at,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tables/:id/info
router.get('/:id/info', (req, res) => {
  try {
    const table = db.getTableById(req.params.id);
    if (!table || !table.is_active) {
      res.status(404).json({ success: false, message: 'میز یافت نشد.' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: table.id,
        number: table.table_number,
        name: table.name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
