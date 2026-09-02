# ⛽ FUEL SURCHARGE ITALIA
> **Piattaforma digitale, benchmark e simulatore di adeguamento del costo carburante per l'autotrasporto merci su base Rilevazioni Ufficiali MASE (Gasolio Auto).**

[![Stato Deploy GitHub Pages](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/deploy.yml)
[![Aggiornamento Dati MASE](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/update_data.yml/badge.svg)](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/update_data.yml)
[![Piattaforma Web](https://img.shields.io/badge/Web%20App-Live%20su%20GitHub%20Pages-0284c7?style=flat&logo=github)](https://acasablanca87.github.io/fuel-surcharge-web/)
[![Stack](https://img.shields.io/badge/Stack-Vite%20%7C%20React%2019%20%7C%20Tailwind%20v4-61dafb?logo=react)](https://react.dev/)

---

## 📌 Indice dei Contenuti
1. [Panoramica e Obiettivi](#-panoramica-e-obiettivi)
2. [Architettura di Sistema & Automazioni CI/CD](#-architettura-di-sistema--automazioni-cicd)
3. [Alberatura Completa del Progetto](#-alberatura-completa-del-progetto)
4. [Componenti e Funzionalità dell'Applicazione](#-componenti-e-funzionalità-dellapplicazione)
5. [Modello Matematico e Metodologia di Calcolo](#-modello-matematico-e-metodologia-di-calcolo)
6. [Dataset Ministeriale (Struttura JSON)](#-dataset-ministeriale-struttura-json)
7. [Guida allo Sviluppo Locale](#-guida-allo-sviluppo-locale)
8. [Parametri URL (Deep Linking)](#-parametri-url-deep-linking)
9. [Linee Guida per Sessioni di Sviluppo AI Future](#-linee-guida-per-sessioni-di-sviluppo-ai-future)

---

## 📖 Panoramica e Obiettivi

**Fuel Surcharge Italia** è un'applicazione web reattiva, serverless e ad altissime prestazioni progettata per vettori, spedizionieri e committenti del settore logistico. Consente di calcolare e monitorare la clausola di adeguamento carburante (*Fuel Surcharge*) in modo oggettivo, trasparente e certificato.

### Caratteristiche Principali:
* **Fonte Primaria Ufficiale:** Prezzi medi del gasolio auto estratti direttamente via API Open Data dal **Ministero dell'Ambiente e della Sicurezza Energetica (MASE - DGSAIE)**.
* **Architettura Serverless a Zero Costi:** Frontend statico compilato con Vite + React e ospitato su GitHub Pages. Il caricamento iniziale è istantaneo (< 50ms) con footprint ridottissimo (< 1MB).
* **Flessibilità Contrattuale:** Supporto completo per periodi base annuali, mensili o intervalli personalizzati, con granularità di valutazione su base **Mensile** o **Settimanale** (spot week ISO).
* **Trasparenza Fiscale a 3 Basi:** Gestione del calcolo su **Prezzo Globale alla Pompa**, **Prezzo Imponibile (senza IVA con accise)** e **Prezzo Netto Industriale**.

---

## 🏗️ Architettura di Sistema & Automazioni CI/CD

Il sistema opera in modo **totalmente autonomo** grazie a due GitHub Actions concatenate:

```text
               [Server Ministero MASE - DGSAIE]
                              │
                              ▼ (Ogni Martedì ore 12:03 + Ondate pomeridiane)
                 [Workflow: update_data.yml]
                              │ ──► Esegue fetch_data.py (Python 3.13 con Retry)
                              │ ──► Valida e aggiorna src/data/gasolio_mase.json
                              │ ──► Esegue Git Commit & Push su 'main'
                              ▼
                 [Workflow: deploy.yml]
                              │ ──► Rileva il push su 'main'
                              │ ──► Esegue 'npm run build' (Vite)
                              ▼
            [GitHub Pages: fuel-surcharge-web (Live)]
            https://acasablanca87.github.io/fuel-surcharge-web/
```

### I Robot GitHub Actions:
1. **`update_data.yml` (ETL MASE):**
   * *Trigger:* Schedulato ogni martedì alle 12:03 (ora italiana, scatto puntualità) seguito da scansioni alle 12:35, 14:35, 16:35, 18:35 e fallback mercoledì alle 08:35.
   * *Azione:* Se il JSON viene aggiornato, esegue `git commit` e `push`.
2. **`deploy.yml` (CI/CD Web):**
   * *Trigger:* Automatico su ogni `push` sul branch `main`.
   * *Azione:* Compila l'app React in bundle statico e pubblica su GitHub Pages.

---

## 📁 Alberatura Completa del Progetto

```text
fuel-surcharge-web/
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Pipeline di compilazione e deploy su GitHub Pages
│       └── update_data.yml       # Robot ETL MASE settimanale programmato
├── public/                       # Risorse statiche servite direttamente
├── src/
│   ├── data/
│   │   └── gasolio_mase.json     # Dataset storico unificato dal 1996 a oggi
│   ├── utils/
│   │   └── calculation.js        # Formule pure di calcolo, formattazione IT e ISO Week
│   ├── App.jsx                   # Componente radice: State, UI, Hero Card, Matrice, 4 Tab
│   ├── index.css                 # Importazione Tailwind CSS v4 (@import "tailwindcss";)
│   └── main.jsx                  # Entry point React 19 (createRoot)
├── fetch_data.py                 # Script Python per scaricare e validare i dati MASE
├── index.html                    # Entry point HTML (Favicon stemma Repubblica Italiana e SEO)
├── package.json                  # Dipendenze npm (React, Vite, Tailwind, Plotly, Lucide)
├── vite.config.js                # Configurazione Vite (@tailwindcss/vite, base: './')
└── README.md                     # Documentazione tecnica e manuale per l'AI
```

---

## 🧰 Componenti e Funzionalità dell'Applicazione

La UI è strutturata in 5 sezioni visive in `src/App.jsx`:

1. **🏛️ Header Istituzionale:** Emblema della Repubblica Italiana, titolo, badge MASE e indicazione della data massima di rilevazione in vigore (`Dati aggiornati al: DD/MM/YYYY`).
2. **⚙️ Pannello di Controllo (Griglia 3x2 Simmetrica):**
   * *Rigo 1:* Base di Prezzo Ministeriale (Pompa / Imponibile / Netto) | Incidenza Gasolio (1-100%).
   * *Rigo 2:* Modalità Target (Anno solare / Singolo Mese / Range da-a) | Selettore Periodo Target *(con sfondo azzurro in risalto)*.
   * *Rigo 3:* Periodo Rilevazione da Valutare (Toggle Mensile/Settimanale) | Selettore Mese/Settimana *(con sfondo azzurro in risalto)*.
3. **⚡ Hero Card Surcharge:** Percentuale di Surcharge gigante con blindatura anti-a-capo (`+X,XX %`), classificazione cromatica dinamica (Rosso se positivo, Verde se negativo), pillole riepilogative e nota applicativa.
4. **📊 Matrice a Scaglioni (±0,50%):** Tabella previsionale che mostra le forchette di prezzo gasolio con riga attiva evidenziata da indicatore a punto rosso pulsante.
5. **🗂️ Suite Specialistica a 4 Tab:**
   * **Tab 1 - Andamento Storico Prezzi:** Grafico Plotly multi-curva (Pompa, Imponibile, Netto, Accisa) con preset rapido a 5 Anni predefinito e range-slider.
   * **Tab 2 - Trend Fuel Surcharge (%):** Confronto comparativo bi-curva (Base Pompa vs Base Netto) post periodo target con tooltip a 2 decimali e linea dello zero.
   * **Tab 3 - Consultazione Libera Prezzi (5 Vie):** Motore di interrogazione istantaneo dello storico per *Intervallo Date*, *Anno solare*, *Singolo Mese*, *Settimana Specifica* o *Data Esatta Documento*.
   * **Tab 4 - Simulatore What-If:** Calcolatore previsionale per scenari manuali o parametri di gara, pre-popolato automaticamente con il prezzo della consultazione libera.
6. **📚 Guida Metodologica & Footer:** Due card informative con formule matematiche formali e link al portale Open Data DGSAIE.

---

## 📐 Modello Matematico e Metodologia di Calcolo

I calcoli sono implementati come funzioni pure in `src/utils/calculation.js`:

### 1. Variazione Percentuale del Prezzo ($\Delta\%$)
$$\Delta\% = \left( \frac{P_{\text{rilevato}} - P_{\text{target}}}{P_{\text{target}}} \right) \times 100$$

### 2. Fuel Surcharge Ponderato
$$\text{Fuel Surcharge \%} = \Delta\% \times \left(\frac{\text{Incidenza \%}}{100}\right)$$
*(Default incidenza: 30%, conforme alle tabelle di costo chilometrico d'esercizio MIT per veicoli pesanti).*

### 3. Matrice a Scaglioni (Passi da 0,5%)
Ogni scaglione $S$ copre un intervallo centrato di $\pm 0,25\%$. Le soglie di prezzo minimo e massimo sono ricavate tramite formula inversa:
$$P_{\text{min}} = P_{\text{target}} \times \left(1 + \frac{S - 0,25}{\text{Incidenza \%}}\right) \qquad P_{\text{max}} = P_{\text{target}} \times \left(1 + \frac{S + 0,25}{\text{Incidenza \%}}\right)$$

### 4. Regola Calendario Rilevazioni MASE
Una rilevazione pubblicata dal Ministero il lunedì/martedì (es. `31/08/2026`) si riferisce al periodo osservato dal lunedì precedente alla domenica precedente (`24/08/2026 - 30/08/2026`).  
**Tutti i calendari e selettori bloccano la data massima (`max`) all'ultima domenica (`obs_end`).**

---

## 💾 Dataset Ministeriale (Struttura JSON)

Il file `src/data/gasolio_mase.json` ha la seguente struttura validata:

```json
{
  "metadata": {
    "source": "MASE - DGSAIE",
    "last_updated": "2026-09-01T16:49:51+00:00",
    "product": "Gasolio auto",
    "unit": "EUR/L",
    "weekly_count": 1093,
    "monthly_count": 367,
    "annual_count": 30
  },
  "annual_averages": {
    "2025": { "anno": 2025, "prezzo_pompa": 1.6527, "imponibile": 1.3546, "netto": 0.7276, "accisa": 0.627, "iva": 0.298 }
  },
  "monthly_history": [
    { "anno": 2026, "mese": 7, "nome_mese": "Luglio", "prezzo_pompa": 2.027, "imponibile": 1.6615, "netto": 1.0115, "accisa": 0.65, "iva": 0.3655 }
  ],
  "weekly_history": [
    { "data": "2026-08-31", "prezzo_pompa": 2.1235, "imponibile": 1.7405, "netto": 1.2076, "accisa": 0.5329, "iva": 0.3829 }
  ]
}
```

---

## 💻 Guida allo Sviluppo Locale

### Requisiti:
* **Node.js:** v20+ (consigliato v24)
* **Python:** 3.10+ (per eseguire manualmente `fetch_data.py`)

### 1. Installazione e Avvio
```bash
# Installa le dipendenze npm
npm install

# Avvia il server di sviluppo locale (Vite)
npm run dev
```
L'applicazione sarà accessibile in tempo reale su `http://localhost:5173`.

### 2. Aggiornamento Manuale Dati MASE (Opzionale)
```bash
python fetch_data.py
```

### 3. Build di Produzione e Deploy
```bash
git add .
git commit -m "feat: descrizione modifica"
git push origin main
```
Il push sul branch `main` attiva automaticamente il workflow `deploy.yml`.

---

## 🔗 Parametri URL (Deep Linking)

L'applicazione sincronizza bidirezionalmente lo stato nei parametri di ricerca dell'URL per consentire la condivisione di link pre-configurati:

| Parametro | Valori Ammessi | Descrizione |
| :--- | :--- | :--- |
| `price_type` | `pompa`, `imponibile`, `netto` | Seleziona la base di prezzo ministeriale |
| `weight` | Intero da `1` a `100` (es. `30`, `28`) | Quota di incidenza percentuale del gasolio |
| `granularity` | `mensile`, `settimanale` | Granularità del periodo da valutare |

*Esempio:* `https://acasablanca87.github.io/fuel-surcharge-web/?price_type=imponibile&weight=28&granularity=mensile`

---

## 🤖 Linee Guida per Sessioni di Sviluppo AI Future

Quando riprendi questo progetto in una nuova chat AI:
1. **Carica inizialmente solo questo `README.md`** per fornire all'AI il contesto completo di architettura, formule, convenzioni grafiche e vincoli di sistema.
2. **Carica solo i singoli file da modificare** (ad es. solo `src/App.jsx` se si tratta di UI, o solo `fetch_data.py` se si tratta di ETL).
3. **Richiedi all'AI modifiche con il metodo "Search & Replace Chirurgico"** per mantenere l'integrità del codice ed evitare regressioni.