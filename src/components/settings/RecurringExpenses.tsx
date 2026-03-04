import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Repeat, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'bkk_recurring_expenses';

export interface RecurringExpense {
    id: string;
    label: string;
    field: string; // e.g. 'lunch_thb', 'transport_thb', 'misc_thb'
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
}

const FIELD_OPTIONS = [
    { value: 'lunch_thb', label: 'Lunch' },
    { value: 'dinner_thb', label: 'Dinner' },
    { value: 'other_food_thb', label: 'Other Food' },
    { value: 'transport_thb', label: 'Transport' },
    { value: 'misc_thb', label: 'Misc' },
];

function loadRecurring(): RecurringExpense[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveRecurring(items: RecurringExpense[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function RecurringExpenses() {
    const [items, setItems] = useState<RecurringExpense[]>(loadRecurring);
    const [label, setLabel] = useState('');
    const [field, setField] = useState('misc_thb');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        saveRecurring(items);
    }, [items]);

    const addItem = () => {
        if (!label.trim()) { toast.error('Enter a label'); return; }
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount'); return; }
        const newItem: RecurringExpense = {
            id: crypto.randomUUID(),
            label: label.trim(),
            field,
            amount: amt,
            frequency,
        };
        setItems(prev => [...prev, newItem]);
        setLabel(''); setAmount(''); setShowForm(false);
        toast.success(`Added: ${newItem.label}`);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success('Removed');
    };

    const freqLabel = (f: string) => f === 'daily' ? 'Every day' : f === 'weekly' ? 'Every week' : 'Every month';
    const fieldLabel = (f: string) => FIELD_OPTIONS.find(o => o.value === f)?.label || f;

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Repeat className="h-4 w-4" /> Recurring Expenses
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length === 0 && !showForm && (
                    <p className="text-xs text-muted-foreground">No recurring expenses set. These will be auto-filled when you create a new daily log.</p>
                )}
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-accent/20 px-3 py-2">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.label}</div>
                            <div className="text-[10px] text-muted-foreground">{fieldLabel(item.field)} • {freqLabel(item.frequency)} • {item.amount}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
                {showForm ? (
                    <div className="space-y-2 rounded-lg border border-border/50 p-3 bg-accent/10">
                        <Input placeholder="Label (e.g. Gym, Phone data)" value={label} onChange={e => setLabel(e.target.value)} className="bg-accent/30" />
                        <div className="flex gap-2">
                            <Select value={field} onValueChange={setField}>
                                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {FIELD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={frequency} onValueChange={v => setFrequency(v as any)}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="bg-accent/30" inputMode="decimal" />
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={addItem}>Add</Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Recurring Expense
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/** Get daily recurring amounts to pre-fill daily log form */
export function getRecurringDefaults(): Record<string, number> {
    const items = loadRecurring().filter(i => i.frequency === 'daily');
    const defaults: Record<string, number> = {};
    items.forEach(item => {
        defaults[item.field] = (defaults[item.field] || 0) + item.amount;
    });
    return defaults;
}
