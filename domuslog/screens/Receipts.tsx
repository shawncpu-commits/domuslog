
import React, { useState, useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { 
  ArrowLeft, Plus, FileText, Send, Share2, 
  Mail, MessageCircle, X, Check, Search, 
  Calendar, Hash, Building2, User, CreditCard,
  Trash2, Printer, Download, Landmark, Tag,
  PlusCircle, MinusCircle, Wallet, ChevronRight,
  FileCheck, ShieldCheck, Share, Loader2,
  Clock, AlertCircle
} from 'lucide-react';
import { Transaction, Unit, Category, BankAccount, UserRole, PaymentMethod } from '../types';

interface ReceiptsProps {
  onBack: () => void;
  units: Unit[];
  categories: Category[];
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  onTransactionsChange: (tx: Transaction[]) => void;
  condoName: string;
  userRole?: UserRole;
}

declare var html2pdf: any;

export const Receipts: React.FC<ReceiptsProps> = ({ 
  onBack, units, categories, transactions, bankAccounts, onTransactionsChange, condoName, userRole = 'ADMIN' 
}) => {
  const isAdmin = userRole === 'ADMIN';
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const initialFormData: Partial<Transaction> = {
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    unit: '',
    amount: 0,
    paymentMethod: 'BONIFICO',
    bankAccountId: bankAccounts[0]?.id || '',
    payerType: 'PROPRIETARIO',
    items: [{ description: 'Versamento oneri', amount: 0, category: categories[0]?.name || 'Quote' }],
    type: 'INCOME',
    paymentStatus: 'PAGATO'
  };

  const [formData, setFormData] = useState<Partial<Transaction>>(initialFormData);

  const receiptHistory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'INCOME' && t.receiptNumber)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions]);

  const filteredHistory = receiptHistory.filter(r => 
    r.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWhatsAppShare = (receipt: Transaction) => {
    const total = receipt.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 });
    const message = encodeURIComponent(
      `Gentile condomino, le inviamo la ricevuta di pagamento n. ${receipt.receiptNumber} di € ${total}. Grazie. DomusLog - ${condoName}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleEmailShare = (receipt: Transaction) => {
    const total = receipt.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 });
    const subject = encodeURIComponent(`Ricevuta di pagamento n. ${receipt.receiptNumber} - ${condoName}`);
    const body = encodeURIComponent(
      `Si invia in allegato la ricevuta di pagamento n. ${receipt.receiptNumber} emessa in data ${new Date(receipt.date).toLocaleDateString('it-IT')} per l'importo di € ${total}.\n\nCordiali saluti,\nAmministrazione ${condoName}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const generateProfessionalPDF = async (receipt: Transaction) => {
    setIsGeneratingPdf(true);
    const unitObj = units.find(u => u.name === receipt.unit || u.id === receipt.unit);
    const bank = bankAccounts.find(b => b.id === receipt.bankAccountId);
    const total = receipt.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 });

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; background: white; width: 210mm; min-height: 297mm; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; color: #4f46e5; text-transform: uppercase; font-size: 28px; font-weight: 800;">${condoName}</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #94a3b8; font-weight: 700; letter-spacing: 2px;">AMMINISTRAZIONE CONDOMINIALE</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b;">RICEVUTA N. ${receipt.receiptNumber}</p>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #64748b; font-weight: 600;">DATA EMISSIONE: ${new Date(receipt.date).toLocaleDateString('it-IT')}</p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b; font-weight: 600;">DATA SCADENZA: ${new Date(new Date(receipt.date).setDate(new Date(receipt.date).getDate() + 30)).toLocaleDateString('it-IT')}</p>
          </div>
        </div>

        <div style="background: #f8fafc; border-radius: 20px; padding: 25px; margin-bottom: 30px; display: flex; justify-content: space-between;">
          <div style="flex: 1;">
            <p style="margin: 0 0 8px 0; font-size: 9px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">Destinatario / Unità</p>
            <p style="margin: 0; font-size: 16px; font-weight: 800; color: #1e293b;">${(receipt.payerType === 'PROPRIETARIO' ? unitObj?.owner : unitObj?.tenant)?.toUpperCase() || 'N/D'}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 600; color: #64748b;">${receipt.unit}</p>
          </div>
          <div style="text-align: right;">
             <p style="margin: 0 0 8px 0; font-size: 9px; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">Stato Pagamento</p>
             <span style="background: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 50px; font-size: 10px; font-weight: 800; text-transform: uppercase;">${receipt.paymentStatus}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 15px; overflow: hidden;">
          <thead>
            <tr style="background: #4f46e5; color: white;">
              <th style="padding: 15px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase;">Descrizione Spesa</th>
              <th style="padding: 15px; text-align: center; font-size: 10px; font-weight: 800; text-transform: uppercase;">Categoria</th>
              <th style="padding: 15px; text-align: right; font-size: 10px; font-weight: 800; text-transform: uppercase;">Importo</th>
            </tr>
          </thead>
          <tbody>
            ${receipt.items?.map((item, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 15px; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
                <td style="padding: 15px; font-size: 10px; font-weight: 700; color: #6366f1; text-align: center; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">${item.category}</td>
                <td style="padding: 15px; font-size: 12px; font-weight: 800; text-align: right; border-bottom: 1px solid #e2e8f0;">€ ${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9;">
              <td colspan="2" style="padding: 20px; font-size: 14px; font-weight: 800; text-align: right; text-transform: uppercase;">Totale Complessivo</td>
              <td style="padding: 20px; font-size: 18px; font-weight: 800; text-align: right; color: #059669;">€ ${total}</td>
            </tr>
          </tfoot>
        </table>

        <div style="display: flex; gap: 40px; margin-bottom: 60px;">
          <div style="flex: 1; padding: 20px; border: 1px dashed #cbd5e1; border-radius: 15px;">
            <p style="margin: 0 0 10px 0; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase;">Coordinate Versamento</p>
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #1e293b;">Banca: ${bank?.bankName || 'N/D'}</p>
            <p style="margin: 5px 0 0 0; font-size: 10px; font-family: monospace; color: #1e293b;">IBAN: ${bank?.iban || 'N/D'}</p>
            <p style="margin: 10px 0 0 0; font-size: 10px; font-weight: 600; color: #64748b;">Metodo: ${receipt.paymentMethod}</p>
          </div>
          <div style="flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: flex-end;">
            <div style="border-bottom: 1px solid #1e293b; width: 80%; margin: 0 auto 10px auto;"></div>
            <p style="margin: 0; font-size: 9px; font-weight: 800; color: #1e293b; text-transform: uppercase;">Firma dell'Amministratore</p>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="margin: 0; font-size: 8px; color: #94a3b8; font-weight: 600;">Ricevuta generata digitalmente da DomusLog AI Engine - www.domuslog.it</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Ricevuta_${receipt.receiptNumber.replace('/', '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("Errore generazione PDF:", e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSave = () => {
    if (!formData.unit || !formData.receiptNumber) {
      alert("Completa i campi obbligatori (Unità e Numero Ricevuta)");
      return;
    }

    const totalAmount = formData.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
    const finalTx: Transaction = {
      ...initialFormData,
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      amount: totalAmount,
      description: `Ricevuta n. ${formData.receiptNumber}`
    } as Transaction;

    onTransactionsChange([finalTx, ...transactions]);
    setIsAdding(false);
    setFormData(initialFormData);
    setSelectedReceipt(finalTx);
    setShowShareModal(true);
  };

  return (
    <div className="pb-32 animate-in fade-in duration-500 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 uppercase text-[10px] tracking-widest no-print">
        <ArrowLeft size={18} /> <span>Torna Indietro</span>
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10 no-print">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Ricevute</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Emissione Professionale PDF & Archivio</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsAdding(true)} className="m3-button bg-indigo-600 text-white flex items-center justify-center gap-2 text-[10px] py-4 shadow-xl active:scale-95">
            <Plus size={20} /> EMETTI RICEVUTA
          </button>
        )}
      </div>

      <div className="mb-6 relative no-print">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="CERCA PER NUMERO, UNITÀ O DESCRIZIONE..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-indigo-500 shadow-sm dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        {filteredHistory.map(receipt => (
          <MaterialCard key={receipt.id} className="border-2 border-slate-50 dark:border-slate-800 hover:border-indigo-100 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <FileCheck size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm leading-none">Ricevuta {receipt.receiptNumber}</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{new Date(receipt.date).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-emerald-600">€ {receipt.amount.toLocaleString('it-IT')}</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SALDATO</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Building2 size={12} />
                <span className="text-[9px] font-black uppercase truncate">{receipt.unit}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CreditCard size={12} />
                <span className="text-[9px] font-black uppercase">{receipt.paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => { setSelectedReceipt(receipt); setShowShareModal(true); }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Share size={14}/> Gestisci
              </button>
              <button 
                onClick={() => generateProfessionalPDF(receipt)}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-all"
                title="Scarica PDF"
              >
                <Download size={16}/>
              </button>
            </div>
          </MaterialCard>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-4xl max-h-[90vh] rounded-[48px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 shadow-2xl">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl"><Plus size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Emissione Ricevuta Professionale</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Creazione file PDF con quietanza</p>
                   </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={28}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Unità Immobiliare</label>
                      <select 
                        value={formData.unit} 
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-5 font-black text-base uppercase outline-none focus:border-indigo-500 dark:text-white shadow-sm"
                      >
                         <option value="">Seleziona Unità...</option>
                         {units.map(u => <option key={u.id} value={u.name}>{u.name} - {u.owner.toUpperCase()}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Progressivo Ricevuta</label>
                      <input 
                        type="text" 
                        value={formData.receiptNumber} 
                        onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-5 font-black text-base uppercase outline-none focus:border-indigo-500 dark:text-white shadow-sm" 
                        placeholder="ES: 01/2024"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data Incasso</label>
                      <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-5 font-black text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Metodo di Pagamento</label>
                      <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-5 font-black text-base uppercase outline-none focus:border-indigo-500 dark:text-white shadow-sm">
                         <option value="BONIFICO">BONIFICO BANCARIO</option>
                         <option value="CONTANTI">CONTANTI</option>
                         <option value="ASSEGNO">ASSEGNO</option>
                         <option value="MAV">MAV / BOLLETTINO</option>
                      </select>
                   </div>
                   <div className="space-y-2 sm:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Riferimento Bancario (Opzionale)</label>
                      <select value={formData.bankAccountId} onChange={e => setFormData({...formData, bankAccountId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-5 font-black text-base uppercase outline-none focus:border-indigo-500 dark:text-white shadow-sm">
                         <option value="">Nessun IBAN in calce</option>
                         {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.name}</option>)}
                      </select>
                   </div>

                   <div className="sm:col-span-2 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Tag size={18}/> Articoli della Ricevuta</h4>
                      </div>
                      <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-6 sm:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-inner">
                         {formData.items?.map((item, idx) => (
                           <div key={idx} className="flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in-95">
                              <div className="flex-[3] relative">
                                 <input 
                                   type="text" 
                                   value={item.description} 
                                   onChange={e => {
                                      const newItems = [...(formData.items || [])];
                                      newItems[idx].description = e.target.value;
                                      setFormData({...formData, items: newItems});
                                   }}
                                   className="w-full bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-xs uppercase outline-none focus:border-indigo-500 shadow-sm" 
                                   placeholder="DESCRIZIONE VOCE"
                                 />
                              </div>
                              <div className="flex-[2]">
                                 <select 
                                   value={item.category} 
                                   onChange={e => {
                                      const newItems = [...(formData.items || [])];
                                      newItems[idx].category = e.target.value;
                                      setFormData({...formData, items: newItems});
                                   }}
                                   className="w-full bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-700 rounded-2xl px-5 py-4 font-black text-[10px] uppercase outline-none focus:border-indigo-500 shadow-sm dark:text-white"
                                 >
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                 </select>
                              </div>
                              <div className="flex-1 relative">
                                 <input 
                                   type="number" step="0.01" value={item.amount || ''} 
                                   onChange={e => {
                                      const newItems = [...(formData.items || [])];
                                      newItems[idx].amount = parseFloat(e.target.value) || 0;
                                      setFormData({...formData, items: newItems});
                                   }}
                                   className="w-full bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-4 font-black text-xs outline-none focus:border-indigo-500 dark:text-white text-right" 
                                   placeholder="0.00"
                                 />
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600">€</span>
                              </div>
                              <button onClick={() => setFormData({...formData, items: formData.items?.filter((_, i) => i !== idx)})} className="p-4 text-rose-300 hover:text-rose-500 transition-all hover:bg-white dark:hover:bg-slate-900 rounded-2xl shadow-sm"><MinusCircle size={22}/></button>
                           </div>
                         ))}
                         <button onClick={() => setFormData({...formData, items: [...(formData.items || []), { description: 'Versamento oneri', amount: 0, category: categories[0]?.name || 'Quote' }]})} className="w-full py-5 border-2 border-dashed border-indigo-100 dark:border-indigo-800 rounded-3xl text-[10px] font-black text-indigo-600 uppercase flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all shadow-sm">
                            <PlusCircle size={20}/> AGGIUNGI ALTRA VOCE
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-8 sm:p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-8 shadow-xl">
                <div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">TOTALE INCASSO</p>
                   <p className="text-4xl font-black text-indigo-600">€ {formData.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                   <button onClick={() => setIsAdding(false)} className="flex-1 sm:flex-none px-10 py-5 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Annulla</button>
                   <button onClick={handleSave} className="flex-[2] sm:flex-none px-12 py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-indigo-700 flex items-center justify-center gap-3"><FileCheck size={20}/> SALVA ED EMETTI PDF</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {showShareModal && selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[450] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[56px] p-10 sm:p-14 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
              <div className="text-center mb-10 relative z-10">
                 <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
                    <ShieldCheck size={48}/>
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-4">Ricevuta Pronta!</h3>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Scegli come condividere il documento con il condomino.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 mb-10 shadow-inner relative z-10">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                      <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ricevuta n.</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{selectedReceipt.receiptNumber}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Totale</p>
                          <p className="text-xl font-black text-emerald-600">€ {selectedReceipt.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm"><User size={14} className="text-indigo-500" /></div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase leading-tight">
                        {(() => {
                           const u = units.find(unit => unit.name === selectedReceipt.unit || unit.id === selectedReceipt.unit);
                           return selectedReceipt.payerType === 'PROPRIETARIO' ? u?.owner : u?.tenant;
                        })()}
                      </p>
                  </div>
              </div>

              <div className="space-y-4 relative z-10">
                 <button 
                  disabled={isGeneratingPdf}
                  onClick={() => generateProfessionalPDF(selectedReceipt)}
                  className="w-full py-6 rounded-3xl bg-indigo-600 text-white flex items-center justify-between px-10 group hover:bg-indigo-700 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                 >
                    <div className="flex items-center gap-5">
                       {isGeneratingPdf ? <Loader2 className="animate-spin" size={24}/> : <Download className="text-white" size={28}/>}
                       <div className="text-left">
                          <span className="font-black text-white uppercase text-xs block leading-none">Scarica Ricevuta PDF</span>
                          <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Layout A4 Professionale</span>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-white/40 group-hover:text-white transition-all"/>
                 </button>

                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleWhatsAppShare(selectedReceipt)}
                      className="py-5 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 hover:border-emerald-200 flex items-center justify-center gap-3 px-6 transition-all group"
                    >
                        <MessageCircle className="text-emerald-600" size={20}/>
                        <span className="font-black text-emerald-900 dark:text-emerald-100 uppercase text-[10px]">WhatsApp</span>
                    </button>
                    <button 
                      onClick={() => handleEmailShare(selectedReceipt)}
                      className="py-5 rounded-3xl bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-100 dark:border-sky-800 hover:border-sky-200 flex items-center justify-center gap-3 px-6 transition-all group"
                    >
                        <Mail className="text-sky-600" size={20}/>
                        <span className="font-black text-sky-900 dark:text-sky-100 uppercase text-[10px]">Email</span>
                    </button>
                 </div>
                 
                 <button 
                   onClick={() => { setSelectedReceipt(null); setShowShareModal(false); }}
                   className="w-full py-4 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors"
                 >
                   Chiudi senza inviare
                 </button>
              </div>

              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <FileText size={240}/>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
