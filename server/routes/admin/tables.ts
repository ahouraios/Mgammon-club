import { Router } from 'express';
import QRCode from 'qrcode';
import { db } from '../../db/database.ts';
import { authenticate, AuthenticatedRequest, requireRole } from '../../middleware/auth.ts';

const router = Router();

// GET /api/admin/tables
router.get('/', authenticate, (req, res) => {
  try {
    const tables = db.getAllTables();
    res.json({ success: true, data: tables });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/tables
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const { table_number, name, capacity } = req.body;
    if (!table_number) {
      res.status(400).json({ success: false, message: 'شماره میز الزامی است.' });
      return;
    }

    const table = db.createTable(
      Number(table_number),
      name || `میز تخته‌نرد شماره ${table_number}`,
      Number(capacity) || 2
    );

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'TABLE_CREATED',
      entity: 'TABLE',
      entity_id: table.id,
      new_values: { table_number, name: table.name },
      ip_address: req.ip,
    });

    res.status(201).json({ success: true, message: 'میز با موفقیت ایجاد گردید.', data: table });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/tables/:id/toggle
router.patch('/:id/toggle', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const table = db.getTableById(req.params.id);
    if (!table) {
      res.status(404).json({ success: false, message: 'میز یافت نشد.' });
      return;
    }

    const updated = db.updateTable(table.id, { is_active: !table.is_active });

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'TABLE_STATUS_TOGGLED',
      entity: 'TABLE',
      entity_id: table.id,
      new_values: { is_active: updated.is_active },
      ip_address: req.ip,
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/admin/tables/:id/regenerate-qr
router.post('/:id/regenerate-qr', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.regenerateTableToken(req.params.id);

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'TABLE_QR_REGENERATED',
      entity: 'TABLE',
      entity_id: updated.id,
      new_values: { qr_token: updated.qr_token },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'توکن جدید QR با موفقیت صادر گردید.', data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/admin/tables/:id/qr-code
router.get('/:id/qr-code', authenticate, async (req, res) => {
  try {
    const table = db.getTableById(req.params.id);
    if (!table) {
      res.status(404).json({ success: false, message: 'میز یافت نشد.' });
      return;
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol;
    const origin = process.env.PUBLIC_APP_URL || `${protocol}://${host}`;
    const targetUrl = `${origin}/?table=${table.qr_token}`;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1C1511',
        light: '#FFFFFF',
      },
    });

    res.json({
      success: true,
      data: {
        table_id: table.id,
        table_number: table.table_number,
        table_name: table.name,
        target_url: targetUrl,
        qr_data_url: qrDataUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
