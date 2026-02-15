
import React, { useState } from 'react';
import { MaterialCard } from '../components/MaterialCard';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { AppView, Category, Transaction } from '../types';

interface CashAvailabilityProps {
  onBack: () => void;
  categories: Category[];
  // Added missing transactions property
  transactions: Transaction[];
}

export const CashAvailability: React.FC<CashAvailabilityProps> = ({ onBack, categories, transactions }) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleCategory = (catName: string) => {
    setExpandedCat(expandedCat === catName ? null : catName);
  };

  const grouped = categories.map(cat => {
    // Use transactions from props instead of MOCK_TRANSACTIONS
    const items = transactions.filter(t => t.category === cat.name);
    const balance = items.reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);
    return { ...cat, items, balance };
  });

  // Calculate total balance from grouped categories
  const totalBalance = grouped.reduce((sum, cat) => sum + cat.balance, 0);

  return (
    <div className="pb-32 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-black mb-6 hover:translate-x-[-4px] transition-transform uppercase text-sm">
        <ArrowLeft size={20} />
        <span>TORNA ALLA DASHBOARD</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-900 uppercase">DISPONIBILITÀ CASSA</h1>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-lg text-right">
          <p className="text-[10px] opacity-70 uppercase font-black tracking-widest">SALDO TOTALE</p>
          <p className="text-2xl font-black">€ {totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map((cat) => (
          <MaterialCard key={cat.id} className="p-0 border-none">
            <div 
              onClick={() => toggleCategory(cat.name)}
              className="p-6 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 user-data">{cat.name}</h3>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-tighter">{cat.items.length} TRANSAZIONI</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className={`text-lg font-black ${cat.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {cat.balance >= 0 ? '+' : ''}{cat.balance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </p>
                {expandedCat === cat.name ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {expandedCat === cat.name && (
              <div className="px-6 pb-6 border-t border-slate-50 pt-4 bg-slate-50/50">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 font-black tracking-widest">
                      <th className="pb-2">DATA</th>
                      <th className="pb-2">DESCRIZIONE</th>
                      <th className="pb-2 text-right">IMPORTO</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {cat.items.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 text-slate-500 font-black">{new Date(item.date).toLocaleDateString('it-IT')}</td>
                        <td className="py-2 text-slate-800 font-black user-data">{item.description}</td>
                        <td className={`py-2 text-right font-black ${item.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {item.type === 'INCOME' ? '+' : '-'}{item.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MaterialCard>
        ))}
      </div>
    </div>
  );
};
