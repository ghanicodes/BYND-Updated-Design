/**
 * BYND Human — Store, Cart Drawer & Live Catalog Search
 * Professional eCommerce client layer:
 * - Persistent Cart Drawer with localStorage
 * - Live Header Catalog Search with instant filtering
 * - Unified across standalone HTML and prototype pages
 */

(function () {
  'use strict';

  // --- Product Catalog Database ---
  const CATALOG = [
    {
      id: 'elite',
      name: 'BYND+ Elite Red Light (Full Body System)',
      category: 'Red Light Therapy',
      categoryKey: 'rlt',
      price: 6000,
      priceLabel: '$6,000.00',
      badge: 'In stock',
      image: 'assets/elite-full-body.webp',
      href: 'Product.dc.html?p=elite',
      keywords: 'elite full body red light panel photobiomodulation stand 660nm 850nm nir targeted therapy',
      shortDesc: 'Full-body red and near-infrared photobiomodulation system with commercial-grade stand.'
    },
    {
      id: 'mini',
      name: 'BYND+ Precision Red Light (mini)',
      category: 'Red Light Therapy',
      categoryKey: 'rlt',
      price: 3500,
      priceLabel: '$3,500.00',
      badge: 'Targeted',
      image: 'assets/precision-mini.webp',
      href: 'Product.dc.html?p=mini',
      keywords: 'precision mini desk mount targeted red light panel 660nm 850nm nir photobiomodulation',
      shortDesc: 'Compact, targeted dual-wavelength desk device for facial rejuvenation and joint recovery.'
    },
    {
      id: 'protocol',
      name: 'BYND+ Elite 90-Day Red Light Reset Protocol',
      category: 'Protocols',
      categoryKey: 'protocol',
      price: 6000,
      priceLabel: '$6,000.00',
      badge: 'Bundle',
      image: 'assets/protocol-bundle.webp',
      href: 'Product.dc.html?p=protocol',
      keywords: 'protocol 90 day reset bundle system stack elite supplements whey creatine mobility omega daily routine',
      shortDesc: 'The complete 90-day reset routine: Elite Full Body system paired with the daily supplement stack.'
    },
    {
      id: 'whey',
      name: 'Premium Whey Protein',
      category: 'Supplements',
      categoryKey: 'supps',
      price: 55,
      priceLabel: '$55.00',
      badge: 'Best seller',
      image: 'assets/whey-vanilla.webp',
      href: 'Product.dc.html?p=whey',
      keywords: 'whey protein powder isolate concentrate vanilla chocolate cake recovery lean muscle daily nutrition',
      shortDesc: '22g protein per serving from cold-processed whey isolate and concentrate.'
    },
    {
      id: 'creatine',
      name: 'Creatine Monohydrate',
      category: 'Supplements',
      categoryKey: 'supps',
      price: 34,
      priceLabel: '$34.00',
      badge: 'In stock',
      image: 'assets/creatine.webp',
      href: 'Product.dc.html?p=creatine',
      keywords: 'creatine monohydrate strength cellular energy atp power muscle powder 250g performance',
      shortDesc: '100% pure micronized creatine monohydrate to support muscle power and cellular energy.'
    },
    {
      id: 'mobility',
      name: 'Platinum Mobility+ Capsules',
      category: 'Supplements',
      categoryKey: 'supps',
      price: 42,
      priceLabel: '$42.00',
      badge: 'In stock',
      image: 'assets/mobility.webp',
      href: 'Product.dc.html?p=mobility',
      keywords: 'platinum mobility capsules joint comfort flexibility cartilage recovery 60 capsules',
      shortDesc: 'Synergistic botanical and nutrient complex for joint ease, cartilage integrity, and flexibility.'
    },
    {
      id: 'omega',
      name: 'Omega 3+ Fish Oil',
      category: 'Supplements',
      categoryKey: 'supps',
      price: 38,
      priceLabel: '$38.00',
      badge: 'In stock',
      image: 'assets/omega.webp',
      href: 'Product.dc.html?p=omega',
      keywords: 'omega 3 fish oil softgels epa dha cardiovascular heart brain recovery wild caught',
      shortDesc: 'High-potency purified wild fish oil with concentrated EPA and DHA for heart and cognitive vitality.'
    }
  ];

  const STORAGE_KEY = 'bynd_cart_v1';
  const FREE_SHIPPING_THRESHOLD = 150;

  // --- Cart State Management ---
  function loadCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not read cart from localStorage', e);
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not write cart to localStorage', e);
    }
    updateAllBadges();
    renderCart();
    window.dispatchEvent(new CustomEvent('bynd:cart-updated', { detail: { items } }));
  }

  function getCartSubtotal(items) {
    return items.reduce((sum, it) => sum + (Number(it.price) || 0) * (it.qty || 1), 0);
  }

  function getCartCount(items) {
    return items.reduce((sum, it) => sum + (it.qty || 1), 0);
  }

  function formatMoney(amount) {
    return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // --- Cart Actions ---
  const Cart = {
    getItems: loadCart,

    addItem: function (item) {
      if (!item || !item.id) return;
      const items = loadCart();
      const variantKey = item.variant ? String(item.variant).trim() : '';
      const existing = items.find(i => i.id === item.id && (i.variant || '') === variantKey);

      const addQty = Math.max(1, parseInt(item.qty, 10) || 1);

      if (existing) {
        existing.qty = (existing.qty || 1) + addQty;
      } else {
        items.push({
          id: item.id,
          key: item.key || item.id,
          name: item.name || 'BYND Product',
          variant: variantKey,
          price: Number(item.price) || 0,
          priceLabel: item.priceLabel || formatMoney(item.price),
          qty: addQty,
          image: item.image || 'assets/bynd-plus-mark.png',
          href: item.href || 'Collection.dc.html'
        });
      }

      saveCart(items);
      Cart.open();
    },

    updateQty: function (index, delta) {
      const items = loadCart();
      if (!items[index]) return;
      items[index].qty = (items[index].qty || 1) + delta;
      if (items[index].qty <= 0) {
        items.splice(index, 1);
      }
      saveCart(items);
    },

    removeItem: function (index) {
      const items = loadCart();
      if (!items[index]) return;
      items.splice(index, 1);
      saveCart(items);
    },

    clear: function () {
      saveCart([]);
    },

    open: function () {
      ensureUI();
      renderCart();
      const drawer = document.getElementById('bynd-cart-drawer');
      const backdrop = document.getElementById('bynd-cart-backdrop');
      if (drawer && backdrop) {
        drawer.classList.add('is-open');
        backdrop.classList.add('is-visible');
        document.body.classList.add('bynd-modal-open');
        drawer.setAttribute('aria-hidden', 'false');
        // Close search if open
        Search.close();
      }
    },

    close: function () {
      const drawer = document.getElementById('bynd-cart-drawer');
      const backdrop = document.getElementById('bynd-cart-backdrop');
      if (drawer && backdrop) {
        drawer.classList.remove('is-open');
        backdrop.classList.remove('is-visible');
        document.body.classList.remove('bynd-modal-open');
        drawer.setAttribute('aria-hidden', 'true');
      }
    }
  };

  // --- Search Actions ---
  const Search = {
    open: function () {
      ensureUI();
      const modal = document.getElementById('bynd-search-modal');
      const backdrop = document.getElementById('bynd-search-backdrop');
      const input = document.getElementById('bynd-search-input');
      if (modal && backdrop) {
        modal.classList.add('is-open');
        backdrop.classList.add('is-visible');
        document.body.classList.add('bynd-modal-open');
        modal.setAttribute('aria-hidden', 'false');
        // Close cart if open
        Cart.close();
        if (input) {
          setTimeout(() => input.focus(), 80);
          Search.query(input.value);
        }
      }
    },

    close: function () {
      const modal = document.getElementById('bynd-search-modal');
      const backdrop = document.getElementById('bynd-search-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('is-open');
        backdrop.classList.remove('is-visible');
        document.body.classList.remove('bynd-modal-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    },

    query: function (rawQuery) {
      const query = (rawQuery || '').trim().toLowerCase();
      const resultsContainer = document.getElementById('bynd-search-results');
      const suggestions = document.getElementById('bynd-search-suggestions');
      const clearBtn = document.getElementById('bynd-search-clear');

      if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
      }

      if (!resultsContainer) return;

      if (!query) {
        if (suggestions) suggestions.style.display = 'block';
        resultsContainer.innerHTML = '';
        return;
      }

      if (suggestions) suggestions.style.display = 'none';

      const words = query.split(/\s+/).filter(Boolean);
      const matches = CATALOG.filter(p => {
        const text = (p.name + ' ' + p.category + ' ' + p.keywords + ' ' + p.shortDesc).toLowerCase();
        return words.every(w => text.includes(w));
      });

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div class="bynd-search-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8A939C" stroke-width="1.5">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M21 21l-4.35-4.35"></path>
              <path d="M8 11h6"></path>
            </svg>
            <p class="bynd-search-empty-title">No products found for "${escapeHtml(query)}"</p>
            <p class="bynd-search-empty-sub">Try searching for "red light", "creatine", "whey", or "protocol".</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = matches.map(p => `
        <a href="${p.href}" class="bynd-search-item" onclick="window.ByndSearch.close()">
          <div class="bynd-search-thumb">
            <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
          </div>
          <div class="bynd-search-info">
            <span class="bynd-search-cat">${escapeHtml(p.category)}</span>
            <span class="bynd-search-name">${escapeHtml(p.name)}</span>
            <span class="bynd-search-price">${p.priceLabel}</span>
          </div>
          <span class="bynd-search-arrow" aria-hidden="true">→</span>
        </a>
      `).join('');
    }
  };

  // --- Utility Helpers ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function updateAllBadges() {
    const items = loadCart();
    const count = getCartCount(items);
    // Update standalone count elements
    document.querySelectorAll('.cart-count, [data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'flex';
    });
  }

  // --- Render Cart Drawer HTML ---
  function renderCart() {
    const items = loadCart();
    const count = getCartCount(items);
    const subtotal = getCartSubtotal(items);

    const titleCount = document.getElementById('bynd-cart-header-count');
    if (titleCount) titleCount.textContent = `(${count})`;

    const body = document.getElementById('bynd-cart-body');
    const footer = document.getElementById('bynd-cart-footer');
    const shippingBar = document.getElementById('bynd-cart-shipping-bar');

    if (shippingBar) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        shippingBar.innerHTML = `
          <div class="bynd-shipping-progress is-complete">
            <div class="bynd-shipping-fill" style="width:100%"></div>
          </div>
          <p class="bynd-shipping-text">✓ You've unlocked <strong>Free Standard Shipping</strong></p>
        `;
      } else {
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        shippingBar.innerHTML = `
          <div class="bynd-shipping-progress">
            <div class="bynd-shipping-fill" style="width:${pct}%"></div>
          </div>
          <p class="bynd-shipping-text">Add <strong>${formatMoney(remaining)}</strong> more to unlock Free Shipping</p>
        `;
      }
    }

    if (!body || !footer) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="bynd-cart-empty">
          <div class="bynd-cart-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0A0E12" stroke-width="1.3">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h3 class="bynd-cart-empty-title">Your cart is currently empty</h3>
          <p class="bynd-cart-empty-sub">Explore our medical-grade red light panels and daily supplement stack.</p>
          <a href="Collection.dc.html" class="bynd-btn-primary" onclick="window.ByndCart.close()">Shop All Products</a>
        </div>
      `;
      footer.style.display = 'none';
      return;
    }

    footer.style.display = 'block';

    body.innerHTML = `
      <div class="bynd-cart-items">
        ${items.map((it, idx) => `
          <div class="bynd-cart-item" data-index="${idx}">
            <a href="${it.href}" class="bynd-cart-thumb" onclick="window.ByndCart.close()">
              <img src="${it.image}" alt="${escapeHtml(it.name)}">
            </a>
            <div class="bynd-cart-details">
              <div class="bynd-cart-row-top">
                <a href="${it.href}" class="bynd-cart-title" onclick="window.ByndCart.close()">${escapeHtml(it.name)}</a>
                <button class="bynd-cart-remove" data-action="remove" data-index="${idx}" aria-label="Remove ${escapeHtml(it.name)}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              ${it.variant ? `<span class="bynd-cart-variant">${escapeHtml(it.variant)}</span>` : ''}
              <div class="bynd-cart-row-bottom">
                <div class="bynd-qty-selector">
                  <button class="bynd-qty-btn" data-action="dec" data-index="${idx}" aria-label="Decrease quantity">−</button>
                  <span class="bynd-qty-val">${it.qty}</span>
                  <button class="bynd-qty-btn" data-action="inc" data-index="${idx}" aria-label="Increase quantity">+</button>
                </div>
                <div class="bynd-cart-line-price">
                  ${formatMoney((it.price || 0) * (it.qty || 1))}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const subtotalEl = document.getElementById('bynd-cart-subtotal-val');
    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(subtotal);
    }
  }

  // --- Build & Inject Modals if not present ---
  function ensureUI() {
    if (document.getElementById('bynd-cart-drawer')) return;

    // 1. Cart Backdrop & Drawer
    const cartWrapper = document.createElement('div');
    cartWrapper.id = 'bynd-cart-root';
    cartWrapper.innerHTML = `
      <div class="bynd-modal-backdrop" id="bynd-cart-backdrop"></div>
      <aside class="bynd-cart-drawer" id="bynd-cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping Cart" aria-hidden="true">
        <div class="bynd-cart-header">
          <div class="bynd-cart-header-title">
            <span>Your Cart</span>
            <span class="bynd-cart-count-badge" id="bynd-cart-header-count">(0)</span>
          </div>
          <button class="bynd-drawer-close" id="bynd-cart-close" aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="bynd-cart-shipping-bar" id="bynd-cart-shipping-bar"></div>

        <div class="bynd-cart-body" id="bynd-cart-body"></div>

        <div class="bynd-cart-footer" id="bynd-cart-footer">
          <div class="bynd-cart-summary">
            <div class="bynd-summary-row">
              <span class="bynd-summary-label">Subtotal</span>
              <span class="bynd-summary-val" id="bynd-cart-subtotal-val">$0.00</span>
            </div>
            <p class="bynd-summary-note">Taxes, shipping & duties calculated at checkout.</p>
          </div>

          <div class="bynd-cart-ctas">
            <button class="bynd-btn-checkout" id="bynd-checkout-btn">
              <span>Proceed to Checkout</span>
              <span class="bynd-btn-arrow">→</span>
            </button>
            <button class="bynd-btn-continue" id="bynd-continue-btn">Continue Shopping</button>
          </div>

          <div class="bynd-cart-trust-pills">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009CFF" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              256-Bit Secure
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009CFF" stroke-width="2"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"></path><path d="M9 12l2 2 4-4"></path></svg>
              Warranty Backed
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009CFF" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Tracked Delivery
            </span>
          </div>
        </div>
      </aside>

      <!-- Simulated Checkout Modal -->
      <div class="bynd-modal-backdrop" id="bynd-checkout-backdrop"></div>
      <div class="bynd-checkout-modal" id="bynd-checkout-modal" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="bynd-checkout-card">
          <div class="bynd-checkout-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00E3FF" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 class="bynd-checkout-title">Prototype Checkout Simulation</h3>
          <p class="bynd-checkout-desc">
            This storefront is a luxury client review prototype. Your cart contents and selections are saved in your local session.
          </p>
          <div class="bynd-checkout-order-box" id="bynd-checkout-order-box"></div>
          <div class="bynd-checkout-actions">
            <button class="bynd-btn-primary" id="bynd-checkout-close-btn">Return to Store</button>
            <button class="bynd-btn-outline" id="bynd-checkout-clear-btn">Clear Cart &amp; Reset</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(cartWrapper);

    // 2. Search Backdrop & Modal
    const searchWrapper = document.createElement('div');
    searchWrapper.id = 'bynd-search-root';
    searchWrapper.innerHTML = `
      <div class="bynd-modal-backdrop" id="bynd-search-backdrop"></div>
      <div class="bynd-search-modal" id="bynd-search-modal" role="dialog" aria-modal="true" aria-label="Search Catalog" aria-hidden="true">
        <div class="bynd-search-container">
          <div class="bynd-search-bar">
            <span class="bynd-search-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="M20 20l-4-4"></path>
              </svg>
            </span>
            <input type="text" id="bynd-search-input" class="bynd-search-input" placeholder="Search devices, protocols, supplements..." autocomplete="off">
            <button class="bynd-search-clear" id="bynd-search-clear" aria-label="Clear query" style="display:none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <button class="bynd-search-close" id="bynd-search-close" aria-label="Close search">
              <span class="bynd-esc-pill">ESC</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="bynd-search-suggestions" id="bynd-search-suggestions">
            <span class="bynd-suggestions-label">Popular Searches</span>
            <div class="bynd-suggestion-chips">
              <button class="bynd-chip-tag" data-tag="Red Light">Red Light Therapy</button>
              <button class="bynd-chip-tag" data-tag="Protocol">90-Day Protocol</button>
              <button class="bynd-chip-tag" data-tag="Protein">Whey Protein</button>
              <button class="bynd-chip-tag" data-tag="Creatine">Creatine</button>
              <button class="bynd-chip-tag" data-tag="Mobility">Mobility+</button>
              <button class="bynd-chip-tag" data-tag="Omega">Omega 3+</button>
            </div>
          </div>

          <div class="bynd-search-results" id="bynd-search-results"></div>
        </div>
      </div>
    `;
    document.body.appendChild(searchWrapper);

    // --- Wire Up Event Listeners inside Modals ---
    // Cart Drawer close & buttons
    document.getElementById('bynd-cart-close')?.addEventListener('click', Cart.close);
    document.getElementById('bynd-cart-backdrop')?.addEventListener('click', Cart.close);
    document.getElementById('bynd-continue-btn')?.addEventListener('click', Cart.close);

    // Cart Body event delegation for inc / dec / remove
    document.getElementById('bynd-cart-body')?.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const index = parseInt(btn.dataset.index, 10);
      if (isNaN(index)) return;

      if (action === 'inc') {
        Cart.updateQty(index, 1);
      } else if (action === 'dec') {
        Cart.updateQty(index, -1);
      } else if (action === 'remove') {
        Cart.removeItem(index);
      }
    });

    // Checkout simulated modal
    const checkoutModal = document.getElementById('bynd-checkout-modal');
    const checkoutBackdrop = document.getElementById('bynd-checkout-backdrop');
    const checkoutOrderBox = document.getElementById('bynd-checkout-order-box');

    document.getElementById('bynd-checkout-btn')?.addEventListener('click', function () {
      const items = loadCart();
      if (items.length === 0) return;
      Cart.close();
      if (checkoutOrderBox) {
        checkoutOrderBox.innerHTML = `
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:#0A0E12">Simulated Order (${items.length} items):</div>
          <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;padding-right:4px">
            ${items.map(it => `
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#34383D">
                <span>${it.qty}× ${escapeHtml(it.name)} ${it.variant ? `(${escapeHtml(it.variant)})` : ''}</span>
                <span style="font-weight:600">${formatMoney((it.price || 0) * (it.qty || 1))}</span>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:12px;padding-top:10px;border-top:1px dashed #C9D2DA;display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#0A0E12">
            <span>Estimated Total</span>
            <span>${formatMoney(getCartSubtotal(items))}</span>
          </div>
        `;
      }
      checkoutModal?.classList.add('is-open');
      checkoutBackdrop?.classList.add('is-visible');
    });

    function closeCheckout() {
      checkoutModal?.classList.remove('is-open');
      checkoutBackdrop?.classList.remove('is-visible');
    }

    document.getElementById('bynd-checkout-close-btn')?.addEventListener('click', closeCheckout);
    document.getElementById('bynd-checkout-clear-btn')?.addEventListener('click', function () {
      Cart.clear();
      closeCheckout();
    });
    checkoutBackdrop?.addEventListener('click', closeCheckout);

    // Search events
    document.getElementById('bynd-search-close')?.addEventListener('click', Search.close);
    document.getElementById('bynd-search-backdrop')?.addEventListener('click', Search.close);

    const searchInput = document.getElementById('bynd-search-input');
    let searchDebounceTimer = null;
    searchInput?.addEventListener('input', function () {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        Search.query(this.value);
      }, 120);
    });

    document.getElementById('bynd-search-clear')?.addEventListener('click', function () {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        Search.query('');
      }
    });

    // Quick tag chips
    document.querySelectorAll('.bynd-chip-tag').forEach(chip => {
      chip.addEventListener('click', function () {
        const tag = this.dataset.tag || this.textContent;
        if (searchInput) {
          searchInput.value = tag;
          searchInput.focus();
          Search.query(tag);
        }
      });
    });

    // Global Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        Cart.close();
        Search.close();
        closeCheckout();
      }
    });
  }

  // --- Attach Triggers in Header & Document ---
  function bindTriggers() {
    // Intercept clicks on cart buttons
    document.addEventListener('click', function (e) {
      const cartTrigger = e.target.closest('[aria-label="Cart"], #cart-toggle, [data-cart-toggle]');
      if (cartTrigger) {
        e.preventDefault();
        Cart.open();
        return;
      }

      const searchTrigger = e.target.closest('[aria-label="Search"], #search-toggle, [data-search-toggle]');
      if (searchTrigger) {
        e.preventDefault();
        Search.open();
        return;
      }
    }, true);
  }

  // --- Initializer ---
  function init() {
    ensureUI();
    bindTriggers();
    updateAllBadges();
    renderCart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global API
  window.ByndCart = Cart;
  window.ByndSearch = Search;
  window.ByndCatalog = CATALOG;

})();
