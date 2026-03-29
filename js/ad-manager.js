/* =====================================================
   AD MANAGER — js/ad-manager.js
   English Explorer

   Public API
   ──────────
   initDelayedModuleAd(screenId)
     Call when entering any screen. Starts a countdown
     (AD_CONFIG.AD_DELAY_MS) that only ticks while the
     tab is visible. Shows the ad banner once the delay
     elapses. Has no effect on non-module screens.

   destroyDelayedModuleAd()
     Call when leaving a screen (before entering the
     next one). Cancels any pending timer and hides the
     ad container immediately.
   ===================================================== */

'use strict';

(function () {

  // Screens that should show a delayed ad.
  // Home ('home') and Parent Zone ('parents') are intentionally excluded.
  const MODULE_SCREENS = new Set(['letters', 'trace', 'phonics', 'words', 'game', 'adventure']);

  // ── State ──────────────────────────────────────────────────────────
  let _timer            = null;   // pending setTimeout handle
  let _elapsedMs        = 0;      // accumulated visible time so far
  let _tickStart        = null;   // timestamp when current visible-tick started
  let _visibilityOff    = null;   // bound visibilitychange handler (for cleanup)
  let _adInjected       = false;  // true once real AdSense markup has been inserted

  // ── Public: start ──────────────────────────────────────────────────
  function initDelayedModuleAd(screenId) {
    // Always clean up any previous session first.
    destroyDelayedModuleAd();

    if (!MODULE_SCREENS.has(screenId)) return;

    _elapsedMs = 0;

    if (!document.hidden) {
      _tickStart = Date.now();
    }

    _scheduleNext();

    // Pause/resume the countdown when the user hides the tab.
    _visibilityOff = _handleVisibilityChange;
    document.addEventListener('visibilitychange', _visibilityOff);
  }

  // ── Public: stop ───────────────────────────────────────────────────
  function destroyDelayedModuleAd() {
    // Cancel pending timer.
    if (_timer !== null) {
      clearTimeout(_timer);
      _timer = null;
    }

    // Remove visibility listener.
    if (_visibilityOff !== null) {
      document.removeEventListener('visibilitychange', _visibilityOff);
      _visibilityOff = null;
    }

    // Reset counters.
    _elapsedMs = 0;
    _tickStart = null;

    // Hide the ad container right away (no linger).
    const container = document.getElementById('module-ad-container');
    if (container) {
      container.classList.remove('ad-visible');
      container.classList.add('hidden');
    }

    // Remove extra bottom padding from every screen-scroll.
    document.querySelectorAll('.screen-scroll.ad-active-padding').forEach(function (el) {
      el.classList.remove('ad-active-padding');
    });
  }

  // ── Internal: schedule the next check ─────────────────────────────
  function _scheduleNext() {
    if (document.hidden) return;   // don't schedule while hidden

    const remaining = AD_CONFIG.AD_DELAY_MS - _elapsedMs;
    if (remaining <= 0) {
      _showAd();
      return;
    }

    _timer = setTimeout(function () {
      _timer = null;
      // Accumulate time from this tick.
      if (_tickStart !== null) {
        _elapsedMs += Date.now() - _tickStart;
        _tickStart = null;
      }
      _showAd();
    }, remaining);
  }

  // ── Internal: visibility change handler ───────────────────────────
  function _handleVisibilityChange() {
    if (document.hidden) {
      // Tab became hidden → pause the tick.
      if (_tickStart !== null) {
        _elapsedMs += Date.now() - _tickStart;
        _tickStart = null;
      }
      if (_timer !== null) {
        clearTimeout(_timer);
        _timer = null;
      }
    } else {
      // Tab became visible again → resume.
      _tickStart = Date.now();
      _scheduleNext();
    }
  }

  // ── Internal: reveal the ad banner ────────────────────────────────
  function _showAd() {
    const container = document.getElementById('module-ad-container');
    if (!container) return;

    // Unhide, then animate in on next paint.
    container.classList.remove('hidden');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        container.classList.add('ad-visible');
      });
    });

    // Add extra bottom padding to the currently active screen-scroll
    // so content never hides behind the ad banner.
    const activeScroll = document.querySelector('.screen.active .screen-scroll');
    if (activeScroll) {
      activeScroll.classList.add('ad-active-padding');
    }

    // If real ads are enabled, load AdSense now.
    if (AD_CONFIG.ADS_ENABLED) {
      _injectAdSense();
    }
  }

  // ── Internal: inject real AdSense script and markup ───────────────
  function _injectAdSense() {
    if (_adInjected) return;
    _adInjected = true;

    // Load the AdSense script once.
    if (!document.getElementById('adsense-script')) {
      const script    = document.createElement('script');
      script.id     = 'adsense-script';
      script.async  = true;
      script.src    = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
                    + '?client=' + AD_CONFIG.ADSENSE_CLIENT_ID;
      script.crossOrigin = 'anonymous';
      script.onerror = function () {
        console.warn('[AdManager] AdSense script failed to load — placeholder remains visible.');
      };
      document.head.appendChild(script);
    }

    // Replace the placeholder div with a real <ins> ad tag.
    const placeholder = document.getElementById('ad-placeholder');
    if (!placeholder) return;

    const ins = document.createElement('ins');
    ins.className               = 'adsbygoogle';
    ins.style.display           = 'block';
    ins.dataset.adClient        = AD_CONFIG.ADSENSE_CLIENT_ID;
    ins.dataset.adSlot          = AD_CONFIG.AD_SLOT_ID;
    ins.dataset.adFormat        = AD_CONFIG.AD_FORMAT;
    ins.dataset.fullWidthResponsive = 'true';

    if (AD_CONFIG.AD_LAYOUT_KEY) {
      ins.dataset.adLayoutKey   = AD_CONFIG.AD_LAYOUT_KEY;
    }
    if (AD_CONFIG.AD_TEST_MODE) {
      ins.dataset.adtest        = 'on';
    }

    placeholder.replaceWith(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  // ── Expose public API on window ───────────────────────────────────
  window.initDelayedModuleAd   = initDelayedModuleAd;
  window.destroyDelayedModuleAd = destroyDelayedModuleAd;

}());
