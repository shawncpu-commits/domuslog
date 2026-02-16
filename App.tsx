import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Building, LogOut, ArrowRight, Loader2, UserCircle2, Mail, Building2, Lock, Smartphone, Globe, Home as HomeIcon, RefreshCcw } from 'lucide-react';
import { MOCK_CATEGORIES } from './constants';
import { supabase } from './supabase';
import { calculateTransactionSplit } from './services/calculatorService';
import './index.css';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [viewParams, setViewParams] = useState<any>(null);
  
  const [condoId, setCondoId] = useState<string | null>(() => localStorage.getItem('activeCondoId'));
  const [condoName, setCondoName] = useState(() => localStorage.getItem('activeCondoName') || '');
  
  const [tempCondoName, setTempCondoName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [condominoEmail, setCondominoEmail] = useState('');
  const [condominoUnitName, setCondominoUnitName] = useState('');
  const [isAuthModeRegister, setIsAuthModeRegister] = useState(false);
  const [accessError, setAccessError] = useState('');
  
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || 'ADMIN');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(() => localStorage.getItem('activeUnitId'));
  const [activeUnitName, setActiveUnitName] = useState<string | null>(() => localStorage.getItem('activeUnitName'));
  const [user, setUser] = useState<any>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);
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
  const [regulation, setRegulation] = useState<CondoRegulation | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  const handleNavigate = useCallback((view: AppView, params: any = null) => {
    setCurrentView(view);
    setViewParams(params);
  }, []);

  const sortUnitsByFloor = (unitsList: Unit[]) => {
    return [...(unitsList || [])].sort((a, b) => {
      if ((a.floor ?? 0) !== (b.floor ?? 0)) return (a.floor ?? 0) - (b.floor ?? 0);
      const stairA = (a.staircase || '').toUpperCase();
      const stairB = (b.staircase || '').toUpperCase();
      if (stairA !== stairB) return stairA.localeCompare(stairB);
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  };

  useEffect(() => {
    localStorage.setItem('lastSelectedYear', selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    isDarkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!condoId) {
      setIsDataLoaded(false);
      setLoading(false);
      return;
    }

    localStorage.setItem('activeCondoId', condoId);
    localStorage.setItem('activeCondoName', condoName);
    localStorage.setItem('userRole', userRole);

    const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';
    if (!onboardingCompleted && userRole === 'ADMIN') {
        setShowOnboarding(true);
    }

    if (condoId.startsWith('DB_')) {
      const fetchData = async () => {
        setIsSyncing(true);
        try {
          const { data: condoData } = await supabase.from('condos').select('*').eq('id', condoId).single();
          if (condoData) {
            setCondoName(condoData.name);
            setRegulation(condoData.regulation);
          }

          const [cats, bks, unts, tabs, mtrs, trsh, ins] = await Promise.all([
            supabase.from('categories').select('*').eq('condo_id', condoId),
            supabase.from('bank_accounts').select('*').eq('condo_id', condoId),
            supabase.from('units').select('*').eq('condo_id', condoId),
            supabase.from('millesimal_tables').select('*').eq('condo_id', condoId).order('order_idx'),
            supabase.from('water_meters').select('*').eq('condo_id', condoId),
            supabase.from('trash').select('*').eq('condo_id', condoId),
            supabase.from('insurance_policies').select('*').eq('condo_id', condoId)
          ]);

          setCategories(cats.data || MOCK_CATEGORIES);
          setBankAccounts(bks.data || []);
          setUnits(sortUnitsByFloor(unts.data || []));
          setMillesimalTables(tabs.data || []);
          setWaterMeters(mtrs.data || []);
          setTrash(trsh.data || []);
          setInsurancePolicies(ins.data || []);

          const [txs, rdgs] = await Promise.all([
            supabase.from('transactions').select('*').eq('condo_id', condoId).eq('year', selectedYear),
            supabase.from('water_readings').select('*').eq('condo_id', condoId).eq('year', selectedYear)
          ]);
          setTransactions(txs.data || []);
          setWaterReadings(rdgs.data || []);

          setIsDataLoaded(true);
        } catch (e) {
          console.error("Errore Fetch Supabase:", e);
        } finally {
          setIsSyncing(false);
        }
      };
      fetchData();
    } else {
      const localDataStr = localStorage.getItem(`condo_data_${condoId}`);
      if (localDataStr) {
        const localData = JSON.parse(localDataStr);
        setCategories(localData.categories || MOCK_CATEGORIES);
        setTransactions((localData.transactions || []).filter((t: any) => t.date && t.date.startsWith(selectedYear)));
        setBankAccounts(localData.bankAccounts || []);
        setUnits(sortUnitsByFloor(localData.units || []));
        setMillesimalTables((localData.millesimalTables || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
        setWaterMeters(localData.waterMeters || []);
        setWaterReadings((localData.waterReadings || []).filter((r: any) => r.date && r.date.startsWith(selectedYear)));
        setTrash(localData.trash || []);
        setInsurancePolicies(localData.insurancePolicies || []);
        setRegulation(localData.regulation || null);
      } else {
        setCategories(MOCK_CATEGORIES);
        setTransactions([]);
        setUnits([]);
        setMillesimalTables([]);
      }
      setIsDataLoaded(true);
    }
  }, [user, condoId, selectedYear, userRole]);

  const filteredTransactions = useMemo(() => {
    if (userRole === 'ADMIN' || !activeUnitId) return transactions || [];
    return (transactions || []).filter(tx => {
      const { unitSplits } = calculateTransactionSplit(tx, millesimalTables || [], units || [], categories || []);
      return unitSplits[activeUnitId] && unitSplits[activeUnitId].amount > 0;
    });
  }, [transactions, userRole, activeUnitId, millesimalTables, units, categories]);

  const syncToStorage = useCallback(async (field: string, newValue: any) => {
    if (!condoId || !isDataLoaded || userRole === 'CONDOMINO') return;
    setIsSyncing(true);
    
    const setters: any = {
      categories: setCategories, transactions: setTransactions,
      bankAccounts: setBankAccounts, units: (val: Unit[]) => setUnits(sortUnitsByFloor(val)),
      millesimalTables: setMillesimalTables, waterMeters: setWaterMeters,
      waterReadings: setWaterReadings, trash: setTrash,
      insurancePolicies: setInsurancePolicies, regulation: setRegulation
    };
    if (setters[field]) setters[field](newValue);

    if (condoId.startsWith('DB_')) {
      try {
        const tableMap: any = { categories: 'categories', transactions: 'transactions', bankAccounts: 'bank_accounts', units: 'units', millesimalTables: 'millesimal_tables', waterMeters: 'water_meters', waterReadings: 'water_readings', trash: 'trash', insurancePolicies: 'insurance_policies' };
        if (field === 'regulation') {
          await supabase.from('condos').update({ regulation: newValue }).eq('id', condoId);
        } else {
          await supabase.from(tableMap[field]).upsert(newValue.map((i: any) => ({ ...i, condo_id: condoId, year: (field === 'transactions' || field === 'waterReadings') ? selectedYear : undefined })));
        }
      } catch (e) { console.error("Sync Supabase Fallito:", e); }
    } else {
      const localDataStr = localStorage.getItem(`condo_data_${condoId}`);
      const localData = localDataStr ? JSON.parse(localDataStr) : {};
      localData[field] = newValue;
      localStorage.setItem(`condo_data_${condoId}`, JSON.stringify(localData));
    }
    setTimeout(() => setIsSyncing(false), 500);
  }, [condoId, isDataLoaded, selectedYear, userRole]);

  const handleLogout = async () => {
    if (condoId?.startsWith('DB_')) {
      await supabase.auth.signOut();
    }
    setCondoId(null);
    localStorage.removeItem('activeCondoId');
    localStorage.removeItem('activeUnitId');
    localStorage.removeItem('activeUnitName');
  };

  const handleAccessAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCondoName.trim() || !adminEmail.trim() || !adminPassword.trim()) return;
    setAccessError('');
    setLoading(true);
    try {
      if (isAuthModeRegister) {
        const { error } = await supabase.auth.signUp({ email: adminEmail, password: adminPassword });
        if (error) throw error;
        alert("Account creato. Accedi ora.");
        setIsAuthModeRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
        if (error) throw error;
        const name = tempCondoName.trim().toUpperCase();
        const id = `DB_${name.replace(/\s+/g, '_')}`;
        const { data: condo } = await supabase.from('condos').select('*').eq('id', id).single();
        if (!condo) {
          await supabase.from('condos').insert({ id, name, owner_id: (await supabase.auth.getUser()).data.user?.id });
          await supabase.from('categories').insert(MOCK_CATEGORIES.map(c => ({ ...c, condo_id: id })));
        }
        setCondoId(id);
        setCondoName(name);
        setUserRole('ADMIN');
      }
    } catch (err: any) { setAccessError(err.message || 'Errore di autenticazione.'); } finally { setLoading(false); }
  };

  const handleAccessLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCondoName.trim()) return;
    const name = tempCondoName.trim().toUpperCase();
    const id = `LOCAL_${name.replace(/\s+/g, '_')}`;
    setCondoId(id);
    setCondoName(name);
    setUserRole('ADMIN');
    localStorage.setItem('activeCondoId', id);
    localStorage.setItem('activeCondoName', name);
    localStorage.setItem('userRole', 'ADMIN');
  };

  const handleAccessCondomino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCondoName.trim() || !condominoEmail.trim() || !condominoUnitName.trim()) return;
    setAccessError('');
    setLoading(true);
    try {
      const name = tempCondoName.trim().toUpperCase();
      const id = `DB_${name.replace(/\s+/g, '_')}`;
      const { data: unitData, error } = await supabase.from('units').select('*').eq('condo_id', id).ilike('name', condominoUnitName.trim());
      if (error || !unitData || unitData.length === 0) {
        setAccessError("Identificativo Unità non trovato in questo condominio.");
        setLoading(false);
        return;
      }
      const matchingUnit = unitData[0];
      setCondoId(id);
      setCondoName(name);
      setUserRole('CONDOMINO');
      setActiveUnitId(matchingUnit.id);
      setActiveUnitName(matchingUnit.name);
      localStorage.setItem('activeUnitId', matchingUnit.id);
      localStorage.setItem('activeUnitName', matchingUnit.name);
    } catch (e) { setAccessError("Errore durante il recupero dei dati dell'unità."); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inizializzazione Sistema...</p>
    </div>
  );

  if (!condoId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
        <MaterialCard className="max-w-6xl w-full p-8 sm:p-14 text-center border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[56px] animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
          <div className="relative z-10">
            <Building2 size={64} className="text-indigo-600 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase mb-1 tracking-tighter leading-none">DomusLog</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Universal Condo Management</p>
            <div className="max-w-md mx-auto mb-16 space-y-4">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-2 block text-center">NOME DEL CONDOMINIO</label>
              <input type="text" value={tempCondoName} onChange={(e) => setTempCondoName(e.target.value)} placeholder="Inserisci il nome per iniziare" className="w-full px-8 py-6 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black uppercase text-lg outline-none focus:border-indigo-500 transition-all text-center shadow-inner" />
            </div>
            {accessError && <div className="max-w-md mx-auto mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase border border-rose-100">{accessError}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-left border-t border-slate-100 dark:border-slate-800 pt-12">
              <div className="space-y-6 bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Smartphone size={24}/></div>
                  <h2 className="font-black uppercase text-sm text-slate-900 dark:text-white">Prova Locale</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-tight">I dati restano nel tuo browser. Ideale per test o gestione offline senza account.</p>
                <form onSubmit={handleAccessLocal}>
                   <button type="submit" disabled={!tempCondoName.trim()} className="w-full py-5 bg-white dark:bg-slate-900 text-indigo-600 border-2 border-indigo-100 dark:border-indigo-800 rounded-[32px] font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-30">Entra in Locale <ArrowRight size={18} /></button>
                </form>
              </div>
              <div className="space-y-6 bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-2 relative z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white"><Globe size={24}/></div>
                  <h2 className="font-black uppercase text-sm">Cloud Admin</h2>
                </div>
                <form onSubmit={handleAccessAdmin} className="space-y-4 relative z-10">
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Email" className="w-full pl-11 pr-5 py-4 rounded-2xl bg-white/10 border border-white/20 font-black text-xs outline-none focus:bg-white/20 text-white placeholder:text-white/40" />
                   </div>
                   <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                      <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password" className="w-full pl-11 pr-5 py-4 rounded-2xl bg-white/10 border border-white/20 font-black text-xs outline-none focus:bg-white/20 text-white placeholder:text-white/40" />
                   </div>
                   <button type="submit" disabled={!tempCondoName.trim()} className="w-full py-5 bg-white text-indigo-600 rounded-[32px] font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-30">{isAuthModeRegister ? 'Crea Account' : 'Accedi Cloud'} <ArrowRight size={18} /></button>
                   <button type="button" onClick={() => setIsAuthModeRegister(!isAuthModeRegister)} className="w-full text-[8px] font-black text-white/70 uppercase hover:text-white">{isAuthModeRegister ? 'Hai già un account? Accedi' : 'Nuovo Amministratore? Registrati'}</button>
                </form>
                <div className="absolute right-0 top-0 p-4 opacity-10"><Globe size={120}/></div>
              </div>
              <div className="space-y-6 bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><UserCircle2 size={24}/></div>
                  <h2 className="font-black uppercase text-sm text-slate-900 dark:text-white">Area Condomino</h2>
                </div>
                <form onSubmit={handleAccessCondomino} className="space-y-4">
                   <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="email" value={condominoEmail} onChange={e => setCondominoEmail(e.target.value)} placeholder="Tua Email" className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-xs outline-none focus:border-emerald-500 dark:text-white shadow-sm" />
                   </div>
                   <div className="relative">
                      <HomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" value={condominoUnitName} onChange={e => setCondominoUnitName(e.target.value)} placeholder="Unità (es. Int. 1)" className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-950 font-black text-xs outline-none focus:border-emerald-500 dark:text-white uppercase shadow-sm" />
                   </div>
                   <button type="submit" disabled={!tempCondoName.trim() || !condominoEmail.trim() || !condominoUnitName.trim()} className="w-full py-5 bg-emerald-600 text-white rounded-[32px] font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-30">Entra <ArrowRight size={18} /></button>
                </form>
              </div>
            </div>
          </div>
        </MaterialCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <main className="container mx-auto px-4 pt-8 pb-32">
        {(() => {
          switch (currentView) {
            case AppView.HOME: return <Home condoName={condoName || ''} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories || []} transactions={filteredTransactions || []} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units || []} insurancePolicies={insurancePolicies || []} onNameChange={async (name) => { setCondoName(name); if(condoId?.startsWith('DB_')) await supabase.from('condos').update({name}).eq('id', condoId); }} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.INCOME: return <Income onBack={() => setCurrentView(AppView.HOME)} categories={categories || []} transactions={filteredTransactions || []} onTransactionsChange={(tx) => syncToStorage('transactions', tx)} bankAccounts={bankAccounts || []} units={units || []} millesimalTables={millesimalTables || []} userRole={userRole} />;
            case AppView.EXPENSES: return <Expenses onBack={() => setCurrentView(AppView.HOME)} categories={categories || []} transactions={filteredTransactions || []} onTransactionsChange={(tx) => syncToStorage('transactions', tx)} millesimalTables={millesimalTables || []} bankAccounts={bankAccounts || []} units={units || []} initialFilters={viewParams} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.UNITS: return <Units units={units || []} onUnitsChange={(u) => syncToStorage('units', u)} categories={categories || []} onBack={() => setCurrentView(AppView.HOME)} transactions={transactions || []} userRole={userRole} />;
            case AppView.WATER: return <Water onBack={() => setCurrentView(AppView.HOME)} units={units || []} meters={waterMeters || []} readings={waterReadings || []} onMetersChange={(m) => syncToStorage('waterMeters', m)} onReadingsChange={(r) => syncToStorage('waterReadings', r)} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.BANK: return <Bank onBack={() => setCurrentView(AppView.HOME)} bankAccounts={bankAccounts || []} onBankAccountsChange={(b) => syncToStorage('bankAccounts', b)} transactions={transactions || []} />;
            case AppView.MILLESIMI: return <Millesimi tables={millesimalTables || []} onTablesChange={(t) => syncToStorage('millesimalTables', t)} onBack={() => setCurrentView(AppView.HOME)} units={units || []} categories={categories || []} transactions={transactions || []} />;
            case AppView.BUDGET: return <Budget onBack={() => setCurrentView(AppView.HOME)} transactions={filteredTransactions || []} units={units || []} categories={categories || []} tables={millesimalTables || []} selectedYear={selectedYear} waterReadings={waterReadings || []} waterMeters={waterMeters || []} isDarkMode={isDarkMode} condoId={condoId} condoName={condoName || ''} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.CATEGORIES: return <Categories categories={categories || []} onCategoriesChange={(cats) => syncToStorage('categories', cats)} onBack={() => setCurrentView(AppView.HOME)} />;
            case AppView.MONTHLY_QUOTAS: return <MonthlyQuotas categories={categories || []} onCategoriesChange={(cats) => syncToStorage('categories', cats)} onBack={() => setCurrentView(AppView.HOME)} />;
            case AppView.ADJUSTMENT_QUOTAS: return <AdjustmentQuotas categories={categories || []} onCategoriesChange={(cats) => syncToStorage('categories', cats)} onBack={() => setCurrentView(AppView.HOME)} />;
            case AppView.RECEIPTS: return <Receipts onBack={() => setCurrentView(AppView.HOME)} units={units || []} categories={categories || []} transactions={transactions || []} onTransactionsChange={(tx) => syncToStorage('transactions', tx)} bankAccounts={bankAccounts || []} condoName={condoName || ''} userRole={userRole} />;
            case AppView.TRASH: return <Trash trash={trash || []} onTrashChange={(t) => syncToStorage('trash', t)} transactions={transactions || []} onTransactionsChange={(tx) => syncToStorage('transactions', tx)} units={units || []} onUnitsChange={(u) => syncToStorage('units', u)} onBack={() => setCurrentView(AppView.HOME)} />;
            case AppView.INSURANCE: return <Insurance policies={insurancePolicies || []} onPoliciesChange={(p) => syncToStorage('insurancePolicies', p)} onBack={() => setCurrentView(AppView.HOME)} />;
            case AppView.REGULATION: return <Regulation regulation={regulation} onRegulationChange={(reg) => syncToStorage('regulation', reg)} onBack={() => setCurrentView(AppView.HOME)} />;
            case AppView.MODEL_770: return <Model770 onBack={() => setCurrentView(AppView.HOME)} selectedYear={selectedYear} transactions={transactions || []} condoName={condoName || ''} />;
            default: return <Home condoName={condoName || ''} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories || []} transactions={filteredTransactions || []} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units || []} insurancePolicies={insurancePolicies || []} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
          }
        })()}
      </main>
      <div className="no-print"><Dock currentView={currentView} onViewChange={handleNavigate} userRole={userRole} /></div>
      {isSyncing && <div className="fixed bottom-24 right-6 bg-slate-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase flex items-center gap-2 shadow-2xl animate-pulse z-[200]"><RefreshCcw size={12} className="animate-spin" /> {condoId?.startsWith('DB_') ? 'Sync Cloud...' : 'Salvataggio Locale...'}</div>}
    </div>
  );
};

export default App;