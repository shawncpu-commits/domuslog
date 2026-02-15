
import React, { useState } from 'react';
import { 
  ShoppingCart, Banknote, FileText, Droplets, 
  LayoutGrid, Scale, Sparkles, ShieldCheck, 
  ChevronRight, ChevronLeft, X, Check, Building2,
  DatabaseZap, Calculator, ShieldAlert, Smartphone
} from 'lucide-react';
import { MaterialCard } from '../components/MaterialCard';

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    title: "Benvenuto in DomuLong",
    description: "Il centro di comando digitale per il tuo condominio. Personalizza il NOME DEL FABBRICATO direttamente dall'intestazione della Home per un'esperienza gestionale su misura.",
    icon: <Building2 size={64} />,
    color: "bg-indigo-600",
    accent: "text-indigo-600"
  },
  {
    title: "AI Scan & Fiscalità",
    description: "Carica fatture e bollette: l'intelligenza artificiale Gemini 3 analizza i documenti ed estrae IMPORTO NETTO, IVA e RITENUTE D'ACCONTO. Suggerisce inoltre i CODICI TRIBUTO corretti per la compilazione automatica del Modello 770.",
    icon: <DatabaseZap size={64} />,
    color: "bg-rose-500",
    accent: "text-rose-500"
  },
  {
    title: "Incassi & Contabilità Massiva",
    description: "Usa la 'LISTA RAPIDA' per registrare le quote di tutte le unità in un unico click. Il sistema distingue automaticamente i versamenti tra PROPRIETARIO ed INQUILINO, aggiornando i saldi in tempo reale.",
    icon: <Banknote size={64} />,
    color: "bg-emerald-500",
    accent: "text-emerald-500"
  },
  {
    title: "Ripartizione Millesimale",
    description: "Associa le Categorie di Spesa alle Tabelle Millesimali. DomuLong calcola istantaneamente il riparto PRO-QUOTA, applicando le deroghe di carico impostate nell'anagrafica delle singole unità.",
    icon: <LayoutGrid size={64} />,
    color: "bg-indigo-400",
    accent: "text-indigo-400"
  },
  {
    title: "Bilancio Idrico Dinamico",
    description: "Monitora i consumi d'acqua confrontando il contatore generale con quelli privati. Il sistema rileva DISPERSIONI OCCULTE o perdite e ripartisce le eccedenze AQP in base ai consumi reali dei condomini.",
    icon: <Droplets size={64} />,
    color: "bg-cyan-500",
    accent: "text-cyan-500"
  },
  {
    title: "Report & Ricevute Digitali",
    description: "Genera Bilanci Consuntivi ed Estratti Conto analitici. Emetti RICEVUTE PROFESSIONALI complete di IBAN condominiale e condividile istantaneamente tramite WHATSAPP o EMAIL con i residenti.",
    icon: <FileText size={64} />,
    color: "bg-indigo-800",
    accent: "text-indigo-800"
  },
  {
    title: "Sicurezza Cloud & Ruoli",
    description: "I dati sono protetti e sincronizzati in tempo reale nel cloud. L'accesso è differenziato: gli AMMINISTRATORI gestiscono il bilancio, mentre i CONDOMINI visualizzano solo i propri versamenti e il regolamento.",
    icon: <ShieldCheck size={64} />,
    color: "bg-slate-900",
    accent: "text-slate-900"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const next = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const prev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('onboarding_completed', 'true');
    }
    onComplete();
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-[600] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-500">
      <div className="max-w-4xl w-full h-full max-h-[800px] flex flex-col relative">
        
        {/* PROGRESS INDICATOR */}
        <div className="flex gap-2 justify-center mb-8">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentSlide ? 'w-12 bg-indigo-600' : 'w-4 bg-slate-200 dark:bg-slate-800'
              }`} 
            />
          ))}
        </div>

        <MaterialCard className="flex-1 flex flex-col p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 rounded-[48px]">
          <div className={`h-1/2 flex items-center justify-center text-white transition-colors duration-700 ${slide.color}`}>
            <div className="animate-in zoom-in-50 duration-500">
              {slide.icon}
            </div>
          </div>
          
          <div className="flex-1 p-8 sm:p-12 flex flex-col text-center items-center justify-center">
            <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-4 leading-none ${slide.accent}`}>
              {slide.title}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed uppercase tracking-tight">
              {slide.description}
            </p>
          </div>

          <div className="p-8 sm:p-12 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 order-2 sm:order-1">
              {currentSlide === SLIDES.length - 1 ? (
                <button 
                  onClick={() => setDontShowAgain(!dontShowAgain)}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all hover:border-indigo-200"
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${dontShowAgain ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                    {dontShowAgain && <Check size={16} />}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salva preferenza</span>
                </button>
              ) : (
                <button onClick={onComplete} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors px-4 py-2">Salva ed esci</button>
              )}
            </div>

            <div className="flex gap-3 order-1 sm:order-2 w-full sm:w-auto">
              {currentSlide > 0 && (
                <button 
                  onClick={prev}
                  className="flex-1 sm:flex-none p-5 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <button 
                onClick={next}
                className="flex-[2] sm:flex-none px-12 py-5 bg-indigo-600 text-white rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {currentSlide === SLIDES.length - 1 ? 'CONFIGURA ORA' : 'SUCCESSIVO'}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </MaterialCard>
        
        <button 
          onClick={onComplete}
          className="absolute -top-4 -right-4 p-4 bg-white dark:bg-slate-800 rounded-full shadow-xl text-slate-400 hover:text-rose-500 transition-all z-10 hidden sm:flex"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};
