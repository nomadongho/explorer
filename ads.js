/* ads.js - Google AdSense configuration and banner (activity pages only) */

/* ── AdSense settings (edit here only) ──────────────────────────────────── */
/* IMPORTANT: Replace the values below with your actual AdSense credentials  */
/*   publisherId : found in AdSense → Account → Account information          */
/*   adSlot      : found in AdSense → Ads → By ad unit                       */
var AdsConfig = {
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXXX', // ← Your AdSense publisher ID
  adSlot:      'XXXXXXXXXX',              // ← Your AdSense ad slot ID
  adFormat:    'auto',
  fullWidthResponsive: 'true',
};
/* ─────────────────────────────────────────────────────────────────────────── */

(function () {
  // Only show on activity pages (not index.html or root)
  var path = window.location.pathname;
  var isActivityPage = !path.endsWith('index.html') &&
                       !path.endsWith('/') &&
                       path !== '';

  if (!isActivityPage) return;

  // Warn if placeholder credentials are still in place
  if (!AdsConfig.publisherId.startsWith('ca-pub-') ||
      AdsConfig.publisherId === 'ca-pub-XXXXXXXXXXXXXXXXX') {
    console.warn('ads.js: AdsConfig.publisherId is not set. Update ads.js with your AdSense publisher ID.');
    return;
  }

  // Load AdSense script into <head> early for better performance
  function loadAdSenseScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AdsConfig.publisherId;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  // Inject <ins> ad unit into the banner div and make it visible
  function showAd() {
    var banner = document.getElementById('ad-banner');
    if (!banner) return;

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', AdsConfig.publisherId);
    ins.setAttribute('data-ad-slot', AdsConfig.adSlot);
    ins.setAttribute('data-ad-format', AdsConfig.adFormat);
    ins.setAttribute('data-full-width-responsive', AdsConfig.fullWidthResponsive);

    while (banner.firstChild) banner.removeChild(banner.firstChild);
    banner.appendChild(ins);
    banner.classList.add('visible');

    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('ad-banner');
    if (!banner) return;

    loadAdSenseScript();
    setTimeout(showAd, 60000); // show ad 60 seconds after page load
  });
})();
