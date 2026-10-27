# Sigma System – Sito vetrina

Sito vetrina di **Sigma System s.r.l.** (Andria) – vendita e riparazione di portatili, PC fissi e componenti.

- `index.html` – vetrina: hero, servizi, azienda, contatti (con modulo e mappa)
- `admin.html` – gestionale semplice: messaggi ricevuti, modifica testi e colori

## Accesso gestionale

| Utente | Password |
|---|---|
| `admin` | `Sigma2026!` |

Per cambiare la password: calcolare lo SHA-256 della nuova password e sostituire `PASS_HASH` in `assets/js/admin.js`.

## Nota (versione dimostrativa)

Testi, colori e messaggi sono salvati nel **browser** (localStorage): le modifiche si vedono solo sul dispositivo
da cui sono state fatte e i messaggi del modulo arrivano solo nel browser di chi lo compila.
Il login è solo lato client, quindi non è una protezione reale.
Il passo successivo è collegare `assets/js/content.js` al gestionale PHP in `Progetti/SITO`.

Dati provvisori da sostituire: email `info@sigmasystem.it`, P.IVA `12345678901`.
