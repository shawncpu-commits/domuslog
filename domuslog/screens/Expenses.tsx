
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { 
  ArrowLeft, Plus, FileUp, Loader2, Check, X, 
  Calendar, Zap, ReceiptText, Sparkles, Trash2, PencilLine,
  Scale, Tag as TagIcon, Building2, ChevronDown, ChevronUp, User, Users,
  Layers, Percent, AlertCircle, Euro, Type, AlignLeft,
  FileSearch, SaveAll, Clock, CreditCard, Ban, FileCheck, Filter, RotateCcw,
  Landmark, ShieldCheck, Calculator, Divide, ListChecks, CheckCircle2,
  FileWarning, Layers3, Search, CalendarRange, Wallet, Info, ClipboardList,
  Fingerprint, Receipt, PlusCircle, MinusCircle, Equal, 
  ChevronRight, ArrowRight, ShieldAlert, CheckCircle, FileBadge, ArrowDownWideNarrow,
  Eye, ListTree, Gavel, ShieldEllipsis, PackageSearch, FileJson, CreditCard as CardIcon,
  Banknote, Wallet2, CheckCircle2 as PaidIcon, Clock3 as PendingIcon, AlertCircle as UnpaidIcon
} from 'lucide-react';
import { Transaction, Category, BankAccount, MillesimalTable, PayerType, TableSplit, PaymentStatus, Unit, PaymentMethod, UserRole } from '../types';
import { extractInvoiceData } from '../services/geminiService';
import { calculateTransactionSplit, isCategoryInTable, normalizeString } from '../services/calculatorService';

interface ExpensesProps {
  onBack: () => void;
  categories: Category[];
  transactions: Transaction[];
  onTransactionsChange: (tx: Transaction[]) => void;
  bankAccounts: BankAccount[];
  millesimalTables: MillesimalTable[];
  onToggleDock?: (visible: boolean) => void;
  units?: Unit[];
  initialFilters?: { category?: string };
  onSoftDelete?: (type: 'EXPENSE', item: any) => void;
  userRole?: UserRole;
  activeUnitId?: string | null;
}

export const Expenses: React.FC<ExpensesProps> = ({ 
  onBack, categories, transactions, onTransactionsChange, millesimalTables, 
  onToggleDock, bankAccounts, units = [], initialFilters, onSoftDelete, userRole = 'ADMIN',
  activeUnitId
}) => {
  const isAdmin = userRole === 'ADMIN';
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSplitId, setExpandedSplitId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(!!initialFilters?.category);
  const [filters, setFilters] = useState({ search: '', month: '', year: '', category: initialFilters?.category || '', unit: '', status: '' });
  
  const filteredExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'EXPENSE').filter(exp => {
      const d = new Date(exp.date);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const y = d.getFullYear().toString();
      const matchSearch = (exp.description || '').toLowerCase().includes(filters.search.toLowerCase()) || 
                          (exp.provider || '').toLowerCase().includes(filters.search.toLowerCase());
      return (
        matchSearch &&
        (!filters.month || m === filters.month) &&
        (!filters.year || y === filters.year) &&
        (!filters.category || normalizeString(exp.category) === normalizeString(filters.category)) &&
        (!filters.unit || exp.unit === filters.unit) &&
        (!filters.status || exp.paymentStatus === filters.status)
      );
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filters]);

  const getStatusStyle = (status?: PaymentStatus) => {
    switch (status) {
      case 'PAGATO': return { bg: 'bg-pastel-emerald-100', text: 'text-pastel-emerald-700', border: 'border-pastel-emerald-300', icon: <PaidIcon size={12}/> };
      case 'IN_ATTESA': return { bg: 'bg-pastel-amber-100', text: 'text-pastel-amber-700', border: 'border-pastel-amber-300', icon: <PendingIcon size={12}/> };
      default: return { bg: 'bg-pastel-rose-100', text: 'text-pastel-rose-700', border: 'border-pastel-rose-300', icon: <UnpaidIcon size={12}/> };
    }
  };

  return (
    <div className="pb-32 px-1 sm:px-0">
      <button onClick={onBack} className="flex items-center gap-3 text-pastel-indigo-600 dark:text-pastel-indigo-400 font-black mb-8 uppercase text-[10px] tracking-widest group">
        <div className="p-2 bg-pastel-indigo-50 dark:bg-pastel-indigo-900/30 rounded-xl group-hover:bg-pastel-indigo-100 transition-all"><ArrowLeft size={18} /></div>
        <span>Torna Indietro</span>
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-pastel-slate-800 dark:text-white uppercase leading-none tracking-tighter">Spese</h1>
          <p className="text-[11px] font-black text-pastel-indigo-400 uppercase tracking-[0.3em] mt-3">ARCHIVIO CONTABILE E FISCALE</p>
        </div>
        {isAdmin && (
          <div className="flex gap-4 w-full sm:w-auto">
             <button onClick={() => {}} className="flex-1 sm:flex-none m3-button bg-pastel-slate-100 text-pastel-slate-600 border-2 border-pastel-slate-200 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"><Sparkles size={18}/> AI SCAN</button>
             <button onClick={() => setIsAddingManual(true)} className="flex-1 sm:flex-none m3-button bg-pastel-rose-500 text-white shadow-pastel-rose flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest"><Plus size={20}/> NUOVA</button>
          </div>
        )}
      </div>

      <div className="mb-10 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-pastel-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="CERCA DOCUMENTO, FORNITORE..." 
              value={filters.search} 
              onChange={(e) => setFilters({...filters, search: e.target.value})} 
              className="w-full pl-16 pr-8 py-5 bg-white dark:bg-darkSurface border-2 border-pastel-slate-100 dark:border-darkBorder rounded-3xl font-black text-xs uppercase outline-none focus:border-pastel-indigo-400 shadow-soft dark:text-white transition-all" 
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-5 rounded-[28px] border-2 transition-all ${showFilters ? 'bg-pastel-indigo-500 border-pastel-indigo-500 text-white shadow-pastel-indigo' : 'bg-white dark:bg-darkSurface border-pastel-slate-100 dark:border-darkBorder text-pastel-slate-400 hover:border-pastel-indigo-200'}`}
          >
            <Filter size={24} />
          </button>
        </div>
        {showFilters && (
          <div className="p-8 bg-white dark:bg-darkSurface rounded-[40px] border-2 border-pastel-slate-100 dark:border-darkBorder shadow-soft grid grid-cols-2 sm:grid-cols-4 gap-6 animate-in slide-in-from-top-4">
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">CATEGORIA</label>
               <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent rounded-2xl px-5 py-4 font-black text-[10px] uppercase outline-none focus:border-pastel-indigo-300 dark:text-white">
                 <option value="">Tutte le categorie</option>
                 {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[9px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">STATO</label>
               <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent rounded-2xl px-5 py-4 font-black text-[10px] uppercase outline-none focus:border-pastel-indigo-300 dark:text-white">
                 <option value="">Qualsiasi stato</option>
                 <option value="PAGATO">PAGATO</option>
                 <option value="NON_PAGATO">NON PAGATO</option>
                 <option value="IN_ATTESA">IN ATTESA</option>
               </select>
            </div>
            <div className="flex items-end">
               <button onClick={() => setFilters({ search: '', month: '', year: '', category: '', unit: '', status: '' })} className="w-full py-4 bg-pastel-slate-100 dark:bg-darkBg text-pastel-slate-400 hover:text-pastel-rose-500 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all"><RotateCcw size={14} /> Reset Filtri</button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {filteredExpenses.map(exp => {
          const style = getStatusStyle(exp.paymentStatus);
          const isExpanded = expandedSplitId === exp.id;
          
          return (
            <div key={exp.id} className="group flex flex-col rounded-[44px] border-2 bg-white dark:bg-darkSurface border-pastel-slate-50 dark:border-darkBorder shadow-soft hover:shadow-pastel-indigo hover:border-pastel-indigo-200 transition-all overflow-hidden">
               <div className="p-6 sm:p-10 flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex gap-6 flex-1">
                     <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center shrink-0 border-2 ${style.border} ${style.bg} ${style.text} shadow-inner`}>
                        <ReceiptText size={32} />
                     </div>
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2.5">
                           <h4 className="font-black text-pastel-slate-800 dark:text-white uppercase text-base leading-tight truncate">{exp.description}</h4>
                           {exp.unit !== 'CONDOMINIO' && <span className="bg-pastel-amber-500 text-white text-[7px] font-black px-2 py-1 rounded-full uppercase">UNITA: {exp.unit}</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 items-center">
                           <span className="text-[9px] font-black bg-pastel-indigo-100 dark:bg-pastel-indigo-900/40 text-pastel-indigo-700 dark:text-pastel-indigo-300 px-3 py-1.5 rounded-xl uppercase border-2 border-pastel-indigo-200/40 shadow-sm">{exp.category}</span>
                           <span className="text-[9px] font-black text-pastel-slate-400 uppercase flex items-center gap-1.5"><Calendar size={14} className="text-pastel-indigo-400"/> {new Date(exp.date).toLocaleDateString('it-IT')}</span>
                           <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase border-2 flex items-center gap-2 ${style.bg} ${style.text} ${style.border}`}>
                             {style.icon} {exp.paymentStatus?.replace('_', ' ')}
                           </span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 border-pastel-slate-50 dark:border-darkBorder pt-6 md:pt-0">
                     <div className="text-right">
                        <p className="text-2xl font-black text-pastel-slate-800 dark:text-white tracking-tighter">€ {exp.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[8px] font-black text-pastel-slate-300 uppercase mt-2 tracking-widest">IMPORTO DOCUMENTO</p>
                     </div>
                     {isAdmin && (
                       <div className="flex gap-2">
                          <button onClick={() => setExpandedSplitId(isExpanded ? null : exp.id)} className={`p-4 rounded-2xl transition-all border-2 ${isExpanded ? 'bg-pastel-indigo-600 border-pastel-indigo-600 text-white shadow-pastel-indigo' : 'bg-pastel-slate-50 dark:bg-darkBg border-pastel-slate-100 dark:border-darkBorder text-pastel-slate-400 hover:text-pastel-indigo-500'}`}><Layers3 size={20} /></button>
                          <button onClick={() => {}} className="p-4 text-pastel-slate-400 hover:text-pastel-indigo-600 transition-all bg-pastel-slate-50 dark:bg-darkBg border-2 border-pastel-slate-100 dark:border-darkBorder rounded-2xl"><PencilLine size={20} /></button>
                          <button onClick={() => {}} className="p-4 text-pastel-slate-400 hover:text-pastel-rose-600 transition-all bg-pastel-slate-50 dark:bg-darkBg border-2 border-pastel-slate-100 dark:border-darkBorder rounded-2xl"><Trash2 size={20} /></button>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
