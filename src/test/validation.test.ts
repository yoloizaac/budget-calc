import { describe, expect, it } from 'vitest';

import { ALL_COUNTRIES } from '@/lib/budget-utils';
import { transactionSchema } from '@/lib/validation';

describe('transactionSchema country validation', () => {
  const baseTransaction = {
    date: '2026-03-07',
    category: 'Food',
    amount_thb: 100,
  };

  it('accepts every country code in ALL_COUNTRIES', () => {
    for (const { code } of ALL_COUNTRIES) {
      const parsed = transactionSchema.parse({
        ...baseTransaction,
        country: code,
      });

      expect(parsed.country).toBe(code);
    }
  });

  it('rejects unsupported country codes', () => {
    expect(() =>
      transactionSchema.parse({
        ...baseTransaction,
        country: 'Atlantis',
      }),
    ).toThrow('Invalid country');
  });
});
