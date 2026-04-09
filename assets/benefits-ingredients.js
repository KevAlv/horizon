import { Component } from '@theme/component';
import { ThemeEvents } from '@theme/events';

/**
 * Custom element that renders a variant-aware Benefits & Ingredients tabbed panel.
 * Data is sourced from a <script type="application/json"> tag embedded in the section.
 * Subscribes to Horizon's variant:update event to swap content per variant.
 *
 * @extends {Component}
 */
class BenefitsIngredients extends Component {
  /** @type {Record<string, {benefits: string|null, ingredients: string|null, how_to_use: string|null}>} */
  #config = {};

  /** @type {string} Currently active tab key */
  #activeTab = 'benefits';

  /** @type {AbortController} */
  #abortController = new AbortController();

  /** Map of tab key → panel element */
  #panels = new Map();

  /** Map of tab key → tab button element */
  #tabs = new Map();

  connectedCallback() {
    super.connectedCallback();
    this.#parseConfig();
    this.#buildElementMaps();
    this.#renderInitialContent();
    this.#attachListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }

  // ---------------------------------------------------------------------------
  // Public event handlers (called via DOM event delegation)
  // ---------------------------------------------------------------------------

  /** Handle tab button click — switch to clicked tab */
  handleTabClick = (event) => {
    const tab = /** @type {HTMLElement} */ (event.target).closest('[role="tab"]');
    if (!tab) return;
    const key = tab.dataset.tab;
    if (!key || key === this.#activeTab) return;
    this.#setActiveTab(key);
  };

  /** Handle keyboard navigation within the tablist */
  handleKeyDown = (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const visibleTabs = [...this.#tabs.values()].filter((t) => !t.hidden);
    const currentIndex = visibleTabs.findIndex((t) => t.dataset.tab === this.#activeTab);
    if (currentIndex === -1) return;

    event.preventDefault();

    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % visibleTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else nextIndex = visibleTabs.length - 1;

    const nextTab = visibleTabs[nextIndex];
    if (!nextTab?.dataset?.tab) return;

    this.#setActiveTab(nextTab.dataset.tab);
    nextTab.focus();
  };

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /** Parse the embedded JSON config block */
  #parseConfig() {
    const scriptTag = this.querySelector('script[type="application/json"]');
    if (!scriptTag) {
      console.error('[BenefitsIngredients] Missing JSON config script tag');
      return;
    }
    try {
      this.#config = JSON.parse(scriptTag.textContent ?? '{}');
    } catch (err) {
      console.error('[BenefitsIngredients] Failed to parse JSON config:', err);
    }
  }

  /** Build maps of key → element for fast lookup */
  #buildElementMaps() {
    for (const tab of this.querySelectorAll('[role="tab"]')) {
      const key = /** @type {HTMLElement} */ (tab).dataset.tab;
      if (key) this.#tabs.set(key, /** @type {HTMLElement} */ (tab));
    }
    for (const panel of this.querySelectorAll('[role="tabpanel"]')) {
      // Panel IDs are in the form "panel-{key}-{sectionId}" — extract key
      const id = panel.id;
      const key = id.replace(/^panel-/, '').replace(/-[^-]+$/, '').replace(/-/g, '_');
      this.#panels.set(key, /** @type {HTMLElement} */ (panel));
    }
  }

  /** Render the default content on initial mount */
  #renderInitialContent() {
    const data = this.#getDataForVariant('default');
    this.#renderTabContent(data);
    this.#hideMissingTabs(data);
    // Ensure the first visible tab is active
    const firstVisible = [...this.#tabs.values()].find((t) => !t.hidden);
    if (firstVisible?.dataset?.tab) {
      this.#setActiveTab(firstVisible.dataset.tab, false);
    }
  }

  /** Attach event listeners — variant changes and tab interaction */
  #attachListeners() {
    const { signal } = this.#abortController;
    const section = this.closest('.shopify-section');

    // Subscribe to Horizon variant:update on the parent section scope
    section?.addEventListener(ThemeEvents.variantUpdate, this.#onVariantChange, { signal });

    // Tab click and keyboard — delegated from the tablist
    const tablist = this.querySelector('[role="tablist"]');
    tablist?.addEventListener('click', this.handleTabClick, { signal });
    tablist?.addEventListener('keydown', this.handleKeyDown, { signal });
  }

  /**
   * Handle variant:update — swap panel content for the new variant
   * @param {CustomEvent} event
   */
  #onVariantChange = (event) => {
    const variant = event.detail?.resource;
    // Null variant = no valid combo selected; keep showing current content
    if (!variant) return;

    const variantId = variant.id;
    const data = this.#getDataForVariant(variantId);
    this.#renderTabContent(data);
    this.#hideMissingTabs(data);

    // If the active tab was hidden, move to the first available tab
    const activeTab = this.#tabs.get(this.#activeTab);
    if (activeTab?.hidden) {
      const firstVisible = [...this.#tabs.values()].find((t) => !t.hidden);
      if (firstVisible?.dataset?.tab) {
        this.#setActiveTab(firstVisible.dataset.tab);
      }
    }
  };

  /**
   * Get per-field data for a given variant ID, with per-field fallback to default.
   * @param {string|number} variantId
   * @returns {{ benefits: string|null, ingredients: string|null, how_to_use: string|null }}
   */
  #getDataForVariant(variantId) {
    const data = this.#config;
    const variantData = data[variantId] ?? data['default'] ?? {};
    return {
      benefits:    variantData.benefits    ?? data['default']?.benefits    ?? null,
      ingredients: variantData.ingredients ?? data['default']?.ingredients ?? null,
      how_to_use:  variantData.how_to_use  ?? data['default']?.how_to_use  ?? null,
    };
  }

  /**
   * Render tab panel content from a data object.
   * Only uses innerHTML for trusted hardcoded HTML from the JSON config.
   * @param {{ benefits: string|null, ingredients: string|null, how_to_use: string|null }} data
   */
  #renderTabContent(data) {
    const fieldToKey = { benefits: 'benefits', ingredients: 'ingredients', how_to_use: 'how_to_use' };
    for (const [field, key] of Object.entries(fieldToKey)) {
      const panel = this.#panels.get(key);
      if (!panel) continue;
      const content = data[field];
      if (content != null) {
        // Safe: content is hardcoded in our own JSON config, not user input
        panel.innerHTML = content;
      } else {
        panel.innerHTML = '';
      }
    }
  }

  /**
   * Show or hide tab buttons + panels based on whether their field has content.
   * @param {{ benefits: string|null, ingredients: string|null, how_to_use: string|null }} data
   */
  #hideMissingTabs(data) {
    const fields = { benefits: 'benefits', ingredients: 'ingredients', how_to_use: 'how_to_use' };
    for (const [field, key] of Object.entries(fields)) {
      const tab = this.#tabs.get(key);
      const panel = this.#panels.get(key);
      const hasContent = data[field] != null;
      if (tab) tab.hidden = !hasContent;
      if (panel) panel.hidden = !hasContent || key !== this.#activeTab;
    }
  }

  /**
   * Switch the active tab — update aria-selected, tabindex, and panel visibility.
   * @param {string} key - The tab key to activate (e.g. 'benefits')
   * @param {boolean} [animate=true] - Whether to trigger the CSS animation
   */
  #setActiveTab(key, animate = true) {
    if (!this.#tabs.has(key)) return;
    this.#activeTab = key;

    for (const [tabKey, tab] of this.#tabs.entries()) {
      const isActive = tabKey === key;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    }

    for (const [panelKey, panel] of this.#panels.entries()) {
      const isActive = panelKey === key;
      const hasContent = panel.innerHTML.trim() !== '';
      panel.hidden = !isActive || !hasContent;

      if (isActive && animate) {
        // Restart animation by removing and re-adding the class
        panel.classList.remove('benefits-ingredients__panel--animate');
        void panel.offsetWidth; // force reflow
        panel.classList.add('benefits-ingredients__panel--animate');
      }
    }
  }
}

if (!customElements.get('benefits-ingredients')) {
  customElements.define('benefits-ingredients', BenefitsIngredients);
}
