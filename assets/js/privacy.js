/* Consenso cookie e mappa di Google caricata solo su richiesta */
(() => {
  const $ = (s) => document.querySelector(s);
  const c = SIGMA.content();
  const banner = $('#cookie');
  const map = $('#map');
  const cover = map.innerHTML;
  const query = encodeURIComponent(c.address);

  const bindCover = () => {
    $('#mapExt').href = `https://www.google.com/maps/search/?api=1&query=${query}`;
    $('#mapLoad').addEventListener('click', loadMap); // il clic vale come consenso per la sola mappa
  };

  function loadMap() {
    if (!map.classList.contains('map--off')) return;
    map.innerHTML = `<iframe title="Mappa del negozio" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://maps.google.com/maps?q=${query}&z=16&output=embed"></iframe>`;
    map.classList.remove('map--off');
  }

  const unloadMap = () => {
    if (map.classList.contains('map--off')) return;
    map.innerHTML = cover;
    map.classList.add('map--off');
    bindCover();
  };

  const applyConsent = () => {
    const k = SIGMA.consent();
    if (k && k.external) loadMap(); else unloadMap();
  };

  const show = () => {
    banner.hidden = false;
    void banner.offsetWidth; // forza il disegno prima dell'animazione di entrata
    banner.classList.add('show');
  };
  const hide = () => {
    banner.classList.remove('show');
    setTimeout(() => { banner.hidden = true; }, 400);
  };

  banner.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    SIGMA.saveConsent(b.dataset.consent === '1');
    hide();
    applyConsent();
  });
  document.querySelectorAll('[data-cookie-prefs]').forEach(b => b.addEventListener('click', show));

  bindCover();
  applyConsent();
  // Il banner compare dopo l'animazione iniziale, solo se la scelta non è ancora stata fatta
  if (!SIGMA.consent()) setTimeout(show, 2200);
})();
