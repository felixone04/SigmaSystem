/* Contenuti, colori, configurazione del preventivo, messaggi, preventivi
   e recensioni: tutto condiviso tra vetrina e gestionale.
   Per ora i dati vengono salvati nel browser (localStorage): quando il sito
   verra' collegato al gestionale in Progetti/SITO, basta sostituire
   read/write con chiamate al server. */
const SIGMA = (() => {
  const KEY_CONTENT = 'sigma.content';
  const KEY_COLORS = 'sigma.colors';
  const KEY_MESSAGES = 'sigma.messages';
  const KEY_QUOTE_CFG = 'sigma.quoteConfig';
  const KEY_QUOTES = 'sigma.quotes';
  const KEY_REVIEWS = 'sigma.reviews';

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
    quote_title:   { label: 'Preventivo – titolo', value: 'Preventivo su misura' },
    quote_text:    { label: 'Preventivo – sottotitolo', value: 'Scegli le caratteristiche in pochi passaggi: ti ricontattiamo con la proposta migliore.', long: true },
    process_title: { label: 'Metodo – titolo', value: 'Come lavoriamo' },
    p1_title:      { label: 'Passo 1 – titolo', value: 'Diagnosi' },
    p1_text:       { label: 'Passo 1 – testo', value: 'Check-up completo del dispositivo.' },
    p2_title:      { label: 'Passo 2 – titolo', value: 'Preventivo' },
    p2_text:       { label: 'Passo 2 – testo', value: 'Chiaro e senza sorprese.' },
    p3_title:      { label: 'Passo 3 – titolo', value: 'Riconsegna' },
    p3_text:       { label: 'Passo 3 – testo', value: 'Il tuo PC torna come nuovo.' },
    about_title:   { label: 'Azienda – titolo', value: 'La nostra storia' },
    about_text:    { label: 'Azienda – testo', value: 'Sigma System nasce ad Andria dalla passione per la tecnologia e dalla voglia di offrire un punto di riferimento serio per chi lavora e vive con il computer. Ogni giorno seguiamo privati, professionisti e aziende con lo stesso obiettivo: soluzioni concrete, tempi chiari e un rapporto di fiducia che dura nel tempo.', long: true },
    reviews_title: { label: 'Recensioni – titolo', value: 'Dicono di noi' },
    contact_title: { label: 'Contatti – titolo', value: 'Passa a trovarci' },
    company_name:  { label: 'Ragione sociale', value: 'Sigma System s.r.l.' },
    address:       { label: 'Indirizzo', value: 'Via Bologna 15/17, 76123 Andria (BT)' },
    phone:         { label: 'Telefono', value: '0883 596563' },
    email:         { label: 'Email', value: 'info@sigmasystem.it' },
    vat:           { label: 'Partita IVA', value: '12345678901' },
    hours:         { label: 'Orari', value: 'Lun–Sab 9:00–13:00 · 16:30–20:00' }
  };

  const DEFAULT_COLORS = {
    primary: { label: 'Bordeaux (bordi e logo)', value: '#4f0a14' },
    accent:  { label: 'Oro (accento)', value: '#c8962e' },
    dark:    { label: 'Sfondo scuro', value: '#1c0508' },
    light:   { label: 'Sfondo chiaro', value: '#f7f0e4' }
  };

  /* Preventivo a passi.
     - types: tipologie di prodotto (primo passo del preventivo)
     - steps: passaggi successivi; "types" indica per quali tipologie compare
       il passaggio (vuoto = tutte). Ogni passaggio ha una o piu' domande:
         choice = scelta singola, multi = scelta multipla,
         range  = fascia min/max, text = testo libero */
  const ALL = ['portatile', 'fisso'];
  const DEFAULT_QUOTE = {
    types: [
      { id: 'portatile', label: 'Portatile', icon: 'laptop' },
      { id: 'fisso', label: 'PC fisso', icon: 'desktop' }
    ],
    steps: [
      { id: 'uso', title: 'Come lo userai?', types: ALL, questions: [
        { id: 'uso', label: 'Utilizzo principale', type: 'multi', required: true,
          options: ['Ufficio e studio', 'Uso domestico', 'Gaming', 'Grafica e video', 'Programmazione'] }
      ] },
      { id: 'marca_portatile', title: 'Marca e condizione', types: ['portatile'], questions: [
        { id: 'marca_p', label: 'Marca preferita', type: 'choice', required: true, options: ['HP', 'Lenovo', 'Indifferente'] },
        { id: 'condizione_p', label: 'Condizione', type: 'choice', required: false, options: ['Nuovo', 'Ricondizionato', 'Indifferente'] }
      ] },
      { id: 'formato_fisso', title: 'Tipo di PC fisso', types: ['fisso'], questions: [
        { id: 'formato_f', label: 'Preferenza', type: 'choice', required: true, options: ['Assemblato su misura', 'HP', 'Lenovo', 'Indifferente'] },
        { id: 'case_f', label: 'Dimensione del case', type: 'choice', required: false, options: ['Mini PC', 'Compatto', 'Tower', 'Indifferente'] }
      ] },
      { id: 'cpu', title: 'Processore', types: ALL, questions: [
        { id: 'cpu_marca', label: 'Marca', type: 'choice', required: true, options: ['Intel', 'AMD', 'Indifferente'] },
        { id: 'cpu_fascia', label: 'Fascia', type: 'choice', required: false, options: ['Base (i3 / Ryzen 3)', 'Media (i5 / Ryzen 5)', 'Alta (i7 / Ryzen 7)', 'Top (i9 / Ryzen 9)'] }
      ] },
      { id: 'ram', title: 'Memoria RAM', types: ALL, questions: [
        { id: 'ram_gb', label: 'Quantità', type: 'choice', required: true, options: ['8 GB', '16 GB', '32 GB', '64 GB'] },
        { id: 'ram_tipo', label: 'Tipo', type: 'choice', required: false, options: ['DDR4', 'DDR5', 'Indifferente'] }
      ] },
      { id: 'disco', title: 'Archiviazione', types: ALL, questions: [
        { id: 'disco_tipo', label: 'Tipo di disco', type: 'choice', required: true, options: ['SSD M.2 NVMe', 'SSD SATA', 'HDD', 'SSD + HDD'] },
        { id: 'disco_gb', label: 'Capacità', type: 'choice', required: true, options: ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB'] }
      ] },
      { id: 'schermo', title: 'Schermo', types: ['portatile'], questions: [
        { id: 'schermo_pollici', label: 'Grandezza', type: 'choice', required: true, options: ['13–14"', '15,6"', '16"', '17"'] },
        { id: 'schermo_extra', label: 'Caratteristiche', type: 'multi', required: false, options: ['Full HD', '2K / 4K', 'Touchscreen', 'Antiriflesso'] }
      ] },
      { id: 'gpu', title: 'Scheda video', types: ALL, questions: [
        { id: 'gpu', label: 'Tipo', type: 'choice', required: true, options: ['Integrata', 'Dedicata base', 'Dedicata gaming', 'Dedicata professionale', 'Indifferente'] }
      ] },
      { id: 'os', title: 'Sistema operativo', types: ALL, questions: [
        { id: 'os', label: 'Versione', type: 'choice', required: true, options: ['Windows 11 Home', 'Windows 11 Pro', 'Senza sistema operativo'] }
      ] },
      { id: 'extra', title: 'Periferiche e servizi', types: ALL, questions: [
        { id: 'periferiche', label: 'Ti servono anche', type: 'multi', required: false, options: ['Monitor', 'Tastiera e mouse', 'Cuffie', 'Webcam', 'Stampante', 'Borsa per portatile', 'Docking station', 'Gruppo di continuità'] },
        { id: 'servizi', label: 'Servizi aggiuntivi', type: 'multi', required: false, options: ['Installazione Office', 'Antivirus', 'Trasferimento dati', 'Garanzia estesa', 'Configurazione a domicilio'] }
      ] },
      { id: 'budget', title: 'Budget e tempi', types: ALL, questions: [
        { id: 'budget', label: 'Fascia di prezzo', type: 'range', required: true, min: 300, max: 3000, step: 50, from: 600, to: 1200 },
        { id: 'tempi', label: 'Quando ti serve?', type: 'choice', required: false, options: ['Urgente', 'Entro una settimana', 'Entro un mese', 'Senza fretta'] }
      ] }
    ]
  };

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const merged = (defaults, saved) =>
    Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, saved[k] ?? d.value]));

  const prepend = (key, item) => {
    const list = read(key, []);
    list.unshift({ id: Date.now(), date: new Date().toISOString(), ...item });
    return write(key, list);
  };

  return {
    DEFAULT_CONTENT,
    DEFAULT_COLORS,
    DEFAULT_QUOTE,
    clone,
    content: () => merged(DEFAULT_CONTENT, read(KEY_CONTENT, {})),
    colors: () => merged(DEFAULT_COLORS, read(KEY_COLORS, {})),
    saveContent: (c) => write(KEY_CONTENT, c),
    saveColors: (c) => write(KEY_COLORS, c),
    resetContent: () => localStorage.removeItem(KEY_CONTENT),
    resetColors: () => localStorage.removeItem(KEY_COLORS),

    // Messaggi dal modulo contatti
    messages: () => read(KEY_MESSAGES, []),
    saveMessages: (m) => write(KEY_MESSAGES, m),
    addMessage: (m) => prepend(KEY_MESSAGES, { read: false, ...m }),

    // Configurazione e richieste di preventivo
    quoteConfig: () => read(KEY_QUOTE_CFG, null) || clone(DEFAULT_QUOTE),
    saveQuoteConfig: (c) => write(KEY_QUOTE_CFG, c),
    resetQuoteConfig: () => localStorage.removeItem(KEY_QUOTE_CFG),
    quotes: () => read(KEY_QUOTES, []),
    saveQuotes: (q) => write(KEY_QUOTES, q),
    addQuote: (q) => prepend(KEY_QUOTES, { read: false, ...q }),

    // Recensioni: arrivano "pending" e vanno approvate dal gestionale
    reviews: () => read(KEY_REVIEWS, []),
    approvedReviews: () => read(KEY_REVIEWS, []).filter(r => r.status === 'approved'),
    saveReviews: (r) => write(KEY_REVIEWS, r),
    addReview: (r) => prepend(KEY_REVIEWS, { status: 'pending', ...r }),

    applyColors: (colors = SIGMA.colors()) => {
      const root = document.documentElement.style;
      for (const [k, v] of Object.entries(colors)) root.setProperty(`--${k}`, v);
    }
  };
})();
