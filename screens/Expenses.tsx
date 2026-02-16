
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { 
  ArrowLeft, Plus, FileUp, Loader2, Check, X, 
  Calendar, ReceiptText, Sparkles, Trash2, PencilLine,
  Tag as TagIcon, Building2, ChevronDown, ChevronUp, Users,
  Layers, Percent, AlertCircle, Euro, Type, 
  SaveAll, Clock, CreditCard, Filter, RotateCcw,
  Landmark, ShieldCheck, Calculator, CheckCircle2,
  Search, Wallet, Info, PlusCircle, MinusCircle, 
  ChevronRight, ArrowRight, ShieldAlert, Banknote, 
  Clock3 as PendingIcon, AlertCircle as UnpaidIcon, CheckCircle2 as PaidIcon,
  Scale, Equal
} from 'lucide-react';
import { Transaction, Category, BankAccount, MillesimalTable, PayerType, TableSplit, PaymentStatus, Unit, PaymentMethod, UserRole, InvoiceItem } from '../types';
import { extractInvoiceData } from '../services/geminiService';
import { calculateTransactionSplit, normalizeString } from '../services/calculatorService';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedSplitId, setExpandedSplitId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(!!initialFilters?.category);
  const [filters, setFilters] = useState({ search: '', month: '', year: '', category: initialFilters?.category || '', unit: '', status: '' });

  const initialFormData: Partial<Transaction> = {
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    netAmount: 0,
    taxAmount: 0,
    category: categories[0]?.name || 'Manutenzione',
    description: '',
    provider: '',
    providerFiscalCode: '',
    paymentStatus: 'NON_PAGATO',
    paymentMethod: 'BONIFICO',
    unit: 'CONDOMINIO',
    documentType: 'FATTURA',
    items: [{ description: 'Prestazione', amount: 0 }],
    splits: [],
    ritenuta: 0,
    tributoCode: ''
  };

  const [formData, setFormData] = useState<Partial<Transaction>>(initialFormData);

  useEffect(() => {
    if (onToggleDock) onToggleDock(!isAddingManual && !isScanning);
    return () => onToggleDock?.(true);
  }, [isAddingManual, isScanning, onToggleDock]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const result = await extractInvoiceData(base64String, file.type);
          if (result.transactions && result.transactions.length > 0) {
            const extracted = result.transactions[0];
            setFormData({
              ...initialFormData,
              ...extracted,
              type: 'EXPENSE',
              date: extracted.date || new Date().toISOString().split('T')[0]
            });
            setIsAddingManual(true);
          }
        } catch (err) {
          alert("Errore AI: Impossibile leggere il documento.");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsScanning(false);
    }
  };

  const handleSaveExpense = () => {
    if (!formData.description || !formData.amount) {
      alert("Descrizione e Importo sono obbligatori.");
      return;
    }

    // Validazione splits se presenti
    if (formData.splits && formData.splits.length > 0) {
      const totalPerc = formData.splits.reduce((s, split) => s + (Number(split.percentage) || 0), 0);
      if (Math.abs(totalPerc - 100) > 0.1) {
        alert("La somma delle percentuali di ripartizione deve essere 100%. Attualmente è " + totalPerc + "%");
        return;
      }
    }

    const txToSave = {
      ...formData,
      id: editingId || Math.random().toString(36).substr(2, 9),
      type: 'EXPENSE' as const,
      amount: Number(formData.amount),
      netAmount: Number(formData.netAmount || formData.amount),
      taxAmount: Number(formData.taxAmount || 0)
    } as Transaction;

    const updated = editingId 
      ? transactions.map(t => t.id === editingId ? txToSave : t)
      : [txToSave, ...transactions];

    onTransactionsChange(updated);
    setIsAddingManual(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleAddSplit = (tableId: string) => {
    if (!tableId) return;
    const currentSplits = formData.splits || [];
    if (currentSplits.find(s => s.tableId === tableId)) return;

    setFormData({
      ...formData,
      splits: [...currentSplits, { tableId, percentage: 0 }]
    });
  };

  const handleRemoveSplit = (tableId: string) => {
    setFormData({
      ...formData,
      splits: (formData.splits || []).filter(s => s.tableId !== tableId)
    });
  };

  const handleEqualSplit = () => {
    const splits = formData.splits || [];
    if (splits.length === 0) return;
    
    const equalPart = Number((100 / splits.length).toFixed(2));
    const updated = splits.map((s, idx) => ({
      ...s,
      percentage: idx === splits.length - 1 
        ? Number((100 - (equalPart * (splits.length - 1))).toFixed(2)) 
        : equalPart
    }));

    setFormData({ ...formData, splits: updated });
  };

  const handleDelete = (exp: Transaction) => {
    if (confirm("Spostare questa spesa nel cestino?")) {
      if (onSoftDelete) onSoftDelete('EXPENSE', exp);
      onTransactionsChange(transactions.filter(t => t.id !== exp.id));
    }
  };

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
      <button onClick={onBack} className="flex items-center gap-3 text-pastel-indigo-600 dark:text-pastel-indigo-400 font-black mb-8 uppercase text-[10px] tracking-widest group no-print">
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
             <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
             <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none m3-button bg-pastel-slate-100 text-pastel-slate-600 border-2 border-pastel-slate-200 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest">
                <Sparkles size={18} className="text-pastel-indigo-500" /> AI SCAN
             </button>
             <button onClick={() => { setFormData(initialFormData); setEditingId(null); setIsAddingManual(true); }} className="flex-1 sm:flex-none m3-button bg-pastel-rose-500 text-white shadow-pastel-rose flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest">
                <Plus size={20}/> NUOVA
             </button>
          </div>
        )}
      </div>

      <div className="mb-10 space-y-4 no-print">
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
                          <button onClick={() => setExpandedSplitId(isExpanded ? null : exp.id)} className={`p-4 rounded-2xl transition-all border-2 ${isExpanded ? 'bg-pastel-indigo-600 border-pastel-indigo-600 text-white shadow-pastel-indigo' : 'bg-pastel-slate-50 dark:bg-darkBg border-pastel-slate-100 dark:border-darkBorder text-pastel-slate-400 hover:text-pastel-indigo-500'}`}><Layers size={20} /></button>
                          <button onClick={() => { setFormData(exp); setEditingId(exp.id); setIsAddingManual(true); }} className="p-4 text-pastel-slate-400 hover:text-pastel-indigo-600 transition-all bg-pastel-slate-50 dark:bg-darkBg border-2 border-pastel-slate-100 dark:border-darkBorder rounded-2xl"><PencilLine size={20} /></button>
                          <button onClick={() => handleDelete(exp)} className="p-4 text-pastel-slate-400 hover:text-pastel-rose-600 transition-all bg-pastel-slate-50 dark:bg-darkBg border-2 border-pastel-slate-100 dark:border-darkBorder rounded-2xl"><Trash2 size={20} /></button>
                       </div>
                     )}
                  </div>
               </div>

               {isExpanded && (
                 <div className="px-10 pb-10 pt-4 bg-pastel-slate-50/30 dark:bg-darkBg/40 border-t border-pastel-slate-50 dark:border-darkBorder animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                       <h5 className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest flex items-center gap-2"><Calculator size={14}/> Prospetto Ripartizione Millesimale</h5>
                       <span className="text-[9px] font-bold text-pastel-indigo-500 uppercase italic">Algoritmo DomusLog Engine</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {(() => {
                         const { unitSplits } = calculateTransactionSplit(exp, millesimalTables, units, categories);
                         return Object.entries(unitSplits).filter(([_, s]) => s.amount > 0).map(([uid, split]) => {
                           const unit = units.find(u => u.id === uid);
                           return (
                             <div key={uid} className="p-4 bg-white dark:bg-darkSurface rounded-3xl border-2 border-pastel-slate-50 dark:border-darkBorder shadow-sm flex justify-between items-center">
                                <div>
                                   <p className="text-[10px] font-black text-pastel-slate-800 dark:text-white uppercase leading-none mb-1">{unit?.name}</p>
                                   <p className="text-[8px] font-bold text-pastel-slate-400 uppercase">{unit?.owner}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-sm font-black text-pastel-indigo-600 dark:text-pastel-indigo-400">€ {split.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                                   <p className="text-[7px] font-black text-pastel-slate-300 uppercase">Pro-quota</p>
                                </div>
                             </div>
                           );
                         });
                       })()}
                    </div>
                 </div>
               )}
            </div>
          );
        })}
      </div>

      {isScanning && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[500] flex flex-col items-center justify-center p-8">
           <div className="w-32 h-32 relative mb-10">
              <div className="absolute inset-0 border-4 border-pastel-indigo-500 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-0 border-t-4 border-pastel-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white">
                 <Sparkles size={48} className="animate-pulse" />
              </div>
           </div>
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Domus AI Scanning</h3>
           <p className="text-[11px] font-black text-pastel-indigo-300 uppercase tracking-[0.3em]">ESTRAZIONE INTELLIGENTE DATI CONTABILI...</p>
        </div>
      )}

      {isAddingManual && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[450] flex items-end sm:items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-darkSurface w-full max-w-5xl rounded-[48px] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[95vh]">
             <div className="p-6 sm:p-8 border-b border-pastel-slate-50 dark:border-darkBorder flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-pastel-rose-500 rounded-2xl text-white shadow-xl"><ReceiptText size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-pastel-slate-800 dark:text-white uppercase tracking-tight">{editingId ? 'Rettifica Spesa' : 'Nuova Registrazione'}</h3>
                      <p className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest">Compilazione registro cronologico</p>
                   </div>
                </div>
                <button onClick={() => setIsAddingManual(false)} className="p-3 text-pastel-slate-300 hover:bg-pastel-slate-50 dark:hover:bg-darkBg rounded-2xl transition-all"><X size={28}/></button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <div className="space-y-1.5 lg:col-span-2">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Descrizione Operazione</label>
                      <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl px-6 py-5 font-black text-base uppercase outline-none shadow-inner dark:text-white transition-all" placeholder="ES: RIPARAZIONE PERDITA SCARICO" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Data Documento</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-pastel-rose-500" size={20} />
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl pl-14 pr-6 py-5 font-black text-base outline-none shadow-inner dark:text-white" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Importo Totale (€)</label>
                      <div className="relative">
                         <Euro className="absolute left-5 top-1/2 -translate-y-1/2 text-pastel-rose-500" size={20} />
                         <input type="number" step="0.01" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} className="w-full bg-pastel-rose-50/50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl pl-14 pr-6 py-5 font-black text-2xl text-pastel-rose-600 outline-none shadow-inner" placeholder="0.00" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Categoria Bilancio</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl px-6 py-5 font-black text-sm uppercase outline-none shadow-inner dark:text-white">
                         {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Competenza</label>
                      <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl px-6 py-5 font-black text-sm uppercase outline-none shadow-inner dark:text-white">
                         <option value="CONDOMINIO">TUTTO IL CONDOMINIO</option>
                         {units.map(u => <option key={u.id} value={u.name}>{u.name} (ADDEBITO DIRETTO)</option>)}
                      </select>
                   </div>

                   <div className="space-y-1.5 lg:col-span-2">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Fornitore / Ragione Sociale</label>
                      <div className="relative">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-pastel-slate-300" size={20} />
                        <input type="text" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl pl-14 pr-6 py-5 font-black text-base uppercase outline-none shadow-inner dark:text-white transition-all" placeholder="RAGIONE SOCIALE" />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">P.IVA / Codice Fiscale</label>
                      <input type="text" value={formData.providerFiscalCode} onChange={e => setFormData({...formData, providerFiscalCode: e.target.value})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl px-6 py-5 font-black text-base uppercase outline-none shadow-inner dark:text-white" placeholder="00000000000" />
                   </div>
                   
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest px-2">Metodo di Pagamento</label>
                      <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})} className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-rose-300 rounded-2xl px-6 py-5 font-black text-sm uppercase outline-none shadow-inner dark:text-white">
                         <option value="BONIFICO">BONIFICO BANCARIO</option>
                         <option value="RID">RID / DOMICILIAZIONE</option>
                         <option value="CONTANTI">CONTANTI</option>
                         <option value="ASSEGNO">ASSEGNO</option>
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-pastel-indigo-400 uppercase tracking-widest px-2">Ritenuta d'Acconto (€)</label>
                      <div className="relative">
                        <Percent className="absolute left-5 top-1/2 -translate-y-1/2 text-pastel-indigo-500" size={20} />
                        <input type="number" step="0.01" value={formData.ritenuta || ''} onChange={e => setFormData({...formData, ritenuta: parseFloat(e.target.value) || 0})} className="w-full bg-pastel-indigo-50/50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-indigo-300 rounded-2xl pl-14 pr-6 py-5 font-black text-base outline-none shadow-inner dark:text-white" placeholder="0.00" />
                      </div>
                   </div>
                </div>

                {/* NUOVA SEZIONE: RIPARTIZIONE PER TABELLE */}
                <div className="p-8 bg-pastel-indigo-50/50 dark:bg-darkBg rounded-[40px] border-2 border-pastel-indigo-100 dark:border-darkBorder">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-pastel-indigo-600 rounded-2xl text-white shadow-lg"><Scale size={20}/></div>
                         <div>
                            <h4 className="text-sm font-black text-pastel-slate-800 dark:text-white uppercase tracking-tight">Ripartizione Tabelle</h4>
                            <p className="text-[9px] font-black text-pastel-indigo-400 uppercase tracking-widest">Suddividi la spesa tra più tabelle millesimali</p>
                         </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <select 
                          onChange={(e) => handleAddSplit(e.target.value)}
                          value=""
                          className="flex-1 sm:flex-none bg-white dark:bg-darkSurface border-2 border-pastel-indigo-200 dark:border-darkBorder rounded-xl px-4 py-2 font-black text-[10px] uppercase outline-none focus:border-pastel-indigo-500"
                        >
                          <option value="">Aggiungi Tabella...</option>
                          {millesimalTables.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={handleEqualSplit}
                          className="p-2 bg-pastel-indigo-600 text-white rounded-xl shadow-md hover:bg-pastel-indigo-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase px-4"
                        >
                          <Equal size={16}/> Dividi Equamente
                        </button>
                      </div>
                   </div>

                   {(formData.splits || []).length === 0 ? (
                     <div className="text-center py-6 border-2 border-dashed border-pastel-indigo-200 dark:border-darkBorder rounded-3xl">
                        <p className="text-[10px] font-bold text-pastel-slate-400 uppercase">Nessuna tabella manuale impostata. Verrà usata la tabella predefinita per categoria.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {formData.splits?.map((split, idx) => {
                          const table = millesimalTables.find(t => t.id === split.tableId);
                          return (
                            <div key={split.tableId} className="flex items-center gap-4 bg-white dark:bg-darkSurface p-4 rounded-2xl border-2 border-pastel-indigo-50 dark:border-darkBorder shadow-sm animate-in zoom-in-95">
                               <div className="flex-1">
                                  <p className="text-[10px] font-black text-pastel-slate-800 dark:text-white uppercase truncate">{table?.name || 'Tabella Eliminata'}</p>
                                  <p className="text-[8px] font-bold text-pastel-slate-400 uppercase">{table?.description || '-'}</p>
                               </div>
                               <div className="w-32 relative">
                                  <input 
                                    type="number" 
                                    value={split.percentage || ''} 
                                    onChange={e => {
                                      const newSplits = [...(formData.splits || [])];
                                      newSplits[idx].percentage = parseFloat(e.target.value) || 0;
                                      setFormData({...formData, splits: newSplits});
                                    }}
                                    className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-indigo-300 rounded-xl pl-4 pr-8 py-2 font-black text-xs outline-none" 
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-pastel-indigo-400">%</span>
                               </div>
                               <button onClick={() => handleRemoveSplit(split.tableId)} className="p-2 text-pastel-rose-300 hover:text-pastel-rose-500 transition-all"><MinusCircle size={20}/></button>
                            </div>
                          );
                        })}
                        <div className="flex justify-between items-center px-4 pt-2">
                           <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${Math.abs((formData.splits?.reduce((s,v)=>s+v.percentage,0)||0) - 100) < 0.1 ? 'bg-pastel-emerald-500' : 'bg-pastel-rose-500 animate-pulse'}`}></div>
                              <span className="text-[9px] font-black text-pastel-slate-400 uppercase">Somma: {formData.splits?.reduce((s,v)=>s+v.percentage,0).toFixed(2)}%</span>
                           </div>
                           <p className="text-[9px] font-black text-pastel-indigo-600 uppercase">Configurazione Multi-Tabella Attiva</p>
                        </div>
                     </div>
                   )}
                </div>

                <div className="p-8 bg-pastel-slate-50 dark:bg-darkBg rounded-[40px] border border-pastel-slate-100 dark:border-darkBorder">
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-black text-pastel-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2"><Layers size={18} className="text-pastel-rose-500"/> Suddivisione Righe Documento</h4>
                      <button onClick={() => setFormData({...formData, items: [...(formData.items || []), { description: '', amount: 0 }]})} className="text-[10px] font-black text-pastel-rose-600 uppercase flex items-center gap-2 bg-white dark:bg-darkSurface px-4 py-2 rounded-xl shadow-sm border border-pastel-rose-100"><Plus size={16}/> Aggiungi Voce</button>
                   </div>
                   <div className="space-y-4">
                      {formData.items?.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-darkSurface p-4 rounded-3xl border border-pastel-slate-100 dark:border-darkBorder shadow-sm animate-in zoom-in-95">
                           <input 
                             type="text" 
                             value={item.description} 
                             onChange={e => {
                                const newItems = [...(formData.items || [])];
                                newItems[idx].description = e.target.value;
                                setFormData({...formData, items: newItems});
                             }}
                             className="flex-[3] bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-indigo-300 rounded-xl px-4 py-3 font-black text-xs uppercase outline-none" 
                             placeholder="DETTAGLIO VOCE..." 
                           />
                           <div className="flex-1 relative">
                              <input 
                                type="number" 
                                value={item.amount || ''} 
                                onChange={e => {
                                   const newItems = [...(formData.items || [])];
                                   newItems[idx].amount = parseFloat(e.target.value) || 0;
                                   const total = newItems.reduce((s, i) => s + i.amount, 0);
                                   setFormData({...formData, items: newItems, amount: total});
                                }}
                                className="w-full bg-pastel-slate-50 dark:bg-darkBg border-2 border-transparent focus:border-pastel-indigo-300 rounded-xl pl-8 pr-3 py-3 font-black text-xs outline-none" 
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-pastel-indigo-400">€</span>
                           </div>
                           <button onClick={() => setFormData({...formData, items: formData.items?.filter((_, i) => i !== idx)})} className="p-3 text-pastel-rose-300 hover:text-pastel-rose-500 transition-all"><MinusCircle size={24}/></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="p-8 sm:p-10 border-t border-pastel-slate-50 dark:border-darkBorder bg-white dark:bg-darkSurface shrink-0 flex flex-col sm:flex-row justify-between items-center gap-8 rounded-b-[48px]">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-pastel-slate-50 dark:bg-darkBg rounded-3xl flex items-center justify-center text-pastel-slate-300 shadow-inner"><Wallet size={32}/></div>
                   <div>
                      <p className="text-[10px] font-black text-pastel-slate-400 uppercase tracking-widest mb-1">IMPORTO FINALE</p>
                      <p className="text-4xl font-black text-pastel-slate-800 dark:text-white tracking-tighter">€ {formData.amount?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                   <button onClick={() => setIsAddingManual(false)} className="flex-1 sm:flex-none px-10 py-5 rounded-3xl bg-pastel-slate-100 text-pastel-slate-500 font-black uppercase text-xs tracking-widest hover:bg-pastel-slate-200 transition-all">Annulla</button>
                   <button onClick={handleSaveExpense} className="flex-[2] sm:flex-none px-12 py-5 rounded-3xl bg-pastel-rose-500 text-white font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-pastel-rose-600 flex items-center justify-center gap-3"><SaveAll size={20}/> CONFERMA E SALVA</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
