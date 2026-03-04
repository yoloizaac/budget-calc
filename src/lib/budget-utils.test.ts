import { describe, expect, it } from 'vitest';

import {
  convertAmount,
  estimatedMonthlyCost,
  getFxRateForCurrency,
  getMonthDays,
  remainingBalance,
  type DailyLog,
  type Funding,
  type Settings,
  type Transaction,
} from './budget-utils';

const baseSettings: Settings = {
  fx_rate: 26.5,
  fx_rate_thb: 25,
  fx_rate_vnd: 17500,
  fx_rate_cny: 5.3,
  fx_rate_myr: 3.3,
  fx_rate_idr: 11500,
  fx_rate_inr: 62,
  fx_rate_usd: 0.8,
  fx_rate_eur: 0.7,
  internship_start: '2026-03-07',
  internship_end: '2026-08-17',
  sg_break_start: '2026-05-26',
  sg_break_days: 17,
  monthly_rent_thb: 25000,
  school_funding_sgd: 10000,
  salary_thb: 7000,
  daily_lunch: 10,
  daily_dinner: 20,
  daily_other_food: 5,
  daily_transport: 5,
  daily_misc: 0,
  params_currency: 'THB',
};

describe('getFxRateForCurrency', () => {
  it('returns explicit and fixed rates', () => {
    expect(getFxRateForCurrency('SGD', baseSettings)).toBe(1);
    expect(getFxRateForCurrency('THB', baseSettings)).toBe(25);
    expect(getFxRateForCurrency('USD', baseSettings)).toBe(0.8);
  });

  it('falls back to defaults for missing rates and unknown currencies', () => {
    const settingsWithMissingRates = {
      ...baseSettings,
      fx_rate: 30,
      fx_rate_thb: 0,
      fx_rate_usd: 0,
    };

    expect(getFxRateForCurrency('THB', settingsWithMissingRates)).toBe(30);
    expect(getFxRateForCurrency('USD', settingsWithMissingRates)).toBe(0.74);
    expect(getFxRateForCurrency('ABC', settingsWithMissingRates)).toBe(1);
  });
});

describe('convertAmount', () => {
  it('returns original amount when currencies match', () => {
    expect(convertAmount(123.45, 'SGD', 'SGD', baseSettings)).toBe(123.45);
  });

  it('converts across currencies via SGD bridge', () => {
    expect(convertAmount(250, 'THB', 'SGD', baseSettings)).toBe(10);
    expect(convertAmount(100, 'USD', 'THB', baseSettings)).toBe(3125);
  });
});

describe('getMonthDays', () => {
  it('splits days correctly for months around SG break boundaries', () => {
    expect(getMonthDays('Apr 2026', baseSettings)).toEqual({ bangkok: 30, singapore: 0 });
    expect(getMonthDays('May 2026', baseSettings)).toEqual({ bangkok: 25, singapore: 6 });
    expect(getMonthDays('Jun 2026', baseSettings)).toEqual({ bangkok: 19, singapore: 11 });
    expect(getMonthDays('Jul 2026', baseSettings)).toEqual({ bangkok: 31, singapore: 0 });
  });
});

describe('estimatedMonthlyCost', () => {
  it('uses monthly day split and params currency conversion', () => {
    // May 2026: 25 Bangkok days, 6 Singapore days
    // Fixed: 25000 THB / 25 = 1000 SGD
    // Bangkok variable: (25 * (10+20+5+5+0)) / 25 = 40 SGD
    // Singapore variable: 6 * 19.25 = 115.5 SGD
    expect(estimatedMonthlyCost('May 2026', baseSettings)).toBe(1155.5);
  });
});

describe('remainingBalance', () => {
  it('subtracts all spending from received funding only', () => {
    const funding: Funding[] = [
      { id: 'f1', source: 'school', amount_thb: 1000, is_expected: true, is_received: true },
      { id: 'f2', source: 'bonus', amount_thb: 500, is_expected: true, is_received: false },
      { id: 'f3', source: 'salary', amount_thb: 200, is_expected: false, is_received: true },
    ];
    const transactions: Transaction[] = [
      {
        id: 't1',
        date: '2026-03-10',
        category: 'Rent',
        amount_thb: 300,
        country: 'Thailand',
        is_reimbursable: false,
        has_receipt: true,
      },
    ];
    const dailyLogs: DailyLog[] = [
      {
        id: 'd1',
        date: '2026-03-11',
        country: 'Thailand',
        lunch_thb: 50,
        dinner_thb: 50,
        other_food_thb: 0,
        transport_thb: 20,
        misc_thb: 10,
      },
    ];

    expect(remainingBalance(funding, transactions, dailyLogs)).toBe(770);
  });

  it('handles zero funding and returns negative balance when only spending exists', () => {
    const transactions: Transaction[] = [
      {
        id: 't2',
        date: '2026-03-12',
        category: 'Other',
        amount_thb: 100,
        country: 'Thailand',
        is_reimbursable: false,
        has_receipt: false,
      },
    ];

    expect(remainingBalance([], transactions, [])).toBe(-100);
  });
});
