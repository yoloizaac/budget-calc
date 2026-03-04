import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import { useFunding } from '@/hooks/useFunding';
import { useTransactions } from '@/hooks/useTransactions';
import { useDailyLogs } from '@/hooks/useDailyLog';
import { formatSGD, toSGD, MONTHS, generateMonths, estimatedMonthlyCost, remainingBalance, getDailyTotal, ALL_COUNTRIES, CURRENCY_INFO, getCurrencyForCountry, getFxRateForCountry, getFxRateForCurrency, formatCurrency, getParamsCurrency } from '@/lib/budget-utils';
import { toast } from 'sonner';
import { settingSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Settings as SettingsIcon, Download, Trash2, Loader2, Sun, Moon, Monitor, Palette, RefreshCw, RotateCcw, Bug, ClipboardList, Lightbulb, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { InfoBar } from '@/components/InfoBar';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { useThemeColor, COLOR_PRESETS } from '@/hooks/useThemeColor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { isRemindersEnabled, setRemindersEnabled } from '@/hooks/useNotifications';
import { RecurringExpenses } from '@/components/settings/RecurringExpenses';

const BUG_TYPES = [
  { value: 'ui', label: 'UI Issue' },
  { value: 'data', label: 'Data Error' },
  { value: 'crash', label: 'Crash' },
  { value: 'performance', label: 'Performance' },
  { value: 'other', label: 'Other' },
];

function BugReportCard({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [bugType, setBugType] = useState('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('bug_reports').insert({
      user_id: userId, user_email: userEmail, bug_type: bugType,
      title: title.trim(), description: description.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error('Failed to submit'); return; }
    toast.success('Bug report submitted!');
    setTitle(''); setDescription(''); setBugType('other');
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bug className="h-4 w-4" /> Report a Bug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={bugType} onValueChange={setBugType}>
          <SelectTrigger className="bg-accent/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BUG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Brief title" value={title} onChange={e => setTitle(e.target.value)} className="bg-accent/30" maxLength={100} />
        <Textarea placeholder="Describe the issue..." value={description} onChange={e => setDescription(e.target.value)} className="bg-accent/30 min-h-[80px]" maxLength={1000} />
        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
          Submit Report
        </Button>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-destructive/15 text-destructive border-destructive/30',
  in_progress: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  resolved: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
};

function MyBugReports({ userId }: { userId: string }) {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['my-bug-reports', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  if (isLoading) return null;
  if (reports.length === 0) return null;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> My Bug Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((r: any) => (
          <div key={r.id} className="rounded-lg border border-border/50 bg-accent/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{r.title}</span>
              <Badge variant="outline" className={cn('text-[10px] capitalize shrink-0', STATUS_COLORS[r.status] || '')}>
                {r.status?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">{BUG_TYPES.find(t => t.value === r.bug_type)?.label || r.bug_type}</Badge>
              <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
            </div>
            {r.admin_notes && (
              <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-1.5 mt-1">
                Admin: {r.admin_notes}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const SUGGESTION_CATEGORIES = [
  { value: 'feature', label: 'Feature Request' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'integration', label: 'Integration' },
  { value: 'other', label: 'Other' },
];

const SUGGESTION_STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  reviewed: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  planned: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  done: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
};

function FeatureSuggestionCard({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [category, setCategory] = useState('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('feature_suggestions' as any).insert({
      user_id: userId, user_email: userEmail, category,
      title: title.trim(), description: description.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) { toast.error('Failed to submit'); return; }
    toast.success('Suggestion submitted!');
    setTitle(''); setDescription(''); setCategory('feature');
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Suggest a Feature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-accent/30"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SUGGESTION_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Brief title" value={title} onChange={e => setTitle(e.target.value)} className="bg-accent/30" maxLength={100} />
        <Textarea placeholder="Describe your idea..." value={description} onChange={e => setDescription(e.target.value)} className="bg-accent/30 min-h-[80px]" maxLength={1000} />
        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Submit Suggestion
        </Button>
      </CardContent>
    </Card>
  );
}

function MySuggestions({ userId }: { userId: string }) {
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['my-suggestions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('feature_suggestions' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!userId,
  });

  if (isLoading || suggestions.length === 0) return null;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> My Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((s: any) => (
          <div key={s.id} className="rounded-lg border border-border/50 bg-accent/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{s.title}</span>
              <Badge variant="outline" className={cn('text-[10px] capitalize shrink-0', SUGGESTION_STATUS_COLORS[s.status] || '')}>
                {s.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">{SUGGESTION_CATEGORIES.find(c => c.value === s.category)?.label || s.category}</Badge>
              <span>{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
            </div>
            {s.admin_notes && (
              <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-1.5 mt-1">
                Admin: {s.admin_notes}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ContactCard() {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Mail className="h-4 w-4" /> Contact & Support</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Have questions, need help, or want to share feedback? Reach out directly.</p>
        <a href="mailto:isaaclum1209@gmail.com" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <Mail className="h-4 w-4" /> isaaclum1209@gmail.com
        </a>
      </CardContent>
    </Card>
  );
}

const SETTING_FIELDS = [
  { key: 'internship_start', label: 'Internship Start', type: 'date', dynamic: false },
  { key: 'internship_end', label: 'Internship End', type: 'date', dynamic: false },
  { key: 'sg_break_start', label: 'SG Break Start', type: 'date', dynamic: false },
  { key: 'sg_break_days', label: 'SG Break Days', type: 'number', dynamic: false },
  { key: 'monthly_rent_thb', label: 'Monthly Rent', type: 'number', dynamic: true },
  { key: 'school_funding_sgd', label: 'School Funding Total (SGD — fixed)', type: 'number', dynamic: false },
  { key: 'salary_thb', label: 'Monthly Salary', type: 'number', dynamic: true },
  { key: 'daily_lunch', label: 'Default Lunch', type: 'number', dynamic: true },
  { key: 'daily_dinner', label: 'Default Dinner', type: 'number', dynamic: true },
  { key: 'daily_other_food', label: 'Default Other Food', type: 'number', dynamic: true },
  { key: 'daily_transport', label: 'Default Transport', type: 'number', dynamic: true },
  { key: 'daily_misc', label: 'Default Misc', type: 'number', dynamic: true },
];

const FX_RATE_FIELDS = [
  { key: 'fx_rate_thb', label: 'THB per SGD', currency: 'THB', default: '26.5' },
  { key: 'fx_rate_vnd', label: 'VND per SGD', currency: 'VND', default: '17500' },
  { key: 'fx_rate_cny', label: 'CNY per SGD', currency: 'CNY', default: '5.3' },
  { key: 'fx_rate_myr', label: 'MYR per SGD', currency: 'MYR', default: '3.3' },
  { key: 'fx_rate_idr', label: 'IDR per SGD', currency: 'IDR', default: '11500' },
  { key: 'fx_rate_inr', label: 'INR per SGD', currency: 'INR', default: '62' },
  { key: 'fx_rate_usd', label: 'USD per SGD', currency: 'USD', default: '0.74' },
  { key: 'fx_rate_eur', label: 'EUR per SGD', currency: 'EUR', default: '0.69' },
];

const CURRENCIES = [
  { code: 'THB', symbol: '฿', label: 'Thai Baht (฿)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit (RM)' },
  { code: 'VND', symbol: '₫', label: 'Vietnamese Dong (₫)' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (¥)' },
  { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah (Rp)' },
];

export default function SettingsPage() {
  const { session } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemeColor();
  const { data: funding = [] } = useFunding();
  const { data: transactions = [] } = useTransactions();
  const { data: dailyLogs = [] } = useDailyLogs();
  const navigate = useNavigate();

  const [values, setValues] = useState<Record<string, string>>({});
  const [fetchingRates, setFetchingRates] = useState(false);
  const [summaryViewCurrency, setSummaryViewCurrency] = useState<string>('');

  useEffect(() => {
    if (settings) {
      const v: Record<string, string> = {};
      Object.entries(settings).forEach(([k, val]) => { v[k] = String(val); });
      setValues(v);
    }
  }, [settings]);

  const handleSave = (key: string) => {
    const result = settingSchema.safeParse({ key, value: values[key] });
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Invalid value');
      return;
    }
    const validated = result.data;
    updateSetting.mutate({ key: validated.key!, value: validated.value! }, {
      onSuccess: () => toast.success(`${key} updated`),
      onError: () => toast.error('Failed to update'),
    });
  };

  const fetchLatestRates = async () => {
    setFetchingRates(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-fx-rates');
      if (error) throw error;
      const rates = data?.rates;
      if (!rates) throw new Error('No rates returned');

      const updates: Promise<void>[] = [];
      for (const field of FX_RATE_FIELDS) {
        const rate = rates[field.currency];
        if (rate) {
          const decimals = field.currency === 'VND' || field.currency === 'IDR' ? 0 : (field.currency === 'USD' || field.currency === 'EUR' ? 4 : 2);
          const val = String(parseFloat(rate).toFixed(decimals));
          setValues(v => ({ ...v, [field.key]: val }));
          updates.push(
            updateSetting.mutateAsync({ key: field.key, value: val })
          );
          // Also update legacy fx_rate for THB
          if (field.currency === 'THB') {
            updates.push(
              updateSetting.mutateAsync({ key: 'fx_rate', value: val })
            );
          }
        }
      }
      await Promise.all(updates);
      toast.success('Exchange rates updated from live data!');
    } catch (err) {
      console.error('Failed to fetch rates:', err);
      toast.error('Could not fetch live rates — please set them manually');
    } finally {
      setFetchingRates(false);
    }
  };

  // Financial summary — use "View in" currency for display
  const activeCountry = values['display_country'] || 'Singapore';
  const viewCurrency = summaryViewCurrency || getCurrencyForCountry(activeCountry);
  const viewFxRate = settings ? getFxRateForCurrency(viewCurrency, settings) : 1;
  const viewSymbol = CURRENCY_INFO[viewCurrency]?.symbol || 'S$';
  const formatSummary = (amount: number) =>
    `${viewSymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // School funding is always in SGD → convert to view currency
  const schoolFundingView = (settings?.school_funding_sgd || 10000) * viewFxRate;

  // Salary: stored in params_currency (unified budget currency), convert to view currency
  const paramsCurrencyCode = values['params_currency'] || (settings ? getParamsCurrency(settings) : getCurrencyForCountry(activeCountry));
  const paramsFxRate = settings ? getFxRateForCurrency(paramsCurrencyCode, settings) : 1;
  const salaryInSGD = (settings?.salary_thb || 7000) / paramsFxRate;
  const salaryInView = salaryInSGD * viewFxRate;
  const salaryTotal = salaryInView * 6;

  const totalFundingCalc = schoolFundingView + salaryTotal;

  // Estimated spend: estimatedMonthlyCost now returns in SGD
  const activeMonths = settings ? generateMonths(settings) : MONTHS;
  const estimatedSpendInSGD = settings ? activeMonths.reduce((s, m) => s + estimatedMonthlyCost(m, settings), 0) : 0;
  const estimatedSpend = estimatedSpendInSGD * viewFxRate;

  const surplus = totalFundingCalc - estimatedSpend;

  // CSV export
  const exportCSV = () => {
    const rows = [
      ['Date', 'Category', 'Description', 'Amount THB', 'Country'],
      ...transactions.map(t => [t.date, t.category, t.description || '', String(t.amount_thb), t.country]),
      ...dailyLogs.map(d => [d.date, 'Daily', `L:${d.lunch_thb} D:${d.dinner_thb} O:${d.other_food_thb} T:${d.transport_thb} M:${d.misc_thb}`, String(getDailyTotal(d)), d.country]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `travel-intern-budget-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  // Clear all
  const clearAll = async () => {
    await supabase.from('daily_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    toast.success('All data cleared');
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm">Loading settings…</span>
    </div>
  );

  // Check if any FX rate is at default
  const hasDefaultRates = FX_RATE_FIELDS.some(f => !values[f.key] || values[f.key] === f.default);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your budget parameters" />
      <InfoBar message="Changes to parameters affect budget estimates across the app. Tap 'Save' next to each field after editing." />

      {/* Appearance & Region */}
      <Card className="shadow-md">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance & Region</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Display Name</Label>
            <div className="flex gap-2">
              <Input
                value={values['display_name'] || ''}
                onChange={e => setValues(v => ({ ...v, display_name: e.target.value }))}
                placeholder="Enter your display name"
                className="bg-accent/30 flex-1"
              />
              <Button size="sm" variant="outline" onClick={() => handleSave('display_name')} disabled={updateSetting.isPending}>Save</Button>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(t => (
                <Button key={t.value} size="sm" variant={theme === t.value ? 'default' : 'outline'} onClick={() => setTheme(t.value)} className="flex-1 gap-1.5">
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Preset */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Color Accent</Label>
            <div className="flex gap-3">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setPreset(c.id)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-all',
                    preset === c.id ? 'border-foreground scale-110 ring-2 ring-ring' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c.swatch }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Display Currency</Label>
            <Select value={values['display_currency'] || 'SGD'} onValueChange={v => { setValues(prev => ({ ...prev, display_currency: v })); updateSetting.mutate({ key: 'display_currency', value: v }); }}>
              <SelectTrigger className="bg-accent/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font Size</Label>
            <div className="flex gap-2">
              {[
                { value: 'small', label: 'Small' },
                { value: 'default', label: 'Default' },
                { value: 'large', label: 'Large' },
              ].map(f => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={(values['font_size'] || 'default') === f.value ? 'default' : 'outline'}
                  onClick={() => {
                    setValues(v => ({ ...v, font_size: f.value }));
                    updateSetting.mutate({ key: 'font_size', value: f.value });
                  }}
                  className="flex-1"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Default Country</Label>
            <Select value={values['display_country'] || 'Singapore'} onValueChange={v => { setValues(prev => ({ ...prev, display_country: v })); updateSetting.mutate({ key: 'display_country', value: v }); }}>
              <SelectTrigger className="bg-accent/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            💱 Exchange Rates (per 1 SGD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasDefaultRates && (
            <InfoBar message="Some exchange rates are at default values. Fetch live rates or update them manually for accurate conversions." />
          )}
          {FX_RATE_FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground w-32 shrink-0">
                {CURRENCY_INFO[f.currency]?.symbol} {f.label}
              </Label>
              <Input
                type="number"
                value={values[f.key] || ''}
                onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                className="bg-accent/30 flex-1"
                inputMode="decimal"
              />
              <Button size="sm" variant="outline" onClick={() => {
                handleSave(f.key);
                // Also sync legacy fx_rate for THB
                if (f.currency === 'THB') {
                  updateSetting.mutate({ key: 'fx_rate', value: values[f.key] });
                }
              }} disabled={updateSetting.isPending}>Save</Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={fetchLatestRates}
            disabled={fetchingRates}
          >
            {fetchingRates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {fetchingRates ? 'Fetching…' : 'Fetch Latest Rates'}
          </Button>
        </CardContent>
      </Card>

      {/* Settings Cards */}
      <Card className="shadow-md">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Budget Currency Selector — applies to salary, rent, and all daily costs */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Budget Currency</Label>
            <p className="text-[11px] text-muted-foreground/70">All budget parameters below (salary, rent, daily costs) are in this currency. School funding stays in SGD.</p>
            <Select
              value={values['params_currency'] || (settings ? getParamsCurrency(settings) : 'SGD')}
              onValueChange={v => {
                setValues(prev => ({ ...prev, params_currency: v }));
                updateSetting.mutate({ key: 'params_currency', value: v });
              }}
            >
              <SelectTrigger className="bg-accent/30 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {SETTING_FIELDS.map(f => {
            const paramsCurrency = values['params_currency'] || (settings ? getParamsCurrency(settings) : 'SGD');
            const displayLabel = f.dynamic ? `${f.label} (${paramsCurrency})` : f.label;
            return (
              <div key={f.key} className="space-y-1">
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground w-40 shrink-0">{displayLabel}</Label>
                  <Input
                    type={f.type}
                    value={values[f.key] || ''}
                    onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                    className="bg-accent/30 flex-1"
                    inputMode={f.type === 'number' ? 'decimal' : undefined}
                  />
                  <Button size="sm" variant="outline" onClick={() => handleSave(f.key)} disabled={updateSetting.isPending}>Save</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Financial Summary</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">View in</Label>
            <Select
              value={viewCurrency}
              onValueChange={v => setSummaryViewCurrency(v)}
            >
              <SelectTrigger className="h-7 w-24 text-xs bg-accent/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">School funding</span><span>{formatSummary(schoolFundingView)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Salary (6 months)</span><span>{formatSummary(salaryTotal)}</span></div>
          <div className="flex justify-between font-semibold border-t border-border pt-2"><span>Total funding</span><span>{formatSummary(totalFundingCalc)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Estimated spend</span><span>{formatSummary(estimatedSpend)}</span></div>
          <div className={`flex justify-between font-semibold border-t border-border pt-2 ${surplus >= 0 ? 'text-success-foreground' : 'text-destructive'}`}>
            <span>Estimated surplus</span><span>{formatSummary(surplus)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Re-Run Setup Guide */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate('/dashboard?onboarding=1')}
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Re-Run Setup Guide
      </Button>

      {/* Daily Reminders */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Daily Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Expense logging reminder</p>
              <p className="text-xs text-muted-foreground">Get a notification after 6 PM if you haven't logged today</p>
            </div>
            <Button
              variant={isRemindersEnabled() ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const newVal = !isRemindersEnabled();
                setRemindersEnabled(newVal);
                if (newVal && 'Notification' in window) {
                  Notification.requestPermission();
                }
                toast.success(newVal ? 'Reminders enabled' : 'Reminders disabled');
              }}
            >
              {isRemindersEnabled() ? '🔔 On' : '🔕 Off'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recurring Expenses */}
      <RecurringExpenses />

      {/* Suggest a Feature */}
      <FeatureSuggestionCard userEmail={session?.user?.email || ''} userId={session?.user?.id || ''} />

      {/* My Suggestions */}
      <MySuggestions userId={session?.user?.id || ''} />

      {/* Report a Bug */}
      <BugReportCard userEmail={session?.user?.email || ''} userId={session?.user?.id || ''} />

      {/* My Bug Reports */}
      <MyBugReports userId={session?.user?.id || ''} />

      {/* Contact & Support */}
      <ContactCard />

      {/* Data Section */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={exportCSV} className="flex-1"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1 text-destructive border-destructive"><Trash2 className="mr-2 h-4 w-4" /> Clear Data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all data?</AlertDialogTitle>
              <AlertDialogDescription>This will delete all daily logs and transactions. Funding and rent data will be kept.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearAll}>Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
