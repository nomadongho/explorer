/* script.js — Minimal JavaScript for Leo's Explorer */

// ── Set current year in footer ─────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Intersection Observer for fade-in animations ───────────
const fadeTargets = document.querySelectorAll('.fade-in, .journey__item');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger each item slightly
          const delay = entry.target.closest('.journey__grid')
            ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 120
            : 0;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  fadeTargets.forEach((el) => observer.observe(el));
} else {
  // Fallback: show all elements immediately
  fadeTargets.forEach((el) => el.classList.add('is-visible'));
}
