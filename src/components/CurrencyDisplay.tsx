import { formatCurrency, formatSGD, toSGD, convertAmount, getFxRateForCountry, ALL_COUNTRIES, getCurrencyForCountry } from '@/lib/budget-utils';
import type { Settings } from '@/lib/budget-utils';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amountTHB: number;
  fxRate: number;
  currency?: string;
  /** The currency the amount is actually stored in. If provided with settings, converts to display currency. */
  storedCurrency?: string;
  settings?: Settings | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CurrencyDisplay({ amountTHB, fxRate, currency = 'THB', storedCurrency, settings, size = 'md', className }: CurrencyDisplayProps) {
  // If storedCurrency + settings provided, convert from stored → display currency
  let displayAmount = amountTHB;
  if (storedCurrency && settings && storedCurrency !== currency) {
    displayAmount = convertAmount(amountTHB, storedCurrency, currency, settings);
  }

  const isNegative = displayAmount < 0;
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-bold',
  };

  const isSGD = currency === 'SGD';

  // For SGD subtitle, convert display amount to SGD
  const sgdAmount = settings && currency !== 'SGD'
    ? convertAmount(displayAmount, currency, 'SGD', settings)
    : displayAmount / fxRate;

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn(sizeClasses[size], isNegative ? 'text-destructive' : 'text-foreground')}>
        {formatCurrency(displayAmount, currency)}
      </span>
      {!isSGD && (
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {formatSGD(sgdAmount)}
        </span>
      )}
    </span>
  );
}
