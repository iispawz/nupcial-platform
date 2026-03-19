/* ══════════════════════════════════════════════
   RSVP — Nupcial Platform
   Confirmação de presença multi-tenant.
   Lê configurações do SITE_CONFIG.
══════════════════════════════════════════════ */

(function () {

  let grupoId      = null;
  let grupo        = null;
  let confirmacoes = {};
  let isPreview    = false;

  /* Aguarda site-ready e grupos-loaded antes de iniciar */
  function waitAndInit() {
    if (window.SITE_ID === undefined) {
      window.addEventListener('site-ready', waitAndInit, { once: true });
      return;
    }
    if (!window.GRUPOS || Object.keys(window.GRUPOS).length === 0) {
      window.addEventListener('grupos-loaded', init, { once: true });
      return;
    }
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInit);
  } else {
    waitAndInit();
  }

  /* ── INIT ── */
  function init() {
    const params = new URLSearchParams(location.search);
    grupoId = params.get('g');

    if (!grupoId || !window.GRUPOS[grupoId]) {
      const firstGroup = Object.keys(window.GRUPOS)[0];
      grupoId   = firstGroup || null;
      isPreview = true;
    }

    if (!grupoId) return;

    grupo = window.GRUPOS[grupoId];
    if (!grupo) return;

    renderGreeting();
    showRSVPSection();
    loadFromSupabase();
  }

  /* ── GREETING ── */
  function renderGreeting() {
    const el = document.getElementById('rsvp-greeting');
    if (!el) return;

    const nomes = grupo.membros;
    let txt;
    if (nomes.length === 1)
      txt = `Olá, ${firstName(nomes[0])}! 🌿`;
    else if (nomes.length === 2)
      txt = `Olá, ${firstName(nomes[0])} e ${firstName(nomes[1])}! Que alegria ter vocês aqui! 🌿`;
    else
      txt = `Olá, ${nomes.map(firstName).join(', ')}! Que alegria ter vocês aqui! 🌿`;

    el.textContent = txt;

    if (isPreview) {
      const badge = document.getElementById('preview-badge');
      if (badge) badge.style.display = 'flex';
    }
  }

  function firstName(fullName) {
    return fullName.split(' ')[0];
  }

  /* ── SHOW RSVP SECTION ── */
  function showRSVPSection() {
    const sec = document.getElementById('rsvp-section');
    if (sec) sec.style.display = 'block';

    if (isPastDeadline()) {
      showClosed();
      return;
    }
    renderMembers({});
  }

  /* ── RENDER MEMBERS ── */
  function renderMembers(saved) {
    const list = document.getElementById('members-list');
    if (!list) return;
    list.innerHTML = '';

    grupo.membros.forEach((nome, i) => {
      const status = saved[nome] || null;
      const card   = document.createElement('div');
      card.className = 'member-card fade-up';
      card.style.animationDelay = `${i * 0.08}s`;
      card.innerHTML = `
        <div class="member-name">${nome}</div>
        <div class="member-btns">
          <button class="status-btn ${status === 'yes'     ? 'active-yes'     : ''}"
                  onclick="RSVP.set('${nome}','yes',this)">✓ Vai</button>
          <button class="status-btn ${status === 'no'      ? 'active-no'      : ''}"
                  onclick="RSVP.set('${nome}','no',this)">✕ Não vai</button>
          <button class="status-btn ${status === 'pending' ? 'active-pending' : ''}"
                  onclick="RSVP.set('${nome}','pending',this)">⏳ Pendente</button>
        </div>`;
      list.appendChild(card);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    list.querySelectorAll('.member-card').forEach(el => observer.observe(el));
  }

  /* ── SET STATUS ── */
  window.RSVP = {
    set(nome, status, btn) {
      confirmacoes[nome] = status;
      const btns = btn.parentElement.querySelectorAll('.status-btn');
      btns.forEach(b => b.classList.remove('active-yes', 'active-no', 'active-pending'));
      btn.classList.add(
        status === 'yes' ? 'active-yes' : status === 'no' ? 'active-no' : 'active-pending'
      );
      ripple(btn);
      saveLocal();
    },
    submit()     { submitRSVP(false); },
    submitEdit() { submitRSVP(true);  },
    enterEdit()  { enterEditMode();   }
  };

  /* ── RIPPLE ── */
  function ripple(btn) {
    const el   = document.createElement('span');
    el.className = 'ripple-el';
    const r    = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    el.style.cssText = `width:${size}px;height:${size}px;left:${r.width/2 - size/2}px;top:${r.height/2 - size/2}px`;
    btn.style.position = 'relative';
    btn.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  /* ── LOCAL STORAGE ── */
  function saveLocal() {
    localStorage.setItem(`rsvp_${window.SITE_SLUG}_${grupoId}`, JSON.stringify(confirmacoes));
  }
  function loadLocal() {
    try {
      return JSON.parse(
        localStorage.getItem(`rsvp_${window.SITE_SLUG}_${grupoId}`) || '{}'
      );
    } catch { return {}; }
  }

  /* ── LOAD FROM SUPABASE ── */
  async function loadFromSupabase() {
    const saved = loadLocal();
    hideLoading();

    if (!window.SITE_ID) {
      renderMembers(saved);
      return;
    }

    try {
      showLoading();
      const rows = await window.SB.sbSelect(
        'confirmacoes',
        `site_id=eq.${window.SITE_ID}&grupo_id=eq.${grupoId}`,
        'nome,status'
      );

      (rows || []).forEach(({ nome, status }) => {
        saved[nome] = status === 'Confirmado' ? 'yes'
                    : status === 'Não vai'    ? 'no'
                    : 'pending';
      });

      Object.assign(confirmacoes, saved);
      saveLocal();

      const allAnswered = grupo.membros.every(m => saved[m]);
      if (allAnswered) {
        localStorage.setItem(`rsvp_confirmed_${window.SITE_SLUG}_${grupoId}`, 'true');
        const area = document.getElementById('submit-area');
        if (area) area.style.display = 'none';
        showSuccess();
      } else {
        renderMembers(saved);
      }
    } catch (e) {
      console.error('RSVP: erro ao carregar confirmações.', e);
      renderMembers(saved);
    } finally {
      hideLoading();
    }
  }

  function showLoading() {
    const el = document.getElementById('rsvp-loading');
    if (el) el.style.display = 'flex';
  }
  function hideLoading() {
    const el = document.getElementById('rsvp-loading');
    if (el) el.style.display = 'none';
  }

  /* ── SUBMIT ── */
  async function submitRSVP(isEdit) {
    if (!Object.keys(confirmacoes).length) return;

    const btn = document.getElementById(isEdit ? 'submit-edit-btn' : 'submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

    const payload = grupo.membros.map(nome => ({
      site_id:            window.SITE_ID,
      grupo_id:           grupoId,
      nome,
      status:             confirmacoes[nome] === 'yes'     ? 'Confirmado'
                        : confirmacoes[nome] === 'no'      ? 'Não vai'
                        : 'Pendente',
      ultima_atualizacao: new Date().toISOString(),
      editado:            isEdit
    }));

    try {
      for (const item of payload) {
        /* Tenta atualizar primeiro, insere se não existir */
        const existing = await window.SB.sbSelect(
          'confirmacoes',
          `site_id=eq.${window.SITE_ID}&grupo_id=eq.${grupoId}&nome=eq.${encodeURIComponent(item.nome)}`,
          'id'
        );

        if (existing && existing.length) {
          await window.SB.sbUpdate(
            'confirmacoes',
            `id=eq.${existing[0].id}`,
            { status: item.status, ultima_atualizacao: item.ultima_atualizacao, editado: isEdit }
          );
        } else {
          await window.SB.sbInsert('confirmacoes', {
            ...item,
            primeira_confirmacao: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.error('RSVP: erro ao salvar.', e);
    }

    localStorage.setItem(`rsvp_confirmed_${window.SITE_SLUG}_${grupoId}`, 'true');
    saveLocal();
    const area = document.getElementById('submit-area');
    if (area) area.style.display = 'none';
    showSuccess();
  }

  /* ── SUCCESS BANNER ── */
  function showSuccess() {
    const banner = document.getElementById('success-banner');
    if (!banner) return;

    const confirmados = grupo.membros.filter(n => confirmacoes[n] === 'yes').map(firstName);
    const naoVao      = grupo.membros.filter(n => confirmacoes[n] === 'no').map(firstName);
    const pendentes   = grupo.membros.filter(n => confirmacoes[n] === 'pending').map(firstName);

    let msg = '';
    if (confirmados.length && !naoVao.length && !pendentes.length) {
      msg = `Que alegria ter ${listNames(confirmados)} com a gente neste dia tão especial! 🌿<br><br>Até o grande dia! 💛`;
    } else if (!confirmados.length && naoVao.length && !pendentes.length) {
      msg = `Sentiremos sua falta… 🤍<br><br>Você pode editar sua presença até o prazo.`;
    } else {
      let parts = [];
      if (confirmados.length) parts.push(`Que alegria ter ${listNames(confirmados)} com a gente! 🌿`);
      if (naoVao.length)      parts.push(`Sentiremos a falta de ${listNames(naoVao)}… 💛`);
      msg = parts.join('<br>');
    }

    if (pendentes.length === 1)
      msg += `<br><br><span style="color:var(--gold)">${pendentes[0]}</span> ficou como pendente — não esqueça de voltar e confirmar!`;
    else if (pendentes.length > 1)
      msg += `<br><br><span style="color:var(--gold)">${pendentes.join(', ')}</span> ficaram como pendente!`;

    const msgEl = document.getElementById('success-msg');
    if (msgEl) msgEl.innerHTML = msg;

    banner.classList.add('visible');
    updateEditTimer();
  }

  function listNames(arr) {
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} e ${arr[1]}`;
    return arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
  }

  /* ── EDIT MODE ── */
  function enterEditMode() {
    const banner = document.getElementById('success-banner');
    if (banner) banner.classList.remove('visible');
    const area = document.getElementById('submit-area');
    if (area) area.style.display = 'block';
    const list = document.getElementById('members-list');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── EDIT TIMER ── */
  function updateEditTimer() {
    const el = document.getElementById('edit-time-left');
    if (!el) return;

    const prazo = window.SITE_CONFIG?.prazo_rsvp;
    if (!prazo) return;

    const DEADLINE = new Date(prazo);
    const diff     = DEADLINE - new Date();

    if (diff <= 0) {
      el.textContent = 'Prazo encerrado';
      const editBtn = document.getElementById('edit-btn');
      if (editBtn) { editBtn.disabled = true; editBtn.style.opacity = '0.4'; }
      return;
    }

    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000)  / 60000);

    if (days > 0)       el.textContent = `${days} dias e ${hours}h restantes`;
    else if (hours > 0) el.textContent = `${hours}h e ${minutes}min restantes`;
    else                el.textContent = `${minutes} minutos restantes`;
  }
  setInterval(updateEditTimer, 60000);

  /* ── DEADLINE ── */
  function isPastDeadline() {
    const prazo = window.SITE_CONFIG?.prazo_rsvp;
    if (!prazo) return false;
    return new Date() > new Date(prazo);
  }

  function showClosed() {
    const closed = document.getElementById('rsvp-closed');
    const area   = document.getElementById('submit-area');
    if (closed) closed.style.display = 'block';
    if (area)   area.style.display   = 'none';
  }

})();