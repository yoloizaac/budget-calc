import { format, parseISO } from 'date-fns';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { CountryFlag } from '@/components/CountryFlag';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getDailyTotal, formatCurrency, getCurrencyForCountry, getFxRateForCountry } from '@/lib/budget-utils';
import type { DailyLog, Settings } from '@/lib/budget-utils';
import { useDailyLogPhotos } from '@/hooks/useDailyLog';
import { SignedImage } from '@/components/daily-log/SignedImage';
import { cn } from '@/lib/utils';

const BREAKDOWN = [
  { key: 'lunch_thb', label: 'Lunch', emoji: '🍜' },
  { key: 'dinner_thb', label: 'Dinner', emoji: '🍽' },
  { key: 'other_food_thb', label: 'Other Food', emoji: '🧃' },
  { key: 'transport_thb', label: 'Transport', emoji: '🚇' },
  { key: 'misc_thb', label: 'Misc', emoji: '🛍' },
] as const;

interface HistoryEntryProps {
  log: DailyLog;
  fxRate: number;
  currency?: string;
  settings?: Settings | null;
  onSelect: () => void;
  onDelete: (id: string) => void;
}

export function HistoryEntry({ log, fxRate, currency, settings, onSelect, onDelete }: HistoryEntryProps) {
  const cur = currency || getCurrencyForCountry(log.country);
  const storedCur = getCurrencyForCountry(log.country);
  const { data: photos = [] } = useDailyLogPhotos(log.id);

  return (
    <Collapsible>
      <div className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors">
        <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left cursor-pointer group">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          <CountryFlag country={log.country} />
          <span className="text-sm font-medium">{format(parseISO(log.date), 'EEE d MMM')}</span>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <CurrencyDisplay amountTHB={getDailyTotal(log)} fxRate={fxRate} currency={cur} storedCurrency={storedCur} settings={settings} size="sm" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete entry?</AlertDialogTitle>
                <AlertDialogDescription>Delete log for {format(parseISO(log.date), 'd MMM yyyy')}?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(log.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <CollapsibleContent>
        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {BREAKDOWN.map(b => {
              const val = (log as any)[b.key] || 0;
              return val > 0 ? (
                <div key={b.key} className="flex items-center justify-between bg-muted/50 rounded-md px-2 py-1">
                  <span>{b.emoji} {b.label}</span>
                  <span className="font-medium">{formatCurrency(val, cur)}</span>
                </div>
              ) : null;
            })}
          </div>
          {log.notes && (
            <p className="text-xs text-muted-foreground italic">"{log.notes}"</p>
          )}
          {photos.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {photos.map(p => (
                <SignedImage
                  key={p.id}
                  storagePath={p.storage_path}
                  alt={p.caption || 'Photo'}
                  className="h-12 w-12 rounded-md object-cover flex-shrink-0 border border-border"
                />
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onSelect} className="text-xs h-7 text-primary">
            Edit this day →
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
