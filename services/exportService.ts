import { UnitCalculationResult } from './distributionUtils';
import { Unit, Transaction } from '../types';

/**
 * ESPORTA IL RIPARTO PER I CONDOMINI
 */
export const exportToExcel = (
  results: Record<string, UnitCalculationResult>,
  units: Unit[],
  year: string,
  condoName: string
) => {
  const headers = ['Unità Immobiliare', 'Quota Millesimale (€)', 'Quota Acqua (€)', 'TOTALE DOVUTO (€)'];
  
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

  downloadCSV(csvRows, `Riparto_${condoName}_${year}.csv`);
};

/**
 * ESPORTA IL RIEPILOGO FISCALE (MODELLO 770)
 */
export const export770ToExcel = (
  transactions: Transaction[],
  year: string,
  condoName: string
) => {
  // Prendiamo solo le spese con ritenuta dell'anno scelto
  const spese770 = transactions.filter(t => 
    t.type === 'EXPENSE' && 
    (t.ritenuta && t.ritenuta > 0) && 
    t.date.startsWith(year)
  );

  const headers = ['Data', 'Fornitore', 'P.IVA/CF', 'Cod. Tributo', 'Imponibile (€)', 'Ritenuta (€)', 'Totale Lordo (€)'];
  
  const rows = spese770.map(t => [
    t.date,
    t.provider || '',
    t.providerFiscalCode || '',
    t.tributoCode || '',
    (t.netAmount || 0).toFixed(2).replace('.', ','),
    (t.ritenuta || 0).toFixed(2).replace('.', ','),
    t.amount.toFixed(2).replace('.', ',')
  ]);

  const csvRows = [
    [`RIEPILOGO RITENUTE D'ACCONTO (MOD. 770) - ${condoName}`],
    [`Anno: ${year}`],
    [],
    headers,
    ...rows
  ];

  downloadCSV(csvRows, `770_${condoName}_${year}.csv`);
};

// Funzione di supporto per scaricare il file
const downloadCSV = (rows: any[][], fileName: string) => {
  const csvContent = rows.map(row => row.join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName.replace(/\s+/g, '_'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = () => {
  window.print();
};