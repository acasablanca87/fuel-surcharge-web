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

// Formatta un oggetto Date in YYYY-MM-DD locale (senza bug di timezone UTC)
export function toISODateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Metadati settimana MASE (Lunedì-Domenica e ISO Week)
export function getWeekMeta(dateStr) {
  if (!dateStr) return { label: "N/D", obsStartISO: "", obsEndISO: "", isoWeek: 0, isoYear: 0, weekNumber: "", yearShort: "", subText: "" };
  
  const [y, m, d] = dateStr.split("-").map(Number);
  const relDate = new Date(y, m - 1, d);
  
  // Data inizio (7 giorni prima: Lunedì) e fine (1 giorno prima: Domenica)
  const obsStartDt = new Date(relDate);
  obsStartDt.setDate(relDate.getDate() - 7);
  const obsEndDt = new Date(relDate);
  obsEndDt.setDate(relDate.getDate() - 1);

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
  // ISO week-year = anno di calendario del giovedì della settimana (ISO 8601), non del lunedì:
  // per le settimane 1 che iniziano a dicembre il lunedì cade nell'anno precedente (es. lun 29/12/2025 → settimana 01/2026).
  const isoYear = new Date(firstThursday).getFullYear();

  const startStr = obsStartDt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
  const endStr = obsEndDt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  const label = `Settimana ${String(isoWeek).padStart(2, "0")}/${isoYear} (${startStr} - ${endStr})`;

  return {
    rawDate: dateStr,
    label,
    obsStart: obsStartDt,
    obsEnd: obsEndDt,
    obsStartISO: toISODateString(obsStartDt),
    obsEndISO: toISODateString(obsEndDt),
    isoWeek,
    isoYear,
    // Campi di comodo per le etichette compatte (es. "Settimana 38/26 (01/09 - 07/09/2026)")
    weekNumber: String(isoWeek).padStart(2, "0"),
    yearShort: String(isoYear).slice(-2),
    subText: `${startStr} - ${endStr}`
  };
}

/**
 * Individua il "mese in corso" provvisorio: il mese dell'ultima rilevazione settimanale
 * non ancora presente nell'archivio mensile consolidato, come media delle sue settimane.
 * Restituisce null se non esiste un mese provvisorio.
 */
export function getProvisionalMonth(weeklyList, monthlyList, key) {
  if (!weeklyList || weeklyList.length === 0) return null;

  const [yStr, mStr] = String(weeklyList[weeklyList.length - 1].data).split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  if (monthlyList && monthlyList.some((m) => m.anno === year && m.mese === month)) return null;

  const weeks = weeklyList.filter((w) => {
    const [wy, wm] = String(w.data).split("-").map(Number);
    return wy === year && wm === month;
  });
  if (weeks.length === 0) return null;

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  const price = weeks.reduce((acc, w) => acc + (w[key] || 0), 0) / weeks.length;

  return { price, title: `${monthNames[month - 1]} ${year}`, count: weeks.length };
}