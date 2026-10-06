import { Router } from 'express';
import { db } from '../../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.ts';
import { OrderStatus, PaymentStatus } from '../../types/index.ts';

const router = Router();

// GET /api/admin/orders
router.get('/', authenticate, (req, res) => {
  try {
    const { status, table_id, payment_status, search } = req.query;

    const orders = db.getAllOrders({
      status: status as OrderStatus,
      table_id: table_id as string,
      payment_status: payment_status as PaymentStatus,
      search: search as string,
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/orders/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch('/:id/status', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { status, comment, cancellation_reason } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'وضعیت جدید الزامی است.' });
      return;
    }

    const order = db.updateOrderStatus(req.params.id, status as OrderStatus, {
      comment,
      changed_by_user_id: req.user?.id,
      cancellation_reason,
    });

    // Audit log
    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'ORDER_STATUS_CHANGED',
      entity: 'ORDER',
      entity_id: order.id,
      new_values: { new_status: status, comment, cancellation_reason },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: `وضعیت سفارش با موفقیت به ${status} تغییر یافت.`,
      data: order,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
