# Amazon.in Clone (HTML · CSS · JavaScript)

A responsive Amazon India–style shopping site built with **only HTML, CSS and
vanilla JavaScript** — no frameworks, no libraries, no build step.

It shows a full **desktop website** layout on wide screens and switches to a
**mobile app** layout (bottom tab bar, teal header) on phones.

> Learning project. Not affiliated with Amazon. See [NOTICE.md](NOTICE.md).

## Features

- **Home** – category icons, auto-sliding banner (swipe on mobile), deal cards,
  "Today's Deals" with countdown timer, best-seller rows, recently viewed
- **Search** – live suggestions, filters (Prime, deals, category), sorting by
  price / rating / discount; sidebar filters + product grid on desktop
- **Product page** – price, M.R.P. and discount, bank offers, delivery date,
  quantity, Add to Cart / Buy Now, wish list, details and reviews; three-column
  layout with a sticky buy box on desktop
- **Cart** – change quantity, delete, save for later, subtotal, free-delivery hint
- **Checkout** – address form, payment choice (simulated, no real payment),
  order confirmation
- **Your account** – orders, wish list, keep shopping; menu with all categories
- Cart, wish list, orders and address are saved in the browser (`localStorage`)

## Responsive breakpoints

| Width          | Layout                                                      |
|----------------|-------------------------------------------------------------|
| < 600px        | Mobile app: teal header, bottom tab bar                     |
| 600px – 1023px | Tablet: mobile chrome, two-column grids                     |
| ≥ 1024px       | Desktop website: navy header, category bar, multi-column    |

## Run it

Open `index.html` directly in a browser, or serve the folder:

```bash
python -m http.server 5500
```

then visit http://localhost:5500.

## Project structure

```
index.html      App shell: desktop + mobile headers, footer, tab bar
css/styles.css  All styles, mobile-first with tablet/desktop media queries
js/data.js      Demo product catalog, categories and banners
js/app.js       Hash router, pages, cart/checkout logic, localStorage state
```

## License

[MIT](LICENSE) © 2026 Rohit. Trademark and third-party notes are in
[NOTICE.md](NOTICE.md).
