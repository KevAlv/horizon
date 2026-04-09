# Shopify PDP take-home — outstanding items

Derived from the assignment scope and the current codebase (`build-your-routine`, `benefits-ingredients`, `product.json`, `routine-product-json`).

---

## Documentation and delivery (non-code)

| Status | Item |
|--------|------|
| **Complete** | **README** — setup (theme, `shopify theme dev`, sample data). |
| **Complete** | **Assumptions** — demo products, handles, currency, etc. |
| **Complete** | **Metafields / metaobjects** — where they are (or would be) defined: namespaces and keys. |
| **Complete** | **Limitations and tradeoffs** — e.g. sticky bar via native theme setting, cart drawer vs. redirect after add. |
| **Complete** | **Post–Add Routine UX** — `CartUpdateEvent` + **only** opening the cart (`cart-drawer-component.open()` or cart page); documented in README. |
| **Complete** | **Sticky add-to-cart** — note in README that Feature 3 is **Horizon’s** `product-information` + `enable_sticky_add_to_cart`, not a custom asset in this repo (so reviewers do not look for a missing “sticky” JS file). |
| Optional | **Loom** (2–5 min) — architecture, state, tradeoffs. |
| Pending | **Submit** — push repo and share link per recruiter instructions. |

---

## Code-related outstanding items

| Priority | Item | Status |
|----------|------|--------|
| **Routine** | **Metafield-driven routine config** — priority to `routine_config` metafield; fallback logic implemented for demo. | **Complete** |
| **Routine** | **Snippet Refactor** — Consolidated product JSON into `snippets/routine-product-json.liquid`. | **Complete** |
| **Benefits** | **Variant key mismatch** — Fixed in `benefits-ingredients.js`; keys now match numeric variant ID. | **Complete** |
| **Benefits** | **PDP Context** — Section generalized to current `product` with optional section picker. | **Complete** |
| **A11y** | **Sold out states** — JS handles disabling sold-out variants and simple products. | **Complete** |

---

## Pre-submit checklist

**Documentation**

- [x] README covers setup, assumptions, metafields, limitations, post–add flow, sticky bar note.

**Code**

- [x] Fix Benefits **variant ID** lookup (`benefits-ingredients.js` and/or JSON in `benefits-ingredients.liquid`).
- [x] Generalise Benefits to current `product`.
- [x] Move routine config to metafields.
- [x] Validate edge case: **all variants unavailable** in `routine-product-json`.

**Optional**

- [ ] Loom walkthrough.

---

## Revalidation notes (code vs. this list)

**Verified against the repo**

- **Benefits variant keys** — `benefits-ingredients.js` uses `data[variantId]` with `data['default']` fallback; Liquid emits `"{{ variant.id }}"` keys. **Aligned** after `JSON.parse` (numeric `variant.id` from events coerces to the same key).
- **Benefits product context** — `sections/benefits-ingredients.liquid` uses `section.settings.product | default: product | default: all_products[...]` and schema includes a product picker. **Aligned**.
- **Routine metafield + fallback** — `build-your-routine.liquid` uses `product.metafields.custom.routine_config.value` with demo JSON fallback; snippet outputs all variants and `product.available`. **JS** disables fully unavailable simple products and sold-out states per variant; options use `disabled` when unavailable. **Aligned** with checklist.
- **README** — Take-home section documents setup, metafields, assumptions, sticky bar, and cart flow (`CartUpdateEvent`, **forced cart open** only — no inline success banner).

---

## Assignment coverage (vs. `CODING_TEST` brief)

| Area | Status | Notes |
|------|--------|--------|
| **Scope** — Horizon, Liquid/JS/CSS, no apps, no checkout | Met | Theme primitives (`Component`, `ThemeEvents`). |
| **1. Routine** — metafields, steps, accordion, cards, rules, state, discount, `/cart/add.js`, errors, success UX | Met | `routine_config` + demo fallback; batch add; **success = open cart / go to cart page** only; errors mostly **generic** (improvement: map API messages). |
| **1. Routine** — metaobjects | Optional | Brief allows metafields **or** metaobjects; you use **metafields + JSON** only. |
| **1. Routine** — persist selections across PDP | Met | State in memory; `#onMainVariantChange` preserves selections (no re-render). |
| **2. Benefits** — tabs, variant data, fallback, a11y, no reload | Met | `variant:update`, `#hideMissingTabs`, keyboard + ARIA + `aria-live`. |
| **3. Sticky ATC** — scroll, variant/price/qty, disable when unavailable | Met | Native `product-information` + `enable_sticky_add_to_cart` in `product.json`. |
| **Deliverables** — repo, sections, snippets, assets, README | Met | Optional **Loom** still open. |
| **Hardening** | Partial | `routine_config` invalid JSON; first variant sold-out default (see residual notes). |

**Residual edge cases (optional hardening)**

- **Metafield `routine_config` JSON** — If merchants paste invalid JSON or leave trailing commas in `products` arrays, parsing can still fail; validate in Theme Editor or via a metafield definition. **Demo fallback** now joins snippet output with a **separator** so blank renders never emit `[,`.
- **Multi-variant products** — Initial card state uses **the first variant** in the array; if that variant is sold out but a later one is available, the card may start disabled until the user changes the select. Consider picking the first `available` variant for defaults if that shows up in QA.

---

## Related files

| File | Role |
|------|------|
| `assets/build-your-routine.js` | Routine logic, cart, state |
| `sections/build-your-routine.liquid` | JSON config + styles |
| `snippets/routine-product-json.liquid` | Per-product JSON fragment |
| `assets/benefits-ingredients.js` | Tabs, variant updates, ARIA |
| `sections/benefits-ingredients.liquid` | Metafield JSON + tab markup |
| `templates/product.json` | Section order + theme sticky setting |
