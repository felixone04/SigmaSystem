/* Recensioni: mostra quelle approvate e raccoglie le nuove (da approvare nel gestionale) */
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const stars = (r) => `<span class="stars" style="--r:${r}" aria-label="${r} su 5">★★★★★</span>`;

  const track = $('#rvTrack');
  const list = SIGMA.approvedReviews();

  if (list.length) {
    const avg = list.reduce((s, r) => s + +r.rating, 0) / list.length;
    $('#rvSummary').innerHTML = `<span class="rv-avg">${avg.toFixed(1).replace('.', ',')}</span>${stars(avg)}
      <span class="rv-count">${list.length} ${list.length === 1 ? 'recensione' : 'recensioni'}</span>`;
    track.innerHTML = list.map(r => `
      <article class="rv-card">
        ${stars(r.rating)}
        <p>“${esc(r.text)}”</p>
        <footer>
          <span class="rv-avatar">${esc(r.name.trim().charAt(0).toUpperCase())}</span>
          <span><strong>${esc(r.name)}</strong><small>${new Date(r.date).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</small></span>
        </footer>
      </article>`).join('');
  } else {
    $('#rvSummary').innerHTML = '<p class="rv-empty">Ancora nessuna recensione: racconta per primo la tua esperienza con noi.</p>';
  }

  // Pulsante per le recensioni su Google: compare solo se il link è impostato nel gestionale
  const googleUrl = (SIGMA.content().google_review_url || '').trim();
  if (/^https:\/\/\S+$/i.test(googleUrl)) {
    $('#rvGoogle').href = googleUrl;
    $('#rvGoogle').hidden = false;
  }

  // Frecce visibili solo se le recensioni non entrano tutte
  const arrows = $('#rvArrows');
  const checkArrows = () => { arrows.hidden = track.scrollWidth <= track.clientWidth + 4; };
  addEventListener('resize', checkArrows);
  checkArrows();
  arrows.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dir]');
    if (!b) return;
    const card = track.querySelector('.rv-card');
    track.scrollBy({ left: +b.dataset.dir * (card ? card.offsetWidth + 24 : 300), behavior: 'smooth' });
  });

  // --- Finestra per scrivere una recensione ---
  const dialog = $('#rvDialog');
  const form = $('#rvForm');
  const starBtns = [...document.querySelectorAll('#rvStars button')];
  let rating = 0;

  const paintStars = (n) => starBtns.forEach(b => {
    b.classList.toggle('on', +b.dataset.v <= n);
    b.setAttribute('aria-checked', +b.dataset.v === rating);
  });
  starBtns.forEach(b => {
    b.addEventListener('click', () => { rating = +b.dataset.v; paintStars(rating); $('#rvError').textContent = ''; });
    b.addEventListener('mouseenter', () => paintStars(+b.dataset.v));
  });
  $('#rvStars').addEventListener('mouseleave', () => paintStars(rating));

  $('#rvOpen').addEventListener('click', () => {
    form.reset();
    rating = 0; paintStars(0);
    $('#rvError').textContent = '';
    $('#rvFormBody').hidden = false;
    $('#rvDone').hidden = true;
    dialog.showModal();
  });
  $('#rvClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = f.get('name').trim();
    const text = f.get('text').trim();
    let problem = '';
    if (!rating) problem = 'Scegli da 1 a 5 stelle.';
    else if (!name) problem = 'Inserisci il tuo nome.';
    else if (text.length < 10) problem = 'Scrivi almeno qualche parola sulla tua esperienza.';
    else if (!f.get('privacy')) problem = 'Serve il consenso alla pubblicazione.';
    if (problem) { $('#rvError').textContent = problem; return; }

    SIGMA.addReview({ name, rating, text });
    $('#rvFormBody').hidden = true;
    $('#rvDone').hidden = false;
    setTimeout(() => dialog.open && dialog.close(), 3500);
  });
})();
