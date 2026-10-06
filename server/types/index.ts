// Server & Shared Data Types

export type RoleName = 'SUPER_ADMIN' | 'MANAGER' | 'CAFE_STAFF';

export interface User {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  full_name: string;
  role: RoleName;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TableEntity {
  id: string;
  table_number: number;
  name: string;
  qr_token: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  session_token: string;
  guest_device_info?: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export interface MenuCategory {
  id: string;
  title: string;
  title_en?: string;
  description?: string;
  icon?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InventoryStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN';

export interface MenuItemOptionValue {
  id: string;
  option_id: string;
  title: string;
  title_en?: string;
  extra_price: number;
  is_default: boolean;
  sort_order: number;
}

export interface MenuItemOption {
  id: string;
  item_id: string;
  title: string;
  title_en?: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  values: MenuItemOptionValue[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  title: string;
  title_en?: string;
  description?: string;
  price: number;
  discounted_price?: number | null;
  image_url?: string;
  inventory_status: InventoryStatus;
  is_featured: boolean;
  is_popular: boolean;
  is_special: boolean;
  preparation_time_minutes: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: MenuItemOption[];
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItemOptionSnapshot {
  id: string;
  order_item_id: string;
  option_title_snapshot: string;
  value_title_snapshot: string;
  extra_price_snapshot: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_title_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  total_price: number;
  options: OrderItemOptionSnapshot[];
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  comment: string | null;
  changed_by_user_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  table_number: number;
  table_name: string;
  session_token?: string;
  guest_name?: string;
  guest_phone?: string;
  notes?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  cancellation_reason?: string | null;
  items: OrderItem[];
  status_history: OrderStatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  authority: string;
  ref_id?: string;
  card_pan?: string;
  raw_response?: string;
  created_at: string;
  verified_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  username?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}
