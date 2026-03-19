/* ══════════════════════════════════════════════
   PALETTE POPUP — Nupcial Platform
══════════════════════════════════════════════ */

(function () {

  function openPopup() {
    const overlay = document.getElementById('popup-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePopup(e) {
    const overlay = document.getElementById('popup-overlay');
    if (!overlay) return;
    if (e && e.target !== overlay && !e.target.classList.contains('popup-close')) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.openPopup  = openPopup;
  window.closePopup = closePopup;

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('popup-overlay');
      if (overlay && overlay.classList.contains('open')) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    }
  });

})();