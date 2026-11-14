"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Instagram, Menu, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { imageSrc } from "@/lib/shop-images";
import type { CartLine, ProductRecord, ShopRecord } from "@/lib/shop-db";

const MEDIA = "/api/brands-ke/media";
const money = (value: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(value);

function photos(product: ProductRecord) {
  return product.images.length > 0 ? product.images : [product.image];
}

function PayMark({ label, className }: { label: string; className: string }) {
  return <span className={className}>{label}</span>;
}

function ProductTile({
  product,
  onOpen,
  onAdd,
}: {
  product: ProductRecord;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const images = photos(product);
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)];

  function step(delta: number) {
    setIndex((item) => (item + delta + images.length) % images.length);
  }

  return (
    <article className="bk-tile">
      <div className="bk-tile-media">
        <button type="button" className="bk-tile-open" onClick={onOpen} aria-label={`View ${product.name}`}>
          <img src={imageSrc(current, MEDIA)} alt={product.name} />
        </button>
        {product.tag ? <span className="bk-tag">{product.tag}</span> : null}
        {images.length > 1 ? (
          <>
            <button type="button" className="bk-tile-arrow prev" aria-label="Previous image" onClick={() => step(-1)}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="bk-tile-arrow next" aria-label="Next image" onClick={() => step(1)}>
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
        <button type="button" className="bk-tile-add" aria-label={`Add ${product.name} to bag`} onClick={onAdd}>
          <ShoppingBag size={18} />
        </button>
      </div>
      <button type="button" className="bk-tile-copy" onClick={onOpen}>
        <span className="bk-tile-category">{product.category}</span>
        <span className="bk-tile-name">{product.name}</span>
        <span className="bk-tile-price">{money(product.price)}</span>
      </button>
    </article>
  );
}

export function BrandsKeStorefront({ shop, products }: { shop: ShopRecord; products: ProductRecord[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products]
  );
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState<ProductRecord | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [stageOpen, setStageOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [fulfillment, setFulfillment] = useState<"" | "collection" | "delivery">("");
  const [orderNumber, setOrderNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const visibleProducts = products.filter(
    (item) => (category === "All" || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase())
  );
  const selectedPhotos = selected ? photos(selected) : [];
  const selectedPhoto = selectedPhotos[Math.min(photoIndex, Math.max(selectedPhotos.length - 1, 0))];
  const touch = useRef<{ x: number; y: number } | null>(null);

  function stepPhoto(delta: number) {
    setPhotoIndex((item) => (item + delta + selectedPhotos.length) % selectedPhotos.length);
  }

  useEffect(() => {
    fetch("/api/brands-ke/cart")
      .then((response) => response.json())
      .then((data: { items?: CartLine[] }) => setCart(data.items ?? []))
      .catch(() => setNotice("The bag could not be loaded."));
  }, []);

  useEffect(() => {
    if (!stageOpen) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
      event.preventDefault();
      if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
        setStageOpen(false);
        return;
      }
      if (selectedPhotos.length > 1) stepPhoto(event.deltaX > 0 ? -1 : 1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [stageOpen, selectedPhotos.length]);

  useEffect(() => {
    if (!drawer && !selected && !menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (stageOpen) {
          setStageOpen(false);
          return;
        }
        setDrawer(false);
        setSelected(null);
        setMenuOpen(false);
      }
      if (!stageOpen || selectedPhotos.length < 2) return;
      if (event.key === "ArrowRight") stepPhoto(1);
      if (event.key === "ArrowLeft") stepPhoto(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer, selected, menuOpen, stageOpen, selectedPhotos.length]);

  function chooseCategory(item: string) {
    setCategory(item);
    setMenuOpen(false);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  async function changeCart(productId: number, quantity: number, method: "POST" | "PATCH") {
    const response = await fetch("/api/brands-ke/cart", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = (await response.json()) as { items?: CartLine[]; error?: string };
    if (!response.ok) {
      setNotice(data.error ?? "Could not update the bag.");
      return;
    }
    setCart(data.items ?? []);
    setNotice("");
  }

  async function add(product: ProductRecord) {
    await changeCart(product.id, 1, "POST");
    setSelected(null);
    setStageOpen(false);
    setMenuOpen(false);
    setDrawer(true);
    setCheckout(false);
    setOrderNumber("");
  }

  function openProduct(product: ProductRecord) {
    setSelected(product);
    setPhotoIndex(0);
    setStageOpen(false);
    setDrawer(false);
  }

  async function place(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const mode = String(data.get("fulfillment") ?? "");
    const address = mode === "collection" ? `Collection, ${shop.city}` : String(data.get("address") ?? "");
    const response = await fetch("/api/brands-ke/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        address,
      }),
    });
    const body = (await response.json()) as { orderNumber?: string; error?: string };
    if (!response.ok || !body.orderNumber) {
      setFormError(body.error ?? "Could not place the order.");
      return;
    }
    setFormError("");
    setOrderNumber(body.orderNumber);
    setCart([]);
    setFulfillment("");
  }

  function closeDrawer() {
    setDrawer(false);
    setCheckout(false);
    setOrderNumber("");
    setFulfillment("");
  }

  return (
    <main className="brands-ke" id="top">
      <div className="bk-announce">
        <span>{shop.announcement}</span>
      </div>
      <header className="bk-nav">
        <div className="bk-nav-bar">
          <button type="button" className="bk-icon" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <Menu size={22} />
          </button>
          <a className="bk-logo" href="#top">{shop.name}</a>
          <div className="bk-nav-actions">
            <button type="button" className="bk-icon" aria-label="Search products" onClick={() => setSearchOpen((open) => !open)}>
              <Search size={20} />
            </button>
            <button type="button" className="bk-icon bk-bag" aria-label={`Shopping bag, ${cartCount} items`} onClick={() => { setMenuOpen(false); setSelected(null); setDrawer(true); setCheckout(false); setOrderNumber(""); }}>
              <ShoppingBag size={20} />
              <span className="bk-badge">{cartCount}</span>
            </button>
          </div>
        </div>
        {searchOpen ? (
          <form className="bk-search" onSubmit={(event) => { event.preventDefault(); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" aria-label="Search by product name" />
            <button type="submit" aria-label="Search"><Search size={18} /></button>
          </form>
        ) : null}
      </header>
      <div className={menuOpen ? "bk-menu-layer is-open" : "bk-menu-layer"}>
        <button type="button" className="bk-scrim" aria-label="Close menu" tabIndex={menuOpen ? 0 : -1} inert={menuOpen ? undefined : true} onClick={() => setMenuOpen(false)} />
        <nav className="bk-menu" aria-label="Categories" aria-hidden={!menuOpen} inert={menuOpen ? undefined : true}>
          <button type="button" className="bk-menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={22} /></button>
          <p className="bk-menu-title">{shop.name}</p>
          {categories.map((item) => (
            <button key={item} type="button" className={category === item ? "is-current" : ""} onClick={() => chooseCategory(item)}>{item}</button>
          ))}
          <div className="bk-menu-foot">
            <p>{shop.deliveryNote}</p>
            <p>{shop.city}</p>
          </div>
        </nav>
      </div>
      <section className="bk-hero">
        <div className="bk-hero-copy">
          <h1>{shop.name}</h1>
          <p>{shop.announcement}</p>
          <a href="#shop">Shop</a>
        </div>
      </section>
      <section className="bk-shop" id="shop">
        <div className="bk-shop-head">
          <h2>Shop</h2>
          <span>{String(visibleProducts.length).padStart(2, "0")} pieces</span>
        </div>
        {notice ? <p className="bk-error">{notice}</p> : null}
        <div className="bk-categories" role="group" aria-label="Filter products">
          {categories.map((item) => (
            <button key={item} type="button" className={category === item ? "is-current" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        {visibleProducts.length === 0 ? <p className="bk-empty">No pieces found.</p> : null}
        <div className="bk-grid">
          {visibleProducts.map((product) => (
            <ProductTile key={product.id} product={product} onOpen={() => openProduct(product)} onAdd={() => add(product)} />
          ))}
        </div>
      </section>
      <section className="bk-newsletter" id="notes">
        <h2>{shop.name} Newsletter</h2>
        <p>Occasional notes on new arrivals.</p>
        {subscribed ? <p className="bk-newsletter-done">You&apos;re on the list.</p> : (
          <form onSubmit={(event) => { event.preventDefault(); setSubscribed(true); }}>
            <input type="email" required placeholder="Your email address" aria-label="Email address" />
            <button type="submit">Sign up</button>
          </form>
        )}
      </section>
      <footer className="bk-footer">
        <div className="bk-footer-grid p-4">
          <div>
            <h3>{shop.name}</h3>
            <p>{shop.announcement}</p>
            <p>Made in {shop.city}.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              {categories.map((item) => (
                <li key={item}><button type="button" onClick={() => chooseCategory(item)}>{item}</button></li>
              ))}
            </ul>
          </div>
          <div className="bk-social mb-4">
            <h4>Follow</h4>
            <a href={shop.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
            <a href={`mailto:${shop.email}`}>Say hello</a>
          </div>
        </div>
        <p className="bk-copy">© {new Date().getFullYear()} {shop.name}. {shop.deliveryNote}</p>
      </footer>
      {selected ? (
        <div className="bk-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="bk-quick" role="dialog" aria-modal="true" aria-labelledby="bk-quick-title">
            <button type="button" className="bk-close" aria-label="Close product" onClick={() => setSelected(null)}><X /></button>
            <div className="bk-quick-photo">
              {selectedPhoto ? (
                <button type="button" className="bk-quick-open" aria-label={`View ${selected.name} full screen`} onClick={() => setStageOpen(true)}>
                  <img src={imageSrc(selectedPhoto, MEDIA)} alt={selected.name} />
                </button>
              ) : null}
              {selectedPhotos.length > 1 ? (
                <div className="bk-quick-nav">
                  <button type="button" aria-label="Previous photo" onClick={() => stepPhoto(-1)}><ChevronLeft /></button>
                  <button type="button" aria-label="Next photo" onClick={() => stepPhoto(1)}><ChevronRight /></button>
                </div>
              ) : null}
            </div>
            <div className="bk-quick-copy">
              <div><p>{selected.category}</p></div>
              <div><h2 id="bk-quick-title">{selected.name}</h2></div>
              <div><p className="bk-quick-price">{money(selected.price)}</p></div>
              <div><p>{selected.description}</p></div>
              <div><button type="button" className="bk-primary" onClick={() => add(selected)}>Add to bag <ArrowMini /></button></div>
              <div><p className="bk-note">{shop.deliveryNote}</p></div>
            </div>
          </section>
        </div>
      ) : null}
      {drawer ? (
        <div className="bk-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
          <aside className="bk-drawer" role="dialog" aria-modal="true" aria-labelledby="bk-cart-title">
            <div className="bk-drawer-head">
              <h2 id="bk-cart-title">{orderNumber ? "Order placed" : checkout ? "Your details" : "Your bag"}</h2>
              <button type="button" className="bk-close" aria-label="Close bag" onClick={closeDrawer}><X /></button>
            </div>
            {orderNumber ? (
              <div className="bk-confirm">
                <Check />
                <h3>Order {orderNumber}</h3>
                <p>Thank you for shopping with us. Order receipt has been sent to your email.</p>
              </div>
            ) : checkout ? (
              <form className="bk-checkout" onSubmit={place}>
                {formError ? <p className="bk-error">{formError}</p> : null}
                <label>Full name<input name="name" required placeholder="Your name" /></label>
                <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
                <label>Phone number<input name="phone" type="tel" required placeholder="+254" /></label>
                <fieldset>
                  <legend>How should we get this to you?</legend>
                  <label className="bk-choice">
                    <input type="radio" name="fulfillment" value="collection" required checked={fulfillment === "collection"} onChange={() => setFulfillment("collection")} />
                    Collection
                  </label>
                  {fulfillment === "collection" ? <p className="bk-note">{shop.city}</p> : null}
                  <label className="bk-choice">
                    <input type="radio" name="fulfillment" value="delivery" required checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} />
                    Delivery
                  </label>
                  {fulfillment === "delivery" ? (
                    <label>Delivery address<input name="address" required placeholder="Street, area, city" /></label>
                  ) : null}
                </fieldset>
                {fulfillment === "collection" ? <input type="hidden" name="address" value={`Collection, ${shop.city}`} /> : null}
                <div className="bk-total"><span>Estimated total</span><strong>{money(subtotal)}</strong></div>
                <button type="submit" className="bk-primary">Place order</button>
                <div className="bk-pay">
                  <button type="submit" aria-label="Place order with M-Pesa"><PayMark label="M-PESA" className="bk-mpesa" /></button>
                  <button type="submit" aria-label="Place order with card"><PayMark label="Card" className="bk-card" /></button>
                  <button type="submit" aria-label="Place order with PayPal"><PayMark label="PayPal" className="bk-paypal" /></button>
                  <button type="submit" aria-label="Place order with Airtel Money"><PayMark label="Airtel Money" className="bk-airtel" /></button>
                </div>
                <button type="button" className="bk-text" onClick={() => { setCheckout(false); setFulfillment(""); }}>Back to your bag</button>
              </form>
            ) : cart.length === 0 ? (
              <div className="bk-confirm">
                <ShoppingBag />
                <h3>Your bag is empty.</h3>
                <a href="/brands_ke#shop" onClick={closeDrawer}>Return to shop</a>
              </div>
            ) : (
              <>
                <div className="bk-lines">
                  {cart.map(({ product, quantity }) => (
                    <div className="bk-line" key={product.id}>
                      <img src={imageSrc(product.image, MEDIA)} alt="" />
                      <div>
                        <h3>{product.name}</h3>
                        <span>{money(product.price)}</span>
                        <div className="bk-qty">
                          <button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => changeCart(product.id, quantity - 1, "PATCH")}><Minus size={14} /></button>
                          <span>{quantity}</span>
                          <button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => changeCart(product.id, quantity + 1, "PATCH")}><Plus size={14} /></button>
                        </div>
                      </div>
                      <button type="button" className="bk-remove" onClick={() => changeCart(product.id, 0, "PATCH")}>Remove</button>
                    </div>
                  ))}
                </div>
                <div className="bk-drawer-foot">
                  <div className="bk-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                  <p className="bk-note">{shop.deliveryNote}</p>
                  <button type="button" className="bk-primary" onClick={() => setCheckout(true)}>Continue to checkout</button>
                  <div className="bk-bag-actions">
                    <a href="/brands_ke#shop" onClick={closeDrawer}>Return to shop</a>
                    <button type="button" className="bk-text" onClick={async () => { await fetch("/api/brands-ke/cart", { method: "DELETE" }); setCart([]); }}>Clear bag</button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}
      {stageOpen && selected && selectedPhoto
        ? createPortal(
            <div
              className="bk-photo-stage"
              role="dialog"
              aria-modal="true"
              aria-label={`${selected.name} photo`}
              onClick={() => setStageOpen(false)}
              onTouchStart={(event) => {
                const point = event.changedTouches[0];
                touch.current = { x: point.clientX, y: point.clientY };
              }}
              onTouchEnd={(event) => {
                if (!touch.current) return;
                const point = event.changedTouches[0];
                const dx = point.clientX - touch.current.x;
                const dy = point.clientY - touch.current.y;
                touch.current = null;
                if (Math.abs(dy) > 36 && Math.abs(dy) >= Math.abs(dx)) {
                  setStageOpen(false);
                  return;
                }
                if (selectedPhotos.length > 1 && Math.abs(dx) > 36) stepPhoto(dx < 0 ? 1 : -1);
              }}
            >
              <button type="button" className="bk-photo-close" aria-label="Close photo" onClick={() => setStageOpen(false)}><X /></button>
              {selectedPhotos.length > 1 ? (
                <>
                  <button type="button" className="bk-photo-arrow prev" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); stepPhoto(-1); }}><ChevronLeft size={32} strokeWidth={1.25} /></button>
                  <button type="button" className="bk-photo-arrow next" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); stepPhoto(1); }}><ChevronRight size={32} strokeWidth={1.25} /></button>
                </>
              ) : null}
              <img className="bk-photo-stage-image" src={imageSrc(selectedPhoto, MEDIA)} alt={selected.name} onClick={(event) => event.stopPropagation()} />
            </div>,
            document.body
          )
        : null}
    </main>
  );
}

function ArrowMini() {
  return <ChevronRight size={16} />;
}
