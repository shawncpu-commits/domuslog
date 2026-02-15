
import React from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Category } from '../types';
import { ArrowLeft, Scale, Info, Check, ShieldCheck, ShieldAlert, Sparkles, Layers } from 'lucide-react';

interface AdjustmentQuotasProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  onBack: () => void;
}

export const AdjustmentQuotas: React.FC<AdjustmentQuotasProps> = ({ categories, onCategoriesChange, onBack }) => {
  const toggleCategory = (catId: string) => {
    const updated = categories.map(c => 
      c.id === catId ? { ...c, isAdjustmentCategory: !c.isAdjustmentCategory } : c
    );
    onCategoriesChange(updated);
  };

  const adjustmentCount = categories.filter(c => c.isAdjustmentCategory).length;

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
        <ArrowLeft size={18} />
        <span>TORNA ALLA DASHBOARD</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Quota Conguaglio</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">MAPPATURA CATEGORIE PER BILANCIO EXTRA</p>
        </div>
        <div className="bg-indigo-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <Layers size={20} className="text-indigo-400" />
            <span className="font-black text-[10px] uppercase tracking-widest">{adjustmentCount} CATEGORIE SELEZIONATE</span>
        </div>
      </div>

      <MaterialCard className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 p-6 flex gap-6">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-indigo-600 shadow-sm h-fit shrink-0">
          <Sparkles size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Configurazione Conguaglio</h4>
          <p className="text-[10px] font-bold text-slate-500 dark:text-indigo-200/60 leading-relaxed uppercase">
            Seleziona le categorie che devono essere incluse nel calcolo del conguaglio annuale. Le spese registrate in queste categorie verranno processate per determinare il debito residuo di ogni unità al di fuori delle rate ordinarie già versate.
          </p>
        </div>
      </MaterialCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <MaterialCard 
            key={cat.id} 
            onClick={() => toggleCategory(cat.id)}
            className={`cursor-pointer group transition-all duration-300 border-2 ${
                cat.isAdjustmentCategory 
                ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-lg' 
                : 'border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: cat.isAdjustmentCategory ? cat.color : '#94a3b8' }}
                >
                   {cat.isAdjustmentCategory ? <Check size={24} /> : <Layers size={20} />}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-tight">{cat.name}</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {cat.isAdjustmentCategory ? 'COPERTA DA CONGUAGLIO' : 'NON INCLUSA'}
                  </p>
                </div>
              </div>
              
              {cat.isAdjustmentCategory && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center animate-in zoom-in">
                  <Check size={14} />
                </div>
              )}
            </div>
          </MaterialCard>
        ))}
      </div>
    </div>
  );
};
