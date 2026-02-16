
import React from 'react';
import { AppIcon } from './AppIcon';

export const AppLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-4 group transition-all active:scale-95 cursor-default">
      <AppIcon size={52} className="rotate-3 group-hover:rotate-0 transition-all duration-500 shadow-2xl shadow-indigo-500/40" />
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
          Domus<span className="text-indigo-600">Log</span>
        </h1>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 group-hover:text-indigo-500 transition-colors">
          AI Condo Engine
        </p>
      </div>
    </div>
  );
};
