import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { CurrencyInput, useCurrencyInput } from '@/components/CurrencyInput';
import { KPICard } from '@/components/KPICard';
import { useSettings } from '@/hooks/useSettings';
import { useFunding, useAddFunding, useUpdateFunding, useDeleteFunding, useToggleFundingReceived } from '@/hooks/useFunding';
import { formatCurrency, getCurrencyForCountry, getFxRateForCountry, convertAmount, getParamsCurrency, ALL_COUNTRIES, CURRENCY_INFO } from '@/lib/budget-utils';
import type { Funding } from '@/lib/budget-utils';
import { Wallet, ArrowDown, Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { fundingSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { InfoBar } from '@/components/InfoBar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function FundingPage() {
  const { data: settings } = useSettings();
  const { data: funding = [] } = useFunding();
  const addFunding = useAddFunding();
  const updateFunding = useUpdateFunding();
  const deleteFunding = useDeleteFunding();
  const toggleReceived = useToggleFundingReceived();

  const displayCountry = settings?.display_country || 'Singapore';
  const displayCurrency = getCurrencyForCountry(displayCountry);
  const fxRate = settings ? getFxRateForCountry(displayCountry, settings) : 1;

  // Convert each funding row from its stored currency to display currency for totals
  const toDisplay = (f: Funding) => {
    const stored = f.currency || 'SGD';
    return settings ? convertAmount(Number(f.amount_thb), stored, displayCurrency, settings) : Number(f.amount_thb);
  };

  const totalExpected = funding.filter(f => f.is_expected).reduce((s, f) => s + toDisplay(f), 0);
  const totalReceived = funding.filter(f => f.is_received).reduce((s, f) => s + toDisplay(f), 0);
  const outstanding = totalExpected - totalReceived;
  const fmt = (amount: number) => formatCurrency(amount, displayCurrency);

  // All supported currencies for the selector
  const currencyOptions = ALL_COUNTRIES.map(c => {
    const cur = getCurrencyForCountry(c.code);
    const info = CURRENCY_INFO[cur] || { symbol: '?', label: cur };
    return { country: c.code, currency: cur, symbol: info.symbol, label: `${info.symbol} ${cur}`, flag: c.flag };
  });

  const defaultCurrency = settings ? getParamsCurrency(settings) : 'SGD';
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Funding | null>(null);
  const [fSource, setFSource] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCurrency, setFCurrency] = useState(defaultCurrency);

  // Derive country & fx rate from the selected currency
  const selectedCountry = ALL_COUNTRIES.find(c => getCurrencyForCountry(c.code) === fCurrency)?.code || 'Singapore';
  const selectedFxRate = settings ? getFxRateForCountry(selectedCountry, settings) : 1;
  const amt = useCurrencyInput(selectedFxRate, selectedCountry);

  const resetForm = () => {
    setFSource(''); setFDesc(''); setFCurrency(defaultCurrency); amt.reset(); setEditingRow(null);
  };

  const openForEdit = (f: Funding) => {
    setEditingRow(f);
    setFSource(f.source);
    setFDesc(f.description || '');
    setFCurrency(f.currency || 'SGD');
    amt.reset(String(f.amount_thb));
    setSheetOpen(true);
  };

  const handleSave = () => {
    // Save in the explicitly selected currency
    const saveCurrency = fCurrency;
    const raw = {
      source: fSource,
      description: fDesc || null,
      amount_thb: amt.amountTHB,
      is_expected: editingRow ? editingRow.is_expected ?? true : true,
      is_received: editingRow ? editingRow.is_received ?? false : false,
    };
    const result = fundingSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Validation failed');
      return;
    }
    const payload = { ...(result.data as typeof raw), currency: saveCurrency };

    if (editingRow) {
      updateFunding.mutate({ id: editingRow.id, ...payload }, {
        onSuccess: () => { toast.success('Funding updated'); resetForm(); setSheetOpen(false); },
      });
    } else {
      addFunding.mutate(payload, {
        onSuccess: () => { toast.success('Funding added'); resetForm(); setSheetOpen(false); },
      });
    }
  };

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) resetForm();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Funding" subtitle="Track incoming money" />
      <InfoBar message="Add all expected funding sources here. Toggle between 'Pending' and 'Received' as money comes in. School funding is always in SGD." />

      <div className="grid grid-cols-3 gap-3">
        <KPICard icon={Wallet} label="Expected">
          <span className="text-lg font-bold">{fmt(totalExpected)}</span>
        </KPICard>
        <KPICard icon={ArrowDown} label="Received" variant="success">
          <span className="text-lg font-bold">{fmt(totalReceived)}</span>
        </KPICard>
        <KPICard icon={Clock} label="Outstanding" variant={outstanding > 0 ? 'warning' : 'default'}>
          <span className="text-lg font-bold">{fmt(outstanding)}</span>
        </KPICard>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {funding.map(f => (
          <Card key={f.id} className={cn('shadow-sm', f.is_expected && !f.is_received && 'bg-warning/10')}>
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{f.description || f.source}</div>
                <div className="text-xs text-muted-foreground">
                  {f.source}{f.date ? ` • ${format(parseISO(f.date), 'd MMM yyyy')}` : ''}
                  {f.currency && f.currency !== displayCurrency ? ` • stored ${f.currency}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CurrencyDisplay amountTHB={Number(f.amount_thb)} fxRate={fxRate} currency={displayCurrency} storedCurrency={f.currency || 'SGD'} settings={settings} size="sm" />
                <Button
                  size="sm"
                  variant={f.is_received ? 'default' : 'outline'}
                  className={cn(
                    'text-xs h-7 min-w-[70px]',
                    f.is_received ? 'bg-success text-success-foreground hover:bg-success/80' : 'border-destructive text-destructive'
                  )}
                  onClick={() => toggleReceived.mutate({ id: f.id, is_received: !f.is_received })}
                >
                  {f.is_received ? 'Received' : 'Pending'}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openForEdit(f)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete funding row?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteFunding.mutate(f.id, { onSuccess: () => toast.success('Deleted') })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full bg-primary" variant="default" onClick={() => { resetForm(); setSheetOpen(true); }}>
        <Plus className="mr-2 h-4 w-4" /> Add Funding
      </Button>

      <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingRow ? 'Edit Funding' : 'Add Funding'}</SheetTitle>
            <SheetDescription>Enter funding source and amount</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Select value={fSource} onValueChange={setFSource}>
              <SelectTrigger><SelectValue placeholder="Source *" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Starting Balance">Starting Balance</SelectItem>
                <SelectItem value="School">School</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Description" value={fDesc} onChange={e => setFDesc(e.target.value)} className="bg-accent/30" />
            <Select value={fCurrency} onValueChange={setFCurrency}>
              <SelectTrigger><SelectValue placeholder="Currency *" /></SelectTrigger>
              <SelectContent>
                {currencyOptions.map(opt => (
                  <SelectItem key={opt.currency} value={opt.currency}>
                    {opt.flag} {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CurrencyInput value={amt.value} onChange={amt.setValue} fxRate={selectedFxRate} country={selectedCountry} />
            <Button onClick={handleSave} disabled={addFunding.isPending || updateFunding.isPending} className="w-full h-12 bg-primary">
              {editingRow ? 'Update' : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
