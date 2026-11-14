import { Pool, type PoolClient } from "pg";

const SHOP_ID = "demo";
export const BRANDS_KE_SHOP_ID = "brands_ke";

export type ShopRecord = {
  id: string;
  name: string;
  announcement: string;
  city: string;
  email: string;
  instagram: string;
  heroImage: string;
  deliveryNote: string;
};

export type ProductRecord = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  images: string[];
  tag: string | null;
  description: string;
};

export type CartLine = { product: ProductRecord; quantity: number };

type GlobalShop = typeof globalThis & { __shopPool?: Pool; __shopReady?: Promise<void> };

function connectionString(): string {
  const raw = process.env.NEON_DATABASE_URL?.trim();
  if (!raw) throw new Error("NEON_DATABASE_URL is not set");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("channel_binding");
  return url.toString();
}

function pool(): Pool {
  const g = globalThis as GlobalShop;
  if (!g.__shopPool) {
    g.__shopPool = new Pool({
      connectionString: connectionString(),
      max: 1,
      ssl: { rejectUnauthorized: false },
    });
  }
  return g.__shopPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS shops (
  id varchar(32) PRIMARY KEY,
  name varchar(120) NOT NULL,
  announcement text NOT NULL,
  city varchar(120) NOT NULL,
  email varchar(255) NOT NULL,
  instagram varchar(512) NOT NULL,
  hero_image varchar(512) NOT NULL,
  delivery_note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  shop_id varchar(32) NOT NULL REFERENCES shops(id),
  name varchar(160) NOT NULL,
  category varchar(80) NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  image varchar(512) NOT NULL,
  tag varchar(40),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
UPDATE products SET images = ARRAY[image] WHERE cardinality(images) = 0 AND image <> '';
CREATE INDEX IF NOT EXISTS products_shop_idx ON products (shop_id);
CREATE TABLE IF NOT EXISTS carts (
  id varchar(64) PRIMARY KEY,
  shop_id varchar(32) NOT NULL REFERENCES shops(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cart_items (
  cart_id varchar(64) NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  shop_id varchar(32) NOT NULL REFERENCES shops(id),
  order_number varchar(40) NOT NULL,
  customer_name varchar(160) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(40) NOT NULL,
  address text NOT NULL,
  subtotal integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, order_number)
);
CREATE INDEX IF NOT EXISTS orders_shop_created_idx ON orders (shop_id, created_at DESC);
CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer,
  name varchar(160) NOT NULL,
  unit_price integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);
`;

function mapShop(row: Record<string, unknown>): ShopRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    announcement: String(row.announcement),
    city: String(row.city),
    email: String(row.email),
    instagram: String(row.instagram),
    heroImage: String(row.hero_image),
    deliveryNote: String(row.delivery_note),
  };
}

function imageList(row: Record<string, unknown>): string[] {
  if (Array.isArray(row.images) && row.images.length > 0) return row.images.map(String);
  return [String(row.image)];
}

function mapProduct(row: Record<string, unknown>): ProductRecord {
  const images = imageList(row);
  return {
    id: Number(row.id),
    name: String(row.name),
    category: String(row.category),
    price: Number(row.price),
    image: images[0],
    images,
    tag: row.tag == null ? null : String(row.tag),
    description: String(row.description),
  };
}

async function ready(): Promise<void> {
  const g = globalThis as GlobalShop;
  if (!g.__shopReady) {
    g.__shopReady = (async () => {
      const client = await pool().connect();
      try {
        await client.query(SCHEMA);
        await client.query(
          `INSERT INTO shops (id, name, announcement, city, email, instagram, hero_image, delivery_note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            SHOP_ID,
            "Lad & Lass",
            "A little something for your everyday — complimentary delivery on orders over KSh 10,000",
            "Nairobi, Kenya",
            "hello@ladandlass.co.ke",
            "https://www.instagram.com/lad_n_lass_cloth",
            "/images/hero-fashion.png",
            "Complimentary delivery over KSh 10,000",
          ]
        );
        await client.query(
          `INSERT INTO shops (id, name, announcement, city, email, instagram, hero_image, delivery_note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            BRANDS_KE_SHOP_ID,
            "Brands KE",
            "Discover the best of global style curated for Kenya.",
            "Nairobi, Kenya",
            "hello@brandske.co.ke",
            "https://instagram.com",
            "",
            "Delivery across Kenya",
          ]
        );
        const count = await client.query("SELECT COUNT(*)::int AS n FROM products WHERE shop_id = $1", [SHOP_ID]);
        if (Number(count.rows[0].n) === 0) {
          const seed = [
            ["The Sunday Set", "Clothing", 6800, "/images/product-set2.png", "BESTSELLER", "A little ease, a lot of intention. Our signature two-piece set is cut for a relaxed fit and made to move with you."],
            ["Malaika Midi", "Dresses", 7400, "/images/product-dress.png", "JUST IN", "Meet the dress you will reach for on repeat. A softly draped silhouette, a flattering waist, and thoughtful details."],
            ["Woven Story Jacket", "Clothing", 8900, "/images/product-set.png", null, "Handwoven texture meets an easy everyday shape. Each piece celebrates the beauty of craft and the hands behind it."],
            ["The Nia Crossbody", "Accessories", 4200, "/images/product-bag.png", "MADE BY HAND", "A forever kind of bag. Carefully woven raffia, warm leather details, and just enough room for your everyday essentials."],
          ];
          for (const row of seed) {
            await client.query(
              `INSERT INTO products (shop_id, name, category, price, image, tag, description)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [SHOP_ID, ...row]
            );
          }
        }
      } finally {
        client.release();
      }
    })().catch((error) => {
      g.__shopReady = undefined;
      throw error;
    });
  }
  await g.__shopReady;
}

export async function getCatalog(shopId = SHOP_ID): Promise<{ shop: ShopRecord; products: ProductRecord[] }> {
  await ready();
  const shop = await pool().query("SELECT * FROM shops WHERE id = $1", [shopId]);
  const products = await pool().query(
    "SELECT * FROM products WHERE shop_id = $1 ORDER BY id",
    [shopId]
  );
  if (!shop.rows[0]) throw new Error("Shop catalog is unavailable");
  return { shop: mapShop(shop.rows[0]), products: products.rows.map(mapProduct) };
}

export async function createProduct(input: Omit<ProductRecord, "id">, shopId = SHOP_ID): Promise<ProductRecord> {
  await ready();
  const result = await pool().query(
    `INSERT INTO products (shop_id, name, category, price, image, images, tag, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [shopId, input.name, input.category, input.price, input.images[0], input.images, input.tag, input.description]
  );
  return mapProduct(result.rows[0]);
}

export async function updateProduct(
  id: number,
  input: Omit<ProductRecord, "id">,
  shopId = SHOP_ID
): Promise<{ product: ProductRecord; removed: string[] } | null> {
  await ready();
  const current = await pool().query("SELECT image, images FROM products WHERE id = $1 AND shop_id = $2", [id, shopId]);
  if (!current.rows[0]) return null;
  const previous = imageList(current.rows[0]);
  const result = await pool().query(
    `UPDATE products
     SET name = $2, category = $3, price = $4, image = $5, images = $6, tag = $7, description = $8
     WHERE id = $1 AND shop_id = $9
     RETURNING *`,
    [id, input.name, input.category, input.price, input.images[0], input.images, input.tag, input.description, shopId]
  );
  const removed = previous.filter((key) => !input.images.includes(key));
  return { product: mapProduct(result.rows[0]), removed };
}

export async function deleteProduct(id: number, shopId = SHOP_ID): Promise<string[] | null> {
  await ready();
  const current = await pool().query("SELECT image, images FROM products WHERE id = $1 AND shop_id = $2", [id, shopId]);
  if (!current.rows[0]) return null;
  await pool().query("DELETE FROM products WHERE id = $1 AND shop_id = $2", [id, shopId]);
  return imageList(current.rows[0]);
}

async function ensureCart(client: PoolClient, cartId: string, shopId: string) {
  await client.query(
    "INSERT INTO carts (id, shop_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
    [cartId, shopId]
  );
}

export async function getCart(cartId: string, shopId = SHOP_ID): Promise<CartLine[]> {
  await ready();
  const result = await pool().query(
    `SELECT p.*, c.quantity
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     JOIN carts cart ON cart.id = c.cart_id
     WHERE c.cart_id = $1 AND cart.shop_id = $2 AND p.shop_id = $2
     ORDER BY p.id`,
    [cartId, shopId]
  );
  return result.rows.map((row) => ({
    product: mapProduct(row),
    quantity: Number(row.quantity),
  }));
}

export async function addToCart(cartId: string, productId: number, quantity = 1, shopId = SHOP_ID): Promise<CartLine[]> {
  await ready();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    await ensureCart(client, cartId, shopId);
    const product = await client.query("SELECT id FROM products WHERE id = $1 AND shop_id = $2", [productId, shopId]);
    if (!product.rows[0]) throw new Error("Product not found");
    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
      [cartId, productId, quantity]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return getCart(cartId, shopId);
}

export async function setQuantity(cartId: string, productId: number, quantity: number, shopId = SHOP_ID): Promise<CartLine[]> {
  await ready();
  if (quantity <= 0) {
    await pool().query(
      `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2
       AND EXISTS (SELECT 1 FROM carts WHERE id = $1 AND shop_id = $3)`,
      [cartId, productId, shopId]
    );
  } else {
    await pool().query(
      `UPDATE cart_items SET quantity = $3
       WHERE cart_id = $1 AND product_id = $2
         AND EXISTS (SELECT 1 FROM carts WHERE id = $1 AND shop_id = $4)`,
      [cartId, productId, quantity, shopId]
    );
  }
  return getCart(cartId, shopId);
}

export async function clearCart(cartId: string, shopId = SHOP_ID): Promise<void> {
  await ready();
  await pool().query(
    `DELETE FROM cart_items WHERE cart_id = $1
     AND EXISTS (SELECT 1 FROM carts WHERE id = $1 AND shop_id = $2)`,
    [cartId, shopId]
  );
}

export async function placeOrder(
  cartId: string,
  customer: { name: string; email: string; phone: string; address: string },
  shopId = SHOP_ID
): Promise<{ orderNumber: string; subtotal: number; items: CartLine[] }> {
  await ready();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const lines = await client.query(
      `SELECT p.*, c.quantity
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       JOIN carts cart ON cart.id = c.cart_id
       WHERE c.cart_id = $1 AND cart.shop_id = $2
       FOR UPDATE`,
      [cartId, shopId]
    );
    if (lines.rows.length === 0) throw new Error("Cart is empty");
    const items = lines.rows.map((row) => ({ product: mapProduct(row), quantity: Number(row.quantity) }));
    const subtotal = items.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const orderNumber = `${shopId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const order = await client.query(
      `INSERT INTO orders (shop_id, order_number, customer_name, email, phone, address, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [shopId, orderNumber, customer.name, customer.email, customer.phone, customer.address, subtotal]
    );
    for (const line of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.rows[0].id, line.product.id, line.product.name, line.product.price, line.quantity]
      );
    }
    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    await client.query("COMMIT");
    return { orderNumber, subtotal, items };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
