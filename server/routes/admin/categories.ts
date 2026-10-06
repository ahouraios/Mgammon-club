import { Router } from 'express';
import { db } from '../../db/database.ts';
import { authenticate, AuthenticatedRequest, requireRole } from '../../middleware/auth.ts';

const router = Router();

// GET /api/admin/categories
router.get('/', authenticate, (req, res) => {
  try {
    const categories = db.getAllCategories(true);
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/categories
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const { title, title_en, description, icon, image_url, sort_order } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'عنوان دسته‌بندی الزامی است.' });
      return;
    }

    const newCat = db.createCategory({
      title,
      title_en,
      description,
      icon,
      image_url,
      sort_order: Number(sort_order) || 0,
      is_active: true,
    });

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'CATEGORY_CREATED',
      entity: 'CATEGORY',
      entity_id: newCat.id,
      new_values: { title },
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'دسته‌بندی با موفقیت ایجاد شد.',
      data: newCat,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/categories/:id
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateCategory(req.params.id, req.body);

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'CATEGORY_UPDATED',
      entity: 'CATEGORY',
      entity_id: updated.id,
      new_values: req.body,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'دسته‌بندی به‌روزرسانی شد.',
      data: updated,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    db.deleteCategory(req.params.id);

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'CATEGORY_DELETED',
      entity: 'CATEGORY',
      entity_id: req.params.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد.',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
