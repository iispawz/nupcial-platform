/* ══════════════════════════════════════════════
   SITE RESOLVER — Nupcial Platform
   Descobre qual site/casal está sendo acessado.

   Agora:   ?site=joao-maria  (GitHub Pages)
   Depois:  joao-maria.nupcial.app (Cloudflare)

   O resto do sistema não sabe como o slug foi
   obtido — só consome window.SITE_SLUG.
══════════════════════════════════════════════ */

(async function () {
  /* 1. Tenta ler da URL: ?site=slug */
  const params = new URLSearchParams(location.search);
  let slug = params.get('site');

  /* 2. Futuramente: ler do subdomínio
     const host = location.hostname;
     const parts = host.split('.');
     if (parts.length >= 3) slug = parts[0];
  */

  if (!slug) {
    console.warn('Nupcial: nenhum site identificado na URL.');
    window.SITE_SLUG  = null;
    window.SITE_ID    = null;
    window.SITE_CONFIG = {};
    window.dispatchEvent(new Event('site-ready'));
    return;
  }

  try {
    /* Busca o site no Supabase pelo slug */
    const rows = await window.SB.sbSelect(
      'sites',
      `slug=eq.${slug}`,
      'id,slug,config'
    );

    if (!rows || !rows.length) {
      console.warn(`Nupcial: site "${slug}" não encontrado.`);
      window.SITE_SLUG   = slug;
      window.SITE_ID     = null;
      window.SITE_CONFIG = {};
    } else {
      window.SITE_SLUG   = rows[0].slug;
      window.SITE_ID     = rows[0].id;
      window.SITE_CONFIG = rows[0].config || {};
    }
  } catch (e) {
    console.error('Nupcial: erro ao resolver site.', e);
    window.SITE_SLUG   = slug;
    window.SITE_ID     = null;
    window.SITE_CONFIG = {};
  }

  window.dispatchEvent(new Event('site-ready'));
})();