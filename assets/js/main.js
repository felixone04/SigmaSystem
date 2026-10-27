(() => {
  const c = SIGMA.content();

  // Testi modificabili dal gestionale
  document.querySelectorAll('[data-key]').forEach(el => {
    if (c[el.dataset.key] !== undefined) el.textContent = c[el.dataset.key];
  });
  document.querySelectorAll('[data-tel]').forEach(a => a.href = 'tel:+39' + c.phone.replace(/\D/g, ''));
  document.querySelectorAll('[data-mail]').forEach(a => a.href = 'mailto:' + c.email);
  document.getElementById('year').textContent = new Date().getFullYear();

  // Menu a tendina su telefono
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const setOpen = (open) => {
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', open);
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('nav--open')));
  document.getElementById('navLinks').addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setOpen(false); });

  // Form contatti -> messaggi nel gestionale
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    SIGMA.addMessage(Object.fromEntries(new FormData(form)));
    form.reset();
    const ok = document.getElementById('formOk');
    ok.hidden = false;
    setTimeout(() => ok.hidden = true, 5000);
  });
})();
