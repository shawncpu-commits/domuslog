import React, { useState, useMemo, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { 
  ArrowLeft, Plus, Check, X, 
  Calendar, Banknote, Hash, 
  CreditCard, Trash2, PencilLine,
  Filter, RotateCcw, Building2, ListPlus,
  CheckCircle2, UserCog, SaveAll, Tag,
  ChevronRight, PlusCircle, MinusCircle, Search,
  Wallet2, CheckCircle, Shield
} from 'lucide-react';
import { Transaction, Category, PaymentMethod, PayerType, BankAccount, Unit, MillesimalTable, UserRole } from '../types';

interface IncomeProps {
  onBack: () => void;
  categories: Category[];
  transactions: Transaction[];
  onTransactionsChange: (tx: Transaction[]) => void;
  bankAccounts: BankAccount[];
  units: Unit[];
  millesimalTables: MillesimalTable[];
  onToggleDock?: (visible: boolean) => void;
  onSoftDelete?: (type: 'INCOME', item: any) => void;
  userRole?: UserRole;
}

interface MultiIncomeItem {
  receipt: string;
  payer: PayerType;
  entries: { category: string; amount: number }[];
}

const Income: React.FC<IncomeProps> = ({ 
  onBack, categories, transactions, onTransactionsChange, units, onToggleDock, onSoftDelete,
  userRole = 'ADMIN'
}) => {
  const isAdmin = userRole === 'ADMIN';
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingMultiple, setIsAddingMultiple] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ search: '', month: '', year: '', unit: '', payer: '' });

  const [multiDate, setMultiDate] = useState(new Date().toISOString().split('T')[0]);
  const [multiMethod, setMultiMethod] = useState<PaymentMethod>('BONIFICO');
  const [multiFormItems, setMultiFormItems] = useState<Record<string, MultiIncomeItem>>({});

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      if (a.floor !== b.floor) return (a.floor ?? 0) - (b.floor ?? 0);
      const stairA = (a.staircase || '').toUpperCase();
      const stairB = (b.staircase || '').toUpperCase();
      if (stairA !== stairB) return stairA.localeCompare(stairB);
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }, [units]);

  const initialFormData: Partial<Transaction> = {
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: 'Quote',
    description: '',
    payerType: 'PROPRIETARIO',
    unit: '',
    paymentMethod: 'BONIFICO',
    receiptNumber: '',
    items: [{ description: 'Incasso', amount: 0, category: 'Quote' }],
    type: 'INCOME'
  };

  const [formData, setFormData] = useState<Partial<Transaction>>(initialFormData);

  useEffect(() => {
    if (onToggleDock) onToggleDock(!isAdding && !isAddingMultiple);
    return () => onToggleDock?.(true);
  }, [isAdding, isAddingMultiple, onToggleDock]);

  const openMultipleIncome = () => {
    const initialItems: Record<string, MultiIncomeItem> = {};
    sortedUnits.forEach(u => {
      initialItems[u.id] = {
        receipt: '',
        payer: 'PROPRIETARIO',
        entries: [{ category: 'Quote', amount: u.monthlyFee || 0 }]
      };
    });
    setMultiFormItems(initialItems);
    setMultiDate(new Date().toISOString().split('T')[0]);
    setIsAddingMultiple(true);
  };

  const handleSaveMultiple = () => {
    const newTransactions: Transaction[] = [];

    (Object.entries(multiFormItems) as [string, MultiIncomeItem][]).forEach(([unitId, data]) => {
      const totalUnitAmount = data.entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      if (totalUnitAmount > 0) {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
          const categoriesDesc = Array.from(new Set(data.entries.map(e => e.category))).join(' + ');
          
          newTransactions.push({
            id: Math.random().toString(36).substr(2, 9),
            date: multiDate,
            amount: totalUnitAmount,
            category: data.entries[0]?.category || 'Quote',
            description: categoriesDesc || 'Incasso',
            payerType: data.payer,
            unit: unit.name,
            paymentMethod: multiMethod,
            receiptNumber: data.receipt,
            type: 'INCOME',
            paymentStatus: 'PAGATO',
            items: data.entries.map(e => ({ description: `${e.category}`, amount: Number(e.amount), category: e.category }))
          } as Transaction);
        }
      }
    });

    onTransactionsChange([...newTransactions, ...transactions]);
    setIsAddingMultiple(false);
    setMultiFormItems({});
  };

  const handleSaveSingle = () => {
    if (!formData.unit) {
      alert("Seleziona un'unità immobiliare.");
      return;
    }

    const totalAmount = formData.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
    const categoriesInItems = Array.from(new Set(formData.items?.map(i => i.category))).filter(Boolean);
    const finalDesc = categoriesInItems.length > 0 ? categoriesInItems.join(' + ') : 'Incasso';
    
    const txToSave = { 
      ...initialFormData, 
      ...formData, 
      description: finalDesc, 
      amount: totalAmount, 
      id: editingId || Math.random().toString(36).substr(2, 9), 
      type: 'INCOME' as const,
      paymentStatus: 'PAGATO' as const
    } as Transaction;

    const updatedTransactions = editingId 
      ? transactions.map(t => t.id === editingId ? txToSave : t) 
      : [txToSave, ...transactions];

    onTransactionsChange(updatedTransactions);
    setIsAdding(false); 
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleDelete = (inc: Transaction) => {
    if (confirm("Spostare questo incasso nel cestino?")) {
      if (onSoftDelete) onSoftDelete('INCOME', inc);
      onTransactionsChange(transactions.filter(t => t.id !== inc.id));
    }
  };

  const filteredIncomes = useMemo(() => {
    return transactions.filter(t => t.type === 'INCOME').filter(inc => {
      const matchSearch = (inc.description || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                          (inc.unit || '').toLowerCase().includes(filters.search.toLowerCase());
      
      const d = new Date(inc.date);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const y = d.getFullYear().toString();

      return (
        matchSearch &&
        (!filters.month || m === filters.month) &&
        (!filters.year || y === filters.year) &&
        (!filters.unit || inc.unit === filters.unit)
      );
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filters]);

  return (
    <div className="pb-32 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black mb-6 uppercase text-[10px] tracking-widest transition-all hover:translate-x-[-4px]"><ArrowLeft size={18} /><span>Indietro</span></button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Incassi</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Versamento Oneri Condominiali</p>
        </div>
        {isAdmin && (
          <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
            <button onClick={openMultipleIncome} className="m3-button bg-slate-900 text-white flex items-center justify-center gap-2 text-[10px] py-4 shadow-xl">
              <ListPlus size={20} /> LISTA RAPIDA
            </button>
            <button onClick={() => { setFormData(initialFormData); setEditingId(null); setIsAdding(true); }} className="m3-button bg-emerald-600 text-white flex items-center justify-center gap-2 text-[10px] py-4 shadow-xl">
              <Plus size={22} /> NUOVO
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="CERCA PER UNITÀ O CATEGORIA..." 
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-emerald-500 shadow-sm dark:text-white"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-4 rounded-2xl border-2 transition-all ${showFilters ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-400'}`}
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-50 dark:border-slate-800 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
            <select value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-[10px] uppercase outline-none dark:text-white">
              <option value="">Mese</option>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-[10px] uppercase outline-none dark:text-white">
              <option value="">Anno</option>
              {['2023','2024','2025'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.unit} onChange={(e) => setFilters({...filters, unit: e.target.value})} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-black text-[10px] uppercase outline-none dark:text-white">
              <option value="">Unità</option>
              {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <button onClick={() => setFilters({ search: '', month: '', year: '', unit: '', payer: '' })} className="bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl px-4 py-3 font-black text-[10px] uppercase flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredIncomes.map(inc => {
          const unitObj = units.find(u => u.name === inc.unit || u.id === inc.unit);
          const payerName = inc.payerType === 'INQUILINO' 
            ? (unitObj?.tenant || 'INQUILINO NON DEFINITO')
            : (unitObj?.owner || 'PROPRIETARIO NON DEFINITO');

          return (
            <div key={inc.id} className="p-5 sm:p-6 rounded-[36px] border-2 bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between gap-4 group transition-all hover:border-emerald-100 dark:hover:border-emerald-900/30">
               <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
                     <Banknote size={28} />
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-tight truncate">
                          {inc.unit} • <span className="text-emerald-600 dark:text-emerald-400">{payerName}</span>
                        </h4>
                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm border ${
                          inc.payerType === 'INQUILINO' 
                          ? 'bg-cyan-50 border-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-400' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
                        }`}>
                           <UserCog size={10}/>
                           {inc.payerType}
                        </span>
                     </div>
                     
                     <div className="flex flex-wrap gap-2 mb-3">
                        {inc.items?.map((item, idx) => {
                          const catObj = categories.find(c => c.name === item.category);
                          return (
                            <span key={idx} className="text-[7px] font-black px-2.5 py-1 rounded-lg uppercase border flex items-center gap-1.5 shadow-sm" style={{ 
                                backgroundColor: catObj ? `${catObj.color}15` : '#f1f5f9', 
                                borderColor: catObj ? `${catObj.color}30` : '#e2e8f0',
                                color: catObj ? catObj.color : '#64748b'
                            }}>
                              <Tag size={8} /> {item.category || 'Incasso'}: €{item.amount.toLocaleString('it-IT')}
                            </span>
                          );
                        })}
                     </div>

                     <div className="flex flex-wrap gap-3">
                        <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1.5"><Calendar size={10} className="text-emerald-500"/> {new Date(inc.date).toLocaleDateString('it-IT')}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1.5"><CreditCard size={10} className="text-emerald-500"/> {inc.paymentMethod}</span>
                        {inc.receiptNumber && <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1.5"><Hash size={10} className="text-emerald-500"/> REC: {inc.receiptNumber}</span>}
                     </div>
                  </div>
               </div>
               <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-50 dark:border-slate-800 pt-3 sm:pt-0">
                  <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter">€ {inc.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Acquisito</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => { setFormData(inc); setEditingId(inc.id); setIsAdding(true); }} className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm"><PencilLine size={18} /></button>
                      <button onClick={() => handleDelete(inc)} className="p-2.5 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  )}
               </div>
            </div>
          );
        })}
      </div>

      {isAddingMultiple && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-6xl h-[95vh] sm:h-auto sm:max-h-[92vh] sm:rounded-[48px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 shadow-2xl">
             <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl rotate-3"><ListPlus size={24} /></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Lista Rapida</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Inserimento massivo quote</p>
                   </div>
                </div>
                <button onClick={() => setIsAddingMultiple(false)} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={24}/></button>
             </div>
             
             <div className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 shrink-0 shadow-inner">
                <div className="space-y-1.5 flex-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Data Operazione</label>
                   <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                      <input 
                        type="date" 
                        value={multiDate} 
                        onChange={(e) => setMultiDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-5 py-4 font-black text-sm outline-none focus:border-emerald-500 dark:text-white shadow-sm" 
                      />
                   </div>
                </div>
                <div className="space-y-1.5 flex-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-1 tracking-widest">Metodo Pagamento</label>
                   <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                      <select 
                        value={multiMethod}
                        onChange={(e) => setMultiMethod(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-5 py-4 font-black text-sm uppercase outline-none focus:border-emerald-500 dark:text-white shadow-sm"
                      >
                         <option value="BONIFICO">BONIFICO</option>
                         <option value="CONTANTI">CONTANTI</option>
                         <option value="MAV">MAV / BOLLETTINO</option>
                         <option value="ADDEBITO">ADDEBITO DIRETTO</option>
                      </select>
                   </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                {(Object.entries(multiFormItems) as [string, MultiIncomeItem][]).map(([unitId, data]) => {
                  const unit = units.find(u => u.id === unitId);
                  if (!unit) return null;
                  const unitTotal = data.entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                  return (
                    <div key={unit.id} className={`p-6 sm:p-8 rounded-[40px] border-2 transition-all shadow-sm group/unit ${unitTotal > 0 ? 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/30' : 'bg-white/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 dark:border-slate-700 pb-5 mb-5">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center shadow-inner border border-slate-100 dark:border-slate-800 shrink-0">
                               <span className="text-[7px] font-black text-slate-400 uppercase leading-none mb-0.5">Piano</span>
                               <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 leading-none">{unit.floor}</span>
                             </div>
                             <div className="min-w-0">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase leading-none tracking-tight mb-1 truncate">{unit.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{unit.owner}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6 w-full md:w-auto">
                             <div className="flex-1 md:text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TOTALE</p>
                                <p className={`text-xl font-black ${unitTotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300'}`}>€ {unitTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                             </div>
                             {unitTotal > 0 && <div className="text-emerald-500 animate-in zoom-in-50"><CheckCircle size={24}/></div>}
                          </div>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          <div className="lg:col-span-7 space-y-4">
                             {data.entries.map((entry, eIdx) => (
                               <div key={eIdx} className="flex gap-3 items-center">
                                  <div className="flex-[2] relative">
                                     <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                     <select value={entry.category} onChange={(e) => {
                                         const newEntries = [...data.entries];
                                         newEntries[eIdx].category = e.target.value;
                                         setMultiFormItems({...multiFormItems, [unit.id]: {...data, entries: newEntries}});
                                     }} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-10 pr-3 py-3 font-black text-[10px] uppercase outline-none focus:border-indigo-400 dark:text-white transition-all">
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                     </select>
                                  </div>
                                  <div className="flex-1 relative">
                                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600">€</span>
                                     <input type="number" value={entry.amount || ''} onChange={(e) => {
                                         const newEntries = [...data.entries];
                                         newEntries[eIdx].amount = parseFloat(e.target.value) || 0;
                                         setMultiFormItems({...multiFormItems, [unit.id]: {...data, entries: newEntries}});
                                     }} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-8 pr-3 py-3 font-black text-xs text-emerald-600 text-right outline-none focus:border-emerald-500 dark:text-emerald-400 transition-all shadow-inner" placeholder="0.00" />
                                  </div>
                                  <button onClick={() => {
                                      const newEntries = data.entries.filter((_, i) => i !== eIdx);
                                      setMultiFormItems({...multiFormItems, [unit.id]: {...data, entries: newEntries}});
                                  }} className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"><MinusCircle size={20}/></button>
                               </div>
                             ))}
                             <button onClick={() => {
                                const newEntries = [...data.entries, { category: 'Quote', amount: 0 }];
                                setMultiFormItems({...multiFormItems, [unit.id]: {...data, entries: newEntries}});
                             }} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-900/10 text-[9px] font-black text-emerald-600 dark:text-cyan-400 uppercase rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all">
                                <Plus size={14}/> Aggiungi Voce
                             </button>
                          </div>
                          <div className="lg:col-span-5 space-y-4">
                             <div className="space-y-1.5">
                                <div className="flex bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner p-1">
                                   <button onClick={() => setMultiFormItems({...multiFormItems, [unit.id]: {...data, payer: 'PROPRIETARIO'}})} className={`flex-1 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${data.payer === 'PROPRIETARIO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                      <Shield size={12}/> PROPRIETARIO
                                   </button>
                                   <button onClick={() => setMultiFormItems({...multiFormItems, [unit.id]: {...data, payer: 'INQUILINO'}})} className={`flex-1 py-2.5 text-[9px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${data.payer === 'INQUILINO' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                      <UserCog size={12}/> INQUILINO
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <div className="relative">
                                   <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                   <input type="text" value={data.receipt} onChange={(e) => setMultiFormItems({...multiFormItems, [unit.id]: {...data, receipt: e.target.value}})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-11 pr-5 py-3 font-black text-[10px] uppercase outline-none focus:border-indigo-500 dark:text-white shadow-sm" placeholder="RICEVUTA (OPZ.)" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>

             <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row gap-4 shadow-sm">
                <button onClick={() => setIsAddingMultiple(false)} className="order-2 sm:order-1 flex-1 py-5 rounded-[28px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">ANNULLA</button>
                <button onClick={handleSaveMultiple} className="order-1 sm:order-2 flex-[2] py-5 rounded-[28px] bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-emerald-700">
                  <CheckCircle2 size={20}/> CONFERMA E REGISTRA
                </button>
             </div>
          </div>
        </div>
      )}

      {isAdding && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
             <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl"><Plus size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingId ? 'Rettifica Incasso' : 'Registra Incasso'}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acquisizione o modifica oneri</p>
                   </div>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={24}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unità Immobiliare</label>
                      <div className="relative">
                         <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                         <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-5 font-black text-base uppercase outline-none focus:border-emerald-500 dark:text-white shadow-sm appearance-none transition-all">
                            <option value="">Seleziona Unità...</option>
                            {sortedUnits.map(u => <option key={u.id} value={u.name}>{u.name} — {u.owner.toUpperCase()} (P{u.floor})</option>)}
                         </select>
                         <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" size={18} />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Valuta</label>
                      <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                         <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-5 py-5 font-black text-base outline-none focus:border-emerald-500 dark:text-white shadow-inner" />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Metodo Pagamento</label>
                      <div className="relative">
                         <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                         <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-5 py-5 font-black text-base uppercase outline-none focus:border-emerald-500 dark:text-white appearance-none shadow-inner">
                            <option value="BONIFICO">BONIFICO BANCARIO</option>
                            <option value="CONTANTI">CONTANTI</option>
                            <option value="MAV">MAV / BOLLETTINO</option>
                            <option value="ADDEBITO">ADDEBITO DIRETTO</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">Soggetto Versante</label>
                      <div className="flex bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden h-16 p-1 shadow-inner">
                         <button 
                            type="button"
                            onClick={() => setFormData({...formData, payerType: 'PROPRIETARIO'})} 
                            className={`flex-1 flex items-center justify-center gap-3 text-[11px] font-black uppercase transition-all rounded-2xl ${formData.payerType === 'PROPRIETARIO' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                         >
                            <Shield size={20}/> PROPRIETARIO
                         </button>
                         <button 
                            type="button"
                            onClick={() => setFormData({...formData, payerType: 'INQUILINO'})} 
                            className={`flex-1 flex items-center justify-center gap-3 text-[11px] font-black uppercase transition-all rounded-2xl ${formData.payerType === 'INQUILINO' ? 'bg-cyan-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                         >
                            <UserCog size={20}/> INQUILINO
                         </button>
                      </div>
                   </div>
                   
                   <div className="space-y-4 sm:col-span-2">
                      <div className="flex items-center justify-between px-1">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voci di Entrata</label>
                      </div>
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-6 sm:p-8 rounded-[40px] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                         {formData.items?.map((item, idx) => (
                           <div key={idx} className="flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in-95">
                              <div className="flex-[2] relative">
                                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                 <select value={item.category} onChange={(e) => {
                                    const newItems = [...(formData.items || [])];
                                    newItems[idx].category = e.target.value;
                                    setFormData({...formData, items: newItems});
                                 }} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-700 rounded-2xl pl-12 pr-3 py-4 font-black text-[11px] uppercase outline-none focus:border-indigo-500 shadow-sm dark:text-white transition-all">
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                 </select>
                              </div>
                              <div className="flex-1 relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-emerald-600">€</span>
                                 <input type="number" step="0.01" value={item.amount || ''} onChange={(e) => {
                                    const newItems = [...(formData.items || [])];
                                    newItems[idx].amount = parseFloat(e.target.value) || 0;
                                    setFormData({...formData, items: newItems});
                                 }} className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-10 pr-5 py-4 font-black text-base text-emerald-600 dark:text-emerald-400 text-right outline-none focus:border-emerald-500 shadow-sm transition-all" placeholder="0.00" />
                              </div>
                              <button onClick={() => {
                                 const newItems = formData.items?.filter((_, i) => i !== idx);
                                 setFormData({...formData, items: newItems});
                              }} className="p-4 text-rose-300 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-900 rounded-2xl transition-all shadow-sm"><MinusCircle size={22}/></button>
                           </div>
                         ))}
                         <button onClick={() => setFormData({...formData, items: [...(formData.items || []), { description: 'Incasso', amount: 0, category: 'Quote' }]})} className="w-full py-5 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-3xl text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase flex items-center justify-center gap-3 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/10 active:scale-[0.98]">
                            <PlusCircle size={20}/> AGGIUNGI VOCE
                         </button>
                      </div>
                   </div>

                   <div className="p-8 bg-slate-900 dark:bg-emerald-950 rounded-[44px] sm:col-span-2 flex flex-col sm:flex-row justify-between items-center text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10 flex items-center gap-6">
                         <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-emerald-400 shadow-inner"><Wallet2 size={32}/></div>
                         <div>
                            <span className="text-[11px] font-black uppercase opacity-60 tracking-[0.2em] block mb-1">IMPORTO TOTALE</span>
                            <span className="text-4xl font-black tracking-tighter">€ {formData.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                         </div>
                      </div>
                      <div className="absolute right-0 top-0 p-8 opacity-5"><Banknote size={160}/></div>
                   </div>
                </div>
             </div>

             <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row gap-4 shadow-sm">
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="order-2 sm:order-1 flex-1 py-5 rounded-[28px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">ANNULLA</button>
                <button onClick={handleSaveSingle} className="order-1 sm:order-2 flex-[2] py-5 rounded-[28px] bg-emerald-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-emerald-700">
                  <SaveAll size={20}/> SALVA INCASSO
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;