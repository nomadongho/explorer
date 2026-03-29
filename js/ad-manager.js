/* ═══════════════════════════════════════════════════════════════
   js/ad-manager.js — Delayed ad system for module screens
   ═══════════════════════════════════════════════════════════════
   Exposes two functions:
     AdManager.initDelayedModuleAd()   — call when entering a module
     AdManager.destroyDelayedModuleAd() — call when leaving a module

   Screens that intentionally do NOT show ads:
     • Home / mode-selection screen  (showModeSelector)

   Screens that show a delayed ad banner:
     • Read the Clock  (startReadMode)
     • Set the Clock   (startSetMode)
     • Match Game      (startMatchMode)
     • Free Play       (startFreePlayMode)
   ═══════════════════════════════════════════════════════════════ */

/* global AD_CONFIG */
const AdManager = (() => {

  /* ── Internal state ──────────────────────────────────────── */
  let _wrap        = null;   // <div id="module-ad-wrap"> attached to <body>
  let _elapsed     = 0;      // accumulated visible milliseconds
  let _lastTick    = null;   // timestamp when the interval last fired
  let _tickId      = null;   // setInterval handle
  let _adShown     = false;  // true once the banner is revealed
  let _scriptLoaded = false; // true once the AdSense <script> has been injected

  const _delayMs = () => (AD_CONFIG.AD_DELAY_SECONDS != null ? AD_CONFIG.AD_DELAY_SECONDS : 60) * 1000;

  /* ── Interval tick ───────────────────────────────────────── */
  function _startTick() {
    if (_tickId !== null) return;
    _lastTick = Date.now();
    _tickId = setInterval(() => {
      const now = Date.now();
      _elapsed += now - _lastTick;
      _lastTick = now;
      if (!_adShown && _elapsed >= _delayMs()) {
        _revealAd();
      }
    }, 1000);
  }

  function _stopTick() {
    if (_tickId !== null) {
      clearInterval(_tickId);
      _tickId = null;
    }
    // Flush any accumulated time that hasn't been counted yet
    if (_lastTick !== null) {
      _elapsed += Date.now() - _lastTick;
      _lastTick = null;
    }
  }

  /* ── Page visibility — pause timer when tab is hidden ───── */
  function _onVisibilityChange() {
    if (!_wrap || _adShown) return;
    if (document.hidden) {
      _stopTick();
    } else {
      _startTick();
    }
  }

  /* ── Build the ad wrapper element ───────────────────────── */
  function _buildWrap() {
    const wrap = document.createElement('div');
    wrap.id = 'module-ad-wrap';
    wrap.setAttribute('role', 'complementary');
    wrap.setAttribute('aria-label', 'Advertisement');

    if (AD_CONFIG.ADS_ENABLED) {
      // TODO: This <ins> tag will render the real Google ad once credentials are set.
      //       Replace data-ad-client and data-ad-slot with real values in ad-config.js.
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.dataset.adClient = AD_CONFIG.ADSENSE_CLIENT_ID;
      ins.dataset.adSlot   = AD_CONFIG.AD_SLOT_ID;
      ins.dataset.adFormat = AD_CONFIG.AD_FORMAT;
      if (AD_CONFIG.AD_LAYOUT_KEY) {
        ins.dataset.adLayoutKey = AD_CONFIG.AD_LAYOUT_KEY;
      }
      if (AD_CONFIG.AD_TEST_MODE) {
        ins.dataset.adtest = 'on';
      }
      wrap.appendChild(ins);
    } else {
      // Placeholder shown when ADS_ENABLED is false
      const ph = document.createElement('div');
      ph.className = 'ad-placeholder';
      ph.setAttribute('aria-hidden', 'true');
      ph.innerHTML = '<span class="ad-placeholder-label">Ad space</span>';
      wrap.appendChild(ph);
    }

    return wrap;
  }

  /* ── Load the AdSense library (once, only when enabled) ──── */
  function _loadAdSenseScript() {
    if (!AD_CONFIG.ADS_ENABLED || _scriptLoaded) return;
    _scriptLoaded = true;
    try {
      const s = document.createElement('script');
      s.async = true;
      // TODO: The client parameter will be read from the tag; no change needed here.
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
              AD_CONFIG.ADSENSE_CLIENT_ID;
      s.crossOrigin = 'anonymous';
      s.onerror = () => {
        console.info('[AdManager] AdSense script unavailable — placeholder shown.');
      };
      document.head.appendChild(s);
    } catch (e) {
      console.info('[AdManager] Could not load AdSense script:', e);
    }
  }

  /* ── Reveal the ad after the delay has elapsed ───────────── */
  function _revealAd() {
    _stopTick();
    _adShown = true;
    if (!_wrap) return;

    _wrap.classList.add('ad-visible');

    // Reserve bottom space so content is never hidden behind the ad
    const main = document.getElementById('main-content');
    if (main) main.classList.add('has-module-ad');

    if (AD_CONFIG.ADS_ENABLED) {
      try {
        // TODO: This push() call activates the real ad unit.
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.info('[AdManager] adsbygoogle push failed:', e);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════ */

  /**
   * Call when the learner enters a module screen.
   * Attaches the ad wrapper to <body>, then starts a
   * visibility-aware countdown. After AD_DELAY_SECONDS of
   * continuous visible time the banner slides into view.
   */
  function initDelayedModuleAd() {
    destroyDelayedModuleAd();   // always reset before starting a new session

    _wrap    = _buildWrap();
    _elapsed = 0;
    _adShown = false;

    document.body.appendChild(_wrap);
    document.addEventListener('visibilitychange', _onVisibilityChange);

    if (AD_CONFIG.ADS_ENABLED) _loadAdSenseScript();

    // Only start counting if the tab is already visible
    if (!document.hidden) _startTick();
  }

  /**
   * Call when the learner leaves a module screen.
   * Removes the banner, clears the timer, and cleans up listeners.
   */
  function destroyDelayedModuleAd() {
    _stopTick();
    document.removeEventListener('visibilitychange', _onVisibilityChange);

    if (_wrap && _wrap.parentNode) {
      _wrap.parentNode.removeChild(_wrap);
    }
    _wrap     = null;
    _elapsed  = 0;
    _lastTick = null;
    _adShown  = false;

    // Remove the bottom-padding helper class
    const main = document.getElementById('main-content');
    if (main) main.classList.remove('has-module-ad');
  }

  return { initDelayedModuleAd, destroyDelayedModuleAd };

})();
