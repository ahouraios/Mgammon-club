import { Router } from 'express';
import { db } from '../db/database.ts';
import { getPaymentProvider } from '../services/payment.ts';

const router = Router();

// POST /api/payments/initiate
router.post('/initiate', async (req, res) => {
  try {
    const { order_id, mobile } = req.body;
    const order = db.getOrderById(order_id);

    if (!order) {
      res.status(404).json({ success: false, message: 'سفارش یافت نشد.' });
      return;
    }

    if (order.payment_status === 'PAID') {
      res.status(400).json({ success: false, message: 'این سفارش قبلاً پرداخت شده است.' });
      return;
    }

    const provider = getPaymentProvider();
    const callbackUrl = process.env.PAYMENT_CALLBACK_URL || '/payment/callback';

    const result = await provider.requestPayment({
      orderId: order.id,
      amount: order.total_amount,
      callbackUrl,
      description: `پرداخت سفارش ${order.order_number} کافه نرد`,
      mobile: mobile || order.guest_phone,
    });

    db.recordPayment({
      order_id: order.id,
      provider: provider.name,
      amount: order.total_amount,
      status: 'PENDING',
      authority: result.authority,
    });

    res.json({
      success: true,
      data: {
        payment_url: result.paymentUrl,
        authority: result.authority,
        amount: order.total_amount,
        order_number: order.order_number,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'خطا در ارتباط با درگاه پرداخت' });
  }
});

// POST /api/payments/verify
router.post('/verify', async (req, res) => {
  try {
    const { authority, status } = req.body;

    if (!authority) {
      res.status(400).json({ success: false, message: 'شناسه مرجع پرداخت (Authority) الزامی است.' });
      return;
    }

    const payment = db.getPaymentByAuthority(authority);
    if (!payment) {
      res.status(404).json({ success: false, message: 'رکورد پرداخت با این مشخصات یافت نشد.' });
      return;
    }

    if (payment.status === 'SUCCESS') {
      const order = db.getOrderById(payment.order_id);
      res.json({
        success: true,
        message: 'این سفارش قبلاً با موفقیت تأیید و پرداخت شده است.',
        data: { order, ref_id: payment.ref_id },
      });
      return;
    }

    // Client passed status cancelled or failed
    if (status === 'NOK' || status === 'FAILED') {
      db.verifyPayment(payment.id, '', 'FAILED', 'Payment cancelled by user');
      res.status(400).json({
        success: false,
        message: 'پرداخت توسط کاربر لغو گردید.',
      });
      return;
    }

    // Verify with payment provider
    const provider = getPaymentProvider();
    const verification = await provider.verifyPayment({
      authority,
      amount: payment.amount,
    });

    if (verification.success && verification.refId) {
      const updatedPayment = db.verifyPayment(
        payment.id,
        verification.refId,
        'SUCCESS',
        verification.rawResponse
      );
      const order = db.getOrderById(payment.order_id);

      res.json({
        success: true,
        message: 'پرداخت با موفقیت انجام و سفارش به لیست آماده‌سازی منتقل شد.',
        data: {
          order,
          payment: updatedPayment,
          ref_id: verification.refId,
          card_pan: verification.cardPan,
        },
      });
    } else {
      db.verifyPayment(payment.id, '', 'FAILED', verification.message);
      res.status(400).json({
        success: false,
        message: verification.message || 'پرداخت از سوی بانک تأیید نشد.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'خطا در اعتبارسنجی پرداخت' });
  }
});

export default router;
