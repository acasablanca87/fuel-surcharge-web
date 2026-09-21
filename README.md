# ⛽ Fuel Surcharge Italia

> Piattaforma web open source per il monitoraggio e il calcolo trasparente del supplemento carburante (*Fuel Surcharge*) per l'autotrasporto merci in Italia, basata sui dati ufficiali del Ministero dell'Ambiente e della Sicurezza Energetica (MASE).

[![Deploy su GitHub Pages](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/deploy.yml)
[![Aggiornamento Dati MASE](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/update_data.yml/badge.svg)](https://github.com/acasablanca87/fuel-surcharge-web/actions/workflows/update_data.yml)
[![Web App Live](https://img.shields.io/badge/Web%20App-Live%20su%20GitHub%20Pages-0284c7?style=flat&logo=github)](https://acasablanca87.github.io/fuel-surcharge-web/)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20Vite%208%20%7C%20Tailwind%20v4-61dafb?logo=react)](https://react.dev/)

---

## 🎯 Obiettivi & Fonte Dati

Nel settore della logistica e dell'autotrasporto merci, le fluttuazioni del prezzo del gasolio impattano fortemente sui costi operativi. **Fuel Surcharge Italia** offre uno standard di riferimento neutrale e verificabile per vettori, committenti e spedizionieri.

* **Fonte Ufficiale Certificata:** I prezzi medi del gasolio auto sono estratti settimanalmente e mensilmente dal portale Open Data del **MASE (DGSAIE - Direzione Generale Infrastrutture e Sicurezza)**.
* **Architettura Serverless:** Applicazione statica reattiva hostata su GitHub Pages, senza backend a pagamento, con tempi di caricamento istantanei e aggiornamento automatico via CI/CD.

---

## ✨ Funzionalità Chiave

- **3 Basi di Prezzo Ministeriali:**
  - *Prezzo Globale alla Pompa* (IVA e accise incluse)
  - *Prezzo Imponibile* (senza IVA, con accise)
  - *Prezzo Netto Industriale* (senza IVA né accise)
- **Periodo Base & Target Flessibili:** Confronto rispetto a medie annuali, singoli mesi storici o intervalli personalizzati.
- **Granularità di Valutazione:** Analisi su base mensile o settimanale (con normalizzazione ISO Week e blocco automatico alla data di rilevazione effettiva).
- **Matrice Previsionale a Scaglioni (±0,50%):** Tabella con soglie di prezzo min/max per ciascun punto percentuale di variazione, con riga attiva evidenziata.
- **Suite Specialistica a 4 Tab:**
  1. *Andamento Storico Prezzi:* Grafico interattivo Plotly multi-curva (Pompa, Imponibile, Netto, Accisa) con preset a 5 anni e zoom.
  2. *Trend Fuel Surcharge (%):* Confronto storico bivariato (Base Pompa vs Base Netto).
  3. *Consultazione Libera Prezzi:* Ricerca istantanea a 5 vie (Range date, Anno solare, Singolo mese, Settimana ISO, Data esatta documento).
  4. *Simulatore What-If:* Calcolo previsionale di scenari tariffari ipotetici o capitolati di gara.
- **Deep Linking:** Sincronizzazione automatica dei parametri di filtro nell'URL (`price_type`, `weight`, `granularity`) per condividere calcoli specifici.

---

## 🧮 Modello di Calcolo

I calcoli seguono gli standard d'esercizio per l'autotrasporto (MIT / associazioni di categoria):

1. **Variazione Prezzo ($\Delta\%$):**
   $$\Delta\% = \left(\frac{P_{\text{rilevato}} - P_{\text{target}}}{P_{\text{target}}}\right) \times 100$$
2. **Fuel Surcharge Ponderato (%):**
   $$\text{Fuel Surcharge \%} = \Delta\% \times \left(\frac{\text{Incidenza \%}}{100}\right)$$
   *(Incidenza predefinita: 30%, personalizzabile da 1% a 100%).*

---

## 🛠️ Stack Tecnico

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React
- **Data Visualization:** Plotly.js (`react-plotly.js` + `plotly.js-dist-min`)
- **ETL / Pipeline Dati:** Python 3.13 (`fetch_data.py`), libreria standard `urllib`, `json`
- **Automazioni CI/CD:** GitHub Actions (pipeline ETL programmata e deploy statico su GitHub Pages)
- **Code Quality:** Oxlint

---

## 🚀 Guida Rapida (Quickstart)

### Prerequisiti
- **Node.js** v20+ (consigliato v24)
- **Python** 3.10+ (opzionale, solo per aggiornare manualmente i dati MASE)

### 1. Avvio Ambiente di Sviluppo
```bash
# Clona il repository ed entra nella cartella
git clone https://github.com/acasablanca87/fuel-surcharge-web.git
cd fuel-surcharge-web

# Installa le dipendenze
npm install

# Avvia il server di sviluppo Vite
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:5173`.

### 2. Aggiornamento Dataset MASE
Per scaricare e validare gli ultimi dati ministeriali in `src/data/gasolio_mase.json`:
```bash
python fetch_data.py
```

### 3. Build di Produzione
```bash
npm run build
```

---

## 🔄 Automazioni GitHub Actions

- **`update_data.yml`:** Esegue automaticamente lo script Python ogni martedì (in concomitanza con la pubblicazione ministeriale), valida la quadratura dei prezzi e se vi sono nuovi dati esegue il commit su `main`.
- **`deploy.yml`:** Compila l'applicazione con Vite e pubblica la build su GitHub Pages ad ogni push su `main` o al completamento dell'ETL.

---

## 📄 Licenza

Distribuito con licenza Open Source. I dati sui prezzi del carburante sono di pubblico dominio a cura del **Ministero dell'Ambiente e della Sicurezza Energetica (MASE - DGSAIE)**.