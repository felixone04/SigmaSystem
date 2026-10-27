(() => {
  const c = SIGMA.content();

  // Testi modificabili dal gestionale
  document.querySelectorAll('[data-key]').forEach(el => {
    if (c[el.dataset.key] !== undefined) el.textContent = c[el.dataset.key];
  });
  document.querySelectorAll('[data-tel]').forEach(a => a.href = 'tel:+39' + c.phone.replace(/\D/g, ''));
  document.querySelectorAll('[data-mail]').forEach(a => a.href = 'mailto:' + c.email);
  document.getElementById('year').textContent = new Date().getFullYear();

  // Navbar
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('nav--solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = document.getElementById('navLinks');
  document.getElementById('navToggle').addEventListener('click', () => nav.classList.toggle('nav--open'));
  links.addEventListener('click', e => { if (e.target.closest('a')) nav.classList.remove('nav--open'); });

  // Animazioni all'ingresso
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

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
