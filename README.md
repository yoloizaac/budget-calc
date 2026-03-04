# 🏙️ BKK Budget Buddy

> **A personal finance tracker built for internship travel** — track daily spending, funding, rent, and get AI-powered insights across multiple currencies and countries.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Pages & Functionality](#pages--functionality)
- [Key Utilities & Logic](#key-utilities--logic)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Settings & Configuration](#settings--configuration)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)

---

## Overview

BKK Budget Buddy is a mobile-first personal budget tracker designed for an internship stint in Bangkok (Thailand), with support for travel across Southeast Asia. It tracks:

- **Day-to-day expenses** (food, transport, misc) via a quick daily log
- **Lump-sum transactions** (rent, utilities, one-off purchases)
- **Incoming funding** from school, salary, and other sources
- **Rent obligations** month-by-month
- **Multi-currency conversions** with live FX rate fetching
- **AI budget chat** powered by OpenAI via a Supabase Edge Function

It's purpose-built for a single user (no multi-tenancy), deployed as a PWA, and features a fully responsive UI with dark/light mode and customizable color themes.

---

## Features

### 🏠 Dashboard
- Greeting with time-aware salutation
- KPI cards: **Funding Received**, **Total Spent**, **Remaining Balance**, **Budget Used %** (with circular progress indicator)
- **Monthly Spending Bar Chart** — stacked by category (Food, Transport, Rent, Misc, Other) with estimated budget overlay
- **Daily Spending Trend** — line chart for the last 14 days
- **Category Breakdown** — donut/pie chart with legend
- **Spending Pace** tracker — average daily spend, projected total, and on-track status
- **Smart Alerts** — over budget, funding gap, high misc spend (expandable detail panels)
- **Weekly Digest** — summary card for the current week
- **Budget Goals** — progress toward daily spending targets
- **Currency Converter** — quick inline conversion between supported currencies
- **Country Cost Guide** — reference panel for regional cost norms
- **Onboarding Dialog** — first-run setup wizard (re-runnable from Settings)
- **Daily Log Reminder Notifications** — browser push notification after 6 PM if no log for the day

### 📅 Daily Log
- Date picker + country selector (auto-detects country based on internship dates)
- Quick-save per field (Lunch, Dinner, Other Food, Transport, Misc) with budget hints
- Full-day save/update/delete
- Photo attachment per daily log entry (via Supabase Storage)
- Monthly total summary bar
- Last 7 days history with expandable entries
- Recurring expense defaults (pre-fill amounts for known regular costs)
- Zod-validated form submission

### 💳 Transactions
- Full CRUD for lump-sum expenses
- Categories: Rent, Utilities, Internet, Mobile Data, Lunch, Dinner, Snacks/Drinks, Transport, Grab, Toiletries, Medicine, Household, Laundry, Subscriptions, One-time Setup, Entertainment, Other
- Payment methods: Bank Transfer, Cash, QR, Card, Grab, Other
- Country-aware currency input (enter in local currency, stored in base currency)
- Search & filter by category
- Reimbursable and receipt flags
- Auto-links `Rent` category transactions to unpaid Rent Tracker months
- Photo attachments per transaction
- Floating action button (FAB) for quick add

### 💰 Funding
- Track expected and received funding from: Starting Balance, School, Salary, Other
- Multi-currency support — store each funding row in its original currency
- Toggle received/pending status per row
- KPI cards: Expected, Received, Outstanding
- CRUD with bottom sheet form
- Zod-validated inputs

### 🏠 Rent Tracker
- Monthly rent obligation cards with status: **PAID**, **UNPAID**, **DUE SOON**
- Mark as paid with payment method and date
- Revert payment status
- Links to actual `Rent` transactions to show real payment history
- Add/delete rent months
- Edit rent transactions inline
- Automatic "due soon" detection (within 7 days of due date)

### 💬 Budget Chat (AI)
- Streaming AI assistant powered by OpenAI via `budget-chat` Supabase Edge Function
- Real-time SSE streaming with token-by-token display
- Context-aware: the Edge Function fetches the user's actual live data (transactions, daily logs, funding, settings) and injects it as system context
- Prompt suggestion categories: Spending, Budget, Forecast, Compare
- Prompt templates toolbar
- Markdown rendering for assistant responses

### ⚙️ Settings
- **Appearance & Region**: display name, theme (light/dark/system), color accent preset, display currency, font size, default country
- **Exchange Rates**: manual input or one-click live fetch via `fetch-fx-rates` Edge Function (SGD as the base currency bridge)
- **Budget Parameters**: internship dates, Singapore break window, monthly rent, school funding, monthly salary, daily budget targets (all in configurable budget currency)
- **Financial Summary**: projected funding vs estimated spend, with currency switcher
- **Recurring Expenses**: pre-set amounts that auto-fill the Daily Log
- **Daily Reminders**: toggle browser notifications for end-of-day logging reminders
- **Bug Reports**: submit categorized bug reports (stored in Supabase)
- **Feature Suggestions**: submit improvement ideas (stored in Supabase)
- **My Reports / My Suggestions**: view status of submitted items with admin notes
- **Data**: CSV export (transactions + daily logs), full data clear
- **Re-run Onboarding**: jump back to setup wizard

### 🔐 Authentication
- Supabase Auth (email + password)
- Login, Signup, Forgot Password, Reset Password flows
- Session-protected routes via `ProtectedRoutes` wrapper

### 👤 Admin Page
- Admin-only view for managing bug reports and feature suggestions submitted by users
- Update status and add admin notes per report

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [React 18](https://react.dev) + [Vite 5](https://vitejs.dev) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| UI Components | [Radix UI](https://www.radix-ui.com) primitives |
| Icons | [Lucide React](https://lucide.dev) |
| Charts | [Recharts](https://recharts.org) |
| Routing | [React Router v6](https://reactrouter.com) |
| Data Fetching | [TanStack Query v5](https://tanstack.com/query) |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Backend | [Supabase](https://supabase.com) (Postgres, Auth, Storage, Edge Functions) |
| AI | [OpenAI API](https://platform.openai.com) via Supabase Edge Function |
| Date Utils | [date-fns](https://date-fns.org) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) |

---

## Project Structure

```
bkk-budget-buddy/
├── public/                     # Static assets (icons, manifest, favicon)
├── src/
│   ├── App.tsx                 # Root app: providers, routing, auth guard
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles + CSS variables
│   │
│   ├── pages/                  # Route-level page components
│   │   ├── Dashboard.tsx       # Main overview with charts & KPIs
│   │   ├── DailyLog.tsx        # Quick daily expense entry
│   │   ├── Transactions.tsx    # Lump-sum expense management
│   │   ├── FundingPage.tsx     # Incoming funding tracker
│   │   ├── RentTracker.tsx     # Monthly rent management
│   │   ├── ChatPage.tsx        # AI budget assistant
│   │   ├── SettingsPage.tsx    # App configuration & data management
│   │   ├── AdminPage.tsx       # Admin panel (bug reports, suggestions)
│   │   ├── LandingPage.tsx     # Public marketing landing page
│   │   ├── LoginPage.tsx       # Auth: sign in
│   │   ├── SignupPage.tsx      # Auth: register
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── Index.tsx           # Redirect to /dashboard
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── components/
│   │   ├── AppLayout.tsx       # Authenticated shell: sidebar/bottom nav
│   │   ├── OnboardingDialog.tsx # First-run setup wizard
│   │   ├── KPICard.tsx         # Reusable metric card
│   │   ├── AlertCard.tsx       # Expandable alert/info card
│   │   ├── CurrencyDisplay.tsx # Smart currency amount display
│   │   ├── CurrencyInput.tsx   # Amount input with local/base toggle
│   │   ├── CategoryBadge.tsx   # Colored category label
│   │   ├── CountryFlag.tsx     # Country emoji flag
│   │   ├── ErrorBoundary.tsx   # React error boundary
│   │   ├── InfoBar.tsx         # Contextual help message bar
│   │   ├── NavLink.tsx         # Navigation link component
│   │   ├── PageHeader.tsx      # Standard page title + subtitle
│   │   │
│   │   ├── dashboard/          # Dashboard-specific widgets
│   │   │   ├── BudgetGoals.tsx
│   │   │   ├── WeeklyDigest.tsx
│   │   │   ├── CurrencyConverter.tsx
│   │   │   └── CountryCostGuide.tsx
│   │   │
│   │   ├── daily-log/          # Daily log sub-components
│   │   │   ├── ExpenseFieldCard.tsx
│   │   │   ├── PhotoSection.tsx
│   │   │   └── HistoryEntry.tsx
│   │   │
│   │   ├── transactions/
│   │   │   └── TransactionPhotoSection.tsx
│   │   │
│   │   ├── settings/
│   │   │   └── RecurringExpenses.tsx
│   │   │
│   │   └── ui/                 # shadcn/ui component library (49 components)
│   │
│   ├── hooks/                  # React Query + custom hooks
│   │   ├── useAuth.ts          # Supabase auth session
│   │   ├── useSettings.ts      # Settings read + update
│   │   ├── useDailyLog.ts      # CRUD for daily logs
│   │   ├── useTransactions.ts  # CRUD for transactions
│   │   ├── useFunding.ts       # CRUD for funding rows
│   │   ├── useRentPayments.ts  # CRUD for rent payments
│   │   ├── useNotifications.ts # Browser notification logic
│   │   ├── useThemeColor.ts    # Color accent preset management
│   │   ├── useTransactionPhotos.ts
│   │   ├── useCurrentUser.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/
│   │   ├── budget-utils.ts     # All budget math, FX, types, constants
│   │   ├── budget-utils.test.ts # Unit tests for budget utilities
│   │   ├── validation.ts       # Zod schemas for all forms
│   │   ├── image-utils.ts      # Image compression helpers
│   │   └── utils.ts            # Tailwind cn() helper
│   │
│   ├── integrations/supabase/  # Auto-generated Supabase client + types
│   └── test/                   # Test setup and helpers
│
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── budget-chat/        # OpenAI streaming chat Edge Function
│   │   └── fetch-fx-rates/     # Live FX rate fetcher Edge Function
│   └── migrations/             # 12 SQL migrations (schema evolution)
│
├── index.html                  # App entry + PWA meta tags
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## Database Schema

All tables use Row Level Security (RLS) with open policies (single-user app, auth-protected at the API layer).

### `settings`
Key-value store for all app configuration.
| Column | Type | Description |
|--------|------|-------------|
| `key` | text (PK) | Setting name |
| `value` | text | Setting value |
| `updated_at` | timestamptz | Last modified |

### `daily_log`
One row per day for routine expense tracking.
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `date` | date (unique) | Log date |
| `country` | text | Country for the day |
| `lunch_thb` | numeric | Lunch cost (in params currency) |
| `dinner_thb` | numeric | Dinner cost |
| `other_food_thb` | numeric | Other food |
| `transport_thb` | numeric | Transport |
| `misc_thb` | numeric | Miscellaneous |
| `notes` | text | Optional notes |
| `updated_at` | timestamptz | Last modified |

### `transactions`
Lump-sum one-off expenses.
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `date` | date | Transaction date |
| `category` | text | Expense category |
| `subcategory` | text | Optional sub-category |
| `description` | text | Description |
| `amount_thb` | numeric | Amount (in stored currency) |
| `payment_method` | text | Payment method |
| `country` | text | Country of expense |
| `is_reimbursable` | boolean | Reimbursable flag |
| `has_receipt` | boolean | Receipt available |
| `notes` | text | Optional notes |
| `created_at` | timestamptz | Created timestamp |

### `funding`
Incoming money tracking.
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `date` | date | Expected/received date |
| `source` | text | Funding source (e.g. School, Salary) |
| `description` | text | Description |
| `amount_thb` | numeric | Amount (stored in `currency` column's units) |
| `is_expected` | boolean | Is this expected funding? |
| `is_received` | boolean | Has it been received? |
| `currency` | text | Currency the amount is stored in |
| `notes` | text | Optional notes |

### `rent_payments`
Monthly rent obligation tracking.
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `month` | text | Month label (e.g. "Mar 2026") |
| `due_date` | date | When rent is due |
| `amount_thb` | numeric | Expected rent amount |
| `paid_date` | date | Date paid |
| `is_paid` | boolean | Paid status |
| `payment_method` | text | How it was paid |
| `notes` | text | Optional notes |

### `bug_reports`
User-submitted bug reports.

### `feature_suggestions`
User-submitted feature requests.

### `daily_log_photos` / `transaction_photos`
Photo metadata for receipt/evidence attachments (Supabase Storage).

---

## Pages & Functionality

### Route Map

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | `LandingPage` | No |
| `/login` | `LoginPage` | No |
| `/signup` | `SignupPage` | No |
| `/forgot-password` | `ForgotPasswordPage` | No |
| `/reset-password` | `ResetPasswordPage` | No |
| `/dashboard` | `Dashboard` | ✅ |
| `/daily` | `DailyLog` | ✅ |
| `/transactions` | `Transactions` | ✅ |
| `/funding` | `FundingPage` | ✅ |
| `/rent` | `RentTracker` | ✅ |
| `/settings` | `SettingsPage` | ✅ |
| `/chat` | `ChatPage` | ✅ |
| `/admin` | `AdminPage` | ✅ |

---

## Key Utilities & Logic

### `src/lib/budget-utils.ts`

The core financial logic module. Key exports:

- **`Settings` interface** — typed representation of all settings key-value pairs
- **`COUNTRY_CURRENCY_MAP`** — maps country names to ISO currency codes (TH→THB, SG→SGD, VN→VND, CN→CNY, MY→MYR, ID→IDR, IN→INR)
- **`CURRENCY_INFO`** — currency symbols and labels for 9 currencies (THB, SGD, VND, CNY, MYR, IDR, INR, USD, EUR)
- **`convertAmount(amount, fromCurrency, toCurrency, settings)`** — cross-currency conversion via SGD as the bridge currency; FX rates are stored as "units per 1 SGD"
- **`getFxRateForCountry(country, settings)`** — gets the SGD exchange rate for a given country
- **`getFxRateForCurrency(currency, settings)`** — gets the SGD exchange rate by currency code (supports USD, EUR)
- **`estimatedMonthlyCost(monthStr, settings)`** — computes the estimated monthly cost in SGD, splitting days between Bangkok and Singapore break periods
- **`generateMonths(settings)`** — dynamically generates month labels between internship start and end dates
- **`getDailyTotal(log)`** — sums all fields in a daily log entry
- **`remainingBalance(funding, transactions, dailyLogs)`** — computes remaining balance in base currency
- **`parseSettingsMap(rows)`** — converts key-value settings rows from the database into a typed `Settings` object
- **`getParamsCurrency(settings)`** — returns the configured budget parameter currency (e.g. THB if living in Bangkok)
- **`formatCurrency(amount, currencyCode)`** — formats amounts with correct symbol and decimal precision

### `src/lib/validation.ts`

Zod schemas for all form inputs:
- `dailyLogSchema` — validates daily log fields
- `transactionSchema` — validates transaction form
- `fundingSchema` — validates funding form
- `settingSchema` — validates individual setting key/value pairs

---

## Supabase Edge Functions

### `budget-chat`
An OpenAI-powered streaming chat function. On each request, it:
1. Verifies the user's Supabase JWT
2. Fetches the user's live data: settings, daily logs, transactions, funding, rent payments
3. Constructs a system prompt with full financial context
4. Streams the OpenAI response back as Server-Sent Events (SSE)

The frontend parses the SSE stream and renders tokens in real time via `react-markdown`.

### `fetch-fx-rates`
Fetches live FX rates (relative to SGD as the base) from an external rates API and returns a `rates` object. Called from Settings → "Fetch Latest Rates". Supports THB, VND, CNY, MYR, IDR, INR, USD, EUR.

---

## Settings & Configuration

All budget parameters are stored in the `settings` table as key-value pairs and loaded via the `useSettings` hook (TanStack Query, cached 30s).

Key settings:

| Key | Description | Default |
|-----|-------------|---------|
| `internship_start` | Start date of the internship | `2026-03-07` |
| `internship_end` | End date of the internship | `2026-08-17` |
| `sg_break_start` | Start of Singapore home break | `2026-05-26` |
| `sg_break_days` | Duration of SG break in days | `17` |
| `monthly_rent_thb` | Monthly rent amount (in `params_currency`) | `15500` |
| `school_funding_sgd` | Total school funding (always SGD) | `10000` |
| `salary_thb` | Monthly salary (in `params_currency`) | `7000` |
| `daily_lunch` | Default daily lunch budget | `80` |
| `daily_dinner` | Default daily dinner budget | `100` |
| `daily_other_food` | Default other food budget | `40` |
| `daily_transport` | Default transport budget | `40` |
| `daily_misc` | Default misc budget | `20` |
| `params_currency` | Currency for all budget parameters | `SGD` |
| `display_currency` | Currency for display throughout the app | `SGD` |
| `display_country` | Default country for display | `Singapore` |
| `display_name` | User's display name | — |
| `fx_rate_thb` | THB per 1 SGD | `26.5` |
| `fx_rate_vnd` | VND per 1 SGD | `17500` |
| `fx_rate_cny` | CNY per 1 SGD | `5.3` |
| `fx_rate_myr` | MYR per 1 SGD | `3.3` |
| `fx_rate_idr` | IDR per 1 SGD | `11500` |
| `fx_rate_inr` | INR per 1 SGD | `62` |
| `fx_rate_usd` | USD per 1 SGD | `0.74` |
| `fx_rate_eur` | EUR per 1 SGD | `0.69` |

> **Note:** The `params_currency` setting is the currency in which salary, rent, and daily cost parameters are expressed. All amounts are internally converted to SGD for cross-currency math, then to the `display_currency` for presentation.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm/bun
- A [Supabase](https://supabase.com) project with the migrations applied
- An OpenAI API key (for the `budget-chat` function)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/bkk-budget-buddy.git
cd bkk-budget-buddy

# Install dependencies
npm install
# or
bun install
```

### Configuration

Create a `.env` file at the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For the Edge Functions, set in Supabase Dashboard → Edge Functions → Secrets:
```
OPENAI_API_KEY=sk-...
```

### Apply Migrations

```bash
supabase db push
# or apply migrations manually in the Supabase SQL editor
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest (single pass) |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Your Supabase anon/public key |

---

## Notes

- **Single-user design**: RLS policies are permissive (`using (true)`) and security is enforced at the auth layer (all protected routes require a valid Supabase session). This is intentional for a personal app.
- **Currency storage**: All amounts are stored in the user-configured `params_currency` (e.g. THB or SGD), and the `amount_thb` column name is a historical artifact — the actual currency is determined by context (the `country` field on the row, or the `currency` field on funding rows).
- **FX bridge**: All cross-currency conversions go through SGD as an intermediary (`amount / fromFx * toFx`), where FX rates mean "X units of foreign currency per 1 SGD".
- **PWA**: The app includes a `manifest.json` and is configured to be installable as a Progressive Web App.
