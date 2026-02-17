import React, { useState, useEffect, useCallback } from 'react';
import { AppView, Category, Transaction, BankAccount, Unit, MillesimalTable, WaterMeter, WaterReading, TrashItem, InsurancePolicy, CondoRegulation, UserRole } from './types';
import { Home } from './screens/Home';
import { Expenses } from './screens/Expenses';
import Income from './screens/Income';
import { Water } from './screens/Water';
import { Bank } from './screens/Bank';
import { Units } from './screens/Units';
import { Millesimi } from './screens/Millesimi';
import { Budget } from './screens/Budget';
import { Categories } from './screens/Categories';
import { MonthlyQuotas } from './screens/MonthlyQuotas';
import { AdjustmentQuotas } from './screens/AdjustmentQuotas';
import { Trash } from './screens/Trash';
import { Insurance } from './screens/Insurance';
import { Regulation } from './screens/Regulation';
import { Receipts } from './screens/Receipts';
import { Onboarding } from './screens/Onboarding';
import { Model770 } from './screens/Model770';
import { Dock } from './components/Dock';
import { MaterialCard } from './components/MaterialCard';
import { Building2, LogOut, ArrowRight, Loader2, RefreshCcw, Menu } from 'lucide-react';
import { MOCK_CATEGORIES } from './constants';
import { supabase } from './supabase';
import './index.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [viewParams, setViewParams] = useState<any>(null);
  const [condoId, setCondoId] = useState<string | null>(() => localStorage.getItem('activeCondoId'));
  const [condoName, setCondoName] = useState(() => localStorage.getItem('activeCondoName') || '');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || 'CONDOMINO');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(() => localStorage.getItem('activeUnitId'));
  const [tempCondoName, setTempCondoName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [condominoEmail, setCondominoEmail] = useState('');
  const [condominoUnitName, setCondominoUnitName] = useState('');
  const [isAuthModeRegister, setIsAuthModeRegister] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [selectedYear, setSelectedYear] = useState(() => localStorage.getItem('lastSelectedYear') || new Date().getFullYear().toString());
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [millesimalTables, setMillesimalTables] = useState<MillesimalTable[]>([]);
  const [waterMeters, setWaterMeters] = useState<WaterMeter[]>([]);
  const [waterReadings, setWaterReadings] = useState<WaterReading[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile) {
          setUserRole(profile.role as UserRole);
          localStorage.setItem('userRole', profile.role);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!condoId || !condoId.startsWith('DB_')) return;
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `condo_id=eq.${condoId}` }, (payload) => {
      if (payload.eventType === 'INSERT') setTransactions(prev => [...prev, payload.new as Transaction]);
      if (payload.eventType === 'UPDATE') setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
      if (payload.eventType === 'DELETE') setTransactions(prev => prev.filter(t => t.id === payload.old.id));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [condoId]);

  const handleNavigate = useCallback((view: AppView, params: any = null) => {
    setCurrentView(view);
    setViewParams(params);
  }, []);

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    setCondoId(null); 
    localStorage.clear(); 
    window.location.reload(); 
  };

  const handleAccessAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setAccessError(''); setLoading(true);
    try {
      if (isAuthModeRegister) {
        const { error } = await supabase.auth.signUp({ email: adminEmail, password: adminPassword });
        if (error) throw error;
        alert("Controlla l'email!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
        if (error) throw error;
        const id = `DB_${tempCondoName.trim().toUpperCase().replace(/\s+/g, '_')}`;
        setCondoId(id); setCondoName(tempCondoName.toUpperCase());
        localStorage.setItem('activeCondoId', id); localStorage.setItem('activeCondoName', tempCondoName.toUpperCase());
      }
    } catch (err: any) { setAccessError(err.message); } finally { setLoading(false); }
  };

  const handleAccessLocal = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `LOCAL_${tempCondoName.trim().toUpperCase().replace(/\s+/g, '_')}`;
    setCondoId(id); setUserRole('ADMIN'); localStorage.setItem('activeCondoId', id);
  };

  const handleAccessCondomino = async (e: React.FormEvent) => {
    e.preventDefault(); setAccessError(''); setLoading(true);
    try {
      const id = `DB_${tempCondoName.trim().toUpperCase().replace(/\s+/g, '_')}`;
      const { data: unit } = await supabase.from('units').select('*').eq('condo_id', id).ilike('name', condominoUnitName).single();
      if (!unit) throw new Error("Unità non trovata");
      setCondoId(id); setUserRole('CONDOMINO'); setActiveUnitId(unit.id);
      localStorage.setItem('activeUnitId', unit.id); localStorage.setItem('activeCondoId', id);
    } catch (err: any) { setAccessError(err.message); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caricamento...</p>
    </div>
  );

  if (!condoId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <MaterialCard className="max-w-6xl w-full p-8 text-center bg-white dark:bg-slate-900 rounded-[56px] shadow-2xl">
          <Building2 size={64} className="text-indigo-600 mx-auto mb-6" />
          <h1 className="text-4xl font-black uppercase mb-12">DomusLog</h1>
          <div className="max-w-md mx-auto mb-12">
            <input type="text" value={tempCondoName} onChange={(e) => setTempCondoName(e.target.value)} placeholder="NOME CONDOMINIO" className="w-full px-8 py-6 rounded-[32px] border-2 text-center font-black uppercase outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left border-t pt-12">
            <div className="p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border">
              <h2 className="font-black uppercase text-sm mb-4">Prova Locale</h2>
              <form onSubmit={handleAccessLocal}>
                <button type="submit" disabled={!tempCondoName} className="w-full py-4 bg-white border-2 border-indigo-100 rounded-[32px] font-black text-indigo-600 uppercase text-[10px] flex items-center justify-center gap-2">Entra <ArrowRight size={16}/></button>
              </form>
            </div>
            <div className="p-8 bg-indigo-600 rounded-[40px] text-white shadow-xl">
              <h2 className="font-black uppercase text-sm mb-4">Cloud Admin</h2>
              <form onSubmit={handleAccessAdmin} className="space-y-3">
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Email" className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-white" />
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-white" />
                <button type="submit" className="w-full py-4 bg-white text-indigo-600 rounded-[32px] font-black uppercase text-[10px]">{isAuthModeRegister ? 'Registrati' : 'Accedi'}</button>
                <button type="button" onClick={() => setIsAuthModeRegister(!isAuthModeRegister)} className="w-full text-[8px] uppercase opacity-70">Switch Login/Register</button>
              </form>
            </div>
            <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[40px] border border-emerald-100">
              <h2 className="font-black uppercase text-sm text-emerald-600 mb-4">Area Condomino</h2>
              <form onSubmit={handleAccessCondomino} className="space-y-3">
                <input type="email" value={condominoEmail} onChange={e => setCondominoEmail(e.target.value)} placeholder="Tua Email" className="w-full p-4 rounded-2xl border text-xs" />
                <input type="text" value={condominoUnitName} onChange={e => setCondominoUnitName(e.target.value)} placeholder="Unità (es. Int. 1)" className="w-full p-4 rounded-2xl border text-xs uppercase" />
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-[32px] font-black uppercase text-[10px]">Entra <ArrowRight size={16}/></button>
              </form>
            </div>
          </div>
          {accessError && <p className="mt-4 text-rose-500 font-bold uppercase text-[10px]">{accessError}</p>}
        </MaterialCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="container mx-auto px-4 pt-8 pb-32">
        {(() => {
          switch (currentView) {
            case AppView.HOME: return <Home condoName={condoName} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories} transactions={transactions} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units} insurancePolicies={insurancePolicies} onNameChange={(name) => setCondoName(name)} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.EXPENSES: return <Expenses onBack={() => setCurrentView(AppView.HOME)} categories={categories} transactions={transactions} onTransactionsChange={setTransactions} millesimalTables={millesimalTables} bankAccounts={bankAccounts} units={units} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.BUDGET: return <Budget onBack={() => setCurrentView(AppView.HOME)} transactions={transactions} units={units} categories={categories} tables={millesimalTables} selectedYear={selectedYear} waterReadings={waterReadings} waterMeters={waterMeters} isDarkMode={isDarkMode} condoId={condoId} condoName={condoName} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.MODEL_770: return <Model770 onBack={() => setCurrentView(AppView.HOME)} selectedYear={selectedYear} transactions={transactions} condoName={condoName} />;
            default: return <Home condoName={condoName} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories} transactions={transactions} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units} insurancePolicies={insurancePolicies} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
          }
        })()}
      </main>
      <Dock currentView={currentView} onViewChange={handleNavigate} userRole={userRole} />
      {isSyncing && (
        <div className="fixed bottom-24 right-6 bg-slate-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase flex items-center gap-2 animate-pulse shadow-xl z-50">
          <RefreshCcw size={12} className="animate-spin" /> Sync Cloud...
        </div>
      )}
    </div>
  );
};

export default App;