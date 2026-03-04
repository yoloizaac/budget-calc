import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { getDailyTotal, formatCurrency, getCurrencyForCountry, convertAmount, type DailyLog, type Settings } from '@/lib/budget-utils';

interface Props {
    dailyLogs: DailyLog[];
    settings: Settings | undefined;
    displayCurrency: string;
    dailyBudgetTarget: number;
}

export function BudgetGoals({ dailyLogs, settings, displayCurrency, dailyBudgetTarget }: Props) {
    const { streak, maxStreak, todayUnder } = useMemo(() => {
        if (!settings || dailyLogs.length === 0) return { streak: 0, maxStreak: 0, todayUnder: true };

        // Build a map of date → converted daily total
        const dateMap = new Map<string, number>();
        dailyLogs.forEach(d => {
            const stored = getCurrencyForCountry(d.country || 'Thailand');
            const total = convertAmount(getDailyTotal(d), stored, displayCurrency, settings);
            dateMap.set(d.date, total);
        });

        // Calculate current streak (consecutive days under budget, going backwards from today)
        let currentStreak = 0;
        let maxFound = 0;
        let tempStreak = 0;
        const today = new Date();

        for (let i = 0; i < 90; i++) {
            const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
            const total = dateMap.get(dateStr);
            if (total === undefined) {
                // No log for this day — don't break streak but don't count it
                if (i === 0) continue;
                break;
            }
            if (total <= dailyBudgetTarget) {
                currentStreak++;
                tempStreak++;
                maxFound = Math.max(maxFound, tempStreak);
            } else {
                break;
            }
        }

        // Also compute all-time max streak
        const sortedDates = [...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        let allTimeMax = 0;
        let runningStreak = 0;
        sortedDates.forEach(([, total]) => {
            if (total <= dailyBudgetTarget) {
                runningStreak++;
                allTimeMax = Math.max(allTimeMax, runningStreak);
            } else {
                runningStreak = 0;
            }
        });

        const todayStr = format(today, 'yyyy-MM-dd');
        const todayTotal = dateMap.get(todayStr) ?? 0;

        return {
            streak: currentStreak,
            maxStreak: allTimeMax,
            todayUnder: todayTotal <= dailyBudgetTarget,
        };
    }, [dailyLogs, settings, displayCurrency, dailyBudgetTarget]);

    const streakEmoji = streak >= 7 ? '🔥🔥🔥' : streak >= 3 ? '🔥🔥' : streak >= 1 ? '🔥' : '❄️';

    return (
        <Card className="shadow-md border-border/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Budget Goals
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground">{streak}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">day streak</div>
                    </div>
                    <div className="text-3xl">{streakEmoji}</div>
                    <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Daily target</span>
                            <span className="font-medium text-foreground">{formatCurrency(dailyBudgetTarget, displayCurrency)}/day</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Best streak</span>
                            <span className="font-medium text-foreground flex items-center gap-1">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {maxStreak} days
                            </span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Today</span>
                            <span className={`font-medium ${todayUnder ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                                {todayUnder ? '✅ Under budget' : '⚠️ Over budget'}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
