
export enum AppView {
  LANDING = 'LANDING',
  HOME = 'HOME',
  EXPENSES = 'EXPENSES',
  INCOME = 'INCOME',
  WATER = 'WATER',
  UNITS = 'UNITS',
  MILLESIMI = 'MILLESIMI',
  BUDGET = 'BUDGET',
  CASH_AVAILABILITY = 'CASH_AVAILABILITY',
  CATEGORIES = 'CATEGORIES',
  MONTHLY_QUOTAS = 'MONTHLY_QUOTAS',
  ADJUSTMENT_QUOTAS = 'ADJUSTMENT_QUOTAS',
  MODEL_770 = 'MODEL_770',
  BANK = 'BANK',
  TRASH = 'TRASH',
  INSURANCE = 'INSURANCE',
  REGULATION = 'REGULATION',
  RECEIPTS = 'RECEIPTS'
}

export type UserRole = 'ADMIN' | 'CONDOMINO';

export interface CondoRegulation {
  name: string;
  type: string;
  data: string; // base64 string
  size: number;
  uploadedAt: string;
}

export interface InsurancePolicy {
  id: string;
  company: string;
  policyNumber: string;
  expiryDate: string;
  premium: number;
  coverageDetails: string;
  isActive: boolean;
}

export interface TrashItem {
  id: string;
  type: 'EXPENSE' | 'INCOME' | 'UNIT';
  data: any;
  deletedAt: string;
}

export interface ContactInfo {
  label: string;
  value: string;
}

export interface WaterReading {
  id: string;
  meterId: string;
  date: string;
  value: number;
  consumptionAmount?: number;
  dischargeAmount?: number;
  purificationAmount?: number;
  fixedAmount?: number;
  note?: string;
}

export interface WaterMeter {
  id: string;
  unitId: string | 'GENERAL';
  serialNumber: string;
  description: string;
  baseline: number;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  category?: string;
  tax?: number;
}

export type PaymentMethod = 'BONIFICO' | 'CONTANTI' | 'ASSEGNO' | 'MAV' | 'ADDEBITO' | 'ALTRO';
export type PayerType = 'PROPRIETARIO' | 'INQUILINO' | 'ENTRAMBI';
export type PaymentStatus = 'PAGATO' | 'NON_PAGATO' | 'IN_ATTESA';

export interface TableSplit {
  tableId: string;
  percentage: number;
}

export interface PayerSplit {
  ownerPercentage: number;
  tenantPercentage: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  netAmount: number;
  taxAmount: number;
  category: string;
  description: string;
  type: 'EXPENSE' | 'INCOME';
  ritenuta?: number;
  provider?: string;
  providerFiscalCode?: string;
  tributoCode?: string;
  documentType?: 'FATTURA' | 'BOLLETTA' | 'BOLLETTINO';
  items?: InvoiceItem[];
  unit?: string;
  paymentMethod?: PaymentMethod;
  receiptNumber?: string;
  payerType: PayerType;
  payerSplit?: PayerSplit;
  bankAccountId?: string;
  tableId?: string;
  splits?: TableSplit[];
  paymentStatus?: PaymentStatus;
  paymentDate?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  iban: string;
  bankName: string;
  balance: number;
}

export interface CategoryDistribution {
  categoryId: string;
  tenantPercentage: number;
}

export interface BudgetCategory {
  categoryId: string;
  estimatedAmount: number;
}

export interface Unit {
  id: string;
  name: string;
  owner: string;
  tenant?: string;
  millesimi: number;
  waterMeter: number;
  floor: number;
  staircase?: string;
  civic?: string;
  phones?: ContactInfo[];
  emails?: ContactInfo[];
  monthlyFee?: number;
  leaseStartDate?: string;
  ownerPreviousBalance?: number;
  tenantPreviousBalance?: number;
  categoryDistributions?: CategoryDistribution[];
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isExcluded?: boolean;
  isIncludedInMonthlyQuota?: boolean;
  isAdjustmentCategory?: boolean;
}

export interface UnitMillesimalValue {
  unitId: string;
  value: number;
  isExcluded?: boolean;
  label?: string;
  tempId?: string;
}

export interface MillesimalTable {
  id: string;
  name: string;
  description: string;
  categoryIds?: string[];
  unitValues?: UnitMillesimalValue[];
  isActive?: boolean;
  order?: number;
}
