"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { imageSrc } from "@/lib/shop-images";
import type { CartLine, ProductRecord, ShopRecord } from "@/lib/shop-db";

const money = (value: number) => `KSh ${value.toLocaleString("en-KE")}`;

function ProductMedia({ product, onOpen }: { product: ProductRecord; onOpen: () => void }) {
  const images = product.images.length > 0 ? product.images : [product.image];
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const dragged = useRef(false);

  function step(delta: number) {
    setIndex((current) => (current + delta + images.length) % images.length);
  }

  return (
    <div className="product-image-wrap">
      <button type="button" className="product-hover-gallery hover-gallery" aria-label={`View ${product.name}`} onClick={onOpen}>
        {images.map((item, itemIndex) => (
          <img key={`${item}-${itemIndex}`} src={imageSrc(item)} alt={itemIndex === 0 ? product.name : ""} />
        ))}
      </button>
      <div
        className="product-slides"
        onPointerDown={(event) => {
          startX.current = event.clientX;
          dragged.current = false;
        }}
        onPointerUp={(event) => {
          if (startX.current == null) return;
          const delta = event.clientX - startX.current;
          startX.current = null;
          if (Math.abs(delta) < 40) return;
          dragged.current = true;
          step(delta < 0 ? 1 : -1);
        }}
      >
        <div className="slide-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((item, itemIndex) => (
            <button
              key={`${item}-${itemIndex}`}
              type="button"
              className="slide-frame"
              aria-label={`View ${product.name}`}
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                onOpen();
              }}
            >
              <img src={imageSrc(item)} alt={itemIndex === 0 ? product.name : ""} />
            </button>
          ))}
        </div>
        {images.length > 1 ? (
          <>
            <button type="button" className="slide-arrow prev" aria-label="Previous image" onClick={() => step(-1)}>
              <ChevronLeft size={22} strokeWidth={1.5} />
            </button>
            <button type="button" className="slide-arrow next" aria-label="Next image" onClick={() => step(1)}>
              <ChevronRight size={22} strokeWidth={1.5} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ProductPhotos({ product }: { product: ProductRecord }) {
  const [index, setIndex] = useState(0);
  const images = product.images.length > 0 ? product.images : [product.image];
  const current = images[Math.min(index, images.length - 1)];
  return (
    <div className="quick-modal-image">
      <img className="product-image" src={imageSrc(current)} alt={product.name} />
      {images.length > 1 ? (
        <div className="quick-thumbs">
          {images.map((item, itemIndex) => (
            <button key={item} type="button" className={itemIndex === index ? "active" : ""} aria-label={`Photo ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)}>
              <img src={imageSrc(item)} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Mark({ name, className }: { name: string; className: string }) {
  const [before, after] = name.split(/\s*&\s*/);
  if (!after) {
    return (
      <a className={className} href="#top">
        {name}
      </a>
    );
  }
  return (
    <a className={className} href="#top" aria-label={`${name} home`}>
      {before.toLowerCase()} <span>&</span> {after.toLowerCase()}
      <span className="wordmark-dot">.</span>
    </a>
  );
}

export function Storefront({ shop, products }: { shop: ShopRecord; products: ProductRecord[] }) {
  const categories = useMemo(
    () => ["All pieces", ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );
  const [category, setCategory] = useState("All pieces");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState<ProductRecord | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const visibleProducts = products.filter(
    (item) =>
      (category === "All pieces" || item.category === category) &&
      item.name.toLowerCase().includes(query.toLowerCase())
  );
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/shop/cart")
      .then((response) => response.json())
      .then((data: { items?: CartLine[] }) => setCart(data.items ?? []))
      .catch(() => setNotice("The bag could not be loaded."));
  }, []);

  async function changeCart(productId: number, quantity: number, method: "POST" | "PATCH") {
    const response = await fetch("/api/shop/cart", {
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
    setDrawer(true);
    setCheckout(false);
    setOrderNumber("");
  }

  async function place(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/shop/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        address: data.get("address"),
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
  }

  return (
    <main className="storefront">
      <div className="announcement">
        <div className="announcement-track">
          <span>{shop.announcement}</span>
          <span aria-hidden="true">{shop.announcement}</span>
        </div>
      </div>
      <header className="site-header">
        <div className={scrolled ? "header-bar is-scrolled" : "header-bar"}>
          <button className="mobile-menu" aria-label="Open menu" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>
            <span />
            <span />
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#shop">Shop</a>
            <a href="#story">Our story</a>
            <a href="#journal">The journal</a>
            <a href="/shop/manage">Catalog</a>
          </nav>
          <Mark name={shop.name} className="wordmark" />
          <div className="header-actions">
            <button className="icon-button search-toggle" aria-label="Search products" onClick={() => setSearchOpen((open) => !open)}>
              <Search size={19} strokeWidth={1.5} />
            </button>
            <button className="bag-button" aria-label={`Shopping bag, ${cartCount} items`} onClick={() => { setDrawer(true); setCheckout(false); setOrderNumber(""); }}>
              <span>Bag</span>
              <span className="bag-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> THE EVERYDAY, ELEVATED</p>
          <h1>Made for<br />the way <em>you</em><br />move.</h1>
          <p className="hero-description">Thoughtful pieces, made with feeling. For all your ordinary days and everything that makes them yours.</p>
          <a className="dark-button" href="#shop">Find your thing <ArrowRight size={16} /></a>
          <div className="hero-note"><span className="note-mark">✳</span><span>Designed with care.<br />Made to be lived in.</span></div>
        </div>
 
          <img className="hero-flyer" src="/cap.png" alt="Cap" />
          <img className="hero-flyer" src="/denim.png" alt="Denim jacket" />
          <img className="hero-flyer" src="/trouser.png" alt="Trousers" />
     
        <div className="hero-bottom">
          <span>{shop.city.toUpperCase()}</span>
          <span>01 — {String(products.length).padStart(2, "0")}</span>
          <a href="#shop">SCROLL TO DISCOVER <ArrowDown size={13} /></a>
        </div>
      </section>
      <section className="ticker" aria-label="Our values">
        <div>GOOD THINGS, MADE SLOW <span>✳</span> WEAR IT YOUR WAY <span>✳</span> A LITTLE MORE YOU <span>✳</span> GOOD THINGS, MADE SLOW <span>✳</span> WEAR IT YOUR WAY <span>✳</span></div>
      </section>
      <section className="shop-section" id="shop">
        <div className="section-heading">
          <div><p className="eyebrow">A GOOD PLACE TO START</p><h2>Pieces to <em>keep.</em></h2></div>
          <a className="text-link" href="/shop/manage">Edit catalog <ArrowUpRight size={16} /></a>
        </div>
        {notice ? <p className="form-error">{notice}</p> : null}
        <div className="shop-toolbar">
          <div className="category-tabs" role="group" aria-label="Filter products">
            {categories.map((item) => (
              <button key={item} className={category === item ? "category active" : "category"} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
          {searchOpen ? (
            <label className="search-field">
              <span className="sr-only">Search by product name</span>
              <Search size={16} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your thing…" />
              <button aria-label="Close search" onClick={() => { setSearchOpen(false); setQuery(""); }}><X size={15} /></button>
            </label>
          ) : null}
          <span className="product-count">{String(visibleProducts.length).padStart(2, "0")} pieces</span>
        </div>
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-visual">
                <ProductMedia product={product} onOpen={() => setSelected(product)} />
                {product.tag ? <span className="product-tag">{product.tag}</span> : null}
                <span className="quick-view">Quick view <ArrowUpRight size={14} /></span>
              </div>
              <div className="product-meta">
                <button className="product-name" onClick={() => setSelected(product)}>{product.name}</button>
                <span className="product-price">{money(product.price)}</span>
                <p>{product.category}</p>
              </div>
              <button className="add-link" onClick={() => add(product)}>Add to bag <Plus size={14} /></button>
            </article>
          ))}
        </div>
        {visibleProducts.length === 0 ? <p className="no-results">No pieces found. Try another search.</p> : null}
      </section>
      <section className="story-section" id="story">
        <div className="story-image">
          <iframe
            className="story-video"
            src="https://www.youtube.com/embed/fyXMuWq2D48?autoplay=1&mute=1&loop=1&playlist=fyXMuWq2D48&playsinline=1&rel=0&modestbranding=1"
            title="Our story"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="story-copy">
          <p className="eyebrow">A NOTE FROM US</p>
          <h2>Clothes with<br />a little <em>more</em><br />feeling.</h2>
          <p>We believe getting dressed should feel like coming home to yourself. {shop.name} is a love letter to the little things: the first coffee, the long way home, the outfit that just gets you.</p>
          <a href={shop.instagram} target="_blank" rel="noreferrer" className="text-link">A little more about us <ArrowUpRight size={16} /></a>
          <span className="story-scribble">with love, always</span>
        </div>
      </section>
      <section className="newsletter" id="journal">
        <div><p className="eyebrow">LETTERS</p><h2>A good thing<br />in your <em>inbox.</em></h2></div>
        <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); setNotice("subscribed"); }}>
          <label htmlFor="newsletter-email">Occasional notes, new things, and little joys.</label>
          <div className="email-entry">
            <input id="newsletter-email" type="email" required placeholder="Your email address" />
            <button aria-label="Subscribe">{notice === "subscribed" ? <Check size={18} /> : <ArrowRight size={18} />}</button>
          </div>
        </form>
      </section>
      <footer className="site-footer">
        <Mark name={shop.name} className="footer-logo" />
        <span className="footer-note">Made with care in {shop.city}.</span>
        <div className="footer-links">
          <a href={shop.instagram} target="_blank" rel="noreferrer"><Instagram size={17} /> Instagram</a>
          <a href="#shop">Shop all</a>
          <a href={`mailto:${shop.email}`}>Say hello <ArrowUpRight size={13} /></a>
        </div>
        <span className="copyright">© {new Date().getFullYear()} {shop.name.toUpperCase()}</span>
      </footer>
      {(drawer || selected) && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDrawer(false); setSelected(null); } }}>
          {selected ? (
            <section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-title">
              <button className="close-button" aria-label="Close product details" onClick={() => setSelected(null)}><X /></button>
              <ProductPhotos key={selected.id} product={selected} />
              <div className="quick-modal-copy">
                <p className="eyebrow">{selected.category}</p>
                <h2 id="quick-title">{selected.name}</h2>
                <p className="quick-price">{money(selected.price)}</p>
                <p className="quick-description">{selected.description}</p>
                <div className="size-select"><span>One thoughtful size</span><ChevronDown size={15} /></div>
                <button className="dark-button full-button" onClick={() => add(selected)}>Add to bag <ArrowRight size={16} /></button>
                <p className="shipping-note">{shop.deliveryNote}</p>
              </div>
            </section>
          ) : null}
          {drawer ? (
            <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
              <div className="drawer-header">
                <div>
                  <p className="eyebrow">YOUR LITTLE FINDS</p>
                  <h2 id="cart-title">{orderNumber ? "It’s a start." : checkout ? "Your details." : "Your bag."}</h2>
                </div>
                <button className="close-button" aria-label="Close bag" onClick={() => { setDrawer(false); setCheckout(false); setOrderNumber(""); }}><X /></button>
              </div>
              {orderNumber ? (
                <div className="confirmation">
                  <span className="confirmation-mark"><Check /></span>
                  <h3>Order {orderNumber}</h3>
                  <p>Saved for {shop.name}. No payment was collected.</p>
                </div>
              ) : checkout ? (
                <form className="checkout-form" onSubmit={place}>
                  {formError ? <p className="form-error">{formError}</p> : null}
                  <label>Full name<input name="name" required placeholder="Your name" /></label>
                  <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
                  <label>Phone number<input name="phone" type="tel" required placeholder="+254" /></label>
                  <label>Delivery address<input name="address" required placeholder="Street, area, city" /></label>
                  <div className="checkout-total"><span>Estimated total</span><strong>{money(subtotal)}</strong></div>
                  <button type="submit" className="dark-button full-button">Place order <ArrowRight size={16} /></button>
                  <button type="button" className="back-link" onClick={() => setCheckout(false)}>Back to your bag</button>
                </form>
              ) : cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBag size={30} strokeWidth={1.25} />
                  <h3>A little room for something good.</h3>
                  <p>Your bag is empty for now.</p>
                </div>
              ) : (
                <>
                  <div className="cart-list">
                    {cart.map(({ product, quantity }) => (
                      <div className="cart-item" key={product.id}>
                        <div className="cart-thumb"><img className="product-image" src={imageSrc(product.image)} alt="" /></div>
                        <div className="cart-item-details">
                          <h3>{product.name}</h3>
                          <span>{money(product.price)}</span>
                          <div className="quantity-control">
                            <button aria-label={`Decrease ${product.name} quantity`} onClick={() => changeCart(product.id, quantity - 1, "PATCH")}><Minus size={13} /></button>
                            <span>{quantity}</span>
                            <button aria-label={`Increase ${product.name} quantity`} onClick={() => changeCart(product.id, quantity + 1, "PATCH")}><Plus size={13} /></button>
                          </div>
                        </div>
                        <button className="remove-item" onClick={() => changeCart(product.id, 0, "PATCH")}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div className="drawer-footer">
                    <div className="subtotal"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                    <p>{shop.deliveryNote}</p>
                    <button className="dark-button full-button" onClick={() => setCheckout(true)}>Continue to checkout <ArrowRight size={16} /></button>
                    <button className="back-link" onClick={async () => { await fetch("/api/shop/cart", { method: "DELETE" }); setCart([]); }}>Clear bag</button>
                  </div>
                </>
              )}
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}
