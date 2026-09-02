import React, { useState, useMemo, useEffect } from 'react';
import rawData from './data/gasolio_mase.json';
import { fmtIt, calculateSurcharge, priceBracket, getWeekMeta, toISODateString } from './utils/calculation';

// Componente Plotly ottimizzato per Vite
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

import { 
  Fuel, Sliders, Info, TrendingUp, BarChart3, Search, 
  Calculator, BookOpen, Calendar, ExternalLink, CheckCircle2
} from 'lucide-react';

const priceTypeOptions = {
  pompa: "Prezzo Globale (alla pompa)",
  imponibile: "Prezzo Imponibile (SENZA IVA con Accise)",
  netto: "Prezzo Netto Industriale (SENZA IVA e ACCISE)"
};

const priceKeys = {
  pompa: "prezzo_pompa",
  imponibile: "imponibile",
  netto: "netto"
};

export default function App() {
  const weeklyList = useMemo(() => rawData.weekly_history || [], []);
  const monthlyList = useMemo(() => rawData.monthly_history || [], []);
  const annualDict = useMemo(() => rawData.annual_averages || {}, []);

  // --- CALCOLO LIMITE MASSIMO DATA REALE (Ultima Domenica Rilevata) ---
  const { maxAvailDateISO, maxAvailDateFormatted, defaultMonthStartISO } = useMemo(() => {
    if (!weeklyList.length) {
      const today = new Date();
      const iso = toISODateString(today);
      return { maxAvailDateISO: iso, maxAvailDateFormatted: iso, defaultMonthStartISO: iso };
    }
    const lastMeta = getWeekMeta(weeklyList[weeklyList.length - 1].data);
    const endISO = lastMeta.obsEndISO; // Es: 2026-08-30 (Domenica)
    const [y, m, d] = endISO.split("-");
    
    // Inizio del mese relativo all'ultima domenica
    const startOfMonthISO = `${y}-${m}-01`;

    return {
      maxAvailDateISO: endISO,
      maxAvailDateFormatted: `${d}/${m}/${y}`,
      defaultMonthStartISO: startOfMonthISO
    };
  }, [weeklyList]);

  // --- STATO REATTIVO PRINCIPALE ---
  const [priceType, setPriceType] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("price_type");
    return p && priceTypeOptions[p] ? p : "pompa";
  });
  
  const [fuelWeight, setFuelWeight] = useState(() => {
    const w = parseInt(new URLSearchParams(window.location.search).get("weight"), 10);
    return !isNaN(w) && w >= 1 && w <= 100 ? w : 30;
  });

  const [granularity, setGranularity] = useState(() => {
    const g = new URLSearchParams(window.location.search).get("granularity");
    return g && g.toLowerCase() === "settimanale" ? "Settimanale" : "Mensile";
  });

  // Periodo Target (Base)
  const [targetMode, setTargetMode] = useState("Anno solare"); // "Anno solare", "Singolo Mese", "Range personalizzato"
  const [selYear, setSelYear] = useState("2025");
  const [selTargetMonthIdx, setSelTargetMonthIdx] = useState(0);
  const [tgtStartDate, setTgtStartDate] = useState("2025-01-01");
  const [tgtEndDate, setTgtEndDate] = useState("2025-12-31");

  // Rilevazione da valutare
  const [selMonthIdx, setSelMonthIdx] = useState(0); // 0 = più recente
  const [selWeekIdx, setSelWeekIdx] = useState(0);   // 0 = più recente

  // Tab attivo nella suite inferiore
  const [activeTab, setActiveTab] = useState("chart");

  // --- STATO QUICK LOOKUP (Tab 3) ---
  const [lookupMode, setLookupMode] = useState("Intervallo Date");
  const [lkStartDate, setLkStartDate] = useState(() => defaultMonthStartISO);
  const [lkEndDate, setLkEndDate] = useState(() => maxAvailDateISO);
  const [lkYear, setLkYear] = useState("2025");
  const [lkMonthIdx, setLkMonthIdx] = useState(0);
  const [lkWeekIdx, setLkWeekIdx] = useState(0);
  const [lkExactDate, setLkExactDate] = useState(() => maxAvailDateISO);

  // Aggiorna le date di lookup all'avvio
  useEffect(() => {
    if (maxAvailDateISO) {
      setLkEndDate(maxAvailDateISO);
      setLkExactDate(maxAvailDateISO);
      setLkStartDate(defaultMonthStartISO);
    }
  }, [maxAvailDateISO, defaultMonthStartISO]);

  // --- STATO SIMULATORE WHAT-IF (Tab 4) ---
  const [simBasePrice, setSimBasePrice] = useState(1.650);
  const [simEvalPrice, setSimEvalPrice] = useState(1.820);
  const [simWeight, setSimWeight] = useState(30);

  // Sincronizzazione parametri URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("price_type", priceType);
    params.set("weight", fuelWeight.toString());
    params.set("granularity", granularity.toLowerCase());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [priceType, fuelWeight, granularity]);

  const activeKey = priceKeys[priceType];

  // --- CALCOLO PREZZO TARGET (ANNO, MESE O RANGE PERSONALIZZATO) ---
  const { targetPrice, targetPricePompa, targetPriceNetto, targetLabel, targetEndDate } = useMemo(() => {
    if (targetMode === "Anno solare") {
      const row = annualDict[selYear] || {};
      return {
        targetPrice: row[activeKey] || 1.650,
        targetPricePompa: row.prezzo_pompa || 1.650,
        targetPriceNetto: row.netto || 0.720,
        targetLabel: `Media Anno ${selYear}`,
        targetEndDate: new Date(Number(selYear), 11, 31)
      };
    } else if (targetMode === "Singolo Mese") {
      const reversedMonthly = [...monthlyList].reverse();
      const record = reversedMonthly[selTargetMonthIdx] || reversedMonthly[0];
      const y = record?.anno || 2025;
      const m = record?.mese || 1;
      return {
        targetPrice: record ? record[activeKey] : 1.650,
        targetPricePompa: record ? record.prezzo_pompa : 1.650,
        targetPriceNetto: record ? record.netto : 0.720,
        targetLabel: `Media ${record?.nome_mese} ${y}`,
        targetEndDate: new Date(y, m, 0)
      };
    } else {
      // Range Personalizzato (da / a)
      const matched = weeklyList.filter((item) => {
        const meta = getWeekMeta(item.data);
        return meta.obsEndISO >= tgtStartDate && meta.obsStartISO <= tgtEndDate;
      });

      const [sY, sM, sD] = tgtStartDate.split("-");
      const [eY, eM, eD] = tgtEndDate.split("-");
      const label = `Media ${sD}/${sM}/${sY.slice(2)} - ${eD}/${eM}/${eY.slice(2)}`;

      if (matched.length === 0) {
        return {
          targetPrice: 1.650,
          targetPricePompa: 1.650,
          targetPriceNetto: 0.720,
          targetLabel: label,
          targetEndDate: new Date(tgtEndDate)
        };
      }

      const count = matched.length;
      return {
        targetPrice: matched.reduce((acc, r) => acc + r[activeKey], 0) / count,
        targetPricePompa: matched.reduce((acc, r) => acc + r.prezzo_pompa, 0) / count,
        targetPriceNetto: matched.reduce((acc, r) => acc + r.netto, 0) / count,
        targetLabel: label,
        targetEndDate: new Date(tgtEndDate)
      };
    }
  }, [targetMode, selYear, selTargetMonthIdx, tgtStartDate, tgtEndDate, activeKey, annualDict, monthlyList, weeklyList]);

  // Pre-popola il simulatore con il prezzo target
  useEffect(() => {
    if (targetPrice > 0) setSimBasePrice(Number(targetPrice.toFixed(3)));
  }, [targetPrice]);

  // --- CALCOLO PREZZO RILEVATO (ATTUALE) ---
  const { currentPrice, evalLabel, commercialText } = useMemo(() => {
    if (granularity === "Mensile" && monthlyList.length > 0) {
      const reversedMonthly = [...monthlyList].reverse();
      const record = reversedMonthly[selMonthIdx] || reversedMonthly[0];
      const p = record[activeKey] || 0;
      const mName = record.nome_mese;
      const yNum = record.anno;
      return {
        currentPrice: p,
        evalLabel: `${mName} ${yNum}`,
        commercialText: `Percentuale rilevata su ${mName} ${yNum}, convenzionalmente valida per la fatturazione del mese successivo.`
      };
    } else if (weeklyList.length > 0) {
      const reversedWeekly = [...weeklyList].reverse();
      const record = reversedWeekly[selWeekIdx] || reversedWeekly[0];
      const meta = getWeekMeta(record.data);
      const p = record[activeKey] || 0;
      return {
        currentPrice: p,
        evalLabel: meta.label,
        commercialText: `Percentuale rilevata sulla settimana selezionata, convenzionalmente valida per la fatturazione della settimana successiva.`
      };
    }
    return { currentPrice: 0, evalLabel: "N/D", commercialText: "" };
  }, [granularity, monthlyList, weeklyList, selMonthIdx, selWeekIdx, activeKey]);

  // (Pre-popolamento spostato e sincronizzato con la Consultazione Rapida)

  // --- CALCOLO DEL SURCHARGE ATTUALE ---
  const { deltaPct, surchargePct } = useMemo(() => {
    return calculateSurcharge(targetPrice, currentPrice, fuelWeight);
  }, [targetPrice, currentPrice, fuelWeight]);

  // --- RIGHE MATRICE A SCAGLIONI (±0,5%) ---
  const bracketRows = useMemo(() => {
    const center = Math.round(surchargePct * 2) / 2;
    const steps = [];
    for (let i = -5; i <= 5; i++) {
      steps.push(Number((center + i * 0.5).toFixed(2)));
    }
    return steps.map((s) => {
      const [pMin, pMax] = priceBracket(targetPrice, s, fuelWeight);
      const isCurrent = surchargePct >= s - 0.25 && surchargePct < s + 0.25;
      return { s, pMin, pMax, isCurrent };
    });
  }, [surchargePct, targetPrice, fuelWeight]);

  // --- DATI PER GRAFICO 2: TREND SURCHARGE (Post Periodo Target) ---
  const surchargeTrendData = useMemo(() => {
    const points = [];
    if (granularity === "Mensile") {
      monthlyList.forEach((row) => {
        const rowDate = new Date(row.anno, row.mese, 0);
        if (rowDate > targetEndDate) {
          const dPompaPct = ((row.prezzo_pompa - targetPricePompa) / targetPricePompa) * 100;
          const surPompa = dPompaPct * (fuelWeight / 100.0);
          const dNettoPct = ((row.netto - targetPriceNetto) / targetPriceNetto) * 100;
          const surNetto = dNettoPct * (fuelWeight / 100.0);
          points.push({
            label: `${row.nome_mese.slice(0, 3)} ${row.anno}`,
            surPompa,
            surNetto
          });
        }
      });
    } else {
      weeklyList.forEach((row) => {
        const meta = getWeekMeta(row.data);
        if (meta.obsEnd > targetEndDate) {
          const dPompaPct = ((row.prezzo_pompa - targetPricePompa) / targetPricePompa) * 100;
          const surPompa = dPompaPct * (fuelWeight / 100.0);
          const dNettoPct = ((row.netto - targetPriceNetto) / targetPriceNetto) * 100;
          const surNetto = dNettoPct * (fuelWeight / 100.0);
          points.push({
            label: `Sett. ${String(meta.isoWeek).padStart(2, '0')}/${meta.isoYear}`,
            surPompa,
            surNetto
          });
        }
      });
    }
    return points;
  }, [granularity, monthlyList, weeklyList, targetEndDate, targetPricePompa, targetPriceNetto, fuelWeight]);

  // --- DATI QUICK LOOKUP (Tab 3) ---
  const lookupResult = useMemo(() => {
    if (lookupMode === "Intervallo Date") {
      const matched = weeklyList.filter((item) => {
        const meta = getWeekMeta(item.data);
        return meta.obsEndISO >= lkStartDate && meta.obsStartISO <= lkEndDate;
      });
      if (matched.length === 0) return null;
      const count = matched.length;
      return {
        pompa: matched.reduce((acc, r) => acc + r.prezzo_pompa, 0) / count,
        imponibile: matched.reduce((acc, r) => acc + r.imponibile, 0) / count,
        netto: matched.reduce((acc, r) => acc + r.netto, 0) / count,
        accisa: matched.reduce((acc, r) => acc + r.accisa, 0) / count,
        iva: matched.reduce((acc, r) => acc + r.iva, 0) / count,
        detailText: `Media calcolata su ${count} rilevazioni settimanali nel range selezionato.`
      };
    } else if (lookupMode === "Anno solare") {
      const res = annualDict[lkYear] || {};
      return {
        pompa: res.prezzo_pompa || 0,
        imponibile: res.imponibile || 0,
        netto: res.netto || 0,
        accisa: res.accisa || 0,
        iva: res.iva || 0,
        detailText: `Dato aggregato annuale ufficiale MASE per l'anno ${lkYear}`
      };
    } else if (lookupMode === "Singolo Mese") {
      const reversed = [...monthlyList].reverse();
      const m = reversed[lkMonthIdx] || reversed[0];
      return {
        pompa: m.prezzo_pompa,
        imponibile: m.imponibile,
        netto: m.netto,
        accisa: m.accisa,
        iva: m.iva,
        detailText: `Dato consolidato mensile ufficiale MASE per ${m.nome_mese} ${m.anno}`
      };
    } else if (lookupMode === "Settimana Specifica") {
      const reversed = [...weeklyList].reverse();
      const w = reversed[lkWeekIdx] || reversed[0];
      const meta = getWeekMeta(w.data);
      return {
        pompa: w.prezzo_pompa,
        imponibile: w.imponibile,
        netto: w.netto,
        accisa: w.accisa,
        iva: w.iva,
        detailText: `Rilevazione ufficiale ministeriale: ${meta.label}`
      };
    } else {
      // Data Esatta (Giorno)
      let matched = weeklyList.find((w) => {
        const meta = getWeekMeta(w.data);
        return lkExactDate >= meta.obsStartISO && lkExactDate <= meta.obsEndISO;
      }) || weeklyList[weeklyList.length - 1];
      const meta = getWeekMeta(matched.data);
      const [y, m, d] = lkExactDate.split("-");
      return {
        pompa: matched.prezzo_pompa,
        imponibile: matched.imponibile,
        netto: matched.netto,
        accisa: matched.accisa,
        iva: matched.iva,
        detailText: `Giorno richiesto: ${d}/${m}/${y} • Rilevazione MASE di riferimento in vigore: ${meta.label}`
      };
    }
  }, [lookupMode, lkStartDate, lkEndDate, lkYear, lkMonthIdx, lkWeekIdx, lkExactDate, weeklyList, monthlyList, annualDict]);

  // Pre-popola il prezzo stimato nel simulatore con il prezzo della Consultazione Rapida (Tab 3)
  useEffect(() => {
    if (lookupResult) {
      const p = activeKey === "prezzo_pompa" 
        ? lookupResult.pompa 
        : (activeKey === "imponibile" ? lookupResult.imponibile : lookupResult.netto);
      if (p > 0) setSimEvalPrice(Number(p.toFixed(3)));
    } else if (currentPrice > 0) {
      setSimEvalPrice(Number(currentPrice.toFixed(3)));
    }
  }, [lookupResult, activeKey, currentPrice]);

  // --- CALCOLO SIMULATORE WHAT-IF (Tab 4) ---
  const simResult = useMemo(() => {
    const { deltaPct: sDeltaPct, surchargePct: sSurPct } = calculateSurcharge(simBasePrice, simEvalPrice, simWeight);
    const sStep = Math.round(sSurPct * 2) / 2;
    const [pMin, pMax] = priceBracket(simBasePrice, sStep, simWeight);
    return { sDeltaPct, sSurPct, sStep, pMin, pMax };
  }, [simBasePrice, simEvalPrice, simWeight]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 antialiased selection:bg-sky-500 selection:text-white">
      
      {/* HEADER ISTITUZIONALE */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-sky-600 text-white rounded-xl shadow-sm">
                <Fuel className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
                FUEL SURCHARGE ITALIA
              </h1>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Rilevazioni Ufficiali Gasolio Autotrasporto Merci
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/0/00/Emblem_of_Italy.svg" 
              alt="Repubblica Italiana" 
              className="w-7 h-7 opacity-90"
            />
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded">
                Dati MASE DGSAIE
              </span>
              <div className="text-xs text-slate-600 font-semibold mt-0.5">
                Dati validi fino al: <b>{maxAvailDateFormatted}</b>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">

        {/* 1. PANNELLO DI CONTROLLO CONFIGURAZIONE */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-sky-600" />
            <h2 className="font-bold text-slate-800 text-base md:text-lg">
              Parametri generali di calcolo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base di Prezzo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Base di Prezzo Ministeriale:
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
              >
                {Object.entries(priceTypeOptions).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Incidenza Costo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Incidenza costo gasolio (%):
              </label>
              <select
                value={fuelWeight}
                onChange={(e) => setFuelWeight(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}%</option>
                ))}
              </select>
            </div>

            {/* Periodo Target (MODALITÀ A 3 VIE) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modalità del Periodo Base (Target):
              </label>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm mb-2"
              >
                <option value="Anno solare">Anno solare</option>
                <option value="Singolo Mese">Singolo Mese</option>
                <option value="Range personalizzato">Range personalizzato (da / a)</option>
              </select>

              {targetMode === "Anno solare" && (
                <select
                  value={selYear}
                  onChange={(e) => setSelYear(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                >
                  {Object.keys(annualDict).sort((a,b) => b - a).map((y) => (
                    <option key={y} value={y}>Media Anno {y}</option>
                  ))}
                </select>
              )}

              {targetMode === "Singolo Mese" && (
                <select
                  value={selTargetMonthIdx}
                  onChange={(e) => setSelTargetMonthIdx(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                >
                  {[...monthlyList].reverse().map((m, idx) => (
                    <option key={`tgt-${m.anno}-${m.mese}`} value={idx}>
                      {m.nome_mese} {m.anno}
                    </option>
                  ))}
                </select>
              )}

              {targetMode === "Range personalizzato" && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold text-slate-500">Da:</span>
                    <input 
                      type="date"
                      max={maxAvailDateISO}
                      value={tgtStartDate}
                      onChange={(e) => setTgtStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold text-slate-500">A:</span>
                    <input 
                      type="date"
                      max={maxAvailDateISO}
                      value={tgtEndDate}
                      onChange={(e) => setTgtEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Granularità e Rilevazione da Valutare */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rilevazione da Valutare:
              </label>
              <div className="flex gap-2 mb-2">
                {["Mensile", "Settimanale"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                      granularity === g 
                        ? 'bg-sky-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {granularity === "Mensile" ? (
                <select
                  value={selMonthIdx}
                  onChange={(e) => setSelMonthIdx(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                >
                  {[...monthlyList].reverse().map((m, idx) => (
                    <option key={`${m.anno}-${m.mese}`} value={idx}>
                      {idx === 0 ? `Ultimo Mese (${m.nome_mese} ${m.anno})` : `${m.nome_mese} ${m.anno}`}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selWeekIdx}
                  onChange={(e) => setSelWeekIdx(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
                >
                  {[...weeklyList].reverse().map((w, idx) => {
                    const meta = getWeekMeta(w.data);
                    return (
                      <option key={w.data} value={idx}>
                        {idx === 0 ? `Ultima Settimana - ${meta.label}` : meta.label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>
        </section>

        {/* 2. HERO CARD SURCHARGE */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            Fuel Surcharge Calcolato ({granularity})
          </div>

          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4 my-2">
            <div className={`text-4xl md:text-5xl font-black tracking-tight ${
              surchargePct > 0.0001 ? 'text-red-400' : (surchargePct < -0.0001 ? 'text-emerald-400' : 'text-slate-100')
            }`}>
              {fmtIt(surchargePct, 2, true)} %
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-lg text-xs">
                <b>Prezzo Rilevato:</b> {fmtIt(currentPrice, 3)} €/L ({evalLabel})
              </span>
              <span className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-lg text-xs">
                <b>Prezzo Base:</b> {fmtIt(targetPrice, 3)} €/L ({targetLabel})
              </span>
              <span className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-lg text-xs">
                <b>Variazione:</b> {fmtIt(deltaPct, 2, true)}%
              </span>
              <span className="bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-lg text-xs">
                <b>Peso:</b> {fuelWeight}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span><b>Applicazione commerciale:</b> {commercialText}</span>
          </div>
        </section>

        {/* 3. MATRICE A SCAGLIONI (PASSI DA 0,5%) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-base md:text-lg">
              Matrice a scaglioni previsionali
            </h3>
            <p className="text-xs text-slate-500">Forchette del prezzo gasolio con relativo Fuel Surcharge (passi da ±0,50%).</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 rounded-l-xl font-bold">Forchetta Prezzo Gasolio</th>
                  <th className="py-3 px-4 font-bold text-center">Fuel Surcharge</th>
                  <th className="py-3 px-4 rounded-r-xl font-bold">Stato / Riferimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bracketRows.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${
                      row.isCurrent 
                        ? 'bg-red-50 font-bold text-red-900 ring-1 ring-red-200 rounded-lg' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-3 px-4">
                      da {fmtIt(row.pMin, 3)} € a {fmtIt(row.pMax, 3)} €
                    </td>
                    <td className="py-3 px-4 text-center font-black">
                      <span className={`inline-block px-2.5 py-0.5 rounded ${
                        row.isCurrent ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {fmtIt(row.s, 2, true)} %
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {row.isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-extrabold uppercase tracking-wide">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          ATTUALE • {fmtIt(currentPrice, 3)} €/L ({evalLabel})
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. LA SUITE SPECIALISTICA (I 4 TAB) */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Barra dei Tab */}
          <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
            {[
              { id: "chart", label: "Andamento Storico Prezzi", icon: BarChart3 },
              { id: "surcharge", label: "Trend Fuel Surcharge (%)", icon: TrendingUp },
              { id: "lookup", label: "Consultazione Libera Prezzi", icon: Search },
              { id: "simulator", label: "Simulatore What-If", icon: Calculator },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs md:text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? 'border-sky-600 text-sky-700 bg-white shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Contenuto Dinamico dei Tab */}
          <div className="p-5 md:p-6">
            
            {/* TAB 1: GRAFICO STORICO PREZZI PLOTLY */}
            {activeTab === "chart" && (
              <div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">
                  Evoluzione Prezzo Gasolio Auto Italia (Rilevazioni Settimanali MASE)
                </h4>
                <p className="text-xs text-slate-500 mb-4">Grafico interattivo delle 4 componenti con range-slider e filtri rapidi.</p>

                <div className="w-full h-[450px]">
                  <Plot
                    data={[
                      {
                        x: weeklyList.map((r) => r.data),
                        y: weeklyList.map((r) => r.prezzo_pompa),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Alla Pompa',
                        line: { color: '#2563eb', width: 2 }
                      },
                      {
                        x: weeklyList.map((r) => r.data),
                        y: weeklyList.map((r) => r.imponibile),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Imponibile (no IVA)',
                        line: { color: '#6366f1', width: 1.5, dash: 'dot' }
                      },
                      {
                        x: weeklyList.map((r) => r.data),
                        y: weeklyList.map((r) => r.netto),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Netto Industriale',
                        line: { color: '#f59e0b', width: 1.8 }
                      },
                      {
                        x: weeklyList.map((r) => r.data),
                        y: weeklyList.map((r) => r.accisa),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Accisa',
                        line: { color: '#10b981', width: 1.5 }
                      }
                    ]}
                    layout={{
                      autosize: true,
                      margin: { l: 45, r: 15, t: 30, b: 35 },
                      xaxis: {
                        title: "Data Rilevazione",
                        rangeselector: {
                          buttons: [
                            { count: 1, label: '1 Anno', step: 'year', stepmode: 'backward' },
                            { count: 3, label: '3 Anni', step: 'year', stepmode: 'backward' },
                            { count: 5, label: '5 Anni', step: 'year', stepmode: 'backward' },
                            { step: 'all', label: 'Tutto' }
                          ],
                          bgcolor: '#f1f5f9',
                          activecolor: '#0284c7'
                        },
                        rangeslider: { visible: true, thickness: 0.07 }
                      },
                      yaxis: { title: "Euro al Litro (€/L)" },
                      legend: { orientation: 'h', y: 1.12, x: 0 },
                      hovermode: 'x unified',
                      font: { family: 'sans-serif', size: 11 }
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false, responsive: true }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: TREND SURCHARGE BI-CURVA PLOTLY */}
            {activeTab === "surcharge" && (
              <div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">
                  Confronto Evoluzione Fuel Surcharge (Post {targetLabel})
                </h4>
                <p className="text-xs text-slate-500 mb-4">Confronto in percentuale tra Surcharge calcolato su base Pompa e su base Netto Industriale.</p>

                {surchargeTrendData.length > 0 ? (
                  <div className="w-full h-[400px]">
                    <Plot
                      data={[
                        {
                          x: surchargeTrendData.map((d) => d.label),
                          y: surchargeTrendData.map((d) => d.surPompa),
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: 'Base Pompa',
                          line: { color: '#2563eb', width: 2.2 },
                          marker: { size: 5, color: '#1d4ed8' }
                        },
                        {
                          x: surchargeTrendData.map((d) => d.label),
                          y: surchargeTrendData.map((d) => d.surNetto),
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: 'Base Netto Industriale',
                          line: { color: '#f59e0b', width: 2.2, dash: 'dot' },
                          marker: { size: 5, color: '#d97706' }
                        }
                      ]}
                      layout={{
                        autosize: true,
                        margin: { l: 45, r: 15, t: 25, b: 50 },
                        xaxis: { title: "Periodo Rilevato", tickangle: -45, automargin: true },
                        yaxis: { title: "Percentuale Surcharge (%)" },
                        legend: { orientation: 'h', y: 1.12, x: 0 },
                        hovermode: 'x unified',
                        shapes: [
                          {
                            type: 'line',
                            x0: 0,
                            x1: 1,
                            xref: 'paper',
                            y0: 0,
                            y1: 0,
                            line: { color: '#94a3b8', width: 1.5, dash: 'dash' }
                          }
                        ]
                      }}
                      useResizeHandler={true}
                      style={{ width: '100%', height: '100%' }}
                      config={{ displayModeBar: false, responsive: true }}
                    />
                  </div>
                ) : (
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 text-center text-sky-800 text-sm">
                    Il Periodo Target selezionato ({targetLabel}) coincide con i dati più recenti disponibili. Seleziona un Periodo Base antecedente (es. Anno 2025) per osservare il trend nel tempo.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONSULTAZIONE LIBERA PREZZI (A 5 VIE) */}
            {activeTab === "lookup" && (
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-sm md:text-base">
                  Consultazione Rapida Rilevazioni Ufficiali MASE (Gasolio Auto)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Criterio di Ricerca:
                    </label>
                    <select
                      value={lookupMode}
                      onChange={(e) => setLookupMode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-800 text-sm"
                    >
                      <option value="Intervallo Date">Intervallo Date (da / a)</option>
                      <option value="Anno solare">Anno solare</option>
                      <option value="Singolo Mese">Singolo Mese</option>
                      <option value="Settimana Specifica">Settimana Specifica</option>
                      <option value="Data Esatta">Data Esatta (Giorno)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex flex-col md:flex-row gap-3 items-end">
                    {lookupMode === "Intervallo Date" && (
                      <>
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Data Inizio:</label>
                          <input 
                            type="date" 
                            max={maxAvailDateISO}
                            value={lkStartDate} 
                            onChange={(e) => setLkStartDate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold"
                          />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Data Fine:</label>
                          <input 
                            type="date" 
                            max={maxAvailDateISO}
                            value={lkEndDate} 
                            onChange={(e) => setLkEndDate(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold"
                          />
                        </div>
                      </>
                    )}

                    {lookupMode === "Anno solare" && (
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Anno Solare:</label>
                        <select
                          value={lkYear}
                          onChange={(e) => setLkYear(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                        >
                          {Object.keys(annualDict).sort((a,b) => b - a).map((y) => (
                            <option key={`lk-${y}`} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {lookupMode === "Singolo Mese" && (
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Mese:</label>
                        <select
                          value={lkMonthIdx}
                          onChange={(e) => setLkMonthIdx(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                        >
                          {[...monthlyList].reverse().map((m, idx) => (
                            <option key={`lkm-${m.anno}-${m.mese}`} value={idx}>
                              {m.nome_mese} {m.anno}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {lookupMode === "Settimana Specifica" && (
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Settimana:</label>
                        <select
                          value={lkWeekIdx}
                          onChange={(e) => setLkWeekIdx(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                        >
                          {[...weeklyList].reverse().map((w, idx) => (
                            <option key={`lkw-${w.data}`} value={idx}>
                              {getWeekMeta(w.data).label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {lookupMode === "Data Esatta" && (
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Data Viaggio / Documento:</label>
                        <input 
                          type="date" 
                          max={maxAvailDateISO}
                          value={lkExactDate} 
                          onChange={(e) => setLkExactDate(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {lookupResult ? (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-medium">
                      <b>Dettaglio:</b> {lookupResult.detailText}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Prezzo Pompa</div>
                        <div className="text-xl font-black text-sky-700 mt-1">{fmtIt(lookupResult.pompa, 3)} €/L</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Imponibile (no IVA)</div>
                        <div className="text-xl font-black text-indigo-700 mt-1">{fmtIt(lookupResult.imponibile, 3)} €/L</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Netto Industriale</div>
                        <div className="text-xl font-black text-amber-600 mt-1">{fmtIt(lookupResult.netto, 3)} €/L</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase">Accisa + IVA</div>
                        <div className="text-sm font-black text-emerald-700 mt-1">
                          Accisa: {fmtIt(lookupResult.accisa, 4)} €/L<br />
                          <span className="text-xs font-normal text-slate-500">IVA: {fmtIt(lookupResult.iva, 3)} €/L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 text-sm font-bold">Nessun dato trovato per la selezione.</div>
                )}
              </div>
            )}

            {/* TAB 4: SIMULATORE WHAT-IF */}
            {activeTab === "simulator" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base">
                    Simulatore di Fuel Surcharge su Prezzo Ipotetico (What-If)
                  </h4>
                  <p className="text-xs text-slate-500">Calcola istantaneamente il Surcharge inserendo scenari manuali o parametri di gara.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Prezzo Target (€/L):
                    </label>
                    <input 
                      type="number" 
                      step="0.005"
                      value={simBasePrice}
                      onChange={(e) => setSimBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Prezzo Ipotetico / Stimato (€/L):
                    </label>
                    <input 
                      type="number" 
                      step="0.005"
                      value={simEvalPrice}
                      onChange={(e) => setSimEvalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Incidenza Gasolio (%):
                    </label>
                    <select
                      value={simWeight}
                      onChange={(e) => setSimWeight(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold"
                    >
                      {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                        <option key={`sim-w-${n}`} value={n}>{n}%</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Risultato Simulazione */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Risultato Simulazione What-If
                  </div>
                  <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3 my-2">
                    <div className={`text-3xl md:text-4xl font-black ${
                      simResult.sSurPct > 0.0001 ? 'text-red-400' : (simResult.sSurPct < -0.0001 ? 'text-emerald-400' : 'text-slate-100')
                    }`}>
                      {fmtIt(simResult.sSurPct, 2, true)} %
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                        <b>Variazione Stimata:</b> {fmtIt(simResult.sDeltaPct, 2, true)}%
                      </span>
                      <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                        <b>Fascia Matrice:</b> da {fmtIt(simResult.pMin, 3)} € a {fmtIt(simResult.pMax, 3)} € (scaglione {fmtIt(simResult.sStep, 2, true)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* 5. NOTA METODOLOGICA & GUIDA ALL'UTILIZZO (2 COLONNE) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              Metodologia e Formule di Calcolo
            </h5>
            <ul className="space-y-2 list-disc list-inside text-slate-600">
              <li>
                <b>Variazione Prezzo Gasolio (Δ%):</b> Calcola lo scostamento tra prezzo rilevato e prezzo target base: <code className="bg-slate-100 px-1 py-0.5 rounded">Δ% = ((P_attuale - P_target) / P_target) × 100</code>
              </li>
              <li>
                <b>Quota di Incidenza (Peso %):</b> Il Fuel Surcharge finale è ottenuto moltiplicando la variazione per l'incidenza pattuita (default 30%, tabelle indicative costi MIT).
              </li>
              <li>
                <b>Matrice a Scaglioni (±0,50%):</b> Ogni scaglione tariffario copre una forchetta centrata di ±0,25%, calcolata tramite formula inversa dal Prezzo Base.
              </li>
              <li>
                <b>Basi di Prezzo:</b> Le variazioni su <i>Pompa</i> e <i>Imponibile</i> sono matematicamente identiche al centesimo (IVA 22% costante). Il <i>Netto Industriale</i> isola la materia prima pura escludendo l'accisa.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              Parametri di Default, Interattività e Fonti
            </h5>
            <ul className="space-y-2 list-disc list-inside text-slate-600">
              <li>
                <b>Configurazione all'Avvio:</b> Pre-impostata su <i>Prezzo Globale alla Pompa</i>, <i>Incidenza 30%</i> e <i>Periodo Base Anno 2025</i>.
              </li>
              <li>
                <b>Link Condivisibili (URL Query):</b> Qualsiasi parametro impostato viene sincronizzato nell'URL del browser per poter condividere preventivi pre-configurati.
              </li>
              <li>
                <b>Automazione Dati Ufficiali:</b> I dati provengono direttamente dal <i>Ministero dell'Ambiente e della Sicurezza Energetica (DGSAIE)</i>, aggiornati ogni martedì tramite automazione CI/CD.
              </li>
            </ul>
          </div>
        </section>

      </main>

      {/* FOOTER ISTITUZIONALE */}
      <footer className="mt-12 text-center text-xs text-slate-500">
        Fonte Dati Ufficiali:{" "}
        <a 
          href="https://sisen.mase.gov.it/dgsaie/prezzi-settimanali-carburanti" 
          target="_blank" 
          rel="noreferrer"
          className="text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5"
        >
          Ministero dell'Ambiente e della Sicurezza Energetica (DGSAIE) <ExternalLink className="w-3 h-3" />
        </a>
        <div className="text-[11px] text-slate-400 mt-1">
          Fuel Surcharge Italia • Indice di monitoraggio e simulazione adeguamento costo gasolio
        </div>
      </footer>

    </div>
  );
}