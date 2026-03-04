import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getCurrencyForCountry, CURRENCY_INFO } from '@/lib/budget-utils';

interface ExpenseFieldCardProps {
  emoji: string;
  label: string;
  budgetHint: number;
  value: string;
  savedValue: number | null;
  onChange: (val: string) => void;
  onQuickSave: (val: number) => void;
  isSaving: boolean;
  fxRate: number;
  country?: string;
}

export function ExpenseFieldCard({
  emoji, label, budgetHint, value, savedValue, onChange, onQuickSave, isSaving, fxRate, country = 'Thailand',
}: ExpenseFieldCardProps) {
  const [showSGD, setShowSGD] = useState(false);
  const localCurrency = getCurrencyForCountry(country);
  const localInfo = CURRENCY_INFO[localCurrency] || { symbol: '?', label: localCurrency };
  const isSG = country === 'Singapore';

  const numVal = parseFloat(value || '0') || 0;
  const amountLocal = isSG ? numVal : showSGD ? numVal * fxRate : numVal;
  const isSaved = savedValue !== null && amountLocal === savedValue && value !== '';
  const isDirty = value !== '' && amountLocal !== (savedValue ?? 0);

  const toggleCurrency = () => {
    if (isSG) return;
    const raw = parseFloat(value) || 0;
    if (!showSGD) {
      setShowSGD(true);
      onChange(raw ? (raw / fxRate).toFixed(2) : '');
    } else {
      setShowSGD(false);
      onChange(raw ? (raw * fxRate).toFixed(0) : '');
    }
  };

  const currentSymbol = isSG || showSGD ? 'S$' : localInfo.symbol;

  return (
    <div className={cn(
      "rounded-xl border p-3 transition-all duration-200 space-y-1.5",
      isSaved ? "border-success bg-success/20" : "border-border bg-card",
      isDirty && !isSaved && "border-warning/50"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <span className="text-base">{emoji}</span> {label}
        </span>
        <div className="flex items-center gap-1">
          {!isSG && (
            <button
              onClick={toggleCurrency}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors"
            >
              {currentSymbol}
            </button>
          )}
          <button
            onClick={() => onQuickSave(amountLocal)}
            disabled={isSaving || !isDirty}
            className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center transition-colors",
              isSaved
                ? "bg-success text-success-foreground"
                : isDirty
                  ? "bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <Input
        type="number"
        inputMode="decimal"
        placeholder={
          isSG || showSGD
            ? `~S$${(budgetHint / fxRate).toFixed(1)}`
            : `~${localInfo.symbol}${budgetHint}`
        }
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-accent/30 h-11 text-lg font-medium border-0"
      />
      <div className="text-[10px] text-muted-foreground">
        {isSG || showSGD
          ? `Budget: S$${(budgetHint / fxRate).toFixed(1)}/day`
          : `Budget: ${localInfo.symbol}${budgetHint}/day`
        }
        {value && !isSG && (
          <span className="ml-1.5">
            • {showSGD
              ? `≈ ${localInfo.symbol}${(numVal * fxRate).toFixed(0)}`
              : `≈ S$${(numVal / fxRate).toFixed(2)}`
            }
          </span>
        )}
      </div>
    </div>
  );
}
