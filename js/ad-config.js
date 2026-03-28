/* ═══════════════════════════════════════════════════════════════════════════
 * Ad Configuration
 *
 * To enable real Google AdSense ads:
 *   1. Set ADS_ENABLED to true.
 *   2. Replace ADSENSE_CLIENT_ID with your publisher ID  (ca-pub-XXXXXXXXXXXXXXXX).
 *   3. Replace AD_SLOT_ID with your real ad slot number.
 *   4. Set AD_TEST_MODE to false for live traffic.
 *
 * These are the ONLY values you need to change. Everything else is automatic.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* global AdConfig */
const AdConfig = Object.freeze({
  /** Set to true to serve real Google AdSense ads */
  ADS_ENABLED: false,

  /** Your AdSense publisher ID — replace with e.g. "ca-pub-1234567890123456" */
  ADSENSE_CLIENT_ID: 'ca-pub-XXXXXXXXXXXXXXXX',

  /** Your ad slot ID — replace with the numeric ID from AdSense */
  AD_SLOT_ID: '1234567890',

  /** Ad format passed to data-ad-format. Typical values: 'auto', 'rectangle', 'banner' */
  AD_FORMAT: 'auto',

  /** Layout key for in-feed/in-article ads (optional — leave empty string to omit) */
  AD_LAYOUT_KEY: '',

  /** Keep true during development so Google serves placeholder test ads instead of live ones */
  AD_TEST_MODE: true,

  /** How many milliseconds a learner must spend in a module before the ad appears (default 60 s) */
  DELAY_MS: 60000,
});
