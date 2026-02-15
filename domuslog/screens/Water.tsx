
import React, { useState, useMemo } from 'react';
import { MaterialCard } from '../components/MaterialCard';
// @fix: Added UserRole to imports
import { Unit, WaterMeter, WaterReading, UserRole } from '../types';
import { 
  ArrowLeft, Plus, Trash2, Droplets, 
  Check, X, History, Calculator, TrendingUp, 
  ChevronRight, ChevronDown, Building2, Info,
  Search, Calendar, Gauge, AlertTriangle, Layers,
  Banknote, Waves, Zap, ShieldCheck, DollarSign, PencilLine,
  ArrowDownAZ, Eye, EyeOff
} from 'lucide-react';

interface WaterProps {
  onBack: () => void;
  units: Unit[];
  meters: WaterMeter[];
  readings: WaterReading[];
  onMetersChange: (meters: WaterMeter[]) => void;
  onReadingsChange: (readings: WaterReading[]) => void;
  // @fix: Added missing userRole and activeUnitId props
  userRole?: UserRole;
  activeUnitId?: string | null;
}

export const Water: React.FC<WaterProps> = ({ onBack, units, meters, readings, onMetersChange, onReadingsChange,
  // @fix: Destructured userRole and activeUnitId
  userRole = 'ADMIN', activeUnitId
}) => {
  // @fix: Derived isAdmin from userRole
  const isAdmin = userRole === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [isAddingMeter, setIsAddingMeter] = useState<{ unitId: string | 'GENERAL', editingId?: string } | null>(null);
  const [isAddingReading, setIsAddingReading] = useState<{ meterId: string, editingId?: string } | null>(null);
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);
  const [excludedUnitIds, setExcludedUnitIds] = useState<Set<string>>(new Set());

  const [meterFormData, setMeterFormData] = useState({ serial: '', desc: '', baseline: 0 });
  const [readingFormData, setReadingFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    value: 0,
    consumptionAmount: 0,
    dischargeAmount: 0, 
    fixedAmount: 0
  });

  const toggleUnitExclusion = (unitId: string) => {
    const newExcluded = new Set(excludedUnitIds);
    if (newExcluded.has(unitId)) {
      newExcluded.delete(unitId);
    } else {
      newExcluded.add(unitId);
    }
    setExcludedUnitIds(newExcluded);
  };

  const filteredUnits = useMemo(() => {
    return [...units]
      .filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.owner.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a.floor !== b.floor) return (a.floor ?? 0) - (b.floor ?? 0);
        const stairA = (a.staircase || '').toUpperCase();
        const stairB = (b.staircase || '').toUpperCase();
        if (stairA !== stairB) return stairA.localeCompare(stairB);
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
  }, [units, searchTerm]);

  const generalMeter = useMemo(() => meters.find(m => m.unitId === 'GENERAL'), [meters]);
  
  const getMeterReadings = (meterId: string) => {
    return readings
      .filter(r => r.meterId === meterId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getMeterConsumption = (meterId: string, baseline: number) => {
    const sorted = getMeterReadings(meterId);
    if (sorted.length === 0) return 0;
    const consumption = sorted[0].value - baseline;
    return consumption > 0 ? consumption : 0;
  };

  const getMeterTotalCost = (meterId: string) => {
    const meterReadings = readings.filter(r => r.meterId === meterId);
    return meterReadings.reduce((sum, r) => 
      sum + (r.consumptionAmount || 0) + (r.dischargeAmount || 0) + (r.fixedAmount || 0), 0
    );
  };

  const getUnitTotalConsumption = (unitId: string) => {
    if (excludedUnitIds.has(unitId)) return 0;
    const unitMeters = meters.filter(m => m.unitId === unitId);
    return unitMeters.reduce((sum, m) => sum + getMeterConsumption(m.id, m.baseline), 0);
  };

  const getUnitTotalCost = (unitId: string) => {
    if (excludedUnitIds.has(unitId)) return 0;
    const unitMeters = meters.filter(m => m.unitId === unitId);
    return unitMeters.reduce((sum, m) => sum + getMeterTotalCost(m.id), 0);
  };

  const handleStartEditMeter = (meter: WaterMeter) => {
    setMeterFormData({
      serial: meter.serialNumber,
      desc: meter.description,
      baseline: meter.baseline
    });
    setIsAddingMeter({ unitId: meter.unitId, editingId: meter.id });
  };

  const handleSaveMeter = () => {
    if (!isAddingMeter) return;
    
    if (isAddingMeter.editingId) {
      const updatedMeters = meters.map(m => m.id === isAddingMeter.editingId ? {
        ...m,
        serialNumber: meterFormData.serial,
        description: meterFormData.desc,
        baseline: meterFormData.baseline
      } : m);
      onMetersChange(updatedMeters);
    } else {
      const newMeter: WaterMeter = {
        id: Math.random().toString(36).substr(2, 9),
        unitId: isAddingMeter.unitId,
        serialNumber: meterFormData.serial || 'S/N-ND',
        description: meterFormData.desc || (isAddingMeter.unitId === 'GENERAL' ? 'Generale Condominio' : 'Contatore Acqua'),
        baseline: meterFormData.baseline
      };
      onMetersChange([...meters, newMeter]);
    }
    
    setIsAddingMeter(null);
    setMeterFormData({ serial: '', desc: '', baseline: 0 });
  };

  const handleStartEditReading = (reading: WaterReading) => {
    setReadingFormData({
      date: reading.date,
      value: reading.value,
      consumptionAmount: reading.consumptionAmount || 0,
      dischargeAmount: reading.dischargeAmount || 0,
      fixedAmount: reading.fixedAmount || 0
    });
    setIsAddingReading({ meterId: reading.meterId, editingId: reading.id });
  };

  const handleSaveReading = () => {
    if (!isAddingReading) return;

    if (isAddingReading.editingId) {
      const updatedReadings = readings.map(r => r.id === isAddingReading.editingId ? {
        ...r,
        date: readingFormData.date,
        value: readingFormData.value,
        consumptionAmount: readingFormData.consumptionAmount,
        dischargeAmount: readingFormData.dischargeAmount,
        fixedAmount: readingFormData.fixedAmount
      } : r);
      onReadingsChange(updatedReadings);
    } else {
      const newReading: WaterReading = {
        id: Math.random().toString(36).substr(2, 9),
        meterId: isAddingReading.meterId,
        date: readingFormData.date,
        value: readingFormData.value,
        consumptionAmount: readingFormData.consumptionAmount,
        dischargeAmount: readingFormData.dischargeAmount,
        fixedAmount: readingFormData.fixedAmount
      };
      onReadingsChange([...readings, newReading]);
    }

    setIsAddingReading(null);
    setReadingFormData({ 
      date: new Date().toISOString().split('T')[0], 
      value: 0,
      consumptionAmount: 0,
      dischargeAmount: 0,
      fixedAmount: 0
    });
  };

  const handleDeleteMeter = (id: string) => {
    if (confirm("Rimuovere il contatore e tutte le letture associate?")) {
      onMetersChange(meters.filter(m => m.id !== id));
      onReadingsChange(readings.filter(r => r.meterId !== id));
    }
  };

  const handleDeleteReading = (id: string) => {
    if (confirm("Eliminare definitivamente questa lettura?")) {
      onReadingsChange(readings.filter(r => r.id !== id));
    }
  };

  const totalPrivateConsumption = useMemo(() => {
    return units.reduce((sum, u) => sum + getUnitTotalConsumption(u.id), 0);
  }, [meters, readings, units, excludedUnitIds]);

  const generalConsumption = useMemo(() => {
    if (!generalMeter) return 0;
    return getMeterConsumption(generalMeter.id, generalMeter.baseline);
  }, [generalMeter, readings]);

  const totalPrivateCost = useMemo(() => {
    return units.reduce((sum, u) => sum + getUnitTotalCost(u.id), 0);
  }, [meters, readings, units, excludedUnitIds]);

  const generalCost = useMemo(() => {
    if (!generalMeter) return 0;
    return getMeterTotalCost(generalMeter.id);
  }, [generalMeter, readings]);

  const discrepancy = generalConsumption - totalPrivateConsumption;

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
        <ArrowLeft size={20} />
        <span>TORNA ALLA DASHBOARD</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-3 tracking-tighter leading-none">
            GESTIONE ACQUA
            <div className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 text-[9px] px-3 py-1 rounded-full font-black">UNIFIED METERING</div>
          </h1>
          <p className="text-xs font-black text-slate-500 uppercase tracking-tight mt-3 flex items-center gap-2">
            <ArrowDownAZ size={14} className="text-cyan-500" /> Elenco strutturato per Piano e Scala
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="CERCA UNITÀ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none focus:border-cyan-500 transition-all w-64 shadow-sm dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MaterialCard className="bg-cyan-600 text-white border-none shadow-xl shadow-cyan-100 dark:shadow-none">
          <label className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-2 block">BILANCIO GENERALE CONDOMINIO</label>
          <p className="text-3xl font-black">{generalConsumption.toLocaleString('it-IT')} mc</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold opacity-80 uppercase">
            <Banknote size={14} /> SPESA TOTALE: € {generalCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </MaterialCard>

        <MaterialCard className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 border shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">SOMMA CONSUMI PRIVATI</label>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{totalPrivateConsumption.toLocaleString('it-IT')} mc</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
             <DollarSign size={14} className="text-cyan-600" /> COSTO AGGREGATO: € {totalPrivateCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </MaterialCard>

        <MaterialCard className={discrepancy > 10 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 border" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 border"}>
          <div className={discrepancy > 10 ? "flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black mb-2 uppercase text-[10px]" : "flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black mb-2 uppercase text-[10px]"}>
            {discrepancy > 10 ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
            <span>ECCEDENZA / DISPERSIONE</span>
          </div>
          <p className={`text-3xl font-black ${discrepancy > 10 ? 'text-amber-900 dark:text-amber-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
            {discrepancy.toLocaleString('it-IT')} mc
          </p>
          <p className="text-[10px] text-slate-500 mt-2 uppercase font-black">
            {discrepancy > 0 ? `${((discrepancy / (generalConsumption || 1)) * 100).toFixed(1)}% SCARTO` : 'PERFETTO ALLINEAMENTO'}
          </p>
        </MaterialCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <MaterialCard className="border-cyan-200 dark:border-cyan-800 border-2 bg-white dark:bg-slate-900 h-fit shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Gauge size={18} /> GENERALE CONDOMINIO
              </h3>
              {generalMeter && isAdmin && (
                <button 
                  onClick={() => handleStartEditMeter(generalMeter)}
                  className="p-2 text-slate-400 hover:text-cyan-600 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm"
                >
                  <PencilLine size={18} />
                </button>
              )}
            </div>
            
            {generalMeter ? (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                   <div className="relative z-10">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">SERIALE: {generalMeter.serialNumber}</p>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-4">{generalMeter.description}</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">BASELINE</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300">{generalMeter.baseline} mc</p>
                        </div>
                        <div className="bg-cyan-600 p-3 rounded-2xl text-white shadow-lg">
                          <p className="text-[8px] font-black opacity-60 uppercase mb-1">ULTIMA LETTURA</p>
                          <p className="text-xs font-black">
                            {getMeterReadings(generalMeter.id)[0]?.value || generalMeter.baseline} mc
                          </p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <History size={14} /> STORICO LETTURE
                   </h5>
                   {getMeterReadings(generalMeter.id).slice(0, 10).map(r => {
                     const totalReadingCost = (r.consumptionAmount || 0) + (r.dischargeAmount || 0) + (r.fixedAmount || 0);
                     const isReadingExpanded = expandedReadingId === r.id;
                     
                     return (
                      <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden mb-2 group shadow-sm transition-all hover:border-cyan-200">
                        <div 
                          onClick={() => setExpandedReadingId(isReadingExpanded ? null : r.id)}
                          className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isReadingExpanded ? 'bg-cyan-50/50 dark:bg-cyan-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                        >
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(r.date).toLocaleDateString('it-IT')}</span>
                              {isReadingExpanded && <span className="text-[8px] font-bold text-cyan-600 uppercase">Dettaglio Attivo</span>}
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-right">
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">{r.value} mc</span>
                                  <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase">€ {totalReadingCost.toFixed(2)}</span>
                              </div>
                              <ChevronRight size={14} className={`text-slate-300 transition-transform ${isReadingExpanded ? 'rotate-90 text-cyan-500' : ''}`} />
                           </div>
                        </div>
                        {isReadingExpanded && (
                          <div className="px-4 pb-4 pt-2 bg-cyan-50/10 dark:bg-cyan-900/5 border-t border-slate-50 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-1">
                             <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>Consumo</span><span className="text-slate-700 dark:text-slate-300">€ {r.consumptionAmount?.toFixed(2)}</span></div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>Allont./Depur.</span><span className="text-slate-700 dark:text-slate-300">€ {r.dischargeAmount?.toFixed(2)}</span></div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>Quote Fisse</span><span className="text-slate-700 dark:text-slate-300">€ {r.fixedAmount?.toFixed(2)}</span></div>
                             </div>
                             {isAdmin && (
                               <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartEditReading(r); }}
                                    className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center justify-center gap-1.5"
                                  >
                                    <PencilLine size={12} /> Modifica
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteReading(r.id); }}
                                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/30 text-red-500 text-[8px] font-black uppercase rounded-lg border border-red-100 dark:border-red-800 flex items-center justify-center gap-1.5"
                                  >
                                    <Trash2 size={12} /> Elimina
                                  </button>
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                     );
                   })}
                   {isAdmin && (
                     <button 
                      onClick={() => setIsAddingReading({ meterId: generalMeter.id })}
                      className="w-full py-4 border-2 border-dashed border-cyan-100 dark:border-cyan-800 rounded-3xl text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all uppercase flex items-center justify-center gap-2 shadow-sm"
                     >
                       <Plus size={16} /> REGISTRA LETTURA GENERALE
                     </button>
                   )}
                </div>
              </div>
            ) : (
              isAdmin && (
                <div className="py-12 text-center">
                  <AlertTriangle size={32} className="mx-auto text-amber-400 mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase mb-6">Contatore generale non configurato.</p>
                  <button 
                    onClick={() => setIsAddingMeter({ unitId: 'GENERAL' })}
                    className="m3-button bg-cyan-600 text-white font-black uppercase text-[10px] shadow-lg"
                  >
                    CONFIGURA ORA
                  </button>
                </div>
              )
            )}
          </MaterialCard>
        </div>

        <div className="lg:col-span-2">
          <MaterialCard className="p-0 border-none overflow-hidden bg-transparent shadow-none">
            <div className="space-y-4">
              {filteredUnits.map(unit => {
                const unitMeters = meters.filter(m => m.unitId === unit.id);
                const isExcluded = excludedUnitIds.has(unit.id);
                const unitConsumption = getUnitTotalConsumption(unit.id);
                const unitCost = getUnitTotalCost(unit.id);
                const isExpanded = expandedUnitId === unit.id;

                return (
                  <div key={unit.id} className={`bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-all ${isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div 
                      onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                      className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-cyan-50/10 dark:bg-cyan-900/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex flex-col items-center justify-center ${isExcluded ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'} p-2.5 rounded-2xl min-w-[55px] shadow-inner`}>
                          <span className="text-[7px] font-black uppercase leading-none mb-1">Piano</span>
                          <span className="text-sm font-black leading-none">{unit.floor}</span>
                          <span className="text-[6px] font-bold opacity-60 uppercase mt-1">S. {unit.staircase || '-'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase leading-none">{unit.name}</h4>
                            {isExcluded && <span className="text-[7px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">ESCLUSA</span>}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{unit.owner}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CONSUMO UNIFICATO</p>
                          <p className={`text-lg font-black leading-none ${isExcluded ? 'text-slate-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                            {isExcluded ? '--' : `${unitConsumption} mc`}
                          </p>
                          {!isExcluded && <p className="text-[10px] font-black text-slate-400 uppercase mt-1">€ {unitCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {isAdmin && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleUnitExclusion(unit.id); }}
                              className={`p-3 rounded-2xl transition-all ${isExcluded ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}
                              title={isExcluded ? "Includi unità" : "Escludi unità"}
                            >
                              {isExcluded ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          )}
                          {isExpanded ? <ChevronDown size={24} className="text-slate-400" /> : <ChevronRight size={24} className="text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                        <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6"></div>
                        
                        {isExcluded && (
                          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-3xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
                            <AlertTriangle size={18} className="text-rose-600" />
                            <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase leading-relaxed">
                              L'unità è esclusa dal calcolo idrico. Eventuali letture salvate non incideranno sul bilancio generale e sulla dispersione.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {unitMeters.map(meter => {
                            const meterConsumption = getMeterConsumption(meter.id, meter.baseline);
                            return (
                              <div key={meter.id} className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 group relative shadow-inner">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">S/N: {meter.serialNumber}</p>
                                    <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase">{meter.description}</h5>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button onClick={() => handleStartEditMeter(meter)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-900 rounded-xl shadow-sm"><PencilLine size={16}/></button>
                                      <button onClick={() => handleDeleteMeter(meter.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-900 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">CONSUMO PARZIALE</p>
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{meterConsumption} mc</p>
                                  </div>
                                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">COSTO PARZIALE</p>
                                    <p className="text-xs font-black text-cyan-600 dark:text-cyan-400">€ {getMeterTotalCost(meter.id).toFixed(2)}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h6 className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2 mb-3 tracking-widest">
                                    <History size={12} /> STORICO LETTURE
                                  </h6>
                                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                    {getMeterReadings(meter.id).map(r => {
                                      const isRowExpanded = expandedReadingId === r.id;
                                      return (
                                        <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-800 overflow-hidden shadow-sm transition-all group/reading">
                                           <div 
                                              onClick={() => setExpandedReadingId(isRowExpanded ? null : r.id)}
                                              className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                           >
                                              <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(r.date).toLocaleDateString('it-IT')}</span>
                                              <div className="flex items-center gap-3">
                                                 <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{r.value} mc</span>
                                                 <ChevronRight size={12} className={`text-slate-300 transition-transform ${isRowExpanded ? 'rotate-90' : ''}`} />
                                              </div>
                                           </div>
                                           {isRowExpanded && (
                                              <div className="px-3 pb-3 pt-1 border-t border-slate-50 dark:border-slate-800 bg-slate-50/20">
                                                 <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Valore Economico</span>
                                                    <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400">€ {((r.consumptionAmount||0)+(r.dischargeAmount||0)+(r.fixedAmount||0)).toFixed(2)}</span>
                                                 </div>
                                                 {isAdmin && (
                                                   <div className="flex gap-2">
                                                      <button onClick={() => handleStartEditReading(r)} className="flex-1 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase rounded-lg">Modifica</button>
                                                      <button onClick={() => handleDeleteReading(r.id)} className="flex-1 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 text-[8px] font-black uppercase rounded-lg">Elimina</button>
                                                   </div>
                                                 )}
                                              </div>
                                           )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {isAdmin && (
                                    <button 
                                      onClick={() => setIsAddingReading({ meterId: meter.id })}
                                      className="w-full mt-4 py-3 bg-white dark:bg-slate-900 text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase border border-cyan-100 dark:border-cyan-800 rounded-xl transition-all shadow-sm hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                                    >
                                      <Plus size={14} /> AGGIUNGI LETTURA
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {isAdmin && (
                            <button 
                              onClick={() => setIsAddingMeter({ unitId: unit.id })}
                              className="h-full min-h-[160px] border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] flex flex-col items-center justify-center gap-2 text-slate-300 hover:border-cyan-200 dark:hover:border-cyan-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all group shadow-sm bg-slate-50/30 dark:bg-slate-900/30"
                            >
                              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                                <Plus size={32} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest">NUOVO CONTATORE PER UNITÀ</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </MaterialCard>
        </div>
      </div>

      {isAddingMeter && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <MaterialCard className="max-w-md w-full p-8 shadow-2xl bg-white dark:bg-slate-900 border-none animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <div className="bg-cyan-600 p-2 rounded-xl text-white shadow-lg"><Gauge size={24}/></div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{isAddingMeter.editingId ? 'Modifica Dispositivo' : 'Inizializza Contatore'}</h3>
              </div>
              <button onClick={() => setIsAddingMeter(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">NUMERO SERIALE</label>
                <input 
                  type="text" 
                  value={meterFormData.serial} 
                  onChange={(e) => setMeterFormData({...meterFormData, serial: e.target.value})}
                  placeholder="ES: SN123456" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black uppercase text-xs dark:text-white outline-none focus:border-cyan-500 transition-all shadow-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">LOCALIZZAZIONE / NOME</label>
                <input 
                  type="text" 
                  value={meterFormData.desc} 
                  onChange={(e) => setMeterFormData({...meterFormData, desc: e.target.value})}
                  placeholder="ES: BAGNO PADRONALE" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black uppercase text-xs dark:text-white outline-none focus:border-cyan-500 transition-all shadow-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">LETTURA INIZIALE (BASELINE)</label>
                <input 
                  type="number" 
                  value={meterFormData.baseline || ''} 
                  onChange={(e) => setMeterFormData({...meterFormData, baseline: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs dark:text-white outline-none focus:border-cyan-500 transition-all shadow-sm" 
                />
              </div>
              <button 
                onClick={handleSaveMeter}
                className="w-full py-5 bg-cyan-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-xl hover:bg-cyan-700 transition-all tracking-widest"
              >
                {isAddingMeter.editingId ? 'AGGIORNA DISPOSITIVO' : 'ATTIVA CONTATORE'}
              </button>
            </div>
          </MaterialCard>
        </div>
      )}

      {isAddingReading && isAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <MaterialCard className="max-w-xl w-full p-8 shadow-2xl bg-white dark:bg-slate-900 border-none animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white dark:bg-slate-900 z-10 py-2 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="bg-cyan-600 p-2 rounded-xl text-white shadow-lg"><Waves size={24}/></div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{isAddingReading.editingId ? 'Rettifica Lettura' : 'Registrazione Lettura'}</h3>
              </div>
              <button onClick={() => setIsAddingReading(null)} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center gap-2 border-b border-cyan-50 dark:border-cyan-900/30 pb-2">
                  <Gauge size={14} /> RILEVAZIONE TECNICA</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase px-1">DATA</label>
                    <input 
                      type="date" 
                      value={readingFormData.date} 
                      onChange={(e) => setReadingFormData({...readingFormData, date: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 font-black text-xs dark:text-white outline-none focus:border-cyan-500 shadow-inner transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase px-1">VALORE (mc)</label>
                    <input 
                      type="number" 
                      value={readingFormData.value || ''} 
                      onChange={(e) => setReadingFormData({...readingFormData, value: parseFloat(e.target.value) || 0})}
                      placeholder="0.00" 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 font-black text-xs dark:text-white outline-none focus:border-cyan-500 shadow-inner transition-all" 
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-50 dark:border-indigo-900/30 pb-2">
                  <Banknote size={14} /> ADDEBITI ECONOMICI</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                      <Waves size={12} className="text-cyan-500" /> CONSUMO (€)
                    </label>
                    <input 
                      type="number" step="0.01" 
                      value={readingFormData.consumptionAmount || ''} 
                      onChange={(e) => setReadingFormData({...readingFormData, consumptionAmount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 font-black text-xs dark:text-white outline-none focus:border-cyan-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                      <Waves size={12} className="text-amber-500" /> ALLONT./DEPUR. (€)
                    </label>
                    <input 
                      type="number" step="0.01" 
                      value={readingFormData.dischargeAmount || ''} 
                      onChange={(e) => setReadingFormData({...readingFormData, dischargeAmount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 font-black text-xs dark:text-white outline-none focus:border-cyan-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1">
                      <Zap size={12} className="text-emerald-500" /> QUOTE FISSE (€)
                    </label>
                    <input 
                      type="number" step="0.01" 
                      value={readingFormData.fixedAmount || ''} 
                      onChange={(e) => setReadingFormData({...readingFormData, fixedAmount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 font-black text-xs dark:text-white outline-none focus:border-cyan-500 transition-all" 
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[32px] flex justify-between items-center shadow-2xl border border-slate-800">
                 <div>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">TOTALE LETTURA CORRENTE</p>
                    <p className="text-3xl font-black text-white tracking-tighter">€ {(readingFormData.consumptionAmount + readingFormData.dischargeAmount + readingFormData.fixedAmount).toFixed(2)}</p>
                 </div>
                 <div className="bg-white/10 p-3 rounded-full text-emerald-400 shadow-inner">
                    <Check size={32} />
                 </div>
              </div>
              <button 
                onClick={handleSaveReading}
                className="w-full py-5 bg-cyan-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-xl hover:bg-cyan-700 transition-all tracking-widest"
              >
                {isAddingReading.editingId ? 'CONFERMA RETTIFICA' : 'REGISTRA LETTURA'}
              </button>
            </div>
          </MaterialCard>
        </div>
      )}

      <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-[40px] p-8 flex gap-6 border border-cyan-100 dark:border-cyan-900/40 relative overflow-hidden shadow-inner mx-1">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] text-cyan-600 dark:text-cyan-400 shadow-sm h-fit">
          <Info size={28} />
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-black text-slate-900 dark:text-white uppercase mb-2">Ispezione Sequenziale Contatori</h4>
          <p className="text-[11px] text-slate-600 dark:text-cyan-300/70 font-bold leading-relaxed uppercase tracking-tight max-w-4xl">
            L'elenco è ordinato per Scala e Piano (dal seminterrato in su) per facilitare il giro di lettura fisico dei contatori all'interno dell'edificio. Se un'unità possiede più dispositivi (es. Bagno e Cucina), verranno visualizzati aggregati sotto la stessa unità immobiliare. Le unità escluse (EyeOff) non concorrono ai calcoli della dispersione condominiale.
          </p>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
};
