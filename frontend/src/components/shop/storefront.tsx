"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function MpesaButton() {
  return (
    <svg viewBox="0 0 168 44" role="img" aria-hidden="true">
      <rect width="168" height="44" rx="8" fill="#00A94F" />
      <text x="84" y="28" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700" letterSpacing="1.2">M-PESA</text>
    </svg>
  );
}

function CardButton() {
  return (
    <svg viewBox="0 0 168 44" role="img" aria-hidden="true">
      <rect width="168" height="44" rx="8" fill="#1B1F3B" />
      <rect x="16" y="13" width="30" height="18" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" />
      <rect x="16" y="19" width="30" height="3.5" fill="#fff" />
      <text x="58" y="28" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" fontWeight="700">Card</text>
    </svg>
  );
}

function PaypalButton() {
  return (
    <svg viewBox="0 0 168 44" role="img" aria-hidden="true">
      <rect width="168" height="44" rx="8" fill="#FFC439" />
      <text x="84" y="28" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700">
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009CDE">Pal</tspan>
      </text>
    </svg>
  );
}

function AirtelButton() {
  return (
    <svg viewBox="0 0 168 44" role="img" aria-hidden="true">
      <rect width="168" height="44" rx="8" fill="#fff" stroke="#ED1C24" strokeWidth="1.5" />
      <text x="84" y="27" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700">
        <tspan fill="#ED1C24" fontSize="16" fontStyle="italic">airtel</tspan>
        <tspan fill="#ED1C24" fontSize="12" fontStyle="normal"> money</tspan>
      </text>
    </svg>
  );
}

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
  const [open, setOpen] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const images = product.images.length > 0 ? product.images : [product.image];
  const current = images[Math.min(index, images.length - 1)];

  function step(delta: number) {
    setIndex((item) => (item + delta + images.length) % images.length);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight" && images.length > 1) step(1);
      if (event.key === "ArrowLeft" && images.length > 1) step(-1);
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
      event.preventDefault();
      if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
        setOpen(false);
        return;
      }
      if (images.length > 1) step(event.deltaX > 0 ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [open, images.length]);

  const stage = open
    ? createPortal(
        <div
          className="photo-stage"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} photo`}
          onClick={() => setOpen(false)}
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
              setOpen(false);
              return;
            }
            if (images.length > 1 && Math.abs(dx) > 36) step(dx < 0 ? 1 : -1);
          }}
        >
          <button type="button" className="photo-stage-close" aria-label="Close photo" onClick={() => setOpen(false)}>
            <X />
          </button>
          {images.length > 1 ? (
            <>
              <button type="button" className="photo-arrow prev" aria-label="Previous photo" onClick={(event) => { event.stopPropagation(); step(-1); }}>
                <ChevronLeft size={32} strokeWidth={1.25} />
              </button>
              <button type="button" className="photo-arrow next" aria-label="Next photo" onClick={(event) => { event.stopPropagation(); step(1); }}>
                <ChevronRight size={32} strokeWidth={1.25} />
              </button>
            </>
          ) : null}
          <img className="photo-stage-image" src={imageSrc(current)} alt={product.name} onClick={(event) => event.stopPropagation()} />
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button type="button" className="quick-photo" aria-label={`View ${product.name} full screen`} onClick={() => setOpen(true)}>
        <img className="product-image" src={imageSrc(current)} alt="" />
      </button>
      {images.length > 1 ? (
        <div className="quick-thumbs">
          {images.map((item, itemIndex) => (
            <button key={`${item}-${itemIndex}`} type="button" className={itemIndex === index ? "active" : ""} aria-label={`Photo ${itemIndex + 1}`} onClick={() => setIndex(itemIndex)}>
              <img src={imageSrc(item)} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      {stage}
    </>
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
  const [fulfillment, setFulfillment] = useState<"" | "collection" | "delivery">("");
  const [orderNumber, setOrderNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const chromeRef = useRef<HTMLDivElement>(null);
  const [chromeHeight, setChromeHeight] = useState(0);
  const modalOpen = Boolean(drawer || selected);
  const menuCategories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
    [products]
  );
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
    const node = chromeRef.current;
    if (!node) return;
    const measure = () => {
      const height = Array.from(node.children).reduce((sum, child) => sum + (child as HTMLElement).getBoundingClientRect().height, 0);
      setChromeHeight(Math.ceil(height));
    };
    measure();
    const observer = new ResizeObserver(measure);
    Array.from(node.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || chromeRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  function chooseCategory(item: string) {
    setCategory(item);
    setMenuOpen(false);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

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
    const mode = String(data.get("fulfillment") ?? "");
    const address = mode === "collection" ? `Collection, ${shop.city}` : String(data.get("address") ?? "");
    const response = await fetch("/api/shop/orders", {
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

  return (
    <main className={modalOpen ? "storefront modal-open" : "storefront"} style={{ "--chrome": `${chromeHeight}px` } as React.CSSProperties}>
      <div className={modalOpen ? "shop-chrome is-pinned" : "shop-chrome"} ref={chromeRef}>
      <div className="announcement">
        <div className="announcement-track">
          <span>{shop.announcement}</span>
          <span aria-hidden="true">{shop.announcement}</span>
        </div>
      </div>
      <header className="site-header">
        <div className={scrolled || modalOpen ? "header-bar is-scrolled" : "header-bar"}>
          <button
            className={menuOpen ? "mobile-menu is-open" : "mobile-menu"}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="category-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              type="button"
              className={menuOpen ? "nav-shop is-open" : "nav-shop"}
              aria-expanded={menuOpen}
              aria-controls="category-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              Shop <ChevronDown size={16} />
            </button>
            <a href="#story">Our story</a>
            <a href="#journal">The journal</a>
            {/* <a href="/shop/manage">Catalog</a> */}
          </nav>
          <div id="category-menu" className={menuOpen ? "category-menu is-open" : "category-menu"} aria-hidden={!menuOpen}>
            <button type="button" className={category === "All pieces" ? "is-current" : ""} style={{ "--i": 0 } as React.CSSProperties} onClick={() => chooseCategory("All pieces")}>All pieces</button>
            {menuCategories.map((item, index) => (
              <button key={item} type="button" className={category === item ? "is-current" : ""} style={{ "--i": index + 1 } as React.CSSProperties} onClick={() => chooseCategory(item)}>{item}</button>
            ))}
          </div>
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
      </div>
      {modalOpen ? <div className="chrome-spacer" style={{ height: chromeHeight }} /> : null}
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> THE EVERYDAY, ELEVATED</p>
          <h1>Made for<br />the way <em>you</em><br />move.</h1>
          <p className="hero-description">Thoughtful pieces, made with feeling. For all your ordinary days and everything that makes them yours.</p>
          <a className="dark-button" href="#shop">Find your thing <ArrowRight size={16} /></a>
          <div className="hero-note"><span className="note-mark">✳</span><span>Designed with care.<br />Made to be lived in.</span></div>
        </div>
        <div className="hero-stage" aria-hidden="true">
          <img className="hero-flyer" src="/cap.png" alt="" />
          <img className="hero-flyer" src="/denim.png" alt="" />
          <img className="hero-flyer" src="/trouser.png" alt="" />
        </div>
        <div className="hero-bottom">
          {/* <span>{shop.city.toUpperCase()}</span> */}
          {/* <span>01 — {String(products.length).padStart(2, "0")}</span> */}
          <a href="#shop">SCROLL TO DISCOVER <ArrowDown size={13} /></a>
        </div>
      </section>
      <section className="ticker" aria-label="Our values">
        <div>GOOD THINGS, MADE SLOW <span>✳</span> WEAR IT YOUR WAY <span>✳</span> A LITTLE MORE YOU <span>✳</span> GOOD THINGS, MADE SLOW <span>✳</span> WEAR IT YOUR WAY <span>✳</span></div>
      </section>
      <section className="shop-section" id="shop">
        <div className="section-heading">
          <div><p className="eyebrow">A GOOD PLACE TO START</p><h2>Pieces to <em>keep.</em></h2></div>
          {/* <a className="text-link" href="/shop/manage">Edit catalog <ArrowUpRight size={16} /></a> */}
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
            <button
              className="close-button"
              aria-label="Close product details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
          
            {/* Image side – keeps ProductPhotos neatly constrained */}
            <div className="quick-modal-image">
              <ProductPhotos key={selected.id} product={selected} />
            </div>
          
            {/* Text / actions side */}
            <div className="quick-modal-copy">
              <p className="eyebrow">{selected.category}</p>
              <h2 id="quick-title">{selected.name}</h2>
              <p className="quick-price">{money(selected.price)}</p>
              <p className="quick-description">{selected.description}</p>
              <div className="size-select">
                <span>One thoughtful size</span>
                <ChevronDown size={15} />
              </div>
              <button
                className="dark-button full-button mb-8"
                onClick={() => add(selected)}
              >
                Add to bag <ArrowRight size={16} />
              </button>
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
                  <p>Thank you for shopping with us. Order receipt has been sent to your email.</p>
                </div>
              ) : checkout ? (
                <form className="checkout-form" onSubmit={place}>
                  {formError ? <p className="form-error">{formError}</p> : null}
                  <label>Full name<input name="name" required placeholder="Your name" /></label>
                  <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
                  <label>Phone number<input name="phone" type="tel" required placeholder="+254" /></label>
                  <fieldset className="fulfillment">
                    <legend>How should we get this to you?</legend>
                    <div className="fulfillment-choice">
                      <label className="fulfillment-option mt-2">
                        <input type="radio" name="fulfillment" value="collection" required checked={fulfillment === "collection"} onChange={() => setFulfillment("collection")} />
                        Collection
                      </label>
                      <div className={fulfillment === "collection" ? "fulfillment-panel is-open" : "fulfillment-panel"}>
                        <div className="fulfillment-panel-inner">
                          <p className="collection-city">{shop.city}</p>
                        </div>
                      </div>
                    </div>
                    <div className="fulfillment-choice">
                      <label className="fulfillment-option">
                        <input type="radio" name="fulfillment" value="delivery" required checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} />
                        Delivery
                      </label>
                      <div className={fulfillment === "delivery" ? "fulfillment-panel is-open" : "fulfillment-panel"}>
                        <div className="fulfillment-panel-inner">
                          <label className="delivery-field">
                            Delivery address
                            <input name="address" required={fulfillment === "delivery"} disabled={fulfillment !== "delivery"} placeholder="Street, area, city" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  {fulfillment === "collection" ? <input type="hidden" name="address" value={`Collection, ${shop.city}`} /> : null}
                  <div className="checkout-total"><span>Estimated total</span><strong>{money(subtotal)}</strong></div>
                  <button type="submit" className="dark-button full-button">Place order <ArrowRight size={16} /></button>
                  <div className="pay-methods">
                    <button type="submit" className="pay-button" aria-label="Place order with M-Pesa"><MpesaButton /></button>
                    <button type="submit" className="pay-button" aria-label="Place order with card"><CardButton /></button>
                    <button type="submit" className="pay-button" aria-label="Place order with PayPal"><PaypalButton /></button>
                    <button type="submit" className="pay-button pb-2" aria-label="Place order with Airtel Money"><AirtelButton /></button>
                  </div>
                  <button type="button" className="back-link" onClick={() => { setCheckout(false); setFulfillment(""); }}>Back to your bag</button>
                </form>
              ) : cart.length === 0 ? (
                <>
                  <div className="empty-cart">
                    <ShoppingBag size={30} strokeWidth={1.25} />
                    <h3>A little room for something good.</h3>
                    <p>Your bag is empty for now.</p>
                  </div>
                  <a className="return-shop" href="/shop#shop" onClick={() => setDrawer(false)}>Return to shop</a>
                </>
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
                    <div className="bag-actions">
                      <a className="return-shop" href="/shop#shop" onClick={() => setDrawer(false)}>Return to shop</a>
                      <button className="back-link" onClick={async () => { await fetch("/api/shop/cart", { method: "DELETE" }); setCart([]); }}>Clear bag</button>
                    </div>
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
