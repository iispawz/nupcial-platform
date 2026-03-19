/* ══════════════════════════════════════════════
   GROUPS — Nupcial Platform
   Carrega grupos e membros do Supabase
   filtrado pelo site_id resolvido.
══════════════════════════════════════════════ */

window.GRUPOS = {};

async function loadGrupos() {
  if (!window.SITE_ID) {
    window.dispatchEvent(new Event('grupos-loaded'));
    return;
  }

  try {
    const [gruposRes, membrosRes] = await Promise.all([
      window.SB.sbSelect('grupos', `site_id=eq.${window.SITE_ID}`, 'id,label'),
      window.SB.sbSelect('membros', `site_id=eq.${window.SITE_ID}&order=ordem`, 'grupo_id,nome')
    ]);

    const map = {};
    (membrosRes || []).forEach(m => {
      if (!map[m.grupo_id]) map[m.grupo_id] = [];
      map[m.grupo_id].push(m.nome);
    });

    (gruposRes || []).forEach(g => {
      window.GRUPOS[g.id] = { label: g.label, membros: map[g.id] || [] };
    });

  } catch (e) {
    console.error('Nupcial: erro ao carregar grupos.', e);
  }

  window.dispatchEvent(new Event('grupos-loaded'));
}

/* Aguarda o site-resolver terminar antes de carregar */
if (window.SITE_ID !== undefined) {
  loadGrupos();
} else {
  window.addEventListener('site-ready', loadGrupos, { once: true });
}