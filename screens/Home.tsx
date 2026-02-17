
// ... (mantenere tutti gli import precedenti)

export const Home: React.FC<HomeProps> = ({ 
  condoName, selectedYear, onYearChange, onNavigate, 
  categories, transactions, isDarkMode, onToggleDarkMode, 
  units = [], onNameChange, insurancePolicies = [],
  userRole = 'ADMIN', activeUnitId, onCloseCondo
}) => {
  // ... (mantenere tutta la logica degli state e useMemo precedente)

  return (
    <div className="animate-in fade-in duration-500 px-1 sm:px-0 pb-32">
      {/* HEADER - Pulito e allineato */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 mt-4">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-5 bg-white dark:bg-slate-900 rounded-[28px] border-2 border-slate-100 dark:border-slate-800 shadow-lg text-indigo-500 hover:scale-105 transition-all"
          >
            <Menu size={28} />
          </button>
          
          <div className="flex items-center gap-4">
            {isAdmin ? (
               <div className="flex items-center gap-4">
                  <AppLogo />
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block"></div>
                  {!isEditingName ? (
                    <div className="header-condo-badge">
                      <span>{condoName || "DOMUSLOG"}</span>
                      <button onClick={() => { setEditNameValue(condoName); setIsEditingName(true); }}>
                        <PencilLine size={16} />
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={editNameValue} 
                      onChange={(e) => setEditNameValue(e.target.value)} 
                      className="bg-white dark:bg-slate-900 border-2 border-indigo-400 rounded-xl px-4 py-1 font-black uppercase text-sm outline-none" 
                      autoFocus 
                      onBlur={handleSaveName} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} 
                    />
                  )}
               </div>
            ) : (
              /* Versione Condomino */
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                   <Building size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{condoName}</p>
                  <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {currentUnit?.name || 'Area Condomino'}
                  </h1>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Toggle Dark Mode e Selettore Anno */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={onToggleDarkMode} className="w-14 h-14 flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-500" />}
          </button>
          <div className="relative flex-1 sm:flex-none">
            <button onClick={() => setShowYearMenu(!showYearMenu)} className="w-full flex items-center justify-between gap-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-6 py-4 rounded-2xl shadow-sm font-black text-xs uppercase tracking-widest">
              <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400"><CalendarDays size={18}/> {selectedYear}</span>
              <ChevronDown size={16} />
            </button>
            {showYearMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-2 z-[60] w-40 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95">
                {['2023', '2024', '2025'].map(y => (
                  <button key={y} onClick={() => { onYearChange(y); setShowYearMenu(false); }} className={`w-full text-left px-4 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${selectedYear === y ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{y}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CARD STATISTICHE - Utilizzano le classi del nuovo index.css */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="m3-card card-uscite">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/50 shadow-sm mb-4">
            <ShoppingCart size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500/70 mb-1">Uscite Totali</p>
            <p className="text-2xl font-black">€ {totalExpenses.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="m3-card card-entrate">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/50 shadow-sm mb-4">
            <Banknote size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500/70 mb-1">Entrate Totali</p>
            <p className="text-2xl font-black">€ {totalIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="m3-card card-saldo">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/50 shadow-sm mb-4">
            <Wallet size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500/70 mb-1">Saldo Cassa</p>
            <p className="text-2xl font-black">€ {cashBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="m3-card card-polizza">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 dark:bg-slate-800/50 shadow-sm">
              {insuranceStatus.icon}
            </div>
            <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-white/50 uppercase">{insuranceStatus.label}</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500/70 mb-1">Premio Polizza</p>
            <p className="text-2xl font-black">€ {(activePolicy?.premium || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* GRAFICI E AI ENGINE (mantenere come nel tuo codice originale) */}
      {/* ... */}
    </div>
  );
};