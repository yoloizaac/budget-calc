import { z } from 'zod';
import { ALL_COUNTRIES, CATEGORIES, PAYMENT_METHODS } from './budget-utils';

const supportedCountryCodes = new Set(ALL_COUNTRIES.map(({ code }) => code));

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  category: z.string().min(1, 'Category required'),
  subcategory: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  amount_thb: z.number().positive('Amount must be positive').max(10_000_000, 'Amount too large'),
  payment_method: z.string().max(100).nullable().optional(),
  country: z
    .string()
    .refine((country) => supportedCountryCodes.has(country), 'Invalid country')
    .default('Thailand'),
  is_reimbursable: z.boolean().default(false),
  has_receipt: z.boolean().default(false),
  notes: z.string().max(2000).nullable().optional(),
});

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.string().min(1),
  lunch_thb: z.number().min(0).max(100_000).default(0),
  dinner_thb: z.number().min(0).max(100_000).default(0),
  other_food_thb: z.number().min(0).max(100_000).default(0),
  transport_thb: z.number().min(0).max(100_000).default(0),
  misc_thb: z.number().min(0).max(100_000).default(0),
  notes: z.string().max(2000).nullable().optional(),
});

export const fundingSchema = z.object({
  source: z.string().min(1, 'Source required'),
  description: z.string().max(500).nullable().optional(),
  amount_thb: z.number().positive('Amount must be positive').max(10_000_000),
  is_expected: z.boolean().default(true),
  is_received: z.boolean().default(false),
});

export const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1).max(1000),
});
