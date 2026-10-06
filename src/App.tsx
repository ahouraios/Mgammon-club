/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Coffee,
  CupSoda,
  Wine,
  Cake,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  Search,
  Plus,
  Minus,
  Check,
  Clock,
  Shield,
  LogOut,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Flame,
  Sparkles,
  X,
  CreditCard,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Layers,
  ChevronDown,
  ExternalLink,
  ChevronLeft,
  CircleDot,
  Copy,
} from 'lucide-react';
import type {
  MenuItem,
  MenuCategory,
  MenuItemOption,
  Order,
  TableEntity,
  OrderStatus,
} from '../server/types/index.ts';

// Helper for formatting prices in Iranian Tomans
function formatPrice(amount: number): string {
  return amount.toLocaleString('fa-IR') + ' تومان';
}

export default function App() {
  // Navigation / View Modes
  const [activeTab, setActiveTab] = useState<'menu' | 'tracking' | 'admin'>('menu');
  const [adminSection, setAdminSection] = useState<'dashboard' | 'orders' | 'products' | 'tables'>('dashboard');

  // Table state (from query param ?table=... or default Table 4)
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null);
  const [tableSessionToken, setTableSessionToken] = useState<string>('');

  // Menu State
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);

  // Cart State
  interface CartItem {
    id: string; // unique item cart key
    menuItem: MenuItem;
    quantity: number;
    selectedValues: Array<{
      optionTitle: string;
      valueId: string;
      valueTitle: string;
      extraPrice: number;
    }>;
    totalPrice: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartNotes, setCartNotes] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string[]>>({});
  const [customizingQuantity, setCustomizingQuantity] = useState<number>(1);

  // Active / Tracking Order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [trackingOrders, setTrackingOrders] = useState<Order[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAuthority, setPaymentAuthority] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);

  // Admin State
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('cafenard_token') || '');
  const [adminUser, setAdminUser] = useState<{ id: string; username: string; full_name: string; role: string } | null>(null);
  const [adminLoginUsername, setAdminLoginUsername] = useState('admin');
  const [adminLoginPassword, setAdminLoginPassword] = useState('admin123');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminDashboardData, setAdminDashboardData] = useState<any>(null);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrderFilter, setAdminOrderFilter] = useState<string>('ALL');
  const [adminProducts, setAdminProducts] = useState<MenuItem[]>([]);
  const [adminQrModalTable, setAdminQrModalTable] = useState<any | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load: Fetch Menu & Tables
  useEffect(() => {
    fetchMenu();
    fetchTables();
  }, []);

  // Check URL table query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('table');
    if (token) {
      validateTableToken(token);
    }
  }, []);

  // Fetch admin profile if token exists
  useEffect(() => {
    if (adminToken) {
      fetchAdminProfile();
    }
  }, [adminToken]);

  // Load Admin section data when admin tab is opened
  useEffect(() => {
    if (activeTab === 'admin' && adminToken) {
      if (adminSection === 'dashboard') fetchAdminDashboard();
      if (adminSection === 'orders') fetchAdminOrders();
      if (adminSection === 'products') fetchAdminProducts();
      if (adminSection === 'tables') fetchTables();
    }
  }, [activeTab, adminSection, adminToken]);

  // Public API Calls
  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories);
        setMenuItems(data.data.items);
      }
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables', {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
        if (!selectedTable && data.data.length > 0) {
          // Default to Table 4 or Table 1
          const defaultTbl = data.data.find((t: TableEntity) => t.table_number === 4) || data.data[0];
          setSelectedTable(defaultTbl);
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  const validateTableToken = async (token: string) => {
    try {
      const res = await fetch(`/api/tables/validate-token/${token}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTable({
          id: data.data.table.id,
          table_number: data.data.table.number,
          name: data.data.table.name,
          capacity: data.data.table.capacity,
          qr_token: token,
          is_active: true,
          created_at: '',
          updated_at: '',
        });
        setTableSessionToken(data.data.session.token);
        showToast(`خوش آمدید! متصل به ${data.data.table.name}`);
      }
    } catch (err) {
      console.error('Error validating table token:', err);
    }
  };

  // Option Customization Logic
  const handleOpenCustomization = (item: MenuItem) => {
    setCustomizingItem(item);
    setCustomizingQuantity(1);

    // Set default selections
    const initialSelections: Record<string, string[]> = {};
    if (item.options && item.options.length > 0) {
      item.options.forEach((opt: MenuItemOption) => {
        const defaultVal = opt.values.find((v) => v.is_default) || opt.values[0];
        if (defaultVal) {
          initialSelections[opt.id] = [defaultVal.id];
        } else {
          initialSelections[opt.id] = [];
        }
      });
    }
    setSelectedOptionValues(initialSelections);
  };

  const handleToggleOptionValue = (option: MenuItemOption, valueId: string) => {
    setSelectedOptionValues((prev) => {
      const current = prev[option.id] || [];
      if (option.max_select === 1) {
        return { ...prev, [option.id]: [valueId] };
      } else {
        if (current.includes(valueId)) {
          return { ...prev, [option.id]: current.filter((id) => id !== valueId) };
        } else {
          if (current.length < option.max_select) {
            return { ...prev, [option.id]: [...current, valueId] };
          }
          return prev;
        }
      }
    });
  };

  const calculateCustomizedPrice = useMemo(() => {
    if (!customizingItem) return 0;
    const basePrice = customizingItem.discounted_price ?? customizingItem.price;
    let extra = 0;
    if (customizingItem.options) {
      customizingItem.options.forEach((opt) => {
        const selected = selectedOptionValues[opt.id] || [];
        selected.forEach((valId) => {
          const valObj = opt.values.find((v) => v.id === valId);
          if (valObj) extra += Number(valObj.extra_price) || 0;
        });
      });
    }
    return (basePrice + extra) * customizingQuantity;
  }, [customizingItem, selectedOptionValues, customizingQuantity]);

  const handleAddToCart = () => {
    if (!customizingItem) return;

    const selectedList: Array<{
      optionTitle: string;
      valueId: string;
      valueTitle: string;
      extraPrice: number;
    }> = [];

    if (customizingItem.options) {
      customizingItem.options.forEach((opt) => {
        const selectedIds = selectedOptionValues[opt.id] || [];
        selectedIds.forEach((valId) => {
          const valObj = opt.values.find((v) => v.id === valId);
          if (valObj) {
            selectedList.push({
              optionTitle: opt.title,
              valueId: valObj.id,
              valueTitle: valObj.title,
              extraPrice: Number(valObj.extra_price) || 0,
            });
          }
        });
      });
    }

    const cartKey = `${customizingItem.id}_${selectedList.map((s) => s.valueId).sort().join('_')}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + customizingQuantity;
        const unitPrice = calculateCustomizedPrice / customizingQuantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: unitPrice * newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: cartKey,
            menuItem: customizingItem,
            quantity: customizingQuantity,
            selectedValues: selectedList,
            totalPrice: calculateCustomizedPrice,
          },
        ];
      }
    });

    setCustomizingItem(null);
    showToast(`«${customizingItem.title}» به سبد خرید افزوده شد.`);
  };

  const updateCartQuantity = (cartKey: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartKey) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const unitPrice = item.totalPrice / item.quantity;
            return {
              ...item,
              quantity: newQty,
              totalPrice: unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  // Order Creation & Payment
  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      showToast('لطفاً ابتدا شماره میز خود را انتخاب کنید.');
      return;
    }
    if (cart.length === 0) {
      showToast('سبد خرید شما خالی است.');
      return;
    }

    try {
      const orderPayload = {
        table_id: selectedTable.id,
        session_token: tableSessionToken || undefined,
        guest_name: guestName.trim() || undefined,
        guest_phone: guestPhone.trim() || undefined,
        notes: cartNotes.trim() || undefined,
        items: cart.map((c) => ({
          item_id: c.menuItem.id,
          quantity: c.quantity,
          selected_value_ids: c.selectedValues.map((v) => v.valueId),
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (data.success) {
        const createdOrder: Order = data.data;
        setActiveOrder(createdOrder);
        setTrackingOrders((prev) => [createdOrder, ...prev]);
        setCart([]);
        setIsCartOpen(false);

        // Initiate payment
        initiatePayment(createdOrder.id, createdOrder.guest_phone);
      } else {
        showToast(data.message || 'خطا در ثبت سفارش');
      }
    } catch (err: any) {
      showToast('خطا در ارتباط با سرور کافه');
    }
  };

  const initiatePayment = async (orderId: string, mobile?: string) => {
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentAuthority(data.data.authority);
        setIsPaymentModalOpen(true);
      } else {
        showToast(data.message || 'خطا در ایجاد تراکنش پرداخت');
      }
    } catch (err) {
      showToast('خطا در برقراری ارتباط با درگاه پرداخت');
    }
  };

  const handleSimulatePayment = async (status: 'SUCCESS' | 'FAILED') => {
    setPaymentProcessing(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: paymentAuthority,
          status: status === 'SUCCESS' ? 'OK' : 'NOK',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaymentModalOpen(false);
        setActiveOrder(data.data.order);
        setActiveTab('tracking');
        showToast('پرداخت موفقیت‌آمیز بود! سفارش به باریستا ارسال شد.');
      } else {
        showToast(data.message || 'پرداخت ناموفق بود.');
      }
    } catch (err) {
      showToast('خطا در تأیید تراکنش');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleTrackActiveOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setActiveOrder(data.data);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
    }
  };

  // Admin APIs
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminLoginUsername, password: adminLoginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminToken(data.data.token);
        setAdminUser(data.data.user);
        localStorage.setItem('cafenard_token', data.data.token);
        showToast(`خوش آمدید، ${data.data.user.full_name}`);
      } else {
        setAdminLoginError(data.message || 'نام کاربری یا رمز عبور اشتباه است.');
      }
    } catch (err) {
      setAdminLoginError('خطا در اتصال به سرور');
    }
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    setAdminUser(null);
    localStorage.removeItem('cafenard_token');
    showToast('از پنل مدیریت خارج شدید.');
  };

  const fetchAdminProfile = async () => {
    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdminUser(data.data);
      } else {
        handleAdminLogout();
      }
    } catch (err) {
      handleAdminLogout();
    }
  };

  const fetchAdminDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdminDashboardData(data.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    }
  };

  const fetchAdminOrders = async () => {
    try {
      const statusParam = adminOrderFilter !== 'ALL' ? `?status=${adminOrderFilter}` : '';
      const res = await fetch(`/api/admin/orders${statusParam}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdminOrders(data.data);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdminProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`وضعیت سفارش به ${newStatus} تغییر یافت.`);
        fetchAdminOrders();
        if (adminSection === 'dashboard') fetchAdminDashboard();
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder(data.data);
        }
      } else {
        showToast(data.message || 'خطا در تغییر وضعیت سفارش');
      }
    } catch (err) {
      showToast('خطا در ارسال درخواست');
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleToggleProductInventory = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      const res = await fetch(`/api/admin/products/${productId}/inventory`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ inventory_status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('وضعیت موجودی محصول به‌روز شد.');
        fetchAdminProducts();
        fetchMenu(); // Sync customer menu
      }
    } catch (err) {
      showToast('خطا در به‌روزرسانی وضعیت موجودی');
    }
  };

  const handleShowTableQr = async (tableId: string) => {
    try {
      const res = await fetch(`/api/admin/tables/${tableId}/qr-code`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdminQrModalTable(data.data);
      }
    } catch (err) {
      showToast('خطا در دریافت بارکد میز');
    }
  };

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title_en && item.title_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Category Icon Renderer
  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5" />;
      case 'CupSoda':
        return <CupSoda className="w-5 h-5" />;
      case 'Wine':
        return <Wine className="w-5 h-5" />;
      case 'Cake':
        return <Cake className="w-5 h-5" />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-5 h-5" />;
      default:
        return <Coffee className="w-5 h-5" />;
    }
  };

  // Order status badge text & styling
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return { text: 'در انتظار پرداخت', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'PAID':
        return { text: 'پرداخت شده', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'CONFIRMED':
        return { text: 'تأیید کافه', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'PREPARING':
        return { text: 'در حال آماده‌سازی باریستا', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'READY':
        return { text: 'آماده تحویل به میز', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'DELIVERED':
        return { text: 'تحویل داده شد', color: 'bg-stone-500/20 text-stone-300 border-stone-500/40' };
      case 'CANCELLED':
        return { text: 'لغو شده', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
      default:
        return { text: status, color: 'bg-stone-700 text-stone-200' };
    }
  };

  return (
    <div className="min-h-screen bg-[#14100E] text-stone-100 flex flex-col font-sans selection:bg-amber-600/30 selection:text-amber-200 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 border border-amber-500/40 text-amber-200 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-sm font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#1A1411]/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo & Table Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/20 text-amber-100 font-bold border border-amber-500/30">
              ☕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg text-amber-100 tracking-tight">کافه نرد</h1>
                <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full font-medium">
                  باشگاه تخته‌نرد
                </span>
              </div>
              {/* Table Switcher Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className="text-stone-500">میز شما:</span>
                <div className="relative inline-block">
                  <select
                    className="bg-stone-900/90 text-amber-300 font-medium border border-stone-700/60 rounded px-2 py-0.5 pr-6 cursor-pointer hover:border-amber-500/50 focus:outline-none"
                    value={selectedTable?.id || ''}
                    onChange={(e) => {
                      const tbl = tables.find((t) => t.id === e.target.value);
                      if (tbl) {
                        setSelectedTable(tbl);
                        showToast(`میز به ${tbl.name} تغییر یافت.`);
                      }
                    }}
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (ظرفیت {t.capacity} نفر)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Tabs & Cart */}
          <div className="flex items-center gap-2">
            {/* View Mode Nav */}
            <div className="bg-stone-900/80 p-1 rounded-xl border border-stone-800 flex items-center text-xs">
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  activeTab === 'menu'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                منوی دیجیتال
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium relative ${
                  activeTab === 'tracking'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                پیگیری سفارش
                {activeOrder && activeOrder.order_status !== 'DELIVERED' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1 ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>پنل کافه</span>
              </button>
            </div>

            {/* Cart Button */}
            {activeTab === 'menu' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-lg shadow-amber-950/40 transition-all border border-amber-500/40"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">سبد خرید</span>
                {cart.length > 0 && (
                  <span className="bg-white text-stone-900 font-bold px-1.5 py-0.2 rounded-full text-[11px] min-w-5 text-center">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto w-full px-4 py-5 flex-1">
        {/* ============================================================== */}
        {/* 1. CUSTOMER DIGITAL MENU TAB                                    */}
        {/* ============================================================== */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Club Atmosphere Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-[#231A15] to-stone-900 p-5 md:p-6 border border-amber-600/20 shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-400">سفارش مستقیم روی میز مسابقه</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-amber-100">
                    طعم اصیل قهوه تخصصی و دمنوش در کنار هیجان تخته‌نرد
                  </h2>
                  <p className="text-xs md:text-sm text-stone-300 max-w-xl leading-relaxed">
                    با انتخاب هر آیتم و ثبت نهایی، سفارش شما مستقیماً برای باریستای کافه ارسال شده و بدون ایجاد وقفه در بازی، بر روی میز شما سرو می‌گردد.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 text-center min-w-28">
                    <div className="text-[11px] text-stone-400">ساعت کاری</div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5">۱۰:۰۰ الی ۲۴:۰۰</div>
                  </div>
                  <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 text-center min-w-28">
                    <div className="text-[11px] text-stone-400">میز جاری</div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5">{selectedTable?.name || 'میز ۴'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Categories Bar */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در قهوه‌ها، دمنوش‌ها، دسرها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1411] border border-stone-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pill Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === 'all'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/50'
                      : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>همه دسته‌ها ({menuItems.length})</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedCategory === cat.id
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/50'
                        : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {renderCategoryIcon(cat.icon)}
                    <span>{cat.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {loadingMenu ? (
              <div className="text-center py-16 text-stone-400 flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm">در حال بارگذاری منوی اختصاصی کافه نرد...</p>
              </div>
            ) : filteredMenuItems.length === 0 ? (
              <div className="text-center py-16 bg-stone-900/40 rounded-2xl border border-stone-800/60 p-8">
                <Coffee className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-300">محصولی یافت نشد</h3>
                <p className="text-xs text-stone-500 mt-1">
                  لطفاً دسته‌بندی دیگری را انتخاب کرده یا عبارت جستجو را تغییر دهید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => {
                  const isAvailable = item.inventory_status === 'AVAILABLE';
                  const basePrice = item.price;
                  const discountedPrice = item.discounted_price;

                  return (
                    <div
                      key={item.id}
                      className={`relative bg-[#1A1411]/90 rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                        isAvailable
                          ? 'border-stone-800/80 hover:border-amber-600/40 hover:shadow-xl hover:shadow-amber-950/20'
                          : 'border-stone-800/40 opacity-60'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          {item.is_featured && (
                            <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                              <Sparkles className="w-3 h-3" />
                              پیشنهاد کافه
                            </span>
                          )}
                          {item.is_popular && (
                            <span className="flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                              <Flame className="w-3 h-3" />
                              محبوب
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-stone-400">
                          <Clock className="w-3 h-3 text-stone-500" />
                          <span>{item.preparation_time_minutes} دقیقه</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1 mb-4 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-stone-100">{item.title}</h3>
                          {!isAvailable && (
                            <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded-md font-semibold whitespace-nowrap">
                              ناموجود
                            </span>
                          )}
                        </div>
                        {item.title_en && (
                          <div className="text-[11px] text-stone-500 font-mono tracking-wide">{item.title_en}</div>
                        )}
                        <p className="text-xs text-stone-400 leading-relaxed line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>

                      {/* Price & Add to Cart Action */}
                      <div className="pt-3 border-t border-stone-800/60 flex items-center justify-between">
                        <div>
                          {discountedPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-amber-400">
                                {formatPrice(discountedPrice)}
                              </span>
                              <span className="text-xs line-through text-stone-500">
                                {formatPrice(basePrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-black text-amber-300">
                              {formatPrice(basePrice)}
                            </span>
                          )}
                        </div>

                        {isAvailable ? (
                          <button
                            onClick={() => handleOpenCustomization(item)}
                            className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{item.options && item.options.length > 0 ? 'انتخاب و افزودن' : 'افزودن'}</span>
                          </button>
                        ) : (
                          <span className="text-xs text-stone-500 font-medium">اتمام موجودی</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. ORDER TRACKING & HISTORY TAB                                */}
        {/* ============================================================== */}
        {activeTab === 'tracking' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[#1A1411] border border-stone-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <div>
                  <h2 className="text-lg font-bold text-amber-100">پیگیری لحظه‌ای سفارش</h2>
                  <p className="text-xs text-stone-400 mt-0.5">وضعیت آماده‌سازی سفارش در بار کافه نرد</p>
                </div>
                {activeOrder && (
                  <button
                    onClick={() => handleTrackActiveOrder(activeOrder.id)}
                    className="p-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg text-amber-400 transition-colors"
                    title="به‌روزرسانی وضعیت"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!activeOrder ? (
                <div className="py-12 text-center text-stone-400 space-y-3">
                  <Coffee className="w-12 h-12 mx-auto text-stone-600" />
                  <p className="text-sm font-medium">در حال حاضر سفارشی برای این نشست ثبت نشده است.</p>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="mt-2 bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-500"
                  >
                    مشاهده منو و ثبت سفارش
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pt-4">
                  {/* Order Overview Header */}
                  <div className="bg-stone-900/80 rounded-xl p-4 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-stone-400">شماره سفارش</div>
                      <div className="text-base font-black text-amber-400 tracking-wider font-mono">
                        {activeOrder.order_number}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-stone-400">میز</div>
                      <div className="text-sm font-bold text-stone-200">{activeOrder.table_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-stone-400">مبلغ کل</div>
                      <div className="text-sm font-bold text-amber-300">
                        {formatPrice(activeOrder.total_amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 mb-1">وضعیت کنونی</div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          getStatusInfo(activeOrder.order_status).color
                        }`}
                      >
                        {getStatusInfo(activeOrder.order_status).text}
                      </span>
                    </div>
                  </div>

                  {/* Status Progress Bar */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-stone-300">مراحل آماده‌سازی:</div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      {[
                        { key: 'PAID', label: 'تأیید پرداخت' },
                        { key: 'CONFIRMED', label: 'تأیید کافه' },
                        { key: 'PREPARING', label: 'در حال تهیه' },
                        { key: 'READY', label: 'آماده سرو' },
                      ].map((step, idx) => {
                        const statusWeights: Record<string, number> = {
                          PENDING_PAYMENT: 0,
                          PAID: 1,
                          CONFIRMED: 2,
                          PREPARING: 3,
                          READY: 4,
                          DELIVERED: 5,
                        };
                        const currentWeight = statusWeights[activeOrder.order_status] || 0;
                        const isDone = currentWeight >= idx + 1;
                        const isCurrent = currentWeight === idx + 1;

                        return (
                          <div
                            key={step.key}
                            className={`p-2 rounded-xl border transition-all ${
                              isDone
                                ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                                : isCurrent
                                ? 'bg-purple-600/20 border-purple-500/60 text-purple-300 animate-pulse'
                                : 'bg-stone-900 border-stone-800 text-stone-500'
                            }`}
                          >
                            <div className="font-bold">{step.label}</div>
                            {isDone && <Check className="w-3.5 h-3.5 mx-auto mt-1 text-amber-400" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-stone-300">اقلام سفارش داده شده:</div>
                    <div className="space-y-2">
                      {activeOrder.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-stone-200">
                              {item.item_title_snapshot} × {item.quantity}
                            </div>
                            {item.options && item.options.length > 0 && (
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                {item.options.map((opt) => opt.value_title_snapshot).join(' | ')}
                              </div>
                            )}
                          </div>
                          <div className="font-bold text-amber-300">{formatPrice(item.total_price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status History Timeline */}
                  {activeOrder.status_history && activeOrder.status_history.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      <div className="text-xs font-semibold text-stone-400">گزارش لحظه‌ای سیستم:</div>
                      <div className="space-y-1.5 text-xs text-stone-400">
                        {activeOrder.status_history.map((hist) => (
                          <div key={hist.id} className="flex items-center gap-2">
                            <CircleDot className="w-3 h-3 text-amber-500" />
                            <span>{hist.comment || hist.new_status}</span>
                            <span className="text-[10px] text-stone-500 font-mono mr-auto">
                              {new Date(hist.created_at).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If still pending payment, show button to pay */}
                  {activeOrder.order_status === 'PENDING_PAYMENT' && (
                    <button
                      onClick={() => initiatePayment(activeOrder.id, activeOrder.guest_phone)}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold text-sm shadow-xl hover:from-amber-500"
                    >
                      پرداخت آنلاین سفارش
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. CAFE ADMIN & BARISTA MANAGEMENT PORTAL                      */}
        {/* ============================================================== */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {!adminToken ? (
              /* Admin Login Form */
              <div className="max-w-md mx-auto bg-[#1A1411] border border-stone-800 rounded-2xl p-6 shadow-2xl">
                <div className="text-center space-y-2 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-black text-amber-100">ورود به پنل مدیریت و باریستا</h2>
                  <p className="text-xs text-stone-400">مدیریت سفارشات، منو، میزها و گزارشات زنده کافه باشگاه</p>
                </div>

                {adminLoginError && (
                  <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminLoginError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">نام کاربری</label>
                    <input
                      type="text"
                      value={adminLoginUsername}
                      onChange={(e) => setAdminLoginUsername(e.target.value)}
                      required
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">رمز عبور</label>
                    <input
                      type="password"
                      value={adminLoginPassword}
                      onChange={(e) => setAdminLoginPassword(e.target.value)}
                      required
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-950/50"
                  >
                    ورود به حساب کاربری
                  </button>
                </form>

                {/* Quick login helper badges for reviewers */}
                <div className="mt-6 pt-5 border-t border-stone-800 text-center space-y-2">
                  <div className="text-[11px] text-stone-400">دسترسی‌های سریع تستی:</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminLoginUsername('admin');
                        setAdminLoginPassword('admin123');
                      }}
                      className="text-[11px] bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700 px-2.5 py-1 rounded-lg"
                    >
                      مدیر ارشد (admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminLoginUsername('barista');
                        setAdminLoginPassword('staff123');
                      }}
                      className="text-[11px] bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700 px-2.5 py-1 rounded-lg"
                    >
                      باریستا (barista)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Authenticated Admin Dashboard */
              <div className="space-y-6">
                {/* Admin Header with User Info & Section Tabs */}
                <div className="bg-[#1A1411] border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-100 flex items-center gap-2">
                        <span>{adminUser?.full_name || adminUser?.username}</span>
                        <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-mono">
                          {adminUser?.role}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400">کافه نرد | سامانه فرماندهی و سفارشات</div>
                    </div>
                  </div>

                  {/* Section Switcher */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                      onClick={() => setAdminSection('dashboard')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        adminSection === 'dashboard'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      آمار و عملکرد
                    </button>
                    <button
                      onClick={() => setAdminSection('orders')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        adminSection === 'orders'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      سفارشات زنده
                    </button>
                    <button
                      onClick={() => setAdminSection('products')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        adminSection === 'products'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      محصولات و موجودی
                    </button>
                    <button
                      onClick={() => setAdminSection('tables')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        adminSection === 'tables'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      میزها و بارکدها
                    </button>
                    <button
                      onClick={handleAdminLogout}
                      className="p-2 bg-stone-900 hover:bg-red-950/40 text-stone-400 hover:text-red-400 border border-stone-800 rounded-xl transition-colors"
                      title="خروج"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Section 1: Analytics Dashboard */}
                {adminSection === 'dashboard' && adminDashboardData && (
                  <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#1A1411] border border-stone-800 p-4 rounded-2xl">
                        <div className="text-xs text-stone-400">فروش کل امروز</div>
                        <div className="text-lg md:text-xl font-black text-amber-400 mt-1">
                          {formatPrice(adminDashboardData.totalSalesToday)}
                        </div>
                      </div>
                      <div className="bg-[#1A1411] border border-stone-800 p-4 rounded-2xl">
                        <div className="text-xs text-stone-400">سفارشات ثبت شده امروز</div>
                        <div className="text-lg md:text-xl font-black text-stone-100 mt-1">
                          {adminDashboardData.todayOrdersCount} سفارش
                        </div>
                      </div>
                      <div className="bg-[#1A1411] border border-stone-800 p-4 rounded-2xl">
                        <div className="text-xs text-stone-400">در حال آماده‌سازی باریستا</div>
                        <div className="text-lg md:text-xl font-black text-purple-400 mt-1">
                          {adminDashboardData.preparingCount} مورد
                        </div>
                      </div>
                      <div className="bg-[#1A1411] border border-stone-800 p-4 rounded-2xl">
                        <div className="text-xs text-stone-400">میزهای فعال باشگاه</div>
                        <div className="text-lg md:text-xl font-black text-teal-400 mt-1">
                          {adminDashboardData.activeTablesCount} / {adminDashboardData.totalTables} میز
                        </div>
                      </div>
                    </div>

                    {/* Popular items sold */}
                    {adminDashboardData.popularItems && adminDashboardData.popularItems.length > 0 && (
                      <div className="bg-[#1A1411] border border-stone-800 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                          <h3 className="font-bold text-sm text-stone-200">محبوب‌ترین آیتم‌های منو</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {adminDashboardData.popularItems.map((pi: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-stone-900/60 p-3 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-stone-200">{pi.title}</span>
                              <div className="text-left font-mono">
                                <span className="text-amber-400 font-bold">{pi.count} عدد</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Section 2: Live Orders Management */}
                {adminSection === 'orders' && (
                  <div className="space-y-4">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {['ALL', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            setAdminOrderFilter(st);
                            fetchAdminOrders();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            adminOrderFilter === st
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {st === 'ALL' ? 'همه سفارشات' : getStatusInfo(st as OrderStatus).text}
                        </button>
                      ))}
                    </div>

                    {/* Orders List */}
                    <div className="space-y-3">
                      {adminOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-[#1A1411] border border-stone-800 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                            <div className="flex items-center gap-3">
                              <span className="font-black text-amber-400 font-mono text-sm">
                                {ord.order_number}
                              </span>
                              <span className="text-xs font-bold text-stone-200 bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-800">
                                {ord.table_name}
                              </span>
                              <span className="text-xs text-stone-400">{ord.guest_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-amber-300">
                                {formatPrice(ord.total_amount)}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                                  getStatusInfo(ord.order_status).color
                                }`}
                              >
                                {getStatusInfo(ord.order_status).text}
                              </span>
                            </div>
                          </div>

                          {/* Items in order */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {ord.items.map((it) => (
                              <div key={it.id} className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                                <div className="font-bold text-stone-200">
                                  {it.item_title_snapshot} × {it.quantity}
                                </div>
                                {it.options && it.options.length > 0 && (
                                  <div className="text-[11px] text-stone-400 mt-0.5">
                                    {it.options.map((o) => o.value_title_snapshot).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {ord.notes && (
                            <div className="text-xs bg-amber-950/30 border border-amber-900/40 text-amber-200 p-2.5 rounded-xl">
                              یادداشت مهمان: {ord.notes}
                            </div>
                          )}

                          {/* Status Progression Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800/80">
                            <span className="text-xs text-stone-400">تغییر وضعیت:</span>
                            {ord.order_status === 'PAID' && (
                              <button
                                disabled={adminActionLoading}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'CONFIRMED')}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                تأیید کافه
                              </button>
                            )}
                            {(ord.order_status === 'PAID' || ord.order_status === 'CONFIRMED') && (
                              <button
                                disabled={adminActionLoading}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                شروع آماده‌سازی باریستا
                              </button>
                            )}
                            {ord.order_status === 'PREPARING' && (
                              <button
                                disabled={adminActionLoading}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'READY')}
                                className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                آماده تحویل به میز
                              </button>
                            )}
                            {ord.order_status === 'READY' && (
                              <button
                                disabled={adminActionLoading}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                                className="bg-stone-600 hover:bg-stone-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                سرو شد (پایان)
                              </button>
                            )}
                            {ord.order_status !== 'DELIVERED' && ord.order_status !== 'CANCELLED' && (
                              <button
                                disabled={adminActionLoading}
                                onClick={() => handleUpdateOrderStatus(ord.id, 'CANCELLED')}
                                className="text-red-400 hover:bg-red-950/30 px-2 py-1 rounded-lg text-xs font-bold ml-auto"
                              >
                                لغو سفارش
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Section 3: Products Management */}
                {adminSection === 'products' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {adminProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-[#1A1411] border border-stone-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-sm text-stone-200">{prod.title}</h4>
                              <button
                                onClick={() => handleToggleProductInventory(prod.id, prod.inventory_status)}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                                  prod.inventory_status === 'AVAILABLE'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}
                              >
                                {prod.inventory_status === 'AVAILABLE' ? 'موجود' : 'ناموجود'}
                              </button>
                            </div>
                            <div className="text-xs text-amber-400 font-bold mt-1">
                              {formatPrice(prod.price)}
                            </div>
                            <p className="text-[11px] text-stone-400 line-clamp-2 mt-1">
                              {prod.description}
                            </p>
                          </div>
                          <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-800">
                            گزینه‌ها: {prod.options?.length || 0} گزینه
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-Section 4: Tables & QR Code Generator */}
                {adminSection === 'tables' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {tables.map((tbl) => (
                        <div
                          key={tbl.id}
                          className="bg-[#1A1411] border border-stone-800 rounded-2xl p-4 text-center space-y-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto font-black">
                            {tbl.table_number}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-stone-200">{tbl.name}</div>
                            <div className="text-xs text-stone-400">ظرفیت {tbl.capacity} نفر</div>
                          </div>
                          <button
                            onClick={() => handleShowTableQr(tbl.id)}
                            className="w-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>بارکد QR میز</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* PRODUCT CUSTOMIZATION MODAL                                     */}
      {/* ============================================================== */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#1C1511] border border-stone-800 rounded-t-3xl sm:rounded-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-100">{customizingItem.title}</h3>
                {customizingItem.title_en && (
                  <div className="text-xs text-stone-400 font-mono">{customizingItem.title_en}</div>
                )}
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Groups */}
            {customizingItem.options && customizingItem.options.length > 0 ? (
              <div className="space-y-4">
                {customizingItem.options.map((opt) => (
                  <div key={opt.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                      <span>{opt.title}</span>
                      {opt.is_required && (
                        <span className="text-[10px] text-amber-400 font-normal">الزامی</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {opt.values.map((val) => {
                        const isSelected = (selectedOptionValues[opt.id] || []).includes(val.id);
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => handleToggleOptionValue(opt, val.id)}
                            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                                : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <span className="font-semibold">{val.title}</span>
                            {val.extra_price > 0 && (
                              <span className="text-[11px] font-mono text-amber-400">
                                +{val.extra_price.toLocaleString('fa-IR')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 leading-relaxed">{customizingItem.description}</p>
            )}

            {/* Quantity Selector & Add Button */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5">
                <button
                  onClick={() => setCustomizingQuantity((q) => Math.max(1, q - 1))}
                  className="text-stone-400 hover:text-stone-100 p-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm w-5 text-center">{customizingQuantity}</span>
                <button
                  onClick={() => setCustomizingQuantity((q) => q + 1)}
                  className="text-stone-400 hover:text-stone-100 p-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between shadow-lg shadow-amber-950/50 cursor-pointer"
              >
                <span>افزودن به سبد</span>
                <span>{formatPrice(calculateCustomizedPrice)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SHOPPING CART DRAWER                                           */}
      {/* ============================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-[#18120F] border-r border-stone-800 h-full flex flex-col justify-between p-5 shadow-2xl">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-stone-100">سبد سفارش شما</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-amber-400 mt-2">
                سفارش برای: <span className="font-bold">{selectedTable?.name}</span>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-stone-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-stone-700" />
                  <p className="text-xs">سبد خرید شما در حال حاضر خالی است.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#201814] p-3 rounded-xl border border-stone-800/80 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-stone-100">{item.menuItem.title}</div>
                        {item.selectedValues.length > 0 && (
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            {item.selectedValues.map((v) => v.valueTitle).join(' | ')}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-bold text-amber-300">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-lg px-2 py-0.5 text-xs">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="text-stone-400 hover:text-stone-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="text-stone-400 hover:text-stone-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Guest Form & Checkout Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-stone-800 space-y-3">
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="نام مهمان (اختیاری)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="توضیحات سفارش (مثلاً: چای بعد از بازی، کم‌شیرین)"
                    value={cartNotes}
                    onChange={(e) => setCartNotes(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-stone-400">مجموع قابل پرداخت:</span>
                  <span className="text-base font-black text-amber-300">
                    {formatPrice(cartTotalAmount)}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white font-bold py-3 rounded-xl text-sm shadow-xl shadow-amber-950/60 cursor-pointer"
                >
                  تأیید سفارش و ورود به درگاه پرداخت
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SHETAB / SANDBOX PAYMENT GATEWAY MODAL                         */}
      {/* ============================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1A1411] border border-amber-600/40 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-amber-400 font-bold">درگاه پرداخت الکترونیک کافه نرد</div>
              <h3 className="text-lg font-black text-stone-100">پرداخت امن شاپرک / سداد</h3>
              <p className="text-xs text-stone-400 mt-1">
                سفارش {activeOrder?.order_number} برای {selectedTable?.name}
              </p>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">مبلغ تراکنش:</span>
                <span className="font-bold text-amber-300">
                  {formatPrice(activeOrder?.total_amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">شناسه مرجع:</span>
                <span className="font-mono text-stone-300">{paymentAuthority.slice(0, 16)}...</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                disabled={paymentProcessing}
                onClick={() => handleSimulatePayment('SUCCESS')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
              >
                {paymentProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>پرداخت موفق (شبیه‌ساز بانکی)</span>
              </button>
              <button
                disabled={paymentProcessing}
                onClick={() => handleSimulatePayment('FAILED')}
                className="w-full bg-stone-900 hover:bg-stone-800 text-stone-400 py-2.5 rounded-xl text-xs font-semibold"
              >
                انصراف از پرداخت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TABLE QR CODE MODAL                                            */}
      {/* ============================================================== */}
      {adminQrModalTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1A1411] border border-stone-800 rounded-3xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-200">
                بارکد اختصاصی {adminQrModalTable.table_name}
              </h3>
              <button
                onClick={() => setAdminQrModalTable(null)}
                className="text-stone-400 hover:text-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
              <img
                src={adminQrModalTable.qr_data_url}
                alt={adminQrModalTable.table_name}
                className="w-56 h-56 mx-auto"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-stone-400">لینک سفارش مستقیم مهمان:</div>
              <div className="bg-stone-900 p-2 rounded-xl text-[11px] font-mono text-amber-300 break-all select-all border border-stone-800">
                {adminQrModalTable.target_url}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(adminQrModalTable.target_url);
                  showToast('لینک میز در حافظه کپی شد!');
                }}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 mx-auto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>کپی لینک سفارش</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
