import { useState, useMemo, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { getRecurringDefaults } from '@/components/settings/RecurringExpenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { useSettings } from '@/hooks/useSettings';
import { useDailyLogs, useDailyLogByDate, useUpsertDailyLog, useDeleteDailyLog, useQuickSaveField } from '@/hooks/useDailyLog';
import { getCountryForDate, getDailyTotal, toSGD, formatCurrency, formatSGD, getFxRateForCountry, ALL_COUNTRIES, getCurrencyForCountry, CURRENCY_INFO, convertParamsToTarget, getParamsCurrency } from '@/lib/budget-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { dailyLogSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExpenseFieldCard } from '@/components/daily-log/ExpenseFieldCard';
import { PhotoSection } from '@/components/daily-log/PhotoSection';
import { HistoryEntry } from '@/components/daily-log/HistoryEntry';
import { InfoBar } from '@/components/InfoBar';

const FIELDS = [
  { key: 'lunch_thb', label: 'Lunch', emoji: '🍜', settingKey: 'daily_lunch' },
  { key: 'dinner_thb', label: 'Dinner', emoji: '🍽', settingKey: 'daily_dinner' },
  { key: 'other_food_thb', label: 'Other Food', emoji: '🧃', settingKey: 'daily_other_food' },
  { key: 'transport_thb', label: 'Transport', emoji: '🚇', settingKey: 'daily_transport' },
  { key: 'misc_thb', label: 'Misc', emoji: '🛍', settingKey: 'daily_misc' },
] as const;

export default function DailyLog() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: settings } = useSettings();
  const { data: existingLog } = useDailyLogByDate(dateStr);
  const { data: allLogs } = useDailyLogs();
  const upsert = useUpsertDailyLog();
  const deleteMut = useDeleteDailyLog();
  const quickSave = useQuickSaveField();

  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [savingField, setSavingField] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    settings ? getCountryForDate(selectedDate, settings) : 'Thailand'
  );

  // Populate form when existing log loads
  useEffect(() => {
    if (existingLog) {
      setValues({
        lunch_thb: String(existingLog.lunch_thb || ''),
        dinner_thb: String(existingLog.dinner_thb || ''),
        other_food_thb: String(existingLog.other_food_thb || ''),
        transport_thb: String(existingLog.transport_thb || ''),
        misc_thb: String(existingLog.misc_thb || ''),
      });
      setNotes(existingLog.notes || '');
      setSelectedCountry(existingLog.country || 'Thailand');
    } else {
      // Pre-fill with recurring expense defaults
      const defaults = getRecurringDefaults();
      const defaultValues: Record<string, string> = {};
      Object.entries(defaults).forEach(([field, amount]) => {
        defaultValues[field] = String(amount);
      });
      setValues(defaultValues);
      setNotes('');
      setSelectedCountry(settings ? getCountryForDate(selectedDate, settings) : 'Thailand');
    }
  }, [existingLog?.id, existingLog?.updated_at]);

  const country = selectedCountry;
  const fxRate = settings ? getFxRateForCountry(country, settings) : 26.5;
  const currencyCode = getCurrencyForCountry(country);
  const currencySymbol = CURRENCY_INFO[currencyCode]?.symbol || '฿';

  const todayTotal = FIELDS.reduce((sum, f) => sum + (parseFloat(values[f.key] || '0') || 0), 0);

  const monthlyTotal = useMemo(() => {
    if (!allLogs) return 0;
    const ms = startOfMonth(selectedDate);
    const me = endOfMonth(selectedDate);
    return allLogs
      .filter(l => { const d = parseISO(l.date); return d >= ms && d <= me; })
      .reduce((s, l) => s + getDailyTotal(l), 0);
  }, [allLogs, selectedDate]);

  const last7 = useMemo(() => {
    if (!allLogs) return [];
    const cutoff = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    return allLogs.filter(l => l.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  }, [allLogs]);

  const handleQuickSave = (fieldKey: string, value: number) => {
    setSavingField(fieldKey);
    quickSave.mutate(
      { date: dateStr, country, field: fieldKey, value, existingId: existingLog?.id },
      {
        onSuccess: () => { toast.success(`${fieldKey.replace('_thb', '')} saved!`); setSavingField(null); },
        onError: () => { toast.error('Failed to save'); setSavingField(null); },
      }
    );
  };

  const handleSave = () => {
    const raw = {
      date: dateStr, country,
      lunch_thb: parseFloat(values.lunch_thb || '0') || 0,
      dinner_thb: parseFloat(values.dinner_thb || '0') || 0,
      other_food_thb: parseFloat(values.other_food_thb || '0') || 0,
      transport_thb: parseFloat(values.transport_thb || '0') || 0,
      misc_thb: parseFloat(values.misc_thb || '0') || 0,
      notes: notes || null,
    };
    const result = dailyLogSchema.safeParse(raw);
    if (!result.success) { toast.error(result.error.errors[0]?.message || 'Validation failed'); return; }
    const validated = result.data as typeof raw;
    const payload = { ...(existingLog?.id ? { id: existingLog.id } : {}), ...validated };
    upsert.mutate(payload, {
      onSuccess: () => toast.success(existingLog ? 'Day updated!' : 'Day saved!'),
      onError: () => toast.error('Failed to save'),
    });
  };

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => toast.success('Entry deleted'),
      onError: () => toast.error('Failed to delete'),
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Daily Log" subtitle="Log expenses throughout the day" />
      <InfoBar message="Tap any expense card to enter an amount, then hit the check to quick save. Use 'Save Day' to save all fields at once." />

      {/* Monthly total bar */}
      <div className="bg-secondary/10 rounded-lg px-4 py-2 text-sm text-foreground flex items-center justify-between">
        <span>{format(selectedDate, 'MMMM yyyy')} total</span>
        <CurrencyDisplay amountTHB={monthlyTotal} fxRate={fxRate} currency={currencyCode} storedCurrency={currencyCode} settings={settings} size="sm" />
      </div>

      {/* Date picker + country */}
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start text-left font-normal bg-accent/30">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'EEE, d MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-40 bg-accent/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.flag} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expense field cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(f => (
          <ExpenseFieldCard
            key={f.key}
            emoji={f.emoji}
            label={f.label}
            budgetHint={settings ? convertParamsToTarget(settings[f.settingKey as keyof typeof settings] as number ?? 0, settings, currencyCode) : 0}
            value={values[f.key] || ''}
            savedValue={existingLog ? Number((existingLog as unknown as Record<string, unknown>)[f.key]) || 0 : null}
            onChange={val => setValues(v => ({ ...v, [f.key]: val }))}
            onQuickSave={val => handleQuickSave(f.key, val)}
            isSaving={savingField === f.key}
            fxRate={fxRate}
            country={country}
          />
        ))}
      </div>

      {/* Today's total */}
      <Card className="shadow-md bg-primary text-primary-foreground">
        <CardContent className="p-5 text-center">
          <div className="text-xs uppercase tracking-wide text-primary-foreground/60 mb-1">Today's Total</div>
          <div className="text-3xl font-bold">{formatCurrency(todayTotal, currencyCode)}</div>
          <div className="text-sm text-primary-foreground/70 mt-1">{formatSGD(toSGD(todayTotal, fxRate))}</div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} className="bg-accent/30" />

      {/* Photos */}
      <PhotoSection dailyLogId={existingLog?.id} />

      {/* Save all / Delete */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={upsert.isPending} className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90">
          {upsert.isPending ? 'Saving…' : existingLog ? 'Update Day' : 'Save Day'}
        </Button>
        {existingLog && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="h-12 border-destructive text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the log for {format(selectedDate, 'd MMM yyyy')}.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(existingLog.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* History */}
      {last7.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {last7.map(log => (
                <HistoryEntry
                  key={log.id}
                  log={log}
                  fxRate={fxRate}
                  settings={settings}
                  onSelect={() => setSelectedDate(parseISO(log.date))}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
