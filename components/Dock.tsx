
import React from 'react';
import { 
  Home, 
  ShoppingCart, 
  Banknote, 
  Users, 
  Droplets, 
  LayoutGrid, 
  Scale, 
  Gavel,
  FileText,
  Tags,
  Layers,
  DatabaseZap
} from 'lucide-react';
import { AppView, UserRole } from '../types';

interface DockProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  userRole?: UserRole;
}

export const Dock: React.FC<DockProps> = ({ currentView, onViewChange, userRole = 'ADMIN' }) => {
  const adminItems = [
    { id: AppView.HOME, label: 'Home', icon: <Home size={24} /> },
    { id: AppView.EXPENSES, label: 'Spese', icon: <ShoppingCart size={24} /> },
    { id: AppView.INCOME, label: 'Incassi', icon: <Banknote size={24} /> },
    { id: AppView.UNITS, label: 'Unità', icon: <Users size={24} /> },
    { id: AppView.MILLESIMI, label: 'Tabelle', icon: <LayoutGrid size={24} /> },
    { id: AppView.BUDGET, label: 'Bilancio', icon: <Scale size={24} /> },
  ];

  const condominoItems = [
    { id: AppView.HOME, label: 'Home', icon: <Home size={24} /> },
    { id: AppView.INCOME, label: 'I Miei Vers.', icon: <Banknote size={24} /> },
    { id: AppView.BUDGET, label: 'Mio Bilancio', icon: <Scale size={24} /> },
    { id: AppView.REGULATION, label: 'Regolamento', icon: <Gavel size={24} /> },
  ];

  const items = userRole === 'CONDOMINO' ? condominoItems : adminItems;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 flex justify-center px-2 sm:px-4 z-[100] pointer-events-none dock-appear">
      <nav className="m3-dock flex items-center justify-around w-full max-w-[500px] px-1 sm:px-3 py-2 pointer-events-auto overflow-hidden shadow-2xl">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center relative group flex-1 min-w-0 transition-all duration-300 outline-none py-1 ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500'
              }`}
            >
              <div className={`
                flex items-center justify-center rounded-2xl transition-all duration-300
                ${isActive 
                  ? 'bg-indigo-600/10 dark:bg-indigo-400/15 p-2.5 sm:p-2' 
                  : 'p-2.5 sm:p-2 hover:bg-slate-100/50 dark:hover:bg-white/5'}
              `}>
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {React.cloneElement(item.icon as React.ReactElement<{size?: number}>, { size: 22 })}
                </div>
              </div>
              
              <span className={`
                text-[8px] sm:text-[7px] font-black mt-1 uppercase tracking-tighter transition-all duration-300 truncate w-full px-1 text-center
                ${isActive 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 -translate-y-1 scale-90'}
                hidden xs:block
              `}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-in zoom-in duration-300" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
