
import React, { useState, useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  ShoppingCart, Banknote, CalendarDays, 
  ChevronDown, Sun, Moon, Plus, 
  LayoutGrid, FileText, Menu, X, Info, 
  Loader2, Calculator, ShieldAlert,
  Trash2, RotateCcw, DatabaseZap,
  Droplets, Landmark, Scale, ShieldCheck, ShieldOff, PencilLine,
  Wallet, LogOut, Building, Shield,
  Gavel, UserCircle2, Layers, Settings, ChevronRight,
  CheckCircle2, Sparkles, Tags, ArrowRight,
  // Added missing TrendingUp icon import
  TrendingUp
} from 'lucide-react';
import { AppView, Transaction, Category, InsurancePolicy, UserRole } from '../types';
import { analyzeFinancialStatus } from '../services/geminiService';
import { AppLogo } from '../components/AppLogo';

interface HomeProps {
  condoName: string;
  selectedYear: string;
  onYearChange: (year: string) => void;
  onNavigate: (view: AppView, params?: any) => void;
  categories: Category[];
  transactions: Transaction[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  condoId?: string;
  onCategoriesChange?: (cats: Category[]) => void;
  onResetData?: () => void; 
  onCloseCondo?: () => void;
  units?: any[];
  insurancePolicies?: InsurancePolicy[];
  onNameChange?: (newName: string) => void;
  userRole?: UserRole;
  activeUnitId?: string | null;
}

export const Home: React.FC<HomeProps> = ({ 
  condoName, selectedYear, onYearChange, onNavigate, 
  categories, transactions, isDarkMode, onToggleDarkMode, 
  units = [], onNameChange, insurancePolicies = [],
  userRole = 'ADMIN', activeUnitId, onCloseCondo
}) => {
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(condoName);

  const isAdmin = userRole === 'ADMIN';

  const filteredTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(selectedYear)), [transactions, selectedYear]);
  const totalExpenses = useMemo(() => filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0), [filteredTransactions]);
  const cashBalance = totalIncome - totalExpenses;

  const activePolicy = useMemo(() => insurancePolicies.find(p => p.isActive) || insurancePolicies[0], [insurancePolicies]);
  const insuranceStatus = useMemo(() => {
    if (!activePolicy) return { label: 'Non Config.', shadow: 'shadow-soft', bg: 'bg-pastel-slate-100', text: 'text-pastel-slate-600', icon: <ShieldOff size={20}/> };
    const expiry = new Date(activePolicy.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Scaduta', shadow: 'shadow-pastel-rose', bg: 'bg-pastel-rose-100', text: 'text-pastel-rose-600', icon: <ShieldAlert size={20}/> };
    if (diffDays < 30) return { label: 'In Scadenza', shadow: 'shadow-pastel-rose', bg: 'bg-pastel-amber-100', text: 'text-pastel-amber-600', icon: <ShieldAlert size={20}/> };
    return { label: 'Attiva', shadow: 'shadow-pastel-emerald', bg: 'bg-pastel-emerald-100', text: 'text-pastel-emerald-600', icon: <ShieldCheck size={20}/> };
  }, [activePolicy]);

  const expenseData = useMemo(() => {
    return categories
      .map(cat => ({
        name: cat.name.toUpperCase(),
        value: filteredTransactions.filter(t => t.type === 'EXPENSE' && t.category === cat.name).reduce((sum, t) => sum + t.amount, 0),
        color: cat.color
      }))
      .filter(d => d.value > 0);
  }, [categories, filteredTransactions]);

  const monthlyData = useMemo(() => {
    const labels = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];
    return labels.map((l, i) => {
      const monthStr = `-${(i + 1).toString().padStart(2, '0')}-`;
      return {
        month: l,
        spese: filteredTransactions.filter(t => t.type === 'EXPENSE' && t.date.includes(monthStr)).reduce((s, t) => s + t.amount, 0),
        incassi: filteredTransactions.filter(t => t.type === 'INCOME' && t.date.includes(monthStr)).reduce((s, t) => s + t.amount, 0)
      };
    });
  }, [filteredTransactions]);

  const handleAiInsight = async () => {
    setIsAnalyzing(true);
    const result = await analyzeFinancialStatus(filteredTransactions, condoName);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSaveName = () => {
    if (onNameChange && editNameValue.trim()) onNameChange(editNameValue);
    setIsEditingName(false);
  };

  const currentUnit = useMemo(() => units.find(u => u.id === activeUnitId), [units, activeUnitId]);

  const menuItems = [
    { id: AppView.RECEIPTS, label: 'Ricevute', icon: <FileText size={20}/>, adminOnly: true },
    { id: AppView.BANK, label: 'Banca', icon: <Landmark size={20}/>, adminOnly: true },
    { id: AppView.CATEGORIES, label: 'Categorie', icon: <Tags size={20}/>, adminOnly: true },
    { id: AppView.MONTHLY_QUOTAS, label: 'Quote', icon: <Layers size={20}/>, adminOnly: true },
    { id: AppView.INSURANCE, label: 'Assicurazione', icon: <Shield size={20}/>, adminOnly: false },
    { id: AppView.REGULATION, label: 'Regolamento', icon: <Gavel size={20}/>, adminOnly: false },
  ];

  return (
    <div className="animate-in fade-in duration-500 px-1 sm:px-0 pb-32">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 mt-4">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-5 bg-white dark:bg-darkSurface rounded-[28px] border-2 border-pastel-indigo-100 dark:border-darkBorder shadow-pastel-indigo text-pastel-indigo-500 hover:scale-105 transition-all"
          >
            <Menu size={28} />
          </button>
          <div className="flex items-center gap-4">
            {isAdmin ? (
               <div className="flex items-center gap-5">
                  <AppLogo />
                  <div className="h-10 w-0.5 bg-pastel-slate-200 dark:bg-darkBorder hidden xs:block"></div>
                  {!isEditingName ? (
                    <div>
                      <p className="text-[10px] font-black text-pastel-indigo-300 uppercase tracking-[0.2em] mb-0.5">Gestione Condominio</p>
                      <div className="flex items-center gap-2 group">
                        <h2 className="text-xl font-black text-pastel-slate-800 dark:text-slate-100 uppercase tracking-tight">{condoName || "DOMUSLOG"}</h2>
                        <button onClick={() => { setEditNameValue(condoName); setIsEditingName(true); }} className="p-1.5 text-pastel-indigo-300 hover:text-pastel-indigo-500 transition-colors"><PencilLine size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <input type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="bg-white dark:bg-darkSurface border-2 border-pastel-indigo-300 rounded-2xl px-4 py-2 font-black text-sm uppercase outline-none shadow-pastel-indigo" autoFocus onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
                  )}
               </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[28px] bg-pastel-indigo-100 dark:bg-pastel-indigo-900/30 flex items-center justify-center shadow-pastel-indigo border-2 border-white dark:border-pastel-indigo-800">
                   <Building size={32} className="text-pastel-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-pastel-indigo-400 uppercase tracking-[0.3em] mb-1">{condoName}</p>
                  <h1 className="text-3xl font-black text-pastel-slate-800 dark:text-white uppercase leading-none tracking-tighter">
                    {currentUnit?.name || 'Area Condomino'}
                  </h1>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={onToggleDarkMode} className="w-16 h-16 flex items-center justify-center bg-white dark:bg-darkSurface rounded-[28px] border-2 border-pastel-slate-100 dark:border-darkBorder shadow-soft transition-all hover:border-pastel-indigo-200">
            {isDarkMode ? <Sun size={24} className="text-pastel-amber-400" /> : <Moon size={24} className="text-pastel-indigo-500" />}
          </button>
          <div className="relative flex-1 sm:flex-none">
            <button onClick={() => setShowYearMenu(!showYearMenu)} className="w-full flex items-center justify-between gap-8 bg-white dark:bg-darkSurface border-2 border-pastel-slate-100 dark:border-darkBorder px-8 py-5 rounded-[28px] shadow-soft font-black text-sm uppercase tracking-widest hover:border-pastel-indigo-200 transition-all">
              <span className="flex items-center gap-3 text-pastel-indigo-600 dark:text-pastel-indigo-400"><CalendarDays size={20}/> {selectedYear}</span>
              <ChevronDown size={18} className="text-pastel-slate-300" />
            </button>
            {showYearMenu && (
              <div className="absolute top-full right-0 mt-4 bg-white dark:bg-darkSurface rounded-[32px] shadow-2xl p-3 z-[60] w-48 border-2 border-pastel-slate-50 dark:border-darkBorder animate-in slide-in-from-top-4">
                {['2023', '2024', '2025'].map(y => <button key={y} onClick={() => { onYearChange(y); setShowYearMenu(false); }} className={`w-full text-left px-6 py-4 rounded-2xl font-black text-xs uppercase transition-all ${selectedYear === y ? 'bg-pastel-indigo-500 text-white shadow-pastel-indigo' : 'text-pastel-slate-400 hover:bg-pastel-indigo-50 dark:hover:bg-slate-800'}`}>{y}</button>)}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
        {[
          { label: 'Uscite Totali', value: totalExpenses, color: 'pastel-rose', icon: <ShoppingCart size={24}/>, bg: 'bg-pastel-rose-50', border: 'border-pastel-rose-200', text: 'text-pastel-rose-600', shadow: 'shadow-pastel-rose' },
          { label: 'Entrate Totali', value: totalIncome, color: 'pastel-emerald', icon: <Banknote size={24}/>, bg: 'bg-pastel-emerald-50', border: 'border-pastel-emerald-200', text: 'text-pastel-emerald-600', shadow: 'shadow-pastel-emerald' },
          { label: 'Saldo Cassa', value: cashBalance, color: 'pastel-indigo', icon: <Wallet size={24}/>, bg: 'bg-pastel-indigo-50', border: 'border-pastel-indigo-200', text: 'text-pastel-indigo-600', shadow: 'shadow-pastel-indigo' },
          { label: 'Polizza', value: activePolicy?.premium || 0, color: 'pastel-amber', icon: insuranceStatus.icon, bg: insuranceStatus.bg, border: 'border-pastel-slate-200', text: insuranceStatus.text, shadow: insuranceStatus.shadow, subtitle: insuranceStatus.label }
        ].map((s, i) => (
          <MaterialCard key={i} className={`${s.bg} ${s.border} ${s.shadow} dark:bg-darkSurface dark:border-darkBorder p-8 border-2 hover:scale-[1.03] transition-all cursor-default`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white dark:bg-darkBg shadow-soft ${s.text} border-2 border-transparent group-hover:border-white`}>{s.icon}</div>
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-pastel-slate-400 mb-1.5">{s.label}</p>
                  <p className={`text-2xl font-black truncate ${s.text}`}>€ {s.value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
               </div>
               {s.subtitle && <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase bg-white dark:bg-darkBg ${s.text} border-2 border-slate-50 dark:border-darkBorder shadow-sm`}>{s.subtitle}</span>}
            </div>
          </MaterialCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <MaterialCard className="lg:col-span-8 shadow-soft border-pastel-slate-100 dark:border-darkBorder p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black uppercase tracking-tighter text-pastel-slate-800 dark:text-white flex items-center gap-3"><TrendingUp className="text-pastel-indigo-500"/> Flusso Finanziario Mensile</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pastel-rose-400"></div><span className="text-[9px] font-black text-pastel-slate-400 uppercase">Uscite</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pastel-emerald-400"></div><span className="text-[9px] font-black text-pastel-slate-400 uppercase">Entrate</span></div>
              </div>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dx={-10} />
                    <Tooltip cursor={{ stroke: '#818cf8', strokeWidth: 2 }} contentStyle={{ borderRadius: '28px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', padding: '20px' }} />
                    <Line type="monotone" dataKey="spese" stroke="#fb7185" strokeWidth={6} dot={{ r: 6, fill: '#fb7185', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="incassi" stroke="#34d399" strokeWidth={6} dot={{ r: 6, fill: '#34d399', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 10, strokeWidth: 0 }} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
        </MaterialCard>

        <MaterialCard className="lg:col-span-4 shadow-soft border-pastel-slate-100 dark:border-darkBorder p-8">
           <h3 className="text-lg font-black uppercase tracking-tighter text-pastel-slate-800 dark:text-white flex items-center gap-3 mb-8"><PieChart className="text-pastel-indigo-500"/> Distribuzione Spese</h3>
           <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={expenseData} innerRadius="65%" outerRadius="90%" paddingAngle={10} dataKey="value">
                       {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-3">
              {expenseData.length > 0 ? expenseData.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: d.color }} />
                    <span className="text-pastel-slate-400 group-hover:text-pastel-slate-600 transition-colors">{d.name}</span>
                  </div>
                  <span className="text-pastel-slate-700 dark:text-slate-100">€ {d.value.toLocaleString('it-IT')}</span>
                </div>
              )) : <p className="text-[10px] font-black text-slate-300 uppercase text-center py-10 tracking-widest">Nessun dato spesa</p>}
           </div>
        </MaterialCard>
      </div>

      <MaterialCard className="bg-pastel-indigo-50 dark:bg-pastel-indigo-900/10 border-2 border-pastel-indigo-200 dark:border-pastel-indigo-800/40 shadow-pastel-indigo p-12 sm:p-16 relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10">
               <div className="w-20 h-20 bg-white dark:bg-darkBg rounded-[32px] shadow-pastel-indigo flex items-center justify-center text-pastel-indigo-500 shrink-0 border-2 border-pastel-indigo-100">
                  <Calculator size={48} />
               </div>
               <div>
                  <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none text-pastel-indigo-700 dark:text-pastel-indigo-300">Domus AI Engine</h3>
                  <div className="flex items-center gap-3 mt-3">
                     <span className="text-[11px] font-black text-pastel-indigo-400 uppercase tracking-[0.4em]">PROACTIVE ANALYSIS</span>
                     <div className="h-px w-12 bg-pastel-indigo-200"></div>
                     <Sparkles size={16} className="text-pastel-amber-400" />
                  </div>
               </div>
            </div>
            
            {aiAnalysis ? (
               <div className="bg-white/90 dark:bg-darkSurface/90 rounded-[48px] p-10 sm:p-12 animate-in zoom-in-95 duration-700 backdrop-blur-2xl border-2 border-pastel-indigo-100 dark:border-darkBorder shadow-pastel-indigo">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-pastel-slate-700 dark:text-indigo-50 font-medium leading-relaxed">
                    {aiAnalysis}
                  </div>
                  <button onClick={() => setAiAnalysis(null)} className="mt-10 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest bg-pastel-indigo-100 dark:bg-pastel-indigo-500/20 text-pastel-indigo-600 px-8 py-4 rounded-2xl hover:bg-pastel-indigo-200 transition-all active:scale-95"><RotateCcw size={18}/> Nuova Simulazione</button>
               </div>
            ) : (
               <div className="max-w-3xl">
                  <p className="text-xl sm:text-2xl font-bold text-pastel-slate-600 dark:text-slate-300 leading-snug tracking-tight mb-10">
                     Elabora report predittivi avanzati su costi energetici, manutenzione programmata e sostenibilità delle quote mensili.
                  </p>
                  <button 
                    onClick={handleAiInsight} 
                    disabled={isAnalyzing}
                    className="m3-button bg-pastel-indigo-600 text-white flex items-center justify-center gap-5 shadow-pastel-indigo uppercase font-black text-sm py-6 px-12 tracking-[0.2em] hover:bg-pastel-indigo-700 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={24}/> : <>GENERA REPORT STRATEGICO <ArrowRight size={22}/></>}
                  </button>
               </div>
            )}
         </div>
         <div className="absolute -right-20 -top-20 p-10 opacity-5 pointer-events-none rotate-12 scale-150 text-pastel-indigo-500"><DatabaseZap size={350}/></div>
      </MaterialCard>

      {/* DRAWER SIDEBAR */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[1000] flex">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-85 max-w-[85vw] bg-white dark:bg-darkSurface h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500 rounded-r-[60px] border-r-4 border-pastel-indigo-50 dark:border-darkBorder">
             <div className="p-10 border-b border-pastel-slate-50 dark:border-darkBorder flex items-center justify-between">
                <AppLogo />
                <button onClick={() => setIsDrawerOpen(false)} className="p-4 text-pastel-slate-300 hover:bg-pastel-indigo-50 dark:hover:bg-darkBg rounded-2xl transition-all"><X size={28}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar mt-4">
                {menuItems.map(item => {
                  if (item.adminOnly && !isAdmin) return null;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => { onNavigate(item.id); setIsDrawerOpen(false); }}
                      className="w-full flex items-center gap-6 px-6 py-5 rounded-[28px] text-pastel-slate-500 dark:text-pastel-slate-400 hover:bg-pastel-indigo-100 hover:text-pastel-indigo-600 dark:hover:bg-pastel-indigo-500/10 transition-all font-black text-xs uppercase tracking-widest text-left border-2 border-transparent hover:border-pastel-indigo-200"
                    >
                      <span className="p-2.5 bg-pastel-slate-50 dark:bg-darkBg rounded-xl group-hover:bg-white">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
             </div>
             <div className="p-8 border-t border-pastel-slate-50 dark:border-darkBorder mb-6 px-10">
                <button onClick={() => onCloseCondo?.()} className="w-full flex items-center gap-5 px-6 py-6 rounded-3xl text-pastel-rose-600 bg-pastel-rose-50 dark:bg-pastel-rose-950/20 hover:bg-pastel-rose-100 transition-all font-black text-xs uppercase tracking-widest shadow-pastel-rose border-2 border-pastel-rose-100">
                   <LogOut size={22}/> Esci Dalla Sessione
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
