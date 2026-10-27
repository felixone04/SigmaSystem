/* Contenuti e colori del sito, condivisi tra vetrina e gestionale.
   Per ora vengono salvati nel browser (localStorage): quando il sito
   verra' collegato al gestionale in Progetti/SITO, basta sostituire
   load/save con chiamate al server. */
const SIGMA = (() => {
  const KEY_CONTENT = 'sigma.content';
  const KEY_COLORS = 'sigma.colors';
  const KEY_MESSAGES = 'sigma.messages';

  const DEFAULT_CONTENT = {
    hero_kicker:   { label: 'Hero – riga sopra il titolo', value: 'Andria · Vendita e assistenza' },
    hero_title:    { label: 'Hero – titolo', value: 'Il tuo computer, in mani esperte.' },
    hero_text:     { label: 'Hero – sottotitolo', value: 'Portatili, PC fissi e componenti. Vendita, riparazione e assemblaggio su misura.', long: true },
    services_title:{ label: 'Servizi – titolo', value: 'Cosa facciamo' },
    s1_title:      { label: 'Servizio 1 – titolo', value: 'Portatili' },
    s1_text:       { label: 'Servizio 1 – testo', value: 'Vendita di notebook nuovi e ricondizionati. Riparazione schermi, tastiere, batterie e cerniere.', long: true },
    s2_title:      { label: 'Servizio 2 – titolo', value: 'Computer fissi' },
    s2_text:       { label: 'Servizio 2 – testo', value: 'PC da ufficio, gaming e workstation assemblati su misura. Diagnosi, upgrade e pulizia.', long: true },
    s3_title:      { label: 'Servizio 3 – titolo', value: 'Componenti' },
    s3_text:       { label: 'Servizio 3 – testo', value: 'RAM, CPU, SSD, schede video, alimentatori e periferiche. Consulenza e montaggio inclusi.', long: true },
    perk1:         { label: 'Vantaggio 1', value: 'Preventivo gratuito' },
    perk2:         { label: 'Vantaggio 2', value: 'Diagnosi rapida' },
    perk3:         { label: 'Vantaggio 3', value: 'Ricambi garantiti' },
    perk4:         { label: 'Vantaggio 4', value: 'Assistenza in negozio' },
    about_title:   { label: 'Azienda – titolo', value: 'La nostra storia' },
    about_text:    { label: 'Azienda – testo', value: 'Sigma System nasce ad Andria dalla passione per la tecnologia e dalla voglia di offrire un punto di riferimento serio per chi lavora e vive con il computer. Ogni giorno seguiamo privati, professionisti e aziende con lo stesso obiettivo: soluzioni concrete, tempi chiari e un rapporto di fiducia che dura nel tempo.', long: true },
    contact_title: { label: 'Contatti – titolo', value: 'Passa a trovarci' },
    company_name:  { label: 'Ragione sociale', value: 'Sigma System s.r.l.' },
    address:       { label: 'Indirizzo', value: 'Via Bologna 15/17, 76123 Andria (BT)' },
    phone:         { label: 'Telefono', value: '0883 596563' },
    email:         { label: 'Email', value: 'info@sigmasystem.it' },
    vat:           { label: 'Partita IVA', value: '12345678901' },
    hours:         { label: 'Orari', value: 'Lun–Sab 9:00–13:00 · 16:30–20:00' }
  };

  const DEFAULT_COLORS = {
    primary: { label: 'Bordeaux (principale)', value: '#4f0a14' },
    accent:  { label: 'Oro (accento)', value: '#c8962e' },
    dark:    { label: 'Sfondo scuro', value: '#1c0508' },
    light:   { label: 'Sfondo chiaro', value: '#faf7f2' }
  };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };

  const merged = (defaults, saved) =>
    Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, saved[k] ?? d.value]));

  return {
    DEFAULT_CONTENT,
    DEFAULT_COLORS,
    content: () => merged(DEFAULT_CONTENT, read(KEY_CONTENT, {})),
    colors: () => merged(DEFAULT_COLORS, read(KEY_COLORS, {})),
    saveContent: (c) => write(KEY_CONTENT, c),
    saveColors: (c) => write(KEY_COLORS, c),
    resetContent: () => localStorage.removeItem(KEY_CONTENT),
    resetColors: () => localStorage.removeItem(KEY_COLORS),
    messages: () => read(KEY_MESSAGES, []),
    saveMessages: (m) => write(KEY_MESSAGES, m),
    addMessage: (m) => {
      const list = read(KEY_MESSAGES, []);
      list.unshift({ id: Date.now(), date: new Date().toISOString(), read: false, ...m });
      return write(KEY_MESSAGES, list);
    },
    applyColors: (colors = SIGMA.colors()) => {
      const root = document.documentElement.style;
      for (const [k, v] of Object.entries(colors)) root.setProperty(`--${k}`, v);
    }
  };
})();
