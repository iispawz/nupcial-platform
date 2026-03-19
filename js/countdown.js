/* ══════════════════════════════════════════════
   COUNTDOWN — Nupcial Platform
   Contagem regressiva para a data do casamento.
   Lê a data do SITE_CONFIG carregado pelo
   site-resolver.
══════════════════════════════════════════════ */

(function () {
  function init() {
    const dataStr = window.SITE_CONFIG?.data_casamento;
    if (!dataStr) return;

    const WEDDING = new Date(dataStr);
    function pad(n) { return String(n).padStart(2, '0'); }

    function tick() {
      const diff = WEDDING - new Date();
      if (diff <= 0) return;

      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000)  / 60000);
      const seconds = Math.floor((diff % 60000)    / 1000);

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = pad(val);
      };

      set('cd-days',    days);
      set('cd-hours',   hours);
      set('cd-minutes', minutes);
      set('cd-seconds', seconds);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* Aguarda site-ready para ter acesso ao SITE_CONFIG */
  if (window.SITE_CONFIG !== undefined) {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    window.addEventListener('site-ready', () => {
      document.addEventListener('DOMContentLoaded', init);
    }, { once: true });
  }
})();