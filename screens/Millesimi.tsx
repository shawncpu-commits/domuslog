
import React, { useState, useMemo, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { MillesimalTable, Unit, Category, UnitMillesimalValue, Transaction } from '../types';
import { 
  ArrowLeft, Plus, Trash2, PencilLine, Scale, 
  Check, X, Move, Divide, UserMinus, UserCheck,
  PlusCircle, Tag as TagIcon, GripVertical, Layers,
  AlertTriangle, Equal, BarChart3, PieChart, ShieldAlert,
  TrendingUp, Activity, Info, ChevronRight, Calculator,
  ShieldCheck, ArrowUpRight, Gauge, CheckCircle2, Search,
  Zap, ListTree, Copy, ChevronDown, Download, Users,
  ArrowDownWideNarrow, LayoutGrid, FilePlus2, ListFilter
} from 'lucide-react';
import { normalizeString, isCategoryInTable } from '../services/calculatorService';

interface MillesimiProps {
  tables: MillesimalTable[];
  onTablesChange: (tables: MillesimalTable[]) => void;
  onBack: () => void;
  units: Unit[];
  categories: Category[];
  onToggleDock?: (visible: boolean) => void;
  transactions?: Transaction[];
}

export const Millesimi: React.FC<MillesimiProps> = ({ tables, onTablesChange, onBack, units, categories, onToggleDock, transactions = [] }) => {
  const [editingTable, setEditingTable] = useState<MillesimalTable | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [simAmount, setSimAmount] = useState<number>(1000);
  const [showImportMenu, setShowImportMenu] = useState(false);

  useEffect(() => {
    if (onToggleDock) onToggleDock(!isAdding && !editingTable);
    return () => onToggleDock?.(true);
  }, [isAdding, editingTable, onToggleDock]);
  
  const [formData, setFormData] = useState<Omit<MillesimalTable, 'id'>>({
    name: '',
    description: '',
    categoryIds: [],
    unitValues: [],
    isActive: true
  });

  const orphanedCategories = useMemo(() => {
    const mappedIdsOrNames = new Set<string>(tables.filter(t => t.isActive !== false).flatMap(t => t.categoryIds || []) as string[]);
    return categories.filter(c => 
      !mappedIdsOrNames.has(c.id) && 
      !Array.from(mappedIdsOrNames).some((m: string) => normalizeString(m) === normalizeString(c.name)) &&
      !c.isExcluded
    );
  }, [tables, categories]);

  const coveragePercent = useMemo(() => {
    const total = categories.filter(c => !c.isExcluded).length;
    if (total === 0) return 100;
    return Math.round(((total - orphanedCategories.length) / total) * 100);
  }, [categories, orphanedCategories]);

  const tableStats = useMemo(() => {
    const stats: Record<string, { total: number, count: number }> = {};
    tables.forEach(t => stats[t.id] = { total: 0, count: 0 });

    transactions.filter(t => t.type === 'EXPENSE').forEach(tx => {
      const txCatUpper = normalizeString(tx.category || '');
      const catObj = categories.find(c => normalizeString(c.name) === txCatUpper || c.id === tx.category);

      if (tx.splits && tx.splits.length > 0) {
        tx.splits.forEach(s => {
          if (stats[s.tableId]) {
            stats[s.tableId].total += (tx.amount * (s.percentage || 0)) / 100;
            stats[s.tableId].count++;
          }
        });
      } else {
        const matchingTables = tables.filter(t => isCategoryInTable(t, catObj, tx.category));
        if (matchingTables.length > 0) {
          const part = tx.amount / matchingTables.length;
          matchingTables.forEach(t => {
            stats[t.id].total += part;
            stats[t.id].count++;
          });
        }
      }
    });
    return stats;
  }, [transactions, tables, categories]);

  const totalExpenseVolume = useMemo(() => 
    transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
  [transactions]);

  const handleStartAdd = () => {
    const sortedUnits = [...units].sort((a, b) => (a.floor ?? 0) - (b.floor ?? 0));
    const initialValues = sortedUnits.map(u => ({ unitId: u.id, value: 0, isExcluded: false, label: '' }));
    setFormData({
      name: '',
      description: '',
      categoryIds: [],
      unitValues: initialValues,
      isActive: true
    });
    setIsAdding(true);
    setEditingTable(null);
  };

  const handleStartEdit = (table: MillesimalTable) => {
    const existingValues = table.unitValues || [];
    const unitIdsInTable = new Set(existingValues.map(v => v.unitId));
    
    const missingValues = units
      .filter(u => !unitIdsInTable.has(u.id))
      .map(u => ({ unitId: u.id, value: 0, isExcluded: false, label: '' }));

    const combined = [...existingValues, ...missingValues];
    
    // Sort combined values by floor
    combined.sort((a, b) => {
      const unitA = units.find(u => u.id === a.unitId);
      const unitB = units.find(u => u.id === b.unitId);
      if (!unitA || !unitB) return 0;
      return (unitA.floor ?? 0) - (unitB.floor ?? 0);
    });

    setFormData({
      name: table.name,
      description: table.description,
      categoryIds: table.categoryIds || [],
      unitValues: combined,
      isActive: table.isActive ?? true
    });
    setEditingTable(table);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    const sum = formData.unitValues?.reduce((s, v) => v.isExcluded ? s : s + (Number(v.value) || 0), 0) || 0;
    if (sum === 0) {
      alert("Attenzione: la somma dei millesimi è zero. Inserisci i valori pro-quota prima di salvare.");
      return;
    }

    const tableData = {
      ...formData,
      unitValues: formData.unitValues?.map(uv => ({
        ...uv, 
        value: Number(uv.value) || 0,
        tempId: undefined
      }))
    };

    if (editingTable) {
      onTablesChange(tables.map(t => t.id === editingTable.id ? { ...editingTable, ...tableData } : t));
      setEditingTable(null);
    } else {
      onTablesChange([...tables, { id: Math.random().toString(36).substr(2, 9), ...tableData, order: tables.length }]);
      setIsAdding(false);
    }
  };

  const handleDuplicateRow = (index: number) => {
    const currentValues = [...(formData.unitValues || [])];
    const sourceRow = currentValues[index];
    const newRow = { 
      ...sourceRow, 
      label: sourceRow.label ? `${sourceRow.label} (Copia)` : 'Seconda Quota',
      tempId: Math.random().toString(36).substr(2, 9) 
    };
    currentValues.splice(index + 1, 0, newRow);
    setFormData({ ...formData, unitValues: currentValues });
  };

  const handleRemoveRow = (index: number) => {
    const currentValues = [...(formData.unitValues || [])];
    if (currentValues.length <= 1) return;
    currentValues.splice(index, 1);
    setFormData({ ...formData, unitValues: currentValues });
  };

  const applyToAll = (value: number) => {
    const updated = formData.unitValues?.map(uv => 
      uv.isExcluded ? uv : { ...uv, value }
    );
    setFormData({ ...formData, unitValues: updated });
  };

  const importValuesFromTable = (sourceTableId: string) => {
    const sourceTable = tables.find(t => t.id === sourceTableId);
    if (!sourceTable || !sourceTable.unitValues) return;
    
    const importedValues = sourceTable.unitValues.map(sv => ({
      ...sv,
      tempId: Math.random().toString(36).substr(2, 9)
    }));
    
    setFormData({ ...formData, unitValues: importedValues });
    setShowImportMenu(false);
  };

  const totalMillesimiInForm = useMemo(() => 
    formData.unitValues?.reduce((sum, uv) => uv.isExcluded ? sum : sum + (Number(uv.value) || 0), 0) || 0,
  [formData.unitValues]);

  const sortedUnitValuesForDisplay = useMemo(() => {
    return [...(formData.unitValues || [])].map((uv, index) => ({ uv, index })).sort((a, b) => {
      const uA = units.find(u => u.id === a.uv.unitId);
      const uB = units.find(u => u.id === b.uv.unitId);
      if (!uA || !uB) return 0;
      if ((uA.floor ?? 0) !== (uB.floor ?? 0)) return (uA.floor ?? 0) - (uB.floor ?? 0);
      return uA.name.localeCompare(uB.name, undefined, { numeric: true });
    });
  }, [formData.unitValues, units]);

  return (
    <div className="pb-32 animate-in fade-in duration-500 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 uppercase text-[10px] tracking-widest">
        <ArrowLeft size={18} /> <span>Torna Indietro</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Tabelle & Integrità</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Configurazione riparti e mapping categorie</p>
        </div>
        {!isAdding && !editingTable && (
          <button onClick={handleStartAdd} className="m3-button bg-indigo-600 text-white flex items-center justify-center gap-2 shadow-xl uppercase font-black text-[10px] py-4 px-8 active:scale-95">
            <Plus size={18} /> NUOVA TABELLA
          </button>
        )}
      </div>

      {!isAdding && !editingTable && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <MaterialCard className="lg:col-span-8 bg-slate-900 text-white border-none p-8 relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <ShieldCheck size={32} className="text-indigo-400" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Audit Configurazione</h3>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Integrità dei riparti condominiali</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Copertura Categorie</p>
                        <p className={`text-2xl font-black ${coveragePercent === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{coveragePercent}%</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Tabelle Attive</p>
                        <p className="text-2xl font-black text-white">{tables.length}</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Errori Somma</p>
                        <p className="text-2xl font-black text-rose-400">
                          {tables.filter(t => {
                            const sum = t.unitValues?.reduce((s, v) => v.isExcluded ? s : s + (v.value || 0), 0) || 0;
                            return Math.abs(sum - 1000) > 0.01;
                          }).length}
                        </p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[7px] font-black uppercase text-slate-400 mb-1">Volume Auditato</p>
                        <p className="text-2xl font-black text-indigo-400">€{totalExpenseVolume.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</p>
                     </div>
                  </div>
               </div>
               <div className="absolute right-0 top-0 p-8 opacity-5"><Zap size={200}/></div>
            </MaterialCard>

            <MaterialCard className={`lg:col-span-4 p-8 flex flex-col justify-center border-2 ${orphanedCategories.length > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30'}`}>
               <div className="flex items-center gap-3 mb-4">
                  {orphanedCategories.length > 0 ? <ShieldAlert size={24} className="text-amber-600" /> : <CheckCircle2 size={24} className="text-emerald-600" />}
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Mapping Alerts</h4>
               </div>
               {orphanedCategories.length > 0 ? (
                 <div className="space-y-4">
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase leading-relaxed">
                      Attenzione: {orphanedCategories.length} categorie non sono associate ad alcuna tabella e non verranno ripartite automaticamente.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                       {orphanedCategories.map(c => (
                         <span key={c.id} className="text-[8px] font-black px-2 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 uppercase">{c.name}</span>
                       ))}
                    </div>
                 </div>
               ) : (
                 <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">Configurazione ottimale: ogni categoria attiva è mappata a una tabella millesimale.</p>
               )}
            </MaterialCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => {
              const stats = tableStats[table.id] || { total: 0, count: 0 };
              const mSum = table.unitValues?.reduce((s, v) => v.isExcluded ? s : s + (v.value || 0), 0) || 0;
              const isInvalid = Math.abs(mSum - 1000) > 0.01;

              return (
                <MaterialCard key={table.id} className="group hover:shadow-2xl transition-all border-2 border-slate-50 dark:border-slate-800 p-0 bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden flex flex-col h-full">
                   <div className={`p-6 border-b border-slate-50 dark:border-slate-800 ${isInvalid ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'bg-slate-50/50 dark:bg-slate-800/40'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div className={`p-3 rounded-2xl ${isInvalid ? 'bg-rose-100 text-rose-600' : 'bg-white dark:bg-slate-900 text-indigo-600'} shadow-sm`}>
                            <Scale size={20} />
                         </div>
                         <div className="text-right">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Millesimi Totali</p>
                            <p className={`text-sm font-black ${isInvalid ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{mSum.toFixed(3)}</p>
                         </div>
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white uppercase text-base leading-tight mb-1 truncate">{table.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{table.description || 'Nessuna descrizione'}</p>
                   </div>
                   <div className="p-6 flex-1 space-y-6">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categorie Collegate</p>
                        <div className="flex flex-wrap gap-1.5">
                           {table.categoryIds?.map(cid => {
                             const cat = categories.find(c => c.id === cid || c.name === cid);
                             return cat ? <span key={cid} className="text-[7px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded uppercase border border-indigo-100 dark:border-indigo-800/50 shadow-sm">{cat.name}</span> : null;
                           })}
                           {(table.categoryIds?.length || 0) === 0 && <span className="text-[7px] font-black text-rose-400 uppercase italic">Nessuna categoria mappata</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                         <div className="space-y-1">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">N. Unità</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{(table.unitValues?.filter(v => !v.isExcluded).length || 0)} / {units.length}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Transato</p>
                            <p className="text-sm font-black text-indigo-600">€{stats.total.toLocaleString('it-IT')}</p>
                         </div>
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                      <button onClick={() => handleStartEdit(table)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all">Modifica & Mapping</button>
                      <button onClick={() => { if(confirm("Eliminare la tabella?")) onTablesChange(tables.filter(t => t.id !== table.id)); }} className="p-3 text-slate-400 hover:text-rose-600 transition-colors bg-white dark:bg-slate-900 rounded-xl"><Trash2 size={16}/></button>
                   </div>
                </MaterialCard>
              );
            })}
          </div>
        </div>
      )}

      {(isAdding || editingTable) && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400">
           <MaterialCard className="p-8 sm:p-10 shadow-2xl bg-white dark:bg-slate-900 rounded-[44px] border-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-xl rotate-3">
                       <LayoutGrid size={32}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingTable ? 'Configura Tabella' : 'Nuova Tabella'}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Definizione millesimi e mapping spese</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <div className="relative">
                       <button 
                         onClick={() => setShowImportMenu(!showImportMenu)}
                         className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:bg-slate-200 transition-all active:scale-95"
                       >
                          <Download size={18} /> Importa Struttura <ChevronDown size={14} />
                       </button>
                       {showImportMenu && (
                         <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-[100] animate-in zoom-in-95">
                            <p className="text-[8px] font-black text-slate-400 uppercase px-3 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">Copia valori da:</p>
                            {tables.filter(t => t.id !== editingTable?.id).map(t => (
                              <button 
                                key={t.id} 
                                onClick={() => importValuesFromTable(t.id)}
                                className="w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-colors"
                              >
                                {t.name}
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                    <button onClick={() => { setIsAdding(false); setEditingTable(null); }} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:text-slate-900"><X size={24}/></button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                 <div className="md:col-span-7 space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Tabella</label>
                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 font-black uppercase text-sm outline-none focus:border-indigo-500 shadow-inner dark:text-white" placeholder="ES: PROPRIETÀ GENERALE" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Criterio Ripartizione</label>
                          <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 font-black uppercase text-sm outline-none focus:border-indigo-500 shadow-inner dark:text-white" placeholder="ART. 1123 C.C. - VALORE MQ" />
                       </div>
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[36px] border border-slate-100 dark:border-slate-700 shadow-inner space-y-6">
                       <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                          <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2"><TagIcon size={16}/> Mappa Categorie di Spesa</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Le spese in queste categorie useranno questa tabella</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {categories.map(cat => {
                            const isSelected = formData.categoryIds?.includes(cat.id) || formData.categoryIds?.includes(cat.name);
                            return (
                                <button 
                                key={cat.id}
                                onClick={() => {
                                    const current = formData.categoryIds || [];
                                    const updated = isSelected 
                                      ? current.filter(id => id !== cat.id && id !== cat.name) 
                                      : [...current, cat.id];
                                    setFormData({...formData, categoryIds: updated});
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all flex items-center gap-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-indigo-200'}`}
                                >
                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                                {cat.name}
                                </button>
                            );
                          })}
                          {categories.length === 0 && <p className="text-xs text-slate-400 italic">Nessuna categoria definita nelle impostazioni.</p>}
                       </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[36px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
                       <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 flex-wrap gap-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ListTree size={16}/> Valori Millesimali Unità</h4>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 const active = formData.unitValues?.filter(v => !v.isExcluded) || [];
                                 if (active.length === 0) return;
                                 const val = Number((1000 / active.length).toFixed(4));
                                 applyToAll(val);
                               }}
                               className="text-[9px] font-black text-indigo-600 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 uppercase active:scale-95 transition-all"
                             >Equidistribuzione</button>
                             <button onClick={() => applyToAll(0)} className="text-[9px] font-black text-rose-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 uppercase">Azzera</button>
                          </div>
                       </div>
                       <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left">
                             <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20">
                                <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                   <th className="px-6 py-3">Unità / Piano</th>
                                   <th className="px-6 py-3">Nota Quota</th>
                                   <th className="px-6 py-3 text-right">Millesimi</th>
                                   <th className="px-6 py-3 text-center">Strumenti</th>
                                   <th className="px-6 py-3 text-center">Incl.</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedUnitValuesForDisplay.map(({ uv, index }) => {
                                  const u = units.find(unit => unit.id === uv.unitId);
                                  return (
                                    <tr key={`${uv.unitId}-${index}-${uv.tempId}`} className={`transition-opacity ${uv.isExcluded ? 'opacity-30' : ''}`}>
                                       <td className="px-6 py-4">
                                          <div className="flex items-center gap-3 min-w-[120px]">
                                             <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[10px] font-black shadow-sm">P{u?.floor}</div>
                                             <div>
                                                <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-none mb-1">{u?.name}</p>
                                                <p className="text-[7px] font-bold text-slate-400 uppercase truncate max-w-[80px]">{u?.owner}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-4 py-4">
                                          <input 
                                            type="text"
                                            value={uv.label || ''}
                                            onChange={e => {
                                               const updated = [...(formData.unitValues || [])];
                                               updated[index] = {...uv, label: e.target.value};
                                               setFormData({...formData, unitValues: updated});
                                            }}
                                            placeholder="Es: Quota Box"
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-black uppercase outline-none focus:border-indigo-400"
                                          />
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                          <input 
                                            type="number" step="0.0001"
                                            value={uv.value || ''}
                                            onChange={e => {
                                              const updated = [...(formData.unitValues || [])];
                                              updated[index] = {...uv, value: parseFloat(e.target.value) || 0};
                                              setFormData({...formData, unitValues: updated});
                                            }}
                                            className="w-20 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-700 rounded-xl px-2 py-2 text-right font-black text-xs outline-none focus:border-indigo-500 shadow-inner"
                                          />
                                       </td>
                                       <td className="px-6 py-4 text-center">
                                          <div className="flex justify-center gap-1">
                                             <button 
                                               onClick={() => handleDuplicateRow(index)}
                                               title="Aggiungi quota secondaria per questa unità"
                                               className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                             >
                                                <FilePlus2 size={16}/>
                                             </button>
                                             <button 
                                               onClick={() => handleRemoveRow(index)}
                                               title="Rimuovi riga"
                                               className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                             >
                                                <Trash2 size={16}/>
                                             </button>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 text-center">
                                          <button 
                                            onClick={() => {
                                              const updated = [...(formData.unitValues || [])];
                                              updated[index] = {...uv, isExcluded: !uv.isExcluded};
                                              setFormData({...formData, unitValues: updated});
                                            }}
                                            className={`p-2 rounded-xl transition-all ${uv.isExcluded ? 'text-slate-300' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'}`}
                                          >
                                            {uv.isExcluded ? <UserMinus size={16}/> : <UserCheck size={16}/>}
                                          </button>
                                       </td>
                                    </tr>
                                  );
                                })}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </div>

                 <div className="md:col-span-5 space-y-8">
                    <div className="p-8 bg-slate-900 text-white rounded-[44px] shadow-2xl space-y-8">
                       <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Calculator size={18}/> Simulatore Ripartizione</h4>
                          <Zap size={20} className="text-amber-400" />
                       </div>

                       <div className="space-y-4">
                          <div className="relative">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-400">€</div>
                             <input 
                               type="number" 
                               value={simAmount} 
                               onChange={e => setSimAmount(parseFloat(e.target.value) || 0)}
                               className="w-full bg-white/10 border-2 border-white/10 rounded-3xl pl-14 pr-8 py-6 text-3xl font-black outline-none focus:border-indigo-500 transition-all"
                             />
                          </div>
                       </div>

                       <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {formData.unitValues?.filter(v => !v.isExcluded && v.value > 0).sort((a,b) => b.value - a.value).map((uv, i) => {
                            const u = units.find(unit => unit.id === uv.unitId);
                            const quota = totalMillesimiInForm > 0 ? (simAmount * uv.value) / totalMillesimiInForm : 0;
                            return (
                              <div key={`${uv.unitId}-${i}`} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                 <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-black text-indigo-400 w-10">{(uv.value).toFixed(2)}</span>
                                    <div>
                                       <span className="text-[11px] font-black uppercase tracking-tight block">{u?.name}</span>
                                       {uv.label && <span className="text-[7px] font-bold text-slate-500 uppercase">{uv.label}</span>}
                                    </div>
                                 </div>
                                 <span className="text-sm font-black text-emerald-400">€ {quota.toFixed(2)}</span>
                              </div>
                            );
                          })}
                       </div>

                       <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                          <div>
                             <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Somma Corrente</p>
                             <p className={`text-2xl font-black ${Math.abs(totalMillesimiInForm - 1000) < 0.01 ? 'text-emerald-400' : 'text-rose-50'}`}>{totalMillesimiInForm.toFixed(3)}</p>
                          </div>
                          <button onClick={handleSave} className="px-10 py-5 bg-indigo-600 rounded-[24px] font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Salva Tabella</button>
                       </div>
                    </div>

                    <div className="p-8 bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-800 rounded-[44px] space-y-4">
                       <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Info size={18}/> Mapping Intelligente</h4>
                       <p className="text-[9px] font-bold text-indigo-800 dark:text-indigo-300 uppercase leading-relaxed">
                          Associa le categorie alla tabella per automatizzare la contabilità. Ogni spesa registrata con una categoria mappata verrà divisa istantaneamente secondo questi pesi millesimali. Puoi mappare la stessa categoria a più tabelle se vuoi dividere il costo in percentuali tra diversi criteri (es. 50% Proprietà e 50% Scale).
                       </p>
                    </div>
                 </div>
              </div>
           </MaterialCard>
        </div>
      )}
    </div>
  );
};
