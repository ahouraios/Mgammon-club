import { Router } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// POST /api/orders - Guest creates order from table
router.post('/', (req, res) => {
  try {
    const { table_id, session_token, guest_name, guest_phone, notes, items } = req.body;

    if (!table_id) {
      res.status(400).json({ success: false, message: 'شناسه میز الزامی است.' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'سبد خرید نمی‌تواند خالی باشد.' });
      return;
    }

    // Verify session token if provided
    if (session_token) {
      const session = db.validateSession(session_token);
      if (session && session.table_id !== table_id) {
        res.status(403).json({
          success: false,
          message: 'نشست کاربری با میز سفارش همخوانی ندارد. لطفاً کد QR میز را مجدداً اسکن کنید.',
        });
        return;
      }
    }

    const order = db.createOrder({
      table_id,
      session_token,
      guest_name,
      guest_phone,
      notes,
      items,
    });

    res.status(201).json({
      success: true,
      message: 'سفارش شما با موفقیت ثبت شد و در انتظار پرداخت است.',
      data: order,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message || 'خطا در ثبت سفارش',
    });
  }
});

// GET /api/orders/:id - Get order details & tracking history
router.get('/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'سفارش مورد نظر یافت نشد.' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/track/session/:sessionToken - Track orders for current table session
router.get('/track/session/:sessionToken', (req, res) => {
  try {
    const orders = db.getOrdersBySession(req.params.sessionToken);
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
