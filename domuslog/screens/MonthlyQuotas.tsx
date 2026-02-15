
import React from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Category } from '../types';
import { ArrowLeft, Calculator, Info, Check, ShieldCheck, ShieldAlert } from 'lucide-react';

interface MonthlyQuotasProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  onBack: () => void;
}

export const MonthlyQuotas: React.FC<MonthlyQuotasProps> = ({ categories, onCategoriesChange, onBack }) => {
  const toggleCategory = (catId: string) => {
    const updated = categories.map(c => 
      c.id === catId ? { ...c, isIncludedInMonthlyQuota: !c.isIncludedInMonthlyQuota } : c
    );
    onCategoriesChange(updated);
  };

  const includedCount = categories.filter(c => c.isIncludedInMonthlyQuota).length;

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
        <ArrowLeft size={18} />
        <span>TORNA ALLA DASHBOARD</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Configurazione Quote</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">DEFINISCI IL PERIMETRO DELLA QUOTA ORDINARIA</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <Calculator size={20} />
            <span className="font-black text-[10px] uppercase tracking-widest">{includedCount} CATEGORIE COPERTE</span>
        </div>
      </div>

      <MaterialCard className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 p-6 flex gap-6">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-indigo-600 shadow-sm h-fit shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Come funziona la mappatura</h4>
          <p className="text-[10px] font-bold text-slate-500 dark:text-indigo-200/60 leading-relaxed uppercase">
            Le categorie selezionate verranno considerate come "Ordinarie". Il sistema utilizzerà questa informazione per calcolare la sostenibilità della rata mensile e per avvisarti se il gettito delle quote copre effettivamente le spese correnti (luce, acqua, pulizie, amministrazione).
          </p>
        </div>
      </MaterialCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <MaterialCard 
            key={cat.id} 
            onClick={() => toggleCategory(cat.id)}
            className={`cursor-pointer group transition-all duration-300 border-2 ${
                cat.isIncludedInMonthlyQuota 
                ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20' 
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grayscale-[0.6] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                   {cat.isIncludedInMonthlyQuota ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-tight">{cat.name}</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {cat.isIncludedInMonthlyQuota ? 'INCLUSA NELLA RATA' : 'SPESA EXTRA / CONGUAGLIO'}
                  </p>
                </div>
              </div>
              
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                cat.isIncludedInMonthlyQuota ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 dark:bg-slate-800 text-transparent'
              }`}>
                <Check size={14} />
              </div>
            </div>
          </MaterialCard>
        ))}
      </div>
    </div>
  );
};
