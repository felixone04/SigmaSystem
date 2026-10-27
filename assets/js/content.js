/* Contenuti e colori del sito, condivisi tra vetrina e gestionale.
   Per ora vengono salvati nel browser (localStorage): quando il sito
   verra' collegato al gestionale in Progetti/SITO, basta sostituire
   load/save con chiamate al server. */
const SIGMA = (() => {
  const KEY_CONTENT = 'sigma.content';
  const KEY_COLORS = 'sigma.colors';
  const KEY_MESSAGES = 'sigma.messages';

  const DEFAULT_CONTENT = {
    hero_title:    { label: 'Apertura – titolo', value: 'Negozio di informatica' },
    hero_words:    { label: 'Apertura – parole che ruotano (separate da virgola)', value: 'Portatili, PC fissi, Componenti, Riparazioni' },
    hero_text:     { label: 'Apertura – sottotitolo', value: 'Vendita, assistenza e assemblaggio su misura ad Andria.', long: true },
    services_title:{ label: 'Servizi – titolo', value: 'Cosa facciamo' },
    s1_title:      { label: 'Servizio 1 – titolo', value: 'Portatili' },
    s1_text:       { label: 'Servizio 1 – testo', value: 'Notebook HP e Lenovo con Windows, nuovi e ricondizionati. Riparazione schermi, tastiere, batterie e cerniere.', long: true },
    s2_title:      { label: 'Servizio 2 – titolo', value: 'Computer fissi' },
    s2_text:       { label: 'Servizio 2 – testo', value: 'PC da ufficio, gaming e workstation con Windows, anche assemblati su misura. Diagnosi, upgrade e pulizia.', long: true },
    s3_title:      { label: 'Servizio 3 – titolo', value: 'Componenti' },
    s3_text:       { label: 'Servizio 3 – testo', value: 'RAM, CPU, SSD, schede video, alimentatori e periferiche. Consulenza e montaggio inclusi.', long: true },
    process_title: { label: 'Metodo – titolo', value: 'Come lavoriamo' },
    p1_title:      { label: 'Passo 1 – titolo', value: 'Diagnosi' },
    p1_text:       { label: 'Passo 1 – testo', value: 'Check-up completo del dispositivo.' },
    p2_title:      { label: 'Passo 2 – titolo', value: 'Preventivo' },
    p2_text:       { label: 'Passo 2 – testo', value: 'Chiaro e senza sorprese.' },
    p3_title:      { label: 'Passo 3 – titolo', value: 'Riconsegna' },
    p3_text:       { label: 'Passo 3 – testo', value: 'Il tuo PC torna come nuovo.' },
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
    light:   { label: 'Sfondo chiaro', value: '#f7f0e4' }
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
