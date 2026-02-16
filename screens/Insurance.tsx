
import React, { useState, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { InsurancePolicy } from '../types';
// @fix: Added missing PencilLine and Shield to imports
import { 
  ArrowLeft, Plus, ShieldCheck, X, Calendar, 
  Hash, Building, Banknote, Save, Trash2, 
  AlertCircle, ShieldAlert, Clock, FileText, Info,
  PencilLine, Shield
} from 'lucide-react';

interface InsuranceProps {
  policies: InsurancePolicy[];
  onPoliciesChange: (policies: InsurancePolicy[]) => void;
  onBack: () => void;
  onToggleDock?: (visible: boolean) => void;
}

export const Insurance: React.FC<InsuranceProps> = ({ policies, onPoliciesChange, onBack, onToggleDock }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  const initialFormData: Partial<InsurancePolicy> = {
    company: '',
    policyNumber: '',
    expiryDate: new Date().toISOString().split('T')[0],
    premium: 0,
    coverageDetails: '',
    isActive: true
  };

  const [formData, setFormData] = useState<Partial<InsurancePolicy>>(initialFormData);

  useEffect(() => {
    if (onToggleDock) onToggleDock(!isAdding && !editingPolicy);
    return () => onToggleDock?.(true);
  }, [isAdding, editingPolicy, onToggleDock]);

  const handleSave = () => {
    if (!formData.company || !formData.policyNumber) {
      alert("Inserire Compagnia e Numero Polizza.");
      return;
    }

    const policyToSave = {
      ...initialFormData,
      ...formData,
      id: editingPolicy?.id || Math.random().toString(36).substr(2, 9)
    } as InsurancePolicy;

    if (editingPolicy) {
      onPoliciesChange(policies.map(p => p.id === editingPolicy.id ? policyToSave : p));
    } else {
      // Quando salviamo una nuova polizza, impostiamo le altre come non attive se questa lo è
      const updatedPolicies = policyToSave.isActive 
        ? policies.map(p => ({ ...p, isActive: false })).concat(policyToSave)
        : [...policies, policyToSave];
      onPoliciesChange(updatedPolicies);
    }

    setIsAdding(false);
    setEditingPolicy(null);
    setFormData(initialFormData);
  };

  const handleDelete = (id: string) => {
    if (confirm("Eliminare definitivamente i dati della polizza?")) {
      onPoliciesChange(policies.filter(p => p.id !== id));
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const expiry = new Date(dateStr);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 uppercase text-[10px] tracking-widest transition-all hover:translate-x-[-4px]">
        <ArrowLeft size={18} /><span>Indietro</span>
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Assicurazione</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Gestione Polizza Fabbricato Globale</p>
        </div>
        <button 
          onClick={() => { setFormData(initialFormData); setIsAdding(true); }}
          className="m3-button bg-indigo-600 text-white flex items-center justify-center gap-2 text-[10px] py-4 shadow-xl active:scale-95"
        >
          <Plus size={20} /> AGGIUNGI POLIZZA
        </button>
      </div>

      {policies.length === 0 && !isAdding ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800">
           <ShieldCheck size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
           <p className="text-xs font-black text-slate-400 uppercase">Nessuna polizza registrata</p>
        </div>
      ) : (
        <div className="space-y-6">
          {policies.sort((a, b) => b.isActive ? 1 : -1).map(policy => {
            const daysLeft = getDaysRemaining(policy.expiryDate);
            const isExpiring = daysLeft > 0 && daysLeft < 30;
            const isExpired = daysLeft <= 0;

            return (
              <MaterialCard key={policy.id} className={`border-2 transition-all overflow-hidden ${policy.isActive ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-slate-50 opacity-60'}`}>
                <div className="flex flex-col lg:flex-row justify-between gap-8">
                   <div className="flex gap-6 flex-1">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-inner ${isExpired ? 'bg-rose-50 text-rose-600' : isExpiring ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {isExpired ? <ShieldAlert size={32}/> : <ShieldCheck size={32}/>}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-black text-slate-900 dark:text-white uppercase text-lg leading-tight">{policy.company}</h4>
                            {policy.isActive && (
                               <span className="bg-emerald-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase">ATTIVA</span>
                            )}
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            <div>
                               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">N. POLIZZA</p>
                               <p className="text-sm font-black text-slate-700 dark:text-slate-300">{policy.policyNumber}</p>
                            </div>
                            <div>
                               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">SCADENZA</p>
                               <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-indigo-500" />
                                  <p className={`text-sm font-black ${isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {new Date(policy.expiryDate).toLocaleDateString('it-IT')}
                                  </p>
                               </div>
                            </div>
                            <div>
                               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">PREMIO ANNUO</p>
                               <p className="text-sm font-black text-emerald-600">€ {policy.premium.toLocaleString('it-IT')}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-50 dark:border-slate-800 pt-4 lg:pt-0">
                      <div className="text-right">
                         <p className={`text-xs font-black uppercase ${isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-slate-400'}`}>
                            {isExpired ? 'CONTRATTO SCADUTO' : isExpiring ? `${daysLeft} GIORNI AL RINNOVO` : 'COPERTURA VALIDA'}
                         </p>
                         <p className="text-[7px] font-bold text-slate-300 uppercase mt-1">Stato Polizza Fabbricato</p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => { setEditingPolicy(policy); setFormData(policy); }} className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all shadow-sm"><PencilLine size={20}/></button>
                         <button onClick={() => handleDelete(policy.id)} className="p-3 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all shadow-sm"><Trash2 size={20}/></button>
                      </div>
                   </div>
                </div>
                
                {policy.coverageDetails && (
                   <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[28px] border border-slate-100 dark:border-slate-800">
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText size={14}/> Note & Massimali</h5>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed uppercase">{policy.coverageDetails}</p>
                   </div>
                )}
              </MaterialCard>
            );
          })}
        </div>
      )}

      {(isAdding || editingPolicy) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[300] flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] sm:rounded-[44px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg"><ShieldCheck size={22}/></div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingPolicy ? 'Aggiorna Dati Polizza' : 'Nuova Polizza'}</h3>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingPolicy(null); }} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X size={24}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Compagnia Assicuratrice</label>
                      <input 
                        type="text" 
                        value={formData.company} 
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-5 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" 
                        placeholder="ES: GENERALI, ALLIANZ, UNIPOL"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">N. Polizza</label>
                      <input 
                        type="text" 
                        value={formData.policyNumber} 
                        onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-5 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" 
                        placeholder="CODICE IDENTIFICATIVO"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Scadenza</label>
                      <input 
                        type="date" 
                        value={formData.expiryDate} 
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-5 font-black text-base outline-none focus:border-indigo-500 dark:text-white" 
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Premio Annuo (€)</label>
                      <div className="relative">
                         <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-600">€</span>
                         <input 
                           type="number" step="0.01"
                           value={formData.premium || ''} 
                           onChange={(e) => setFormData({...formData, premium: parseFloat(e.target.value) || 0})}
                           className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-5 font-black text-base outline-none focus:border-indigo-500 dark:text-white" 
                           placeholder="0.00"
                         />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Imposta come Attiva</label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${formData.isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                         {formData.isActive ? <ShieldCheck size={18}/> : <ShieldOff size={18}/>}
                         {formData.isActive ? 'POLIZZA CORRENTE' : 'ARCHIVIO / STORICO'}
                      </button>
                   </div>
                   <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dettagli Copertura / Massimali</label>
                      <textarea 
                        value={formData.coverageDetails} 
                        onChange={(e) => setFormData({...formData, coverageDetails: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-6 py-5 font-black text-xs outline-none focus:border-indigo-500 dark:text-white uppercase h-32 resize-none" 
                        placeholder="ES: RC PROPRIETÀ 10MLN, DANNI ACQUA 50K, INCENDIO..."
                      />
                   </div>
                </div>
             </div>

             <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row gap-4">
                <button onClick={() => { setIsAdding(false); setEditingPolicy(null); }} className="order-2 sm:order-1 flex-1 py-5 rounded-[28px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest">ANNULLA</button>
                <button onClick={handleSave} className="order-1 sm:order-2 flex-[2] py-5 rounded-[28px] bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <Save size={20}/> SALVA DATI POLIZZA
                </button>
             </div>
          </div>
        </div>
      )}
      
      <div className="mt-12 bg-indigo-50 dark:bg-indigo-950/20 rounded-[40px] p-8 flex gap-6 border border-indigo-100 dark:border-indigo-800 relative overflow-hidden shadow-inner mx-1">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] text-indigo-600 dark:text-indigo-400 shadow-sm h-fit">
          <Info size={28} />
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-black text-slate-900 dark:text-white uppercase mb-2">Importanza della Copertura</h4>
          <p className="text-[11px] text-slate-600 dark:text-indigo-300/70 font-bold leading-relaxed uppercase tracking-tight max-w-4xl">
            La Polizza Globale Fabbricato è fondamentale per tutelare il condominio da danni a terzi e rischi comuni. Il sistema monitora costantemente la data di scadenza e genera alert automatici 30 giorni prima della fine del contratto. È consigliabile allegare digitalmente il fascicolo informativo per una rapida consultazione in caso di sinistro.
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente icona mancante
const ShieldOff = ({ size }: { size: number }) => <Shield size={size} className="opacity-40" />;
