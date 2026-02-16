
import React from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { TrashItem, Transaction, Unit } from '../types';
import { ArrowLeft, RotateCcw, Trash2, ShoppingCart, Banknote, Users, Calendar, Info, Clock } from 'lucide-react';

interface TrashProps {
  trash: TrashItem[];
  onTrashChange: (trash: TrashItem[]) => void;
  transactions: Transaction[];
  onTransactionsChange: (tx: Transaction[]) => void;
  units: Unit[];
  onUnitsChange: (units: Unit[]) => void;
  onBack: () => void;
}

export const Trash: React.FC<TrashProps> = ({ 
  trash, onTrashChange, transactions, onTransactionsChange, units, onUnitsChange, onBack 
}) => {
  
  const handleRestore = (item: TrashItem) => {
    if (confirm(`Ripristinare questo elemento di tipo ${item.type}?`)) {
      if (item.type === 'EXPENSE' || item.type === 'INCOME') {
        onTransactionsChange([item.data, ...transactions]);
      } else if (item.type === 'UNIT') {
        onUnitsChange([item.data, ...units]);
      }
      onTrashChange(trash.filter(t => t.id !== item.id));
    }
  };

  const handlePermanentDelete = (id: string) => {
    if (confirm("Eliminare definitivamente? Questa azione non può essere annullata.")) {
      onTrashChange(trash.filter(t => t.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EXPENSE': return <ShoppingCart size={18} className="text-rose-500" />;
      case 'INCOME': return <Banknote size={18} className="text-emerald-500" />;
      case 'UNIT': return <Users size={18} className="text-indigo-500" />;
      default: return <Info size={18} />;
    }
  };

  const getLabel = (item: TrashItem) => {
    if (item.type === 'UNIT') return item.data.name;
    return item.data.description || 'Senza descrizione';
  };

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-8 uppercase text-[10px] tracking-widest transition-all hover:translate-x-[-4px]">
        <ArrowLeft size={18} /><span>Indietro</span>
      </button>

      <div className="flex justify-between items-end mb-10 px-1">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">Cestino</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Recupero e Manutenzione Dati Eliminati</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl">
           <span className="text-[10px] font-black text-slate-500 uppercase">{trash.length} ELEMENTI</span>
        </div>
      </div>

      {trash.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800">
           <Trash2 size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
           <p className="text-xs font-black text-slate-400 uppercase">Il cestino è vuoto</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trash.map((item) => (
            <div key={item.id} className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-50 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
               <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                     {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                     <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-tight truncate">{getLabel(item)}</h4>
                     <div className="flex items-center gap-3 mt-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{item.type}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock size={10}/> {new Date(item.deletedAt).toLocaleString('it-IT')}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => handleRestore(item)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl font-black uppercase text-[9px] hover:bg-emerald-100 transition-all"
                  >
                    <RotateCcw size={14}/> Ripristina
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(item.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl font-black uppercase text-[9px] hover:bg-rose-100 transition-all"
                  >
                    <Trash2 size={14}/> Elimina Definitivamente
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      <MaterialCard className="mt-12 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800 p-8 flex gap-6">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-[24px] text-indigo-600 shadow-sm h-fit">
          <Info size={28} />
        </div>
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white uppercase mb-2">Sicurezza dei Dati</h4>
          <p className="text-[10px] text-slate-600 dark:text-indigo-300/70 font-bold leading-relaxed uppercase tracking-tight">
            Gli elementi in questa lista sono stati rimossi dai registri attivi. Il ripristino riporterà l'elemento nella sua posizione originale (Spese, Incassi o Unità). Nota: eliminando permanentemente un'Unità, i riferimenti a quell'unità nelle spese esistenti potrebbero risultare orfani.
          </p>
        </div>
      </MaterialCard>
    </div>
  );
};
