-- ==============================================================================
-- کافه نرد | دیتابیس رابطه‌ای ماریا‌دی‌بی / مای‌اس‌کیوال (MariaDB 11.x / MySQL 8.x)
-- Cafe Nard - Relational Database Schema & Initial Production Seed
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. جدول نقش‌ها (Roles)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول دسترسی‌ها (Permissions)
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `code` VARCHAR(80) NOT NULL UNIQUE,
  `title` VARCHAR(100) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول کاربران (Users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `username` VARCHAR(80) NOT NULL UNIQUE,
  `email` VARCHAR(120) NULL UNIQUE,
  `phone` VARCHAR(20) NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. اتصال کاربر به نقش (User Roles)
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` VARCHAR(36) NOT NULL,
  `role_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول میزها (Tables)
CREATE TABLE IF NOT EXISTS `tables` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `table_number` INT NOT NULL UNIQUE,
  `name` VARCHAR(50) NOT NULL,
  `qr_token` VARCHAR(64) NOT NULL UNIQUE,
  `capacity` INT NOT NULL DEFAULT 2,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_table_token` (`qr_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. نشست‌های میز (Table Sessions)
CREATE TABLE IF NOT EXISTS `table_sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `table_id` VARCHAR(36) NOT NULL,
  `session_token` VARCHAR(64) NOT NULL UNIQUE,
  `guest_device_info` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  CONSTRAINT `fk_ts_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE RESTRICT,
  INDEX `idx_ts_token` (`session_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. دسته‌بندی‌های منو (Menu Categories)
CREATE TABLE IF NOT EXISTS `menu_categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `title_en` VARCHAR(100) NULL,
  `description` VARCHAR(255) NULL,
  `icon` VARCHAR(50) NULL,
  `image_url` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cat_sort` (`sort_order`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. آیتم‌های منو (Menu Items)
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `category_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `title_en` VARCHAR(120) NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `discounted_price` DECIMAL(12, 2) NULL,
  `image_url` VARCHAR(255) NULL,
  `inventory_status` ENUM('AVAILABLE', 'UNAVAILABLE', 'HIDDEN') NOT NULL DEFAULT 'AVAILABLE',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `is_special` TINYINT(1) NOT NULL DEFAULT 0,
  `preparation_time_minutes` INT NOT NULL DEFAULT 10,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_item_cat` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_item_cat` (`category_id`, `inventory_status`),
  INDEX `idx_item_status` (`inventory_status`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. گزینه‌ها و افزودنی‌های محصول (Menu Item Options)
CREATE TABLE IF NOT EXISTS `menu_item_options` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `item_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `title_en` VARCHAR(100) NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `min_select` INT NOT NULL DEFAULT 0,
  `max_select` INT NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_opt_item` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. مقادیر گزینه‌ها (Menu Item Option Values)
CREATE TABLE IF NOT EXISTS `menu_item_option_values` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `option_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `title_en` VARCHAR(100) NULL,
  `extra_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_optval_opt` FOREIGN KEY (`option_id`) REFERENCES `menu_item_options` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. سفارش‌ها (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(20) NOT NULL UNIQUE,
  `table_id` VARCHAR(36) NOT NULL,
  `session_token` VARCHAR(64) NULL,
  `guest_name` VARCHAR(80) NULL,
  `guest_phone` VARCHAR(20) NULL,
  `notes` VARCHAR(255) NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `payment_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `order_status` ENUM('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  `cancellation_reason` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE RESTRICT,
  INDEX `idx_order_status` (`order_status`),
  INDEX `idx_order_table` (`table_id`, `created_at`),
  INDEX `idx_order_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. اقلام سفارش (Order Items - Price Snapshots)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(36) NOT NULL,
  `item_id` VARCHAR(36) NOT NULL,
  `item_title_snapshot` VARCHAR(120) NOT NULL,
  `unit_price_snapshot` DECIMAL(12, 2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `total_price` DECIMAL(12, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_item` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. جزئیات گزینه‌های سفارش (Order Item Options Snapshot)
CREATE TABLE IF NOT EXISTS `order_item_options` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `order_item_id` VARCHAR(36) NOT NULL,
  `option_title_snapshot` VARCHAR(100) NOT NULL,
  `value_title_snapshot` VARCHAR(100) NOT NULL,
  `extra_price_snapshot` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_oio_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. تاریخچه تغییر وضعیت سفارش (Order Status History)
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(36) NOT NULL,
  `previous_status` VARCHAR(30) NULL,
  `new_status` VARCHAR(30) NOT NULL,
  `comment` VARCHAR(255) NULL,
  `changed_by_user_id` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_osh_order` (`order_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. تراکنش‌های مالی (Payments)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(36) NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `authority` VARCHAR(100) NULL,
  `ref_id` VARCHAR(100) NULL,
  `card_pan` VARCHAR(30) NULL,
  `raw_response` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `verified_at` TIMESTAMP NULL,
  CONSTRAINT `fk_pay_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  INDEX `idx_pay_auth` (`authority`),
  INDEX `idx_pay_ref` (`ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. گزارشات حساس و حسابرسی (Audit Logs)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(60) NOT NULL,
  `entity_id` VARCHAR(36) NULL,
  `old_values` TEXT NULL,
  `new_values` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_entity` (`entity`, `entity_id`),
  INDEX `idx_audit_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. اعلانات درون سیستمی (Notifications)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `message` VARCHAR(255) NOT NULL,
  `reference_id` VARCHAR(36) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_unread` (`is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
