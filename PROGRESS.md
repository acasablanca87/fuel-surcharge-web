# PROGRESS.md — Registro di Bordo e Sincronizzazione Multi-Nodo

Questo documento traccia l'evoluzione del progetto, fungendo da ponte di contesto continuo tra diverse sessioni di lavoro, sviluppatori e nodi operativi (es. workstation Windows 11 e laptop macOS M2).

---

## 📍 Stato Attuale del Progetto (Baseline Audit)

- **Frontend Core:** Single Page Application React 19 compilata con Vite 8 e stilizzata con Tailwind CSS v4.
  - Header istituzionale con emblema Repubblica Italiana, font Titillium Web e ticker prezzi gasolio in tempo reale.
  - Pannello controlli a griglia 3x2: scelta della base ministeriale (Pompa, Imponibile, Netto), incidenza carburante (%), periodo base/target e periodo di rilevazione.
  - Hero Card con indicatore Fuel Surcharge (%) dinamico, badge semantici e nota contrattuale.
  - Matrice previsionale a scaglioni (passi ±0,50%) con evidenziazione visiva dello scaglione attivo.
  - Suite a 4 tab:
    1. *Andamento Storico:* Grafico Plotly multi-serie (Pompa, Imponibile, Netto, Accise) con range slider.
    2. *Trend Fuel Surcharge (%):* Confronto bivariato Pompa vs Netto.
    3. *Consultazione Libera Prezzi:* Interrogazione a 5 modalità (Date range, Anno, Mese, Settimana ISO, Data esatta).
    4. *Simulatore What-If:* Calcolo previsionale per simulazione scenari e gare d'appalto.
  - Deep linking attivo tramite query parameters (`price_type`, `weight`, `granularity`).
- **ETL & Data Pipeline:**
  - Script Python 3.13 (`fetch_data.py`) che interroga le API REST MASE (DGSAIE) per serie settimanali e mensili.
  - Validazione matematica di quadratura: verifica che $P_{\text{pompa}} \approx P_{\text{netto}} + P_{\text{accisa}} + P_{\text{iva}}$.
  - Scrittura atomica del dataset locale in `src/data/gasolio_mase.json`.
- **CI/CD & Hosting:**
  - `update_data.yml`: Workflow GitHub Actions programmato per il martedì (con retry scaglionati) per aggiornare il JSON e committare su `main`.
  - `deploy.yml`: Workflow di build Vite e pubblicazione automatica su GitHub Pages.

---

## 🏁 Milestone 0: Fondamenta e Allineamento Architetturale (Completata)

- [x] **Setup infrastruttura Git multi-nodo:** Configurazione dell'ambiente distribuito con chiavi SSH isolate tra postazione Windows 11 e macOS M2.
- [x] **Normalizzazione del repository e allineamento locale:** Verifica dello stato dei file, pulizia del working tree, verifica build Vite (`npm run build`).
- [x] **Formalizzazione del protocollo agentico:**
  - Riscritto `README.md` per il pubblico umano e la vetrina open-source.
  - Creato `AGENTS.md` (Costituzione tecnica per agenti AI, standard 2026, clausola *Zero Unintended Regressions* e *Three-Tier Boundaries*).
  - Creato `PROGRESS.md` come registro di continuità di progetto.

---

## 🗺️ Roadmap & Backlog Proposto

- [ ] **1. Esportazione Report e Dati (CSV / PDF / Copia Appunti):**
  - Aggiungere pulsanti dedicati per esportare la sintesi del calcolo Fuel Surcharge, la matrice a scaglioni o le serie storiche in formato CSV o scheda PDF stampabile per allegati contrattuali logistici.
- [ ] **2. Ottimizzazione Responsive & Mobile UX:**
  - Adattare la visualizzazione della matrice a scaglioni e dei grafici Plotly per schermi verticali e dispositivi mobili (smartphone/tablet vettori su strada).
- [ ] **3. Risoluzione Warning React Hooks / Oxlint:**
  - Bonificare i warning di `setState` sincrono all'interno di `useEffect` in `src/App.jsx` per ottimizzare l'esecuzione con il React Compiler.
- [ ] **4. Resilienza e Notifiche Guasti Server MASE:**
  - Integrare un fallback con avviso UI nel caso in cui i server del Ministero ritardino la pubblicazione del martedì o restituiscano risposte vuote.
- [ ] **5. Estensione Filtri Temporali Rapidi:**
  - Introdurre pulsanti di selezione rapida (YTD, Ultimo Anno, 3 Anni, Tutta la Storia) sincronizzati tra le tab di consultazione e grafici.

---

## 📝 Note dell'Ultima Sessione

- **Data:** 21 Settembre 2026
- **Operatore:** Lead Architect / AI Agent (Google DeepMind)
- **Attività svolte:**
  - Ispezione completa del workspace: `package.json`, `vite.config.js`, `index.html`, `fetch_data.py`, `src/App.jsx`, `src/utils/calculation.js`, GitHub Actions workflows.
  - Collaudata compilazione di produzione (`npm run build`), completata con esito positivo e zero errori.
  - Riscritto e modernizzato `README.md` rendendolo chiaro, pulito e focalizzato sull'utente finale.
  - Creato `AGENTS.md` rispettando rigorosamente il limite di 120 righe (62 righe effettive) e le direttive 2026.
  - Creato `PROGRESS.md` con baseline audit, certificazione Milestone 0 e backlog per le iterazioni successive.
  - **Refinement UI KPI Cards (Ciclo 1 & 2):** Applicata modifica chirurgica a `src/App.jsx`:
    - Normalizzato il titolo della prima card con numero settimana ISO dinamico: `"Ultima Settimana (W/YY)"` (es. `"Ultima Settimana (37/26)"`), attingendo ai metadati di `getWeekMeta` senza duplicazione di logica.
    - Riformattato l'intervallo date nella didascalia con anno a due cifre: `"Media dal DD/MM/YY al DD/MM/YY"`.
    - Uniformata rigorosamente la tipografia delle tre didascalie inferiori: dimensione incrementata a `text-[10.5px]` con colore coerente `text-slate-500` per tutte le card.
    - Collaudata con esito positivo la build di produzione (`npm run build`).
  - **Miglioramenti Selettori & Default Target:** Applicate modifiche chirurgiche a `src/App.jsx`:
    - Riformattate le opzioni del select "Settimana di Rilevazione Gasolio": `"Ultima Settimana - W/YY (DD/MM/YY - DD/MM/YY)"` per la più recente (senza ripetizione di "settimana") e `"Settimana W (DD/MM/YY - DD/MM/YY)"` per tutte le precedenti con anno a due cifre.
    - Implementato switch automatico per la modalità target "Singolo Mese" che imposta come default Dicembre dell'ultimo anno solare consolidato (Dicembre 2025), sincronizzando immediatamente il calcolo del surcharge.
    - Collaudata con esito positivo la build di produzione (`npm run build`).
  - **Troubleshooting GitHub Actions & Ingestione MASE (22 Settembre 2026):**
    - Risolto mancato trigger automatico del martedì in `.github/workflows/update_data.yml`: rimosso attributo non supportato `timezone: 'Europe/Rome'` e ricondotte tutte le espressioni cron a UTC standard (`09:53` e `10:53` UTC per pre-mezzogiorno; `10,11,12` UTC per la fascia clou; `14,16` UTC per il recupero pomeridiano; `7,8` UTC per il mercoledì di fallback).
    - Eseguito scraping e validazione nuovi dati MASE settimanali (settimana del 21/09/2026, prezzo pompa: 2.2814 €/L) registrati in `src/data/gasolio_mase.json`.
    - Verificata la build di produzione (`npm run build`) ed eseguiti commit e push su branch `main`.
