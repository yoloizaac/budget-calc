import { addDays, addMonths, getDaysInMonth, parse, isWithinInterval, startOfMonth, endOfMonth, format } from 'date-fns';

export interface Settings {
  fx_rate: number;
  fx_rate_thb: number;
  fx_rate_vnd: number;
  fx_rate_cny: number;
  fx_rate_myr: number;
  fx_rate_idr: number;
  fx_rate_inr: number;
  fx_rate_usd: number;
  fx_rate_eur: number;
  internship_start: string;
  internship_end: string;
  sg_break_start: string;
  sg_break_days: number;
  monthly_rent_thb: number;
  school_funding_sgd: number;
  salary_thb: number;
  daily_lunch: number;
  daily_dinner: number;
  daily_other_food: number;
  daily_transport: number;
  daily_misc: number;
  display_name?: string;
  display_country?: string;
  display_currency?: string;
  salary_currency?: string;
  params_currency?: string;
  onboarding_completed?: string;
}

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  Thailand: 'THB',
  Singapore: 'SGD',
  Vietnam: 'VND',
  China: 'CNY',
  Malaysia: 'MYR',
  Indonesia: 'IDR',
  India: 'INR',
};

export const CURRENCY_INFO: Record<string, { symbol: string; label: string }> = {
  THB: { symbol: '฿', label: 'Thai Baht' },
  SGD: { symbol: 'S$', label: 'Singapore Dollar' },
  VND: { symbol: '₫', label: 'Vietnamese Dong' },
  CNY: { symbol: '¥', label: 'Chinese Yuan' },
  MYR: { symbol: 'RM', label: 'Malaysian Ringgit' },
  IDR: { symbol: 'Rp', label: 'Indonesian Rupiah' },
  INR: { symbol: '₹', label: 'Indian Rupee' },
  USD: { symbol: '$', label: 'US Dollar' },
  EUR: { symbol: '€', label: 'Euro' },
};

export const ALL_COUNTRIES = [
  { code: 'Thailand', flag: '🇹🇭', label: 'Thailand' },
  { code: 'Singapore', flag: '🇸🇬', label: 'Singapore' },
  { code: 'Vietnam', flag: '🇻🇳', label: 'Vietnam' },
  { code: 'China', flag: '🇨🇳', label: 'China' },
  { code: 'Malaysia', flag: '🇲🇾', label: 'Malaysia' },
  { code: 'Indonesia', flag: '🇮🇩', label: 'Indonesia' },
  { code: 'India', flag: '🇮🇳', label: 'India' },
];

export function getFxRateForCountry(country: string, settings: Settings): number {
  switch (country) {
    case 'Singapore': return 1;
    case 'Thailand': return settings.fx_rate_thb || settings.fx_rate || 26.5;
    case 'Vietnam': return settings.fx_rate_vnd || 17500;
    case 'China': return settings.fx_rate_cny || 5.3;
    case 'Malaysia': return settings.fx_rate_myr || 3.3;
    case 'Indonesia': return settings.fx_rate_idr || 11500;
    case 'India': return settings.fx_rate_inr || 62;
    default: return settings.fx_rate || 26.5;
  }
}

/** Get FX rate by currency code directly (needed for USD/EUR which have no country) */
export function getFxRateForCurrency(currency: string, settings: Settings): number {
  switch (currency) {
    case 'SGD': return 1;
    case 'THB': return settings.fx_rate_thb || settings.fx_rate || 26.5;
    case 'VND': return settings.fx_rate_vnd || 17500;
    case 'CNY': return settings.fx_rate_cny || 5.3;
    case 'MYR': return settings.fx_rate_myr || 3.3;
    case 'IDR': return settings.fx_rate_idr || 11500;
    case 'INR': return settings.fx_rate_inr || 62;
    case 'USD': return settings.fx_rate_usd || 0.74;
    case 'EUR': return settings.fx_rate_eur || 0.69;
    default: return 1;
  }
}

export function getCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY_MAP[country] || 'SGD';
}

export interface DailyLog {
  id: string;
  date: string;
  country: string;
  lunch_thb: number;
  dinner_thb: number;
  other_food_thb: number;
  transport_thb: number;
  misc_thb: number;
  notes?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  description?: string;
  amount_thb: number;
  payment_method?: string;
  country: string;
  is_reimbursable: boolean;
  has_receipt: boolean;
  notes?: string;
  created_at?: string;
}

export interface Funding {
  id: string;
  date?: string;
  source: string;
  description?: string;
  amount_thb: number;
  is_expected: boolean;
  is_received: boolean;
  notes?: string;
  currency?: string;
}

export interface RentPayment {
  id: string;
  month: string;
  due_date?: string;
  amount_thb: number;
  paid_date?: string;
  is_paid: boolean;
  payment_method?: string;
  notes?: string;
}

export const toSGD = (thb: number, fxRate: number): number => thb / fxRate;

export const toTHB = (sgd: number, fxRate: number): number => sgd * fxRate;

/** Convert an amount from one currency to another via SGD bridge.
 *  FX rates are "units per 1 SGD". */
export function convertAmount(amount: number, fromCurrency: string, toCurrency: string, settings: Settings): number {
  if (fromCurrency === toCurrency) return amount;
  const fromFx = getFxRateForCurrency(fromCurrency, settings);
  const toFx = getFxRateForCurrency(toCurrency, settings);
  return (amount / fromFx) * toFx;
}

export function getCountryForDate(date: Date, settings: Settings): 'Thailand' | 'Singapore' {
  const sgStart = new Date(settings.sg_break_start);
  const sgEnd = addDays(sgStart, settings.sg_break_days - 1);
  return date >= sgStart && date <= sgEnd ? 'Singapore' : 'Thailand';
}

export function parseSettingsMap(rows: { key: string; value: string }[]): Settings {
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.key] = r.value; });
  return {
    fx_rate: parseFloat(map.fx_rate || '26.5'),
    fx_rate_thb: parseFloat(map.fx_rate_thb || map.fx_rate || '26.5'),
    fx_rate_vnd: parseFloat(map.fx_rate_vnd || '17500'),
    fx_rate_cny: parseFloat(map.fx_rate_cny || '5.3'),
    fx_rate_myr: parseFloat(map.fx_rate_myr || '3.3'),
    fx_rate_idr: parseFloat(map.fx_rate_idr || '11500'),
    fx_rate_inr: parseFloat(map.fx_rate_inr || '62'),
    fx_rate_usd: parseFloat(map.fx_rate_usd || '0.74'),
    fx_rate_eur: parseFloat(map.fx_rate_eur || '0.69'),
    internship_start: map.internship_start || '2026-03-07',
    internship_end: map.internship_end || '2026-08-17',
    sg_break_start: map.sg_break_start || '2026-05-26',
    sg_break_days: parseInt(map.sg_break_days || '17'),
    monthly_rent_thb: parseFloat(map.monthly_rent_thb || '15500'),
    school_funding_sgd: parseFloat(map.school_funding_sgd || '10000'),
    salary_thb: parseFloat(map.salary_thb || '7000'),
    daily_lunch: parseFloat(map.daily_lunch || '80'),
    daily_dinner: parseFloat(map.daily_dinner || '100'),
    daily_other_food: parseFloat(map.daily_other_food || '40'),
    daily_transport: parseFloat(map.daily_transport || '40'),
    daily_misc: parseFloat(map.daily_misc || '20'),
    display_name: map.display_name || undefined,
    display_country: map.display_country || undefined,
    display_currency: map.display_currency || undefined,
    salary_currency: map.salary_currency || undefined,
    params_currency: map.params_currency || undefined,
  };
}

export function getDailyTotal(log: DailyLog): number {
  return (log.lunch_thb || 0) + (log.dinner_thb || 0) + (log.other_food_thb || 0) + (log.transport_thb || 0) + (log.misc_thb || 0);
}

export function remainingBalance(funding: Funding[], transactions: Transaction[], dailyLogs: DailyLog[]): number {
  const received = funding.filter(f => f.is_received).reduce((s, f) => s + Number(f.amount_thb), 0);
  const txSpend = transactions.reduce((s, t) => s + Number(t.amount_thb), 0);
  const dailySpend = dailyLogs.reduce((s, d) => s + getDailyTotal(d), 0);
  return received - txSpend - dailySpend;
}

export function getMonthDays(monthStr: string, settings: Settings): { bangkok: number; singapore: number } {
  // monthStr like "Mar 2026"
  const monthDate = parse(monthStr, 'MMM yyyy', new Date());
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const sgStart = new Date(settings.sg_break_start);
  const sgEnd = addDays(sgStart, settings.sg_break_days - 1);

  const totalDays = getDaysInMonth(monthDate);
  let sgDays = 0;

  for (let i = 0; i < totalDays; i++) {
    const day = addDays(monthStart, i);
    if (day >= sgStart && day <= sgEnd) sgDays++;
  }

  return { bangkok: totalDays - sgDays, singapore: sgDays };
}

export function getParamsCurrency(settings: Settings): string {
  return settings.params_currency || 'SGD';
}

export function getParamsFxRate(settings: Settings): number {
  const paramsCurrency = getParamsCurrency(settings);
  const paramsCountry = ALL_COUNTRIES.find(c => getCurrencyForCountry(c.code) === paramsCurrency)?.code || 'Singapore';
  return getFxRateForCountry(paramsCountry, settings);
}

/** Convert a parameter value from params_currency to a target currency via SGD bridge */
export function convertParamsToTarget(value: number, settings: Settings, targetCurrency: string): number {
  const paramsFx = getParamsFxRate(settings);
  const targetCountry = ALL_COUNTRIES.find(c => getCurrencyForCountry(c.code) === targetCurrency)?.code || 'Singapore';
  const targetFx = getFxRateForCountry(targetCountry, settings);
  const inSGD = value / paramsFx;
  return inSGD * targetFx;
}

export function estimatedMonthlyCost(monthStr: string, settings: Settings): number {
  const days = getMonthDays(monthStr, settings);
  // Params (rent, daily costs) are in params_currency — convert to SGD first
  const paramsFx = getParamsFxRate(settings);
  const fixedInSGD = settings.monthly_rent_thb / paramsFx;
  const dailyBkk = settings.daily_lunch + settings.daily_dinner + settings.daily_other_food + settings.daily_transport + settings.daily_misc;
  const variableInSGD = (days.bangkok * dailyBkk) / paramsFx;
  // SG daily cost: 19.25 SGD/day baseline
  const sgVariableInSGD = days.singapore * 19.25;
  // Return total in SGD so callers can convert to any view currency
  return (fixedInSGD + variableInSGD + sgVariableInSGD);
}

/** Default fallback months (used when settings are not yet loaded) */
export const MONTHS = ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];

/** Dynamically generate months between internship_start and internship_end */
export function generateMonths(settings: Settings): string[] {
  try {
    const start = startOfMonth(new Date(settings.internship_start));
    const end = endOfMonth(new Date(settings.internship_end));
    const months: string[] = [];
    let current = start;
    while (current <= end) {
      months.push(format(current, 'MMM yyyy'));
      current = addMonths(current, 1);
    }
    return months.length > 0 ? months : MONTHS;
  } catch {
    return MONTHS;
  }
}

export const CATEGORIES = [
  'Rent', 'Utilities', 'Internet', 'Mobile Data', 'Lunch', 'Dinner',
  'Snacks/Drinks', 'Transport', 'Grab', 'Toiletries', 'Medicine',
  'Household', 'Laundry', 'Subscriptions', 'One-time Setup', 'Entertainment', 'Other'
] as const;

export type Category = typeof CATEGORIES[number];

export const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'QR', 'Card', 'Grab', 'Other'] as const;

export const CATEGORY_COLORS = {
  Rent: '#1F3864',
  Utilities: '#2E75B6',
  Internet: '#5B9BD5',
  'Mobile Data': '#9DC3E6',
  Lunch: '#E2725B',
  Dinner: '#C0392B',
  'Snacks/Drinks': '#F39C12',
  Transport: '#27AE60',
  Grab: '#1ABC9C',
  Toiletries: '#8E44AD',
  Medicine: '#E74C3C',
  Household: '#D35400',
  Laundry: '#7F8C8D',
  Subscriptions: '#2980B9',
  'One-time Setup': '#34495E',
  Entertainment: '#F1C40F',
  Other: '#95A5A6',
} satisfies Record<Category, string>;

export function formatTHB(amount: number): string {
  return `฿${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatSGD(amount: number): string {
  return `S$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const info = CURRENCY_INFO[currencyCode];
  const symbol = info?.symbol || '$';
  // VND and IDR: no decimals; others: 0 decimals for large amounts
  const useDecimals = currencyCode === 'SGD';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: useDecimals ? 2 : 0, maximumFractionDigits: useDecimals ? 2 : 0 })}`;
}
