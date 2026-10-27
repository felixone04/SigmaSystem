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
  let lastY = 0, ticking = false;

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
