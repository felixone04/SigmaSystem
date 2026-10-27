(() => {
  const c = SIGMA.content();

  // Testi modificabili dal gestionale
  document.querySelectorAll('[data-key]').forEach(el => {
    if (c[el.dataset.key] !== undefined) el.textContent = c[el.dataset.key];
  });
  document.querySelectorAll('[data-tel]').forEach(a => a.href = 'tel:+39' + c.phone.replace(/\D/g, ''));
  document.querySelectorAll('[data-mail]').forEach(a => a.href = 'mailto:' + c.email);
  document.getElementById('year').textContent = new Date().getFullYear();

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
