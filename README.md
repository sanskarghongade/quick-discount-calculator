# Quick Discount Calculator

A fast, free, mobile-friendly website that works out discounts instantly. No sign-up, no database, no tracking — everything runs in the visitor's browser.

**Live site:** _(add your URL here after deploying)_

## Features

- Calculate the **discount amount** and **final price** from an original price and a percentage
- **Successive discounts** — stack as many discounts as you like, each applied to the already-reduced price
- **Compare two offers** — highlights the cheaper one with a plain-English verdict
- Instant results as you type, plus **Clear** buttons per section and a global **Clear all**
- **Input validation** — friendly messages for blank, non-numeric, negative, or over-100% values
- Mobile-first responsive design
- Currency switcher (₹ / $ / € / £)
- Accessible: keyboard-navigable tabs, screen-reader labels, visible focus rings
- SEO ready: descriptive title/meta, semantic headings, JSON-LD `WebApplication` structured data

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure, the three calculator tabs, SEO metadata |
| `style.css` | All styling (mobile-first, no frameworks) |
| `script.js` | Calculations, validation, tabs, clear buttons |
| `logo.svg` | Logo mark, also used as the favicon |

## Run it locally

No build step and no dependencies. Just open `index.html` in a browser.

Prefer a local server (optional):

```powershell
python -m http.server 8000
# then visit http://localhost:8000
```

## How the maths works

- **Single discount:** `final price = original - (original × discount ÷ 100)`
- **Successive discounts:** each discount applies to the already-reduced price, so you multiply what remains:
  `original × (1 - d1/100) × (1 - d2/100) × …`
  (Two 10% discounts = 0.9 × 0.9 = 0.81, a 19% total discount — not 20%.)
- **Comparing offers:** compute each final price and pick the lower one.

## Deploying

This is a plain static site, so it works on any static host:

- **Vercel** — import the GitHub repo; no configuration needed
- **Netlify** — drag and drop the folder, or connect the repo
- **GitHub Pages** — enable Pages for the `main` branch

## Tech

Plain HTML, CSS and JavaScript. No framework, no database, no paid APIs, no analytics.

## Licence

Free to use and modify.
