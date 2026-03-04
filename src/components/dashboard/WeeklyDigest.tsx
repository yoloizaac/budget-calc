import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { getDailyTotal, formatCurrency, getCurrencyForCountry, convertAmount, type DailyLog, type Transaction, type Settings } from '@/lib/budget-utils';

interface Props {
    dailyLogs: DailyLog[];
    transactions: Transaction[];
    settings: Settings | undefined;
    displayCurrency: string;
}

export function WeeklyDigest({ dailyLogs, transactions, settings, displayCurrency }: Props) {
    const digest = useMemo(() => {
        if (!settings) return null;

        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        // This week
        const thisWeekLogs = dailyLogs.filter(d => {
            try { const dt = parseISO(d.date); return isWithinInterval(dt, { start: weekStart, end: weekEnd }); }
            catch { return false; }
        });
        const thisWeekTx = transactions.filter(t => {
            try { const dt = parseISO(t.date); return isWithinInterval(dt, { start: weekStart, end: weekEnd }); }
            catch { return false; }
        });

        const thisWeekDailyTotal = thisWeekLogs.reduce((s, d) => {
            const sc = getCurrencyForCountry(d.country || 'Thailand');
            return s + convertAmount(getDailyTotal(d), sc, displayCurrency, settings);
        }, 0);
        const thisWeekTxTotal = thisWeekTx.reduce((s, t) => {
            const sc = getCurrencyForCountry(t.country || 'Thailand');
            return s + convertAmount(Number(t.amount_thb), sc, displayCurrency, settings);
        }, 0);
        const thisWeekTotal = thisWeekDailyTotal + thisWeekTxTotal;

        // Last week
        const lastWeekStart = subDays(weekStart, 7);
        const lastWeekEnd = subDays(weekStart, 1);
        const lastWeekLogs = dailyLogs.filter(d => {
            try { const dt = parseISO(d.date); return isWithinInterval(dt, { start: lastWeekStart, end: lastWeekEnd }); }
            catch { return false; }
        });
        const lastWeekTx = transactions.filter(t => {
            try { const dt = parseISO(t.date); return isWithinInterval(dt, { start: lastWeekStart, end: lastWeekEnd }); }
            catch { return false; }
        });
        const lastWeekTotal = lastWeekLogs.reduce((s, d) => {
            const sc = getCurrencyForCountry(d.country || 'Thailand');
            return s + convertAmount(getDailyTotal(d), sc, displayCurrency, settings);
        }, 0) + lastWeekTx.reduce((s, t) => {
            const sc = getCurrencyForCountry(t.country || 'Thailand');
            return s + convertAmount(Number(t.amount_thb), sc, displayCurrency, settings);
        }, 0);

        const daysLogged = thisWeekLogs.length;
        const avgPerDay = daysLogged > 0 ? thisWeekTotal / daysLogged : 0;
        const change = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

        // Top category
        const catMap: Record<string, number> = {};
        thisWeekLogs.forEach(d => {
            const sc = getCurrencyForCountry(d.country || 'Thailand');
            const cv = (v: number) => convertAmount(v, sc, displayCurrency, settings);
            catMap['Food'] = (catMap['Food'] || 0) + cv((Number(d.lunch_thb) || 0) + (Number(d.dinner_thb) || 0) + (Number(d.other_food_thb) || 0));
            catMap['Transport'] = (catMap['Transport'] || 0) + cv(Number(d.transport_thb) || 0);
            catMap['Misc'] = (catMap['Misc'] || 0) + cv(Number(d.misc_thb) || 0);
        });
        thisWeekTx.forEach(t => {
            const sc = getCurrencyForCountry(t.country || 'Thailand');
            catMap[t.category] = (catMap[t.category] || 0) + convertAmount(Number(t.amount_thb), sc, displayCurrency, settings);
        });
        const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

        return { thisWeekTotal, avgPerDay, change, daysLogged, lastWeekTotal, topCat, weekStart, weekEnd };
    }, [dailyLogs, transactions, settings, displayCurrency]);

    if (!digest) return null;

    const fmt = (v: number) => formatCurrency(Math.round(v), displayCurrency);

    return (
        <Card className="shadow-md border-border/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" /> This Week
                    <span className="text-[10px] font-normal text-muted-foreground ml-auto">
                        {format(digest.weekStart, 'd MMM')} – {format(digest.weekEnd, 'd MMM')}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="text-xl font-bold text-foreground">{fmt(digest.thisWeekTotal)}</div>
                        <div className="text-[10px] text-muted-foreground">total spent</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-foreground">{fmt(digest.avgPerDay)}</div>
                        <div className="text-[10px] text-muted-foreground">avg/day ({digest.daysLogged} days)</div>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">vs last week</span>
                        <span className={`font-medium ${digest.change > 0 ? 'text-destructive' : digest.change < 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                            {digest.lastWeekTotal === 0 ? '—' : `${digest.change > 0 ? '+' : ''}${Math.round(digest.change)}%`}
                        </span>
                    </div>
                    {digest.topCat && (
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Top category</span>
                            <span className="font-medium text-foreground">{digest.topCat[0]} ({fmt(digest.topCat[1])})</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
