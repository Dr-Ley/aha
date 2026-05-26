// lib/schema.ts
import {
  pgTable,
  real,
  serial,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
  unique,
  date,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'customer',
  'staff',
  'admin',
  'operations',
  'finance',
]);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed', 'refunded']);
export const tripCountryEnum = pgEnum('trip_country', ['Kenya', 'Tanzania']);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "partial", "unpaid"]);

/** Polymorphic link for payments / expenses / revenue (nullable = legacy tour-only rows use `bookingId`). */
export const financialReferenceTypeEnum = pgEnum("financial_reference_type", [
  "tour",
  "hotel",
  "restaurant",
  "bar",
  "payment",
]);

/** EWC hotel stays: board basis (nullable for BTH-only rows). */
export const hotelMealTypeEnum = pgEnum("hotel_meal_type", ["full_board", "half_board", "bed_only"]);

/** Hotel reservation lifecycle (separate from tour `booking_status`). */
export const hotelReservationStatusEnum = pgEnum("hotel_reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
  "checked_out",
]);

/** RBAC: dashboard modules (extend enum + migrations when adding modules). */
export const permissionModuleEnum = pgEnum("permission_module", [
  "overview",
  "tours",
  "accommodation",
  "restaurant",
  "bar",
  "bookings",
  "payments",
  "expenses",
  "enquiries",
]);

export const notificationEntityEnum = pgEnum("notification_entity", [
  "booking",
  "hotel",
  "payment",
  "expense",
  "restaurant",
  "bar",
  "enquiry",
]);

export const notificationActionEnum = pgEnum("notification_action", [
  "created",
  "updated",
  "deleted",
]);

/** Tenant companies (IDs align with dashboard `CompanyId`). */
export const companies = pgTable('companies', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Users table (extends mock users with password hashing)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(), // Never store plain text!
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('customer').notNull(),
  avatar: varchar('avatar', { length: 10 }),
  phone: varchar('phone', { length: 50 }),
  country: varchar('country', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  /** When false, dashboard notification bell is hidden and listing APIs return no items for this user. */
  dashboardNotificationsEnabled: boolean('dashboard_notifications_enabled').default(true).notNull(),
});

// Tours table
export const tours = pgTable('tours', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  shortTitle: varchar('short_title', { length: 255 }).notNull(),
  destination: varchar('destination', { length: 255 }).notNull(),
  countries: jsonb('countries').$type<string[]>().notNull(),
  duration: varchar('duration', { length: 100 }).notNull(),
  days: integer('days').notNull(),
  price: integer('price').notNull(),
  originalPrice: integer('original_price'),
  image: jsonb('image').$type<string[]>().notNull(),
  gallery: jsonb('gallery').$type<string[]>(),
  description: text('description').notNull(),
  longDescription: text('long_description').notNull(),
  highlights: jsonb('highlights').$type<string[]>().notNull(),
  included: jsonb('included').$type<string[]>().notNull(),
  excluded: jsonb('excluded').$type<string[]>().notNull(),
  itinerary: jsonb('itinerary').$type<{ day: number; title: string; description: string }[]>().notNull(),
  rating: real('rating').notNull(), // Changed from integer to real
  reviewCount: integer('review_count').notNull(),
  departing: varchar('departing', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 50 }).notNull(),
  groupSize: varchar('group_size', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  tier: varchar('tier', { length: 50 }).notNull(),
  recommended: boolean('recommended').default(false),
  featured: boolean('featured').default(false),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Accommodations table
export const accommodations = pgTable('accommodations', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  country: varchar('country', { length: 50 }).notNull(),
  image: jsonb('image').$type<string[]>().notNull(),
  description: text('description').notNull(),
  amenities: jsonb('amenities').$type<string[]>().notNull(),
  priceFrom: integer('price_from').notNull(),
  badges: jsonb('badges').$type<string[]>().notNull(),
  recommended: boolean('recommended').default(false),
  type: varchar('type', { length: 50 }).notNull(),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  companyId: varchar('company_id', { length: 32 })
    .references(() => companies.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  tourId: integer('tour_id').references(() => tours.id),
  status: bookingStatusEnum('status').default('pending'),
  
  // Trip details
  travelDate: varchar('travel_date', { length: 50 }).notNull(),
  guests: integer('guests').notNull(),
  accommodation: varchar('accommodation', { length: 50 }).notNull(),
  transport: varchar('transport', { length: 50 }).notNull(),
  specialRequests: text('special_requests'),
  /** Safari / package label for dashboard (falls back to tour title in API when null). */
  safariPackage: varchar('safari_package', { length: 512 }),
  /** Destination country for the safari product (not guest nationality). */
  tripCountry: tripCountryEnum('trip_country'),
  startDate: varchar('start_date', { length: 50 }),
  endDate: varchar('end_date', { length: 50 }),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid').notNull(),
  
  // Personal info (redundant for guest bookings)
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  country: varchar('country', { length: 100 }),
  
  // Pricing
  pricePerPerson: integer('price_per_person'),
  /** Dashboard/accounting value in KES. */
  totalPrice: integer('total_price'),
  /** Customer-facing amount/currency captured at booking time for audit and receipts. */
  originalAmount: integer('original_amount'),
  originalCurrency: varchar('original_currency', { length: 10 }).default('KES').notNull(),
  exchangeRateToKes: real('exchange_rate_to_kes').default(1).notNull(),
  exchangeRateDate: date('exchange_rate_date', { mode: 'string' }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  /** Tour booking receipt (AHA / EWC tours). Kept for backward compatibility. */
  bookingId: integer("booking_id").references(() => bookings.id),
  /** Unified cross-domain reporting: pairs with `referenceId` (no FK — polymorphic). */
  referenceType: financialReferenceTypeEnum("reference_type"),
  referenceId: integer("reference_id"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("KES").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  method: varchar("method", { length: 64 }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  referenceType: financialReferenceTypeEnum("reference_type"),
  referenceId: integer("reference_id"),
  category: varchar("category", { length: 100 }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  incurredAt: timestamp("incurred_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const revenueEntries = pgTable("revenue_entries", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  referenceType: financialReferenceTypeEnum("reference_type"),
  referenceId: integer("reference_id"),
  amount: integer("amount").notNull(),
  packageLabel: varchar("package_label", { length: 255 }),
  periodMonth: varchar("period_month", { length: 7 }),
  recognizedAt: timestamp("recognized_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Hotel module (EWC + BTH): inventory + stays (NOT tour `bookings`) ---

export const roomTypes = pgTable("room_types", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  maxOccupancy: integer("max_occupancy").default(2).notNull(),
  baseRate: integer("base_rate"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  roomTypeId: integer("room_type_id")
    .references(() => roomTypes.id)
    .notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }),
  floor: varchar("floor", { length: 20 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotelBookings = pgTable("hotel_bookings", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  roomId: integer("room_id")
    .references(() => rooms.id)
    .notNull(),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }).notNull(),
  nights: integer("nights").notNull(),
  totalAmount: integer("total_amount").notNull(),
  amountPaid: integer("amount_paid").notNull().default(0),
  paymentMethod: varchar("payment_method", { length: 64 }),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  /** EWC: external operator bringing guests. */
  externalCompany: varchar("external_company", { length: 255 }),
  /** EWC: board package. */
  mealType: hotelMealTypeEnum("meal_type"),
  status: hotelReservationStatusEnum("reservation_status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hotelBookingGuests = pgTable("hotel_booking_guests", {
  id: serial("id").primaryKey(),
  hotelBookingId: integer("hotel_booking_id")
    .references(() => hotelBookings.id)
    .notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotelBookingPayments = pgTable("hotel_booking_payments", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  hotelBookingId: integer("hotel_booking_id")
    .references(() => hotelBookings.id)
    .notNull(),
  amount: integer("amount").notNull(),
  method: varchar("method", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull().default("completed"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Restaurant module (BTH primary; scoped by companyId) ---

export const restaurantCategories = pgTable("restaurant_categories", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const restaurantItems = pgTable("restaurant_items", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => restaurantCategories.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const restaurantOrders = pgTable("restaurant_orders", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  /** Payment state: unpaid | partially_paid | paid */
  status: varchar("status", { length: 32 }).default("unpaid").notNull(),
  tableLabel: varchar("table_label", { length: 80 }),
  customerName: varchar("customer_name", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const restaurantOrderItems = pgTable("restaurant_order_items", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  orderId: integer("order_id")
    .references(() => restaurantOrders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => restaurantItems.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Bar module (EWC + BTH; scoped by companyId) ---

export const barCategories = pgTable("bar_categories", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const barItems = pgTable("bar_items", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => barCategories.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const barOrders = pgTable("bar_orders", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  /** Payment state: unpaid | partially_paid | paid */
  status: varchar("status", { length: 32 }).default("unpaid").notNull(),
  tableLabel: varchar("table_label", { length: 80 }),
  customerName: varchar("customer_name", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const barOrderItems = pgTable("bar_order_items", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  orderId: integer("order_id")
    .references(() => barOrders.id)
    .notNull(),
  itemId: integer("item_id")
    .references(() => barItems.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Cross-module activity feed (scoped by `companyId`). */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 32 })
    .references(() => companies.id)
    .notNull(),
  type: notificationEntityEnum("type").notNull(),
  action: notificationActionEnum("action").notNull(),
  referenceId: integer("reference_id").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Fine-grained access per user × company × module.
 * Admins bypass this table in application logic.
 */
export const userPermissions = pgTable(
  "user_permissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    module: permissionModuleEnum("module").notNull(),
    canView: boolean("can_view").default(true).notNull(),
    canEdit: boolean("can_edit").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("user_permissions_user_company_module").on(
      table.userId,
      table.companyId,
      table.module
    ),
  ]
);

// Contact form submissions
export const contactSubmissions = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  subject: varchar('subject', { length: 100 }).notNull(),
  message: text('message').notNull(),
  
  status: varchar('status', { length: 50 }).default('new'), // new, replied, closed
  createdAt: timestamp('created_at').defaultNow(),
});

// Likes table (many-to-many with users)
export const likes = pgTable('likes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tourId: integer('tour_id').references(() => tours.id),
  accommodationId: integer('accommodation_id').references(() => accommodations.id, { onDelete: "cascade" }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  // Ensure user can only like once per item
  unique("unique_like").on(table.userId, table.tourId, table.accommodationId),
]);

// Testimonials
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 10 }).notNull(),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  tourId: integer('tour_id').references(() => tours.id),
  createdAt: timestamp('created_at').defaultNow(),
});