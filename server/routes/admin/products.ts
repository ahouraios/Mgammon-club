import { Router } from 'express';
import { db } from '../../db/database.ts';
import { authenticate, AuthenticatedRequest, requireRole } from '../../middleware/auth.ts';

const router = Router();

// GET /api/admin/products - All products including hidden/inactive
router.get('/', authenticate, (req, res) => {
  try {
    const products = db.getAllMenuItems(true);
    res.json({ success: true, data: products });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/products - Create product (Manager or SuperAdmin)
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const {
      category_id,
      title,
      title_en,
      description,
      price,
      discounted_price,
      image_url,
      inventory_status,
      is_featured,
      is_popular,
      is_special,
      preparation_time_minutes,
      sort_order,
      options,
    } = req.body;

    if (!title || !price || !category_id) {
      res.status(400).json({
        success: false,
        message: 'عنوان، قیمت و دسته‌بندی محصول الزامی هستند.',
      });
      return;
    }

    const newProduct = db.createMenuItem(
      {
        category_id,
        title,
        title_en,
        description,
        price: Number(price),
        discounted_price: discounted_price ? Number(discounted_price) : null,
        image_url,
        inventory_status: inventory_status || 'AVAILABLE',
        is_featured: Boolean(is_featured),
        is_popular: Boolean(is_popular),
        is_special: Boolean(is_special),
        preparation_time_minutes: Number(preparation_time_minutes) || 10,
        sort_order: Number(sort_order) || 0,
        is_active: true,
      },
      options
    );

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'PRODUCT_CREATED',
      entity: 'MENU_ITEM',
      entity_id: newProduct.id,
      new_values: { title, price, category_id },
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'محصول با موفقیت افزوده شد.',
      data: newProduct,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    const { options, ...updates } = req.body;
    const oldProduct = db.getMenuItemById(req.params.id);

    const updatedProduct = db.updateMenuItem(req.params.id, updates, options);

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'PRODUCT_UPDATED',
      entity: 'MENU_ITEM',
      entity_id: updatedProduct.id,
      old_values: oldProduct ? { price: oldProduct.price, status: oldProduct.inventory_status } : null,
      new_values: { price: updatedProduct.price, status: updatedProduct.inventory_status },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'محصول با موفقیت به‌روزرسانی شد.',
      data: updatedProduct,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/products/:id/inventory - Quick toggle inventory status
router.patch('/:id/inventory', authenticate, (req: AuthenticatedRequest, res) => {
  try {
    const { inventory_status } = req.body;
    if (!['AVAILABLE', 'UNAVAILABLE', 'HIDDEN'].includes(inventory_status)) {
      res.status(400).json({ success: false, message: 'وضعیت نامعتبر است.' });
      return;
    }

    const updatedProduct = db.updateMenuItem(req.params.id, { inventory_status });

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'INVENTORY_STATUS_CHANGED',
      entity: 'MENU_ITEM',
      entity_id: updatedProduct.id,
      new_values: { inventory_status },
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: `وضعیت موجودی به ${inventory_status} تغییر یافت.`,
      data: updatedProduct,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN', 'MANAGER']), (req: AuthenticatedRequest, res) => {
  try {
    db.deleteMenuItem(req.params.id);

    db.logAudit({
      user_id: req.user?.id || null,
      username: req.user?.username,
      action: 'PRODUCT_DELETED',
      entity: 'MENU_ITEM',
      entity_id: req.params.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'محصول با موفقیت حذف یا غیرفعال شد.',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
