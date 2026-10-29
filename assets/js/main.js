(() => {
  const c = SIGMA.content();
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const esc = (s) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  // --- Testi modificabili dal gestionale ---
  $$('[data-key]').forEach(el => {
    if (c[el.dataset.key] !== undefined) el.textContent = c[el.dataset.key];
  });
  $$('[data-tel]').forEach(a => a.href = 'tel:+39' + c.phone.replace(/\D/g, ''));
  $$('[data-mail]').forEach(a => a.href = 'mailto:' + c.email);
  $('#year').textContent = new Date().getFullYear();

  // --- Aperto ora / Chiuso, calcolato dagli orari scritti nel gestionale (ora italiana) ---
  const DAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const DAY_NAMES = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  // Riconosce testi come "Lun–Ven 9:00–13:00 · 16:30–20:00, Sab 9:00–13:00"
  const parseHours = (txt) => {
    const sched = {};
    const re = /\b(lun|mar|mer|gio|ven|sab|dom)[a-zìé]*\.?(?:\s*[–—-]\s*(lun|mar|mer|gio|ven|sab|dom)[a-zìé]*\.?)?|(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/gi;
    let days = null, m;
    while ((m = re.exec(txt))) {
      if (m[1]) {
        const a = DAYS.indexOf(m[1].toLowerCase()), b = m[2] ? DAYS.indexOf(m[2].toLowerCase()) : a;
        days = [];
        for (let d = a; ; d = (d + 1) % 7) { days.push(d); if (d === b) break; }
      } else if (days) {
        const from = +m[3] * 60 + +m[4], to = +m[5] * 60 + +m[6];
        days.forEach(d => (sched[d] = sched[d] || []).push([from, to]));
      }
    }
    Object.values(sched).forEach(s => s.sort((x, y) => x[0] - y[0]));
    return Object.keys(sched).length ? sched : null;
  };
  const romeNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: +p.hour * 60 + +p.minute };
  };
  const hhmm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const openStatus = (sched) => {
    const { day, min } = romeNow();
    const today = sched[day] || [];
    const cur = today.find(([f, t]) => min >= f && min < t);
    if (cur) return { open: true, text: `Aperto ora · chiude alle ${hhmm(cur[1])}` };
    const later = today.find(([f]) => f > min);
    if (later) return { open: false, text: `Chiuso ora · riapre alle ${hhmm(later[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (sched[d]) return { open: false, text: `Chiuso ora · apre ${i === 1 ? 'domani' : DAY_NAMES[d]} alle ${hhmm(sched[d][0][0])}` };
    }
    return null;
  };
  const hours = parseHours(c.hours);
  const badge = $('#openBadge');
  const paintBadge = () => {
    const s = hours && openStatus(hours);
    badge.hidden = !s;
    if (!s) return;
    badge.textContent = s.text;
    badge.classList.toggle('is-open', s.open);
  };
  paintBadge();
  setInterval(paintBadge, 60000);

  // Titolo: parole che compaiono una alla volta
  $$('.split').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w" style="transition-delay:${150 + i * 110}ms">${esc(w)}</span>`).join(' ');
  });

  // Parole che ruotano sotto il titolo
  const words = c.hero_words.split(',').map(w => w.trim()).filter(Boolean);
  const rotator = $('#rotator');
  if (words.length) {
    rotator.innerHTML = words.map(w => `<span>${esc(w)}</span>`).join('');
    const items = rotator.children;
    let i = 0;
    const show = () => {
      [...items].forEach((s, k) => { s.classList.toggle('in', k === i); });
    };
    setTimeout(() => {
      show();
      if (items.length > 1) setInterval(() => {
        items[i].classList.remove('in');
        items[i].classList.add('out');
        const prev = items[i];
        setTimeout(() => prev.classList.remove('out'), 700);
        i = (i + 1) % items.length;
        items[i].classList.add('in');
      }, 2600);
    }, reduced ? 0 : 1100);
  }

  // --- Intro ---
  const start = () => {
    $('#loader').classList.add('is-done');
    document.body.classList.add('is-ready');
  };
  if (reduced) start();
  else window.addEventListener('load', () => setTimeout(start, 1500));
  setTimeout(start, 3200); // sicurezza se "load" tarda

  // --- Navbar e barra di avanzamento ---
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const setOpen = (open) => {
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', open);
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('nav--open')));
  $('#navLinks').addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setOpen(false); });

  // --- Comparsa al passaggio ---
  $$('.reveal').forEach(el => el.style.setProperty('--d', (el.dataset.delay || 0) + 'ms'));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // --- Effetti legati allo scroll ---
  const progress = $('#progress');
  const steps = $('#steps');
  const stepEls = [...$$('.step')];
  const aboutMark = $('#aboutMark');
  const aboutSec = $('#azienda');
  const toTop = $('#toTop');
  const navLinks = [...$$('#navLinks a')].map(a => ({ a, sec: document.querySelector(a.getAttribute('href')) })).filter(x => x.sec);
  let lastY = 0, ticking = false;

  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? y / max : 0);

    nav.classList.toggle('nav--scrolled', y > 10);
    if (!nav.classList.contains('nav--open')) nav.classList.toggle('nav--hidden', y > lastY && y > 300);
    lastY = y;

    // Linea del metodo che si riempie scorrendo
    const r = steps.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height * 0.9)));
    steps.style.setProperty('--p', p);
    stepEls.forEach((s, k) => s.classList.toggle('is-active', p >= (k === 0 ? 0.02 : k / (stepEls.length - 1)) - 0.02));

    // Simbolo che ruota nella sezione azienda
    const a = aboutSec.getBoundingClientRect();
    aboutMark.style.setProperty('--rot', ((innerHeight - a.top) * 0.08).toFixed(1) + 'deg');

    // Menu: evidenzia la sezione in cui ci si trova (l'ultima il cui inizio ha superato un terzo dello schermo)
    let current = null;
    navLinks.forEach(x => { if (x.sec.getBoundingClientRect().top <= innerHeight * 0.35) current = x; });
    if (y + innerHeight >= document.documentElement.scrollHeight - 4) current = navLinks[navLinks.length - 1];
    navLinks.forEach(x => {
      const on = x === current;
      x.a.classList.toggle('is-active', on);
      if (on) x.a.setAttribute('aria-current', 'true'); else x.a.removeAttribute('aria-current');
    });

    // Pulsante torna su dopo il primo schermo
    toTop.classList.toggle('show', y > innerHeight * 0.9);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // --- Parallasse del portatile e dei componenti col mouse ---
  if (finePointer && !reduced) {
    const hero = $('#hero');
    const laptop = $('.laptop');
    const chips = [...$$('.chip')];
    hero.addEventListener('mousemove', e => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      laptop.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      laptop.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      chips.forEach(ch => {
        const d = +ch.dataset.depth;
        ch.style.setProperty('--px', (-x * d).toFixed(1) + 'px');
        ch.style.setProperty('--py', (-y * d).toFixed(1) + 'px');
      });
    });
    hero.addEventListener('mouseleave', () => {
      laptop.style.setProperty('--ry', '0deg');
      laptop.style.setProperty('--rx', '0deg');
    });

    // Schede servizi: inclinazione 3D + luce che segue il mouse
    $$('.card').forEach(card => {
      card.addEventListener('mouseenter', () => card.classList.add('is-hover'));
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        card.style.setProperty('--ty', ((x - 0.5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--tx', (-(y - 0.5) * 10).toFixed(2) + 'deg');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tx', '0deg');
        card.style.setProperty('--ty', '0deg');
        setTimeout(() => card.classList.remove('is-hover'), 250);
      });
    });
  }

})();
