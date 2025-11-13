/**
 * LUXPORT - Main Application Script
 * ============================================================================
 * Handles:
 * - Header state management
 * - Navigation active states
 * - Hero slider animations
 * - Scroll reveal animations with GSAP
 * - Accessibility and reduced motion support
 * ============================================================================
 */

(function () {
  'use strict';

  // =========================================================================
  // UTILITIES
  // =========================================================================

  /**
   * Query selector helper
   * @param {string} sel - CSS selector
   * @param {Element} ctx - Context element (default: document)
   * @returns {Array} Array of matching elements
   */
  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /**
   * Event listener helper
   * @param {Element} el - Target element
   * @param {string} evt - Event name
   * @param {Function} cb - Callback function
   * @param {Object} opts - Event listener options
   */
  const on = (el, evt, cb, opts) => el && el.addEventListener(evt, cb, opts);

  /**
   * Load external script dynamically
   * @param {string} src - Script URL
   * @returns {Promise} Resolves when script loads
   */
  const loadScript = (src) =>
    new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });

  /**
   * Check if user prefers reduced motion
   * @returns {boolean}
   */
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================================
  // HEADER & NAVIGATION
  // =========================================================================

  /**
   * Mark active navigation link based on current page
   */
  const markActiveNav = () => {
    const header = document.querySelector('header[data-site-header]');
    if (!header) return;

    const curr = location.pathname.toLowerCase();

    header.querySelectorAll('nav a').forEach((a) => {
      const hrefAttr = a.getAttribute('href') || '';
      const target = new URL(hrefAttr, location.href).pathname.toLowerCase();

      const isHome =
        target.endsWith('/index.html') ||
        hrefAttr === 'index.html' ||
        target === '/';

      const match = isHome
        ? curr.endsWith('/index.html') ||
          curr === target.replace(/index\.html$/, '') ||
          curr.endsWith('/')
        : curr === target || curr.endsWith(target);

      a.classList.toggle('text-emerald-600', match);
      a.classList.toggle('font-semibold', match);
    });
  };

  /**
   * Update header scroll state
   */
  const updateHeader = () => {
    const header = document.querySelector('header[data-site-header]');
    if (!header) return;

    const scrolled = window.scrollY > 50;
    header.classList.toggle('is-scrolled', scrolled);
  };

  // =========================================================================
  // HERO SLIDER
  // =========================================================================

  /**
   * Initialize hero slider with auto-rotation
   */
  const initHero = () => {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return;

    const slides = $('.hero-slide', hero);
    if (slides.length <= 1) {
      if (slides.length === 1) slides[0].classList.add('active');
      return;
    }

    let current = 0;

    const activate = (i) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
    };

    activate(current);

    // Rotate slides every 6.5 seconds
    setInterval(() => {
      current = (current + 1) % slides.length;
      activate(current);
    }, 6500);
  };

  // =========================================================================
  // SCROLL ANIMATIONS WITH GSAP
  // =========================================================================

  /**
   * Initialize GSAP scroll animations
   */
  const initGSAPAnimations = () => {
    if (!window.gsap) return;

    const { gsap } = window;
    const ST = window.ScrollTrigger;

    if (ST) gsap.registerPlugin(ST);

    // Respect user's motion preferences
    if (prefersReducedMotion()) return;

    // Set initial states for all reveal elements
    gsap.utils.toArray('.reveal').forEach((el) => {
      const a = el.dataset.animate;
      const sx = a === 'fade-left' ? 40 : a === 'fade-right' ? -40 : 0;
      const sy = !a || a === 'fade-up' || a === 'flip-up' || a === 'zoom-in' ? 40 : 0;
      const sc = a === 'zoom-in' ? 0.94 : 1;
      const rx = a === 'flip-up' ? 8 : 0;

      gsap.set(el, {
        opacity: 0,
        x: sx,
        y: sy,
        scale: sc,
        rotationX: rx,
        transformOrigin: rx ? 'bottom center' : '50% 50%',
        force3D: true,
      });
    });

    if (!ST) {
      // Fallback without ScrollTrigger
      gsap.to('.reveal', {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
      });
      return;
    }

    // Batch reveal animations
    ST.batch('.reveal', {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotationX: 0,
          ease: 'power3.out',
          duration: (i, t) => (t.closest('[data-hero]') ? 1.05 : 0.85),
          stagger: { each: 0.09, from: 'start' },
          force3D: true,
          overwrite: 'auto',
        });
      },
    });

    // Image/video animations (exclude hero images)
    ST.batch('img:not(header img):not(.hero-slide img), video:not(header video)', {
      start: 'top 94%',
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 30, scale: 0.98, force3D: true },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.06,
            overwrite: 'auto',
          }
        );
      },
    });

    // Generic content animations
    const genericSel =
      'h1:not(.reveal),h2:not(.reveal),h3:not(.reveal),h4:not(.reveal),h5:not(.reveal),h6:not(.reveal),p:not(.reveal),li:not(.reveal),.surface:not(.reveal),.feature-card:not(.reveal)';

    ST.batch(genericSel, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { opacity: 0, y: 28, force3D: true },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.06,
            overwrite: 'auto',
          }
        );
      },
    });

    // Hero entrance timeline
    const hero = document.querySelector('[data-hero]');
    if (hero) {
      const kids = Array.from(
        hero.querySelectorAll('.reveal, h1, p, a, .btn-primary, .btn-outline')
      );
      if (kids.length) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(
          kids,
          { opacity: 0, y: 36, force3D: true },
          { opacity: 1, y: 0, duration: 1.05, stagger: 0.12, overwrite: 'auto' }
        );
      }
    }
  };

  /**
   * Ensure GSAP is loaded and initialize animations
   */
  const ensureGSAP = async () => {
    try {
      if (!document.querySelector('.reveal')) return;

      if (!window.gsap) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js');
      }

      if (!window.ScrollTrigger) {
        await loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'
        );
      }

      initGSAPAnimations();
    } catch (e) {
      console.warn('GSAP animation initialization failed:', e);
    }
  };

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  /**
   * Boot application
   */
  const boot = async () => {
    // Prevent animation flash
    document.documentElement.classList.add('reveal-init');

    // Initialize components
    updateHeader();
    markActiveNav();
    initHero();

    // Setup scroll listener
    on(window, 'scroll', updateHeader, { passive: true });

    // Handle animations
    const reduceMotion = prefersReducedMotion();
    const start = () => {
      document.documentElement.classList.replace('reveal-init', 'reveal-ready');
    };

    if (reduceMotion) {
      // Show all reveals immediately if reduced motion is preferred
      document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('is-visible');
      });
      start();
    } else {
      // Load GSAP and initialize animations
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          await ensureGSAP();
          start();
        }, { timeout: 1200 });
      } else {
        setTimeout(async () => {
          await ensureGSAP();
          start();
        }, 200);
      }
    }
  };

  // Start application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
