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
import { Model770 } from './screens/Model770';
import { Dock } from './components/Dock';
import { MaterialCard } from './components/MaterialCard';
import { 
  Building2, 
  LogOut, 
  ArrowRight, 
  Loader2, 
  UserCircle2, 
  Mail, 
  Lock, 
  Smartphone, 
  Globe, 
  Home as HomeIcon, 
  RefreshCcw, 
  Menu 
} from 'lucide-react';
import { MOCK_CATEGORIES } from './constants';
import { supabase } from './supabase';
import './index.css';

const App: React.FC = () => {
  // --- STATI DI SISTEMA ---
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [viewParams, setViewParams] = useState<any>(null);
  
  // --- STATI CONDOMINIO ---
  const [condoId, setCondoId] = useState<string | null>(() => localStorage.getItem('activeCondoId'));
  const [condoName, setCondoName] = useState(() => localStorage.getItem('activeCondoName') || '');
  
  // --- STATI AUTENTICAZIONE E RUOLI ---
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('userRole') as UserRole) || 'CONDOMINO');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(() => localStorage.getItem('activeUnitId'));
  const [activeUnitName, setActiveUnitName] = useState<string | null>(() => localStorage.getItem('activeUnitName'));
  
  // --- STATI LOGIN ---
  const [tempCondoName, setTempCondoName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [condominoEmail, setCondominoEmail] = useState('');
  const [condominoUnitName, setCondominoUnitName] = useState('');
  const [isAuthModeRegister, setIsAuthModeRegister] = useState(false);
  const [accessError, setAccessError] = useState('');

  // --- STATI DATI ---
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

  // --- 1. GESTIONE AUTENTICAZIONE ---
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          const role = profile.role as UserRole;
          setUserRole(role);
          localStorage.setItem('userRole', role);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile) {
          setUserRole(profile.role as UserRole);
          localStorage.setItem('userRole', profile.role);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. SINCRONIZZAZIONE REALTIME ---
  useEffect(() => {
    if (!condoId || !condoId.startsWith('DB_')) return;

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions', 
        filter: `condo_id=eq.${condoId}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') setTransactions(prev => [...prev, payload.new as Transaction]);
        if (payload.eventType === 'UPDATE') setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
        if (payload.eventType === 'DELETE') setTransactions(prev => prev.filter(t => t.id === payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [condoId]);

  // --- 3. LOGICA DI CARICAMENTO DATI ---
  useEffect(() => {
    if (!condoId) {
      setIsDataLoaded(false);
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      if (condoId.startsWith('DB_')) {
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
          setUnits((unts.data || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
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
        } catch (e) { console.error(e); }
      }
      setIsSyncing(false);
    };
    fetchData();
  }, [condoId, selectedYear]);

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

  // --- RENDERING LOGIN ---
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
            <input 
              type="text" 
              value={tempCondoName} 
              onChange={(e) => setTempCondoName(e.target.value)} 
              placeholder="NOME CONDOMINIO" 
              className="w-full px-8 py-6 rounded-[32px] border-2 text-center font-black uppercase outline-none focus:border-indigo-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left border-t pt-12">
            <div className="p-8 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border">
              <h2 className="font-black uppercase text-sm mb-4">Prova Locale</h2>
              <button onClick={() => { setCondoId(`LOCAL_${tempCondoName.toUpperCase()}`); setUserRole('ADMIN'); }} disabled={!tempCondoName} className="w-full py-4 bg-white border-2 border-indigo-100 rounded-[32px] font-black text-indigo-600 uppercase text-[10px] flex items-center justify-center gap-2">Entra <ArrowRight size={16}/></button>
            </div>

            <div className="p-8 bg-indigo-600 rounded-[40px] text-white shadow-xl">
              <h2 className="font-black uppercase text-sm mb-4">Cloud Admin</h2>
              <div className="space-y-3">
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Email" className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-white" />
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Password" className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-white" />
                <button onClick={async () => {
                  const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
                  if (!error) setCondoId(`DB_${tempCondoName.toUpperCase()}`);
                }} className="w-full py-4 bg-white text-indigo-600 rounded-[32px] font-black uppercase text-[10px]">Accedi</button>
              </div>
            </div>

            <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[40px] border border-emerald-100">
              <h2 className="font-black uppercase text-sm text-emerald-600 mb-4">Area Condomino</h2>
              <div className="space-y-3">
                <input type="text" value={condominoUnitName} onChange={e => setCondominoUnitName(e.target.value)} placeholder="Unità (es. Int. 1)" className="w-full p-4 rounded-2xl border text-xs uppercase" />
                <button onClick={() => { setCondoId(`DB_${tempCondoName.toUpperCase()}`); setUserRole('CONDOMINO'); }} className="w-full py-4 bg-emerald-600 text-white rounded-[32px] font-black uppercase text-[10px]">Entra</button>
              </div>
            </div>
          </div>
        </MaterialCard>
      </div>
    );
  }

  // --- RENDERING APP ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="container mx-auto px-4 pt-8 pb-32">
        {(() => {
          switch (currentView) {
            case AppView.HOME: 
              return <Home condoName={condoName} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories} transactions={transactions} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units} insurancePolicies={insurancePolicies} onNameChange={(name) => setCondoName(name)} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.EXPENSES: 
              return <Expenses onBack={() => setCurrentView(AppView.HOME)} categories={categories} transactions={transactions} onTransactionsChange={setTransactions} millesimalTables={millesimalTables} bankAccounts={bankAccounts} units={units} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.INCOME:
              return <Income onBack={() => setCurrentView(AppView.HOME)} transactions={transactions} onTransactionsChange={setTransactions} units={units} categories={categories} bankAccounts={bankAccounts} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.WATER:
              return <Water onBack={() => setCurrentView(AppView.HOME)} meters={waterMeters} readings={waterReadings} units={units} selectedYear={selectedYear} userRole={userRole} />;
            case AppView.UNITS:
              return <Units onBack={() => setCurrentView(AppView.HOME)} units={units} onUnitsChange={setUnits} userRole={userRole} />;
            case AppView.BUDGET: 
              return <Budget onBack={() => setCurrentView(AppView.HOME)} transactions={transactions} units={units} categories={categories} tables={millesimalTables} selectedYear={selectedYear} waterReadings={waterReadings} waterMeters={waterMeters} isDarkMode={isDarkMode} condoId={condoId} condoName={condoName} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.MODEL_770: 
              return <Model770 onBack={() => setCurrentView(AppView.HOME)} selectedYear={selectedYear} transactions={transactions} condoName={condoName} />;
            default: 
              return <Home condoName={condoName} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate}