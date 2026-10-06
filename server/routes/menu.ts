import { Router } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// GET /api/menu - Full digital menu for public café
router.get('/', (req, res) => {
  try {
    const categories = db.getAllCategories(false);
    const items = db.getAllMenuItems(false);

    const featured = items.filter((i) => i.is_featured);
    const popular = items.filter((i) => i.is_popular);
    const specials = items.filter((i) => i.is_special);

    res.json({
      success: true,
      data: {
        categories,
        items,
        highlights: {
          featured,
          popular,
          specials,
        },
        club_info: {
          name: 'کافه نرد | باشگاه تخته‌نرد',
          status: 'OPEN',
          working_hours: 'همه‌روزه از ساعت ۱۰:۰۰ الی ۲۴:۰۰',
          currency: 'تومان',
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.getAllCategories(false);
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/products/:id', (req, res) => {
  try {
    const item = db.getMenuItemById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, message: 'محصول یافت نشد.' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
