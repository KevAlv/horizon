import { Component } from '@theme/component';
import { ThemeEvents, CartUpdateEvent } from '@theme/events';

/**
 * @typedef {{ productId: number, variantId: number, price: number, title: string }} Selection
 * @typedef {{ id: number, title: string, price: number, available: boolean }} Variant
 * @typedef {{ id: number, title: string, price: number, image: string, variants: Variant[] }} Product
 * @typedef {{ id: string, title: string, description: string, required: boolean, multi_select: boolean, products: Product[] }} Step
 * @typedef {{ discount_percentage: number, steps: Step[] }} RoutineConfig
 */

/**
 * Custom element that renders a multi-step routine builder with accordion UI.
 * Reads config from a <script type="application/json"> tag, renders the accordion
 * DOM dynamically, manages selection state, and batch-adds to cart via /cart/add.js.
 *
 * @extends {Component}
 */
class BuildYourRoutine extends Component {
  /** @type {RoutineConfig|null} */
  #config = null;

  /**
   * Selection state: Map<stepId, Set<Selection>>
   * @type {Map<string, Set<Selection>>}
   */
  #state = new Map();

  /** @type {AbortController} */
  #abortController = new AbortController();

  /** @type {HTMLElement|null} */
  #stepsContainer = null;

  /** @type {HTMLButtonElement|null} */
  #ctaButton = null;

  /** @type {HTMLElement|null} */
  #subtotalEl = null;

  /** @type {HTMLElement|null} */
  #discountEl = null;

  /** @type {HTMLElement|null} */
  #totalEl = null;

  /** @type {HTMLElement|null} */
  #errorEl = null;

  connectedCallback() {
    super.connectedCallback();
    this.#parseConfig();
    if (!this.#config) return;
    this.#cacheSummaryElements();
    this.#renderSteps(this.#config.steps);
    this.#updateSummaryBar();
    this.#attachListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }

  // ---------------------------------------------------------------------------
  // Public event handlers
  // ---------------------------------------------------------------------------

  /** Toggle accordion open/close when step header is clicked */
  handleStepToggle = (event) => {
    const trigger = /** @type {HTMLElement} */ (event.target).closest('.routine-step__trigger');
    if (!trigger) return;
    const step = trigger.closest('.routine-step');
    if (!step) return;

    const isOpen = step.getAttribute('aria-expanded') === 'true';
    // Close all other steps first
    this.#stepsContainer?.querySelectorAll('.routine-step').forEach((s) => {
      if (s !== step) s.setAttribute('aria-expanded', 'false');
    });
    step.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  };

  /** Handle product card selection */
  handleProductSelect = (event) => {
    const card = /** @type {HTMLElement} */ (event.target).closest('.routine-product-card');
    if (!card) return;

    const stepId = card.dataset.stepId;
    const productId = Number(card.dataset.productId);
    const stepConfig = this.#config?.steps.find((s) => s.id === stepId);
    if (!stepId || !stepConfig) return;

    // Get current variant price (from select if applicable)
    const select = /** @type {HTMLSelectElement|null} */ (card.querySelector('.routine-product-card__variant-select'));
    const selectedOption = select?.options[select.selectedIndex];
    
    // REQUIREMENT 1: Use the select's value or the first variant's ID from the dataset if select is missing
    const variantId = selectedOption ? Number(selectedOption.value) : Number(card.dataset.firstVariantId);
    const price = selectedOption ? Number(selectedOption.dataset.price) : Number(card.dataset.basePrice);
    const title = card.querySelector('.routine-product-card__title')?.textContent?.trim() ?? '';

    if (!this.#state.has(stepId)) this.#state.set(stepId, new Set());
    const stepSelections = this.#state.get(stepId);

    // Check if this product is already selected
    const existing = [...(stepSelections ?? [])].find((s) => s.productId === productId);

    if (existing) {
      // Deselect
      stepSelections?.delete(existing);
      card.setAttribute('aria-pressed', 'false');
    } else {
      if (!stepConfig.multi_select) {
        // Single select: replace existing selection
        stepSelections?.clear();
        this.#stepsContainer
          ?.querySelectorAll(`[data-step-id="${stepId}"]`)
          .forEach((c) => c.setAttribute('aria-pressed', 'false'));
      }
      stepSelections?.add({ productId, variantId, price, title });
      card.setAttribute('aria-pressed', 'true');
    }

    this.#markStepComplete(stepId);
    this.#updateSummaryBar();
    this.#hideError();
  };

  /** Handle variant <select> change — update displayed price and selection state */
  handleVariantSelect = (event) => {
    const select = /** @type {HTMLSelectElement} */ (event.target);
    const card = select.closest('.routine-product-card');
    if (!card) return;

    const selectedOption = select.options[select.selectedIndex];
    const newPrice = Number(selectedOption.dataset.price);
    const newVariantId = Number(selectedOption.value);
    const isAvailable = selectedOption.dataset.available !== 'false';
    const stepId = /** @type {HTMLElement} */ (card).dataset.stepId;
    const productId = Number(/** @type {HTMLElement} */ (card).dataset.productId);

    // Update displayed price
    const priceEl = card.querySelector('.routine-product-card__price');
    if (priceEl) priceEl.textContent = this.#formatPrice(newPrice);

    // Disable card interaction if variant is unavailable (requirement 2 part)
    /** @type {HTMLButtonElement} */ (card).disabled = !isAvailable;
    card.classList.toggle('routine-product-card--unavailable', !isAvailable);

    // If this card is currently selected, update its variant/price in state
    if (!stepId) return;
    const stepSelections = this.#state.get(stepId);
    const existing = [...(stepSelections ?? [])].find((s) => s.productId === productId);
    if (existing) {
      existing.variantId = newVariantId;
      existing.price = newPrice;
      this.#updateSummaryBar();
    }
  };

  // ---------------------------------------------------------------------------
  // Private — rendering
  // ---------------------------------------------------------------------------

  /** Parse the JSON config from the embedded <script> tag */
  #parseConfig() {
    const scriptTag = this.querySelector('script[type="application/json"]');
    if (!scriptTag) {
      console.error('[BuildYourRoutine] Missing JSON config script tag');
      return;
    }
    try {
      this.#config = JSON.parse(scriptTag.textContent ?? '{}');
    } catch (err) {
      // Log the raw text so Liquid output issues are visible in the console
      console.error('[BuildYourRoutine] JSON parse failed:', err.message);
      console.error('[BuildYourRoutine] Raw JSON from Liquid:\n', scriptTag.textContent);
    }
  }

  /** Cache summary bar element references */
  #cacheSummaryElements() {
    this.#stepsContainer = this.querySelector('.routine-steps');
    this.#ctaButton = this.querySelector('.routine-summary__cta');
    this.#subtotalEl = this.querySelector('.routine-summary__subtotal');
    this.#discountEl = this.querySelector('.routine-summary__discount');
    this.#totalEl = this.querySelector('.routine-summary__total');
    this.#errorEl = this.querySelector('.routine-summary__error');
  }

  /**
   * Build the full accordion DOM from the config and insert into the steps container.
   * @param {Step[]} steps
   */
  #renderSteps(steps) {
    if (!this.#stepsContainer) return;

    if (!steps?.length) {
      // Show a visible warning — helps debug Liquid/JSON issues in the browser
      this.#stepsContainer.innerHTML = '<p style="padding:1rem;color:#c0392b;font-size:0.875rem">[BuildYourRoutine] No steps found in config. Open DevTools console for details.</p>';
      return;
    }

    const html = steps
      .map((step, index) => this.#renderStep(step, index + 1))
      .join('');
    this.#stepsContainer.innerHTML = html;
    // Init state map for each step
    for (const step of steps) {
      this.#state.set(step.id, new Set());
    }
  }

  /**
   * Build the HTML for a single accordion step.
   * @param {Step} step
   * @param {number} number
   * @returns {string}
   */
  #renderStep(step, number) {
    const panelId = `routine-panel-${step.id}`;
    const triggerId = `routine-trigger-${step.id}`;
    const badge = step.required ? 'Required' : 'Optional';
    const badgeClass = step.required ? 'routine-step__badge--required' : '';
    // Filter out products where id === 0 — these are products all_products[] couldn't find
    const validProducts = step.products.filter((p) => p.id !== 0);
    const productsHtml = validProducts.map((p) => this.#renderProductCard(p, step.id)).join('');

    return `
      <div
        class="routine-step"
        data-step-id="${step.id}"
        aria-expanded="${number === 1 ? 'true' : 'false'}"
        data-complete="false"
        data-required="${step.required}"
      >
        <button
          class="routine-step__trigger"
          id="${triggerId}"
          aria-controls="${panelId}"
          type="button"
        >
          <span class="routine-step__number" aria-hidden="true">
            <span class="routine-step__number-text">${number}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="routine-step__checkmark"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </span>
          <span class="routine-step__title-group">
            <span class="routine-step__title">${this.#escapeHtml(step.title)}</span>
            <span class="routine-step__description">${this.#escapeHtml(step.description)}</span>
          </span>
          <span class="routine-step__badge ${badgeClass}" aria-label="${badge}">${badge}</span>
          <svg class="routine-step__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="routine-step__panel" id="${panelId}" role="region" aria-labelledby="${triggerId}">
          <div class="routine-step__panel-inner">
            <div class="routine-products">${productsHtml}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build the HTML for a single product card.
   * @param {Product} product
   * @param {string} stepId
   * @returns {string}
   */
  #renderProductCard(product, stepId) {
    const hasVariants = product.variants.length > 0;
    const initialPrice = hasVariants ? product.variants[0].price : product.price;
    const initialVariantId = hasVariants ? product.variants[0].id : product.id;
    const isInitiallyAvailable = hasVariants ? product.variants[0].available : product.available;

    const showVariantSelect = product.variants.length > 1 || (product.variants.length === 1 && product.variants[0].title !== 'Default Title');
    const variantSelectHtml = hasVariants && showVariantSelect
      ? `<select
           class="routine-product-card__variant-select"
           aria-label="Select size for ${this.#escapeHtml(product.title)}"
         >
           ${product.variants
             .map(
               (v) => `
             <option
               value="${v.id}"
               data-price="${v.price}"
               data-available="${v.available}"
               ${!v.available ? 'disabled' : ''}
             >${this.#escapeHtml(v.title)} — ${this.#formatPrice(v.price)}${!v.available ? ' (Sold out)' : ''}</option>
           `
             )
             .join('')}
         </select>`
      : '';

    return `
      <button
        class="routine-product-card${!isInitiallyAvailable ? ' routine-product-card--unavailable' : ''}"
        type="button"
        data-step-id="${stepId}"
        data-product-id="${product.id}"
        ${!isInitiallyAvailable ? 'disabled' : ''}
        data-first-variant-id="${initialVariantId}"
        data-base-price="${initialPrice}"
        aria-pressed="false"
        aria-label="${this.#escapeHtml(product.title)}"
      >
        <img
          class="routine-product-card__image"
          src="${product.image}"
          alt="${this.#escapeHtml(product.title)}"
          width="120"
          height="120"
          loading="lazy"
        />
        <p class="routine-product-card__title">${this.#escapeHtml(product.title)}</p>
        <p class="routine-product-card__price">
          ${this.#formatPrice(initialPrice)}
          ${!isInitiallyAvailable ? ' <span class="routine-product-card__sold-out">(Sold out)</span>' : ''}
        </p>
        ${variantSelectHtml}
      </button>
    `;
  }

  // ---------------------------------------------------------------------------
  // Private — event listeners
  // ---------------------------------------------------------------------------

  /** Attach delegated event listeners for accordion, card selection, and variant change */
  #attachListeners() {
    const { signal } = this.#abortController;
    const stepsContainer = this.#stepsContainer;
    if (!stepsContainer) return;

    stepsContainer.addEventListener('click', this.#handleContainerClick, { signal });
    stepsContainer.addEventListener('change', this.#handleContainerChange, { signal });

    // CTA button
    this.#ctaButton?.addEventListener('click', this.#addRoutineToCart, { signal });

    // Listen for main PDP variant change — persist routine selections
    const section = this.closest('.shopify-section');
    section?.addEventListener(ThemeEvents.variantUpdate, this.#onMainVariantChange, { signal });
  }

  /**
   * Delegated click handler — routes to step toggle or product select.
   * @param {MouseEvent} event
   */
  #handleContainerClick = (event) => {
    // Don't trigger card selection when clicking a variant <select>
    if (/** @type {HTMLElement} */ (event.target).closest('select')) return;

    if (/** @type {HTMLElement} */ (event.target).closest('.routine-step__trigger')) {
      this.handleStepToggle(event);
    } else if (/** @type {HTMLElement} */ (event.target).closest('.routine-product-card')) {
      this.handleProductSelect(event);
    }
  };

  /**
   * Delegated change handler — routes to variant select handler.
   * @param {Event} event
   */
  #handleContainerChange = (event) => {
    if (/** @type {HTMLElement} */ (event.target).classList.contains('routine-product-card__variant-select')) {
      this.handleVariantSelect(event);
    }
  };

  /**
   * When the main PDP variant changes, preserve the current routine selections.
   * No content update needed — routine config is product-level, not variant-level.
   */
  #onMainVariantChange = (_event) => {
    // Routine selections are preserved; no re-render needed.
    // If future requirements need variant-level routine configs, update here.
  };

  // ---------------------------------------------------------------------------
  // Private — state & validation
  // ---------------------------------------------------------------------------

  /**
   * Mark a step as complete or incomplete based on its current selection.
   * @param {string} stepId
   */
  #markStepComplete(stepId) {
    const stepEl = this.#stepsContainer?.querySelector(`[data-step-id="${stepId}"].routine-step`);
    const selections = this.#state.get(stepId);
    const isComplete = (selections?.size ?? 0) > 0;
    stepEl?.setAttribute('data-complete', isComplete ? 'true' : 'false');
  }

  /**
   * Validate the routine — check all required steps have a selection.
   * @returns {{ valid: boolean, missingSteps: string[] }}
   */
  #validateRoutine() {
    const missingSteps = [];
    for (const step of this.#config?.steps ?? []) {
      if (!step.required) continue;
      const selections = this.#state.get(step.id);
      if (!selections || selections.size === 0) {
        missingSteps.push(step.title);
      }
    }
    return { valid: missingSteps.length === 0, missingSteps };
  }

  /**
   * Calculate subtotal, discount, and total (all in cents).
   * @returns {{ subtotal: number, discount: number, total: number, hasSelections: boolean }}
   */
  #calculateSubtotal() {
    let subtotal = 0;
    let hasSelections = false;
    for (const selections of this.#state.values()) {
      for (const item of selections) {
        subtotal += item.price;
        hasSelections = true;
      }
    }
    const discountPct = this.#config?.discount_percentage ?? 0;
    const { valid } = this.#validateRoutine();
    // Only apply discount if all required steps are complete
    const discount = valid && discountPct > 0 ? Math.round(subtotal * (discountPct / 100)) : 0;
    const total = subtotal - discount;
    return { subtotal, discount, total, hasSelections };
  }

  // ---------------------------------------------------------------------------
  // Private — DOM updates
  // ---------------------------------------------------------------------------

  /** Update the summary bar prices and CTA state */
  #updateSummaryBar() {
    const { subtotal, discount, total, hasSelections } = this.#calculateSubtotal();
    const { valid } = this.#validateRoutine();
    const discountPct = this.#config?.discount_percentage ?? 0;
    const applyDiscount = discount > 0;

    if (this.#subtotalEl) {
      this.#subtotalEl.textContent = hasSelections ? `Was ${this.#formatPrice(subtotal)}` : '';
      this.#subtotalEl.dataset.visible = applyDiscount ? 'true' : 'false';
    }

    if (this.#discountEl) {
      this.#discountEl.hidden = !applyDiscount;
      this.#discountEl.textContent = applyDiscount ? `Save ${discountPct}%` : '';
    }

    if (this.#totalEl) {
      const oldText = this.#totalEl.textContent;
      const newText = hasSelections ? this.#formatPrice(total) : '';
      
      if (oldText !== newText && hasSelections) {
        this.#totalEl.textContent = newText;
        this.#totalEl.setAttribute('data-pop', 'true');
        // Reset the animation after it finishes
        setTimeout(() => this.#totalEl.removeAttribute('data-pop'), 400);
      } else {
        this.#totalEl.textContent = newText;
      }
    }

    if (this.#ctaButton) {
      this.#ctaButton.disabled = !valid;
      this.#ctaButton.setAttribute('aria-disabled', valid ? 'false' : 'true');
    }
  }

  /** Show an error message in the summary bar */
  #showError(message) {
    if (!this.#errorEl) return;
    this.#errorEl.textContent = message;
    this.#errorEl.hidden = false;
  }

  /** Hide the error message */
  #hideError() {
    if (!this.#errorEl) return;
    this.#errorEl.hidden = true;
    this.#errorEl.textContent = '';
  }

  // ---------------------------------------------------------------------------
  // Private — cart integration
  // ---------------------------------------------------------------------------

  /** Opens the cart drawer when the theme uses drawer cart; otherwise navigates to the cart page. */
  #openCartUiAfterRoutineAdd() {
    const drawer = /** @type {HTMLElement & { open?: () => void } } | null */ (
      document.querySelector('cart-drawer-component')
    );
    if (drawer?.open) {
      drawer.open();
      return;
    }
    const cartUrl =
      (typeof Theme !== 'undefined' && Theme.routes?.cart_url) || '/cart';
    globalThis.location.assign(cartUrl);
  }

  /**
   * Flatten the state Map into a cart items array.
   * @returns {{ id: number, quantity: number }[]}
   */
  #buildCartItems() {
    const items = [];
    for (const selections of this.#state.values()) {
      for (const item of selections) {
        items.push({ id: item.variantId, quantity: 1 });
      }
    }
    return items;
  }

  /**
   * Batch-add all selected routine products to cart via /cart/add.js.
   * On success, notify theme via CartUpdateEvent. On failure, show inline error.
   */
  #addRoutineToCart = async () => {
    this.#hideError();
    const items = this.#buildCartItems();
    if (items.length === 0) return;

    // Disable button to prevent double-submit
    if (this.#ctaButton) {
      this.#ctaButton.disabled = true;
      this.#ctaButton.textContent = 'Adding…';
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.description || `Cart error: ${response.status}`);
      }

      document.dispatchEvent(new CartUpdateEvent(responseData, this.id, {
        source: 'build-your-routine',
        itemCount: responseData.items?.length || items.length
      }));

      // Let cart-items listen first, then open drawer (or cart page) as the sole success UX.
      requestAnimationFrame(() => {
        this.#openCartUiAfterRoutineAdd();
        if (this.#ctaButton) {
          this.#ctaButton.textContent = 'Add Routine to Cart';
        }
        this.#updateSummaryBar();
      });
    } catch (error) {
      console.error('[BuildYourRoutine] Cart add failed:', error);
      this.#showError('Something went wrong. Please try again.');
      if (this.#ctaButton) {
        this.#ctaButton.textContent = 'Add Routine to Cart';
      }
      this.#updateSummaryBar();
    }
  };

  // ---------------------------------------------------------------------------
  // Private — utilities
  // ---------------------------------------------------------------------------

  /**
   * Format a price in cents to a display string (e.g. 2400 → "$24.00").
   * Uses Shopify's Theme.moneyFormat if available, otherwise falls back to a simple formatter.
   * @param {number} cents
   * @returns {string}
   */
  #formatPrice(cents) {
    if (typeof Intl !== 'undefined') {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD',
      }).format(cents / 100);
    }
    return `$${(cents / 100).toFixed(2)}`;
  }

  /**
   * Escape a string for safe insertion into HTML attributes and text nodes.
   * Handles null/undefined gracefully — returns empty string.
   * @param {string|null|undefined} str
   * @returns {string}
   */
  #escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

if (!customElements.get('build-your-routine')) {
  customElements.define('build-your-routine', BuildYourRoutine);
}
