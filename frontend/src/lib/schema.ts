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
  uniqueIndex,
  date,
  index,
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

/** Per-company staff role (separate from global `users.role`). */
export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "sales",
  "operations",
  "guide",
  "finance",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "invited",
  "suspended",
]);

/** Tenant companies (IDs align with dashboard `CompanyId`). */
/** Safari booking component kinds (Sprint 4). */
export const bookingComponentTypeEnum = pgEnum("booking_component_type", [
  "accommodation",
  "transport",
  "park_fee",
  "activity",
  "transfer",
  "other",
]);

/** Partner vs company-owned lodging operator (Sprint 6). */
export const accommodationProviderTypeEnum = pgEnum("accommodation_provider_type", [
  "partner",
  "tenant",
]);

export const vehicleOwnershipEnum = pgEnum("vehicle_ownership", ["owned", "outsourced"]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "assigned",
  "maintenance",
  "inactive",
]);

export const guideTypeEnum = pgEnum("guide_type", ["employee", "contractor"]);

export const guideStatusEnum = pgEnum("guide_status", ["active", "inactive"]);

export const companies = pgTable('companies', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  /** Public image URL or same-origin path used on letterheads. */
  logo: varchar('logo', { length: 1024 }),
  /** Default profit markup for cost-stack / component pricing. */
  markupPercent: integer("markup_percent").default(20).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * A user may belong to multiple companies. Role/status are tenant-scoped.
 * Global `users.role` remains during the migration and still gates dashboard login.
 */
export const companyMemberships = pgTable(
  "company_memberships",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    role: membershipRoleEnum("role").notNull(),
    status: membershipStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("company_memberships_user_company").on(table.userId, table.companyId),
  ]
);

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

/**
 * Company-scoped CRM customer (Sprint 3).
 * Safari bookings and hotel stays keep a name/email snapshot; `customer_id` is the optional live profile.
 */
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    userId: integer("user_id").references(() => users.id),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    nationality: varchar("nationality", { length: 100 }),
    country: varchar("country", { length: 100 }),
    notes: text("notes"),
    preferences: text("preferences"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("customers_company_email").on(table.companyId, table.email),
    index("customers_company_created_idx").on(table.companyId, table.createdAt),
  ]
);

// Tours table
export const tours = pgTable('tours', {
  id: serial('id').primaryKey(),
  companyId: varchar('company_id', { length: 32 })
    .references(() => companies.id)
    .notNull()
    .default('aha'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  shortTitle: varchar('short_title', { length: 255 }).notNull(),
  destination: varchar('destination', { length: 255 }).notNull(),
  countries: jsonb('countries').$type<string[]>().notNull(),
  duration: varchar('duration', { length: 100 }).notNull(),
  days: integer('days').notNull(),
  /** Adult USD rate (canonical). */
  price: integer('price').notNull(),
  /** Child USD rate; null means the adult rate. */
  childPrice: integer("child_price"),
  /** Infant USD rate; null means complimentary (0). */
  infantPrice: integer("infant_price"),
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

/**
 * Shared tourism destinations (no company_id). Used by AHA, other tenants, and AI.
 * Unique kebab-case slug globally.
 */
export const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    country: varchar("country", { length: 100 }).notNull(),
    region: varchar("region", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    image: varchar("image", { length: 1024 }),
    seoTitle: varchar("seo_title", { length: 255 }),
    metaDescription: varchar("meta_description", { length: 320 }),
    canonicalPath: varchar("canonical_path", { length: 255 }),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("destinations_slug").on(table.slug),
    index("destinations_country_idx").on(table.country),
  ]
);

/**
 * Parks, activities, and sights under a destination. Shared reference data.
 */
export const attractions = pgTable(
  "attractions",
  {
    id: serial("id").primaryKey(),
    destinationId: integer("destination_id")
      .references(() => destinations.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    duration: varchar("duration", { length: 100 }),
    bestTime: varchar("best_time", { length: 255 }),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("attractions_destination_idx").on(table.destinationId)]
);

/**
 * Operator that owns or manages lodging. Partner = external lodge; tenant = company-owned.
 */
export const accommodationProviders = pgTable("accommodation_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: jsonb("contact").$type<{
    email?: string;
    phone?: string;
    website?: string;
  }>(),
  type: accommodationProviderTypeEnum("type").notNull(),
  /** Set when type = tenant (the owning company). */
  companyId: varchar("company_id", { length: 32 }).references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Physical lodging property. Tenant-owned rows carry companyId; partner rows
 * stay AHA-managed until they become a shared Enzi resource (DD-009).
 */
export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id")
      .references(() => accommodationProviders.id)
      .notNull(),
    companyId: varchar("company_id", { length: 32 }).references(() => companies.id),
    destinationId: integer("destination_id").references(() => destinations.id),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    country: varchar("country", { length: 50 }).notNull(),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
    description: text("description"),
    /** Optional detailed management fields (DD-002): check-in, stars, website, etc. */
    details: jsonb("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("properties_company_slug").on(table.companyId, table.slug),
    index("properties_company_idx").on(table.companyId),
    index("properties_provider_idx").on(table.providerId),
  ]
);

// Accommodations table (public catalog listing; links to tourism property)
export const accommodations = pgTable(
  "accommodations",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull()
      .default("aha"),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    country: varchar("country", { length: 50 }).notNull(),
    image: jsonb("image").$type<string[]>().notNull(),
    description: text("description").notNull(),
    amenities: jsonb("amenities").$type<string[]>().notNull(),
    priceFrom: integer("price_from").notNull(),
    badges: jsonb("badges").$type<string[]>().notNull(),
    recommended: boolean("recommended").default(false),
    type: varchar("type", { length: 50 }).notNull(),
    likes: integer("likes").default(0),
    providerId: integer("provider_id").references(() => accommodationProviders.id),
    propertyId: integer("property_id").references(() => properties.id),
    destinationId: integer("destination_id").references(() => destinations.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique("accommodations_company_slug").on(table.companyId, table.slug)]
);

// Bookings table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  companyId: varchar('company_id', { length: 32 })
    .references(() => companies.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  customerId: integer("customer_id").references(() => customers.id),
  tourId: integer('tour_id').references(() => tours.id),
  status: bookingStatusEnum('status').default('pending'),
  
  // Trip details
  travelDate: varchar('travel_date', { length: 50 }).notNull(),
  guests: integer('guests').notNull(),
  adults: integer('adults').notNull().default(1),
  children: integer('children').notNull().default(0),
  infants: integer('infants').notNull().default(0),
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
  /** How the selling price was produced: package | cost_stack | manual. */
  pricingSource: varchar("pricing_source", { length: 32 }).default("manual"),
  /**
   * Cost-stack input + quote snapshot when pricingSource is cost_stack.
   * Shape: { markupPercent, accommodation?, transport?, parkFees?, transfers?, activities?, other?, quote? }
   */
  costStack: jsonb("cost_stack").$type<{
    markupPercent: number;
    accommodation?: number | null;
    transport?: number | null;
    parkFees?: number | null;
    transfers?: number | null;
    activities?: number | null;
    other?: number | null;
    quote?: {
      currency: string;
      costTotal: number;
      markupPercent: number;
      markupAmount: number;
      baseSellingPrice: number;
      sellingPrice: number;
      roundedUpBy: number;
      lines: { kind: string; amount: number; label?: string }[];
    };
  }>(),
  /** Product kind: predefined_safari | customized_safari | accommodation_only | airport_transfer | vehicle_hire. */
  bookingKind: varchar("booking_kind", { length: 32 }).default("customized_safari"),
  /** AHA booking voucher “To (Company / Supplier)” line. */
  voucherToCompany: varchar("voucher_to_company", { length: 255 }),
  /** Latest booking_versions.version for this live row. */
  currentVersion: integer("current_version").default(1).notNull(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Priced lines on a safari booking. Booking total = sum(cost) + company/booking markup.
 * `config` is flexible JSON (nights, property name, park, etc.).
 */
export const bookingComponents = pgTable("booking_components", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),
  type: bookingComponentTypeEnum("type").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
  cost: integer("cost").notNull().default(0),
  sequence: integer("sequence").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Immutable snapshots of a booking + its components. The live `bookings` row
 * stays the payment/invoice target; each staff modify writes a new version.
 */
export const bookingVersions = pgTable("booking_versions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),
  version: integer("version").notNull(),
  isCurrent: boolean("is_current").default(false).notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  sellingPrice: integer("selling_price"),
  previousSellingPrice: integer("previous_selling_price"),
  currency: varchar("currency", { length: 10 }),
  changedByUserId: integer("changed_by_user_id").references(() => users.id),
  changeSummary: text("change_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
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
    /** Provider adapter id: manual | cash | bank | card | m-pesa. */
    provider: varchar("provider", { length: 32 }).default("manual").notNull(),
    /** Client-supplied key; unique per company when set. */
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    notes: text("notes"),
    recordedAt: timestamp("recorded_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [uniqueIndex("payments_company_idempotency").on(table.companyId, table.idempotencyKey)]
);

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

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "partial",
  "paid",
  "void",
]);

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    referenceType: financialReferenceTypeEnum("reference_type").notNull(),
    referenceId: integer("reference_id").notNull(),
    invoiceNumber: varchar("invoice_number", { length: 32 }).notNull(),
    status: invoiceStatusEnum("status").default("issued").notNull(),
    currency: varchar("currency", { length: 10 }).default("KES").notNull(),
    subtotal: integer("subtotal").notNull().default(0),
    total: integer("total").notNull().default(0),
    amountPaid: integer("amount_paid").notNull().default(0),
    balance: integer("balance").notNull().default(0),
    notes: text("notes"),
    issuedAt: timestamp("issued_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("invoices_company_number").on(table.companyId, table.invoiceNumber),
    unique("invoices_company_source").on(table.companyId, table.referenceType, table.referenceId),
  ]
);

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmount: integer("unit_amount").notNull().default(0),
  lineTotal: integer("line_total").notNull().default(0),
  sequence: integer("sequence").notNull().default(0),
});

export const emailDeliveryStatusEnum = pgEnum("email_delivery_status", [
  "queued",
  "sent",
  "failed",
  "skipped",
]);

export const emailDeliveries = pgTable(
  "email_deliveries",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    template: varchar("template", { length: 64 }).notNull(),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 512 }).notNull(),
    status: emailDeliveryStatusEnum("status").default("queued").notNull(),
    providerMessageId: varchar("provider_message_id", { length: 128 }),
    error: text("error"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow(),
    sentAt: timestamp("sent_at"),
  },
  (table) => [
    index("email_deliveries_company_created_idx").on(table.companyId, table.createdAt),
    index("email_deliveries_company_template_idx").on(table.companyId, table.template),
  ]
);

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
  propertyId: integer("property_id").references(() => properties.id),
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
  propertyId: integer("property_id").references(() => properties.id),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }),
  floor: varchar("floor", { length: 20 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Occupancy STO rates (EWC 2026 full-board). room_type_id null = company occupancy default. */
export const roomTypeRates = pgTable(
  "room_type_rates",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    roomTypeId: integer("room_type_id").references(() => roomTypes.id),
    occupancy: varchar("occupancy", { length: 32 }).notNull(),
    season: varchar("season", { length: 16 }).notNull(),
    guestCategory: varchar("guest_category", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    amount: integer("amount").notNull(),
    year: integer("year").notNull().default(2026),
    mealBasis: varchar("meal_basis", { length: 32 }).notNull().default("full_board"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("room_type_rates_company_card").on(
      table.companyId,
      table.occupancy,
      table.season,
      table.guestCategory,
      table.year
    ),
    index("room_type_rates_company_idx").on(table.companyId),
  ]
);

/** Partner used when a tenant outsources a vehicle. */
export const vehicleProviders = pgTable("vehicle_providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contact: jsonb("contact").$type<{
    email?: string;
    phone?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    ownership: vehicleOwnershipEnum("ownership").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    capacity: integer("capacity").notNull(),
    registration: varchar("registration", { length: 32 }).notNull(),
    status: vehicleStatusEnum("status").default("available").notNull(),
    providerId: integer("provider_id").references(() => vehicleProviders.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("vehicles_company_registration").on(table.companyId, table.registration),
    index("vehicles_company_status_idx").on(table.companyId, table.status),
  ]
);

export const guides = pgTable(
  "guides",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: guideTypeEnum("type").notNull(),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    certifications: jsonb("certifications").$type<string[]>(),
    status: guideStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("guides_company_status_idx").on(table.companyId, table.status)]
);

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
  customerId: integer("customer_id").references(() => customers.id),
  primaryGuestName: varchar("primary_guest_name", { length: 255 }),
  primaryGuestPhone: varchar("primary_guest_phone", { length: 50 }),
  primaryGuestEmail: varchar("primary_guest_email", { length: 255 }),
  additionalOccupants: jsonb("additional_occupants")
    .$type<Array<{ name: string; email: string }>>()
    .notNull()
    .default([]),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  infants: integer("infants").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  amountPaid: integer("amount_paid").notNull().default(0),
  paymentMethod: varchar("payment_method", { length: 64 }),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  /** rate = nights × occupancy STO rate (EWC) or room type baseRate; manual = staff-entered total. */
  pricingSource: varchar("pricing_source", { length: 32 }).default("manual"),
  /** Resident/citizen (KES) vs non-resident (USD) STO card. */
  guestCategory: varchar("guest_category", { length: 32 }).default("resident"),
  /** Currency of total_amount / amount_paid. */
  currency: varchar("currency", { length: 10 }).default("KES").notNull(),
  /** EWC: external operator bringing guests. */
  externalCompany: varchar("external_company", { length: 255 }),
  /** EWC: board package. */
  mealType: hotelMealTypeEnum("meal_type"),
  status: hotelReservationStatusEnum("reservation_status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Rooms allocated on one hotel stay. hotel_bookings.room_id remains the primary room. */
export const hotelBookingRooms = pgTable(
  "hotel_booking_rooms",
  {
    id: serial("id").primaryKey(),
    hotelBookingId: integer("hotel_booking_id")
      .references(() => hotelBookings.id, { onDelete: "cascade" })
      .notNull(),
    roomId: integer("room_id")
      .references(() => rooms.id)
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    nightlyRate: integer("nightly_rate"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("hotel_booking_rooms_stay_room").on(table.hotelBookingId, table.roomId),
    index("hotel_booking_rooms_stay_idx").on(table.hotelBookingId),
  ]
);

export const hotelBookingGuests = pgTable("hotel_booking_guests", {
  id: serial("id").primaryKey(),
  hotelBookingId: integer("hotel_booking_id")
    .references(() => hotelBookings.id)
    .notNull(),
  customerId: integer("customer_id").references(() => customers.id),
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
export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull()
      .default("aha"),
    userId: integer("user_id").references(() => users.id),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    subject: varchar("subject", { length: 100 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 50 }).default("new"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("contact_submissions_company_created_idx").on(table.companyId, table.createdAt),
    index("contact_submissions_company_status_idx").on(table.companyId, table.status),
  ]
);

// Likes table (many-to-many with users)
export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull()
      .default("aha"),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    tourId: integer("tour_id").references(() => tours.id),
    accommodationId: integer("accommodation_id").references(() => accommodations.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("unique_like").on(table.userId, table.tourId, table.accommodationId),
    index("likes_company_id_idx").on(table.companyId),
  ]
);

// Testimonials
export const testimonials = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull()
      .default("aha"),
    userId: integer("user_id").references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    country: varchar("country", { length: 255 }).notNull(),
    avatar: varchar("avatar", { length: 10 }).notNull(),
    rating: integer("rating").notNull(),
    text: text("text").notNull(),
    tourId: integer("tour_id").references(() => tours.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("testimonials_company_created_idx").on(table.companyId, table.createdAt)]
);

/**
 * Tenant park-entry rates used by the itinerary pricing engine (Sprint 7).
 * Amounts are whole USD (canonical), converted at quote time.
 */
export const parkFeeRates = pgTable(
  "park_fee_rates",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    destinationId: integer("destination_id")
      .references(() => destinations.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    adultUsd: integer("adult_usd").notNull(),
    childUsd: integer("child_usd").notNull(),
    infantUsd: integer("infant_usd").notNull().default(0),
    adultUsdLow: integer("adult_usd_low"),
    childUsdLow: integer("child_usd_low"),
    adultKes: integer("adult_kes"),
    childKes: integer("child_kes"),
    infantKes: integer("infant_kes").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("park_fee_rates_company_destination").on(table.companyId, table.destinationId),
    index("park_fee_rates_company_idx").on(table.companyId),
  ]
);

/** Tenant-priced activities the itinerary engine may select. */
export const activityOfferings = pgTable(
  "activity_offerings",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    destinationId: integer("destination_id")
      .references(() => destinations.id)
      .notNull(),
    attractionId: integer("attraction_id").references(() => attractions.id),
    name: varchar("name", { length: 255 }).notNull(),
    adultUsd: integer("adult_usd").notNull().default(0),
    childUsd: integer("child_usd").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("activity_offerings_company_destination_idx").on(table.companyId, table.destinationId)]
);

export const transferOptions = pgTable(
  "transfer_options",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fromLabel: varchar("from_label", { length: 255 }).notNull(),
    toLabel: varchar("to_label", { length: 255 }).notNull(),
    destinationId: integer("destination_id").references(() => destinations.id),
    amountUsd: integer("amount_usd").notNull(),
    vehicleType: varchar("vehicle_type", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("transfer_options_company_idx").on(table.companyId)]
);

export const transportOptions = pgTable(
  "transport_options",
  {
    id: serial("id").primaryKey(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    vehicleType: varchar("vehicle_type", { length: 50 }).notNull(),
    dailyRateUsd: integer("daily_rate_usd").notNull(),
    capacity: integer("capacity").notNull().default(6),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("transport_options_company_idx").on(table.companyId)]
);

/**
 * AI-assisted safari itinerary. Tenant-scoped. Public access is via `public_token`, not serial id.
 * Live plan + quote sit on this row; history lives in itinerary_versions.
 */
export const itineraries = pgTable(
  "itineraries",
  {
    id: serial("id").primaryKey(),
    publicToken: varchar("public_token", { length: 64 }).notNull(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    customerId: integer("customer_id").references(() => customers.id),
    userId: integer("user_id").references(() => users.id),
    bookingId: integer("booking_id").references(() => bookings.id),
    status: varchar("status", { length: 32 }).notNull().default("draft"),
    country: varchar("country", { length: 100 }),
    startDate: varchar("start_date", { length: 50 }),
    endDate: varchar("end_date", { length: 50 }),
    durationDays: integer("duration_days"),
    adults: integer("adults").notNull().default(1),
    children: integer("children").notNull().default(0),
    infants: integer("infants").notNull().default(0),
    childAges: jsonb("child_ages").$type<number[]>().notNull().default([]),
    requirements: jsonb("requirements").$type<Record<string, unknown>>().notNull().default({}),
    title: varchar("title", { length: 255 }),
    summary: text("summary"),
    plan: jsonb("plan").$type<Record<string, unknown>>(),
    quote: jsonb("quote").$type<Record<string, unknown>>(),
    currency: varchar("currency", { length: 10 }).default("USD").notNull(),
    costTotal: integer("cost_total"),
    markupPercent: integer("markup_percent"),
    sellingPrice: integer("selling_price"),
    currentVersion: integer("current_version").default(1).notNull(),
    guestEmail: varchar("guest_email", { length: 255 }),
    guestName: varchar("guest_name", { length: 255 }),
    guestPhone: varchar("guest_phone", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("itineraries_public_token").on(table.publicToken),
    index("itineraries_company_created_idx").on(table.companyId, table.createdAt),
    index("itineraries_company_status_idx").on(table.companyId, table.status),
  ]
);

export const itineraryComponents = pgTable(
  "itinerary_components",
  {
    id: serial("id").primaryKey(),
    itineraryId: integer("itinerary_id")
      .references(() => itineraries.id, { onDelete: "cascade" })
      .notNull(),
    type: bookingComponentTypeEnum("type").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
    cost: integer("cost").notNull().default(0),
    sequence: integer("sequence").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("itinerary_components_itinerary_idx").on(table.itineraryId, table.sequence)]
);

export const itineraryVersions = pgTable(
  "itinerary_versions",
  {
    id: serial("id").primaryKey(),
    itineraryId: integer("itinerary_id")
      .references(() => itineraries.id, { onDelete: "cascade" })
      .notNull(),
    version: integer("version").notNull(),
    isCurrent: boolean("is_current").default(false).notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    sellingPrice: integer("selling_price"),
    previousSellingPrice: integer("previous_selling_price"),
    currency: varchar("currency", { length: 10 }),
    changedByUserId: integer("changed_by_user_id").references(() => users.id),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique("itinerary_versions_itinerary_version").on(table.itineraryId, table.version)]
);

export const itineraryGenerationLogs = pgTable(
  "itinerary_generation_logs",
  {
    id: serial("id").primaryKey(),
    itineraryId: integer("itinerary_id")
      .references(() => itineraries.id, { onDelete: "cascade" })
      .notNull(),
    companyId: varchar("company_id", { length: 32 })
      .references(() => companies.id)
      .notNull(),
    requestId: varchar("request_id", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    model: varchar("model", { length: 128 }),
    status: varchar("status", { length: 32 }).notNull(),
    validationStatus: varchar("validation_status", { length: 32 }),
    failureReason: text("failure_reason"),
    durationMs: integer("duration_ms"),
    retryCount: integer("retry_count").notNull().default(0),
    estimatedCostUsd: real("estimated_cost_usd"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("itinerary_generation_logs_itinerary_idx").on(table.itineraryId, table.createdAt),
    index("itinerary_generation_logs_company_idx").on(table.companyId, table.createdAt),
  ]
);