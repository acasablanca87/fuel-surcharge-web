/**
 * Utility di calcolo matematico e formattazione per Fuel Surcharge Italia.
 */

// Formattatore numerico standard italiano con virgola decimale
export function fmtIt(val, decimals = 3, sign = false) {
  if (val === undefined || val === null || isNaN(val)) return "0,000";
  const prefix = sign && val > 0.00001 ? "+" : "";
  const parts = Number(val).toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${prefix}${parts.join(",")}`;
}

// Calcolo Fuel Surcharge: delta euro, delta % e surcharge %
export function calculateSurcharge(targetPrice, currentPrice, fuelWeightPct) {
  if (!targetPrice || targetPrice <= 0) return { deltaPrice: 0, deltaPct: 0, surchargePct: 0 };
  const deltaPrice = currentPrice - targetPrice;
  const deltaPct = (deltaPrice / targetPrice) * 100;
  const surchargePct = deltaPct * (fuelWeightPct / 100);
  return { deltaPrice, deltaPct, surchargePct };
}

// Calcolo dei limiti di prezzo per la matrice a scaglioni
export function priceBracket(targetPrice, surchargePct, fuelWeightPct) {
  if (!targetPrice || targetPrice <= 0) return [0, 0];
  const lowerSurcharge = surchargePct - 0.25;
  const upperSurcharge = surchargePct + 0.25;
  const pMin = targetPrice * (1 + lowerSurcharge / fuelWeightPct);
  const pMax = targetPrice * (1 + upperSurcharge / fuelWeightPct);
  return [pMin, pMax];
}

// Metadati settimana MASE (Lunedì-Domenica e ISO Week)
export function getWeekMeta(dateStr) {
  if (!dateStr) return { label: "N/D", obsStart: "", obsEnd: "", isoWeek: 0, isoYear: 0 };
  const dt = new Date(dateStr);
  
  // Data inizio (7 giorni prima) e fine (1 giorno prima)
  const obsStartDt = new Date(dt);
  obsStartDt.setDate(dt.getDate() - 7);
  const obsEndDt = new Date(dt);
  obsEndDt.setDate(dt.getDate() - 1);

  // Calcolo ISO Week
  const tempDt = new Date(obsStartDt.valueOf());
  const dayNum = (obsStartDt.getDay() + 6) % 7;
  tempDt.setDate(tempDt.getDate() - dayNum + 3);
  const firstThursday = tempDt.valueOf();
  tempDt.setMonth(0, 1);
  if (tempDt.getDay() !== 4) {
    tempDt.setMonth(0, 1 + ((4 - tempDt.getDay() + 7) % 7));
  }
  const isoWeek = 1 + Math.ceil((firstThursday - tempDt) / 604800000);
  const isoYear = obsStartDt.getFullYear();

  const startStr = obsStartDt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
  const endStr = obsEndDt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  const label = `Settimana ${String(isoWeek).padStart(2, "0")} / ${isoYear} (dal ${startStr} al ${endStr})`;

  return {
    rawDate: dateStr,
    label,
    obsStart: obsStartDt,
    obsEnd: obsEndDt,
    isoWeek,
    isoYear
  };
}