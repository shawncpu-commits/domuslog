
import React, { useState, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Category } from '../types';
import { ArrowLeft, Plus, Trash2, PencilLine, Check, X, Palette, AlertCircle, Tag, Pipette } from 'lucide-react';

interface CategoriesProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  onBack: () => void;
  onToggleDock?: (visible: boolean) => void;
}

const PRESET_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#facc15', '#a3e635', 
  '#4ade80', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa', 
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', 
  '#fb7185', '#475569',
];

export const Categories: React.FC<CategoriesProps> = ({ categories, onCategoriesChange, onBack, onToggleDock }) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (onToggleDock) {
      onToggleDock(!isAdding && !editingCategory);
    }
    return () => onToggleDock?.(true);
  }, [isAdding, editingCategory, onToggleDock]);

  const handleSave = () => {
    if (editingCategory) {
      if (!editingCategory.name.trim()) return;
      onCategoriesChange(categories.map(c => c.id === editingCategory.id ? { ...editingCategory, name: editingCategory.name.trim() } : c));
      setEditingCategory(null);
    } else if (isAdding && newCatName.trim()) {
      const newCategory: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCatName.trim(),
        color: newCatColor
      };
      onCategoriesChange([...categories, newCategory]);
      setIsAdding(false);
      setNewCatName('');
      setNewCatColor(PRESET_COLORS[0]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questa categoria? Le spese associate rimarranno ma non avranno più il riferimento colore.")) {
      onCategoriesChange(categories.filter(c => c.id !== id));
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategory({ ...cat });
    setIsAdding(false);
  };

  const currentColor = editingCategory ? editingCategory.color : newCatColor;

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
        <ArrowLeft size={18} />
        <span>TORNA ALLA DASHBOARD</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">CATEGORIE SPESE</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ORGANIZZA E PERSONALIZZA LE VOCI DI BILANCIO</p>
        </div>
        {!isAdding && !editingCategory && (
          <button 
            onClick={() => { setIsAdding(true); setEditingCategory(null); setNewCatName(''); }}
            className="m3-button bg-indigo-600 text-white flex items-center gap-2 shadow-lg uppercase font-black text-[10px] tracking-widest"
          >
            <Plus size={18} /> NUOVA CATEGORIA
          </button>
        )}
      </div>

      {(isAdding || editingCategory) && (
        <MaterialCard className="mb-8 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/30 animate-in slide-in-from-top-4 duration-300 shadow-xl">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  {editingCategory ? <PencilLine size={24} /> : <Plus size={24} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {editingCategory ? `MODIFICA CATEGORIA` : 'AGGIUNGI CATEGORIA'}
                </h3>
              </div>
              <button onClick={() => { setIsAdding(false); setEditingCategory(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Etichetta Identificativa</label>
                  <input 
                    type="text"
                    value={editingCategory ? editingCategory.name : newCatName}
                    onChange={(e) => editingCategory 
                      ? setEditingCategory({...editingCategory, name: e.target.value}) 
                      : setNewCatName(e.target.value)}
                    placeholder="ES: GIARDINAGGIO O ASCENSORE"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 font-black text-slate-800 dark:text-white uppercase outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-[24px] border border-amber-100 dark:border-amber-900/20 flex items-start gap-4">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl text-amber-600 shadow-sm"><AlertCircle size={20} /></div>
                  <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase leading-relaxed tracking-tight">
                    Scegli nomi sintetici per una migliore resa visiva nei grafici e nei report AI.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Seleziona Colore</label>
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-inner">
                    <div className="flex flex-wrap gap-3 mb-6">
                      {PRESET_COLORS.map(color => {
                        const isSelected = currentColor === color;
                        return (
                          <button
                            key={color}
                            onClick={() => editingCategory 
                              ? setEditingCategory({...editingCategory, color}) 
                              : setNewCatColor(color)}
                            className={`w-9 h-9 rounded-full transition-all flex items-center justify-center relative ${
                              isSelected
                              ? 'ring-4 ring-indigo-200 dark:ring-indigo-900 scale-110 shadow-lg z-10' 
                              : 'hover:scale-110 opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color }}
                          >
                             {isSelected && <Check size={16} className="text-white drop-shadow-md" />}
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <Pipette size={16} className="text-indigo-500" />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colore Personalizzato</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <input 
                            type="color" 
                            value={currentColor}
                            onChange={(e) => editingCategory 
                              ? setEditingCategory({...editingCategory, color: e.target.value}) 
                              : setNewCatColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                          />
                          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 font-mono uppercase">{currentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <button 
                onClick={() => { setIsAdding(false); setEditingCategory(null); }}
                className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-colors"
              >
                ANNULLA
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-5 bg-indigo-600 text-white shadow-2xl rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 transition-all active:scale-95"
              >
                {editingCategory ? 'AGGIORNA CATEGORIA' : 'CONFERMA INSERIMENTO'}
              </button>
            </div>
          </div>
        </MaterialCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <MaterialCard key={cat.id} className="group hover:border-indigo-100 dark:hover:border-indigo-900 border border-slate-100 dark:border-slate-800/60 transition-all bg-white dark:bg-slate-900 p-0 overflow-hidden shadow-sm hover:shadow-xl">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5 min-w-0">
                <div 
                  className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: cat.color }}
                >
                  <Tag size={24} className="drop-shadow-sm" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm mb-1 truncate leading-tight">{cat.name}</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ID: {cat.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button 
                  onClick={() => handleStartEdit(cat)}
                  className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors"
                  title="Modifica Categoria"
                >
                  <PencilLine size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors"
                  title="Elimina Categoria"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full opacity-30" style={{ backgroundColor: cat.color }}></div>
          </MaterialCard>
        ))}
      </div>
    </div>
  );
};
