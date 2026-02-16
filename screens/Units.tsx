
import React, { useState, useMemo, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Unit, Category, Transaction, ContactInfo, CategoryDistribution, UserRole } from '../types';
import { 
  ArrowLeft, Plus, Trash2, PencilLine, Building2, 
  User, Check, X, Search, MapPin, AlertCircle, 
  Wallet, Calendar, TrendingDown, TrendingUp, 
  Percent, Clock, Scale, Mail, Phone, PlusCircle, MinusCircle,
  Hash, Layers, ListOrdered, Smartphone, AtSign, UserCog,
  UserCheck, ShieldCheck, ArrowDownAZ, UserPlus, CreditCard,
  Settings2, Info, Users, CalendarDays, AlertTriangle, Euro,
  Copy
} from 'lucide-react';

interface UnitsProps {
  units: Unit[];
  onUnitsChange: (units: Unit[]) => void;
  categories: Category[];
  onBack: () => void;
  onToggleDock?: (boolean: boolean) => void;
  transactions: Transaction[];
  onSoftDelete?: (type: 'UNIT', item: any) => void;
  userRole?: UserRole;
}

const getUniqueColorByIndex = (index: number) => {
  const hue = (index * 137.508) % 360;
  return {
    bg: `hsla(${hue}, 95%, 96%, 1)`,      // Più saturo, leggermente più scuro
    border: `hsla(${hue}, 75%, 85%, 1)`,  // Bordo più definito
    accent: `hsla(${hue}, 80%, 40%, 1)`,  // Accento più vibrante
    muted: `hsla(${hue}, 50%, 55%, 1)`
  };
};

export const Units: React.FC<UnitsProps> = ({ units, onUnitsChange, categories, onBack, onToggleDock, transactions, onSoftDelete, userRole = 'ADMIN' }) => {
  const isAdmin = userRole === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [activeTab, setActiveTab] = useState<'ANAGRAFICA' | 'CONTATTI' | 'RIPARTO' | 'SALDI'>('ANAGRAFICA');

  useEffect(() => {
    if (onToggleDock) onToggleDock(!isAdding && !editingUnit);
    return () => onToggleDock?.(true);
  }, [isAdding, editingUnit, onToggleDock]);
  
  const initialFormData: Partial<Unit> = {
    name: '', owner: '', tenant: '', staircase: '', floor: 0, civic: '',
    millesimi: 0, phones: [{ label: 'Cellulare', value: '' }], 
    emails: [{ label: 'Email Principale', value: '' }], 
    leaseStartDate: '', monthlyFee: 0, ownerPreviousBalance: 0, tenantPreviousBalance: 0,
    categoryDistributions: [], isActive: true
  };

  const [formData, setFormData] = useState<Partial<Unit>>(initialFormData);

  const handleSave = () => {
    const data = editingUnit || formData;
    if (!data.name?.trim()) return alert("Identificativo unità mancante");
    
    const finalUnit: Unit = { 
      ...(editingUnit ? editingUnit : (initialFormData as Unit)), 
      ...data, 
      id: editingUnit ? editingUnit.id : Math.random().toString(36).substr(2, 9) 
    } as Unit;

    onUnitsChange(editingUnit ? units.map(u => u.id === editingUnit.id ? finalUnit : u) : [...units, finalUnit]);
    setIsAdding(false);
    setEditingUnit(null);
  };

  const handleDuplicate = (e: React.MouseEvent, unit: Unit) => {
    e.stopPropagation();
    const newUnit: Unit = {
      ...unit,
      id: Math.random().toString(36).substr(2, 9),
      name: `${unit.name} (COPIA)`,
    };
    onUnitsChange([...units, newUnit]);
  };

  const handleDelete = (unit: Unit) => {
    if (confirm("Spostare questa unità nel cestino? Tutte le spese associate rimarranno ma non avranno più l'unita collegata.")) {
      if (onSoftDelete) onSoftDelete('UNIT', unit);
      onUnitsChange(units.filter(u => u.id !== unit.id));
    }
  };

  const updateField = (field: keyof Unit, value: any) => {
    if (editingUnit) setEditingUnit({ ...editingUnit, [field]: value });
    else setFormData({ ...formData, [field]: value });
  };

  const addContactRow = (field: 'phones' | 'emails') => {
    const current = (editingUnit ? editingUnit[field] : formData[field]) || [];
    const newRow = { label: field === 'phones' ? 'Telefono' : 'Email', value: '' };
    updateField(field, [...current, newRow]);
  };

  const removeContactRow = (field: 'phones' | 'emails', index: number) => {
    const current = (editingUnit ? editingUnit[field] : formData[field]) || [];
    updateField(field, current.filter((_, i) => i !== index));
  };

  const updateContactRow = (field: 'phones' | 'emails', index: number, subField: 'label' | 'value', value: string) => {
    const current = [...((editingUnit ? editingUnit[field] : formData[field]) || [])];
    current[index] = { ...current[index], [subField]: value };
    updateField(field, current);
  };

  const processedUnits = useMemo(() => {
    return [...units]
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.owner.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (a.floor !== b.floor) return (a.floor ?? 0) - (b.floor ?? 0);
        const stairA = (a.staircase || '').toUpperCase();
        const stairB = (b.staircase || '').toUpperCase();
        if (stairA !== stairB) return stairA.localeCompare(stairB);
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
  }, [units, searchTerm]);

  return (
    <div className="pb-32 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black mb-6 uppercase text-[10px] tracking-widest transition-all hover:translate-x-[-4px]"><ArrowLeft size={18} /><span>Indietro</span></button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Unità</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Anagrafica, Rubrica e Oneri</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="CERCA PER NOME O UNITÀ..." className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-indigo-500 shadow-sm" />
          </div>
          {isAdmin && (
            <button onClick={() => { setFormData(initialFormData); setIsAdding(true); setActiveTab('ANAGRAFICA'); }} className="m3-button bg-indigo-600 text-white flex items-center justify-center gap-2 text-[10px] py-4 shadow-xl">
              <Plus size={22} /> NUOVA UNITÀ
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedUnits.map((unit, index) => {
          const style = getUniqueColorByIndex(index);
          return (
            <div key={unit.id} className="p-6 rounded-[32px] border-2 transition-all hover:shadow-lg cursor-pointer bg-white dark:bg-slate-900 group" style={{ backgroundColor: style.bg, borderColor: style.border }} onClick={() => { if(isAdmin) { setEditingUnit(unit); setActiveTab('ANAGRAFICA'); } }}>
               <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/80 flex flex-col items-center justify-center shadow-sm border border-black/5">
                       <span className="text-[6px] font-black text-slate-400 uppercase leading-none">Piano</span>
                       <span className="text-lg font-black leading-none" style={{ color: style.accent }}>{unit.floor}</span>
                    </div>
                    <div>
                       <h4 className="font-black text-slate-900 uppercase text-sm mb-1 leading-tight">{unit.name}</h4>
                       <p className="text-[9px] font-bold text-slate-500 uppercase">{unit.owner}</p>
                    </div>
                  </div>
                  <div className="bg-white/90 px-3 py-1.5 rounded-xl shadow-sm border border-black/5 flex flex-col items-end">
                     <span className="text-[6px] font-black text-slate-400 uppercase leading-none mb-1">Quota Mensile</span>
                     <span className="text-xs font-black text-emerald-600">€ {unit.monthlyFee || 0}</span>
                  </div>
               </div>
               
               <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {unit.phones && unit.phones.some(p => p.value) && <div className="p-2 bg-white/60 rounded-xl text-slate-400"><Phone size={12}/></div>}
                    {unit.emails && unit.emails.some(e => e.value) && <div className="p-2 bg-white/60 rounded-xl text-slate-400"><Mail size={12}/></div>}
                    {unit.tenant && <div className="p-2 bg-white/60 rounded-xl text-indigo-500 font-bold"><UserCog size={12}/></div>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={(e) => handleDuplicate(e, unit)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white/60 rounded-xl shadow-sm border border-black/5" title="Duplica"><Copy size={16}/></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(unit); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors bg-white/60 rounded-xl shadow-sm border border-black/5"><Trash2 size={16}/></button>
                    </div>
                  )}
               </div>
            </div>
          );
        })}
      </div>

      {(isAdding || editingUnit) && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[92vh] sm:rounded-[40px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg"><Building2 size={22} /></div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingUnit ? 'Gestione Unità' : 'Nuova Anagrafica'}</h3>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingUnit(null); }} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X size={24}/></button>
             </div>
             
             <div className="flex bg-slate-50 dark:bg-slate-800/40 px-4 sm:px-6 overflow-x-auto whitespace-nowrap shrink-0 custom-scrollbar border-b border-slate-100 dark:border-slate-800 no-scrollbar">
                {[
                  { id: 'ANAGRAFICA', label: 'Dati Base', icon: <Building2 size={14}/> },
                  { id: 'CONTATTI', label: 'Rubrica', icon: <Users size={14}/> },
                  { id: 'RIPARTO', label: 'Deroghe', icon: <Percent size={14}/> },
                  { id: 'SALDI', label: 'Saldi Iniziali', icon: <Wallet size={14}/> }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
             </div>

             <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
                {activeTab === 'ANAGRAFICA' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identificativo Unità</label>
                      <input type="text" value={editingUnit?.name || formData.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" placeholder="ES: INTERNO 1" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Proprietario Corrente</label>
                      <input type="text" value={editingUnit?.owner || formData.owner} onChange={e => updateField('owner', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" placeholder="NOME E COGNOME" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Inquilino / Locatario</label>
                      <input type="text" value={editingUnit?.tenant || formData.tenant} onChange={e => updateField('tenant', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" placeholder="NOME E COGNOME (OPZIONALE)" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Quota Mensile Ordinaria (€)</label>
                       <div className="relative">
                          <Euro className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                          <input 
                            type="number" step="0.01"
                            value={editingUnit?.monthlyFee ?? formData.monthlyFee} 
                            onChange={e => updateField('monthlyFee', parseFloat(e.target.value) || 0)} 
                            className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl pl-12 pr-6 py-4 font-black text-base outline-none focus:border-emerald-500 dark:text-white" 
                            placeholder="0.00" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Data Inizio Locazione</label>
                      <input type="date" value={editingUnit?.leaseStartDate || formData.leaseStartDate} onChange={e => updateField('leaseStartDate', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Piano</label>
                        <input type="number" value={editingUnit?.floor ?? formData.floor} onChange={e => updateField('floor', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-black text-base outline-none focus:border-indigo-500 dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scala</label>
                        <input type="text" value={editingUnit?.staircase || formData.staircase} onChange={e => updateField('staircase', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 font-black text-base outline-none focus:border-indigo-500 dark:text-white uppercase" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'CONTATTI' && (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                         <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Phone size={16} className="text-indigo-500"/> Recapiti Telefonici</h4>
                         <button onClick={() => addContactRow('phones')} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1.5 rounded-xl"><Plus size={14}/> Aggiungi</button>
                      </div>
                      <div className="space-y-4">
                        {((editingUnit ? editingUnit.phones : formData.phones) || []).map((phone, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <input 
                              type="text" 
                              value={phone.label} 
                              onChange={e => updateContactRow('phones', idx, 'label', e.target.value)}
                              className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 font-black text-[10px] uppercase outline-none focus:border-indigo-500" 
                              placeholder="ETICHETTA (es: Cellulare)" 
                            />
                            <div className="flex-[2] flex gap-2">
                               <input 
                                 type="tel" 
                                 value={phone.value} 
                                 onChange={e => updateContactRow('phones', idx, 'value', e.target.value)}
                                 className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 font-black text-[10px] outline-none focus:border-indigo-500" 
                                 placeholder="+39 000 0000000" 
                               />
                               <button onClick={() => removeContactRow('phones', idx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><MinusCircle size={20}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                         <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Mail size={16} className="text-cyan-500"/> Indirizzi Email</h4>
                         <button onClick={() => addContactRow('emails')} className="text-[9px] font-black text-cyan-600 uppercase flex items-center gap-1.5 bg-cyan-50 dark:bg-cyan-900/40 px-3 py-1.5 rounded-xl"><Plus size={14}/> Aggiungi</button>
                      </div>
                      <div className="space-y-4">
                        {((editingUnit ? editingUnit.emails : formData.emails) || []).map((email, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <input 
                              type="text" 
                              value={email.label} 
                              onChange={e => updateContactRow('emails', idx, 'label', e.target.value)}
                              className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 font-black text-[10px] uppercase outline-none focus:border-indigo-500" 
                              placeholder="ETICHETTA (es: Email)" 
                            />
                            <div className="flex-[2] flex gap-2">
                               <input 
                                 type="email" 
                                 value={email.value} 
                                 onChange={e => updateContactRow('emails', idx, 'value', e.target.value)}
                                 className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 font-black text-[10px] outline-none focus:border-indigo-500" 
                                 placeholder="utente@esempio.it" 
                               />
                               <button onClick={() => removeContactRow('emails', idx)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><MinusCircle size={20}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'RIPARTO' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[32px] border border-amber-100 dark:border-amber-800 flex gap-4">
                       <AlertTriangle className="text-amber-600 shrink-0" size={24}/>
                       <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase leading-relaxed">
                          In questa sezione è possibile impostare deroghe specifiche per le categorie di spesa. Di default l'inquilino partecipa secondo i millesimi, ma qui è possibile forzare una percentuale di carico differente.
                       </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Layers size={18} className="text-indigo-500"/> Personalizzazione Carico Inquilino
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map(cat => {
                          const currentDist = (editingUnit ? editingUnit.categoryDistributions : formData.categoryDistributions) || [];
                          const existing = currentDist.find(d => d.categoryId === cat.id);
                          
                          return (
                            <div key={cat.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm">
                               <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">{cat.name}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="relative">
                                     <input 
                                       type="number" 
                                       value={existing ? existing.tenantPercentage : 0} 
                                       onChange={e => {
                                         const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                         const others = currentDist.filter(d => d.categoryId !== cat.id);
                                         updateField('categoryDistributions', [...others, { categoryId: cat.id, tenantPercentage: val }]);
                                       }}
                                       className="w-20 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-right font-black text-xs outline-none focus:border-indigo-500" 
                                     />
                                     <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30">%</span>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'SALDI' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-800">
                       <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                         <TrendingUp size={18}/> Saldi Gestione Precedente
                       </h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase px-1">Debito/Credito Proprietario (€)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                              <input 
                                type="number" step="0.01" 
                                value={editingUnit?.ownerPreviousBalance ?? formData.ownerPreviousBalance} 
                                onChange={e => updateField('ownerPreviousBalance', parseFloat(e.target.value) || 0)}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-6 py-4 font-black text-base outline-none focus:border-indigo-500" 
                                placeholder="0.00" 
                              />
                           </div>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase px-1">Debito/Credito Inquilino (€)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                              <input 
                                type="number" step="0.01" 
                                value={editingUnit?.tenantPreviousBalance ?? formData.tenantPreviousBalance} 
                                onChange={e => updateField('tenantPreviousBalance', parseFloat(e.target.value) || 0)}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-6 py-4 font-black text-base outline-none focus:border-indigo-500" 
                                placeholder="0.00" 
                              />
                           </div>
                         </div>
                       </div>
                       <p className="text-[9px] font-bold text-indigo-400 uppercase mt-4 italic">Inserire valori positivi per debito (da versare), negativi per credito (da scalare).</p>
                    </div>
                  </div>
                )}
                
                <div className="h-20 sm:hidden"></div>
             </div>

             <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row gap-3 shadow-sm">
                <button onClick={() => { setIsAdding(false); setEditingUnit(null); }} className="order-2 sm:order-1 flex-1 py-5 rounded-[24px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest">ANNULLA</button>
                <button onClick={handleSave} className="order-1 sm:order-2 flex-[2] py-5 rounded-[24px] bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <Check size={20}/> SALVA UNITÀ
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
