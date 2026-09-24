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
  - **Riprogettazione Architetturale e Visiva Globale (22 Settembre 2026):**
    - Eliminazione delle ridondanze e semplificazione dell'Header istituzionale con data dinamica dell'ultimo aggiornamento ministeriale.
    - Semplificazione del pannello di partenza: solo 3 parametri base contrattuali (Base di prezzo, Incidenza %, Periodo base target), rimosso il selettore ambiguo di granularità/data puntuale.
    - Introduzione della **Stanza Operativa del Surcharge**:
      - Cruscotto a 3 indicatori temporali live coordinati (*Mese Consolidato* per fatturazione ufficiale, *Mese in Corso* per proiezione provvisoria, *Ultima Settimana* per termometro spot).
      - Matrice a scaglioni contrattuale compatta con partenza fissa da 0,00% (che evidenzia il prezzo base target) ed estensione simmetrica.
      - 3 colonne di riferimento nell'header della matrice con frecce puntatore (`← [prezzo] €/L`) per guidare la visual inspection verso lo scaglione attivo.
    - Sezione Analisi Fuel Surcharge dedicata: grafico trend bi-curva post-base (Pompa vs Netto) con toggle `[ Mensile | Settimanale ]` e Simulatore What-If integrato.
    - Sezione Archivio MASE in fondo alla pagina riorganizzata a 2 Tab puliti (*Andamento Storico Prezzi Gasolio* con range slider e *Consultazione Libera Prezzi* a 5 criteri).
    - Risoluzione dei linter warning e collaudo con esito positivo di `npm run lint` e `npm run build`.
  - **Fine-Tuning Operativo Layout & Matrice a Scaglioni (22 Settembre 2026):**
    - **Griglia 2x2 Parametri di Base:** Riorganizzata la sezione in una griglia simmetrica perfettamente bilanciata (Sinistra: Base di Prezzo Ministeriale + Incidenza costo gasolio; Destra: Modalità Periodo Base + Selezione Periodo Specifico).
    - **Riorganizzazione Sequenza Hero Cards:** Aggiornato l'ordine operativo dei 3 indicatori: 1° *Mese Consolidato* (Fatturazione Ufficiale), 2° *Ultima Settimana* (Termometro Live MASE), 3° *Mese in Corso* (Stima Provvisoria).
    - **Rifinitura Matrice a Scaglioni:**
      - Partenza fissa da 0,00% a salire (`lowerBound = 0.0`), eliminando gli scaglioni negativi per massima linearità operativa.
      - Riga 0,00% resa neutra (rimosso badge "Base" e sfondo azzurro differenziato, uniformata alla visual identity pulita).
      - Header sticky integrato (`sticky top-14 bg-slate-100 z-10 shadow-xs`) per mantenere visibili le intestazioni durante lo scorrimento e sbloccarsi al termine della tabella.
      - Riordinate le 3 colonne dei riferimenti rilevati (*Mese Consolidato*, *Ultima Settimana*, *Mese Provvisorio*) per rispecchiare fedelmente l'ordine dei card superiori.
      - Compattato il padding verticale delle celle a `py-1.5 px-3` per ridurre l'ingombro.
    - **Layout Analisi Fuel Surcharge a Tutta Larghezza (Stacked):**
      - Grafico Trend Storico esteso a tutta larghezza (`w-full`) per massima leggibilità dell'asse temporale e delle curve bi-variate.
      - Simulatore What-If Libero riposizionato sotto il grafico a tutta larghezza con disposizione orizzontale su 4 colonne (Prezzo Base, Prezzo Stimato, Incidenza, Box Risultato sintetico con Surcharge %, Delta % e fascia).
    - Verificata la conformità del codice con `npm run lint` e collaudata la build di produzione (`npm run build`, exit code 0).
  - **Fine-Tuning Nomi e Micro-Copy (22 Settembre 2026):**
    - Titolo sezione parametri: aggiornato a *"Parametri di base per il calcolo del Fuel Surcharge"*.
    - Titolo e sottotitolo cruscotto: aggiornati a *"Quadro Fuel Surcharge attuale"* e *"Adeguamento tariffario calcolato sulle rilevazioni ministeriali attuali rispetto al prezzo base di..."* per rimarcare l'ancoraggio all'attualità.
    - Hero Cards: rimossi i badge ridondanti interni (`Fatturazione Ufficiale`, `Termometro Live`, `Stima Provvisoria`) per massima pulizia visiva ("less is more").
    - Testi delle 3 card:
      - 1° Card: *"Ultimo Mese Consolidato"* con didascalia *"Convenzionalmente valido per la fatturazione del mese successivo."*.
      - 2° Card: *"Ultima Settimana Consolidata"*, rimossa la didascalia ridondante.
      - 3° Card: *"Mese in Corso (Stima Provvisoria)"*, rimossa la didascalia ridondante.
    - Colonne della Matrice a scaglioni allineate coerentemente ai nuovi titoli delle hero cards (*Ultimo Mese Consolidato*, *Ultima Settimana Consolidata*, *Mese in Corso (Stima Provvisoria)*).
    - Collaudato con esito positivo: `npm run lint` (0 errori) e `npm run build` (exit code 0 in 2.30s).
  - **Laboratorio di Calcolo & Simulatore Completo (23 Settembre 2026):**
    - Superata la soluzione asimmetrica a favore di una **struttura speculare a 3 colonne** (Target | Rilevazione | Risultato):
      - **Colonna 1 (Base di Partenza / Target):** supporta tutte le modalità d'archivio (Anno solare, Singolo Mese, Range personalizzato da/a) con compilazione automatica dei prezzi ufficiali MASE, più la modalità *Valore Libero* per override numerico manuale.
      - **Colonna 2 (Rilevazione da Valutare):** supporta Mese Storico, Settimana Storica (con metadati ISO) e *Valore Libero* per simulazioni ipotetiche.
      - **Colonna 3 (Parametri & Risultato Surcharge):** selettore della Base Ministeriale (Pompa, Imponibile, Netto Industriale), Incidenza Gasolio (%) e Card Risultato ad alto contrasto con percentuale calcolata, delta di variazione, confronto prezzi e fascia di matrice.
    - Introdotto pulsante rapido *"Copia parametri contratto"* per riallineare istantaneamente il laboratorio al contratto principale impostato in cima alla pagina.
    - Bonificato l'import residuo di `History` (riducendo i warning linter a 1 solo warning preesistente su useEffect).
    - Collaudato con esito positivo: `npm run lint` (0 errori) e `npm run build` (exit code 0 in 4.77s).
  - **Risoluzione Bug Schermata Bianca all'Avvio (23 Settembre 2026):**
    - Risolto il crash all'avvio che causava un flash iniziale seguito da pagina completamente bianca (`ReferenceError: setSimBasePrice is not defined`).
    - Causa radice: nel precedente refactoring del Laboratorio di Calcolo erano rimasti due `useEffect` orfani in `src/App.jsx` che tentavano di invocare `setSimBasePrice` e `setSimWeight` (variabili di stato del vecchio simulatore eliminato).
    - Rimossi chirurgicamente gli hook orfani; confermato che il Laboratorio di Calcolo gestisce autonomamente lo stato con `syncWithContract`.
  - **Fine-Tuning Hero Cards, Matrice e Laboratorio di Calcolo (23 Settembre 2026):**
    - **Hero Cards Quadro Fuel Surcharge:**
      - 1° Box (*Ultimo Mese Consolidato*): inserita doppia icona informativa sobria (`Info` di Lucide, vettoriale e non emoji) sia accanto al titolo del mese sia prima della nota esplicativa contrattuale.
      - 2° Box (*Ultima Settimana Consolidata*): impostata la tonalità navy/ardesia personalizzata `#222e49` all'80% (`bg-[#222e49]/80`) con bordo coordinato (`border-[#31436b]/70`), creando un ponte cromatico ideale tra il nero profondo del 1° box e il grigio chiaro del 3° box.
      - 3° Box (*Mese in Corso - Stima Provvisoria*): schiarita ulteriormente la percentuale a `text-slate-500` per massimizzare la percezione di dato secondario/stima di lavoro.
      - **Allineamento Verticale Millimetrico:** uniformata l'altezza dei footer con uno spacer dedicato `min-h-[2rem]` su tutti e 3 i box, rendendo la riga divisoria, *"Prezzo Rilevato:"* e *"Variazione Prezzo (Δ):"* perfettamente allineati alla stessa quota orizzontale.
    - **Matrice a Scaglioni:**
      - Uniformata la dimensione e il peso dei riferimenti temporali (`liveData.monthTitle`, `liveData.weekTitle`, `liveData.provTitle`) alla stessa scala dell'intestazione colonna (`text-[11px] font-semibold`), differenziandoli con un colore blu scuro istituzionale ad alta leggibilità (`text-blue-900`).
    - **Laboratorio di Calcolo & Simulatore:**
      - Uniformato il box del risultato allo stile chiaro del box *Mese in Corso* (`bg-slate-100/90 text-slate-900 border-slate-300 shadow-xs`).
      - Semplificato il contenuto: rinominato in *"Fuel Surcharge"* e rimossi tutti i testi secondari (delta e confronto prezzi), lasciando in risalto la sola percentuale di calcolo.
    - Collaudato con esito positivo: `npm run lint` (0 errori) e `npm run build` (exit code 0 in 2.15s).
  - **Fine-Tuning Cromatico Box Mese in Corso (23 Settembre 2026):**
    - Nel terzo box a destra del cruscotto ("Mese in Corso (Stima Provvisoria)"):
      - Uniformato il colore del sottotitolo temporale (es. "Settembre 2026 (3 rilevazioni)") alla tonalità `text-slate-500` del titolo della card ("Mese in Corso (Stima Provvisoria)").
      - Uniformati i valori numerici del footer ("Media Parziale:" e "Variazione Prezzo (Δ):") a `text-slate-500`, allineandoli cromaticamente alle rispettive etichette per una resa visiva più morbida, armoniosa e secondaria rispetto ai due box consolidati.
    - Collaudato con esito positivo: `npm run lint` (0 errori) e `npm run build` (exit code 0 in 2.19s).
  - **Matrice a Scaglioni: Vista Compatta Espandibile con Deep Link:**
    - Esteso il range della matrice a 41 righe (0,00% → 20,00%, passi da 0,50%) tramite `upperBound = Math.max(20.0, Math.ceil((maxSur + 0.75) * 2) / 2)`: quota fissa al 20% che si estende automaticamente solo se un riferimento cade oltre, evitando righe orfane.
    - Introdotta la finestra di default `matrixWindow`: righe dei tre riferimenti rilevati (`matchMonth` / `matchWeek` / `matchProv`) ± 2 scaglioni per lato, con clamp agli estremi. Se i riferimenti sono distanti la finestra copre naturalmente l'intero range; le righe con la freccia `←` restano sempre visibili.
    - Aggiunto un unico pulsante di collapse/espansione nell'header della sezione (*"Mostra tutti gli scaglioni (41)"* / *"Mostra solo i riferimenti (N)"*) con `aria-expanded` e `aria-controls`.
    - Righe fuori finestra nascoste via CSS (`hidden print:table-row`) e non rimosse dal DOM: la stampa/PDF esporta sempre la tabella completa, senza race con `window.print()`.
    - Separatori informativi non stampabili (`⋯ N scaglioni nascosti ⋯` con `print:hidden`) sopra e sotto la finestra visibile.
    - Deep link dello stato espanso: parametro `?matrice=full` letto all'avvio e sincronizzato in `history.replaceState` insieme a `price_type` e `weight`, così il link condiviso apre la matrice già estesa.
    - Collaudato con `npm run lint` (0 errori, resta 1 warning preesistente su `setState` in `useEffect`). `npm run build` non eseguibile in questa sessione: bloccato dal sandbox locale (binario nativo `@tailwindcss/oxide` + `spawn EPERM` durante il load di `vite.config.js`), verifica rimandata a un nodo senza restrizioni.
  - **Unica Fonte di Verità per il Mese Provvisorio + Fine Tuning Simulatore (23 Settembre 2026):**
    - **Refactoring "strada B" (single source of truth):** estratta in `src/utils/calculation.js` la funzione pura `getProvisionalMonth(weeklyList, monthlyList, key)`, che individua il *mese in corso provvisorio* (mese dell'ultima rilevazione settimanale non ancora presente nell'archivio mensile consolidato) e ne calcola la media.
      - Il blocco inline precedentemente duplicato nel memo `liveData` di `src/App.jsx` è stato sostituito dalla chiamata all'helper: quadro in alto e Simulatore ora condividono la stessa regola di dominio, eliminando il rischio di deriva tra le due copie (incluso l'elenco dei nomi dei mesi).
      - **Prova di equivalenza numerica:** vecchia formula replicata in Node e confrontata con la nuova su 65.778 scenari (ogni prefisso settimanale × 3 basi, ogni prefisso mensile × 3 basi, più campione incrociato), di cui 40.860 con mese provvisorio e 24.918 senza: **0 mismatch**, valori identici.
    - **Bug "Settimana / (2,2281 €/L)" risolto:** il select della rilevazione settimanale e la riga "Rif:" leggevano `meta.weekNumber`, `meta.yearShort` e `meta.subText`, campi che `getWeekMeta()` non restituiva (quindi sempre `undefined`). Aggiunti ai valori di ritorno (modifica additiva, nessun consumatore esistente alterato) e uniformato anche il ramo di fallback. Ora l'opzione mostra `Settimana 38/26 (2,281 €/L) • 14/09 - 20/09/2026` e la riga "Rif:" `Settimana 38/26 (14/09 - 20/09/2026)`.
    - **Nuova modalità di rilevazione nel Simulatore:** aggiunta la voce *Mese in corso provvisorio*, che riusa l'helper condiviso applicato alla base ministeriale scelta nella colonna 3 (`labActiveKey`), così da poter confrontare un prezzo base diverso con il mese in corso. Se il mese risultasse già consolidato la voce è disabilitata con "(non disponibile)" e il memo mantiene un fallback sicuro.
      - Selettore *Tipo Rilevazione* riordinato e rinominato: *Mese in corso provvisorio (Settembre 2026)*, *Mese (consolidato)*, *Settimana*, *Valore libero (manuale)*. I `value` interni sono rimasti invariati per non toccare la logica di calcolo.
    - **Fine tuning visivo e micro-copy della sessione (aggiorna le voci precedenti):**
      - Pulsante matrice rinominato in *"Espandi Matrice"*; rimossi i due separatori `⋯ N scaglioni nascosti ⋯` sopra e sotto la finestra visibile.
      - Diciture allineate tra hero card e Matrice a scaglioni: *MENSILE CONSOLIDATO*, *SETTIMANALE*, *MENSILE PROVVISORIO* (rimosso anche il `<br />` residuo nell'intestazione della matrice).
      - Tutte e cinque le celle di intestazione della matrice allineate in alto con `align-top`, così i titoli restano alla stessa quota quando vanno a capo a schermo stretto.
      - Nota contrattuale del 1° box portata a `text-slate-200`, come il titolo del mese; valori del footer allineati a `text-slate-400`.
      - Campi prezzo del Simulatore convertiti da `type="number"` a `type="text"` con `inputMode="decimal"` e buffer di digitazione: mostrano sempre 3 decimali a riposo (`2,100`) e accettano sia virgola sia punto, tramite il nuovo helper `parseItAmount` (che corregge anche il latente `parseFloat("2,1") === 2`).
    - Collaudato con `npm run lint` (0 errori, resta 1 warning preesistente) e con test di equivalenza eseguiti in Node sul dataset MASE reale. `npm run build` resta non eseguibile in questa sessione per i limiti del sandbox locale.
