import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';
import { CURRENCY_INFO, getFxRateForCurrency, type Settings } from '@/lib/budget-utils';

const CURRENCIES = ['SGD', 'THB', 'VND', 'CNY', 'MYR', 'IDR', 'INR', 'USD', 'EUR'] as const;

interface Props {
    settings: Settings | undefined;
}

export function CurrencyConverter({ settings }: Props) {
    const [amount, setAmount] = useState('100');
    const [from, setFrom] = useState('THB');
    const [to, setTo] = useState('SGD');

    const result = useMemo(() => {
        if (!settings || !amount) return null;
        const val = parseFloat(amount);
        if (isNaN(val)) return null;
        const fromRate = getFxRateForCurrency(from, settings);
        const toRate = getFxRateForCurrency(to, settings);
        return (val / fromRate) * toRate;
    }, [amount, from, to, settings]);

    const toSymbol = CURRENCY_INFO[to]?.symbol || '';
    const fromSymbol = CURRENCY_INFO[from]?.symbol || '';

    return (
        <Card className="shadow-md border-border/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4" /> Quick Converter
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="flex-1 bg-accent/30"
                        inputMode="decimal"
                        placeholder="Amount"
                    />
                    <Select value={from} onValueChange={setFrom}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CURRENCIES.map(c => (
                                <SelectItem key={c} value={c}>{CURRENCY_INFO[c]?.symbol} {c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-foreground min-h-[40px] flex items-center">
                        {result !== null ? `${toSymbol}${result.toLocaleString('en-US', {
                            minimumFractionDigits: to === 'VND' || to === 'IDR' ? 0 : 2,
                            maximumFractionDigits: to === 'VND' || to === 'IDR' ? 0 : 2,
                        })}` : '—'}
                    </div>
                    <Select value={to} onValueChange={setTo}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CURRENCIES.map(c => (
                                <SelectItem key={c} value={c}>{CURRENCY_INFO[c]?.symbol} {c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
