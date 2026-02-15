
import React, { useState } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Building, ArrowRight, Loader2, Mail, Lock, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../supabase';

export const AuthScreen: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        const { error } = await (supabase.auth as any).signUp({ email, password });
        if (error) throw error;
        alert("Registrazione effettuata! Controlla la tua email per confermare l'account (se richiesto dalla configurazione Supabase) o accedi direttamente.");
        setIsRegistering(false);
      } else {
        const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Errore durante l\'accesso. Verifica le credenziali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
      <MaterialCard className="max-w-md w-full p-8 md:p-10 text-center shadow-2xl relative overflow-hidden border-none bg-white dark:bg-slate-900 rounded-[48px]">
        <div className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Building size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">
          {isRegistering ? 'Crea Account' : 'Accedi'}
        </h1>
        <p className="text-slate-500 mb-8 font-black uppercase text-[10px] tracking-widest">DomusLog Gestione Cloud</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <AlertCircle size={18} />
            <p className="text-[10px] font-black uppercase text-left">{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@dominio.it" 
                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 outline-none text-sm font-black transition-all" 
              />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500 outline-none text-sm font-black transition-all" 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-widest mt-4 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-600/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : isRegistering ? <><UserPlus size={20} /> REGISTRATI</> : <><LogIn size={20} /> ACCEDI</>}
          </button>
        </form>

        <button 
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          className="mt-8 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase hover:underline tracking-widest"
        >
          {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
        </button>
      </MaterialCard>
    </div>
  );
};
