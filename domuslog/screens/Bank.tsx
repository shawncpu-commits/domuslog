
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { BankAccount, Transaction } from '../types';
import { 
  ArrowLeft, Plus, Trash2, PencilLine, Landmark, 
  Check, X, CreditCard, Wallet, FileUp, Loader2, 
  History, TrendingUp, TrendingDown, Info, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { extractBankMovements } from '../services/geminiService';

interface BankProps {
  onBack: () => void;
  bankAccounts: BankAccount[];
  onBankAccountsChange: (accounts: BankAccount[]) => void;
  transactions: Transaction[];
  onToggleDock?: (visible: boolean) => void;
}

interface ExtractedData {
  movements: { date: string; description: string; amount: number }[];
  finalBalance: number;
}

export const Bank: React.FC<BankProps> = ({ onBack, bankAccounts, onBankAccountsChange, transactions, onToggleDock }) => {
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importTargetId, setImportTargetId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(bankAccounts[0]?.id || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (onToggleDock) {
      onToggleDock(!isAdding && !editingAccount && !isImporting && !extractedData);
    }
    return () => onToggleDock?.(true);
  }, [isAdding, editingAccount, isImporting, extractedData]);
  
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    name: '',
    bankName: '',
    iban: '',
    balance: 0
  });

  const activeAccount = useMemo(() => 
    bankAccounts.find(acc => acc.id === selectedAccountId), 
  [bankAccounts, selectedAccountId]);

  const bankMovements = useMemo(() => {
    if (!selectedAccountId) return [];
    return transactions
      .filter(t => t.bankAccountId === selectedAccountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountId]);

  const handleSave = () => {
    if (editingAccount) {
      onBankAccountsChange(bankAccounts.map(acc => acc.id === editingAccount.id ? { ...editingAccount } as BankAccount : acc));
      setEditingAccount(null);
    } else if (isAdding) {
      const newAcc: BankAccount = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Nuovo Conto',
        bankName: formData.bankName || 'Banca',
        iban: formData.iban || '',
        balance: formData.balance || 0
      };
      onBankAccountsChange([...bankAccounts, newAcc]);
      setIsAdding(false);
      setFormData({ name: '', bankName: '', iban: '', balance: 0 });
    }
  };

  const startEdit = (acc: BankAccount) => {
    setEditingAccount({ ...acc });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo conto corrente?")) {
      onBankAccountsChange(bankAccounts.filter(acc => acc.id !== id));
      if (selectedAccountId === id) setSelectedAccountId(null);
    }
  };

  const handleImportClick = (accountId: string) => {
    setImportTargetId(accountId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importTargetId) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const result = await extractBankMovements(base64String, file.type);
          setExtractedData(result);
        } catch (err) {
          console.error(err);
          alert("Errore durante l'analisi dell'estratto conto.");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsImporting(false);
    }
  };

  const confirmImport = () => {
    if (!extractedData || !importTargetId) return;

    onBankAccountsChange(bankAccounts.map(acc => {
      if (acc.id === importTargetId) {
        return {
          ...acc,
          balance: extractedData.finalBalance
        };
      }
      return acc;
    }));

    alert(`Importazione completata. Saldo aggiornato a €${extractedData.finalBalance.toLocaleString('it-IT')}`);
    setExtractedData(null);
    setImportTargetId(null);
  };

  const totalLiquidity = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-sm">
        <ArrowLeft size={20} />
        <span>TORNA ALLA DASHBOARD</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase flex items-center gap-3">
            ISTITUTI BANCARI
          </h1>
          <p className="text-xs font-black text-slate-500 uppercase tracking-tight mt-1">
            GESTIONE CONTI CORRENTI E SINCRONIZZAZIONE MOVIMENTI
          </p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf" 
          />
          <button 
            onClick={() => { setIsAdding(true); setEditingAccount(null); }}
            className="m3-button bg-indigo-600 text-white flex items-center gap-2 shadow-xl uppercase font-black text-[10px]"
          >
            <Plus size={18} />
            AGGIUNGI CONTO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1 space-y-4">
          <MaterialCard className="bg-slate-900 text-white border-none p-6">
            <label className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-2 block">LIQUIDITÀ TOTALE</label>
            <p className="text-3xl font-black">€ {totalLiquidity.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </MaterialCard>
          
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CONTI ATTIVI</h3>
            {bankAccounts.map(acc => (
              <div 
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`p-5 rounded-[24px] cursor-pointer transition-all border-2 ${selectedAccountId === acc.id ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-50' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-sm uppercase text-slate-900">{acc.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{acc.bankName}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${selectedAccountId === acc.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                    <CreditCard size={16} />
                  </div>
                </div>
                <p className="mt-4 font-black text-lg text-slate-800">€ {acc.balance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                
                {selectedAccountId === acc.id && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(acc); }} className="text-[9px] font-black text-indigo-500 uppercase">Modifica</button>
                    <button onClick={(e) => { e.stopPropagation(); handleImportClick(acc.id); }} className="text-[9px] font-black text-emerald-500 uppercase">Importa E.C.</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }} className="text-[9px] font-black text-red-500 uppercase ml-auto">Elimina</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <MaterialCard className="h-full flex flex-col p-0 border-none overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">LISTA MOVIMENTI SINCRONIZZATI</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Conto: {activeAccount?.name || 'Seleziona un conto'}</p>
              </div>
              <History size={20} className="text-slate-300" />
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
              {bankMovements.length === 0 ? (
                <div className="py-20 text-center">
                  <Info size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase">Nessun movimento registrato su questo conto</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bankMovements.map(move => (
                    <div key={move.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${move.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {move.type === 'INCOME' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-xs text-slate-800 uppercase leading-none mb-1">{move.description}</p>
                          <div className="flex gap-3">
                             <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(move.date).toLocaleDateString('it-IT')}</span>
                             <span className="text-[9px] font-black text-indigo-400 uppercase">{move.category}</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase">{move.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm font-black ${move.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {move.type === 'INCOME' ? '+' : '-'} €{move.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MaterialCard>
        </div>
      </div>

      {isImporting && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[110] flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600 mb-8" size={64} />
          <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter">AI BANK ANALYZER</h3>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-tighter">ESTRAZIONE DATI ESTRATTO CONTO IN CORSO...</p>
        </div>
      )}

      {extractedData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full animate-in zoom-in-95">
            <MaterialCard className="p-8 shadow-2xl bg-white border-none">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><History size={24} /></div>
                  <div><h3 className="text-2xl font-black text-slate-900 uppercase">CONFERMA ESTRATTO</h3></div>
                </div>
                <button onClick={() => setExtractedData(null)}><X size={24} /></button>
              </div>
              <div className="bg-slate-900 text-white p-6 rounded-[32px] mb-8 flex justify-between items-center">
                <div><p className="text-[10px] font-black opacity-60 uppercase mb-1">SALDO FINALE RILEVATO</p><p className="text-2xl font-black">€ {extractedData.finalBalance.toLocaleString('it-IT')}</p></div>
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setExtractedData(null)} className="flex-1 py-5 rounded-[24px] bg-slate-100 text-slate-600 font-black uppercase text-[11px]">ANNULLA</button>
                <button onClick={confirmImport} className="flex-1 py-5 rounded-[24px] bg-indigo-600 text-white font-black shadow-2xl flex items-center justify-center gap-2 uppercase text-[11px]"><Check size={20} /> AGGIORNA SALDO</button>
              </div>
            </MaterialCard>
          </div>
        </div>
      )}

      {(isAdding || editingAccount) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[130] flex items-center justify-center p-4 overflow-y-auto">
          <MaterialCard className="max-w-2xl w-full p-8 shadow-2xl bg-white animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white py-2 z-10 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Landmark size={24} /></div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                  {editingAccount ? 'MODIFICA CONTO' : 'NUOVO CONTO'}
                </h3>
              </div>
              <button onClick={() => { setIsAdding(false); setEditingAccount(null); }} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-10 mt-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Riferimento</label>
                <input 
                  type="text" 
                  value={editingAccount ? editingAccount.name : formData.name} 
                  onChange={(e) => editingAccount ? setEditingAccount({...editingAccount, name: e.target.value}) : setFormData({...formData, name: e.target.value})} 
                  placeholder="ES: CONTO ORDINARIO"
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all border-2 border-transparent focus:bg-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Istituto Bancario</label>
                <input 
                  type="text" 
                  value={editingAccount ? editingAccount.bankName : formData.bankName} 
                  onChange={(e) => editingAccount ? setEditingAccount({...editingAccount, bankName: e.target.value}) : setFormData({...formData, bankName: e.target.value})} 
                  placeholder="ES: INTESA SANPAOLO"
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all border-2 border-transparent focus:bg-white" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Codice IBAN</label>
                <input 
                  type="text" 
                  value={editingAccount ? editingAccount.iban : formData.iban} 
                  onChange={(e) => editingAccount ? setEditingAccount({...editingAccount, iban: e.target.value}) : setFormData({...formData, iban: e.target.value})} 
                  placeholder="IT00 X 00000 00000 000000000000"
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all border-2 border-transparent focus:bg-white" 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Saldo Attuale (€)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-600">€</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingAccount ? editingAccount.balance : (formData.balance || '')} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      editingAccount ? setEditingAccount({...editingAccount, balance: val}) : setFormData({...formData, balance: val});
                    }} 
                    placeholder="0.00"
                    className="w-full bg-indigo-50 border-none rounded-2xl pl-12 pr-6 py-4 font-black text-xs text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => { setIsAdding(false); setEditingAccount(null); }} 
                className="flex-1 py-5 rounded-[24px] bg-slate-100 text-slate-600 font-black uppercase text-[11px] hover:bg-slate-200 transition-colors"
              >
                ANNULLA
              </button>
              <button 
                onClick={handleSave} 
                className="flex-1 py-5 rounded-[24px] bg-indigo-600 text-white font-black uppercase text-[11px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                {editingAccount ? 'AGGIORNA CONTO' : 'SALVA CONTO'}
              </button>
            </div>
          </MaterialCard>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};
