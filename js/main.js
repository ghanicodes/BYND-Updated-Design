/* ============================================================
   BYND HUMAN — Main JavaScript
   Sticky header, mobile nav, chip filters, product scroll,
   accordions, scroll reveals, newsletter feedback,
   back-to-top, scroll progress
   ============================================================ */

(function () {
  'use strict';

  /* --- Reduced Motion Check --- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------- */
  /* Scroll Progress Indicator                                  */
  /* --------------------------------------------------------- */
  var scrollProgress = document.getElementById('scroll-progress');
  function updateScrollProgress() {
    if (!scrollProgress) return;
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  /* --------------------------------------------------------- */
  /* Sticky Header — add shadow on scroll                      */
  /* --------------------------------------------------------- */
  const header = document.getElementById('site-header');

  /* --------------------------------------------------------- */
  /* Back to Top Button                                         */
  /* --------------------------------------------------------- */
  var backToTop = document.getElementById('back-to-top');

  /* Combined scroll handler (header shadow + progress + back-to-top) */
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        if (header) header.classList.toggle('scrolled', scrollY > 10);
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 500);
        updateScrollProgress();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --------------------------------------------------------- */
  /* Mobile Nav — hamburger toggle                             */
  /* --------------------------------------------------------- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');

  function openMobileNav() {
    mobileNav.classList.add('open');
    mobileOverlay.classList.add('visible');
    menuToggle.classList.add('is-active');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    mobileOverlay.classList.remove('visible');
    menuToggle.classList.remove('is-active');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle && mobileNav && mobileOverlay) {
    menuToggle.setAttribute('aria-expanded', 'false');

    menuToggle.addEventListener('click', function () {
      const isOpen = mobileNav.classList.contains('open');
      isOpen ? closeMobileNav() : openMobileNav();
    });
    mobileOverlay.addEventListener('click', closeMobileNav);

    // Close when clicking a nav link
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMobileNav();
      });
    });

    // Close on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) closeMobileNav();
    });
  }

  /* --------------------------------------------------------- */
  /* Category Chip Filtering                                    */
  /* --------------------------------------------------------- */
  const chipsRow = document.getElementById('chips-row');
  const productRow = document.getElementById('product-row');

  if (chipsRow && productRow) {
    const chips = chipsRow.querySelectorAll('.chip');
    const cards = productRow.querySelectorAll('.product-card');

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        const cat = this.dataset.cat;

        // Update active chip
        chips.forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');

        // Filter cards with smooth transition
        cards.forEach(function (card) {
          if (cat === 'all' || card.dataset.cat === cat) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(8px)';
            requestAnimationFrame(function () {
              card.style.transition = 'opacity 300ms ease, transform 300ms ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.style.display = 'none';
          }
        });

        // Reset scroll position
        productRow.scrollLeft = 0;
      });
    });
  }

  /* --------------------------------------------------------- */
  /* Product Row — prev / next scroll                          */
  /* --------------------------------------------------------- */
  const prevBtn = document.getElementById('shop-prev');
  const nextBtn = document.getElementById('shop-next');

  function scrollProductRow(direction) {
    if (!productRow) return;
    var amount = direction * Math.max(240, productRow.clientWidth * 0.8);
    productRow.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { scrollProductRow(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { scrollProductRow(1); });

  /* --------------------------------------------------------- */
  /* Accordions — Principles & FAQ                              */
  /* --------------------------------------------------------- */
  function initAccordionGroup(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var items = container.querySelectorAll('.accordion-item');

    items.forEach(function (item) {
      var trigger = item.querySelector('.accordion-trigger');
      var panel = item.querySelector('.accordion-panel');
      var icon = item.querySelector('.accordion-icon');

      if (!trigger || !panel) return;

      // Set initial state + aria
      if (item.classList.contains('open')) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        if (icon) icon.textContent = '−';
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        panel.style.maxHeight = '0px';
        if (icon) icon.textContent = '+';
        trigger.setAttribute('aria-expanded', 'false');
      }

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');

        // Close all siblings
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            var otherPanel = other.querySelector('.accordion-panel');
            var otherIcon = other.querySelector('.accordion-icon');
            var otherTrigger = other.querySelector('.accordion-trigger');
            if (otherPanel) otherPanel.style.maxHeight = '0px';
            if (otherIcon) otherIcon.textContent = '+';
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle this item
        if (isOpen) {
          item.classList.remove('open');
          panel.style.maxHeight = '0px';
          if (icon) icon.textContent = '+';
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
          if (icon) icon.textContent = '−';
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  initAccordionGroup('principles-accordion');
  initAccordionGroup('faq-accordion');

  /* --------------------------------------------------------- */
  /* Scroll Reveal — IntersectionObserver                       */
  /* --------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      // Fallback: show everything
      revealElements.forEach(function (el) { el.classList.add('visible'); });
    }
  } else {
    // Reduced motion: show everything immediately
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --------------------------------------------------------- */
  /* Newsletter Form — simple feedback                          */
  /* --------------------------------------------------------- */
  var newsletterBtn = document.getElementById('newsletter-btn');
  var newsletterEmail = document.getElementById('newsletter-email');
  var newsletterMsg = document.getElementById('newsletter-msg');

  if (newsletterBtn && newsletterEmail && newsletterMsg) {
    // Enter key submits
    newsletterEmail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') newsletterBtn.click();
    });

    newsletterBtn.addEventListener('click', function () {
      var email = newsletterEmail.value.trim();
      if (!email || !email.includes('@')) {
        newsletterMsg.textContent = 'Please enter a valid email address.';
        newsletterMsg.style.color = '#FF6B6B';
        newsletterEmail.style.borderColor = '#FF6B6B';
        setTimeout(function () {
          newsletterEmail.style.borderColor = '';
        }, 2000);
        return;
      }
      newsletterMsg.textContent = 'Thank you! You\'re on the list.';
      newsletterMsg.style.color = '#00E3FF';
      newsletterEmail.value = '';
      newsletterBtn.textContent = '✓ Signed up';
      newsletterBtn.disabled = true;
      newsletterBtn.style.background = '#00E3FF';
      newsletterBtn.style.color = '#0A0E12';
      setTimeout(function () {
        newsletterBtn.textContent = 'Sign up';
        newsletterBtn.disabled = false;
        newsletterBtn.style.background = '';
        newsletterBtn.style.color = '';
        newsletterMsg.textContent = 'Unsubscribe anytime.';
        newsletterMsg.style.color = '';
      }, 4000);
    });
  }

  /* --------------------------------------------------------- */
  /* Active Nav Highlight                                       */
  /* --------------------------------------------------------- */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var navLinks = document.querySelectorAll('.header-nav a');
  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && (href === currentPage || href.split('?')[0] === currentPage)) {
      link.classList.add('active');
    }
  });

})();
