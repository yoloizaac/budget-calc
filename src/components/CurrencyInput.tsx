import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCurrencyForCountry, CURRENCY_INFO } from '@/lib/budget-utils';

interface CurrencyInputProps {
  value: string;
  onChange: (val: string) => void;
  fxRate: number;
  country?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md';
}

/**
 * Amount input with local-currency/SGD toggle.
 * When country is Singapore, no toggle is shown (already SGD).
 */
export function CurrencyInput({
  value, onChange, fxRate, country = 'Thailand', placeholder, className, inputClassName, size = 'md',
}: CurrencyInputProps) {
  const localCurrency = getCurrencyForCountry(country);
  const localInfo = CURRENCY_INFO[localCurrency] || { symbol: '?', label: localCurrency };
  const isSG = country === 'Singapore';
  const [showSGD, setShowSGD] = useState(false);

  const toggle = () => {
    if (isSG) return;
    const raw = parseFloat(value) || 0;
    if (!showSGD) {
      // local → SGD
      setShowSGD(true);
      onChange(raw ? (raw / fxRate).toFixed(2) : '');
    } else {
      // SGD → local
      setShowSGD(false);
      onChange(raw ? (raw * fxRate).toFixed(0) : '');
    }
  };

  const currentSymbol = isSG || showSGD ? 'S$' : localInfo.symbol;
  const currentCode = isSG || showSGD ? 'SGD' : localCurrency;
  const heightClass = size === 'sm' ? 'h-9' : 'h-12';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          placeholder={placeholder || `Amount (${currentCode}) *`}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn('bg-accent/30 text-lg flex-1', heightClass, inputClassName)}
        />
        {!isSG && (
          <Button
            type="button"
            variant="outline"
            className={cn('min-w-[72px] font-semibold text-sm', heightClass)}
            onClick={toggle}
          >
            {currentSymbol} {currentCode}
          </Button>
        )}
      </div>
      {value && !isSG && (
        <div className="text-xs text-muted-foreground px-1">
          {showSGD
            ? `≈ ${localInfo.symbol}${((parseFloat(value) || 0) * fxRate).toFixed(0)}`
            : `≈ S$${((parseFloat(value) || 0) / fxRate).toFixed(2)}`
          }
        </div>
      )}
    </div>
  );
}

/** Convert the displayed value to the local currency amount */
export function toLocalFromInput(value: string, showSGD: boolean, fxRate: number): number {
  const raw = parseFloat(value) || 0;
  return showSGD ? raw * fxRate : raw;
}

/**
 * Hook version: manages value + currency state together and exposes amountLocal (in the country's currency).
 */
export function useCurrencyInput(fxRate: number, country: string = 'Thailand', initialLocal?: string) {
  const [value, setValue] = useState(initialLocal || '');
  const localCurrency = getCurrencyForCountry(country);
  const localInfo = CURRENCY_INFO[localCurrency] || { symbol: '?', label: localCurrency };
  const isSG = country === 'Singapore';
  const [showSGD, setShowSGD] = useState(false);

  const toggle = () => {
    if (isSG) return;
    const raw = parseFloat(value) || 0;
    if (!showSGD) {
      setShowSGD(true);
      setValue(raw ? (raw / fxRate).toFixed(2) : '');
    } else {
      setShowSGD(false);
      setValue(raw ? (raw * fxRate).toFixed(0) : '');
    }
  };

  // Amount in local currency (what gets saved to DB)
  const amountLocal = isSG
    ? (parseFloat(value) || 0)
    : showSGD
      ? (parseFloat(value) || 0) * fxRate
      : (parseFloat(value) || 0);

  // For backward compat alias
  const amountTHB = amountLocal;

  const reset = (localValue?: string) => {
    setValue(localValue || '');
    setShowSGD(false);
  };

  const currentSymbol = isSG || showSGD ? 'S$' : localInfo.symbol;
  const currentCode = isSG || showSGD ? 'SGD' : localCurrency;

  const preview = value && !isSG
    ? showSGD
      ? `≈ ${localInfo.symbol}${((parseFloat(value) || 0) * fxRate).toFixed(0)}`
      : `≈ S$${((parseFloat(value) || 0) / fxRate).toFixed(2)}`
    : '';

  return { value, setValue, showSGD, toggle, amountLocal, amountTHB, reset, preview, currentSymbol, currentCode, isSG };
}
