
import { UnitCalculationResult } from './calculatorService';
import { Unit } from '../types';

/**
 * Esporta i risultati del riparto in formato Excel (CSV)
 * Segue la logica del codice Python: trasforma dizionario in lista e salva
 */
export const exportToExcel = (
  results: Record<string, UnitCalculationResult>,
  units: Unit[],
  year: string,
  condoName: string
) => {
  const headers = ['Unità Immobiliare', 'Quota Millesimale (€)', 'Quota Acqua (€)', 'TOTALE DOVUTO (€)'];
  
  // Trasformiamo i risultati in una lista per l'esportazione, simile alla logica pandas
  const datiPerTabella = Object.entries(results).map(([uid, valori]) => {
    const unit = units.find(u => u.id === uid);
    return [
      unit?.name || uid,
      valori.addebito_millesimale.toFixed(2).replace('.', ','),
      valori.addebito_acqua.toFixed(2).replace('.', ','),
      valori.totale_da_pagare.toFixed(2).replace('.', ',')
    ];
  });

  const csvRows = [
    [`PROSPETTO RIPARTO SPESE - ${condoName}`],
    [`Periodo: ${year}`],
    [],
    headers,
    ...datiPerTabella
  ];

  const csvContent = csvRows.map(row => row.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Riparto_${condoName.replace(/\s+/g, '_')}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Simula il comportamento della classe ReportCondominio(FPDF)
 * Utilizza il motore di stampa del browser con layout dedicato
 */
export const exportToPDF = () => {
  // La formattazione della tabella PDF è gestita via CSS @media print nel componente Budget.tsx
  window.print();
};
