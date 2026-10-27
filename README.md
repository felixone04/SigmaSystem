# Sigma System – Sito vetrina

Sito vetrina di **Sigma System s.r.l.** (Andria) – vendita e riparazione di portatili, PC fissi e componenti.

- `index.html` – vetrina: apertura animata, servizi, **preventivo a passi**, metodo, azienda, **recensioni**, contatti
- `admin.html` – gestionale: preventivi ricevuti, recensioni da approvare, configurazione del preventivo, testi e colori

## Accesso gestionale

| Utente | Password |
|---|---|
| `admin` | `Sigma2026!` |

Per cambiare la password: calcolare lo SHA-256 della nuova password e sostituire `PASS_HASH` in `assets/js/admin.js`.

## Preventivo a passi

Il primo passo è sempre la **tipologia** (Portatile, PC fisso, …). Dal gestionale, in *Configura preventivo*, si possono:

- aggiungere, rinominare o eliminare tipologie e sceglierne l'icona
- aggiungere, riordinare o eliminare passaggi e decidere per quali tipologie compaiono
- in ogni passaggio, aggiungere domande di tipo *scelta singola*, *scelta multipla*, *fascia di prezzo* o *testo libero*
- aggiungere o togliere le opzioni di ogni domanda e renderla obbligatoria o facoltativa

La configurazione predefinita è in `DEFAULT_QUOTE` dentro `assets/js/content.js`.

Accanto alle tipologie c'è sempre **Richiesta personalizzata**: il cliente scrive una descrizione libera e lascia i contatti.
Il pulsante **Azzera scelte** (con conferma al secondo tocco) riporta il preventivo all'inizio; toccando di nuovo una scelta singola la si deseleziona.

## Recensioni

Le recensioni inviate dal sito arrivano *in attesa*: compaiono sul sito solo dopo **Approva e pubblica** nel gestionale.

## Nota (versione dimostrativa)

Testi, colori, configurazione, messaggi, preventivi e recensioni sono salvati nel **browser** (localStorage):
le modifiche si vedono solo sul dispositivo da cui sono state fatte e le richieste arrivano solo nel browser di chi le invia.
Il login è solo lato client, quindi non è una protezione reale.
Il passo successivo è collegare `assets/js/content.js` al gestionale PHP in `Progetti/SITO`.

Dati provvisori da sostituire: email `info@sigmasystem.it`, P.IVA `12345678901`.
