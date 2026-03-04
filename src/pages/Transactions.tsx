import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Trash2, CalendarIcon, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { CurrencyInput, useCurrencyInput } from '@/components/CurrencyInput';
import { CategoryBadge } from '@/components/CategoryBadge';
import { CountryFlag } from '@/components/CountryFlag';
import { useSettings } from '@/hooks/useSettings';
import { useTransactions, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useRentPayments, useMarkRentPaid } from '@/hooks/useRentPayments';
import { CATEGORIES, PAYMENT_METHODS, formatCurrency, getFxRateForCountry, getCurrencyForCountry, ALL_COUNTRIES, convertAmount } from '@/lib/budget-utils';
import type { Transaction } from '@/lib/budget-utils';
import { toast } from 'sonner';
import { transactionSchema } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { InfoBar } from '@/components/InfoBar';
import { TransactionPhotoSection } from '@/components/transactions/TransactionPhotoSection';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Transactions() {
  const { data: settings } = useSettings();
  const { data: transactions = [] } = useTransactions();
  const addTx = useAddTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const { data: rentPayments = [] } = useRentPayments();
  const markRentPaid = useMarkRentPaid();

  const displayCountry = settings?.display_country || 'Singapore';
  const displayCurrency = getCurrencyForCountry(displayCountry);
  const fxRate = settings ? getFxRateForCountry(displayCountry, settings) : 1;
  const fmt = (amount: number) => formatCurrency(amount, displayCurrency);
  const unpaidRents = rentPayments.filter(r => !r.is_paid);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form state
  const [txDate, setTxDate] = useState<Date>(new Date());
  const [txCategory, setTxCategory] = useState('');
  const [txSubcat, setTxSubcat] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCountry, setTxCountry] = useState('Thailand');
  const countryFxRate = settings ? getFxRateForCountry(txCountry, settings) : 26.5;
  const amt = useCurrencyInput(countryFxRate, txCountry);
  const [txMethod, setTxMethod] = useState('');
  const [txReimb, setTxReimb] = useState(false);
  const [txReceipt, setTxReceipt] = useState(false);
  const [txNotes, setTxNotes] = useState('');
  const [rentMonthId, setRentMonthId] = useState('');

  const filtered = transactions.filter(t => {
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== 'all' && t.category !== filterCat) return false;
    return true;
  });

  const resetForm = () => {
    setTxDate(new Date()); setTxCategory(''); setTxSubcat(''); setTxDesc('');
    amt.reset(); setTxMethod(''); setTxCountry('Thailand');
    setTxReimb(false); setTxReceipt(false); setTxNotes('');
    setEditingTx(null); setRentMonthId('');
  };

  const openForEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setTxDate(parseISO(tx.date));
    setTxCategory(tx.category);
    setTxSubcat(tx.subcategory || '');
    setTxDesc(tx.description || '');
    setTxCountry(tx.country || 'Thailand');
    amt.reset(String(tx.amount_thb));
    setTxMethod(tx.payment_method || '');
    setTxReimb(tx.is_reimbursable ?? false);
    setTxReceipt(tx.has_receipt ?? false);
    setTxNotes(tx.notes || '');
    setSheetOpen(true);
  };

  const handleSave = () => {
    const raw = {
      date: format(txDate, 'yyyy-MM-dd'),
      category: txCategory,
      subcategory: txSubcat || null,
      description: txDesc || null,
      amount_thb: amt.amountTHB,
      payment_method: txMethod || null,
      country: txCountry,
      is_reimbursable: txReimb,
      has_receipt: txReceipt,
      notes: txNotes || null,
    };
    const result = transactionSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || 'Validation failed');
      return;
    }
    const payload = result.data as typeof raw;

    const onSaved = () => {
      if (rentMonthId && txCategory === 'Rent') {
        markRentPaid.mutate({ id: rentMonthId, paid_date: format(txDate, 'yyyy-MM-dd') });
      }
      resetForm();
      setSheetOpen(false);
    };

    if (editingTx) {
      updateTx.mutate({ id: editingTx.id, ...payload }, {
        onSuccess: () => { toast.success('Transaction updated'); onSaved(); },
        onError: () => toast.error('Failed to update'),
      });
    } else {
      addTx.mutate(payload, {
        onSuccess: () => { toast.success(rentMonthId ? 'Rent transaction saved & month marked paid' : 'Transaction added'); onSaved(); },
        onError: () => toast.error('Failed to add'),
      });
    }
  };

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) resetForm();
  };

  const isPending = addTx.isPending || updateTx.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" subtitle="All expenses & payments" />
      <InfoBar message="Tap the + button to add a one off expense. Select 'Rent' as category to auto link it with your Rent Tracker entries." />

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-accent/30" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Receipt className="h-10 w-10 opacity-30" />
            <span className="text-sm">No transactions found</span>
          </div>
        )}
        {filtered.map(tx => (
          <Card key={tx.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openForEdit(tx)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={tx.category} />
                  <CountryFlag country={tx.country} />
                </div>
                <div className="text-sm font-medium truncate">{tx.description || tx.category}</div>
                <div className="text-xs text-muted-foreground">{format(parseISO(tx.date), 'd MMM yyyy')}</div>
              </div>
              <div className="flex items-center gap-2">
                <CurrencyDisplay amountTHB={Number(tx.amount_thb)} fxRate={fxRate} currency={displayCurrency} storedCurrency={getCurrencyForCountry(tx.country || 'Thailand')} settings={settings} size="sm" />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={e => e.stopPropagation()}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTx.mutate(tx.id, { onSuccess: () => toast.success('Deleted') })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAB - Add new */}
      <Button
        className="fixed bottom-20 right-4 md:bottom-6 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90"
        size="icon"
        onClick={() => { resetForm(); setSheetOpen(true); }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Sheet for Add/Edit */}
      <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingTx ? 'Edit Transaction' : 'Add Transaction'}</SheetTitle>
            <SheetDescription>Fill in the transaction details below</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            {/* Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-accent/30">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(txDate, 'd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={txDate} onSelect={d => d && setTxDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            {/* Category */}
            <Select value={txCategory} onValueChange={setTxCategory}>
              <SelectTrigger><SelectValue placeholder="Category *" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>

            {/* Rent Month Picker */}
            {txCategory === 'Rent' && unpaidRents.length > 0 && (
              <Select value={rentMonthId} onValueChange={id => {
                setRentMonthId(id);
                const rent = unpaidRents.find(r => r.id === id);
                if (rent?.amount_thb) amt.reset(String(rent.amount_thb));
              }}>
                <SelectTrigger className="bg-accent/30">
                  <SelectValue placeholder="Link to unpaid rent month…" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidRents.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.month} — {fmt(Number(r.amount_thb))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {txCategory === 'Rent' && unpaidRents.length === 0 && (
              <p className="text-xs text-muted-foreground">No unpaid rent months. Add one in Rent Tracker first.</p>
            )}

            <Input placeholder="Subcategory" value={txSubcat} onChange={e => setTxSubcat(e.target.value)} className="bg-accent/30" />
            <Input placeholder="Description" value={txDesc} onChange={e => setTxDesc(e.target.value)} className="bg-accent/30" />

            {/* Country dropdown */}
            <div className="space-y-2">
              <Label className="text-sm">Country</Label>
              <Select value={txCountry} onValueChange={v => { setTxCountry(v); amt.reset(); }}>
                <SelectTrigger className="bg-accent/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount with currency toggle */}
            <CurrencyInput value={amt.value} onChange={amt.setValue} fxRate={countryFxRate} country={txCountry} />

            {/* Payment Method */}
            <Select value={txMethod} onValueChange={setTxMethod}>
              <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>

            {/* Toggles */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={txReimb} onCheckedChange={setTxReimb} />
                <Label className="text-sm">Reimbursable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={txReceipt} onCheckedChange={setTxReceipt} />
                <Label className="text-sm">Has receipt</Label>
              </div>
            </div>

            <Input placeholder="Notes" value={txNotes} onChange={e => setTxNotes(e.target.value)} className="bg-accent/30" />

            {editingTx && (
              <TransactionPhotoSection transactionId={editingTx.id} />
            )}

            <Button onClick={handleSave} disabled={isPending} className="w-full h-12 text-base font-semibold bg-primary">
              {isPending ? 'Saving…' : editingTx ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
