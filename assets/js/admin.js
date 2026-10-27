(() => {
  // Credenziali di accesso (password salvata come hash SHA-256).
  // Utente: admin  –  Password: vedi README.md
  const USER = 'admin';
  const PASS_HASH = 'fec3a4700253c7156c7c8e0a1bb4deee69e34723d57b4f716ba786dd93a99347';
  const SESSION = 'sigma.session';

  const $ = (s) => document.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
  };

  // --- Login ---
  const showApp = () => {
    $('#login').hidden = true;
    $('#app').hidden = false;
    renderMessages(); renderTexts(); renderColors();
  };

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (f.get('user').trim() === USER && await sha256(f.get('pass')) === PASS_HASH) {
      sessionStorage.setItem(SESSION, '1');
      showApp();
    } else {
      $('#loginError').hidden = false;
    }
  });

  $('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION);
    location.reload();
  });

  // --- Tabs ---
  document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab').forEach(t => t.hidden = t.id !== 'tab-' + btn.dataset.tab);
  }));

  // --- Messaggi ---
  const renderMessages = () => {
    const list = SIGMA.messages();
    const unread = list.filter(m => !m.read).length;
    $('#unread').textContent = unread || '';

    if (!list.length) {
      $('#messages').innerHTML = '<p class="empty">Nessun messaggio ricevuto.</p>';
      return;
    }
    $('#messages').innerHTML = list.map(m => `
      <article class="msg ${m.read ? '' : 'msg--new'}" data-id="${m.id}">
        <div class="msg__head">
          <strong>${esc(m.name)}</strong>
          <span class="tag">${esc(m.type)}</span>
          <time>${new Date(m.date).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</time>
        </div>
        <p>${esc(m.message)}</p>
        <div class="msg__foot">
          <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>
          ${m.phone ? `<a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ''}
          <span class="spacer"></span>
          <button data-act="read">${m.read ? 'Segna come non letto' : 'Segna come letto'}</button>
          <button data-act="del" class="danger">Elimina</button>
        </div>
      </article>`).join('');
  };

  $('#messages').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = Number(btn.closest('.msg').dataset.id);
    let list = SIGMA.messages();
    if (btn.dataset.act === 'del') {
      if (!confirm('Eliminare questo messaggio?')) return;
      list = list.filter(m => m.id !== id);
    } else {
      list = list.map(m => m.id === id ? { ...m, read: !m.read } : m);
    }
    SIGMA.saveMessages(list);
    renderMessages();
  });

  // --- Testi ---
  const renderTexts = () => {
    const c = SIGMA.content();
    $('#textForm').innerHTML = Object.entries(SIGMA.DEFAULT_CONTENT).map(([k, d]) => `
      <label class="${d.long ? 'wide' : ''}">${esc(d.label)}
        ${d.long
          ? `<textarea name="${k}" rows="3">${esc(c[k])}</textarea>`
          : `<input name="${k}" value="${esc(c[k])}">`}
      </label>`).join('');
  };

  $('#textForm').addEventListener('submit', (e) => {
    e.preventDefault();
    SIGMA.saveContent(Object.fromEntries(new FormData(e.target)));
    toast('Testi salvati');
  });

  $('#resetText').addEventListener('click', () => {
    if (!confirm('Ripristinare i testi originali?')) return;
    SIGMA.resetContent();
    renderTexts();
    toast('Testi ripristinati');
  });

  // --- Colori ---
  const renderColors = () => {
    const c = SIGMA.colors();
    $('#colorForm').innerHTML = Object.entries(SIGMA.DEFAULT_COLORS).map(([k, d]) => `
      <label class="swatch">
        <input type="color" name="${k}" value="${c[k]}">
        <span>${esc(d.label)}<small>${c[k]}</small></span>
      </label>`).join('');
    SIGMA.applyColors(c);
  };

  $('#colorForm').addEventListener('input', (e) => {
    if (e.target.type !== 'color') return;
    e.target.nextElementSibling.querySelector('small').textContent = e.target.value;
    SIGMA.applyColors(Object.fromEntries(new FormData($('#colorForm'))));
  });

  $('#colorForm').addEventListener('submit', (e) => {
    e.preventDefault();
    SIGMA.saveColors(Object.fromEntries(new FormData(e.target)));
    toast('Colori salvati');
  });

  $('#resetColors').addEventListener('click', () => {
    if (!confirm('Ripristinare i colori del logo?')) return;
    SIGMA.resetColors();
    document.documentElement.removeAttribute('style');
    renderColors();
    toast('Colori ripristinati');
  });

  // Aggiorna i messaggi se arrivano da un'altra scheda
  window.addEventListener('storage', (e) => { if (e.key === 'sigma.messages') renderMessages(); });

  if (sessionStorage.getItem(SESSION)) showApp();
})();
