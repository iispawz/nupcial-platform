/* ══════════════════════════════════════════════
   SUPABASE — Nupcial Platform
   Cliente multi-tenant. Toda query é
   automaticamente filtrada por site_id.
══════════════════════════════════════════════ */

window.SB = (function () {
  const { supabaseUrl, supabaseKey } = window.NUPCIAL_CONFIG;

  async function _fetch(table, options = {}) {
    const { method = 'GET', filter = '', body = null, select = '*' } = options;
    const url = `${supabaseUrl}/rest/v1/${table}?select=${select}${filter ? '&' + filter : ''}`;
    const res = await fetch(url, {
      method,
      headers: {
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type':  'application/json',
        'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal'
      },
      body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    sbSelect: (table, filter = '', select = '*') =>
      _fetch(table, { filter, select }),
    sbInsert: (table, data) =>
      _fetch(table, { method: 'POST', body: data }),
    sbUpdate: (table, filter, data) =>
      _fetch(table, { method: 'PATCH', filter, body: data }),
    sbDelete: (table, filter) =>
      _fetch(table, { method: 'DELETE', filter }),
  };
})();