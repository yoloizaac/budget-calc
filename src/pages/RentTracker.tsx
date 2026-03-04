import { useState } from 'react';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { CurrencyInput, useCurrencyInput } from '@/components/CurrencyInput';
import { KPICard } from '@/components/KPICard';
import { useSettings } from '@/hooks/useSettings';
import { useRentPayments, useMarkRentPaid, useUpdateRentPayment, useAddRentPayment, useDeleteRentPayment } from '@/hooks/useRentPayments';
import { useTransactions, useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { formatCurrency, PAYMENT_METHODS, getCurrencyForCountry, getFxRateForCountry, getParamsCurrency, convertAmount } from '@/lib/budget-utils';
import { Building, Check, ChevronDown, Undo2, Plus, Trash2, Pencil, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function RentTracker() {
  const { data: settings } = useSettings();
  const { data: rents = [] } = useRentPayments();
  const { data: transactions = [] } = useTransactions();
  const markPaid = useMarkRentPaid();
  const updateRent = useUpdateRentPayment();
  const addRent = useAddRentPayment();
  const deleteRent = useDeleteRentPayment();
  const deleteTx = useDeleteTransaction();
  const updateTx = useUpdateTransaction();
  const displayCountry = settings?.display_country || 'Singapore';
  const displayCurrency = getCurrencyForCountry(displayCountry);
  const fxRate = settings ? getFxRateForCountry(displayCountry, settings) : 1;
  const fmt = (amount: number) => formatCurrency(amount, displayCurrency);

  const rentTxns = transactions.filter(t => t.category === 'Rent');
  const rentTxTotal = rentTxns.reduce((s, t) => s + (settings ? convertAmount(Number(t.amount_thb), getCurrencyForCountry(t.country || 'Thailand'), displayCurrency, settings) : Number(t.amount_thb)), 0);

  const paidCount = rents.filter(r => r.is_paid).length;
  const totalPaid = rentTxTotal;
  const outstanding = rents.filter(r => !r.is_paid).reduce((s, r) => s + (settings ? convertAmount(Number(r.amount_thb), getParamsCurrency(settings), displayCurrency, settings) : Number(r.amount_thb)), 0);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [editMethod, setEditMethod] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Add rent sheet
  const [showAdd, setShowAdd] = useState(false);
  const [newMonth, setNewMonth] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const newAmt = useCurrencyInput(fxRate, '15500');
  const [newNotes, setNewNotes] = useState('');

  // Edit rent transaction sheet
  const [editingRentTx, setEditingRentTx] = useState<typeof rentTxns[0] | null>(null);
  const [editTxDesc, setEditTxDesc] = useState('');
  const editTxAmt = useCurrencyInput(fxRate);
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxMethod, setEditTxMethod] = useState('');
  const [editTxNotes, setEditTxNotes] = useState('');

  const openEditTx = (tx: typeof rentTxns[0]) => {
    setEditingRentTx(tx);
    setEditTxDesc(tx.description || '');
    editTxAmt.reset(String(tx.amount_thb));
    setEditTxDate(tx.date);
    setEditTxMethod(tx.payment_method || '');
    setEditTxNotes(tx.notes || '');
  };

  const handleSaveEditTx = () => {
    if (!editingRentTx) return;
    updateTx.mutate({
      id: editingRentTx.id,
      description: editTxDesc || undefined,
      amount_thb: editTxAmt.amountTHB,
      date: editTxDate,
      payment_method: editTxMethod || undefined,
      notes: editTxNotes || undefined,
    }, {
      onSuccess: () => { toast.success('Transaction updated'); setEditingRentTx(null); },
      onError: () => toast.error('Failed to update'),
    });
  };

  const hasPaidRentPayments = rents.some(r => r.is_paid);
  const hasRentTxns = rentTxns.length > 0;

  const getStatus = (r: typeof rents[0]) => {
    if (r.is_paid) return 'PAID';
    if (r.due_date) {
      const due = parseISO(r.due_date);
      const soon = addDays(new Date(), 7);
      if (isAfter(soon, due) && isAfter(due, new Date())) return 'DUE SOON';
    }
    return 'UNPAID';
  };

  const statusColors: Record<string, string> = {
    PAID: 'bg-success text-success-foreground',
    UNPAID: 'bg-destructive/20 text-destructive',
    'DUE SOON': 'bg-warning text-warning-foreground',
  };

  const handleExpand = (id: string, open: boolean, r: typeof rents[0]) => {
    setExpanded(open ? id : null);
    if (open && r.is_paid) {
      setEditMethod(r.payment_method || '');
      setEditNotes(r.notes || '');
    }
  };

  const handleRevert = (r: typeof rents[0]) => {
    updateRent.mutate({
      id: r.id, is_paid: false, paid_date: null, payment_method: null, notes: null,
    }, { onSuccess: () => toast.success(`${r.month} reverted to unpaid`) });
  };

  const handleUpdatePaid = (r: typeof rents[0]) => {
    updateRent.mutate({
      id: r.id, payment_method: editMethod || null, notes: editNotes || null,
    }, { onSuccess: () => toast.success(`${r.month} updated`) });
  };

  const handleAddRent = () => {
    if (!newMonth.trim()) { toast.error('Month is required'); return; }
    addRent.mutate({
      month: newMonth, due_date: newDueDate || undefined, amount_thb: newAmt.amountTHB,
      notes: newNotes || undefined, is_paid: false,
    }, {
      onSuccess: () => { toast.success('Rent payment added'); setShowAdd(false); setNewMonth(''); setNewDueDate(''); newAmt.reset('15500'); setNewNotes(''); },
      onError: () => toast.error('Failed to add'),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Rent Tracker" subtitle="Rent overview & transactions">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Rent
        </Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <KPICard icon={Building} label="Paid">
          <span className="text-lg font-bold">{rents.length === 0 ? '—' : `${paidCount}/${rents.length}`}</span>
        </KPICard>
        <KPICard icon={Check} label="Total Paid" variant="success">
          <span className="text-lg font-bold">{fmt(totalPaid)}</span>
        </KPICard>
        <KPICard icon={Building} label="Outstanding" variant={outstanding > 0 ? 'warning' : 'default'}>
          <span className="text-lg font-bold">{fmt(outstanding)}</span>
        </KPICard>
      </div>

      {/* Rent Payment Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {rents.map(r => {
          const status = getStatus(r);
          return (
            <Collapsible key={r.id} open={expanded === r.id} onOpenChange={open => handleExpand(r.id, open, r)}>
              <Card className="shadow-md">
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{r.month}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-xs', statusColors[status])}>{status}</Badge>
                      </div>
                    </div>
                    <CurrencyDisplay amountTHB={Number(r.amount_thb)} fxRate={fxRate} currency={displayCurrency} storedCurrency={settings ? getParamsCurrency(settings) : displayCurrency} settings={settings} size="sm" />
                    {r.paid_date && <div className="text-xs text-muted-foreground mt-1">Paid {format(parseISO(r.paid_date), 'd MMM yyyy')}</div>}
                    <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {r.is_paid ? (
                      <div className="space-y-3">
                        <Select value={editMethod} onValueChange={setEditMethod}>
                          <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
                          <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Notes" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="bg-accent/30" />
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => handleUpdatePaid(r)} disabled={updateRent.isPending}>Save Changes</Button>
                          <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleRevert(r)} disabled={updateRent.isPending}>
                            <Undo2 className="mr-2 h-4 w-4" /> Revert
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Select value={payMethod} onValueChange={setPayMethod}>
                          <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
                          <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Notes" value={payNotes} onChange={e => setPayNotes(e.target.value)} className="bg-accent/30" />
                        <Button
                          className="w-full bg-success text-success-foreground hover:bg-success/80"
                          onClick={() => {
                            markPaid.mutate({
                              id: r.id, paid_date: format(new Date(), 'yyyy-MM-dd'),
                              payment_method: payMethod || undefined, notes: payNotes || undefined,
                            }, { onSuccess: () => { toast.success(`${r.month} marked as paid`); setPayMethod(''); setPayNotes(''); } });
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" /> Mark as Paid
                        </Button>
                        <p className="text-[10px] text-muted-foreground/70 text-center">Or pay via Transactions → select "Rent" to auto-link</p>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Rent Entry
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {r.month}?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this rent payment entry.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteRent.mutate(r.id, { onSuccess: () => toast.success('Deleted') })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 rounded-md bg-muted/50 border border-border/50 px-3 py-2.5">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">Rent entries here track obligations. Actual spending is recorded via Transactions with category "Rent" — which auto-marks the linked month as paid.</p>
      </div>

      {/* Rent Transactions from Transactions table */}
      {rentTxns.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Rent Transactions ({rentTxns.length})</CardTitle>
            <p className="text-xs text-muted-foreground">From transactions with category "Rent" • Total: {fmt(Math.round(rentTxTotal))}</p>
            <p className="text-xs text-muted-foreground/70 italic mt-1">These are the actual rent payments that count toward your Dashboard totals.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {rentTxns.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-accent/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{tx.description || 'Rent'}</div>
                    <div className="text-xs text-muted-foreground">{format(parseISO(tx.date), 'd MMM yyyy')}{tx.payment_method ? ` • ${tx.payment_method}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{fmt(settings ? convertAmount(Number(tx.amount_thb), getCurrencyForCountry(tx.country || 'Thailand'), displayCurrency, settings) : Number(tx.amount_thb))}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditTx(tx)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                          <AlertDialogDescription>Delete this rent transaction ({fmt(settings ? convertAmount(Number(tx.amount_thb), getCurrencyForCountry(tx.country || 'Thailand'), displayCurrency, settings) : Number(tx.amount_thb))})?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTx.mutate(tx.id, { onSuccess: () => toast.success('Deleted') })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Rent Sheet */}
      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Rent Payment</SheetTitle>
            <SheetDescription>Add a new monthly rent entry</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Month (e.g. "Sep 2026")</Label>
              <Input value={newMonth} onChange={e => setNewMonth(e.target.value)} placeholder="Sep 2026" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Due Date</Label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Amount</Label>
              <CurrencyInput value={newAmt.value} onChange={newAmt.setValue} fxRate={fxRate} size="sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
              <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Optional" />
            </div>
            <Button onClick={handleAddRent} disabled={addRent.isPending} className="w-full">
              {addRent.isPending ? 'Adding...' : 'Add Rent Payment'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Rent Transaction Sheet */}
      <Sheet open={!!editingRentTx} onOpenChange={open => !open && setEditingRentTx(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Rent Transaction</SheetTitle>
            <SheetDescription>Modify this rent transaction</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input value={editTxDesc} onChange={e => setEditTxDesc(e.target.value)} placeholder="Rent" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input type="date" value={editTxDate} onChange={e => setEditTxDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <CurrencyInput value={editTxAmt.value} onChange={editTxAmt.setValue} fxRate={fxRate} size="sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Payment Method</Label>
              <Select value={editTxMethod} onValueChange={setEditTxMethod}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input value={editTxNotes} onChange={e => setEditTxNotes(e.target.value)} placeholder="Optional" />
            </div>
            <Button onClick={handleSaveEditTx} disabled={updateTx.isPending} className="w-full">
              {updateTx.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
