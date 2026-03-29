/* ═══════════════════════════════════════════════════════════════════════════
 * Ad Manager
 *
 * Provides a delayed-display ad system for module/play screens.
 * The home screen and rewards screen intentionally receive no ads.
 *
 * Usage (called by app.js):
 *   AdManager.init(screenElement)   – call when the learner enters a module
 *   AdManager.destroy()             – call when the learner leaves a module
 *
 * The ad (or placeholder) appears only after the learner has spent
 * AdConfig.DELAY_MS of *visible* time inside the module.  Switching tabs
 * or minimising the browser pauses the countdown.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* global AdConfig */
/* exported AdManager */

const AdManager = (() => { // eslint-disable-line no-unused-vars

  // ── Private state ─────────────────────────────────────────────────────────
  let _screenEl    = null;   // module screen element currently tracked
  let _container   = null;   // the .ad-banner-wrap DOM node we injected
  let _intervalId  = null;   // setInterval handle for the countdown
  let _elapsed     = 0;      // accumulated visible milliseconds
  let _paused      = false;  // true while tab is hidden
  let _adShown     = false;  // true once the ad has been rendered
  let _adsenseLoaded = false; // true after the AdSense <script> has been added

  // ── DOM helpers ───────────────────────────────────────────────────────────

  /** Build and append the banner wrapper to the given screen. */
  function _createBanner(screenEl) {
    const wrap = document.createElement('div');
    wrap.className  = 'ad-banner-wrap';
    wrap.id         = 'module-ad-banner';
    // Hidden from assistive tech until it actually contains an ad
    wrap.setAttribute('aria-hidden', 'true');
    wrap.setAttribute('role', 'complementary');

    const inner = document.createElement('div');
    inner.className = 'ad-banner-inner';
    wrap.appendChild(inner);

    screenEl.appendChild(wrap);
    return wrap;
  }

  // ── AdSense script loader ─────────────────────────────────────────────────

  /** Inject the AdSense <script> tag once.  Fails silently if unavailable. */
  function _loadAdsenseScript() {
    if (_adsenseLoaded || !AdConfig.ADS_ENABLED) return;
    try {
      const s = document.createElement('script');
      s.async = true;
      // Replace AdConfig.ADSENSE_CLIENT_ID with your real publisher ID
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AdConfig.ADSENSE_CLIENT_ID}`;
      s.crossOrigin = 'anonymous';
      s.onerror = () => { /* AdSense unavailable – placeholder remains */ };
      document.head.appendChild(s);
      _adsenseLoaded = true;
    } catch (_e) { /* fail silently */ }
  }

  // ── Ad rendering ──────────────────────────────────────────────────────────

  /** Escape a string for safe use as an HTML attribute value. */
  function _escAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Populate the banner after the delay has elapsed. */
  function _showAd() {
    if (_adShown || !_container) return;
    _adShown = true;

    // Stop the interval immediately now that the ad is ready
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    const inner = _container.querySelector('.ad-banner-inner');
    if (!inner) return;

    if (AdConfig.ADS_ENABLED) {
      // ── Real Google AdSense ad ──────────────────────────────────────────
      // Replace AdConfig.ADSENSE_CLIENT_ID and AdConfig.AD_SLOT_ID with your real values.
      _loadAdsenseScript();
      const layoutAttr = AdConfig.AD_LAYOUT_KEY
        ? ` data-ad-layout-key="${_escAttr(AdConfig.AD_LAYOUT_KEY)}"`
        : '';
      const testAttr = AdConfig.AD_TEST_MODE ? ' data-adtest="on"' : '';
      inner.innerHTML =
        `<ins class="adsbygoogle"` +
        ` style="display:block"` +
        ` data-ad-client="${_escAttr(AdConfig.ADSENSE_CLIENT_ID)}"` +
        ` data-ad-slot="${_escAttr(AdConfig.AD_SLOT_ID)}"` +
        ` data-ad-format="${_escAttr(AdConfig.AD_FORMAT)}"` +
        `${layoutAttr}${testAttr}></ins>`;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (_e) { /* push failed – placeholder remains */ }
    } else {
      // ── Placeholder banner (shown until real ads are configured) ────────
      inner.innerHTML =
        `<div class="ad-placeholder" role="img" aria-label="Ad space">` +
        `Ad space` +
        `</div>`;
    }

    // Reveal the banner with a gentle fade-in
    _container.classList.add('ad-banner-visible');
    _container.setAttribute('aria-hidden', 'false');
    _container.setAttribute('aria-label', 'Advertisement');
  }

  // ── Visibility handling ───────────────────────────────────────────────────

  /** Pause or resume the countdown when the tab visibility changes. */
  function _handleVisibility() {
    _paused = document.hidden;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start the delayed-ad system for the given module screen element.
   * Call this every time the learner enters a module screen.
   *
   * @param {HTMLElement} screenEl  The module screen's root element.
   */
  function init(screenEl) {
    destroy(); // clean up any running ad from a previous module

    _screenEl  = screenEl;
    _elapsed   = 0;
    _paused    = document.hidden;
    _adShown   = false;

    _container = _createBanner(screenEl);

    // If no delay is required, show the ad immediately
    if (AdConfig.DELAY_MS <= 0) {
      _showAd();
      return;
    }

    document.addEventListener('visibilitychange', _handleVisibility);

    // Tick every second; only count visible time
    _intervalId = setInterval(() => {
      if (_paused || _adShown) return;
      _elapsed += 1000;
      if (_elapsed >= AdConfig.DELAY_MS) {
        _showAd(); // _showAd() clears the interval itself
      }
    }, 1000);
  }

  /**
   * Stop the timer, remove the ad banner, and clean up event listeners.
   * Call this every time the learner leaves a module screen.
   */
  function destroy() {
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    document.removeEventListener('visibilitychange', _handleVisibility);

    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
    }

    _screenEl  = null;
    _container = null;
    _elapsed   = 0;
    _paused    = false;
    _adShown   = false;
  }

  return { init, destroy };

})();
