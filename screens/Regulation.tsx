
import React, { useState, useRef } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { CondoRegulation } from '../types';
import { 
  ArrowLeft, FileText, Upload, Trash2, Download, 
  Eye, FileUp, ShieldAlert, CheckCircle2, Loader2,
  Clock, Info, Gavel, FileType, FileOutput
} from 'lucide-react';

interface RegulationProps {
  onBack: () => void;
  regulation: CondoRegulation | null;
  onRegulationChange: (reg: CondoRegulation | null) => void;
}

export const Regulation: React.FC<RegulationProps> = ({ onBack, regulation, onRegulationChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Controllo estensioni (PDF, DOC, DOCX)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert("Formato non supportato. Carica un file PDF o Word.");
      return;
    }

    setIsUploading(true);
    
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onRegulationChange({
        name: file.name,
        type: file.type,
        data: base64Data,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      alert("Errore durante il caricamento del file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!regulation) return;
    const link = document.createElement('a');
    link.href = `data:${regulation.type};base64,${regulation.data}`;
    link.download = regulation.name;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300 px-1">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black mb-6 uppercase text-[10px] tracking-widest transition-all hover:translate-x-[-4px]">
        <ArrowLeft size={18} /><span>Indietro</span>
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Regolamento</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Statuto e Norme del Condominio</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {!regulation ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer py-24 px-10 text-center bg-white dark:bg-slate-900 rounded-[48px] border-4 border-dashed border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all flex flex-col items-center justify-center shadow-sm"
          >
            <div className="w-24 h-24 rounded-[32px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30">
               {isUploading ? <Loader2 className="animate-spin text-indigo-600" size={40}/> : <FileUp className="text-slate-400 group-hover:text-indigo-600" size={40} />}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Carica Regolamento</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
              Trascina qui il file o clicca per sfogliare.<br/>Supportati: PDF, DOC, DOCX.
            </p>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx" />
          </div>
        ) : (
          <div className="space-y-6">
            <MaterialCard className="p-8 sm:p-10 border-2 border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-900 relative overflow-hidden">
               <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
                     {regulation.type.includes('pdf') ? <FileType size={48}/> : <FileText size={48}/>}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight mb-2 truncate max-w-md">{regulation.name}</h3>
                     <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5"><Clock size={14}/> {new Date(regulation.uploadedAt).toLocaleDateString('it-IT')}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5"><FileOutput size={14}/> {formatSize(regulation.size)}</span>
                        <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm"><CheckCircle2 size={12}/> Documento Attivo</span>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                     <button onClick={handleDownload} className="flex-1 md:flex-none p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Download size={20}/>
                     </button>
                     <button onClick={() => onRegulationChange(null)} className="flex-1 md:flex-none p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl border border-rose-100 dark:border-rose-800 hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={20}/>
                     </button>
                  </div>
               </div>
               <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                  <Gavel size={180}/>
               </div>
            </MaterialCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <MaterialCard className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800 p-6 flex gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-emerald-600 shadow-sm h-fit"><ShieldAlert size={24}/></div>
                  <div>
                     <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-100 uppercase mb-1">Archivio Sicuro</h4>
                     <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase leading-relaxed">Il documento è archiviato criptato nel cloud condominiale. Tutti i condomini possono richiederne copia digitale aggiornata.</p>
                  </div>
               </MaterialCard>
               <MaterialCard className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800 p-6 flex gap-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl text-indigo-600 shadow-sm h-fit"><Info size={24}/></div>
                  <div>
                     <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase mb-1">Norme di Convivenza</h4>
                     <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase leading-relaxed">Ricorda che il regolamento contiene le norme sull'uso delle parti comuni e la ripartizione millesimale delle spese.</p>
                  </div>
               </MaterialCard>
            </div>
          </div>
        )}

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800">
           <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Gavel size={18} className="text-indigo-500"/> Cos'è il regolamento di condominio?</h4>
           <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed">
             È l'atto che disciplina la vita interna del condominio, l'uso delle cose comuni e la ripartizione delle spese. Esso è obbligatorio quando i condomini sono più di dieci. Conservarne una copia digitale permette all'amministratore e ai condomini di risolvere rapidamente dubbi su orari di silenzio, decoro architettonico e obblighi manutentivi.
           </p>
        </div>
      </div>
    </div>
  );
};
