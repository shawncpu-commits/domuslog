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
  
  // --- STATI LOGIN ---
  const [tempCondoName, setTempCondoName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [condominoUnitName, setCondominoUnitName] = useState('');
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
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // 1. Inizializzazione Auth
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

  // 2. Realtime Sync
  useEffect(() => {
    if (!condoId || !condoId.startsWith('DB_')) return;
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `condo_id=eq.${condoId}` }, (payload) => {
      if (payload.eventType === 'INSERT') setTransactions(prev => [...prev, payload.new as Transaction]);
      if (payload.eventType === 'UPDATE') setTransactions(prev => prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t));
      if (payload.eventType === 'DELETE') setTransactions(prev => prev.filter(t => t.id === payload.old.id));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [condoId]);

  // 3. Caricamento Dati
  useEffect(() => {
    if (!condoId) return;
    const fetchData = async () => {
      setIsSyncing(true);
      if (condoId.startsWith('DB_')) {
        try {
          const [cats, bks, unts, tabs, txs] = await Promise.all([
            supabase.from('categories').select('*').eq('condo_id', condoId),
            supabase.from('bank_accounts').select('*').eq('condo_id', condoId),
            supabase.from('units').select('*').eq('condo_id', condoId),
            supabase.from('millesimal_tables').select('*').eq('condo_id', condoId),
            supabase.from('transactions').select('*').eq('condo_id', condoId).eq('year', selectedYear)
          ]);
          setCategories(cats.data || MOCK_CATEGORIES);
          setBankAccounts(bks.data || []);
          setUnits(unts.data || []);
          setMillesimalTables(tabs.data || []);
          setTransactions(txs.data || []);
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
    localStorage.clear();
    window.location.reload();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  if (!condoId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <MaterialCard className="max-w-md w-full p-8 text-center bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl">
          <Building2 size={48} className="text-indigo-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase mb-8">DomusLog</h1>
          <input 
            type="text" value={tempCondoName} onChange={(e) => setTempCondoName(e.target.value)} 
            placeholder="NOME CONDOMINIO" className="w-full p-4 rounded-2xl border mb-4 text-center font-bold" 
          />
          <button 
            onClick={() => { setCondoId(`LOCAL_${tempCondoName.toUpperCase()}`); setUserRole('ADMIN'); }}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase text-xs"
          >
            Entra Localmente
          </button>
        </MaterialCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <main className="container mx-auto px-4 pt-8 pb-32">
        {(() => {
          switch (currentView) {
            case AppView.HOME: 
              return <Home condoName={condoName} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories} transactions={transactions} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units} insurancePolicies={insurancePolicies} onNameChange={setCondoName} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.EXPENSES: 
              return <Expenses onBack={() => setCurrentView(AppView.HOME)} categories={categories} transactions={transactions} onTransactionsChange={setTransactions} millesimalTables={millesimalTables} bankAccounts={bankAccounts} units={units} userRole={userRole} activeUnitId={activeUnitId} />;
            case AppView.MODEL_770: 
              return <Model770 onBack={() => setCurrentView(AppView.HOME)} selectedYear={selectedYear} transactions={transactions} condoName={condoName} />;
            default: 
              return <Home condoName={condoName} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleNavigate} categories={categories} transactions={transactions} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} units={units} insurancePolicies={insurancePolicies} onCloseCondo={handleLogout} userRole={userRole} activeUnitId={activeUnitId} />;
          }
        })()}
      </main>

      <Dock currentView={currentView} onViewChange={handleNavigate} userRole={userRole} />

      {isSyncing && (
        <div className="fixed bottom-24 right-6 bg-slate-900 text-white px-4 py-2 rounded-full text-[8px] font-black uppercase flex items-center gap-2 animate-pulse">
          <RefreshCcw size={12} className="animate-spin" /> Sync...
        </div>
      )}
    </div>
  );
};

export default App;