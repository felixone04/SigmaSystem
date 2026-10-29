/* Preventivo a passi: costruito dalla configurazione modificabile nel gestionale */
(() => {
  const cfg = SIGMA.quoteConfig();
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const wizard = $('#wizard');
  const stage = $('#wzStage');
  const back = $('#wzBack');
  const next = $('#wzNext');
  const err = $('#wzError');
  const nav = $('#wzNav');
  const reset = $('#wzReset');

  const ICONS = {
    laptop: '<svg viewBox="0 0 48 48"><rect x="9" y="10" width="30" height="20" rx="2"/><path d="M4 36h40l-3 3H7z"/></svg>',
    desktop: '<svg viewBox="0 0 48 48"><rect x="5" y="8" width="26" height="19" rx="2"/><path d="M14 33h8M18 27v6"/><rect x="35" y="8" width="9" height="30" rx="1.5"/><circle cx="39.5" cy="14" r="1.5"/></svg>',
    tablet: '<svg viewBox="0 0 48 48"><rect x="11" y="5" width="26" height="38" rx="3"/><path d="M22 38h4"/></svg>',
    monitor: '<svg viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="25" rx="2"/><path d="M18 40h12M24 32v8"/></svg>',
    server: '<svg viewBox="0 0 48 48"><rect x="9" y="6" width="30" height="11" rx="2"/><rect x="9" y="19" width="30" height="11" rx="2"/><rect x="9" y="32" width="30" height="11" rx="2"/><path d="M15 11.5h4M15 24.5h4M15 37.5h4"/></svg>',
    component: '<svg viewBox="0 0 48 48"><rect x="14" y="14" width="20" height="20" rx="2"/><rect x="20" y="20" width="8" height="8"/><path d="M19 8v6M24 8v6M29 8v6M19 34v6M24 34v6M29 34v6M8 19h6M8 24h6M8 29h6M34 19h6M34 24h6M34 29h6"/></svg>',
    printer: '<svg viewBox="0 0 48 48"><path d="M14 18V6h20v12"/><rect x="6" y="18" width="36" height="16" rx="2"/><rect x="14" y="28" width="20" height="14"/></svg>',
    custom: '<svg viewBox="0 0 48 48"><path d="M8 10h32a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H22l-9 7v-7H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z"/><path d="M14 19h20M14 25h13"/></svg>'
  };

  // Richiesta personalizzata: sempre disponibile accanto alle tipologie configurate
  const CUSTOM = { id: '__custom', label: 'Richiesta personalizzata' };

  const fresh = () => ({ i: 0, type: null, answers: {}, custom: '', photos: [], contact: { name: '', phone: '', email: '', notes: '', privacy: false } });
  let state = fresh();

  const isCustom = () => state.type === CUSTOM.id;
  const typeLabel = () => isCustom() ? CUSTOM.label : (cfg.types.find(t => t.id === state.type) || {}).label || '';
  const stepsFor = () => isCustom()
    ? [
      { kind: 'type', title: 'Cosa ti serve?' },
      { kind: 'custom', title: 'Descrivi la tua richiesta' },
      { kind: 'contact', title: 'I tuoi dati' },
      { kind: 'summary', title: 'Riepilogo' }
    ]
    : [
      { kind: 'type', title: 'Cosa ti serve?' },
      ...cfg.steps
        .filter(s => !s.types || !s.types.length || (state.type && s.types.includes(state.type)))
        .map(s => ({ kind: 'step', ...s })),
      { kind: 'contact', title: 'I tuoi dati' },
      { kind: 'summary', title: 'Riepilogo' }
    ];

  // Valore leggibile di una risposta
  const money = (n) => '€ ' + Number(n).toLocaleString('it-IT');
  const display = (q) => {
    const v = state.answers[q.id];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    if (q.type === 'multi') return v.join(', ');
    if (q.type === 'range') return `${money(v.from)} – ${money(v.to)}`;
    return String(v);
  };

  // ---------- Foto del guasto: massimo 2, ridotte nel browser per pesare poco ----------
  const MAX_PHOTOS = 2;
  const MAX_SIDE = 1280;
  const MAX_BYTES = 20 * 1024 * 1024;

  const photosHtml = () => `
    <div class="wz-photos wide" id="wzPhotos">
      <p class="wz-label">Foto del guasto <small>· facoltative, massimo ${MAX_PHOTOS}</small></p>
      <div class="ph-list">
        ${state.photos.map((p, i) => `<figure class="ph"><img src="${p.data}" alt="Foto ${i + 1}">
          <button type="button" class="ph-del" data-del="${i}" aria-label="Rimuovi foto ${i + 1}">✕</button></figure>`).join('')}
        ${state.photos.length < MAX_PHOTOS ? `<label class="ph-add" tabindex="0">
          <input type="file" accept="image/*" multiple data-photos hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
          <span>Aggiungi foto<small>scatta o scegli dalla galleria</small></span></label>` : ''}
      </div>
    </div>`;

  const refreshPhotos = () => {
    const box = stage.querySelector('#wzPhotos');
    if (box) box.outerHTML = photosHtml();
    reset.hidden = !hasChoices();
  };

  const shrink = (file) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('type'));
    if (file.size > MAX_BYTES) return reject(new Error('size'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * k);
      cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', data: cv.toDataURL('image/jpeg', 0.72) });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });

  const addPhotos = async (files) => {
    const room = MAX_PHOTOS - state.photos.length;
    const list = [...files].slice(0, room);
    let problem = files.length > room ? `Puoi allegare al massimo ${MAX_PHOTOS} foto.` : '';
    for (const f of list) {
      try { state.photos.push(await shrink(f)); }
      catch (e) { problem = e.message === 'size' ? 'Foto troppo grande: massimo 20 MB.' : 'Questo file non è un\'immagine supportata.'; }
    }
    refreshPhotos();
    err.textContent = problem;
  };

  // ---------- Render dei passaggi ----------
  const optButton = (q, opt) => {
    const v = state.answers[q.id];
    const on = q.type === 'multi' ? (v || []).includes(opt) : v === opt;
    return `<button type="button" class="opt ${q.type === 'multi' ? 'opt--multi' : ''}" aria-pressed="${on}" data-q="${esc(q.id)}" data-v="${esc(opt)}">
      <span class="opt__mark"></span><span>${esc(opt)}</span></button>`;
  };

  const rangeHtml = (q) => {
    if (!state.answers[q.id]) state.answers[q.id] = { from: q.from ?? q.min, to: q.to ?? q.max };
    const v = state.answers[q.id];
    return `<div class="range" data-q="${esc(q.id)}">
      <div class="range__vals">
        <label>Da<span class="money"><i>€</i><input type="number" inputmode="numeric" data-r="from" min="${q.min}" max="${q.max}" step="${q.step}" value="${v.from}"></span></label>
        <label>A<span class="money"><i>€</i><input type="number" inputmode="numeric" data-r="to" min="${q.min}" max="${q.max}" step="${q.step}" value="${v.to}"></span></label>
      </div>
      <div class="range__slider">
        <i class="range__fill"></i>
        <input type="range" data-r="from" min="${q.min}" max="${q.max}" step="${q.step}" value="${v.from}" aria-label="Prezzo minimo">
        <input type="range" data-r="to" min="${q.min}" max="${q.max}" step="${q.step}" value="${v.to}" aria-label="Prezzo massimo">
      </div>
      <div class="range__ends"><span>${money(q.min)}</span><span>${money(q.max)}+</span></div>
    </div>`;
  };

  const questionHtml = (q) => {
    const hint = q.type === 'multi' ? ' <small>· anche più scelte</small>' : '';
    const opt = q.required ? '' : ' <small>· facoltativo</small>';
    let body = '';
    if (q.type === 'choice' || q.type === 'multi') body = `<div class="wz-opts">${(q.options || []).map(o => optButton(q, o)).join('')}</div>`;
    else if (q.type === 'range') body = rangeHtml(q);
    else body = `<textarea class="wz-text" data-q="${esc(q.id)}" rows="3" placeholder="${esc(q.placeholder || '')}">${esc(state.answers[q.id] || '')}</textarea>`;
    return `<div class="wz-q"><p class="wz-label">${esc(q.label)}${hint}${opt}</p>${body}</div>`;
  };

  const stepHtml = (step, steps) => {
    if (step.kind === 'type') {
      return `<h3>${esc(step.title)}</h3><div class="wz-opts wz-types">${cfg.types.map(t => `
        <button type="button" class="opt opt-type" aria-pressed="${state.type === t.id}" data-type="${esc(t.id)}">
          ${ICONS[t.icon] || ICONS.component}<span>${esc(t.label)}</span></button>`).join('')}
        <button type="button" class="opt opt-type opt-type--custom" aria-pressed="${isCustom()}" data-type="${CUSTOM.id}">
          ${ICONS.custom}<span>${CUSTOM.label}<small>Descrivi tu cosa ti serve</small></span></button>
      </div>`;
    }
    if (step.kind === 'step') {
      return `<h3>${esc(step.title)}</h3>${step.questions.map(questionHtml).join('')}`;
    }
    if (step.kind === 'custom') {
      return `<h3>${esc(step.title)}</h3>
        <p class="wz-hint">Raccontaci di cosa hai bisogno: una riparazione, un componente particolare, una configurazione su misura, una consulenza…</p>
        <textarea class="wz-text" data-custom rows="7" maxlength="2000" placeholder="Es. Vorrei aggiornare il mio PC per il montaggio video, oggi ha 8 GB di RAM e un disco lento…">${esc(state.custom)}</textarea>
        ${photosHtml()}`;
    }
    if (step.kind === 'contact') {
      const c = state.contact;
      return `<h3>${esc(step.title)}</h3>
        <div class="wz-form">
          <label>Nome e cognome *<input data-c="name" value="${esc(c.name)}" autocomplete="name"></label>
          <label>Telefono<input data-c="phone" type="tel" value="${esc(c.phone)}" autocomplete="tel"></label>
          <label class="wide">Email *<input data-c="email" type="email" value="${esc(c.email)}" autocomplete="email"></label>
          <label class="wide">Note o richieste particolari<textarea data-c="notes" rows="3">${esc(c.notes)}</textarea></label>
          ${isCustom() ? '' : photosHtml()}
          <label class="check wide"><input type="checkbox" data-c="privacy" ${c.privacy ? 'checked' : ''}> <span>Acconsento al trattamento dei dati per essere ricontattato (<a href="privacy.html" target="_blank">informativa privacy</a>).</span></label>
        </div>`;
    }
    // Riepilogo
    const rows = [`<div class="wz-sum__row"><div><h4>Tipologia</h4><p>${esc(typeLabel())}</p></div><button type="button" class="wz-edit" data-goto="0">Modifica</button></div>`];
    if (isCustom()) rows.push(`<div class="wz-sum__row"><div><h4>Descrizione</h4><p class="pre">${esc(state.custom.trim())}</p></div><button type="button" class="wz-edit" data-goto="1">Modifica</button></div>`);
    steps.forEach((s, idx) => {
      if (s.kind !== 'step') return;
      const items = s.questions.map(q => [q.label, display(q)]).filter(([, v]) => v);
      if (!items.length) return;
      rows.push(`<div class="wz-sum__row"><div><h4>${esc(s.title)}</h4>${items.map(([l, v]) => `<p><span>${esc(l)}:</span> ${esc(v)}</p>`).join('')}</div>
        <button type="button" class="wz-edit" data-goto="${idx}">Modifica</button></div>`);
    });
    if (state.photos.length) {
      rows.push(`<div class="wz-sum__row"><div><h4>Foto del guasto</h4><div class="ph-list ph-list--sm">${state.photos.map((p, i) => `<img src="${p.data}" alt="Foto ${i + 1}">`).join('')}</div></div>
        <button type="button" class="wz-edit" data-goto="${isCustom() ? 1 : steps.length - 2}">Modifica</button></div>`);
    }
    const c = state.contact;
    rows.push(`<div class="wz-sum__row"><div><h4>Contatti</h4><p>${esc(c.name)}</p><p>${esc([c.email, c.phone].filter(Boolean).join(' · '))}</p>${c.notes ? `<p>${esc(c.notes)}</p>` : ''}</div>
      <button type="button" class="wz-edit" data-goto="${steps.length - 2}">Modifica</button></div>`);
    return `<h3>${esc(step.title)}</h3><div class="wz-sum">${rows.join('')}</div>`;
  };

  const render = (dir = 0) => {
    const steps = stepsFor();
    state.i = Math.min(state.i, steps.length - 1);
    const step = steps[state.i];

    $('#wzCount').textContent = state.type ? `Passo ${state.i + 1} di ${steps.length}` : 'Passo 1';
    $('#wzName').textContent = typeLabel();
    $('#wzBar').style.width = (state.type ? (state.i + 1) / steps.length * 100 : 6) + '%';

    stage.innerHTML = `<div class="wz-step ${dir > 0 ? 'from-right' : dir < 0 ? 'from-left' : ''}">${stepHtml(step, steps)}</div>`;
    back.classList.toggle('is-hidden', state.i === 0);
    reset.hidden = !hasChoices();
    disarmReset();
    next.textContent = step.kind === 'summary' ? 'Invia richiesta ✓' : step.kind === 'contact' ? 'Riepilogo →' : 'Avanti →';
    err.textContent = '';
    stage.querySelectorAll('.range').forEach(syncRange);
  };

  // --- Azzera scelte: chiede conferma con un secondo tocco ---
  const hasChoices = () => !!(state.type || state.custom.trim() || state.photos.length || Object.keys(state.answers).length ||
    Object.values(state.contact).some(v => v && v !== false));
  const RESET_LABEL = '↺ Azzera scelte';
  const disarmReset = () => { clearTimeout(reset.timer); reset.classList.remove('armed'); reset.textContent = RESET_LABEL; };
  reset.addEventListener('click', () => {
    if (!reset.classList.contains('armed')) {
      reset.classList.add('armed');
      reset.textContent = 'Tocca di nuovo per azzerare';
      reset.timer = setTimeout(disarmReset, 3000);
      return;
    }
    state = fresh();
    nav.hidden = false;
    render(-1);
    scrollToWizard();
  });

  const scrollToWizard = () => {
    const top = wizard.getBoundingClientRect().top;
    if (top < 60 || top > innerHeight * 0.5) scrollTo({ top: scrollY + top - 90, behavior: 'smooth' });
  };
  const go = (i, dir) => { state.i = i; render(dir); scrollToWizard(); };

  // ---------- Validazione ----------
  const validate = (step) => {
    if (step.kind === 'type') return state.type ? '' : 'Scegli una tipologia per continuare.';
    if (step.kind === 'custom' && state.custom.trim().length < 10) return 'Descrivi la tua richiesta con qualche parola in più.';
    if (step.kind === 'step') {
      for (const q of step.questions) {
        const v = state.answers[q.id];
        if (q.type === 'range' && v && (v.from === '' || v.to === '')) return 'Inserisci il prezzo minimo e massimo.';
        if (q.type === 'range' && v && +v.from > +v.to) return 'Il prezzo minimo non può superare il massimo.';
        if (q.required && !display(q)) return `Rispondi a: ${q.label}`;
      }
    }
    if (step.kind === 'contact') {
      const c = state.contact;
      if (!c.name.trim()) return 'Inserisci il tuo nome.';
      if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) return 'Inserisci un indirizzo email valido.';
      if (!c.privacy) return 'Serve il consenso per poterti ricontattare.';
    }
    return '';
  };

  // ---------- Eventi ----------
  const autoNext = () => setTimeout(() => next.click(), 280);

  stage.addEventListener('click', (e) => {
    const steps = stepsFor();
    const step = steps[state.i];

    const del = e.target.closest('.ph-del');
    if (del) {
      state.photos.splice(+del.dataset.del, 1);
      refreshPhotos();
      return;
    }

    const t = e.target.closest('.opt-type');
    if (t) {
      state.type = t.dataset.type;
      stage.querySelectorAll('.opt-type').forEach(b => b.setAttribute('aria-pressed', b === t));
      $('#wzName').textContent = typeLabel();
      reset.hidden = false;
      autoNext();
      return;
    }

    const o = e.target.closest('.opt');
    if (o) {
      const q = step.questions.find(x => x.id === o.dataset.q);
      const v = o.dataset.v;
      if (q.type === 'multi') {
        const list = state.answers[q.id] || [];
        state.answers[q.id] = list.includes(v) ? list.filter(x => x !== v) : [...list, v];
      } else {
        // un secondo tocco sulla stessa scelta la deseleziona
        if (state.answers[q.id] === v) delete state.answers[q.id];
        else state.answers[q.id] = v;
      }
      stage.querySelectorAll(`.opt[data-q="${CSS.escape(q.id)}"]`).forEach(b => {
        const cur = state.answers[q.id];
        const on = q.type === 'multi' ? (cur || []).includes(b.dataset.v) : b.dataset.v === cur;
        b.setAttribute('aria-pressed', on);
      });
      err.textContent = '';
      reset.hidden = !hasChoices();
      // Un'unica domanda a scelta singola: si passa da soli al passo successivo
      if (q.type === 'choice' && step.questions.length === 1 && state.answers[q.id]) autoNext();
      return;
    }

    const edit = e.target.closest('.wz-edit');
    if (edit) go(+edit.dataset.goto, -1);
  });

  stage.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.c) {
      state.contact[el.dataset.c] = el.type === 'checkbox' ? el.checked : el.value;
    } else if (el.dataset.custom !== undefined) {
      state.custom = el.value;
    } else if (el.classList.contains('wz-text')) {
      state.answers[el.dataset.q] = el.value;
    } else if (el.dataset.r) {
      const box = el.closest('.range');
      const v = state.answers[box.dataset.q];
      v[el.dataset.r] = el.value === '' ? '' : +el.value;
      if (el.type === 'range') {
        // i due cursori non si scavalcano
        if (v.from > v.to) { if (el.dataset.r === 'from') v.from = v.to; else v.to = v.from; }
      }
      syncRange(box, el);
    }
    err.textContent = '';
  });
  stage.addEventListener('change', (e) => {
    if (e.target.dataset.c === 'privacy') state.contact.privacy = e.target.checked;
    if (e.target.dataset.photos !== undefined && e.target.files.length) addPhotos(e.target.files);
  });
  stage.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('ph-add') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.target.querySelector('input').click();
      return;
    }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); next.click(); }
  });

  // Trascina e rilascia le foto sul riquadro "Aggiungi foto" (computer)
  stage.addEventListener('dragover', (e) => {
    const zone = e.target.closest('.ph-add');
    if (!zone) return;
    e.preventDefault();
    zone.classList.add('drag');
  });
  stage.addEventListener('dragleave', (e) => { e.target.closest('.ph-add')?.classList.remove('drag'); });
  stage.addEventListener('drop', (e) => {
    const zone = e.target.closest('.ph-add');
    if (!zone) return;
    e.preventDefault();
    addPhotos(e.dataTransfer.files);
  });

  function syncRange(box, source) {
    const q = cfg.steps.flatMap(s => s.questions).find(x => x.id === box.dataset.q);
    const v = state.answers[q.id];
    box.querySelectorAll('[data-r]').forEach(inp => { if (inp !== source) inp.value = v[inp.dataset.r]; });
    const pct = (n) => Math.max(0, Math.min(100, ((+n || q.min) - q.min) / (q.max - q.min) * 100));
    box.style.setProperty('--a', pct(v.from) + '%');
    box.style.setProperty('--b', pct(v.to) + '%');
  }

  back.addEventListener('click', () => { if (state.i > 0) go(state.i - 1, -1); });

  next.addEventListener('click', () => {
    const steps = stepsFor();
    const step = steps[state.i];
    const problem = validate(step);
    if (problem) {
      err.textContent = problem;
      wizard.classList.remove('shake'); void wizard.offsetWidth; wizard.classList.add('shake');
      return;
    }
    if (step.kind === 'summary') return submit(steps);
    go(state.i + 1, 1);
  });

  const submit = (steps) => {
    const sections = isCustom()
      ? [{ title: 'Descrizione', items: [{ label: 'Richiesta del cliente', value: state.custom.trim() }] }]
      : steps.filter(s => s.kind === 'step').map(s => ({
        title: s.title,
        items: s.questions.map(q => ({ label: q.label, value: display(q) })).filter(x => x.value)
      })).filter(s => s.items.length);
    const budgetQ = isCustom() ? null : steps.filter(s => s.kind === 'step').flatMap(s => s.questions).find(q => q.type === 'range' && state.answers[q.id]);
    const c = state.contact;
    const record = {
      type: typeLabel(),
      name: c.name.trim(), email: c.email.trim(), phone: c.phone.trim(), notes: c.notes.trim(),
      budget: budgetQ ? display(budgetQ) : '',
      sections,
      photos: state.photos
    };
    // Se lo spazio di salvataggio è pieno, la richiesta parte comunque senza foto
    let photosLost = false;
    if (!SIGMA.addQuote(record)) {
      photosLost = record.photos.length > 0;
      if (!SIGMA.addQuote({ ...record, photos: [] })) {
        err.textContent = 'Non è stato possibile inviare la richiesta. Riprova tra poco.';
        return;
      }
    }

    $('#wzBar').style.width = '100%';
    $('#wzCount').textContent = 'Inviato';
    nav.hidden = true;
    reset.hidden = true;
    stage.innerHTML = `<div class="wz-step wz-done">
      <div class="done-check">✓</div>
      <h3>Richiesta inviata!</h3>
      <p>Grazie ${esc(c.name.trim().split(' ')[0])}, ti ricontatteremo al più presto ${isCustom() ? 'per la tua richiesta' : `con la proposta per il tuo ${esc(typeLabel().toLowerCase())}`}.</p>
      ${photosLost ? '<p class="wz-hint">Le foto non sono state allegate: potrai mostrarcele in negozio o quando ti ricontattiamo.</p>' : ''}
      <button type="button" class="btn-ghost" id="wzRestart">Nuovo preventivo</button>
    </div>`;
    $('#wzRestart').addEventListener('click', () => { state = fresh(); nav.hidden = false; render(-1); });
  };

  render();
})();
