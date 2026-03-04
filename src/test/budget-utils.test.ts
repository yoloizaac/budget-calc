import { describe, expect, it } from 'vitest';

import { CATEGORIES, CATEGORY_COLORS } from '@/lib/budget-utils';

describe('CATEGORY_COLORS', () => {
  it('maps each category to exactly one color', () => {
    const categorySet = new Set(CATEGORIES);
    const colorKeys = Object.keys(CATEGORY_COLORS);

    expect(colorKeys).toHaveLength(CATEGORIES.length);
    expect(new Set(colorKeys)).toEqual(categorySet);
  });
});
