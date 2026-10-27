(() => {
  // Credenziali di accesso (password salvata come hash SHA-256).
  // Utente: admin  –  Password: vedi README.md
  const USER = 'admin';
  const PASS_HASH = 'fec3a4700253c7156c7c8e0a1bb4deee69e34723d57b4f716ba786dd93a99347';
  const SESSION = 'sigma.session';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const when = (d) => new Date(d).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
  const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const toast = (msg, bad = false) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('bad', bad);
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
  };

  // --- Login ---
  const showApp = () => {
    $('#login').hidden = true;
    $('#app').hidden = false;
    renderQuotes(); renderReviews(); renderConfig(); renderTexts(); renderColors();
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
    if (dirty && !confirm('Ci sono modifiche al preventivo non salvate. Uscire comunque?')) return;
    sessionStorage.removeItem(SESSION);
    location.reload();
  });

  // --- Tabs ---
  $$('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
    $$('.tab').forEach(t => t.hidden = t.id !== 'tab-' + btn.dataset.tab);
    scrollTo(0, 0);
  }));

  const badge = (sel, n) => { $(sel).textContent = n || ''; };

  // Pulsanti "letto / elimina" delle richieste
  const listActions =(container, getList, saveList, render, noun) => {
    $(container).addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = Number(btn.closest('[data-id]').dataset.id);
      let list = getList();
      if (btn.dataset.act === 'del') {
        if (!confirm(`Eliminare questo ${noun}?`)) return;
        list = list.filter(m => m.id !== id);
      } else {
        list = list.map(m => m.id === id ? { ...m, read: !m.read } : m);
      }
      saveList(list);
      render();
    });
  };

  const contactFoot = (m) => `
    <div class="msg__foot">
      ${m.email ? `<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ''}
      ${m.phone ? `<a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ''}
      <span class="spacer"></span>
      <button data-act="read">${m.read ? 'Segna come non letto' : 'Segna come letto'}</button>
      <button data-act="del" class="danger">Elimina</button>
    </div>`;

  // --- Preventivi ---
  const renderQuotes = () => {
    const list = SIGMA.quotes();
    badge('#badgeQuotes', list.filter(q => !q.read).length);
    if (!list.length) {
      $('#quotes').innerHTML = '<p class="empty">Nessuna richiesta di preventivo ricevuta.</p>';
      return;
    }
    $('#quotes').innerHTML = list.map(q => `
      <article class="msg ${q.read ? '' : 'msg--new'}" data-id="${q.id}">
        <div class="msg__head">
          <strong>${esc(q.name)}</strong>
          <span class="tag">${esc(q.type)}</span>
          ${q.budget ? `<span class="tag tag--gold">${esc(q.budget)}</span>` : ''}
          <time>${when(q.date)}</time>
        </div>
        <details ${q.read ? '' : 'open'}>
          <summary>Configurazione richiesta</summary>
          <div class="quote__grid">
            ${(q.sections || []).map(s => `
              <div class="quote__sec">
                <h4>${esc(s.title)}</h4>
                ${s.items.map(i => `<p><span>${esc(i.label)}</span>${esc(i.value)}</p>`).join('')}
              </div>`).join('')}
          </div>
        </details>
        ${q.notes ? `<p class="quote__notes"><b>Note:</b> ${esc(q.notes)}</p>` : ''}
        ${contactFoot(q)}
      </article>`).join('');
  };
  listActions('#quotes', SIGMA.quotes, SIGMA.saveQuotes, renderQuotes, 'preventivo');

  // --- Recensioni ---
  const starsHtml = (n) => `<span class="stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const reviewCard = (r) => `
    <article class="msg ${r.status === 'pending' ? 'msg--new' : ''}" data-id="${r.id}">
      <div class="msg__head">
        <strong>${esc(r.name)}</strong>
        ${starsHtml(+r.rating)}
        <time>${when(r.date)}</time>
      </div>
      <p>${esc(r.text)}</p>
      <div class="msg__foot">
        <span class="spacer"></span>
        ${r.status === 'pending'
          ? '<button data-act="approve" class="ok">✓ Approva e pubblica</button><button data-act="del" class="danger">Rifiuta</button>'
          : '<button data-act="hide">Nascondi dal sito</button><button data-act="del" class="danger">Elimina</button>'}
      </div>
    </article>`;

  const renderReviews = () => {
    const list = SIGMA.reviews();
    const pending = list.filter(r => r.status === 'pending');
    const approved = list.filter(r => r.status === 'approved');
    badge('#badgeReviews', pending.length);
    $('#reviewsPending').innerHTML = pending.length ? pending.map(reviewCard).join('') : '<p class="empty">Nessuna recensione in attesa.</p>';
    $('#reviewsApproved').innerHTML = approved.length ? approved.map(reviewCard).join('') : '<p class="empty">Nessuna recensione pubblicata.</p>';
  };

  $('#tab-recensioni').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = Number(btn.closest('[data-id]').dataset.id);
    let list = SIGMA.reviews();
    const act = btn.dataset.act;
    if (act === 'del') {
      if (!confirm('Eliminare definitivamente questa recensione?')) return;
      list = list.filter(r => r.id !== id);
    } else {
      list = list.map(r => r.id === id ? { ...r, status: act === 'approve' ? 'approved' : 'pending' } : r);
    }
    SIGMA.saveReviews(list);
    renderReviews();
    toast(act === 'approve' ? 'Recensione pubblicata sul sito' : act === 'hide' ? 'Recensione nascosta' : 'Recensione eliminata');
  });

  // --- Configuratore del preventivo ---
  const ICONS = { laptop: 'Portatile', desktop: 'PC fisso', tablet: 'Tablet', monitor: 'Monitor', server: 'Server', printer: 'Stampante', component: 'Componenti' };
  const QTYPES = { choice: 'Scelta singola', multi: 'Scelta multipla', range: 'Fascia di prezzo', text: 'Testo libero' };
  let draft = SIGMA.clone(SIGMA.quoteConfig());
  let dirty = false;

  const setDirty = (v = true) => { dirty = v; $('#cfgDirty').hidden = !v; };
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  const newQuestion = () => ({ id: uid('q'), label: 'Nuova domanda', type: 'choice', required: false, options: ['Opzione 1', 'Opzione 2'] });
  const fitSize = (v) => Math.max(8, String(v).length + 2);

  const questionBody = (s, j, q) => {
    const at = `data-s="${s}" data-q="${j}"`;
    if (q.type === 'choice' || q.type === 'multi') {
      return `<div class="cfg-opts">
        ${(q.options || []).map((o, k) => `
          <span class="cfg-opt"><input ${at} data-o="${k}" value="${esc(o)}" size="${fitSize(o)}" aria-label="Opzione"><button class="x" data-act="delOpt" ${at} data-o="${k}" title="Rimuovi opzione">✕</button></span>`).join('')}
        <span class="cfg-add"><input ${at} data-newopt placeholder="Nuova opzione…" aria-label="Nuova opzione"><button data-act="addOpt" ${at}>+ Aggiungi</button></span>
      </div>`;
    }
    if (q.type === 'range') {
      const num = (f, l) => `<label>${l}<input type="number" ${at} data-f="${f}" value="${esc(q[f])}"></label>`;
      return `<div class="cfg-range">${num('min', 'Minimo €')}${num('max', 'Massimo €')}${num('step', 'Scatto €')}${num('from', 'Predefinito da €')}${num('to', 'Predefinito a €')}</div>`;
    }
    return `<div class="cfg-range"><label class="wide">Testo di esempio nel campo<input ${at} data-f="placeholder" value="${esc(q.placeholder || '')}"></label></div>`;
  };

  const renderConfig = () => {
    $('#cfgTypes').innerHTML = draft.types.map((t, i) => `
      <div class="cfg-type">
        <select data-t="${i}" data-f="icon" aria-label="Icona">${Object.entries(ICONS).map(([k, l]) => `<option value="${k}" ${t.icon === k ? 'selected' : ''}>Icona: ${l}</option>`).join('')}</select>
        <input data-t="${i}" data-f="label" value="${esc(t.label)}" placeholder="Nome tipologia" aria-label="Nome tipologia">
        <button class="icon-btn danger" data-act="delType" data-t="${i}" title="Elimina tipologia">✕</button>
      </div>`).join('');

    $('#cfgSteps').innerHTML = draft.steps.map((st, s) => `
      <article class="cfg-step" id="cfg-step-${s}">
        <header class="cfg-step__head">
          <span class="cfg-num">${s + 2}</span>
          <input class="cfg-title" data-s="${s}" data-f="title" value="${esc(st.title)}" placeholder="Titolo del passaggio" aria-label="Titolo del passaggio">
          <div class="cfg-tools">
            <button class="icon-btn" data-act="upStep" data-s="${s}" title="Sposta su" ${s === 0 ? 'disabled' : ''}>↑</button>
            <button class="icon-btn" data-act="downStep" data-s="${s}" title="Sposta giù" ${s === draft.steps.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="icon-btn danger" data-act="delStep" data-s="${s}" title="Elimina passaggio">✕</button>
          </div>
        </header>
        <div class="cfg-for">
          <span>Mostra per:</span>
          ${draft.types.map(t => `<label class="pill"><input type="checkbox" data-s="${s}" data-f="types" data-type="${esc(t.id)}" ${(!st.types || !st.types.length || st.types.includes(t.id)) ? 'checked' : ''}> ${esc(t.label)}</label>`).join('')}
        </div>
        <div class="cfg-qs">
          ${st.questions.map((q, j) => `
            <div class="cfg-q">
              <div class="cfg-q__row">
                <input class="cfg-q__label" data-s="${s}" data-q="${j}" data-f="label" value="${esc(q.label)}" placeholder="Testo della domanda" aria-label="Domanda">
                <select data-s="${s}" data-q="${j}" data-f="type" aria-label="Tipo di risposta">${Object.entries(QTYPES).map(([k, l]) => `<option value="${k}" ${q.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
                <label class="pill"><input type="checkbox" data-s="${s}" data-q="${j}" data-f="required" ${q.required ? 'checked' : ''}> Obbligatoria</label>
                <button class="icon-btn danger" data-act="delQ" data-s="${s}" data-q="${j}" title="Elimina domanda">✕</button>
              </div>
              ${questionBody(s, j, q)}
            </div>`).join('')}
        </div>
        <button class="btn btn--ghost btn--sm" data-act="addQ" data-s="${s}">+ Aggiungi domanda</button>
      </article>`).join('');
  };

  const cfgRoot = $('#tab-config');

  cfgRoot.addEventListener('input', (e) => {
    const el = e.target, d = el.dataset;
    if (d.newopt !== undefined || !('s' in d || 't' in d)) return;

    if (d.t !== undefined) {
      draft.types[+d.t][d.f] = el.value;
    } else {
      const step = draft.steps[+d.s];
      if (d.o !== undefined) {
        step.questions[+d.q].options[+d.o] = el.value;
        el.size = fitSize(el.value);
      } else if (d.q !== undefined) {
        const q = step.questions[+d.q];
        if (el.type === 'checkbox') q[d.f] = el.checked;
        else if (el.type === 'number') q[d.f] = el.value === '' ? '' : +el.value;
        else q[d.f] = el.value;
        if (d.f === 'type') {
          if ((q.type === 'choice' || q.type === 'multi') && !(q.options && q.options.length)) q.options = ['Opzione 1', 'Opzione 2'];
          if (q.type === 'range' && q.min == null) Object.assign(q, { min: 0, max: 3000, step: 50, from: 500, to: 1500 });
          renderConfig();
        }
      } else if (d.f === 'types') {
        const all = draft.types.map(t => t.id);
        let list = (!step.types || !step.types.length) ? [...all] : [...step.types];
        list = el.checked ? [...new Set([...list, d.type])] : list.filter(x => x !== d.type);
        step.types = all.filter(id => list.includes(id));
      } else {
        step[d.f] = el.value;
      }
    }
    setDirty();
  });

  // Il nome di una tipologia compare anche nei passaggi: aggiorna quando si esce dal campo
  cfgRoot.addEventListener('change', (e) => { if (e.target.dataset.t !== undefined && e.target.dataset.f === 'label') renderConfig(); });

  const addOption = (s, j) => {
    const input = cfgRoot.querySelector(`[data-newopt][data-s="${s}"][data-q="${j}"]`);
    const v = input.value.trim();
    if (!v) { input.focus(); return; }
    const q = draft.steps[s].questions[j];
    if (q.options.some(o => o.trim().toLowerCase() === v.toLowerCase())) { toast('Questa opzione esiste già', true); return; }
    q.options.push(v);
    setDirty();
    renderConfig();
    cfgRoot.querySelector(`[data-newopt][data-s="${s}"][data-q="${j}"]`).focus();
  };

  cfgRoot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.newopt !== undefined) {
      e.preventDefault();
      addOption(+e.target.dataset.s, +e.target.dataset.q);
    }
  });

  cfgRoot.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const d = btn.dataset, s = +d.s, j = +d.q;
    const steps = draft.steps;

    switch (d.act) {
      case 'addType': {
        const all = draft.types.map(t => t.id);
        const id = uid('tipo');
        draft.types.push({ id, label: 'Nuova tipologia', icon: 'component' });
        // i passaggi validi per tutte le tipologie valgono anche per la nuova
        steps.forEach(st => { if (!st.types || !st.types.length || all.every(x => st.types.includes(x))) st.types = [...all, id]; });
        renderConfig();
        cfgRoot.querySelector(`[data-t="${draft.types.length - 1}"][data-f="label"]`).select();
        break;
      }
      case 'delType': {
        if (draft.types.length === 1) return toast('Serve almeno una tipologia', true);
        const t = draft.types[+d.t];
        if (!confirm(`Eliminare la tipologia "${t.label}"?`)) return;
        draft.types.splice(+d.t, 1);
        steps.forEach(st => { st.types = (st.types || []).filter(x => x !== t.id); });
        renderConfig();
        break;
      }
      case 'addStep':
        steps.push({ id: uid('step'), title: 'Nuovo passaggio', types: draft.types.map(t => t.id), questions: [newQuestion()] });
        renderConfig();
        $('#cfg-step-' + (steps.length - 1)).scrollIntoView({ behavior: 'smooth', block: 'center' });
        cfgRoot.querySelector(`.cfg-title[data-s="${steps.length - 1}"]`).select();
        break;
      case 'delStep':
        if (!confirm(`Eliminare il passaggio "${steps[s].title}" e tutte le sue domande?`)) return;
        steps.splice(s, 1);
        renderConfig();
        break;
      case 'upStep':
      case 'downStep': {
        const k = d.act === 'upStep' ? s - 1 : s + 1;
        [steps[s], steps[k]] = [steps[k], steps[s]];
        renderConfig();
        break;
      }
      case 'addQ':
        steps[s].questions.push(newQuestion());
        renderConfig();
        cfgRoot.querySelector(`.cfg-q__label[data-s="${s}"][data-q="${steps[s].questions.length - 1}"]`).select();
        break;
      case 'delQ':
        if (steps[s].questions.length === 1) return toast('Un passaggio deve avere almeno una domanda: elimina il passaggio', true);
        if (!confirm(`Eliminare la domanda "${steps[s].questions[j].label}"?`)) return;
        steps[s].questions.splice(j, 1);
        renderConfig();
        break;
      case 'addOpt':
        addOption(s, j);
        return;
      case 'delOpt': {
        const q = steps[s].questions[j];
        if (q.options.length === 1) return toast('Serve almeno un\'opzione', true);
        q.options.splice(+d.o, 1);
        renderConfig();
        break;
      }
      default: return;
    }
    setDirty();
  });

  // Controlla e pulisce la configurazione prima di salvarla
  const validateConfig = () => {
    const c = SIGMA.clone(draft);
    if (!c.types.length) return ['Serve almeno una tipologia'];
    for (const t of c.types) { t.label = t.label.trim(); if (!t.label) return ['Ogni tipologia deve avere un nome']; }
    for (const [i, st] of c.steps.entries()) {
      st.title = st.title.trim();
      if (!st.title) return [`Il passaggio ${i + 2} non ha un titolo`];
      if (st.types && st.types.length === 0) return [`Il passaggio "${st.title}" non è attivo per nessuna tipologia`];
      for (const q of st.questions) {
        q.label = q.label.trim();
        if (!q.label) return [`Una domanda in "${st.title}" non ha il testo`];
        if (q.type === 'choice' || q.type === 'multi') {
          q.options = [...new Set(q.options.map(o => o.trim()).filter(Boolean))];
          if (!q.options.length) return [`La domanda "${q.label}" non ha opzioni`];
        }
        if (q.type === 'range') {
          for (const f of ['min', 'max', 'step', 'from', 'to']) if (q[f] === '' || isNaN(q[f])) return [`Completa i valori della fascia "${q.label}"`];
          if (q.min >= q.max) return [`Nella fascia "${q.label}" il minimo deve essere inferiore al massimo`];
          if (q.step <= 0) return [`Nella fascia "${q.label}" lo scatto deve essere maggiore di zero`];
          q.from = Math.max(q.min, Math.min(q.from, q.max));
          q.to = Math.max(q.from, Math.min(q.to, q.max));
        }
      }
    }
    return [null, c];
  };

  const saveConfig = () => {
    const [error, clean] = validateConfig();
    if (error) return toast(error, true);
    SIGMA.saveQuoteConfig(clean);
    draft = clean;
    renderConfig();
    setDirty(false);
    toast('Preventivo salvato: le modifiche sono attive sul sito');
  };
  $('#cfgSave').addEventListener('click', saveConfig);
  $('#cfgSave2').addEventListener('click', saveConfig);

  $('#cfgReset').addEventListener('click', () => {
    if (!confirm('Ripristinare il preventivo predefinito? Le tue tipologie e domande personalizzate verranno perse.')) return;
    SIGMA.resetQuoteConfig();
    draft = SIGMA.clone(SIGMA.DEFAULT_QUOTE);
    renderConfig();
    setDirty(false);
    toast('Preventivo ripristinato');
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

  // Aggiorna gli elenchi se arrivano dati da un'altra scheda del browser
  addEventListener('storage', (e) => {
    if (e.key === 'sigma.quotes') renderQuotes();
    if (e.key === 'sigma.reviews') renderReviews();
  });

  if (sessionStorage.getItem(SESSION)) showApp();
})();
