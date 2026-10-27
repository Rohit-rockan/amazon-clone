// Amazon-style shopping app: hash router + localStorage state, no dependencies.
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $("#view");

  // ---------- State ----------
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("amz_" + key);
        return v ? JSON.parse(v) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem("amz_" + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
  };

  const state = {
    cart: store.get("cart", []),          // [{id, qty, saved}]
    wishlist: store.get("wishlist", []),  // [id]
    orders: store.get("orders", []),
    address: store.get("address", null),
    recent: store.get("recent", []),      // recently viewed ids
  };
  const save = (key) => store.set(key, state[key]);

  // ---------- Helpers ----------
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const inr = (n) => n.toLocaleString("en-IN");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const offPct = (p) => Math.round((1 - p.price / p.mrp) * 100);
  const stars = (r) => "★".repeat(Math.floor(r)) + (r % 1 >= 0.5 ? "⯪" : "") + "☆".repeat(5 - Math.floor(r) - (r % 1 >= 0.5 ? 1 : 0));
  const shortCount = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K" : n);
  const deliveryDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  };
  const tile = (p, cls = "tile") => `<div class="${cls}" style="background:${p.tint}">${p.icon}</div>`;
  const priceHtml = (p) => `<span class="price"><sup>₹</sup>${inr(p.price)}</span>`;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 1800);
  }

  function cartItems() {
    return state.cart.filter((c) => !c.saved).map((c) => ({ ...c, p: byId(c.id) })).filter((c) => c.p);
  }
  function updateBadge() {
    $("#cartCount").textContent = $("#dCartCount").textContent = cartItems().reduce((s, c) => s + c.qty, 0);
  }
  function addToCart(id, qty = 1) {
    const line = state.cart.find((c) => c.id === id);
    if (line) { line.qty = Math.min(10, line.qty + qty); line.saved = false; }
    else state.cart.push({ id, qty, saved: false });
    save("cart");
    updateBadge();
    toast("Added to Cart");
  }
  function toggleWish(id) {
    const i = state.wishlist.indexOf(id);
    if (i >= 0) { state.wishlist.splice(i, 1); toast("Removed from Wish List"); }
    else { state.wishlist.push(id); toast("Added to Wish List"); }
    save("wishlist");
  }

  // ---------- Reusable fragments ----------
  const productRow = (p) => `
    <a class="prow" href="#/product/${p.id}">
      ${tile(p)}
      <div class="info">
        <p class="ptitle">${esc(p.title)}</p>
        <div class="rating-line">${p.rating} <span class="stars">${stars(p.rating)}</span> (${shortCount(p.reviews)})</div>
        <div class="muted">${inr(p.bought)}+ bought in past month</div>
        ${p.deal ? '<span class="badge-deal">Limited time deal</span>' : ""}
        <div>${priceHtml(p)} <span class="mrp">M.R.P: <s>₹${inr(p.mrp)}</s></span> <span class="off">(${offPct(p)}% off)</span></div>
        ${p.prime ? '<span class="prime">prime</span>' : ""}
        <div class="muted">FREE delivery <b>${deliveryDate(p.prime ? 1 : 4)}</b></div>
        <button class="btn btn-yellow btn-sm" data-add="${p.id}">Add to cart</button>
      </div>
    </a>`;

  const miniCard = (p) => `
    <a class="mini" href="#/product/${p.id}">
      ${tile(p)}
      <span class="badge-deal">${offPct(p)}% off</span><span class="deal-text">Deal</span>
      <div>${priceHtml(p).replace("price", "price\" style=\"font-size:17px")}</div>
      <div class="muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.title)}</div>
    </a>`;

  // ---------- Pages ----------
  function homePage() {
    const deals = PRODUCTS.filter((p) => p.deal);
    const recent = state.recent.map(byId).filter(Boolean);
    const quad = (title, items, link) => `
      <section class="section">
        <h2>${title}</h2>
        <div class="quad-grid">
          ${items.map((p) => `<a href="#/product/${p.id}">${tile(p)}${esc(p.brand)} · ${offPct(p)}% off</a>`).join("")}
        </div>
        <a class="see" href="${link}">See all offers</a>
      </section>`;
    const byCat = (c) => PRODUCTS.filter((p) => p.category === c);

    return `
      <div class="chips">
        ${CATEGORIES.map((c) => `<a class="chip" href="#/search?cat=${c.id}"><div class="ci" style="background:${c.tint}">${c.icon}</div>${c.name}</a>`).join("")}
      </div>
      <div class="carousel" id="carousel">
        <div class="slides">
          ${BANNERS.map((b) => `<a class="slide" href="${b.link}" style="background:${b.bg}"><div><h3>${b.title}</h3><p>${b.sub}</p><span class="cta">Shop now ›</span></div><div class="big">${b.icon}</div></a>`).join("")}
        </div>
        <div class="dots">${BANNERS.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
      </div>
      <div class="home-cards first">
        ${quad("Up to 60% off | Mobiles & accessories", byCat("mobiles").slice(0, 4), "#/search?cat=mobiles")}
        ${quad("Revamp your home in style", byCat("home").slice(0, 4), "#/search?cat=home")}
        ${quad("Fashion for every occasion", byCat("fashion").slice(0, 4), "#/search?cat=fashion")}
        ${quad("Appliances for your home | Up to 55% off", byCat("appliances").slice(0, 4), "#/search?cat=appliances")}
      </div>
      ${recent.length ? `
        <section class="section">
          <div class="row-head"><h2>Keep shopping for</h2></div>
          <div class="hscroll">${recent.map(miniCard).join("")}</div>
        </section>` : ""}
      <section class="section">
        <div class="row-head"><h2>Today's Deals</h2><span class="timer" id="dealTimer"></span></div>
        <div class="hscroll">${deals.map(miniCard).join("")}</div>
        <a class="see" href="#/search?deal=1">See all deals</a>
      </section>
      <section class="section">
        <h2>Best Sellers in Electronics</h2>
        <div class="hscroll">${byCat("electronics").map(miniCard).join("")}</div>
      </section>
      <div class="home-cards">
        ${quad("Electronics | Up to 70% off", byCat("electronics").slice(0, 4), "#/search?cat=electronics")}
        ${quad("Beauty & grooming picks", byCat("beauty").slice(0, 4), "#/search?cat=beauty")}
        ${quad("Fitness & sports essentials", byCat("sports").concat(byCat("toys")).slice(0, 4), "#/search?cat=sports")}
        ${quad("Fresh & grocery savings", byCat("grocery").concat(byCat("books")).slice(0, 4), "#/search?cat=grocery")}
      </div>
      <section class="section">
        <h2>Bestselling books</h2>
        <div class="hscroll">${byCat("books").concat(byCat("toys")).map(miniCard).join("")}</div>
      </section>
      <div style="text-align:center;padding:20px" class="muted">You've reached the end · <a class="see" href="#/search">Browse all products</a></div>`;
  }

  function startCarousel() {
    const root = $("#carousel");
    if (!root) return;
    const slides = $(".slides", root), dots = root.querySelectorAll(".dots i");
    let i = 0, x0 = null;
    const go = (n) => {
      i = (n + BANNERS.length) % BANNERS.length;
      slides.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    };
    timers.push(setInterval(() => go(i + 1), 4000));
    root.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    root.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  function startDealTimer() {
    const el = $("#dealTimer");
    if (!el) return;
    const tick = () => {
      const now = new Date(), end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const s = Math.floor((end - now) / 1000);
      const pad = (n) => String(n).padStart(2, "0");
      el.textContent = `Ends in ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    };
    tick();
    timers.push(setInterval(tick, 1000));
  }

  function searchPage(params) {
    const q = (params.get("q") || "").trim().toLowerCase();
    const cat = params.get("cat") || "";
    const deal = params.get("deal") === "1";
    const prime = params.get("prime") === "1";
    const sort = params.get("sort") || "";

    let list = PRODUCTS.filter((p) =>
      (!q || (p.title + " " + p.brand + " " + p.category).toLowerCase().includes(q)) &&
      (!cat || p.category === cat) && (!deal || p.deal) && (!prime || p.prime));
    const sorts = {
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      discount: (a, b) => offPct(b) - offPct(a),
    };
    if (sorts[sort]) list = [...list].sort(sorts[sort]);

    const link = (changes) => {
      const p = new URLSearchParams(params);
      Object.entries(changes).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
      return "#/search?" + p.toString();
    };
    const catName = cat ? CATEGORIES.find((c) => c.id === cat)?.name : "";

    return `
      <div class="search-layout">
      <div class="filters">
        <h3 class="dk-only">Filters</h3>
        <a class="fchip ${prime ? "on" : ""}" href="${link({ prime: prime ? "" : "1" })}"><span class="prime">prime</span></a>
        <a class="fchip ${deal ? "on" : ""}" href="${link({ deal: deal ? "" : "1" })}">Today's Deals</a>
        <select class="fchip" id="sortSel" aria-label="Sort by">
          <option value="">Sort: Featured</option>
          <option value="low" ${sort === "low" ? "selected" : ""}>Price: Low to High</option>
          <option value="high" ${sort === "high" ? "selected" : ""}>Price: High to Low</option>
          <option value="rating" ${sort === "rating" ? "selected" : ""}>Avg. Customer Review</option>
          <option value="discount" ${sort === "discount" ? "selected" : ""}>Discount</option>
        </select>
        <h3 class="dk-only">Category</h3>
        ${CATEGORIES.map((c) => `<a class="fchip ${cat === c.id ? "on" : ""}" href="${link({ cat: cat === c.id ? "" : c.id })}">${c.name}</a>`).join("")}
      </div>
      <div class="results">
      <div class="result-count">${list.length} result${list.length === 1 ? "" : "s"}${q ? ` for <b>"${esc(q)}"</b>` : ""}${catName ? ` in <b>${catName}</b>` : ""}</div>
      ${list.length ? `<div class="plist">${list.map(productRow).join("")}</div>` :
        `<div class="empty section"><div class="big">🔎</div><h2>No results found</h2><p class="muted">Try checking your spelling or use more general terms.</p><a class="btn btn-yellow" href="#/">Continue shopping</a></div>`}
      </div>
      </div>`;
  }

  function productPage(id) {
    const p = byId(id);
    if (!p) return `<div class="empty section"><div class="big">🤷</div><h2>Product not found</h2><a class="btn btn-yellow" href="#/">Go home</a></div>`;
    state.recent = [id, ...state.recent.filter((r) => r !== id)].slice(0, 8);
    save("recent");
    const cat = CATEGORIES.find((c) => c.id === p.category);
    const similar = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id);
    const wished = state.wishlist.includes(p.id);
    const reviews = [
      ["Ankit S.", 5, "Excellent product", "Value for money. Delivered before time and packaging was good."],
      ["Priya M.", 4, "Good quality", "Works as described. Would recommend to friends and family."],
      ["Rahul K.", Math.max(2, Math.round(p.rating) - 1), "Decent", "Okay for the price, a couple of minor issues but overall fine."],
    ];

    return `
      <div class="crumbs dk-only"><a href="#/search?cat=${cat.id}">${cat.name}</a> › <a href="#/search?q=${encodeURIComponent(p.brand)}">${esc(p.brand)}</a></div>
      <div class="pd-layout">
      <section class="section pd-head">
        <a class="pd-brand" href="#/search?q=${encodeURIComponent(p.brand)}">Visit the ${esc(p.brand)} Store</a>
        <div class="rating-line pd-rating">${p.rating} <span class="stars">${stars(p.rating)}</span> ${inr(p.reviews)} ratings</div>
        <p class="pd-title">${esc(p.title)}</p>
      </section>
      <section class="section pd-gallery">
        <div class="pd-hero" style="background:${p.tint}">${p.icon}
          <button class="wish" id="wishBtn" aria-label="Wish list">${wished ? "❤️" : "🤍"}</button>
        </div>
      </section>
      <section class="section pd-pricebox">
        ${p.deal ? '<span class="badge-deal">Limited time deal</span>' : ""}
        <div class="pd-price"><span class="off">-${offPct(p)}%</span>${priceHtml(p)}</div>
        <div class="mrp">M.R.P.: <s>₹${inr(p.mrp)}</s></div>
        <div class="muted">Inclusive of all taxes</div>
        ${p.prime ? '<span class="prime">prime</span>' : ""}
      </section>
      <section class="section pd-offers">
        <h2 style="font-size:16px">Offers</h2>
        <div class="offers">
          <div class="offer"><b>Bank Offer</b>Upto ₹1,500 discount on select Credit Cards</div>
          <div class="offer"><b>Cashback</b>Upto ₹${inr(Math.round(p.price * 0.05))} cashback as Amazon Pay Balance</div>
          <div class="offer"><b>No Cost EMI</b>Upto ₹${inr(Math.round(p.price * 0.03))} EMI interest savings</div>
        </div>
      </section>
      <section class="section pd-buy">
        <div class="dk-only">${priceHtml(p)}</div>
        <div>FREE delivery <b>${deliveryDate(p.prime ? 1 : 4)}</b>.</div>
        <div class="muted">Or fastest delivery <b>Tomorrow</b>. Order within <span class="green">5 hrs 20 mins</span>.</div>
        <div class="muted">📍 ${esc($("#deliverText").textContent)}</div>
        <h3 class="green" style="margin:12px 0 8px">In stock</h3>
        <div style="display:flex;align-items:center;gap:10px">Quantity:
          <div class="qty"><button id="qMinus">−</button><span id="qVal">1</span><button id="qPlus">+</button></div>
        </div>
        <button class="btn btn-yellow" id="addBtn">Add to Cart</button>
        <button class="btn btn-orange" id="buyBtn">Buy Now</button>
        <div class="muted">🔒 Secure transaction · Ships from Amazon · Sold by ${esc(p.brand)} Retail</div>
      </section>
      <section class="section pd-about">
        <h2>About this item</h2>
        <ul class="bullets">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </section>
      <section class="section pd-details">
        <h2>Product details</h2>
        <table class="specs">
          <tr><td>Brand</td><td>${esc(p.brand)}</td></tr>
          <tr><td>Category</td><td>${cat.name}</td></tr>
          <tr><td>Customer rating</td><td>${p.rating} out of 5</td></tr>
          <tr><td>ASIN</td><td>B0${(p.id + "X7Q9KZ").toUpperCase().slice(0, 8)}</td></tr>
        </table>
      </section>
      </div>
      ${similar.length ? `<section class="section"><h2>Products related to this item</h2><div class="hscroll">${similar.map(miniCard).join("")}</div></section>` : ""}
      <section class="section">
        <h2>Customer reviews</h2>
        <div class="rating-line" style="font-size:16px;color:var(--ink)"><span class="stars" style="font-size:18px">${stars(p.rating)}</span> ${p.rating} out of 5</div>
        <div class="muted">${inr(p.reviews)} global ratings</div>
        ${reviews.map(([n, r, t, b]) => `<div class="review"><b>👤 ${n}</b><div><span class="stars">${stars(r)}</span> <b>${t}</b></div><div class="muted green">Verified Purchase</div><div>${b}</div></div>`).join("")}
      </section>`;
  }

  function bindProductPage(id) {
    let qty = 1;
    const qv = $("#qVal");
    if (!qv) return;
    $("#qMinus").onclick = () => (qv.textContent = qty = Math.max(1, qty - 1));
    $("#qPlus").onclick = () => (qv.textContent = qty = Math.min(10, qty + 1));
    $("#addBtn").onclick = () => addToCart(id, qty);
    $("#buyBtn").onclick = () => { addToCart(id, qty); location.hash = "#/checkout"; };
    $("#wishBtn").onclick = (e) => {
      toggleWish(id);
      e.currentTarget.textContent = state.wishlist.includes(id) ? "❤️" : "🤍";
    };
  }

  function totals() {
    const items = cartItems();
    const count = items.reduce((s, c) => s + c.qty, 0);
    const sub = items.reduce((s, c) => s + c.qty * c.p.price, 0);
    const mrp = items.reduce((s, c) => s + c.qty * c.p.mrp, 0);
    const delivery = sub === 0 || sub >= 499 ? 0 : 40;
    return { items, count, sub, mrp, delivery, total: sub + delivery };
  }

  function cartPage() {
    const t = totals();
    const saved = state.cart.filter((c) => c.saved).map((c) => ({ ...c, p: byId(c.id) })).filter((c) => c.p);
    if (!t.items.length && !saved.length) {
      return `<div class="empty section"><div class="big">🛒</div><h2>Your Amazon Cart is empty</h2>
        <p class="muted">Shop today's deals</p><a class="btn btn-yellow" href="#/search?deal=1">Shop Today's Deals</a>
        <a class="btn btn-plain" href="#/">Continue shopping</a></div>`;
    }
    const line = (c, isSaved) => `
      <div class="citem">
        <a href="#/product/${c.p.id}">${tile(c.p)}</a>
        <div class="info">
          <a href="#/product/${c.p.id}" class="ptitle" style="font-size:14px">${esc(c.p.title)}</a>
          <div>${priceHtml(c.p).replace("price", "price\" style=\"font-size:18px")} <span class="mrp"><s>₹${inr(c.p.mrp)}</s></span></div>
          <div class="green" style="font-size:12px">In stock</div>
          ${c.p.prime ? '<span class="prime">prime</span>' : ""}
          <div class="actions">
            ${isSaved ? `<button class="btn btn-plain btn-sm" data-move="${c.p.id}">Move to cart</button>` : `
              <div class="qty"><button data-dec="${c.p.id}">${c.qty === 1 ? "🗑" : "−"}</button><span>${c.qty}</span><button data-inc="${c.p.id}">+</button></div>
              <button class="btn btn-plain btn-sm" data-save="${c.p.id}">Save for later</button>`}
            <button class="btn btn-plain btn-sm" data-del="${c.p.id}">Delete</button>
          </div>
        </div>
      </div>`;
    return `
      <div class="cart-layout">
      ${t.items.length ? `
      <section class="section cart-sub">
        <div class="subtotal">Subtotal <b>₹${inr(t.sub)}</b></div>
        ${t.sub >= 499 ? '<div class="green" style="font-size:13px">✔ Your order is eligible for FREE Delivery.</div>' : `<div class="muted">Add ₹${inr(499 - t.sub)} more for FREE delivery</div>`}
        <a class="btn btn-yellow" href="#/checkout">Proceed to Buy (${t.count} item${t.count > 1 ? "s" : ""})</a>
        <div class="muted green">You save ₹${inr(t.mrp - t.sub)} on this order</div>
      </section>
      <section class="section cart-items"><h2 class="dk-only">Shopping Cart</h2>${t.items.map((c) => line(c, false)).join("")}</section>` : `<section class="section cart-items"><h2>Your cart is empty</h2></section>`}
      ${saved.length ? `<section class="section cart-saved"><h2>Saved for later (${saved.length})</h2>${saved.map((c) => line(c, true)).join("")}</section>` : ""}
      </div>`;
  }

  function bindCart() {
    view.onclick = (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const find = (id) => state.cart.find((c) => c.id === id);
      if (b.dataset.inc) find(b.dataset.inc).qty = Math.min(10, find(b.dataset.inc).qty + 1);
      else if (b.dataset.dec) {
        const c = find(b.dataset.dec);
        if (c.qty > 1) c.qty--; else state.cart = state.cart.filter((x) => x !== c);
      } else if (b.dataset.del) state.cart = state.cart.filter((c) => c.id !== b.dataset.del);
      else if (b.dataset.save) find(b.dataset.save).saved = true;
      else if (b.dataset.move) find(b.dataset.move).saved = false;
      else return;
      save("cart");
      updateBadge();
      render();
    };
  }

  function checkoutPage() {
    const t = totals();
    if (!t.items.length) { location.hash = "#/cart"; return ""; }
    const a = state.address || {};
    const pays = [
      ["upi", "UPI", "Pay by any UPI app (simulated)"],
      ["card", "Credit or debit card", "Demo only – no card details collected"],
      ["netbanking", "Net Banking", "Choose an option at the next step (simulated)"],
      ["cod", "Cash on Delivery / Pay on Delivery", "Cash, UPI and cards accepted"],
    ];
    return `
      <div class="steps"><span class="on">① Address</span><span class="on">② Payment</span><span class="on">③ Place order</span></div>
      <form id="checkoutForm" class="co-layout">
        <section class="section co-address">
          <h2>Delivery address</h2>
          <div class="field"><label for="f-name">Full name</label><input id="f-name" name="name" required value="${esc(a.name || "")}"></div>
          <div class="field"><label for="f-phone">Mobile number</label><input id="f-phone" name="phone" required pattern="[0-9]{10}" inputmode="numeric" placeholder="10-digit mobile number" value="${esc(a.phone || "")}"></div>
          <div class="field"><label for="f-pin">Pincode</label><input id="f-pin" name="pin" required pattern="[0-9]{6}" inputmode="numeric" placeholder="6 digits [0-9] PIN code" value="${esc(a.pin || "")}"></div>
          <div class="field"><label for="f-line">Flat, House no., Building, Area</label><input id="f-line" name="line" required value="${esc(a.line || "")}"></div>
          <div class="field"><label for="f-city">Town/City</label><input id="f-city" name="city" required value="${esc(a.city || "")}"></div>
          <div class="field"><label for="f-state">State</label>
            <select id="f-state" name="state">${["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Telangana", "Gujarat", "Rajasthan", "Kerala", "Punjab", "Haryana"].map((s) => `<option ${a.state === s ? "selected" : ""}>${s}</option>`).join("")}</select>
          </div>
        </section>
        <section class="section co-pay">
          <h2>Payment method</h2>
          ${pays.map(([v, n, d], i) => `<label class="pay-opt ${i === 3 ? "on" : ""}"><input type="radio" name="pay" value="${v}" ${i === 3 ? "checked" : ""}><div><b>${n}</b><div class="muted">${d}</div></div></label>`).join("")}
        </section>
        <section class="section co-summary">
          <h2>Order Summary</h2>
          <div class="sumline"><span>Items (${t.count}):</span><span>₹${inr(t.sub)}</span></div>
          <div class="sumline"><span>Delivery:</span><span>${t.delivery ? "₹" + t.delivery : "FREE"}</span></div>
          <div class="sumline total"><span>Order Total:</span><span>₹${inr(t.total)}</span></div>
          <div class="muted">Arriving ${deliveryDate(2)}</div>
          <button class="btn btn-yellow" type="submit">Place your order</button>
          <div class="muted">This is a demo clone: no real payment is taken.</div>
        </section>
      </form>`;
  }

  function bindCheckout() {
    const form = $("#checkoutForm");
    if (!form) return;
    form.addEventListener("change", (e) => {
      if (e.target.name === "pay") form.querySelectorAll(".pay-opt").forEach((l) => l.classList.toggle("on", l.contains(e.target)));
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const t = totals();
      state.address = { name: fd.name, phone: fd.phone, pin: fd.pin, line: fd.line, city: fd.city, state: fd.state };
      save("address");
      const order = {
        id: "404-" + Math.floor(1e6 + Math.random() * 9e6) + "-" + Math.floor(1e6 + Math.random() * 9e6),
        date: new Date().toISOString(),
        items: t.items.map((c) => ({ id: c.id, qty: c.qty, price: c.p.price })),
        total: t.total,
        pay: fd.pay,
        address: state.address,
        eta: deliveryDate(2),
      };
      state.orders.unshift(order);
      state.cart = state.cart.filter((c) => c.saved);
      save("orders");
      save("cart");
      updateBadge();
      setDeliverText();
      location.hash = "#/order/" + order.id;
    };
  }

  function orderCard(o) {
    return `
      <div class="order-card">
        <div class="row-head"><b>Arriving ${esc(o.eta)}</b><span class="muted">₹${inr(o.total)}</span></div>
        <div class="oi">${o.items.map((i) => byId(i.id)?.icon || "📦").join("")}</div>
        <div class="muted">Order # ${esc(o.id)} · Placed ${new Date(o.date).toLocaleDateString("en-IN")}</div>
        <div class="muted">Ship to ${esc(o.address.name)}, ${esc(o.address.city)} ${esc(o.address.pin)}</div>
      </div>`;
  }

  function orderDonePage(id) {
    const o = state.orders.find((x) => x.id === id);
    if (!o) return `<div class="empty section"><h2>Order not found</h2><a class="btn btn-yellow" href="#/">Go home</a></div>`;
    return `
      <section class="section" style="text-align:center">
        <div style="font-size:64px">✅</div>
        <h2 class="green">Order placed, thank you!</h2>
        <p>Confirmation will be sent to your mobile ${esc(o.address.phone)}.</p>
      </section>
      <section class="section">${orderCard(o)}
        <a class="btn btn-yellow" href="#/">Continue shopping</a>
        <a class="btn btn-plain" href="#/orders">Review or edit your orders</a>
      </section>`;
  }

  function youPage() {
    const wish = state.wishlist.map(byId).filter(Boolean);
    const name = state.address?.name || "Anshi";
    return `
      <div class="hello" style="background:#fff">Hello, <b>${esc(name)}</b></div>
      <div class="you-btns" style="background:#fff">
        <a href="#/orders">Your Orders</a><a href="#/search?deal=1">Buy Again</a>
        <a href="#/menu">Your Account</a><a href="#/wishlist">Your Lists</a>
      </div>
      <section class="section">
        <div class="row-head"><h2>Your Orders</h2><a class="see" href="#/orders">See all</a></div>
        ${state.orders.length ? state.orders.slice(0, 2).map(orderCard).join("") : '<p class="muted">You haven\'t placed any orders yet.</p>'}
      </section>
      <section class="section">
        <div class="row-head"><h2>Your Wish List</h2><a class="see" href="#/wishlist">See all</a></div>
        ${wish.length ? `<div class="hscroll">${wish.map(miniCard).join("")}</div>` : '<p class="muted">Tap 🤍 on any product to save it here.</p>'}
      </section>
      <section class="section">
        <h2>Keep shopping for</h2>
        ${state.recent.length ? `<div class="hscroll">${state.recent.map(byId).filter(Boolean).map(miniCard).join("")}</div>` : '<p class="muted">Products you view will appear here.</p>'}
      </section>`;
  }

  function ordersPage() {
    return `<section class="section"><h2>Your Orders</h2>
      ${state.orders.length ? state.orders.map(orderCard).join("") : '<div class="empty"><div class="big">📦</div><p>No orders yet.</p><a class="btn btn-yellow" href="#/">Start shopping</a></div>'}
    </section>`;
  }

  function wishlistPage() {
    const wish = state.wishlist.map(byId).filter(Boolean);
    return `<div class="result-count"><b>Your Wish List</b> · ${wish.length} items</div>
      ${wish.length ? `<div class="plist">${wish.map(productRow).join("")}</div>` : '<div class="empty section"><div class="big">🤍</div><p>Your Wish List is empty.</p><a class="btn btn-yellow" href="#/">Discover products</a></div>'}`;
  }

  function menuPage() {
    return `
      <section class="section">
        <h2>Shop by Category</h2>
        <div class="menu-grid">
          ${CATEGORIES.map((c) => `<a href="#/search?cat=${c.id}"><div class="tile" style="background:${c.tint}">${c.icon}</div>${c.name}</a>`).join("")}
          <a href="#/search?deal=1"><div class="tile" style="background:#ffebee">🏷️</div>Today's Deals</a>
          <a href="#/search?prime=1"><div class="tile" style="background:#e3f2fd">🚚</div>Prime</a>
        </div>
      </section>
      <section class="section list-links">
        <h2>Programs & Features</h2>
        <a href="#/orders"><span>Your Orders</span><span>›</span></a>
        <a href="#/wishlist"><span>Your Wish List</span><span>›</span></a>
        <a href="#/cart"><span>Your Cart</span><span>›</span></a>
        <a href="#/search"><span>Browse all products</span><span>›</span></a>
        <a href="#/menu" id="resetLink"><span>Reset demo data</span><span>›</span></a>
      </section>`;
  }

  // ---------- Router ----------
  let timers = [];
  function render() {
    timers.forEach(clearInterval);
    timers = [];
    view.onclick = null;
    const hash = location.hash.slice(1) || "/";
    const [path, query] = hash.split("?");
    const params = new URLSearchParams(query || "");
    const parts = path.split("/").filter(Boolean);
    const route = parts[0] || "";
    let html = "", tab = "";

    switch (route) {
      case "": html = homePage(); tab = "home"; break;
      case "search": html = searchPage(params); break;
      case "product": html = productPage(parts[1]); break;
      case "cart": html = cartPage(); tab = "cart"; break;
      case "checkout": html = checkoutPage(); break;
      case "order": html = orderDonePage(parts[1]); break;
      case "you": html = youPage(); tab = "you"; break;
      case "orders": html = ordersPage(); tab = "you"; break;
      case "wishlist": html = wishlistPage(); tab = "you"; break;
      case "menu": html = menuPage(); tab = "menu"; break;
      default: html = homePage(); tab = "home";
    }
    if (route === "checkout" && !html) return;
    view.innerHTML = html;
    window.scrollTo(0, 0);

    document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    document.body.classList.toggle("has-back", route !== "");
    $("#deliverBar").hidden = !["", "search", "product"].includes(route);
    $("#searchInput").value = $("#dSearchInput").value = route === "search" ? params.get("q") || "" : "";
    dCat.value = route === "search" ? params.get("cat") || "" : "";
    document.querySelectorAll("#dSub a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + hash));

    if (route === "") { startCarousel(); startDealTimer(); }
    if (route === "product") bindProductPage(parts[1]);
    if (route === "cart") bindCart();
    if (route === "checkout") bindCheckout();
    if (route === "menu") $("#resetLink").onclick = (e) => {
      e.preventDefault();
      if (!confirm("Clear cart, orders, wish list and address?")) return;
      Object.assign(state, { cart: [], wishlist: [], orders: [], address: null, recent: [] });
      ["cart", "wishlist", "orders", "address", "recent"].forEach(save);
      updateBadge();
      setDeliverText();
      toast("Demo data cleared");
    };
  }

  // "Add to cart" buttons inside product links
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    addToCart(b.dataset.add);
  }, true);

  // ---------- Search with suggestions ----------
  // Same behaviour for the mobile and desktop search bars
  function setupSearch(form, input, suggest, catSelect) {
    const showSuggestions = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { suggest.hidden = true; return; }
      const hits = PRODUCTS.filter((p) => (p.title + " " + p.brand).toLowerCase().includes(q)).slice(0, 7);
      if (!hits.length) { suggest.hidden = true; return; }
      suggest.innerHTML = hits.map((p) => {
        const t = esc(p.title.length > 48 ? p.title.slice(0, 48) + "…" : p.title);
        return `<li data-id="${p.id}">${p.icon} ${t}</li>`;
      }).join("");
      suggest.hidden = false;
    };
    input.addEventListener("input", showSuggestions);
    input.addEventListener("blur", () => setTimeout(() => (suggest.hidden = true), 150));
    suggest.addEventListener("mousedown", (e) => {
      const li = e.target.closest("li");
      if (li) location.hash = "#/product/" + li.dataset.id;
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      suggest.hidden = true;
      input.blur();
      const p = new URLSearchParams();
      if (input.value.trim()) p.set("q", input.value.trim());
      if (catSelect && catSelect.value) p.set("cat", catSelect.value);
      location.hash = "#/search?" + p.toString();
    });
  }
  const dCat = $("#dSearchCat");
  dCat.innerHTML += CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  setupSearch($("#searchForm"), $("#searchInput"), $("#suggest"));
  setupSearch($("#dSearchForm"), $("#dSearchInput"), $("#dSuggest"), dCat);

  // Desktop secondary nav bar
  $("#dSub").innerHTML = `<a href="#/menu">☰ <b>All</b></a><a href="#/search?deal=1">Today's Deals</a><a href="#/search?prime=1">Prime</a>` +
    CATEGORIES.map((c) => `<a href="#/search?cat=${c.id}">${c.name}</a>`).join("") +
    `<a href="#/orders">Customer Service</a>`;

  $("#toTop").onclick = (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // Sort dropdown on search page
  document.addEventListener("change", (e) => {
    if (e.target.id !== "sortSel") return;
    const [, query] = location.hash.split("?");
    const p = new URLSearchParams(query || "");
    e.target.value ? p.set("sort", e.target.value) : p.delete("sort");
    location.hash = "#/search?" + p.toString();
  });

  $("#backBtn").onclick = () => (history.length > 1 ? history.back() : (location.hash = "#/"));

  function setDeliverText() {
    const a = state.address;
    $("#deliverText").textContent = a ? `Deliver to ${a.name} - ${a.city} ${a.pin}` : "Deliver to Anshi - New Delhi 110016";
    $("#dDeliverName").textContent = "Deliver to " + (a ? a.name : "Anshi");
    $("#dDeliverCity").textContent = a ? `${a.city} ${a.pin}` : "New Delhi 110016";
    $("#dHello").textContent = a ? a.name.split(" ")[0] : "Anshi";
  }
  $("#deliverBar").onclick = () => (location.hash = state.cart.some((c) => !c.saved) ? "#/checkout" : "#/you");

  window.addEventListener("hashchange", render);
  setDeliverText();
  updateBadge();
  render();
})();
