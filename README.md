# PDP Enhancements — Shopify Horizon

This project adds three PDP features: a **Build Your Routine** accordion, a variant-aware **Benefits & Ingredients** tab panel, and a **sticky add-to-cart** bar. It’s built on the [Horizon](https://github.com/Shopify/horizon) base theme.

## Local setup

1. Clone the repo.
2. Install [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) and run `shopify theme dev` against your store.
3. Everything is wired through **`templates/product.json`**.

## Project structure

### Theme sections
- [sections/build-your-routine.liquid](https://github.com/KevAlv/horizon/blob/doc/submission-final/sections/build-your-routine.liquid) (Includes markup and CSS)
- [sections/benefits-ingredients.liquid](https://github.com/KevAlv/horizon/blob/doc/submission-final/sections/benefits-ingredients.liquid) (Includes markup and CSS)

### Snippets
- [snippets/routine-product-json.liquid](https://github.com/KevAlv/horizon/blob/doc/submission-final/snippets/routine-product-json.liquid)

### Assets
- [assets/build-your-routine.js](https://github.com/KevAlv/horizon/blob/doc/submission-final/assets/build-your-routine.js)
- [assets/benefits-ingredients.js](https://github.com/KevAlv/horizon/blob/doc/submission-final/assets/benefits-ingredients.js)

## Implementation details

Review the sections below for more on the technical approach:
- [Architectural decisions](#implementation-details)
- [State management approach](#build-your-routine)

### Build Your Routine

Selections live in a private `#state` `Map` on the `BuildYourRoutine` custom element (`assets/build-your-routine.js`), so changing the **main product variant** on the PDP doesn’t wipe routine picks.

**Data**: Reads **`product.metafields.custom.routine_config`** (JSON). If it’s empty, **`sections/build-your-routine.liquid`** builds a demo config from fixed product **handles** (see the section file). Product payloads match what **`snippets/routine-product-json.liquid`** outputs.

**Cart**: After a successful **`POST /cart/add.js`**, the theme gets a **`CartUpdateEvent`** so counts and cart UI stay in sync. Then:

- If the store uses a **drawer** cart, **`cart-drawer-component.open()`** runs so the drawer opens (same component Horizon already uses—not a one-off integration per random theme).
- If there’s **no** drawer (page cart), the browser goes to the **cart URL** (`Theme.routes.cart_url` / `/cart`).

So confirmation is **always “open the cart”**—drawer or full page—not a separate success banner on the product page.

The CTA stays disabled until required steps are complete, and sold-out variants are disabled in the UI.

### Benefits & Ingredients

Tabs update when the variant changes via **`ThemeEvents.variantUpdate`** (`assets/benefits-ingredients.js`). Content order: **variant metafields** first, then **product-level**, then the tab stays hidden if there’s nothing to show.

Product context: **section product picker** if set, else the current **`product`**, else a small demo fallback in Liquid.

Accessibility follows the **WAI-ARIA tab list** pattern (arrow keys, Home/End).

### Sticky add-to-cart

Handled by Horizon’s **`product-information`** section. Enabled with **`enable_sticky_add_to_cart`** in **`templates/product.json`**. No extra JS asset for this piece—it follows the theme’s variant and availability state.

## Metafield schema

Create definitions in the Shopify admin under **Settings → Custom data** (namespace **`custom`**):

| Key | Type | Scope | Purpose |
|-----|------|--------|---------|
| `benefits` | Rich text (or multi-line) | Product / variant | Benefits tab |
| `ingredients` | Same | Product / variant | Ingredients tab |
| `how_to_use` | Same | Product / variant | How to Use tab |
| `routine_config` | JSON | Product | Routine builder config |

**`routine_config`** shape: `discount_percentage`, and `steps[]` where each step has `id`, `title`, `description`, **`required`**, **`multi_select`**, and **`products[]`** (each product object should match the demo snippet: `id`, `title`, `price`, `image`, `variants[]` with `id`, `title`, `price`, `available`).

Invalid JSON in that metafield will break parsing in the browser—fix the value in admin.

## Tradeoffs and limitations

- **Demo fallback** uses **`all_products[handle]`** because that’s the practical Liquid pattern; production could move to GIDs or **metaobjects** (not used here).
- **Inventory** reflects what was rendered on the page; there’s no background polling. The **cart API** still returns errors if something sells out between page load and add.
- **Routine cart errors** in the UI are intentionally generic; the API may expose more detail in `description` if you want to map it later.
