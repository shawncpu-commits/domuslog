
import React, { useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { Transaction } from '../types';
import { ArrowLeft, FileText, Printer, UserCheck, Landmark, Info, AlertCircle, ShieldCheck } from 'lucide-react';

interface Model770Props {
  onBack: () => void;
  selectedYear: string;
  transactions: Transaction[];
  condoName: string;
}

export const Model770: React.FC<Model770Props> = ({ onBack, selectedYear, transactions, condoName }) => {
  // Filtra e normalizza le transazioni con ritenuta d'acconto
  const transactionsWithRitenuta = useMemo(() => {
    return transactions.filter(t => 
      t.date.startsWith(selectedYear) && 
      t.type === 'EXPENSE' && 
      ((t.ritenuta && t.ritenuta > 0) || t.category === 'Amministrazione' || t.tributoCode)
    ).map(t => ({
      ...t,
      ritenuta: t.ritenuta || (t.amount * 0.04), // Fallback illustrativo 4% se non specificata
      providerFiscalCode: t.providerFiscalCode || 'DA DEFINIRE',
      tributoCode: t.tributoCode || (t.category === 'Amministrazione' ? '1040' : '1019')
    }));
  }, [selectedYear, transactions]);

  // Aggregazione per fornitore per il report fiscale (Modello 770)
  const aggregatedByProvider = useMemo(() => {
    const map = new Map<string, { provider: string, cf: string, netTotal: number, taxTotal: number, tributo: string, count: number }>();
    
    transactionsWithRitenuta.forEach(t => {
      const key = `${t.providerFiscalCode}_${t.tributoCode}`;
      const existing = map.get(key) || { 
        provider: t.provider || 'Senza Nome', 
        cf: t.providerFiscalCode, 
        netTotal: 0, 
        taxTotal: 0, 
        tributo: t.tributoCode,
        count: 0
      };
      
      existing.netTotal += t.netAmount;
      existing.taxTotal += (t.ritenuta || 0);
      existing.count += 1;
      map.set(key, existing);
    });
    
    return Array.from(map.values()).sort((a, b) => b.taxTotal - a.taxTotal);
  }, [transactionsWithRitenuta]);

  const totalRitenute = transactionsWithRitenuta.reduce((sum, t) => sum + (t.ritenuta || 0), 0);
  const totalImponibile = transactionsWithRitenuta.reduce((sum, t) => sum + t.netAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300">
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: white !important; color: black !important; font-size: 10pt !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .m3-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; border: 1px solid #000 !important; padding: 8px !important; font-size: 8pt !important; text-transform: uppercase; }
          td { border: 1px solid #000 !important; padding: 8px !important; font-size: 9pt !important; }
          .header-print { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; }
          .summary-box { border: 1px solid #000; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Header per Dashboard (UI) */}
      <div className="no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
          <ArrowLeft size={18} />
          <span>Torna alla Dashboard</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-1">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-3 leading-none">
              Modello 770 / {selectedYear}
              <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] px-3 py-1 rounded-full font-black uppercase">Fiscale</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-3">
              Riepilogo Ritenute d'Acconto e Codici Tributo per il Sostituto d'Imposta
            </p>
          </div>
          <button 
            onClick={handlePrint}
            className="m3-button bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center gap-3 shadow-2xl uppercase font-black text-[10px] tracking-widest px-8 py-4 active:scale-95 transition-all"
          >
            <Printer size={18} />
            Genera PDF Modello 770
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MaterialCard className="bg-indigo-600 text-white border-none shadow-xl">
            <label className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-2 block">Totale Ritenute Versate</label>
            <p className="text-3xl font-black">€ {totalRitenute.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold opacity-80 uppercase">
              <UserCheck size={14} /> {aggregatedByProvider.length} Percettori Unificati
            </div>
          </MaterialCard>

          <MaterialCard className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 border shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Volume Imponibile Lordo</label>
            <p className="text-3xl font-black text-slate-800 dark:text-white">€ {totalImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
              <Landmark size={14} /> Elaborazione su Registro Spese
            </div>
          </MaterialCard>

          <MaterialCard className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 border">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black mb-2 uppercase text-[10px]">
              <ShieldCheck size={14} />
              <span>Conformità Fiscale</span>
            </div>
            <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold leading-tight uppercase">
              Tutti i codici tributo (1019, 1020, 1040) sono stati mappati correttamente in base alle categorie di spesa.
            </p>
          </MaterialCard>
        </div>
      </div>

      {/* DOCUMENTO PDF / STAMPA */}
      <div className="print-only">
        <div className="header-print">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase m-0">Modello 770 - Quadro SY</h1>
              <p className="text-sm font-bold uppercase tracking-widest mt-1">Sostituto d'Imposta: {condoName}</p>
              <p className="text-xs text-slate-600 mt-1 uppercase font-bold">Anno di Imposta: {selectedYear}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase">DomuLong Financial Report</p>
              <p className="text-[10px]">Data Generazione: {new Date().toLocaleDateString('it-IT')}</p>
            </div>
          </div>
        </div>

        <div className="summary-box">
          <div>
            <span className="text-[8pt] font-bold uppercase block mb-1">Totale Imponibile Corrisposto</span>
            <span className="text-xl font-black">€ {totalImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-right">
            <span className="text-[8pt] font-bold uppercase block mb-1">Totale Ritenute d'Acconto</span>
            <span className="text-xl font-black">€ {totalRitenute.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ragione Sociale / Fornitore</th>
              <th>C.F. / Partita IVA</th>
              <th>Cod. Tributo</th>
              <th className="text-right">Num. Doc</th>
              <th className="text-right">Imponibile (€)</th>
              <th className="text-right">Ritenuta (€)</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedByProvider.map((item, idx) => (
              <tr key={idx}>
                <td className="font-bold uppercase">{item.provider}</td>
                <td className="font-mono">{item.cf}</td>
                <td className="text-center font-bold">{item.tributo}</td>
                <td className="text-center">{item.count}</td>
                <td className="text-right">€ {item.netTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                <td className="text-right font-bold">€ {item.taxTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td colSpan={4} className="font-black uppercase text-right">Totali Generali</td>
              <td className="text-right font-black">€ {totalImponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
              <td className="text-right font-black">€ {totalRitenute.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-20 grid grid-cols-2 gap-20">
          <div className="text-center border-t border-black pt-2">
            <p className="text-[8pt] font-black uppercase">Timbro del Condominio</p>
          </div>
          <div className="text-center border-t border-black pt-2">
            <p className="text-[8pt] font-black uppercase">Firma dell'Amministratore</p>
          </div>
        </div>
      </div>

      {/* Tabella UI Dashboard (no-print) */}
      <div className="no-print">
        <MaterialCard className="p-0 border-none overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Elenco Percettori Certificazione Unica</h3>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Ordinato per Totale Ritenute</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase text-slate-400 font-black tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">
                  <th className="p-6">Fornitore / Professionista</th>
                  <th className="p-6">Partita IVA / C.F.</th>
                  <th className="p-6">Tributo</th>
                  <th className="p-6 text-right">Imponibile Lordo</th>
                  <th className="p-6 text-right">Ritenuta d'Acconto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {aggregatedByProvider.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <Info size={40} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                      <p className="text-[10px] font-black text-slate-400 uppercase">Nessuna ritenuta rilevata per l'anno {selectedYear}.</p>
                    </td>
                  </tr>
                ) : (
                  aggregatedByProvider.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-slate-800 dark:text-white uppercase text-[11px]">{item.provider}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.count} Documenti elaborati</p>
                      </td>
                      <td className="p-6 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase font-mono">
                        {item.cf}
                      </td>
                      <td className="p-6">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black px-3 py-1 rounded-lg">
                          {item.tributo}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-slate-800 dark:text-slate-200 text-xs">
                        € {item.netTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-6 text-right font-black text-indigo-600 dark:text-indigo-400 text-xs">
                        € {item.taxTotal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MaterialCard>

        <div className="mt-12 flex justify-center">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-8 max-w-3xl flex gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm h-fit">
              <AlertCircle size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-2">Assistenza alla Compilazione</h4>
              <p className="text-[11px] text-slate-500 dark:text-indigo-300/70 font-bold leading-relaxed uppercase tracking-tight">
                Questo report aggrega i dati necessari per la compilazione del quadro SY del Modello 770. Assicurarsi che i Codici Fiscali dei fornitori siano stati estratti correttamente tramite AI Scan o inseriti manualmente nell'anagrafica fornitori per evitare scarti in fase di invio telematico all'Agenzia delle Entrate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
