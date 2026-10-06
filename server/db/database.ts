import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  User,
  TableEntity,
  TableSession,
  MenuCategory,
  MenuItem,
  MenuItemOption,
  MenuItemOptionValue,
  Order,
  OrderItem,
  OrderItemOptionSnapshot,
  OrderStatusHistoryItem,
  PaymentRecord,
  AuditLog,
  NotificationItem,
  OrderStatus,
  PaymentStatus,
} from '../types/index.ts';

interface DatabaseSchema {
  users: User[];
  tables: TableEntity[];
  table_sessions: TableSession[];
  menu_categories: MenuCategory[];
  menu_items: MenuItem[];
  menu_item_options: MenuItemOption[];
  menu_item_option_values: MenuItemOptionValue[];
  orders: Order[];
  payments: PaymentRecord[];
  audit_logs: AuditLog[];
  notifications: NotificationItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'cafenard_db.json');

class RelationalDatabase {
  private data: DatabaseSchema = {
    users: [],
    tables: [],
    table_sessions: [],
    menu_categories: [],
    menu_items: [],
    menu_item_options: [],
    menu_item_option_values: [],
    orders: [],
    payments: [],
    audit_logs: [],
    notifications: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.initialized = true;
        return;
      } catch (err) {
        console.error('Failed to parse database file, re-seeding...', err);
      }
    }

    this.seedInitialData();
    this.save();
    this.initialized = true;
  }

  public save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database snapshot:', err);
    }
  }

  private seedInitialData() {
    console.log('🌱 Seeding initial relational database for Cafe Nard...');
    const now = new Date().toISOString();

    // 1. Users
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const managerHash = bcrypt.hashSync('manager123', salt);
    const staffHash = bcrypt.hashSync('staff123', salt);

    this.data.users = [
      {
        id: 'usr_superadmin_01',
        username: 'admin',
        email: 'admin@cafenard.club',
        phone: '09120000001',
        password_hash: adminHash,
        full_name: 'مدیر ارشد باشگاه و کافه',
        role: 'SUPER_ADMIN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_manager_01',
        username: 'manager',
        email: 'manager@cafenard.club',
        phone: '09120000002',
        password_hash: managerHash,
        full_name: 'مدیر شیفت کافه',
        role: 'MANAGER',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_staff_01',
        username: 'barista',
        email: 'barista@cafenard.club',
        phone: '09120000003',
        password_hash: staffHash,
        full_name: 'باریستا و پرسنل سالن',
        role: 'CAFE_STAFF',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // 2. Tables (Tables 1 to 12 for the Backgammon Club)
    this.data.tables = [];
    for (let i = 1; i <= 12; i++) {
      // Deterministic, secure token per table
      const token = crypto
        .createHash('sha256')
        .update(`cafenard_club_table_seed_${i}_secure`)
        .digest('hex')
        .substring(0, 16);

      this.data.tables.push({
        id: `tbl_${i}`,
        table_number: i,
        name: `میز تخته‌نرد شماره ${i}`,
        qr_token: `tb_${i}_${token}`,
        capacity: i % 3 === 0 ? 4 : 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // 3. Menu Categories
    this.data.menu_categories = [
      {
        id: 'cat_espresso',
        title: 'اسپرسو و قهوه‌های تخصصی',
        title_en: 'Specialty Espresso & Coffee',
        description: 'دانه‌های سینگل اوریجین ۱۰۰٪ عربیکا با رست اختصاصی',
        icon: 'Coffee',
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_tea_infusions',
        title: 'چای اصیل و دمنوش‌های آرامش',
        title_en: 'Persian Teas & Herbal Infusions',
        description: 'دم‌آوری سنتی با سماور برنجی، هل، دارچین و گل‌سرخ',
        icon: 'CupSoda',
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_cold_drinks',
        title: 'بار سرد و کوکتل‌های کافه',
        title_en: 'Iced Drinks & Mocktails',
        description: 'نوشیدنی‌های دست‌ساز خنک، کلدبرو و شیک‌های غلیظ',
        icon: 'Wine',
        sort_order: 3,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_desserts',
        title: 'شیرینی و دسرهای دست‌ساز',
        title_en: 'Artisanal Desserts & Pastries',
        description: 'کیک‌های تازه پخت روز، باقلوا استانبولی و تارتهای لذیذ',
        icon: 'Cake',
        sort_order: 4,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_snacks',
        title: 'اسنک و خوراکی‌های حین بازی',
        title_en: 'Club Finger Foods & Snacks',
        description: 'لقمه‌های خوش‌خوراک و ساندویچ‌های تست گرم مناسب تمرکز مسابقه',
        icon: 'UtensilsCrossed',
        sort_order: 5,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // 4. Menu Items
    this.data.menu_items = [
      {
        id: 'item_espresso_double',
        category_id: 'cat_espresso',
        title: 'اسپرسو دوپیو (دوبل)',
        title_en: 'Espresso Doppio',
        description: 'عصاره‌گیری استاندارد ۳۶ گرمی از قهوه اتیوپی یرگاچف با اسیدیته شفاف و نت‌های گلی',
        price: 75000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 5,
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_latte_art',
        category_id: 'cat_espresso',
        title: 'کافه لاته مخملی',
        title_en: 'Velvety Caffe Latte',
        description: 'شات دوتایی اسپرسو به همراه فوم شیر نرم و متراکم با لاته آرت ظریف',
        price: 98000,
        discounted_price: 89000,
        inventory_status: 'AVAILABLE',
        is_featured: true,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 7,
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_cappuccino',
        category_id: 'cat_espresso',
        title: 'کاپوچینو ایتالیایی',
        title_en: 'Classic Cappuccino',
        description: 'نسبت متوازن یک‌سوم اسپرسو، یک‌سوم شیر بخارپز و یک‌سوم فوم غلیظ با پودر کاکائو تلخ',
        price: 95000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 6,
        sort_order: 3,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_americano',
        category_id: 'cat_espresso',
        title: 'آمریکانو کینگ سایز',
        title_en: 'Americano Grande',
        description: 'دوبل اسپرسو تخصصی ترکیب شده با آب داغ تصفیه شده، حفظ بافت و کرمای لطیف',
        price: 80000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: false,
        is_special: false,
        preparation_time_minutes: 5,
        sort_order: 4,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_persian_tea_pot',
        category_id: 'cat_tea_infusions',
        title: 'سرویس چای سرگل لاهیجان (قوری اختصاصی)',
        title_en: 'Lahijan Spring Tea Service',
        description: 'قوری چای قندپهلو به همراه نبات زعفرانی، هل سبز، دارچین چوبی و پولکی اصفهان',
        price: 85000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: true,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 8,
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_borage_infusion',
        category_id: 'cat_tea_infusions',
        title: 'دمنوش آرامش گل گاوزبان و سنبل‌الطیب',
        title_en: 'Calming Borage & Valerian Infusion',
        description: 'ترکیب اعلا برای حفظ تمرکز و رفع استرس حین دورهای نفس‌گیر تخته‌نرد به همراه لیمو عمانی',
        price: 92000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 10,
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_cold_brew_tonic',
        category_id: 'cat_cold_drinks',
        title: 'کلد برو تونیک با مرکبات خونی',
        title_en: 'Citrus Cold Brew Tonic',
        description: 'عصاره‌گیری سرد ۱۸ ساعته، آب تونیک گازدار، برش پرتقال خونی خشک‌شده و شاخه رزماری دودی',
        price: 115000,
        discounted_price: 105000,
        inventory_status: 'AVAILABLE',
        is_featured: true,
        is_popular: true,
        is_special: true,
        preparation_time_minutes: 6,
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_iced_spanish_latte',
        category_id: 'cat_cold_drinks',
        title: 'آیس اسپانیش لاته',
        title_en: 'Iced Spanish Latte',
        description: 'اسپرسوی غلیظ، شیر خنک، شیر عسلی کاراملی دست‌ساز بر روی قطعات شفاف یخ بلوری',
        price: 110000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 6,
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_chocolate_tart',
        category_id: 'cat_desserts',
        title: 'تارت شکلات بلژیکی با ورق طلا',
        title_en: 'Belgian Dark Chocolate Tart',
        description: 'کراست کره‌ای ترد، گاناش شکلات تلخ ۷۴٪، پرک پسته تازه و تزیین لوکس با پرک طلا خوراکی',
        price: 125000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: true,
        is_popular: true,
        is_special: true,
        preparation_time_minutes: 4,
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_baklava_ice_cream',
        category_id: 'cat_desserts',
        title: 'باقلوای کادایف پسته با بستنی سنتی زعفرانی',
        title_en: 'Pistachio Baklava with Saffron Ice Cream',
        description: 'سه تکه باقلوای گردویی-پسته‌ای گرم در کنار اسکوپ بستنی سرشیردار سنتی',
        price: 135000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: false,
        is_special: false,
        preparation_time_minutes: 5,
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_club_panini',
        category_id: 'cat_snacks',
        title: 'پانینی فیله مرغ دودی و پنیر گودا',
        title_en: 'Smoked Chicken & Gouda Panini',
        description: 'نان چاباتا داغ گریل شده، فیله مرغ مرینیت شده، سس خردل ملایم، چیپس نمکی دست‌ساز',
        price: 168000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 15,
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_club_nuts',
        category_id: 'cat_snacks',
        title: 'کاسه آجیل اعلا و مغزیجات برشته',
        title_en: 'Premium Roasted Club Nuts Bowl',
        description: 'پسته زعفرانی خندان، بادام هندی بوداده، فندق تفت داده شده و کشمش سبز بدون هسته',
        price: 145000,
        discounted_price: null,
        inventory_status: 'AVAILABLE',
        is_featured: false,
        is_popular: true,
        is_special: false,
        preparation_time_minutes: 3,
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // 5. Menu Item Options & Values (Generic custom options)
    // Options for Latte
    const latteOptSizeId = 'opt_latte_size';
    const latteOptMilkId = 'opt_latte_milk';
    const latteOptExtraId = 'opt_latte_extra';

    this.data.menu_item_options = [
      {
        id: latteOptSizeId,
        item_id: 'item_latte_art',
        title: 'انتخاب سایز لیوان',
        title_en: 'Cup Size',
        is_required: true,
        min_select: 1,
        max_select: 1,
        sort_order: 1,
        values: [],
      },
      {
        id: latteOptMilkId,
        item_id: 'item_latte_art',
        title: 'نوع شیر',
        title_en: 'Milk Option',
        is_required: false,
        min_select: 0,
        max_select: 1,
        sort_order: 2,
        values: [],
      },
      {
        id: latteOptExtraId,
        item_id: 'item_latte_art',
        title: 'افزودنی‌های دلخواه',
        title_en: 'Extras',
        is_required: false,
        min_select: 0,
        max_select: 2,
        sort_order: 3,
        values: [],
      },
      // Americano Size
      {
        id: 'opt_amer_size',
        item_id: 'item_americano',
        title: 'سایز ماگ',
        title_en: 'Size',
        is_required: true,
        min_select: 1,
        max_select: 1,
        sort_order: 1,
        values: [],
      },
    ];

    this.data.menu_item_option_values = [
      // Latte sizes
      {
        id: 'val_latte_s',
        option_id: latteOptSizeId,
        title: 'استاندارد (۲۵۰ میلی‌لیتر)',
        title_en: 'Standard (250ml)',
        extra_price: 0,
        is_default: true,
        sort_order: 1,
      },
      {
        id: 'val_latte_l',
        option_id: latteOptSizeId,
        title: 'بزرگ - گرنده (۳۸۰ میلی‌لیتر)',
        title_en: 'Grande (380ml)',
        extra_price: 25000,
        is_default: false,
        sort_order: 2,
      },
      // Latte milks
      {
        id: 'val_milk_whole',
        option_id: latteOptMilkId,
        title: 'شیر پرچرب محلی (پیش‌فرض)',
        title_en: 'Whole Milk',
        extra_price: 0,
        is_default: true,
        sort_order: 1,
      },
      {
        id: 'val_milk_oat',
        option_id: latteOptMilkId,
        title: 'شیر جو دوسر گیاهی (بدون لاکتوز)',
        title_en: 'Oat Milk',
        extra_price: 22000,
        is_default: false,
        sort_order: 2,
      },
      {
        id: 'val_milk_almond',
        option_id: latteOptMilkId,
        title: 'شیر بادام طبیعی',
        title_en: 'Almond Milk',
        extra_price: 26000,
        is_default: false,
        sort_order: 3,
      },
      // Latte extras
      {
        id: 'val_extra_shot',
        option_id: latteOptExtraId,
        title: 'یک شات اسپرسو اضافه (+Extra Shot)',
        title_en: 'Extra Shot',
        extra_price: 28000,
        is_default: false,
        sort_order: 1,
      },
      {
        id: 'val_extra_vanilla',
        option_id: latteOptExtraId,
        title: 'سیروپ وانیل ماداگاسکار',
        title_en: 'Madagascar Vanilla Syrup',
        extra_price: 18000,
        is_default: false,
        sort_order: 2,
      },
      {
        id: 'val_extra_caramel',
        option_id: latteOptExtraId,
        title: 'سیروپ سس کارامل نمکی',
        title_en: 'Salted Caramel',
        extra_price: 18000,
        is_default: false,
        sort_order: 3,
      },
      // Americano sizes
      {
        id: 'val_amer_m',
        option_id: 'opt_amer_size',
        title: 'متوسط (Medium)',
        title_en: 'Medium',
        extra_price: 0,
        is_default: true,
        sort_order: 1,
      },
      {
        id: 'val_amer_l',
        option_id: 'opt_amer_size',
        title: 'بزرگ دوبل (Large Double)',
        title_en: 'Large',
        extra_price: 20000,
        is_default: false,
        sort_order: 2,
      },
    ];

    // Seed 1 active sample order on Table 4 to showcase tracking and admin queue
    const sampleOrderId = 'ord_sample_101';
    this.data.orders = [
      {
        id: sampleOrderId,
        order_number: 'NARD-1024',
        table_id: 'tbl_4',
        table_number: 4,
        table_name: 'میز تخته‌نرد شماره ۴',
        session_token: 'sess_table_4_seed',
        guest_name: 'آرش کیانی',
        guest_phone: '09123456789',
        notes: 'لطفاً چای بعد از بازی داغ سرو شود',
        subtotal: 174000,
        discount_amount: 9000,
        total_amount: 165000,
        payment_status: 'PAID',
        order_status: 'PREPARING',
        cancellation_reason: null,
        items: [
          {
            id: 'oi_1',
            order_id: sampleOrderId,
            item_id: 'item_latte_art',
            item_title_snapshot: 'کافه لاته مخملی',
            unit_price_snapshot: 89000,
            quantity: 1,
            total_price: 89000,
            options: [
              {
                id: 'oio_1',
                order_item_id: 'oi_1',
                option_title_snapshot: 'انتخاب سایز لیوان',
                value_title_snapshot: 'استاندارد (۲۵۰ میلی‌لیتر)',
                extra_price_snapshot: 0,
              },
            ],
          },
          {
            id: 'oi_2',
            order_id: sampleOrderId,
            item_id: 'item_persian_tea_pot',
            item_title_snapshot: 'سرویس چای سرگل لاهیجان (قوری اختصاصی)',
            unit_price_snapshot: 85000,
            quantity: 1,
            total_price: 85000,
            options: [],
          },
        ],
        status_history: [
          {
            id: 'osh_1',
            order_id: sampleOrderId,
            previous_status: null,
            new_status: 'PENDING_PAYMENT',
            comment: 'سفارش توسط مهمان میز ۴ ثبت گردید',
            changed_by_user_id: null,
            created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          },
          {
            id: 'osh_2',
            order_id: sampleOrderId,
            previous_status: 'PENDING_PAYMENT',
            new_status: 'PAID',
            comment: 'تأییدیه درگاه پرداخت موفق (شماره پیگیری: 492810)',
            changed_by_user_id: null,
            created_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
          },
          {
            id: 'osh_3',
            order_id: sampleOrderId,
            previous_status: 'PAID',
            new_status: 'CONFIRMED',
            comment: 'سفارش توسط پرسنل کافه تأیید شد',
            changed_by_user_id: 'usr_staff_01',
            created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          },
          {
            id: 'osh_4',
            order_id: sampleOrderId,
            previous_status: 'CONFIRMED',
            new_status: 'PREPARING',
            comment: 'باریستا در حال تهیه سفارش است',
            changed_by_user_id: 'usr_staff_01',
            created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
    ];

    this.data.audit_logs = [
      {
        id: 'aud_1',
        user_id: 'usr_superadmin_01',
        username: 'admin',
        action: 'SYSTEM_INITIALIZED',
        entity: 'SYSTEM',
        entity_id: 'init',
        new_values: { tables_count: 12, menu_items_count: 12 },
        created_at: now,
      },
    ];

    console.log('✅ Initial database successfully seeded.');
  }

  // --- Users & Auth ---
  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.is_active
    );
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getAllUsers(): User[] {
    return this.data.users.map((u) => ({ ...u, password_hash: '***' }));
  }

  public createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const id = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      created_at: now,
      updated_at: now,
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // --- Tables ---
  public getAllTables(): TableEntity[] {
    return [...this.data.tables].sort((a, b) => a.table_number - b.table_number);
  }

  public getTableById(id: string): TableEntity | undefined {
    return this.data.tables.find((t) => t.id === id);
  }

  public getTableByNumber(tableNumber: number): TableEntity | undefined {
    return this.data.tables.find((t) => t.table_number === tableNumber);
  }

  public getTableByToken(token: string): TableEntity | undefined {
    return this.data.tables.find((t) => t.qr_token === token && t.is_active);
  }

  public createTable(tableNumber: number, name: string, capacity = 2): TableEntity {
    const existing = this.getTableByNumber(tableNumber);
    if (existing) {
      throw new Error(`میز شماره ${tableNumber} از قبل موجود است.`);
    }

    const token = crypto
      .createHash('sha256')
      .update(`table_${tableNumber}_${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    const now = new Date().toISOString();
    const newTable: TableEntity = {
      id: `tbl_${Date.now()}`,
      table_number: tableNumber,
      name,
      qr_token: `tb_${tableNumber}_${token}`,
      capacity,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    this.data.tables.push(newTable);
    this.save();
    return newTable;
  }

  public regenerateTableToken(tableId: string): TableEntity {
    const table = this.data.tables.find((t) => t.id === tableId);
    if (!table) throw new Error('میز مورد نظر یافت نشد.');

    const token = crypto
      .createHash('sha256')
      .update(`table_${table.table_number}_${Date.now()}_regen`)
      .digest('hex')
      .substring(0, 16);

    table.qr_token = `tb_${table.table_number}_${token}`;
    table.updated_at = new Date().toISOString();
    this.save();
    return table;
  }

  public updateTable(id: string, updates: Partial<TableEntity>): TableEntity {
    const index = this.data.tables.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('میز یافت نشد.');
    this.data.tables[index] = {
      ...this.data.tables[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.tables[index];
  }

  // --- Table Sessions ---
  public createTableSession(tableId: string, deviceInfo?: string): TableSession {
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const session: TableSession = {
      id: `sess_${Date.now()}`,
      table_id: tableId,
      session_token: sessionToken,
      guest_device_info: deviceInfo,
      is_active: true,
      created_at: now.toISOString(),
      expires_at: expiresAt,
    };

    this.data.table_sessions.push(session);
    this.save();
    return session;
  }

  public validateSession(sessionToken: string): TableSession | undefined {
    const session = this.data.table_sessions.find(
      (s) => s.session_token === sessionToken && s.is_active
    );
    if (!session) return undefined;
    if (new Date(session.expires_at) < new Date()) {
      session.is_active = false;
      this.save();
      return undefined;
    }
    return session;
  }

  // --- Categories ---
  public getAllCategories(includeInactive = false): MenuCategory[] {
    return this.data.menu_categories
      .filter((c) => includeInactive || c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getCategoryById(id: string): MenuCategory | undefined {
    return this.data.menu_categories.find((c) => c.id === id);
  }

  public createCategory(data: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>): MenuCategory {
    const now = new Date().toISOString();
    const id = `cat_${Date.now()}`;
    const newCat: MenuCategory = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    this.data.menu_categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<MenuCategory>): MenuCategory {
    const index = this.data.menu_categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('دسته‌بندی یافت نشد.');
    this.data.menu_categories[index] = {
      ...this.data.menu_categories[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.menu_categories[index];
  }

  public deleteCategory(id: string): void {
    const hasItems = this.data.menu_items.some((i) => i.category_id === id);
    if (hasItems) {
      throw new Error('به دلیل وجود محصول در این دسته، امکان حذف مستقیم وجود ندارد. ابتدا محصولات را انتقال دهید.');
    }
    this.data.menu_categories = this.data.menu_categories.filter((c) => c.id !== id);
    this.save();
  }

  // --- Menu Items & Options ---
  public getAllMenuItems(includeInactive = false): MenuItem[] {
    return this.data.menu_items
      .filter((item) => includeInactive || (item.is_active && item.inventory_status !== 'HIDDEN'))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => this.attachOptionsToItem(item));
  }

  public getMenuItemById(id: string): MenuItem | undefined {
    const item = this.data.menu_items.find((i) => i.id === id);
    if (!item) return undefined;
    return this.attachOptionsToItem(item);
  }

  private attachOptionsToItem(item: MenuItem): MenuItem {
    const options = this.data.menu_item_options
      .filter((opt) => opt.item_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((opt) => ({
        ...opt,
        values: this.data.menu_item_option_values
          .filter((v) => v.option_id === opt.id)
          .sort((a, b) => a.sort_order - b.sort_order),
      }));

    return {
      ...item,
      options,
    };
  }

  public createMenuItem(
    itemData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'options'>,
    optionsInput?: Array<Omit<MenuItemOption, 'id' | 'item_id' | 'values'> & {
      values: Array<Omit<MenuItemOptionValue, 'id' | 'option_id'>>;
    }>
  ): MenuItem {
    const now = new Date().toISOString();
    const id = `item_${Date.now()}`;
    const newItem: MenuItem = {
      ...itemData,
      id,
      created_at: now,
      updated_at: now,
    };
    this.data.menu_items.push(newItem);

    if (optionsInput && optionsInput.length > 0) {
      optionsInput.forEach((optInput, idx) => {
        const optId = `opt_${id}_${idx}_${Date.now()}`;
        const newOpt: MenuItemOption = {
          id: optId,
          item_id: id,
          title: optInput.title,
          title_en: optInput.title_en,
          is_required: optInput.is_required,
          min_select: optInput.min_select,
          max_select: optInput.max_select,
          sort_order: optInput.sort_order ?? idx + 1,
          values: [],
        };
        this.data.menu_item_options.push(newOpt);

        optInput.values.forEach((valInput, vIdx) => {
          const valId = `val_${optId}_${vIdx}`;
          const newVal: MenuItemOptionValue = {
            id: valId,
            option_id: optId,
            title: valInput.title,
            title_en: valInput.title_en,
            extra_price: Number(valInput.extra_price) || 0,
            is_default: Boolean(valInput.is_default),
            sort_order: valInput.sort_order ?? vIdx + 1,
          };
          this.data.menu_item_option_values.push(newVal);
        });
      });
    }

    this.save();
    return this.attachOptionsToItem(newItem);
  }

  public updateMenuItem(
    id: string,
    updates: Partial<MenuItem>,
    newOptions?: Array<Omit<MenuItemOption, 'id' | 'item_id' | 'values'> & {
      values: Array<Omit<MenuItemOptionValue, 'id' | 'option_id'>>;
    }>
  ): MenuItem {
    const index = this.data.menu_items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('محصول یافت نشد.');

    this.data.menu_items[index] = {
      ...this.data.menu_items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (newOptions) {
      // Remove old options and values for this item
      const oldOptIds = this.data.menu_item_options
        .filter((o) => o.item_id === id)
        .map((o) => o.id);
      this.data.menu_item_option_values = this.data.menu_item_option_values.filter(
        (v) => !oldOptIds.includes(v.option_id)
      );
      this.data.menu_item_options = this.data.menu_item_options.filter((o) => o.item_id !== id);

      // Insert fresh options
      newOptions.forEach((optInput, idx) => {
        const optId = `opt_${id}_${idx}_${Date.now()}`;
        const newOpt: MenuItemOption = {
          id: optId,
          item_id: id,
          title: optInput.title,
          title_en: optInput.title_en,
          is_required: optInput.is_required,
          min_select: optInput.min_select,
          max_select: optInput.max_select,
          sort_order: optInput.sort_order ?? idx + 1,
          values: [],
        };
        this.data.menu_item_options.push(newOpt);

        optInput.values.forEach((valInput, vIdx) => {
          const valId = `val_${optId}_${vIdx}`;
          const newVal: MenuItemOptionValue = {
            id: valId,
            option_id: optId,
            title: valInput.title,
            title_en: valInput.title_en,
            extra_price: Number(valInput.extra_price) || 0,
            is_default: Boolean(valInput.is_default),
            sort_order: valInput.sort_order ?? vIdx + 1,
          };
          this.data.menu_item_option_values.push(newVal);
        });
      });
    }

    this.save();
    return this.attachOptionsToItem(this.data.menu_items[index]);
  }

  public deleteMenuItem(id: string): void {
    // Soft-delete or check order items
    const hasOrderReferences = this.data.orders.some((o) =>
      o.items.some((i) => i.item_id === id)
    );

    if (hasOrderReferences) {
      // Safely deactivate to protect historical orders
      const item = this.data.menu_items.find((i) => i.id === id);
      if (item) {
        item.is_active = false;
        item.inventory_status = 'HIDDEN';
        item.updated_at = new Date().toISOString();
        this.save();
      }
    } else {
      this.data.menu_items = this.data.menu_items.filter((i) => i.id !== id);
      const optIds = this.data.menu_item_options
        .filter((o) => o.item_id === id)
        .map((o) => o.id);
      this.data.menu_item_option_values = this.data.menu_item_option_values.filter(
        (v) => !optIds.includes(v.option_id)
      );
      this.data.menu_item_options = this.data.menu_item_options.filter((o) => o.item_id !== id);
      this.save();
    }
  }

  // --- Orders & Backend Price Integrity ---
  public createOrder(input: {
    table_id: string;
    session_token?: string;
    guest_name?: string;
    guest_phone?: string;
    notes?: string;
    items: Array<{
      item_id: string;
      quantity: number;
      selected_value_ids?: string[];
    }>;
  }): Order {
    const table = this.getTableById(input.table_id);
    if (!table || !table.is_active) {
      throw new Error('میز انتخابی نامعتبر یا غیرفعال است.');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('سبد خرید نمی‌تواند خالی باشد.');
    }

    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `NARD-${table.table_number}${randomSuffix}`;

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    // CRITICAL: Calculate real prices from database snapshots only
    for (const clientItem of input.items) {
      const dbItem = this.getMenuItemById(clientItem.item_id);
      if (!dbItem || !dbItem.is_active || dbItem.inventory_status === 'HIDDEN') {
        throw new Error(`محصول با شناسه ${clientItem.item_id} موجود نیست.`);
      }

      if (dbItem.inventory_status === 'UNAVAILABLE') {
        throw new Error(`محصول «${dbItem.title}» در حال حاضر ناموجود است.`);
      }

      const quantity = Math.max(1, Math.min(clientItem.quantity || 1, 50));
      // Unit price is base price or discounted price if active
      const unitPrice =
        dbItem.discounted_price !== null && dbItem.discounted_price !== undefined
          ? Number(dbItem.discounted_price)
          : Number(dbItem.price);

      let itemOptionTotal = 0;
      const optionSnapshots: OrderItemOptionSnapshot[] = [];

      if (clientItem.selected_value_ids && clientItem.selected_value_ids.length > 0) {
        for (const valId of clientItem.selected_value_ids) {
          const dbVal = this.data.menu_item_option_values.find((v) => v.id === valId);
          if (dbVal) {
            const dbOpt = this.data.menu_item_options.find((o) => o.id === dbVal.option_id);
            const extraPrice = Number(dbVal.extra_price) || 0;
            itemOptionTotal += extraPrice;

            optionSnapshots.push({
              id: `oio_${Date.now()}_${Math.random()}`,
              order_item_id: `oi_${orderItems.length + 1}`,
              option_title_snapshot: dbOpt?.title || 'گزینه',
              value_title_snapshot: dbVal.title,
              extra_price_snapshot: extraPrice,
            });
          }
        }
      }

      const totalItemPrice = (unitPrice + itemOptionTotal) * quantity;
      subtotal += totalItemPrice;

      orderItems.push({
        id: `oi_${Date.now()}_${orderItems.length + 1}`,
        order_id: orderId,
        item_id: dbItem.id,
        item_title_snapshot: dbItem.title,
        unit_price_snapshot: unitPrice,
        quantity,
        total_price: totalItemPrice,
        options: optionSnapshots,
      });
    }

    const now = new Date().toISOString();
    const initialStatus: OrderStatus = 'PENDING_PAYMENT';

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      table_id: table.id,
      table_number: table.table_number,
      table_name: table.name,
      session_token: input.session_token,
      guest_name: input.guest_name?.trim() || `مهمان میز ${table.table_number}`,
      guest_phone: input.guest_phone?.trim(),
      notes: input.notes?.trim(),
      subtotal,
      discount_amount: 0,
      total_amount: subtotal,
      payment_status: 'PENDING',
      order_status: initialStatus,
      cancellation_reason: null,
      items: orderItems,
      status_history: [
        {
          id: `osh_${Date.now()}`,
          order_id: orderId,
          previous_status: null,
          new_status: initialStatus,
          comment: `سفارش جدید برای ${table.name} ثبت گردید.`,
          changed_by_user_id: null,
          created_at: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };

    this.data.orders.unshift(newOrder);

    // Create system notification
    this.createNotification({
      type: 'ORDER_CREATED',
      title: `سفارش جدید ${newOrder.order_number}`,
      message: `${newOrder.table_name} — مبلغ ${newOrder.total_amount.toLocaleString('fa-IR')} تومان`,
      reference_id: newOrder.id,
    });

    this.save();
    return newOrder;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.order_number === id);
  }

  public getOrdersByTable(tableId: string): Order[] {
    return this.data.orders.filter((o) => o.table_id === tableId);
  }

  public getOrdersBySession(sessionToken: string): Order[] {
    return this.data.orders.filter((o) => o.session_token === sessionToken);
  }

  public getAllOrders(filters?: {
    status?: OrderStatus;
    table_id?: string;
    payment_status?: PaymentStatus;
    search?: string;
  }): Order[] {
    return this.data.orders.filter((order) => {
      if (filters?.status && order.order_status !== filters.status) return false;
      if (filters?.table_id && order.table_id !== filters.table_id) return false;
      if (filters?.payment_status && order.payment_status !== filters.payment_status) return false;
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        const matches =
          order.order_number.toLowerCase().includes(s) ||
          (order.guest_name && order.guest_name.toLowerCase().includes(s)) ||
          (order.guest_phone && order.guest_phone.includes(s)) ||
          order.table_name.toLowerCase().includes(s);
        if (!matches) return false;
      }
      return true;
    });
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    options?: {
      comment?: string;
      changed_by_user_id?: string;
      cancellation_reason?: string;
    }
  ): Order {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('سفارش مورد نظر یافت نشد.');

    const previousStatus = order.order_status;
    if (previousStatus === newStatus) return order;

    const now = new Date().toISOString();
    order.order_status = newStatus;
    order.updated_at = now;

    if (newStatus === 'CANCELLED' && options?.cancellation_reason) {
      order.cancellation_reason = options.cancellation_reason;
    }

    if (newStatus === 'PAID') {
      order.payment_status = 'PAID';
    }

    // Append to status history
    order.status_history.push({
      id: `osh_${Date.now()}_${Math.random()}`,
      order_id: orderId,
      previous_status: previousStatus,
      new_status: newStatus,
      comment: options?.comment || `وضعیت به ${newStatus} تغییر یافت.`,
      changed_by_user_id: options?.changed_by_user_id || null,
      created_at: now,
    });

    // Create notification
    this.createNotification({
      type: `ORDER_${newStatus}`,
      title: `تغییر وضعیت سفارش ${order.order_number}`,
      message: `وضعیت ${order.table_name} به «${newStatus}» تغییر کرد.`,
      reference_id: order.id,
    });

    this.save();
    return order;
  }

  // --- Payments ---
  public recordPayment(record: Omit<PaymentRecord, 'id' | 'created_at'>): PaymentRecord {
    const id = `pay_${Date.now()}`;
    const newRecord: PaymentRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
    };
    this.data.payments.push(newRecord);
    this.save();
    return newRecord;
  }

  public getPaymentByAuthority(authority: string): PaymentRecord | undefined {
    return this.data.payments.find((p) => p.authority === authority);
  }

  public verifyPayment(
    paymentId: string,
    refId: string,
    status: 'SUCCESS' | 'FAILED',
    rawResponse?: string
  ): PaymentRecord {
    const payment = this.data.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('رکورد پرداخت یافت نشد.');

    payment.status = status;
    payment.ref_id = refId;
    payment.raw_response = rawResponse;
    payment.verified_at = new Date().toISOString();

    if (status === 'SUCCESS') {
      this.updateOrderStatus(payment.order_id, 'PAID', {
        comment: `پرداخت موفقیت‌آمیز آنلاین (کد رهگیری: ${refId})`,
      });
    }

    this.save();
    return payment;
  }

  // --- Audit Logs ---
  public logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(newLog);
    // Keep max 500 audit logs
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
    this.save();
    return newLog;
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  // --- Notifications ---
  public createNotification(notif: Omit<NotificationItem, 'id' | 'is_read' | 'created_at'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random()}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    if (this.data.notifications.length > 100) {
      this.data.notifications.pop();
    }
    this.save();
    return newNotif;
  }

  public getNotifications(unreadOnly = false): NotificationItem[] {
    return unreadOnly
      ? this.data.notifications.filter((n) => !n.is_read)
      : this.data.notifications;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.save();
    }
  }

  public markAllNotificationsAsRead(): void {
    this.data.notifications.forEach((n) => (n.is_read = true));
    this.save();
  }

  // --- Dashboard Analytics ---
  public getDashboardMetrics() {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = this.data.orders.filter((o) => o.created_at.startsWith(today));

    const totalSalesToday = todayOrders
      .filter((o) => o.payment_status === 'PAID')
      .reduce((sum, o) => sum + o.total_amount, 0);

    const pendingCount = this.data.orders.filter(
      (o) => o.order_status === 'PENDING_PAYMENT' || o.order_status === 'PAID'
    ).length;

    const preparingCount = this.data.orders.filter(
      (o) => o.order_status === 'CONFIRMED' || o.order_status === 'PREPARING'
    ).length;

    const readyCount = this.data.orders.filter((o) => o.order_status === 'READY').length;

    const unavailableProducts = this.data.menu_items.filter(
      (i) => i.inventory_status === 'UNAVAILABLE'
    );

    // Calculate popular items
    const itemSalesCount: Record<string, { title: string; count: number; totalRevenue: number }> = {};
    for (const order of this.data.orders) {
      if (order.payment_status === 'PAID' || order.order_status !== 'CANCELLED') {
        for (const item of order.items) {
          if (!itemSalesCount[item.item_id]) {
            itemSalesCount[item.item_id] = {
              title: item.item_title_snapshot,
              count: 0,
              totalRevenue: 0,
            };
          }
          itemSalesCount[item.item_id].count += item.quantity;
          itemSalesCount[item.item_id].totalRevenue += item.total_price;
        }
      }
    }

    const popularItems = Object.values(itemSalesCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      todayOrdersCount: todayOrders.length,
      totalSalesToday,
      pendingCount,
      preparingCount,
      readyCount,
      totalTables: this.data.tables.length,
      activeTablesCount: this.data.tables.filter((t) => t.is_active).length,
      unavailableProductsCount: unavailableProducts.length,
      popularItems,
      recentOrders: this.data.orders.slice(0, 8),
    };
  }
}

export const db = new RelationalDatabase();
