
import React, { useState, useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, 
  CalendarDays, ShoppingCart, Banknote, 
  Clock, Info, ArrowUpRight, ArrowDownLeft,
  X, Tag, User, ReceiptText
} from 'lucide-react';
import { Transaction, Category, AppView } from '../types';

interface CalendarViewProps {
  onBack: () => void;
  transactions: Transaction[];
  categories: Category[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onBack, transactions, categories }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(currentDate);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust for Italian week (Monday start)
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: offset }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const setToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  const getTransactionsForDay = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return transactions.filter(t => t.date === dateStr);
  };

  const selectedDayTransactions = useMemo(() => {
    if (selectedDay === null) return [];
    return getTransactionsForDay(selectedDay);
  }, [selectedDay, month, year, transactions]);

  const stats = useMemo(() => {
    const monthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const monthTxs = transactions.filter(t => t.date.startsWith(monthPrefix));
    const exp = monthTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const inc = monthTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    return { exp, inc };
  }, [month, year, transactions]);

  return (
    <div className="pb-32 animate-in fade-in duration-500 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 uppercase text-[10px] tracking-widest">
        <ArrowLeft size={18} /> <span>Torna Indietro</span>
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">Calendario</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Scadenze e Flussi Finanziari</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto bg-white dark:bg-slate-900 p-1.5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm">
           <button onClick={prevMonth} className="p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft size={20}/></button>
           <button onClick={setToday} className="px-6 py-3 font-black text-[10px] uppercase text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">Oggi</button>
           <button onClick={nextMonth} className="p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CALENDAR GRID */}
        <div className="lg:col-span-8">
          <MaterialCard className="p-0 border-none overflow-hidden shadow-sm bg-white dark:bg-slate-900 rounded-[32px]">
            <div className="p-6 sm:p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{monthName} {year}</h2>
              <div className="flex gap-4">
                 <div className="text-right">
                    <p className="text-[7px] font-black opacity-50 uppercase tracking-widest">Uscite</p>
                    <p className="text-xs font-black text-rose-400">€ {stats.exp.toLocaleString('it-IT')}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[7px] font-black opacity-50 uppercase tracking-widest">Entrate</p>
                    <p className="text-xs font-black text-emerald-400">€ {stats.inc.toLocaleString('it-IT')}</p>
                 </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-7 mb-4">
                {['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'].map(d => (
                  <div key={d} className="text-center text-[9px] font-black text-slate-400 py-2 uppercase tracking-widest">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {blanks.map(b => <div key={`b-${b}`} className="aspect-square opacity-0" />)}
                {days.map(d => {
                  const dayTxs = getTransactionsForDay(d);
                  const hasExpenses = dayTxs.some(t => t.type === 'EXPENSE');
                  const hasIncome = dayTxs.some(t => t.type === 'INCOME');
                  const isSelected = selectedDay === d;
                  const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;

                  return (
                    <button 
                      key={d} 
                      onClick={() => setSelectedDay(d)}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl transition-all border-2
                        ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-105 z-10' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-900 dark:text-slate-100'}
                        ${isToday && !isSelected ? 'border-indigo-200 dark:border-indigo-800' : ''}
                      `}
                    >
                      <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : ''}`}>
                        {d}
                      </span>
                      
                      <div className="flex gap-1 mt-1">
                        {hasExpenses && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />}
                        {hasIncome && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                      </div>
                      
                      {isToday && !isSelected && (
                         <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 justify-center">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spese</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Incassi</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data Odierna</span>
               </div>
            </div>
          </MaterialCard>
        </div>

        {/* DAY DETAILS */}
        <div className="lg:col-span-4 space-y-6">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={16}/> Movimenti del {selectedDay || '--'} {monthName}
              </h3>
              <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full uppercase">
                 {selectedDayTransactions.length} Eventi
              </span>
           </div>

           <div className="space-y-3">
              {selectedDayTransactions.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                   <Info size={32} className="mx-auto text-slate-200 mb-3" />
                   <p className="text-[10px] font-black text-slate-300 uppercase">Nessuna attività registrata</p>
                </div>
              ) : (
                selectedDayTransactions.map(tx => (
                  <div key={tx.id} className="p-5 bg-white dark:bg-slate-900 rounded-[28px] border-2 border-slate-50 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-2">
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {tx.type === 'INCOME' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                           </div>
                           <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate">{tx.description}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{tx.category}</p>
                           </div>
                        </div>
                        <p className={`text-xs font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                           € {tx.amount.toLocaleString('it-IT')}
                        </p>
                     </div>
                     
                     <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-slate-300" />
                              <span className="text-[8px] font-black text-slate-400 uppercase">{tx.unit || 'CONDOMINIO'}</span>
                           </div>
                           {tx.provider && (
                             <div className="flex items-center gap-1.5">
                                <User size={12} className="text-slate-300" />
                                <span className="text-[8px] font-black text-slate-400 uppercase truncate max-w-[80px]">{tx.provider}</span>
                             </div>
                           )}
                        </div>
                        {tx.paymentStatus && (
                          <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${tx.paymentStatus === 'PAGATO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                             {tx.paymentStatus.replace('_', ' ')}
                          </span>
                        )}
                     </div>
                  </div>
                ))
              )}
           </div>
           
           {selectedDayTransactions.length > 0 && (
             <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] border border-indigo-100 dark:border-indigo-800">
                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ReceiptText size={14}/> Riepilogo Giornata</h4>
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                      <span>Totale Entrate</span>
                      <span className="text-emerald-600">+ € {selectedDayTransactions.filter(t => t.type === 'INCOME').reduce((s,t) => s+t.amount, 0).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase">
                      <span>Totale Uscite</span>
                      <span className="text-rose-600">- € {selectedDayTransactions.filter(t => t.type === 'EXPENSE').reduce((s,t) => s+t.amount, 0).toFixed(2)}</span>
                   </div>
                   <div className="pt-2 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase">
                      <span>Saldo Giornaliero</span>
                      <span>€ {(selectedDayTransactions.filter(t => t.type === 'INCOME').reduce((s,t) => s+t.amount, 0) - selectedDayTransactions.filter(t => t.type === 'EXPENSE').reduce((s,t) => s+t.amount, 0)).toFixed(2)}</span>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
