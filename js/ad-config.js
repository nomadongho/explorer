/* =====================================================
   AD CONFIG — js/ad-config.js
   English Explorer

   To enable real Google Ads:
   1. Set ADS_ENABLED to true
   2. Replace ADSENSE_CLIENT_ID with your publisher ID
      (format: ca-pub-XXXXXXXXXXXXXXXX)
   3. Replace AD_SLOT_ID with your ad slot number
   4. Set AD_TEST_MODE to false for production
   ===================================================== */

'use strict';

const AD_CONFIG = {

  // ── Enable / disable the entire ad system ──────────────────────────
  // Set to true when you have real Google Ads credentials.
  // When false, a visual placeholder is shown; no Google scripts load.
  ADS_ENABLED: false,

  // ── Publisher ID ───────────────────────────────────────────────────
  // TODO: Replace with your real AdSense publisher ID.
  // Example: 'ca-pub-1234567890123456'
  ADSENSE_CLIENT_ID: 'ca-pub-XXXXXXXXXXXXXXXX',

  // ── Ad slot ID ─────────────────────────────────────────────────────
  // TODO: Replace with your real ad slot ID from Google AdSense.
  // Example: '9876543210'
  AD_SLOT_ID: '1234567890',

  // ── Ad format ──────────────────────────────────────────────────────
  // 'auto' lets Google choose the best size for the slot.
  AD_FORMAT: 'auto',

  // ── Layout key ─────────────────────────────────────────────────────
  // Required only for in-article format. Leave empty for banner/auto.
  AD_LAYOUT_KEY: '',

  // ── Test mode ──────────────────────────────────────────────────────
  // Set to true to display Google test ads during development.
  // Must be false for real ad revenue in production.
  AD_TEST_MODE: true,

  // ── Delay before ad appears (milliseconds) ─────────────────────────
  // The ad shows only after the learner has been on a module screen
  // for this many milliseconds of active (tab-visible) time.
  // Default: 60 000 ms = 60 seconds.
  AD_DELAY_MS: 60000,
};
