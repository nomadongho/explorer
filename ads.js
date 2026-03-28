/* ads.js - Ad placeholder banner (appears 60s after entering activity page) */

(function () {
  // Only show on activity pages (not index.html or root)
  const path = window.location.pathname;
  const isActivityPage = !path.endsWith('index.html') &&
                         !path.endsWith('/') &&
                         path !== '';

  if (!isActivityPage) return;

  let adTimer = null;

  function showAd() {
    const banner = document.getElementById('ad-banner');
    if (banner) {
      banner.classList.add('visible');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('ad-banner');
    if (!banner) return;

    adTimer = setTimeout(showAd, 60000); // 60 seconds
  });
})();
