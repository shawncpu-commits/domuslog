
import React from 'react';
import { 
  ShoppingCart, 
  Banknote, 
  Droplets, 
  Building2, 
  Scale, 
  Wallet,
  Tag,
  FileText,
  Home,
  Landmark,
  LayoutGrid,
  Calculator,
  CalendarDays,
  Users
} from 'lucide-react';
import { AppView, Transaction, BankAccount, Unit, MillesimalTable, WaterMeter, WaterReading } from './types';

export const COLORS = {
  primary: '#818cf8',    // Pastel Indigo
  secondary: '#a5b4fc',  // Lighter Indigo
  expense: '#fb7185',    // Pastel Rose
  income: '#34d399',     // Pastel Emerald
  accent: '#fbbf24',     // Pastel Amber
  background: '#fdfdff',
  text: '#1e293b'        // Soft Slate
};

export const DOCK_ITEMS = [
  { id: AppView.HOME, label: 'Home', icon: <Home size={24} /> },
  { id: AppView.EXPENSES, label: 'Spese', icon: <ShoppingCart size={24} /> },
  { id: AppView.INCOME, label: 'Incassi', icon: <Banknote size={24} /> },
  { id: AppView.UNITS, label: 'Unità', icon: <Users size={24} /> },
  { id: AppView.WATER, label: 'Acqua', icon: <Droplets size={24} /> },
  { id: AppView.MILLESIMI, label: 'Tabelle', icon: <LayoutGrid size={24} /> },
  { id: AppView.BUDGET, label: 'Bilancio', icon: <Scale size={24} /> },
];

export const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Manutenzione', color: '#fda4af' }, // Pastel Red
  { id: 'c2', name: 'Quote', color: '#6ee7b7' },      // Pastel Green
  { id: 'c3', name: 'Pulizie', color: '#93c5fd' },     // Pastel Blue
  { id: 'c4', name: 'Amministrazione', color: '#fde68a' }, // Pastel Yellow
  { id: 'c5', name: 'Lavori Straordinari', color: '#c084fc' }, // Pastel Purple
  { id: 'c6', name: 'Utenze', color: '#a5b4fc' },      // Pastel Indigo
];

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'b1', name: 'Conto Ordinario', bankName: 'Intesa Sanpaolo', iban: 'IT60X0123456789012345678901', balance: 15420.50 }
];

export const MOCK_UNITS: Unit[] = [
  { id: 'u1', name: 'Int. 1', owner: 'Mario Rossi', phones: [{ label: 'Principale', value: '+39 333 1234567' }], emails: [{ label: 'Principale', value: 'mario.rossi@email.it' }], millesimi: 120.5, waterMeter: 450, floor: 0, staircase: 'A', monthlyFee: 150 },
  { id: 'u2', name: 'Int. 2', owner: 'Luigi Bianchi', phones: [{ label: 'Principale', value: '+39 333 7654321' }], emails: [{ label: 'Principale', value: 'luigi.bianchi@email.it' }], millesimi: 85.0, waterMeter: 320, floor: 0, staircase: 'A', monthlyFee: 110 },
  { id: 'u3', name: 'Int. 3', owner: 'Anna Verdi', phones: [{ label: 'Principale', value: '+39 347 1122334' }], emails: [{ label: 'Principale', value: 'anna.verdi@email.it' }], millesimi: 105.2, waterMeter: 510, floor: 1, staircase: 'A', monthlyFee: 135 },
];

export const MOCK_MILLESIMAL_TABLES: MillesimalTable[] = [
  { id: 't1', name: 'Tabella A - Proprietà Generale', description: 'Ripartizione spese generali.' },
];

export const MOCK_WATER_METERS: WaterMeter[] = [
  { id: 'm-gen', unitId: 'GENERAL', serialNumber: 'GEN-2024-99', description: 'Generale Condominio', baseline: 1000 },
  { id: 'm-u1-1', unitId: 'u1', serialNumber: 'SN-U1-A', description: 'Contatore Bagno', baseline: 100 },
  { id: 'm-u1-2', unitId: 'u1', serialNumber: 'SN-U1-B', description: 'Contatore Cucina', baseline: 50 },
  { id: 'm-u2-1', unitId: 'u2', serialNumber: 'SN-U2-A', description: 'Contatore Unico', baseline: 200 },
];

export const MOCK_WATER_READINGS: WaterReading[] = [
  { id: 'r1', meterId: 'm-gen', date: '2023-12-31', value: 1250, consumptionAmount: 400, dischargeAmount: 80, purificationAmount: 120, fixedAmount: 50 },
  { id: 'r2', meterId: 'm-u1-1', date: '2023-12-31', value: 145, consumptionAmount: 70, dischargeAmount: 15, purificationAmount: 20, fixedAmount: 10 },
  { id: 'r3', meterId: 'm-u1-2', date: '2023-12-31', value: 62, consumptionAmount: 20, dischargeAmount: 5, purificationAmount: 8, fixedAmount: 10 },
  { id: 'r4', meterId: 'm-u2-1', date: '2023-12-31', value: 238, consumptionAmount: 60, dischargeAmount: 12, purificationAmount: 18, fixedAmount: 10 },
];
