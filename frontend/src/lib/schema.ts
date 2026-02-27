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
  unique
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'staff', 'admin']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'completed']);

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
  userId: integer('user_id').references(() => users.id),
  tourId: integer('tour_id').references(() => tours.id),
  status: bookingStatusEnum('status').default('pending'),
  
  // Trip details
  travelDate: varchar('travel_date', { length: 50 }).notNull(),
  guests: integer('guests').notNull(),
  accommodation: varchar('accommodation', { length: 50 }).notNull(),
  transport: varchar('transport', { length: 50 }).notNull(),
  specialRequests: text('special_requests'),
  
  // Personal info (redundant for guest bookings)
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  country: varchar('country', { length: 100 }),
  
  // Pricing
  pricePerPerson: integer('price_per_person'),
  totalPrice: integer('total_price'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
  accommodationId: integer('accommodation_id').references(() => accommodations.id),
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