
import { Transaction, Unit, MillesimalTable, Category, WaterReading, WaterMeter, TableSplit } from '../types';

export interface UnitCalculationResult {
  addebito_millesimale: number;
  addebito_acqua: number;
  scompenso_aqp: number;
  saldo_precedente_proprietario: number;
  saldo_precedente_inquilino: number;
  totale_dovuto_gestione: number;
  totale_da_pagare: number;
  riparto_proprietario: number; 
  riparto_inquilino: number;    
  spese_totali_proprietario: number;
  spese_totali_inquilino: number;
  versamenti_totali_proprietario: number;
  versamenti_totali_inquilino: number;
}

/**
 * Normalizza una stringa per il confronto: rimuove accenti, spazi extra e rende minuscolo
 */
export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * Determina se una categoria (oggetto o nome) è contenuta in una tabella millesimale
 */
export const isCategoryInTable = (table: MillesimalTable, catObj: Category | undefined, txCatName: string): boolean => {
  if (!table.categoryIds || !table.isActive) return false;
  
  const searchName = normalizeString(txCatName || '');
  const searchId = catObj?.id;

  return table.categoryIds.some(cid => {
    // 1. Confronto per ID esatto (Metodo preferito)
    if (searchId && cid === searchId) return true;
    
    // 2. Confronto per Nome normalizzato (Fallback per AI o inserimento manuale testuale)
    return normalizeString(cid) === searchName;
  });
};

/**
 * Calcola la ripartizione di una singola transazione tra le unità.
 * Include la logica temporale basata sulla data di inizio locazione.
 */
export const calculateTransactionSplit = (
  tx: Transaction,
  tables: MillesimalTable[],
  units: Unit[],
  categories: Category[]
): { 
  unitSplits: Record<string, { amount: number, ownerPart: number, tenantPart: number }>,
  involvedTables: string[]
} => {
  const unitSplits: Record<string, { amount: number, ownerPart: number, tenantPart: number }> = {};
  const involvedTables: string[] = [];
  
  units.forEach(u => unitSplits[u.id] = { amount: 0, ownerPart: 0, tenantPart: 0 });

  if (tx.type !== 'EXPENSE') return { unitSplits, involvedTables };

  // 1. ADDEBITO DIRETTO
  if (tx.unit && tx.unit !== 'CONDOMINIO') {
    const targetUnit = units.find(u => 
      normalizeString(u.name) === normalizeString(tx.unit!) || 
      u.id === tx.unit
    );
    if (targetUnit) {
      // Nota: anche negli addebiti diretti, se c'è un inquilino, solitamente paga lui se la data è corretta
      // ma per prudenza gli addebiti diretti (es. solleciti) vanno spesso al proprietario
      unitSplits[targetUnit.id] = { amount: tx.amount, ownerPart: tx.amount, tenantPart: 0 };
    }
    return { unitSplits, involvedTables: ['ADDEBITO DIRETTO'] };
  }

  // 2. IDENTIFICAZIONE CATEGORIA
  const txCatName = tx.category || '';
  const catObj = categories.find(c => 
    normalizeString(c.name) === normalizeString(txCatName) || 
    c.id === tx.category
  );
  
  if (catObj?.isExcluded) return { unitSplits, involvedTables };

  // 3. DETERMINAZIONE TABELLE
  let targetSplits: TableSplit[] = [];
  
  if (tx.splits && tx.splits.length > 0) {
    targetSplits = tx.splits;
  } else {
    const matchingTables = tables.filter(tab => isCategoryInTable(tab, catObj, txCatName));
    if (matchingTables.length > 0) {
      const weight = 100 / matchingTables.length;
      targetSplits = matchingTables.map(t => ({ tableId: t.id, percentage: weight }));
    }
  }

  // 4. CALCOLO QUOTE PRO-QUOTA CON FILTRO TEMPORALE LOCAZIONE
  targetSplits.forEach(split => {
    const tabella = tables.find(t => t.id === split.tableId);
    if (!tabella || !tabella.unitValues) return;

    if (!involvedTables.includes(tabella.name)) involvedTables.push(tabella.name);
    
    const importoQuotaTabella = (tx.amount * Number(split.percentage || 0)) / 100;
    const millesimiTotaliTabella = tabella.unitValues.reduce((sum, uv) => 
      (uv.isExcluded || Number(uv.value || 0) <= 0) ? sum : sum + Number(uv.value || 0), 0);
    
    if (millesimiTotaliTabella <= 0) return;

    tabella.unitValues.forEach(uv => {
      if (uv.isExcluded || Number(uv.value || 0) <= 0) return;

      const unitRef = units.find(u => u.id === uv.unitId);
      if (!unitRef) return;

      const quotaEuroUnita = (importoQuotaTabella * Number(uv.value)) / millesimiTotaliTabella;
      
      // LOGICA DATA LOCAZIONE:
      // Se la spesa è avvenuta PRIMA dell'inizio della locazione, l'inquilino non paga nulla.
      const isBeforeLease = unitRef.leaseStartDate && tx.date < unitRef.leaseStartDate;
      
      let quotaInquilino = 0;
      let quotaProprietario = quotaEuroUnita;

      if (!isBeforeLease) {
        const distConfig = unitRef.categoryDistributions?.find(d => 
          (catObj && d.categoryId === catObj.id) || 
          normalizeString(d.categoryId) === normalizeString(txCatName)
        );
        
        const percInquilino = Number(distConfig?.tenantPercentage || 0);
        quotaInquilino = (quotaEuroUnita * percInquilino) / 100;
        quotaProprietario = quotaEuroUnita - quotaInquilino;
      }

      if (unitSplits[uv.unitId]) {
        unitSplits[uv.unitId].amount += quotaEuroUnita;
        unitSplits[uv.unitId].ownerPart += quotaProprietario;
        unitSplits[uv.unitId].tenantPart += quotaInquilino;
      }
    });
  });

  return { unitSplits, involvedTables };
};

export const generateCondoDistribution = (
  transactions: Transaction[],
  categories: Category[],
  units: Unit[],
  millesimalTables: MillesimalTable[],
  waterReadings: WaterReading[] = [],
  waterMeters: WaterMeter[] = []
): Record<string, UnitCalculationResult> => {
  const risultato_finale: Record<string, UnitCalculationResult> = {};
  units.forEach(u => {
    risultato_finale[u.id] = {
      addebito_millesimale: 0, addebito_acqua: 0, scompenso_aqp: 0,
      saldo_precedente_proprietario: Number(u.ownerPreviousBalance || 0),
      saldo_precedente_inquilino: Number(u.tenantPreviousBalance || 0),
      totale_dovuto_gestione: 0, totale_da_pagare: 0, riparto_proprietario: 0, riparto_inquilino: 0,
      spese_totali_proprietario: 0, spese_totali_inquilino: 0,
      versamenti_totali_proprietario: 0, versamenti_totali_inquilino: 0
    };
  });

  const fattureAqp = transactions.filter(t => t.type === 'EXPENSE' && normalizeString(t.category) === 'acqua');
  const totaleFatturatoAqp = fattureAqp.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const hasWaterMeters = waterMeters.some(m => m.unitId !== 'GENERAL');

  if (hasWaterMeters) {
    const consumiPerUnita: Record<string, number> = {}; 
    const addebitiLetturePerUnita: Record<string, number> = {}; 

    units.forEach(u => {
      const unitMeters = waterMeters.filter(m => m.unitId === u.id);
      let unitMc = 0; let unitEuroLetture = 0;
      unitMeters.forEach(m => {
        const mReadings = waterReadings.filter(r => r.meterId === m.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (mReadings.length > 0) {
          unitMc += Math.max(0, Number(mReadings[0].value || 0) - Number(m.baseline || 0));
          mReadings.forEach(ra => unitEuroLetture += (Number(ra.consumptionAmount || 0) + Number(ra.dischargeAmount || 0) + Number(ra.fixedAmount || 0)));
        }
      });
      consumiPerUnita[u.id] = unitMc;
      addebitiLetturePerUnita[u.id] = unitEuroLetture;
      
      // Per l'acqua, applichiamo la stessa logica: se la lettura o la fattura è prima della locazione, paga il proprietario
      // In questo caso, le letture sono solitamente di competenza dell'inquilino se vive lì.
      // Assumiamo che l'acqua sia sempre a carico dell'inquilino se presente.
      risultato_finale[u.id].addebito_acqua = unitEuroLetture;
      risultato_finale[u.id].spese_totali_inquilino += unitEuroLetture;
    });

    const totaleAddebitatoLetture = Object.values(addebitiLetturePerUnita).reduce((s, v) => s + v, 0);
    const scompensoTotale = totaleFatturatoAqp - totaleAddebitatoLetture;
    const totaleMcCondominio = Object.values(consumiPerUnita).reduce((s, v) => s + v, 0);
    
    if (scompensoTotale > 0 && totaleMcCondominio > 0) {
      units.forEach(u => {
        const quotaScompenso = (scompensoTotale * (consumiPerUnita[u.id] || 0)) / totaleMcCondominio;
        risultato_finale[u.id].scompenso_aqp = Number(quotaScompenso.toFixed(2));
        risultato_finale[u.id].addebito_acqua += Number(quotaScompenso.toFixed(2));
        risultato_finale[u.id].spese_totali_inquilino += Number(quotaScompenso.toFixed(2));
      });
    }
  }

  transactions.filter(t => t.type === 'EXPENSE').forEach(spesa => {
    if (normalizeString(spesa.category) === 'acqua' && hasWaterMeters) return;
    const { unitSplits } = calculateTransactionSplit(spesa, millesimalTables, units, categories);
    Object.entries(unitSplits).forEach(([uid, split]) => {
      if (!risultato_finale[uid]) return;
      risultato_finale[uid].addebito_millesimale += split.amount;
      risultato_finale[uid].spese_totali_proprietario += split.ownerPart;
      risultato_finale[uid].spese_totali_inquilino += split.tenantPart;
    });
  });

  transactions.filter(t => t.type === 'INCOME').forEach(inc => {
    const unitRef = units.find(u => normalizeString(u.name) === normalizeString(inc.unit || '') || u.id === inc.unit);
    if (!unitRef) return;
    const res = risultato_finale[unitRef.id];
    if (!res) return;
    if (inc.payerType === 'INQUILINO') res.versamenti_totali_inquilino += Number(inc.amount || 0);
    else res.versamenti_totali_proprietario += Number(inc.amount || 0);
  });

  Object.keys(risultato_finale).forEach(uid => {
    const res = risultato_finale[uid];
    res.totale_dovuto_gestione = res.addebito_millesimale + res.addebito_acqua;
    res.riparto_proprietario = Number((res.spese_totali_proprietario - res.versamenti_totali_proprietario + res.saldo_precedente_proprietario).toFixed(2));
    res.riparto_inquilino = Number((res.spese_totali_inquilino - res.versamenti_totali_inquilino + res.saldo_precedente_inquilino).toFixed(2));
    res.addebito_millesimale = Number(res.addebito_millesimale.toFixed(2));
    res.addebito_acqua = Number(res.addebito_acqua.toFixed(2));
    res.totale_da_pagare = Number((res.riparto_proprietario + res.riparto_inquilino).toFixed(2));
  });

  return risultato_finale;
};
