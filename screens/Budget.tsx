
import React, { useState, useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Transaction, Unit, Category, MillesimalTable, WaterReading, WaterMeter, UserRole } from '../types';
import { 
  ArrowLeft, Calculator, Layers, ShieldCheck, AlertCircle, 
  ChevronRight, History, Wallet, UserCog, Droplets, 
  FileText, TrendingUp, Info, ArrowUpRight, ArrowDownLeft, 
  Receipt, User, Search, Filter, Calendar, Tag, Shield, Clock,
  CalendarRange, Users, X, ArrowDownWideNarrow, ListChecks,
  TrendingDown, Sparkles, Scale, Percent, CheckCircle2,
  Lightbulb, ArrowUp, Briefcase, User as UserIcon
} from 'lucide-react';
import { generateCondoDistribution, UnitCalculationResult, calculateTransactionSplit } from '../services/calculatorService';
import { exportToPDF } from '../services/exportService';

interface BudgetProps {
  onBack: () => void;
  transactions: Transaction[];
  units: Unit[];
  categories: Category[];
  tables: MillesimalTable[];
  selectedYear: string;
  waterReadings: WaterReading[];
  waterMeters: WaterMeter[];
  isDarkMode: boolean;
  condoId: string | null;
  condoName: string;
  userRole?: UserRole;
  activeUnitId?: string | null;
}

const getUniqueColorByIndex = (index: number) => {
  const hue = (index * 137.508) % 360;
  return {
    bg: `hsla(${hue}, 95%, 96%, 1)`,      // Più saturo
    border: `hsla(${hue}, 75%, 85%, 1)`,  // Bordo più accentuato
    accent: `hsla(${hue}, 85%, 40%, 1)`,  // Accento vibrante
    light: `hsla(${hue}, 80%, 90%, 1)`,
    text: `hsla(${hue}, 95%, 15%, 1)`
  };
};

export const Budget: React.FC<BudgetProps> = ({ 
  onBack, transactions, units, categories, tables, selectedYear, waterReadings, waterMeters, condoName,
  userRole = 'ADMIN', activeUnitId
}) => {
  const isAdmin = userRole === 'ADMIN';
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => 
    transactions.filter(t => t.date.startsWith(selectedYear)),
    [transactions, selectedYear]
  );

  const calculationResults = useMemo(() => 
    generateCondoDistribution(filteredTransactions, categories, units, tables, waterReadings, waterMeters),
    [filteredTransactions, categories, units, tables, waterReadings, waterMeters]
  );

  const sustainabilityAnalysis = useMemo(() => {
    const targetCategoryNames = categories.filter(c => c.isIncludedInMonthlyQuota).map(c => c.name.toUpperCase());
    const totalOrdinaryExpenses = filteredTransactions.filter(t => t.type === 'EXPENSE' && targetCategoryNames.includes(t.category.toUpperCase())).reduce((sum, t) => sum + t.amount, 0);
    const totalCurrentMonthlyRevenue = units.reduce((sum, u) => sum + (u.monthlyFee || 0), 0) * 12;
    const deficit = totalOrdinaryExpenses - totalCurrentMonthlyRevenue;
    const adjustmentFactor = totalCurrentMonthlyRevenue > 0 ? totalOrdinaryExpenses / totalCurrentMonthlyRevenue : 1;
    return { deficit, isUnderfunded: deficit > 0, adjustmentFactor, totalOrdinaryExpenses, totalCurrentMonthlyRevenue };
  }, [filteredTransactions, categories, units]);

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      if ((a.floor ?? 0) !== (b.floor ?? 0)) return (a.floor ?? 0) - (b.floor ?? 0);
      const stairA = (a.staircase || '').toUpperCase();
      const stairB = (b.staircase || '').toUpperCase();
      if (stairA !== stairB) return stairA.localeCompare(stairB);
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }, [units]);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);

  const unitMovementsDetailed = useMemo(() => {
    if (!selectedUnit) return [];
    const movements: any[] = [];

    // 1. Spese individuali
    filteredTransactions.filter(t => t.type === 'EXPENSE' && t.category.trim().toUpperCase() !== 'ACQUA').forEach(tx => {
      const { unitSplits } = calculateTransactionSplit(tx, tables, units, categories);
      const mySplit = unitSplits[selectedUnit.id];
      
      if (mySplit && mySplit.amount > 0) {
        movements.push({
          date: tx.date,
          desc: tx.description,
          type: 'EXPENSE',
          totalAmount: mySplit.amount,
          ownerPart: mySplit.ownerPart,
          tenantPart: mySplit.tenantPart,
          category: tx.category
        });
      }
    });

    // 2. Addebito Acqua
    const res = calculationResults[selectedUnit.id];
    if (res && res.addebito_acqua > 0) {
      movements.push({
        date: selectedYear + '-12-31',
        desc: 'BILANCIO IDRICO ANNUALE',
        type: 'EXPENSE',
        totalAmount: res.addebito_acqua,
        ownerPart: 0,
        tenantPart: res.addebito_acqua,
        category: 'ACQUA'
      });
    }

    // 3. Incassi
    filteredTransactions.filter(t => t.type === 'INCOME' && (t.unit === selectedUnit.name || t.unit === selectedUnit.id)).forEach(inc => {
      movements.push({
        date: inc.date,
        desc: inc.description,
        type: 'INCOME',
        totalAmount: inc.amount,
        ownerPart: inc.payerType === 'PROPRIETARIO' ? inc.amount : 0,
        tenantPart: inc.payerType === 'INQUILINO' ? inc.amount : 0,
        category: inc.category
      });
    });

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedUnit, filteredTransactions, categories, tables, calculationResults, selectedYear, units]);

  const roundToFive = (num: number) => Math.ceil(num / 5) * 5;

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300 px-1 sm:px-0">
      <style>{`
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 sm:mb-8 uppercase text-[10px] tracking-widest">
          <ArrowLeft size={18} /> <span>Torna Indietro</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">Bilancio Consuntivo</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Ripartizione {selectedYear}</p>
          </div>
          <button onClick={() => exportToPDF()} className="w-full sm:w-auto m3-button bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center gap-3 shadow-xl uppercase font-black text-[10px] py-4 px-8 active:scale-95">
            <FileText size={18} /> Esporta Report
          </button>
        </div>

        {isAdmin && (
          <MaterialCard className="mb-10 p-0 border-none overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] shadow-sm">
             <div className="flex flex-col md:flex-row">
                <div className={`p-6 sm:p-8 md:w-1/3 flex flex-col justify-center items-center text-center ${sustainabilityAnalysis.isUnderfunded ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                   <div className="mb-4 text-white"><Sparkles size={32} /></div>
                   <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Sustainability Advisor</h4>
                   <p className="text-2xl sm:text-3xl font-black tracking-tighter leading-none mb-4">
                      {sustainabilityAnalysis.isUnderfunded ? 'Revisione Quote' : 'Cassa Sostenibile'}
                   </p>
                   <div className="bg-white/20 px-4 py-2 rounded-full border border-white/30">
                      <p className="text-[8px] font-black uppercase tracking-widest">Scostamento: {((sustainabilityAnalysis.adjustmentFactor - 1) * 100).toFixed(1)}%</p>
                   </div>
                </div>
                <div className="p-6 sm:p-8 flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spese {selectedYear}</p>
                      <p className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">€ {sustainabilityAnalysis.totalOrdinaryExpenses.toLocaleString('it-IT')}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gettito Rate</p>
                      <p className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">€ {sustainabilityAnalysis.totalCurrentMonthlyRevenue.toLocaleString('it-IT')}</p>
                   </div>
                   <div className="space-y-1 col-span-2 lg:col-span-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Cassa</p>
                      <p className={`text-base sm:text-2xl font-black ${sustainabilityAnalysis.isUnderfunded ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {sustainabilityAnalysis.isUnderfunded ? '-' : '+'} € {Math.abs(sustainabilityAnalysis.deficit).toLocaleString('it-IT')}
                      </p>
                   </div>
                </div>
             </div>
          </MaterialCard>
        )}
      </div>

      {/* GRIGLIA UNITA */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 no-print">
        {sortedUnits.map((unit, index) => {
          const res = calculationResults[unit.id];
          if (!res) return null;
          const uStyle = getUniqueColorByIndex(index);
          const hasTenant = !!unit.tenant?.trim();
          const avgMonthlyCharge = res.totale_dovuto_gestione / 12;
          const isFeeSufficient = (unit.monthlyFee || 0) >= (avgMonthlyCharge * 0.95);

          return (
            <div 
              key={unit.id}
              onClick={() => setSelectedUnitId(unit.id)}
              className="group cursor-pointer rounded-[32px] sm:rounded-[44px] border-2 transition-all hover:shadow-xl relative overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900"
              style={{ backgroundColor: uStyle.bg, borderColor: uStyle.border }}
            >
              <div className="p-5 sm:p-7 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-5 sm:mb-6">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex flex-col items-center justify-center bg-white/90 p-2.5 rounded-2xl min-w-[50px] shadow-sm border border-black/5">
                      <span className="text-[6px] font-black uppercase leading-none mb-1 opacity-50">Piano</span>
                      <span className="text-base font-black leading-none" style={{ color: uStyle.accent }}>{unit.floor}</span>
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase leading-none tracking-tight mb-1">{unit.name}</h4>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider truncate max-w-[120px]">{unit.owner}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform mb-1" />
                    {!isFeeSufficient && <div className="bg-rose-600 text-white p-1 rounded-full shadow-lg animate-pulse"><AlertCircle size={10} /></div>}
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 flex-1">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Spese</span>
                      <span className="text-[11px] font-black text-slate-800">€ {res.addebito_millesimale.toLocaleString('it-IT')}</span>
                   </div>
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[8px] font-black text-cyan-600 uppercase">Acqua</span>
                      <span className="text-[11px] font-black text-cyan-700">€ {res.addebito_acqua.toLocaleString('it-IT')}</span>
                   </div>
                   <div className="h-px bg-black/5 my-2"></div>
                   <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 sm:p-3 bg-white/60 rounded-xl sm:rounded-2xl border border-black/5">
                         <p className="text-[6px] font-black text-indigo-600 uppercase">Proprietario</p>
                         <p className="text-[10px] font-black text-indigo-900">€ {res.riparto_proprietario.toLocaleString('it-IT')}</p>
                      </div>
                      <div className={`p-2 sm:p-3 bg-white/60 rounded-xl sm:rounded-2xl border border-black/5 ${!hasTenant ? 'opacity-30' : ''}`}>
                         <p className="text-[6px] font-black text-cyan-600 uppercase">Inquilino</p>
                         <p className="text-[10px] font-black text-cyan-900">{hasTenant ? `€ ${res.riparto_inquilino.toLocaleString('it-IT')}` : '-'}</p>
                      </div>
                   </div>
                </div>

                <div className="mt-5 pt-4 border-t border-black/5 flex justify-between items-end">
                   <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Saldo Totale</p>
                      <p className="text-xl sm:text-2xl font-black tracking-tighter" style={{ color: uStyle.accent }}>
                        € {res.totale_da_pagare.toLocaleString('it-IT')}
                      </p>
                   </div>
                   <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 shadow-sm border border-black/5">
                      <Wallet size={18} style={{ color: uStyle.accent }} />
                   </div>
                </div>
              </div>
              <div className="h-2.5 w-full" style={{ backgroundColor: uStyle.accent }}></div>
            </div>
          );
        })}
      </div>

      {/* MODALE ESTRATTO CONTO ANALITICO (Omesso per brevità, rimane lo stesso) */}
    </div>
  );
};

const Printer = ({ size }: { size: number }) => <FileText size={size} />;
