
-- Seed settings
INSERT INTO public.settings (key, value) VALUES
  ('fx_rate', '26.5'),
  ('internship_start', '2026-03-07'),
  ('internship_end', '2026-08-17'),
  ('sg_break_start', '2026-05-26'),
  ('sg_break_days', '17'),
  ('monthly_rent_thb', '15500'),
  ('school_funding_sgd', '10000'),
  ('salary_thb', '7000'),
  ('daily_lunch', '80'),
  ('daily_dinner', '100'),
  ('daily_other_food', '40'),
  ('daily_transport', '40'),
  ('daily_misc', '20');

-- Seed funding
INSERT INTO public.funding (date, source, description, amount_thb, is_expected, is_received) VALUES
  ('2026-03-01', 'School', 'School Disbursement (Mar–Jun 2026 lump sum)', 148400, true, true),
  (NULL, 'School', 'School Funding Jul 2026', 45978, true, false),
  (NULL, 'School', 'School Funding Aug 2026', 45978, true, false),
  ('2026-03-31', 'Salary', 'Salary Mar 2026', 7000, true, true),
  ('2026-04-30', 'Salary', 'Salary Apr 2026', 7000, true, false),
  ('2026-05-31', 'Salary', 'Salary May 2026', 7000, true, false),
  ('2026-06-30', 'Salary', 'Salary Jun 2026', 7000, true, false),
  ('2026-07-31', 'Salary', 'Salary Jul 2026', 7000, true, false),
  ('2026-08-17', 'Salary', 'Salary Aug 2026', 7000, true, false);

-- Seed rent payments
INSERT INTO public.rent_payments (month, due_date, amount_thb, paid_date, is_paid, payment_method, notes) VALUES
  ('Mar 2026', '2026-03-01', 15500, '2026-03-01', true, 'Bank Transfer', 'Part of 1,264.50 SGD transfer to mum'),
  ('Apr 2026', '2026-04-01', 15500, '2026-03-01', true, 'Bank Transfer', 'Part of 1,264.50 SGD transfer to mum'),
  ('May 2026', '2026-05-01', 15500, NULL, false, NULL, NULL),
  ('Jun 2026', '2026-06-01', 15500, NULL, false, NULL, NULL),
  ('Jul 2026', '2026-07-01', 15500, NULL, false, NULL, NULL),
  ('Aug 2026', '2026-08-01', 15500, NULL, false, NULL, NULL);

-- Seed advance rent transaction
INSERT INTO public.transactions (date, category, description, amount_thb, payment_method, country) VALUES
  ('2026-03-01', 'Rent', '2 months advance to mum (Mar + Apr)', 33509.25, 'Bank Transfer', 'Singapore');
