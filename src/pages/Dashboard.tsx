import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, TrendingDown, PiggyBank, Percent, Activity, Target, Loader2, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { KPICard } from '@/components/KPICard';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { AlertCard } from '@/components/AlertCard';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import { useFunding } from '@/hooks/useFunding';
import { useTransactions } from '@/hooks/useTransactions';
import { useDailyLogs } from '@/hooks/useDailyLog';
import { useRentPayments } from '@/hooks/useRentPayments';
import { useAuth } from '@/hooks/useAuth';
import { remainingBalance, toSGD, MONTHS, generateMonths, estimatedMonthlyCost, getDailyTotal, formatCurrency, getCurrencyForCountry, getFxRateForCountry, convertAmount, getParamsCurrency, type Settings } from '@/lib/budget-utils';
import { parseISO, format, subDays, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoBar } from '@/components/InfoBar';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { CurrencyConverter } from '@/components/dashboard/CurrencyConverter';
import { CountryCostGuide } from '@/components/dashboard/CountryCostGuide';
import { BudgetGoals } from '@/components/dashboard/BudgetGoals';
import { WeeklyDigest } from '@/components/dashboard/WeeklyDigest';
import { useNotifications } from '@/hooks/useNotifications';

const CHART_CATEGORIES = ['All', 'Food', 'Transport', 'Rent', 'Misc', 'Other'] as const;
type ChartCategory = typeof CHART_CATEGORIES[number];

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'hsl(12, 76%, 58%)',
  Transport: 'hsl(145, 60%, 48%)',
  Rent: 'hsl(216, 60%, 55%)',
  Misc: 'hsl(36, 95%, 55%)',
  Other: 'hsl(210, 15%, 55%)',
  Estimated: 'hsl(210, 55%, 52%)',
};

const PIE_COLORS = [
  'hsl(12, 76%, 58%)',
  'hsl(145, 60%, 48%)',
  'hsl(216, 60%, 55%)',
  'hsl(36, 95%, 55%)',
  'hsl(210, 15%, 55%)',
  'hsl(280, 55%, 58%)',
];

export default function Dashboard() {
  const { session } = useAuth();
  const { data: settings, isLoading: sLoading } = useSettings();
  const { data: funding = [] } = useFunding();
  const { data: transactions = [] } = useTransactions();
  const { data: dailyLogs = [] } = useDailyLogs();
  const { data: rentPayments = [] } = useRentPayments();

  // Check if today has been logged and fire notification reminder if not
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hasLoggedToday = dailyLogs.some(d => d.date === todayStr);
  useNotifications(hasLoggedToday);
  const [categoryFilter, setCategoryFilter] = useState<ChartCategory>('All');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const updateSetting = useUpdateSetting();

  // Show onboarding: either forced via ?onboarding=1, or first time (no onboarding_completed and no display_name)
  useEffect(() => {
    if (sLoading) return;
    const forceOnboarding = searchParams.get('onboarding') === '1';
    if (forceOnboarding) {
      setShowOnboarding(true);
      return;
    }
    if (settings && (settings as Settings & { onboarding_completed?: string }).onboarding_completed === 'pending') {
      setShowOnboarding(true);
    }
  }, [sLoading, settings, searchParams]);

  const displayCountry = settings?.display_country || 'Singapore';
  const displayCurrency = getCurrencyForCountry(displayCountry);
  const fxRate = settings ? getFxRateForCountry(displayCountry, settings) : 1;
  const fmt = (amount: number) => formatCurrency(amount, displayCurrency);
  const displayName = settings?.display_name || session?.user?.email?.split('@')[0] || 'there';

  // Convert all amounts to display currency for aggregation
  const totalFunding = useMemo(() => {
    if (!settings) return funding.filter(f => f.is_received).reduce((s, f) => s + Number(f.amount_thb), 0);
    return funding.filter(f => f.is_received).reduce((s, f) => {
      const stored = f.currency || 'SGD';
      return s + convertAmount(Number(f.amount_thb), stored, displayCurrency, settings);
    }, 0);
  }, [funding, settings, displayCurrency]);

  const totalTxSpend = useMemo(() => {
    if (!settings) return transactions.reduce((s, t) => s + Number(t.amount_thb), 0);
    return transactions.reduce((s, t) => {
      const stored = getCurrencyForCountry(t.country || 'Thailand');
      return s + convertAmount(Number(t.amount_thb), stored, displayCurrency, settings);
    }, 0);
  }, [transactions, settings, displayCurrency]);

  const totalDailySpend = useMemo(() => {
    if (!settings) return dailyLogs.reduce((s, d) => s + getDailyTotal(d), 0);
    return dailyLogs.reduce((s, d) => {
      const stored = getCurrencyForCountry(d.country || 'Thailand');
      return s + convertAmount(getDailyTotal(d), stored, displayCurrency, settings);
    }, 0);
  }, [dailyLogs, settings, displayCurrency]);

  const totalSpent = totalTxSpend + totalDailySpend;
  const balance = totalFunding - totalSpent;
  const pctUsed = totalFunding > 0 ? Math.round((totalSpent / totalFunding) * 100) : 0;

  const activeMonths = useMemo(() => settings ? generateMonths(settings) : MONTHS, [settings]);

  // Monthly bar chart
  const chartData = useMemo(() => {
    if (!settings) return [];
    return activeMonths.map(m => {
      const shortMonth = m.split(' ')[0];
      const monthTx = transactions.filter(t => { try { return format(parseISO(t.date), 'MMM yyyy') === m; } catch { return false; } });
      const monthDl = dailyLogs.filter(d => { try { return format(parseISO(d.date), 'MMM yyyy') === m; } catch { return false; } });

      const food = monthDl.reduce((s, d) => {
        const sc = getCurrencyForCountry(d.country || 'Thailand');
        return s + convertAmount((Number(d.lunch_thb) || 0) + (Number(d.dinner_thb) || 0) + (Number(d.other_food_thb) || 0), sc, displayCurrency, settings);
      }, 0);
      const transport = monthDl.reduce((s, d) => {
        const sc = getCurrencyForCountry(d.country || 'Thailand');
        return s + convertAmount(Number(d.transport_thb) || 0, sc, displayCurrency, settings);
      }, 0);
      const misc = monthDl.reduce((s, d) => {
        const sc = getCurrencyForCountry(d.country || 'Thailand');
        return s + convertAmount(Number(d.misc_thb) || 0, sc, displayCurrency, settings);
      }, 0);
      const rent = monthTx.filter(t => t.category === 'Rent').reduce((s, t) => s + convertAmount(Number(t.amount_thb), getCurrencyForCountry(t.country || 'Thailand'), displayCurrency, settings), 0);
      const other = monthTx.filter(t => t.category !== 'Rent').reduce((s, t) => s + convertAmount(Number(t.amount_thb), getCurrencyForCountry(t.country || 'Thailand'), displayCurrency, settings), 0);
      // estimatedMonthlyCost returns SGD — convert to display currency
      const estimated = convertAmount(estimatedMonthlyCost(m, settings), 'SGD', displayCurrency, settings);
      return { month: shortMonth, Food: food, Transport: transport, Rent: rent, Misc: misc, Other: other, Estimated: estimated };
    });
  }, [settings, transactions, dailyLogs]);

  const visibleCategories = categoryFilter === 'All' ? ['Food', 'Transport', 'Rent', 'Misc', 'Other'] : [categoryFilter];

  // Daily spending trend (last 14 days)
  const dailyTrendData = useMemo(() => {
    const today = new Date();
    const days: { date: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const label = format(d, 'd MMM');
      const dlMatch = dailyLogs.find(dl => dl.date === dateStr);
      const dlTotal = dlMatch && settings ? convertAmount(getDailyTotal(dlMatch), getCurrencyForCountry(dlMatch.country || 'Thailand'), displayCurrency, settings) : (dlMatch ? getDailyTotal(dlMatch) : 0);
      const txTotal = transactions.filter(t => t.date === dateStr).reduce((s, t) => settings ? s + convertAmount(Number(t.amount_thb), getCurrencyForCountry(t.country || 'Thailand'), displayCurrency, settings) : s + Number(t.amount_thb), 0);
      days.push({ date: label, total: dlTotal + txTotal });
    }
    return days;
  }, [dailyLogs, transactions, settings, displayCurrency]);

  // Category pie chart
  const categoryPieData = useMemo(() => {
    const cats: Record<string, number> = {};
    dailyLogs.forEach(d => {
      const sc = getCurrencyForCountry(d.country || 'Thailand');
      const cv = (v: number) => settings ? convertAmount(v, sc, displayCurrency, settings) : v;
      cats['Food'] = (cats['Food'] || 0) + cv((Number(d.lunch_thb) || 0) + (Number(d.dinner_thb) || 0) + (Number(d.other_food_thb) || 0));
      cats['Transport'] = (cats['Transport'] || 0) + cv(Number(d.transport_thb) || 0);
      cats['Misc'] = (cats['Misc'] || 0) + cv(Number(d.misc_thb) || 0);
    });
    transactions.forEach(t => {
      const cat = t.category || 'Other';
      const sc = getCurrencyForCountry(t.country || 'Thailand');
      cats[cat] = (cats[cat] || 0) + (settings ? convertAmount(Number(t.amount_thb), sc, displayCurrency, settings) : Number(t.amount_thb));
    });
    return Object.entries(cats).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [dailyLogs, transactions, settings, displayCurrency]);

  // Spending pace
  const spendingPace = useMemo(() => {
    const allDates = [
      ...dailyLogs.map(d => d.date),
      ...transactions.map(t => t.date),
    ].filter(Boolean).sort();
    if (allDates.length === 0) return null;
    const firstDate = parseISO(allDates[0]);
    const daysActive = Math.max(1, differenceInDays(new Date(), firstDate) + 1);
    const avgPerDay = totalSpent / daysActive;
    const endDate = settings?.internship_end ? new Date(settings.internship_end) : new Date('2026-08-17');
    const totalDays = Math.max(1, differenceInDays(endDate, firstDate) + 1);
    const projected = avgPerDay * totalDays;
    return { avgPerDay, projected, daysActive };
  }, [dailyLogs, transactions, totalSpent]);

  // Alert details
  // estimatedMonthlyCost returns SGD — convert to display currency
  const estimatedTotal = useMemo(() => {
    if (!settings) return 0;
    return activeMonths.reduce((s, m) => s + estimatedMonthlyCost(m, settings), 0) * fxRate;
  }, [settings, fxRate, activeMonths]);
  const fundingGap = useMemo(() => {
    if (!settings) return funding.filter(f => f.is_expected && !f.is_received).reduce((s, f) => s + Number(f.amount_thb), 0);
    return funding.filter(f => f.is_expected && !f.is_received).reduce((s, f) => {
      const stored = f.currency || 'SGD';
      return s + convertAmount(Number(f.amount_thb), stored, displayCurrency, settings);
    }, 0);
  }, [funding, settings, displayCurrency]);
  const pendingFunding = useMemo(() => funding.filter(f => f.is_expected && !f.is_received), [funding]);
  const totalMisc = useMemo(() => {
    if (!settings) return dailyLogs.reduce((s, d) => s + (Number(d.misc_thb) || 0), 0);
    return dailyLogs.reduce((s, d) => {
      const sc = getCurrencyForCountry(d.country || 'Thailand');
      return s + convertAmount(Number(d.misc_thb) || 0, sc, displayCurrency, settings);
    }, 0);
  }, [dailyLogs, settings, displayCurrency]);
  const miscDays = dailyLogs.filter(d => (Number(d.misc_thb) || 0) > 0).length;

  if (sLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm">Loading dashboard…</span>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const overBy = totalSpent - estimatedTotal;
  const pctOver = estimatedTotal > 0 ? Math.round((overBy / estimatedTotal) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <OnboardingDialog open={showOnboarding} onComplete={() => {
        updateSetting.mutate({ key: 'onboarding_completed', value: 'true' });
        setShowOnboarding(false);
        if (searchParams.has('onboarding')) {
          searchParams.delete('onboarding');
          setSearchParams(searchParams, { replace: true });
        }
      }} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting}, {displayName} 👋</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, d MMMM yyyy')} • Budget overview</p>
      </div>

      <InfoBar message="This is your overview. Funding and spending data flows in from the other tabs automatically." />

      <div className="grid grid-cols-2 gap-4">
        <KPICard icon={Wallet} label="Funding Received">
          <span className="text-xl font-bold">{fmt(totalFunding)}</span>
        </KPICard>
        <KPICard icon={TrendingDown} label="Total Spent">
          <span className="text-xl font-bold">{fmt(totalSpent)}</span>
        </KPICard>
        <KPICard icon={PiggyBank} label="Remaining" variant={balance >= 0 ? 'success' : 'destructive'}>
          <span className="text-xl font-bold">{fmt(balance)}</span>
        </KPICard>
        <KPICard icon={Percent} label="Budget Used" variant={pctUsed > 90 ? 'destructive' : pctUsed > 70 ? 'warning' : 'default'}>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={pctUsed > 90 ? 'hsl(var(--destructive))' : pctUsed > 70 ? 'hsl(var(--warning-foreground))' : 'hsl(var(--secondary))'}
                  strokeWidth="3" strokeDasharray={`${pctUsed} ${100 - pctUsed}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pctUsed}%</span>
            </div>
          </div>
        </KPICard>
      </div>

      {/* Monthly Spending Bar Chart */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Monthly Spending</CardTitle>
            <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as ChartCategory)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 'dataMax+500']} allowDecimals={false} tickFormatter={v => v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', padding: '8px 12px', color: 'hsl(var(--foreground))' }} labelStyle={{ fontWeight: 600, marginBottom: '4px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {visibleCategories.includes('Food') && <Bar dataKey="Food" stackId="a" fill={CATEGORY_COLORS.Food} />}
              {visibleCategories.includes('Transport') && <Bar dataKey="Transport" stackId="a" fill={CATEGORY_COLORS.Transport} />}
              {visibleCategories.includes('Rent') && <Bar dataKey="Rent" stackId="a" fill={CATEGORY_COLORS.Rent} />}
              {visibleCategories.includes('Misc') && <Bar dataKey="Misc" stackId="a" fill={CATEGORY_COLORS.Misc} />}
              {visibleCategories.includes('Other') && <Bar dataKey="Other" stackId="a" fill={CATEGORY_COLORS.Other} radius={[4, 4, 0, 0]} />}
              <Bar dataKey="Estimated" fill="none" stroke={CATEGORY_COLORS.Estimated} strokeDasharray="4 2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Spending Trend */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Daily Spending (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 'dataMax+100']} allowDecimals={false} tickFormatter={v => v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', padding: '8px 12px', color: 'hsl(var(--foreground))' }} labelStyle={{ fontWeight: 600, marginBottom: '4px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown + Spending Pace */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {categoryPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <PieChart width={140} height={140}>
                  <Pie data={categoryPieData} cx={70} cy={70} innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                    {categoryPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px', padding: '8px 12px', color: 'hsl(var(--foreground))' }} labelStyle={{ fontWeight: 600, marginBottom: '4px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                </PieChart>
                <div className="space-y-1">
                  {categoryPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-medium text-foreground ml-auto">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 opacity-40" />
                <span className="text-sm">No spending data yet</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending Pace */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" /> Spending Pace
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spendingPace ? (
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold text-foreground">{fmt(Math.round(spendingPace.avgPerDay))}</div>
                  <div className="text-xs text-muted-foreground">average per day ({spendingPace.daysActive} days tracked)</div>
                </div>
                <div className="border-t border-border pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Projected total</span>
                    <span className={cn('font-medium', spendingPace.projected > totalFunding ? 'text-destructive' : 'text-success')}>
                      {fmt(Math.round(spendingPace.projected))}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Budget (received)</span>
                    <span className="font-medium text-foreground">{fmt(totalFunding)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn('font-medium', spendingPace.projected > totalFunding ? 'text-destructive' : 'text-success')}>
                      {spendingPace.projected > totalFunding ? 'Over budget pace' : 'On track'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6">Start logging to see pace</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Alerts */}
      <div className="grid gap-3">
        <AlertCard
          icon="📊"
          label="Over budget?"
          isOk={totalSpent <= estimatedTotal}
          message={totalSpent <= estimatedTotal ? `On track — ${fmt(estimatedTotal - totalSpent)} under` : `Over by ${fmt(overBy)}`}
          details={
            <div className="space-y-1.5">
              <div className="flex justify-between"><span>Actual spent</span><span className="font-medium text-foreground">{fmt(totalSpent)}</span></div>
              <div className="flex justify-between"><span>Estimated total</span><span className="font-medium text-foreground">{fmt(estimatedTotal)}</span></div>
              <div className="flex justify-between"><span>Difference</span><span className={cn('font-medium', overBy > 0 ? 'text-destructive' : 'text-success')}>{overBy > 0 ? '+' : ''}{fmt(overBy)} ({pctOver > 0 ? '+' : ''}{pctOver}%)</span></div>
              <div className="border-t border-border/30 pt-1.5 mt-1.5">
                <div className="text-xs font-medium text-foreground mb-1">Breakdown:</div>
                <div className="flex justify-between"><span>Daily log</span><span className="font-medium text-foreground">{fmt(totalDailySpend)}</span></div>
                <div className="flex justify-between"><span>Rent (transactions)</span><span className="font-medium text-foreground">{fmt(transactions.filter(t => t.category === 'Rent').reduce((s, t) => s + (settings ? convertAmount(Number(t.amount_thb), getCurrencyForCountry(t.country || 'Thailand'), displayCurrency, settings) : Number(t.amount_thb)), 0))}</span></div>
                <div className="flex justify-between"><span>Other transactions</span><span className="font-medium text-foreground">{fmt(transactions.filter(t => t.category !== 'Rent').reduce((s, t) => s + (settings ? convertAmount(Number(t.amount_thb), getCurrencyForCountry(t.country || 'Thailand'), displayCurrency, settings) : Number(t.amount_thb)), 0))}</span></div>
              </div>
            </div>
          }
        />
        <AlertCard
          icon="💰"
          label="Funding gap?"
          isOk={fundingGap === 0}
          message={fundingGap === 0 ? 'All funding received' : `${fmt(fundingGap)} outstanding (${pendingFunding.length} items)`}
          details={
            <div className="space-y-1.5">
              <div className="flex justify-between"><span>Total expected</span><span className="font-medium text-foreground">{fmt(funding.filter(f => f.is_expected).reduce((s, f) => s + (settings ? convertAmount(Number(f.amount_thb), f.currency || 'SGD', displayCurrency, settings) : Number(f.amount_thb)), 0))}</span></div>
              <div className="flex justify-between"><span>Received</span><span className="font-medium text-foreground">{fmt(totalFunding)}</span></div>
              {pendingFunding.length > 0 && (
                <div className="pt-1 border-t border-border/30">
                  <div className="text-xs font-medium text-foreground mb-1">Pending:</div>
                  {pendingFunding.map(f => (
                    <div key={f.id} className="flex justify-between"><span>{f.source}{f.description ? ` — ${f.description}` : ''}</span><span>{fmt(settings ? convertAmount(Number(f.amount_thb), f.currency || 'SGD', displayCurrency, settings) : Number(f.amount_thb))}</span></div>
                  ))}
                </div>
              )}
            </div>
          }
        />
        <AlertCard
          icon="🛍"
          label="High misc spend?"
          isOk={totalMisc <= 5000}
          message={totalMisc <= 5000 ? `Under ${fmt(5000)} (${fmt(totalMisc)})` : `Misc total: ${fmt(totalMisc)}`}
          details={
            <div className="space-y-1.5">
              <div className="flex justify-between"><span>Total misc</span><span className="font-medium text-foreground">{fmt(totalMisc)}</span></div>
              <div className="flex justify-between"><span>Days with misc spend</span><span className="font-medium text-foreground">{miscDays}</span></div>
              <div className="flex justify-between"><span>Avg misc/day</span><span className="font-medium text-foreground">{fmt(miscDays > 0 ? Math.round(totalMisc / miscDays) : 0)}</span></div>
              <div className="flex justify-between"><span>Daily misc budget</span><span className="font-medium text-foreground">{fmt(settings ? convertAmount(settings.daily_misc || 20, getParamsCurrency(settings), displayCurrency, settings) : 20)}</span></div>
            </div>
          }
        />
      </div>

      {/* New feature widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeeklyDigest
          dailyLogs={dailyLogs}
          transactions={transactions}
          settings={settings}
          displayCurrency={displayCurrency}
        />
        <BudgetGoals
          dailyLogs={dailyLogs}
          settings={settings}
          displayCurrency={displayCurrency}
          dailyBudgetTarget={settings ? convertAmount(
            (settings.daily_lunch || 80) + (settings.daily_dinner || 100) + (settings.daily_other_food || 40) + (settings.daily_transport || 40) + (settings.daily_misc || 20),
            getParamsCurrency(settings),
            displayCurrency,
            settings
          ) : 280}
        />
      </div>

      <CurrencyConverter settings={settings} />

      <CountryCostGuide />
    </div>
  );
}
